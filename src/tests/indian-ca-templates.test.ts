import { describe, it, expect } from 'vitest';
import {
  getTemplate,
  listTemplates,
  registerTemplate,
  unregisterTemplate,
  BASE_TEMPLATE,
  DESIGN_1_PREMIUM_TEMPLATE,
  DESIGN_2_MINIMALIST_TEMPLATE,
  DESIGN_3_CONTEMPORARY_TEMPLATE,
  LeadFacts,
} from '@/lib/demos/templates';
import {
  STITCH_TEMPLATES,
  getStitchTemplate,
} from '@/lib/demos/stitch-templates';
import { INDIAN_CA_ARCHETYPES, inferCAArchetype } from '@/lib/demos/ca-archetypes';
import { WebsiteContentSchema } from '@/lib/demos/schema';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import { LeadData } from '@/types';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';

describe('Google Stitch Demo Website Templates & Integration', () => {
  const leadFacts: LeadFacts = {
    businessName: 'Sharma & Associates Chartered Accountants',
    profession: 'Chartered Accountant',
    city: 'Gurugram',
    address: 'DLF Cyber City, Tower B, Sector 24, Gurugram, Haryana 122002',
    publicEmail: 'consultations@sharmaassociates-ca.in',
    publicPhone: '+91 11 2345 6789',
    source: 'ICAI Directory',
  };

  it('exposes exactly 3 distinct Google Stitch design templates in the catalog', () => {
    expect(STITCH_TEMPLATES.length).toBe(3);

    const ids = STITCH_TEMPLATES.map((t) => t.id);
    expect(ids).toEqual(['design-1-premium', 'design-2-minimalist', 'design-3-contemporary']);

    STITCH_TEMPLATES.forEach((tmpl) => {
      expect(tmpl.name).toBeDefined();
      expect(tmpl.conceptName).toBeDefined();
      expect(tmpl.palette.length).toBeGreaterThanOrEqual(4);
      expect(tmpl.thumbnail).toContain('/demo-templates/');
      expect(tmpl.htmlUrl).toContain('/demo-templates/');
      expect(tmpl.keyFeatures.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('retrieves individual Stitch templates by ID via getStitchTemplate', () => {
    const t1 = getStitchTemplate('design-1-premium');
    expect(t1).toBeDefined();
    expect(t1?.conceptName).toBe('Venerable Jurisprudence');

    const t2 = getStitchTemplate('design-2-minimalist');
    expect(t2).toBeDefined();
    expect(t2?.conceptName).toBe('Architectural Ledger');

    const t3 = getStitchTemplate('design-3-contemporary');
    expect(t3).toBeDefined();
    expect(t3?.conceptName).toBe('Executive Capital / New Delhi');
  });

  it('builds valid schema-compliant WebsiteContent for all 3 Stitch templates', () => {
    const templates = [
      DESIGN_1_PREMIUM_TEMPLATE,
      DESIGN_2_MINIMALIST_TEMPLATE,
      DESIGN_3_CONTEMPORARY_TEMPLATE,
    ];

    templates.forEach((tmpl) => {
      const content = tmpl.buildContent(leadFacts);
      const validation = WebsiteContentSchema.safeParse(content);

      if (!validation.success) {
        console.error(`Validation failed for ${tmpl.id}:`, validation.error.format());
      }
      expect(validation.success).toBe(true);
      expect(content.meta.templateId).toBe(tmpl.id);
      expect(content.brand.businessName).toBe(leadFacts.businessName);
      expect(content.testimonials.enabled).toBe(false);
      expect(content.contact.simulatedDisclaimer).toContain('simulated');
    });
  });

  it('intelligently infers the best Stitch design based on lead characteristics', () => {
    // GST practice -> Minimalist Ledger
    expect(inferCAArchetype({ businessName: 'Manesar Industrial GST Consultants' })).toBe('design-2-minimalist');

    // Startup / CFO practice -> Contemporary Corporate
    expect(inferCAArchetype({ businessName: 'Venture Growth Virtual CFO Partners' })).toBe('design-3-contemporary');

    // General / Corporate advisory -> Premium Editorial
    expect(inferCAArchetype({ businessName: 'Sharma & Associates Corporate Tax' })).toBe('design-1-premium');
  });

  it('generates a full demo via WebsiteDemoGeneratorService matching requested Stitch design', async () => {
    const lead: LeadData = {
      id: 'lead-test-stitch-001',
      businessName: 'Sharma & Associates Chartered Accountants',
      profession: 'Chartered Accountant',
      city: 'Gurugram',
      address: 'DLF Cyber City, Tower B, Gurugram, Haryana',
      website: null,
      publicEmail: 'contact@sharma-ca.example',
      publicPhone: '+91 11 2345 6789',
      source: 'ICAI Directory',
      websiteStatus: 'NO_WEBSITE',
      leadStatus: 'QUALIFIED',
      opportunityScore: 96,
      opportunityReason: 'Premier audit & tax practice with zero website footprint.',
      isDemoData: true,
      organizationId: DEMO_ORGANIZATION_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const demo = await WebsiteDemoGeneratorService.generateDemo(lead, {
      templateId: 'design-1-premium',
    });

    expect(demo).toBeDefined();
    expect(demo.content.brand.businessName).toBe('Sharma & Associates Chartered Accountants');
    expect(demo.content.meta.templateId).toBe('design-1-premium');
    expect(demo.content.location.city).toBe('Gurugram');
  });
});
