import type { ProfessionCategory } from './profession-config';
import type { WebsiteSectionType } from '@/types';
import { getIndustryPalette } from './industry-palettes';

/**
 * Profession-specific Stitch template sets.
 *
 * These are the non-CA counterparts to the three CA-only Google Stitch templates
 * (`design-1-premium`, `design-2-minimalist`, `design-3-contemporary`). Each set
 * ships its own visual identity (palette, typography, hero/gallery layout) and a
 * profession-appropriate canonical section order.
 *
 * The shell markup + CSS is generated deterministically by
 * `profession-stitch-renderer.ts`; content is filled from the validated
 * `WebsiteContent` model. Nothing here executes generated JS/HTML/CSS - the
 * AI only decides *content*, never markup.
 */

export interface ProfessionStitchPalette {
  /** Page background. */
  bg: string;
  /** Elevated card / surface background. */
  surface: string;
  /** Alternate surface used to band sections. */
  surfaceAlt: string;
  /** Primary text colour. */
  ink: string;
  /** Secondary / muted text colour. */
  muted: string;
  /** Brand accent colour. */
  accent: string;
  /** Text colour that sits on top of the accent. */
  accentInk: string;
  /** Hairline border colour. */
  line: string;
  /** Hero image gradient overlay (two colour stops, comma separated). */
  heroOverlay: string;
}

export interface ProfessionStitchDesign {
  id: string;
  /** Primary category this archetype is tuned for (kept for backwards compatibility). */
  category: ProfessionCategory;
  /** Every profession category this reusable archetype can serve. */
  categories: ProfessionCategory[];
  /** True for the fallback archetype used when a category has no dedicated match. */
  isDefaultArchetype?: boolean;
  name: string;
  conceptName: string;
  badge: string;
  shortDescription: string;
  fullDescription: string;
  bestFor: string;
  typography: string;
  /** Google Fonts stylesheet URL for this design. */
  fontsHref: string;
  fontDisplay: string;
  fontBody: string;
  palette: ProfessionStitchPalette;
  heroStyle: 'fullbleed' | 'split' | 'centered';
  galleryStyle: 'masonry' | 'grid' | 'listings';
  radius: string;
  sectionOrder: WebsiteSectionType[];
  defaultHeroImage: string;
  defaultAboutImage: string;
  keyFeatures: string[];
  thumbnail: string;
}

export const PROFESSION_STITCH_DESIGNS: Record<string, ProfessionStitchDesign> = {
  'design-photo-editorial': {
    id: 'design-photo-editorial',
    category: 'PHOTOGRAPHY_CREATIVE',
    categories: ['PHOTOGRAPHY_CREATIVE', 'INTERIOR_ARCHITECTURE'],
    name: 'Design P: Aperture Editorial',
    conceptName: 'Aperture Editorial',
    badge: 'Image-Led Editorial',
    shortDescription:
      'A dark, cinematic, image-first portfolio design with an editorial serif and a masonry portfolio wall - built for photographers and videographers.',
    fullDescription:
      'Full-bleed hero photography, an editorial display serif, and a masonry portfolio wall tuned for visual storytelling. Packages, approach and booking flow are framed around showreels rather than text.',
    bestFor: 'Photographers, videographers, studios & creative visual artists',
    typography: 'Cormorant Garamond display + Inter body',
    fontsHref:
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap',
    fontDisplay: "'Cormorant Garamond', Georgia, serif",
    fontBody: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    palette: {
      bg: '#0b0b0e',
      surface: '#141418',
      surfaceAlt: '#111115',
      ink: '#f6f5f2',
      muted: '#a3a3ad',
      accent: '#c8a15a',
      accentInk: '#14100a',
      line: '#26262d',
      heroOverlay: 'rgba(8,8,10,0.35), rgba(8,8,10,0.88)',
    },
    heroStyle: 'fullbleed',
    galleryStyle: 'masonry',
    radius: '4px',
    sectionOrder: [
      'HERO',
      'SERVICES',
      'GALLERY',
      'EXPERTISE',
      'ABOUT',
      'PROCESS',
      'WHY_CHOOSE_US',
      'FAQ',
      'CTA',
      'CONTACT',
      'LOCATION',
    ],
    defaultHeroImage:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
    defaultAboutImage:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80',
    keyFeatures: [
      'Full-bleed cinematic hero image treatment',
      'Masonry portfolio wall with captions & categories',
      'Editorial serif headline system',
      'Shoot-date inquiry flow with WhatsApp link',
    ],
    thumbnail: '/demo-templates/design-photo-editorial/hero.png',
  },
  'design-restaurant-warm': {
    id: 'design-restaurant-warm',
    category: 'RESTAURANT_HOSPITALITY',
    categories: ['RESTAURANT_HOSPITALITY'],
    name: 'Design R: Saffron Table',
    conceptName: 'Saffron Table',
    badge: 'Warm Hospitality',
    shortDescription:
      'A warm, appetite-driven design with a featured menu ledger, dining gallery and reservation flow - built for restaurants, cafes and catering.',
    fullDescription:
      'Cream-and-saffron palette, a structured menu ledger with category pricing, an ambience gallery, and a reservation/order enquiry flow designed to fill tables.',
    bestFor: 'Restaurants, cafes, cloud kitchens, bakeries & caterers',
    typography: 'Fraunces display + Inter body',
    fontsHref:
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap',
    fontDisplay: "'Fraunces', Georgia, serif",
    fontBody: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    palette: {
      bg: '#fdf8f1',
      surface: '#ffffff',
      surfaceAlt: '#f7ecdc',
      ink: '#241a12',
      muted: '#7a6a5b',
      accent: '#c2410c',
      accentInk: '#fff7ed',
      line: '#ecdcc6',
      heroOverlay: 'rgba(36,20,10,0.25), rgba(36,20,10,0.75)',
    },
    heroStyle: 'split',
    galleryStyle: 'grid',
    radius: '14px',
    sectionOrder: [
      'HERO',
      'SERVICES',
      'MENU',
      'GALLERY',
      'ABOUT',
      'WHY_CHOOSE_US',
      'FAQ',
      'CTA',
      'CONTACT',
      'LOCATION',
    ],
    defaultHeroImage:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85',
    defaultAboutImage:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80',
    keyFeatures: [
      'Featured menu ledger with categories & pricing',
      'Warm hospitality palette & rounded cards',
      'Ambience / food gallery grid',
      'Reservation & order enquiry flow',
    ],
    thumbnail: '/demo-templates/design-restaurant-warm/hero.png',
  },
  'design-clinic-clean': {
    id: 'design-clinic-clean',
    category: 'HEALTHCARE_MEDICAL',
    categories: ['HEALTHCARE_MEDICAL'],
    name: 'Design C: Meridian Care',
    conceptName: 'Meridian Care',
    badge: 'Clinical Trust',
    shortDescription:
      'A calm, clinical, trust-first design with treatment cards, a patient journey and appointment booking - built for clinics, doctors and diagnostics.',
    fullDescription:
      'Soft teal-and-slate palette, credential/assurance strip, structured treatment cards and a step-by-step patient journey leading into an appointment enquiry form.',
    bestFor: 'Clinics, doctors, dentists, diagnostic centres & therapists',
    typography: 'Sora display + Inter body',
    fontsHref:
      'https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap',
    fontDisplay: "'Sora', -apple-system, sans-serif",
    fontBody: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    palette: {
      bg: '#f5fafb',
      surface: '#ffffff',
      surfaceAlt: '#e9f4f5',
      ink: '#0f2b30',
      muted: '#5b7378',
      accent: '#0d9488',
      accentInk: '#f0fdfa',
      line: '#d5e7e9',
      heroOverlay: 'rgba(10,40,44,0.20), rgba(10,40,44,0.62)',
    },
    heroStyle: 'centered',
    galleryStyle: 'grid',
    radius: '16px',
    sectionOrder: [
      'HERO',
      'TRUST',
      'SERVICES',
      'ABOUT',
      'PROCESS',
      'WHY_CHOOSE_US',
      'FAQ',
      'CTA',
      'CONTACT',
      'LOCATION',
    ],
    defaultHeroImage:
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1600&q=85',
    defaultAboutImage:
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=80',
    keyFeatures: [
      'Assurance / credential trust strip',
      'Structured treatment & speciality cards',
      'Step-by-step patient journey',
      'Appointment booking enquiry form',
    ],
    thumbnail: '/demo-templates/design-clinic-clean/hero.png',
  },
  'design-realestate-premium': {
    id: 'design-realestate-premium',
    category: 'REAL_ESTATE_PROPERTY',
    categories: ['REAL_ESTATE_PROPERTY'],
    name: 'Design E: Skyline Estates',
    conceptName: 'Skyline Estates',
    badge: 'Premium Property',
    shortDescription:
      'A premium, navy-and-gold listings design with property segment cards, an investment advisory flow and site-visit scheduling.',
    fullDescription:
      'Full-bleed property hero, premium navy/gold palette, listing-style segment cards for residential/commercial/investment, and a schedule-a-site-visit enquiry flow.',
    bestFor: 'Realtors, brokers, builders, developers & property advisory',
    typography: 'Playfair Display + Inter',
    fontsHref:
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap',
    fontDisplay: "'Playfair Display', Georgia, serif",
    fontBody: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    palette: {
      bg: '#0a1120',
      surface: '#111a2b',
      surfaceAlt: '#0d1524',
      ink: '#f4f7fb',
      muted: '#95a3ba',
      accent: '#c9a227',
      accentInk: '#1a1406',
      line: '#212d43',
      heroOverlay: 'rgba(6,12,24,0.35), rgba(6,12,24,0.85)',
    },
    heroStyle: 'fullbleed',
    galleryStyle: 'listings',
    radius: '10px',
    sectionOrder: [
      'HERO',
      'TRUST',
      'SERVICES',
      'GALLERY',
      'ABOUT',
      'PROCESS',
      'WHY_CHOOSE_US',
      'FAQ',
      'CTA',
      'CONTACT',
      'LOCATION',
    ],
    defaultHeroImage:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=85',
    defaultAboutImage:
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1000&q=80',
    keyFeatures: [
      'Premium navy & gold editorial treatment',
      'Listing-style property segment cards',
      'Investment corridor / portfolio framing',
      'Schedule-a-site-visit enquiry flow',
    ],
    thumbnail: '/demo-templates/design-realestate-premium/hero.png',
  },
  'design-bold-energetic': {
    id: 'design-bold-energetic',
    category: 'FITNESS_GYM',
    categories: ['FITNESS_GYM', 'EDUCATION_COACHING'],
    name: 'Design B: Iron & Ember',
    conceptName: 'Iron & Ember',
    badge: 'Energy & Strength',
    shortDescription:
      'A dark, high-energy design with a bold condensed display face, membership plan cards and a conditioning gallery - built for gyms, studios and coaching brands.',
    fullDescription:
      'Near-black canvas with an ember accent, full-bleed training imagery, membership/plan ledgers, and a coaching journey that turns interest into a trial enquiry.',
    bestFor: 'Gyms, fitness studios, CrossFit boxes, trainers, academies & coaching brands',
    typography: 'Oswald display + Inter body',
    fontsHref:
      'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap',
    fontDisplay: "'Oswald', 'Arial Narrow', sans-serif",
    fontBody: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    palette: {
      bg: '#0d0d10',
      surface: '#17171d',
      surfaceAlt: '#121218',
      ink: '#f7f7f8',
      muted: '#a1a1ab',
      accent: '#f97316',
      accentInk: '#1a0e05',
      line: '#2a2a33',
      heroOverlay: 'rgba(8,8,10,0.30), rgba(8,8,10,0.86)',
    },
    heroStyle: 'fullbleed',
    galleryStyle: 'masonry',
    radius: '6px',
    sectionOrder: [
      'HERO',
      'SERVICES',
      'MENU',
      'GALLERY',
      'EXPERTISE',
      'ABOUT',
      'PROCESS',
      'WHY_CHOOSE_US',
      'FAQ',
      'CTA',
      'CONTACT',
      'LOCATION',
    ],
    defaultHeroImage:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=85',
    defaultAboutImage:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1000&q=80',
    keyFeatures: [
      'Bold condensed display type with ember accent',
      'Membership / plan ledger cards',
      'Training facility & conditioning gallery',
      'Trial-session enquiry flow with WhatsApp',
    ],
    thumbnail: '/demo-templates/design-bold-energetic/hero.png',
  },
  'design-beauty-elegant': {
    id: 'design-beauty-elegant',
    category: 'BEAUTY_SALON',
    categories: ['BEAUTY_SALON'],
    name: 'Design S: Blush Atelier',
    conceptName: 'Blush Atelier',
    badge: 'Soft Luxury',
    shortDescription:
      'A soft, elegant design with a refined serif, treatment price menu and a styling gallery - built for salons, spas and beauty studios.',
    fullDescription:
      'Blush-and-rose palette, a treatment menu with pricing, a look-book gallery, and a booking-focused enquiry flow designed to fill appointment slots.',
    bestFor: 'Salons, spas, beauty studios, makeup artists & bridal styling',
    typography: 'Prata display + Inter body',
    fontsHref:
      'https://fonts.googleapis.com/css2?family=Prata&family=Inter:wght@400;500;600;700&display=swap',
    fontDisplay: "'Prata', Georgia, serif",
    fontBody: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    palette: {
      bg: '#fdf6f4',
      surface: '#ffffff',
      surfaceAlt: '#f8ebe8',
      ink: '#2c1a1e',
      muted: '#8b6f74',
      accent: '#c2185b',
      accentInk: '#fff1f5',
      line: '#f0dcdc',
      heroOverlay: 'rgba(44,26,30,0.22), rgba(44,26,30,0.68)',
    },
    heroStyle: 'split',
    galleryStyle: 'masonry',
    radius: '18px',
    sectionOrder: [
      'HERO',
      'SERVICES',
      'MENU',
      'GALLERY',
      'EXPERTISE',
      'ABOUT',
      'WHY_CHOOSE_US',
      'FAQ',
      'CTA',
      'CONTACT',
      'LOCATION',
    ],
    defaultHeroImage:
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=85',
    defaultAboutImage:
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
    keyFeatures: [
      'Soft blush palette with a refined serif',
      'Treatment & price menu',
      'Look-book styling gallery',
      'Appointment booking enquiry flow',
    ],
    thumbnail: '/demo-templates/design-beauty-elegant/hero.png',
  },
  'design-classic-professional': {
    id: 'design-classic-professional',
    category: 'GENERAL_SMB',
    categories: ['GENERAL_SMB', 'LEGAL_LAW'],
    isDefaultArchetype: true,
    name: 'Design X: Meridian Professional',
    conceptName: 'Meridian Professional',
    badge: 'Trusted & Professional',
    shortDescription:
      'A clean, credible, general-purpose professional design with a warm serif, structured service cards and a clear enquiry flow - the default for any business type.',
    fullDescription:
      'Light, trustworthy layout with deep-blue accents, service and expertise cards, a working process, and an enquiry flow that suits almost any local business or practice.',
    bestFor: 'Any local business or practice without a dedicated visual identity',
    typography: 'Lora display + Inter body',
    fontsHref:
      'https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap',
    fontDisplay: "'Lora', Georgia, serif",
    fontBody: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    palette: {
      bg: '#f6f8fb',
      surface: '#ffffff',
      surfaceAlt: '#eef2f8',
      ink: '#0f1c2e',
      muted: '#5a6b83',
      accent: '#1d4ed8',
      accentInk: '#eff6ff',
      line: '#dce3ee',
      heroOverlay: 'rgba(12,24,42,0.28), rgba(12,24,42,0.72)',
    },
    heroStyle: 'split',
    galleryStyle: 'grid',
    radius: '10px',
    sectionOrder: [
      'HERO',
      'SERVICES',
      'ABOUT',
      'EXPERTISE',
      'PROCESS',
      'WHY_CHOOSE_US',
      'FAQ',
      'CTA',
      'CONTACT',
      'LOCATION',
    ],
    defaultHeroImage:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=85',
    defaultAboutImage:
      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=80',
    keyFeatures: [
      'Clean, trustworthy professional palette',
      'Structured service & expertise cards',
      'Working-process and trust sections',
      'Clear enquiry flow with WhatsApp',
    ],
    thumbnail: '/demo-templates/design-classic-professional/hero.png',
  },
};

export function getProfessionStitchDesign(id?: string): ProfessionStitchDesign | undefined {
  if (!id) return undefined;
  return PROFESSION_STITCH_DESIGNS[id];
}

/** All registered archetype ids (used for AI selection allow-lists and validation). */
export const PROFESSION_ARCHETYPE_IDS: string[] = Object.keys(PROFESSION_STITCH_DESIGNS);

/** The fallback archetype served when a profession category has no dedicated match. */
export const DEFAULT_ARCHETYPE_ID =
  Object.values(PROFESSION_STITCH_DESIGNS).find((d) => d.isDefaultArchetype)?.id ||
  PROFESSION_ARCHETYPE_IDS[0];

/** True when `id` is a known profession archetype / Stitch template set. */
export function isProfessionArchetypeId(id?: string): boolean {
  return Boolean(id) && id! in PROFESSION_STITCH_DESIGNS;
}

/**
 * Resolves the profession Stitch layout id for a profession category.
 *
 * Any non-CA category resolves to an archetype: a category with a dedicated
 * match gets that set, and every other (including unknown) category falls back
 * to the default archetype - so "just type a profession" always yields a
 * Stitch-quality design rather than dropping to the legacy React theme.
 */
export function getProfessionStitchLayout(category?: ProfessionCategory): string | undefined {
  if (!category || category === 'CA_FINANCE') return undefined;
  const found = Object.values(PROFESSION_STITCH_DESIGNS).find((d) => d.categories.includes(category));
  return found?.id ?? DEFAULT_ARCHETYPE_ID;
}

/** True when `layout` is one of the profession-specific Stitch template sets. */
export function isProfessionStitchLayout(layout?: string): boolean {
  return Boolean(getProfessionStitchDesign(layout));
}

/** Persisted, per-lead design directive stored on `WebsiteDesign.stitch`. */
export interface StitchDirective {
  /** Archetype / layout id chosen for this lead (usually equals the layout). */
  archetype?: string;
  /** Optional profession-tuned accent colour (validated hex). */
  accentColor?: string;
  /**
   * Allow-listed industry palette/typography system (see `industry-palettes.ts`)
   * selected by the per-industry design blueprint. Never arbitrary CSS.
   */
  paletteId?: string;
  /** Allow-listed hero treatment chosen by the industry blueprint. */
  heroStyle?: 'fullbleed' | 'split' | 'centered';
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const HERO_STYLES = ['fullbleed', 'split', 'centered'] as const;

/**
 * Applies a validated per-lead directive (an AI-suggested accent and/or a
 * per-industry palette system) on top of a base archetype. Only allow-listed,
 * safe values are applied; anything else is ignored, so nothing can ever inject
 * arbitrary CSS.
 */
export function applyStitchOverrides(
  design: ProfessionStitchDesign,
  directive?: StitchDirective
): ProfessionStitchDesign {
  let next = design;

  const palette = getIndustryPalette(directive?.paletteId);
  if (palette) {
    next = {
      ...next,
      palette: { ...palette.palette },
      fontDisplay: palette.typography.fontDisplay,
      fontBody: palette.typography.fontBody,
      fontsHref: palette.typography.href,
    };
  }

  const accent = directive?.accentColor;
  if (accent && HEX_COLOR.test(accent)) {
    next = { ...next, palette: { ...next.palette, accent: accent.toLowerCase() } };
  }

  const heroStyle = directive?.heroStyle;
  if (heroStyle && (HERO_STYLES as readonly string[]).includes(heroStyle)) {
    next = { ...next, heroStyle };
  }

  return next;
}
