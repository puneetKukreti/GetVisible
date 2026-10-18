import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  createOwnerSessionToken,
  isOwnerAuthConfigured,
  OWNER_AUTH_COOKIE,
  OWNER_SESSION_TTL_SECONDS,
} from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * Constant-time password comparison.
 *
 * Both values are hashed first so the comparison neither leaks length nor
 * short-circuits on the first differing character.
 */
function safeCompare(candidate: string, expected: string): boolean {
  const candidateHash = crypto.createHash('sha256').update(candidate, 'utf8').digest();
  const expectedHash = crypto.createHash('sha256').update(expected, 'utf8').digest();
  return crypto.timingSafeEqual(candidateHash, expectedHash);
}

const MAX_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

interface AttemptWindow {
  count: number;
  firstAt: number;
}

// In-memory, per-instance throttle. Good enough to stop trivial password
// brute-forcing on a single operator workstation. For multi-instance
// deployments back this with Redis/KV.
const globalForAuth = globalThis as unknown as { __gvLoginAttempts?: Map<string, AttemptWindow> };
const attemptStore = (globalForAuth.__gvLoginAttempts ??= new Map<string, AttemptWindow>());

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attemptStore.get(key);
  if (!entry || now - entry.firstAt > ATTEMPT_WINDOW_MS) {
    attemptStore.set(key, { count: 1, firstAt: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

function clearAttempts(key: string): void {
  attemptStore.delete(key);
}

function setAuthCookie(response: NextResponse, value: string, maxAge: number): void {
  response.cookies.set({
    name: OWNER_AUTH_COOKIE,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

export async function POST(request: NextRequest) {
  try {
    const key = clientKey(request);
    if (isRateLimited(key)) {
      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const password = typeof body?.password === 'string' ? body.password : '';

    // Fail closed: no default/placeholder password is ever accepted.
    const expectedPassword = (process.env.ADMIN_PASSWORD || '').trim();
    if (!expectedPassword || expectedPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Owner access is not configured on this server. Set ADMIN_PASSWORD (minimum 8 characters) in the environment and restart the app.',
        },
        { status: 503 }
      );
    }

    if (!password || !safeCompare(password, expectedPassword)) {
      return NextResponse.json(
        { success: false, error: 'Invalid owner password' },
        { status: 401 }
      );
    }

    if (!isOwnerAuthConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Server session secret is not configured.' },
        { status: 503 }
      );
    }

    const token = await createOwnerSessionToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unable to establish an owner session.' },
        { status: 503 }
      );
    }

    clearAttempts(key);

    const response = NextResponse.json({ success: true });
    setAuthCookie(response, token, OWNER_SESSION_TTL_SECONDS);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  setAuthCookie(response, '', 0);
  return response;
}
