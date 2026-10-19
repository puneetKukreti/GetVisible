import type { ProfessionStitchPalette } from './profession-stitch';

/**
 * Curated industry palette + typography systems.
 *
 * A per-industry design blueprint never emits raw CSS. It only *selects* one of
 * these pre-designed systems (plus an optional validated accent hex), so an
 * AI-authored design decision can never produce unreadable contrast, arbitrary
 * fonts or injected styles. Each system is a complete, contrast-checked palette
 * that drops straight onto a Profession Stitch archetype.
 */

export interface IndustryTypography {
  fontDisplay: string;
  fontBody: string;
  /** Google Fonts stylesheet URL. */
  href: string;
}

export interface IndustryPalette {
  id: string;
  name: string;
  /** How this system should be described to prospects/owners. */
  description: string;
  bestFor: string;
  palette: ProfessionStitchPalette;
  typography: IndustryTypography;
}

/** Reusable font pairings (all standard Google Fonts). */
const TYPOGRAPHY = {
  'serif-editorial': {
    fontDisplay: "'Cormorant Garamond', Georgia, serif",
    fontBody: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap',
  },
  'serif-warm': {
    fontDisplay: "'Fraunces', Georgia, serif",
    fontBody: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap',
  },
  'serif-elegant': {
    fontDisplay: "'Playfair Display', Georgia, serif",
    fontBody: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap',
  },
  'sans-geometric': {
    fontDisplay: "'Space Grotesk', 'Inter', sans-serif",
    fontBody: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap',
  },
  'sans-humanist': {
    fontDisplay: "'Manrope', 'Inter', sans-serif",
    fontBody: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap',
  },
  'sans-condensed': {
    fontDisplay: "'Barlow Condensed', 'Inter', sans-serif",
    fontBody: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;600&display=swap',
  },
} satisfies Record<string, IndustryTypography>;

export const INDUSTRY_PALETTES: Record<string, IndustryPalette> = {
  'midnight-garage': {
    id: 'midnight-garage',
    name: 'Midnight Garage',
    description: 'Dark automotive showroom with a high-visibility amber accent.',
    bestFor: 'Car detailing, auto workshops, garages, tyres, bike service, body shops',
    palette: {
      bg: '#0d0e11',
      surface: '#16181d',
      surfaceAlt: '#101216',
      ink: '#f4f5f7',
      muted: '#9aa1ac',
      accent: '#f59e0b',
      accentInk: '#1a1206',
      line: '#24272e',
      heroOverlay: 'rgba(8,9,12,0.35), rgba(8,9,12,0.9)',
    },
    typography: TYPOGRAPHY['sans-condensed'],
  },
  'electric-blueprint': {
    id: 'electric-blueprint',
    name: 'Electric Blueprint',
    description: 'Deep technical navy with an electric cyan accent.',
    bestFor: 'Solar, electricals, EV charging, security systems, technical installation',
    palette: {
      bg: '#0a1220',
      surface: '#101a2b',
      surfaceAlt: '#0c1422',
      ink: '#eef4fb',
      muted: '#93a4bd',
      accent: '#22d3ee',
      accentInk: '#04222b',
      line: '#1c2a40',
      heroOverlay: 'rgba(6,12,22,0.35), rgba(6,12,22,0.9)',
    },
    typography: TYPOGRAPHY['sans-geometric'],
  },
  'clean-industrial': {
    id: 'clean-industrial',
    name: 'Clean Industrial',
    description: 'Crisp light slate with a safety-orange accent and sturdy type.',
    bestFor: 'Plumbing, contracting, HVAC, fabrication, manufacturing, logistics',
    palette: {
      bg: '#f6f7f9',
      surface: '#ffffff',
      surfaceAlt: '#eef1f5',
      ink: '#131720',
      muted: '#5c6675',
      accent: '#ea580c',
      accentInk: '#fff7ed',
      line: '#dfe4ea',
      heroOverlay: 'rgba(15,20,30,0.3), rgba(15,20,30,0.8)',
    },
    typography: TYPOGRAPHY['sans-humanist'],
  },
  'organic-care': {
    id: 'organic-care',
    name: 'Organic Care',
    description: 'Fresh light green — trustworthy, clean and safe-feeling.',
    bestFor: 'Pest control, cleaning, landscaping, pet care, pest-free homes',
    palette: {
      bg: '#f7faf7',
      surface: '#ffffff',
      surfaceAlt: '#edf5ee',
      ink: '#16211a',
      muted: '#5e7263',
      accent: '#16a34a',
      accentInk: '#f2fdf5',
      line: '#dbe8dd',
      heroOverlay: 'rgba(12,25,16,0.28), rgba(12,25,16,0.78)',
    },
    typography: TYPOGRAPHY['sans-humanist'],
  },
  'clinical-mint': {
    id: 'clinical-mint',
    name: 'Clinical Mint',
    description: 'Calm clinical white with a reassuring teal accent.',
    bestFor: 'Clinics, dental, physiotherapy, diagnostics, wellness practices',
    palette: {
      bg: '#f8fbfb',
      surface: '#ffffff',
      surfaceAlt: '#ecf6f5',
      ink: '#10201f',
      muted: '#5c7370',
      accent: '#0d9488',
      accentInk: '#f0fdfa',
      line: '#d8e8e6',
      heroOverlay: 'rgba(10,26,25,0.28), rgba(10,26,25,0.78)',
    },
    typography: TYPOGRAPHY['sans-humanist'],
  },
  'premium-charcoal-gold': {
    id: 'premium-charcoal-gold',
    name: 'Premium Charcoal & Gold',
    description: 'Near-black luxury with a brushed-gold accent and display serif.',
    bestFor: 'Interiors, furniture, jewellery, premium retail, boutique services',
    palette: {
      bg: '#0f0f10',
      surface: '#17171a',
      surfaceAlt: '#121214',
      ink: '#f5f3ef',
      muted: '#a5a09a',
      accent: '#c9a227',
      accentInk: '#17130a',
      line: '#26252a',
      heroOverlay: 'rgba(10,10,12,0.3), rgba(10,10,12,0.85)',
    },
    typography: TYPOGRAPHY['serif-elegant'],
  },
  'warm-artisan': {
    id: 'warm-artisan',
    name: 'Warm Artisan',
    description: 'Cream and terracotta with a warm display serif.',
    bestFor: 'Bakeries, catering, food, crafts, events, handmade products',
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
    typography: TYPOGRAPHY['serif-warm'],
  },
  'soft-blush': {
    id: 'soft-blush',
    name: 'Soft Blush',
    description: 'Blush and plum with an elegant serif — soft but premium.',
    bestFor: 'Salons, spas, beauty, bridal, makeup studios',
    palette: {
      bg: '#fdf7f8',
      surface: '#ffffff',
      surfaceAlt: '#faeef1',
      ink: '#2a1a20',
      muted: '#7d6870',
      accent: '#c2185b',
      accentInk: '#fff5f8',
      line: '#f0dde2',
      heroOverlay: 'rgba(38,18,26,0.24), rgba(38,18,26,0.72)',
    },
    typography: TYPOGRAPHY['serif-elegant'],
  },
  'vivid-sport': {
    id: 'vivid-sport',
    name: 'Vivid Sport',
    description: 'Dark high-energy shell with a vivid orange accent.',
    bestFor: 'Gyms, fitness, sports coaching, dance, adventure and activity brands',
    palette: {
      bg: '#0c0d10',
      surface: '#15171b',
      surfaceAlt: '#101216',
      ink: '#f6f7f8',
      muted: '#9ba1aa',
      accent: '#f97316',
      accentInk: '#1a0d02',
      line: '#23262c',
      heroOverlay: 'rgba(8,9,12,0.35), rgba(8,9,12,0.9)',
    },
    typography: TYPOGRAPHY['sans-condensed'],
  },
  'corporate-navy': {
    id: 'corporate-navy',
    name: 'Corporate Navy',
    description: 'Clean white with a trustworthy navy and blue accent.',
    bestFor: 'Consulting, B2B services, finance-adjacent, trades needing credibility',
    palette: {
      bg: '#f7f9fc',
      surface: '#ffffff',
      surfaceAlt: '#eef3f9',
      ink: '#101a2b',
      muted: '#566274',
      accent: '#1d4ed8',
      accentInk: '#eff6ff',
      line: '#dbe3ee',
      heroOverlay: 'rgba(12,22,40,0.3), rgba(12,22,40,0.8)',
    },
    typography: TYPOGRAPHY['sans-humanist'],
  },
};

export type IndustryPaletteId = keyof typeof INDUSTRY_PALETTES;

export const INDUSTRY_PALETTE_IDS: string[] = Object.keys(INDUSTRY_PALETTES);

export const DEFAULT_INDUSTRY_PALETTE_ID = 'corporate-navy';

/** Resolves a palette system by id (undefined for unknown / unsafe ids). */
export function getIndustryPalette(id?: string): IndustryPalette | undefined {
  if (!id) return undefined;
  return INDUSTRY_PALETTES[id];
}

/** True when `id` is a known industry palette system. */
export function isIndustryPaletteId(id?: string): boolean {
  return Boolean(id) && typeof id === 'string' && id in INDUSTRY_PALETTES;
}
