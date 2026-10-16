import type { WebsiteContent } from '@/types';
import {
  ProfessionStitchDesign,
  getProfessionStitchDesign,
} from './profession-stitch';

/**
 * Deterministic HTML renderer for the profession-specific Stitch template sets.
 *
 * The AI never produces markup, CSS or JS - it only fills the validated
 * `WebsiteContent` model. This module turns that model into a fully static,
 * self-contained HTML page using the design's palette/typography/layout, which
 * mirrors how the CA Stitch templates are consumed (raw HTML in an iframe).
 */

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface RenderContext {
  design: ProfessionStitchDesign;
  brand: string;
  profession: string;
  city: string;
  address: string;
  phone: string;
  phoneRaw: string;
  email: string;
  tagline: string;
  ctaLabel: string;
  heroImage: string;
  aboutImage: string;
  year: string;
}

function buildContext(design: ProfessionStitchDesign, content: WebsiteContent | any): RenderContext {
  const brand =
    content?.brand?.businessName || content?.businessName || 'Your Business';
  const city = content?.location?.city || content?.city || 'Your City';
  const address = content?.location?.address || content?.address || `${city}, India`;
  const phone =
    content?.contact?.publicPhone || content?.publicPhone || content?.location?.phone || '+91 99999 99999';
  const phoneRaw = String(phone).replace(/[^0-9]/g, '') || '919999999999';
  const slug = String(brand).toLowerCase().replace(/[^a-z0-9]/g, '');
  const email =
    content?.contact?.publicEmail || content?.publicEmail || `hello@${slug || 'business'}.in`;
  const profession =
    content?.meta?.profession || content?.profession || design.conceptName;
  const tagline = content?.brand?.tagline || content?.hero?.headline || `${profession} in ${city}`;
  const ctaLabel =
    content?.navigation?.ctaText ||
    content?.hero?.primaryCta?.label ||
    'Get In Touch';
  const heroImage =
    content?.images?.heroImage?.url || content?.hero?.imageUrl || design.defaultHeroImage;
  const aboutImage =
    content?.images?.aboutImage?.url || content?.about?.imageUrl || design.defaultAboutImage;

  return {
    design,
    brand,
    profession,
    city,
    address,
    phone,
    phoneRaw,
    email,
    tagline,
    ctaLabel,
    heroImage,
    aboutImage,
    year: String(new Date().getFullYear()),
  };
}

/* -------------------------------------------------------------------------- */
/*  Styles                                                                     */
/* -------------------------------------------------------------------------- */

function buildStyles(d: ProfessionStitchDesign): string {
  const p = d.palette;
  return `
:root {
  --gv-bg: ${p.bg};
  --gv-surface: ${p.surface};
  --gv-surface-alt: ${p.surfaceAlt};
  --gv-ink: ${p.ink};
  --gv-muted: ${p.muted};
  --gv-accent: ${p.accent};
  --gv-accent-ink: ${p.accentInk};
  --gv-line: ${p.line};
  --gv-radius: ${d.radius};
  --gv-display: ${d.fontDisplay};
  --gv-body: ${d.fontBody};
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
html, body {
  background: var(--gv-bg);
  color: var(--gv-ink);
  font-family: var(--gv-body);
  line-height: 1.6;
  overflow-x: hidden;
}
body { min-height: 100%; }
img { display: block; max-width: 100%; }
a { color: inherit; text-decoration: none; }
.gv-wrap { width: 100%; max-width: 1180px; margin: 0 auto; padding: 0 24px; }
.gv-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--gv-accent); margin-bottom: 18px;
}
.gv-eyebrow::before { content: ''; width: 22px; height: 1px; background: var(--gv-accent); display: inline-block; }

/* Header */
.gv-header {
  position: sticky; top: 0; z-index: 60;
  background: color-mix(in srgb, var(--gv-bg) 88%, transparent);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--gv-line);
}
.gv-header__inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 15px 0; }
.gv-brand { font-family: var(--gv-display); font-size: 20px; font-weight: 700; letter-spacing: -0.01em; display: flex; align-items: center; gap: 10px; }
.gv-brand__tag {
  font-family: var(--gv-body); font-size: 10.5px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase;
  padding: 3px 9px; border-radius: 999px; color: var(--gv-accent);
  border: 1px solid color-mix(in srgb, var(--gv-accent) 45%, transparent);
  background: color-mix(in srgb, var(--gv-accent) 12%, transparent);
}
.gv-nav { display: flex; align-items: center; gap: 26px; }
.gv-nav a { font-size: 14px; font-weight: 500; color: var(--gv-muted); transition: color .2s; }
.gv-nav a:hover { color: var(--gv-ink); }
.gv-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px 22px; border-radius: 999px; border: none; cursor: pointer;
  font-family: var(--gv-body); font-size: 14px; font-weight: 700;
  background: var(--gv-accent); color: var(--gv-accent-ink);
  transition: transform .18s, box-shadow .18s, opacity .18s;
}
.gv-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 26px color-mix(in srgb, var(--gv-accent) 40%, transparent); }
.gv-btn--ghost { background: transparent; color: var(--gv-ink); border: 1px solid var(--gv-line); }
.gv-btn--light { background: #ffffff; color: #10151f; }

/* Hero */
.gv-hero { position: relative; overflow: hidden; }
.gv-hero__badge {
  display: inline-flex; align-items: center; gap: 8px; padding: 7px 15px; border-radius: 999px;
  font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  border: 1px solid color-mix(in srgb, var(--gv-accent) 50%, transparent);
  background: color-mix(in srgb, var(--gv-accent) 14%, transparent);
  color: var(--gv-accent); margin-bottom: 22px;
}
.gv-hero h1 { font-family: var(--gv-display); font-weight: 700; line-height: 1.08; letter-spacing: -0.015em; }
.gv-hero__sub { font-size: 18px; line-height: 1.65; margin-top: 20px; max-width: 620px; }
.gv-hero__actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 34px; }

.gv-hero--fullbleed {
  min-height: 86vh; display: flex; align-items: flex-end;
  color: #ffffff; padding: 140px 0 76px;
  background-size: cover; background-position: center;
}
.gv-hero--fullbleed::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(to bottom, ${p.heroOverlay});
}
.gv-hero--fullbleed .gv-wrap { position: relative; z-index: 2; }
.gv-hero--fullbleed h1 { font-size: clamp(38px, 6vw, 68px); max-width: 900px; }
.gv-hero--fullbleed .gv-hero__sub { color: rgba(255,255,255,0.86); max-width: 640px; }

.gv-hero--split { padding: 96px 0 88px; }
.gv-hero--split .gv-hero__grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 56px; align-items: center; }
.gv-hero--split h1 { font-size: clamp(34px, 4.6vw, 56px); }
.gv-hero--split .gv-hero__sub { color: var(--gv-muted); }
.gv-hero--split .gv-hero__media img { width: 100%; height: 100%; max-height: 560px; object-fit: cover; border-radius: var(--gv-radius); }

.gv-hero--centered { padding: 96px 0 0; text-align: center; }
.gv-hero--centered h1 { font-size: clamp(34px, 4.6vw, 58px); max-width: 880px; margin: 0 auto; }
.gv-hero--centered .gv-hero__sub { margin-left: auto; margin-right: auto; color: var(--gv-muted); }
.gv-hero--centered .gv-hero__actions { justify-content: center; }
.gv-hero--centered .gv-hero__media { margin-top: 56px; }
.gv-hero--centered .gv-hero__media img { width: 100%; max-height: 520px; object-fit: cover; border-radius: var(--gv-radius) var(--gv-radius) 0 0; }

/* Section scaffolding */
.gv-section { padding: 88px 0; }
.gv-section--alt { background: var(--gv-surface-alt); border-top: 1px solid var(--gv-line); border-bottom: 1px solid var(--gv-line); }
.gv-head { max-width: 720px; margin-bottom: 52px; }
.gv-head--center { margin-left: auto; margin-right: auto; text-align: center; }
.gv-head__title { font-family: var(--gv-display); font-size: clamp(28px, 3.4vw, 42px); font-weight: 700; line-height: 1.16; letter-spacing: -0.01em; }
.gv-head__desc { font-size: 16.5px; color: var(--gv-muted); margin-top: 14px; }

/* Cards / grids */
.gv-grid { display: grid; gap: 22px; }
.gv-grid--2 { grid-template-columns: repeat(2, 1fr); }
.gv-grid--3 { grid-template-columns: repeat(3, 1fr); }
.gv-grid--4 { grid-template-columns: repeat(4, 1fr); }
.gv-card {
  background: var(--gv-surface); border: 1px solid var(--gv-line); border-radius: var(--gv-radius);
  padding: 30px 26px; transition: transform .2s, border-color .2s;
}
.gv-card:hover { transform: translateY(-4px); border-color: color-mix(in srgb, var(--gv-accent) 55%, var(--gv-line)); }
.gv-card__num { font-family: var(--gv-display); font-size: 14px; font-weight: 700; color: var(--gv-accent); margin-bottom: 14px; letter-spacing: 0.06em; }
.gv-card__title { font-family: var(--gv-display); font-size: 20px; font-weight: 700; line-height: 1.3; margin-bottom: 10px; }
.gv-card__desc { font-size: 14.5px; color: var(--gv-muted); line-height: 1.65; }
.gv-card--check .gv-card__title::before { content: '✓  '; color: var(--gv-accent); }

/* Trust strip */
.gv-trust { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.gv-trust__item { padding: 22px 20px; border: 1px solid var(--gv-line); border-radius: var(--gv-radius); background: var(--gv-surface); }
.gv-trust__title { font-weight: 700; font-size: 15px; margin-bottom: 6px; }
.gv-trust__desc { font-size: 13.5px; color: var(--gv-muted); line-height: 1.55; }

/* Gallery */
.gv-tile { position: relative; overflow: hidden; border-radius: var(--gv-radius); border: 1px solid var(--gv-line); background: var(--gv-surface); }
.gv-tile img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; }
.gv-tile:hover img { transform: scale(1.05); }
.gv-tile__cap {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 34px 18px 16px;
  background: linear-gradient(to top, rgba(5,8,14,0.88), rgba(5,8,14,0)); color: #fff;
}
.gv-tile__cat { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gv-accent); }
.gv-tile__title { font-family: var(--gv-display); font-size: 17px; font-weight: 700; margin-top: 4px; }

.gv-gallery--masonry { columns: 3; column-gap: 20px; }
.gv-gallery--masonry .gv-tile { margin-bottom: 20px; break-inside: avoid; }
.gv-gallery--masonry .gv-tile:nth-child(3n+1) img { aspect-ratio: 3 / 4; }
.gv-gallery--masonry .gv-tile:nth-child(3n+2) img { aspect-ratio: 4 / 3; }
.gv-gallery--masonry .gv-tile:nth-child(3n) img { aspect-ratio: 1 / 1; }

.gv-gallery--grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.gv-gallery--grid .gv-tile img { aspect-ratio: 4 / 3; }

.gv-gallery--listings { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.gv-gallery--listings .gv-tile img { aspect-ratio: 16 / 11; }
.gv-gallery--listings .gv-tile__cap { position: static; background: var(--gv-surface); color: var(--gv-ink); padding: 18px; border-top: 1px solid var(--gv-line); }

/* Menu ledger */
.gv-menu { display: grid; grid-template-columns: repeat(2, 1fr); gap: 34px 54px; }
.gv-menu__cat { grid-column: span 1; }
.gv-menu__cat-title {
  font-family: var(--gv-display); font-size: 21px; font-weight: 700; margin-bottom: 18px; padding-bottom: 10px;
  border-bottom: 2px solid color-mix(in srgb, var(--gv-accent) 45%, transparent);
}
.gv-menu__item { display: flex; justify-content: space-between; gap: 18px; padding: 12px 0; border-bottom: 1px dashed var(--gv-line); }
.gv-menu__name { font-weight: 600; font-size: 15px; }
.gv-menu__desc { font-size: 13px; color: var(--gv-muted); margin-top: 3px; max-width: 320px; }
.gv-menu__price { font-family: var(--gv-display); font-weight: 700; color: var(--gv-accent); white-space: nowrap; }
.gv-menu__badge { display: inline-block; margin-left: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--gv-accent); border: 1px solid currentColor; border-radius: 999px; padding: 1px 7px; }

/* About */
.gv-about { display: grid; grid-template-columns: 1fr 1fr; gap: 54px; align-items: center; }
.gv-about__media img { width: 100%; border-radius: var(--gv-radius); object-fit: cover; max-height: 520px; }
.gv-about__lead { font-size: 17.5px; line-height: 1.65; margin: 16px 0 14px; }
.gv-about__body { font-size: 15px; color: var(--gv-muted); line-height: 1.75; margin-bottom: 26px; }
.gv-highlights { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.gv-highlight { background: var(--gv-surface); border: 1px solid var(--gv-line); border-radius: var(--gv-radius); padding: 16px; }
.gv-highlight strong { display: block; font-size: 14px; margin-bottom: 4px; }
.gv-highlight span { font-size: 12.5px; color: var(--gv-muted); line-height: 1.5; }

/* Steps */
.gv-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.gv-step { background: var(--gv-surface); border: 1px solid var(--gv-line); border-radius: var(--gv-radius); padding: 26px 22px; }
.gv-step__num {
  width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-family: var(--gv-display); font-weight: 700; margin-bottom: 16px;
  color: var(--gv-accent); border: 1px solid color-mix(in srgb, var(--gv-accent) 45%, transparent);
  background: color-mix(in srgb, var(--gv-accent) 12%, transparent);
}
.gv-step__title { font-family: var(--gv-display); font-size: 17px; font-weight: 700; margin-bottom: 8px; }
.gv-step__desc { font-size: 13.5px; color: var(--gv-muted); line-height: 1.6; }

/* Industries */
.gv-chips { display: flex; flex-wrap: wrap; gap: 10px; }
.gv-chip { font-size: 13.5px; font-weight: 600; padding: 8px 16px; border-radius: 999px; border: 1px solid var(--gv-line); background: var(--gv-surface); }

/* FAQ */
.gv-faq { max-width: 820px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
.gv-faq__item { background: var(--gv-surface); border: 1px solid var(--gv-line); border-radius: var(--gv-radius); padding: 22px 24px; }
.gv-faq__q { font-family: var(--gv-display); font-size: 17px; font-weight: 700; margin-bottom: 8px; }
.gv-faq__a { font-size: 14.5px; color: var(--gv-muted); line-height: 1.65; }

/* CTA banner */
.gv-cta {
  background: linear-gradient(135deg, color-mix(in srgb, var(--gv-accent) 24%, var(--gv-bg)), var(--gv-bg));
  border: 1px solid color-mix(in srgb, var(--gv-accent) 40%, var(--gv-line));
  border-radius: var(--gv-radius); padding: 56px; text-align: center;
}
.gv-cta__title { font-family: var(--gv-display); font-size: clamp(26px, 3vw, 38px); font-weight: 700; }
.gv-cta__sub { font-size: 16px; color: var(--gv-muted); margin: 14px auto 28px; max-width: 620px; }
.gv-cta__actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

/* Contact */
.gv-contact { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; }
.gv-info { display: flex; flex-direction: column; gap: 16px; }
.gv-info__row { display: flex; gap: 12px; font-size: 15px; }
.gv-info__label { color: var(--gv-muted); min-width: 92px; }
.gv-form { background: var(--gv-surface); border: 1px solid var(--gv-line); border-radius: var(--gv-radius); padding: 30px; display: flex; flex-direction: column; gap: 14px; }
.gv-form h3 { font-family: var(--gv-display); font-size: 20px; margin-bottom: 4px; }
.gv-form input, .gv-form textarea {
  width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--gv-line);
  background: var(--gv-bg); color: var(--gv-ink); font-family: var(--gv-body); font-size: 14px;
}
.gv-form input:focus, .gv-form textarea:focus { outline: 2px solid color-mix(in srgb, var(--gv-accent) 55%, transparent); border-color: transparent; }
.gv-form__note { font-size: 12px; color: var(--gv-muted); }

/* Footer */
.gv-footer { border-top: 1px solid var(--gv-line); background: var(--gv-surface-alt); padding: 56px 0 34px; }
.gv-footer__grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 40px; margin-bottom: 34px; }
.gv-footer__brand { font-family: var(--gv-display); font-size: 19px; font-weight: 700; margin-bottom: 10px; }
.gv-footer p { font-size: 14px; color: var(--gv-muted); line-height: 1.7; }
.gv-footer h5 { font-size: 12.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 12px; }
.gv-footer__bottom { border-top: 1px solid var(--gv-line); padding-top: 22px; font-size: 12.5px; color: var(--gv-muted); }

/* Floating WhatsApp */
.gv-float {
  position: fixed; bottom: 22px; right: 22px; z-index: 200;
  display: inline-flex; align-items: center; gap: 9px; background: #25d366; color: #06210f;
  padding: 12px 20px; border-radius: 999px; font-weight: 800; font-size: 14px;
  box-shadow: 0 12px 28px rgba(37,211,102,.4); transition: transform .2s;
}
.gv-float:hover { transform: scale(1.04); }

@media (max-width: 980px) {
  .gv-nav { display: none; }
  .gv-hero--split .gv-hero__grid, .gv-about, .gv-contact { grid-template-columns: 1fr; gap: 34px; }
  .gv-grid--3, .gv-grid--4, .gv-gallery--grid, .gv-gallery--listings, .gv-steps, .gv-trust { grid-template-columns: repeat(2, 1fr); }
  .gv-gallery--masonry { columns: 2; }
  .gv-menu { grid-template-columns: 1fr; }
}
@media (max-width: 620px) {
  .gv-section { padding: 62px 0; }
  .gv-grid--2, .gv-grid--3, .gv-grid--4, .gv-gallery--grid, .gv-gallery--listings, .gv-steps, .gv-trust, .gv-highlights { grid-template-columns: 1fr; }
  .gv-gallery--masonry { columns: 1; }
  .gv-cta { padding: 36px 22px; }
  .gv-footer__grid { grid-template-columns: 1fr; gap: 26px; }
}
`;
}

/* -------------------------------------------------------------------------- */
/*  Section renderers                                                          */
/* -------------------------------------------------------------------------- */

function renderHero(ctx: RenderContext): string {
  const { design: d } = ctx;
  const badge = `<span class="gv-hero__badge">✦ ${escapeHtml(ctx.brand)} • ${escapeHtml(ctx.city)}</span>`;
  const actions = `
      <div class="gv-hero__actions">
        <a href="#contact" class="gv-btn">${escapeHtml(ctx.ctaLabel)}</a>
        <a href="#services" class="gv-btn ${d.heroStyle === 'fullbleed' ? 'gv-btn--light' : 'gv-btn--ghost'}">Explore</a>
      </div>`;

  if (d.heroStyle === 'fullbleed') {
    return `
<section id="hero" class="gv-hero gv-hero--fullbleed" style="background-image:url('${escapeHtml(ctx.heroImage)}')">
  <div class="gv-wrap">
    ${badge}
    <h1>${escapeHtml(ctx.tagline)}</h1>
    <p class="gv-hero__sub">${escapeHtml(ctx.brand)} — premium ${escapeHtml(ctx.profession)} for clients in ${escapeHtml(ctx.city)} and beyond.</p>
    ${actions}
  </div>
</section>`;
  }

  if (d.heroStyle === 'split') {
    return `
<section id="hero" class="gv-hero gv-hero--split">
  <div class="gv-wrap">
    <div class="gv-hero__grid">
      <div>
        ${badge}
        <h1>${escapeHtml(ctx.tagline)}</h1>
        <p class="gv-hero__sub">${escapeHtml(ctx.brand)} — ${escapeHtml(ctx.profession)} serving ${escapeHtml(ctx.city)} and nearby areas.</p>
        ${actions}
      </div>
      <div class="gv-hero__media">
        <img src="${escapeHtml(ctx.heroImage)}" alt="${escapeHtml(ctx.brand)}" loading="eager" />
      </div>
    </div>
  </div>
</section>`;
  }

  return `
<section id="hero" class="gv-hero gv-hero--centered">
  <div class="gv-wrap">
    ${badge}
    <h1>${escapeHtml(ctx.tagline)}</h1>
    <p class="gv-hero__sub">${escapeHtml(ctx.brand)} — trusted ${escapeHtml(ctx.profession)} in ${escapeHtml(ctx.city)}.</p>
    ${actions}
    <div class="gv-hero__media">
      <img src="${escapeHtml(ctx.heroImage)}" alt="${escapeHtml(ctx.brand)}" loading="eager" />
    </div>
  </div>
</section>`;
}

function renderTrust(content: any): string {
  const badges = content?.trust?.badges;
  if (!Array.isArray(badges) || badges.length === 0) return '';
  return `
<section class="gv-section gv-section--alt">
  <div class="gv-wrap">
    <div class="gv-trust">
      ${badges
        .slice(0, 4)
        .map(
          (b: any) => `<div class="gv-trust__item"><div class="gv-trust__title">${escapeHtml(b?.title)}</div><div class="gv-trust__desc">${escapeHtml(b?.description)}</div></div>`
        )
        .join('')}
    </div>
  </div>
</section>`;
}

function renderServices(content: any, alt: boolean): string {
  const items = content?.services?.items;
  if (!Array.isArray(items) || items.length === 0) return '';
  return `
<section id="services" class="gv-section${alt ? ' gv-section--alt' : ''}">
  <div class="gv-wrap">
    <div class="gv-head gv-head--center">
      <span class="gv-eyebrow">What We Offer</span>
      <h2 class="gv-head__title">${escapeHtml(content?.services?.sectionTitle || 'Services')}</h2>
      <p class="gv-head__desc">${escapeHtml(content?.services?.sectionSubtitle || '')}</p>
    </div>
    <div class="gv-grid gv-grid--3">
      ${items
        .slice(0, 6)
        .map(
          (s: any, i: number) => `<div class="gv-card"><div class="gv-card__num">0${i + 1}</div><h3 class="gv-card__title">${escapeHtml(s?.title)}</h3><p class="gv-card__desc">${escapeHtml(s?.description)}</p></div>`
        )
        .join('')}
    </div>
  </div>
</section>`;
}

function renderGallery(content: any, d: ProfessionStitchDesign, alt: boolean): string {
  const items = content?.gallery?.items || content?.images?.gallery;
  if (!Array.isArray(items) || items.length === 0) return '';
  const title = content?.gallery?.sectionTitle || 'Portfolio';
  const sub = content?.gallery?.sectionSubtitle || '';
  const tiles = items
    .slice(0, 6)
    .map((g: any) => {
      const url = g?.imageUrl || g?.url || '';
      if (!url) return '';
      const tileTitle = g?.title || g?.caption || '';
      const cat = g?.category || '';
      return `<figure class="gv-tile"><img src="${escapeHtml(url)}" alt="${escapeHtml(tileTitle)}" loading="lazy" /><figcaption class="gv-tile__cap">${cat ? `<div class="gv-tile__cat">${escapeHtml(cat)}</div>` : ''}${tileTitle ? `<div class="gv-tile__title">${escapeHtml(tileTitle)}</div>` : ''}</figcaption></figure>`;
    })
    .join('');
  if (!tiles) return '';
  return `
<section id="gallery" class="gv-section${alt ? ' gv-section--alt' : ''}">
  <div class="gv-wrap">
    <div class="gv-head gv-head--center">
      <span class="gv-eyebrow">Selected Work</span>
      <h2 class="gv-head__title">${escapeHtml(title)}</h2>
      ${sub ? `<p class="gv-head__desc">${escapeHtml(sub)}</p>` : ''}
    </div>
    <div class="gv-gallery--${d.galleryStyle}">${tiles}</div>
  </div>
</section>`;
}

function renderMenu(content: any, alt: boolean): string {
  const cats = content?.menu?.categories;
  if (!Array.isArray(cats) || cats.length === 0) return '';
  return `
<section id="menu" class="gv-section${alt ? ' gv-section--alt' : ''}">
  <div class="gv-wrap">
    <div class="gv-head gv-head--center">
      <span class="gv-eyebrow">Featured Menu</span>
      <h2 class="gv-head__title">${escapeHtml(content?.menu?.sectionTitle || 'Menu')}</h2>
      ${content?.menu?.sectionSubtitle ? `<p class="gv-head__desc">${escapeHtml(content.menu.sectionSubtitle)}</p>` : ''}
    </div>
    <div class="gv-menu">
      ${cats
        .slice(0, 4)
        .map(
          (c: any) => `<div class="gv-menu__cat"><h3 class="gv-menu__cat-title">${escapeHtml(c?.name)}</h3>${(Array.isArray(c?.items) ? c.items : [])
            .slice(0, 6)
            .map(
              (it: any) => `<div class="gv-menu__item"><div><div class="gv-menu__name">${escapeHtml(it?.name)}${it?.badge ? `<span class="gv-menu__badge">${escapeHtml(it.badge)}</span>` : ''}</div>${it?.description ? `<div class="gv-menu__desc">${escapeHtml(it.description)}</div>` : ''}</div>${it?.price ? `<div class="gv-menu__price">${escapeHtml(it.price)}</div>` : ''}</div>`
            )
            .join('')}</div>`
        )
        .join('')}
    </div>
  </div>
</section>`;
}

function renderExpertise(content: any, alt: boolean): string {
  const items = content?.expertise?.items;
  if (!Array.isArray(items) || items.length === 0) return '';
  return `
<section id="expertise" class="gv-section${alt ? ' gv-section--alt' : ''}">
  <div class="gv-wrap">
    <div class="gv-head gv-head--center">
      <span class="gv-eyebrow">Specialisms</span>
      <h2 class="gv-head__title">${escapeHtml(content?.expertise?.sectionTitle || 'Expertise')}</h2>
      ${content?.expertise?.sectionSubtitle ? `<p class="gv-head__desc">${escapeHtml(content.expertise.sectionSubtitle)}</p>` : ''}
    </div>
    <div class="gv-grid gv-grid--3">
      ${items
        .slice(0, 6)
        .map(
          (e: any) => `<div class="gv-card"><h3 class="gv-card__title">${escapeHtml(e?.title)}</h3><p class="gv-card__desc">${escapeHtml(e?.description)}</p></div>`
        )
        .join('')}
    </div>
  </div>
</section>`;
}

function renderAbout(ctx: RenderContext, content: any, alt: boolean): string {
  const a = content?.about;
  if (!a && !ctx.aboutImage) return '';
  const highlights = Array.isArray(a?.highlights) ? a.highlights.slice(0, 4) : [];
  return `
<section id="about" class="gv-section${alt ? ' gv-section--alt' : ''}">
  <div class="gv-wrap">
    <div class="gv-about">
      <div class="gv-about__media"><img src="${escapeHtml(ctx.aboutImage)}" alt="${escapeHtml(ctx.brand)}" loading="lazy" /></div>
      <div>
        <span class="gv-eyebrow">About</span>
        <h2 class="gv-head__title">${escapeHtml(a?.title || `About ${ctx.brand}`)}</h2>
        <p class="gv-about__lead">${escapeHtml(a?.leadParagraph || '')}</p>
        <p class="gv-about__body">${escapeHtml(a?.body || '')}</p>
        ${
          highlights.length
            ? `<div class="gv-highlights">${highlights
                .map((h: any) => `<div class="gv-highlight"><strong>${escapeHtml(h?.title)}</strong><span>${escapeHtml(h?.description)}</span></div>`)
                .join('')}</div>`
            : ''
        }
      </div>
    </div>
  </div>
</section>`;
}

function renderProcess(content: any, alt: boolean): string {
  const steps = content?.process?.steps;
  if (!Array.isArray(steps) || steps.length === 0) return '';
  return `
<section id="process" class="gv-section${alt ? ' gv-section--alt' : ''}">
  <div class="gv-wrap">
    <div class="gv-head gv-head--center">
      <span class="gv-eyebrow">How It Works</span>
      <h2 class="gv-head__title">${escapeHtml(content?.process?.sectionTitle || 'Our Process')}</h2>
      ${content?.process?.sectionSubtitle ? `<p class="gv-head__desc">${escapeHtml(content.process.sectionSubtitle)}</p>` : ''}
    </div>
    <div class="gv-steps">
      ${steps
        .slice(0, 4)
        .map(
          (s: any, i: number) => `<div class="gv-step"><div class="gv-step__num">${escapeHtml(s?.number || `0${i + 1}`)}</div><h3 class="gv-step__title">${escapeHtml(s?.title)}</h3><p class="gv-step__desc">${escapeHtml(s?.description)}</p></div>`
        )
        .join('')}
    </div>
  </div>
</section>`;
}

function renderWhyChooseUs(content: any, alt: boolean): string {
  const points = content?.whyChooseUs?.points;
  if (!Array.isArray(points) || points.length === 0) return '';
  return `
<section id="why-choose-us" class="gv-section${alt ? ' gv-section--alt' : ''}">
  <div class="gv-wrap">
    <div class="gv-head gv-head--center">
      <span class="gv-eyebrow">Why Us</span>
      <h2 class="gv-head__title">${escapeHtml(content?.whyChooseUs?.sectionTitle || 'Why Choose Us')}</h2>
      ${content?.whyChooseUs?.sectionSubtitle ? `<p class="gv-head__desc">${escapeHtml(content.whyChooseUs.sectionSubtitle)}</p>` : ''}
    </div>
    <div class="gv-grid gv-grid--3">
      ${points
        .slice(0, 6)
        .map(
          (w: any) => `<div class="gv-card gv-card--check"><h3 class="gv-card__title">${escapeHtml(w?.title)}</h3><p class="gv-card__desc">${escapeHtml(w?.description)}</p></div>`
        )
        .join('')}
    </div>
  </div>
</section>`;
}

function renderIndustries(content: any, alt: boolean): string {
  const ind = content?.industries;
  if (!ind?.enabled || !Array.isArray(ind?.items) || ind.items.length === 0) return '';
  return `
<section class="gv-section${alt ? ' gv-section--alt' : ''}">
  <div class="gv-wrap">
    <div class="gv-head gv-head--center">
      <span class="gv-eyebrow">Who We Serve</span>
      <h2 class="gv-head__title">${escapeHtml(ind.sectionTitle || 'Industries We Serve')}</h2>
    </div>
    <div class="gv-chips">${ind.items.map((i: any) => `<span class="gv-chip">${escapeHtml(i)}</span>`).join('')}</div>
  </div>
</section>`;
}

function renderFaq(content: any, alt: boolean): string {
  const items = content?.faq?.items;
  if (!Array.isArray(items) || items.length === 0) return '';
  return `
<section id="faq" class="gv-section${alt ? ' gv-section--alt' : ''}">
  <div class="gv-wrap">
    <div class="gv-head gv-head--center">
      <span class="gv-eyebrow">FAQ</span>
      <h2 class="gv-head__title">${escapeHtml(content?.faq?.sectionTitle || 'Frequently Asked Questions')}</h2>
    </div>
    <div class="gv-faq">
      ${items
        .slice(0, 6)
        .map(
          (f: any) => `<div class="gv-faq__item"><div class="gv-faq__q">${escapeHtml(f?.question)}</div><div class="gv-faq__a">${escapeHtml(f?.answer)}</div></div>`
        )
        .join('')}
    </div>
  </div>
</section>`;
}

function renderCta(ctx: RenderContext, content: any, alt: boolean): string {
  const banner = content?.ctaBanner;
  const title = banner?.title || `Ready to work with ${ctx.brand}?`;
  const sub = banner?.subtitle || `Reach out today and let's discuss your requirements in ${ctx.city}.`;
  const primary = banner?.primaryCta?.label || ctx.ctaLabel;
  return `
<section class="gv-section${alt ? ' gv-section--alt' : ''}">
  <div class="gv-wrap">
    <div class="gv-cta">
      <h2 class="gv-cta__title">${escapeHtml(title)}</h2>
      <p class="gv-cta__sub">${escapeHtml(sub)}</p>
      <div class="gv-cta__actions">
        <a href="#contact" class="gv-btn">${escapeHtml(primary)}</a>
        <a href="https://wa.me/${escapeHtml(ctx.phoneRaw)}" target="_blank" rel="noopener noreferrer" class="gv-btn gv-btn--ghost">WhatsApp</a>
      </div>
    </div>
  </div>
</section>`;
}

function renderContact(ctx: RenderContext, content: any, alt: boolean): string {
  const c = content?.contact;
  return `
<section id="contact" class="gv-section${alt ? ' gv-section--alt' : ''}">
  <div class="gv-wrap">
    <div class="gv-head gv-head--center">
      <span class="gv-eyebrow">Get In Touch</span>
      <h2 class="gv-head__title">${escapeHtml(c?.sectionTitle || 'Contact Us')}</h2>
      ${c?.sectionSubtitle ? `<p class="gv-head__desc">${escapeHtml(c.sectionSubtitle)}</p>` : ''}
    </div>
    <div class="gv-contact">
      <div class="gv-info">
        <div class="gv-info__row"><span class="gv-info__label">Phone</span><span>${escapeHtml(ctx.phone)}</span></div>
        <div class="gv-info__row"><span class="gv-info__label">Email</span><span>${escapeHtml(ctx.email)}</span></div>
        <div class="gv-info__row"><span class="gv-info__label">Address</span><span>${escapeHtml(ctx.address)}</span></div>
        <div class="gv-info__row"><span class="gv-info__label">Hours</span><span>${escapeHtml(content?.location?.officeHours || 'Mon–Sat, 10:00–19:00')}</span></div>
      </div>
      <form class="gv-form">
        <h3>${escapeHtml(c?.formTitle || `Enquire with ${ctx.brand}`)}</h3>
        <input type="text" name="name" placeholder="Your name" required />
        <input type="tel" name="phone" placeholder="Phone number" required />
        <input type="email" name="email" placeholder="Email address" />
        <textarea name="message" rows="4" placeholder="Tell us what you need..."></textarea>
        <button type="submit" class="gv-btn">${escapeHtml(ctx.ctaLabel)}</button>
        <p class="gv-form__note">${escapeHtml(c?.simulatedDisclaimer || 'This is a demonstration enquiry form.')}</p>
      </form>
    </div>
  </div>
</section>`;
}

function renderLocation(ctx: RenderContext, content: any, alt: boolean): string {
  const loc = content?.location;
  if (!loc?.address && !ctx.address) return '';
  return `
<section class="gv-section${alt ? ' gv-section--alt' : ''}">
  <div class="gv-wrap">
    <div class="gv-head gv-head--center">
      <span class="gv-eyebrow">Visit Us</span>
      <h2 class="gv-head__title">${escapeHtml(loc?.city || ctx.city)}</h2>
      <p class="gv-head__desc">${escapeHtml(loc?.address || ctx.address)}</p>
    </div>
    <div style="border:1px solid var(--gv-line);border-radius:var(--gv-radius);padding:34px;text-align:center;background:var(--gv-surface);color:var(--gv-muted);font-size:14px;">
      📍 ${escapeHtml(loc?.officeHours || 'Open Mon–Sat')} · ${escapeHtml(ctx.phone)}
    </div>
  </div>
</section>`;
}

function renderSection(type: string, ctx: RenderContext, content: any, alt: boolean): string {
  switch (type) {
    case 'HERO':
      return renderHero(ctx);
    case 'TRUST':
      return renderTrust(content);
    case 'SERVICES':
      return renderServices(content, alt);
    case 'GALLERY':
      return renderGallery(content, ctx.design, alt);
    case 'MENU':
      return renderMenu(content, alt);
    case 'EXPERTISE':
      return renderExpertise(content, alt);
    case 'ABOUT':
      return renderAbout(ctx, content, alt);
    case 'PROCESS':
      return renderProcess(content, alt);
    case 'WHY_CHOOSE_US':
      return renderWhyChooseUs(content, alt);
    case 'INDUSTRIES':
      return renderIndustries(content, alt);
    case 'FAQ':
      return renderFaq(content, alt);
    case 'CTA':
      return renderCta(ctx, content, alt);
    case 'CONTACT':
      return renderContact(ctx, content, alt);
    case 'LOCATION':
      return renderLocation(ctx, content, alt);
    default:
      return '';
  }
}

/* -------------------------------------------------------------------------- */
/*  Shell + page assembly                                                      */
/* -------------------------------------------------------------------------- */

function buildNav(ctx: RenderContext, content: any): string {
  const items: { label: string; href: string }[] =
    Array.isArray(content?.navigation?.items) && content.navigation.items.length
      ? content.navigation.items
      : [
          { label: 'Services', href: '#services' },
          { label: 'About', href: '#about' },
          { label: 'FAQ', href: '#faq' },
          { label: 'Contact', href: '#contact' },
        ];
  return items
    .slice(0, 5)
    .map((i) => `<a href="${escapeHtml(i.href)}">${escapeHtml(i.label)}</a>`)
    .join('');
}

/**
 * Builds the static shell for a profession Stitch design: doctype, head, CSS,
 * header chrome, an empty <main> with the `<!--GV:SECTIONS-->` marker, footer
 * and floating CTA. Tokens are filled later by `renderProfessionStitchPage`.
 */
export function buildProfessionStitchShell(design: ProfessionStitchDesign): string {
  return `<!DOCTYPE html>
<html lang="en" data-gv-template="${escapeHtml(design.id)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="gv-concept" content="${escapeHtml(design.conceptName)}">
  <title>{{BRAND}} | {{PROFESSION}} — {{CITY}}</title>
  <meta name="description" content="{{TAGLINE}}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${design.fontsHref}" rel="stylesheet">
  <style>${buildStyles(design)}</style>
</head>
<body>
  <header class="gv-header">
    <div class="gv-wrap gv-header__inner">
      <a href="#hero" class="gv-brand">{{BRAND}}<span class="gv-brand__tag">{{PROFESSION}}</span></a>
      <nav class="gv-nav">{{NAV}}</nav>
      <a href="#contact" class="gv-btn">{{CTA_LABEL}}</a>
    </div>
  </header>

  <main>
    <!--GV:SECTIONS-->
  </main>

  <footer class="gv-footer">
    <div class="gv-wrap">
      <div class="gv-footer__grid">
        <div>
          <div class="gv-footer__brand">{{BRAND}}</div>
          <p>{{TAGLINE}}</p>
        </div>
        <div>
          <h5>Contact</h5>
          <p>📞 {{PHONE}}</p>
          <p>✉️ {{EMAIL}}</p>
        </div>
        <div>
          <h5>Location</h5>
          <p>📍 {{ADDRESS}}</p>
        </div>
      </div>
      <div class="gv-footer__bottom">
        <p>© {{YEAR}} {{BRAND}}. All rights reserved. Personalized website demonstration concept.</p>
      </div>
    </div>
  </footer>

  <a href="https://wa.me/{{PHONE_RAW}}" target="_blank" rel="noopener noreferrer" class="gv-float">
    <span>💬 Chat on WhatsApp</span>
  </a>
</body>
</html>`;
}

/**
 * Renders a complete profession Stitch page from a validated content model.
 * Sections are emitted in the design's canonical order; any section whose
 * content is absent is skipped, and alt-banding is applied deterministically.
 */
export function renderProfessionStitchPage(
  design: ProfessionStitchDesign,
  content: WebsiteContent | any
): string {
  let html = buildProfessionStitchShell(design);
  const ctx = buildContext(design, content);

  const order: string[] = Array.isArray(content?.design?.sectionOrder) && content.design.sectionOrder.length
    ? content.design.sectionOrder
    : design.sectionOrder;

  const ordered = Array.from(new Set(order));
  let alt = false;
  const sections = ordered
    .map((type) => {
      const rendered = renderSection(type, ctx, content, alt);
      if (rendered) alt = !alt;
      return rendered;
    })
    .filter(Boolean)
    .join('\n');

  const nav = buildNav(ctx, content);

  const replacements: Record<string, string> = {
    '{{BRAND}}': escapeHtml(ctx.brand),
    '{{PROFESSION}}': escapeHtml(ctx.profession),
    '{{CITY}}': escapeHtml(ctx.city),
    '{{ADDRESS}}': escapeHtml(ctx.address),
    '{{PHONE}}': escapeHtml(ctx.phone),
    '{{PHONE_RAW}}': escapeHtml(ctx.phoneRaw),
    '{{EMAIL}}': escapeHtml(ctx.email),
    '{{TAGLINE}}': escapeHtml(ctx.tagline),
    '{{CTA_LABEL}}': escapeHtml(ctx.ctaLabel),
    '{{YEAR}}': escapeHtml(ctx.year),
    '{{NAV}}': nav,
  };

  html = html.replace('<!--GV:SECTIONS-->', sections);
  for (const [token, value] of Object.entries(replacements)) {
    html = html.replaceAll(token, value);
  }

  return html + buildClientScript(ctx);
}

function buildClientScript(ctx: RenderContext): string {
  return `
<script>
  window.__GV_DEMO_CONTENT__ = ${JSON.stringify({
    brandName: ctx.brand,
    profession: ctx.profession,
    city: ctx.city,
    phone: ctx.phone,
    email: ctx.email,
    concept: ctx.design.conceptName,
    isCaPractice: false,
    templateId: ctx.design.id,
  })};
  (function () {
    if (window.location.search.includes('screenshot=true')) {
      document.documentElement.style.zoom = '1.15';
      document.body.style.overflow = 'hidden';
      document.documentElement.classList.add('screenshot-mode');
    }
    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('form').forEach(function (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var toast = document.createElement('div');
          toast.textContent = '✅ Enquiry simulated for ' + ${JSON.stringify(ctx.brand)} + '.';
          toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#10151f;color:#fff;padding:12px 20px;border-radius:12px;font:600 13px/1.4 ${'system-ui'};z-index:99999;box-shadow:0 10px 25px rgba(0,0,0,.3)';
          document.body.appendChild(toast);
          setTimeout(function () { toast.remove(); }, 4000);
          form.reset();
        });
      });
    });
  })();
</script>`;
}

/** Detects a profession Stitch design id from rendered/raw shell HTML. */
export function detectProfessionStitchDesignId(html: string): string | undefined {
  const match = html.match(/data-gv-template="([^"]+)"/);
  if (!match) return undefined;
  return getProfessionStitchDesign(match[1]) ? match[1] : undefined;
}
