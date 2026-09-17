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
 * Resolves the application base URL dynamically for both local development and production/Vercel.
 *
 * Priority order:
 * 1. NEXT_PUBLIC_APP_URL (Explicit production origin, e.g. 'https://getvisible.ai')
 * 2. NEXT_PUBLIC_VERCEL_URL / VERCEL_URL (Auto-injected by Vercel deployment)
 * 3. window.location.origin (Browser client-side execution)
 * 4. Fallback: 'http://localhost:3000' (Local development default)
 */
export function getAppBaseUrl(): string {
  // 1. Explicit app URL environment variable
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (explicitUrl && explicitUrl.trim().length > 0) {
    return explicitUrl.trim().replace(/\/+$/, '');
  }

  // 2. Vercel deployment URL (always HTTPS on Vercel)
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim().length > 0) {
    const cleaned = vercelUrl.trim().replace(/\/+$/, '');
    return cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
  }

  // 3. Client-side browser execution
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // 4. Default local development origin
  return 'http://localhost:3000';
}

/**
 * Generates the full public shareable URL for an approved website demo.
 *
 * @param publicToken Cryptographically random token assigned to the approved demo
 * @param baseUrl Optional base URL override; defaults to getAppBaseUrl()
 * @returns Fully qualified URL, e.g. 'https://getvisible.ai/demo/8f3Kx92LmQ7w'
 */
export function getPublicDemoUrl(publicToken: string, baseUrl?: string): string {
  const base = baseUrl ? baseUrl.replace(/\/+$/, '') : getAppBaseUrl();
  return `${base}/demo/${publicToken}`;
}
