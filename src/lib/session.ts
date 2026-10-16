/**
 * Owner session token utilities.
 *
 * The single-operator workstation is unlocked with an admin password. Rather
 * than storing a forgeable static cookie value ("authenticated"), we issue an
 * HMAC-signed, expiring token that is verified both on the Edge (middleware)
 * and in Node route handlers. WebCrypto (`globalThis.crypto.subtle`) is
 * available in both runtimes, so this module stays isomorphic.
 */

export const OWNER_AUTH_COOKIE = 'gv_owner_auth';
export const OWNER_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Resolves the HMAC secret used to sign owner sessions.
 *
 * In production a real secret (>= 16 chars) MUST be supplied via AUTH_SECRET or
 * NEXTAUTH_SECRET; otherwise authentication fails closed. In non-production we
 * fall back to a fixed development secret so local dev and tests work without
 * additional configuration.
 */
function getSessionSecret(): string | null {
  const secret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '').trim();
  if (secret.length >= 16) {
    return secret;
  }
  if (process.env.NODE_ENV !== 'production') {
    return 'getvisible-dev-only-insecure-session-secret';
  }
  return null;
}

export function isOwnerAuthConfigured(): boolean {
  return getSessionSecret() !== null;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function signPayload(payloadPart: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(payloadPart));
  return base64UrlEncode(new Uint8Array(signature));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createOwnerSessionToken(
  ttlSeconds: number = OWNER_SESSION_TTL_SECONDS
): Promise<string | null> {
  const secret = getSessionSecret();
  if (!secret) return null;

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    sub: 'owner',
    role: 'ADMIN',
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
  });
  const body = base64UrlEncode(new TextEncoder().encode(payload));
  const signature = await signPayload(body, secret);
  return `${body}.${signature}`;
}

export async function verifyOwnerSessionToken(token?: string | null): Promise<boolean> {
  if (!token) return false;
  const secret = getSessionSecret();
  if (!secret) return false;

  const [body, signature] = token.split('.');
  if (!body || !signature) return false;

  const expected = await signPayload(body, secret);
  if (!timingSafeEqual(signature, expected)) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as { exp?: number };
    if (typeof payload.exp !== 'number') return false;
    if (payload.exp * 1000 < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}
