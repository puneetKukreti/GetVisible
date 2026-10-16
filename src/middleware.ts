import { NextRequest, NextResponse } from 'next/server';
import { OWNER_AUTH_COOKIE, verifyOwnerSessionToken } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // 1. Static assets and Next.js internals are always public
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/demo-templates') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Authentication routes
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

  // 3. Public marketing pages (no owner session required)
  if (pathname === '/pricing') {
    return NextResponse.next();
  }

  // 4. Prospect-facing public demos (must remain accessible without authentication)
  if (pathname.startsWith('/demo/')) {
    return NextResponse.next();
  }

  // 5. Public demo APIs for prospect view, automated screenshots, and change requests
  //    Matches: /api/demos/:id/html, /api/demos/:id/screenshot, /api/demos/:id, /api/demos/:id/request-changes
  if (pathname.startsWith('/api/demos/') && pathname !== '/api/demos') {
    // Allow all GET requests to demo details/html/screenshots
    if (method === 'GET') {
      return NextResponse.next();
    }
    // Allow prospect change requests
    if (method === 'POST' && pathname.endsWith('/request-changes')) {
      return NextResponse.next();
    }
  }

  // 6. Verify the signed owner session token for all other routes
  const authCookie = request.cookies.get(OWNER_AUTH_COOKIE)?.value;
  const isAuthenticated = await verifyOwnerSessionToken(authCookie);

  if (!isAuthenticated) {
    // Return 401 for protected API requests
    if (pathname.startsWith('/api/')) {
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
