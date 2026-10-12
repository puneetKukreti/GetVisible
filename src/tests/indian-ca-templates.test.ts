import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTemplate,
  listTemplates,
  registerTemplate,
  unregisterTemplate,
  clearTemplateRegistry,
  BASE_TEMPLATE,
  LeadFacts,
  ProfessionTemplate,
  THEMES,
} from '@/lib/demos/templates';
import { WebsiteContentSchema } from '@/lib/demos/schema';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import { LeadData } from '@/types';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';

describe('Clean Template Registry & Dynamic Template Engine', () => {
  const leadFacts: LeadFacts = {
    businessName: 'Singhal, Bansal & Associates',
    profession: 'Chartered Accountant',
    city: 'Gurugram',
    address: 'DLF Cyber City, Tower B, Sector 24, Gurugram, Haryana 122002',
    publicEmail: 'partner@singhal-bansal-ca.example',
    publicPhone: '+91 124 4991100',
    source: 'ICAI Directory',
  };

  beforeEach(() => {
    clearTemplateRegistry();
  });

  it('starts with a cleared template registry ready for new templates', () => {
    const templates = listTemplates();
    expect(templates.length).toBe(0);
  });

  it('safely falls back to BASE_TEMPLATE when registry is empty', () => {
    const tmpl = getTemplate('NON_EXISTENT_ID');
    expect(tmpl).toBeDefined();
    expect(tmpl.id).toBe('BASE_TEMPLATE');
    expect(tmpl.name).toBe('Standard Practice Baseline');
  });

  it('BASE_TEMPLATE produces valid schema-compliant WebsiteContent', () => {
    const content = BASE_TEMPLATE.buildContent(leadFacts);
    const validation = WebsiteContentSchema.safeParse(content);

    if (!validation.success) {
      console.error('Validation failed for BASE_TEMPLATE:', validation.error.format());
    }
    expect(validation.success).toBe(true);

    // Verify key fields
    expect(content.brand.businessName).toBe(leadFacts.businessName);
    expect(content.location.city).toBe(leadFacts.city);
    expect(content.testimonials.enabled).toBe(false);
    expect(content.contact.simulatedDisclaimer).toContain('simulated');
  });

  it('supports dynamic registration, retrieval, and unregistration of new templates', () => {
    const sampleNewTemplate: ProfessionTemplate = {
      id: 'CUSTOM_AUDIT_EXCELLENCE',
      name: 'Audit Excellence Suite',
      profession: 'Chartered Accountant',
      description: 'Custom modern layout for statutory assurance.',
      themes: [THEMES.executiveNavy],
      defaultTheme: THEMES.executiveNavy,
      buildContent: (facts, theme, design) => ({
        ...BASE_TEMPLATE.buildContent(facts, theme, design),
        meta: {
          ...BASE_TEMPLATE.buildContent(facts, theme, design).meta,
          templateId: 'CUSTOM_AUDIT_EXCELLENCE',
        },
      }),
    };

    registerTemplate(sampleNewTemplate);

    expect(listTemplates().length).toBe(1);
    const retrieved = getTemplate('CUSTOM_AUDIT_EXCELLENCE');
    expect(retrieved.id).toBe('CUSTOM_AUDIT_EXCELLENCE');
    expect(retrieved.name).toBe('Audit Excellence Suite');

    unregisterTemplate('CUSTOM_AUDIT_EXCELLENCE');
    expect(listTemplates().length).toBe(0);
  });

  it('generates a full demo via WebsiteDemoGeneratorService using BASE_TEMPLATE when registry is empty', async () => {
    const lead: LeadData = {
      id: 'lead-test-clean-001',
      businessName: 'Peenya Industrial Advisory',
      profession: 'Chartered Accountant',
      city: 'Bengaluru',
      address: 'Peenya Industrial Area, 2nd Stage, Bengaluru, Karnataka',
      website: null,
      publicEmail: 'contact@peenyaadvisory.example',
      publicPhone: '+91 80 28390000',
      source: 'ICAI Directory',
      websiteStatus: 'NO_WEBSITE',
      leadStatus: 'QUALIFIED',
      opportunityScore: 94,
      opportunityReason: 'Advisory practice in industrial corridor.',
      isDemoData: true,
      organizationId: DEMO_ORGANIZATION_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const demo = await WebsiteDemoGeneratorService.generateDemo(lead);

    expect(demo).toBeDefined();
    expect(demo.content.brand.businessName).toBe('Peenya Industrial Advisory');
    expect(demo.content.location.city).toBe('Bengaluru');
    expect(demo.content.meta.templateId).toBe('BASE_TEMPLATE');
  });
});
