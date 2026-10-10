import { describe, it, expect } from 'vitest';
import { resolveProfessionConfig, PROFESSION_CONFIGS } from '@/lib/blueprint/profession-config';
import { BlueprintGeneratorService } from '@/lib/blueprint/blueprint-generator';
import { validateAndRepairBlueprint, WebsiteBlueprintSchema } from '@/lib/blueprint/blueprint-schema';
import { COMPONENT_REGISTRY } from '@/components/demo-renderer/component-registry';
import { LeadData } from '@/types';

describe('Data-Driven Profession-Aware Website Rendering Engine', () => {
  const testProfessions = [
    { profession: 'Chartered Accountant', expectedId: 'CA', expectedCategory: 'Finance & Tax Advisory' },
    { profession: 'Dentist', expectedId: 'Dentist', expectedCategory: 'Healthcare & Dental Surgery' },
    { profession: 'Lawyer', expectedId: 'Lawyer', expectedCategory: 'Legal Services & Dispute Resolution' },
    { profession: 'Architect', expectedId: 'Architect', expectedCategory: 'Architecture & Spatial Design' },
    { profession: 'Gym', expectedId: 'Gym', expectedCategory: 'Fitness & Athletic Conditioning' },
    { profession: 'Interior Decorator Consultant', expectedId: 'Custom', expectedCategory: 'Business & Professional Services' },
  ];

  it('1. Resolves appropriate profession configurations for all target professions and custom', () => {
    testProfessions.forEach((tp) => {
      const config = resolveProfessionConfig(tp.profession);
      expect(config).toBeDefined();
      expect(config.category).toBe(tp.expectedCategory);
      expect(config.sampleServices.length).toBeGreaterThanOrEqual(2);
      expect(config.sampleFaq.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('2. Generates valid, validated JSON blueprints for CA, Dentist, Lawyer, Architect, Gym, and Custom', async () => {
    for (const tp of testProfessions) {
      const mockLead: LeadData = {
        id: `lead-${tp.expectedId.toLowerCase()}`,
        organizationId: 'org-test',
        businessName: `Metro ${tp.profession} Practice`,
        profession: tp.profession,
        city: 'Gurgaon',
        address: 'Sector 29, Gurgaon',
        websiteStatus: 'NO_WEBSITE',
        leadStatus: 'QUALIFIED',
        publicEmail: `info@metro-${tp.expectedId.toLowerCase()}.example`,
        publicPhone: '+91-9876543210',
        opportunityScore: 85,
        opportunityReason: 'Strong local business with no active online website.',
        isDemoData: true,
        source: 'MANUAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const blueprint = await BlueprintGeneratorService.generateBlueprint(mockLead);
      expect(blueprint).toBeDefined();

      const validation = WebsiteBlueprintSchema.safeParse(blueprint);
      expect(validation.success).toBe(true);

      // Verify profession isolation: Ensure Dentist does NOT get CA tax services or vice-versa
      if (tp.expectedId === 'Dentist') {
        const servicesText = JSON.stringify(blueprint.content.services);
        expect(servicesText.toLowerCase()).toContain('dental');
        expect(servicesText.toLowerCase()).not.toContain('gst');
        expect(servicesText.toLowerCase()).not.toContain('statutory audit');
      }

      if (tp.expectedId === 'Gym') {
        const servicesText = JSON.stringify(blueprint.content.services);
        expect(servicesText.toLowerCase()).toContain('training');
        expect(servicesText.toLowerCase()).not.toContain('litigation');
      }

      if (tp.expectedId === 'Lawyer') {
        const servicesText = JSON.stringify(blueprint.content.services);
        expect(servicesText.toLowerCase()).toContain('litigation');
        expect(servicesText.toLowerCase()).not.toContain('orthodontics');
      }
    }
  });

  it('3. Safely validates and repairs invalid or incomplete blueprints without crashing', () => {
    const brokenData = {
      id: 'broken-1',
      brand: {
        businessName: 'Incomplete Practice',
      },
      // Missing sections, missing palette, missing content
    };

    const result = validateAndRepairBlueprint(brokenData);
    expect(result.success).toBe(true);
    expect(result.repaired).toBe(true);
    expect(result.blueprint?.sections.length).toBeGreaterThanOrEqual(1);
    expect(result.blueprint?.palette.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('4. Reusable component registry contains all required controlled components and safe rendering mappings', () => {
    const expectedComponents = [
      'HEADER',
      'HERO',
      'SERVICES',
      'ABOUT',
      'TRUST',
      'PROCESS',
      'EXPERTISE',
      'WHY_CHOOSE_US',
      'INDUSTRIES',
      'TESTIMONIALS',
      'FAQ',
      'CTA',
      'CONTACT',
      'LOCATION',
      'FOOTER',
      'WHATSAPP_BUTTON',
    ];

    expectedComponents.forEach((comp) => {
      expect(COMPONENT_REGISTRY[comp as keyof typeof COMPONENT_REGISTRY]).toBeDefined();
      expect(typeof COMPONENT_REGISTRY[comp as keyof typeof COMPONENT_REGISTRY]).toBe('function');
    });
  });

  it('5. Ensures prospect demo isolation across independent generations', async () => {
    const leadA: LeadData = {
      id: 'prospect-a',
      organizationId: 'org-test',
      businessName: 'Sharma Dental Clinic',
      profession: 'Dentist',
      city: 'Delhi',
      address: 'Connaught Place, Delhi',
      websiteStatus: 'NO_WEBSITE',
      leadStatus: 'QUALIFIED',
      opportunityScore: 80,
      opportunityReason: 'Healthcare practice without website',
      isDemoData: true,
      source: 'MANUAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const leadB: LeadData = {
      id: 'prospect-b',
      organizationId: 'org-test',
      businessName: 'Verma & Associates Architects',
      profession: 'Architect',
      city: 'Noida',
      address: 'Sector 62, Noida',
      websiteStatus: 'NO_WEBSITE',
      leadStatus: 'QUALIFIED',
      opportunityScore: 90,
      opportunityReason: 'Design studio with no web portfolio',
      isDemoData: true,
      source: 'MANUAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const bpA = await BlueprintGeneratorService.generateBlueprint(leadA);
    const bpB = await BlueprintGeneratorService.generateBlueprint(leadB);

    expect(bpA.brand.businessName).toBe('Sharma Dental Clinic');
    expect(bpB.brand.businessName).toBe('Verma & Associates Architects');
    expect(bpA.palette.primaryColor).not.toBe(bpB.palette.primaryColor);
    expect(bpA.content.meta.title).toContain('Dentist');
    expect(bpB.content.meta.title).toContain('Architect');
  });
});
