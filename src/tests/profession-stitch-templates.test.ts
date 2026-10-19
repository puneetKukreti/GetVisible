import { describe, it, expect } from 'vitest';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import { WebsiteDesignSchema } from '@/lib/demos/schema';
import { selectWebsiteDesign } from '@/lib/demos/personalization';
import {
  PROFESSION_STITCH_DESIGNS,
  getProfessionStitchDesign,
  getProfessionStitchLayout,
  isProfessionStitchLayout,
} from '@/lib/demos/profession-stitch';
import {
  isStitchLayout,
  STITCH_DESIGN_MAP,
  personalizeStitchHtml,
} from '@/lib/demos/stitch-personalizer';
import { getStitchRawHtml } from '@/lib/demos/stitch-loader.server';
import { getTemplateScreenshotPath } from '@/lib/demos/stitch-templates';
import { getDeterministicProfessionProfile } from '@/lib/demos/ai-content-generator';
import { LeadData } from '@/types';

/**
 * Regression suite for the profession-specific Stitch template sets.
 *
 * Verifies that non-CA professions (photography, restaurant, healthcare,
 * real estate) are served their OWN Stitch-quality template (not a CA template
 * with swapped text), that the section structure is profession-appropriate, and
 * that no CA terminology leaks into the rendered HTML.
 */

const CA_LEAKAGE_PATTERNS: RegExp[] = [
  /chartered accountant/,
  /\bicai\b/,
  /statutory audit/,
  /audit services/,
  /transfer pricing/,
  /form 15ca/,
  /\bgst\b/,
  /\bitr\b/,
  /tax filing/,
  /financial compliance/,
  /accounting practice/,
  /\bsharma\b/,
];

function expectNoCaLeakage(html: string) {
  const lower = html.toLowerCase();
  for (const pattern of CA_LEAKAGE_PATTERNS) {
    expect(lower).not.toMatch(pattern);
  }
}

function makeLead(profession: string, businessName: string, city: string): LeadData {
  const id = `lead-stitch-${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
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
  const layout = demo.design!.layout;
  const rawHtml = getStitchRawHtml(layout);
  const html = personalizeStitchHtml(rawHtml, demo.content);
  return { lead, demo, layout, html };
}

describe('Profession-specific Stitch template sets', () => {
  it('registers a dedicated design for each required non-CA profession', () => {
    expect(getProfessionStitchLayout('PHOTOGRAPHY_CREATIVE')).toBe('design-photo-editorial');
    expect(getProfessionStitchLayout('RESTAURANT_HOSPITALITY')).toBe('design-restaurant-warm');
    expect(getProfessionStitchLayout('HEALTHCARE_MEDICAL')).toBe('design-clinic-clean');
    expect(getProfessionStitchLayout('REAL_ESTATE_PROPERTY')).toBe('design-realestate-premium');

    // CA has its own (pre-existing) templates and no profession set.
    expect(getProfessionStitchLayout('CA_FINANCE')).toBeUndefined();

    for (const id of Object.keys(PROFESSION_STITCH_DESIGNS)) {
      expect(isStitchLayout(id)).toBe(true);
      expect(isProfessionStitchLayout(id)).toBe(true);
      expect(STITCH_DESIGN_MAP[id].isCaOnly).toBe(false);
      expect(STITCH_DESIGN_MAP[id].isProfessionTemplate).toBe(true);
    }
  });

  it('selectWebsiteDesign routes non-CA professions to their Stitch set (valid schema)', () => {
    const cases: [string, string, string][] = [
      ['Professional Photographer', 'Amit Photography Studio', 'delhi'],
      ['Restaurant', 'Spice Route Kitchen', 'mumbai'],
      ['Doctor', 'Wellness Family Clinic', 'pune'],
      ['Real Estate Agent', 'Prime Key Realty', 'gurugram'],
    ];

    for (const [profession, businessName] of cases) {
      const design = selectWebsiteDesign({ id: 'seed-1', profession, businessName, city: 'Delhi' });
      expect(isProfessionStitchLayout(design.layout)).toBe(true);
      expect(WebsiteDesignSchema.safeParse(design).success).toBe(true);
      // The archetype template is preserved for the React fallback.
      expect(design.template).toBeTruthy();
    }
  });

  it('exposes the profession design as a raw shell with a template marker', () => {
    const shell = getStitchRawHtml('design-photo-editorial');
    expect(shell).toContain('<!DOCTYPE html>');
    expect(shell).toContain('data-gv-template="design-photo-editorial"');
    expect(shell).toContain('<!--GV:SECTIONS-->');
    expect(getProfessionStitchDesign('design-photo-editorial')?.category).toBe('PHOTOGRAPHY_CREATIVE');
  });

  it('keeps the profession header on one line at phone widths', () => {
    for (const id of Object.keys(PROFESSION_STITCH_DESIGNS)) {
      const shell = getStitchRawHtml(id);

      // Phone-scoped rules inside the existing 620px breakpoint…
      expect(shell).toContain('@media (max-width: 620px)');
      // …that drop the duplicate in-header CTA and its redundant profession tag,
      // leaving the firm name the full width of the bar.
      expect(shell).toContain('.gv-header__inner { gap: 12px; }');
      expect(shell).toContain('.gv-header__inner .gv-btn { display: none; }');
      expect(shell).toContain('.gv-brand { font-size: 17px; max-width: 100%; min-width: 0; }');
      expect(shell).toContain('.gv-brand__tag { display: none; }');
    }
  });

  it('photographer: masonry portfolio, image-led copy, zero CA leakage', async () => {
    const { html, layout } = await generate('Professional Photographer', 'Amit Photography Studio', 'Delhi NCR');
    expect(layout).toBe('design-photo-editorial');

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<body');
    expect(html).toContain('Amit Photography Studio');
    expect(html).toContain('gv-gallery--masonry');
    expect(html).toContain('gv-hero--fullbleed');
    expect(html).not.toContain('<!--GV:SECTIONS-->');

    expectNoCaLeakage(html);
  });

  it('restaurant: menu ledger with pricing and warm palette, zero CA leakage', async () => {
    const { html, layout } = await generate('Restaurant', 'Spice Route Kitchen & Grill', 'Bengaluru');
    expect(layout).toBe('design-restaurant-warm');

    expect(html).toContain('gv-menu');
    expect(html).toContain('gv-menu__price');
    expect(html).toContain('id="menu"');
    expect(html).toContain('Spice Route Kitchen &amp; Grill');
    // Warm, light hospitality palette rather than a dark corporate one.
    expect(html).toContain('#fdf8f1');

    expectNoCaLeakage(html);
  });

  it('clinic: trust strip + patient process, clean palette, zero CA leakage', async () => {
    const { html, layout } = await generate('Doctor', 'Wellness Family Clinic', 'Pune');
    expect(layout).toBe('design-clinic-clean');

    expect(html).toContain('gv-trust');
    expect(html).toContain('gv-hero--centered');
    expect(html).toContain('#f5fafb');

    expectNoCaLeakage(html);
  });

  it('real estate: premium listings layout with property segments, zero CA leakage', async () => {
    const { html, layout } = await generate('Real Estate Agent', 'Prime Key Realty', 'Mumbai');
    expect(layout).toBe('design-realestate-premium');

    expect(html).toContain('gv-gallery--listings');
    expect(html).toContain('gv-hero--fullbleed');
    expect(html).toContain('Prime Key Realty');

    expectNoCaLeakage(html);
  });

  it('does not leave CA templates rendering for non-CA professions', () => {
    // The classic CA template brand must never appear for a profession design.
    const shell = getStitchRawHtml('design-restaurant-warm');
    expect(shell).not.toContain('Sharma');
    expect(shell).not.toContain('ICAI');
    expect(shell).not.toContain('services-grid');
  });

  it('restaurant copy never inherits modular-kitchen interior content from its name', async () => {
    const { demo } = await generate('Restaurant', 'Spice Route Kitchen & Grill', 'Bengaluru');
    const serialized = JSON.stringify(demo.content).toLowerCase();

    // The word "Kitchen" in a hospitality name must not select the interior profile.
    expect(serialized).not.toMatch(/modular kitchen|wardrobe|woodwork|german hardware|3d design/);
    expect(demo.content.menu).toBeDefined();
    expect(serialized).toMatch(/dine-in|takeaway|delivery|dining|cuisine/);
  });

  it('a genuine modular-kitchen interior business still gets kitchen content', () => {
    const profile = getDeterministicProfessionProfile({
      businessName: 'Urban Modular Kitchens & Wardrobes',
      profession: 'Modular Kitchen Designer',
      city: 'Noida',
      address: 'Noida, India',
    });
    expect(JSON.stringify(profile).toLowerCase()).toMatch(/modular|wardrobe|cabinet/);
  });

  it('resolves a profession-specific preview thumbnail', () => {
    expect(getTemplateScreenshotPath('design-photo-editorial')).toBe(
      '/demo-templates/design-photo-editorial/hero.png'
    );
    expect(getTemplateScreenshotPath('design-restaurant-warm')).toBe(
      '/demo-templates/design-restaurant-warm/hero.png'
    );
    // CA behaviour is unchanged.
    expect(getTemplateScreenshotPath('design-1-premium')).toBe(
      '/demo-templates/design-1-premium/hero.png'
    );
  });
});
