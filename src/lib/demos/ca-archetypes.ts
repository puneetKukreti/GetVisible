import { WebsiteLayout } from '@/types';
import { LeadFacts } from './templates';

export interface CAArchetypeMeta {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  defaultLayout: WebsiteLayout;
  defaultThemeId: string;
  targetAudience: string;
  keyRegulations: string[];
}

/**
 * 3 Selectable Google Stitch website design templates for CA practices.
 */
export const INDIAN_CA_ARCHETYPES: CAArchetypeMeta[] = [
  {
    id: 'design-1-premium',
    name: 'Design 1: Premium Editorial',
    shortName: 'Premium Editorial',
    tagline: 'Venerable Jurisprudence — Classic Institutional Advisory',
    description: 'Deep navy & gold editorial aesthetic engineered for statutory audit, transfer pricing, and corporate tax.',
    defaultLayout: 'EDITORIAL_FINANCE',
    defaultThemeId: 'executive-navy',
    targetAudience: 'Corporate MNC Subsidiaries, Listed Entities, Statutory Audit & TP Practices',
    keyRegulations: ['Section 92E', 'Companies Act Section 143', 'Ind AS', 'Corporate Tax'],
  },
  {
    id: 'design-2-minimalist',
    name: 'Design 2: Minimalist Ledger',
    shortName: 'Minimalist Ledger',
    tagline: 'Architectural Ledger — High-Density Precision Grid',
    description: 'Parchment background with JetBrains Mono data tags and fine-line borders for GST litigation and industrial corridors.',
    defaultLayout: 'SWISS_MINIMAL',
    defaultThemeId: 'corporate-slate',
    targetAudience: 'Manufacturing Corridors, GST Defense, Industrial Audit & Litigation',
    keyRegulations: ['Section 16(4) ITC', 'GST Scrutiny Rebuttal', 'Audit Protection', 'Industrial Taxation'],
  },
  {
    id: 'design-3-contemporary',
    name: 'Design 3: Contemporary Corporate',
    shortName: 'Contemporary Corporate',
    tagline: 'Executive Capital / New Delhi — Prestige Split Cards',
    description: 'Corporate navy with warm sand gradients and modern elevation for Virtual CFO and NRI wealth advisory.',
    defaultLayout: 'MODERN_FINTECH',
    defaultThemeId: 'tech-teal',
    targetAudience: 'Tech Startups, Virtual CFO, High-Net-Worth & NRI Remittance Practices',
    keyRegulations: ['Virtual CFO', 'Form 15CA/15CB', 'Angel Tax Defense', 'Startup Advisory'],
  },
];

/**
 * Intelligent archetype inference matching lead facts to the best Stitch design.
 */
export function inferCAArchetype(facts?: Partial<LeadFacts>): string {
  if (!facts) return 'design-1-premium';
  const name = (facts.businessName || '').toLowerCase();
  if (name.includes('gst') || name.includes('indirect') || name.includes('plant') || name.includes('indus')) {
    return 'design-2-minimalist';
  }
  if (name.includes('startup') || name.includes('cfo') || name.includes('venture') || name.includes('nri') || name.includes('tech')) {
    return 'design-3-contemporary';
  }
  return 'design-1-premium';
}
