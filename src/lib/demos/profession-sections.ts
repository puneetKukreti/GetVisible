/**
 * Profession-Aware Section Planning & Content Isolation
 *
 * This module is the single source of truth for:
 *   1. Which website sections are appropriate for a given profession/category.
 *   2. The order in which those sections should render.
 *   3. Profession-aware section titles and "who we serve" segments.
 *   4. Targeted image briefs used to source profession-appropriate imagery.
 *   5. A guard that guarantees CA-specific content can never leak into a
 *      non-CA profession's website.
 *
 * The React renderer already knows how to render every section type declared
 * here (HERO, SERVICES, GALLERY, MENU, EXPERTISE, PROCESS, ...). This module
 * only decides WHICH sections are relevant and in WHAT order, so that the
 * same reusable components produce a photography site, a restaurant site, a
 * clinic site, etc. — instead of a single generic template with new text.
 */

import { WebsiteContent, WebsiteSectionType } from '@/types';
import { ProfessionCategory, detectProfessionCategory } from './profession-config';
import { classifyProfession } from './profession-engine';

/**
 * Profession-appropriate section composition per category.
 * GALLERY/MENU/EXPERTISE are only included where they make real sense.
 */
export const CATEGORY_SECTION_ORDER: Record<ProfessionCategory, WebsiteSectionType[]> = {
  CA_FINANCE: ['HERO', 'TRUST', 'SERVICES', 'ABOUT', 'EXPERTISE', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
  PHOTOGRAPHY_CREATIVE: ['HERO', 'SERVICES', 'GALLERY', 'EXPERTISE', 'ABOUT', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
  RESTAURANT_HOSPITALITY: ['HERO', 'SERVICES', 'MENU', 'GALLERY', 'ABOUT', 'WHY_CHOOSE_US', 'PROCESS', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
  HEALTHCARE_MEDICAL: ['HERO', 'TRUST', 'SERVICES', 'ABOUT', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
  REAL_ESTATE_PROPERTY: ['HERO', 'SERVICES', 'MENU', 'GALLERY', 'EXPERTISE', 'ABOUT', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
  FITNESS_GYM: ['HERO', 'SERVICES', 'MENU', 'GALLERY', 'EXPERTISE', 'ABOUT', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
  INTERIOR_ARCHITECTURE: ['HERO', 'SERVICES', 'MENU', 'GALLERY', 'EXPERTISE', 'ABOUT', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
  BEAUTY_SALON: ['HERO', 'SERVICES', 'MENU', 'GALLERY', 'ABOUT', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
  LEGAL_LAW: ['HERO', 'TRUST', 'SERVICES', 'ABOUT', 'EXPERTISE', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
  EDUCATION_COACHING: ['HERO', 'SERVICES', 'ABOUT', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
  GENERAL_SMB: ['HERO', 'SERVICES', 'ABOUT', 'PROCESS', 'WHY_CHOOSE_US', 'GALLERY', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
};

interface CategoryContentProfile {
  galleryTitle: string;
  gallerySubtitle: string;
  menuTitle: string;
  menuSubtitle: string;
  expertiseTitle: string;
  expertiseSubtitle: string;
  ctaBannerTitle: string;
  ctaBannerSubtitle: string;
  industriesTitle: string;
  industries: string[];
  /** Short image briefs, one per gallery slot. */
  galleryBriefs: string[];
}

const CATEGORY_CONTENT: Record<ProfessionCategory, CategoryContentProfile> = {
  PHOTOGRAPHY_CREATIVE: {
    galleryTitle: 'Portfolio & Recent Work',
    gallerySubtitle: 'A curated selection of stories, moments, and frames we love to shoot.',
    menuTitle: 'Shoot Packages & Pricing',
    menuSubtitle: 'Flexible packages tailored to your occasion, location, and deliverables.',
    expertiseTitle: 'Our Photography Style',
    expertiseSubtitle: 'How we approach light, composition, and storytelling for every shoot.',
    ctaBannerTitle: 'Planning a shoot? Let us tell your story.',
    ctaBannerSubtitle: 'Share your date, location, and vision — we will help you plan the perfect coverage.',
    industriesTitle: 'Occasions & Sessions We Cover',
    industries: ['Weddings & Receptions', 'Pre-Wedding & Engagement', 'Portraits & Family', 'Events & Celebrations', 'Commercial & Brand Shoots', 'Maternity & Newborn'],
    galleryBriefs: ['Candid wedding & bridal moments', 'Editorial studio portraits', 'Pre-wedding couple sessions', 'Commercial & brand storytelling', 'Live event coverage', 'Lifestyle & candid frames'],
  },
  RESTAURANT_HOSPITALITY: {
    galleryTitle: 'Gallery & Ambience',
    gallerySubtitle: 'Fresh plates, warm interiors, and the little details that make a visit memorable.',
    menuTitle: 'Menu Highlights',
    menuSubtitle: 'A taste of what we serve — available for dine-in, takeaway, and delivery where offered.',
    expertiseTitle: 'Cuisine & Kitchen Craft',
    expertiseSubtitle: 'The ingredients, techniques, and specialties behind every dish.',
    ctaBannerTitle: 'Hungry for something special?',
    ctaBannerSubtitle: 'Reserve a table or place an order — we would love to host you.',
    industriesTitle: 'Dining & Service Options',
    industries: ['Dine-In', 'Takeaway', 'Home Delivery', 'Private Celebrations', 'Group & Corporate Bookings', 'Catering Enquiries'],
    galleryBriefs: ['Signature dishes', 'Warm dining ambience', 'Fresh kitchen preparation', 'Desserts & beverages'],
  },
  REAL_ESTATE_PROPERTY: {
    galleryTitle: 'Featured Properties & Spaces',
    gallerySubtitle: 'A look at the homes, offices, and investment spaces we help clients secure.',
    menuTitle: 'Featured Listings',
    menuSubtitle: 'Illustrative property categories we work with — pricing and availability on enquiry.',
    expertiseTitle: 'Segments We Specialise In',
    expertiseSubtitle: 'Localised guidance across the property categories that matter most to you.',
    ctaBannerTitle: 'Looking to buy, sell, or rent?',
    ctaBannerSubtitle: 'Book a site visit or a no-obligation property consultation today.',
    industriesTitle: 'Property Services',
    industries: ['Residential Sales & Purchase', 'Rentals & Leasing', 'Commercial & Office Spaces', 'Plots & Land', 'Investment Advisory', 'NRI Property Support'],
    galleryBriefs: ['Luxury residential homes', 'Modern apartment interiors', 'Prime commercial spaces', 'Investment corridors'],
  },
  FITNESS_GYM: {
    galleryTitle: 'Facilities & Training',
    gallerySubtitle: 'A look inside our training floor, equipment zones, and coaching sessions.',
    menuTitle: 'Membership Plans',
    menuSubtitle: 'Illustrative membership options — talk to us for current pricing and offers.',
    expertiseTitle: 'Training Programs & Zones',
    expertiseSubtitle: 'Structured disciplines engineered to help you reach your goals safely.',
    ctaBannerTitle: 'Ready to start training?',
    ctaBannerSubtitle: 'Claim a trial session and meet the coaches who will keep you accountable.',
    industriesTitle: 'Who We Train',
    industries: ['Fitness Beginners', 'Strength & Muscle Building', 'Weight Loss & Toning', 'Athletes & Sports Conditioning', 'Corporate Wellness', 'Personal Training'],
    galleryBriefs: ['Strength training floor', 'Group training sessions', 'Cardio & conditioning zone', 'Coaching and progress'],
  },
  INTERIOR_ARCHITECTURE: {
    galleryTitle: 'Portfolio of Spaces',
    gallerySubtitle: 'Homes, kitchens, and workspaces we have designed and delivered.',
    menuTitle: 'Design Packages',
    menuSubtitle: 'Illustrative service packages — final scope and pricing confirmed after a site visit.',
    expertiseTitle: 'Design Specialisations',
    expertiseSubtitle: 'The spaces, styles, and services we craft with care.',
    ctaBannerTitle: 'Planning a space? Let us design it.',
    ctaBannerSubtitle: 'Book a consultation to discuss your space, style, and budget.',
    industriesTitle: 'Spaces We Design',
    industries: ['Modular Kitchens', 'Wardrobes & Storage', 'Living & Bedrooms', 'Office & Retail Interiors', 'Turnkey Homes', 'Renovations'],
    galleryBriefs: ['Modular kitchen project', 'Living room design', 'Wardrobe & storage', 'Commercial interior'],
  },
  BEAUTY_SALON: {
    galleryTitle: 'Our Work & Studio',
    gallerySubtitle: 'Looks we have created and the calm studio where it all happens.',
    menuTitle: 'Services & Pricing',
    menuSubtitle: 'Illustrative service menu — call or message us for current pricing.',
    expertiseTitle: 'Beauty & Styling Expertise',
    expertiseSubtitle: 'The treatments, techniques, and specialists behind every look.',
    ctaBannerTitle: 'Feel your best — book a session.',
    ctaBannerSubtitle: 'Reserve your slot for a fresh cut, colour, glow treatment, or bridal look.',
    industriesTitle: 'Services We Offer',
    industries: ['Haircuts & Styling', 'Colour & Highlights', 'Skin & Facials', 'Bridal & Occasion', 'Spa & Wellness', 'Nails & Grooming'],
    galleryBriefs: ['Hair styling transformation', 'Bridal & occasion look', 'Skin & facial treatment', 'Salon studio interior'],
  },
  HEALTHCARE_MEDICAL: {
    galleryTitle: 'Clinic & Care',
    gallerySubtitle: 'A look at our facilities and the care environment we have built.',
    menuTitle: 'Treatments & Services',
    menuSubtitle: 'Illustrative treatment categories — ask us about suitability for your needs.',
    expertiseTitle: 'Areas of Care',
    expertiseSubtitle: 'The treatments and specialities our team focuses on.',
    ctaBannerTitle: 'Your health comes first.',
    ctaBannerSubtitle: 'Book an appointment and get clear, patient-first guidance.',
    industriesTitle: 'Care & Specialities',
    industries: ['Consultations', 'Preventive Care', 'Diagnostics', 'Specialist Treatment', 'Follow-Up Care', 'Family Health'],
    galleryBriefs: ['Modern clinic reception', 'Consultation room', 'Diagnostic equipment', 'Care environment'],
  },
  EDUCATION_COACHING: {
    galleryTitle: 'Campus & Classroom',
    gallerySubtitle: 'A look at where students learn, practise, and grow.',
    menuTitle: 'Courses & Batches',
    menuSubtitle: 'Illustrative courses and batch options — contact us for schedules and fees.',
    expertiseTitle: 'Our Teaching Approach',
    expertiseSubtitle: 'The methods and mentorship that help students progress.',
    ctaBannerTitle: 'Ready to enrol?',
    ctaBannerSubtitle: 'Book a free demo class or counselling session today.',
    industriesTitle: 'Programs We Offer',
    industries: ['Foundation Courses', 'Board & Competitive Prep', 'Skill & Aptitude', 'Test Series & Mocks', 'Doubt Clearing', 'Counselling'],
    galleryBriefs: ['Classroom session', 'Students studying', 'Library & study space', 'Campus environment'],
  },
  LEGAL_LAW: {
    galleryTitle: 'Chambers & Practice',
    gallerySubtitle: 'A look at our practice areas and the environments we work in.',
    menuTitle: 'Practice Areas',
    menuSubtitle: 'Illustrative areas of practice — outcomes depend on the facts of each matter.',
    expertiseTitle: 'Practice Focus',
    expertiseSubtitle: 'The legal domains our team concentrates on.',
    ctaBannerTitle: 'Need legal guidance?',
    ctaBannerSubtitle: 'Request an initial consultation; we will assess how best to help.',
    industriesTitle: 'Matters We Handle',
    industries: ['Civil Matters', 'Corporate & Contracts', 'Property & Documentation', 'Family Matters', 'Advisory & Opinions', 'Dispute Resolution'],
    galleryBriefs: ['Law library & chambers', 'Consultation meeting', 'Documentation review', 'Court representation'],
  },
  CA_FINANCE: {
    galleryTitle: 'Practice & Team',
    gallerySubtitle: 'A look at our practice and the clients we serve.',
    menuTitle: 'Compliance Services',
    menuSubtitle: 'Illustrative service areas — scope confirmed on engagement.',
    expertiseTitle: 'Areas of Expertise',
    expertiseSubtitle: 'The financial domains our practice concentrates on.',
    ctaBannerTitle: 'Need financial or compliance guidance?',
    ctaBannerSubtitle: 'Schedule an initial consultation with our team.',
    industriesTitle: 'Sectors We Serve',
    industries: ['Manufacturing & Trading', 'Technology & Startups', 'Professional Services', 'Retail & Distribution', 'NRI & Cross-Border Clients', 'Family-Owned Businesses'],
    galleryBriefs: ['Corporate office', 'Advisory meeting', 'Financial documentation', 'Team at work'],
  },
  GENERAL_SMB: {
    galleryTitle: 'Our Work',
    gallerySubtitle: 'A selection of the work we deliver for clients.',
    menuTitle: 'Services & Options',
    menuSubtitle: 'Illustrative service options — enquire for a tailored quote.',
    expertiseTitle: 'What We Specialise In',
    expertiseSubtitle: 'The services and skills we bring to every engagement.',
    ctaBannerTitle: 'Let us help you get started.',
    ctaBannerSubtitle: 'Request a free estimate or a no-obligation consultation.',
    industriesTitle: 'Who We Serve',
    industries: ['Homeowners & Individuals', 'Local Businesses', 'Offices & Commercial Clients', 'Enterprises', 'Bulk & Contract Work', 'Ongoing Support'],
    galleryBriefs: ['Service in action', 'Completed work', 'Team at work', 'Client engagement'],
  },
};

/**
 * Words/phrases that are true CA/finance-specific leakage. These must never
 * appear in a non-CA profession's generated website.
 */
const CA_LEAKAGE_PATTERNS: RegExp[] = [
  /\bchartered accountant(s)?\b/i,
  /\bICAI\b/i,
  /\bstatutory audit\b/i,
  /\baudit (services?|assurance)\b/i,
  /\btransfer pricing\b/i,
  /\bform 15ca\b/i,
  /\bform 15cb\b/i,
  /\bGST returns?\b/i,
  /\bGST\b/i,
  /\bITR filing\b/i,
  /\bincome tax\b/i,
  /\btax filing\b/i,
  /\btax return(s)?\b/i,
  /\bTDS\b/,
  /\bbook-?keeping\b/i,
  /\bfinancial compliance\b/i,
  /\btax consultation\b/i,
  /\bcorporate tax\b/i,
  /\bfinancial services\b/i,
  /\btax audit\b/i,
  /\baudit firms?\b/i,
  /\baccounting\b/i,
  /\breturn filing\b/i,
];

/** Neutral replacement used only when scrubbing CA tokens out of a non-CA site. */
const CA_TOKEN_REPLACEMENTS: Array<{ re: RegExp; replace: string }> = [
  { re: /\bchartered accountant(s)?\b/gi, replace: 'our team' },
  { re: /\bICAI\b/g, replace: 'professional standards' },
  { re: /\bstatutory audit\b/gi, replace: 'quality review' },
  { re: /\baudit (services?|assurance)\b/gi, replace: 'advisory services' },
  { re: /\btransfer pricing\b/gi, replace: 'project consultation' },
  { re: /\bform 15ca\b/gi, replace: 'required documentation' },
  { re: /\bform 15cb\b/gi, replace: 'required documentation' },
  { re: /\bGST returns?\b/gi, replace: 'ongoing reporting' },
  { re: /\bGST\b/g, replace: 'compliance' },
  { re: /\bITR filing\b/gi, replace: 'annual filing' },
  { re: /\bincome tax\b/gi, replace: 'regulatory requirements' },
  { re: /\btax filing\b/gi, replace: 'annual filing' },
  { re: /\btax return(s)?\b/gi, replace: 'records' },
  { re: /\bTDS\b/g, replace: 'payments' },
  { re: /\bbook-?keeping\b/gi, replace: 'record management' },
  { re: /\bfinancial compliance\b/gi, replace: 'quality compliance' },
  { re: /\btax consultation\b/gi, replace: 'consultation' },
  { re: /\bcorporate tax\b/gi, replace: 'regulatory advisory' },
  { re: /\bfinancial services\b/gi, replace: 'professional services' },
  { re: /\btax audit\b/gi, replace: 'quality review' },
  { re: /\baudit firms?\b/gi, replace: 'professional advisors' },
  { re: /\baccounting\b/gi, replace: 'record management' },
  { re: /\breturn filing\b/gi, replace: 'documentation' },
];

export function isCaPracticeProfession(profession?: string, businessName?: string): boolean {
  return detectProfessionCategory(profession, businessName) === 'CA_FINANCE';
}

export function containsCaLeakage(text: string): boolean {
  if (!text) return false;
  return CA_LEAKAGE_PATTERNS.some((re) => re.test(text));
}

export function scrubCaTokens(text: string): string {
  let out = text;
  for (const { re, replace } of CA_TOKEN_REPLACEMENTS) {
    out = out.replace(re, replace);
  }
  return out;
}

export interface ProfessionContentPlan {
  category: ProfessionCategory;
  professionId: string;
  isCaPractice: boolean;
  sectionOrder: WebsiteSectionType[];
  content: CategoryContentProfile;
  /** Reusable image keywords for the hero/about/service slots. */
  imageKeywords: { hero: string; about: string; services: string[]; gallery?: string[] };
  trustBadges: string[];
  primaryCta: string;
}

/**
 * Builds a deterministic, profession-aware content & section plan.
 * Never defaults to CA: unknown professions resolve to GENERAL_SMB.
 */
export function getProfessionContentPlan(
  profession?: string,
  businessName?: string
): ProfessionContentPlan {
  const category = detectProfessionCategory(profession, businessName);
  const isCaPractice = category === 'CA_FINANCE';
  const registryProfile = classifyProfession({ profession, businessName });
  const content = CATEGORY_CONTENT[category] || CATEGORY_CONTENT.GENERAL_SMB;

  return {
    category,
    professionId: registryProfile.id,
    isCaPractice,
    sectionOrder: [...(CATEGORY_SECTION_ORDER[category] || CATEGORY_SECTION_ORDER.GENERAL_SMB)],
    content,
    imageKeywords: registryProfile.imageKeywords,
    trustBadges: registryProfile.trustBadges,
    primaryCta: registryProfile.primaryCta,
  };
}

/**
 * Validates and normalizes an AI-provided section order.
 * - Keeps only known section types.
 * - Removes duplicates.
 * - Ensures HERO is first when present.
 * - Ensures CONTACT and LOCATION are present at the end.
 */
export function normalizeSectionOrder(
  input: unknown,
  fallback: WebsiteSectionType[]
): WebsiteSectionType[] {
  const allowed = new Set<string>([
    'HERO', 'TRUST', 'SERVICES', 'ABOUT', 'EXPERTISE', 'PROCESS', 'WHY_CHOOSE_US',
    'INDUSTRIES', 'TESTIMONIALS', 'FAQ', 'CONTACT', 'CTA', 'LOCATION', 'GALLERY', 'MENU',
  ]);

  const cleaned: WebsiteSectionType[] = [];
  if (Array.isArray(input)) {
    for (const raw of input) {
      const key = String(raw || '').toUpperCase().trim();
      if (!allowed.has(key)) continue;
      if (key === 'CTA_BANNER') continue;
      const typed = key as WebsiteSectionType;
      if (!cleaned.includes(typed)) cleaned.push(typed);
    }
  }

  if (cleaned.length === 0) {
    return [...fallback];
  }

  // HERO must lead the page.
  if (cleaned.includes('HERO')) {
    const idx = cleaned.indexOf('HERO');
    if (idx !== 0) {
      cleaned.splice(idx, 1);
      cleaned.unshift('HERO');
    }
  } else {
    cleaned.unshift('HERO');
  }

  // Ensure the essential closing sections exist, in a sensible order.
  for (const required of ['CONTACT', 'LOCATION'] as WebsiteSectionType[]) {
    if (!cleaned.includes(required)) cleaned.push(required);
  }
  // Move CONTACT/LOCATION to the tail in canonical order if they appear early.
  const tail: WebsiteSectionType[] = (['CONTACT', 'LOCATION'] as WebsiteSectionType[]).filter((s) =>
    cleaned.includes(s)
  );
  const head = cleaned.filter((s) => s !== 'CONTACT' && s !== 'LOCATION');
  return [...head, ...tail];
}

/**
 * Recursively scrubs CA-specific terminology from every string in a website
 * content object. Used only for non-CA professions to guarantee zero leakage
 * from any source (AI, deterministic fallback, cached/persisted content).
 */
export function scrubContentCaLeakage<T>(value: T, isCaPractice: boolean): T {
  if (isCaPractice) return value;
  return deepScrub(value) as T;
}

function deepScrub(value: any): any {
  if (typeof value === 'string') {
    return scrubCaTokens(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepScrub(item));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = deepScrub(val);
    }
    return out;
  }
  return value;
}

/**
 * Returns true when a persisted content object still contains CA leakage that
 * is inappropriate for the given profession. Used for self-healing/staleness
 * detection and by regression tests.
 */
export function contentHasCaLeakageForProfession(
  content: WebsiteContent | string | null | undefined,
  profession?: string,
  businessName?: string
): boolean {
  if (isCaPracticeProfession(profession, businessName)) return false;
  if (!content) return false;
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  return containsCaLeakage(text);
}
