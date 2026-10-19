import { describe, it, expect, beforeEach } from 'vitest';
import {
  sourceIndustryImages,
  buildIndustrySearchKeyword,
  clearImageSourceCaches,
  SourcedImage,
} from '@/lib/demos/live-image-sourcing';
import { MediaRepository } from '@/lib/db/repository';
import { GET as mediaGet } from '@/app/api/media/[id]/route';
import { NextRequest } from 'next/server';

/** Fake fetch with scenario routing: Openverse search + origin download. */
function makeFetch(map: Record<string, { status?: number; body: unknown; mime?: string }>) {
  let searchCalls = 0;
  const fetcher: typeof fetch = async (input: any) => {
    const url = String(input);
    for (const key of Object.keys(map)) {
      if (url.includes(key)) {
        searchCalls += 1;
        const cfg = map[key];
        const body =
          cfg.body instanceof Buffer ? cfg.body : JSON.stringify(cfg.body);
        return {
          ok: (cfg.status ?? 200) >= 200 && (cfg.status ?? 200) < 400,
          status: cfg.status ?? 200,
          headers: new Headers({ 'content-type': cfg.mime || 'application/json' }),
          arrayBuffer: async () => (body as Buffer).buffer.slice(0, (body as Buffer).byteLength),
          json: async () => (typeof body === 'string' ? JSON.parse(body) : cfg.body),
          text: async () => String(body),
        } as unknown as Response;
      }
    }
    throw new Error(`fetch ${url} not mocked`);
  };
  return { fetcher, calls: () => searchCalls };
}

function openversePayload(results: unknown[]) {
  return { results };
}

describe('Live industry image sourcing', () => {
  beforeEach(() => {
    clearImageSourceCaches();
  });

  it('builds concise trade-noun search phrases (no filler, no brand noise)', () => {
    const kw = buildIndustrySearchKeyword(
      'Car Detailing & Automobile Workshop',
      'luxury car gleaming glossy ceramic coating studio workshop'
    );
    expect(kw).not.toContain('&');
    expect(kw.split(' ')).toContain('car');
    expect(kw.split(' ')).toContain('detailing');
    expect(kw.startsWith('car')).toBe(true);
    // cap keeps Openverse queries short
    expect(kw.split(' ').length).toBeLessThanOrEqual(6);
  });

  it('searches Openverse, downloads real broad photos and self-hosts them', async () => {
    const bigJpg = Buffer.alloc(50_000, 8); // 50 KB fake JPEG (min 20 KB enforced)
    const { fetcher, calls } = makeFetch({
      'api.openverse.org': {
        body: openversePayload([
          { url: 'https://pics.source.example/car-one.jpg', width: 1024, height: 768, creator: 'A Photographer', source: 'flickr', license_version: 'CC BY' },
          { url: 'https://pics.source.example/logo.svg', width: 2000 }, // skipped: svg
          { url: 'https://pics.source.example/tiny.jpg', width: 300 }, // skipped: too small
          { url: 'https://pics.source.example/car-two.jpg', width: 1600, height: 900, creator: 'B Creator', license_version: 'CC0' },
        ]),
      },
      'pics.source.example': { body: bigJpg, mime: 'image/jpeg' },
    });

    const images: SourcedImage[] = await sourceIndustryImages({
      keywords: { HERO: 'car detailing' },
      maxImages: 4,
      fetcher,
    });

    expect(calls()).toBeGreaterThanOrEqual(2);
    expect(images).toHaveLength(2);
    expect(images[0].url).toMatch(/^\/api\/media\/media-/);
    expect(images[1].url).toMatch(/^\/api\/media\/media-/);
    expect(images[0].attribution).toContain('Creator');
    expect(images[1].attribution).toContain('Photographer');
    // Highest width first
    expect(images[0].url).toBe('/api/media/' + (images[0].url.split('/').pop() as string));
    // Bytes actually persisted and publicly servable
    const id = images[0].url.split('/').pop() as string;
    const asset = await MediaRepository.getDemoMediaAsset(id);
    expect(asset).not.toBeNull();
    expect(asset!.mime).toBe('image/jpeg');

    // Public route serves the same bytes with immutable caching
    const req = new NextRequest(`http://localhost:3000/api/media/${id}`);
    const res = await mediaGet(req, { params: { id } });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('immutable');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.length).toBe(50_000);

    // Unknown id -> 404
    const res404 = await mediaGet(
      new NextRequest('http://localhost:3000/api/media/media-missing'),
      { params: { id: 'media-missing' } }
    );
    expect(res404.status).toBe(404);
  });

  it('refines overlong phrases until Openverse yields results', async () => {
    const bigJpg = Buffer.alloc(30_000, 5);
    const { fetcher } = makeFetch({
      'api.openverse.org/v1/images/?q=luxury%20car%20gleaming%20glossy': { body: openversePayload([]), status: 200 },
      'api.openverse.org/v1/images/?q=luxury%20car%20gleaming': { body: openversePayload([]), status: 200 },
      'api.openverse.org/v1/images/?q=luxury%20car': {
        body: openversePayload([
          { url: 'https://pics.source.example/polish-wide.jpg', width: 1400, height: 900 },
        ]),
      },
      'pics.source.example': { body: bigJpg, mime: 'image/jpeg' },
    });

    const images = await sourceIndustryImages({
      keywords: { HERO: 'luxury car gleaming glossy ceramic coating' },
      fetcher,
    });
    expect(images).toHaveLength(1);
    expect(images[0].url).toMatch(/^\/api\/media\//);
  });

  it('negative-caches failed searches so outages do not hammer the API', async () => {
    let attempts = 0;
    const fetcher: typeof fetch = (async () => {
      attempts += 1;
      return { ok: true, status: 200, json: async () => ({ results: [] }) } as unknown as Response;
    }) as typeof fetch;

    const first = await sourceIndustryImages({ keywords: { HERO: 'unobtainium trade' }, fetcher });
    expect(first).toHaveLength(0);
    const afterFirst = attempts;
    const second = await sourceIndustryImages({ keywords: { HERO: 'unobtainium trade' }, fetcher });
    expect(second).toHaveLength(0);
    expect(attempts).toBe(afterFirst); // no new API calls on the cached miss
  });

  it('each origin photo is downloaded at most once per host instance', async () => {
    const bigJpg = Buffer.alloc(40_000, 1);
    const { fetcher, calls } = makeFetch({
      'api.openverse.org/v1/images/?q=dental%20tech': {
        body: openversePayload([
          { url: 'https://pics.source.example/dup.jpg', width: 1200, height: 800 },
        ]),
      },
      'api.openverse.org/v1/images/?q=dental%20lab': {
        body: openversePayload([
          { url: 'https://pics.source.example/dup.jpg', width: 1200, height: 800 },
        ]),
      },
      'pics.source.example': { body: bigJpg, mime: 'image/jpeg' },
    });

    const first = await sourceIndustryImages({ keywords: { HERO: 'dental tech' }, fetcher });
    expect(first).toHaveLength(1);
    // Second keyword returns the SAME already-hosted asset without re-download.
    const second = await sourceIndustryImages({ keywords: { HERO: 'dental lab' }, fetcher });
    expect(second).toHaveLength(1);
    expect(second[0].url).toBe(first[0].url);
  });

  it('reuses a stored photo across fresh instances (no re-download, no duplicate rows)', async () => {
    const bigJpg = Buffer.alloc(45_000, 3);
    const originUrl = 'https://pics.source.example/persisted.jpg';

    // First process: search + download + store.
    const first = makeFetch({
      'api.openverse.org/v1/images/?q=car%20detailing': {
        body: openversePayload([{ url: originUrl, width: 1300, height: 900, creator: 'Someone' }]),
      },
      'pics.source.example': { body: bigJpg, mime: 'image/jpeg' },
    });
    const run1 = await sourceIndustryImages({
      keywords: { HERO: 'car detailing' },
      fetcher: first.fetcher,
    });
    expect(run1).toHaveLength(1);

    // Second process: caches are cold (new serverless instance) — the store
    // lookup must reuse the existing asset instead of downloading again.
    clearImageSourceCaches();
    const second = makeFetch({
      'api.openverse.org/v1/images/?q=car%20detailing': {
        body: openversePayload([{ url: originUrl, width: 1300, height: 900, creator: 'Someone' }]),
      },
      'pics.source.example': { body: bigJpg, mime: 'image/jpeg' },
    });
    const run2 = await sourceIndustryImages({
      keywords: { HERO: 'car detailing' },
      fetcher: second.fetcher,
    });
    expect(run2).toHaveLength(1);
    expect(run2[0].url).toBe(run1[0].url);

    // Saving the same source URL again must not create a second row.
    const again = await MediaRepository.saveDemoMediaAsset({
      mime: 'image/jpeg',
      data: bigJpg,
      sourceUrl: originUrl,
      attribution: 'Someone',
      purpose: 'INDUSTRY',
    });
    expect(again.id).toBe(run1[0].url.split('/').pop());
  });

  it('gives each placeholder a distinct photo (hero 1, about 1, gallery takes the rest)', async () => {
    const bigJpg = Buffer.alloc(35_000, 7);
    const candidates = Array.from({ length: 8 }, (_, i) => ({
      url: `https://pics.source.example/spread-${i}.jpg`,
      width: 1500 - i,
      height: 1000,
    }));
    const { fetcher } = makeFetch({
      'api.openverse.org/v1/images/?q=car%20detailing%20automobile': {
        body: openversePayload(candidates),
      },
      'api.openverse.org/v1/images/?q=car%20detailing': {
        body: openversePayload(candidates),
      },
      'pics.source.example': { body: bigJpg, mime: 'image/jpeg' },
    });

    const images = await sourceIndustryImages({
      keywords: { HERO: 'car detailing automobile', ABOUT: 'car detailing automobile', GALLERY: 'car detailing' },
      maxImages: 5,
      fetcher,
    });

    expect(images).toHaveLength(5);
    expect(images.filter((i) => i.purpose === 'HERO')).toHaveLength(1);
    expect(images.filter((i) => i.purpose === 'ABOUT')).toHaveLength(1);
    expect(images.filter((i) => i.purpose === 'GALLERY')).toHaveLength(3);
    // No duplicate photos across the placeholders.
    expect(new Set(images.map((i) => i.url)).size).toBe(5);
  });

  it('stays silent when Openverse fails completely (fallback to curated art)', async () => {
    const failing: typeof fetch = (async () => {
      throw new Error('network down');
    }) as typeof fetch;
    await clearImageSourceCaches();
    const images = await sourceIndustryImages({ keywords: { HERO: 'anything' }, fetcher: failing });
    expect(images).toHaveLength(0);
  });
});
