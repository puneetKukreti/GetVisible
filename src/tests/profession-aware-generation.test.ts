import { describe, it, expect } from 'vitest';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import { WebsiteContentSchema } from '@/lib/demos/schema';
import {
  getProfessionContentPlan,
  normalizeSectionOrder,
  contentHasCaLeakageForProfession,
  scrubContentCaLeakage,
  isCaPracticeProfession,
} from '@/lib/demos/profession-sections';
import { getContextualImageUrl } from '@/lib/demos/image-engine';
import { LeadData } from '@/types';

/**
 * Regression suite for the profession-aware website generation pipeline.
 *
 * Guarantees that selecting a profession changes the STRUCTURE and CONTENT of
 * the generated website (hero, services, sections, imagery, CTAs) and that
 * CA-specific copy can never leak into an unrelated profession.
 *
 * Runs through the deterministic engine (useAiEnrichment: false) so the suite
 * does not require a Gemini API key and remains stable in CI.
 */

const CA_SKYSCRAPER = 'photo-1486406146926';

function makeLead(profession: string, businessName: string, city: string): LeadData {
  const id = `lead-${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return {
    id,
    organizationId: 'org-demo-gurgaon',
    businessName,
    profession,
    city,
    address: `${city}, India`,
    websiteStatus: 'NO_WEBSITE',
    leadStatus: 'NEW',
    contactChannel: 'EMAIL',
    opportunityScore: 80,
    opportunityReason: 'No existing website detected.',
    isDemoData: true,
    source: 'MANUAL_ENTRY',
    createdAt: new Date().toISOString(),
  } as LeadData;
}

async function generate(profession: string, businessName: string, city: string) {
  const lead = makeLead(profession, businessName, city);
  const demo = await WebsiteDemoGeneratorService.generateDemo(lead, {
    useAiEnrichment: false,
  });
  return { lead, demo };
}

const CA_SPECIFIC_BUZZWORDS = [
  'chartered accountant',
  'icai',
  'statutory audit',
  'gst returns',
  'gst filing',
  'itr filing',
  'transfer pricing',
  'form 15ca',
  'tax filing',
  'financial compliance',
  'audit services',
  'accounting',
];

describe('Profession-aware generation: 5 required professions', () => {
  it('1. Chartered Accountant: keeps finance-specific, compliant copy', async () => {
    const { demo } = await generate('Chartered Accountant', 'Singhal & Co. Chartered Accountants', 'Gurugram');

    expect(WebsiteContentSchema.safeParse(demo.content).success).toBe(true);

    const serialized = JSON.stringify(demo.content).toLowerCase();
    // A CA practice legitimately uses finance terminology.
    expect(serialized).toMatch(/audit|tax|compliance|accountan/);

    // CA is exempt from the leakage guard.
    expect(isCaPracticeProfession('Chartered Accountant', 'Singhal & Co. Chartered Accountants')).toBe(true);
    expect(
      contentHasCaLeakageForProfession(demo.content, 'Chartered Accountant', 'Singhal & Co. Chartered Accountants')
    ).toBe(false);
  });

  it('2. Photographer: image-led structure with gallery, no CA content, no corporate imagery', async () => {
    const { demo } = await generate(
      'Professional Photographer',
      'Amit Photography Studio',
      'Delhi NCR'
    );

    const parsed = WebsiteContentSchema.safeParse(demo.content);
    expect(parsed.success).toBe(true);

    // No CA-specific content whatsoever.
    expect(
      contentHasCaLeakageForProfession(demo.content, 'Professional Photographer', 'Amit Photography Studio')
    ).toBe(false);
    const serialized = JSON.stringify(demo.content).toLowerCase();
    for (const term of CA_SPECIFIC_BUZZWORDS) {
      expect(serialized).not.toContain(term);
    }

    // Photography-appropriate copy.
    const heroCopy = `${demo.content.hero.headline} ${demo.content.hero.subheadline}`.toLowerCase();
    expect(heroCopy).toMatch(/photo|wedding|portrait|shoot|story/);
    expect(demo.content.services.items.length).toBeGreaterThanOrEqual(4);
    expect(JSON.stringify(demo.content.services).toLowerCase()).toMatch(/photo|wedding|portrait|commercial|event/);

    // Structure: a gallery/portfolio section must be present.
    expect(demo.design?.sectionOrder).toContain('GALLERY');
    expect(demo.content.gallery).toBeDefined();
    expect(demo.content.gallery!.items.length).toBeGreaterThanOrEqual(3);
    for (const item of demo.content.gallery!.items) {
      expect(item.imageUrl).toMatch(/^https:\/\/images\.unsplash\.com/);
    }

    // Imagery must not be the generic corporate/CA fallback.
    expect(demo.content.hero.imageUrl).toBeDefined();
    expect(demo.content.hero.imageUrl).not.toContain(CA_SKYSCRAPER);
  });

  it('3. Restaurant: menu-led structure with dining copy and food imagery', async () => {
    const { demo } = await generate('Restaurant', 'Spice Route Kitchen & Grill', 'Bengaluru');

    expect(WebsiteContentSchema.safeParse(demo.content).success).toBe(true);
    expect(contentHasCaLeakageForProfession(demo.content, 'Restaurant', 'Spice Route Kitchen & Grill')).toBe(false);

    const serialized = JSON.stringify(demo.content).toLowerCase();
    for (const term of CA_SPECIFIC_BUZZWORDS) {
      expect(serialized).not.toContain(term);
    }

    // Structure: dining businesses need a menu section.
    expect(demo.design?.sectionOrder).toContain('MENU');
    expect(demo.content.menu).toBeDefined();
    expect(demo.content.menu!.categories.length).toBeGreaterThanOrEqual(1);

    // Content + imagery appropriate to dining.
    const copy = JSON.stringify({
      hero: demo.content.hero,
      services: demo.content.services,
    }).toLowerCase();
    expect(copy).toMatch(/dine|dining|menu|food|kitchen|cuisine|dish|order|delivery/);
    expect(demo.content.hero.imageUrl).not.toContain(CA_SKYSCRAPER);
  });

  it('4. Doctor / clinic: patient-first care structure and copy', async () => {
    const { demo } = await generate('Doctor', 'Wellness Family Clinic', 'Pune');

    expect(WebsiteContentSchema.safeParse(demo.content).success).toBe(true);
    expect(contentHasCaLeakageForProfession(demo.content, 'Doctor', 'Wellness Family Clinic')).toBe(false);

    const serialized = JSON.stringify(demo.content).toLowerCase();
    for (const term of CA_SPECIFIC_BUZZWORDS) {
      expect(serialized).not.toContain(term);
    }

    // Healthcare should lead with trust.
    expect(demo.design?.sectionOrder).toContain('TRUST');
    expect(demo.content.services.items.length).toBeGreaterThanOrEqual(4);
    expect(JSON.stringify(demo.content.services).toLowerCase()).toMatch(
      /patient|consult|care|health|treatment|clinic|medical/
    );
    expect(demo.content.hero.imageUrl).not.toContain(CA_SKYSCRAPER);
  });

  it('5. Real estate: listings/portfolio structure with property copy', async () => {
    const { demo } = await generate('Real Estate Agent', 'Prime Key Realty', 'Mumbai');

    expect(WebsiteContentSchema.safeParse(demo.content).success).toBe(true);
    expect(contentHasCaLeakageForProfession(demo.content, 'Real Estate Agent', 'Prime Key Realty')).toBe(false);

    const serialized = JSON.stringify(demo.content).toLowerCase();
    for (const term of CA_SPECIFIC_BUZZWORDS) {
      expect(serialized).not.toContain(term);
    }

    // Property businesses showcase spaces + a listing/package block.
    expect(demo.design?.sectionOrder).toContain('GALLERY');
    expect(demo.content.gallery!.items.length).toBeGreaterThanOrEqual(3);
    expect(demo.content.services.items.length).toBeGreaterThanOrEqual(4);
    expect(JSON.stringify(demo.content.services).toLowerCase()).toMatch(
      /property|properties|home|apartment|commercial|investment|site visit/
    );
    expect(demo.content.hero.imageUrl).not.toContain(CA_SKYSCRAPER);
  });
});

describe('Profession-aware plan & content isolation', () => {
  it('6. Plans differ structurally across professions (not just text)', () => {
    const photo = getProfessionContentPlan('Professional Photographer', 'Amit Photography Studio');
    const restaurant = getProfessionContentPlan('Restaurant', 'Spice Route');
    const ca = getProfessionContentPlan('Chartered Accountant', 'Singhal & Co.');

    expect(photo.sectionOrder).toContain('GALLERY');
    expect(photo.sectionOrder).toContain('EXPERTISE');
    expect(restaurant.sectionOrder).toContain('MENU');
    expect(restaurant.sectionOrder).toContain('GALLERY');
    expect(ca.isCaPractice).toBe(true);
    expect(photo.isCaPractice).toBe(false);

    expect(new Set(photo.sectionOrder)).not.toEqual(new Set(restaurant.sectionOrder));
  });

  it('7. Unknown professions never default to CA', () => {
    const plan = getProfessionContentPlan('Underwater Basket Weaver', 'Deep Blue Studio');
    expect(plan.isCaPractice).toBe(false);
    expect(plan.category).toBe('GENERAL_SMB');
    expect(containedCa(plan.content.industries.join(' '))).toBe(false);
  });

  it('8. normalizeSectionOrder validates, dedupes, and pins HERO/CONTACT/LOCATION', () => {
    const result = normalizeSectionOrder(
      ['GALLERY', 'gallery', 'HERO', 'NOT_A_SECTION', 'SERVICES', 'GALLERY'],
      ['HERO', 'SERVICES', 'CONTACT', 'LOCATION']
    );
    expect(result[0]).toBe('HERO');
    expect(result.filter((s) => s === 'GALLERY')).toHaveLength(1);
    expect(result).not.toContain('NOT_A_SECTION');
    expect(result).toContain('CONTACT');
    expect(result).toContain('LOCATION');
    expect(result.indexOf('CONTACT')).toBeLessThan(result.indexOf('LOCATION'));
  });

  it('9. Scrubber removes CA terminology for non-CA professions but leaves CA intact', () => {
    const content = {
      hero: { headline: 'Chartered Accountant services with GST and statutory audit support' },
    };
    const scrubbed = scrubContentCaLeakage(content, false) as typeof content;
    expect(scrubbed.hero.headline.toLowerCase()).not.toMatch(
      /chartered accountant|gst|statutory audit|accounting/
    );

    // CA practices keep their own terminology untouched.
    const untouched = scrubContentCaLeakage(content, true) as typeof content;
    expect(untouched.hero.headline).toBe(content.hero.headline);

    expect(contentHasCaLeakageForProfession(content as any, 'Professional Photographer')).toBe(true);
    expect(contentHasCaLeakageForProfession(content as any, 'Chartered Accountant')).toBe(false);
  });

  it('10. Image engine returns photography imagery for photographers, not corporate/CA imagery', () => {
    const url = getContextualImageUrl({
      profession: 'Professional Photographer',
      businessName: 'Amit Photography Studio',
      purpose: 'HERO',
    });
    expect(url).toMatch(/^https:\/\/images\.unsplash\.com/);
    expect(url).not.toContain(CA_SKYSCRAPER);
  });
});

function containedCa(text: string): boolean {
  return contentHasCaLeakageForProfession({ industries: { items: [text] } } as any, 'Underwater Basket Weaver');
}
