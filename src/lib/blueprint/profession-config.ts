import { z } from 'zod';

export type DesignSystemId =
  | 'minimal-professional'
  | 'premium-editorial'
  | 'modern-corporate'
  | 'healthcare-clean'
  | 'creative-portfolio'
  | 'bold-fitness'
  | 'local-business';

export interface DesignSystemTheme {
  id: DesignSystemId;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: 'sans' | 'serif';
  borderRadius: 'none' | 'sm' | 'md' | 'lg';
  style: 'corporate' | 'modern' | 'minimal';
  badgeStyle: string;
  cardStyle: string;
  accentBg: string;
}

export const DESIGN_SYSTEMS: Record<DesignSystemId, DesignSystemTheme> = {
  'minimal-professional': {
    id: 'minimal-professional',
    name: 'Minimal Professional',
    primaryColor: '#0f172a',
    secondaryColor: '#334155',
    accentColor: '#2563eb',
    fontFamily: 'sans',
    borderRadius: 'sm',
    style: 'minimal',
    badgeStyle: 'bg-slate-100 text-slate-800 border-slate-300',
    cardStyle: 'bg-white border-slate-200 shadow-xs hover:border-slate-400',
    accentBg: 'bg-slate-50',
  },
  'premium-editorial': {
    id: 'premium-editorial',
    name: 'Premium Editorial',
    primaryColor: '#1e293b',
    secondaryColor: '#475569',
    accentColor: '#d97706',
    fontFamily: 'serif',
    borderRadius: 'none',
    style: 'corporate',
    badgeStyle: 'bg-amber-50 text-amber-900 border-amber-300 font-serif',
    cardStyle: 'bg-white border-amber-200/80 shadow-xs hover:border-amber-400',
    accentBg: 'bg-amber-50/40',
  },
  'modern-corporate': {
    id: 'modern-corporate',
    name: 'Modern Corporate',
    primaryColor: '#1e3a8a',
    secondaryColor: '#1e293b',
    accentColor: '#0284c7',
    fontFamily: 'sans',
    borderRadius: 'md',
    style: 'corporate',
    badgeStyle: 'bg-blue-50 text-blue-800 border-blue-200',
    cardStyle: 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300',
    accentBg: 'bg-blue-50/50',
  },
  'healthcare-clean': {
    id: 'healthcare-clean',
    name: 'Healthcare Clean',
    primaryColor: '#0f766e',
    secondaryColor: '#134e4a',
    accentColor: '#06b6d4',
    fontFamily: 'sans',
    borderRadius: 'lg',
    style: 'modern',
    badgeStyle: 'bg-teal-50 text-teal-800 border-teal-200',
    cardStyle: 'bg-white border-teal-100 shadow-sm hover:border-teal-300',
    accentBg: 'bg-teal-50/30',
  },
  'creative-portfolio': {
    id: 'creative-portfolio',
    name: 'Creative Portfolio',
    primaryColor: '#18181b',
    secondaryColor: '#27272a',
    accentColor: '#f43f5e',
    fontFamily: 'sans',
    borderRadius: 'none',
    style: 'modern',
    badgeStyle: 'bg-zinc-100 text-zinc-900 border-zinc-300 tracking-wider uppercase',
    cardStyle: 'bg-zinc-900 text-white border-zinc-800 shadow-lg',
    accentBg: 'bg-zinc-950',
  },
  'bold-fitness': {
    id: 'bold-fitness',
    name: 'Bold Fitness',
    primaryColor: '#b91c1c',
    secondaryColor: '#18181b',
    accentColor: '#ea580c',
    fontFamily: 'sans',
    borderRadius: 'sm',
    style: 'modern',
    badgeStyle: 'bg-red-50 text-red-800 border-red-300 font-bold uppercase',
    cardStyle: 'bg-zinc-900 text-white border-zinc-800 hover:border-red-600',
    accentBg: 'bg-zinc-900',
  },
  'local-business': {
    id: 'local-business',
    name: 'Local Business',
    primaryColor: '#166534',
    secondaryColor: '#14532d',
    accentColor: '#15803d',
    fontFamily: 'sans',
    borderRadius: 'md',
    style: 'corporate',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cardStyle: 'bg-white border-emerald-100 shadow-xs hover:border-emerald-300',
    accentBg: 'bg-emerald-50/30',
  },
};

export type ProfessionId = 'CA' | 'Dentist' | 'Lawyer' | 'Architect' | 'Gym' | 'Custom';

export interface ProfessionConfig {
  id: ProfessionId;
  name: string;
  category: string;
  defaultDesignSystem: DesignSystemId;
  recommendedSectionOrder: string[];
  ctaLabel: string;
  ctaAction: 'consultation' | 'appointment' | 'enquiry' | 'trial' | 'contact';
  keywords: string[];
  heroBadgeDefault: string;
  sampleServices: { title: string; description: string }[];
  sampleFaq: { question: string; answer: string }[];
}

export const PROFESSION_CONFIGS: Record<ProfessionId, ProfessionConfig> = {
  CA: {
    id: 'CA',
    name: 'Chartered Accountant',
    category: 'Finance & Tax Advisory',
    defaultDesignSystem: 'premium-editorial',
    recommendedSectionOrder: ['HERO', 'SERVICES', 'TRUST', 'ABOUT', 'PROCESS', 'FAQ', 'CONTACT'],
    ctaLabel: 'Schedule Tax & Audit Consultation',
    ctaAction: 'consultation',
    heroBadgeDefault: 'ICAI Compliant · Peer-Reviewed Practice',
    keywords: ['GST litigation', 'corporate tax', 'audit assurance', 'transfer pricing', 'ITR filing'],
    sampleServices: [
      {
        title: 'Statutory & Tax Audit',
        description: 'Rigorous compliance and independent assurance aligned with ICAI auditing standards.',
      },
      {
        title: 'GST Advisory & Litigation',
        description: 'Comprehensive GST filing, assessment representation, and input tax credit optimization.',
      },
      {
        title: 'Corporate Tax & Transfer Pricing',
        description: 'Strategic tax structuring, international tax agreements, and benchmarking documentation.',
      },
      {
        title: 'Virtual CFO Services',
        description: 'Executive financial oversight, budget forecasting, and cash flow governance for growth firms.',
      },
    ],
    sampleFaq: [
      {
        question: 'How do you handle confidential financial records?',
        answer: 'All financial data is processed under strict non-disclosure compliance and encrypted document vaults.',
      },
      {
        question: 'What is your process for quarterly advance tax estimation?',
        answer: 'We reconcile revenue and expense projections quarterly to compute exact advance tax obligations and eliminate interest penalties.',
      },
    ],
  },
  Dentist: {
    id: 'Dentist',
    name: 'Dentist / Dental Clinic',
    category: 'Healthcare & Dental Surgery',
    defaultDesignSystem: 'healthcare-clean',
    recommendedSectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'PROCESS', 'FAQ', 'CONTACT'],
    ctaLabel: 'Book Dental Appointment',
    ctaAction: 'appointment',
    heroBadgeDefault: 'Sterilized Clinical Care · Modern Dentistry',
    keywords: ['root canal', 'teeth whitening', 'dental implants', 'orthodontics', 'smile makeover'],
    sampleServices: [
      {
        title: 'Preventive Care & Dental Hygiene',
        description: 'Comprehensive oral examinations, ultrasonic teeth scaling, and digital cavity diagnostics.',
      },
      {
        title: 'Cosmetic Dentistry & Smile Makeover',
        description: 'Porcelain veneers, professional laser teeth whitening, and aesthetic smile harmonization.',
      },
      {
        title: 'Advanced Dental Implants',
        description: 'Permanent titanium implant fixtures with natural crown prosthetics and 3D bone mapping.',
      },
      {
        title: 'Root Canal & Restorative Endodontics',
        description: 'Painless rotary root canal therapy with biocompatible crowns to preserve natural teeth.',
      },
    ],
    sampleFaq: [
      {
        question: 'Is teeth whitening safe for enamel?',
        answer: 'Yes, our clinic uses clinically approved LED and laser systems that protect enamel while removing deep stains.',
      },
      {
        question: 'Do you offer emergency dental appointments?',
        answer: 'Yes, we reserve priority emergency slots daily for acute toothache, trauma, or fractured restorations.',
      },
    ],
  },
  Lawyer: {
    id: 'Lawyer',
    name: 'Lawyer / Legal Chambers',
    category: 'Legal Services & Dispute Resolution',
    defaultDesignSystem: 'minimal-professional',
    recommendedSectionOrder: ['HERO', 'SERVICES', 'TRUST', 'ABOUT', 'PROCESS', 'FAQ', 'CONTACT'],
    ctaLabel: 'Request Confidential Consultation',
    ctaAction: 'consultation',
    heroBadgeDefault: 'Bar Council Aligned · Confidential Representation',
    keywords: ['corporate litigation', 'arbitration', 'intellectual property', 'contract law', 'dispute resolution'],
    sampleServices: [
      {
        title: 'Commercial & Civil Litigation',
        description: 'Strategic court representation before High Courts, Commercial Courts, and appellate tribunals.',
      },
      {
        title: 'Corporate Contracts & Compliance',
        description: 'Bespoke master service agreements, shareholder covenants, and corporate governance audit.',
      },
      {
        title: 'Intellectual Property Protection',
        description: 'Trademark registrations, patent defense, copyright enforcement, and trade secret litigation.',
      },
      {
        title: 'Alternative Dispute Resolution',
        description: 'Institutional and ad-hoc commercial arbitration proceedings and mediation representation.',
      },
    ],
    sampleFaq: [
      {
        question: 'Are initial legal inquiries kept privileged and confidential?',
        answer: 'All prospective client communications are governed by strict advocate-client confidentiality rules.',
      },
      {
        question: 'What is your typical fee arrangement for corporate matters?',
        answer: 'We provide structured transparent retainers or scoped milestone-based fee structures with zero hidden surprises.',
      },
    ],
  },
  Architect: {
    id: 'Architect',
    name: 'Architect & Interior Design Studio',
    category: 'Architecture & Spatial Design',
    defaultDesignSystem: 'creative-portfolio',
    recommendedSectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'PROCESS', 'FAQ', 'CONTACT'],
    ctaLabel: 'Schedule Project Enquiry',
    ctaAction: 'enquiry',
    heroBadgeDefault: 'Sustainable Architecture · Contemporary Spatial Design',
    keywords: ['residential design', 'commercial architecture', 'interior detailing', 'sustainable urbanism'],
    sampleServices: [
      {
        title: 'Architectural Master Planning',
        description: 'Concept drafting, regulatory sanction coordination, and sustainable structural spatial planning.',
      },
      {
        title: 'Bespoke Residential Architecture',
        description: 'Custom contemporary villas, luxury farmhouses, and daylight-optimized private residences.',
      },
      {
        title: 'Commercial & Hospitality Design',
        description: 'High-performance work campuses, boutique hotels, and experiential retail environments.',
      },
      {
        title: 'Interior Architecture & Material Curation',
        description: 'Custom millwork, artisanal lighting plans, acoustic treatments, and material palette design.',
      },
    ],
    sampleFaq: [
      {
        question: 'How do you handle municipal authority approvals?',
        answer: 'Our studio coordinates end-to-end liaison with local development authorities for building plan sanctions.',
      },
      {
        question: 'Can you work with our existing general contractor?',
        answer: 'Yes, we provide comprehensive architectural supervision and site coordination with approved contractors.',
      },
    ],
  },
  Gym: {
    id: 'Gym',
    name: 'Fitness Center & Athletic Club',
    category: 'Fitness & Athletic Conditioning',
    defaultDesignSystem: 'bold-fitness',
    recommendedSectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'PROCESS', 'FAQ', 'CONTACT'],
    ctaLabel: 'Claim Complimentary Trial Session',
    ctaAction: 'trial',
    heroBadgeDefault: 'Certified Strength Coaches · Premium Athletic Equipment',
    keywords: ['strength conditioning', 'HIIT training', 'personal coaching', 'nutrition planning', 'body transformation'],
    sampleServices: [
      {
        title: 'Strength & Hypertrophy Training',
        description: 'Olympic lifting platforms, calibrated plates, and periodized barbell training programs.',
      },
      {
        title: 'Functional High-Intensity Conditioning',
        description: 'Heart-rate tracked metabolic conditioning, turf sprints, and functional kettlebell intervals.',
      },
      {
        title: 'One-on-One Performance Coaching',
        description: 'Dedicated certified strength coach, body composition tracking, and personalized exercise mechanics.',
      },
      {
        title: 'Sports Nutrition & Body Recomposition',
        description: 'Macronutrient calculation, bio-individual meal planning, and metabolic recovery protocols.',
      },
    ],
    sampleFaq: [
      {
        question: 'Is prior gym experience required before joining?',
        answer: 'Not at all. Every new athlete undergoes a full movement screen and introductory coaching induction.',
      },
      {
        question: 'Are trial sessions free for prospective members?',
        answer: 'Yes, we welcome local residents to experience a full coached trial workout before choosing a membership.',
      },
    ],
  },
  Custom: {
    id: 'Custom',
    name: 'Professional Business Firm',
    category: 'Business & Professional Services',
    defaultDesignSystem: 'modern-corporate',
    recommendedSectionOrder: ['HERO', 'SERVICES', 'TRUST', 'ABOUT', 'PROCESS', 'FAQ', 'CONTACT'],
    ctaLabel: 'Book Consultation',
    ctaAction: 'contact',
    heroBadgeDefault: 'Verified Professional Practice',
    keywords: ['professional service', 'client consultation', 'specialized advisory'],
    sampleServices: [
      {
        title: 'Specialized Consulting',
        description: 'Tailored solutions addressing core operational, strategic, and advisory requirements.',
      },
      {
        title: 'Client Advisory & Governance',
        description: 'Dedicated client management, milestone reviews, and disciplined execution frameworks.',
      },
    ],
    sampleFaq: [
      {
        question: 'How do we initiate an advisory engagement?',
        answer: 'We begin with an introductory discovery consultation to evaluate scope and deliverables.',
      },
    ],
  },
};

/**
 * Resolves the appropriate profession configuration from any profession string (case-insensitive fuzzy match)
 */
export function resolveProfessionConfig(professionInput?: string | null): ProfessionConfig {
  if (!professionInput) return PROFESSION_CONFIGS.CA;

  const clean = professionInput.toLowerCase().trim();

  if (clean.includes('ca') || clean.includes('accountant') || clean.includes('audit') || clean.includes('tax')) {
    return PROFESSION_CONFIGS.CA;
  }
  if (clean.includes('dent') || clean.includes('oral') || clean.includes('clinic')) {
    return PROFESSION_CONFIGS.Dentist;
  }
  if (clean.includes('law') || clean.includes('advocate') || clean.includes('legal') || clean.includes('attorney')) {
    return PROFESSION_CONFIGS.Lawyer;
  }
  if (clean.includes('arch') || clean === 'architect') {
    return PROFESSION_CONFIGS.Architect;
  }
  if (clean.includes('gym') || clean.includes('fit') || clean.includes('train') || clean.includes('crossfit')) {
    return PROFESSION_CONFIGS.Gym;
  }

  // Create customized configuration dynamically for unrecognized custom professions
  const base = PROFESSION_CONFIGS.Custom;
  return {
    ...base,
    name: professionInput,
    heroBadgeDefault: `Verified Professional Practice · ${professionInput}`,
    sampleServices: [
      {
        title: `${professionInput} Advisory & Consultation`,
        description: `Professional, certified services customized for prospective clients and businesses.`,
      },
      {
        title: `Strategic Execution & Quality Assurance`,
        description: `Dedicated client service, disciplined methodology, and reliable turnaround.`,
      },
    ],
  };
}
