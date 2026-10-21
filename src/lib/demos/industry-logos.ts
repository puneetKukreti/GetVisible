/**
 * Industry Logo Marks
 *
 * Trade-level brand logos shipped with the app, keyed by the industry key that
 * `buildIndustryKey` produces. Logos come from the owner's own brand assets —
 * never scraped or hot-linked — and are self-hosted from `public/`, so a demo
 * never depends on a third-party image host and the mark survives redeploys.
 *
 * Only industries that actually have a shipped logo are listed here; every
 * other trade keeps its text brand name.
 */

const INDUSTRY_LOGOS: Record<string, string> = {
  'car-detailing': '/logos/car-detailing-logo.png',
};

export function getIndustryLogoUrl(industryKey?: string | null): string | undefined {
  if (!industryKey) return undefined;
  return INDUSTRY_LOGOS[industryKey];
}
