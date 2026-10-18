import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, getClientIp, resetRateLimits } from '@/lib/rate-limit';

describe('In-memory rate limiter', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('allows hits up to the limit and then blocks within the window', () => {
    for (let i = 0; i < 5; i += 1) {
      expect(checkRateLimit('prospect:demo-1', 5, 60_000).limited).toBe(false);
    }

    const blocked = checkRateLimit('prospect:demo-1', 5, 60_000);
    expect(blocked.limited).toBe(true);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('tracks each key independently', () => {
    for (let i = 0; i < 5; i += 1) checkRateLimit('ip-a:demo-1', 5, 60_000);

    expect(checkRateLimit('ip-a:demo-1', 5, 60_000).limited).toBe(true);
    expect(checkRateLimit('ip-b:demo-1', 5, 60_000).limited).toBe(false);
    expect(checkRateLimit('ip-a:demo-2', 5, 60_000).limited).toBe(false);
  });

  it('expires entries once the window has elapsed', () => {
    const window = 20;
    expect(checkRateLimit('short:demo-1', 1, window).limited).toBe(false);
    expect(checkRateLimit('short:demo-1', 1, window).limited).toBe(true);

    const start = Date.now();
    while (Date.now() - start < window + 10) {
      // Busy-wait past the window so the next hit is treated as a fresh one.
    }

    expect(checkRateLimit('short:demo-1', 1, window).limited).toBe(false);
  });

  it('derives the client IP from forwarding headers with a safe fallback', () => {
    const withForwarded = {
      headers: { get: (name: string) => (name === 'x-forwarded-for' ? '203.0.113.9, 10.0.0.1' : null) },
    };
    expect(getClientIp(withForwarded)).toBe('203.0.113.9');

    const withRealIp = {
      headers: { get: (name: string) => (name === 'x-real-ip' ? '198.51.100.4' : null) },
    };
    expect(getClientIp(withRealIp)).toBe('198.51.100.4');

    const withoutHeaders = { headers: { get: () => null } };
    expect(getClientIp(withoutHeaders)).toBe('unknown');
  });
});
