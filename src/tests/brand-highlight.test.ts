import { describe, it, expect } from 'vitest';
import { highlightBrandNameInHtml } from '@/lib/demos/brand-highlight';

const PAGE = `<!doctype html><html><head><title>Galaxy Car Care | Car Detailing</title></head><body><header><a href="/"><span>Galaxy Car Care</span></a></header><h1>Welcome to Galaxy Car Care</h1></body></html>`;

describe('Screenshot brand highlight', () => {
  it('rings the business name exactly once, inside the hero heading', () => {
    const out = highlightBrandNameInHtml(PAGE, 'Galaxy Car Care');
    expect(out).toContain('data-gv-brand-highlight="true"');
    expect(out.match(/data-gv-brand-highlight/g)).toHaveLength(1);

    // Never touches the document head / title
    expect(out).toContain('<title>Galaxy Car Care | Car Detailing</title>');

    // The real name text is preserved (presentation only)
    expect(out).toContain('Galaxy Car Care');
  });

  it('falls back to the site header when no heading contains the name', () => {
    const doc = `<html><body><header><span>Luxe Car Spa</span></header><h1>Premium Detailing</h1></body></html>`;
    const out = highlightBrandNameInHtml(doc, 'Luxe Car Spa');
    expect(out).toContain('data-gv-brand-highlight="true"');
    expect(out.match(/data-gv-brand-highlight/g)).toHaveLength(1);
    expect(out).toContain('Luxe Car Spa');
  });

  it('leaves the HTML untouched when the name is absent', () => {
    expect(highlightBrandNameInHtml(PAGE, 'Detailing Fox')).toBe(PAGE);
  });

  it('matches an HTML-escaped ampersand in the rendered name', () => {
    const doc = `<html><body><h1>Sharma &amp; Associates</h1></body></html>`;
    const out = highlightBrandNameInHtml(doc, 'Sharma & Associates');
    expect(out).toContain('data-gv-brand-highlight="true"');
    expect(out.match(/data-gv-brand-highlight/g)).toHaveLength(1);
  });
});
