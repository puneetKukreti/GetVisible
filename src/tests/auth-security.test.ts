import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as loginPOST, DELETE as loginDELETE } from '@/app/api/auth/login/route';
import { POST as logoutPOST } from '@/app/api/auth/logout/route';
import { middleware } from '@/middleware';

describe('Solo Owner Password & Middleware Security', () => {
  const originalAdminPassword = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    process.env.ADMIN_PASSWORD = 'test-owner-password';
  });

  afterEach(() => {
    process.env.ADMIN_PASSWORD = originalAdminPassword;
  });

  describe('1. Owner Login & Logout API', () => {
    it('authenticates with correct owner password and sets 30-day HTTP-only cookie', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'test-owner-password' }),
      });

      const res = await loginPOST(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);

      const cookie = res.cookies.get('gv_owner_auth');
      expect(cookie).toBeDefined();
      expect(cookie?.value).toBe('authenticated');
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
      expect(res.cookies.get('gv_owner_auth')).toBeUndefined();
    });

    it('clears gv_owner_auth cookie on logout', async () => {
      const res = await logoutPOST();
      expect(res.status).toBe(200);

      const cookie = res.cookies.get('gv_owner_auth');
      expect(cookie).toBeDefined();
      expect(cookie?.value).toBe('');
      expect(cookie?.maxAge).toBe(0);
    });

    it('clears gv_owner_auth cookie on DELETE /api/auth/login', async () => {
      const res = await loginDELETE();
      expect(res.status).toBe(200);

      const cookie = res.cookies.get('gv_owner_auth');
      expect(cookie?.value).toBe('');
      expect(cookie?.maxAge).toBe(0);
    });
  });

  describe('2. Security Middleware Guard', () => {
    it('allows public access to /login and /api/auth/* without cookie', () => {
      const loginReq = new NextRequest('http://localhost:3000/login');
      const loginRes = middleware(loginReq);
      expect(loginRes.status).toBe(200);

      const apiAuthReq = new NextRequest('http://localhost:3000/api/auth/login');
      const apiAuthRes = middleware(apiAuthReq);
      expect(apiAuthRes.status).toBe(200);
    });

    it('allows prospects to view /demo/:token without authentication', () => {
      const demoReq = new NextRequest('http://localhost:3000/demo/sample-public-token-123');
      const demoRes = middleware(demoReq);
      expect(demoRes.status).toBe(200);
    });

    it('allows public access to public demo APIs (html, screenshot, request-changes)', () => {
      const htmlReq = new NextRequest('http://localhost:3000/api/demos/sample-token/html', { method: 'GET' });
      expect(middleware(htmlReq).status).toBe(200);

      const screenReq = new NextRequest('http://localhost:3000/api/demos/sample-token/screenshot', { method: 'GET' });
      expect(middleware(screenReq).status).toBe(200);

      const changesReq = new NextRequest('http://localhost:3000/api/demos/sample-token/request-changes', { method: 'POST' });
      expect(middleware(changesReq).status).toBe(200);
    });

    it('redirects unauthenticated user to /login when visiting protected pages', () => {
      const campaignsReq = new NextRequest('http://localhost:3000/campaigns');
      const campaignsRes = middleware(campaignsReq);
      expect(campaignsRes.status).toBe(307);
      expect(campaignsRes.headers.get('location')).toBe('http://localhost:3000/login');

      const discoveryReq = new NextRequest('http://localhost:3000/discovery');
      const discoveryRes = middleware(discoveryReq);
      expect(discoveryRes.status).toBe(307);
      expect(discoveryRes.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('returns 401 for unauthenticated calls to protected API endpoints', () => {
      const leadsApiReq = new NextRequest('http://localhost:3000/api/leads');
      const leadsApiRes = middleware(leadsApiReq);
      expect(leadsApiRes.status).toBe(401);
    });

    it('allows access to protected routes when gv_owner_auth=authenticated cookie is present', () => {
      const authedReq = new NextRequest('http://localhost:3000/campaigns', {
        headers: {
          cookie: 'gv_owner_auth=authenticated',
        },
      });
      const authedRes = middleware(authedReq);
      expect(authedRes.status).toBe(200);
    });
  });
});
