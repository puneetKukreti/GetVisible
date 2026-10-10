import {
  ILeadSourceProvider,
  DiscoverySearchInput,
  DiscoveredBusinessRecord,
} from './types';
import { ProviderStatus, ProviderExecutionResult } from '@/lib/providers/provider-result';
import { VERIFIED_INDIAN_PROFESSIONALS } from './verified-directory';
import { globalRateLimiter } from '../rate-limiter';

const AGGREGATOR_DOMAINS = [
  'justdial.com',
  'sulekha.com',
  'practo.com',
  'indiamart.com',
  'tradeindia.com',
  'urbancompany.com',
  'lybrate.com',
  'quikr.com',
  'magicbricks.com',
  '99acres.com',
  'housing.com',
  'lawzana.com',
  'legalserviceindia.com',
  'pathlegal.in',
  '365doctor.in',
  'mydentalplatform.com',
  'datagemba.com',
  'yellowpages.in',
  'facebook.com',
  'linkedin.com',
  'instagram.com',
  'youtube.com',
  'twitter.com',
  'x.com',
  'wikipedia.org',
  'duckduckgo.com',
  'bing.com',
  'google.com',
];

function decodeBingTargetUrl(rawUrl: string): string {
  try {
    const urlObj = new URL(rawUrl);
    const uParam = urlObj.searchParams.get('u');
    if (!uParam) return rawUrl;
    const b64 = uParam.startsWith('a1') ? uParam.slice(2) : uParam;
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
      return decoded;
    }
  } catch {
    // ignore
  }
  return rawUrl;
}

function cleanBusinessTitle(rawTitle: string, profession: string, location: string): string {
  if (!rawTitle) return '';
  let cleaned = rawTitle
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\|.*$/g, '')
    .replace(/–.*$/g, '')
    .replace(/\s+-\s+.*$/g, '')
    .replace(/Top \d+.*$/i, '')
    .replace(/Best \d+.*$/i, '')
    .replace(/\(.*?\)/g, '')
    .trim();

  // Strip city suffix if appended at the end
  const cityRegex = new RegExp(`,?\\s*(${location}|Gurgaon|Delhi|Noida|Faridabad|Mumbai).*$`, 'i');
  cleaned = cleaned.replace(cityRegex, '').trim();

  if (!cleaned || cleaned.length < 3) {
    cleaned = rawTitle.slice(0, 45).trim();
  }
  return cleaned;
}

function extractProfessionalName(text: string): string | null {
  const doctorMatch = text.match(/\b(Dr\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (doctorMatch && !doctorMatch[1].toLowerCase().includes('clinic')) {
    return doctorMatch[1];
  }

  const caMatch = text.match(/\b(CA\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (caMatch && !caMatch[1].toLowerCase().includes('firm') && !caMatch[1].toLowerCase().includes('office')) {
    return caMatch[1];
  }

  const advMatch = text.match(/\b((?:Advocate|Adv\.?)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i);
  if (advMatch) {
    return advMatch[1];
  }

  const arMatch = text.match(/\b(Ar\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i);
  if (arMatch && !arMatch[1].toLowerCase().includes('studio')) {
    return arMatch[1];
  }

  return null;
}

export class LiveWebSearchProvider implements ILeadSourceProvider {
  id = 'live-search';
  name = 'Live Web & Directory Search Provider';
  sourceQuality = 'PUBLIC_BUSINESS_DIRECTORY' as const;
  requestsPerMinute = 60;

  isConfigured(): boolean {
    if (process.env.ENABLE_LIVE_WEB_SEARCH === 'false') {
      return false;
    }
    // If explicitly running in strict production mode with DEMO_MODE='false',
    // require an authorized search API or registry key
    if (process.env.DEMO_MODE === 'false') {
      return Boolean(
        process.env.SERPAPI_API_KEY ||
        process.env.GOOGLE_SEARCH_API_KEY ||
        process.env.TAVILY_API_KEY ||
        process.env.BRAVE_SEARCH_API_KEY ||
        process.env.PUBLIC_REGISTRY_API_KEY
      );
    }
    return true;
  }

  getStatus(): ProviderStatus {
    const configured = this.isConfigured();
    if (!configured) {
      return {
        name: this.name,
        configured: false,
        isMock: false,
        details:
          'NOT CONFIGURED. Required: SERPAPI_API_KEY, GOOGLE_SEARCH_API_KEY, or TAVILY_API_KEY in environment variables. Per system principles, GetVisible never fabricates simulated search results in production.',
      };
    }

    if (process.env.SERPAPI_API_KEY) {
      return {
        name: this.name,
        configured: true,
        isMock: false,
        details: 'Connected to SerpAPI (Google Search & Google Local live queries).',
      };
    }
    if (process.env.GOOGLE_SEARCH_API_KEY && (process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.GOOGLE_CSE_ID)) {
      return {
        name: this.name,
        configured: true,
        isMock: false,
        details: 'Connected to Google Custom Search JSON API.',
      };
    }
    if (process.env.TAVILY_API_KEY) {
      return {
        name: this.name,
        configured: true,
        isMock: false,
        details: 'Connected to Tavily AI Live Search API.',
      };
    }
    return {
      name: this.name,
      configured: true,
      isMock: false,
      details: 'Active: Multi-Engine Live Web Discovery & Verified Public Business Directory. Discovers real Indian businesses with authentic websites, physical locations, and source citations.',
    };
  }

  async searchBusinesses(
    input: DiscoverySearchInput
  ): Promise<ProviderExecutionResult<DiscoveredBusinessRecord[]>> {
    const acquired = await globalRateLimiter.acquire(this.id, this.requestsPerMinute);
    if (!acquired) {
      return {
        success: false,
        configured: true,
        isMock: false,
        error: `Rate limit of ${this.requestsPerMinute} requests per minute reached. Please retry in a few moments.`,
      };
    }

    const profession = (input.profession || 'Chartered Accountant').trim();
    const location = (input.location || 'Gurgaon').trim();
    const locality = (input.locality || '').trim();
    const limit = Math.min(Math.max(1, input.limit || 10), 50);

    const candidates: DiscoveredBusinessRecord[] = [];
    const seenNames = new Set<string>();
    const seenDomains = new Set<string>();

    // 1. Check SerpAPI if configured
    if (process.env.SERPAPI_API_KEY) {
      try {
        const serpResults = await this.searchSerpApi(profession, location, locality, limit);
        for (const item of serpResults) {
          const key = item.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!seenNames.has(key)) {
            seenNames.add(key);
            candidates.push(item);
          }
        }
      } catch (err) {
        console.warn('[LiveWebSearchProvider] SerpAPI query error:', err);
      }
    }

    // 2. Check Google Custom Search API if configured
    if (process.env.GOOGLE_SEARCH_API_KEY && (process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.GOOGLE_CSE_ID)) {
      try {
        const googleResults = await this.searchGoogleCse(profession, location, locality, limit);
        for (const item of googleResults) {
          const key = item.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!seenNames.has(key)) {
            seenNames.add(key);
            candidates.push(item);
          }
        }
      } catch (err) {
        console.warn('[LiveWebSearchProvider] Google CSE query error:', err);
      }
    }

    // 3. Check Tavily API if configured
    if (process.env.TAVILY_API_KEY) {
      try {
        const tavilyResults = await this.searchTavily(profession, location, locality, limit);
        for (const item of tavilyResults) {
          const key = item.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!seenNames.has(key)) {
            seenNames.add(key);
            candidates.push(item);
          }
        }
      } catch (err) {
        console.warn('[LiveWebSearchProvider] Tavily query error:', err);
      }
    }

    // 4. Query Live Web Search Engine (Bing/DDG parser with contact extraction)
    try {
      const liveResults = await this.searchLiveWebEngine(profession, location, locality, limit);
      for (const item of liveResults) {
        const key = item.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!seenNames.has(key)) {
          seenNames.add(key);
          candidates.push(item);
        }
      }
    } catch (err) {
      console.warn('[LiveWebSearchProvider] Live web search engine error:', err);
    }

    // 5. Match from Verified Public Directory Dataset
    // (Contains authentic ICAI, DCI, Bar Council, COA public listings)
    const normProf = profession.toLowerCase();
    const normLoc = location.toLowerCase();

    const directoryMatches = VERIFIED_INDIAN_PROFESSIONALS.filter((rec) => {
      const pMatch =
        rec.profession.toLowerCase().includes(normProf) ||
        normProf.includes(rec.profession.toLowerCase()) ||
        (normProf.includes('ca') && rec.profession.toLowerCase().includes('accountant'));

      const lMatch =
        rec.city.toLowerCase().includes(normLoc) ||
        normLoc.includes(rec.city.toLowerCase()) ||
        (normLoc.includes('delhi') && rec.city.toLowerCase().includes('delhi')) ||
        (normLoc.includes('ncr') && (rec.city.toLowerCase().includes('gurgaon') || rec.city.toLowerCase().includes('noida') || rec.city.toLowerCase().includes('delhi')));

      return pMatch && lMatch;
    });

    for (const match of directoryMatches) {
      const key = match.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seenNames.has(key)) {
        seenNames.add(key);
        candidates.push({
          ...match,
          sourceRecordId: `dir-${match.sourceRecordId}-${Date.now().toString(36)}`,
          retrievedAt: new Date().toISOString(),
        });
      }
    }

    // Filter by website preference
    let filtered = candidates;
    if (input.websitePreference === 'NO_WEBSITE') {
      filtered = filtered.filter((c) => !c.website);
    } else if (input.websitePreference === 'WEBSITE_EXISTS') {
      filtered = filtered.filter((c) => Boolean(c.website));
    }

    // Filter/prioritize by contact preference
    if (input.contactPreference === 'EMAIL_AVAILABLE') {
      const withEmail = filtered.filter((c) => Boolean(c.publicEmail));
      filtered = withEmail.length > 0 ? withEmail : filtered;
    } else if (input.contactPreference === 'PHONE_AVAILABLE') {
      const withPhone = filtered.filter((c) => Boolean(c.publicPhone));
      filtered = withPhone.length > 0 ? withPhone : filtered;
    }

    // Deduplicate domains if website is present
    const deduped: DiscoveredBusinessRecord[] = [];
    for (const c of filtered) {
      if (c.website) {
        try {
          const dom = new URL(c.website).hostname.toLowerCase().replace(/^www\./, '');
          if (seenDomains.has(dom)) continue;
          seenDomains.add(dom);
        } catch {}
      }
      deduped.push(c);
      if (deduped.length >= limit) break;
    }

    // If nothing found and providers failed
    if (deduped.length === 0) {
      return {
        success: false,
        configured: true,
        isMock: false,
        error: `No live verified leads found for '${profession}' in '${location}'. To perform automated search across arbitrary custom professions, configure SERPAPI_API_KEY, GOOGLE_SEARCH_API_KEY, or TAVILY_API_KEY in your environment, or import via CSV. In alignment with GetVisible anti-fabrication standards, fake demo records are strictly prohibited.`,
      };
    }

    return {
      success: true,
      configured: true,
      isMock: false,
      data: deduped,
    };
  }

  /**
   * Search via SerpAPI (Google Search & Google Maps local pack)
   */
  private async searchSerpApi(
    profession: string,
    location: string,
    locality: string,
    limit: number
  ): Promise<DiscoveredBusinessRecord[]> {
    const key = process.env.SERPAPI_API_KEY;
    if (!key) return [];

    const q = locality
      ? `${profession} in ${locality}, ${location}`
      : `${profession} in ${location}`;

    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&gl=in&hl=en&api_key=${key}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];

    const data = await res.json();
    const results: DiscoveredBusinessRecord[] = [];

    // Local results (Google Local Pack)
    if (Array.isArray(data.local_results)) {
      for (const item of data.local_results) {
        const cleanName = cleanBusinessTitle(item.title, profession, location);
        results.push({
          sourceRecordId: `serp-loc-${item.place_id || Date.now().toString(36)}`,
          businessName: cleanName,
          contactName: extractProfessionalName(item.title + ' ' + (item.description || '')),
          profession,
          city: location,
          address: item.address || `${location}, India`,
          website: item.website || null,
          publicEmail: null,
          publicPhone: item.phone || null,
          contactStatus: item.phone ? 'SOURCE_CONFIRMED' : 'UNAVAILABLE',
          phoneStatus: item.phone ? 'SOURCE_CONFIRMED' : 'UNAVAILABLE',
          emailStatus: 'UNAVAILABLE',
          source: 'Google Local Listings (SerpAPI)',
          sourceUrl: item.link || item.website || `https://maps.google.com/?q=${encodeURIComponent(item.title)}`,
          sourceQuality: 'PUBLIC_BUSINESS_DIRECTORY',
          isDemoData: false,
          retrievedAt: new Date().toISOString(),
          metadata: {
            rating: item.rating,
            reviews: item.reviews,
          },
        });
        if (results.length >= limit) return results;
      }
    }

    // Organic results
    if (Array.isArray(data.organic_results)) {
      for (const item of data.organic_results) {
        let isAgg = false;
        try {
          const dom = new URL(item.link).hostname;
          isAgg = AGGREGATOR_DOMAINS.some((d) => dom.includes(d));
        } catch {
          continue;
        }

        const cleanName = cleanBusinessTitle(item.title, profession, location);
        results.push({
          sourceRecordId: `serp-org-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          businessName: cleanName,
          contactName: extractProfessionalName(item.title + ' ' + (item.snippet || '')),
          profession,
          city: location,
          address: `${location}, India`,
          website: isAgg ? null : item.link,
          publicEmail: null,
          publicPhone: null,
          contactStatus: 'UNAVAILABLE',
          phoneStatus: 'UNAVAILABLE',
          emailStatus: 'UNAVAILABLE',
          source: isAgg ? 'Public Business Directory' : 'Official Business Website',
          sourceUrl: item.link,
          sourceQuality: 'PUBLIC_BUSINESS_DIRECTORY',
          isDemoData: false,
          retrievedAt: new Date().toISOString(),
        });
        if (results.length >= limit) return results;
      }
    }

    return results;
  }

  /**
   * Search via Google Custom Search JSON API
   */
  private async searchGoogleCse(
    profession: string,
    location: string,
    locality: string,
    limit: number
  ): Promise<DiscoveredBusinessRecord[]> {
    const key = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.GOOGLE_CSE_ID;
    if (!key || !cx) return [];

    const q = locality
      ? `"${profession}" "${locality}" "${location}"`
      : `"${profession}" "${location}"`;

    const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(q)}&num=10`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];

    const data = await res.json();
    const results: DiscoveredBusinessRecord[] = [];

    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        let isAgg = false;
        try {
          const dom = new URL(item.link).hostname;
          isAgg = AGGREGATOR_DOMAINS.some((d) => dom.includes(d));
        } catch {
          continue;
        }

        const cleanName = cleanBusinessTitle(item.title, profession, location);
        results.push({
          sourceRecordId: `gcse-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          businessName: cleanName,
          contactName: extractProfessionalName(item.title + ' ' + (item.snippet || '')),
          profession,
          city: location,
          address: `${location}, India`,
          website: isAgg ? null : item.link,
          publicEmail: null,
          publicPhone: null,
          contactStatus: 'UNAVAILABLE',
          phoneStatus: 'UNAVAILABLE',
          emailStatus: 'UNAVAILABLE',
          source: isAgg ? 'Public Business Directory' : 'Official Business Website',
          sourceUrl: item.link,
          sourceQuality: 'PUBLIC_BUSINESS_DIRECTORY',
          isDemoData: false,
          retrievedAt: new Date().toISOString(),
        });
        if (results.length >= limit) return results;
      }
    }

    return results;
  }

  /**
   * Search via Tavily Search API
   */
  private async searchTavily(
    profession: string,
    location: string,
    locality: string,
    limit: number
  ): Promise<DiscoveredBusinessRecord[]> {
    const key = process.env.TAVILY_API_KEY;
    if (!key) return [];

    const q = `${profession} in ${locality ? locality + ', ' : ''}${location} India`;
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        query: q,
        search_depth: 'basic',
        max_results: limit,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const results: DiscoveredBusinessRecord[] = [];

    if (Array.isArray(data.results)) {
      for (const item of data.results) {
        let isAgg = false;
        try {
          const dom = new URL(item.url).hostname;
          isAgg = AGGREGATOR_DOMAINS.some((d) => dom.includes(d));
        } catch {
          continue;
        }

        const cleanName = cleanBusinessTitle(item.title, profession, location);
        results.push({
          sourceRecordId: `tavily-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          businessName: cleanName,
          contactName: extractProfessionalName(item.title + ' ' + (item.content || '')),
          profession,
          city: location,
          address: `${location}, India`,
          website: isAgg ? null : item.url,
          publicEmail: null,
          publicPhone: null,
          contactStatus: 'UNAVAILABLE',
          phoneStatus: 'UNAVAILABLE',
          emailStatus: 'UNAVAILABLE',
          source: isAgg ? 'Public Business Directory' : 'Official Business Website',
          sourceUrl: item.url,
          sourceQuality: 'PUBLIC_BUSINESS_DIRECTORY',
          isDemoData: false,
          retrievedAt: new Date().toISOString(),
        });
      }
    }

    return results;
  }

  /**
   * Search via Live Open Web Search Engine (Bing base64 decoding + DDG lite + page crawl)
   */
  private async searchLiveWebEngine(
    profession: string,
    location: string,
    locality: string,
    limit: number
  ): Promise<DiscoveredBusinessRecord[]> {
    const query = locality
      ? `${profession} in ${locality} ${location}`
      : `${profession} in ${location}`;

    const items: DiscoveredBusinessRecord[] = [];

    // Attempt Bing live search
    try {
      const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
      const res = await fetch(bingUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-IN,en;q=0.9',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const html = await res.text();
        const blocks = html.split('<li class="b_algo"');

        for (let i = 1; i < blocks.length; i++) {
          const block = blocks[i];
          const linkMatch = block.match(/<h2><a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h2>/i);
          if (!linkMatch) continue;

          const rawHref = linkMatch[1];
          const title = linkMatch[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
          const targetUrl = decodeBingTargetUrl(rawHref);

          const captionMatch = block.match(/<div class="b_caption">[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
          const snippet = captionMatch
            ? captionMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim()
            : '';

          let isAgg = false;
          let hostname = '';
          try {
            hostname = new URL(targetUrl).hostname.replace(/^www\./, '');
            isAgg = AGGREGATOR_DOMAINS.some((d) => hostname.includes(d));
          } catch {
            continue;
          }

          const cleanName = cleanBusinessTitle(title, profession, location);
          if (!cleanName || cleanName.length < 3) continue;

          const contactName = extractProfessionalName(title + ' ' + snippet);

          // Extract phone from snippet
          let phone: string | null = null;
          const phoneMatch = snippet.match(/(?:\+91[\s-]?)?(?:0\d{2,4}[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/);
          if (phoneMatch) phone = phoneMatch[0].trim();

          // Extract email from snippet
          let email: string | null = null;
          const emailMatch = snippet.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch && !emailMatch[0].endsWith('.png')) email = emailMatch[0].trim();

          const website = isAgg ? null : targetUrl;

          // If direct website and missing contact, quickly fetch homepage for verified contact
          if (website && (!phone || !email)) {
            try {
              const siteRes = await fetch(website, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                signal: AbortSignal.timeout(3000),
              });
              if (siteRes.ok) {
                const siteHtml = await siteRes.text();
                if (!phone) {
                  const pMatch = siteHtml.match(/(?:\+91[\s-]?)?(?:0\d{2,4}[\s-]?)?[6-9]\d{4}[\s-]?\d{5}|(?:\+91[\s-]?)?0124[\s-]?\d{6,7}/);
                  if (pMatch) phone = pMatch[0].trim();
                }
                if (!email) {
                  const rawMatches = siteHtml.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
                  const eMatches = rawMatches
                    .map((m) => m.trim())
                    .filter((e) => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.includes('sentry') && !e.includes('wix'));
                  if (eMatches.length > 0) email = eMatches[0];
                }
              }
            } catch {
              // Ignore timeout / network failure
            }
          }

          const contactStatus = phone || email ? 'SOURCE_CONFIRMED' : 'UNAVAILABLE';

          items.push({
            sourceRecordId: `live-bing-${Date.now().toString(36)}-${i}`,
            businessName: cleanName,
            contactName,
            profession,
            city: location,
            address: `${location}, India`,
            website,
            publicEmail: email,
            publicPhone: phone,
            contactStatus,
            emailStatus: email ? 'SOURCE_CONFIRMED' : 'UNAVAILABLE',
            phoneStatus: phone ? 'SOURCE_CONFIRMED' : 'UNAVAILABLE',
            source: isAgg ? `Public Business Directory (${hostname})` : 'Official Business Website',
            sourceUrl: targetUrl,
            sourceQuality: 'PUBLIC_BUSINESS_DIRECTORY',
            isDemoData: false,
            retrievedAt: new Date().toISOString(),
          });

          if (items.length >= limit) return items;
        }
      }
    } catch {
      // Fall through if Bing fails
    }

    return items;
  }

  async getBusinessDetails(
    sourceRecordId: string
  ): Promise<ProviderExecutionResult<DiscoveredBusinessRecord | null>> {
    const match = VERIFIED_INDIAN_PROFESSIONALS.find(
      (p) => p.sourceRecordId === sourceRecordId || sourceRecordId.includes(p.sourceRecordId)
    );
    if (match) {
      return {
        success: true,
        configured: true,
        isMock: false,
        data: match,
      };
    }
    return {
      success: true,
      configured: true,
      isMock: false,
      data: null,
    };
  }

  async getPublicBusinessContact(
    sourceRecordId: string
  ): Promise<ProviderExecutionResult<{ email?: string; phone?: string } | null>> {
    const match = VERIFIED_INDIAN_PROFESSIONALS.find(
      (p) => p.sourceRecordId === sourceRecordId || sourceRecordId.includes(p.sourceRecordId)
    );
    if (match) {
      return {
        success: true,
        configured: true,
        isMock: false,
        data: {
          email: match.publicEmail || undefined,
          phone: match.publicPhone || undefined,
        },
      };
    }
    return {
      success: true,
      configured: true,
      isMock: false,
      data: null,
    };
  }

  async getOfficialWebsite(
    sourceRecordId: string
  ): Promise<ProviderExecutionResult<string | null>> {
    const match = VERIFIED_INDIAN_PROFESSIONALS.find(
      (p) => p.sourceRecordId === sourceRecordId || sourceRecordId.includes(p.sourceRecordId)
    );
    if (match) {
      return {
        success: true,
        configured: true,
        isMock: false,
        data: match.website || null,
      };
    }
    return {
      success: true,
      configured: true,
      isMock: false,
      data: null,
    };
  }
}
