import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { ProviderExecutionResult, ProviderStatus } from './provider-result';
import { getTemplateScreenshotPath } from '../demos/stitch-templates';

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  deviceScaleFactor?: number;
  waitForTimeout?: number;
  format?: 'png' | 'jpeg';
}

export interface ScreenshotResult {
  screenshotUrl: string;
  source: 'microlink' | 'screenshotone' | 'urlbox' | 'template' | 'mock' | 'local_browser' | 'svg_mockup';
  width: number;
  height: number;
}

/**
 * Searches common system paths for installed Chromium/Chrome or Edge executables.
 */
export function findSystemBrowser(): string | null {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env.CHROME_BIN,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

/**
 * Executes local headless Chrome/Edge to capture a pixel-perfect 1024x640 screenshot
 * of a personalized HTML template directly from disk without needing any remote web server.
 */
export async function captureLocalHeroScreenshot(
  htmlContent: string,
  outputPngPath: string,
  options?: { width?: number; height?: number }
): Promise<boolean> {
  const browser = findSystemBrowser();
  if (!browser) return false;

  const width = options?.width || 1024;
  const height = options?.height || 640;

  const outputDir = path.dirname(outputPngPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tmpHtmlPath = path.join(
    outputDir,
    `tmp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.html`
  );
  fs.writeFileSync(tmpHtmlPath, htmlContent, 'utf-8');

  return new Promise<boolean>((resolve) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--allow-file-access-from-files',
      '--enable-local-file-accesses',
      '--run-all-compositor-stages-before-draw',
      '--hide-scrollbars',
      '--virtual-time-budget=2000',
      `--window-size=${width},${height}`,
      `--screenshot=${outputPngPath}`,
      `file:///${tmpHtmlPath.replace(/\\/g, '/')}`,
    ];

    execFile(browser, args, { timeout: 12000 }, (err) => {
      try {
        if (fs.existsSync(tmpHtmlPath)) fs.unlinkSync(tmpHtmlPath);
      } catch {}

      if (err) {
        console.warn('Local browser screenshot failed:', err.message);
        resolve(false);
      } else {
        const ok = fs.existsSync(outputPngPath) && fs.statSync(outputPngPath).size > 1000;
        resolve(ok);
      }
    });
  });
}

/**
 * Escapes the five XML special characters for safe SVG text/attribute output.
 */
export function escapeSvgXml(value: string): string {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 2-letter initials used for the monogram mark in the preview cards. */
function brandInitials(brandName: string): string {
  const cleanParts = (brandName || '')
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  return cleanParts.length >= 2
    ? (cleanParts[0][0] + cleanParts[1][0]).toUpperCase()
    : cleanParts[0]?.slice(0, 2).toUpperCase() || 'GV';
}

/** Greedy word-wrap so long copy never collides with the surrounding artwork. */
function wrapSvgText(text: string, maxChars: number, maxLines: number): string[] {
  const words = (text || '').trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  let truncated = false;
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > maxChars) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) {
        truncated = true;
        break;
      }
    } else {
      current = candidate;
    }
  }
  if (!truncated && current && lines.length < maxLines) lines.push(current);
  if (truncated && lines.length > 0) {
    lines[lines.length - 1] = `${lines[lines.length - 1]}\u2026`;
  }
  return lines.slice(0, maxLines);
}

export interface HeroMockupOptions {
  /**
   * `mobile` renders a tall 1080x1350 portrait card (the layout that travels
   * well in a phone-sized WhatsApp chat bubble); `desktop` keeps the original
   * wide 1024x640 browser-window card.
   */
  viewport?: 'desktop' | 'mobile';
}

/**
 * Generates an authentic SVG hero preview as a bulletproof zero-dependency fallback
 * featuring the exact prospect firm name, city, badge, and navbar.
 */
export function generateHeroMockupSvg(
  brandName: string,
  city: string,
  profession: string = 'Chartered Accountants',
  headline?: string,
  subheadline?: string,
  options?: HeroMockupOptions
): string {
  if (options?.viewport === 'mobile') {
    return generateMobileHeroMockupSvg(brandName, city, profession, headline, subheadline);
  }

  const escapeXml = escapeSvgXml;

  const brand = brandName || 'Chartered Accountants';
  const cityName = city || 'Gurgaon';
  const profName = profession || 'Chartered Accountants';

  const escapedBrand = escapeXml(brand);
  const escapedCity = escapeXml(cityName);

  const initials = brandInitials(brand);

  // Greedy word-wrap so long headlines never collide with the hero artwork.
  const wrapText = (text: string, maxChars: number, maxLines: number): string[] => {
    const words = (text || '').trim().split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (current && candidate.length > maxChars) {
        lines.push(current);
        current = word;
        if (lines.length === maxLines) break;
      } else {
        current = candidate;
      }
    }
    if (lines.length < maxLines && current) lines.push(current);
    return lines.slice(0, maxLines);
  };

  const rawHeadline = headline || `${profName} Excellence & Advisory`;
  const rawSubheadline =
    subheadline ||
    `Dedicated ${profName.toLowerCase()} services, trusted expertise and comprehensive advisory in ${cityName}.`;

  const headlineLines = wrapText(rawHeadline, 44, 2);
  const subheadlineLines = wrapText(rawSubheadline, 68, 2);

  // URL slug shown in the browser chrome.
  const slug =
    brand.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
    'your-brand';

  // Keep the hero name dominant, but scale it down for long business names.
  const brandLength = brand.trim().length;
  const heroNameSize = brandLength <= 14 ? 62 : brandLength <= 20 ? 54 : brandLength <= 28 ? 46 : 38;

  const HERO_LEFT = 70;
  const HERO_TEXT_MAX = 548;

  // Constrain glyphs to the text column so even very long names never spill
  // into the hero artwork on the right.
  const nameEstimatedWidth = escapedBrand.length * heroNameSize * 0.56;
  const nameFitAttr =
    nameEstimatedWidth > HERO_TEXT_MAX
      ? ` textLength="${HERO_TEXT_MAX}" lengthAdjust="spacingAndGlyphs"`
      : '';

  const badgeWidth = Math.min(
    560,
    Math.max(220, escapedBrand.length * 8 + escapedCity.length * 7 + 120)
  );

  const headlineStartY = 326;
  const headlineSvg = headlineLines
    .map(
      (line, i) =>
        `    <text x="${HERO_LEFT}" y="${headlineStartY + i * 32}" font-family="Georgia, 'Times New Roman', serif" font-size="22" fill="#e2e8f0">${escapeXml(line)}</text>`
    )
    .join('\n');

  const subheadlineStartY = headlineStartY + headlineLines.length * 32 + 12;
  const subheadlineSvg = subheadlineLines
    .map(
      (line, i) =>
        `    <text x="${HERO_LEFT}" y="${subheadlineStartY + i * 22}" font-family="system-ui, -apple-system, sans-serif" font-size="15" fill="#94a3b8">${escapeXml(line)}</text>`
    )
    .join('\n');

  const ctaY = subheadlineStartY + subheadlineLines.length * 22 + 18;
  const trustY = ctaY + 48 + 40;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 640" width="1024" height="640">
  <defs>
    <linearGradient id="pageBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#eef2f7"/>
      <stop offset="100%" stop-color="#d9e2ee"/>
    </linearGradient>
    <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a1f3c"/>
      <stop offset="55%" stop-color="#0e2c50"/>
      <stop offset="100%" stop-color="#15406e"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#d4af37"/>
    </linearGradient>
    <clipPath id="windowClip"><rect x="32" y="28" width="960" height="584" rx="18"/></clipPath>
  </defs>

  <rect width="1024" height="640" fill="url(#pageBg)"/>

  <!-- Browser window -->
  <rect x="32" y="28" width="960" height="584" rx="18" fill="#ffffff" stroke="#c3cede" stroke-width="1.5"/>

  <!-- Title bar -->
  <g clip-path="url(#windowClip)"><rect x="32" y="28" width="960" height="46" fill="#f1f5f9"/></g>
  <line x1="32" y1="74" x2="992" y2="74" stroke="#e2e8f0" stroke-width="1"/>
  <circle cx="58" cy="51" r="6" fill="#f87171"/>
  <circle cx="78" cy="51" r="6" fill="#fbbf24"/>
  <circle cx="98" cy="51" r="6" fill="#34d399"/>
  <rect x="126" y="40" width="540" height="22" rx="11" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="146" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#64748b">https://${slug}.com</text>

  <!-- Navbar -->
  <rect x="52" y="92" width="34" height="34" rx="9" fill="#0a1f3c"/>
  <text x="69" y="115" font-family="Georgia, 'Times New Roman', serif" font-size="15" font-weight="bold" fill="#d4af37" text-anchor="middle">${initials}</text>
  <text x="96" y="116" font-family="Georgia, 'Times New Roman', serif" font-size="19" font-weight="bold" fill="#0f172a">${escapedBrand}</text>
  <g font-family="system-ui, -apple-system, sans-serif" font-size="12.5" font-weight="500" fill="#64748b">
    <text x="596" y="114">Services</text>
    <text x="660" y="114">About</text>
    <text x="712" y="114">Process</text>
    <text x="772" y="114">Contact</text>
  </g>
  <rect x="866" y="94" width="110" height="30" rx="8" fill="#0a1f3c"/>
  <text x="921" y="114" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">Get a Demo</text>

  <!-- Hero -->
  <g clip-path="url(#windowClip)">
    <rect x="32" y="140" width="960" height="472" fill="url(#heroBg)"/>

    <g transform="translate(648,176)">
      <rect width="296" height="380" rx="16" fill="#001a33" stroke="#fde047" stroke-opacity="0.25" stroke-width="1.5"/>
      <circle cx="148" cy="140" r="86" fill="none" stroke="#fde047" stroke-opacity="0.18" stroke-width="2"/>
      <circle cx="148" cy="140" r="56" fill="none" stroke="#60a5fa" stroke-opacity="0.28" stroke-width="2"/>
      <text x="148" y="152" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="bold" fill="#fde047" text-anchor="middle">${initials}</text>
      <rect x="44" y="266" width="208" height="18" rx="4" fill="#ffffff" fill-opacity="0.14"/>
      <rect x="44" y="296" width="150" height="14" rx="4" fill="#fde047" fill-opacity="0.38"/>
      <rect x="44" y="322" width="180" height="14" rx="4" fill="#ffffff" fill-opacity="0.1"/>
    </g>

    <rect x="72" y="178" width="${badgeWidth}" height="34" rx="17" fill="#fde047" fill-opacity="0.14" stroke="#fde047" stroke-opacity="0.4" stroke-width="1.5"/>
    <text x="92" y="200" font-family="system-ui, -apple-system, sans-serif" font-size="12.5" font-weight="700" fill="#fde047" letter-spacing="0.5">&#10022; ${escapedBrand} &#8226; ${escapedCity.toUpperCase()}</text>

    <!-- The prospect's name is the dominant element so they instantly see it is theirs. -->
    <text x="${HERO_LEFT}" y="282" font-family="Georgia, 'Times New Roman', serif" font-size="${heroNameSize}" font-weight="bold" fill="#ffffff"${nameFitAttr}>${escapedBrand}</text>
${headlineSvg}
${subheadlineSvg}

    <rect x="70" y="${ctaY}" width="224" height="48" rx="8" fill="url(#gold)"/>
    <text x="182" y="${ctaY + 30}" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#0a1f3c" text-anchor="middle">Schedule Consultation &#8594;</text>
    <rect x="306" y="${ctaY}" width="184" height="48" rx="8" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1.5"/>
    <text x="398" y="${ctaY + 30}" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">Explore Practice</text>

    <g font-family="system-ui, -apple-system, sans-serif" font-size="12.5" font-weight="600" fill="#cbd5e1">
      <text x="70" y="${trustY}">&#10003; Verified Practice</text>
      <text x="252" y="${trustY}">&#10003; Direct Consultation</text>
      <text x="434" y="${trustY}">&#10003; ${escapedCity} Office</text>
    </g>
  </g>
</svg>`;

}

/**
 * Portrait (4:5) "phone screen" concept card.
 *
 * Landscape cards are rendered at a fraction of a phone's screen width, so most
 * of their copy is illegible in a chat thumbnail. This variant is built the
 * other way round: a tall 1080x1350 card whose type is sized to stay readable
 * once WhatsApp scales it down to a chat bubble (>= 34px source text), with the
 * prospect's own name as the dominant element near the top.
 */
export function generateMobileHeroMockupSvg(
  brandName: string,
  city: string,
  profession: string = 'Chartered Accountants',
  headline?: string,
  subheadline?: string
): string {
  const brand = brandName || 'Chartered Accountants';
  const cityName = city || 'Gurgaon';
  const profName = profession || 'Chartered Accountants';

  const escapedBrand = escapeSvgXml(brand);
  const escapedCity = escapeSvgXml(cityName);
  const initials = brandInitials(brand);

  // Screen geometry
  const PHONE_X = 140;
  const PHONE_Y = 96;
  const PHONE_W = 800;
  const PHONE_H = 1158;
  const SCREEN_X = PHONE_X + 16;
  const SCREEN_Y = PHONE_Y + 16;
  const SCREEN_W = PHONE_W - 32;
  const SCREEN_H = PHONE_H - 32;
  const TEXT_LEFT = SCREEN_X + 42;
  const TEXT_MAX_W = SCREEN_W - 84;

  // The prospect's name is sized to the longest word-safe width so it always
  // fits the screen in at most two lines.
  const brandLength = brand.trim().length;
  const heroNameSize =
    brandLength <= 12 ? 92 : brandLength <= 18 ? 80 : brandLength <= 24 ? 70 : brandLength <= 32 ? 60 : 54;
  const heroNameMaxChars = Math.max(10, Math.floor(TEXT_MAX_W / (heroNameSize * 0.56)));
  const heroNameLines = wrapSvgText(brand, heroNameMaxChars, 2);

  const rawHeadline = headline || `${profName} Excellence & Advisory`;
  const rawSubheadline =
    subheadline ||
    `Dedicated ${profName.toLowerCase()} services and trusted advisory for clients in ${cityName}.`;
  const headlineLines = wrapSvgText(rawHeadline, Math.floor(TEXT_MAX_W / 24), 2);
  const subheadlineLines = wrapSvgText(rawSubheadline, Math.floor(TEXT_MAX_W / 17), 2);

  const squeeze = (line: string, size: number, maxWidth: number = TEXT_MAX_W) => {
    const estimated = escapeSvgXml(line).length * size * 0.56;
    return estimated > maxWidth
      ? ` textLength="${maxWidth}" lengthAdjust="spacingAndGlyphs"`
      : '';
  };

  const heroNameStartY = 452;
  const heroNameSvg = heroNameLines
    .map(
      (line, i) =>
        `  <text x="${TEXT_LEFT}" y="${heroNameStartY + i * 88}" font-family="Georgia, 'Times New Roman', serif" font-size="${heroNameSize}" font-weight="bold" fill="#0a1f3c"${squeeze(line, heroNameSize)}>${escapeSvgXml(line)}</text>`
    )
    .join('\n');

  const headlineStartY = heroNameStartY + heroNameLines.length * 88 + 12;
  const headlineSvg = headlineLines
    .map(
      (line, i) =>
        `  <text x="${TEXT_LEFT}" y="${headlineStartY + i * 54}" font-family="Georgia, 'Times New Roman', serif" font-size="42" fill="#334155"${squeeze(line, 42)}>${escapeSvgXml(line)}</text>`
    )
    .join('\n');

  const subheadlineStartY = headlineStartY + headlineLines.length * 54 + 14;
  const subheadlineSvg = subheadlineLines
    .map(
      (line, i) =>
        `  <text x="${TEXT_LEFT}" y="${subheadlineStartY + i * 46}" font-family="system-ui, -apple-system, sans-serif" font-size="36" fill="#64748b"${squeeze(line, 36)}>${escapeSvgXml(line)}</text>`
    )
    .join('\n');

  const ctaY = subheadlineStartY + subheadlineLines.length * 46 + 20;
  const ctaH = 96;
  const benefitY = ctaY + ctaH + 50;
  const footerStripY = SCREEN_Y + SCREEN_H - 96;

  const badgeText = `\u2726 ${escapedBrand} \u2022 ${escapedCity.toUpperCase()}`;
  const BADGE_FONT = 32;
  const badgeTextEstimate = badgeText.length * BADGE_FONT * 0.62;
  const badgeWidth = Math.min(TEXT_MAX_W, Math.max(320, badgeTextEstimate + 60));
  const badgeFit =
    badgeTextEstimate > badgeWidth - 60
      ? ` textLength="${Math.round(badgeWidth - 60)}" lengthAdjust="spacingAndGlyphs"`
      : '';

  const benefits = [`Verified Practice`, `Direct Consultation`, `${escapedCity} Office`];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
  <defs>
    <linearGradient id="cardBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#071729"/>
      <stop offset="55%" stop-color="#0c2745"/>
      <stop offset="100%" stop-color="#123a63"/>
    </linearGradient>
    <radialGradient id="cardGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fde047" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#fde047" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="screenBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f3f6fa"/>
    </linearGradient>
    <linearGradient id="cardGold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#d4af37"/>
    </linearGradient>
    <clipPath id="screenClip">
      <rect x="${SCREEN_X}" y="${SCREEN_Y}" width="${SCREEN_W}" height="${SCREEN_H}" rx="40"/>
    </clipPath>
  </defs>

  <rect width="1080" height="1350" fill="url(#cardBg)"/>
  <circle cx="880" cy="170" r="420" fill="url(#cardGlow)"/>

  <text x="140" y="62" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="700" letter-spacing="6" fill="#fde047">WEBSITE CONCEPT PREVIEW</text>

  <!-- Phone frame -->
  <rect x="${PHONE_X}" y="${PHONE_Y}" width="${PHONE_W}" height="${PHONE_H}" rx="56" fill="#05090f" stroke="#fde047" stroke-opacity="0.28" stroke-width="2"/>

  <g clip-path="url(#screenClip)">
    <rect x="${SCREEN_X}" y="${SCREEN_Y}" width="${SCREEN_W}" height="${SCREEN_H}" fill="url(#screenBg)"/>

    <!-- Status bar -->
    <text x="${TEXT_LEFT}" y="${SCREEN_Y + 46}" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="#0f172a">9:41</text>
    <g fill="#0f172a" fill-opacity="0.75">
      <rect x="${SCREEN_X + SCREEN_W - 150}" y="${SCREEN_Y + 30}" width="10" height="18" rx="3"/>
      <rect x="${SCREEN_X + SCREEN_W - 134}" y="${SCREEN_Y + 24}" width="10" height="24" rx="3"/>
      <rect x="${SCREEN_X + SCREEN_W - 118}" y="${SCREEN_Y + 18}" width="10" height="30" rx="3"/>
      <rect x="${SCREEN_X + SCREEN_W - 96}" y="${SCREEN_Y + 20}" width="56" height="26" rx="7" fill="none" stroke="#0f172a" stroke-opacity="0.6" stroke-width="2.5"/>
      <rect x="${SCREEN_X + SCREEN_W - 92}" y="${SCREEN_Y + 24}" width="40" height="18" rx="4"/>
    </g>

    <!-- Site navbar -->
    <rect x="${TEXT_LEFT}" y="${SCREEN_Y + 78}" width="66" height="66" rx="14" fill="#0a1f3c"/>
    <text x="${TEXT_LEFT + 33}" y="${SCREEN_Y + 122}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="30" font-weight="bold" fill="#d4af37">${initials}</text>
    <text x="${TEXT_LEFT + 84}" y="${SCREEN_Y + 106}" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="bold" fill="#0f172a"${squeeze(brand, 34, TEXT_MAX_W - 84)}>${escapedBrand}</text>
    <text x="${TEXT_LEFT + 84}" y="${SCREEN_Y + 142}" font-family="system-ui, -apple-system, sans-serif" font-size="24" letter-spacing="3" fill="#64748b">${escapeSvgXml(profName.toUpperCase())}</text>
    <line x1="${TEXT_LEFT}" y1="${SCREEN_Y + 182}" x2="${SCREEN_X + SCREEN_W - 42}" y2="${SCREEN_Y + 182}" stroke="#e2e8f0" stroke-width="2"/>

    <!-- Firm badge -->
    <rect x="${TEXT_LEFT}" y="${SCREEN_Y + 208}" width="${badgeWidth}" height="58" rx="29" fill="#fde047" fill-opacity="0.16" stroke="#d4af37" stroke-opacity="0.5" stroke-width="2"/>
    <text x="${TEXT_LEFT + 26}" y="${SCREEN_Y + 246}" font-family="system-ui, -apple-system, sans-serif" font-size="${BADGE_FONT}" font-weight="700" fill="#b45309"${badgeFit}>${badgeText}</text>

${heroNameSvg}
${headlineSvg}
${subheadlineSvg}

    <!-- Primary call to action -->
    <rect x="${TEXT_LEFT}" y="${ctaY}" width="${TEXT_MAX_W}" height="${ctaH}" rx="16" fill="url(#cardGold)"/>
    <text x="${TEXT_LEFT + TEXT_MAX_W / 2}" y="${ctaY + 60}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="700" fill="#0a1f3c">Schedule Consultation &#8594;</text>

    <!-- Trust rows -->
    <g font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="600" fill="#0f172a">
${benefits.map((b, i) => `      <text x="${TEXT_LEFT}" y="${benefitY + i * 48}">&#10003; ${b}</text>`).join('\n')}
    </g>

    <!-- Mini site footer, so the card reads as a real page screenshot -->
    <rect x="${SCREEN_X}" y="${footerStripY}" width="${SCREEN_W}" height="96" fill="#0a1f3c"/>
    <text x="${TEXT_LEFT}" y="${footerStripY + 58}" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#e2e8f0"${squeeze(`\u00a9 ${brand} \u2022 ${city}`, 28, TEXT_MAX_W - 190)}>&#169; ${escapedBrand} &#8226; ${escapedCity}</text>
    <text x="${SCREEN_X + SCREEN_W - 42}" y="${footerStripY + 58}" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="#fde047">Contact &#8594;</text>
  </g>

  <text x="540" y="1308" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="600" fill="#e2e8f0"${squeeze(`Live preview prepared for ${brand}`, 34, 960)}>Live preview prepared for ${escapedBrand}</text>
</svg>`;
}

export interface IScreenshotProvider {
  name: string;
  isConfigured(): boolean;
  getStatus(): ProviderStatus;
  captureWebsite(targetUrl: string, options?: ScreenshotOptions): Promise<ProviderExecutionResult<ScreenshotResult>>;
}

export class CloudScreenshotProvider implements IScreenshotProvider {
  name = 'CloudScreenshotProvider';

  private screenshotOneKey = process.env.SCREENSHOTONE_API_KEY;
  private urlboxKey = process.env.URLBOX_API_KEY;

  isConfigured(): boolean {
    // Microlink is available without an API key as a zero-config cloud provider
    return true;
  }

  getStatus(): ProviderStatus {
    const isDedicated = Boolean(this.screenshotOneKey || this.urlboxKey);
    return {
      name: this.name,
      configured: true,
      isMock: false,
      details: isDedicated
        ? 'Dedicated high-volume screenshot API configured.'
        : 'Zero-config cloud screenshot provider active (Microlink).',
    };
  }

  async captureWebsite(
    targetUrl: string,
    options?: ScreenshotOptions
  ): Promise<ProviderExecutionResult<ScreenshotResult>> {
    const width = options?.width || 1024;
    const height = options?.height || 640;

    try {
      const isLocalUrl =
        targetUrl.includes('localhost') ||
        targetUrl.includes('127.0.0.1') ||
        targetUrl.includes('0.0.0.0') ||
        targetUrl.includes('::1') ||
        targetUrl.startsWith('/');

      // 1. If target is local or loopback (which cloud headless scrapers block with 400 Bad Request),
      // serve the high-res template screenshot directly!
      if (isLocalUrl && !this.screenshotOneKey) {
        return {
          success: true,
          configured: true,
          isMock: false,
          data: {
            screenshotUrl: getTemplateScreenshotPath(targetUrl),
            source: 'template',
            width,
            height,
          },
        };
      }

      // 2. ScreenshotOne if configured
      if (this.screenshotOneKey) {
        const query = new URLSearchParams({
          access_key: this.screenshotOneKey,
          url: targetUrl,
          viewport_width: String(width),
          viewport_height: String(height),
          device_scale_factor: String(options?.deviceScaleFactor || 2),
          format: options?.format || 'jpeg',
          cache: 'true',
          cache_ttl: '86400',
        });

        const screenshotUrl = `https://api.screenshotone.com/take?${query.toString()}`;
        return {
          success: true,
          configured: true,
          isMock: false,
          data: {
            screenshotUrl,
            source: 'screenshotone',
            width,
            height,
          },
        };
      }

      // 3. Default Zero-Config: Microlink API CDN for public URLs
      const encodedUrl = encodeURIComponent(targetUrl);
      const deviceScaleFactor = options?.deviceScaleFactor || 2;
      const microlinkUrl = `https://api.microlink.io?url=${encodedUrl}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=${width}&viewport.height=${height}&viewport.deviceScaleFactor=${deviceScaleFactor}`;

      return {
        success: true,
        configured: true,
        isMock: false,
        data: {
          screenshotUrl: microlinkUrl,
          source: 'microlink',
          width,
          height,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        configured: true,
        isMock: false,
        error: `Screenshot generation failed: ${msg}`,
      };
    }
  }
}

export class MockScreenshotProvider implements IScreenshotProvider {
  name = '[DEMO MOCK] ScreenshotProvider';

  isConfigured(): boolean {
    return true;
  }

  getStatus(): ProviderStatus {
    return {
      name: this.name,
      configured: true,
      isMock: true,
      details: 'Mock screenshot provider returning simulated preview badge for sandboxed environments.',
    };
  }

  async captureWebsite(
    targetUrl: string,
    options?: ScreenshotOptions
  ): Promise<ProviderExecutionResult<ScreenshotResult>> {
    const width = options?.width || 1024;
    const height = options?.height || 640;

    // Use a clean placeholder preview image with CA theme
    const mockPreviewUrl = `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=${width}&h=${height}&q=80`;

    return {
      success: true,
      configured: true,
      isMock: true,
      data: {
        screenshotUrl: mockPreviewUrl,
        source: 'mock',
        width,
        height,
      },
    };
  }
}
