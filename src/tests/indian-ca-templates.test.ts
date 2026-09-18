import { describe, it, expect } from 'vitest';
import {
  getTemplate,
  listTemplates,
  INDIAN_CA_ARCHETYPES,
  inferCAArchetype,
  LeadFacts,
} from '@/lib/demos/templates';
import { WebsiteContentSchema } from '@/lib/demos/schema';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import { LeadData } from '@/types';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';

describe('7 Authentic Indian CA Practice Templates & Archetypes', () => {
  const leadFacts: LeadFacts = {
    businessName: 'Singhal, Bansal & Associates',
    profession: 'Chartered Accountant',
    city: 'Gurugram',
    address: 'DLF Cyber City, Tower B, Sector 24, Gurugram, Haryana 122002',
    publicEmail: 'partner@singhal-bansal-ca.example',
    publicPhone: '+91 124 4991100',
    source: 'ICAI Directory',
  };

  it('registers all 7 archetypes in the template registry', () => {
    const templates = listTemplates();
    const templateIds = templates.map((t) => t.id);

    const expectedArchetypeIds = [
      'CORPORATE_TRANSFER_PRICING',
      'MANUFACTURING_GST_LITIGATION',
      'VIRTUAL_CFO_STARTUP',
      'INSTITUTIONAL_AUDIT_ASSURANCE',
      'NRI_CROSS_BORDER_TAX',
      'DIRECT_TAX_LITIGATION',
      'FAMILY_OFFICE_ESTATE',
    ];

    expectedArchetypeIds.forEach((id) => {
      expect(templateIds).toContain(id);
      const tmpl = getTemplate(id);
      expect(tmpl).toBeDefined();
      expect(tmpl.id).toBe(id);
      expect(tmpl.profession).toBe('Chartered Accountant');
    });
  });

  it('builds valid schema-compliant WebsiteContent for all 7 archetypes', () => {
    INDIAN_CA_ARCHETYPES.forEach((meta) => {
      const template = getTemplate(meta.id);
      expect(template).toBeDefined();

      const content = template.buildContent(leadFacts);
      const validation = WebsiteContentSchema.safeParse(content);

      if (!validation.success) {
        console.error(`Validation failed for ${meta.id}:`, validation.error.format());
      }
      expect(validation.success).toBe(true);

      // Verify ICAI Code of Ethics compliance
      expect(content.testimonials.enabled).toBe(false);
      expect(content.contact.simulatedDisclaimer).toContain('simulated');
      content.services.items.forEach((srv) => {
        expect(srv.isConfirmed).toBe(false);
      });
    });
  });

  it('incorporates authentic statutory terminology into each archetype', () => {
    // 1. Corporate Tax & Transfer Pricing
    const tpContent = getTemplate('CORPORATE_TRANSFER_PRICING').buildContent(leadFacts);
    const tpServices = tpContent.services.items.map((s) => `${s.title} ${s.description}`).join(' ');
    expect(tpServices).toMatch(/3CEB|92E|Benchmarking|APA|Arm.*s Length/i);

    // 2. Manufacturing GST Litigator
    const gstContent = getTemplate('MANUFACTURING_GST_LITIGATION').buildContent(leadFacts);
    const gstServices = gstContent.services.items.map((s) => `${s.title} ${s.description}`).join(' ');
    expect(gstServices).toMatch(/16\(4\)|ITC|Audit|SCN|GSTAT|Inverted Duty/i);

    // 3. Virtual CFO & Startup Growth
    const vcfoContent = getTemplate('VIRTUAL_CFO_STARTUP').buildContent(leadFacts);
    const vcfoServices = vcfoContent.services.items.map((s) => `${s.title} ${s.description}`).join(' ');
    expect(vcfoServices).toMatch(/Virtual CFO|Cap Table|80-IAC|ESOP|Due Diligence/i);

    // 4. Institutional Audit & Assurance
    const auditContent = getTemplate('INSTITUTIONAL_AUDIT_ASSURANCE').buildContent(leadFacts);
    const auditServices = auditContent.services.items.map((s) => `${s.title} ${s.description}`).join(' ');
    expect(auditServices).toMatch(/Companies Act|CARO 2020|Ind AS|ICFR|Bank Branch/i);

    // 5. NRI Wealth & Cross-Border Tax
    const nriContent = getTemplate('NRI_CROSS_BORDER_TAX').buildContent(leadFacts);
    const nriServices = nriContent.services.items.map((s) => `${s.title} ${s.description}`).join(' ');
    expect(nriServices).toMatch(/15CA|15CB|197|Lower TDS|DTAA|Repatriation/i);

    // 6. Direct Tax Litigator & Scrutiny
    const dtContent = getTemplate('DIRECT_TAX_LITIGATION').buildContent(leadFacts);
    const dtServices = dtContent.services.items.map((s) => `${s.title} ${s.description}`).join(' ');
    expect(dtServices).toMatch(/148|Faceless|ITAT|Scrutiny|CIT\(Appeals\)|Penalty/i);

    // 7. Family Office & Estate Succession
    const foContent = getTemplate('FAMILY_OFFICE_ESTATE').buildContent(leadFacts);
    const foServices = foContent.services.items.map((s) => `${s.title} ${s.description}`).join(' ');
    expect(foServices).toMatch(/Trust|HUF|Succession|Settlement|HoldCo/i);
  });

  it('intelligently infers the correct archetype from lead facts', () => {
    // NRI inference
    expect(inferCAArchetype({ businessName: 'Global NRI Remittance Tax Advisors' })).toBe('NRI_CROSS_BORDER_TAX');

    // Startup CFO inference
    expect(inferCAArchetype({ businessName: 'Koramangala Tech Venture CFO Partners' })).toBe('VIRTUAL_CFO_STARTUP');

    // GST & Manufacturing inference
    expect(inferCAArchetype({ businessName: 'Manesar Industrial GST Consultants' })).toBe('MANUFACTURING_GST_LITIGATION');

    // Institutional Audit inference
    expect(inferCAArchetype({ businessName: 'Premier Statutory Audit & Assurance Firm' })).toBe('INSTITUTIONAL_AUDIT_ASSURANCE');

    // Direct Tax Litigation inference
    expect(inferCAArchetype({ businessName: 'Chambers of Direct Tax Litigation & Appeals' })).toBe('DIRECT_TAX_LITIGATION');

    // Family Office inference
    expect(inferCAArchetype({ businessName: 'Singhania Family Wealth & Estate Advisory' })).toBe('FAMILY_OFFICE_ESTATE');

    // Default corporate
    expect(inferCAArchetype({ businessName: 'Singhal & Co Chartered Accountants' })).toBe('CORPORATE_TRANSFER_PRICING');
  });

  it('generates a full demo via WebsiteDemoGeneratorService matching requested archetype', async () => {
    const lead: LeadData = {
      id: 'lead-test-archetype-001',
      businessName: 'Peenya Industrial GST Litigators',
      profession: 'Chartered Accountant',
      city: 'Bengaluru',
      address: 'Peenya Industrial Area, 2nd Stage, Bengaluru, Karnataka',
      website: null,
      publicEmail: 'contact@peenyagst.example',
      publicPhone: '+91 80 28390000',
      source: 'ICAI Directory',
      websiteStatus: 'NO_WEBSITE',
      leadStatus: 'QUALIFIED',
      opportunityScore: 94,
      opportunityReason: 'Manufacturing GST practice in industrial corridor.',
      isDemoData: true,
      organizationId: DEMO_ORGANIZATION_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const demo = await WebsiteDemoGeneratorService.generateDemo(lead, {
      templateId: 'MANUFACTURING_GST_LITIGATION',
    });

    expect(demo).toBeDefined();
    expect(demo.templateId).toBe('MANUFACTURING_GST_LITIGATION');
    expect(demo.content.meta.templateId).toBe('MANUFACTURING_GST_LITIGATION');
    expect(demo.content.hero.badge).toContain('GST');
    expect(demo.content.location.city).toBe('Bengaluru');
    expect(demo.content.services.items.length).toBe(6);
  });
});
