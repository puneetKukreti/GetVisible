import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as loginPOST, DELETE as loginDELETE } from '@/app/api/auth/login/route';
import { POST as logoutPOST } from '@/app/api/auth/logout/route';
import { middleware } from '@/middleware';
import {
  createOwnerSessionToken,
  verifyOwnerSessionToken,
  OWNER_AUTH_COOKIE,
} from '@/lib/session';

describe('Solo Owner Password & Middleware Security', () => {
  const originalAdminPassword = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    process.env.ADMIN_PASSWORD = 'test-owner-password';
  });

  afterEach(() => {
    process.env.ADMIN_PASSWORD = originalAdminPassword;
  });

  describe('1. Owner Login & Logout API', () => {
    it('authenticates with correct owner password and sets a signed 30-day HTTP-only cookie', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'test-owner-password' }),
      });

      const res = await loginPOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);

      const cookie = res.cookies.get(OWNER_AUTH_COOKIE);
      expect(cookie).toBeDefined();
      expect(cookie?.value).not.toBe('authenticated');
      expect(await verifyOwnerSessionToken(cookie?.value)).toBe(true);
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.maxAge).toBe(30 * 24 * 60 * 60);
    });

    it('rejects incorrect owner password with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'wrongpassword' }),
      });

      const res = await loginPOST(req);
      expect(res.status).toBe(401);

      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid owner password');
      expect(res.cookies.get(OWNER_AUTH_COOKIE)).toBeUndefined();
    });

    it('fails closed with 503 when ADMIN_PASSWORD is not configured', async () => {
      const previous = process.env.ADMIN_PASSWORD;
      delete process.env.ADMIN_PASSWORD;

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'anything-at-all' }),
      });

      const res = await loginPOST(req);
      expect(res.status).toBe(503);

      process.env.ADMIN_PASSWORD = previous;
    });

    it('clears gv_owner_auth cookie on logout', async () => {
      const res = await logoutPOST();
      expect(res.status).toBe(200);

      const cookie = res.cookies.get(OWNER_AUTH_COOKIE);
      expect(cookie).toBeDefined();
      expect(cookie?.value).toBe('');
      expect(cookie?.maxAge).toBe(0);
    });

    it('clears gv_owner_auth cookie on DELETE /api/auth/login', async () => {
      const res = await loginDELETE();
      expect(res.status).toBe(200);

      const cookie = res.cookies.get(OWNER_AUTH_COOKIE);
      expect(cookie?.value).toBe('');
      expect(cookie?.maxAge).toBe(0);
    });
  });

  describe('2. Security Middleware Guard', () => {
    it('allows public access to /login and /api/auth/* without cookie', async () => {
      expect((await middleware(new NextRequest('http://localhost:3000/login'))).status).toBe(200);
      expect((await middleware(new NextRequest('http://localhost:3000/api/auth/login'))).status).toBe(200);
    });

    it('allows public access to the /pricing marketing page', async () => {
      expect((await middleware(new NextRequest('http://localhost:3000/pricing'))).status).toBe(200);
    });

    it('allows prospects to view /demo/:token without authentication', async () => {
      const demoRes = await middleware(new NextRequest('http://localhost:3000/demo/sample-public-token-123'));
      expect(demoRes.status).toBe(200);
    });

    it('allows public access to public demo APIs (html, screenshot, request-changes)', async () => {
      expect(
        (await middleware(new NextRequest('http://localhost:3000/api/demos/sample-token/html', { method: 'GET' }))).status
      ).toBe(200);

      expect(
        (await middleware(new NextRequest('http://localhost:3000/api/demos/sample-token/screenshot', { method: 'GET' })))
          .status
      ).toBe(200);

      expect(
        (await middleware(
          new NextRequest('http://localhost:3000/api/demos/sample-token/request-changes', { method: 'POST' })
        )).status
      ).toBe(200);
    });

    it('redirects unauthenticated user to /login when visiting protected pages', async () => {
      const campaignsRes = await middleware(new NextRequest('http://localhost:3000/campaigns'));
      expect(campaignsRes.status).toBe(307);
      expect(campaignsRes.headers.get('location')).toBe('http://localhost:3000/login');

      const discoveryRes = await middleware(new NextRequest('http://localhost:3000/discovery'));
      expect(discoveryRes.status).toBe(307);
      expect(discoveryRes.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('returns 401 for unauthenticated calls to protected API endpoints', async () => {
      const leadsApiRes = await middleware(new NextRequest('http://localhost:3000/api/leads'));
      expect(leadsApiRes.status).toBe(401);
    });

    it('rejects a forged static gv_owner_auth=authenticated cookie', async () => {
      const forgedRes = await middleware(
        new NextRequest('http://localhost:3000/campaigns', {
          headers: { cookie: `${OWNER_AUTH_COOKIE}=authenticated` },
        })
      );
      expect(forgedRes.status).toBe(307);
      expect(forgedRes.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('allows access to protected routes with a valid signed session token', async () => {
      const token = await createOwnerSessionToken();
      expect(token).toBeTruthy();

      const authedRes = await middleware(
        new NextRequest('http://localhost:3000/campaigns', {
          headers: { cookie: `${OWNER_AUTH_COOKIE}=${token}` },
        })
      );
      expect(authedRes.status).toBe(200);
    });
  });
});
