import { describe, it, expect, beforeEach } from 'vitest';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import { WebsiteContentSchema } from '@/lib/demos/schema';
import { getTemplate, THEMES } from '@/lib/demos/templates';
import { WebsiteDemoRepository, LeadRepository } from '@/lib/db/repository';
import { LeadData, WebsiteDemoData } from '@/types';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';

describe('Phase 4: Personalized Website Demo Generator', () => {
  const baseEligibleLead: LeadData = {
    id: 'test-lead-ca-001',
    businessName: 'Sharma & Associates CA',
    profession: 'Chartered Accountant',
    city: 'Gurgaon',
    address: 'Sector 44 Institutional Area, Gurgaon, Haryana 122003',
    website: null,
    publicEmail: 'contact@sharma-ca.example',
    publicPhone: '+91-124-5550199',
    source: 'Public ICAI Directory',
    websiteStatus: 'NO_WEBSITE',
    leadStatus: 'NEW',
    opportunityScore: 95,
    opportunityReason: '15-person firm handling GST and audit with zero online website footprint.',
    isDemoData: true,
    organizationId: DEMO_ORGANIZATION_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('1. Eligibility Rules (All 4 Website Statuses)', () => {
    it('ALLOWS demo generation when websiteStatus is NO_WEBSITE', () => {
      const eligibility = WebsiteDemoGeneratorService.canGenerateDemo(baseEligibleLead);
      expect(eligibility.allowed).toBe(true);
    });

    it('BLOCKS demo generation when websiteStatus is WEBSITE_EXISTS', () => {
      const leadWithSite: LeadData = {
        ...baseEligibleLead,
        websiteStatus: 'WEBSITE_EXISTS',
        website: 'https://existing-firm.example',
      };
      const eligibility = WebsiteDemoGeneratorService.canGenerateDemo(leadWithSite);
      expect(eligibility.allowed).toBe(false);
      expect(eligibility.reason).toContain('already has an existing official website');
    });

    it('BLOCKS demo generation when websiteStatus is UNKNOWN', () => {
      const unknownLead: LeadData = {
        ...baseEligibleLead,
        websiteStatus: 'UNKNOWN',
      };
      const eligibility = WebsiteDemoGeneratorService.canGenerateDemo(unknownLead);
      expect(eligibility.allowed).toBe(false);
      expect(eligibility.reason).toContain('UNKNOWN');
    });

    it('BLOCKS demo generation when websiteStatus is REQUIRES_REVIEW', () => {
      const reviewLead: LeadData = {
        ...baseEligibleLead,
        websiteStatus: 'REQUIRES_REVIEW',
      };
      const eligibility = WebsiteDemoGeneratorService.canGenerateDemo(reviewLead);
      expect(eligibility.allowed).toBe(false);
      expect(eligibility.reason).toContain('REQUIRES_REVIEW');
    });
  });

  describe('2. Claim Safety & No Fabricated Social Proof', () => {
    it('ensures testimonials are disabled by default or strictly marked as placeholder', async () => {
      const demo = await WebsiteDemoGeneratorService.generateDemo(baseEligibleLead, {
        organizationId: DEMO_ORGANIZATION_ID,
      });

      // Testimonials section must NOT present fake testimonials
      expect(demo.content.testimonials.enabled).toBe(false);
      demo.content.testimonials.items.forEach((item) => {
        expect(item.isPlaceholder).toBe(true);
        expect(item.author).not.toContain('Rahul Sharma — CEO');
      });
    });

    it('flags unverified template services as suggested (isConfirmed: false)', async () => {
      const demo = await WebsiteDemoGeneratorService.generateDemo(baseEligibleLead, {
        organizationId: DEMO_ORGANIZATION_ID,
      });

      expect(demo.content.services.items.length).toBeGreaterThan(0);
      demo.content.services.items.forEach((srv) => {
        expect(srv.isConfirmed).toBe(false);
      });
    });

    it('enforces simulated contact disclaimer on contact form', async () => {
      const demo = await WebsiteDemoGeneratorService.generateDemo(baseEligibleLead, {
        organizationId: DEMO_ORGANIZATION_ID,
      });

      expect(demo.content.contact.simulatedDisclaimer).toContain('simulated');
      expect(demo.content.contact.simulatedDisclaimer).toContain('not delivered to the business');
    });

    it('cleans unsupported numerical claims from why choose us', async () => {
      const demo = await WebsiteDemoGeneratorService.generateDemo(baseEligibleLead, {
        organizationId: DEMO_ORGANIZATION_ID,
      });

      demo.content.whyChooseUs.points.forEach((pt) => {
        // Must not contain fake claims like "500+ audits", "25 years"
        expect(pt.description).not.toMatch(/\b\d+\+?\s*(years?|awards?|audits?)\b/i);
      });
    });
  });

  describe('3. Schema & Safe URL Validation', () => {
    it('validates generated website content against WebsiteContentSchema', async () => {
      const demo = await WebsiteDemoGeneratorService.generateDemo(baseEligibleLead, {
        organizationId: DEMO_ORGANIZATION_ID,
      });

      const parsed = WebsiteContentSchema.safeParse(demo.content);
      expect(parsed.success).toBe(true);
    });

    it('rejects unsafe script or javascript: URLs in navigation', () => {
      const template = getTemplate();
      const content = template.buildContent({
        businessName: 'Test Firm',
        profession: 'Chartered Accountant',
        city: 'Gurgaon',
        address: 'Sector 29',
      });

      // Inject malicious javascript: URL
      const maliciousContent = {
        ...content,
        navigation: {
          ...content.navigation,
          items: [{ label: 'Malicious', href: 'javascript:alert(1)' }],
        },
      };

      const parsed = WebsiteContentSchema.safeParse(maliciousContent);
      expect(parsed.success).toBe(false);
    });

    it('accepts valid safe URLs (https, mailto, tel, anchor)', () => {
      const template = getTemplate();
      const content = template.buildContent({
        businessName: 'Test Firm',
        profession: 'Chartered Accountant',
        city: 'Gurgaon',
        address: 'Sector 29',
        publicEmail: 'test@example.com',
        publicPhone: '+91-124-5550100',
      });

      const parsed = WebsiteContentSchema.safeParse(content);
      expect(parsed.success).toBe(true);
    });
  });

  describe('4. Non-Destructive Versioning', () => {
    it('increments version number on successive generations for the same lead', async () => {
      const v1 = await WebsiteDemoGeneratorService.generateDemo(baseEligibleLead, {
        organizationId: DEMO_ORGANIZATION_ID,
        version: 1,
      });
      expect(v1.version).toBe(1);

      const v2 = await WebsiteDemoGeneratorService.generateDemo(baseEligibleLead, {
        organizationId: DEMO_ORGANIZATION_ID,
        version: 2,
      });
      expect(v2.version).toBe(2);
      expect(v2.id).not.toBe(v1.id);
    });
  });

  describe('5. Organization Isolation & Repository Access', () => {
    it('stores and retrieves demos strictly scoped by organizationId', async () => {
      const orgA = 'org-test-alpha';
      const orgB = 'org-test-beta';

      const demoA = await WebsiteDemoGeneratorService.generateDemo(baseEligibleLead, {
        organizationId: orgA,
        version: 1,
      });

      await WebsiteDemoRepository.saveDemo(orgA, demoA, 'test-actor');

      // Org A should see demoA
      const listA = await WebsiteDemoRepository.listDemos(orgA, baseEligibleLead.id);
      expect(listA.some((d) => d.id === demoA.id)).toBe(true);

      // Org B must NOT see demoA
      const listB = await WebsiteDemoRepository.listDemos(orgB, baseEligibleLead.id);
      expect(listB.some((d) => d.id === demoA.id)).toBe(false);
    });
  });
});
