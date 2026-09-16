import { WebsiteTheme, WebsiteContent } from '@/types';

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
  buildContent(facts: LeadFacts, theme?: WebsiteTheme): WebsiteContent;
}

// Predefined professional themes
export const THEMES: Record<string, WebsiteTheme> = {
  executiveNavy: {
    id: 'executive-navy',
    name: 'Executive Navy',
    primaryColor: '#1e3a8a',
    secondaryColor: '#1e293b',
    accentColor: '#2563eb',
    fontFamily: 'sans',
    style: 'corporate',
    borderRadius: 'md',
  },
  corporateSlate: {
    id: 'corporate-slate',
    name: 'Corporate Slate',
    primaryColor: '#0f172a',
    secondaryColor: '#334155',
    accentColor: '#0284c7',
    fontFamily: 'sans',
    style: 'corporate',
    borderRadius: 'md',
  },
  emeraldPrestige: {
    id: 'emerald-prestige',
    name: 'Emerald Prestige',
    primaryColor: '#064e3b',
    secondaryColor: '#134e4a',
    accentColor: '#059669',
    fontFamily: 'sans',
    style: 'corporate',
    borderRadius: 'sm',
  },
  classicBurgundy: {
    id: 'classic-burgundy',
    name: 'Classic Burgundy',
    primaryColor: '#4c0519',
    secondaryColor: '#27272a',
    accentColor: '#e11d48',
    fontFamily: 'serif',
    style: 'corporate',
    borderRadius: 'sm',
  },
};

export const CA_ACCOUNTING_TEMPLATE: ProfessionTemplate = {
  id: 'CA_ACCOUNTING_PROFESSIONAL',
  name: 'Chartered Accountant & Corporate Advisory',
  profession: 'Chartered Accountant',
  description: 'Clean, authoritative, and compliance-first digital presence for chartered accountants, audit practices, and tax advisors.',
  themes: [
    THEMES.executiveNavy,
    THEMES.corporateSlate,
    THEMES.emeraldPrestige,
    THEMES.classicBurgundy,
  ],
  defaultTheme: THEMES.executiveNavy,
  buildContent(facts: LeadFacts, theme?: WebsiteTheme): WebsiteContent {
    const brandName = facts.businessName || 'Chartered Accountancy Practice';
    const city = facts.city || 'Gurgaon';
    const activeTheme = theme || THEMES.executiveNavy;
    const currentYear = new Date().getFullYear();

    return {
      meta: {
        title: `${brandName} | Chartered Accountants & Tax Advisory in ${city}`,
        description: `Dedicated chartered accountancy practice in ${city} providing statutory audit, corporate taxation, GST advisory, and corporate compliance services.`,
        profession: facts.profession || 'Chartered Accountant',
        templateId: 'CA_ACCOUNTING_PROFESSIONAL',
      },
      brand: {
        businessName: brandName,
        tagline: `Professional Chartered Accountancy & Tax Advisory in ${city}`,
        provenance: facts.businessName ? 'VERIFIED_LEAD' : 'NEUTRAL_PLACEHOLDER',
      },
      theme: activeTheme,
      navigation: {
        items: [
          { label: 'Home', href: '#hero' },
          { label: 'About', href: '#about' },
          { label: 'Services', href: '#services' },
          { label: 'Why Us', href: '#why-choose-us' },
          { label: 'FAQ', href: '#faq' },
          { label: 'Contact', href: '#contact' },
        ],
        ctaText: 'Inquire Now',
        ctaHref: '#contact',
      },
      hero: {
        badge: 'Chartered Accountancy & Advisory',
        headline: `Modern Financial Clarity & Compliance for Growing Businesses`,
        subheadline: `Dedicated chartered accountancy practice in ${city} providing statutory audit, corporate taxation, GST advisory, and strategic financial guidance.`,
        primaryCta: {
          label: 'Schedule Consultation',
          href: '#contact',
        },
        secondaryCta: {
          label: 'View Practice Areas',
          href: '#services',
        },
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      about: {
        title: 'About Our Practice',
        leadParagraph: `${brandName} is a chartered accountancy practice based in ${city}, providing comprehensive tax, audit, and regulatory advisory.`,
        body: `We partner with corporate entities, family enterprises, and emerging ventures to maintain rigorous statutory compliance and optimize financial operations. Our work emphasizes methodical adherence to regulatory frameworks, proactive risk assessment, and direct engagement on complex accounting matters.`,
        highlights: [
          {
            title: 'Regulatory Precision',
            description: 'Methodical alignment with current Indian accounting standards and evolving tax circulars.',
          },
          {
            title: 'Strict Confidentiality',
            description: 'Rigorous data protocols safeguarding corporate financial statements and proprietary tax records.',
          },
          {
            title: 'Ethical Governance',
            description: 'Uncompromising integrity and adherence to statutory professional codes of conduct.',
          },
          {
            title: 'Proactive Advisory',
            description: 'Clear milestone schedules, proactive compliance calendars, and straightforward communication.',
          },
        ],
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      services: {
        sectionTitle: 'Practice Areas & Services',
        sectionSubtitle: 'Comprehensive accounting, audit, and tax solutions tailored to corporate and professional requirements.',
        items: [
          {
            id: 'srv-1',
            title: 'Corporate Tax Compliance & Planning',
            description: 'Direct tax planning, advance tax computations, annual returns, and representation before revenue authorities.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'srv-2',
            title: 'Statutory Audit & Assurance',
            description: 'Independent examination of financial statements under Companies Act guidelines and Indian Accounting Standards.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'srv-3',
            title: 'GST Advisory & Return Filings',
            description: 'Monthly and quarterly GST return filing, input tax credit reconciliation, and audit representation.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'srv-4',
            title: 'Transfer Pricing & International Tax',
            description: 'Documentation, benchmarking studies, and cross-border transaction compliance for multi-entity businesses.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'srv-5',
            title: 'Company Incorporation & Secretarial Services',
            description: 'Entity structuring, ROC filings, annual statutory documentation, and corporate legal secretarial support.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'srv-6',
            title: 'Financial Due Diligence & Valuation',
            description: 'In-depth financial scrutiny for mergers, acquisitions, partner buyouts, and institutional capital raises.',
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
            description: 'Engagements are directly overseen by senior chartered accountants who understand your operational context.',
            iconName: 'UserCheck',
          },
          {
            title: 'Regulatory Accuracy',
            description: 'Meticulous adherence to current Indian accounting standards, circulars, and evolving statutory guidelines.',
            iconName: 'CheckCircle2',
          },
          {
            title: 'Confidentiality & Data Security',
            description: 'Strict security protocols protecting your corporate financial records and proprietary tax records.',
            iconName: 'Lock',
          },
          {
            title: 'Transparent Communication',
            description: 'Clear milestone schedules, proactive compliance calendars, and straightforward explanations without jargon.',
            iconName: 'Clock',
          },
        ],
      },
      industries: {
        enabled: true,
        sectionTitle: 'Industries We Support',
        items: [
          'Technology & Software Services',
          'Manufacturing & Supply Chain',
          'Real Estate & Construction',
          'Retail & E-commerce',
          'Healthcare & Medical Practices',
          'Professional Consulting',
        ],
      },
      testimonials: {
        enabled: false,
        sectionTitle: 'Client Testimonials',
        items: [
          {
            quote: 'Client testimonials can be displayed here following formal verification and written consent.',
            author: 'Verified Client Placeholder',
            role: 'Corporate Partner',
            isPlaceholder: true,
          },
        ],
      },
      faq: {
        sectionTitle: 'Frequently Asked Questions',
        items: [
          {
            question: 'How do we get started with your accounting services?',
            answer: 'You can initiate contact through our inquiry form or direct phone line. We schedule an introductory consultation to understand your business structure, operational volume, and compliance requirements.',
          },
          {
            question: 'Do you provide end-to-end GST support?',
            answer: 'Yes, we handle recurring GST return filings (GSTR-1, GSTR-3B), annual reconciliation (GSTR-9), input tax credit verification, and responses to departmental inquiries.',
          },
          {
            question: 'What documentation is typically required for annual corporate tax filing?',
            answer: 'We review trial balances, bank statements, audited financials, TDS certificates (Form 26AS/AIS), and relevant asset registers. An itemized checklist is provided at the start of each filing cycle.',
          },
          {
            question: 'Can you assist with new company incorporation and statutory registrations?',
            answer: 'Yes, we assist founders with choosing the appropriate entity type (Private Limited, LLP, OPC), obtaining name approvals, drafting constitutions, and completing PAN, TAN, and GST registrations.',
          },
        ],
      },
      contact: {
        sectionTitle: 'Connect With Our Team',
        sectionSubtitle: 'Reach out to schedule an introductory consultation regarding your accounting, tax, or audit requirements.',
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
        disclaimer: 'Personalized website demonstration concept generated by LeadForge AI. Prepared exclusively for review and evaluation.',
      },
    };
  },
};

// Extensible template registry
const TEMPLATE_REGISTRY: Record<string, ProfessionTemplate> = {
  [CA_ACCOUNTING_TEMPLATE.id]: CA_ACCOUNTING_TEMPLATE,
};

export function getTemplate(templateId?: string, profession?: string): ProfessionTemplate {
  if (templateId && TEMPLATE_REGISTRY[templateId]) {
    return TEMPLATE_REGISTRY[templateId];
  }

  // Fallback matching by profession
  const norm = (profession || '').toLowerCase();
  if (norm.includes('accountant') || norm === 'ca' || norm.includes('tax')) {
    return CA_ACCOUNTING_TEMPLATE;
  }

  // Default to CA template for MVP
  return CA_ACCOUNTING_TEMPLATE;
}

export function listTemplates(): ProfessionTemplate[] {
  return Object.values(TEMPLATE_REGISTRY);
}
