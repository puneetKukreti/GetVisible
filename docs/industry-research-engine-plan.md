# Plan: profession research engine (real-website research → reusable template)

Goal: for each profession, research **real, existing business websites**, distil the design
patterns they share, and turn that into a **reusable template** so every business in that trade
gets a design that looks professionally made for that trade — not a recoloured generic page.

Status: **proposal**. Nothing in this document is implemented yet.

---

## 1. What already exists and can be reused

| Need | Already in the repo | Where |
|---|---|---|
| Search the web for an industry + city | 4 engines with fallback: SerpAPI, Google CSE, Tavily, keyless Bing scrape | `src/lib/discovery/providers/live-search.ts` (engines at L523 / L622 / L687 / L758) |
| Query building ("best X in Y") | `buildRefinedSearchQuery(profession, location, …)`; negative `-site:` operators | same file, L67 and L64 |
| **Filter out directories/aggregators** | `AGGREGATOR_DOMAINS` (justdial, sulekha, practo, datagemba, yellowpages…), `EXCLUDED_NON_BUSINESS_DOMAINS`, `isListicleOrAggregatorUrl`, `isListicleOrAggregatorTitle` | same file, L10–62, L118–140 |
| Visiting a real business site | the Bing path already fetches the business homepage and `/contact` and extracts phone/email | same file, L843–881 |
| Rate limiting per provider | `globalRateLimiter.acquire(providerId, rpm)` | `src/lib/discovery/rate-limiter.ts` |
| Provider plugin pattern | `ILeadSourceProvider` + `providerRegistry.registerDefaults()` | `providers/types.ts`, `providers/registry.ts` |
| "Generate once per industry, reuse forever" | `IndustryBlueprint` model + `IndustryBlueprintRepository` + `getIndustryDesignBlueprint` (cache → persisted row → author → fallback, first-writer-wins) | `industry-blueprint.ts`, `repository.ts` (L2431+), `prisma/schema.prisma` (L365–376) |
| Where a per-industry design is applied | generator overrides archetype/palette/section order for generic trades and persists it on `content.design.stitch` | `src/lib/demos/generator.ts` (L465–481) |
| Rendering a design | 7 archetypes + 10 palettes + 15 renderable sections, deterministic HTML string renderer | `profession-stitch.ts`, `industry-palettes.ts`, `profession-stitch-renderer.ts` |
| Screenshots of a page | local Chrome via `execFile` **or** keyless Microlink cloud render | `src/lib/providers/screenshot.provider.ts` (L50–139) |
| Vision/LLM analysis | Gemini already wired (text today; Gemini accepts inline images) | `src/lib/demos/ai-content-generator.ts` |
| Owner-only admin endpoint | `GET/POST /api/demos/industry-blueprint` (inspect + re-author) | `src/app/api/demos/industry-blueprint/route.ts` |
| Persistence conventions | demo-mode `.data` ledger + Postgres, migrations `YYYYMMDDHHMMSS_name` | `repository.ts`, `prisma/migrations/` |

So Steps 1, 2 and part of 3 of the requested workflow are **already built** for lead discovery and
can be adapted rather than written from scratch.

## 2. What is missing (the real work)

1. **No DOM/HTML toolkit.** No `cheerio`/`jsdom`; extraction is hand-rolled regex. Research needs
   structured reads (section order, headings, nav, CTA labels, service names).
2. **No robots.txt handling** anywhere (despite `docs/compliance-principles.md` claiming it).
3. **No retry/backoff helper.**
4. **No browser on the server.** Production has no Chrome/Chromium: `findSystemBrowser()` fails on
   Vercel, so screenshots fall back to Microlink or SVG. Playwright is not installed.
5. **No research storage.** `IndustryBlueprint` stores a *design decision* (archetype + palette +
   sections + copy brief) with no evidence behind it: no site list, no screenshots, no analysis.
6. **No admin surface** to run research, see the evidence, or browse the profession library.
7. **Design vocabulary is narrow.** 7 archetypes × 10 palettes. Research cannot yet say
   "before/after slider gallery" or "sticky WhatsApp booking bar", so researched professions would
   differ mostly by colour and section order — which is close to the "generic template" outcome the
   brief explicitly rejects.

## 3. Hard constraints to design around

- **Vercel has no headless browser.** Adding Playwright means `@sparticuz/chromium` (~50 MB), more
  memory, `serverExternalPackages` + `outputFileTracingIncludes`, and it must fit `maxDuration = 60`
  (all routes are 60 today; the plan's cap may be lower). Inspecting 3–5 sites with a real browser
  does not reliably fit in one serverless request.
- **Research is slow and variable** (search + 5 page loads + screenshots + vision = tens of seconds).
  That must never sit on the demo-generation path, or every first demo in a trade gets slow/fragile.
- **Caching is essential** — the brief itself says research once, then reuse per profession. The
  `IndustryBlueprint` first-writer-wins pattern already does exactly this and should be reused.
- **Compliance.** No CAPTCHA/auth bypass. Respect `robots.txt`. Do not reproduce body copy, logos or
  images; extract *patterns* (structure, section order, emphasis, palette mood, typography mood,
  CTA wording) and write original copy. Screenshots of public pages are kept as internal evidence.

## 4. Proposed architecture

Two pluggable layers, both testable without network:

```
profession ──▶ RESEARCH PIPELINE ──▶ ResearchRecord ──▶ SYNTHESIS ──▶ DesignSpec ──▶ template library
                     │                                      │
        search → filter → fetch → DOM extract →             │  Gemini vision + structure
        screenshot (local Chrome | Microlink)               │  → validated, allow-listed spec
```

**Research adapters** (interfaces, so each can be swapped/stubbed):
- `SearchAdapter` — wraps the existing `live-search.ts` engines (+ aggregator filtering).
- `FetchAdapter` — plain `fetch` with UA, timeout, robots.txt check, retry/backoff.
- `DomAdapter` — `cheerio` extraction of nav, section order, headings, services, CTAs, FAQ/testimonial
  presence, image usage, plus computed signal (script/CSS weight, framework detection).
- `ScreenshotAdapter` — local Chrome (`screenshot.provider.ts`, dev/CLI) → Microlink (prod, keyless)
  → SVG placeholder; never throws.
- `VisionAdapter` — Gemini multimodal (same `GEMINI_API_KEY`) over the screenshots + DOM summary.

**Synthesis → `DesignSpec`**: an extension of today's blueprint with the vocabulary needed to make
designs genuinely distinct, all allow-listed (no raw CSS ever):
- hero variant, nav style, services layout, gallery style (incl. before/after), proof style
  (stats / testimonials / certifications), CTA style (sticky WhatsApp bar, inline quote form),
  density, radius, type scale, palette id, accent, section order, copy framing, imagery treatment.
- Every field validated and repaired against the allow-list; unknown values fall back per field.

**Where research runs** (needs a decision — see §6): an **offline/local CLI** is the reliable option
(`npm run research:profession -- "Car Detailing"`), with a hosted option (Microlink + Gemini vision,
no local browser) for running inside the app. Both write to the same store, so runtime is unchanged.

**Storage**: new `industry_research` table (profession id, status, sites[]
{url, domain, title, screenshot ref, extracted structure}, synthesis, spec JSONB, source, version,
timestamps) mirroring the `IndustryBlueprint` repository pattern, plus a demo-ledger key. Migration
`YYYYMMDDHHMMSS_add_industry_research`. Raw screenshots stored like `DemoMedia` (served internally).

**Integration point (no renderer rewrite):** the researched `DesignSpec` feeds the existing junction
in `generator.ts` (L465–481) and is persisted on `content.design.stitch`, so `applyStitchOverrides`
+ `renderProfessionStitchPage` render it. CA keeps its 3 curated templates; curated professions keep
their tuned archetypes; the deterministic rule table stays as the last-resort fallback.

## 5. Phases

- **P1 — Research core (no browser).** Reuse the search engines; add domain filtering tuned for
  "business site only"; add robots-aware `fetch` with retries; add `cheerio`-based extraction of
  structure and copy patterns (nav, section order, headings, services, CTAs, FAQ/review presence).
  Output: `ResearchRecord` with 3–5 real sites. Fully unit-testable with fixtures.
- **P2 — Evidence.** Screenshots per site via local Chrome (CLI) or Microlink (hosted); store refs.
  Add a compact "visual digest" (colours sampled, image density, hero type, above-fold CTA).
- **P3 — Synthesis.** Gemini vision + structure → `DesignSpec`; validate/repair against allow-lists;
  expand the renderer vocabulary to honour the new knobs.
- **P4 — Library + integration.** `industry_research` table + repository + demo-ledger key;
  first-writer-wins caching; feed the generator; deterministic fallback preserved.
- **P5 — Admin.** Owner-only UI/endpoints: run research for a profession, inspect the 3–5 sites and
  their screenshots, view the resulting spec, re-run. Also surface researched professions in the
  template gallery, which today lists only the 3 CA designs.
- **P6 — Pre-warm.** CLI to research a list of professions in bulk and commit the resulting specs,
  so production serves researched designs with **zero** runtime research cost.

## 6. Decisions needed before coding

1. **Where should research run?**
   - (a) Local/offline CLI + committed/bulk pre-warm — most reliable, no Vercel limits (recommended).
   - (b) Inside the app, keyless (existing search + Microlink + Gemini vision) — no local browser,
     slower, but fully in-app.
   - (c) Real Playwright in production — heaviest; needs chromium packaging, memory and duration
     increases, and may need a plan upgrade.
2. **Search provider:** which keys exist today (`SERPAPI_API_KEY`, `GOOGLE_SEARCH_API_KEY` +
   `GOOGLE_SEARCH_ENGINE_ID`/`GOOGLE_CSE_ID`, `TAVILY_API_KEY`)? Without any, only the keyless Bing
   scrape is available, which is fragile.
3. **Relationship to what we already shipped:** should researched specs *replace* the AI-knowledge
   blueprint for a profession, or sit in front of it with the current blueprint as fallback?

## 7. Note on the earlier decision

Earlier in this project the reference source was chosen as **AI industry knowledge**, explicitly
"not live web scraping", for speed and 100% reliability with no keys. This plan reverses that for
initial template generation. If that reversal is intended, P1 can start immediately; the existing
blueprint stays as the fallback so nothing that works today breaks.
