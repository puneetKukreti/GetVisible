import { NextRequest, NextResponse } from 'next/server';
import { OWNER_AUTH_COOKIE, verifyOwnerSessionToken } from '@/lib/session';

/**
 * Static asset extensions that may be served without an owner session.
 *
 * SECURITY: this is an explicit allowlist. Never gate public assets on a blanket
 * `pathname.includes('.')` check — that lets ANY dotted path (for example
 * `/api/leads/<id>.png` or `/api/demos/<id>.png`) skip authentication entirely
 * and execute a mutating route handler unauthenticated.
 */
const PUBLIC_ASSET_EXTENSION_RE =
  /\.(?:png|jpe?g|gif|svg|ico|webp|avif|bmp|css|js|mjs|map|txt|xml|webmanifest|woff2?|ttf|otf|eot|pdf)$/i;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const isApiRoute = pathname.startsWith('/api/');

  // 1. Next.js internals are always public.
  if (pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // 2. Public static assets. Deliberately scoped to NON-API paths so that a
  //    dotted API path can never bypass authentication.
  if (
    !isApiRoute &&
    (pathname.startsWith('/demo-templates') || PUBLIC_ASSET_EXTENSION_RE.test(pathname))
  ) {
    return NextResponse.next();
  }

  // 3. Authentication routes.
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    // If already authenticated and trying to access /login, redirect to /campaigns
    if (pathname === '/login') {
      const authCookie = request.cookies.get(OWNER_AUTH_COOKIE)?.value;
      if (await verifyOwnerSessionToken(authCookie)) {
        return NextResponse.redirect(new URL('/campaigns', request.url));
      }
    }
    return NextResponse.next();
  }

  // 4. Retention cron endpoint (self-authenticated via CRON_SECRET in the route).
  if (pathname.startsWith('/api/cron')) {
    return NextResponse.next();
  }

  // 5. Public marketing pages (no owner session required).
  if (pathname === '/pricing') {
    return NextResponse.next();
  }

  // 6. Prospect-facing public demos (must remain accessible without authentication).
  if (pathname.startsWith('/demo/')) {
    return NextResponse.next();
  }

  // 7. Public demo APIs: read-only GETs for prospect rendering/screenshots, plus
  //    prospect change requests. Every other /api/** route requires the session.
  if (pathname !== '/api/demos' && pathname.startsWith('/api/demos/')) {
    if (method === 'GET') {
      return NextResponse.next();
    }
    if (method === 'POST' && pathname.endsWith('/request-changes')) {
      return NextResponse.next();
    }
  }

  // 8. Verify the signed owner session token for all other routes.
  const authCookie = request.cookies.get(OWNER_AUTH_COOKIE)?.value;
  const isAuthenticated = await verifyOwnerSessionToken(authCookie);

  if (!isAuthenticated) {
    // Return 401 for protected API requests
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Unauthorized: Owner authentication required' },
        { status: 401 }
      );
    }

    // Redirect protected page requests to /login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
