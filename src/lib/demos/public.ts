import crypto from 'crypto';

/**
 * Generates a cryptographically random, URL-safe public token for shareable website demos.
 * Uses 9 bytes of cryptographically secure random entropy converted to base64url,
 * producing a 12-character collision-resistant, non-sequential token.
 *
 * Example: '8f3Kx92LmQ7w'
 */
export function generatePublicDemoToken(): string {
  return crypto.randomBytes(9).toString('base64url');
}

/**
 * Detects if a domain/origin is a Vercel preview deployment URL containing
 * temporary deployment hashes (e.g. 'get-visible-b64ejegts-puneetkukretis-projects.vercel.app')
 * which are protected by Vercel Authentication by default.
 * Extracts the clean canonical project production domain (e.g. 'https://get-visible.vercel.app').
 */
export function sanitizeVercelPreviewOrigin(raw: string): string | null {
  if (!raw) return null;
  const hostname = raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();

  if (!hostname.endsWith('.vercel.app')) return null;

  // 1. Match Vercel team/project preview deployments ending in '-projects.vercel.app'
  // Example: 'get-visible-b64ejegts-puneetkukretis-projects.vercel.app'
  if (hostname.includes('-projects.vercel.app')) {
    const basePart = hostname.replace(/-projects\.vercel\.app$/, '');
    const segments = basePart.split('-');
    if (segments.length >= 3) {
      const gitIndex = segments.indexOf('git');
      if (gitIndex > 0) {
        const projectName = segments.slice(0, gitIndex).join('-');
        return `https://${projectName}.vercel.app`;
      }
      // Last segment is team/user, second-to-last is deployment hash
      const projectName = segments.slice(0, -2).join('-');
      if (projectName) {
        return `https://${projectName}.vercel.app`;
      }
    }
  }

  // 2. Match general preview hash: <project>-<hash>.vercel.app
  const generalMatch = hostname.match(/^([a-z0-9-]+)-[a-z0-9]{8,12}\.vercel\.app$/);
  if (generalMatch && generalMatch[1]) {
    return `https://${generalMatch[1]}.vercel.app`;
  }

  return null;
}

/**
 * Resolves the application base URL dynamically for both local development and production/Vercel.
 *
 * Priority order:
 * 1. NEXT_PUBLIC_APP_URL / APP_URL (Explicit production origin, e.g. 'https://get-visible-web.vercel.app')
 * 2. NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL / VERCEL_PROJECT_PRODUCTION_URL
 *    (Vercel's canonical production domain, avoiding temporary preview deployment hashes and Vercel Auth)
 * 3. Client-side browser execution (window.location.origin), sanitizing preview hashes if detected
 * 4. Fallback request origin parameter if provided (sanitizing preview hashes)
 * 5. Default local development origin: 'http://localhost:3000'
 */
export function getAppBaseUrl(fallbackOrigin?: string): string {
  // 1. Explicit app URL environment variable (Highest Priority)
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (explicitUrl && explicitUrl.trim().length > 0) {
    const cleaned = explicitUrl.trim().replace(/\/+$/, '');
    return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
  }

  // 2. Vercel canonical production domain (e.g. 'get-visible-web.vercel.app')
  // Automatically injected by Vercel for all deployments in the project
  const vercelProdDomain =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProdDomain && vercelProdDomain.trim().length > 0) {
    const cleaned = vercelProdDomain.trim().replace(/\/+$/, '');
    return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
  }

  // 3. Client-side browser execution
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    // Check if the current browser origin is a Vercel preview deployment hash
    // If so, sanitize to the canonical project domain so external prospects aren't blocked by Vercel Auth
    const sanitized = sanitizeVercelPreviewOrigin(origin);
    if (sanitized) {
      return sanitized;
    }
    return origin;
  }

  // 4. Fallback request origin if provided
  if (fallbackOrigin && fallbackOrigin.trim().length > 0) {
    const sanitized = sanitizeVercelPreviewOrigin(fallbackOrigin);
    if (sanitized) {
      return sanitized;
    }
    const cleaned = fallbackOrigin.trim().replace(/\/+$/, '');
    return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
  }

  // 5. Default local development origin
  return 'http://localhost:3000';
}

/**
 * Generates the full public shareable URL for an approved website demo.
 *
 * @param publicToken Cryptographically random token assigned to the approved demo
 * @param baseUrl Optional base URL override; defaults to getAppBaseUrl()
 * @returns Fully qualified URL, e.g. 'https://get-visible-web.vercel.app/demo/8f3Kx92LmQ7w'
 */
export function getPublicDemoUrl(publicToken: string, baseUrl?: string): string {
  const base = baseUrl
    ? sanitizeVercelPreviewOrigin(baseUrl) || baseUrl.replace(/\/+$/, '')
    : getAppBaseUrl();
  return `${base}/demo/${publicToken}`;
}
