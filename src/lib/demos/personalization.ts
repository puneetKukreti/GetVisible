import {
  WebsiteDesign,
  WebsiteLayout,
  WebsiteSectionType,
  WebsiteTheme,
  WebsiteTemplate,
} from '@/types';
import { THEMES } from './templates';

export interface CALayoutDefinition {
  layout: WebsiteLayout;
  template: WebsiteTemplate;
  name: string;
  description: string;
  sectionOrder: WebsiteSectionType[];
  heroLayout: string;
  servicesLayout: string;
  features: {
    showVisualArtwork?: boolean;
    floatingHeader?: boolean;
    hairlineBorders?: boolean;
    monochromeGrid?: boolean;
    showLocationHighlight?: boolean;
    [key: string]: any;
  };
  contentDensity: 'compact' | 'comfortable' | 'spacious';
}

export const CA_LAYOUTS: Record<WebsiteLayout, CALayoutDefinition> = {
  EDITORIAL_FINANCE: {
    layout: 'EDITORIAL_FINANCE',
    template: 'EDITORIAL_FINANCE',
    name: 'Editorial Finance',
    description:
      'Premium editorial-style CA website with asymmetric layout, numbered service manifesto, and abstract financial artwork.',
    sectionOrder: [
      'HERO',
      'SERVICES',
      'ABOUT',
      'EXPERTISE',
      'CTA',
      'CONTACT',
      'LOCATION',
    ],
    heroLayout: 'asymmetric-editorial',
    servicesLayout: 'numbered-manifesto',
    features: {
      showVisualArtwork: true,
      hairlineBorders: false,
      floatingHeader: false,
    },
    contentDensity: 'comfortable',
  },
  MODERN_FINTECH: {
    layout: 'MODERN_FINTECH',
    template: 'MODERN_FINTECH',
    name: 'Modern Fintech',
    description:
      'Modern fintech/SaaS aesthetic with floating rounded navigation, decorative compliance dashboard, and feature cards.',
    sectionOrder: [
      'HERO',
      'SERVICES',
      'PROCESS',
      'TRUST',
      'CTA',
      'CONTACT',
      'LOCATION',
    ],
    heroLayout: 'split-fintech',
    servicesLayout: 'cards-glow',
    features: {
      floatingHeader: true,
      showVisualArtwork: false,
    },
    contentDensity: 'comfortable',
  },
  LUXURY_PROFESSIONAL: {
    layout: 'LUXURY_PROFESSIONAL',
    template: 'LUXURY_PROFESSIONAL',
    name: 'Luxury Professional',
    description:
      'High-end private advisory aesthetic with dramatic whitespace, serif display typography, and horizontal service rows.',
    sectionOrder: [
      'HERO',
      'SERVICES',
      'ABOUT',
      'EXPERTISE',
      'CTA',
      'CONTACT',
      'LOCATION',
    ],
    heroLayout: 'minimal-serif',
    servicesLayout: 'luxury-rows',
    features: {
      hairlineBorders: true,
      showVisualArtwork: true,
    },
    contentDensity: 'spacious',
  },
  SWISS_MINIMAL: {
    layout: 'SWISS_MINIMAL',
    template: 'SWISS_MINIMAL',
    name: 'Swiss Minimal',
    description:
      'Minimal Swiss-style corporate presence with strict 1px grid borders, massive bold typography, and clean structured modules.',
    sectionOrder: [
      'HERO',
      'SERVICES',
      'ABOUT',
      'EXPERTISE',
      'CONTACT',
      'LOCATION',
    ],
    heroLayout: 'swiss-grid',
    servicesLayout: 'swiss-grid',
    features: {
      monochromeGrid: true,
      showVisualArtwork: true,
    },
    contentDensity: 'compact',
  },
  MODERN_INDIAN: {
    layout: 'MODERN_INDIAN',
    template: 'MODERN_INDIAN',
    name: 'Modern Indian Professional',
    description:
      'Modern premium website tailored for Indian professional practices with prominent ICAI/compliance credentials and practice cards.',
    sectionOrder: [
      'HERO',
      'SERVICES',
      'WHY_CHOOSE_US',
      'PROCESS',
      'LOCATION',
      'CTA',
      'CONTACT',
    ],
    heroLayout: 'modern-indian',
    servicesLayout: 'practice-cards',
    features: {
      showLocationHighlight: true,
      showVisualArtwork: true,
    },
    contentDensity: 'comfortable',
  },
  // Legacy backward-compatibility mappings
  MODERN_CORPORATE: {
    layout: 'MODERN_CORPORATE',
    template: 'MODERN_FINTECH',
    name: 'Modern Corporate',
    description:
      'Clean, spacious, and contemporary digital presence with structured process steps and direct CTA flow.',
    sectionOrder: [
      'HERO',
      'SERVICES',
      'ABOUT',
      'WHY_CHOOSE_US',
      'PROCESS',
      'CTA',
      'CONTACT',
      'LOCATION',
    ],
    heroLayout: 'split-fintech',
    servicesLayout: 'cards-glow',
    features: {
      floatingHeader: true,
    },
    contentDensity: 'comfortable',
  },
  PREMIUM_PROFESSIONAL: {
    layout: 'PREMIUM_PROFESSIONAL',
    template: 'LUXURY_PROFESSIONAL',
    name: 'Premium Professional',
    description:
      'Sophisticated executive styling featuring prominent trust badges, deep expertise cards, and high-contrast styling.',
    sectionOrder: [
      'HERO',
      'TRUST',
      'SERVICES',
      'ABOUT',
      'EXPERTISE',
      'CTA',
      'CONTACT',
      'LOCATION',
    ],
    heroLayout: 'minimal-serif',
    servicesLayout: 'luxury-rows',
    features: {
      hairlineBorders: true,
    },
    contentDensity: 'spacious',
  },
  TRADITIONAL_CA: {
    layout: 'TRADITIONAL_CA',
    template: 'SWISS_MINIMAL',
    name: 'Traditional CA Firm',
    description:
      'Conservative, authoritative, and compliance-first institutional layout emphasizing firm history and governance.',
    sectionOrder: [
      'HERO',
      'ABOUT',
      'SERVICES',
      'EXPERTISE',
      'WHY_CHOOSE_US',
      'FAQ',
      'CONTACT',
      'CTA',
      'LOCATION',
    ],
    heroLayout: 'swiss-grid',
    servicesLayout: 'swiss-grid',
    features: {
      monochromeGrid: true,
    },
    contentDensity: 'compact',
  },
};

export const TEMPLATE_KEYS: WebsiteTemplate[] = [
  'EDITORIAL_FINANCE',
  'MODERN_FINTECH',
  'LUXURY_PROFESSIONAL',
  'SWISS_MINIMAL',
  'MODERN_INDIAN',
];

export const CA_THEMES: WebsiteTheme[] = Object.values(THEMES);

const THEME_KEYS = ['executiveNavy', 'corporateSlate', 'emeraldPrestige', 'classicBurgundy'] as const;
const LAYOUT_KEYS = TEMPLATE_KEYS;

/**
 * Fast, stable 32-bit FNV-1a hash implementation for deterministic distribution.
 */
export function hashLeadIdentifier(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export interface DesignSelectionOptions {
  layout?: WebsiteLayout;
  themeId?: string;
}

/**
 * Deterministically selects the website design (layout, theme, sectionOrder)
 * based on the lead's identifier and version.
 *
 * Rules:
 * 1. The same lead ID + version always yields the exact same layout and theme.
 * 2. Explicit options.layout or options.themeId will override the deterministic pick.
 * 3. Different leads get distributed across the 5 templates and 4 themes.
 */
export function selectWebsiteDesign(
  lead: { id?: string; businessName?: string; city?: string },
  version = 1,
  options?: DesignSelectionOptions
): WebsiteDesign {
  const seedString = `${lead.id || lead.businessName || 'default-lead'}${version > 1 ? `-v${version}` : ''}`;
  const hash = hashLeadIdentifier(seedString);

  // Layout selection: 5 modern templates
  const defaultLayoutKey = LAYOUT_KEYS[hash % LAYOUT_KEYS.length];
  const chosenLayoutKey =
    options?.layout && CA_LAYOUTS[options.layout]
      ? options.layout
      : defaultLayoutKey;

  const layoutDef = CA_LAYOUTS[chosenLayoutKey];

  // Theme selection: 4 themes (use shifted hash to decorrelate from layout)
  const defaultThemeKey = THEME_KEYS[Math.floor(hash / LAYOUT_KEYS.length) % THEME_KEYS.length];
  const defaultTheme = THEMES[defaultThemeKey] || THEMES.executiveNavy;

  let chosenTheme: WebsiteTheme = defaultTheme;
  if (options?.themeId) {
    const foundTheme = Object.values(THEMES).find((t) => t.id === options.themeId);
    if (foundTheme) {
      chosenTheme = foundTheme;
    }
  }

  return {
    layout: chosenLayoutKey,
    template: layoutDef.template || (chosenLayoutKey as WebsiteTemplate),
    theme: chosenTheme,
    sectionOrder: [...layoutDef.sectionOrder],
    heroLayout: layoutDef.heroLayout,
    servicesLayout: layoutDef.servicesLayout,
    features: layoutDef.features,
    contentDensity: layoutDef.contentDensity,
  };
}
