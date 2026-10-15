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
 * Generates an authentic SVG hero preview as a bulletproof zero-dependency fallback
 * featuring the exact prospect firm name, city, badge, and navbar.
 */
export function generateHeroMockupSvg(
  brandName: string,
  city: string,
  profession: string = 'Chartered Accountants',
  headline?: string,
  subheadline?: string
): string {
  const escapedBrand = (brandName || 'Chartered Accountants')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  const escapedCity = (city || 'Gurgaon')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  const escapedProf = (profession || 'Chartered Accountants')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Compute 2-letter initials from business brand name
  const cleanParts = (brandName || '')
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  const initials =
    cleanParts.length >= 2
      ? (cleanParts[0][0] + cleanParts[1][0]).toUpperCase()
      : cleanParts[0]?.slice(0, 2).toUpperCase() || 'GV';

  const escapedHeadline = (headline || `${escapedProf} Excellence &amp; Advisory`)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const escapedSubheadline = (
    subheadline ||
    `Dedicated ${escapedProf.toLowerCase()} services, trusted expertise &amp; comprehensive advisory in ${escapedCity}.`
  )
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 640" width="1024" height="640">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00152a"/>
      <stop offset="50%" stop-color="#08213d"/>
      <stop offset="100%" stop-color="#0c2d52"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#d4af37"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="640" fill="url(#bg)"/>
  <g stroke="#ffffff" stroke-opacity="0.05" stroke-width="1">
    <line x1="0" y1="80" x2="1024" y2="80"/>
    <line x1="0" y1="160" x2="1024" y2="160"/>
    <line x1="0" y1="240" x2="1024" y2="240"/>
    <line x1="0" y1="320" x2="1024" y2="320"/>
    <line x1="0" y1="400" x2="1024" y2="400"/>
    <line x1="0" y1="480" x2="1024" y2="480"/>
  </g>
  <rect width="1024" height="74" fill="#001122" fill-opacity="0.95"/>
  <line x1="0" y1="74" x2="1024" y2="74" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1"/>
  <circle cx="56" cy="37" r="16" fill="#fde047" fill-opacity="0.15" stroke="#fde047" stroke-width="1.5"/>
  <text x="56" y="42" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="bold" fill="#fde047" text-anchor="middle">${initials}</text>
  <text x="86" y="38" font-family="Georgia, serif" font-size="16" font-weight="bold" fill="#ffffff">${escapedBrand}</text>
  <text x="86" y="52" font-family="system-ui, sans-serif" font-size="10" letter-spacing="1.5" fill="#a0aec0">${escapedProf.toUpperCase()}</text>
  <g font-family="system-ui, sans-serif" font-size="13" font-weight="500" fill="#cbd5e1">
    <text x="640" y="42">Home</text>
    <text x="710" y="42">Services</text>
    <text x="795" y="42">About</text>
    <text x="865" y="42">Contact</text>
  </g>
  <rect x="70" y="140" width="380" height="34" rx="17" fill="#fde047" fill-opacity="0.15" stroke="#fde047" stroke-opacity="0.4" stroke-width="1.5"/>
  <text x="90" y="162" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#fde047" letter-spacing="0.5">✦ ${escapedBrand} • ${escapedCity.toUpperCase()}</text>
  <text x="70" y="235" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="#ffffff">${escapedBrand}</text>
  <text x="70" y="285" font-family="Georgia, serif" font-size="28" font-weight="normal" fill="#e2e8f0">${escapedHeadline}</text>
  <text x="70" y="325" font-family="system-ui, sans-serif" font-size="17" fill="#94a3b8">${escapedSubheadline}</text>
  <rect x="70" y="385" width="220" height="48" rx="8" fill="url(#gold)"/>
  <text x="180" y="415" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#00152a" text-anchor="middle">Schedule Consultation →</text>
  <rect x="310" y="385" width="180" height="48" rx="8" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1.5"/>
  <text x="400" y="415" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">Explore Practice</text>
  <g font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#cbd5e1">
    <text x="70" y="490">✓ Verified Practice</text>
    <text x="250" y="490">✓ Direct Consultation</text>
    <text x="430" y="490">✓ ${escapedCity} Office</text>
  </g>
  <g transform="translate(640, 160)">
    <rect width="310" height="360" rx="16" fill="#001a33" stroke="#fde047" stroke-opacity="0.25" stroke-width="1.5"/>
    <circle cx="155" cy="150" r="85" fill="none" stroke="#fde047" stroke-opacity="0.2" stroke-width="2"/>
    <circle cx="155" cy="150" r="55" fill="none" stroke="#60a5fa" stroke-opacity="0.3" stroke-width="2"/>
    <rect x="40" y="270" width="230" height="18" rx="4" fill="#ffffff" fill-opacity="0.15"/>
    <rect x="40" y="300" width="160" height="14" rx="4" fill="#fde047" fill-opacity="0.4"/>
  </g>
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
