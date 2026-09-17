import { describe, it, expect } from 'vitest';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import {
  selectWebsiteDesign,
  CA_LAYOUTS,
  TEMPLATE_KEYS,
} from '@/lib/demos/personalization';
import { WebsiteLayoutSchema, WebsiteDesignSchema } from '@/lib/demos/schema';
import { LeadData, WebsiteTemplate } from '@/types';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';

describe('Phase 4.2: Modern Website Template System for CA Firms', () => {
  const sampleLead: LeadData = {
    id: 'lead-test-402',
    businessName: 'Sharma & Singhal Chartered Accountants',
    profession: 'Chartered Accountant',
    city: 'Gurugram',
    address: 'DLF Cyber City, Tower B, Gurugram, Haryana',
    website: null,
    publicEmail: 'partner@sharma-singhal-ca.example',
    publicPhone: '+91 124 4991100',
    source: 'ICAI Directory',
    websiteStatus: 'NO_WEBSITE',
    leadStatus: 'QUALIFIED',
    opportunityScore: 95,
    opportunityReason: 'Premier audit & taxation firm with no website.',
    isDemoData: true,
    organizationId: DEMO_ORGANIZATION_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('defines all 5 modern Phase 4.2 website templates in TEMPLATE_KEYS and CA_LAYOUTS', () => {
    const expectedTemplates: WebsiteTemplate[] = [
      'EDITORIAL_FINANCE',
      'MODERN_FINTECH',
      'LUXURY_PROFESSIONAL',
      'SWISS_MINIMAL',
      'MODERN_INDIAN',
    ];

    expect(TEMPLATE_KEYS).toEqual(expectedTemplates);

    expectedTemplates.forEach((tmpl) => {
      expect(CA_LAYOUTS[tmpl]).toBeDefined();
      expect(WebsiteLayoutSchema.safeParse(tmpl).success).toBe(true);
      expect(CA_LAYOUTS[tmpl].template).toBe(tmpl);
    });
  });

  it('guarantees each modern template has distinct layout and compositional geometry', () => {
    // 1. Editorial Finance
    const editorial = CA_LAYOUTS['EDITORIAL_FINANCE'];
    expect(editorial.heroLayout).toBe('asymmetric-editorial');
    expect(editorial.servicesLayout).toBe('numbered-manifesto');
    expect(editorial.features.showVisualArtwork).toBe(true);

    // 2. Modern Fintech
    const fintech = CA_LAYOUTS['MODERN_FINTECH'];
    expect(fintech.heroLayout).toBe('split-fintech');
    expect(fintech.servicesLayout).toBe('cards-glow');
    expect(fintech.features.floatingHeader).toBe(true);

    // 3. Luxury Professional
    const luxury = CA_LAYOUTS['LUXURY_PROFESSIONAL'];
    expect(luxury.heroLayout).toBe('minimal-serif');
    expect(luxury.servicesLayout).toBe('luxury-rows');
    expect(luxury.features.hairlineBorders).toBe(true);

    // 4. Swiss Minimal
    const swiss = CA_LAYOUTS['SWISS_MINIMAL'];
    expect(swiss.heroLayout).toBe('swiss-grid');
    expect(swiss.servicesLayout).toBe('swiss-grid');
    expect(swiss.features.monochromeGrid).toBe(true);

    // 5. Modern Indian
    const indian = CA_LAYOUTS['MODERN_INDIAN'];
    expect(indian.heroLayout).toBe('modern-indian');
    expect(indian.servicesLayout).toBe('practice-cards');
    expect(indian.features.showLocationHighlight).toBe(true);
  });

  it('preserves backward compatibility with legacy Phase 4.1 layouts', () => {
    expect(CA_LAYOUTS['MODERN_CORPORATE']).toBeDefined();
    expect(CA_LAYOUTS['PREMIUM_PROFESSIONAL']).toBeDefined();
    expect(CA_LAYOUTS['TRADITIONAL_CA']).toBeDefined();
  });

  it('deterministically distributes different lead IDs across the 5 templates', () => {
    const assignedTemplates = new Set<string>();

    for (let i = 0; i < 50; i++) {
      const design = selectWebsiteDesign({
        id: `lead-gurugram-seed-${i}`,
        businessName: `Lead Firm ${i}`,
        city: 'Gurugram',
      });
      assignedTemplates.add(design.layout);
    }

    // All 5 templates should be hit within 50 diverse seeds
    expect(assignedTemplates.has('EDITORIAL_FINANCE')).toBe(true);
    expect(assignedTemplates.has('MODERN_FINTECH')).toBe(true);
    expect(assignedTemplates.has('LUXURY_PROFESSIONAL')).toBe(true);
    expect(assignedTemplates.has('SWISS_MINIMAL')).toBe(true);
    expect(assignedTemplates.has('MODERN_INDIAN')).toBe(true);
  });

  it('maintains deterministic repeatability for the same lead ID', () => {
    const design1 = selectWebsiteDesign({
      id: 'lead-audit-gurgaon-99',
      businessName: 'Sharma & Singhal CA',
    });
    const design2 = selectWebsiteDesign({
      id: 'lead-audit-gurgaon-99',
      businessName: 'Sharma & Singhal CA',
    });

    expect(design1.layout).toBe(design2.layout);
    expect(design1.heroLayout).toBe(design2.heroLayout);
    expect(design1.servicesLayout).toBe(design2.servicesLayout);
    expect(design1.sectionOrder).toEqual(design2.sectionOrder);
  });

  it('generates a full website concept adhering to claim-safety and template design', async () => {
    const demo = await WebsiteDemoGeneratorService.generateDemo(sampleLead, {
      organizationId: DEMO_ORGANIZATION_ID,
    });

    expect(demo).toBeDefined();
    expect(demo.design).toBeDefined();
    expect(WebsiteDesignSchema.safeParse(demo.design).success).toBe(true);
    expect(TEMPLATE_KEYS).toContain(demo.design?.layout);

    // Claim safety verifications:
    // 1. Template-suggested services are marked isConfirmed: false
    expect(demo.content.services.items.length).toBeGreaterThan(0);
    demo.content.services.items.forEach((srv) => {
      expect(srv.isConfirmed).toBe(false);
    });

    // 2. Contact details match lead verified data
    expect(demo.content.contact.publicPhone).toBe(sampleLead.publicPhone);
    expect(demo.content.contact.publicEmail).toBe(sampleLead.publicEmail);
    expect(demo.content.location.address).toBe(sampleLead.address);

    // 3. Simulated inquiry disclaimer present
    expect(demo.content.contact.simulatedDisclaimer).toContain('simulated');

    // 4. Testimonials are disabled
    expect(demo.content.testimonials.enabled).toBe(false);

    // 5. Why Choose Us contains grounded claims without fabricated metrics
    demo.content.whyChooseUs.points.forEach((item) => {
      expect(item.description).not.toMatch(/100%|guaranteed|#1 ranked|award winning/i);
    });
  });
});
