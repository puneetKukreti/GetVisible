/**
 * Screenshot-only brand highlight.
 *
 * When a prospect opens a WhatsApp/email attachment, the first thing they should
 * recognise is their own business name. The demo header already shows it, but in
 * a small chat thumbnail it can get lost. This helper wraps the first rendered
 * occurrence of the business name in a highlighter ring so it is unmistakable.
 *
 * Rules:
 * - Only the body is touched (never <title>, meta tags or attributes).
 * - Exactly one occurrence is wrapped — the most prominent one available:
 *   hero <h1> first, then <header>, then the first text node in the body.
 * - The original text/classes are preserved; only an inline-styled span is added,
 *   so the capture stays a real screenshot of the real page.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const HIGHLIGHT_STYLE = [
  'display:inline',
  'padding:0 2px',
  'border-radius:6px',
  'background:rgba(250,204,21,0.20)',
  'box-shadow:0 0 0 4px rgba(250,204,21,0.20),0 0 20px rgba(250,204,21,0.38)',
  'outline:3px solid #facc15',
  'outline-offset:2px',
  'box-decoration-break:clone',
  '-webkit-box-decoration-break:clone',
].join(';');

function highlightSpan(inner: string): string {
  return `<span data-gv-brand-highlight="true" style="${HIGHLIGHT_STYLE}">${inner}</span>`;
}

function wrapFirst(haystack: string, pattern: RegExp, name: string): string | null {
  const match = pattern.exec(haystack);
  if (!match) return null;
  // Replace only the first occurrence inside the matched region.
  const start = match.index;
  const region = match[0];
  const nameIndex = region.search(new RegExp(escapeRegExp(name), 'i'));
  if (nameIndex < 0) return null;

  const before = region.slice(0, nameIndex);
  const hit = region.slice(nameIndex, nameIndex + name.length);
  const after = region.slice(nameIndex + name.length);

  return (
    haystack.slice(0, start) +
    before +
    highlightSpan(hit) +
    after +
    haystack.slice(start + region.length)
  );
}

/**
 * Returns the HTML with the first prominent occurrence of `brandName` wrapped in
 * a yellow highlighter ring. Safe to call on any document; if the name is not
 * found the HTML is returned unchanged.
 */
export function highlightBrandNameInHtml(html: string, brandName: string): string {
  if (!html) return html;
  const name = (brandName || '').trim();
  if (name.length < 2) return html;

  const escapedName = escapeHtml(name);
  const bodyMatch = /<body[^>]*>/i.exec(html);
  if (!bodyMatch) return html;

  const head = html.slice(0, bodyMatch.index + bodyMatch[0].length);
  const body = html.slice(bodyMatch.index + bodyMatch[0].length);
  const namePattern = escapeRegExp(escapedName);

  // 1. Hero heading — the most prominent placement on the page.
  const inH1 = wrapFirst(
    body,
    new RegExp(`<h1[^>]*>[\\s\\S]{0,600}?${namePattern}[\\s\\S]{0,600}?<\\/h1>`, 'i'),
    escapedName
  );
  if (inH1) return head + inH1;

  // 2. Site header / navbar logo lockup.
  const inHeader = wrapFirst(
    body,
    new RegExp(`<header[^>]*>[\\s\\S]{0,1200}?${namePattern}[\\s\\S]{0,1200}?<\\/header>`, 'i'),
    escapedName
  );
  if (inHeader) return head + inHeader;

  // 3. Last resort: first text node in the body that contains the name.
  const inTextNode = wrapFirst(
    body,
    new RegExp(`>[^<]{0,160}?${namePattern}`, 'i'),
    escapedName
  );
  if (inTextNode) return head + inTextNode;

  return html;
}
