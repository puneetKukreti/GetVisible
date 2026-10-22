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

const LOGO_RING_STYLE =
  'outline:3px solid #facc15;outline-offset:5px;border-radius:8px;box-shadow:0 0 22px rgba(250,204,21,0.45)';

/**
 * Most trade demos render the brand as an owner-supplied logo image, so the
 * name is not a text node in the header at all. Ring the logo itself — that is
 * the element the prospect will recognise immediately.
 */
function ringBrandLogo(html: string, name: string): string | null {
  const imgRegex = /<img\b[^>]*>/gi;
  const needle = name.toLowerCase();
  let match: RegExpExecArray | null;

  while ((match = imgRegex.exec(html))) {
    const tag = match[0];
    const alt = /\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
    const altText = (alt?.[1] ?? alt?.[2] ?? '').toLowerCase();
    if (!altText || !altText.includes(needle)) continue;

    let styled: string;
    if (/\bstyle\s*=\s*"/i.test(tag)) {
      styled = tag.replace(
        /(\bstyle\s*=\s*")([^"]*)"/i,
        (_m, prefix: string, existing: string) => `${prefix}${existing};${LOGO_RING_STYLE}"`
      );
    } else if (/\bstyle\s*=\s*'/i.test(tag)) {
      styled = tag.replace(
        /(\bstyle\s*=\s*')([^']*)'/i,
        (_m, prefix: string, existing: string) => `${prefix}${existing};${LOGO_RING_STYLE}'`
      );
    } else {
      styled = tag.replace(/\s*\/?>$/, (end) => ` style="${LOGO_RING_STYLE}"${end}`);
    }

    return html.slice(0, match.index) + styled + html.slice(match.index + tag.length);
  }

  return null;
}

function highlightSpan(inner: string): string {
  return `<span data-gv-brand-highlight="true" style="${HIGHLIGHT_STYLE}">${inner}</span>`;
}

/**
 * Index of the first occurrence of `name` that is a real text node — not an
 * attribute value, script or style payload. Attributes are the trap: the logo
 * is often `<img alt="Business Name">`, and wrapping that produces broken HTML
 * with no visible highlight.
 */
function firstTextNodeIndex(region: string, name: string): number {
  const haystack = region.toLowerCase();
  const needle = name.toLowerCase();
  let index = haystack.indexOf(needle);

  while (index !== -1) {
    const lastOpen = region.lastIndexOf('<', index);
    const lastClose = region.lastIndexOf('>', index);
    const insideTag = lastOpen > lastClose;

    // Also reject script/style bodies (JSON-LD, demo bootstrapping, etc.).
    let insideScript = false;
    if (!insideTag) {
      const lower = region.toLowerCase();
      const lastScriptOpen = lower.lastIndexOf('<script', index);
      const lastScriptClose = lower.lastIndexOf('</script', index);
      const lastStyleOpen = lower.lastIndexOf('<style', index);
      const lastStyleClose = lower.lastIndexOf('</style', index);
      insideScript =
        (lastScriptOpen !== -1 && lastScriptOpen > lastScriptClose) ||
        (lastStyleOpen !== -1 && lastStyleOpen > lastStyleClose);
    }

    if (!insideTag && !insideScript) return index;
    index = haystack.indexOf(needle, index + 1);
  }

  return -1;
}

function wrapFirst(haystack: string, pattern: RegExp, name: string): string | null {
  const match = pattern.exec(haystack);
  if (!match) return null;
  const start = match.index;
  const region = match[0];
  const nameIndex = firstTextNodeIndex(region, name);
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
  const rawBody = html.slice(bodyMatch.index + bodyMatch[0].length);
  // Prefer the owner's logo lockup when the header renders the brand as an image.
  const body = ringBrandLogo(rawBody, escapedName) ?? rawBody;
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
