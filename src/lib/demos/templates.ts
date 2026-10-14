import { WebsiteTheme, WebsiteContent, WebsiteDesign, WebsiteLayout } from '@/types';
import { THEMES } from './themes';
import {
  INDIAN_CA_ARCHETYPES,
  inferCAArchetype,
  type CAArchetypeMeta,
} from './ca-archetypes';

export interface LeadFacts {
  businessName: string;
  profession: string;
  city: string;
  address: string;
  publicEmail?: string | null;
  publicPhone?: string | null;
  source?: string;
}

export interface ProfessionTemplate {
  id: string;
  name: string;
  profession: string;
  description: string;
  themes: WebsiteTheme[];
  defaultTheme: WebsiteTheme;
  buildContent(facts: LeadFacts, theme?: WebsiteTheme, design?: WebsiteDesign): WebsiteContent;
}

export { THEMES };
export { INDIAN_CA_ARCHETYPES, inferCAArchetype, type CAArchetypeMeta };

/**
 * Clean, unopinionated base template.
 * Serves as the fallback engine while the template registry is cleared for new user-provided templates.
 */
export const BASE_TEMPLATE: ProfessionTemplate = {
  id: 'BASE_TEMPLATE',
  name: 'Standard Practice Baseline',
  profession: 'Professional Services',
  description: 'Unopinionated, neutral base template engineered to receive custom layouts and configurations.',
  themes: [
    THEMES.executiveNavy,
    THEMES.corporateSlate,
    THEMES.techTeal,
    THEMES.emeraldPrestige,
  ],
  defaultTheme: THEMES.executiveNavy,
  buildContent(facts: LeadFacts, theme?: WebsiteTheme, design?: WebsiteDesign): WebsiteContent {
    const brandName = facts.businessName || 'Professional Practice';
    const city = facts.city || 'Gurgaon';
    const activeTheme = theme || (design ? design.theme : THEMES.executiveNavy);
    const currentYear = new Date().getFullYear();
    const professionLabel = facts.profession || 'Professional Services';

    return {
      meta: {
        title: `${brandName} | Professional Advisory in ${city}`,
        description: `Dedicated professional practice in ${city} providing advisory, compliance, and strategic consulting services.`,
        profession: professionLabel,
        templateId: 'BASE_TEMPLATE',
      },
      brand: {
        businessName: brandName,
        tagline: `Professional Advisory & Client Services in ${city}`,
        provenance: facts.businessName ? 'VERIFIED_LEAD' : 'NEUTRAL_PLACEHOLDER',
      },
      theme: activeTheme,
      design,
      navigation: {
        items: [
          { label: 'Services', href: '#services' },
          { label: 'About', href: '#about' },
          { label: 'Contact', href: '#contact' },
        ],
        ctaText: 'Schedule Consultation',
        ctaHref: '#contact',
      },
      hero: {
        badge: `${professionLabel} & Advisory`,
        headline: `Strategic Clarity & Client-Focused Professional Guidance`,
        subheadline: `Delivering dependable advisory and consulting solutions for clients in ${city} and across the region.`,
        primaryCta: {
          label: 'Schedule Consultation',
          href: '#contact',
        },
        secondaryCta: {
          label: 'Explore Services',
          href: '#services',
        },
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      about: {
        title: 'About Our Practice',
        leadParagraph: `${brandName} is a professional practice based in ${city}, providing comprehensive advisory and consulting services.`,
        body: `We partner with enterprises, organizations, and private clients to maintain regulatory compliance, manage strategic priorities, and deliver measurable results. Our work emphasizes methodical adherence to industry standards, proactive risk management, and direct partner engagement.`,
        highlights: [
          {
            title: 'Professional Integrity',
            description: 'Uncompromising adherence to statutory frameworks and codes of professional conduct.',
          },
          {
            title: 'Client-Centered Focus',
            description: 'Tailored advisory solutions engineered around specific client operational requirements.',
          },
          {
            title: 'Confidential Governance',
            description: 'Institutional data protocols safeguarding sensitive client documentation and records.',
          },
          {
            title: 'Proactive Advisory',
            description: 'Structured timelines, clear communication, and ongoing regulatory oversight.',
          },
        ],
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      services: {
        sectionTitle: 'Core Practice Areas & Services',
        sectionSubtitle: `Comprehensive advisory and consulting solutions tailored for clients in ${city}.`,
        items: [
          {
            id: 'srv-1',
            title: 'Strategic Consultation & Advisory',
            description: 'Methodical advisory and consultation tailored to corporate governance and operational needs.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'srv-2',
            title: 'Compliance & Regulatory Management',
            description: 'Statutory compliance tracking, documentation review, and formal regulatory filings.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'srv-3',
            title: 'Client Representation & Assessment',
            description: 'Formal representation, risk assessment, and technical advisory across complex matters.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'srv-4',
            title: 'Institutional Scrutiny & Diligence',
            description: 'Independent review, financial scrutiny, and due diligence reporting for business transactions.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
        ],
      },
      whyChooseUs: {
        sectionTitle: 'Why Choose Our Practice',
        sectionSubtitle: 'Core commitments that define our client engagements and professional standards.',
        points: [
          {
            title: 'Direct Partner Attention',
            description: 'Engagements are directly overseen by senior advisors who understand your operational context.',
            iconName: 'UserCheck',
          },
          {
            title: 'Regulatory Accuracy',
            description: 'Meticulous adherence to current statutory circulars and industry quality standards.',
            iconName: 'CheckCircle2',
          },
          {
            title: 'Confidentiality & Data Security',
            description: 'Strict security protocols protecting your corporate records and proprietary data.',
            iconName: 'Lock',
          },
          {
            title: 'Transparent Communication',
            description: 'Clear milestone schedules and straightforward explanations without unnecessary jargon.',
            iconName: 'Clock',
          },
        ],
      },
      process: {
        sectionTitle: 'Our Engagement Methodology',
        sectionSubtitle: 'A structured, transparent roadmap engineered for accuracy and predictability.',
        steps: [
          {
            number: '01',
            title: 'Scope & Assessment',
            description: `We analyze your organizational structure and specific operational objectives in ${city}.`,
          },
          {
            number: '02',
            title: 'Review & Formulation',
            description: 'Detailed analysis of supporting documentation, requirements, and compliance timelines.',
          },
          {
            number: '03',
            title: 'Execution & Delivery',
            description: 'Methodical preparation and delivery of reports, documentation, and advisory deliverables.',
          },
          {
            number: '04',
            title: 'Ongoing Support',
            description: 'Continuous advisory tracking, regulatory alerts, and responsive support.',
          },
        ],
      },
      trust: {
        sectionTitle: 'Standards of Professional Governance',
        badges: [
          {
            title: 'Professional Ethics Compliant',
            description: 'Strict adherence to code of professional ethics, peer review standards, and independence norms.',
            iconName: 'ShieldCheck',
          },
          {
            title: 'Senior Partner Oversight',
            description: 'Qualified senior professionals directly supervise documentation and engagement quality.',
            iconName: 'UserCheck',
          },
          {
            title: 'Confidential Governance',
            description: 'Institutional security protocols protecting sensitive corporate and personal files.',
            iconName: 'Lock',
          },
          {
            title: 'Regulatory Precision',
            description: 'Continuous tracking of statutory updates, notifications, and compliance mandates.',
            iconName: 'CheckCircle2',
          },
        ],
      },
      expertise: {
        sectionTitle: 'Key Focus Areas',
        sectionSubtitle: 'Specialized proficiency across core advisory and operational domains.',
        items: [
          {
            title: 'Statutory Advisory & Governance',
            description: 'Comprehensive guidance on regulatory compliance, filings, and statutory adherence.',
            tags: ['Compliance', 'Governance', 'Advisory'],
          },
          {
            title: 'Corporate Planning & Structure',
            description: 'Strategic planning, entity structuring, and operational efficiency consulting.',
            tags: ['Corporate Planning', 'Structuring', 'Due Diligence'],
          },
          {
            title: 'Financial Scrutiny & Diligence',
            description: 'Methodical review, financial analysis, and due diligence reporting for operations.',
            tags: ['Financial Review', 'Scrutiny', 'Due Diligence'],
          },
          {
            title: 'Operational Risk & Controls',
            description: 'Proactive evaluation of operational workflows, control procedures, and compliance tracking.',
            tags: ['Risk Management', 'Internal Controls', 'Operations'],
          },
        ],
      },
      ctaBanner: {
        title: `Connect with Our ${city} Practice`,
        subtitle: 'Schedule an introductory consultation to discuss your specific advisory or compliance requirements.',
        primaryCta: {
          label: 'Schedule Consultation',
          href: '#contact',
        },
        secondaryCta: {
          label: 'Explore Services',
          href: '#services',
        },
      },
      industries: {
        enabled: true,
        sectionTitle: 'Industries We Serve',
        items: [
          'Technology & Software Services',
          'Manufacturing & Supply Chain',
          'Real Estate & Infrastructure',
          'Retail & E-commerce',
          'Healthcare & Life Sciences',
          'Professional Consulting',
        ],
      },
      testimonials: {
        enabled: false,
        sectionTitle: 'Client Testimonials',
        items: [],
      },
      faq: {
        sectionTitle: 'Frequently Asked Questions',
        items: [
          {
            question: 'How do we initiate a professional engagement?',
            answer: 'You can reach out through our contact form or direct phone line. We schedule an introductory consultation to evaluate your operational context and scope of requirements.',
          },
          {
            question: `Do you assist clients outside of ${city}?`,
            answer: `Yes, while our primary practice is anchored in ${city}, we advise clients across regional and national jurisdictions.`,
          },
          {
            question: 'What is your standard engagement turnaround?',
            answer: 'Turnaround schedules are determined during initial scoping, with milestones agreed upon before engagement commencement.',
          },
        ],
      },
      contact: {
        sectionTitle: 'Connect With Our Team',
        sectionSubtitle: 'Reach out to schedule an introductory consultation regarding your advisory or compliance requirements.',
        formTitle: 'Send a Message',
        simulatedDisclaimer: 'Demo concept only — inquiries submitted through this form are simulated and are not delivered to the business.',
        publicEmail: facts.publicEmail || null,
        publicPhone: facts.publicPhone || null,
        ctaSubmitText: 'Submit Message (Simulated)',
      },
      location: {
        address: facts.address || `${city}, India`,
        city: facts.city || 'Gurgaon',
        officeHours: 'Monday – Friday: 9:30 AM – 6:30 PM IST',
        mapPlaceholder: true,
      },
      footer: {
        copyright: `© ${currentYear} ${brandName}. All rights reserved.`,
        disclaimer: 'Personalized website demonstration concept generated by GetVisible. Prepared exclusively for review and evaluation.',
      },
    };
  },
};

/**
 * Backward compatibility alias for the base CA template.
 */
export const CA_ACCOUNTING_TEMPLATE: ProfessionTemplate = BASE_TEMPLATE;

/**
 * Design 1: Premium Editorial (Venerable Jurisprudence)
 */
export const DESIGN_1_PREMIUM_TEMPLATE: ProfessionTemplate = {
  id: 'design-1-premium',
  name: 'Premium Editorial (Venerable Jurisprudence)',
  profession: 'Chartered Accountant',
  description: 'Authoritative editorial design with deep corporate navy and antique gold.',
  themes: [THEMES.executiveNavy, THEMES.corporateSlate],
  defaultTheme: THEMES.executiveNavy,
  buildContent(facts, theme, design) {
    const base = BASE_TEMPLATE.buildContent(facts, theme, design);
    return {
      ...base,
      meta: {
        ...base.meta,
        templateId: 'design-1-premium',
      },
      hero: {
        ...base.hero,
        badge: 'Statutory Assurance & Corporate Tax Advisory',
        headline: 'Authoritative Tax Advisory & Statutory Assurance Practice',
        subheadline: `Partner-led chartered accountancy solutions in ${facts.city || 'Gurgaon'} safeguarding compliance, governance, and financial integrity for enterprises.`,
      },
    };
  },
};

/**
 * Design 2: Minimalist Ledger (Architectural Ledger)
 */
export const DESIGN_2_MINIMALIST_TEMPLATE: ProfessionTemplate = {
  id: 'design-2-minimalist',
  name: 'Minimalist Ledger (Architectural Ledger)',
  profession: 'Chartered Accountant',
  description: 'High-density architectural ledger layout with JetBrains Mono data tags and fine-line borders.',
  themes: [THEMES.corporateSlate, THEMES.techTeal],
  defaultTheme: THEMES.corporateSlate,
  buildContent(facts, theme, design) {
    const base = BASE_TEMPLATE.buildContent(facts, theme, design);
    return {
      ...base,
      meta: {
        ...base.meta,
        templateId: 'design-2-minimalist',
      },
      hero: {
        ...base.hero,
        badge: 'GST Defense & Industrial Accounting Corridor',
        headline: 'Field-Tested GST Defense & Plant-Level Audit Protection',
        subheadline: `High-precision indirect tax representation, scrutiny defense, and ITC optimization in ${facts.city || 'Gurgaon'}.`,
      },
    };
  },
};

/**
 * Design 3: Contemporary Corporate (Executive Capital)
 */
export const DESIGN_3_CONTEMPORARY_TEMPLATE: ProfessionTemplate = {
  id: 'design-3-contemporary',
  name: 'Contemporary Corporate (Executive Capital)',
  profession: 'Chartered Accountant',
  description: 'Prestige corporate advisory layout with elegant split cards and warm gradient lighting.',
  themes: [THEMES.emeraldPrestige, THEMES.techTeal],
  defaultTheme: THEMES.emeraldPrestige,
  buildContent(facts, theme, design) {
    const base = BASE_TEMPLATE.buildContent(facts, theme, design);
    return {
      ...base,
      meta: {
        ...base.meta,
        templateId: 'design-3-contemporary',
      },
      hero: {
        ...base.hero,
        badge: 'Virtual CFO & Strategic Advisory',
        headline: 'Strategic Financial Leadership for High-Growth Ventures',
        subheadline: `Investor-ready MIS reporting, cross-border remittance, and agile financial leadership anchored in ${facts.city || 'Gurgaon'}.`,
      },
    };
  },
};

/**
 * SMB Template: Healthcare & Dental Clinic
 */
export const CLINIC_HEALTHCARE_TEMPLATE: ProfessionTemplate = {
  id: 'CLINIC_HEALTHCARE',
  name: 'Healthcare & Modern Dental Clinic',
  profession: 'Healthcare / Clinic',
  description: 'Clinical teal and clean modern layout designed for dental clinics, multispeciality practices, and healthcare doctors.',
  themes: [THEMES.techTeal, THEMES.emeraldPrestige],
  defaultTheme: THEMES.techTeal,
  buildContent(facts, theme, design) {
    const brandName = facts.businessName || 'Healthcare & Dental Practice';
    const city = facts.city || 'Gurgaon';
    const activeTheme = theme || (design ? design.theme : THEMES.techTeal);
    const currentYear = new Date().getFullYear();

    return {
      meta: {
        title: `${brandName} | Modern Healthcare & Dental Clinic in ${city}`,
        description: `Patient-centered medical care, advanced diagnostic services, and dental wellness in ${city}.`,
        profession: 'Healthcare & Clinic',
        templateId: 'CLINIC_HEALTHCARE',
      },
      brand: {
        businessName: brandName,
        tagline: `Compassionate Care & Clinical Excellence in ${city}`,
        provenance: facts.businessName ? 'VERIFIED_LEAD' : 'NEUTRAL_PLACEHOLDER',
      },
      theme: activeTheme,
      design,
      navigation: {
        items: [
          { label: 'Treatments', href: '#services' },
          { label: 'About Doctor', href: '#about' },
          { label: 'Why Us', href: '#why-us' },
          { label: 'Contact', href: '#contact' },
        ],
        ctaText: 'Book Appointment',
        ctaHref: '#contact',
      },
      hero: {
        badge: 'Modern Healthcare & Dental Clinic',
        headline: 'Advanced Medical Care & Patient-Centered Clinical Excellence',
        subheadline: `Delivering compassionate consultations, sterile dental treatments, and accurate diagnostics for families in ${city}.`,
        primaryCta: {
          label: 'Book Consultation / Appointment',
          href: '#contact',
        },
        secondaryCta: {
          label: 'View Treatments & Specialties',
          href: '#services',
        },
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      about: {
        title: 'About Our Clinical Practice',
        leadParagraph: `${brandName} is a trusted healthcare facility in ${city}, providing comprehensive clinical diagnostics and specialized care.`,
        body: `We are committed to delivering empathetic, evidence-based medical and dental solutions. With modern diagnostics, strict hygiene protocols, and dedicated patient care, our team prioritizes your health and long-term well-being.`,
        highlights: [
          {
            title: 'Sterilized Clinical Environment',
            description: 'Strict NABH-aligned sanitization protocols safeguarding patient health.',
          },
          {
            title: 'Experienced Practitioners',
            description: 'Board-certified specialists with extensive clinical diagnostic experience.',
          },
          {
            title: 'Transparent Care Plans',
            description: 'Honest medical advice and transparent treatment plans without hidden charges.',
          },
          {
            title: 'Minimal Wait Times',
            description: 'Organized appointment scheduling designed around your busy lifestyle.',
          },
        ],
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      services: {
        sectionTitle: 'Treatments & Clinical Specialties',
        sectionSubtitle: `Comprehensive healthcare and specialized care tailored for patients in ${city}.`,
        items: [
          {
            id: 'med-1',
            title: 'General Health & Preventive Checkups',
            description: 'Routine biometric evaluation, chronic disease monitoring, and preventive health screenings.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'med-2',
            title: 'Advanced Dental & Oral Aesthetics',
            description: 'Root canals, painless extractions, orthodontic aligners, and cosmetic smile makeovers.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'med-3',
            title: 'Specialist Diagnostics & Triage',
            description: 'In-house diagnostic tests, rapid pathology evaluation, and doctor-led symptom assessments.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'med-4',
            title: 'Family Wellness & Post-Care Support',
            description: 'Pediatric to geriatric family consultations and structured post-treatment follow-up.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
        ],
      },
      whyChooseUs: {
        sectionTitle: 'Why Choose Our Clinic',
        sectionSubtitle: 'Uncompromising medical ethics and patient-first clinical standards.',
        points: [
          {
            title: 'Patient-First Philosophy',
            description: 'Empathetic care and careful attention to your individual comfort and symptoms.',
            iconName: 'UserCheck',
          },
          {
            title: '100% Sterile Environment',
            description: 'Autoclave-grade sterilization for all medical equipment and procedural suites.',
            iconName: 'ShieldCheck',
          },
          {
            title: 'Transparent Treatment Costs',
            description: 'Clear upfront cost estimates with zero unnecessary lab tests or upsells.',
            iconName: 'CheckCircle2',
          },
          {
            title: 'Convenient Clinic Hours',
            description: 'Evening slots and weekend availability for working professionals and families.',
            iconName: 'Clock',
          },
        ],
      },
      process: {
        sectionTitle: 'Your Patient Journey',
        sectionSubtitle: 'A smooth, transparent clinical workflow designed to keep you informed.',
        steps: [
          {
            number: '01',
            title: 'Book Appointment',
            description: `Schedule a consultation online or via WhatsApp with our ${city} reception desk.`,
          },
          {
            number: '02',
            title: 'Comprehensive Examination',
            description: 'Thorough clinical evaluation and state-of-the-art diagnostic imaging.',
          },
          {
            number: '03',
            title: 'Custom Treatment Plan',
            description: 'Detailed explanation of treatment options, timelines, and costs before proceeding.',
          },
          {
            number: '04',
            title: 'Gentle Care & Recovery',
            description: 'Precision treatment followed by ongoing wellness checkups and recovery support.',
          },
        ],
      },
      ctaBanner: {
        title: `Ready for Quality Healthcare in ${city}?`,
        subtitle: 'Schedule your consultation or dental checkup today with our expert team.',
        primaryCta: {
          label: 'Book Your Visit Now',
          href: '#contact',
        },
        secondaryCta: {
          label: 'Explore Our Treatments',
          href: '#services',
        },
      },
      industries: {
        enabled: false,
        sectionTitle: 'Specialties',
        items: [],
      },
      testimonials: {
        enabled: false,
        sectionTitle: 'Patient Testimonials',
        items: [],
      },
      faq: {
        sectionTitle: 'Frequently Asked Questions',
        items: [
          {
            question: 'How do I schedule an appointment?',
            answer: 'You can book directly via the contact form or our WhatsApp booking line for priority time slots.',
          },
          {
            question: 'Are walk-in consultations accepted?',
            answer: `While walk-ins are welcome at our ${city} clinic, scheduled appointments ensure zero waiting time.`,
          },
          {
            question: 'What hygiene standards are followed?',
            answer: 'We enforce hospital-grade autoclaving, single-use disposables, and routine air sanitization.',
          },
        ],
      },
      contact: {
        sectionTitle: 'Schedule Your Visit',
        sectionSubtitle: 'Contact our clinic reception to reserve a consultation slot or ask any questions.',
        formTitle: 'Book an Appointment',
        simulatedDisclaimer: 'Demo concept only — appointment requests submitted through this form are simulated.',
        publicEmail: facts.publicEmail || null,
        publicPhone: facts.publicPhone || null,
        ctaSubmitText: 'Request Appointment (Simulated)',
      },
      location: {
        address: facts.address || `${city}, India`,
        city: facts.city || 'Gurgaon',
        officeHours: 'Monday – Saturday: 9:00 AM – 8:00 PM IST',
        mapPlaceholder: true,
      },
      footer: {
        copyright: `© ${currentYear} ${brandName}. All rights reserved.`,
        disclaimer: 'Personalized website demonstration concept generated by GetVisible. Prepared exclusively for preview and evaluation.',
      },
    };
  },
};

/**
 * SMB Template: Interior Architecture & Design Studio
 */
export const INTERIOR_ARCHITECTURE_TEMPLATE: ProfessionTemplate = {
  id: 'INTERIOR_ARCHITECTURE',
  name: 'Interior Architecture & Studio Design',
  profession: 'Interior Architecture',
  description: 'Warm slate and luxury serif aesthetic engineered for architectural studios, interior turnkey contractors, and modular design firms.',
  themes: [THEMES.corporateSlate, THEMES.executiveNavy],
  defaultTheme: THEMES.corporateSlate,
  buildContent(facts, theme, design) {
    const brandName = facts.businessName || 'Interior Architecture Studio';
    const city = facts.city || 'Gurgaon';
    const activeTheme = theme || (design ? design.theme : THEMES.corporateSlate);
    const currentYear = new Date().getFullYear();

    return {
      meta: {
        title: `${brandName} | Luxury Interior Architecture & Design in ${city}`,
        description: `Bespoke residential interiors, architectural design, and turnkey execution for modern living in ${city}.`,
        profession: 'Interior Architecture & Design',
        templateId: 'INTERIOR_ARCHITECTURE',
      },
      brand: {
        businessName: brandName,
        tagline: `Timeless Architecture & Bespoke Interior Design in ${city}`,
        provenance: facts.businessName ? 'VERIFIED_LEAD' : 'NEUTRAL_PLACEHOLDER',
      },
      theme: activeTheme,
      design,
      navigation: {
        items: [
          { label: 'Disciplines', href: '#services' },
          { label: 'Studio Philosophy', href: '#about' },
          { label: 'Methodology', href: '#process' },
          { label: 'Contact', href: '#contact' },
        ],
        ctaText: 'Start Your Project',
        ctaHref: '#contact',
      },
      hero: {
        badge: 'Interior Architecture & Design Studio',
        headline: 'Transforming Spaces into Timeless Architectural Experiences',
        subheadline: `Bespoke luxury residences, corporate environments, and turnkey styling crafted with architectural precision in ${city}.`,
        primaryCta: {
          label: 'Request Design Consultation',
          href: '#contact',
        },
        secondaryCta: {
          label: 'Explore Studio Disciplines',
          href: '#services',
        },
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      about: {
        title: 'Studio Philosophy & Craft',
        leadParagraph: `${brandName} is a multidisciplinary interior architecture studio anchored in ${city}, shaping bespoke spaces of quiet luxury and enduring elegance.`,
        body: `We bridge architectural integrity with artisanal craftsmanship. From initial concept drawings and 3D visualization to material sourcing and turnkey site execution, every residence and workplace is tailored to elevate how you live and work.`,
        highlights: [
          {
            title: 'Bespoke Architectural Detailing',
            description: 'Custom millwork, custom lighting plans, and hand-selected natural materials.',
          },
          {
            title: 'Turnkey Project Execution',
            description: 'End-to-end design and contractor supervision ensuring flawless fidelity to design.',
          },
          {
            title: 'Sustainable Material Curation',
            description: 'Thoughtfully sourced stones, certified timbers, and energy-conscious architectural elements.',
          },
          {
            title: 'Transparent Budget Governance',
            description: 'Granular Bill of Quantities (BOQ) with firm delivery milestones and zero surprise costs.',
          },
        ],
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      services: {
        sectionTitle: 'Disciplines & Studio Capabilities',
        sectionSubtitle: `Comprehensive architectural and interior design capabilities in ${city}.`,
        items: [
          {
            id: 'arch-1',
            title: 'Luxury Residential Interior Architecture',
            description: 'High-end villas, penthouses, and bespoke apartments conceived with refined architectural geometry.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'arch-2',
            title: 'Commercial Workspaces & Boutique Retail',
            description: 'Dynamic corporate headquarters, designer studios, and luxury hospitality venues.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'arch-3',
            title: 'Turnkey Fit-Outs & Site Execution',
            description: 'Comprehensive civil, MEP, joinery, and structural execution under single-point architectural supervision.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'arch-4',
            title: 'Modular Systems & Custom Furniture',
            description: 'Precision Italian/German modular kitchens, walk-in closets, and artisanal statement lighting.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
        ],
      },
      whyChooseUs: {
        sectionTitle: 'The Studio Difference',
        sectionSubtitle: 'Precision engineering meets refined aesthetics for discerning clients.',
        points: [
          {
            title: 'Hyper-Realistic 3D Visualization',
            description: 'Walk through your space before construction starts with photorealistic 3D renders.',
            iconName: 'Layers',
          },
          {
            title: 'Dedicated Lead Architect',
            description: 'A dedicated project architect directly manages your site from concept to key handover.',
            iconName: 'UserCheck',
          },
          {
            title: 'Stringent Quality Controls',
            description: 'Multistage quality checks covering waterproofing, joinery, electricals, and surface finishes.',
            iconName: 'CheckCircle2',
          },
          {
            title: 'Guaranteed Completion Timelines',
            description: 'Contract-backed milestone schedules with transparent weekly on-site photo reports.',
            iconName: 'Clock',
          },
        ],
      },
      process: {
        sectionTitle: 'Our Design & Build Methodology',
        sectionSubtitle: 'A structured 4-phase roadmap from sketch to turnkey reality.',
        steps: [
          {
            number: '01',
            title: 'Discovery & Spatial Brief',
            description: `We analyze your lifestyle requirements, spatial constraints, and aesthetic goals in ${city}.`,
          },
          {
            number: '02',
            title: 'Concept & 3D Spatial Modeling',
            description: 'Developing mood boards, floor plans, material palettes, and photorealistic 3D visuals.',
          },
          {
            number: '03',
            title: 'BOQ & Material Selection',
            description: 'Finalizing hardware, stones, timbers, and fixtures with a line-by-line transparent estimate.',
          },
          {
            number: '04',
            title: 'Turnkey Execution & Handover',
            description: 'Flawless site execution, precision styling, deep cleaning, and formal key handover.',
          },
        ],
      },
      ctaBanner: {
        title: `Ready to Design Your Dream Space in ${city}?`,
        subtitle: 'Schedule a discovery session with our senior architects to bring your vision to life.',
        primaryCta: {
          label: 'Book Design Consultation',
          href: '#contact',
        },
        secondaryCta: {
          label: 'View Studio Disciplines',
          href: '#services',
        },
      },
      industries: {
        enabled: true,
        sectionTitle: 'Project Typologies',
        items: [
          'Luxury Private Residences',
          'Modern Corporate Offices',
          'Boutique Hospitality & Cafés',
          'High-End Retail Showrooms',
          'Designer Penthouse Suites',
          'Turnkey Modular Residences',
        ],
      },
      testimonials: {
        enabled: false,
        sectionTitle: 'Client Testimonials',
        items: [],
      },
      faq: {
        sectionTitle: 'Frequently Asked Questions',
        items: [
          {
            question: 'What is your typical project execution timeline?',
            answer: 'Timelines vary by scope: complete luxury residences typically take 3–5 months, while commercial fit-outs are delivered in 6–10 weeks.',
          },
          {
            question: 'Do you manage both design and construction?',
            answer: `Yes, we offer complete turnkey design-build services across ${city}, managing materials, contractors, and handover.`,
          },
          {
            question: 'How do you structure project payment schedules?',
            answer: 'Payments are linked directly to verified construction milestones, with 50% distributed across project phases and 10% upon final inspection.',
          },
        ],
      },
      contact: {
        sectionTitle: 'Discuss Your Next Project',
        sectionSubtitle: 'Connect with our studio team to schedule an initial consultation or site survey.',
        formTitle: 'Request a Design Consultation',
        simulatedDisclaimer: 'Demo concept only — inquiries submitted through this form are simulated.',
        publicEmail: facts.publicEmail || null,
        publicPhone: facts.publicPhone || null,
        ctaSubmitText: 'Request Consultation (Simulated)',
      },
      location: {
        address: facts.address || `${city}, India`,
        city: facts.city || 'Gurgaon',
        officeHours: 'Monday – Saturday: 10:00 AM – 7:00 PM IST',
        mapPlaceholder: true,
      },
      footer: {
        copyright: `© ${currentYear} ${brandName}. All rights reserved.`,
        disclaimer: 'Personalized website demonstration concept generated by GetVisible. Prepared exclusively for preview and evaluation.',
      },
    };
  },
};

/**
 * Extensible template registry populated with the Google Stitch designs & SMB templates.
 */
const TEMPLATE_REGISTRY: Record<string, ProfessionTemplate> = {
  [DESIGN_1_PREMIUM_TEMPLATE.id]: DESIGN_1_PREMIUM_TEMPLATE,
  [DESIGN_2_MINIMALIST_TEMPLATE.id]: DESIGN_2_MINIMALIST_TEMPLATE,
  [DESIGN_3_CONTEMPORARY_TEMPLATE.id]: DESIGN_3_CONTEMPORARY_TEMPLATE,
  [CLINIC_HEALTHCARE_TEMPLATE.id]: CLINIC_HEALTHCARE_TEMPLATE,
  [INTERIOR_ARCHITECTURE_TEMPLATE.id]: INTERIOR_ARCHITECTURE_TEMPLATE,
};

/**
 * Register a new custom template into the engine.
 */
export function registerTemplate(template: ProfessionTemplate): void {
  TEMPLATE_REGISTRY[template.id] = template;
}

/**
 * Unregister a template by ID.
 */
export function unregisterTemplate(templateId: string): void {
  delete TEMPLATE_REGISTRY[templateId];
}

/**
 * Clear all registered templates from the engine.
 */
export function clearTemplateRegistry(): void {
  for (const key of Object.keys(TEMPLATE_REGISTRY)) {
    delete TEMPLATE_REGISTRY[key];
  }
}

/**
 * List all currently registered templates.
 */
export function listTemplates(): ProfessionTemplate[] {
  return Object.values(TEMPLATE_REGISTRY);
}

/**
 * Retrieve a template by ID, or fall back safely to BASE_TEMPLATE.
 */
export function getTemplate(
  templateId?: string,
  _profession?: string,
  facts?: LeadFacts
): ProfessionTemplate {
  if (templateId && TEMPLATE_REGISTRY[templateId]) {
    return TEMPLATE_REGISTRY[templateId];
  }

  // Auto-detect profession regex
  const text = `${facts?.profession || ''} ${facts?.businessName || ''} ${_profession || ''}`.toLowerCase();
  if (/clinic|dental|dentist|doctor|medical|health|skin|physio/i.test(text)) {
    if (TEMPLATE_REGISTRY['CLINIC_HEALTHCARE']) {
      return TEMPLATE_REGISTRY['CLINIC_HEALTHCARE'];
    }
  }
  if (/interior|architect|design|decor|modular/i.test(text)) {
    if (TEMPLATE_REGISTRY['INTERIOR_ARCHITECTURE']) {
      return TEMPLATE_REGISTRY['INTERIOR_ARCHITECTURE'];
    }
  }

  // If facts are provided and match any registered archetype
  if (facts) {
    const inferredId = inferCAArchetype(facts);
    if (TEMPLATE_REGISTRY[inferredId]) {
      return TEMPLATE_REGISTRY[inferredId];
    }
  }

  // Check if any custom templates are registered
  const registered = Object.values(TEMPLATE_REGISTRY);
  if (registered.length > 0) {
    return registered[0];
  }

  // Fallback to neutral BASE_TEMPLATE
  return BASE_TEMPLATE;
}
