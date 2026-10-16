import { NextResponse } from 'next/server';
import { OWNER_AUTH_COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set({
    name: OWNER_AUTH_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export async function GET(request: Request) {
  const loginUrl = new URL('/login', request.url);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.set({
    name: OWNER_AUTH_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
