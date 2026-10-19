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

**Where research runs** (decided: in-app, keyless, no browser). Research executes inside the app
using the search engines it already has, `fetch` for page text, and keyless Microlink for screenshots.
Because all routes are capped at 60s and a 3–5 site sweep does not fit in one request, the work is a
**persisted state machine** (`industry_research.status`) advanced one bounded step per call:
`SEARCH → FILTER → FETCH(one site) → EXTRACT(one site) → SCREENSHOT(one site) → SYNTHESIZE → READY`.
An owner-triggered request claims the next step, does one unit inside the time budget, and the client
polls. A run is therefore resumable, observable, and can never time out mid-flight.

**Storage**: new `industry_research` table (profession id, status, sites[]
{url, domain, title, screenshot ref, extracted structure}, synthesis, spec JSONB, source, version,
timestamps) mirroring the `IndustryBlueprint` repository pattern, plus a demo-ledger key. Migration
`YYYYMMDDHHMMSS_add_industry_research`. Raw screenshots stored like `DemoMedia` (served internally).

**Integration point (no renderer rewrite):** the researched `DesignSpec` feeds the existing junction
in `generator.ts` (L465–481) and is persisted on `content.design.stitch`, so `applyStitchOverrides`
+ `renderProfessionStitchPage` render it. CA keeps its 3 curated templates; curated professions keep
their tuned archetypes; the deterministic rule table stays as the last-resort fallback.

## 5. Phases

- **P1 — Research core (no browser, no AI key).** Reuse the search engines; add keyless search
  resilience (Bing HTML scrape + DuckDuckGo HTML + Mojeek, so losing one endpoint is not fatal); add
  robots-aware `fetch` with timeouts/backoff; add `cheerio`-based extraction of structure and copy
  patterns (nav, section order, headings, services, CTAs, FAQ/review presence, image density).
  Output: `ResearchRecord` with 3–5 real business sites. Fully unit-testable with HTML fixtures —
  no network, no AI, no browser.
- **P2 — Evidence.** Screenshots per site via keyless Microlink, stored like `DemoMedia`; plus a
  compact visual digest (sampled colours, image density, hero type, above-fold CTA). Degrades to
  structure-only when a screenshot cannot be taken.
- **P3 — Synthesis.** Frequency analysis of the extracted structures produces a `DesignSpec` with
  **no AI at all** — the section order and section mix that a majority of real sites share is itself
  the finding. When `GEMINI_API_KEY` resolves, Gemini vision over the screenshots enriches it
  (imagery mood, palette, emphasis, hero treatment). Validate/repair every field against the
  allow-lists with a per-field fallback. Expand the renderer vocabulary to honour the new knobs.
- **P4 — Library + integration.** `industry_research` table + repository + demo-ledger key;
  first-writer-wins caching; feed the generator; deterministic fallback preserved.
- **P5 — Admin.** Owner-only UI/endpoints: run research for a profession, inspect the 3–5 sites and
  their screenshots, view the resulting spec, re-run. Also surface researched professions in the
  template gallery, which today lists only the 3 CA designs.
- **P6 — Pre-warm.** CLI to research a list of professions in bulk and commit the resulting specs,
  so production serves researched designs with **zero** runtime research cost.

## 6. Decisions recorded

1. **Where research runs: in-app, keyless** — no local browser, no Chromium on Vercel. This is why §4
   uses a step-wise state machine: the 60s request cap cannot hold a 3–5 site sweep.
2. **Search: keyless for now** (Bing HTML scrape is all that exists today). P1 adds a second and third
   keyless engine so one blocked endpoint does not stop a run; a key (SerpAPI / Google CSE / Tavily)
   can be added later behind the same adapter.
3. **Researched spec wins; the shipped blueprint stays as the fallback.** Nothing that works today
   breaks, and any trade that has not been researched behaves exactly as it does now.

### Prerequisite discovered while planning

`GEMINI_API_KEY` is **not visible to the production runtime**. A live probe of
`/api/demos/industry-blueprint` (which now reports what the running function can actually see)
returned `keyResolved=false`, `GEMINI_API_KEY=false`, `GOOGLE_GENERATIVE_AI_API_KEY=false`, and no
populated alternative name. The check treats whitespace-only as empty, so this also covers a variable
that exists with a blank value.

Consequence: **P1 and P2 do not need the key** — search, fetch, extraction and screenshots are
keyless — and P3 still produces a spec from structure frequency alone. Only the vision enrichment in
P3 depends on the key being fixed. The blueprint for any trade stays deterministic until either the
key is fixed or P3's keyless synthesis lands, and neither blocks starting P1.

## 7. Note on the earlier decision

Earlier in this project the reference source was chosen as **AI industry knowledge**, explicitly
"not live web scraping", for speed and 100% reliability with no keys. This plan reverses that for
initial template generation. If that reversal is intended, P1 can start immediately; the existing
blueprint stays as the fallback so nothing that works today breaks.
