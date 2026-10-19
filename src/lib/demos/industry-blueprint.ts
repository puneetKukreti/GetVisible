import { z } from 'zod';
import type { WebsiteSectionType } from '@/types';
import {
  PROFESSION_ARCHETYPE_IDS,
  DEFAULT_ARCHETYPE_ID,
} from './profession-stitch';
import {
  INDUSTRY_PALETTE_IDS,
  DEFAULT_INDUSTRY_PALETTE_ID,
  getIndustryPalette,
  isIndustryPaletteId,
} from './industry-palettes';
import {
  blueprintAuthoringFailureIsTransient,
  generateIndustryBlueprintJson,
} from './ai-content-generator';
import { IndustryBlueprintRepository } from '@/lib/db/repository';

/**
 * Per-industry design blueprint.
 *
 * When a trade has no curated design of its own, the demo is designed the way
 * the best-performing reference websites in *that industry* are built: which
 * sections they lead with, what the hero/imagery treatment looks like, the
 * colour + typography mood, the trust signals they surface, how services are
 * named, and the primary call-to-action.
 *
 * Guarantees:
 * - Deterministic per industry: authored once, then cached (memory + Postgres /
 *   demo ledger), so every lead in a trade gets an identical design and CA /
 *   curated professions are never touched (the generator only consults this for
 *   generic trades).
 * - Safe: the blueprint can only *select* an allow-listed archetype, palette
 *   system and section ids plus one optional validated hex accent. It can never
 *   emit markup, CSS, fonts or colours, so a bad model answer cannot break a
 *   demo.
 * - Never throws: any failure falls back to the curated deterministic blueprint.
 */

export interface IndustryBlueprintCopy {
  /** Voice used by leading sites in this industry. */
  tone: string;
  /** Headline pattern (with {city} placeholder). */
  heroPattern: string;
  /** Trust signals the industry's best sites emphasise. */
  trustSignals: string[];
  /** How services are named in this industry. */
  serviceNamingStyle: string;
  /** Primary call-to-action wording. */
  primaryCta: string;
}

export interface IndustryBlueprintImagery {
  /** Photography style: framing, lighting, mood. */
  treatment: string;
  /** Short stock-search phrases used for live image sourcing. */
  keywords: string[];
}

export interface IndustryDesignBlueprint {
  /** Stable cache key for the industry (e.g. "car-detailing"). */
  key: string;
  /** Display label of the industry this was authored for. */
  industry: string;
  /** Profession Stitch archetype id. */
  archetype: string;
  /** Industry palette/typography system id. */
  paletteId: string;
  /** Optional validated accent refinement. */
  accentColor?: string;
  heroStyle: 'fullbleed' | 'split' | 'centered';
  sectionOrder: WebsiteSectionType[];
  copy: IndustryBlueprintCopy;
  imagery: IndustryBlueprintImagery;
  /** Where the design came from. */
  source: 'ai' | 'deterministic';
  /** One-line explanation of what the design is based on. */
  referenceBasis: string;
  createdAt: string;
  version: number;
}

export interface GetIndustryBlueprintInput {
  profession?: string | null;
  businessName?: string | null;
  city?: string | null;
}

export interface IndustryBlueprintDeps {
  /** Injected author (tests / custom providers). Defaults to the Gemini call. */
  aiAuthor?: (facts: {
    profession: string;
    city?: string;
    archetypeIds: string[];
    paletteIds: string[];
    sectionIds: string[];
  }) => Promise<unknown | null>;
  /** Injected clock (determinism in tests). */
  now?: () => Date;
  /**
   * Whether the just-failed authoring attempt is worth retrying later. Only
   * consulted when `aiAuthor` is injected; otherwise the real author's
   * diagnostics are read.
   */
  aiFailureIsTransient?: () => boolean;
}

/** Section types the Profession Stitch renderer can actually render. */
export const RENDERABLE_SECTION_IDS: WebsiteSectionType[] = [
  'HERO',
  'TRUST',
  'SERVICES',
  'GALLERY',
  'MENU',
  'EXPERTISE',
  'ABOUT',
  'PROCESS',
  'WHY_CHOOSE_US',
  'INDUSTRIES',
  'FAQ',
  'CTA',
  'CONTACT',
  'LOCATION',
];

const BLUEPRINT_VERSION = 1;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const HERO_STYLES = ['fullbleed', 'split', 'centered'] as const;

/** Businesses keywords that carry no industry meaning (dropped from the key). */
const KEY_STOPWORDS = new Set([
  'and', 'the', 'for', 'with', 'our', 'your', 'all', 'services', 'service',
  'center', 'centre', 'shop', 'store', 'company', 'agency', 'business', 'works',
  'online', 'best', 'top', 'ltd', 'pvt', 'co', 'llp', 'inc', 'near', 'me',
  'solutions', 'enterprises', 'enterprise', 'group', 'studio', 'studios', 'hub',
]);

/** Canonical section flows, reordered per industry by the rules below. */
const SERVICE_FLOW: WebsiteSectionType[] = [
  'HERO', 'TRUST', 'SERVICES', 'GALLERY', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION',
];
const VISUAL_FLOW: WebsiteSectionType[] = [
  'HERO', 'GALLERY', 'SERVICES', 'ABOUT', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION',
];
const EXPERT_FLOW: WebsiteSectionType[] = [
  'HERO', 'SERVICES', 'EXPERTISE', 'PROCESS', 'GALLERY', 'ABOUT', 'FAQ', 'CTA', 'CONTACT', 'LOCATION',
];
const PRODUCT_FLOW: WebsiteSectionType[] = [
  'HERO', 'SERVICES', 'MENU', 'GALLERY', 'ABOUT', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION',
];

interface IndustryBlueprintRule {
  match: RegExp;
  archetype: string;
  paletteId: string;
  sectionOrder: WebsiteSectionType[];
  tone: string;
  heroPattern: string;
  trustSignals: string[];
  serviceNamingStyle: string;
  primaryCta: string;
  imageryTreatment: string;
  imageryKeywords: string[];
}

/**
 * Curated, deterministic industry knowledge: how reference websites in each
 * trade are built. Used directly when the model is unavailable (and as the
 * fallback seed for individual fields when it misbehaves).
 */
const INDUSTRY_RULES: IndustryBlueprintRule[] = [
  {
    // Word-bounded on purpose: "Carton", "Pet Care", "Carpet", "Bookkeeping"
    // and "Textile" must never match the trade rules they merely contain.
    match: /\b(cars?|automobiles?|automotive|vehicles?|bikes?|motorcycles?|motorbikes?|tyres?|tires?|motors?|wheels?|garages?|detailing|denting|bodyshops?)\b|car wash|body shop|auto (?:service|repair|works|care|detailing|spa|solutions)|\bauto\b|spare parts/i,
    archetype: 'design-bold-energetic',
    paletteId: 'midnight-garage',
    sectionOrder: SERVICE_FLOW,
    tone: 'confident, results-first, showroom-shine',
    heroPattern: 'Showroom-finish car care for {city} owners',
    trustSignals: [
      'Paint-safe products and equipment',
      'Trained detailing technicians',
      'Quality inspection before every delivery',
      'Serving drivers across {city}',
    ],
    serviceNamingStyle: 'outcome-first package names (Ceramic Coating, Paint Correction, Interior Deep Clean)',
    primaryCta: 'Book a Detailing Slot',
    imageryTreatment: 'glossy close-ups of freshly detailed paint, wheels and interiors, low-angle and high-contrast',
    imageryKeywords: ['car detailing', 'ceramic coating', 'car interior cleaning', 'car polishing'],
  },
  {
    match: /\b(solar|photovoltaic|inverters?|renewables?|rooftop)\b|ev charg|electric vehicle|\benergy\b/i,
    archetype: 'design-bold-energetic',
    paletteId: 'electric-blueprint',
    sectionOrder: EXPERT_FLOW,
    tone: 'technical, savings-focused, credible',
    heroPattern: 'Rooftop solar that cuts your power bill in {city}',
    trustSignals: [
      'Bankable components and workmanship warranty',
      'Savings estimate before you commit',
      'Site survey and structural assessment',
      'Post-installation service support',
    ],
    serviceNamingStyle: 'technical service names (Rooftop Solar EPC, Net Metering, O&M Contracts)',
    primaryCta: 'Get a Savings Estimate',
    imageryTreatment: 'clean rooftop installations in daylight, wide technical framing, blue-sky contrast',
    imageryKeywords: ['solar panel installation', 'rooftop solar', 'solar inverter', 'solar energy'],
  },
  {
    match: /\b(?:electric(?:al|s|ian|ians)?|wiring|hvac|security|cctv|cameras?|surveillance|intercom|networking|technicians?|appliances?|refrigerators?|fridges?|microwaves?|lifts?|elevators?|electronics?)\b|air condition|ac repair|computer repair|laptop repair|ro service|water purifier|water purifiers|washing machine|fire safety|fire fighting/i,
    archetype: 'design-classic-professional',
    paletteId: 'electric-blueprint',
    sectionOrder: SERVICE_FLOW,
    tone: 'precise, dependable, technical',
    heroPattern: 'Certified installation and service in {city}',
    trustSignals: [
      'Trained and verified technicians',
      'Transparent, upfront estimates',
      'Warranty on parts and workmanship',
      'Same-day response across {city}',
    ],
    serviceNamingStyle: 'capability-first service names (Installation, AMC, Emergency Repair)',
    primaryCta: 'Request a Technician',
    imageryTreatment: 'technicians at work with tools and equipment, clear and well-lit',
    imageryKeywords: ['electrician working', 'security camera installation', 'air conditioner service', 'electrical panel'],
  },
  {
    match: /\b(?:plumb(?:ing|er|ers)?|pipes?|contractors?|carpent(?:er|ers|ry)?|paint(?:ing|er|ers)?|welding|fabrication|masons?|masonry|tiles?|waterproofing|borewell|glass|aluminium|aluminum|furniture|renovation|manufactur\w*)\b|bore well|interior work/i,
    archetype: 'design-classic-professional',
    paletteId: 'clean-industrial',
    sectionOrder: SERVICE_FLOW,
    tone: 'practical, craftsmanship-led, no-nonsense',
    heroPattern: 'Reliable workmanship for {city} homes and offices',
    trustSignals: [
      'Skilled, background-verified crew',
      'Clear scope and itemised quotes',
      'On-time project completion',
      'Workmanship warranty',
    ],
    serviceNamingStyle: 'scope-based service names (Installation, Repair, Annual Maintenance)',
    primaryCta: 'Request a Site Visit',
    imageryTreatment: 'makers mid-task with tools and materials, natural light, honest working shots',
    imageryKeywords: ['plumber working', 'carpenter furniture', 'house painting work', 'fabrication workshop'],
  },
  {
    match: /\b(?:pests?|fumigation|termites?|rodents?|mosquitoes?|mosquito|bedbugs?|cockroach\w*|disinfection|disinfestation)\b/i,
    archetype: 'design-classic-professional',
    paletteId: 'organic-care',
    sectionOrder: ['HERO', 'TRUST', 'SERVICES', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'GALLERY', 'CTA', 'CONTACT', 'LOCATION'],
    tone: 'reassuring, safety-first, family-friendly',
    heroPattern: 'A pest-free home in {city}, guaranteed',
    trustSignals: [
      'Child- and pet-safe treatments',
      'Odourless, low-residue chemicals',
      'Free follow-up within the warranty period',
      'Trained, uniformed technicians',
    ],
    serviceNamingStyle: 'pest-specific treatment names (Termite Control, Cockroach Treatment, Rodent Management)',
    primaryCta: 'Book an Inspection',
    imageryTreatment: 'bright, hygienic treatment shots and protected family homes; never threatening imagery',
    imageryKeywords: ['pest control', 'home pest treatment', 'fumigation service', 'termite treatment'],
  },
  {
    match: /\b(?:cleaning|cleaners?|cleans?|housekeeping|maids?|laundry|janitorial|sanitization|sanitisation|sanitizing)\b|dry clean|deep clean|car wash/i,
    archetype: 'design-classic-professional',
    paletteId: 'organic-care',
    sectionOrder: ['HERO', 'TRUST', 'SERVICES', 'PROCESS', 'GALLERY', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    tone: 'fresh, dependable, detail-obsessed',
    heroPattern: 'Spotless spaces, every single visit in {city}',
    trustSignals: [
      'Verified, trained staff',
      'Eco-friendly supplies',
      'Checklist-based quality control',
      'Flexible one-time or contract plans',
    ],
    serviceNamingStyle: 'scope-based plans (Deep Cleaning, Regular Housekeeping, Sofa & Carpet Care)',
    primaryCta: 'Book a Cleaning',
    imageryTreatment: 'bright, tidy interiors and staff in clean uniforms, before/after clarity',
    imageryKeywords: ['house cleaning', 'deep cleaning service', 'clean living room', 'laundry service'],
  },
  {
    match: /\b(?:pets?|dogs?|cats?|grooming|boarding|kennels?|vets?|veterinary|pupp(?:y|ies)|kittens?|aquarium|pet shop)\b/i,
    archetype: 'design-classic-professional',
    paletteId: 'organic-care',
    sectionOrder: ['HERO', 'TRUST', 'SERVICES', 'GALLERY', 'PROCESS', 'WHY_CHOOSE_US', 'FAQ', 'CTA', 'CONTACT', 'LOCATION'],
    tone: 'warm, caring, trustworthy',
    heroPattern: 'Loving care for {city} pets',
    trustSignals: [
      'Trained pet handlers',
      'Vet-supervised daily routines',
      'Daily updates and photos',
      'Hygienic, safe facilities',
    ],
    serviceNamingStyle: 'care-based service names (Grooming, Boarding, Day Care, Training)',
    primaryCta: 'Book a Pet Session',
    imageryTreatment: 'happy pets with attentive handlers, warm natural light',
    imageryKeywords: ['pet grooming', 'dog boarding', 'pet care', 'grooming salon'],
  },
  {
    match: /\b(?:logistics?|transport|transporters?|courier|couriers?|packers|movers|moving|cargo|freight|warehouse|taxi|taxis|cabs?|rentals?|hire)\b|car hire|packers and movers/i,
    archetype: 'design-classic-professional',
    paletteId: 'clean-industrial',
    sectionOrder: SERVICE_FLOW,
    tone: 'reliable, logistics-precise, transparent',
    heroPattern: 'On-time {industry} across {city}',
    trustSignals: [
      'Tracked shipments and updates',
      'Insured, carefully handled goods',
      'Transparent, itemised pricing',
      'Trained professional crew',
    ],
    serviceNamingStyle: 'route/service names (Local Shifting, Intercity Moves, Warehousing)',
    primaryCta: 'Get a Quote',
    imageryTreatment: 'clean fleet, loading and warehouse operations, daylight and order',
    imageryKeywords: ['packers movers', 'cargo logistics', 'delivery van', 'warehouse operations'],
  },
  {
    match: /\b(?:events?|weddings?|planners?|decor|decorations?|decorators?|banquets?|catering|caterers?|photography|photographers?|dj|celebrations?)\b/i,
    archetype: 'design-photo-editorial',
    paletteId: 'warm-artisan',
    sectionOrder: VISUAL_FLOW,
    tone: 'celebratory, visual-led, warm',
    heroPattern: 'Celebrations in {city}, beautifully handled',
    trustSignals: [
      'Curated vendor network',
      'Transparent packages and timelines',
      'On-day coordination team',
      'Real event portfolio',
    ],
    serviceNamingStyle: 'experience-based names (Wedding Planning, Decor Styling, Catering & Menus)',
    primaryCta: 'Check Availability',
    imageryTreatment: 'warm, candid event moments; wide establishing shots plus detail close-ups',
    imageryKeywords: ['wedding decoration', 'event setup', 'catering buffet', 'celebration lights'],
  },
  {
    match: /\b(?:travels?|tours?|tourism|hotels?|resorts?|homestays?|holidays?|trips?|visas?|itinerary|itineraries)\b|guest house|banquet hall/i,
    archetype: 'design-photo-editorial',
    paletteId: 'warm-artisan',
    sectionOrder: VISUAL_FLOW,
    tone: 'aspirational, experience-led, reassuring',
    heroPattern: 'Trips worth remembering, planned from {city}',
    trustSignals: [
      'Hand-picked stays and itineraries',
      'Transparent pricing with inclusions stated',
      'On-trip support and quick responses',
      'Years of repeat travellers',
    ],
    serviceNamingStyle: 'destination/package names (Honeymoon Packages, Group Tours, Visa Assistance)',
    primaryCta: 'Plan My Trip',
    imageryTreatment: 'destination landscapes and guest-experience moments, bright and inviting',
    imageryKeywords: ['travel destination', 'hotel resort', 'sightseeing tour', 'holiday vacation'],
  },
  {
    match: /\b(?:printing|printers?|packaging|signage|flex|labels?|cartons?|stationery|offset)\b|graphic design/i,
    archetype: 'design-classic-professional',
    paletteId: 'clean-industrial',
    sectionOrder: PRODUCT_FLOW,
    tone: 'capability-led, deadline-reliable, practical',
    heroPattern: 'Print and packaging that ships on time in {city}',
    trustSignals: [
      'Quality stock and colour accuracy',
      'Proof approval before printing',
      'Committed delivery timelines',
      'Bulk and repeat-order pricing',
    ],
    serviceNamingStyle: 'product-led names (Offset Printing, Packaging Boxes, Signage & Flex)',
    primaryCta: 'Request a Quote',
    imageryTreatment: 'print production and finished packaging, clean studio framing',
    imageryKeywords: ['printing press', 'packaging boxes', 'signage board', 'business cards print'],
  },
  {
    match: /\b(?:agri\w*|farming|farmers?|farms?|nurser(?:y|ies)|seeds?|fertilizers?|pesticides?|irrigation|dairy|poultry|tractors?|horticulture|kisan)\b/i,
    archetype: 'design-classic-professional',
    paletteId: 'organic-care',
    sectionOrder: SERVICE_FLOW,
    tone: 'practical, trust-building, field-experience-led',
    heroPattern: 'Field-proven solutions for {city} growers',
    trustSignals: [
      'Genuine inputs from trusted brands',
      'Practical advice from field experience',
      'Timely supply during peak season',
      'Fair, transparent pricing',
    ],
    serviceNamingStyle: 'input/service names (Seeds, Fertilizers, Crop Advisory, Equipment)',
    primaryCta: 'Talk to an Advisor',
    imageryTreatment: 'fields, crops and equipment in natural daylight; hands-on and honest',
    imageryKeywords: ['indian farmer field', 'agriculture crops', 'irrigation farm', 'nursery plants'],
  },
  {
    match: /\b(?:salons?|spas?|beauty|makeup|parlours?|parlors?|nails?|hair|tattoos?|bridal|stylists?|barbers?)\b/i,
    archetype: 'design-beauty-elegant',
    paletteId: 'soft-blush',
    sectionOrder: VISUAL_FLOW,
    tone: 'elegant, personal, aspirational',
    heroPattern: 'Look and feel your best in {city}',
    trustSignals: [
      'Certified stylists and therapists',
      'Brand-name professional products',
      'Hygiene-first, sanitised tools',
      'Personalised consultations',
    ],
    serviceNamingStyle: 'signature service names (Balayage, Hydrafacial, Bridal Styling)',
    primaryCta: 'Book an Appointment',
    imageryTreatment: 'soft natural light, editorial portrait framing, polished interiors',
    imageryKeywords: ['beauty salon interior', 'hair styling salon', 'spa treatment', 'makeup artist'],
  },
  {
    match: /\b(?:gyms?|fitness|yoga|zumba|crossfit|sports?|martial|dance|dancing|swimming|trainers?|athletics?)\b/i,
    archetype: 'design-bold-energetic',
    paletteId: 'vivid-sport',
    sectionOrder: VISUAL_FLOW,
    tone: 'high-energy, motivational, results-driven',
    heroPattern: 'Get stronger in {city} — your plan starts here',
    trustSignals: [
      'Certified coaches and trainers',
      'Equipment-led, hygienic facilities',
      'Goal-based training plans',
      'Flexible membership options',
    ],
    serviceNamingStyle: 'programme-based names (Strength Training, Personal Coaching, Group Classes)',
    primaryCta: 'Book a Free Trial',
    imageryTreatment: 'dynamic action shots, high contrast, motion and effort',
    imageryKeywords: ['gym workout', 'personal trainer', 'yoga class', 'fitness equipment'],
  },
  {
    match: /\b(?:retail|boutiques?|stores?|shops?|jewell?ers?|jewellery|gifts?|garments?|fashion|footwear|optical|opticians?|mobiles?|laptops?|books?|kirana|supermarkets?)\b/i,
    archetype: 'design-classic-professional',
    paletteId: 'premium-charcoal-gold',
    sectionOrder: PRODUCT_FLOW,
    tone: 'premium, curated, trustworthy',
    heroPattern: 'Curated selection, honest prices in {city}',
    trustSignals: [
      'Genuine, quality-checked products',
      'Transparent pricing and billing',
      'Easy exchange and repair support',
      'Trusted by repeat local customers',
    ],
    serviceNamingStyle: 'category-led listings (Collections, New Arrivals, Custom Orders)',
    primaryCta: 'Browse the Collection',
    imageryTreatment: 'product hero shots on clean backgrounds with detail close-ups',
    imageryKeywords: ['retail store interior', 'product display shelf', 'jewellery display', 'shop counter'],
  },
  {
    match: /\b(?:coaching|coaches?|tuitions?|institutes?|academ(?:y|ies)|schools?|classes|training|exams?|mentors?|skills?|learning)\b/i,
    archetype: 'design-bold-energetic',
    paletteId: 'corporate-navy',
    sectionOrder: EXPERT_FLOW,
    tone: 'outcome-focused, encouraging, credibility-led',
    heroPattern: 'Result-oriented learning for {city} students',
    trustSignals: [
      'Experienced faculty',
      'Small batches with personal attention',
      'Regular tests and progress tracking',
      'Transparent fee structure',
    ],
    serviceNamingStyle: 'programme names (Foundation Batch, Crash Course, Doubt Sessions)',
    primaryCta: 'Book a Demo Class',
    imageryTreatment: 'engaged classrooms, focused study moments, natural light',
    imageryKeywords: ['classroom teaching', 'students studying', 'coaching class', 'teacher explaining'],
  },
  {
    match: /\b(?:clinics?|doctors?|dentals?|dentists?|physiotherapy|physio|hospitals?|diagnostics?|pathology|veterinary|health|derma\w*|ortho\w*|ayurveda|homeopathy)\b/i,
    archetype: 'design-clinic-clean',
    paletteId: 'clinical-mint',
    sectionOrder: EXPERT_FLOW,
    tone: 'calm, reassuring, trust-first',
    heroPattern: 'Trusted, patient-first care in {city}',
    trustSignals: [
      'Qualified, experienced practitioners',
      'Modern, sterilised equipment',
      'Clear treatment explanations and costing',
      'Comfortable, hygienic environment',
    ],
    serviceNamingStyle: 'clear treatment names (Consultation, Procedures, Follow-up Care)',
    primaryCta: 'Book an Appointment',
    imageryTreatment: 'calm, bright, professional healthcare settings; care and cleanliness',
    imageryKeywords: ['clinic interior', 'doctor consultation', 'dental clinic', 'medical equipment'],
  },
  {
    match: /\b(?:lawyers?|advocates?|legal|chartered|accountants?|accounting|taxation|taxes?|tax|audits?|auditing|finance|financial|loans?|insurance|consult\w*|advisors?|agenc(?:y|ies)|software|marketing|bpo|advisory)\b|it services|it solutions|gst/i,
    archetype: 'design-classic-professional',
    paletteId: 'corporate-navy',
    sectionOrder: EXPERT_FLOW,
    tone: 'credible, precise, advisory',
    heroPattern: 'Dependable expertise for {city} businesses',
    trustSignals: [
      'Qualified, experienced professionals',
      'Clear scope and transparent fees',
      'Confidential, process-driven work',
      'Responsive communication',
    ],
    serviceNamingStyle: 'practice-area names (Advisory, Compliance, Representation)',
    primaryCta: 'Request a Consultation',
    imageryTreatment: 'professional environments and team-at-work moments, understated and calm',
    imageryKeywords: ['business consulting', 'office meeting', 'professional workspace', 'financial advisor'],
  },
  {
    match: /\b(?:properties|property|builders?|realtors?|apartments?|plots?|housing)\b|real estate/i,
    archetype: 'design-realestate-premium',
    paletteId: 'premium-charcoal-gold',
    sectionOrder: VISUAL_FLOW,
    tone: 'premium, aspirational, factual',
    heroPattern: 'Homes and spaces worth considering in {city}',
    trustSignals: [
      'Verified listings and documentation',
      'Transparent pricing and charges',
      'Site visits organised promptly',
      'End-to-end paperwork support',
    ],
    serviceNamingStyle: 'listing/project names (Ready to Move, New Launches, Rental Management)',
    primaryCta: 'Schedule a Site Visit',
    imageryTreatment: 'architectural exteriors and bright interiors, wide premium framing',
    imageryKeywords: ['modern apartment interior', 'building exterior', 'real estate property', 'home interior'],
  },
  {
    match: /\b(?:restaurants?|cafes?|cafeteria|baker(?:y|ies)|cakes?|foods?|caterers?|sweets?|dhaba|kitchens?|juices?|pizza\w*)\b|ice cream/i,
    archetype: 'design-restaurant-warm',
    paletteId: 'warm-artisan',
    sectionOrder: PRODUCT_FLOW,
    tone: 'appetite-driven, warm, local',
    heroPattern: 'Freshly made, loved in {city}',
    trustSignals: [
      'Fresh ingredients, prepared daily',
      'Hygienic kitchen practices',
      'Consistent taste and portioning',
      'Friendly, quick service',
    ],
    serviceNamingStyle: 'menu-led names (Specialities, Combos, Party Orders)',
    primaryCta: 'View Menu & Order',
    imageryTreatment: 'appetite-driven food close-ups, warm light, steam and texture',
    imageryKeywords: ['indian food', 'bakery items', 'restaurant interior', 'catering food'],
  },
];

const DEFAULT_RULE: IndustryBlueprintRule = {
  match: /.^/,
  archetype: DEFAULT_ARCHETYPE_ID,
  paletteId: DEFAULT_INDUSTRY_PALETTE_ID,
  sectionOrder: SERVICE_FLOW,
  tone: 'clear, credible, benefit-led',
  heroPattern: 'Trusted local service for {city}',
  trustSignals: [
    'Experienced, verified team',
    'Transparent pricing, no surprises',
    'Quality checked before delivery',
    'Responsive local support',
  ],
  serviceNamingStyle: 'clear benefit-led service names',
  primaryCta: 'Request a Callback',
  imageryTreatment: 'bright, professional working shots of the trade in a real local setting',
  imageryKeywords: [],
};

/** In-process cache: one authored blueprint per industry key. */
const blueprintCache = new Map<string, IndustryDesignBlueprint>();

/**
 * When an industry's design is only a placeholder because the AI provider was
 * temporarily unavailable, this is when authoring may be attempted again.
 * Without it, one provider outage would freeze the fallback design forever.
 */
const blueprintRetryAfter = new Map<string, number>();
const PROVISIONAL_RETRY_MS = 10 * 60 * 1000;

/**
 * Normalises a profession/business into a stable industry cache key, e.g.
 * "Car Detailing & Automobile Workshop" -> "car-detailing" so every lead in the
 * same trade shares one authored design.
 */
export function buildIndustryKey(profession?: string | null, businessName?: string | null): string {
  const words = `${profession || ''} ${businessName || ''}`
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !KEY_STOPWORDS.has(w));

  const seen = new Set<string>();
  const unique = words.filter((w) => (seen.has(w) ? false : (seen.add(w), true)));
  if (unique.length === 0) return 'general-business';
  return unique.slice(0, 2).join('-');
}

/** The deterministic, curated blueprint for an industry (no AI involved). */
export function buildDeterministicBlueprint(
  profession?: string | null,
  businessName?: string | null,
  now: () => Date = () => new Date()
): IndustryDesignBlueprint {
  const key = buildIndustryKey(profession, businessName);
  const industry = (profession || businessName || 'Local Business').trim();
  const rule =
    INDUSTRY_RULES.find((candidate) => candidate.match.test(`${industry} ${businessName || ''}`)) ||
    DEFAULT_RULE;
  const palette = getIndustryPalette(rule.paletteId);

  return {
    key,
    industry,
    archetype: rule.archetype,
    paletteId: rule.paletteId,
    accentColor: undefined,
    heroStyle: palette && isDarkPalette(rule.paletteId) ? 'fullbleed' : 'split',
    sectionOrder: [...rule.sectionOrder],
    copy: {
      tone: rule.tone,
      heroPattern: rule.heroPattern,
      trustSignals: [...rule.trustSignals],
      serviceNamingStyle: rule.serviceNamingStyle,
      primaryCta: rule.primaryCta,
    },
    imagery: {
      treatment: rule.imageryTreatment,
      keywords: [...rule.imageryKeywords],
    },
    source: 'deterministic',
    referenceBasis: palette
      ? `Curated ${palette.name} design system for ${industry}`
      : `Curated design system for ${industry}`,
    createdAt: now().toISOString(),
    version: BLUEPRINT_VERSION,
  };
}

/** Dark palettes suit a full-bleed hero; light ones read better split. */
function isDarkPalette(paletteId: string): boolean {
  const palette = getIndustryPalette(paletteId);
  if (!palette) return false;
  const bg = palette.palette.bg.replace('#', '');
  const r = parseInt(bg.slice(0, 2), 16) || 0;
  const g = parseInt(bg.slice(2, 4), 16) || 0;
  const b = parseInt(bg.slice(4, 6), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
}

const sectionIdSchema = z.enum(RENDERABLE_SECTION_IDS as [WebsiteSectionType, ...WebsiteSectionType[]]);

const aiBlueprintSchema = z.object({
  archetype: z.string().optional(),
  paletteId: z.string().optional(),
  accentColor: z.string().optional(),
  heroStyle: z.string().optional(),
  sectionOrder: z.array(z.string()).optional(),
  copy: z
    .object({
      tone: z.string().optional(),
      heroPattern: z.string().optional(),
      trustSignals: z.array(z.string()).optional(),
      serviceNamingStyle: z.string().optional(),
      primaryCta: z.string().optional(),
    })
    .optional(),
  imagery: z
    .object({
      treatment: z.string().optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
});

function cleanText(value: unknown, fallback: string, maxLength = 200): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (trimmed.length < 2) return fallback;
  return trimmed.slice(0, maxLength);
}

/** Keeps only short, searchable image keyword phrases. */
function cleanKeywords(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.replace(/[^a-zA-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase())
    .filter((item) => item.length >= 3 && item.split(' ').length <= 4);
  const unique = Array.from(new Set(cleaned)).slice(0, 6);
  return unique.length > 0 ? unique : fallback;
}

/**
 * Validates and repairs an AI-authored blueprint against the allow-lists. Every
 * field falls back independently, so one bad value never discards the design.
 * Returns null only when the payload is not an object at all.
 */
export function validateIndustryBlueprint(
  raw: unknown,
  seed: IndustryDesignBlueprint,
  now: () => Date = () => new Date()
): IndustryDesignBlueprint | null {
  const parsed = aiBlueprintSchema.safeParse(raw);
  if (!parsed.success) return null;
  const data = parsed.data;

  const archetype =
    data.archetype && PROFESSION_ARCHETYPE_IDS.includes(data.archetype)
      ? data.archetype
      : seed.archetype;

  const paletteId = isIndustryPaletteId(data.paletteId) ? data.paletteId! : seed.paletteId;

  const accentColor =
    data.accentColor && HEX_COLOR.test(data.accentColor) ? data.accentColor.toLowerCase() : undefined;

  const heroStyle = (HERO_STYLES as readonly string[]).includes(data.heroStyle || '')
    ? (data.heroStyle as IndustryDesignBlueprint['heroStyle'])
    : isDarkPalette(paletteId)
      ? 'fullbleed'
      : seed.heroStyle;

  // Sections: keep only renderable ids, dedupe, guarantee HERO opens the page
  // and that the core money sections + a coherent closing flow are present.
  const requested = (data.sectionOrder || [])
    .map((id) => sectionIdSchema.safeParse(id))
    .filter((result): result is { success: true; data: WebsiteSectionType } => result.success)
    .map((result) => result.data);
  let sectionOrder = Array.from(new Set(requested));
  if (sectionOrder.length < 4) sectionOrder = [...seed.sectionOrder];

  for (const required of ['SERVICES', 'GALLERY'] as WebsiteSectionType[]) {
    if (!sectionOrder.includes(required)) sectionOrder.push(required);
  }
  // A demo site must always offer a way to get in touch.
  if (!sectionOrder.includes('CONTACT')) sectionOrder.push('CONTACT');

  const CLOSING: WebsiteSectionType[] = ['FAQ', 'CTA', 'CONTACT', 'LOCATION'];
  const closing = CLOSING.filter((id) => sectionOrder.includes(id));
  const body = sectionOrder
    .filter((id) => id !== 'HERO' && !closing.includes(id))
    .slice(0, 8);
  sectionOrder = ['HERO', ...body, ...closing];

  const copy = data.copy || {};
  const trustSignals = Array.isArray(copy.trustSignals)
    ? copy.trustSignals
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.replace(/\s+/g, ' ').trim())
        .filter((item) => item.length >= 3)
        .slice(0, 5)
    : [];

  const imagery = data.imagery || {};
  const keywords = cleanKeywords(imagery.keywords, seed.imagery.keywords);

  return {
    ...seed,
    archetype,
    paletteId,
    accentColor,
    heroStyle,
    sectionOrder,
    copy: {
      tone: cleanText(copy.tone, seed.copy.tone, 120),
      heroPattern: cleanText(copy.heroPattern, seed.copy.heroPattern, 160),
      trustSignals: trustSignals.length >= 2 ? trustSignals : seed.copy.trustSignals,
      serviceNamingStyle: cleanText(copy.serviceNamingStyle, seed.copy.serviceNamingStyle, 200),
      primaryCta: cleanText(copy.primaryCta, seed.copy.primaryCta, 60),
    },
    imagery: {
      treatment: cleanText(imagery.treatment, seed.imagery.treatment, 300),
      keywords,
    },
    source: 'ai',
    referenceBasis: `Designed from how leading ${seed.industry} websites are built`,
    createdAt: now().toISOString(),
    version: BLUEPRINT_VERSION,
  };
}

/**
 * Resolves the design blueprint for an industry.
 *
 * Order: in-process cache -> persisted blueprint (Postgres / demo ledger) ->
 * AI-authored (once per industry, validated) -> curated deterministic fallback.
 * Never throws: generation must never fail because of design research.
 */
export async function getIndustryDesignBlueprint(
  input: GetIndustryBlueprintInput,
  deps: IndustryBlueprintDeps = {}
): Promise<IndustryDesignBlueprint> {
  const now = deps.now || (() => new Date());
  const key = buildIndustryKey(input.profession, input.businessName);
  const seed = buildDeterministicBlueprint(input.profession, input.businessName, now);

  const cached = blueprintCache.get(key);
  const retryAt = blueprintRetryAfter.get(key);
  // A placeholder may be re-authored once its cooldown has passed.
  if (cached && !(retryAt !== undefined && Date.now() >= retryAt)) return cached;

  try {
    const persisted = await IndustryBlueprintRepository.getIndustryBlueprint(key);
    if (persisted && persisted.blueprint && persisted.blueprint.archetype) {
      const revived = revivePersistedBlueprint(persisted.blueprint, key, seed);
      blueprintCache.set(key, revived);
      // A design is persisted: there is nothing left to re-author.
      blueprintRetryAfter.delete(key);
      return revived;
    }
  } catch {
    // Lookup failures must never block generation.
  }

  let authored: IndustryDesignBlueprint | null = null;
  let aiAttempted = false;
  const aiAllowed =
    process.env.NODE_ENV !== 'test' && process.env.DISABLE_INDUSTRY_BLUEPRINT_AI !== 'true';
  const aiAuthor = deps.aiAuthor ?? generateIndustryBlueprintJson;

  if (aiAllowed || deps.aiAuthor) {
    aiAttempted = true;
    try {
      const raw = await aiAuthor({
        profession: seed.industry,
        city: input.city || undefined,
        archetypeIds: PROFESSION_ARCHETYPE_IDS,
        paletteIds: INDUSTRY_PALETTE_IDS,
        sectionIds: RENDERABLE_SECTION_IDS,
      });
      if (raw) authored = validateIndustryBlueprint(raw, seed, now);
    } catch {
      authored = null;
    }
  }

  const blueprint = authored || seed;
  blueprintCache.set(key, blueprint);

  // A failure that may pass on its own must not be frozen into the design. Keep
  // the fallback for now, remember when to try again, and skip persistence so a
  // later attempt — here or in another instance — can still improve it.
  const failureIsTransient = deps.aiAuthor
    ? Boolean(deps.aiFailureIsTransient?.())
    : blueprintAuthoringFailureIsTransient();

  if (aiAttempted && !authored && failureIsTransient) {
    blueprintRetryAfter.set(key, Date.now() + PROVISIONAL_RETRY_MS);
    return blueprint;
  }

  blueprintRetryAfter.delete(key);

  try {
    // Persist so every later lead in this industry (and every serverless
    // instance) reuses the same design. First writer wins on a race.
    const saved = await IndustryBlueprintRepository.saveIndustryBlueprint({
      key,
      industry: blueprint.industry,
      blueprint,
      source: blueprint.source,
      version: blueprint.version,
      createdAt: blueprint.createdAt,
    });
    if (saved?.blueprint?.archetype && saved.blueprint.source !== blueprint.source) {
      // Another instance authored it first — adopt theirs for consistency.
      const winner = revivePersistedBlueprint(saved.blueprint, key, seed);
      blueprintCache.set(key, winner);
      return winner;
    }
  } catch {
    // Persistence is an optimisation; the design still applies for this request.
  }

  return blueprint;
}

/** Defensively rebuilds a persisted blueprint (it may predate newer fields). */
function revivePersistedBlueprint(
  stored: Partial<IndustryDesignBlueprint>,
  key: string,
  seed: IndustryDesignBlueprint
): IndustryDesignBlueprint {
  return {
    ...seed,
    ...stored,
    key,
    industry: stored.industry || seed.industry,
    archetype:
      stored.archetype && PROFESSION_ARCHETYPE_IDS.includes(stored.archetype)
        ? stored.archetype
        : seed.archetype,
    paletteId: isIndustryPaletteId(stored.paletteId) ? stored.paletteId! : seed.paletteId,
    accentColor:
      stored.accentColor && HEX_COLOR.test(stored.accentColor) ? stored.accentColor : undefined,
    sectionOrder:
      Array.isArray(stored.sectionOrder) && stored.sectionOrder.length >= 4
        ? stored.sectionOrder.filter((id) => RENDERABLE_SECTION_IDS.includes(id))
        : seed.sectionOrder,
    copy: { ...seed.copy, ...(stored.copy || {}) },
    imagery: { ...seed.imagery, ...(stored.imagery || {}) },
    source: stored.source === 'ai' ? 'ai' : 'deterministic',
    version: stored.version || seed.version,
    createdAt: stored.createdAt || seed.createdAt,
    referenceBasis: stored.referenceBasis || seed.referenceBasis,
  };
}

/** Tests only: clears the in-process blueprint cache. */
export function clearIndustryBlueprintCache(): void {
  blueprintCache.clear();
  blueprintRetryAfter.clear();
}

/**
 * Forgets an industry's stored design and authors it again (owner-triggered).
 *
 * Used to pick up a better design than the one that was cached first — e.g.
 * after configuring the AI provider, or after the curated rules for a trade
 * improved. Returns the newly authored blueprint.
 */
export async function reauthorIndustryDesignBlueprint(
  input: GetIndustryBlueprintInput,
  deps: IndustryBlueprintDeps = {}
): Promise<IndustryDesignBlueprint> {
  const key = buildIndustryKey(input.profession, input.businessName);
  blueprintCache.delete(key);
  blueprintRetryAfter.delete(key);
  try {
    await IndustryBlueprintRepository.deleteIndustryBlueprint(key);
  } catch {
    // Even if the old row could not be removed, author a fresh one below.
  }
  return getIndustryDesignBlueprint(input, deps);
}

/**
 * Compact brief handed to the copy writer so headlines, trust signals and CTAs
 * read the way the industry's best websites do.
 */
export function buildBlueprintIndustryBrief(
  blueprint: IndustryDesignBlueprint,
  city?: string | null
): string {
  const brief = [
    `- Voice: ${blueprint.copy.tone}`,
    `- Headline pattern: ${blueprint.copy.heroPattern}`,
    `- Trust signals to reflect: ${blueprint.copy.trustSignals.join('; ')}`,
    `- Service naming: ${blueprint.copy.serviceNamingStyle}`,
    `- Primary CTA wording: ${blueprint.copy.primaryCta}`,
    `- Imagery: ${blueprint.imagery.treatment}`,
  ].join('\n');

  return city ? brief.replace(/\{city\}/gi, city) : brief;
}
