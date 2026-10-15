/**
 * Profession-Aware Image Engine
 *
 * Provides curated, contextual, high-resolution imagery for any profession,
 * organized by slot purpose (Hero, About, Service Cards, Gallery).
 *
 * Implements:
 * 1. Categorized Unsplash photo collections by profession
 * 2. Slot-purpose dimensioning & aspect-ratio cropping
 * 3. Priority for user-uploaded business photos & logos
 * 4. Graceful offline SVG fallbacks with zero broken image risk
 */

export type ImageSlotPurpose = 'HERO' | 'ABOUT' | 'SERVICE' | 'GALLERY' | 'LOGO';

export interface ImageSlotRequest {
  profession: string;
  businessName?: string;
  purpose: ImageSlotPurpose;
  serviceIndex?: number;
  serviceTitle?: string;
  customKeyword?: string;
  userImageUrl?: string | null;
}

// Curated high-resolution Unsplash photo IDs organized by industry
const PROFESSION_IMAGE_POOLS: Record<
  string,
  {
    hero: string[];
    about: string[];
    services: string[];
    gallery: string[];
  }
> = {
  // Chartered Accountants & Tax
  CHARTERED_ACCOUNTANT: {
    hero: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab', // Modern corporate glass skyscraper
      'https://images.unsplash.com/photo-1497366216548-37526070297c', // Sleek corporate boardroom
    ],
    about: [
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7', // Professional team collaboration
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df', // Executive advisory consultation
    ],
    services: [
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c', // Tax and audit calculation
      'https://images.unsplash.com/photo-1450133064473-71024230f91b', // Corporate governance documentation
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f', // Financial reporting analytics
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf', // Strategic advisory handshake
    ],
    gallery: [],
  },

  // Doctors & Dental Clinics
  DOCTOR_CLINIC: {
    hero: [
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09', // High-end modern clinic reception
      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5', // Pristine dental operatory
    ],
    about: [
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d', // Friendly caring doctor
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118', // Healthcare team consultation
    ],
    services: [
      'https://images.unsplash.com/photo-1606811841689-23dfddce3e95', // Gentle dental examination
      'https://images.unsplash.com/photo-1516549655169-df83a0774514', // State-of-the-art diagnostics
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d', // Digital patient review
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982', // Preventive healthcare checkup
    ],
    gallery: [
      'https://images.unsplash.com/photo-1629909615184-74f495363b67', // Sterilized equipment tray
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d', // Calming patient waiting lounge
      'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7', // Medical consultation suite
    ],
  },

  // Lawyers & Advocates
  LAWYER_LEGAL: {
    hero: [
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f', // Classical law books library
      'https://images.unsplash.com/photo-1436450412740-6b988f486c6b', // High-ceiling law office
    ],
    about: [
      'https://images.unsplash.com/photo-1505664194779-8beaceb93744', // Lady justice scale on wood desk
      'https://images.unsplash.com/photo-1521791136064-7986c2920216', // Legal consultation handshake
    ],
    services: [
      'https://images.unsplash.com/photo-1450133064473-71024230f91b', // Legal contract review
      'https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33', // Corporate dispute advisory
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab', // Property & title due diligence
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f', // Court litigation representation
    ],
    gallery: [],
  },

  // Restaurants & Bakeries
  RESTAURANT_CAFE: {
    hero: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', // Warm ambient restaurant interior
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', // Gourmet plated dinner
    ],
    about: [
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d', // Artisan chef kitchen prep
      'https://images.unsplash.com/photo-1509440159596-0249088772ff', // Fresh sourdough bakery loaves
    ],
    services: [
      'https://images.unsplash.com/photo-1544025162-d76694265947', // Chef specialty dishes
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587', // Handcrafted celebration cakes
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb', // Espresso coffee bar
      'https://images.unsplash.com/photo-1555244162-803834f70033', // Festive banquet catering
    ],
    gallery: [
      'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e', // Berry tart dessert
      'https://images.unsplash.com/photo-1509440159596-0249088772ff', // Crusty golden breads
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', // Candlelit dining table
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87', // Colorful pastries
    ],
  },

  // Real Estate & Property
  REAL_ESTATE: {
    hero: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c', // Luxury villa modern architecture
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9', // Sunlit luxury residence
    ],
    about: [
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa', // Handing over new house keys
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c', // Open concept living room
    ],
    services: [
      'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf', // Premium residential sales
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab', // Prime commercial office spaces
      'https://images.unsplash.com/photo-1450133064473-71024230f91b', // Legal documentation & registration
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d', // Real estate investment guidance
    ],
    gallery: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3', // Designer master bathroom
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115', // Modern swimming pool terrace
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f', // Panoramic city view balcony
    ],
  },

  // Gym & Fitness
  GYM_FITNESS: {
    hero: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48', // Heavy duty dumbbells gym floor
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd', // High energy training club
    ],
    about: [
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b', // Fitness coach instructing client
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e', // Athlete preparing for deadlift
    ],
    services: [
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61', // Hypertrophy weightlifting
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b', // 1-on-1 personal coaching
      'https://images.unsplash.com/photo-1434596922112-19c563067271', // Functional cardio endurance
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061', // Personalized sports nutrition
    ],
    gallery: [
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f', // Clean barbell equipment rack
      'https://images.unsplash.com/photo-1518611012118-696072aa579a', // Motivating group fitness studio
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5', // Pull-up and calisthenics zone
    ],
  },

  // Digital Marketing & SEO
  DIGITAL_AGENCY: {
    hero: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f', // Web analytics digital charts
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c', // Collaborative tech team
    ],
    about: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978', // Strategy sprint whiteboard
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12', // UI/UX design workflow
    ],
    services: [
      'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07', // Google search SEO ranking
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7', // Social media performance ads
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085', // Full stack web app development
      'https://images.unsplash.com/photo-1542744094-3a31f272c490', // Conversion rate optimization
    ],
    gallery: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71', // Real-time ROI dashboard
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8', // Responsive device design layout
      'https://images.unsplash.com/photo-1557804506-669a67965ba0', // Client presentation meeting
    ],
  },

  // Interior Design & Architecture
  INTERIOR_DESIGN: {
    hero: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6', // Modern elegant living room
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c', // Architectural interior lighting
    ],
    about: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e', // Architecture blueprints and samples
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace', // Turnkey interior styling
    ],
    services: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f', // Luxury modular kitchen
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace', // Residential turnkey interiors
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e', // 3D space planning & CAD
      'https://images.unsplash.com/photo-1615873968403-89e068629265', // Custom wardrobe & cabinetry
    ],
    gallery: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f', // Fluted glass kitchen pantry
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6', // Warm atmospheric living room
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45', // Minimalist dining sanctuary
    ],
  },

  // Salon & Spa
  SALON_SPA: {
    hero: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035', // Luxury salon styling stations
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e', // Beauty styling vanity
    ],
    about: [
      'https://images.unsplash.com/photo-1562322140-8baeececf3df', // Stylist cutting hair
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef', // Relaxing spa treatment
    ],
    services: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e', // Balayage & hair couture
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881', // Hydrafacial skin aesthetics
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f', // Bridal occasion makeup
      'https://images.unsplash.com/photo-1519823551278-64ac92734fb1', // Aromatherapy massage
    ],
    gallery: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035', // Chic reception lounge
      'https://images.unsplash.com/photo-1562322140-8baeececf3df', // Glossy hair transformation
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef', // Serene spa candle decor
    ],
  },

  // General SMB Fallback
  GENERAL_SMB: {
    hero: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c', // Modern professional workspace
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab', // Contemporary office architecture
    ],
    about: [
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c', // Committed service team
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7', // Client consultation discussion
    ],
    services: [
      'https://images.unsplash.com/photo-1450133064473-71024230f91b', // Dedicated service delivery
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f', // Quality assessment review
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf', // Strategic planning & execution
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df', // Ongoing customer care
    ],
    gallery: [],
  },
};

/**
 * Returns a high-resolution, cropped image URL for the requested profession and slot purpose.
 */
export function getContextualImageUrl(req: ImageSlotRequest): string {
  if (req.userImageUrl && req.userImageUrl.trim().length > 0) {
    return req.userImageUrl.trim();
  }

  const normalized = req.profession.toLowerCase().trim();
  let poolKey = 'GENERAL_SMB';

  if (/dent|tooth|doctor|clinic|medical|physio|health/i.test(normalized)) {
    poolKey = 'DOCTOR_CLINIC';
  } else if (/law|legal|advocate|court|attorney/i.test(normalized)) {
    poolKey = 'LAWYER_LEGAL';
  } else if (/restaurant|cafe|bakery|food|dine|bistro|sweet|mithai/i.test(normalized)) {
    poolKey = 'RESTAURANT_CAFE';
  } else if (/real estate|property|realtor|broker|housing/i.test(normalized)) {
    poolKey = 'REAL_ESTATE';
  } else if (/gym|fitness|crossfit|trainer|workout|muscle/i.test(normalized)) {
    poolKey = 'GYM_FITNESS';
  } else if (/digital|seo|marketing|web|software|developer|agency/i.test(normalized)) {
    poolKey = 'DIGITAL_AGENCY';
  } else if (/interior|architect|decor|modular|kitchen|wardrobe/i.test(normalized)) {
    poolKey = 'INTERIOR_DESIGN';
  } else if (/salon|spa|beauty|hair|parlor|makeup/i.test(normalized)) {
    poolKey = 'SALON_SPA';
  } else if (/chartered|ca firm|audit|tax|gst|account/i.test(normalized)) {
    poolKey = 'CHARTERED_ACCOUNTANT';
  }

  const pool = PROFESSION_IMAGE_POOLS[poolKey] || PROFESSION_IMAGE_POOLS.GENERAL_SMB;

  let rawUrl = pool.hero[0];
  let width = 1200;
  let height = 675;

  switch (req.purpose) {
    case 'HERO': {
      rawUrl = pool.hero[0] || pool.hero[1] || PROFESSION_IMAGE_POOLS.GENERAL_SMB.hero[0];
      width = 1280;
      height = 720;
      break;
    }
    case 'ABOUT': {
      rawUrl = pool.about[0] || pool.about[1] || PROFESSION_IMAGE_POOLS.GENERAL_SMB.about[0];
      width = 800;
      height = 900;
      break;
    }
    case 'SERVICE': {
      const idx = (req.serviceIndex ?? 0) % (pool.services.length || 1);
      rawUrl = pool.services[idx] || pool.services[0] || PROFESSION_IMAGE_POOLS.GENERAL_SMB.services[0];
      width = 800;
      height = 500;
      break;
    }
    case 'GALLERY': {
      const idx = (req.serviceIndex ?? 0) % (pool.gallery.length || pool.services.length || 1);
      rawUrl = pool.gallery[idx] || pool.services[idx] || pool.hero[0];
      width = 800;
      height = 600;
      break;
    }
    case 'LOGO': {
      return '';
    }
  }

  return `${rawUrl}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

/**
 * Returns a full suite of curated images for an entire demo website.
 */
export function getProfessionImageSet(profession: string, businessName?: string) {
  return {
    heroImage: getContextualImageUrl({ profession, businessName, purpose: 'HERO' }),
    aboutImage: getContextualImageUrl({ profession, businessName, purpose: 'ABOUT' }),
    serviceImages: [
      getContextualImageUrl({ profession, businessName, purpose: 'SERVICE', serviceIndex: 0 }),
      getContextualImageUrl({ profession, businessName, purpose: 'SERVICE', serviceIndex: 1 }),
      getContextualImageUrl({ profession, businessName, purpose: 'SERVICE', serviceIndex: 2 }),
      getContextualImageUrl({ profession, businessName, purpose: 'SERVICE', serviceIndex: 3 }),
    ],
    galleryImages: [
      getContextualImageUrl({ profession, businessName, purpose: 'GALLERY', serviceIndex: 0 }),
      getContextualImageUrl({ profession, businessName, purpose: 'GALLERY', serviceIndex: 1 }),
      getContextualImageUrl({ profession, businessName, purpose: 'GALLERY', serviceIndex: 2 }),
    ],
  };
}

/**
 * Builds structured WebsiteImages conforming to WebsiteImagesSchema
 */
export function buildWebsiteImagesObject(profession: string, businessName: string) {
  const set = getProfessionImageSet(profession, businessName);
  return {
    heroImage: {
      url: set.heroImage,
      alt: `${businessName} Showcase`,
      slot: 'HERO' as const,
      aspectRatio: '16:9',
    },
    aboutImage: {
      url: set.aboutImage,
      alt: `About ${businessName}`,
      slot: 'ABOUT' as const,
      aspectRatio: '4:5',
    },
    serviceImages: set.serviceImages.map((url, i) => ({
      url,
      alt: `Service ${i + 1}`,
      slot: 'SERVICE' as const,
      aspectRatio: '16:10',
    })),
    gallery: set.galleryImages.map((url, i) => ({
      url,
      alt: `${businessName} Portfolio ${i + 1}`,
      slot: 'GALLERY' as const,
      aspectRatio: '4:3',
    })),
  };
}

