import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
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
      const authCookie = request.cookies.get('gv_owner_auth')?.value;
      if (authCookie === 'authenticated') {
        return NextResponse.redirect(new URL('/campaigns', request.url));
      }
    }
    return NextResponse.next();
  }

  // 3. Prospect-facing public demos (must remain accessible without authentication)
  if (pathname.startsWith('/demo/')) {
    return NextResponse.next();
  }

  // 4. Public demo APIs for prospect view, automated screenshots, and change requests
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

  // 5. Verify Owner Authentication Cookie for all other routes
  const authCookie = request.cookies.get('gv_owner_auth')?.value;
  const isAuthenticated = authCookie === 'authenticated';

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
