import { describe, it, expect, beforeEach } from 'vitest';
import { WebsiteDemoRepository } from '@/lib/db/repository';
import { WebsiteDemoData } from '@/types';

/**
 * Public tokens are readable brand slugs (unique column), so every second demo
 * for the same business used to crash generation with
 * "Unique constraint failed on the fields: (publicToken)".
 */
describe('Public demo token uniqueness', () => {
  const TEST_ORG = `org-token-unique-${Date.now()}`;

  beforeEach(() => {
    process.env.DEMO_MODE = 'true';
  });

  const demoFor = (
    id: string,
    businessName: string,
    publicToken?: string
  ): WebsiteDemoData =>
    ({
      id,
      leadId: `lead-${id}`,
      organizationId: TEST_ORG,
      templateId: 'BASE_TEMPLATE',
      version: 1,
      generationStatus: 'COMPLETED',
      approvalStatus: 'APPROVED',
      publicToken,
      viewCount: 0,
      theme: {},
      content: {
        brand: { businessName },
        meta: { profession: 'Car Detailing & Automobile Workshop', title: businessName },
      },
    }) as unknown as WebsiteDemoData;

  it('suffixes the token when the same business already has a demo (regeneration)', async () => {
    const first = await WebsiteDemoRepository.saveDemo(
      TEST_ORG,
      demoFor('demo-token-a1', 'Shine Motors Detailing Studio')
    );
    const second = await WebsiteDemoRepository.saveDemo(
      TEST_ORG,
      demoFor('demo-token-a2', 'Shine Motors Detailing Studio')
    );

    expect(first.publicToken).toBe('shine-motors-detailing-studio');
    expect(second.publicToken).toBe('shine-motors-detailing-studio-2');
    expect(second.publicToken).not.toBe(first.publicToken);
  });

  it('suffixes an explicitly supplied token that is already taken', async () => {
    const first = await WebsiteDemoRepository.saveDemo(
      TEST_ORG,
      demoFor('demo-token-b1', 'Verma Dental Care', 'dr-verma-clinic')
    );
    const second = await WebsiteDemoRepository.saveDemo(
      TEST_ORG,
      demoFor('demo-token-b2', 'Someone Else Clinic', 'dr-verma-clinic')
    );

    expect(first.publicToken).toBe('dr-verma-clinic');
    expect(second.publicToken).toBe('dr-verma-clinic-2');
  });

  it('keeps readable tokens for distinct businesses', async () => {
    const a = await WebsiteDemoRepository.saveDemo(
      TEST_ORG,
      demoFor('demo-token-c1', 'Alpha Pest Control')
    );
    const b = await WebsiteDemoRepository.saveDemo(
      TEST_ORG,
      demoFor('demo-token-c2', 'Beta Solar Solutions')
    );

    expect(a.publicToken).toBe('alpha-pest-control');
    expect(b.publicToken).toBe('beta-solar-solutions');
  });

  it('keeps the shared brand link working after regeneration (serves the newest approved demo)', async () => {
    const older = await WebsiteDemoRepository.saveDemo(
      TEST_ORG,
      demoFor('demo-token-d1', 'Gamma Automotive Detailing')
    );
    const newer = await WebsiteDemoRepository.saveDemo(
      TEST_ORG,
      demoFor('demo-token-d2', 'Gamma Automotive Detailing')
    );

    // The prospect's original link still resolves, and now shows the newest demo.
    const byBaseSlug = await WebsiteDemoRepository.getApprovedDemoByPublicToken(
      'gamma-automotive-detailing'
    );
    expect(byBaseSlug?.id).toBe(newer.id);

    // And the suffixed token resolves to its own demo.
    const bySuffixed = await WebsiteDemoRepository.getApprovedDemoByPublicToken(
      newer.publicToken!
    );
    expect(bySuffixed?.id).toBe(newer.id);
    expect(older.publicToken).toBe('gamma-automotive-detailing');
  });
});
