import { describe, it, expect, beforeEach } from 'vitest';
import { LeadRepository, WebsiteDemoRepository } from '@/lib/db/repository';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';
import {
  generatePublicDemoToken,
  getAppBaseUrl,
  getPublicDemoUrl,
  sanitizeVercelPreviewOrigin,
} from '@/lib/demos/public';
import { WebsiteDemoData } from '@/types';

describe('Public Shareable Website Demos & Security Gate', () => {
  const TEST_ORG = `org-public-demo-${Date.now()}`;

  beforeEach(() => {
    process.env.DEMO_MODE = 'true';
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
    delete process.env.VERCEL_URL;
  });

  const createMockDemo = (
    overrides: Partial<WebsiteDemoData> = {}
  ): WebsiteDemoData => ({
    id: `demo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    leadId: `lead-${Date.now()}`,
    organizationId: TEST_ORG,
    templateId: 'CA_ACCOUNTING_PROFESSIONAL',
    version: 1,
    generationStatus: 'COMPLETED',
    approvalStatus: 'PENDING_REVIEW',
    publicToken: generatePublicDemoToken(),
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
    },
    content: {
      theme: {
        id: 'executive-navy',
        name: 'Executive Navy',
        primaryColor: '#1e3a8a',
        secondaryColor: '#1e293b',
        accentColor: '#2563eb',
        fontFamily: 'sans',
        style: 'corporate',
        borderRadius: 'md',
      },
      meta: {
        title: 'Verma & Co Chartered Accountants | Gurgaon',
        description: 'Statutory audit, taxation and corporate advisory practice.',
        profession: 'Chartered Accountant',
        templateId: 'CA_ACCOUNTING_PROFESSIONAL',
      },
      brand: {
        businessName: 'Verma & Co Chartered Accountants',
        tagline: 'Precision Accounting and Advisory',
        provenance: 'VERIFIED_LEAD',
      },
      navigation: {
        items: [{ label: 'Home', href: '#hero' }],
        ctaText: 'Contact Us',
        ctaHref: '#contact',
      },
      hero: {
        badge: 'Chartered Accountants',
        headline: 'Financial Clarity for Modern Enterprises',
        subheadline: 'Full-service audit, corporate tax, and GST compliance advisory in Gurgaon.',
        primaryCta: { label: 'Consult Now', href: '#contact' },
        secondaryCta: { label: 'View Practice Areas', href: '#services' },
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      about: {
        title: 'About Our Firm',
        leadParagraph: 'Serving corporate and mid-market firms across NCR.',
        body: 'Over a decade of statutory compliance leadership.',
        highlights: [],
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      services: {
        sectionTitle: 'Our Services',
        sectionSubtitle: 'Statutory audit and tax planning',
        items: [],
      },
      whyChooseUs: {
        sectionTitle: 'Why Choose Us',
        sectionSubtitle: 'Uncompromising integrity',
        points: [],
      },
      industries: { enabled: false, sectionTitle: '', items: [] },
      testimonials: { enabled: false, sectionTitle: '', items: [] },
      faq: { sectionTitle: '', items: [] },
      contact: {
        sectionTitle: 'Contact Us',
        sectionSubtitle: 'Get in touch',
        formTitle: 'Message',
        simulatedDisclaimer: 'Demo only',
        publicEmail: 'contact@verma-ca.example',
        publicPhone: '+91-124-5550199',
        ctaSubmitText: 'Send',
      },
      location: {
        address: 'Golf Course Road, Gurgaon',
        city: 'Gurgaon',
        officeHours: 'Mon-Fri 9-6',
        mapPlaceholder: true,
      },
      footer: {
        copyright: '© 2026 Verma & Co.',
        disclaimer: 'Personalized demonstration concept.',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  // Test 1: Approved demo -> public URL works
  it('1. Approved demo: public URL works and returns demo data', async () => {
    const rawDemo = createMockDemo({ approvalStatus: 'APPROVED' });
    const saved = await WebsiteDemoRepository.saveDemo(TEST_ORG, rawDemo);

    expect(saved.publicToken).toBeDefined();
    expect(saved.approvalStatus).toBe('APPROVED');

    // Fetch by public token
    const publicDemo = await WebsiteDemoRepository.getApprovedDemoByPublicToken(saved.publicToken!);
    expect(publicDemo).not.toBeNull();
    expect(publicDemo!.id).toBe(saved.id);
    expect(publicDemo!.content.brand.businessName).toBe('Verma & Co Chartered Accountants');
  });

  // Test 2: Pending demo -> public URL rejected
  it('2. Pending demo: public URL is rejected (returns null / 404)', async () => {
    const pendingDemo = createMockDemo({ approvalStatus: 'PENDING_REVIEW' });
    const saved = await WebsiteDemoRepository.saveDemo(TEST_ORG, pendingDemo);

    expect(saved.publicToken).toBeDefined();
    expect(saved.approvalStatus).toBe('PENDING_REVIEW');

    // Attempt to access via public token
    const result = await WebsiteDemoRepository.getApprovedDemoByPublicToken(saved.publicToken!);
    expect(result).toBeNull();
  });

  // Test 3: Rejected demo -> public URL rejected
  it('3. Rejected demo: public URL is rejected (returns null / 404)', async () => {
    const rawDemo = createMockDemo({ approvalStatus: 'APPROVED' });
    const saved = await WebsiteDemoRepository.saveDemo(TEST_ORG, rawDemo);

    // Now explicitly reject the demo
    const lead = await LeadRepository.createLead(
      { id: saved.leadId, businessName: 'Test CA Firm' },
      TEST_ORG,
      'Specialist'
    );
    await WebsiteDemoRepository.rejectDemo(TEST_ORG, saved.id, 'Layout revision requested', 'Specialist');

    // Attempt to access via public token
    const result = await WebsiteDemoRepository.getApprovedDemoByPublicToken(saved.publicToken!);
    expect(result).toBeNull();
  });

  // Test 4: Invalid token -> 404 (returns null)
  it('4. Invalid token returns null (404)', async () => {
    const nonExistent = await WebsiteDemoRepository.getApprovedDemoByPublicToken('invalid-token-xyz123');
    expect(nonExistent).toBeNull();

    const empty = await WebsiteDemoRepository.getApprovedDemoByPublicToken('');
    expect(empty).toBeNull();
  });

  // Test 5: Public page does not expose internal CRM lead data
  it('5. Public demo structure does not expose internal CRM data', async () => {
    const rawDemo = createMockDemo({ approvalStatus: 'APPROVED' });
    const saved = await WebsiteDemoRepository.saveDemo(TEST_ORG, rawDemo);

    const publicDemo = await WebsiteDemoRepository.getApprovedDemoByPublicToken(saved.publicToken!);
    expect(publicDemo).not.toBeNull();

    // The content payload rendered for the prospect has NO internal sales fields
    const content = publicDemo!.content;
    expect((content as any).internalNotes).toBeUndefined();
    expect((content as any).opportunityScore).toBeUndefined();
    expect((content as any).leadStatus).toBeUndefined();
    expect((content as any).organizationId).toBeUndefined();
    expect((content as any).suppressionRecords).toBeUndefined();
    expect((content as any).auditLogs).toBeUndefined();
  });

  // Test 6: Public token cannot be used to access another demo (1-to-1 strict mapping)
  it('6. Public token maps strictly 1-to-1 and cannot access another demo', async () => {
    const demoA = createMockDemo({
      approvalStatus: 'APPROVED',
      content: { ...createMockDemo().content, brand: { businessName: 'Firm Alpha CA', tagline: '', provenance: 'VERIFIED_LEAD' } },
    });
    const demoB = createMockDemo({
      approvalStatus: 'APPROVED',
      content: { ...createMockDemo().content, brand: { businessName: 'Firm Beta CA', tagline: '', provenance: 'VERIFIED_LEAD' } },
    });

    const savedA = await WebsiteDemoRepository.saveDemo(TEST_ORG, demoA);
    const savedB = await WebsiteDemoRepository.saveDemo(TEST_ORG, demoB);

    expect(savedA.publicToken).not.toBe(savedB.publicToken);

    // Querying token A must return ONLY demo A
    const resultA = await WebsiteDemoRepository.getApprovedDemoByPublicToken(savedA.publicToken!);
    expect(resultA).not.toBeNull();
    expect(resultA!.id).toBe(savedA.id);
    expect(resultA!.content.brand.businessName).toBe('Firm Alpha CA');

    // Querying token B must return ONLY demo B
    const resultB = await WebsiteDemoRepository.getApprovedDemoByPublicToken(savedB.publicToken!);
    expect(resultB).not.toBeNull();
    expect(resultB!.id).toBe(savedB.id);
    expect(resultB!.content.brand.businessName).toBe('Firm Beta CA');
  });

  // Test 7: Base URL resolution for local development and Vercel/production
  it('7. getPublicDemoUrl generates correct URLs for local, production, and sanitizes preview hashes', () => {
    const token = '8f3Kx92LmQ7w';

    // 1. Default local development fallback
    expect(getAppBaseUrl()).toBe('http://localhost:3000');
    expect(getPublicDemoUrl(token)).toBe('http://localhost:3000/demo/8f3Kx92LmQ7w');

    // 2. Explicit production URL via NEXT_PUBLIC_APP_URL
    process.env.NEXT_PUBLIC_APP_URL = 'https://get-visible-web.vercel.app';
    expect(getAppBaseUrl()).toBe('https://get-visible-web.vercel.app');
    expect(getPublicDemoUrl(token)).toBe('https://get-visible-web.vercel.app/demo/8f3Kx92LmQ7w');
    // Must NOT contain any Vercel deployment hashes
    expect(getPublicDemoUrl(token)).not.toContain('-b64ejegts-');
    expect(getPublicDemoUrl(token)).not.toContain('-projects.vercel.app');

    // 3. Vercel project canonical production domain fallback
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'get-visible-web.vercel.app';
    expect(getAppBaseUrl()).toBe('https://get-visible-web.vercel.app');
    expect(getPublicDemoUrl(token)).toBe('https://get-visible-web.vercel.app/demo/8f3Kx92LmQ7w');

    // 4. Preview deployment hash detection & sanitization
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    const previewOrigin = 'https://get-visible-b64ejegts-puneetkukretis-projects.vercel.app';
    const sanitized = sanitizeVercelPreviewOrigin(previewOrigin);
    expect(sanitized).toBe('https://get-visible.vercel.app');

    // Fallback origin with preview hash gets sanitized automatically
    expect(getAppBaseUrl(previewOrigin)).toBe('https://get-visible.vercel.app');
    expect(getPublicDemoUrl(token, previewOrigin)).toBe('https://get-visible.vercel.app/demo/8f3Kx92LmQ7w');
  });

  // Test 8: Demo view event is recorded
  it('8. Demo view event is recorded on public opening (increments count & creates activity)', async () => {
    const lead = await LeadRepository.createLead(
      { businessName: 'Chopra & Co CA', leadStatus: 'QUALIFIED' },
      TEST_ORG,
      'Specialist'
    );

    const demo = createMockDemo({
      leadId: lead.id,
      approvalStatus: 'APPROVED',
      viewCount: 0,
    });
    const saved = await WebsiteDemoRepository.saveDemo(TEST_ORG, demo);

    expect(saved.viewCount).toBe(0);

    // Prospect opens the public demo
    await WebsiteDemoRepository.recordPublicDemoView(saved.id, TEST_ORG);

    // Verify view count incremented
    const updatedDemo = await WebsiteDemoRepository.getDemo(TEST_ORG, saved.id);
    expect(updatedDemo?.viewCount).toBe(1);
    expect(updatedDemo?.firstViewedAt).toBeDefined();
    expect(updatedDemo?.lastViewedAt).toBeDefined();

    // Verify DEMO_VIEW activity was logged on the lead
    const updatedLead = await LeadRepository.getLeadById(lead.id, TEST_ORG);
    expect(updatedLead?.activities).toBeDefined();
    const viewActivity = updatedLead?.activities?.find((a) => a.type === 'DEMO_VIEW');
    expect(viewActivity).toBeDefined();
    expect(viewActivity?.title).toBe('Public Demo Viewed');
    expect((viewActivity?.metadata as any)?.publicToken).toBe(saved.publicToken);
  });

  // Test 9: Existing seed demo in demo organization has an approved public token
  it('9. Existing seed demo in demo organization has an approved public token', async () => {
    const seedDemos = await WebsiteDemoRepository.listDemos(DEMO_ORGANIZATION_ID);
    const demo003 = seedDemos.find((d) => d.id === 'demo-lead-003-v1');

    expect(demo003).toBeDefined();
    expect(demo003?.approvalStatus).toBe('APPROVED');
    expect(demo003?.publicToken).toBe('demo-public-003');

    // Public route lookup succeeds
    const publicSeed = await WebsiteDemoRepository.getApprovedDemoByPublicToken('demo-public-003');
    expect(publicSeed).not.toBeNull();
    expect(publicSeed?.content.brand.businessName).toBe('Example Accounting Services');
  });

  // Test 10: Complete Security Lifecycle Gate
  // approved demo -> anonymous access works
  // pending demo -> blocked
  // rejected demo -> blocked
  // invalid token -> 404
  // internal dashboard -> protected
  // another demo cannot be accessed by manipulating the token
  it('10. Complete security gate: approved works anonymously, pending/rejected blocked, internal protected', async () => {
    // 1. Create a lead and an approved demo
    const lead = await LeadRepository.createLead(
      { businessName: 'Mittal & Associates CA', leadStatus: 'QUALIFIED' },
      TEST_ORG,
      'Specialist'
    );
    const approvedDemo = await WebsiteDemoRepository.saveDemo(
      TEST_ORG,
      createMockDemo({
        leadId: lead.id,
        approvalStatus: 'APPROVED',
        content: {
          ...createMockDemo().content,
          brand: { businessName: 'Mittal & Associates', tagline: 'Audit & Tax', provenance: 'VERIFIED_LEAD' },
        },
      })
    );

    // 2. Approved demo -> anonymous access works without any orgId or auth session
    const anonymousAccess = await WebsiteDemoRepository.getApprovedDemoByPublicToken(approvedDemo.publicToken!);
    expect(anonymousAccess).not.toBeNull();
    expect(anonymousAccess?.id).toBe(approvedDemo.id);

    // 3. Pending demo -> blocked (returns null -> 404)
    const pendingDemo = await WebsiteDemoRepository.saveDemo(
      TEST_ORG,
      createMockDemo({
        leadId: lead.id,
        approvalStatus: 'PENDING_REVIEW',
      })
    );
    const pendingAccess = await WebsiteDemoRepository.getApprovedDemoByPublicToken(pendingDemo.publicToken!);
    expect(pendingAccess).toBeNull();

    // 4. Rejected demo -> blocked (returns null -> 404)
    const rejectedDemo = await WebsiteDemoRepository.saveDemo(
      TEST_ORG,
      createMockDemo({
        leadId: lead.id,
        approvalStatus: 'REJECTED',
      })
    );
    const rejectedAccess = await WebsiteDemoRepository.getApprovedDemoByPublicToken(rejectedDemo.publicToken!);
    expect(rejectedAccess).toBeNull();

    // 5. Invalid token -> 404 (returns null)
    expect(await WebsiteDemoRepository.getApprovedDemoByPublicToken('fabricated-random-token')).toBeNull();
    expect(await WebsiteDemoRepository.getApprovedDemoByPublicToken('../admin')).toBeNull();

    // 6. Token manipulation: Tampered token cannot access any approved demo
    const tamperedToken = approvedDemo.publicToken!.slice(0, -2) + 'XX';
    expect(await WebsiteDemoRepository.getApprovedDemoByPublicToken(tamperedToken)).toBeNull();

    // 7. Internal CRM data isolation: internal leads table requires valid organizationId
    await expect(LeadRepository.listLeads('', {})).rejects.toThrow('organizationId is required');
  });
});
