import { describe, it, expect, vi } from 'vitest';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import { WebsiteDesignSchema } from '@/lib/demos/schema';
import { selectWebsiteDesign } from '@/lib/demos/personalization';
import {
  PROFESSION_ARCHETYPE_IDS,
  DEFAULT_ARCHETYPE_ID,
  getProfessionStitchDesign,
  getProfessionStitchLayout,
  isProfessionStitchLayout,
  isProfessionArchetypeId,
  applyStitchOverrides,
} from '@/lib/demos/profession-stitch';
import {
  isStitchLayout,
  STITCH_DESIGN_MAP,
  personalizeStitchHtml,
} from '@/lib/demos/stitch-personalizer';
import { getStitchRawHtml } from '@/lib/demos/stitch-loader.server';
import { getTemplateScreenshotPath } from '@/lib/demos/stitch-templates';
import { LeadData } from '@/types';

/**
 * Regression suite for the GENERALIZED profession Stitch design system.
 *
 * Rather than one hand-authored set per profession, designs are reusable
 * archetypes picked per lead (deterministically by category, optionally by the
 * AI). These tests lock in that any profession - including unknown ones - gets a
 * Stitch-quality design with no per-profession code, while CA is untouched.
 */

// Force the AI path and return a chosen archetype + accent that differs from the
// category default, proving the generator honors an AI design selection.
vi.mock('@/lib/demos/ai-content-generator', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/demos/ai-content-generator')>();
  return {
    ...actual,
    getGeminiApiKey: () => 'test-gemini-key',
    generateAiBusinessContent: vi.fn(async () => ({
      heroBadge: 'Trusted Local Specialists',
      heroHeadline: 'Dependable service for every home in the city',
      heroSubheadline: 'A committed local team delivering careful, reliable work.',
      primaryCtaLabel: 'Request a Quote',
      aboutLead: 'A local business serving the neighbourhood with care.',
      aboutBody: 'We combine practical experience with dependable delivery on every job.',
      highlights: [],
      servicesSectionTitle: 'Our Services',
      servicesSectionSubtitle: 'The core work we deliver for local clients.',
      services: [{ title: 'Core Service', description: 'Careful, dependable delivery.' }],
      whyChooseUs: [],
      processSteps: [],
      faqs: [],
      // Deliberately a different archetype than the GENERAL_SMB default.
      design: { archetype: 'design-bold-energetic', accentColor: '#0d9488' },
    })),
  };
});

const CA_LEAKAGE_PATTERNS: RegExp[] = [
  /chartered accountant/,
  /\bicai\b/,
  /statutory audit/,
  /transfer pricing/,
  /form 15ca/,
  /\bgst\b/,
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
  const id = `lead-gen-${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
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

async function generate(profession: string, businessName: string, city: string, useAi = false) {
  const lead = makeLead(profession, businessName, city);
  const demo = await WebsiteDemoGeneratorService.generateDemo(lead, {
    useAiEnrichment: useAi,
  });
  const layout = demo.design!.layout;
  const rawHtml = getStitchRawHtml(layout);
  const html = personalizeStitchHtml(rawHtml, demo.content);
  return { lead, demo, layout, html };
}

describe('Generalized profession Stitch design system', () => {
  it('maps every known non-CA category to a reusable archetype', () => {
    expect(getProfessionStitchLayout('FITNESS_GYM')).toBe('design-bold-energetic');
    expect(getProfessionStitchLayout('EDUCATION_COACHING')).toBe('design-bold-energetic');
    expect(getProfessionStitchLayout('BEAUTY_SALON')).toBe('design-beauty-elegant');
    expect(getProfessionStitchLayout('LEGAL_LAW')).toBe('design-classic-professional');
    expect(getProfessionStitchLayout('INTERIOR_ARCHITECTURE')).toBe('design-photo-editorial');
    // Unknown/general categories fall back to the default archetype.
    expect(getProfessionStitchLayout('GENERAL_SMB')).toBe(DEFAULT_ARCHETYPE_ID);
    expect(getProfessionStitchLayout(undefined)).toBeUndefined();
    // CA keeps its own pipeline (no profession archetype).
    expect(getProfessionStitchLayout('CA_FINANCE')).toBeUndefined();
  });

  it('registers every archetype as a Stitch template with a valid thumbnail', () => {
    expect(PROFESSION_ARCHETYPE_IDS.length).toBeGreaterThanOrEqual(7);
    for (const id of PROFESSION_ARCHETYPE_IDS) {
      expect(isStitchLayout(id)).toBe(true);
      expect(isProfessionStitchLayout(id)).toBe(true);
      expect(isProfessionArchetypeId(id)).toBe(true);
      expect(STITCH_DESIGN_MAP[id].isCaOnly).toBe(false);
      expect(STITCH_DESIGN_MAP[id].isProfessionTemplate).toBe(true);
      expect(getTemplateScreenshotPath(id)).toBe(getProfessionStitchDesign(id)!.thumbnail);
    }
    expect(isProfessionArchetypeId('design-does-not-exist')).toBe(false);
  });

  it('routes any unknown profession to a Stitch archetype (not the legacy React theme)', () => {
    const design = selectWebsiteDesign({
      id: 'seed-unknown',
      profession: 'Underwater Basket Weaver',
      businessName: 'Deep Blue Studio',
      city: 'Pune',
    });
    expect(isProfessionStitchLayout(design.layout)).toBe(true);
    expect(WebsiteDesignSchema.safeParse(design).success).toBe(true);
  });

  it('renders a full Stitch page for an unknown profession with zero CA leakage', async () => {
    const { layout, html } = await generate('Underwater Basket Weaver', 'Deep Blue Studio', 'Pune');
    expect(isProfessionStitchLayout(layout)).toBe(true);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Deep Blue Studio');
    expect(html).not.toContain('<!--GV:SECTIONS-->');
    expectNoCaLeakage(html);
  });

  it('renders the bold-energetic archetype for a gym', async () => {
    const { layout, html } = await generate('Gym', 'Iron Ember Fitness Studio', 'Gurugram');
    expect(layout).toBe('design-bold-energetic');
    expect(html).toContain('gv-hero--fullbleed');
    expect(html).toContain('#0d0d10'); // dark energetic palette
    expect(html).toContain('Iron Ember Fitness Studio');
    expectNoCaLeakage(html);
  });

  it('applies a validated accent override and ignores invalid values', () => {
    const base = getProfessionStitchDesign('design-classic-professional')!;
    expect(applyStitchOverrides(base, { accentColor: '#0D9488' }).palette.accent).toBe('#0d9488');
    // Invalid colours are ignored, never injected into the CSS.
    expect(applyStitchOverrides(base, { accentColor: 'javascript:alert(1)' }).palette.accent).toBe(
      base.palette.accent
    );
    expect(applyStitchOverrides(base, { accentColor: 'red' }).palette.accent).toBe(base.palette.accent);
  });

  it('threads the persisted accent directive into the rendered HTML', () => {
    const rawHtml = getStitchRawHtml('design-classic-professional');
    const html = personalizeStitchHtml(rawHtml, {
      brand: { businessName: 'Acme Consulting' },
      meta: { profession: 'Business Consultant' },
      design: { stitch: { accentColor: '#0d9488' } },
    });
    expect(html).toContain('--gv-accent: #0d9488');
  });

  it('lets the AI pick the archetype and accent, persisted for deterministic re-render', async () => {
    const { demo } = await generate('Plumber', 'FlowFix Plumbing Co', 'Noida', /* useAi */ true);

    // The AI chose design-bold-energetic even though GENERAL_SMB defaults to
    // design-classic-professional, proving the override is honored.
    expect(demo.design!.layout).toBe('design-bold-energetic');
    expect(demo.design!.stitch?.archetype).toBe('design-bold-energetic');
    expect(demo.design!.stitch?.accentColor).toBe('#0d9488');
    // The directive is persisted on the validated content for server rendering.
    expect(demo.content.design?.stitch?.accentColor).toBe('#0d9488');
    expect(WebsiteDesignSchema.safeParse(demo.design).success).toBe(true);
  });

  it('ignores an unknown AI archetype and keeps the category default', async () => {
    // getProfessionStitchLayout remains the source of truth when the AI value is
    // not on the allow-list.
    expect(isProfessionArchetypeId('totally-made-up-archetype')).toBe(false);
    const design = selectWebsiteDesign({
      id: 'seed-guard',
      profession: 'Plumber',
      businessName: 'FlowFix Plumbing Co',
      city: 'Noida',
    });
    expect(design.layout).toBe(DEFAULT_ARCHETYPE_ID);
  });
});
