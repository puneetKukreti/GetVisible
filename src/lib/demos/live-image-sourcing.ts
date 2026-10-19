/**
 * Live Industry Image Sourcing
 *
 * When a profession has no curated photo pool (image-engine / industry-images),
 * the demo would otherwise get generic office imagery. This module searches the
 * web for real photos of that industry (Openverse — CC-licensed photo index,
 * no API key), downloads the bytes, self-hosts them via MediaRepository and
 * returns stable local `/api/media/<id>` URLs for the template placeholders.
 *
 * Guarantees:
 * - Never throws: callers fall back to the curated/default imagery on failure.
 * - One search per distinct keyword (24h memory cache + negative cache).
 * - An origin photo is downloaded at most once, ever: hosted assets are looked
 *   up by source URL before downloading (works across serverless instances).
 * - Purposes get distinct photos (HERO/ABOUT take one each, GALLERY the rest).
 */

import { MediaRepository } from '@/lib/db/repository';

export type ImagePurpose = 'HERO' | 'ABOUT' | 'SERVICE' | 'GALLERY';

export interface SourcedImage {
  purpose: ImagePurpose;
  /** Self-hosted URL: /api/media/<id> */
  url: string;
  attribution: string | null;
}

export interface SourceIndustryImagesOptions {
  /** Search phrase for each purpose (e.g. "car detailing workshop"). */
  keywords: Partial<Record<ImagePurpose, string>>;
  /** How many successfully hosted images to return in total (default 6). */
  maxImages?: number;
  /** Injectable for tests. */
  fetcher?: typeof fetch;
}

interface OpenverseResult {
  id?: string;
  url?: string;
  width?: number;
  height?: number;
  creator?: string;
  license_version?: string;
  source?: string;
}

const OPENVERSE_API = 'https://api.openverse.org/v1/images/';
const SEARCH_TTL_MS = 24 * 60 * 60 * 1000;
const NEGATIVE_TTL_MS = 10 * 60 * 1000;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MIN_IMAGE_BYTES = 20_000;

/** Slots that get exactly one dedicated photo before GALLERY takes the rest. */
const SINGLE_SLOT_QUOTA: Partial<Record<ImagePurpose, number>> = {
  HERO: 1,
  ABOUT: 1,
  SERVICE: 1,
};
const PURPOSE_ORDER: ImagePurpose[] = ['HERO', 'ABOUT', 'SERVICE', 'GALLERY'];

/** keyword → candidate list, cached to respect Openverse rate limits. */
const searchCache = new Map<string, { at: number; candidates: OpenverseResult[] }>();
/** origin image URL → already-hosted asset (in-process fast path). */
const hostCache = new Map<string, SourcedImage>();
/** origin image URLs already attempted (failed downloads are not retried). */
const attemptedUrls = new Set<string>();

function normalizeKeyword(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function isLikelyPhoto(result: OpenverseResult): boolean {
  if (!result.url) return false;
  if (result.width && result.width < 900) return false;
  const lower = result.url.toLowerCase();
  if (/(\.svg|\.gif|\.pdf)(\?|$)/.test(lower)) return false;
  if (/logo|icon|favicon|sprite|placeholder|avatar/.test(lower)) return false;
  return true;
}

/**
 * Finds and self-hosts industry photos for the given keyword slots. Missing
 * purposes simply stay absent: the caller keeps its curated/default imagery.
 */
export async function sourceIndustryImages(
  options: SourceIndustryImagesOptions
): Promise<SourcedImage[]> {
  const { keywords, maxImages = 6, fetcher = fetch } = options;

  const wanted = PURPOSE_ORDER.map(
    (purpose) => [purpose, keywords[purpose]] as [ImagePurpose, string | undefined]
  ).filter(([, value]) => value && normalizeKeyword(value).length >= 3) as [
    ImagePurpose,
    string
  ][];

  if (wanted.length === 0) return [];

  // One photo per single-slot purpose; the last purpose (usually GALLERY) takes
  // whatever budget remains so different slots never reuse the same photo.
  const reserved = wanted.filter(([purpose]) => SINGLE_SLOT_QUOTA[purpose]).length;
  const quotaFor = (purpose: ImagePurpose): number => {
    if (wanted.length === 1) return maxImages;
    const fixed = SINGLE_SLOT_QUOTA[purpose];
    if (fixed) return Math.min(fixed, maxImages);
    return Math.max(1, maxImages - reserved);
  };

  const results: SourcedImage[] = [];
  const usedUrls = new Set<string>();

  for (const [purpose, rawKeyword] of wanted) {
    const quota = quotaFor(purpose);
    if (quota <= 0 || results.length >= maxImages) break;

    const keyword = normalizeKeyword(rawKeyword);
    const cached = searchCache.get(keyword);
    const isFresh =
      cached &&
      Date.now() - cached.at < (cached.candidates.length ? SEARCH_TTL_MS : NEGATIVE_TTL_MS);
    const candidates = isFresh
      ? cached!.candidates
      : await fetchCandidates(keyword, fetcher);

    if (!isFresh) searchCache.set(keyword, { at: Date.now(), candidates });

    let taken = 0;
    for (const candidate of candidates) {
      if (taken >= quota || results.length >= maxImages) break;
      if (!candidate.url || usedUrls.has(candidate.url)) continue;
      const hosted = await hostImage(candidate, fetcher);
      if (!hosted) continue;
      usedUrls.add(candidate.url);
      results.push({ ...hosted, purpose });
      taken += 1;
    }
  }

  return results;
}

/** Tests may clear the caches between scenarios. */
export function clearImageSourceCaches(): void {
  searchCache.clear();
  hostCache.clear();
  attemptedUrls.clear();
}

async function fetchCandidates(
  keyword: string,
  fetcher: typeof fetch
): Promise<OpenverseResult[]> {
  try {
    // Openverse matches poorly on long phrases: refine in steps until the
    // query yields results (full phrase → 3 words → 2 words → 1 key word).
    const words = keyword.split(' ').filter(Boolean);
    const attempts: string[] = [words.join(' ')];
    if (words.length > 3) attempts.push(words.slice(0, 3).join(' '));
    if (words.length !== 2) attempts.push(words.slice(0, 2).join(' '));
    if (words.length > 1) attempts.push(words.slice(0, 1).join(' '));

    for (const attempt of attempts) {
      if (!attempt) continue;
      const candidates = await queryOpenverse(attempt, fetcher);
      if (candidates.length > 0) return candidates;
    }
    return [];
  } catch {
    return [];
  }
}

async function queryOpenverse(q: string, fetcher: typeof fetch): Promise<OpenverseResult[]> {
  const url =
    `${OPENVERSE_API}?q=${encodeURIComponent(q)}` +
    `&page_size=12&filter_dead=false&license_type=all-cc`;

  const searchRes = await fetcher(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'GetVisibleDemoBuilder/1.0' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!searchRes.ok) return [];

  const payload = (await searchRes.json()) as { results?: OpenverseResult[] };
  return (payload.results || [])
    .filter(isLikelyPhoto)
    .sort((a, b) => (b.width || 0) - (a.width || 0));
}

/** Reuses an already-hosted asset when possible, otherwise downloads + stores. */
async function hostImage(
  candidate: OpenverseResult,
  fetcher: typeof fetch
): Promise<SourcedImage | null> {
  const originUrl = candidate.url;
  if (!originUrl) return null;

  if (hostCache.has(originUrl)) return hostCache.get(originUrl) as SourcedImage;
  if (attemptedUrls.has(originUrl)) return null;

  // Cross-instance/restart dedupe: never store the same photo twice.
  try {
    const existing = await MediaRepository.findDemoMediaBySourceUrl(originUrl);
    if (existing) {
      const reused: SourcedImage = {
        purpose: 'GALLERY',
        url: `/api/media/${existing.id}`,
        attribution: existing.attribution ?? null,
      };
      hostCache.set(originUrl, reused);
      return reused;
    }
  } catch {
    // Lookup failures must not block a fresh download.
  }

  attemptedUrls.add(originUrl);
  const downloaded = await downloadAndPersist(candidate, fetcher);
  if (downloaded) hostCache.set(originUrl, downloaded);
  return downloaded;
}

async function downloadAndPersist(
  candidate: OpenverseResult,
  fetcher: typeof fetch
): Promise<SourcedImage | null> {
  try {
    const res = await fetcher(candidate.url as string, {
      headers: { 'User-Agent': 'GetVisibleDemoBuilder/1.0 (+industry demo imagery)' },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;

    const mime = (res.headers.get('content-type') || '').split(';')[0].trim();
    if (!mime.startsWith('image/') || /svg|gif/i.test(mime)) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < MIN_IMAGE_BYTES || buffer.byteLength > MAX_IMAGE_BYTES) return null;

    const attributionParts: string[] = [];
    if (candidate.creator) attributionParts.push(String(candidate.creator));
    if (candidate.source) attributionParts.push(String(candidate.source));
    if (candidate.license_version) {
      const version = String(candidate.license_version);
      attributionParts.push(version.startsWith('CC') ? version : `CC ${version}`);
    }
    const attribution = attributionParts.join(' • ') || null;

    const saved = await MediaRepository.saveDemoMediaAsset({
      mime,
      data: buffer,
      sourceUrl: candidate.url || null,
      attribution,
      purpose: 'INDUSTRY',
    });

    return { purpose: 'GALLERY', url: `/api/media/${saved.id}`, attribution };
  } catch {
    return null;
  }
}

/**
 * Builds the natural search phrase for a purpose from the profession context.
 * `extraBrief` carries the AI visual brief (imageQuery) or the profession
 * registry keyword. Brand words are deliberately dropped — they are noise for
 * stock-photo searches, and Openverse refines overlong queries itself.
 */
export function buildIndustrySearchKeyword(
  profession: string | undefined,
  extraBrief?: string
): string {
  // Openverse indexes photos by simple trade nouns; generic filler words only
  // narrow the index toward zero results. Industry nouns come first (they are
  // the most stable trade identity), the AI brief supplies extra specificity.
  const STOPWORDS = new Set([
    'and', 'the', 'for', 'with', 'our', 'your', 'all', 'services', 'service',
    'center', 'centre', 'shop', 'store', 'company', 'agency', 'business',
    'online', 'best', 'top', 'ltd', 'pvt', 'co', 'llp', 'inc', 'near', 'me',
  ]);
  const words = `${profession || ''} ${extraBrief || ''}`
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  // De-duplicate while keeping order.
  const seen = new Set<string>();
  const unique = words.filter((w) => (seen.has(w) ? false : (seen.add(w), true)));
  return unique.slice(0, 6).join(' ');
}
