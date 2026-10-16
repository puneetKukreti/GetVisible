/**
 * Profession Engine & Extensible Configuration System
 *
 * Implements a clean separation between:
 * 1. Business profession & AI profile
 * 2. Visual design & styling
 * 3. Reusable section architecture
 */

import { z } from 'zod';
import { WebsiteLayout, WebsiteSectionType, WebsiteTheme } from '@/types';
import { THEMES } from './themes';

export const ProfessionProfileSchema = z.object({
  mainProfession: z.string().min(2).max(80),
  subcategory: z.string().min(2).max(80),
  targetCustomers: z.array(z.string()).min(1).max(6),
  industryTerminology: z.array(z.string()).max(10),
  commonCustomerProblems: z.array(z.string()).min(1).max(6),
  relevantServices: z.array(z.string()).min(2).max(8),
  requiredSections: z.array(z.string()).min(4).max(12),
  primaryCallToAction: z.string().min(2).max(40),
  secondaryCallToAction: z.string().min(2).max(40).optional(),
  visualDirection: z.object({
    style: z.enum(['corporate', 'modern', 'minimal', 'vibrant', 'luxury']),
    dominantTone: z.string(),
    recommendedThemeId: z.string(),
    suggestedLayout: z.string(),
  }),
  recommendedImagery: z.object({
    heroQuery: z.string(),
    aboutQuery: z.string(),
    serviceQueries: z.array(z.string()).max(6),
    galleryQueries: z.array(z.string()).max(6).optional(),
  }),
  trustElements: z.array(z.string()).min(2).max(6),
  seo: z.object({
    titlePattern: z.string(),
    metaDescriptionPattern: z.string(),
    localKeywords: z.array(z.string()).max(10),
  }),
  complianceNotice: z.string().optional(),
});

export type ProfessionProfile = z.infer<typeof ProfessionProfileSchema>;

export interface ProfessionConfig {
  id: string;
  name: string;
  aliases: string[];
  category: 'PROFESSIONAL' | 'HEALTHCARE' | 'LIFESTYLE' | 'HOME_SERVICES' | 'FOOD_BEVERAGE' | 'TECH_CREATIVE' | 'EDUCATION' | 'AUTOMOTIVE' | 'REAL_ESTATE';
  defaultLayout: WebsiteLayout;
  defaultTheme: WebsiteTheme;
  sectionOrder: WebsiteSectionType[];
  primaryCta: string;
  secondaryCta: string;
  imageKeywords: {
    hero: string;
    about: string;
    services: string[];
    gallery?: string[];
  };
  trustBadges: string[];
  complianceNotes?: string;
}

/**
 * Extensible configuration registry of known professions.
 * Any unfamiliar profession gracefully derives from a versatile SMB base configuration.
 */
export const PROFESSION_REGISTRY: Record<string, ProfessionConfig> = {
  // 1. Chartered Accountants & Finance
  CHARTERED_ACCOUNTANT: {
    id: 'CHARTERED_ACCOUNTANT',
    name: 'Chartered Accountant & Tax Consultant',
    aliases: ['ca', 'ca firm', 'chartered accountant', 'tax consultant', 'auditor', 'accounting firm'],
    category: 'PROFESSIONAL',
    defaultLayout: 'EDITORIAL_FINANCE',
    defaultTheme: THEMES.executiveNavy,
    sectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'WHY_CHOOSE_US', 'EXPERTISE', 'PROCESS', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    primaryCta: 'Schedule Consultation',
    secondaryCta: 'Explore Services',
    imageKeywords: {
      hero: 'corporate finance office modern glass skyscraper',
      about: 'senior financial advisor audit team meeting',
      services: ['tax consultation desk', 'audit financial documents', 'gst corporate advisory', 'corporate transfer pricing'],
    },
    trustBadges: ['ICAI Ethical Compliance', 'Senior Partner Supervision', 'Confidential Data Governance', 'Direct Tax Precision'],
    complianceNotes: 'Strict informational pull model adhering to ICAI professional ethics code. Superlatives and fee discounts prohibited.',
  },

  // 2. Doctor & Medical Clinic
  DOCTOR_CLINIC: {
    id: 'DOCTOR_CLINIC',
    name: 'Doctor, Dentist & Multispeciality Clinic',
    aliases: ['doctor', 'dentist', 'clinic', 'dental clinic', 'physiotherapist', 'pediatrician', 'dermatologist', 'healthcare'],
    category: 'HEALTHCARE',
    defaultLayout: 'CLINIC_HEALTHCARE',
    defaultTheme: THEMES.techTeal,
    sectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'WHY_CHOOSE_US', 'PROCESS', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    primaryCta: 'Book Appointment',
    secondaryCta: 'View Specialties',
    imageKeywords: {
      hero: 'modern medical clinic doctor consultation interior',
      about: 'friendly certified doctor stethoscope patient consultation',
      services: ['painless dental care', 'advanced medical diagnostics', 'preventive health checkup', 'specialist therapy session'],
      gallery: ['clean sterilized clinic operatory', 'state of art diagnostic equipment', 'welcoming patient reception'],
    },
    trustBadges: ['Certified Medical Specialists', 'Class-B Autoclave Sterilization', 'Patient Confidentiality', 'Digital Radiography'],
    complianceNotes: 'Medical ethics compliance: Avoid unverifiable cure guarantees. Focus on patient comfort and factual credentials.',
  },

  // 3. Lawyer & Legal Firm
  LAWYER_LEGAL: {
    id: 'LAWYER_LEGAL',
    name: 'Lawyer, Advocate & Legal Consultant',
    aliases: ['lawyer', 'advocate', 'legal consultant', 'law firm', 'attorney', 'solicitor', 'legal practice'],
    category: 'PROFESSIONAL',
    defaultLayout: 'LUXURY_PROFESSIONAL',
    defaultTheme: THEMES.corporateSlate,
    sectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'WHY_CHOOSE_US', 'EXPERTISE', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    primaryCta: 'Request Legal Consultation',
    secondaryCta: 'Practice Areas',
    imageKeywords: {
      hero: 'classical legal law library leather books courtroom',
      about: 'advocate legal conference room consultation',
      services: ['corporate contract advisory', 'civil dispute litigation', 'intellectual property filing', 'property legal due diligence'],
    },
    trustBadges: ['Bar Council Ethics Aligned', 'Senior Advocate Advisory', 'Strict Client Confidentiality', 'Court Representation'],
    complianceNotes: 'Bar Council of India regulations: Informational presentation only without solicitations.',
  },

  // 4. Restaurant, Cafe & Bakery
  RESTAURANT_CAFE: {
    id: 'RESTAURANT_CAFE',
    name: 'Restaurant, Cafe & Bakery',
    aliases: ['restaurant', 'cafe', 'bakery', 'sweets', 'bistro', 'dining', 'pastry', 'cloud kitchen', 'diner'],
    category: 'FOOD_BEVERAGE',
    defaultLayout: 'MODERN_INDIAN',
    defaultTheme: THEMES.classicBurgundy,
    sectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'WHY_CHOOSE_US', 'INDUSTRIES', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    primaryCta: 'Reserve a Table / Order',
    secondaryCta: 'Explore Menu',
    imageKeywords: {
      hero: 'artisan culinary gourmet restaurant dish table spread',
      about: 'chef preparing fresh ingredients restaurant kitchen',
      services: ['chef signature dining', 'artisan bakery desserts', 'private party catering', 'fresh espresso beverage'],
      gallery: ['mouthwatering artisan cake', 'warm ambient cafe interior', 'rustic sourdough loaves', 'cozy outdoor dining patio'],
    },
    trustBadges: ['FSSAI Certified Kitchen', '100% Fresh Daily Ingredients', 'Hygienic Prep Standards', 'Prompt Service'],
  },

  // 5. Real Estate & Property
  REAL_ESTATE: {
    id: 'REAL_ESTATE',
    name: 'Real Estate Agent & Property Consultant',
    aliases: ['real estate', 'property consultant', 'realtor', 'property broker', 'builder', 'commercial leasing'],
    category: 'REAL_ESTATE',
    defaultLayout: 'MODERN_FINTECH',
    defaultTheme: THEMES.executiveNavy,
    sectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'WHY_CHOOSE_US', 'INDUSTRIES', 'PROCESS', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    primaryCta: 'Inquire About Properties',
    secondaryCta: 'Explore Listings',
    imageKeywords: {
      hero: 'luxury modern apartment high rise architecture balcony view',
      about: 'real estate consultant handing keys client handshake',
      services: ['luxury residential sales', 'commercial office leasing', 'property legal documentation', 'investment portfolio advisory'],
      gallery: ['spacious living room interior', 'prime commercial glass building', 'serene landscaped residential gated community'],
    },
    trustBadges: ['RERA Registered Advisor', 'Verified Property Titles', 'Transparent Transaction Guidance', 'End-to-End Paperwork Support'],
  },

  // 6. Gym & Fitness
  GYM_FITNESS: {
    id: 'GYM_FITNESS',
    name: 'Gym, Fitness Center & Personal Trainer',
    aliases: ['gym', 'fitness', 'crossfit', 'personal trainer', 'yoga studio', 'pilates', 'strength training'],
    category: 'LIFESTYLE',
    defaultLayout: 'MODERN_FINTECH',
    defaultTheme: THEMES.corporateSlate,
    sectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'WHY_CHOOSE_US', 'PROCESS', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    primaryCta: 'Claim Free 1-Day Pass',
    secondaryCta: 'View Training Zones',
    imageKeywords: {
      hero: 'modern high end gym strength equipment dumbbells barbells',
      about: 'certified fitness trainer guiding client workout motivation',
      services: ['hypertrophy strength training', '1 on 1 personal coaching', 'cardio hiit endurance floor', 'customized nutrition meal plans'],
      gallery: ['heavy duty power racks', 'spacious turf conditioning zone', 'clean sanitized gym locker room'],
    },
    trustBadges: ['Certified Strength Coaches', 'Imported Biomechanical Equipment', 'Hygienic Sanitized Floor', 'Personalized Goal Tracking'],
  },

  // 7. Digital Marketing & Web Agency
  DIGITAL_AGENCY: {
    id: 'DIGITAL_AGENCY',
    name: 'Digital Marketing & Web Development Agency',
    aliases: ['digital marketing', 'seo agency', 'web developer', 'social media agency', 'branding agency', 'software agency'],
    category: 'TECH_CREATIVE',
    defaultLayout: 'MODERN_FINTECH',
    defaultTheme: THEMES.techTeal,
    sectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'WHY_CHOOSE_US', 'PROCESS', 'INDUSTRIES', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    primaryCta: 'Get Free Digital Audit',
    secondaryCta: 'View Our Services',
    imageKeywords: {
      hero: 'creative tech agency team working laptop screens modern office',
      about: 'growth marketing team strategizing whiteboard brainstorm',
      services: ['google search seo optimization', 'performance meta ads management', 'custom web app development', 'brand identity design'],
      gallery: ['modern sleek responsive website dashboard', 'high engagement social media campaign creative', 'analytics growth chart display'],
    },
    trustBadges: ['ROI-Driven Campaigns', 'Transparent Bi-Weekly Reporting', 'Dedicated Account Manager', 'No Lock-in Contracts'],
  },

  // 8. Interior Design & Architecture
  INTERIOR_DESIGN: {
    id: 'INTERIOR_DESIGN',
    name: 'Interior Designer & Architect',
    aliases: ['interior designer', 'architect', 'modular kitchen', 'home decor', 'turnkey contractor', 'interior stylist'],
    category: 'HOME_SERVICES',
    defaultLayout: 'INTERIOR_ARCHITECTURE',
    defaultTheme: THEMES.corporateSlate,
    sectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'WHY_CHOOSE_US', 'PROCESS', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    primaryCta: 'Book 3D Design Consultation',
    secondaryCta: 'View Portfolio',
    imageKeywords: {
      hero: 'luxury interior design living room warm lighting contemporary styling',
      about: 'architect sketching 3d blueprints material swatches desk',
      services: ['luxury modular kitchen', 'turnkey residential interiors', 'architectural planning drawings', 'custom wardrobe cabinetry'],
      gallery: ['minimalist fluted glass kitchen', 'spacious master bedroom lighting', 'modern marble bathroom suite'],
    },
    trustBadges: ['Council of Architecture Aligned', '10-Year Hardware Warranty', '45-Day Delivery Guarantee', 'Photorealistic 3D Renders'],
  },

  // 9. Salon, Spa & Beauty
  SALON_SPA: {
    id: 'SALON_SPA',
    name: 'Salon, Spa & Beauty Care',
    aliases: ['salon', 'spa', 'beauty parlor', 'hair stylist', 'makeup artist', 'barber', 'aesthetician'],
    category: 'LIFESTYLE',
    defaultLayout: 'LUXURY_PROFESSIONAL',
    defaultTheme: THEMES.classicBurgundy,
    sectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'WHY_CHOOSE_US', 'PROCESS', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    primaryCta: 'Book Salon Appointment',
    secondaryCta: 'Explore Services',
    imageKeywords: {
      hero: 'luxury beauty salon styling mirror lights interior',
      about: 'professional hair stylist cutting client hair pampering',
      services: ['couture hair styling balayage', 'hydrafacial glow treatments', 'bridal occasion makeup', 'aromatherapy spa massage'],
      gallery: ['glossy radiant hair transformation', 'relaxing spa pedicure station', 'elegant bridal styling look'],
    },
    trustBadges: ['Certified Hair & Beauty Artists', 'International Ammonia-Free Products', 'Single-Use Disposable Kits', 'Zero Waiting Time Slots'],
  },

  // 10. Solar & Clean Energy
  SOLAR_ENERGY: {
    id: 'SOLAR_ENERGY',
    name: 'Solar Panel & Clean Energy Contractor',
    aliases: ['solar', 'solar panel', 'rooftop solar', 'renewable energy', 'solar installer', 'solar epc'],
    category: 'HOME_SERVICES',
    defaultLayout: 'MODERN_FINTECH',
    defaultTheme: THEMES.emeraldPrestige,
    sectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'WHY_CHOOSE_US', 'PROCESS', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    primaryCta: 'Calculate Solar Savings',
    secondaryCta: 'System Packages',
    imageKeywords: {
      hero: 'rooftop solar panels sunny sky residential commercial clean energy',
      about: 'solar engineer wearing hardhat inspecting panel installation',
      services: ['residential rooftop solar', 'commercial society power plants', 'discom net metering liaison', 'hybrid battery storage systems'],
    },
    trustBadges: ['MNRE Channel Partner', '25-Year Performance Warranty', 'Government Subsidy Support', 'Tier-1 Mono PERC Panels'],
  },

  // 11. Pest Control Services
  PEST_CONTROL: {
    id: 'PEST_CONTROL',
    name: 'Pest Control & Disinfection Services',
    aliases: ['pest control', 'termite control', 'fumigation', 'cockroach control', 'bedbug treatment'],
    category: 'HOME_SERVICES',
    defaultLayout: 'MODERN_FINTECH',
    defaultTheme: THEMES.techTeal,
    sectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'WHY_CHOOSE_US', 'PROCESS', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    primaryCta: 'Get Instant Free Quote',
    secondaryCta: 'Our Treatments',
    imageKeywords: {
      hero: 'clean modern home interior pest free safe living room',
      about: 'licensed pest technician inspecting corner with flashlight',
      services: ['drill fill seal termite barrier', 'herbal odorless cockroach gel', 'intensive bedbug eradication', 'commercial warehouse proofing'],
    },
    trustBadges: ['Government CIB Licensed', '100% Odorless & Safe for Kids/Pets', 'Written Service Warranty', 'Same-Day Rapid Dispatch'],
  },

  // 12. Automobile Workshop & Detailing
  AUTOMOBILE_WORKSHOP: {
    id: 'AUTOMOBILE_WORKSHOP',
    name: 'Automobile Repair & Ceramic Detailing Studio',
    aliases: ['car detailing', 'car repair', 'automobile workshop', 'auto garage', 'car wash', 'mechanic'],
    category: 'AUTOMOTIVE',
    defaultLayout: 'MODERN_FINTECH',
    defaultTheme: THEMES.corporateSlate,
    sectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'WHY_CHOOSE_US', 'PROCESS', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    primaryCta: 'Book Service Slot',
    secondaryCta: 'View Detailing Packages',
    imageKeywords: {
      hero: 'luxury car gleaming glossy ceramic coating studio workshop',
      about: 'skilled auto mechanic diagnosing car engine computer scanner',
      services: ['9h ceramic coating paint protection', 'comprehensive periodic car service', 'ac repair cooling diagnostics', 'wheel alignment balancing'],
    },
    trustBadges: ['OEM Diagnostic Scanners', '100% Genuine Spare Parts', 'Dust-Free Detailing Bay', 'Transparent Itemized Invoices'],
  },

  // 13. Photographer, Videographer & Creative Studio
  PHOTOGRAPHER: {
    id: 'PHOTOGRAPHER',
    name: 'Photographer, Videographer & Creative Studio',
    aliases: ['photographer', 'photography', 'photo studio', 'videographer', 'cinematographer', 'portrait studio', 'wedding photographer', 'photojournalist', 'pre-wedding shoot'],
    category: 'TECH_CREATIVE',
    defaultLayout: 'LUXURY_PROFESSIONAL',
    defaultTheme: THEMES.corporateSlate,
    sectionOrder: ['HERO', 'SERVICES', 'GALLERY', 'EXPERTISE', 'ABOUT', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CONTACT', 'LOCATION'],
    primaryCta: 'Check Dates & Book a Shoot',
    secondaryCta: 'View Portfolio',
    imageKeywords: {
      hero: 'wedding photographer candid camera natural light editorial',
      about: 'photographer editing portraits studio behind the scenes',
      services: ['wedding photography coverage', 'pre-wedding couple shoot', 'studio portrait session', 'commercial product photography'],
      gallery: ['candid wedding moment', 'editorial studio portrait', 'pre-wedding couple session', 'commercial brand shoot'],
    },
    trustBadges: ['Portfolio-Led Storytelling', 'Professional-Grade Equipment', 'Fast Edited Deliverables', 'Flexible Shoot Packages'],
  },
};

/**
 * Intelligent classifier that resolves any raw business text or lead data
 * into the best matched profession configuration, with an open fallback for uncommon trades.
 */
export function classifyProfession(input: string | {
  profession?: string;
  businessName?: string;
  notes?: string;
}): ProfessionConfig {
  const text = typeof input === 'string'
    ? input.toLowerCase().trim()
    : `${input.profession || ''} ${input.businessName || ''} ${input.notes || ''}`.toLowerCase().trim();

  // 1. Direct Alias Matching (short acronyms like "ca" require word-boundary matching)
  for (const config of Object.values(PROFESSION_REGISTRY)) {
    if (
      config.aliases.some((alias) =>
        alias.length <= 3
          ? new RegExp(`\\b${alias}\\b`, 'i').test(text)
          : text.includes(alias)
      )
    ) {
      return config;
    }
  }

  // 2. Category Keyword Inference
  if (/teeth|tooth|dental|implant|ortho|skin|physio|clinic|medical|patient|doctor|surgeon/i.test(text)) {
    return PROFESSION_REGISTRY.DOCTOR_CLINIC;
  }
  if (/law|legal|court|advocate|solicitor|barrister|justice/i.test(text)) {
    return PROFESSION_REGISTRY.LAWYER_LEGAL;
  }
  if (/food|dine|bistro|bake|cake|sweet|mithai|pastry|snack|cook|kitchen/i.test(text)) {
    return PROFESSION_REGISTRY.RESTAURANT_CAFE;
  }
  if (/property|estate|realty|housing|apartment|flat|plot|broker|land/i.test(text)) {
    return PROFESSION_REGISTRY.REAL_ESTATE;
  }
  if (/gym|workout|lift|muscle|body|coach|trainer|fitness|crossfit/i.test(text)) {
    return PROFESSION_REGISTRY.GYM_FITNESS;
  }
  if (/digital|seo|marketing|social|website|software|tech|developer|agency/i.test(text)) {
    return PROFESSION_REGISTRY.DIGITAL_AGENCY;
  }
  if (/interior|decor|furniture|cabinet|wardrobe|architect|facade/i.test(text)) {
    return PROFESSION_REGISTRY.INTERIOR_DESIGN;
  }
  if (/salon|parlor|beauty|hair|makeup|spa|massage|glow/i.test(text)) {
    return PROFESSION_REGISTRY.SALON_SPA;
  }
  if (/solar|power|battery|panel|rooftop|energy/i.test(text)) {
    return PROFESSION_REGISTRY.SOLAR_ENERGY;
  }
  if (/pest|termite|bug|cockroach|rodent|fumigat/i.test(text)) {
    return PROFESSION_REGISTRY.PEST_CONTROL;
  }
  if (/car|auto|garage|mechanic|detailing|vehicle|motor/i.test(text)) {
    return PROFESSION_REGISTRY.AUTOMOBILE_WORKSHOP;
  }
  if (/photo|portrait|wedding film|videograph|cinematograph|camera|visual storytell|photojournal/i.test(text)) {
    return PROFESSION_REGISTRY.PHOTOGRAPHER;
  }
  if (/audit|tax|gst|itr|cfo|account|ca firm|balance sheet|ledger/i.test(text)) {
    return PROFESSION_REGISTRY.CHARTERED_ACCOUNTANT;
  }

  // 3. Dynamic Base Configuration for unlisted & uncommon professions
  const rawProf = typeof input === 'string' ? input : input.profession;
  const cleanTitle = (rawProf?.trim() || 'Professional Practice')
    .replace(/[^\w\s&]/g, '')
    .trim();

  return {
    id: `CUSTOM_${cleanTitle.toUpperCase().replace(/\s+/g, '_')}`,
    name: cleanTitle,
    aliases: [cleanTitle.toLowerCase()],
    category: 'PROFESSIONAL',
    defaultLayout: 'MODERN_FINTECH',
    defaultTheme: THEMES.executiveNavy,
    sectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'WHY_CHOOSE_US', 'PROCESS', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    primaryCta: 'Schedule Consultation',
    secondaryCta: 'Explore Services',
    imageKeywords: {
      hero: `${cleanTitle.toLowerCase()} modern professional service workplace`,
      about: `${cleanTitle.toLowerCase()} team consultation customer interaction`,
      services: [
        `${cleanTitle.toLowerCase()} core service execution`,
        `${cleanTitle.toLowerCase()} specialized client consultation`,
        `${cleanTitle.toLowerCase()} precision quality delivery`,
        `${cleanTitle.toLowerCase()} customer support management`,
      ],
    },
    trustBadges: ['Verified Field Expertise', 'Transparent Scope & Pricing', 'Dedicated Client Attention', 'Quality Craftsmanship Guarantee'],
  };
}
