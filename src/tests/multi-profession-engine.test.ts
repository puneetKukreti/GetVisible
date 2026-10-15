import { describe, it, expect } from 'vitest';
import { classifyProfession, PROFESSION_REGISTRY } from '@/lib/demos/profession-engine';
import { getProfessionImageSet, buildWebsiteImagesObject } from '@/lib/demos/image-engine';
import { getDeterministicProfessionProfile, regenerateSectionContent } from '@/lib/demos/ai-content-generator';
import { WebsiteContentSchema } from '@/lib/demos/schema';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import { LeadData } from '@/types';

describe('Multi-Profession Engine: 8 Target Professions & Zero CA Text Leakage', () => {
  const targetProfessions = [
    {
      name: 'Singhal & Co. Chartered Accountants',
      profession: 'Chartered Accountant',
      city: 'Gurugram',
      expectedId: 'CHARTERED_ACCOUNTANT',
      forbiddenText: ['Dental', 'Menu', 'Workout'],
    },
    {
      name: 'Dr. Mehra Dental & Implant Clinic',
      profession: 'Dentist & Dental Clinic',
      city: 'Delhi',
      expectedId: 'DOCTOR_CLINIC',
      forbiddenText: ['ITR', 'GST audit', 'ICAI', 'Tax Return'],
    },
    {
      name: 'Malhotra Legal Associates',
      profession: 'Advocate & High Court Lawyer',
      city: 'New Delhi',
      expectedId: 'LAWYER_LEGAL',
      forbiddenText: ['Root Canal', 'Audit Assurance', 'ITR filing'],
    },
    {
      name: 'Cafe De Flora & Bakery Studio',
      profession: 'Cafe & Continental Bakery',
      city: 'Gurgaon',
      expectedId: 'RESTAURANT_CAFE',
      forbiddenText: ['Tax Audit', 'Statutory Compliance', 'Legal dispute'],
    },
    {
      name: 'Prime Square Realty & Consultants',
      profession: 'Real Estate Consultant',
      city: 'Noida',
      expectedId: 'REAL_ESTATE',
      forbiddenText: ['ICAI', 'Statutory audit', 'Dental operatory'],
    },
    {
      name: 'Iron Forge Fitness Club',
      profession: 'Gym & Crossfit Studio',
      city: 'Gurgaon',
      expectedId: 'GYM_FITNESS',
      forbiddenText: ['ITR filing', 'Tax Litigation', 'Root canal'],
    },
    {
      name: 'PixelCraft Growth Digital Agency',
      profession: 'Digital Marketing & SEO Agency',
      city: 'Bengaluru',
      expectedId: 'DIGITAL_AGENCY',
      forbiddenText: ['Statutory audit', 'ICAI', 'Dental implant'],
    },
    {
      name: 'Mitti & Clay Terracotta Atelier',
      profession: 'Artisanal Ceramic Pottery & Kiln Craft',
      city: 'Jaipur',
      expectedId: 'CUSTOM_',
      forbiddenText: ['Statutory audit', 'ICAI', 'Tax compliance', 'ITR'],
    },
  ];

  it('1. Classifies all 8 professions accurately, including custom unfamiliar trades', () => {
    for (const target of targetProfessions) {
      const config = classifyProfession({
        profession: target.profession,
        businessName: target.name,
      });

      expect(config).toBeDefined();
      expect(config.id).toContain(target.expectedId);
    }
  });

  it('2. Generates curated, slot-purposed image sets for each profession with no broken URLs', () => {
    for (const target of targetProfessions) {
      const images = buildWebsiteImagesObject(target.profession, target.name);

      expect(images.heroImage).toBeDefined();
      expect(images.heroImage?.url).toMatch(/^https:\/\/images\.unsplash\.com/);
      expect(images.aboutImage?.url).toMatch(/^https:\/\/images\.unsplash\.com/);
      expect(images.serviceImages?.length).toBe(4);
      expect(images.gallery?.length).toBe(3);
    }
  });

  it('3. Generates rich, authentic profession copy with ZERO CA text leakage in non-CA trades', () => {
    for (const target of targetProfessions) {
      const profile = getDeterministicProfessionProfile({
        businessName: target.name,
        profession: target.profession,
        city: target.city,
      });

      const serializedCopy = JSON.stringify(profile).toLowerCase();

      // Check forbidden text for non-CA businesses
      for (const forbidden of target.forbiddenText) {
        expect(serializedCopy).not.toContain(forbidden.toLowerCase());
      }

      // Check that headline and services are populated
      expect(profile.heroHeadline.length).toBeGreaterThan(10);
      expect(profile.services.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('4. Successfully regenerates individual sections without full demo reruns', async () => {
    const facts = {
      businessName: 'Dr. Mehra Dental Clinic',
      profession: 'Dentist',
      city: 'Gurgaon',
    };

    const hero = await regenerateSectionContent({
      sectionType: 'HERO',
      facts,
    });
    expect(hero).toBeDefined();
    expect(hero.headline).toBeDefined();

    const services = await regenerateSectionContent({
      sectionType: 'SERVICES',
      facts,
    });
    expect(services).toBeDefined();
    expect(services.items?.length).toBe(4);
    expect(services.sectionTitle).toBeDefined();

    const faq = await regenerateSectionContent({
      sectionType: 'FAQ',
      facts,
    });
    expect(faq).toBeDefined();
    expect(faq.items?.length).toBeGreaterThanOrEqual(3);
  });

  it('5. Generates full valid WebsiteDemoData passing Zod validation for an unlisted trade', async () => {
    const customLead: LeadData = {
      id: 'lead-custom-pottery',
      organizationId: 'org-demo-gurgaon',
      businessName: 'Mitti & Clay Terracotta Atelier',
      profession: 'Artisanal Ceramic Pottery & Kiln Craft',
      city: 'Jaipur',
      address: 'Civil Lines, Jaipur',
      websiteStatus: 'NO_WEBSITE',
      leadStatus: 'NEW',
      contactChannel: 'EMAIL',
      opportunityScore: 85,
      isDemoData: true,
      source: 'MANUAL_ENTRY',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const demo = await WebsiteDemoGeneratorService.generateDemo(customLead, {
      useAiEnrichment: true,
    });

    expect(demo).toBeDefined();
    expect(demo.generationStatus).toBe('COMPLETED');
    expect(demo.content.brand.businessName).toBe('Mitti & Clay Terracotta Atelier');

    // Schema Validation
    const parsed = WebsiteContentSchema.safeParse(demo.content);
    expect(parsed.success).toBe(true);

    // Verify non-CA copy
    const serialized = JSON.stringify(demo.content).toLowerCase();
    expect(serialized).not.toContain('chartered accountant');
    expect(serialized).not.toContain('icai');
    expect(serialized).not.toContain('statutory audit');
  });
});
