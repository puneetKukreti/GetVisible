import { describe, it, expect, beforeEach } from 'vitest';
import { WebsiteDemoRepository } from '@/lib/db/repository';
import {
  isDemoExpired,
  getDemoExpiresAt,
  DEMO_PUBLIC_TTL_DAYS,
  DEMO_PUBLIC_TTL_MS,
} from '@/lib/demos/public';
import { WebsiteDemoData } from '@/types';

const DAY = 24 * 60 * 60 * 1000;
const TEST_ORG = `org-retention-${Date.now()}`;

function makeDemo(overrides: Partial<WebsiteDemoData> = {}): WebsiteDemoData {
  const id = overrides.id || `demo-${Math.random().toString(36).slice(2, 10)}`;
  return {
    id,
    leadId: overrides.leadId || `lead-${id}`,
    organizationId: TEST_ORG,
    templateId: 'design-1-premium',
    version: 1,
    generationStatus: 'COMPLETED',
    approvalStatus: 'APPROVED',
    publicToken: overrides.publicToken || `token-${id}`,
    viewCount: 0,
    theme: {
      id: 'executive-navy',
      name: 'Executive Navy',
      primaryColor: '#1e3a8a',
      secondaryColor: '#1e293b',
      accentColor: '#2563eb',
      fontFamily: 'sans',
      style: 'corporate',
      borderRadius: 'md',
    } as never,
    content: {
      brand: { businessName: 'Retention Test Practice' },
      meta: { profession: 'Chartered Accountant' },
    } as never,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Regression suite for the demo-link retention policy: a shared prospect demo
 * link never expires from being refreshed; it disappears only on manual delete
 * or once the 3-day public TTL has elapsed.
 */
describe('Demo link retention (3-day TTL)', () => {
  beforeEach(() => {
    process.env.DEMO_MODE = 'true';
  });

  it('isDemoExpired: false inside the window, true past it, safe on empty input', () => {
    const now = Date.now();
    expect(isDemoExpired({ createdAt: new Date(now - DAY).toISOString() }, now)).toBe(false);
    expect(
      isDemoExpired({ createdAt: new Date(now - (DEMO_PUBLIC_TTL_DAYS - 0.5) * DAY).toISOString() }, now)
    ).toBe(false);
    expect(
      isDemoExpired({ createdAt: new Date(now - (DEMO_PUBLIC_TTL_DAYS + 1) * DAY).toISOString() }, now)
    ).toBe(true);
    expect(isDemoExpired(null)).toBe(false);
    expect(isDemoExpired({ createdAt: null })).toBe(false);
  });

  it('getDemoExpiresAt equals createdAt + TTL', () => {
    const created = '2026-01-01T00:00:00.000Z';
    const expected = new Date(new Date(created).getTime() + DEMO_PUBLIC_TTL_MS).toISOString();
    expect(getDemoExpiresAt(created)).toBe(expected);
  });

  it('a fresh demo link keeps working and stays listed', async () => {
    const saved = await WebsiteDemoRepository.saveDemo(TEST_ORG, makeDemo({ id: 'fresh-1' }));

    const resolved = await WebsiteDemoRepository.getApprovedDemoByPublicToken(saved.publicToken!);
    expect(resolved).not.toBeNull();

    const listed = await WebsiteDemoRepository.listDemos(TEST_ORG);
    expect(listed.some((d) => d.id === 'fresh-1')).toBe(true);
  });

  it('an expired demo link stops working and is hidden from lists', async () => {
    await WebsiteDemoRepository.saveDemo(
      TEST_ORG,
      makeDemo({
        id: 'expired-1',
        publicToken: 'expired-token-1',
        createdAt: new Date(Date.now() - (DEMO_PUBLIC_TTL_DAYS + 1) * DAY).toISOString(),
      })
    );

    const listed = await WebsiteDemoRepository.listDemos(TEST_ORG);
    expect(listed.some((d) => d.id === 'expired-1')).toBe(false);

    const resolved = await WebsiteDemoRepository.getApprovedDemoByPublicToken('expired-token-1');
    expect(resolved).toBeNull();
  });

  it('pruneExpiredDemos physically deletes demos past the TTL and keeps fresh ones', async () => {
    await WebsiteDemoRepository.saveDemo(
      TEST_ORG,
      makeDemo({
        id: 'prune-expired',
        createdAt: new Date(Date.now() - (DEMO_PUBLIC_TTL_DAYS + 2) * DAY).toISOString(),
      })
    );
    await WebsiteDemoRepository.saveDemo(TEST_ORG, makeDemo({ id: 'prune-fresh' }));

    const removed = await WebsiteDemoRepository.pruneExpiredDemos();
    expect(removed).toBeGreaterThanOrEqual(1);

    expect(await WebsiteDemoRepository.getDemo(TEST_ORG, 'prune-expired')).toBeNull();
    expect(await WebsiteDemoRepository.getDemo(TEST_ORG, 'prune-fresh')).not.toBeNull();
  });
});
