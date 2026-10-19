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
import {
  describeGeminiKeyState,
  generateIndustryBlueprintJson,
  getIndustryBlueprintAiDiagnostics,
  resetIndustryBlueprintAiDiagnostics,
  scrubSecretText,
  listGeminiModels,
  resolveGeminiModels,
  resetGeminiModelCache,
  pingGeminiProvider,
  GEMINI_FALLBACK_MODELS,
} from '@/lib/demos/ai-content-generator';
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

describe('AI diagnostics', () => {
  const facts = {
    profession: 'Plumber',
    archetypeIds: ['design-classic-professional'],
    paletteIds: ['clean-industrial'],
    sectionIds: ['HERO', 'SERVICES', 'CONTACT'],
  };

  const silent = () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  };

  it('reports which key names are populated, without leaking values', () => {
    vi.stubEnv('GEMINI_API_KEY', 'AIza-probe-value-1234567890');
    vi.stubEnv('GOOGLE_API_KEY', 'maps-key-not-read-by-this-app');

    const state = describeGeminiKeyState();
    expect(state.envVars.GEMINI_API_KEY).toBe(true);
    expect(state.resolved).toBe(true);
    // A populated-but-unread name is exactly the "wrong variable name" signal.
    expect(state.unexpectedVars.GOOGLE_API_KEY).toBe(true);
    expect(JSON.stringify(state)).not.toContain('AIza-probe-value');
    expect(JSON.stringify(state)).not.toContain('maps-key');

    vi.unstubAllEnvs();
  });

  it('records every model attempt when the key is rejected', async () => {
    silent();
    resetIndustryBlueprintAiDiagnostics();
    resetGeminiModelCache();
    vi.stubEnv('GEMINI_API_KEY', 'AIza-secret-value-123456');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('denied', { status: 403, statusText: 'Forbidden' }))
    );

    const result = await generateIndustryBlueprintJson(facts);
    expect(result).toBeNull();

    const diag = getIndustryBlueprintAiDiagnostics();
    expect(diag.keyResolved).toBe(true);
    expect(diag.authored).toBe(false);
    // Discovery was refused too, so the chosen model leads the known names.
    expect(diag.availableModels).toEqual(['gemini-3.5-flash-lite', ...GEMINI_FALLBACK_MODELS]);
    expect(diag.attempts).toHaveLength(4);
    expect(diag.attempts[0]).toMatchObject({ model: 'gemini-3.5-flash-lite', status: 403 });
    expect(JSON.stringify(diag)).not.toContain('AIza-secret-value');

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('records success and the model that authored it', async () => {
    silent();
    resetIndustryBlueprintAiDiagnostics();
    resetGeminiModelCache();
    vi.stubEnv('GEMINI_API_KEY', 'AIza-ok-value-123456');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              candidates: [
                { content: { parts: [{ text: JSON.stringify({ sectionOrder: ['HERO', 'SERVICES', 'CONTACT'] }) }] } },
              ],
            }),
            { status: 200 }
          )
      )
    );

    const result = await generateIndustryBlueprintJson(facts);
    expect(result).toBeTruthy();

    const diag = getIndustryBlueprintAiDiagnostics();
    expect(diag.authored).toBe(true);
    expect(diag.model).toBe('gemini-3.5-flash-lite');
    expect(diag.at).toBeTruthy();

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('scrubs credentials out of error text', () => {
    expect(scrubSecretText('GET https://x/y?key=AIzaSySECRET123&a=1 failed')).toBe(
      'GET https://x/y?key=***&a=1 failed'
    );
    expect(scrubSecretText('rejected AIzaSyABCDEFGHIJKLMNOP')).toBe('rejected AIza***');
  });

  it('asks the API which models exist and ranks the lightest family first', async () => {
    resetGeminiModelCache();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              models: [
                { name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent'] },
                { name: 'models/gemini-3-pro', supportedGenerationMethods: ['generateContent'] },
                { name: 'models/gemini-3-flash', supportedGenerationMethods: ['generateContent'] },
                { name: 'models/gemini-3.8-flash-lite', supportedGenerationMethods: ['generateContent'] },
                // An image model: generateContent yes, text answers no.
                { name: 'models/gemini-3.1-flash-lite-image', supportedGenerationMethods: ['generateContent'] },
                // Newest name, but an unknown family: answering a JSON prompt is
                // not what it is for, so it must not be tried first.
                { name: 'models/gemini-4-argon', supportedGenerationMethods: ['generateContent'] },
                // Supports generateContent but is not a chat model.
                { name: 'models/imagen-3', supportedGenerationMethods: ['generateContent'] },
                // Right name shape, wrong capability.
                { name: 'models/gemini-embedding-001', supportedGenerationMethods: ['embedContent'] },
                { name: 'models/text-embedding-004', supportedGenerationMethods: ['generateContent'] },
                { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
              ],
            }),
            { status: 200 }
          )
      )
    );

    const models = await listGeminiModels('AIza-model-list-key');
    expect(models).toEqual([
      'gemini-3.8-flash-lite',
      'gemini-3-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-3-pro',
      'gemini-4-argon',
    ]);
    // An image model must never be treated as a candidate for text.
    expect(models).not.toContain('gemini-3.1-flash-lite-image');

    resetGeminiModelCache();
    vi.unstubAllGlobals();
  });

  it('falls back to known names when the model list cannot be read', async () => {
    resetGeminiModelCache();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      })
    );

    expect(await listGeminiModels('AIza-unreachable-key')).toEqual([]);
    // Discovery failed, so the chosen model is tried, then the known names.
    expect(await resolveGeminiModels('AIza-unreachable-key')).toEqual([
      'gemini-3.5-flash-lite',
      ...GEMINI_FALLBACK_MODELS,
    ]);

    resetGeminiModelCache();
    vi.unstubAllGlobals();
  });

  it('puts the chosen model first when the API confirms it exists', async () => {
    resetGeminiModelCache();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              models: [
                { name: 'models/gemini-3.5-flash-lite', supportedGenerationMethods: ['generateContent'] },
                { name: 'models/gemini-3.9-flash', supportedGenerationMethods: ['generateContent'] },
                { name: 'models/gemini-3.8-flash-lite', supportedGenerationMethods: ['generateContent'] },
                { name: 'models/gemini-4-argon', supportedGenerationMethods: ['generateContent'] },
                { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
              ],
            }),
            { status: 200 }
          )
      )
    );

    expect(await resolveGeminiModels('AIza-chosen-key')).toEqual([
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash-lite',
      'gemini-3.9-flash',
      'gemini-3.8-flash',
    ]);

    resetGeminiModelCache();
    vi.unstubAllGlobals();
  });

  it('falls back to the lightest ranking when the chosen model is gone', async () => {
    resetGeminiModelCache();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              models: [
                { name: 'models/gemini-3.9-flash', supportedGenerationMethods: ['generateContent'] },
                { name: 'models/gemini-3.8-flash-lite', supportedGenerationMethods: ['generateContent'] },
                { name: 'models/gemini-4-argon', supportedGenerationMethods: ['generateContent'] },
                { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
              ],
            }),
            { status: 200 }
          )
      )
    );

    // Ranked purely by version, "3.9-flash" would lead; lightest wins instead.
    expect(await resolveGeminiModels('AIza-lightest-key')).toEqual([
      'gemini-3.8-flash-lite',
      'gemini-3.9-flash',
      'gemini-3.8-flash',
      'gemini-4-argon',
    ]);

    resetGeminiModelCache();
    vi.unstubAllGlobals();
  });

  it('retries a call that stalls instead of moving to another model', async () => {
    silent();
    resetIndustryBlueprintAiDiagnostics();
    resetGeminiModelCache();
    vi.stubEnv('GEMINI_API_KEY', 'AIza-stall-key');
    let generateCalls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('/models?')) {
          return new Response(
            JSON.stringify({
              models: [
                { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
              ],
            }),
            { status: 200 }
          );
        }
        generateCalls += 1;
        if (generateCalls === 1) {
          // A stall answers nothing at all: retry the same model.
          throw new Error('The operation was aborted due to timeout');
        }
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify({ sectionOrder: ['HERO', 'SERVICES', 'CONTACT'] }) }],
                },
              },
            ],
          }),
          { status: 200 }
        );
      })
    );

    const result = await generateIndustryBlueprintJson(facts);
    expect(generateCalls).toBe(2);
    expect(result).toBeTruthy();

    const diag = getIndustryBlueprintAiDiagnostics();
    expect(diag.authored).toBe(true);
    expect(diag.attempts[0]).toMatchObject({ model: 'gemini-3.8-flash', status: 200 });

    resetGeminiModelCache();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('retries a capacity error once and keeps the answer', async () => {
    silent();
    resetIndustryBlueprintAiDiagnostics();
    resetGeminiModelCache();
    vi.stubEnv('GEMINI_API_KEY', 'AIza-retry-key');
    let generateCalls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('/models?')) {
          return new Response(
            JSON.stringify({
              models: [
                { name: 'models/gemini-3-flash', supportedGenerationMethods: ['generateContent'] },
              ],
            }),
            { status: 200 }
          );
        }
        generateCalls += 1;
        if (generateCalls === 1) {
          // 503 means "the request was fine, the provider is busy" — worth one retry.
          return new Response(
            JSON.stringify({
              error: { code: 503, message: 'This model is currently experiencing high demand.' },
            }),
            { status: 503 }
          );
        }
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify({ sectionOrder: ['HERO', 'SERVICES', 'CONTACT'] }) }],
                },
              },
            ],
          }),
          { status: 200 }
        );
      })
    );

    const result = await generateIndustryBlueprintJson(facts);
    expect(generateCalls).toBe(2);
    expect(result).toBeTruthy();
    expect(getIndustryBlueprintAiDiagnostics().authored).toBe(true);

    resetGeminiModelCache();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('stops retrying an overloaded model and moves to the next one', async () => {
    silent();
    resetIndustryBlueprintAiDiagnostics();
    resetGeminiModelCache();
    vi.stubEnv('GEMINI_API_KEY', 'AIza-capacity-key');
    const called: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const href = String(url);
        if (href.includes('/models?')) {
          return new Response(
            JSON.stringify({
              models: [
                { name: 'models/gemini-3-flash', supportedGenerationMethods: ['generateContent'] },
                { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
              ],
            }),
            { status: 200 }
          );
        }
        const model = href.match(/models\/([^:]+):/)?.[1] || '?';
        called.push(model);
        if (model === 'gemini-3-flash') {
          return new Response(JSON.stringify({ error: { message: 'high demand' } }), { status: 503 });
        }
        return new Response(
          JSON.stringify({
            candidates: [
              { content: { parts: [{ text: JSON.stringify({ sectionOrder: ['HERO', 'CONTACT'] }) }] } },
            ],
          }),
          { status: 200 }
        );
      })
    );

    const result = await generateIndustryBlueprintJson(facts);
    expect(result).toBeTruthy();
    // Twice on the overloaded model, then on to the next.
    expect(called).toEqual(['gemini-3-flash', 'gemini-3-flash', 'gemini-2.5-flash']);

    const diag = getIndustryBlueprintAiDiagnostics();
    expect(diag.attempts[0]).toMatchObject({ model: 'gemini-3-flash', status: 503 });
    expect(diag.model).toBe('gemini-2.5-flash');
    expect(diag.authored).toBe(true);

    resetGeminiModelCache();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('reports the reason the API gave for a failed model call', async () => {
    silent();
    resetIndustryBlueprintAiDiagnostics();
    resetGeminiModelCache();
    vi.stubEnv('GEMINI_API_KEY', 'AIza-body-reporting-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        String(url).includes('/models?')
          ? new Response(
              JSON.stringify({
                models: [
                  { name: 'models/gemini-9-flash', supportedGenerationMethods: ['generateContent'] },
                ],
              }),
              { status: 200 }
            )
          : new Response(
              JSON.stringify({
                error: {
                  code: 404,
                  message: 'models/gemini-9-flash is not found for API version v1beta',
                },
              }),
              { status: 404, statusText: 'Not Found' }
            )
      )
    );

    const result = await generateIndustryBlueprintJson(facts);
    expect(result).toBeNull();

    const diag = getIndustryBlueprintAiDiagnostics();
    expect(diag.availableModels).toEqual(['gemini-9-flash']);
    expect(diag.attempts).toHaveLength(1);
    expect(diag.attempts[0].status).toBe(404);
    // The generic statusText ("Not Found") would not have explained anything.
    expect(diag.attempts[0].error).toContain('is not found for API version v1beta');
    expect(diag.authored).toBe(false);

    resetGeminiModelCache();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('pings the provider with a one-line prompt', async () => {
    silent();
    resetGeminiModelCache();
    vi.stubEnv('GEMINI_API_KEY', 'AIza-ping-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        String(url).includes('/models?')
          ? new Response(
              JSON.stringify({
                models: [
                  { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
                ],
              }),
              { status: 200 }
            )
          : new Response(
              JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] }),
              { status: 200 }
            )
      )
    );

    const ping = await pingGeminiProvider();
    expect(ping.ok).toBe(true);
    expect(ping.keyResolved).toBe(true);
    expect(ping.available).toEqual(['gemini-3.8-flash']);
    expect(ping.models).toEqual(['gemini-3.8-flash']);
    expect(ping.attempts[0]).toMatchObject({ model: 'gemini-3.8-flash', status: 200 });

    resetGeminiModelCache();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
});

describe('provisional fallback designs', () => {
  const profession = 'Provisional Design Probe Trade';
  const key = buildIndustryKey(profession, null);

  const reset = async () => {
    clearIndustryBlueprintCache();
    await IndustryBlueprintRepository.deleteIndustryBlueprint(key);
  };

  it('does not freeze a design that failed only because the provider was unavailable', async () => {
    await reset();
    let authorCalls = 0;
    const deps = {
      aiAuthor: async () => {
        authorCalls += 1;
        return null; // busy, rate limited, or stalled
      },
      aiFailureIsTransient: () => true,
    };

    const first = await getIndustryDesignBlueprint({ profession }, deps);
    expect(first.source).toBe('deterministic');
    expect(authorCalls).toBe(1);
    // Nothing was stored, so a later attempt can still replace the fallback.
    expect(await IndustryBlueprintRepository.getIndustryBlueprint(key)).toBeNull();

    // Within the cooldown the placeholder is reused rather than re-authored.
    await getIndustryDesignBlueprint({ profession }, deps);
    expect(authorCalls).toBe(1);

    // Past the cooldown it tries again instead of staying frozen.
    const realNow = Date.now;
    let clock = realNow();
    const spy = vi.spyOn(Date, 'now').mockImplementation(() => clock);
    try {
      clock += 11 * 60 * 1000;
      await getIndustryDesignBlueprint({ profession }, deps);
    } finally {
      spy.mockRestore();
    }
    expect(authorCalls).toBe(2);

    await reset();
  });

  it('stores the fallback when the provider gave a settled no', async () => {
    await reset();
    let authorCalls = 0;
    const deps = {
      aiAuthor: async () => {
        authorCalls += 1;
        return null; // e.g. the key was rejected: retrying changes nothing
      },
      aiFailureIsTransient: () => false,
    };

    const first = await getIndustryDesignBlueprint({ profession }, deps);
    expect(first.source).toBe('deterministic');
    expect(await IndustryBlueprintRepository.getIndustryBlueprint(key)).toBeTruthy();

    // A stored design is reused without asking the provider again.
    clearIndustryBlueprintCache();
    await getIndustryDesignBlueprint({ profession }, deps);
    expect(authorCalls).toBe(1);

    await reset();
  });
});

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

  it('does not let a trade match a rule it merely contains a word of', () => {
    // Substring traps: "Carton" (car), "Pet Care" (car), "Carpet" (car),
    // "Textile" (tile), "Bookkeeping" (book), "Art Workshop" (workshop).
    const cases: Array<[string, string, string]> = [
      ['Carton & Label Packaging', 'design-classic-professional', 'clean-industrial'],
      ['Pet Care Services', 'design-classic-professional', 'organic-care'],
      ['Carpet & Sofa Cleaning', 'design-classic-professional', 'organic-care'],
      ['Spare Parts Shop', 'design-bold-energetic', 'midnight-garage'],
      ['Art Workshop', 'design-classic-professional', 'corporate-navy'],
      ['Textile Trading', 'design-classic-professional', 'corporate-navy'],
      ['Automatic Door Systems', 'design-classic-professional', 'corporate-navy'],
      ['Cabinet Manufacturing', 'design-classic-professional', 'clean-industrial'],
    ];

    for (const [profession, archetype, paletteId] of cases) {
      const blueprint = buildDeterministicBlueprint(profession, `${profession} Co`);
      expect({ profession, archetype: blueprint.archetype, paletteId: blueprint.paletteId }).toEqual({
        profession,
        archetype,
        paletteId,
      });
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
