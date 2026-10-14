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

export const CLINIC_HEALTHCARE_ARCHETYPE: CAArchetypeMeta = {
  id: 'CLINIC_HEALTHCARE',
  name: 'Design: Healthcare & Dental Clinic',
  shortName: 'Healthcare & Clinic',
  tagline: 'Patient-First Healthcare — Advanced Diagnostics & Care',
  description: 'Clinical teal and clean modern layout designed for dental clinics, multispeciality practices, and healthcare doctors.',
  defaultLayout: 'CLINIC_HEALTHCARE',
  defaultThemeId: 'tech-teal',
  targetAudience: 'Dental Clinics, General Practitioners, Skin Specialists, Diagnostic Centers',
  keyRegulations: ['NABH Guidelines', 'Clinical Establishments Act', 'Patient Confidentiality', 'IMA Code of Ethics'],
};

export const INTERIOR_ARCHITECTURE_ARCHETYPE: CAArchetypeMeta = {
  id: 'INTERIOR_ARCHITECTURE',
  name: 'Design: Interior Architecture & Studio',
  shortName: 'Interior & Architecture',
  tagline: 'Spatial Elegance — Turnkey Architecture & Interior Styling',
  description: 'Warm slate and luxury serif aesthetic engineered for architectural studios, interior turnkey contractors, and modular design firms.',
  defaultLayout: 'INTERIOR_ARCHITECTURE',
  defaultThemeId: 'corporate-slate',
  targetAudience: 'Residential Interior Studios, Commercial Architects, Turnkey Decorators, Modular Kitchen Designers',
  keyRegulations: ['Council of Architecture (COA)', 'NBC 2016 Standards', 'Green Building Norms', 'Turnkey Warranties'],
};

/**
 * Selectable Google Stitch website design templates for CA practices & local SMBs.
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
  CLINIC_HEALTHCARE_ARCHETYPE,
  INTERIOR_ARCHITECTURE_ARCHETYPE,
];

/**
 * Intelligent archetype inference matching lead facts to the best Stitch design or SMB template.
 */
export function inferCAArchetype(facts?: Partial<LeadFacts>): string {
  if (!facts) return 'design-1-premium';
  const text = `${facts.profession || ''} ${facts.businessName || ''}`.toLowerCase();
  if (/clinic|dental|dentist|doctor|medical|health|skin|physio/i.test(text)) {
    return 'CLINIC_HEALTHCARE';
  }
  if (/interior|architect|design|decor|modular/i.test(text)) {
    return 'INTERIOR_ARCHITECTURE';
  }
  if (text.includes('gst') || text.includes('indirect') || text.includes('plant') || text.includes('indus')) {
    return 'design-2-minimalist';
  }
  if (text.includes('startup') || text.includes('cfo') || text.includes('venture') || text.includes('nri') || text.includes('tech')) {
    return 'design-3-contemporary';
  }
  return 'design-1-premium';
}
