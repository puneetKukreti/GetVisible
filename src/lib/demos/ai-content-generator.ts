/**
 * Gemini AI Website Content Generator (models discovered at runtime)
 *
 * Dynamically synthesizes 100% authentic, profession-specific website copy
 * (Headlines, 4 Services, 4 Why-Choose-Us trust points, 4 Process steps, 3 FAQs)
 * tailored to ANY Indian business name, profession, and city.
 *
 * Includes an extensive deterministic fallback dictionary covering 22+ SMB industries
 * so that non-CA professions NEVER fall back to Chartered Accountant content.
 */

import fs from 'fs';
import path from 'path';
import { PROFESSION_ARCHETYPE_IDS } from './profession-stitch';

export interface AiDesignRecommendation {
  layout?: string;
  template?: string;
  themeId?: string;
  heroLayout?: string;
  servicesLayout?: string;
  contentDensity?: 'compact' | 'comfortable' | 'spacious';
  /** Profession Stitch archetype the model judged the best visual fit. */
  archetype?: string;
  /** Optional brand accent (6-digit hex) layered onto the chosen archetype. */
  accentColor?: string;
}

export interface AiGalleryItem {
  title: string;
  category?: string;
  description?: string;
  /** Short visual brief used to source a profession-appropriate image. */
  imageQuery?: string;
}

export interface AiMenuCategory {
  name: string;
  items: { name: string; description?: string; price: string; badge?: string }[];
}

export interface AiBusinessContent {
  heroBadge: string;
  heroHeadline: string;
  heroSubheadline: string;
  primaryCtaLabel: string;
  aboutLead: string;
  aboutBody: string;
  highlights: { title: string; description: string }[];
  servicesSectionTitle: string;
  servicesSectionSubtitle: string;
  services: { title: string; description: string }[];
  whyChooseUs: { title: string; description: string }[];
  processSteps: { number: string; title: string; description: string }[];
  faqs: { question: string; answer: string }[];

  // ---- Profession-aware structured extensions (optional; AI may supply) ----
  /** Ordered list of website sections the AI judged appropriate for this profession. */
  sections?: string[];
  /** Design configuration recommendations for the deterministic renderer. */
  design?: AiDesignRecommendation;
  seo?: { title?: string; description?: string };
  navItems?: { label: string; href?: string }[];
  expertise?: {
    sectionTitle?: string;
    sectionSubtitle?: string;
    items: { title: string; description: string; tags?: string[] }[];
  };
  gallery?: {
    sectionTitle?: string;
    sectionSubtitle?: string;
    items: AiGalleryItem[];
  };
  menu?: {
    sectionTitle?: string;
    sectionSubtitle?: string;
    categories: AiMenuCategory[];
  };
  industries?: { sectionTitle?: string; items: string[] };
  ctaBanner?: {
    title?: string;
    subtitle?: string;
    primaryCtaLabel?: string;
    secondaryCtaLabel?: string;
  };
  trustBadges?: { title: string; description: string; iconName?: string }[];
}

export interface GenerateAiContentFacts {
  businessName: string;
  profession: string;
  city: string;
  address?: string | null;
}

/**
 * Reads Gemini API key with filesystem fallback to .env.local and .env
 * in case the process environment was initialized before the key was saved.
 */
export function getGeminiApiKey(): string | null {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    return process.env.GEMINI_API_KEY.trim();
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GOOGLE_GENERATIVE_AI_API_KEY.trim().length > 0) {
    return process.env.GOOGLE_GENERATIVE_AI_API_KEY.trim();
  }
  try {
    for (const file of ['.env.local', '.env']) {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        const text = fs.readFileSync(fullPath, 'utf8');
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          const m = line.match(/^\s*(?:GEMINI_API_KEY|GOOGLE_GENERATIVE_AI_API_KEY)\s*=\s*(.*)$/);
          if (m && m[1]) {
            const val = m[1].trim().replace(/^['"]|['"]$/g, '');
            if (val.length > 5) {
              return val;
            }
          }
        }
      }
    }
  } catch {}
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Gemini model selection                                                    */
/* -------------------------------------------------------------------------- */

const GEMINI_API_VERSION = 'v1beta';
const GEMINI_MODELS_URL = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models`;

/**
 * Last resort only. Model names are retired without notice, and a retired name
 * answers 404 — which looks exactly like an invalid key unless you read the
 * response body. Asking the API what it offers is therefore the primary path,
 * and these names are used only when that question itself cannot be answered.
 */
export const GEMINI_FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

/** Names that technically support generateContent but are never what we want. */
const GEMINI_UNWANTED_MODEL = /embedding|aqa|imagen|veo|tts|audio|live|image-generation/i;

/**
 * How willing we are to use a model *family*: the ones that answer a JSON prompt
 * quickly come before anything exotic, and version only breaks ties within a
 * family. Version alone is not enough — a newer unknown name was tried first and
 * answered 429 while the flash models were fine.
 */
function geminiModelFamilyTier(name: string): number {
  if (/flash-lite/.test(name)) return 3;
  if (/flash/.test(name)) return 4;
  if (/pro/.test(name)) return 2;
  return 1;
}

function geminiModelVersion(name: string): number {
  const match = name.match(/^gemini-(\d+)(?:\.(\d+))?/);
  return (match ? Number(match[1]) : 0) * 100 + (match && match[2] ? Number(match[2]) : 0);
}

function compareGeminiModels(a: string, b: string): number {
  const tier = geminiModelFamilyTier(b) - geminiModelFamilyTier(a);
  if (tier !== 0) return tier;
  return geminiModelVersion(b) - geminiModelVersion(a);
}

/**
 * Per-attempt ceiling. Generous enough for the preferred model to answer when
 * it is merely slow, while still leaving room for a retry inside the budget.
 */
const GEMINI_ATTEMPT_TIMEOUT_MS = 15000;

/**
 * Transient conditions meaning "the request was fine, try again": capacity
 * spikes and rate limits. A real answer or a real rejection (400/403/404) is
 * returned immediately, because retrying those changes nothing.
 */
const GEMINI_TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504]);

/** One extra try per model, plus a ceiling for the whole authoring attempt. */
const GEMINI_ATTEMPT_TRIES = 2;
const GEMINI_RETRY_DELAY_MS = 600;
const GEMINI_TOTAL_BUDGET_MS = 25000;

function geminiGenerateUrl(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${apiKey.trim()}`;
}

/** Wall-clock point past which no further model call is started. */
export function geminiAuthoringDeadline(now: number = Date.now()): number {
  return now + GEMINI_TOTAL_BUDGET_MS;
}

/**
 * One model, one prompt. Retries what may pass — a busy provider, a rate limit,
 * or a call that stalled — and never starts a try it cannot finish before the
 * deadline, so an overloaded provider cannot consume the request's whole budget.
 * Returns null when there was no time even to try, and throws the last
 * transport error when every try failed to get a response at all.
 */
async function callGeminiModel(params: {
  model: string;
  apiKey: string;
  prompt: string;
  temperature: number;
  deadline: number;
}): Promise<Response | null> {
  const { model, apiKey, prompt, temperature, deadline } = params;
  const url = geminiGenerateUrl(model, apiKey);
  let res: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < GEMINI_ATTEMPT_TRIES; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;

    const wait = () => {
      const ms = Math.min(
        GEMINI_RETRY_DELAY_MS * (attempt + 1),
        Math.max(0, deadline - Date.now())
      );
      return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
    };

    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature },
        }),
        signal: AbortSignal.timeout(Math.max(1500, Math.min(GEMINI_ATTEMPT_TIMEOUT_MS, remaining))),
      });
      lastError = null;
    } catch (err) {
      // Stalled or unreachable: no response to judge, so try again.
      lastError = err;
      res = null;
      await wait();
      continue;
    }

    if (!GEMINI_TRANSIENT_STATUS.has(res.status)) return res;
    await wait();
  }

  if (res) return res;
  if (lastError) throw lastError;
  return null;
}

let geminiModelCache: { key: string; models: string[] } | null = null;

/**
 * Asks the API which models this key may call, most suitable first. Cached for
 * the life of the process and never throws: an empty list means "fall back".
 */
export async function listGeminiModels(apiKey: string): Promise<string[]> {
  const key = apiKey.trim();
  if (geminiModelCache && geminiModelCache.key === key) return geminiModelCache.models;

  let models: string[] = [];
  try {
    const res = await fetch(`${GEMINI_MODELS_URL}?key=${key}&pageSize=200`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const all: any[] = Array.isArray(data?.models) ? data.models : [];
      models = all
        .filter(
          (m) =>
            typeof m?.name === 'string' &&
            Array.isArray(m?.supportedGenerationMethods) &&
            m.supportedGenerationMethods.includes('generateContent')
        )
        .map((m): string => String(m.name).replace(/^models\//, ''))
        .filter((name) => name.startsWith('gemini-') && !GEMINI_UNWANTED_MODEL.test(name))
        .sort(compareGeminiModels);
    }
  } catch {
    models = [];
  }

  geminiModelCache = { key, models };
  return models;
}

/** The model we want, tried first whenever the API confirms it exists. */
const GEMINI_PREFERRED_MODELS = ['gemini-3.8-flash'];

function dedupeModels(names: string[]): string[] {
  return Array.from(new Set(names));
}

/** The ordered models to try: what the API offers, else the fallback names. */
export async function resolveGeminiModels(apiKey: string): Promise<string[]> {
  const discovered = await listGeminiModels(apiKey);
  if (discovered.length > 0) {
    // The preferred model leads, so a newer name cannot displace it.
    const preferred = GEMINI_PREFERRED_MODELS.filter((name) => discovered.includes(name));
    const rest = discovered.filter((name) => !preferred.includes(name));
    return [...preferred, ...rest].slice(0, 3);
  }
  // Discovery failed: still try the preferred model, then the known names.
  return dedupeModels([...GEMINI_PREFERRED_MODELS, ...GEMINI_FALLBACK_MODELS]);
}

/** Test seam: forget the discovered model list. */
export function resetGeminiModelCache(): void {
  geminiModelCache = null;
}

/**
 * Google's actual reason lives in the body ("models/x is not found for API
 * version v1beta"), while statusText is only a generic "Not Found". Reading the
 * body is what makes a 404 diagnosable. Scrubbed, because the request URL
 * carries the key.
 */
async function describeGeminiFailure(res: Response): Promise<string> {
  const fallback = `${res.status} ${res.statusText}`.trim();
  try {
    const raw = await res.text();
    if (!raw) return fallback;
    let message = raw;
    try {
      const parsed = JSON.parse(raw);
      const fromApi = parsed?.error?.message;
      if (typeof fromApi === 'string' && fromApi.trim()) message = fromApi;
    } catch {
      // Not JSON — the raw text is the best description available.
    }
    return `${res.status} ${scrubSecretText(message)}`;
  } catch {
    return fallback;
  }
}

/**
 * Deterministic profession-tailored profile generator.
 * Provides authentic, high-converting copy across all 22 SMB industries
 * ensuring non-CA professions never receive CA details even if no API key is set.
 */
export function getDeterministicProfessionProfile(facts: GenerateAiContentFacts): AiBusinessContent {
  const businessName = facts.businessName?.trim() || 'Local Enterprise';
  const rawProfession = facts.profession?.trim() || 'Professional Practice';
  const city = facts.city?.trim() || 'Delhi NCR';
  const text = `${rawProfession} ${businessName}`.toLowerCase();

  // Hospitality businesses often contain the word "kitchen" (e.g. "Spice Route
  // Kitchen & Grill") but must not be captured by the modular-kitchen interior
  // profile below, nor by other interior-led branches.
  const isHospitalityBusiness =
    /restaurant|diner|dine|bistro|grill|cafe|coffee|food|catering|pizzeria|cloud kitchen|multi-?cuisine|eatery|thali|dhaba|bakery|bar\b|brasserie|lounge/i.test(
      text
    );

  // 0. Chartered Accountant / Tax & Audit Practice
  if (/chartered accountant|chartered accountancy|ca firm|\bca\b|tax consultant|tax practitioner|audit firm|auditing firm|accounting firm|statutory audit|bookkeep|\bitr\b|\bgst\b|corporate tax|tax & audit/i.test(text)) {
    return {
      heroBadge: `Chartered Accountants & Advisory • ${city}`,
      heroHeadline: `Trusted Chartered Accountancy & Advisory for Growing Businesses`,
      heroSubheadline: `Partner-led audit, tax, and compliance guidance delivered with clarity and discretion for clients across ${city}.`,
      primaryCtaLabel: 'Schedule a Consultation',
      aboutLead: `${businessName} is a chartered accountancy practice based in ${city}, serving businesses and professionals with dependable financial guidance.`,
      aboutBody: `Our approach is structured, transparent, and compliance-first. We help clients stay on top of their statutory obligations while making sound, well-explained financial decisions.`,
      highlights: [
        { title: 'Partner-Led Attention', description: 'Direct involvement of senior professionals on every engagement.' },
        { title: 'Compliance Discipline', description: 'Organised, deadline-driven handling of statutory and tax requirements.' },
        { title: 'Clear Communication', description: 'Plain-language explanations of financial and regulatory matters.' },
        { title: 'Confidential Handling', description: 'Careful, discreet treatment of all client information.' },
      ],
      servicesSectionTitle: 'Our Core Services',
      servicesSectionSubtitle: 'Comprehensive assurance, tax, and advisory support for businesses and professionals.',
      services: [
        { title: 'Statutory & Tax Audit', description: 'Independent audit and assurance engagements conducted with rigour and independence.' },
        { title: 'Direct Tax & ITR Filing', description: 'Preparation and filing of income tax returns with careful review and documentation.' },
        { title: 'GST Advisory & Returns', description: 'Registration, periodic returns, and advisory on indirect tax matters.' },
        { title: 'Accounting & Bookkeeping', description: 'Reliable bookkeeping and periodic financial reporting for smooth compliance.' },
        { title: 'Company Law & ROC Compliance', description: 'Support with incorporation, annual filings, and corporate secretarial compliance.' },
        { title: 'Financial Advisory & MIS', description: 'Practical reporting and advisory to support informed decision-making.' },
      ],
      whyChooseUs: [
        { title: 'Ethical Practice', description: 'Guidance aligned with professional standards and a strict confidentiality commitment.' },
        { title: 'Structured Process', description: 'Documented checklists and timelines that keep engagements predictable.' },
        { title: 'Responsive Team', description: 'Timely replies and proactive reminders around key compliance dates.' },
        { title: 'Long-Term Support', description: `Ongoing advisory for businesses growing across ${city} and beyond.` },
      ],
      processSteps: [
        { number: '01', title: 'Initial Consultation', description: 'We understand your entity, obligations, and immediate priorities.' },
        { number: '02', title: 'Scope & Engagement', description: 'A clear, itemised scope of work and responsibilities is agreed upfront.' },
        { number: '03', title: 'Execution & Review', description: 'Work is carried out with review checkpoints for accuracy.' },
        { number: '04', title: 'Filing & Follow-Up', description: 'Filings completed on time, with reminders for upcoming deadlines.' },
      ],
      faqs: [
        { question: 'How do I engage your practice?', answer: `You can contact ${businessName} to arrange an initial consultation; we will outline the scope and information required.` },
        { question: 'Do you assist with ongoing compliance?', answer: 'Yes, we support recurring compliance such as periodic returns, bookkeeping, and annual filings on a retained basis.' },
        { question: 'Which clients do you typically serve?', answer: 'We work with proprietors, partnerships, companies, and professionals needing dependable assurance, tax, and advisory support.' },
      ],
    };
  }

  // 1. Dentist & Dental Clinic
  if (/dent|dental|orthodont|teeth|oral|smile/i.test(text)) {
    return {
      heroBadge: `Modern Dental & Smile Clinic • ${city}`,
      heroHeadline: `Gentle, Advanced & Pain-Free Dental Care in ${city}`,
      heroSubheadline: `From precision root canals to laser cosmetic dentistry, ${businessName} provides patient-first dental care for your whole family.`,
      primaryCtaLabel: 'Book Dental Appointment',
      aboutLead: `${businessName} is a leading dental and oral healthcare practice based in ${city}.`,
      aboutBody: `Equipped with modern digital radiography, painless anesthesia, and sterilized operatory suites, our team delivers predictable, long-lasting clinical outcomes with zero anxiety.`,
      highlights: [
        { title: 'Painless Treatments', description: 'Advanced computerized anesthesia and minimally invasive techniques.' },
        { title: 'Digital Smile Design', description: '3D scanning and computer-guided orthodontic planning.' },
        { title: 'Strict Sterilization', description: 'Class-B hospital-grade autoclave sterilization protocols.' },
        { title: 'Transparent Pricing', description: 'Upfront estimates with zero hidden consultation charges.' },
      ],
      servicesSectionTitle: 'Comprehensive Dental Specialties',
      servicesSectionSubtitle: 'Evidence-based treatments delivered with comfort and clinical precision.',
      services: [
        { title: 'Root Canal Therapy (RCT)', description: 'Single-sitting, microscopic root canal treatments designed for total comfort and tooth preservation.' },
        { title: 'Dental Implants & Prosthetics', description: 'Permanent titanium and zirconia implants restoring full biting strength and natural appearance.' },
        { title: 'Clear Aligners & Orthodontics', description: 'Invisible orthodontic aligners for teeth straightening without traditional metal brackets.' },
        { title: 'Teeth Whitening & Smile Makeovers', description: 'Professional laser whitening and handcrafted ceramic veneers for a radiant smile.' },
      ],
      whyChooseUs: [
        { title: 'Experienced Specialists', description: 'Led by certified dental surgeons and orthodontists with proven clinical track records.' },
        { title: 'State-of-the-Art Tech', description: 'Low-radiation digital CBCT and high-definition intraoral cameras.' },
        { title: 'Comfort-First Care', description: 'Relaxing clinical atmosphere designed to eliminate dental phobia for adults and children.' },
        { title: 'Emergency Care', description: `Prompt relief for severe toothaches, trauma, and dental emergencies in ${city}.` },
      ],
      processSteps: [
        { number: '01', title: 'Consultation & Digital Scan', description: 'In-depth clinical examination, intraoral photos, and digital imaging.' },
        { number: '02', title: 'Personalized Treatment Plan', description: 'Transparent discussion of all clinical options, timelines, and costs.' },
        { number: '03', title: 'Gentle Clinical Treatment', description: 'Painless execution using precision instruments and comfort protocols.' },
        { number: '04', title: 'Post-Care & Prevention', description: 'Preventive follow-ups and hygiene guidance to protect your smile long-term.' },
      ],
      faqs: [
        { question: 'Is root canal treatment painful?', answer: 'Not at all. With modern local anesthesia and rotary microscopic endodontics, most patients feel no discomfort during the procedure.' },
        { question: 'How do I book an appointment?', answer: `You can call ${businessName} directly or book online via WhatsApp for immediate confirmation.` },
        { question: 'Do you offer emergency dental services?', answer: `Yes, we prioritize urgent dental emergencies, severe pain, and sudden trauma in ${city}.` },
      ],
    };
  }

  // 2. Gym & Fitness Center
  if (/gym|fitness|crossfit|workout|strength|muscle|bodybuilding/i.test(text)) {
    return {
      heroBadge: `Elite Fitness & Strength Club • ${city}`,
      heroHeadline: `Transform Your Body & Elevate Your Fitness at ${businessName}`,
      heroSubheadline: `World-class strength equipment, certified personal coaches, and motivating workout zones right here in ${city}.`,
      primaryCtaLabel: 'Claim Free 1-Day Pass',
      aboutLead: `${businessName} is ${city}'s premier health, strength, and conditioning destination.`,
      aboutBody: `Whether your goal is fat loss, muscle hypertrophy, or functional athletic endurance, our spacious training floor and certified trainers provide the guidance and energy you need.`,
      highlights: [
        { title: 'Imported Biomechanical Gear', description: 'Plate-loaded and selectorized strength machines calibrated for injury prevention.' },
        { title: 'Certified Personal Trainers', description: 'Accredited fitness coaches specializing in body recomposition and nutrition.' },
        { title: 'Hygienic Training Floor', description: 'Sanitized equipment, clean air filtration, and spacious locker rooms.' },
        { title: 'Custom Workout Programs', description: 'Tailored routines matched to your fitness level, schedule, and goals.' },
      ],
      servicesSectionTitle: 'Programs & Training Zones',
      servicesSectionSubtitle: 'Structured disciplines engineered to help you build strength, stamina, and confidence.',
      services: [
        { title: 'Hypertrophy & Strength Training', description: 'Dedicated free-weight zone with Olympic barbells, dumbbells up to 50kg, and power racks.' },
        { title: '1-on-1 Personal Coaching', description: 'Dedicated personal trainer supervision, form correction, and weekly progress accountability.' },
        { title: 'Cardio & HIIT Conditioning', description: 'Modern treadmills, curved running decks, stairmasters, and rowing machines.' },
        { title: 'Custom Nutrition & Diet Plans', description: 'Evidence-based macronutrient breakdowns and meal plans to fuel your fitness transformation.' },
      ],
      whyChooseUs: [
        { title: 'Results-Driven Culture', description: `A motivating, goal-focused environment for members across ${city}.` },
        { title: 'No Crowded Queues', description: 'Spacious multi-floor layout with multiple duplicate stations for peak training hours.' },
        { title: 'Community Support', description: 'Motivating, judgment-free environment welcoming beginners and elite athletes alike.' },
        { title: 'Flexible Memberships', description: 'Transparent monthly, quarterly, and annual packages with zero hidden joining fees.' },
      ],
      processSteps: [
        { number: '01', title: 'Body Composition Analysis', description: 'InBody body fat, visceral fat, and muscle mass evaluation.' },
        { number: '02', title: 'Goal Setting & Routine Plan', description: 'Customized training splits crafted around your lifestyle and baseline.' },
        { number: '03', title: 'Guided Coaching & Workouts', description: 'Proper technique instruction to lift safely and maximize muscular stimulus.' },
        { number: '04', title: 'Bi-Weekly Progress Reviews', description: 'Measurements and diet adjustments to ensure consistent forward momentum.' },
      ],
      faqs: [
        { question: 'What are your operational gym hours?', answer: 'We are open from 6:00 AM to 10:30 PM Monday through Saturday, and 7:00 AM to 8:00 PM on Sundays.' },
        { question: 'Can beginners join without prior gym experience?', answer: 'Absolutely! Our floor trainers will guide you through machine setup and safe lifting fundamentals from Day 1.' },
        { question: 'Do you offer trial workouts?', answer: `Yes, contact ${businessName} to schedule your complimentary trial session today.` },
      ],
    };
  }

  // 3. Salon, Spa & Beauty Care
  if (/salon|spa|beauty|parlour|parlor|hair|makeup|skincare/i.test(text)) {
    return {
      heroBadge: `Luxury Hair & Beauty Studio • ${city}`,
      heroHeadline: `Flawless Styling, Hair Care & Glow Treatments at ${businessName}`,
      heroSubheadline: `Indulge in premium hair couture, bespoke bridal makeup, and rejuvenating aesthetic treatments in ${city}.`,
      primaryCtaLabel: 'Book Salon Appointment',
      aboutLead: `${businessName} is a boutique beauty and aesthetic styling sanctuary located in ${city}.`,
      aboutBody: `Using only international cruelty-free products and modern styling equipment, our master artists create personalized looks that accentuate your natural beauty and boost your confidence.`,
      highlights: [
        { title: 'Master Stylists', description: 'Trained and certified in European cutting, balayage, and advanced skin aesthetics.' },
        { title: 'Premium Products Only', description: 'Authentic salon-grade serums, ammonia-free hair colors, and organic facials.' },
        { title: 'Hygienic Disposable Kits', description: 'Single-use sterilized kits and pristine private treatment booths.' },
        { title: 'Bespoke Consultations', description: 'Personalized hair texture and skin tone analysis before every service.' },
      ],
      servicesSectionTitle: 'Signature Beauty Services',
      servicesSectionSubtitle: 'Curated beauty rituals designed to pamper, refresh, and redefine your look.',
      services: [
        { title: 'Hair Couture & Balayage', description: 'Precision styling, creative highlights, global color, and keratin smoothing treatments.' },
        { title: 'Hydra-Facials & Glow Therapy', description: 'Deep pore cleansing, lymphatic drainage, and antioxidant infusions for luminous skin.' },
        { title: 'Bridal & Occasion Makeup', description: 'High-definition airbrush makeup and bespoke styling for weddings and milestone celebrations.' },
        { title: 'Spa Rituals & Manicure/Pedicure', description: 'Aromatherapy body massages, crystal spa pedicures, and soothing relaxation rituals.' },
      ],
      whyChooseUs: [
        { title: 'Personalized Artistry', description: 'Every haircut, color, and makeup look is tailored to your face shape and personal style.' },
        { title: 'Sanitized Luxury Environment', description: 'Plush seating, calming background music, and supreme hygiene standards.' },
        { title: 'Client Trust & Satisfaction', description: `A loyal, returning client base built across ${city} and the surrounding region.` },
        { title: 'Prompt Appointments', description: 'Zero waiting times with reserved slot scheduling.' },
      ],
      processSteps: [
        { number: '01', title: 'Look Consultation', description: 'Discussion of your desired style, hair texture, and skin sensitivity.' },
        { number: '02', title: 'Custom Preparation', description: 'Skin prep, hair wash, and shade formulation using genuine products.' },
        { number: '03', title: 'Master Application', description: 'Artisanal styling, precision cut, or clinical skincare treatment.' },
        { number: '04', title: 'Finishing & Home-Care Tips', description: 'Styling finish and recommendations to maintain salon shine at home.' },
      ],
      faqs: [
        { question: 'Do I need to book in advance?', answer: 'Prior booking is recommended to guarantee zero waiting time, though walk-ins are accommodated based on availability.' },
        { question: 'Which hair color brands do you use?', answer: 'We exclusively use international ammonia-free salon brands such as L’Oréal Professionnel and Schwarzkopf.' },
        { question: 'Do you offer bridal makeup packages?', answer: `Yes, ${businessName} provides comprehensive pre-bridal skincare and bridal makeup packages.` },
      ],
    };
  }

  // 4. Pest Control Services
  if (/pest|termite|rodent|cockroach|bedbug|fumigation/i.test(text)) {
    return {
      heroBadge: `Government Licensed Pest Control • ${city}`,
      heroHeadline: `100% Odorless & Guaranteed Pest Eradication in ${city}`,
      heroSubheadline: `Safe for kids and pets. ${businessName} provides lasting protection against termites, cockroaches, rodents, and bedbugs.`,
      primaryCtaLabel: 'Get Instant Free Quote',
      aboutLead: `${businessName} is a certified, eco-conscious pest management company serving ${city} and surrounding areas.`,
      aboutBody: `We use CIB-approved herbal gels, odorless micro-encapsulated sprays, and advanced thermal detection to eliminate pest colonies at their source without disrupting your daily routine.`,
      highlights: [
        { title: 'Government Certified', description: 'Licensed by the Central Insecticides Board (CIB) with certified technicians.' },
        { title: 'Odorless & Non-Toxic', description: 'No need to vacate your home or unpack kitchen cabinets.' },
        { title: 'Long-Term Warranty', description: 'Free retreatment warranty on all residential and commercial annual packages.' },
        { title: 'Same-Day Dispatch', description: `Rapid emergency response across all sectors and neighborhoods in ${city}.` },
      ],
      servicesSectionTitle: 'Targeted Pest Solutions',
      servicesSectionSubtitle: 'Scientific eradication methods that terminate infestations and prevent recurrence.',
      services: [
        { title: 'Drill-Fill-Seal Termite Protection', description: 'Pre-construction and post-construction chemical barrier treatment with 5-year replacement guarantee.' },
        { title: 'Herbal Cockroach Gel Treatment', description: 'Advanced bait formulation placed in discrete corners targeting the nesting nest with zero smell.' },
        { title: 'Bedbug Heat & Spray Eradication', description: 'Two-stage intensive treatment targeting eggs, nymphs, and adults in mattresses and headboards.' },
        { title: 'Rodent & Commercial Facility Control', description: 'Tamper-resistant bait stations and mechanical traps for warehouses, restaurants, and offices.' },
      ],
      whyChooseUs: [
        { title: 'Child & Pet Friendly', description: 'Formulations engineered to be completely safe around infants, seniors, and domestic pets.' },
        { title: 'Certified Field Staff', description: 'Background-verified, uniformed technicians equipped with modern protective equipment.' },
        { title: 'Written Service Warranty', description: 'Complimentary revisits if any pest activity returns during the contract period.' },
        { title: 'Transparent Pricing', description: 'Fixed pricing based on square footage with no on-site surprise charges.' },
      ],
      processSteps: [
        { number: '01', title: 'On-Site Inspection', description: 'Thorough mapping of infestation harborage points, cracks, and moisture sources.' },
        { number: '02', title: 'Targeted Application', description: 'Application of targeted odorless bait gels and barrier chemicals.' },
        { number: '03', title: 'Sanitation & Proofing', description: 'Sealing of entry voids and preventative sanitation recommendations.' },
        { number: '04', title: 'Warranty Follow-Up', description: 'Scheduled check-in and complimentary maintenance visits under contract.' },
      ],
      faqs: [
        { question: 'Do we have to leave the house during treatment?', answer: 'No! Our cockroach gel and general pest treatments are 100% odorless and safe for you to remain inside.' },
        { question: 'How long does termite treatment last?', answer: 'Our drill-fill-seal termite treatments come with a 3-year or 5-year written service warranty.' },
        { question: `How quickly can your team arrive in ${city}?`, answer: 'We offer same-day service and can arrive at your doorstep within a few hours of confirmation.' },
      ],
    };
  }

  // 5. Modular Kitchen & Wardrobe (interior fit-out, NOT a restaurant kitchen)
  if (!isHospitalityBusiness && /kitchen|wardrobe|cabinet|woodwork|modular/i.test(text)) {
    return {
      heroBadge: `Factory-Crafted Modular Interiors • ${city}`,
      heroHeadline: `Bespoke Modular Kitchens & Wardrobes Built for a Lifetime`,
      heroSubheadline: `German hardware, boiling waterproof marine ply, and precision 3D space planning crafted by ${businessName} in ${city}.`,
      primaryCtaLabel: 'Get Free 3D Design & Quote',
      aboutLead: `${businessName} specializes in luxury modular kitchens, walk-in wardrobes, and bespoke cabinetry in ${city}.`,
      aboutBody: `We bridge world-class European engineering with ergonomic Indian cooking needs. Every modular unit is manufactured in automated CNC facilities with zero tolerance for moisture or misalignment.`,
      highlights: [
        { title: '10-Year Warranty', description: 'Guaranteed resistance against moisture, termites, and hardware fatigue.' },
        { title: 'German Hardware', description: 'Soft-close hinges and hydraulic tandem drawers by Hettich, Hafele, and Blum.' },
        { title: 'BWP Marine Ply (IS:710)', description: 'Calibrated boiling waterproof marine plywood for maximum durability.' },
        { title: '45-Day Delivery Guarantee', description: 'On-time handover with penalty-backed commitment.' },
      ],
      servicesSectionTitle: 'Modular Design Collections',
      servicesSectionSubtitle: 'Smart storage, timeless aesthetic finishes, and ergonomic layouts.',
      services: [
        { title: 'L-Shaped & Island Kitchens', description: 'Ergonomic cooking triangle configurations with quartz countertops and hidden pantry units.' },
        { title: 'Floor-to-Ceiling Sliding Wardrobes', description: 'Aluminum-profile tinted glass and matte lacquer sliding wardrobes with integrated sensor LED lighting.' },
        { title: 'Walk-In Closets & Dressers', description: 'Custom jewelry organizers, pull-out shoe racks, and velvet-lined luxury drawers.' },
        { title: 'Crockery Units & Bar Consoles', description: 'Designer display cabinets with fluted glass, ambient backlighting, and wine storage.' },
      ],
      whyChooseUs: [
        { title: 'Factory Machine Finish', description: 'Edge-banded with zero bubbled laminates or manual carpentry imperfections.' },
        { title: 'Transparent Costing', description: 'Detailed itemized quotes with material brand certificates.' },
        { title: 'Turnkey Execution', description: 'We manage plumbing, electrical, tile cutting, and modular installation end-to-end.' },
        { title: 'Dedicated Project Manager', description: 'Single point of contact from initial 3D render to final handover.' },
      ],
      processSteps: [
        { number: '01', title: 'Site Measurement & Consultation', description: 'Precision laser measurements of your site and lifestyle preference mapping.' },
        { number: '02', title: '3D Render & Material Selection', description: 'Photorealistic 3D visualization with hands-on laminate, acrylic, and quartz samples.' },
        { number: '03', title: 'Automated Factory Production', description: 'CNC cutting, edge banding, and pre-assembly testing in our manufacturing unit.' },
        { number: '04', title: 'Installation & Quality Check', description: 'Clean, dust-free modular assembly on-site within 48 to 72 hours.' },
      ],
      faqs: [
        { question: 'What core materials do you use for wet kitchen areas?', answer: 'We exclusively use 100% BWP (Boiling Waterproof) marine-grade ply certified to IS:710 standards.' },
        { question: 'Is the 3D design consultation really free?', answer: `Yes, ${businessName} provides an initial site visit, measurement, and 3D concept layout with zero obligation.` },
        { question: 'What is the standard delivery timeline?', answer: 'Our standard factory production and installation timeline is 30 to 45 business days from 3D approval.' },
      ],
    };
  }

  // 6. Solar Panel & Energy Solutions
  if (/solar|panel|rooftop|photovoltaic|energy|inverter/i.test(text)) {
    return {
      heroBadge: `MNRE Approved Rooftop Solar • ${city}`,
      heroHeadline: `Slash Your Electricity Bill by up to 90% with Solar Power`,
      heroSubheadline: `Tier-1 monocrystalline solar systems, government subsidy processing, and net metering handled end-to-end by ${businessName}.`,
      primaryCtaLabel: 'Calculate Your Solar Savings',
      aboutLead: `${businessName} is ${city}'s premier solar energy EPC (Engineering, Procurement & Construction) contractor.`,
      aboutBody: `We help homeowners, housing societies, and industrial factories achieve energy independence. From engineering design and DISCOM approvals to net-metering and maintenance, we do it all.`,
      highlights: [
        { title: '25-Year Performance Warranty', description: 'Guaranteed 80%+ generation output backed by Tier-1 panel manufacturers.' },
        { title: 'Government Subsidy Support', description: 'Direct DBT subsidy assistance under PM Surya Ghar Muft Bijli Yojana.' },
        { title: 'Net-Metering Approved', description: 'Complete liaison with local electricity discom for bidirectional meters.' },
        { title: 'Remote Mobile Monitoring', description: 'Real-time smartphone app tracking daily units generated and grid export.' },
      ],
      servicesSectionTitle: 'Solar Power Solutions',
      servicesSectionSubtitle: 'Custom-engineered solar infrastructure delivering high returns on investment.',
      services: [
        { title: 'Residential Rooftop Solar (3kW - 10kW)', description: 'Compact, aesthetically mounted systems reducing home electricity expenses to near zero.' },
        { title: 'Housing Society & RWA Solar Plants', description: 'Heavy-duty common area power solutions for elevators, water pumps, and street lighting.' },
        { title: 'Commercial & Industrial Solar (25kW+)', description: 'Accelerated depreciation benefits and massive peak power cost reductions for enterprises.' },
        { title: 'Hybrid & Battery Storage Systems', description: 'Uninterrupted green backup power during grid blackouts with advanced lithium storage.' },
      ],
      whyChooseUs: [
        { title: 'Tier-1 Mono PERC Bifacial Panels', description: 'High-efficiency cells generating maximum electricity even during overcast weather.' },
        { title: 'Heavy-Duty Galvanized Structures', description: 'Engineered to withstand 150 km/h wind speeds with corrosion-free elevated mounting.' },
        { title: 'Zero Hassle Liaisoning', description: 'We manage all paperwork, net-metering applications, and safety inspections.' },
        { title: 'Rapid Payback Period', description: 'Most installations recover their entire capital cost within 3 to 4 years.' },
      ],
      processSteps: [
        { number: '01', title: 'Rooftop Shadow & Load Audit', description: 'Drone and compass audit to determine usable shadow-free rooftop square footage.' },
        { number: '02', title: 'System Engineering & Quotation', description: 'Custom 3D CAD design and financial payback projections.' },
        { number: '03', title: 'Installation & DISCOM Net-Metering', description: 'Professional mounting and bidirectional net-meter installation by certified engineers.' },
        { number: '04', title: 'Commissioning & App Sync', description: 'System switch-on, warranty documentation handover, and smartphone monitoring activation.' },
      ],
      faqs: [
        { question: 'How much money can I save with a 5kW solar system?', answer: 'A 5kW system generates around 20-22 units per day, saving approximately ₹5,000 to ₹7,000 every single month on average electricity bills.' },
        { question: 'Do you help with government solar subsidies?', answer: 'Yes! We handle the entire application process on the National Solar Portal to ensure your direct subsidy is credited directly to your bank account.' },
        { question: 'What happens during rainy or cloudy days?', answer: 'Solar panels continue generating power from diffused sunlight, and any shortfall is automatically drawn from the regular electric grid seamlessly.' },
      ],
    };
  }

  // 7. Bakery, Sweets & Café
  if (/baker|sweet|cake|pastry|cafe|mithai|dessert/i.test(text)) {
    return {
      heroBadge: `Artisan Bakery & Fresh Sweets • ${city}`,
      heroHeadline: `Handcrafted Fresh Cakes, Artisan Breads & Pure Sweets in ${city}`,
      heroSubheadline: `Baked daily using 100% pure butter and natural ingredients. Taste the authentic difference at ${businessName}.`,
      primaryCtaLabel: 'Order Cakes & Sweets',
      aboutLead: `${businessName} is a celebrated artisan bakery and confectionery destination in ${city}.`,
      aboutBody: `From customized designer birthday cakes and melt-in-mouth traditional desi ghee sweets to crusty sourdough breads and savory café bites, we believe in uncompromised taste and purity.`,
      highlights: [
        { title: 'Baked Fresh Every Morning', description: 'Never frozen or day-old; fresh batches prepared daily from scratch.' },
        { title: '100% Desi Ghee Sweets', description: 'Authentic mithai crafted using pure cow ghee and premium dry fruits.' },
        { title: 'Eggless Options Available', description: 'Wide range of 100% eggless gourmet cakes and vegetarian bakery delights.' },
        { title: 'Custom Cake Specialists', description: 'Photorealistic custom theme cakes, tiered wedding cakes, and pinata cakes.' },
      ],
      servicesSectionTitle: 'Baked Goods & Confectionery',
      servicesSectionSubtitle: 'Delightful artisanal creations for birthdays, celebrations, and everyday cravings.',
      services: [
        { title: 'Custom Celebration Cakes', description: 'Bespoke fondant and buttercream cakes handcrafted for birthdays, anniversaries, and milestones.' },
        { title: 'Traditional Pure Ghee Sweets', description: 'Kaju Katli, Motichoor Ladoos, and signature milk sweets made with traditional artisanal recipes.' },
        { title: 'Artisan Breads & Pastries', description: 'Golden flaky croissants, sourdough loaves, Danish pastries, and whole-wheat garlic breads.' },
        { title: 'Festive Gift Hampers', description: 'Curated corporate and wedding gift boxes filled with premium cookies, nuts, and sweets.' },
      ],
      whyChooseUs: [
        { title: 'Zero Artificial Preservatives', description: 'We refuse shortcuts; only authentic cocoa, real fruits, and pure dairy.' },
        { title: 'Hygienic FSSAI Kitchen', description: 'Immaculate preparation standards following international food safety protocols.' },
        { title: 'Reliable Same-Day Delivery', description: `Safe chilled delivery across ${city} guaranteeing intact decoration.` },
        { title: 'Custom Tastes & Diets', description: 'Gluten-free, sugar-free, and vegan options available upon request.' },
      ],
      processSteps: [
        { number: '01', title: 'Choose Your Flavor & Style', description: 'Select from our flavor catalog or share your reference photo.' },
        { number: '02', title: 'Master Chef Baking', description: 'Freshly baked and hand-decorated by our master confectionery team.' },
        { number: '03', title: 'Quality Check & Safe Pack', description: 'Protected in sturdy reinforced pastry boxes for zero transit damage.' },
        { number: '04', title: 'Doorstep Delivery or Pickup', description: 'Chilled delivery right to your party venue or fresh pickup from our counter.' },
      ],
      faqs: [
        { question: 'How much notice is needed for a customized designer cake?', answer: 'We recommend placing custom design orders 24 hours in advance, although standard fresh celebration cakes can be prepared within 2 to 3 hours.' },
        { question: 'Are eggless cakes available?', answer: 'Yes! Over 90% of our bakery menu and all traditional sweets are 100% vegetarian / eggless.' },
        { question: `Do you deliver across ${city}?`, answer: `Yes, ${businessName} provides temperature-safe doorstep delivery across all sectors of ${city}.` },
      ],
    };
  }

  // 8. Photographer / Videographer / Creative Studio
  if (/photograph|photographer|photography|videograph|cinematograph|portrait|wedding shoot|pre-wedding|\bphotoshoot\b|photo studio/i.test(text)) {
    return {
      heroBadge: `Wedding & Portrait Photography • ${city}`,
      heroHeadline: `Timeless Wedding, Portrait & Event Photography in ${city}`,
      heroSubheadline: `From candid wedding stories to editorial portraits and commercial shoots, ${businessName} captures each moment with a calm, unobtrusive eye.`,
      primaryCtaLabel: 'Check Dates & Book a Shoot',
      aboutLead: `${businessName} is a ${city}-based photography studio specialising in weddings, portraits, and brand storytelling.`,
      aboutBody: `We blend natural light, thoughtful composition, and honest storytelling to deliver images you will treasure for years. Every session is planned around you, your comfort, and the story you want told.`,
      highlights: [
        { title: 'Story-First Approach', description: 'We document real emotion and candid moments rather than stiff, posed frames.' },
        { title: 'Professional Equipment', description: 'Pro-grade cameras, lenses, and lighting for reliable results in any setting.' },
        { title: 'Quick Turnarounds', description: 'Carefully edited, colour-graded galleries delivered within an agreed timeline.' },
        { title: 'Flexible Packages', description: 'Coverage options tailored to weddings, portraits, events, and commercial needs.' },
      ],
      servicesSectionTitle: 'Photography Services',
      servicesSectionSubtitle: 'Coverage for every occasion, planned around your story and delivered with care.',
      services: [
        { title: 'Wedding Photography', description: 'Full-day candid and traditional coverage of ceremonies, rituals, and celebrations.' },
        { title: 'Pre-Wedding & Couple Shoots', description: 'Relaxed, location-scouted couple sessions that feel natural and personal.' },
        { title: 'Portrait & Family Sessions', description: 'Studio or outdoor portraits for individuals, families, and professional profiles.' },
        { title: 'Event & Celebration Coverage', description: 'Birthdays, engagements, and corporate events documented start to finish.' },
        { title: 'Commercial & Product Shoots', description: 'Brand, product, and lifestyle imagery crafted for websites and social media.' },
        { title: 'Maternity & Newborn', description: 'Gentle, patient sessions to capture the earliest days of your growing family.' },
      ],
      whyChooseUs: [
        { title: 'Calm On The Day', description: 'A discreet, friendly presence that keeps your event relaxed and on schedule.' },
        { title: 'Consistent Style', description: 'Warm, true-to-life editing that keeps your gallery looking timeless, not trendy.' },
        { title: 'Clear Communication', description: 'Upfront planning, transparent timelines, and quick replies before and after the shoot.' },
        { title: 'Local Knowledge', description: `Familiarity with the best locations, light, and logistics across ${city}.` },
      ],
      processSteps: [
        { number: '01', title: 'Enquiry & Date Check', description: 'Share your date, location, and vision so we can confirm availability.' },
        { number: '02', title: 'Pre-Shoot Consultation', description: 'We plan the timeline, must-have shots, locations, and outfit guidance.' },
        { number: '03', title: 'The Shoot Day', description: 'Relaxed, well-guided coverage so you can simply enjoy the moment.' },
        { number: '04', title: 'Editing & Delivery', description: 'Careful selection, colour grading, and secure delivery of your final gallery.' },
      ],
      faqs: [
        { question: 'How far in advance should we book?', answer: 'Wedding dates are best booked early, especially in peak season. Portrait and event sessions can often be arranged at shorter notice depending on availability.' },
        { question: 'How many photos do we receive?', answer: 'The number depends on the duration and type of coverage. We will confirm an expected range in your quote and deliver a fully edited selection.' },
        { question: 'Do you travel outside the city?', answer: `Yes. ${businessName} covers destination and outstation shoots — travel and stay are discussed and agreed upfront.` },
      ],
    };
  }

  // 9. Restaurant, Cafe & Cloud Kitchen
  if (/restaurant|diner|dine|bistro|cloud kitchen|multi-?cuisine|food court|eatery|thali|dhaba/i.test(text)) {
    return {
      heroBadge: `Dine-In • Takeaway • Delivery`,
      heroHeadline: `Freshly Prepared Favourites at ${businessName}`,
      heroSubheadline: `From signature mains to comforting classics, ${businessName} serves food made fresh to order in the heart of ${city}.`,
      primaryCtaLabel: 'Reserve a Table / Order',
      aboutLead: `${businessName} is a ${city} dining destination serving freshly prepared food for dine-in, takeaway, and delivery.`,
      aboutBody: `We focus on quality ingredients, consistent taste, and warm hospitality. Whether it is a quick lunch, a family dinner, or a celebration, our kitchen and team are ready to serve you.`,
      highlights: [
        { title: 'Freshly Cooked', description: 'Dishes prepared to order using quality, responsibly sourced ingredients.' },
        { title: 'Warm Hospitality', description: 'Friendly, attentive service in a comfortable, welcoming setting.' },
        { title: 'Varied Menu', description: 'Something for every taste, from signature specials to comfort classics.' },
        { title: 'Dine or Order In', description: 'Enjoy in-house or get it delivered and packed carefully for the journey.' },
      ],
      servicesSectionTitle: 'Dining & Service Options',
      servicesSectionSubtitle: 'Ways to enjoy our food — in the restaurant, at home, or at your celebration.',
      services: [
        { title: 'Dine-In Experience', description: 'Relaxed in-house seating with attentive service and a welcoming atmosphere.' },
        { title: 'Takeaway', description: 'Freshly packed favourites, ready for you to collect at your convenience.' },
        { title: 'Home Delivery', description: 'Careful, timely delivery of our most-loved dishes to your doorstep where offered.' },
        { title: 'Private & Group Dining', description: 'Space and menus suited to family gatherings, friends, and small celebrations.' },
        { title: 'Catering Enquiries', description: 'Bulk and event catering arrangements discussed and tailored to your needs.' },
      ],
      whyChooseUs: [
        { title: 'Consistent Taste', description: 'Recipes and standards that keep every visit reliably enjoyable.' },
        { title: 'Hygienic Kitchen', description: 'Strict cleanliness and safe food-handling practices at every step.' },
        { title: 'Friendly Team', description: 'Staff who make you feel looked after from the moment you arrive.' },
        { title: 'Easy Booking', description: 'Simple reservations and orders over a call or message.' },
      ],
      processSteps: [
        { number: '01', title: 'Choose Your Experience', description: 'Dine in, take away, order for delivery, or enquire about catering.' },
        { number: '02', title: 'Confirm Your Booking', description: 'Reserve a table or place your order over a call or message.' },
        { number: '03', title: 'Prepared Fresh', description: 'Your food is cooked to order by our kitchen team.' },
        { number: '04', title: 'Served Or Delivered', description: 'Enjoy in-house or receive it carefully packed and on time.' },
      ],
      faqs: [
        { question: 'Do you take reservations?', answer: 'Yes, we recommend reserving a table for evenings and weekends. Give us a call or message us to confirm availability.' },
        { question: 'Do you offer delivery?', answer: 'Where available, we offer delivery in and around the city. Please contact us to confirm coverage for your location.' },
        { question: 'Can you cater for groups or events?', answer: `Yes. ${businessName} takes bulk and celebration enquiries — share your date and headcount and we will suggest suitable options.` },
      ],
    };
  }

  // 10. Real Estate & Property Advisory
  if (/real estate|realty|property|properties|realtor|property broker|builder|housing|apartments|flats?\b|plots?\b|commercial space|leasing/i.test(text)) {
    return {
      heroBadge: `Residential & Commercial Property • ${city}`,
      heroHeadline: `Find the Right Property with Trusted Local Guidance`,
      heroSubheadline: `From first homes to prime commercial spaces, ${businessName} helps buyers, sellers, and investors move with confidence across ${city}.`,
      primaryCtaLabel: 'Schedule a Site Visit',
      aboutLead: `${businessName} is a ${city} property advisory helping clients buy, sell, rent, and invest with clarity.`,
      aboutBody: `We combine local market knowledge with a transparent, paperwork-friendly process so you can make informed decisions without pressure. From shortlisting to registration support, we stay with you at every step.`,
      highlights: [
        { title: 'Local Market Insight', description: `Practical, area-level knowledge of pricing, demand, and upcoming corridors in ${city}.` },
        { title: 'Verified Options', description: 'Shortlists focused on genuine, well-matched properties rather than endless listings.' },
        { title: 'Transparent Guidance', description: 'Clear communication on pricing, costs, and next steps with no hidden surprises.' },
        { title: 'End-to-End Support', description: 'Assistance with site visits, negotiation, documentation, and handover.' },
      ],
      servicesSectionTitle: 'Property Services',
      servicesSectionSubtitle: 'Guidance across buying, selling, renting, and investing — matched to your goals.',
      services: [
        { title: 'Residential Sales & Purchase', description: 'Help finding or selling apartments, villas, floors, and independent homes.' },
        { title: 'Rentals & Leasing', description: 'Tenant and landlord support for residential and commercial rentals.' },
        { title: 'Commercial & Office Spaces', description: 'Shops, offices, and commercial units suited to your business requirements.' },
        { title: 'Plots & Land', description: 'Guidance on plots and land parcels, including basic due-diligence pointers.' },
        { title: 'Investment Advisory', description: 'Area and segment guidance for buyers evaluating long-term property value.' },
        { title: 'Documentation Support', description: 'Assistance coordinating the paperwork involved in a property transaction.' },
      ],
      whyChooseUs: [
        { title: 'Client-First Advice', description: 'Recommendations based on your budget and needs, not a quick sale.' },
        { title: 'Responsive Communication', description: 'Timely updates and straight answers throughout your search.' },
        { title: 'Wide Local Network', description: `Access to a broad set of options across ${city} and nearby areas.` },
        { title: 'Smooth Coordination', description: 'We help keep visits, negotiation, and paperwork moving on schedule.' },
      ],
      processSteps: [
        { number: '01', title: 'Requirement Discussion', description: 'We understand your budget, location preferences, and timeline.' },
        { number: '02', title: 'Curated Shortlist', description: 'You receive a focused set of properties that genuinely match your brief.' },
        { number: '03', title: 'Site Visits', description: 'We schedule and accompany visits so you can compare options easily.' },
        { number: '04', title: 'Deal & Handover', description: 'Support through negotiation, documentation, and final handover.' },
      ],
      faqs: [
        { question: 'Do you charge for site visits?', answer: 'Initial consultations and shortlisting are typically free. Any charges are discussed and agreed with you upfront before proceeding.' },
        { question: 'Can you help with rentals as well as sales?', answer: 'Yes, we assist with both buying/selling and rentals or leasing, for residential and commercial requirements.' },
        { question: 'Do you help with paperwork?', answer: `We coordinate and guide you through the documentation process; ${businessName} can recommend professionals where formal legal or financial advice is required.` },
      ],
    };
  }

  // 11. Doctor / Clinic / Healthcare (non-dental)
  if (/doctor|clinic|medical|physio|hospital|pediatric|paediatric|ayurved|homeopath|orthopedic|derma|skin|diagnostic|patholog|dentist|dental/i.test(text)) {
    return {
      heroBadge: `Patient-First Medical Care • ${city}`,
      heroHeadline: `Compassionate, Expert Medical Care in ${city}`,
      heroSubheadline: `Clear guidance, attentive consultation, and patient-first care from the team at ${businessName}.`,
      primaryCtaLabel: 'Book Appointment',
      aboutLead: `${businessName} is a ${city} practice focused on accurate diagnosis and respectful, patient-first care.`,
      aboutBody: `We take the time to understand your concerns, explain your options clearly, and involve you in every decision. Our focus is on safe, evidence-based care in a comfortable environment.`,
      highlights: [
        { title: 'Clear Consultations', description: 'Plain-language explanations so you understand your condition and options.' },
        { title: 'Patient Comfort', description: 'A calm, hygienic environment designed to put you at ease.' },
        { title: 'Attentive Follow-Up', description: 'Guidance on next steps, recovery, and when to return for review.' },
        { title: 'Respectful Care', description: 'Confidential handling of your details and a judgement-free approach.' },
      ],
      servicesSectionTitle: 'Treatments & Services',
      servicesSectionSubtitle: 'Consultation-led care tailored to your individual needs.',
      services: [
        { title: 'General Consultation', description: 'An unhurried assessment of your symptoms, history, and concerns.' },
        { title: 'Preventive Care', description: 'Routine check-ups and guidance to help you stay well.' },
        { title: 'Specialist Consultation', description: 'Focused assessment where a specific area of care is required.' },
        { title: 'Diagnostics & Testing', description: 'Coordination of relevant tests to support an accurate diagnosis.' },
      ],
      whyChooseUs: [
        { title: 'Patient-First Approach', description: 'Your comfort and understanding guide every consultation.' },
        { title: 'Clear Guidance', description: 'Honest explanations of what is known, what is uncertain, and what to do next.' },
        { title: 'Hygiene Standards', description: 'Careful sterilisation and cleanliness protocols throughout the clinic.' },
        { title: 'Easy Appointments', description: 'Simple booking and timely communication for your visit.' },
      ],
      processSteps: [
        { number: '01', title: 'Book Appointment', description: 'Reach out by phone or message to reserve a suitable slot.' },
        { number: '02', title: 'Consultation', description: 'We listen carefully and assess your symptoms and history.' },
        { number: '03', title: 'Plan Of Care', description: 'You receive clear, agreed next steps and any tests required.' },
        { number: '04', title: 'Follow-Up', description: 'Review and ongoing guidance to support your recovery.' },
      ],
      faqs: [
        { question: 'How do I book an appointment?', answer: `You can contact ${businessName} directly by phone or message to arrange a consultation at a convenient time.` },
        { question: 'What should I bring to my visit?', answer: 'Please bring any relevant reports, prescriptions, and a note of your current concerns to help us assess you accurately.' },
        { question: 'Do you offer follow-up consultations?', answer: 'Yes, follow-up consultations are arranged where needed to review progress and adjust your plan of care.' },
      ],
    };
  }

  // 12. General SMB / Custom Trades (Fallback for any arbitrary profession)
  return {
    heroBadge: `Trusted ${rawProfession} • ${city}`,
    heroHeadline: `Dedicated, Professional & Reliable ${rawProfession} in ${city}`,
    heroSubheadline: `Committed to quality standards, transparent pricing, and local customer satisfaction across ${city} and NCR.`,
    primaryCtaLabel: 'Get In Touch / Free Estimate',
    aboutLead: `${businessName} is an established ${rawProfession.toLowerCase()} enterprise based in ${city}.`,
    aboutBody: `We take immense pride in delivering top-tier service, dependable craftsmanship, and honest advice. Our dedicated team works closely with you to understand your specific requirements and deliver results that stand the test of time.`,
    highlights: [
      { title: 'Verified Expertise', description: `Experienced practitioners with deep technical knowledge in ${rawProfession.toLowerCase()}.` },
      { title: 'Customer-First Approach', description: 'Transparent scopes, prompt communication, and zero hidden charges.' },
      { title: 'Prompt Execution', description: 'Reliable scheduling, respectful site visits, and on-time project completion.' },
      { title: 'Quality Standards', description: 'Every service is backed by our local service commitment and rigorous quality checks.' },
    ],
    servicesSectionTitle: `Our ${rawProfession} Solutions`,
    servicesSectionSubtitle: `Comprehensive services tailored to meet residential, commercial, and individual client needs in ${city}.`,
    services: [
      { title: `Specialized ${rawProfession} Consultation`, description: `In-depth initial assessment and expert guidance tailored to your specific requirements in ${city}.` },
      { title: `Customized Project Execution`, description: `Methodical, high-grade delivery utilizing modern tools, proven methods, and quality materials.` },
      { title: `Maintenance & Periodic Upkeep`, description: `Scheduled servicing, preventative inspections, and emergency repairs to ensure optimal performance.` },
      { title: `Comprehensive End-to-End Support`, description: `Dedicated post-service assistance, warranty tracking, and advisory whenever you need it.` },
    ],
    whyChooseUs: [
      { title: 'Local Reliability', description: `Serving clients across ${city} with a stellar local track record and trusted reputation.` },
      { title: 'Clear & Honest Pricing', description: 'Detailed itemized quotes with clear milestone schedules and zero surprises.' },
      { title: 'Skilled Team', description: 'Trained, background-verified professionals focused on safety and clean execution.' },
      { title: 'Client Dedication', description: 'We stand firmly behind our work and ensure thorough attention to every project detail.' },
    ],
    processSteps: [
      { number: '01', title: 'Initial Consultation', description: `Contact us via call or WhatsApp to discuss your exact ${rawProfession.toLowerCase()} requirements.` },
      { number: '02', title: 'Site Assessment & Quote', description: 'Detailed inspection, transparent scope definition, and upfront estimation.' },
      { number: '03', title: 'Professional Execution', description: 'Meticulous service delivery adhering to safety, clean standards, and timeline milestones.' },
      { number: '04', title: 'Handover & Ongoing Support', description: 'Thorough quality review, client walk-through, and continuous after-service support.' },
    ],
    faqs: [
      { question: `How do I book an appointment or consultation in ${city}?`, answer: `You can reach out to ${businessName} directly via phone, WhatsApp, or through our website contact form.` },
      { question: `What are your standard turnaround times?`, answer: `We accommodate same-day consultations when available and provide realistic, firm timeline commitments before starting work.` },
      { question: `Do you provide service estimates prior to work?`, answer: `Yes, we always provide a transparent, itemized estimate before beginning any engagement so you have total clarity.` },
    ],
  };
}

/**
 * Sanitizes JSON payload from Gemini API to guarantee UI layout safety.
 */
function sanitizeAiContent(parsed: any, facts: GenerateAiContentFacts): AiBusinessContent {
  const profession = facts.profession?.trim() || 'Professional Practice';
  const city = facts.city?.trim() || 'Delhi NCR';
  const businessName = facts.businessName?.trim() || 'Local Enterprise';

  const KNOW_SECTIONS = new Set([
    'HERO', 'TRUST', 'SERVICES', 'ABOUT', 'EXPERTISE', 'PROCESS', 'WHY_CHOOSE_US',
    'INDUSTRIES', 'TESTIMONIALS', 'FAQ', 'CONTACT', 'CTA', 'LOCATION', 'GALLERY', 'MENU',
  ]);

  const base: AiBusinessContent = {
    heroBadge: String(parsed.heroBadge || `${profession} • ${city}`).slice(0, 60),
    heroHeadline: String(parsed.heroHeadline || `${profession} Services in ${city}`).slice(0, 140),
    heroSubheadline: String(
      parsed.heroSubheadline || `Dedicated professional solutions for clients in ${city} and surrounding areas.`
    ).slice(0, 320),
    primaryCtaLabel: String(parsed.primaryCtaLabel || 'Schedule Consultation').slice(0, 40),
    aboutLead: String(
      parsed.aboutLead || `${businessName} is a leading ${profession.toLowerCase()} practice based in ${city}.`
    ).slice(0, 380),
    aboutBody: String(
      parsed.aboutBody ||
        `We deliver reliable, standards-driven solutions tailored to our clients' unique requirements. Our team brings deep practical experience and local dedication to every engagement.`
    ).slice(0, 1100),
    highlights: Array.isArray(parsed.highlights)
      ? parsed.highlights.slice(0, 4).map((h: any, i: number) => ({
          title: String(h?.title || `Excellence Standard ${i + 1}`).slice(0, 75),
          description: String(h?.description || `High-caliber dedication and proven track record in ${city}.`).slice(
            0,
            280
          ),
        }))
      : [],
    servicesSectionTitle: String(parsed.servicesSectionTitle || 'Our Core Services').slice(0, 75),
    servicesSectionSubtitle: String(
      parsed.servicesSectionSubtitle || `Comprehensive ${profession.toLowerCase()} solutions tailored to your needs.`
    ).slice(0, 190),
    services: (parsed.services || []).slice(0, 6).map((s: any, i: number) => ({
      title: String(s?.title || `Specialized Service ${i + 1}`).slice(0, 95),
      description: String(s?.description || `Professional execution and dedicated advisory in ${city}.`).slice(0, 380),
    })),
    whyChooseUs: Array.isArray(parsed.whyChooseUs)
      ? parsed.whyChooseUs.slice(0, 4).map((w: any, i: number) => ({
          title: String(w?.title || `Trusted Partner ${i + 1}`).slice(0, 75),
          description: String(w?.description || `Transparent communication, verified standards, and focused attention.`).slice(
            0,
            320
          ),
        }))
      : [],
    processSteps: Array.isArray(parsed.processSteps)
      ? parsed.processSteps.slice(0, 4).map((p: any, i: number) => ({
          number: String(p?.number || `0${i + 1}`).slice(0, 5),
          title: String(p?.title || `Step ${i + 1}`).slice(0, 75),
          description: String(p?.description || `Clear guidance and transparent process execution.`).slice(0, 280),
        }))
      : [],
    faqs: Array.isArray(parsed.faqs)
      ? parsed.faqs.slice(0, 4).map((f: any, i: number) => ({
          question: String(f?.question || `How do I engage your services in ${city}?`).slice(0, 140),
          answer: String(
            f?.answer || `You can get in touch directly via phone or our online consultation request form.`
          ).slice(0, 550),
        }))
      : [],
  };

  // ---- Optional profession-aware structured extensions ----

  if (Array.isArray(parsed.sections)) {
    const sections = parsed.sections
      .map((s: any) => String(s || '').toUpperCase().trim())
      .filter((s: string) => KNOW_SECTIONS.has(s));
    if (sections.length > 0) base.sections = Array.from(new Set(sections));
  }

  if (parsed.design && typeof parsed.design === 'object') {
    const density = ['compact', 'comfortable', 'spacious'].includes(parsed.design.contentDensity)
      ? parsed.design.contentDensity
      : undefined;
    const accent = String(parsed.design.accentColor || '');
    base.design = {
      layout: parsed.design.layout ? String(parsed.design.layout).slice(0, 60) : undefined,
      template: parsed.design.template ? String(parsed.design.template).slice(0, 60) : undefined,
      themeId: parsed.design.themeId ? String(parsed.design.themeId).slice(0, 60) : undefined,
      heroLayout: parsed.design.heroLayout ? String(parsed.design.heroLayout).slice(0, 60) : undefined,
      servicesLayout: parsed.design.servicesLayout ? String(parsed.design.servicesLayout).slice(0, 60) : undefined,
      contentDensity: density,
      archetype: parsed.design.archetype ? String(parsed.design.archetype).slice(0, 60) : undefined,
      accentColor: /^#[0-9a-fA-F]{6}$/.test(accent) ? accent.toLowerCase() : undefined,
    };
  }

  if (parsed.seo && typeof parsed.seo === 'object') {
    base.seo = {
      title: parsed.seo.title ? String(parsed.seo.title).slice(0, 150) : undefined,
      description: parsed.seo.description ? String(parsed.seo.description).slice(0, 300) : undefined,
    };
  }

  if (Array.isArray(parsed.navItems)) {
    const nav = parsed.navItems
      .slice(0, 6)
      .map((n: any) => ({
        label: String(n?.label || '').slice(0, 40),
        href: n?.href ? String(n.href).slice(0, 120) : undefined,
      }))
      .filter((n: any) => n.label.length > 1);
    if (nav.length > 0) base.navItems = nav;
  }

  if (parsed.expertise && Array.isArray(parsed.expertise.items)) {
    base.expertise = {
      sectionTitle: parsed.expertise.sectionTitle ? String(parsed.expertise.sectionTitle).slice(0, 80) : undefined,
      sectionSubtitle: parsed.expertise.sectionSubtitle
        ? String(parsed.expertise.sectionSubtitle).slice(0, 200)
        : undefined,
      items: parsed.expertise.items.slice(0, 8).map((it: any, i: number) => ({
        title: String(it?.title || `Specialisation ${i + 1}`).slice(0, 80),
        description: String(it?.description || `Focused expertise in this area.`).slice(0, 300),
        tags: Array.isArray(it?.tags) ? it.tags.slice(0, 5).map((t: any) => String(t).slice(0, 40)) : undefined,
      })),
    };
  }

  if (parsed.gallery && Array.isArray(parsed.gallery.items)) {
    const items = parsed.gallery.items
      .slice(0, 12)
      .map((g: any, i: number) => ({
        title: String(g?.title || `Showcase ${i + 1}`).slice(0, 100),
        category: g?.category ? String(g.category).slice(0, 60) : undefined,
        description: g?.description ? String(g.description).slice(0, 200) : undefined,
        imageQuery: g?.imageQuery ? String(g.imageQuery).slice(0, 120) : undefined,
      }))
      .filter((g: any) => g.title.length > 1);
    if (items.length > 0) {
      base.gallery = {
        sectionTitle: parsed.gallery.sectionTitle ? String(parsed.gallery.sectionTitle).slice(0, 80) : undefined,
        sectionSubtitle: parsed.gallery.sectionSubtitle
          ? String(parsed.gallery.sectionSubtitle).slice(0, 200)
          : undefined,
        items,
      };
    }
  }

  if (parsed.menu && Array.isArray(parsed.menu.categories)) {
    const categories = parsed.menu.categories
      .slice(0, 6)
      .map((c: any) => ({
        name: String(c?.name || 'Menu').slice(0, 60),
        items: Array.isArray(c?.items)
          ? c.items.slice(0, 12).map((it: any) => ({
              name: String(it?.name || 'Item').slice(0, 80),
              description: it?.description ? String(it.description).slice(0, 200) : undefined,
              price: String(it?.price || 'Ask').slice(0, 40),
              badge: it?.badge ? String(it.badge).slice(0, 30) : undefined,
            }))
          : [],
      }))
      .filter((c: any) => c.items.length > 0);
    if (categories.length > 0) {
      base.menu = {
        sectionTitle: parsed.menu.sectionTitle ? String(parsed.menu.sectionTitle).slice(0, 80) : undefined,
        sectionSubtitle: parsed.menu.sectionSubtitle
          ? String(parsed.menu.sectionSubtitle).slice(0, 200)
          : undefined,
        categories,
      };
    }
  }

  if (parsed.industries && Array.isArray(parsed.industries.items)) {
    const items = parsed.industries.items.slice(0, 8).map((i: any) => String(i).slice(0, 60)).filter(Boolean);
    if (items.length > 0) {
      base.industries = {
        sectionTitle: parsed.industries.sectionTitle
          ? String(parsed.industries.sectionTitle).slice(0, 80)
          : undefined,
        items,
      };
    }
  }

  if (parsed.ctaBanner && typeof parsed.ctaBanner === 'object') {
    base.ctaBanner = {
      title: parsed.ctaBanner.title ? String(parsed.ctaBanner.title).slice(0, 120) : undefined,
      subtitle: parsed.ctaBanner.subtitle ? String(parsed.ctaBanner.subtitle).slice(0, 250) : undefined,
      primaryCtaLabel: parsed.ctaBanner.primaryCtaLabel
        ? String(parsed.ctaBanner.primaryCtaLabel).slice(0, 40)
        : undefined,
      secondaryCtaLabel: parsed.ctaBanner.secondaryCtaLabel
        ? String(parsed.ctaBanner.secondaryCtaLabel).slice(0, 40)
        : undefined,
    };
  }

  if (Array.isArray(parsed.trustBadges)) {
    const badges = parsed.trustBadges
      .slice(0, 6)
      .map((b: any, i: number) => ({
        title: String(b?.title || `Standard ${i + 1}`).slice(0, 80),
        description: String(b?.description || 'Recognised professional standards.').slice(0, 250),
        iconName: b?.iconName ? String(b.iconName).slice(0, 40) : undefined,
      }))
      .filter((b: any) => b.title.length > 1);
    if (badges.length > 0) base.trustBadges = badges;
  }

  return base;
}

/**
 * Calls Gemini via REST API with a structured JSON schema prompt.
 * The models to try are discovered from the API (see resolveGeminiModels), so a
 * retired model name cannot silently turn every request into a 404.
 * Gracefully returns null if no API key is configured or upon error,
 * allowing the caller to seamlessly fall back to getDeterministicProfessionProfile.
 */
export async function generateAiBusinessContent(
  facts: GenerateAiContentFacts,
  options?: {
    /**
     * Design-brief text derived from the per-industry blueprint (tone, headline
     * pattern, trust signals, service naming, imagery treatment). Steers the copy
     * so the wording matches how the industry's best websites read.
     */
    industryBrief?: string;
  }
): Promise<AiBusinessContent | null> {
  const apiKey = getGeminiApiKey();

  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }

  const businessName = facts.businessName?.trim() || 'Local Enterprise';
  const profession = facts.profession?.trim() || 'Professional Practice';
  const city = facts.city?.trim() || 'Delhi NCR';
  const address = facts.address?.trim() || `${city}, India`;

  const isLegalOrCa = /chartered accountant|ca firm|lawyer|advocate|legal practice|solicitor/i.test(
    `${profession} ${businessName}`
  );

  const prompt = `You are an elite Indian B2B & SMB conversion copywriter for local businesses.
Generate authentic, high-converting, realistic website content for:
- Business / Practice Name: "${businessName}"
- Profession / Industry: "${profession}"
- City / Region: "${city}", India
- Address: "${address}"

CRITICAL MANDATE: NEVER generate Chartered Accountant, ICAI, Tax, or Audit terms unless the business is specifically a Chartered Accountant. The content MUST 100% reflect the specified profession (${profession}).

${
  isLegalOrCa
    ? 'COMPLIANCE MANDATE: This profession is governed by strict regulatory ethical rules in India (ICAI / Bar Council of India). Strictly follow an informational pull-model. Do NOT use superlatives (e.g. "Best", "Top", "No. 1") and do NOT claim fee discounts.'
    : 'CONVERSION MANDATE: Create compelling, customer-centric, professional copy that inspires local trust, highlights craftsmanship or expertise, and drives direct inquiries via call or appointment.'
}

Return ONLY a single valid JSON object matching this exact schema (no markdown fences, no commentary):
{
  "heroBadge": "Short 3-5 word category badge (e.g. 'Premier Dental & Implant Center', 'Boutique Modular Kitchen Studio', 'Wedding & Portrait Photography')",
  "heroHeadline": "Compelling 6-10 word headline tailored to their exact profession and local standing",
  "heroSubheadline": "1-sentence value proposition mentioning their core offerings, client commitment, and ${city}",
  "primaryCtaLabel": "Action-oriented CTA button text (e.g. 'Schedule Consultation', 'Book Appointment', 'Check Dates & Book a Shoot')",
  "aboutLead": "1-sentence overview of ${businessName} in ${city}",
  "aboutBody": "2-sentence description of their quality standards, customer focus, and local reputation",
  "highlights": [
    { "title": "Highlight 1 (2-4 words)", "description": "1 short sentence" },
    { "title": "Highlight 2 (2-4 words)", "description": "1 short sentence" },
    { "title": "Highlight 3 (2-4 words)", "description": "1 short sentence" },
    { "title": "Highlight 4 (2-4 words)", "description": "1 short sentence" }
  ],
  "servicesSectionTitle": "Category section title (e.g. 'Our Core Services', 'Photography Services', 'Menu & Specialities')",
  "servicesSectionSubtitle": "1-sentence subtitle describing their service offerings",
  "services": [
    { "title": "Specific Service 1 for this profession", "description": "Clear 1-2 sentence explanation of this service" },
    { "title": "Specific Service 2 for this profession", "description": "Clear 1-2 sentence explanation of this service" },
    { "title": "Specific Service 3 for this profession", "description": "Clear 1-2 sentence explanation of this service" },
    { "title": "Specific Service 4 for this profession", "description": "Clear 1-2 sentence explanation of this service" },
    { "title": "Specific Service 5 for this profession", "description": "Clear 1-2 sentence explanation of this service" },
    { "title": "Specific Service 6 for this profession", "description": "Clear 1-2 sentence explanation of this service" }
  ],
  "whyChooseUs": [
    { "title": "Trust Factor 1 (2-4 words)", "description": "1 clear sentence explaining this trust factor" },
    { "title": "Trust Factor 2 (2-4 words)", "description": "1 clear sentence explaining this trust factor" },
    { "title": "Trust Factor 3 (2-4 words)", "description": "1 clear sentence explaining this trust factor" },
    { "title": "Trust Factor 4 (2-4 words)", "description": "1 clear sentence explaining this trust factor" }
  ],
  "processSteps": [
    { "number": "01", "title": "Step 1 Title", "description": "1 sentence describing initial inquiry or assessment" },
    { "number": "02", "title": "Step 2 Title", "description": "1 sentence describing analysis, planning, or diagnosis" },
    { "number": "03", "title": "Step 3 Title", "description": "1 sentence describing execution, treatment, or delivery" },
    { "number": "04", "title": "Step 4 Title", "description": "1 sentence describing ongoing support, review, or warranty" }
  ],
  "faqs": [
    { "question": "Realistic question clients ask for this profession?", "answer": "Helpful 1-2 sentence answer" },
    { "question": "Second common client question?", "answer": "Helpful 1-2 sentence answer" },
    { "question": "Third common client question regarding location or process?", "answer": "Helpful 1-2 sentence answer" },
    { "question": "Fourth client question regarding appointments or turnaround?", "answer": "Helpful 1-2 sentence answer" }
  ],
  "sections": ["HERO", "SERVICES", "GALLERY", "EXPERTISE", "ABOUT", "PROCESS", "WHY_CHOOSE_US", "FAQ", "CONTACT", "LOCATION"],
  "design": { "archetype": "ONE of: ${PROFESSION_ARCHETYPE_IDS.join(' | ')}", "accentColor": "#RRGGBB (optional brand accent)", "heroLayout": "e.g. visual-fullbleed | split-editorial | minimal-serif", "servicesLayout": "e.g. cards | grid | luxury-rows", "contentDensity": "compact | comfortable | spacious" },
  "seo": { "title": "SEO page title (business name + profession + city, <= 60 chars)", "description": "SEO meta description (<= 155 chars)" },
  "navItems": [
    { "label": "Nav label 1", "href": "#services" },
    { "label": "Nav label 2", "href": "#about" },
    { "label": "Nav label 3", "href": "#faq" },
    { "label": "Nav label 4", "href": "#contact" }
  ],
  "expertise": { "sectionTitle": "Specialities or signature approach", "sectionSubtitle": "1 sentence", "items": [ { "title": "Speciality 1", "description": "1 sentence", "tags": ["tag1", "tag2"] } ] },
  "gallery": { "sectionTitle": "Portfolio / gallery title", "sectionSubtitle": "1 sentence", "items": [ { "title": "Work title", "category": "Category", "description": "1 sentence", "imageQuery": "short visual brief of the ideal photo" } ] },
  "menu": { "sectionTitle": "Menu / Packages / Listings title", "sectionSubtitle": "1 sentence", "categories": [ { "name": "Category name", "items": [ { "name": "Item name", "description": "1 sentence", "price": "On enquiry", "badge": "Popular" } ] } ] },
  "industries": { "sectionTitle": "Who we serve", "items": ["Segment 1", "Segment 2", "Segment 3", "Segment 4"] },
  "ctaBanner": { "title": "Closing call-to-action headline", "subtitle": "1 sentence", "primaryCtaLabel": "Primary CTA", "secondaryCtaLabel": "Secondary CTA" },
  "trustBadges": [ { "title": "Trust point", "description": "1 sentence", "iconName": "ShieldCheck" } ]
}

SECTION SELECTION RULES (very important):
- "sections" is the ordered list of sections the website should render, chosen specifically for THIS profession. Do NOT include sections that do not apply.
- Allowed values: HERO, SERVICES, ABOUT, EXPERTISE, GALLERY, MENU, PROCESS, TRUST, WHY_CHOOSE_US, INDUSTRIES, FAQ, CTA, CONTACT, LOCATION.
- Always begin with HERO and end with CONTACT then LOCATION.
- Include GALLERY for visually-led businesses (photography, interiors, food & dining, fitness, real estate, beauty).
- Include MENU for food & dining businesses, and reuse MENU as "packages", "membership plans", or "featured listings" for businesses that sell packages (e.g. photography packages, gym memberships, property listings).
- Include EXPERTISE when the business has distinct specialities or a signature style/approach.
- Omit INDUSTRIES and TESTIMONIALS unless clearly relevant.

OPTIONAL BLOCKS:
- Provide "gallery" ONLY when GALLERY is in "sections". Give each item a concrete "imageQuery" describing the ideal photograph.
- Provide "menu" ONLY when MENU is in "sections".
- Provide "expertise" ONLY when EXPERTISE is in "sections".
- Provide "industries" ONLY when INDUSTRIES is in "sections".

DESIGN SELECTION (choose the visual identity for this profession):
- "design.archetype" MUST be one of the listed ids. Pick the aesthetic that best fits this exact profession and sector:
  - design-photo-editorial: image-led, dark & editorial (photography, interior/architecture).
  - design-restaurant-warm: warm & appetite-driven (restaurants, cafes, catering).
  - design-clinic-clean: calm & clinical, trust-first (clinics, doctors, healthcare).
  - design-realestate-premium: premium listings (real estate, property, builders).
  - design-bold-energetic: bold & high-energy (gyms, fitness, coaching, sports).
  - design-beauty-elegant: soft & elegant (salons, spas, beauty, bridal).
  - design-classic-professional: clean & credible general default (legal, consulting, trades, or anything unsure).
- "design.accentColor" is OPTIONAL and must be a 6-digit hex like "#0d9488". Omit it to use the archetype's own palette.
- Never invent markup, CSS, or font names — only the id and an optional hex accent.

TRUTHFULNESS RULES (mandatory):
- NEVER invent testimonials, awards, certifications, years in business, staff counts, client counts, addresses, phone numbers, or exact prices.
- If a value is unknown, omit it. For prices, use "On enquiry" rather than inventing numbers.
- General industry statements are fine; business-specific facts must NOT be fabricated.

LOCALISATION: Write in professional Indian English and reference "${city}" naturally.
${
  options?.industryBrief
    ? `
INDUSTRY DESIGN BLUEPRINT (derived from how the best-performing reference websites in "${profession}" are built). Align the copy style with it — this is style guidance only, so never invent facts to match it:
${options.industryBrief}
`
    : ''
}`;

  const candidateModels = await resolveGeminiModels(apiKey);
  const deadline = geminiAuthoringDeadline();

  for (const model of candidateModels) {
    try {
      const res = await callGeminiModel({ model, apiKey, prompt, temperature: 0.3, deadline });
      if (!res) break;

      if (!res.ok) {
        console.warn(`[Gemini AI] Model ${model} failed: ${await describeGeminiFailure(res)}`);
        continue;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      if (
        parsed &&
        typeof parsed === 'object' &&
        parsed.heroHeadline &&
        Array.isArray(parsed.services) &&
        parsed.services.length > 0
      ) {
        console.log(`[Gemini AI] Successfully generated dynamic copy with ${model} for "${businessName}" (${profession})`);
        return sanitizeAiContent(parsed, facts);
      }
    } catch (err) {
      console.warn(`[Gemini AI] Failed calling ${model}:`, err);
    }
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*  AI diagnostics (owner-facing)                                             */
/* -------------------------------------------------------------------------- */

/**
 * Explains *why* AI-authored output did or did not happen.
 *
 * The model and the deterministic fallback deliberately produce the same shape
 * of result, so "did the AI actually run?" is otherwise unanswerable from the
 * outside. This reports which variable names are populated (never their values),
 * whether a value was found in a `.env` file, and the outcome of each attempt.
 */
export interface GeminiKeyState {
  /** Variable names this app actually reads, and whether each is populated. */
  envVars: Record<string, boolean>;
  /** Populated variable names we do NOT read — usually a naming mistake. */
  unexpectedVars: Record<string, boolean>;
  /** A value was found by reading `.env.local` / `.env` from disk. */
  foundInEnvFile: boolean;
  /** `getGeminiApiKey()` resolves, i.e. AI calls will be attempted at all. */
  resolved: boolean;
}

const READ_KEY_NAMES = ['GEMINI_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY'];
const OTHER_KEY_NAMES = [
  'GOOGLE_API_KEY',
  'GEMINI_KEY',
  'GOOGLE_GEMINI_API_KEY',
  'GOOGLE_AI_API_KEY',
];

function isPopulated(name: string): boolean {
  const value = process.env[name];
  return Boolean(value && value.trim().length > 0);
}

function keyFoundInEnvFile(): boolean {
  try {
    for (const file of ['.env.local', '.env']) {
      const fullPath = path.join(process.cwd(), file);
      if (!fs.existsSync(fullPath)) continue;
      const text = fs.readFileSync(fullPath, 'utf8');
      for (const line of text.split(/\r?\n/)) {
        const m = line.match(/^\s*(?:GEMINI_API_KEY|GOOGLE_GENERATIVE_AI_API_KEY)\s*=\s*(.*)$/);
        if (m && m[1] && m[1].trim().replace(/^['"]|['"]$/g, '').length > 5) return true;
      }
    }
  } catch {
    // Diagnostics must never throw.
  }
  return false;
}

export function describeGeminiKeyState(): GeminiKeyState {
  const envVars: Record<string, boolean> = {};
  for (const name of READ_KEY_NAMES) envVars[name] = isPopulated(name);

  const unexpectedVars: Record<string, boolean> = {};
  for (const name of OTHER_KEY_NAMES) {
    if (isPopulated(name)) unexpectedVars[name] = true;
  }

  return {
    envVars,
    unexpectedVars,
    foundInEnvFile: keyFoundInEnvFile(),
    resolved: Boolean(getGeminiApiKey()),
  };
}

/**
 * Strips anything that could carry a credential out of an error we log or
 * report — Google's URLs embed the key in a query parameter, so a raw error
 * could otherwise leak it into logs.
 */
export function scrubSecretText(input: unknown): string {
  const text =
    typeof input === 'string' ? input : input instanceof Error ? input.message : String(input ?? '');
  return text
    .replace(/key=[^&\s"']+/gi, 'key=***')
    .replace(/AIza[0-9A-Za-z_\-]{10,}/g, 'AIza***')
    .slice(0, 200);
}

export interface IndustryBlueprintAiDiagnostics {
  /** The key resolved, so a call was actually attempted. */
  keyResolved: boolean;
  /** Models actually tried, after asking the API what it offers. */
  availableModels: string[];
  /** Outcome of each model attempt, in order. */
  attempts: Array<{ model: string; status?: number; error?: string; ms?: number }>;
  /** A usable blueprint came back. */
  authored: boolean;
  /** Which model authored it. */
  model: string | null;
  at: string | null;
}

let lastBlueprintAiDiagnostics: IndustryBlueprintAiDiagnostics = {
  keyResolved: false,
  availableModels: [],
  attempts: [],
  authored: false,
  model: null,
  at: null,
};

export function getIndustryBlueprintAiDiagnostics(): IndustryBlueprintAiDiagnostics {
  return lastBlueprintAiDiagnostics;
}

/** Marks a request boundary so the report describes that request only. */
export function resetIndustryBlueprintAiDiagnostics(): void {
  lastBlueprintAiDiagnostics = {
    keyResolved: false,
    availableModels: [],
    attempts: [],
    authored: false,
    model: null,
    at: null,
  };
}

/**
 * Hints for an attempt that never got an HTTP status. A timeout or a dropped
 * connection is not the provider saying "no" — it is the provider being
 * unreachable, which is worth trying again later.
 */
const GEMINI_TRANSIENT_HINT =
  /timeout|timed out|abort|ECONNRESET|ENOTFOUND|EAI_AGAIN|fetch failed|socket|network|high demand/i;

function attemptLooksTransient(attempt: { status?: number; error?: string }): boolean {
  if (typeof attempt.status === 'number') return GEMINI_TRANSIENT_STATUS.has(attempt.status);
  return GEMINI_TRANSIENT_HINT.test(attempt.error || '');
}

/**
 * True when the last blueprint attempt failed for a reason that may pass on its
 * own (provider busy, rate limited, unreachable) rather than a settled "no"
 * (no key, retired model, refused access).
 *
 * Callers use this to decide whether the deterministic fallback is a placeholder
 * — a design authored during an outage must not be frozen permanently.
 */
export function blueprintAuthoringFailureIsTransient(): boolean {
  const record = lastBlueprintAiDiagnostics;
  if (record.authored || !record.keyResolved) return false;
  return record.attempts.length > 0 && record.attempts.some(attemptLooksTransient);
}

export interface IndustryBlueprintAiFacts {
  profession: string;
  city?: string;
  /** Allow-listed archetype ids the model may choose from. */
  archetypeIds: string[];
  /** Allow-listed palette system ids the model may choose from. */
  paletteIds: string[];
  /** Section types the renderer can actually render, in any order. */
  sectionIds: string[];
}

/**
 * Asks the model for the design blueprint that the best-performing websites in
 * an industry share (section order/emphasis, layout archetype, palette system,
 * copy framing, imagery treatment).
 *
 * The model only ever *selects* from the allow-lists passed in — it can never
 * invent markup, CSS, fonts or colours. The caller validates the result again
 * before it is persisted. Returns null when no API key is configured or the
 * call fails, so callers fall back to the deterministic blueprint.
 */
export async function generateIndustryBlueprintJson(
  facts: IndustryBlueprintAiFacts
): Promise<unknown | null> {
  const attempts: IndustryBlueprintAiDiagnostics['attempts'] = [];
  const report = (patch: Partial<IndustryBlueprintAiDiagnostics>) => {
    lastBlueprintAiDiagnostics = {
      ...lastBlueprintAiDiagnostics,
      attempts,
      at: new Date().toISOString(),
      ...patch,
    };
  };

  const apiKey = getGeminiApiKey();
  if (!apiKey || apiKey.trim().length === 0) {
    report({ keyResolved: false, authored: false, model: null });
    return null;
  }
  report({ keyResolved: true, authored: false, model: null });

  const profession = facts.profession?.trim() || 'Local Business';
  const city = facts.city?.trim() || 'India';

  const prompt = `You are a senior web designer who has audited thousands of top-ranking local-business websites (India and global), and you know exactly what the highest-converting sites in each industry do.

INDUSTRY: "${profession}" (operating in ${city}, India)

Task: describe the DESIGN BLUEPRINT that the best-performing reference websites in this exact industry share. Reason from how those reference sites are built: which sections they lead with, whether the hero is a full-bleed visual or a split text/visual, the colour mood and typography mood, the trust signals they surface, how services are named, and the kind of photography used.

Return ONLY a single valid JSON object (no markdown fences, no commentary):
{
  "archetype": "EXACTLY ONE of: ${facts.archetypeIds.join(' | ')}",
  "paletteId": "EXACTLY ONE of: ${facts.paletteIds.join(' | ')}",
  "accentColor": "#RRGGBB or omit (optional refinement of the palette accent)",
  "heroStyle": "fullbleed | split | centered",
  "sectionOrder": ["ORDERED subset of: ${facts.sectionIds.join(' | ')} — must start with HERO, 7-11 items, industry-appropriate flow"],
  "copy": {
    "tone": "3-8 words describing the voice used by leaders in this industry (e.g. 'confident, results-first, showroom-shine')",
    "heroPattern": "the headline pattern top sites use, with {city} as a placeholder (e.g. 'Showroom-shine car care {city} drivers trust')",
    "trustSignals": ["4 short trust signals this industry's best sites emphasise (warranty, turnaround, equipment, materials...)"],
    "serviceNamingStyle": "how services are named in this industry (e.g. 'outcome-first package names: Ceramic Coating, Paint Correction')",
    "primaryCta": "the primary call-to-action wording this industry's top sites use"
  },
  "imagery": {
    "treatment": "1 sentence describing the photography style: framing, lighting, mood",
    "keywords": ["4-6 short stock-photo search phrases, 1-3 words each, e.g. 'ceramic coating', 'car interior detailing'"]
  }
}

RULES:
- Select values ONLY from the provided lists for archetype, paletteId and sectionOrder. Never invent ids.
- Never write markup, CSS, HTML, font names or colour values other than the optional accentColor hex.
- The sectionOrder must reflect how reference sites in this industry actually flow (what they put early vs late).
- Strong visual/portfolio industries should not open with a wall of text; service industries should not bury the services.
- Truthfulness: this is design guidance only. Never invent awards, certifications, years, staff counts, clients or prices.

LOCALISATION: assume Indian market context; keep wording professional Indian English.`;

  const candidateModels = await resolveGeminiModels(apiKey);
  report({ availableModels: candidateModels });

  const deadline = geminiAuthoringDeadline();

  for (const model of candidateModels) {
    if (Date.now() >= deadline) break;
    const startedAt = Date.now();
    try {
      const res = await callGeminiModel({ model, apiKey, prompt, temperature: 0.4, deadline });
      if (!res) break;

      if (!res.ok) {
        const reason = await describeGeminiFailure(res);
        attempts.push({ model, status: res.status, error: reason, ms: Date.now() - startedAt });
        console.warn(`[Gemini AI] Blueprint model ${model} failed: ${reason}`);
        continue;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        attempts.push({ model, error: 'empty response' });
        continue;
      }

      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.sectionOrder)) {
        attempts.push({ model, status: 200, ms: Date.now() - startedAt });
        report({ authored: true, model });
        console.log(`[Gemini AI] Industry blueprint authored with ${model} for "${profession}"`);
        return parsed;
      }
      attempts.push({ model, error: 'unusable payload (no sectionOrder)' });
    } catch (err) {
      attempts.push({ model, error: scrubSecretText(err), ms: Date.now() - startedAt });
      console.warn(`[Gemini AI] Blueprint call failed on ${model}: ${scrubSecretText(err)}`);
    }
  }

  report({ authored: false, model: null });
  return null;
}

export type RegeneratableSectionType =
  | 'HERO'
  | 'ABOUT'
  | 'SERVICES'
  | 'WHY_CHOOSE_US'
  | 'PROCESS'
  | 'FAQ'
  | 'GALLERY'
  | 'MENU';

export interface RegenerateSectionParams {
  sectionType: RegeneratableSectionType;
  facts: GenerateAiContentFacts;
  customPrompt?: string;
}

/**
 * Regenerates an individual section's content using Gemini AI, with fallback to deterministic data.
 */
export async function regenerateSectionContent(params: RegenerateSectionParams): Promise<any> {
  const { sectionType, facts, customPrompt } = params;
  const apiKey = getGeminiApiKey();
  const businessName = facts.businessName?.trim() || 'Local Enterprise';
  const profession = facts.profession?.trim() || 'Professional Practice';
  const city = facts.city?.trim() || 'Delhi NCR';

  if (apiKey) {
    const candidateModels = await resolveGeminiModels(apiKey);
    const deadline = geminiAuthoringDeadline();
    const sectionPrompt = `You are an elite Indian B2B & SMB copywriter for:
- Business: "${businessName}"
- Profession: "${profession}"
- City: "${city}", India
${customPrompt ? `Client Instruction: ${customPrompt}` : ''}

Generate updated, high-converting copy specifically for the section: "${sectionType}".
Return ONLY a valid JSON object matching this schema for ${sectionType}:

${
  sectionType === 'HERO'
    ? `{
  "badge": "Short 3-5 word category badge",
  "headline": "Compelling 6-10 word headline tailored to profession",
  "subheadline": "1-sentence value proposition mentioning ${city}",
  "primaryCta": { "label": "Direct action CTA", "href": "#contact" },
  "secondaryCta": { "label": "Explore Services", "href": "#services" }
}`
    : sectionType === 'ABOUT'
    ? `{
  "title": "About ${businessName}",
  "leadParagraph": "1-sentence overview of ${businessName} in ${city}",
  "body": "2-sentence description of experience and standards",
  "highlights": [
    { "title": "Highlight 1 (2-4 words)", "description": "1 short sentence" },
    { "title": "Highlight 2 (2-4 words)", "description": "1 short sentence" },
    { "title": "Highlight 3 (2-4 words)", "description": "1 short sentence" },
    { "title": "Highlight 4 (2-4 words)", "description": "1 short sentence" }
  ]
}`
    : sectionType === 'SERVICES'
    ? `{
  "sectionTitle": "Services Section Title",
  "sectionSubtitle": "1-sentence subtitle describing service scope",
  "items": [
    { "id": "srv-1", "title": "Service 1", "description": "1-2 sentence description", "isConfirmed": true, "provenance": "AI_SYNTHESIZED" },
    { "id": "srv-2", "title": "Service 2", "description": "1-2 sentence description", "isConfirmed": true, "provenance": "AI_SYNTHESIZED" },
    { "id": "srv-3", "title": "Service 3", "description": "1-2 sentence description", "isConfirmed": true, "provenance": "AI_SYNTHESIZED" },
    { "id": "srv-4", "title": "Service 4", "description": "1-2 sentence description", "isConfirmed": true, "provenance": "AI_SYNTHESIZED" }
  ]
}`
    : sectionType === 'WHY_CHOOSE_US'
    ? `{
  "sectionTitle": "Why Choose ${businessName}",
  "sectionSubtitle": "Key advantages of partnering with us",
  "points": [
    { "title": "Advantage 1", "description": "1 sentence explanation" },
    { "title": "Advantage 2", "description": "1 sentence explanation" },
    { "title": "Advantage 3", "description": "1 sentence explanation" },
    { "title": "Advantage 4", "description": "1 sentence explanation" }
  ]
}`
    : sectionType === 'PROCESS'
    ? `{
  "sectionTitle": "Our Process",
  "sectionSubtitle": "How we work together",
  "steps": [
    { "number": "01", "title": "Initial Consultation", "description": "Understanding your exact requirements." },
    { "number": "02", "title": "Strategic Planning", "description": "Tailoring an actionable solution." },
    { "number": "03", "title": "Execution", "description": "Disciplined delivery with quality assurance." },
    { "number": "04", "title": "Ongoing Support", "description": "Continuous monitoring and assistance." }
  ]
}`
    : sectionType === 'FAQ'
    ? `{
  "sectionTitle": "Frequently Asked Questions",
  "items": [
    { "question": "Question 1 for this profession?", "answer": "Clear helpful answer." },
    { "question": "Question 2 for this profession?", "answer": "Clear helpful answer." },
    { "question": "Question 3 regarding consultation in ${city}?", "answer": "Clear helpful answer." }
  ]
}`
    : `{ "status": "ok" }`
}`;

    for (const model of candidateModels) {
      try {
        const res = await callGeminiModel({
          model,
          apiKey,
          prompt: sectionPrompt,
          temperature: 0.5,
          deadline,
        });
        if (!res) break;

        if (res.ok) {
          const data = await res.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
            const parsed = JSON.parse(cleaned);
            if (parsed && typeof parsed === 'object') {
              return parsed;
            }
          }
        } else {
          console.warn(
            `[Gemini AI] Section ${sectionType} model ${model} failed: ${await describeGeminiFailure(res)}`
          );
        }
      } catch (err) {
        console.warn(`[Gemini AI] Failed regenerating ${sectionType} with ${model}:`, err);
      }
    }
  }

  // Fallback to deterministic profile
  const fallback = getDeterministicProfessionProfile(facts);
  if (sectionType === 'HERO') {
    return {
      badge: fallback.heroBadge,
      headline: fallback.heroHeadline,
      subheadline: fallback.heroSubheadline,
      primaryCta: { label: fallback.primaryCtaLabel, href: '#contact' },
      secondaryCta: { label: 'Explore Services', href: '#services' },
    };
  }
  if (sectionType === 'ABOUT') {
    return {
      title: `About ${businessName}`,
      leadParagraph: fallback.aboutLead,
      body: fallback.aboutBody,
      highlights: fallback.highlights,
    };
  }
  if (sectionType === 'SERVICES') {
    return {
      sectionTitle: fallback.servicesSectionTitle,
      sectionSubtitle: fallback.servicesSectionSubtitle,
      items: fallback.services.map((s, i) => ({
        id: `srv-${i + 1}`,
        title: s.title,
        description: s.description,
        isConfirmed: true,
        provenance: 'AI_SYNTHESIZED' as const,
      })),
    };
  }
  if (sectionType === 'WHY_CHOOSE_US') {
    return {
      sectionTitle: `Why Choose ${businessName}`,
      sectionSubtitle: `Delivering predictable excellence for clients in ${city}`,
      points: fallback.whyChooseUs,
    };
  }
  if (sectionType === 'PROCESS') {
    return {
      sectionTitle: 'How We Work',
      sectionSubtitle: 'A structured approach delivering transparent results',
      steps: fallback.processSteps,
    };
  }
  if (sectionType === 'FAQ') {
    return {
      sectionTitle: 'Frequently Asked Questions',
      items: fallback.faqs,
    };
  }

  return null;
}
