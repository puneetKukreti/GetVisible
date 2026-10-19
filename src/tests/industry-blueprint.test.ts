import { describe, it, expect, vi } from 'vitest';
import {
  buildIndustryKey,
  buildDeterministicBlueprint,
  validateIndustryBlueprint,
  getIndustryDesignBlueprint,
  clearIndustryBlueprintCache,
  buildBlueprintIndustryBrief,
  reauthorIndustryDesignBlueprint,
} from '@/lib/demos/industry-blueprint';
import {
  PROFESSION_ARCHETYPE_IDS,
  getProfessionStitchDesign,
  applyStitchOverrides,
} from '@/lib/demos/profession-stitch';
import { isIndustryPaletteId } from '@/lib/demos/industry-palettes';
import { personalizeStitchHtml } from '@/lib/demos/stitch-personalizer';
import { getStitchRawHtml } from '@/lib/demos/stitch-loader.server';
import { IndustryBlueprintRepository } from '@/lib/db/repository';
import { WebsiteSectionType } from '@/types';

/**
 * Per-industry design blueprint suite.
 *
 * The blueprint is what lets a trade we have no curated design for still be
 * designed the way the best-performing websites in that industry are built:
 * section flow, layout archetype, palette/typography system, copy framing and
 * imagery treatment — authored once per industry, then reused (deterministic).
 * These tests lock in the safety rules (allow-list only, never throws) and the
 * per-industry determinism/caching.
 */

describe('industry design blueprints', () => {
  it('normalises a profession into a stable industry key', () => {
    expect(buildIndustryKey('Car Detailing & Automobile Workshop', 'Shine Motors')).toBe('car-detailing');
    // Related naming shares one industry design.
    expect(buildIndustryKey('Car Detailing', null)).toBe('car-detailing');
    expect(buildIndustryKey('Solar Panel Installation', 'SunBright Energy')).toBe('solar-panel');
    // Nothing meaningful -> general bucket (never empty).
    expect(buildIndustryKey('', null)).toBe('general-business');
    expect(buildIndustryKey('Services', 'The Company')).toBe('general-business');
  });

  it('designs a car-detailing demo the way leading detailing sites are built', () => {
    const blueprint = buildDeterministicBlueprint(
      'Car Detailing & Automobile Workshop',
      'Shine Motors Detailing Studio'
    );

    expect(blueprint.source).toBe('deterministic');
    expect(PROFESSION_ARCHETYPE_IDS).toContain(blueprint.archetype);
    expect(blueprint.archetype).toBe('design-bold-energetic');
    expect(blueprint.paletteId).toBe('midnight-garage');
    expect(blueprint.heroStyle).toBe('fullbleed');
    expect(blueprint.sectionOrder[0]).toBe('HERO');
    expect(blueprint.sectionOrder).toContain('SERVICES');
    expect(blueprint.sectionOrder).toContain('GALLERY');
    expect(blueprint.imagery.keywords).toContain('ceramic coating');
    expect(blueprint.imagery.treatment.toLowerCase()).toContain('glossy');
    expect(blueprint.copy.primaryCta).toBe('Book a Detailing Slot');
    expect(blueprint.copy.trustSignals.length).toBeGreaterThanOrEqual(3);
  });

  it('falls back to the curated default design for an unknown trade', () => {
    const blueprint = buildDeterministicBlueprint('Underwater Basket Weaver', 'Deep Blue Studio');
    expect(PROFESSION_ARCHETYPE_IDS).toContain(blueprint.archetype);
    expect(isIndustryPaletteId(blueprint.paletteId)).toBe(true);
    expect(blueprint.sectionOrder[0]).toBe('HERO');
    expect(blueprint.copy.primaryCta.length).toBeGreaterThan(2);
  });

  it('repairs an authored blueprint that steps outside the allow-lists', () => {
    const seed = buildDeterministicBlueprint('Car Detailing & Automobile Workshop', 'Shine Motors');
    const repaired = validateIndustryBlueprint(
      {
        archetype: 'design-evil-injected',
        paletteId: 'not-a-palette',
        accentColor: 'javascript:alert(1)',
        heroStyle: 'explode',
        sectionOrder: ['TESTIMONIALS', 'SERVICES', 'HERO', 'SERVICES', 'GALLERY'],
        copy: { tone: 'x', trustSignals: ['one signal only'], heroPattern: 'Shine for {city}' },
        imagery: { keywords: ['ceramic coating', 'a', 'ok'] },
      },
      seed
    )!;

    // Unknown ids are replaced by the curated seed, never injected.
    expect(repaired.archetype).toBe(seed.archetype);
    expect(repaired.paletteId).toBe(seed.paletteId);
    expect(repaired.accentColor).toBeUndefined();
    // Non-renderable sections are dropped, HERO is forced first, CONTACT kept.
    expect(repaired.sectionOrder[0]).toBe('HERO');
    expect(repaired.sectionOrder).toContain('CONTACT');
    expect(repaired.sectionOrder).not.toContain('TESTIMONIALS' as WebsiteSectionType);
    expect(new Set(repaired.sectionOrder).size).toBe(repaired.sectionOrder.length);
    // Fields that are too thin fall back to the curated copy.
    expect(repaired.copy.tone).toBe(seed.copy.tone);
    expect(repaired.copy.trustSignals).toEqual(seed.copy.trustSignals);
    expect(repaired.copy.heroPattern).toBe('Shine for {city}');
    // Junk/short keywords are dropped rather than searched.
    expect(repaired.imagery.keywords).toEqual(['ceramic coating']);
    // Always a real, safe design.
    expect(PROFESSION_ARCHETYPE_IDS).toContain(repaired.archetype);
    expect(isIndustryPaletteId(repaired.paletteId)).toBe(true);
  });

  it('keeps an authored section flow but guarantees the core sections', () => {
    const seed = buildDeterministicBlueprint('Plumber', 'FlowFix Plumbing Co');
    const repaired = validateIndustryBlueprint(
      {
        archetype: 'design-bold-energetic',
        paletteId: 'clean-industrial',
        sectionOrder: ['GALLERY', 'HERO', 'ABOUT', 'LOCATION'],
      },
      seed
    )!;

    // The authored flow is honoured (image-led opening), but HERO leads, the
    // core sections exist and the close is coherent.
    expect(repaired.sectionOrder[0]).toBe('HERO');
    expect(repaired.sectionOrder.indexOf('GALLERY')).toBeLessThan(repaired.sectionOrder.indexOf('SERVICES'));
    expect(repaired.sectionOrder).toContain('SERVICES');
    expect(repaired.sectionOrder).toContain('CONTACT');
    expect(repaired.sectionOrder[repaired.sectionOrder.length - 1]).toBe('LOCATION');
    expect(repaired.archetype).toBe('design-bold-energetic');
    expect(repaired.paletteId).toBe('clean-industrial');
  });

  it('covers common generic trades with an industry-apt design', () => {
    const cases: Array<[string, string, string]> = [
      ['Travel Agency', 'design-photo-editorial', 'warm-artisan'],
      ['Printing & Packaging', 'design-classic-professional', 'clean-industrial'],
      ['Agri Seeds & Fertilizers', 'design-classic-professional', 'organic-care'],
      ['Appliance Repair Services', 'design-classic-professional', 'electric-blueprint'],
      ['House Cleaning Services', 'design-classic-professional', 'organic-care'],
      ['Pet Grooming Studio', 'design-classic-professional', 'organic-care'],
      ['Pest Control Services', 'design-classic-professional', 'organic-care'],
      ['Packers and Movers', 'design-classic-professional', 'clean-industrial'],
      ['Yoga & Fitness Studio', 'design-bold-energetic', 'vivid-sport'],
      ['Modular Furniture Works', 'design-classic-professional', 'clean-industrial'],
      ['Solar Panel Installation', 'design-bold-energetic', 'electric-blueprint'],
      ['CCTV & Security Systems', 'design-classic-professional', 'electric-blueprint'],
    ];

    for (const [profession, archetype, paletteId] of cases) {
      const blueprint = buildDeterministicBlueprint(profession, `${profession} Studio`);
      expect({ profession, archetype: blueprint.archetype, paletteId: blueprint.paletteId }).toEqual({
        profession,
        archetype,
        paletteId,
      });
      expect(blueprint.sectionOrder[0]).toBe('HERO');
      expect(blueprint.imagery.keywords.length).toBeGreaterThan(0);
      expect(blueprint.copy.primaryCta.length).toBeGreaterThan(2);
    }
  });

  it('rejects a payload that is not a blueprint at all', () => {    const seed = buildDeterministicBlueprint('Plumber', 'FlowFix Plumbing Co');
    expect(validateIndustryBlueprint('nonsense', seed)).toBeNull();
    expect(validateIndustryBlueprint(null, seed)).toBeNull();
  });

  it('authors once per industry, persists it and reuses it for later leads', async () => {
    clearIndustryBlueprintCache();
    const author = vi.fn(async () => ({
      archetype: 'design-bold-energetic',
      paletteId: 'vivid-sport',
      heroStyle: 'fullbleed',
      sectionOrder: ['HERO', 'SERVICES', 'GALLERY', 'CONTACT'],
      copy: { tone: 'punchy, energetic, local' },
      imagery: { keywords: ['basket weaving studio'] },
    }));

    const first = await getIndustryDesignBlueprint(
      { profession: 'Underwater Basket Weaver', businessName: 'Deep Blue Studio', city: 'Pune' },
      { aiAuthor: author }
    );
    expect(first.source).toBe('ai');
    expect(first.paletteId).toBe('vivid-sport');
    expect(author).toHaveBeenCalledTimes(1);

    // Persisted globally, so other instances/leads reuse the same design.
    const stored = await IndustryBlueprintRepository.getIndustryBlueprint('underwater-basket');
    expect(stored?.source).toBe('ai');
    expect(stored?.blueprint.paletteId).toBe('vivid-sport');

    // A cold cache re-reads the persisted design instead of re-authoring.
    clearIndustryBlueprintCache();
    const second = await getIndustryDesignBlueprint(
      { profession: 'Underwater Basket Weaver', businessName: 'Deep Blue Studio' },
      { aiAuthor: author }
    );
    expect(second.paletteId).toBe('vivid-sport');
    expect(second.sectionOrder).toEqual(first.sectionOrder);
    expect(author).toHaveBeenCalledTimes(1);
  });

  it('returns the identical design for repeat calls in one process', async () => {
    clearIndustryBlueprintCache();
    const a = await getIndustryDesignBlueprint({ profession: 'Solar Panel Installation', businessName: 'SunBright' });
    const b = await getIndustryDesignBlueprint({ profession: 'Solar Panel Installation', businessName: 'SunBright' });
    expect(b).toBe(a);
  });

  it('never throws when authoring fails — falls back to the curated design', async () => {
    clearIndustryBlueprintCache();
    const blueprint = await getIndustryDesignBlueprint(
      { profession: 'Pest Control Services', businessName: 'PestAway' },
      {
        aiAuthor: async () => {
          throw new Error('authoring exploded');
        },
      }
    );
    expect(blueprint.source).toBe('deterministic');
    expect(isIndustryPaletteId(blueprint.paletteId)).toBe(true);
    expect(blueprint.sectionOrder[0]).toBe('HERO');
  });

  it('applies a blueprint palette and hero treatment through the stitch directive', () => {
    const base = getProfessionStitchDesign('design-classic-professional')!;

    const themed = applyStitchOverrides(base, { paletteId: 'midnight-garage', heroStyle: 'fullbleed' });
    expect(themed.palette.bg).toBe('#0d0e11');
    expect(themed.palette.accent).toBe('#f59e0b');
    expect(themed.heroStyle).toBe('fullbleed');
    expect(themed.fontDisplay).toContain('Barlow');

    // Unknown ids are ignored — the archetype's own design survives untouched.
    const safe = applyStitchOverrides(base, {
      paletteId: 'nope',
      heroStyle: 'zoom' as unknown as 'fullbleed',
    });
    expect(safe.palette).toEqual(base.palette);
    expect(safe.heroStyle).toBe(base.heroStyle);

    // An explicit accent still wins over the palette's own accent.
    expect(
      applyStitchOverrides(base, { paletteId: 'midnight-garage', accentColor: '#0d9488' }).palette.accent
    ).toBe('#0d9488');
  });

  it('renders the blueprint palette into the final HTML', () => {
    const rawHtml = getStitchRawHtml('design-classic-professional');
    const html = personalizeStitchHtml(rawHtml, {
      brand: { businessName: 'Shine Motors Detailing Studio' },
      meta: { profession: 'Car Detailing' },
      city: 'Pune',
      design: {
        stitch: { paletteId: 'midnight-garage', heroStyle: 'fullbleed' },
      },
    });
    expect(html).toContain('#0d0e11'); // Midnight Garage page background
    expect(html).toContain('gv-hero--fullbleed');
  });

  it('re-authors an industry so a stale stored design can be replaced', async () => {
    clearIndustryBlueprintCache();
    // A stored design that predates an improved curated rule (the printing rule
    // was added later, so an old row would still be the generic default).
    await IndustryBlueprintRepository.saveIndustryBlueprint({
      key: 'printing-press',
      industry: 'Printing Press',
      blueprint: buildDeterministicBlueprint('Underwater Basket Weaver', 'Deep Blue Studio'),
      source: 'deterministic',
      version: 1,
      createdAt: new Date().toISOString(),
    });
    const cached = await getIndustryDesignBlueprint({ profession: 'Printing Press' });
    expect(cached.paletteId).toBe('corporate-navy');

    const refreshed = await reauthorIndustryDesignBlueprint({ profession: 'Printing Press' });
    expect(refreshed.paletteId).toBe('clean-industrial');

    // The refreshed design is what later leads in the industry get.
    clearIndustryBlueprintCache();
    const later = await getIndustryDesignBlueprint({ profession: 'Printing Press' });
    expect(later.paletteId).toBe('clean-industrial');
  });

  it('builds a copy brief with the city substituted', () => {    const blueprint = buildDeterministicBlueprint(
      'Car Detailing & Automobile Workshop',
      'Shine Motors Detailing Studio'
    );
    const brief = buildBlueprintIndustryBrief(blueprint, 'Pune');
    expect(brief).toContain('Pune');
    expect(brief).not.toContain('{city}');
    expect(brief).toContain(blueprint.copy.primaryCta);
  });
});
