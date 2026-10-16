import { WebsiteLayout, WebsiteSectionType, WebsiteTemplate, WebsiteTheme } from '@/types';
import { THEMES } from './themes';

export type ProfessionCategory =
  | 'CA_FINANCE'
  | 'PHOTOGRAPHY_CREATIVE'
  | 'RESTAURANT_HOSPITALITY'
  | 'HEALTHCARE_MEDICAL'
  | 'REAL_ESTATE_PROPERTY'
  | 'FITNESS_GYM'
  | 'INTERIOR_ARCHITECTURE'
  | 'BEAUTY_SALON'
  | 'LEGAL_LAW'
  | 'EDUCATION_COACHING'
  | 'GENERAL_SMB';

export interface ProfessionDesignPreset {
  category: ProfessionCategory;
  isCaPractice: boolean;
  defaultTemplate: WebsiteTemplate;
  defaultLayout: WebsiteLayout;
  defaultTheme: WebsiteTheme;
  sectionOrder: WebsiteSectionType[];
  navItems: { label: string; href: string }[];
  ctaText: string;
  heroImage: string;
  aboutImage: string;
  galleryImages: { url: string; caption: string; category: string }[];
}

export function detectProfessionCategory(profession?: string, businessName?: string): ProfessionCategory {
  const text = `${profession || ''} ${businessName || ''}`.toLowerCase();

  if (/\b(ca|chartered accountant|tax|gst|audit|accounting|accountant|cpa|bookkeep|itr)\b/i.test(text)) {
    return 'CA_FINANCE';
  }
  if (/\b(interior|architect|architecture|modular|decor|furnish|turnkey|spatial)\b/i.test(text)) {
    return 'INTERIOR_ARCHITECTURE';
  }
  if (/\b(doctor|clinic|dental|dentist|medical|hospital|health|physio|skin|dermat|ortho|pedia|gynae|diagnostic|patholog)\b/i.test(text)) {
    return 'HEALTHCARE_MEDICAL';
  }
  if (/\b(restaurant|cafe|coffee|bakery|sweet|bistro|dining|catering|food|kitchen|dhaba|pizzeria)\b/i.test(text)) {
    return 'RESTAURANT_HOSPITALITY';
  }
  if (/\b(gym|fitness|workout|crossfit|yoga|pilates|zumba|trainer|athletic|health club|sports)\b/i.test(text)) {
    return 'FITNESS_GYM';
  }
  if (/\b(salon|spa|beauty|makeup|bridal|parlour|parlor|hair|nail|cosmetic)\b/i.test(text)) {
    return 'BEAUTY_SALON';
  }
  if (/\b(real estate|property|properties|realtor|broker|builder|developer|housing|commercial space|plots|apartments)\b/i.test(text)) {
    return 'REAL_ESTATE_PROPERTY';
  }
  if (/\b(lawyer|advocate|legal|law|attorney|litigation|chamber)\b/i.test(text)) {
    return 'LEGAL_LAW';
  }
  if (/\b(coaching|institute|academy|tuition|school|classes|training|exam|mentor)\b/i.test(text)) {
    return 'EDUCATION_COACHING';
  }
  if (/\b(photo|photographer|photography|videograph|wedding|portrait|studio|cinematograph|shoot|camera)\b/i.test(text)) {
    return 'PHOTOGRAPHY_CREATIVE';
  }
  return 'GENERAL_SMB';
}

export const PROFESSION_PRESETS: Record<ProfessionCategory, ProfessionDesignPreset> = {
  CA_FINANCE: {
    category: 'CA_FINANCE',
    isCaPractice: true,
    defaultTemplate: 'EDITORIAL_FINANCE',
    defaultLayout: 'design-1-premium',
    defaultTheme: THEMES.executiveNavy,
    sectionOrder: ['HERO', 'TRUST', 'SERVICES', 'ABOUT', 'WHY_CHOOSE_US', 'FAQ', 'CONTACT', 'LOCATION'],
    navItems: [
      { label: 'Practice Areas', href: '#services' },
      { label: 'About Firm', href: '#about' },
      { label: 'Standards', href: '#why-choose-us' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Contact', href: '#contact' },
    ],
    ctaText: 'Schedule Consultation',
    heroImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85',
    aboutImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
    galleryImages: [],
  },
  PHOTOGRAPHY_CREATIVE: {
    category: 'PHOTOGRAPHY_CREATIVE',
    isCaPractice: false,
    defaultTemplate: 'LUXURY_PROFESSIONAL',
    defaultLayout: 'LUXURY_PROFESSIONAL',
    defaultTheme: {
      id: 'editorial-noir',
      name: 'Editorial Studio',
      primaryColor: '#18181b',
      secondaryColor: '#27272a',
      accentColor: '#d97706',
      fontFamily: 'serif',
      style: 'minimal',
      borderRadius: 'md',
    },
    sectionOrder: ['HERO', 'SERVICES', 'EXPERTISE', 'ABOUT', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    navItems: [
      { label: 'Portfolio & Style', href: '#expertise' },
      { label: 'Photography Services', href: '#services' },
      { label: 'Our Approach', href: '#about' },
      { label: 'Packages & FAQ', href: '#faq' },
      { label: 'Book a Shoot', href: '#contact' },
    ],
    ctaText: 'Check Dates & Book Shoot',
    heroImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
    aboutImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', caption: 'Candid Wedding & Bridal Moments', category: 'Weddings' },
      { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', caption: 'Editorial & Studio Portraits', category: 'Portraits' },
      { url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80', caption: 'Pre-Wedding & Destination Shoots', category: 'Pre-Wedding' },
      { url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80', caption: 'Commercial & Brand Storytelling', category: 'Commercial' },
      { url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80', caption: 'Celebrations & Live Events', category: 'Events' },
      { url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80', caption: 'Fine Art Lighting & Composition', category: 'Editorial' },
    ],
  },
  RESTAURANT_HOSPITALITY: {
    category: 'RESTAURANT_HOSPITALITY',
    isCaPractice: false,
    defaultTemplate: 'MODERN_INDIAN',
    defaultLayout: 'MODERN_INDIAN',
    defaultTheme: {
      id: 'culinary-spice',
      name: 'Culinary Warmth',
      primaryColor: '#7c2d12',
      secondaryColor: '#1c1917',
      accentColor: '#ea580c',
      fontFamily: 'serif',
      style: 'modern',
      borderRadius: 'lg',
    },
    sectionOrder: ['HERO', 'SERVICES', 'EXPERTISE', 'ABOUT', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    navItems: [
      { label: 'Menu Highlights', href: '#services' },
      { label: 'Gallery', href: '#expertise' },
      { label: 'Our Story', href: '#about' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Reserve / Order', href: '#contact' },
    ],
    ctaText: 'Reserve a Table / Order',
    heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',
    aboutImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', caption: 'Chef Signature Mains', category: 'Signature Dishes' },
      { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', caption: 'Warm Dining Ambience', category: 'Dining Experience' },
      { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80', caption: 'Freshly Prepared Specialties', category: 'Fresh Kitchen' },
    ],
  },
  HEALTHCARE_MEDICAL: {
    category: 'HEALTHCARE_MEDICAL',
    isCaPractice: false,
    defaultTemplate: 'CLINIC_HEALTHCARE',
    defaultLayout: 'CLINIC_HEALTHCARE',
    defaultTheme: THEMES.techTeal,
    sectionOrder: ['HERO', 'TRUST', 'SERVICES', 'ABOUT', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    navItems: [
      { label: 'Treatments & Care', href: '#services' },
      { label: 'About Clinic', href: '#about' },
      { label: 'Patient Journey', href: '#process' },
      { label: 'Patient FAQ', href: '#faq' },
      { label: 'Book Appointment', href: '#contact' },
    ],
    ctaText: 'Book Appointment',
    heroImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=85',
    aboutImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80',
    galleryImages: [],
  },
  REAL_ESTATE_PROPERTY: {
    category: 'REAL_ESTATE_PROPERTY',
    isCaPractice: false,
    defaultTemplate: 'EDITORIAL_FINANCE',
    defaultLayout: 'EDITORIAL_FINANCE',
    defaultTheme: THEMES.emeraldPrestige,
    sectionOrder: ['HERO', 'SERVICES', 'EXPERTISE', 'ABOUT', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    navItems: [
      { label: 'Property Services', href: '#services' },
      { label: 'Featured Segments', href: '#expertise' },
      { label: 'About Advisory', href: '#about' },
      { label: 'Buyer FAQ', href: '#faq' },
      { label: 'Schedule Site Visit', href: '#contact' },
    ],
    ctaText: 'Schedule a Site Visit',
    heroImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85',
    aboutImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', caption: 'Luxury Residential Villas & Floors', category: 'Residential' },
      { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', caption: 'Grade-A Commercial & Retail Spaces', category: 'Commercial' },
      { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', caption: 'High-Growth Investment Corridors', category: 'Investments' },
    ],
  },
  FITNESS_GYM: {
    category: 'FITNESS_GYM',
    isCaPractice: false,
    defaultTemplate: 'MODERN_FINTECH',
    defaultLayout: 'MODERN_FINTECH',
    defaultTheme: {
      id: 'athletic-energy',
      name: 'Athletic Slate',
      primaryColor: '#0f172a',
      secondaryColor: '#1e293b',
      accentColor: '#16a34a',
      fontFamily: 'sans',
      style: 'modern',
      borderRadius: 'lg',
    },
    sectionOrder: ['HERO', 'SERVICES', 'EXPERTISE', 'ABOUT', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    navItems: [
      { label: 'Training Programs', href: '#services' },
      { label: 'Facilities', href: '#expertise' },
      { label: 'Coaching Philosophy', href: '#about' },
      { label: 'Membership FAQ', href: '#faq' },
      { label: 'Claim Free Trial', href: '#contact' },
    ],
    ctaText: 'Claim Free Trial Session',
    heroImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85',
    aboutImage: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80',
    galleryImages: [],
  },
  INTERIOR_ARCHITECTURE: {
    category: 'INTERIOR_ARCHITECTURE',
    isCaPractice: false,
    defaultTemplate: 'INTERIOR_ARCHITECTURE',
    defaultLayout: 'INTERIOR_ARCHITECTURE',
    defaultTheme: THEMES.corporateSlate,
    sectionOrder: ['HERO', 'SERVICES', 'EXPERTISE', 'ABOUT', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    navItems: [
      { label: 'Design Services', href: '#services' },
      { label: 'Spaces & Portfolio', href: '#expertise' },
      { label: 'Studio Craft', href: '#about' },
      { label: 'Process', href: '#process' },
      { label: 'Book Site Visit', href: '#contact' },
    ],
    ctaText: 'Book Design Consultation',
    heroImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85',
    aboutImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80',
    galleryImages: [],
  },
  BEAUTY_SALON: {
    category: 'BEAUTY_SALON',
    isCaPractice: false,
    defaultTemplate: 'LUXURY_PROFESSIONAL',
    defaultLayout: 'LUXURY_PROFESSIONAL',
    defaultTheme: THEMES.classicBurgundy,
    sectionOrder: ['HERO', 'SERVICES', 'EXPERTISE', 'ABOUT', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    navItems: [
      { label: 'Services & Makeovers', href: '#services' },
      { label: 'Bridal & Style', href: '#expertise' },
      { label: 'About Studio', href: '#about' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Book Appointment', href: '#contact' },
    ],
    ctaText: 'Book Salon Appointment',
    heroImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85',
    aboutImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80',
    galleryImages: [],
  },
  LEGAL_LAW: {
    category: 'LEGAL_LAW',
    isCaPractice: false,
    defaultTemplate: 'EDITORIAL_FINANCE',
    defaultLayout: 'EDITORIAL_FINANCE',
    defaultTheme: THEMES.executiveNavy,
    sectionOrder: ['HERO', 'TRUST', 'SERVICES', 'ABOUT', 'WHY_CHOOSE_US', 'FAQ', 'CONTACT', 'LOCATION'],
    navItems: [
      { label: 'Practice Areas', href: '#services' },
      { label: 'About Chambers', href: '#about' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Contact', href: '#contact' },
    ],
    ctaText: 'Schedule Legal Consultation',
    heroImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=85',
    aboutImage: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80',
    galleryImages: [],
  },
  EDUCATION_COACHING: {
    category: 'EDUCATION_COACHING',
    isCaPractice: false,
    defaultTemplate: 'MODERN_FINTECH',
    defaultLayout: 'MODERN_FINTECH',
    defaultTheme: THEMES.executiveNavy,
    sectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    navItems: [
      { label: 'Courses & Batches', href: '#services' },
      { label: 'Methodology', href: '#process' },
      { label: 'About Institute', href: '#about' },
      { label: 'Student FAQ', href: '#faq' },
      { label: 'Book Demo Class', href: '#contact' },
    ],
    ctaText: 'Book Free Demo Class',
    heroImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85',
    aboutImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=900&q=80',
    galleryImages: [],
  },
  GENERAL_SMB: {
    category: 'GENERAL_SMB',
    isCaPractice: false,
    defaultTemplate: 'MODERN_FINTECH',
    defaultLayout: 'MODERN_FINTECH',
    defaultTheme: THEMES.corporateSlate,
    sectionOrder: ['HERO', 'SERVICES', 'ABOUT', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    navItems: [
      { label: 'Services', href: '#services' },
      { label: 'About Us', href: '#about' },
      { label: 'How We Work', href: '#process' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Contact Us', href: '#contact' },
    ],
    ctaText: 'Request a Free Quote',
    heroImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85',
    aboutImage: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80',
    galleryImages: [],
  },
};

export function getProfessionPreset(profession?: string, businessName?: string): ProfessionDesignPreset {
  const cat = detectProfessionCategory(profession, businessName);
  return PROFESSION_PRESETS[cat];
}
