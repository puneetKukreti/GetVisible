import { NextRequest, NextResponse } from 'next/server';
import { OWNER_AUTH_COOKIE, verifyOwnerSessionToken } from './session';

/**
 * Defence-in-depth guard for mutating / PII API route handlers.
 *
 * The edge middleware already rejects unauthenticated requests, but a route
 * handler must never rely on that alone: a matcher change, a rewrite, a proxy
 * bug or a future dotted-path edge case would otherwise expose the handler.
 * Every non-public API route calls this first and returns the 401 it produces.
 *
 * Note: `getResolvedOrganizationId()` always resolves to a default workspace in
 * production, so the usual `if (!orgId) return 401` check can never fail. This
 * guard is what actually enforces authentication inside the handler.
 */
export async function requireOwnerSession(
  request: NextRequest
): Promise<NextResponse | null> {
  const token = request.cookies.get(OWNER_AUTH_COOKIE)?.value;
  if (await verifyOwnerSessionToken(token)) {
    return null;
  }
  return NextResponse.json(
    { error: 'Unauthorized: Owner authentication required' },
    { status: 401 }
  );
}
