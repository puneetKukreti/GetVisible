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
 * Extensible template registry populated with the 3 Google Stitch designs.
 */
const TEMPLATE_REGISTRY: Record<string, ProfessionTemplate> = {
  [DESIGN_1_PREMIUM_TEMPLATE.id]: DESIGN_1_PREMIUM_TEMPLATE,
  [DESIGN_2_MINIMALIST_TEMPLATE.id]: DESIGN_2_MINIMALIST_TEMPLATE,
  [DESIGN_3_CONTEMPORARY_TEMPLATE.id]: DESIGN_3_CONTEMPORARY_TEMPLATE,
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
