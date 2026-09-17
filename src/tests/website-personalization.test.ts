import { describe, it, expect, vi } from 'vitest';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import { selectWebsiteDesign, CA_LAYOUTS, hashLeadIdentifier } from '@/lib/demos/personalization';
import { THEMES } from '@/lib/demos/templates';
import { WebsiteContentSchema, WebsiteDesignSchema } from '@/lib/demos/schema';
import { GeminiAIProvider } from '@/lib/providers/ai.provider';
import { LeadData } from '@/types';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';

describe('Phase 4.1: Dynamic Website Personalization & Visual Variation', () => {
  const leadGurugramA: LeadData = {
    id: 'lead-gurugram-001',
    businessName: 'Vikas Singhal & Co CA',
    profession: 'Chartered Accountant',
    city: 'Gurugram',
    address: 'DLF Cyber City, Phase 2, Gurugram, Haryana 122002',
    website: null,
    publicEmail: 'contact@singhalca.example',
    publicPhone: '+91-124-4001122',
    source: 'ICAI Directory',
    websiteStatus: 'NO_WEBSITE',
    leadStatus: 'NEW',
    opportunityScore: 92,
    opportunityReason: 'Mid-sized audit practice with zero digital presence.',
    isDemoData: true,
    organizationId: DEMO_ORGANIZATION_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const leadGurugramB: LeadData = {
    id: 'lead-gurugram-002',
    businessName: 'Apex Tax & Assurance Partners',
    profession: 'Chartered Accountant',
    city: 'Gurgaon',
    address: 'Golf Course Extension Road, Sector 65, Gurgaon',
    website: null,
    publicEmail: 'info@apextax.example',
    publicPhone: '+91-124-5559876',
    source: 'MCA Filings',
    websiteStatus: 'NO_WEBSITE',
    leadStatus: 'QUALIFIED',
    opportunityScore: 88,
    opportunityReason: 'Tax consultancy with unverified web presence.',
    isDemoData: true,
    organizationId: DEMO_ORGANIZATION_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const leadGurugramC: LeadData = {
    id: 'lead-gurugram-003',
    businessName: 'Mehta Corporate Advisors CA',
    profession: 'Chartered Accountant',
    city: 'Gurugram',
    address: 'Udyog Vihar Phase 4, Gurugram',
    website: null,
    publicEmail: 'help@mehtaca.example',
    publicPhone: '+91-124-6663311',
    source: 'CSV Import',
    websiteStatus: 'NO_WEBSITE',
    leadStatus: 'NEW',
    opportunityScore: 80,
    opportunityReason: 'Corporate secretarial and audit practice without site.',
    isDemoData: true,
    organizationId: DEMO_ORGANIZATION_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const leadGurugramD: LeadData = {
    id: 'lead-gurugram-004',
    businessName: 'Khandelwal & Associates',
    profession: 'Chartered Accountant',
    city: 'Gurugram',
    address: 'Sohna Road, Sector 48, Gurugram',
    website: null,
    publicEmail: 'office@khandelwal.example',
    publicPhone: '+91-124-7778899',
    source: 'ICAI Directory',
    websiteStatus: 'NO_WEBSITE',
    leadStatus: 'NEW',
    opportunityScore: 78,
    opportunityReason: 'Tax planning firm in Gurugram.',
    isDemoData: true,
    organizationId: DEMO_ORGANIZATION_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('1. Deterministic Design Selection & Stability', () => {
    it('selects a valid layout and valid theme for any CA lead', () => {
      const design = selectWebsiteDesign(leadGurugramA, 1);

      expect(Object.keys(CA_LAYOUTS)).toContain(design.layout);
      const validThemeIds = Object.values(THEMES).map((t) => t.id);
      expect(validThemeIds).toContain(design.theme.id);
      expect(design.sectionOrder.length).toBeGreaterThanOrEqual(6);
    });

    it('validates selected design against WebsiteDesignSchema', () => {
      const design = selectWebsiteDesign(leadGurugramA, 1);
      const parsed = WebsiteDesignSchema.safeParse(design);
      expect(parsed.success).toBe(true);
    });

    it('produces the exact same layout and theme repeatedly for the same lead and version', () => {
      const run1 = selectWebsiteDesign(leadGurugramA, 1);
      const run2 = selectWebsiteDesign(leadGurugramA, 1);
      const run3 = selectWebsiteDesign(leadGurugramA, 1);

      expect(run1.layout).toBe(run2.layout);
      expect(run2.layout).toBe(run3.layout);
      expect(run1.theme.id).toBe(run2.theme.id);
      expect(run2.theme.id).toBe(run3.theme.id);
      expect(run1.sectionOrder).toEqual(run2.sectionOrder);
    });

    it('distributes variety across multiple leads (not all identical)', () => {
      const leads = [leadGurugramA, leadGurugramB, leadGurugramC, leadGurugramD];
      const designs = leads.map((l) => selectWebsiteDesign(l, 1));

      const uniqueLayouts = new Set(designs.map((d) => d.layout));
      const uniqueThemes = new Set(designs.map((d) => d.theme.id));

      // With 4 distinct leads, we should see variation across layouts and/or themes
      expect(uniqueLayouts.size + uniqueThemes.size).toBeGreaterThan(2);
    });

    it('enforces specific section ordering for Modern Corporate layout', () => {
      const order = CA_LAYOUTS.MODERN_CORPORATE.sectionOrder;
      expect(order).toEqual([
        'HERO',
        'SERVICES',
        'ABOUT',
        'WHY_CHOOSE_US',
        'PROCESS',
        'CTA',
        'CONTACT',
        'LOCATION',
      ]);
    });

    it('enforces specific section ordering for Premium Professional layout', () => {
      const order = CA_LAYOUTS.PREMIUM_PROFESSIONAL.sectionOrder;
      expect(order).toEqual([
        'HERO',
        'TRUST',
        'SERVICES',
        'ABOUT',
        'EXPERTISE',
        'CTA',
        'CONTACT',
        'LOCATION',
      ]);
    });

    it('enforces specific section ordering for Traditional CA layout', () => {
      const order = CA_LAYOUTS.TRADITIONAL_CA.sectionOrder;
      expect(order).toEqual([
        'HERO',
        'ABOUT',
        'SERVICES',
        'EXPERTISE',
        'WHY_CHOOSE_US',
        'FAQ',
        'CONTACT',
        'CTA',
        'LOCATION',
      ]);
    });

    it('honors explicit layout and theme overrides when requested in options', () => {
      const explicitDesign = selectWebsiteDesign(leadGurugramA, 1, {
        layout: 'TRADITIONAL_CA',
        themeId: 'classic-burgundy',
      });

      expect(explicitDesign.layout).toBe('TRADITIONAL_CA');
      expect(explicitDesign.theme.id).toBe('classic-burgundy');
    });
  });

  describe('2. Content Personalization & Contextual Accuracy', () => {
    it('incorporates lead business name, city, and profession into synthesized concept', async () => {
      const demo = await WebsiteDemoGeneratorService.generateDemo(leadGurugramA, {
        organizationId: DEMO_ORGANIZATION_ID,
      });

      expect(demo.content.brand.businessName).toBe(leadGurugramA.businessName);
      expect(demo.content.meta.title).toContain(leadGurugramA.businessName);
      expect(demo.content.meta.title).toContain(leadGurugramA.city);
      expect(demo.content.location.city).toBe(leadGurugramA.city);
      expect(demo.content.contact.publicEmail).toBe(leadGurugramA.publicEmail);
      expect(demo.content.contact.publicPhone).toBe(leadGurugramA.publicPhone);
    });

    it('includes modular sections (process, trust, expertise, ctaBanner) in generated content', async () => {
      const demo = await WebsiteDemoGeneratorService.generateDemo(leadGurugramA, {
        organizationId: DEMO_ORGANIZATION_ID,
      });

      expect(demo.content.process).toBeDefined();
      expect(demo.content.process?.steps.length).toBe(4);
      expect(demo.content.trust).toBeDefined();
      expect(demo.content.trust?.badges.length).toBe(4);
      expect(demo.content.expertise).toBeDefined();
      expect(demo.content.expertise?.items.length).toBeGreaterThanOrEqual(4);
      expect(demo.content.ctaBanner).toBeDefined();
      expect(demo.content.ctaBanner?.primaryCta.href).toBe('#contact');
    });

    it('attaches design metadata to demo and content', async () => {
      const demo = await WebsiteDemoGeneratorService.generateDemo(leadGurugramA, {
        organizationId: DEMO_ORGANIZATION_ID,
      });

      expect(demo.design).toBeDefined();
      expect(demo.design?.layout).toBeDefined();
      expect(demo.design?.theme).toBeDefined();
      expect(demo.design?.sectionOrder.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('3. Strict Claim Safety & Governance', () => {
    it('does not produce fabricated numerical claims or years of experience', async () => {
      const demo = await WebsiteDemoGeneratorService.generateDemo(leadGurugramB, {
        organizationId: DEMO_ORGANIZATION_ID,
      });

      // Verify Why Choose Us points
      demo.content.whyChooseUs.points.forEach((p) => {
        expect(p.description).not.toMatch(/\b\d+\+?\s*(years?|awards?|audits?|clients?)\b/i);
      });

      // Verify Testimonials remain disabled
      expect(demo.content.testimonials.enabled).toBe(false);
      demo.content.testimonials.items.forEach((t) => {
        expect(t.isPlaceholder).toBe(true);
      });
    });

    it('keeps unverified services marked as isConfirmed: false', async () => {
      const demo = await WebsiteDemoGeneratorService.generateDemo(leadGurugramC, {
        organizationId: DEMO_ORGANIZATION_ID,
      });

      demo.content.services.items.forEach((srv) => {
        expect(srv.isConfirmed).toBe(false);
      });
    });

    it('includes simulated inquiry disclaimer on contact form', async () => {
      const demo = await WebsiteDemoGeneratorService.generateDemo(leadGurugramD, {
        organizationId: DEMO_ORGANIZATION_ID,
      });

      expect(demo.content.contact.simulatedDisclaimer).toContain('simulated');
      expect(demo.content.contact.simulatedDisclaimer).toContain('not delivered to the business');
    });
  });

  describe('4. Graceful Fallback & Error Resilience', () => {
    it('falls back cleanly to deterministic content when AI enrichment fails or throws', async () => {
      // Mock Gemini to throw an error
      const spy = vi.spyOn(GeminiAIProvider.prototype, 'generatePersonalizedContent')
        .mockRejectedValue(new Error('Network timeout'));

      const demo = await WebsiteDemoGeneratorService.generateDemo(leadGurugramA, {
        organizationId: DEMO_ORGANIZATION_ID,
        useAiEnrichment: true,
      });

      expect(demo).toBeDefined();
      expect(demo.content.brand.businessName).toBe(leadGurugramA.businessName);
      expect(demo.content.hero.headline).toBeDefined();

      const parsed = WebsiteContentSchema.safeParse(demo.content);
      expect(parsed.success).toBe(true);

      spy.mockRestore();
    });

    it('falls back cleanly when AI returns invalid schema', async () => {
      const spy = vi.spyOn(GeminiAIProvider.prototype, 'generatePersonalizedContent')
        .mockResolvedValue({
          success: false,
          configured: true,
          isMock: false,
          error: 'Invalid JSON format',
        });

      const demo = await WebsiteDemoGeneratorService.generateDemo(leadGurugramA, {
        organizationId: DEMO_ORGANIZATION_ID,
        useAiEnrichment: true,
      });

      expect(demo).toBeDefined();
      expect(demo.content.brand.businessName).toBe(leadGurugramA.businessName);

      spy.mockRestore();
    });

    it('generates a valid demo even when optional lead fields (email, phone, address) are missing', async () => {
      const minimalLead: LeadData = {
        ...leadGurugramA,
        id: 'lead-minimal-001',
        businessName: 'Gupta & Co',
        publicEmail: null,
        publicPhone: null,
        address: '',
      };

      const demo = await WebsiteDemoGeneratorService.generateDemo(minimalLead, {
        organizationId: DEMO_ORGANIZATION_ID,
      });

      expect(demo).toBeDefined();
      expect(demo.content.contact.publicEmail).toBeNull();
      expect(demo.content.contact.publicPhone).toBeNull();

      const parsed = WebsiteContentSchema.safeParse(demo.content);
      expect(parsed.success).toBe(true);
    });
  });
});
