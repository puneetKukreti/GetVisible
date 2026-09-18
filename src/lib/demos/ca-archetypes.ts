import { WebsiteTheme, WebsiteContent, WebsiteDesign, WebsiteLayout } from '@/types';
import { LeadFacts, ProfessionTemplate } from './templates';
import { THEMES } from './themes';

export interface CAArchetypeMeta {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  defaultLayout: WebsiteLayout;
  defaultThemeId: string;
  targetAudience: string;
  keyRegulations: string[];
}

export const INDIAN_CA_ARCHETYPES: CAArchetypeMeta[] = [
  {
    id: 'CORPORATE_TRANSFER_PRICING',
    name: 'Corporate Tax & Transfer Pricing Advisory',
    shortName: 'Transfer Pricing',
    tagline: 'OECD-Aligned Cross-Border Governance & TP Documentation',
    description:
      'Engineered for corporate MNC subsidiaries, IT/ITES firms, and global GCCs navigating Section 92E, APAs, and Form 3CEB certification.',
    defaultLayout: 'EDITORIAL_FINANCE',
    defaultThemeId: 'executive-navy',
    targetAudience: 'MNC Subsidiaries, IT/ITES Exporters, PE-backed entities',
    keyRegulations: ['Section 92E', 'Form 3CEB', 'Safe Harbour Rules', 'Rule 10B/10C', 'DTAA Withholding'],
  },
  {
    id: 'MANUFACTURING_GST_LITIGATION',
    name: 'Regional Manufacturing & GST Litigator',
    shortName: 'Manufacturing GST',
    tagline: 'Industrial Corridor Indirect Tax Defense & ITC Recovery',
    description:
      'Field-tested GST defense, plant-level audit protection, SCN rebuttals, and GSTAT appellate practice for industrial corridors.',
    defaultLayout: 'SWISS_MINIMAL',
    defaultThemeId: 'industrial-amber',
    targetAudience: 'Automotive ancillaries, engineering plants, chemical & textile manufacturers',
    keyRegulations: ['Section 16(4) ITC', 'Section 65/66 Audit', 'DGGI Summons', 'Rule 37A', 'Inverted Duty Refund'],
  },
  {
    id: 'VIRTUAL_CFO_STARTUP',
    name: 'Virtual CFO & Startup Growth Architect',
    shortName: 'Virtual CFO',
    tagline: 'Investor-Ready Financial Leadership & Tech Stack Integration',
    description:
      'Agile Virtual CFO leadership, cap table modeling, angel tax defense, and investor-ready MIS reporting for venture-funded startups.',
    defaultLayout: 'MODERN_FINTECH',
    defaultThemeId: 'tech-teal',
    targetAudience: 'Seed to Series B Tech Startups, SaaS, D2C, and Fintech Founders',
    keyRegulations: ['Section 56(2)(viib)', 'Section 80-IAC Tax Holiday', 'DPIIT Startup India', 'Rule 11UA Valuation', 'ESOP Pool Setup'],
  },
  {
    id: 'INSTITUTIONAL_AUDIT_ASSURANCE',
    name: 'Institutional Statutory Audit & BFSI Assurance',
    shortName: 'Institutional Audit',
    tagline: 'Standards on Auditing & Peer-Reviewed Independent Assurance',
    description:
      'Conservative, independent statutory audit practice delivering Ind AS convergence, ICFR testing, and CARO 2020 reporting.',
    defaultLayout: 'SWISS_MINIMAL',
    defaultThemeId: 'corporate-slate',
    targetAudience: 'Listed Companies, Public Limited Entities, NBFCs, and Scheduled Banks',
    keyRegulations: ['Companies Act Section 143', 'CARO 2020', 'Ind AS 115/116', 'ICFR Controls', 'ICAI Peer Review'],
  },
  {
    id: 'NRI_CROSS_BORDER_TAX',
    name: 'NRI Wealth & Cross-Border Remittance Specialist',
    shortName: 'NRI Cross-Border',
    tagline: 'Repatriation Certification & Lower TDS for Global Indians',
    description:
      'Specialized advisory for Non-Resident Indians managing ancestral property sales, Form 15CA/15CB repatriation, and DTAA tax credits.',
    defaultLayout: 'MODERN_INDIAN',
    defaultThemeId: 'emerald-prestige',
    targetAudience: 'NRIs in US, UK, UAE, Singapore, Canada with Indian income & ancestral properties',
    keyRegulations: ['Form 15CA / 15CB', 'Section 197 Lower TDS', 'FEMA 1M USD Scheme', 'DTAA Form 67', 'Section 54 Rollover'],
  },
  {
    id: 'DIRECT_TAX_LITIGATION',
    name: 'Direct Tax Litigator & Scrutiny Specialist',
    shortName: 'Direct Tax Scrutiny',
    tagline: 'Appellate Advocacy & Faceless Scrutiny Rebuttals',
    description:
      'Decisive courtroom defense against faceless scrutiny, Section 148 reassessment notices, and appellate representation before CIT(A) and ITAT.',
    defaultLayout: 'EDITORIAL_FINANCE',
    defaultThemeId: 'classic-burgundy',
    targetAudience: 'HNIs, Business Promoters, Family Patriarchs, and Legacy Partnerships',
    keyRegulations: ['Section 143(3) / 144B', 'Section 148 / 148A Reassessment', 'ITAT Appeals', 'Section 270A Immunity', 'Section 220(6) Stay'],
  },
  {
    id: 'FAMILY_OFFICE_ESTATE',
    name: 'Boutique Family Office & Estate Succession',
    shortName: 'Family Office',
    tagline: 'Private Trusts, HUF Governance & Wealth Succession',
    description:
      'Discreet wealth preservation, private family discretionary trusts, HUF settlement deeds, and succession charters for multi-generational business families.',
    defaultLayout: 'LUXURY_PROFESSIONAL',
    defaultThemeId: 'heritage-bronze',
    targetAudience: 'Multi-generational business families, promoters, and ultra-HNIs',
    keyRegulations: ['Indian Trusts Act 1882', 'HUF Partition Law', 'Family Settlement Deeds', 'Section 54EC Rollover', 'Section 8 Charitable Trusts'],
  },
];

/**
 * Intelligent archetype inference from business name, address, and city facts.
 */
export function inferCAArchetype(facts?: { businessName?: string; address?: string; city?: string }): string {
  if (!facts) return 'CORPORATE_TRANSFER_PRICING';
  const text = `${facts.businessName || ''} ${facts.address || ''} ${facts.city || ''}`.toLowerCase();

  if (text.includes('nri') || text.includes('cross border') || text.includes('foreign') || text.includes('remittance') || text.includes('overseas')) {
    return 'NRI_CROSS_BORDER_TAX';
  }
  if (text.includes('startup') || text.includes('cfo') || text.includes('venture') || text.includes('tech') || text.includes('cyber city') || text.includes('hsr') || text.includes('koramangala')) {
    return 'VIRTUAL_CFO_STARTUP';
  }
  if (text.includes('gst') || text.includes('indirect tax') || text.includes('manesar') || text.includes('udyog vihar') || text.includes('peenya') || text.includes('bhosari') || text.includes('midc') || text.includes('gidc') || text.includes('industrial') || text.includes('manufacturing')) {
    return 'MANUFACTURING_GST_LITIGATION';
  }
  if (text.includes('audit') || text.includes('assurance') || text.includes('statutory') || text.includes('bank') || text.includes('bfsi')) {
    return 'INSTITUTIONAL_AUDIT_ASSURANCE';
  }
  if (text.includes('family') || text.includes('trust') || text.includes('estate') || text.includes('succession') || text.includes('wealth')) {
    return 'FAMILY_OFFICE_ESTATE';
  }
  if (text.includes('litigation') || text.includes('appeals') || text.includes('tribunal') || text.includes('scrutiny') || text.includes('direct tax') || text.includes('advocate')) {
    return 'DIRECT_TAX_LITIGATION';
  }
  return 'CORPORATE_TRANSFER_PRICING';
}

/* =========================================================================
 * 1. CORPORATE TAX & TRANSFER PRICING ADVISORY
 * ========================================================================= */
export const CORPORATE_TRANSFER_PRICING_TEMPLATE: ProfessionTemplate = {
  id: 'CORPORATE_TRANSFER_PRICING',
  name: 'Corporate Tax & Transfer Pricing Advisory',
  profession: 'Chartered Accountant',
  description: 'Authoritative cross-border tax, transfer pricing benchmarking, and multinational corporate compliance practice.',
  themes: [THEMES.executiveNavy, THEMES.corporateSlate, THEMES.regalIndigo],
  defaultTheme: THEMES.executiveNavy,
  buildContent(facts: LeadFacts, theme?: WebsiteTheme, design?: WebsiteDesign): WebsiteContent {
    const brandName = facts.businessName || 'Corporate Tax & Transfer Pricing Advisors';
    const city = facts.city || 'Gurugram';
    const activeTheme = theme || (design ? design.theme : THEMES.executiveNavy);
    const currentYear = new Date().getFullYear();

    return {
      meta: {
        title: `${brandName} | Corporate Tax & Transfer Pricing Advisory in ${city}`,
        description: `Dedicated chartered accountancy practice in ${city} specializing in Form 3CEB certification, Section 92E transfer pricing documentation, and cross-border corporate tax governance.`,
        profession: facts.profession || 'Chartered Accountant',
        templateId: 'CORPORATE_TRANSFER_PRICING',
      },
      brand: {
        businessName: brandName,
        tagline: `OECD-Aligned Transfer Pricing & Corporate Tax Governance in ${city}`,
        provenance: facts.businessName ? 'VERIFIED_LEAD' : 'NEUTRAL_PLACEHOLDER',
      },
      theme: activeTheme,
      design,
      navigation: {
        items: [
          { label: 'Practice Areas', href: '#services' },
          { label: 'Governance', href: '#about' },
          { label: 'Contact', href: '#contact' },
        ],
        ctaText: 'Schedule Technical Discussion',
        ctaHref: '#contact',
      },
      hero: {
        badge: 'International Tax & Transfer Pricing Practice',
        headline: `Transfer Pricing Precision & Cross-Border Tax Governance for ${city} Enterprises`,
        subheadline: `Advising multinational subsidiaries, IT/ITES cross-border companies, and fast-growing Indian corporations on Section 92E compliance, APA frameworks, and corporate tax risk.`,
        primaryCta: { label: 'Initiate Transfer Pricing Review', href: '#contact' },
        secondaryCta: { label: 'Explore Practice Focus', href: '#services' },
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      about: {
        title: 'Institutional Transfer Pricing Governance',
        leadParagraph: `${brandName} delivers partner-led international tax advisory and transfer pricing defense for corporate enterprises operating in and through ${city}.`,
        body: `Cross-border intercompany transactions face intensifying scrutiny from revenue authorities. We partner with multinational leadership and corporate finance heads to build defensible economic benchmarking, maintain audit-ready documentation under Section 92E, and proactively mitigate transfer pricing adjustment risks through CBDT Advance Pricing Agreements (APAs) and Safe Harbour provisions.`,
        highlights: [
          { title: 'Rule 10B/10C Alignment', description: 'Methodical economic search protocols utilizing audited commercial databases (Prowess, Capitaline).' },
          { title: 'OECD BEPS Action Plan Adherence', description: 'Master File and Local File documentation compliant with Action 13 three-tiered structures.' },
          { title: 'TPO Scrutiny Defense', description: 'Proven technical rebuttal briefs supporting Profit Level Indicators (PLIs) before Transfer Pricing Officers.' },
          { title: 'Strict Enterprise Discretion', description: 'Stringent multi-tier data security safeguarding sensitive intercompany pricing and intellectual property valuations.' },
        ],
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      services: {
        sectionTitle: 'Transfer Pricing & Corporate Tax Practice Areas',
        sectionSubtitle: 'Deep statutory specialization engineered for cross-border compliance and revenue dispute prevention.',
        items: [
          {
            id: 'tp-1',
            title: 'Transfer Pricing Documentation & Form 3CEB',
            description: 'Statutory audit of international and specified domestic transactions, local file preparation, and Form 3CEB issuance under Section 92E.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'tp-2',
            title: 'Economic Benchmarking & Comparable Studies',
            description: 'Rigorous selection of tested parties, quantitative financial filtering, and PLI determination using current Prowess and Capitaline datasets.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'tp-3',
            title: 'Advance Pricing Agreement (APA) Advisory',
            description: 'Unilateral and bilateral APA strategy with the Central Board of Direct Taxes (CBDT), rollback evaluations, and annual compliance reports.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'tp-4',
            title: 'Cross-Border Withholding & DTAA Structuring',
            description: 'Withholding tax certificates (Form 15CA/CB), royalty and FTS classification under tax treaties, and foreign tax credit advisory.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'tp-5',
            title: 'Permanent Establishment (PE) Risk Mitigation',
            description: 'Liaison, branch, and project office tax exposure reviews, profit attribution studies, and foreign company presence advisory.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'tp-6',
            title: 'Dispute Resolution Panel (DRP) & ITAT Representation',
            description: 'Drafting formal objections against draft assessment orders, technical advocacy before the DRP, and appellate defense before the ITAT.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
        ],
      },
      whyChooseUs: {
        sectionTitle: 'Core Tenets of Our Advisory',
        sectionSubtitle: 'Commitments that ensure defensible tax positions and zero operational disruptions.',
        points: [
          { title: 'Partner-Led Benchmarking', description: 'Senior chartered accountants directly oversee search matrices and economic filters.', iconName: 'UserCheck' },
          { title: 'Defensible Audit Trails', description: 'Every comparable inclusion or exclusion is backed by verifiable documentation.', iconName: 'CheckCircle2' },
          { title: 'CBDT APA Familiarity', description: 'Extensive familiarity with negotiation parameters and rollback clauses in APA proceedings.', iconName: 'ShieldCheck' },
          { title: 'Multi-Jurisdictional Clarity', description: 'Cohesive tax alignment across Indian domestic statutes and Double Taxation Avoidance Agreements.', iconName: 'Globe' },
        ],
      },
      process: {
        sectionTitle: 'Structured Transfer Pricing Life-Cycle',
        sectionSubtitle: 'An end-to-end framework safeguarding cross-border corporate operations.',
        steps: [
          { number: '01', title: 'Transaction Scoping & Characterization', description: 'Functional, Assets, and Risk (FAR) analysis of all intercompany agreements and flows.' },
          { number: '02', title: 'Economic Search & Database Filtering', description: 'Application of quantitative and qualitative filters on audited commercial company datasets.' },
          { number: '03', title: 'Local File & Form 3CEB Filing', description: 'Finalization of economic report, partner sign-off, and statutory electronic upload on the IT portal.' },
          { number: '04', title: 'Audit Trail Archival & Notice Defense', description: 'Preservation of complete defense dockets for upcoming 3-year scrutiny cycles.' },
        ],
      },
      trust: {
        sectionTitle: 'Standards of Professional Governance',
        badges: [
          { title: 'ICAI Ethical Guidelines Compliant', description: 'Strict adherence to code of ethics, audit quality standards, and statutory independence norms.', iconName: 'ShieldCheck' },
          { title: 'OECD BEPS Action Plan Standards', description: 'Three-tiered documentation framework aligned with international guidelines.', iconName: 'Globe' },
          { title: 'Direct Partner Supervision', description: 'Workpapers and search matrices directly reviewed by senior international tax partners.', iconName: 'UserCheck' },
          { title: 'Enterprise Data Confidentiality', description: 'Bank-grade encryption protecting proprietary group pricing mechanisms and cost sheets.', iconName: 'Lock' },
        ],
      },
      expertise: {
        sectionTitle: 'Specialized Regulatory Focus',
        sectionSubtitle: 'In-depth mastery across complex cross-border taxation mechanisms.',
        items: [
          { title: 'Form 3CEB & Section 92E Reporting', description: 'Comprehensive certification of international transactions, management fees, and cost allocations.', tags: ['Form 3CEB', 'Sec 92E', 'FAR Analysis'] },
          { title: 'Safe Harbour Rule Applications', description: 'Evaluation of eligibility under Rule 10TD/10TE for IT/ITES and KPO entities.', tags: ['Safe Harbour', 'CBDT Rules', 'IT/ITES'] },
          { title: 'DTAA Royalty & FTS Optimization', description: 'Analysis of Make-Available clauses and beneficial ownership under bilateral tax treaties.', tags: ['DTAA', 'FTS', 'Withholding'] },
          { title: 'DRP Objections & ITAT Appeals', description: 'Drafting robust legal objections against Transfer Pricing Officer adjustments.', tags: ['DRP', 'ITAT', 'Appeals'] },
        ],
      },
      ctaBanner: {
        title: `Safeguard Your Cross-Border Tax Positions in ${city}`,
        subtitle: 'Schedule a confidential technical review with our international tax and transfer pricing partners.',
        primaryCta: { label: 'Initiate Transfer Pricing Review', href: '#contact' },
        secondaryCta: { label: 'Review Practice Areas', href: '#services' },
      },
      industries: {
        enabled: true,
        sectionTitle: 'Key Industries Advised',
        items: [
          'Technology & Software Services (SaaS)',
          'Global In-House Centers (GCCs)',
          'Automotive & Precision Engineering',
          'Pharmaceuticals & Contract Research (CRO)',
          'Cross-Border Logistics & Freight',
          'E-Commerce & Digital Marketplaces',
        ],
      },
      testimonials: { enabled: false, sectionTitle: 'Client Testimonials', items: [] },
      faq: {
        sectionTitle: 'Frequently Addressed Questions',
        items: [
          { question: 'What is the mandatory threshold for filing Form 3CEB?', answer: 'Under Section 92E of the Income Tax Act, every person who has entered into an international transaction or specified domestic transaction during a previous year must obtain and furnish an accountant report in Form 3CEB before the prescribed statutory due date.' },
          { question: 'How do you handle differences between Safe Harbour and an APA?', answer: 'Safe Harbour provides a fixed profit margin acceptable to the tax authorities without scrutiny, but is restricted to specific sectors and thresholds. Advance Pricing Agreements (APAs) offer a customized agreement negotiated with the CBDT that can cover complex operations and include rollback provisions for up to 4 prior years.' },
          { question: 'What documentation must be maintained for intercompany management charges?', answer: 'Authorities require clear proof of the benefit test, evidence of actual receipt of services, detailed cost allocation keys, and economic justification demonstrating that the fee satisfies the arm length standard.' },
          { question: 'Can you assist if a draft assessment order proposing a TP addition is received?', answer: 'Yes. We prepare detailed technical objections before the Dispute Resolution Panel (DRP) within the mandatory 30-day statutory window, reviewing the TPO search filters and presenting judicial precedents.' },
        ],
      },
      contact: {
        sectionTitle: 'Connect With Our International Tax Practice',
        sectionSubtitle: 'Initiate a confidential discussion regarding your transfer pricing documentation, APA strategy, or corporate tax filings.',
        formTitle: 'Request Practice Consultation',
        simulatedDisclaimer: 'Demo concept only — inquiries submitted through this form are simulated and are not delivered to the business.',
        publicEmail: facts.publicEmail || null,
        publicPhone: facts.publicPhone || null,
        ctaSubmitText: 'Submit Consultation Request (Simulated)',
      },
      location: {
        address: facts.address || `${city}, India`,
        city: facts.city || 'Gurugram',
        officeHours: 'Monday – Friday: 9:30 AM – 6:30 PM IST',
        mapPlaceholder: true,
      },
      footer: {
        copyright: `© ${currentYear} ${brandName}. All rights reserved.`,
        disclaimer: 'Personalized website demonstration concept generated by GetVisible. Prepared exclusively for professional evaluation.',
      },
    };
  },
};

/* =========================================================================
 * 2. REGIONAL MANUFACTURING & GST LITIGATOR
 * ========================================================================= */
export const MANUFACTURING_GST_TEMPLATE: ProfessionTemplate = {
  id: 'MANUFACTURING_GST_LITIGATION',
  name: 'Regional Manufacturing & GST Litigator',
  profession: 'Chartered Accountant',
  description: 'Field-tested GST advisory, plant-level audit defense, and supply chain tax optimization for manufacturing and industrial enterprises.',
  themes: [THEMES.industrialAmber, THEMES.corporateSlate, THEMES.executiveNavy],
  defaultTheme: THEMES.industrialAmber,
  buildContent(facts: LeadFacts, theme?: WebsiteTheme, design?: WebsiteDesign): WebsiteContent {
    const brandName = facts.businessName || 'Industrial Tax & GST Litigation Practice';
    const city = facts.city || 'Gurugram';
    const activeTheme = theme || (design ? design.theme : THEMES.industrialAmber);
    const currentYear = new Date().getFullYear();

    return {
      meta: {
        title: `${brandName} | GST Litigation & Manufacturing Tax Advisors in ${city}`,
        description: `Dedicated chartered accountancy practice in ${city} providing robust GST departmental audit defense, Section 16(4) ITC optimization, and plant-level indirect tax advisory.`,
        profession: facts.profession || 'Chartered Accountant',
        templateId: 'MANUFACTURING_GST_LITIGATION',
      },
      brand: {
        businessName: brandName,
        tagline: `Shop-Floor to Appellate Indirect Tax Defense in ${city}`,
        provenance: facts.businessName ? 'VERIFIED_LEAD' : 'NEUTRAL_PLACEHOLDER',
      },
      theme: activeTheme,
      design,
      navigation: {
        items: [
          { label: 'Litigation Defense', href: '#services' },
          { label: 'Audit Approach', href: '#about' },
          { label: 'Plant Advisory', href: '#expertise' },
          { label: 'Contact', href: '#contact' },
        ],
        ctaText: 'Schedule Audit Review',
        ctaHref: '#contact',
      },
      hero: {
        badge: 'Indirect Tax & GST Litigation Practice',
        headline: `Rigorous GST Litigation Defense & Industrial Tax Advisory in ${city}`,
        subheadline: `Protecting manufacturing plants and industrial corridors against arbitrary demand notices, Section 16(4) ITC disallowances, and departmental audits.`,
        primaryCta: { label: 'Submit Notice for Technical Review', href: '#contact' },
        secondaryCta: { label: 'View Defense Capabilities', href: '#services' },
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      about: {
        title: 'Industrial Indirect Tax Defense',
        leadParagraph: `${brandName} represents industrial manufacturers, fabrication units, and engineering enterprises across ${city} in critical GST departmental audits and appellate proceedings.`,
        body: `Manufacturing operations face complex supply-chain tax exposures—from job-work reconciliations and e-Way bill procedural disputes to aggressive Section 16(4) ITC disallowances. Our practice combines shop-floor understanding of bills of material and movement of goods with technical legal draftsmanship to defend legitimate credits and defeat flawed demands.`,
        highlights: [
          { title: 'Shop-Floor Realism', description: 'Direct verification of job-work challans, scrap disposal, and capital goods capitalization.' },
          { title: 'SCN Rebuttal Pedigree', description: 'Technical replies grounded in Central Goods and Services Tax Act provisions and High Court rulings.' },
          { title: 'Vendor ITC Verification', description: 'Systematic GSTR-2B reconciliations and Rule 37A supplier default mitigation.' },
          { title: 'Fast-Track Inverted Refunds', description: 'Accelerated filing and departmental follow-up for accumulated input tax credit refunds.' },
        ],
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      services: {
        sectionTitle: 'Manufacturing GST & Litigation Capabilities',
        sectionSubtitle: 'End-to-end protective advisory from factory gate documentation to GSTAT appellate representation.',
        items: [
          {
            id: 'gst-1',
            title: 'GST Departmental Audit & Scrutiny Defense',
            description: 'Representation under Section 65 & 66, comprehensive reconciliation between GSTR-1, 3B, and financial ledgers.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'gst-2',
            title: 'Input Tax Credit (ITC) Optimization & Sec 16(4) Audits',
            description: 'Defense against retrospective ITC cancellation notices, supplier default handling under Rule 37A, and 2B reconciliations.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'gst-3',
            title: 'Show Cause Notice (SCN) Rebuttals & Legal Replies',
            description: 'Fact-driven written submissions citing authoritative High Court and CESTAT/GSTAT precedents to neutralize arbitrary demands.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'gst-4',
            title: 'Anti-Profiteering & DGGI Search Guidance',
            description: 'Immediate procedural guidance during inspections, summons response drafting, and penalty mitigation proceedings.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'gst-5',
            title: 'Inverted Duty Structure & Export Refund Processing',
            description: 'Expedited processing of accumulated input tax credit refunds on manufacturing inputs and zero-rated supply reconciliations.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'gst-6',
            title: 'Plant & Warehouse Supply Chain Tax Structuring',
            description: 'Review of job-work registers (ITC-04), movement under delivery challans, and e-Way bill compliance audits.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
        ],
      },
      whyChooseUs: {
        sectionTitle: 'Why Manufacturing Leaders Rely on Our Practice',
        sectionSubtitle: 'Concrete advantages built on industrial experience and technical mastery.',
        points: [
          { title: 'Rooted in Industrial Realities', description: 'We understand bills of entry, job work, scrap recovery, and factory dispatch cycles.', iconName: 'Building2' },
          { title: 'Technical Legal Draftsmanship', description: 'Replies drafted with precision that withstand scrutiny in departmental personal hearings.', iconName: 'ShieldCheck' },
          { title: 'Proactive ITC Health Checks', description: 'Periodic screening of vendor compliance to prevent credit blockages before year-end.', iconName: 'CheckCircle2' },
          { title: 'Direct Partner Arguing', description: 'Personal appearances before Assistant Commissioners, Joint Commissioners, and Appellate Authorities.', iconName: 'UserCheck' },
        ],
      },
      process: {
        sectionTitle: 'Structured Litigation & Notice Handling',
        sectionSubtitle: 'A battle-tested protocol designed to minimize tax demands and preserve plant liquidity.',
        steps: [
          { number: '01', title: 'Notice Deconstruction & Fact Finding', description: 'Thorough examination of audit observations, statutory timelines, and underlying invoices.' },
          { number: '02', title: 'Books vs Portal Ledger Reconciliation', description: 'Point-by-point numerical reconciliation of e-way bills, 2B credits, and plant stock registers.' },
          { number: '03', title: 'Technical Written Submission', description: 'Drafting robust legal reply citing relevant judicial precedents and circulars.' },
          { number: '04', title: 'Personal Hearing & Appellate Follow-Through', description: 'Formal representation before revenue officers, followed by prompt order evaluation.' },
        ],
      },
      trust: {
        sectionTitle: 'Compliance & Governance Standards',
        badges: [
          { title: 'ICAI Ethical Guidelines Compliant', description: 'Strict adherence to code of professional ethics, audit quality standards, and independence norms.', iconName: 'ShieldCheck' },
          { title: 'Appellate Advocacy Standards', description: 'Highest level of precision in formulating grounds of appeal and statements of facts.', iconName: 'CheckCircle2' },
          { title: 'Plant-Level Data Governance', description: 'Confidential handling of factory cost sheets, supply pricing, and production formulas.', iconName: 'Lock' },
          { title: 'Direct Partner Appearance', description: 'All critical personal hearings and appeal arguments conducted by experienced partners.', iconName: 'UserCheck' },
        ],
      },
      expertise: {
        sectionTitle: 'Specialized Industrial Tax Matters',
        sectionSubtitle: 'Deep proficiency across critical manufacturing compliance challenges.',
        items: [
          { title: 'Section 16(4) ITC Cut-Off Defense', description: 'Protecting input tax credits against technical delays citing recent constitutional amendments and judicial relief.', tags: ['Sec 16(4)', 'ITC', 'GSTR-2B'] },
          { title: 'Job Work & Subcontracting Compliance', description: 'Maintenance of Section 143 documentation, 1-year and 3-year return timelines, and Form ITC-04 reconciliations.', tags: ['Job Work', 'ITC-04', 'Sec 143'] },
          { title: 'Inverted Duty Structure Refunds', description: 'Filing Rule 89(5) refund applications for manufacturing units where tax on inputs exceeds output tax.', tags: ['Inverted Duty', 'Rule 89(5)', 'Refunds'] },
          { title: 'GSTAT Appellate Preparations', description: 'Preparing appeals and stay petitions before the newly constituted Goods and Services Tax Appellate Tribunal.', tags: ['GSTAT', 'Appeals', 'Stay'] },
        ],
      },
      ctaBanner: {
        title: `Received a GST Demand or Audit Notice in ${city}?`,
        subtitle: 'Have your notice reviewed by senior indirect tax practitioners before the deadline expires.',
        primaryCta: { label: 'Submit Notice for Technical Review', href: '#contact' },
        secondaryCta: { label: 'Review Practice Capabilities', href: '#services' },
      },
      industries: {
        enabled: true,
        sectionTitle: 'Industrial Corridors & Sectors Served',
        items: [
          'Automotive Ancillaries & Precision Components',
          'Heavy Engineering & Industrial Machinery',
          'Chemicals, Specialty Polymers & Coatings',
          'Textiles, Garments & Synthetic Yarns',
          'Packaging, Plastics & Corrugated Cartons',
          'Electrical Equipment & Transformer Units',
        ],
      },
      testimonials: { enabled: false, sectionTitle: 'Client Testimonials', items: [] },
      faq: {
        sectionTitle: 'Industrial Tax FAQ',
        items: [
          { question: 'What steps should be taken immediately upon receiving a Section 65 GST Audit notice (Form ADT-01)?', answer: 'Immediately compile the 15-day requisition checklist: trial balances, audited financials, monthly GSTR-1 and GSTR-3B copies, input tax credit registers matched with GSTR-2B, job-work registers, and sample invoices. Engage your tax advisor early to identify reconciliations before the audit team arrives.' },
          { question: 'Can input tax credit disallowed under Section 16(4) be contested?', answer: 'Yes. The Finance Act 2024 introduced Section 16(5) and 16(6) granting relief for financial years up to 2020-21. For other periods, multiple High Courts have entertained writ petitions based on bona fide business continuity. We evaluate the specific period to build a statutory defense.' },
          { question: 'How do you recover refunds under Inverted Duty Structure?', answer: 'We compute the maximum refund allowable under the revised formula in Rule 89(5), file electronic applications on the GST portal accompanied by CA turnover certificates, and follow up with the jurisdictional refund sanctioning officer.' },
          { question: 'What is the procedure if DGGI or Anti-Evasion conducts an inspection at our factory?', answer: 'Ensure proper authorization under Form GST INS-01 is verified. Maintain a contemporaneous record of documents impounded, insist on proper acknowledgment, ensure senior management is accompanied by legal counsel during statement recording, and avoid making coerced tax deposits under Section 74 without formal notice.' },
        ],
      },
      contact: {
        sectionTitle: 'Contact Our Industrial Tax Team',
        sectionSubtitle: 'Consult with our indirect tax litigators regarding pending notices, departmental audits, or plant supply-chain reviews.',
        formTitle: 'Submit Legal Inquiry',
        simulatedDisclaimer: 'Demo concept only — inquiries submitted through this form are simulated and are not delivered to the business.',
        publicEmail: facts.publicEmail || null,
        publicPhone: facts.publicPhone || null,
        ctaSubmitText: 'Send Inquiry (Simulated)',
      },
      location: {
        address: facts.address || `${city}, India`,
        city: facts.city || 'Gurugram',
        officeHours: 'Monday – Friday: 9:00 AM – 7:00 PM IST',
        mapPlaceholder: true,
      },
      footer: {
        copyright: `© ${currentYear} ${brandName}. All rights reserved.`,
        disclaimer: 'Personalized website demonstration concept generated by GetVisible. Prepared exclusively for professional review.',
      },
    };
  },
};

/* =========================================================================
 * 3. VIRTUAL CFO & STARTUP GROWTH ARCHITECT
 * ========================================================================= */
export const VIRTUAL_CFO_STARTUP_TEMPLATE: ProfessionTemplate = {
  id: 'VIRTUAL_CFO_STARTUP',
  name: 'Virtual CFO & Startup Growth Architect',
  profession: 'Chartered Accountant',
  description: 'Agile Virtual CFO leadership, cap table modeling, angel tax defense, and investor-ready MIS reporting for tech startups.',
  themes: [THEMES.techTeal, THEMES.corporateSlate, THEMES.executiveNavy],
  defaultTheme: THEMES.techTeal,
  buildContent(facts: LeadFacts, theme?: WebsiteTheme, design?: WebsiteDesign): WebsiteContent {
    const brandName = facts.businessName || 'Startup Advisory & Virtual CFO Practice';
    const city = facts.city || 'Gurugram';
    const activeTheme = theme || (design ? design.theme : THEMES.techTeal);
    const currentYear = new Date().getFullYear();

    return {
      meta: {
        title: `${brandName} | Virtual CFO & Startup Financial Advisory in ${city}`,
        description: `Dedicated chartered accountancy practice in ${city} providing Virtual CFO leadership, investor MIS reporting, cap table management, and DPIIT tax holiday advisory for tech startups.`,
        profession: facts.profession || 'Chartered Accountant',
        templateId: 'VIRTUAL_CFO_STARTUP',
      },
      brand: {
        businessName: brandName,
        tagline: `Investor-Grade Finance & Strategic Virtual CFO in ${city}`,
        provenance: facts.businessName ? 'VERIFIED_LEAD' : 'NEUTRAL_PLACEHOLDER',
      },
      theme: activeTheme,
      design,
      navigation: {
        items: [
          { label: 'Virtual CFO', href: '#services' },
          { label: 'Startup Playbook', href: '#process' },
          { label: 'Governance', href: '#trust' },
          { label: 'Contact', href: '#contact' },
        ],
        ctaText: 'Schedule Founder Discovery',
        ctaHref: '#contact',
      },
      hero: {
        badge: 'Virtual CFO & Startup Advisory',
        headline: `Strategic Virtual CFO & Investor-Grade Finance for ${city} Startups`,
        subheadline: `Partnering with tech founders from Seed to Series B to build institutional finance functions, control burn rate, and master corporate compliance.`,
        primaryCta: { label: 'Book Founder Strategy Call', href: '#contact' },
        secondaryCta: { label: 'Explore Virtual CFO Scope', href: '#services' },
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      about: {
        title: 'Modern Finance Architecture for Scaling Startups',
        leadParagraph: `${brandName} operates as the embedded strategic finance arm for fast-growth startups across ${city}, transforming messy bookkeeping into institutional-grade financial visibility.`,
        body: `Fast-growing ventures cannot afford traditional, backwards-looking accounting. We bring venture-literate financial leadership: real-time unit economics, weekly runway tracking, cap table hygiene, and automated cloud stacks. When institutional investors review your data room, our work ensures zero diligence surprises.`,
        highlights: [
          { title: 'Venture-Literate Leadership', description: 'Deep experience with term sheets, preference shares, convertible notes, and liquidation cascades.' },
          { title: 'Real-Time Runway Tracking', description: 'Dynamic cash flow forecasting and cohort-level unit economics modeling.' },
          { title: 'Zero Diligence Surprises', description: 'Pre-fundraise audit-ready books and organized virtual data room (VDR) structures.' },
          { title: 'Modern Tech Stack', description: 'Seamless integration with Zoho Books, QuickBooks, RazorpayX, and automated payroll.' },
        ],
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      services: {
        sectionTitle: 'Startup Growth & Virtual CFO Practice',
        sectionSubtitle: 'High-leverage financial leadership tailored to high-velocity venture cycles.',
        items: [
          {
            id: 'vcfo-1',
            title: 'Virtual CFO & Finance Department Leadership',
            description: 'Weekly cash burn tracking, budgeting, scenario planning, board meeting financial packs, and KPI dashboarding.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'vcfo-2',
            title: 'Cap Table Management & Valuation Modeling',
            description: 'Rule 11UA DCF valuations, Section 56(2)(viib) angel tax defense, share issuance, and convertible note accounting.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'vcfo-3',
            title: 'DPIIT Recognition & Section 80-IAC Tax Exemption',
            description: 'Startup India certification, Form 1 filings for 3-year income tax holiday, and angel tax exemption documentation.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'vcfo-4',
            title: 'Investor Due Diligence & Data Room Readiness',
            description: 'Pre-fundraise financial health checks, historical reconciliation, secretarial audit trails, and data room curation.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'vcfo-5',
            title: 'ESOP Scheme Structuring & Exercise Accounting',
            description: 'Option pool structuring, grant letters, valuation certifications, and perquisite tax computation for employee talent retention.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'vcfo-6',
            title: 'Modern Cloud Accounting Stack Implementation',
            description: 'Deployment and integration of Zoho Books, Stripe/Razorpay, multi-currency invoicing, and payroll automation.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
        ],
      },
      whyChooseUs: {
        sectionTitle: 'Built for High-Growth Founders',
        sectionSubtitle: 'Why venture-backed startups choose our Virtual CFO partnership.',
        points: [
          { title: 'Founder Empathy & Speed', description: 'Fast turnaround times designed to match high-velocity product sprint cycles.', iconName: 'TrendingUp' },
          { title: 'Investor Boardroom Readiness', description: 'Financial packages formatted to standard venture capital and private equity expectations.', iconName: 'CheckCircle2' },
          { title: 'Cloud-Native Stacks', description: 'Eliminating manual spreadsheets with integrated cloud accounting and real-time bank feeds.', iconName: 'Globe' },
          { title: 'Proactive Tax Holiday Planning', description: 'Securing government incentives including Section 80-IAC and R&D concessions.', iconName: 'ShieldCheck' },
        ],
      },
      process: {
        sectionTitle: 'The Startup Finance Acceleration Protocol',
        sectionSubtitle: 'From fragmented spreadsheets to institutional investor readiness.',
        steps: [
          { number: '01', title: 'Financial Health & Architecture Audit', description: 'Deep review of existing chart of accounts, tax positions, and cap table allocations.' },
          { number: '02', title: 'Cloud Stack & Runway Dashboard Setup', description: 'Implementation of automated accounting feeds, cash burn alerts, and monthly MIS templates.' },
          { number: '03', title: 'Ongoing Virtual CFO Cadence', description: 'Bi-weekly finance check-ins, monthly board reporting, and statutory compliance management.' },
          { number: '04', title: 'Fundraise Preparation & Diligence Support', description: 'Building the financial model, data room population, and handling investor queries.' },
        ],
      },
      trust: {
        sectionTitle: 'Standards of Professional Governance',
        badges: [
          { title: 'ICAI Ethical Guidelines Compliant', description: 'Strict adherence to code of professional ethics, audit quality standards, and independence norms.', iconName: 'ShieldCheck' },
          { title: 'Venture Capital Diligence Standards', description: 'Audit trails structured to withstand scrutiny from Tier-1 venture capital funds.', iconName: 'CheckCircle2' },
          { title: 'Encrypted Cap Table Governance', description: 'Confidential handling of sensitive founder equity, investor rights, and valuation records.', iconName: 'Lock' },
          { title: 'Zero Conflicts of Interest', description: 'Total fiduciary alignment with founder interests and board governance.', iconName: 'UserCheck' },
        ],
      },
      expertise: {
        sectionTitle: 'Startup Growth Expertise',
        sectionSubtitle: 'Key operational domains where our finance partners add direct value.',
        items: [
          { title: 'Section 80-IAC Tax Exemption', description: 'Filing applications before the Inter-Ministerial Board for 100% tax deduction on profits.', tags: ['Sec 80-IAC', 'IMB', 'Startup India'] },
          { title: 'DCF & Rule 11UA Valuations', description: 'Issuing statutory valuation certificates for equity financing rounds and convertible notes.', tags: ['Rule 11UA', 'DCF', 'Fundraise'] },
          { title: 'Unit Economics & SaaS Metrics', description: 'Calculation of CAC, LTV, Net Revenue Retention (NRR), and gross margin performance.', tags: ['SaaS Metrics', 'LTV/CAC', 'MIS'] },
          { title: 'ESOP Policy Drafting & Allotment', description: 'Designing option vesting schedules, exercise periods, and tax-efficient employee ownership.', tags: ['ESOPs', 'Vesting', 'Talent'] },
        ],
      },
      ctaBanner: {
        title: `Scale Your ${city} Startup with Institutional Financial Backing`,
        subtitle: 'Schedule an introductory strategy consultation with our Virtual CFO partners.',
        primaryCta: { label: 'Book Founder Strategy Call', href: '#contact' },
        secondaryCta: { label: 'View Virtual CFO Scope', href: '#services' },
      },
      industries: {
        enabled: true,
        sectionTitle: 'Startups & Emerging Verticals',
        items: [
          'Enterprise Software & B2B SaaS',
          'AI & Machine Learning Ventures',
          'Fintech, Payments & Neo-Banking',
          'Direct-to-Consumer (D2C) & Omnichannel Brands',
          'Healthtech & Digital Therapeutics',
          'Logistics Tech & B2B Marketplaces',
        ],
      },
      testimonials: { enabled: false, sectionTitle: 'Client Testimonials', items: [] },
      faq: {
        sectionTitle: 'Startup Founders FAQ',
        items: [
          { question: 'What is the role of a Virtual CFO versus a regular accountant?', answer: 'A regular accountant focuses on backward-looking bookkeeping and basic tax returns. A Virtual CFO acts as a strategic financial partner: forecasting runway, optimizing unit economics, managing cap tables, preparing board decks, and leading financial due diligence during fundraising rounds.' },
          { question: 'How can our startup claim the Section 80-IAC 3-year tax holiday?', answer: 'The startup must be recognized by DPIIT, incorporated between April 1, 2016 and March 31, 2025, and operate an innovative business model. We prepare the detailed business plan, proof of innovation, and submit Form 1 to the Inter-Ministerial Board.' },
          { question: 'What valuation is required when raising funds from angel investors or VCs?', answer: 'Under Section 56(2)(viib) and Rule 11UA of the Income Tax Act, shares issued at a premium require a valuation certificate from a merchant banker or chartered accountant using Discounted Cash Flow (DCF) or Net Asset Value (NAV) methods.' },
          { question: 'How do you handle ESOPs for early employees?', answer: 'We draft the ESOP scheme document, establish the trust or direct allotment mechanism, assist in board resolutions, determine the exercise price, and issue statutory valuation reports when options are exercised.' },
        ],
      },
      contact: {
        sectionTitle: 'Connect with Our Startup Finance Team',
        sectionSubtitle: 'Schedule an exploratory consultation to discuss your runway, cap table, or fundraising timeline.',
        formTitle: 'Request Founder Strategy Session',
        simulatedDisclaimer: 'Demo concept only — inquiries submitted through this form are simulated and are not delivered to the business.',
        publicEmail: facts.publicEmail || null,
        publicPhone: facts.publicPhone || null,
        ctaSubmitText: 'Request Session (Simulated)',
      },
      location: {
        address: facts.address || `${city}, India`,
        city: facts.city || 'Gurugram',
        officeHours: 'Monday – Friday: 9:30 AM – 6:30 PM IST',
        mapPlaceholder: true,
      },
      footer: {
        copyright: `© ${currentYear} ${brandName}. All rights reserved.`,
        disclaimer: 'Personalized website demonstration concept generated by GetVisible. Prepared exclusively for professional review.',
      },
    };
  },
};

/* =========================================================================
 * 4. INSTITUTIONAL STATUTORY AUDIT & BFSI ASSURANCE
 * ========================================================================= */
export const INSTITUTIONAL_AUDIT_TEMPLATE: ProfessionTemplate = {
  id: 'INSTITUTIONAL_AUDIT_ASSURANCE',
  name: 'Institutional Statutory Audit & BFSI Assurance',
  profession: 'Chartered Accountant',
  description: 'Conservative, independent statutory audit, CARO 2020 reporting, Ind AS convergence, and bank assurance practice.',
  themes: [THEMES.corporateSlate, THEMES.executiveNavy, THEMES.emeraldPrestige],
  defaultTheme: THEMES.corporateSlate,
  buildContent(facts: LeadFacts, theme?: WebsiteTheme, design?: WebsiteDesign): WebsiteContent {
    const brandName = facts.businessName || 'Institutional Audit & Assurance Partners';
    const city = facts.city || 'Gurugram';
    const activeTheme = theme || (design ? design.theme : THEMES.corporateSlate);
    const currentYear = new Date().getFullYear();

    return {
      meta: {
        title: `${brandName} | Statutory Audit & Institutional Assurance in ${city}`,
        description: `Independent chartered accountancy audit practice in ${city} delivering statutory audits under Companies Act 2013, Ind AS convergence, ICFR testing, and CARO 2020 compliance.`,
        profession: facts.profession || 'Chartered Accountant',
        templateId: 'INSTITUTIONAL_AUDIT_ASSURANCE',
      },
      brand: {
        businessName: brandName,
        tagline: `Standards on Auditing & Independent Assurance in ${city}`,
        provenance: facts.businessName ? 'VERIFIED_LEAD' : 'NEUTRAL_PLACEHOLDER',
      },
      theme: activeTheme,
      design,
      navigation: {
        items: [
          { label: 'Assurance Practice', href: '#services' },
          { label: 'Methodology', href: '#about' },
          { label: 'Governance', href: '#why-choose-us' },
          { label: 'Contact', href: '#contact' },
        ],
        ctaText: 'Schedule Audit Discussion',
        ctaHref: '#contact',
      },
      hero: {
        badge: 'Statutory Audit & Institutional Assurance',
        headline: `Rigorous Statutory Audit & Independent Assurance for ${city} Institutions`,
        subheadline: `Delivering uncompromising financial verification, internal controls testing, and regulatory governance under Indian Accounting Standards.`,
        primaryCta: { label: 'Initiate Audit Scoping', href: '#contact' },
        secondaryCta: { label: 'Explore Assurance Areas', href: '#services' },
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      about: {
        title: 'Institutional Audit Independence & Rigor',
        leadParagraph: `${brandName} provides statutory audit and financial assurance services for public corporations, financial institutions, and mid-market enterprises across ${city}.`,
        body: `Audit credibility is the bedrock of corporate governance and investor confidence. Our assurance engagements are conducted under strict adherence to the ICAI Standards on Auditing (SAs) and Quality Control Standard SQC 1. We combine automated analytical sampling with deep technical mastery of Ind AS, ensuring that audit committee and board reports reflect genuine financial integrity.`,
        highlights: [
          { title: 'Peer-Reviewed Practice', description: 'Rigorous internal compliance certified by the ICAI Peer Review Board.' },
          { title: 'Uncompromising Independence', description: 'Strict rotation protocols and total absence of conflicting advisory engagements.' },
          { title: 'Four-Eye Review Standard', description: 'Dual partner sign-off protocol on high-risk audit opinions and technical disclosures.' },
          { title: 'Ind AS Technical Proficiency', description: 'Deep experience across Ind AS 115, Ind AS 116, and complex financial instruments.' },
        ],
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      services: {
        sectionTitle: 'Statutory Audit & Assurance Practice Areas',
        sectionSubtitle: 'Methodical verification engineered for corporate boards, regulators, and institutional lenders.',
        items: [
          {
            id: 'aud-1',
            title: 'Statutory Audit under Companies Act 2013',
            description: 'Independent examination of financial statements under Section 143, CARO 2020 reporting, and true and fair view certification.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'aud-2',
            title: 'Internal Financial Controls (ICFR) Testing',
            description: 'Evaluation of design and operating effectiveness of automated ERP controls and internal financial governance frameworks.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'aud-3',
            title: 'Ind AS Convergence & Complex Accounting',
            description: 'Guidance on transition from Indian GAAP to Ind AS, revenue recognition models, expected credit loss (ECL), and lease accounting.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'aud-4',
            title: 'Concurrent & Statutory Bank Branch Audits',
            description: 'RBI-mandated branch audits, loan portfolio scrutiny, NPA identification, and IRAC prudential norm verification.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'aud-5',
            title: 'Limited Reviews & Board Assurance',
            description: 'Quarterly review reports for public entities, SEBI LODR compliance reviews, and audit committee presentations.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'aud-6',
            title: 'Specialized Investigation & Forensic Verification',
            description: 'Transactional audits, fund utilization certification for institutional lenders, and asset-quality examination.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
        ],
      },
      whyChooseUs: {
        sectionTitle: 'Principles of Audit Governance',
        sectionSubtitle: 'Uncompromising commitments ensuring regulatory respect and credibility.',
        points: [
          { title: 'ICAI Peer-Reviewed Standard', description: 'Our audit documentation, methodology, and quality control align with national benchmarks.', iconName: 'ShieldCheck' },
          { title: 'Independent Senior Review', description: 'Every audit engagement is guided by experienced partners with substantive assurance tenure.', iconName: 'UserCheck' },
          { title: 'Zero Commercial Compromise', description: 'Unflinching objectivity when evaluating accounting treatments and internal control deficiencies.', iconName: 'CheckCircle2' },
          { title: 'CARO 2020 Thoroughness', description: 'Methodical verification across all 21 comprehensive reporting clauses.', iconName: 'Clock' },
        ],
      },
      process: {
        sectionTitle: 'Structured Audit Life-Cycle',
        sectionSubtitle: 'A risk-based approach delivering thorough assurance without operational delays.',
        steps: [
          { number: '01', title: 'Audit Planning & Risk Assessment', description: 'Understanding business model, materiality thresholds, and preliminary risk identification.' },
          { number: '02', title: 'Internal Controls (ICFR) Evaluation', description: 'Walkthrough tests and sample testing of key financial control activities.' },
          { number: '03', title: 'Substantive Testing & Ind AS Review', description: 'Detailed vouching, analytical verification, balance confirmations, and valuation checks.' },
          { number: '04', title: 'Partner Review & Opinion Formulation', description: 'Discussion of draft findings with audit committee and issuance of independent audit report.' },
        ],
      },
      trust: {
        sectionTitle: 'Standards of Professional Governance',
        badges: [
          { title: 'ICAI Ethical Guidelines Compliant', description: 'Strict adherence to code of professional ethics, audit quality standards, and independence norms.', iconName: 'ShieldCheck' },
          { title: 'Peer Review Board Certified', description: 'Audit workpapers independently verified by the ICAI Peer Review Board.', iconName: 'CheckCircle2' },
          { title: 'SQC 1 Quality Control Framework', description: 'Systematic firm-wide policies governing engagement performance and ethical conduct.', iconName: 'ShieldCheck' },
          { title: 'Institutional Confidentiality', description: 'Enterprise-grade safeguards protecting corporate financial workpapers and internal files.', iconName: 'Lock' },
        ],
      },
      expertise: {
        sectionTitle: 'Regulatory Assurance Mastery',
        sectionSubtitle: 'Specialized proficiency across critical corporate governance frameworks.',
        items: [
          { title: 'Companies (Auditor Report) Order, 2020', description: 'Exhaustive verification of property plant & equipment, inventory, loans, and non-disclosure matters under CARO.', tags: ['CARO 2020', 'Sec 143', 'MCA'] },
          { title: 'Ind AS 115 Revenue Accounting', description: 'Five-step revenue recognition model evaluation for long-term supply and service agreements.', tags: ['Ind AS 115', 'Revenue', 'Contracts'] },
          { title: 'IRAC Prudential Banking Norms', description: 'Classification of assets, SMA accounts, provisioning norms, and concurrent verification for BFSI.', tags: ['RBI', 'IRAC', 'NPA Audit'] },
          { title: 'Internal Financial Controls Testing', description: 'Design and operating effectiveness testing of ERP and transactional segregation of duties.', tags: ['ICFR', 'SOX', 'Controls'] },
        ],
      },
      ctaBanner: {
        title: `Partner with an Independent Audit Firm in ${city}`,
        subtitle: 'Initiate a preliminary audit scoping discussion for your upcoming statutory or internal review cycle.',
        primaryCta: { label: 'Initiate Audit Scoping', href: '#contact' },
        secondaryCta: { label: 'Review Assurance Scope', href: '#services' },
      },
      industries: {
        enabled: true,
        sectionTitle: 'Institutions & Entities Served',
        items: [
          'Public & Private Limited Corporations',
          'Non-Banking Financial Companies (NBFCs)',
          'Scheduled Commercial & Cooperative Banks',
          'Higher Education Institutions & Universities',
          'Infrastructure & EPC Contractors',
          'Government Empanelled Undertakings',
        ],
      },
      testimonials: { enabled: false, sectionTitle: 'Client Testimonials', items: [] },
      faq: {
        sectionTitle: 'Institutional Audit FAQ',
        items: [
          { question: 'What new reporting obligations were introduced by CARO 2020?', answer: 'CARO 2020 significantly expanded auditor scrutiny, requiring detailed reporting on benami property proceedings, working capital utilization against sanctioned bank limits, whistleblower complaints received, undisclosed income declared in tax assessments, and financial ratios indicating operational viability.' },
          { question: 'How does your firm ensure absolute independence during statutory audits?', answer: 'We strictly segregate audit teams from internal accounting, never accept contingent fees, conduct annual independence declarations across all audit personnel, and enforce partner rotation in accordance with Companies Act mandates.' },
          { question: 'What is required for the audit of Internal Financial Controls over Financial Reporting (ICFR)?', answer: 'Under Section 143(3)(i), the auditor must independently state whether the company has adequate internal financial controls system in place and test the operating effectiveness of such controls across major business cycles.' },
          { question: 'How do you handle Ind AS transition adjustments?', answer: 'We evaluate transition adjustments under Ind AS 101, scrutinizing retrospective exemptions, fair value calculations for property and investments, and reconciling equity and profit under previous GAAP with Ind AS.' },
        ],
      },
      contact: {
        sectionTitle: 'Initiate an Audit Discussion',
        sectionSubtitle: 'Reach out to schedule an introductory consultation with our senior audit and assurance partners.',
        formTitle: 'Submit Audit Inquiry',
        simulatedDisclaimer: 'Demo concept only — inquiries submitted through this form are simulated and are not delivered to the business.',
        publicEmail: facts.publicEmail || null,
        publicPhone: facts.publicPhone || null,
        ctaSubmitText: 'Submit Inquiry (Simulated)',
      },
      location: {
        address: facts.address || `${city}, India`,
        city: facts.city || 'Gurugram',
        officeHours: 'Monday – Friday: 9:30 AM – 6:30 PM IST',
        mapPlaceholder: true,
      },
      footer: {
        copyright: `© ${currentYear} ${brandName}. All rights reserved.`,
        disclaimer: 'Personalized website demonstration concept generated by GetVisible. Prepared exclusively for professional review.',
      },
    };
  },
};

/* =========================================================================
 * 5. NRI WEALTH & CROSS-BORDER REMITTANCE SPECIALIST
 * ========================================================================= */
export const NRI_CROSS_BORDER_TEMPLATE: ProfessionTemplate = {
  id: 'NRI_CROSS_BORDER_TAX',
  name: 'NRI Wealth & Cross-Border Remittance Specialist',
  profession: 'Chartered Accountant',
  description: 'Seamless Form 15CA/15CB repatriation, Section 197 lower TDS certificates, and ancestral property tax management for Non-Resident Indians.',
  themes: [THEMES.emeraldPrestige, THEMES.executiveNavy, THEMES.classicBurgundy],
  defaultTheme: THEMES.emeraldPrestige,
  buildContent(facts: LeadFacts, theme?: WebsiteTheme, design?: WebsiteDesign): WebsiteContent {
    const brandName = facts.businessName || 'NRI Tax & Cross-Border Advisory';
    const city = facts.city || 'Gurugram';
    const activeTheme = theme || (design ? design.theme : THEMES.emeraldPrestige);
    const currentYear = new Date().getFullYear();

    return {
      meta: {
        title: `${brandName} | NRI Taxation & Foreign Remittance Advisory in ${city}`,
        description: `Dedicated chartered accountancy practice in ${city} assisting Non-Resident Indians with Form 15CA/15CB certification, Section 197 lower TDS certificates, and ancestral property repatriation.`,
        profession: facts.profession || 'Chartered Accountant',
        templateId: 'NRI_CROSS_BORDER_TAX',
      },
      brand: {
        businessName: brandName,
        tagline: `FEMA Compliant Remittance & NRI Tax Advisory in ${city}`,
        provenance: facts.businessName ? 'VERIFIED_LEAD' : 'NEUTRAL_PLACEHOLDER',
      },
      theme: activeTheme,
      design,
      navigation: {
        items: [
          { label: 'NRI Services', href: '#services' },
          { label: 'Repatriation Process', href: '#process' },
          { label: 'Why Choose Us', href: '#why-choose-us' },
          { label: 'Contact', href: '#contact' },
        ],
        ctaText: 'Book NRI Consultation',
        ctaHref: '#contact',
      },
      hero: {
        badge: 'NRI Taxation & Cross-Border Advisory',
        headline: `Smooth NRI Tax Advisory & Foreign Remittance Certification in ${city}`,
        subheadline: `Specialized advisory for Non-Resident Indians managing ancestral property sales, NRO to NRE funds repatriation, and dual-country tax compliance.`,
        primaryCta: { label: 'Book Remote NRI Consultation', href: '#contact' },
        secondaryCta: { label: 'Explore Remittance Services', href: '#services' },
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      about: {
        title: 'Trusted Financial Stewardship for Global Indians',
        leadParagraph: `${brandName} assists Non-Resident Indians across North America, Europe, the Middle East, and Asia-Pacific in managing their Indian asset holdings, property sales, and statutory tax filings.`,
        body: `Selling ancestral property or repatriating wealth from India often feels overwhelming due to steep 20%+ TDS deductions, complex banking checklists, and FEMA compliance mandates. Our firm delivers a 100% digital, paperless engagement model: securing Lower TDS certificates before property closing, certifying outward remittances under Form 15CA/CB, and coordinating directly with Authorized Dealer banks.`,
        highlights: [
          { title: '100% Digital Remote Onboarding', description: 'Frictionless video consultations and secure document sharing across global time zones.' },
          { title: 'Lower TDS Certificate Mastery', description: 'Applying under Section 197 to reduce withholding tax from 20%+ to actual net liability.' },
          { title: 'Bank AD Coordination', description: 'End-to-end liaison with SBI, HDFC, ICICI, and Kotak NRI remittance desks.' },
          { title: 'Dual-Country Tax Alignment', description: 'Coordinated compliance preventing double taxation across India and your country of residence.' },
        ],
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      services: {
        sectionTitle: 'Specialized NRI Tax & Wealth Services',
        sectionSubtitle: 'Seamless cross-border compliance tailored to Non-Resident Indian requirements.',
        items: [
          {
            id: 'nri-1',
            title: 'Form 15CA & Form 15CB Certification',
            description: 'Expedited chartered accountant certification and portal filing for outward remittances through Authorized Dealer banks under FEMA.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'nri-2',
            title: 'Section 197 Lower TDS Certificate Applications',
            description: 'Online applications before the jurisdictional assessing officer to prevent excessive 20%+ tax deduction on property sales.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'nri-3',
            title: 'Ancestral Property Sale & Capital Gains Computation',
            description: 'Determination of cost inflation index (CII), fair market value as of 2001, and tax exemption planning under Section 54 and 54EC.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'nri-4',
            title: 'DTAA Foreign Tax Credit (FTC) & Form 67 Filings',
            description: 'Filing Form 67 and claiming treaty benefits under bilateral Double Taxation Avoidance Agreements to avoid paying tax twice.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'nri-5',
            title: 'NRO to NRE Account Funds Repatriation',
            description: 'Complete documentation and CA certification under RBI USD 1 Million Scheme for smooth funds transfer to overseas bank accounts.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'nri-6',
            title: 'Foreign Assets & Black Money Act Disclosures',
            description: 'Filing ITR with Schedule FA, residency status evaluation under Section 6, and compliance with foreign asset reporting rules.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
        ],
      },
      whyChooseUs: {
        sectionTitle: 'Why Global Indians Choose Our Advisory',
        sectionSubtitle: 'Reassuring expertise, total transparency, and swift execution.',
        points: [
          { title: 'Global Time-Zone Availability', description: 'Flexible video consultation hours accommodating US, UK, Gulf, and Singapore time zones.', iconName: 'Clock' },
          { title: 'Transparent Checklist Driven', description: 'Clear document lists provided in advance so property transactions conclude without delays.', iconName: 'CheckCircle2' },
          { title: 'Direct Remittance Desk Liaison', description: 'Experienced coordination with bank Forex departments ensuring seamless 15CB acceptance.', iconName: 'Globe' },
          { title: 'Absolute Confidentiality', description: 'Secure encrypted document repositories protecting passport, PAN, and banking details.', iconName: 'Lock' },
        ],
      },
      process: {
        sectionTitle: 'Four-Step Remote Remittance Protocol',
        sectionSubtitle: 'A transparent roadmap to repatriate funds safely and legally to your overseas account.',
        steps: [
          { number: '01', title: 'Virtual Consultation & Document Review', description: 'Review of sale deed, inheritance wills, banking statements, and tax identification documents.' },
          { number: '02', title: 'Capital Gains & Withholding Calculation', description: 'Computation of capital gains tax liability, indexation benefits, and Section 54 rollover.' },
          { number: '03', title: 'Section 197 / Form 15CB Issuance', description: 'Filing on the Income Tax e-filing portal and generating cryptographic UDIN-verified certificates.' },
          { number: '04', title: 'Authorized Dealer Bank Execution', description: 'Submission of A2 form and CA certificate to bank remittance desk for final outward transfer.' },
        ],
      },
      trust: {
        sectionTitle: 'Standards of Professional Governance',
        badges: [
          { title: 'ICAI Ethical Guidelines Compliant', description: 'Strict adherence to code of professional ethics, audit quality standards, and independence norms.', iconName: 'ShieldCheck' },
          { title: 'RBI & FEMA Compliance Adherence', description: 'Every certification complies with Foreign Exchange Management Act Master Directions.', iconName: 'CheckCircle2' },
          { title: 'Digital Cryptographic UDIN Verification', description: 'All certificates carry verifiable Unique Document Identification Numbers issued by ICAI.', iconName: 'ShieldCheck' },
          { title: 'Strict Data Protection Protocols', description: 'Bank-grade encrypted communications safeguarding sensitive cross-border client records.', iconName: 'Lock' },
        ],
      },
      expertise: {
        sectionTitle: 'Cross-Border Practice Areas',
        sectionSubtitle: 'Specialized proficiency across Indian tax statutes and international treaties.',
        items: [
          { title: 'Section 197 Lower TDS Processing', description: 'Securing certificates to prevent liquidity lock-up of 20%+ TDS during Indian property sales.', tags: ['Sec 197', 'Lower TDS', 'Property Sale'] },
          { title: 'FEMA USD 1 Million Scheme', description: 'Enabling NRIs to repatriate up to USD 1,000,000 per financial year from NRO balances.', tags: ['FEMA', 'NRO to NRE', 'RBI'] },
          { title: 'Form 67 & Foreign Tax Credits', description: 'Submitting statutory proof of Indian taxes paid to claim tax credits on foreign returns.', tags: ['Form 67', 'FTC', 'DTAA'] },
          { title: 'Residency Status Determination', description: 'Evaluating physical presence rules under Section 6 including deemed residency provisions.', tags: ['Residency', 'Sec 6', 'Deemed NRI'] },
        ],
      },
      ctaBanner: {
        title: `Planning to Repatriate Funds or Sell Indian Property?`,
        subtitle: 'Schedule a confidential virtual consultation with our cross-border tax specialists.',
        primaryCta: { label: 'Book Remote NRI Consultation', href: '#contact' },
        secondaryCta: { label: 'Explore Remittance Steps', href: '#process' },
      },
      industries: {
        enabled: true,
        sectionTitle: 'Clients & Profiles We Support',
        items: [
          'Non-Resident Indians in the US, UK, UAE & Singapore',
          'Beneficiaries of Inherited Property in India',
          'Global Tech Executives with Indian Capital Assets',
          'Returning Expats (RNOR Status Advisory)',
          'Foreign Citizens of Indian Origin (OCI Cardholders)',
          'High Net Worth Cross-Border Indian Families',
        ],
      },
      testimonials: { enabled: false, sectionTitle: 'Client Testimonials', items: [] },
      faq: {
        sectionTitle: 'NRI Tax & Remittance FAQ',
        items: [
          { question: 'What is the purpose of Form 15CA and Form 15CB?', answer: 'Form 15CB is a formal certification issued by a practicing Chartered Accountant confirming that appropriate taxes have been paid or withheld on funds being remitted overseas. Form 15CA is an electronic declaration submitted on the tax portal by the remitter containing the 15CB details.' },
          { question: 'Why is a Section 197 Lower TDS certificate critical when selling property in India?', answer: 'When an NRI sells immovable property in India, the buyer is legally required to deduct TDS at 20% (plus applicable surcharge and cess, effectively up to 23.92%) on the GROSS sale value. A Lower TDS certificate authorizes the buyer to deduct tax only on actual capital gains, saving substantial liquidity.' },
          { question: 'How much money can an NRI repatriate overseas in a financial year?', answer: 'Under the RBI Liberalised Remittance Facility for NRIs, you can repatriate up to USD 1,000,000 (One Million US Dollars) per financial year out of balances held in your NRO account from legitimate sources such as sale of property, inheritance, dividends, or pensions.' },
          { question: 'Will I be taxed twice on Indian property sales in my resident country (e.g., USA or UK)?', answer: 'Under the Double Taxation Avoidance Agreement (DTAA), taxes paid in India can generally be claimed as a Foreign Tax Credit (FTC) against tax liabilities in your resident country, preventing double taxation. We assist in filing Form 67 to support these claims.' },
        ],
      },
      contact: {
        sectionTitle: 'Initiate Remote NRI Consultation',
        sectionSubtitle: 'Connect with our cross-border advisory team to discuss your property sale, 15CB certificate, or tax return.',
        formTitle: 'Schedule Video Consultation',
        simulatedDisclaimer: 'Demo concept only — inquiries submitted through this form are simulated and are not delivered to the business.',
        publicEmail: facts.publicEmail || null,
        publicPhone: facts.publicPhone || null,
        ctaSubmitText: 'Request Consultation (Simulated)',
      },
      location: {
        address: facts.address || `${city}, India`,
        city: facts.city || 'Gurugram',
        officeHours: 'Monday – Saturday: 9:00 AM – 8:00 PM IST (Global Times Supported)',
        mapPlaceholder: true,
      },
      footer: {
        copyright: `© ${currentYear} ${brandName}. All rights reserved.`,
        disclaimer: 'Personalized website demonstration concept generated by GetVisible. Prepared exclusively for professional review.',
      },
    };
  },
};

/* =========================================================================
 * 6. DIRECT TAX LITIGATOR & SCRUTINY SPECIALIST
 * ========================================================================= */
export const DIRECT_TAX_LITIGATION_TEMPLATE: ProfessionTemplate = {
  id: 'DIRECT_TAX_LITIGATION',
  name: 'Direct Tax Litigator & Scrutiny Specialist',
  profession: 'Chartered Accountant',
  description: 'Strategic defense against faceless scrutiny, Section 148 reassessment notices, and appellate representation before CIT(Appeals) and ITAT.',
  themes: [THEMES.classicBurgundy, THEMES.corporateSlate, THEMES.executiveNavy],
  defaultTheme: THEMES.classicBurgundy,
  buildContent(facts: LeadFacts, theme?: WebsiteTheme, design?: WebsiteDesign): WebsiteContent {
    const brandName = facts.businessName || 'Direct Tax Litigation & Appellate Counsel';
    const city = facts.city || 'Gurugram';
    const activeTheme = theme || (design ? design.theme : THEMES.classicBurgundy);
    const currentYear = new Date().getFullYear();

    return {
      meta: {
        title: `${brandName} | Direct Tax Litigation & Scrutiny Defense in ${city}`,
        description: `Dedicated chartered accountancy practice in ${city} specializing in faceless assessment scrutiny defense, Section 148 notice quashing, and ITAT appellate advocacy.`,
        profession: facts.profession || 'Chartered Accountant',
        templateId: 'DIRECT_TAX_LITIGATION',
      },
      brand: {
        businessName: brandName,
        tagline: `Appellate Advocacy & Income Tax Scrutiny Defense in ${city}`,
        provenance: facts.businessName ? 'VERIFIED_LEAD' : 'NEUTRAL_PLACEHOLDER',
      },
      theme: activeTheme,
      design,
      navigation: {
        items: [
          { label: 'Scrutiny Defense', href: '#services' },
          { label: 'Appellate Focus', href: '#about' },
          { label: 'Why Choose Us', href: '#why-choose-us' },
          { label: 'Contact', href: '#contact' },
        ],
        ctaText: 'Schedule Case Review',
        ctaHref: '#contact',
      },
      hero: {
        badge: 'Direct Tax Litigation & Scrutiny Practice',
        headline: `Decisive Direct Tax Scrutiny Defense & Appellate Representation in ${city}`,
        subheadline: `Specialized counsel defending corporate promoters, business owners, and HNIs against income tax scrutiny notices, arbitrary additions, and penalty proceedings.`,
        primaryCta: { label: 'Submit Notice for Case Assessment', href: '#contact' },
        secondaryCta: { label: 'Explore Appellate Practice', href: '#services' },
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      about: {
        title: 'Unflinching Defense in Faceless Revenue Proceedings',
        leadParagraph: `${brandName} represents business owners, corporate entities, and high-net-worth taxpayers across ${city} in high-stakes income tax disputes and tribunal appeals.`,
        body: `The transition to the Faceless Assessment Regime (Section 144B) has revolutionized tax scrutiny. Standard verbal explanations no longer suffice—every submission must be an airtight legal brief structured with factual precision, mathematical reconciliations, and irrefutable citations from High Courts and the Supreme Court. We analyze notice legality, rebut arbitrary additions, and safeguard our clients from high-pitched assessments.`,
        highlights: [
          { title: 'Statutory Jurisdictional Scrutiny', description: 'Challenging notice validity under Section 148A, limitation bars, and lack of required higher-authority sanction.' },
          { title: 'Airtight Written Briefs', description: 'Submissions structured specifically to satisfy verification units and technical units in faceless assessment.' },
          { title: 'ITAT & High Court Pedigree', description: 'Decades of experience framing grounds of appeal and paperbooks for tribunal hearings.' },
          { title: 'Penalty Mitigation Strategy', description: 'Proactive applications for immunity under Section 270AA to prevent penalty and prosecution.' },
        ],
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      services: {
        sectionTitle: 'Direct Tax Litigation & Scrutiny Capabilities',
        sectionSubtitle: 'Strategic defense from preliminary notice response to tribunal appellate arguments.',
        items: [
          {
            id: 'dt-1',
            title: 'Faceless Assessment Scrutiny Defense (Sec 143(3) & 144B)',
            description: 'Drafting point-by-point factual rebuttals to show cause notices, draft assessment orders, and handling video conference hearings.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'dt-2',
            title: 'Section 148 & 148A Reassessment Notice Quashing',
            description: 'Challenging reasons to believe, lack of prior approval under Section 151, limitation bar violations, and high-pitched reassessments.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'dt-3',
            title: 'CIT(Appeals) & ITAT Appellate Advocacy',
            description: 'Preparation of Form 35, formulation of grounds of appeal, compilation of comprehensive paperbooks, and tribunal representation.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'dt-4',
            title: 'Search, Seizure & Survey Advisory (Sec 132/133A)',
            description: 'Post-search disclosure handling, panchnama review, undisclosed investment defense, and cash/stock seizure regularizations.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'dt-5',
            title: 'Penalty Proceedings Mitigation (Sec 270A & 271AAC)',
            description: 'Applications for immunity under Section 270AA, establishing bona fide explanations, and rebutting under-reporting charges.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'dt-6',
            title: 'Stay of Demand & Bank Attachment Releases',
            description: 'Filing Section 220(6) stay petitions, seeking waiver of 20% pre-deposit requirements, and lifting administrative bank freezes.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
        ],
      },
      whyChooseUs: {
        sectionTitle: 'Hallmarks of Our Appellate Practice',
        sectionSubtitle: 'Why taxpayers trust our firm in critical tax disputes.',
        points: [
          { title: 'Exhaustive Judicial Citations', description: 'Every submission is fortified with authoritative Supreme Court, High Court, and ITAT precedents.', iconName: 'ShieldCheck' },
          { title: 'Algorithm-Ready Draftsmanship', description: 'Replies structured to be clear and persuasive when parsed by faceless assessment technical units.', iconName: 'CheckCircle2' },
          { title: 'Direct Partner Arguing Counsel', description: 'Senior partners personally argue virtual hearings and tribunal appeals.', iconName: 'UserCheck' },
          { title: 'Absolute Discretion', description: 'Complete confidentiality regarding sensitive family finances and disputed revenue claims.', iconName: 'Lock' },
        ],
      },
      process: {
        sectionTitle: 'Structured Notice Defense Life-Cycle',
        sectionSubtitle: 'A disciplined protocol designed to neutralize tax demands before they crystallize.',
        steps: [
          { number: '01', title: 'Limitation & Jurisdiction Verification', description: 'Verification of notice timeline, sanction validity under Section 151, and DIN generation.' },
          { number: '02', title: 'Factual Docket & Rebuttal Formulation', description: 'Reconciliation of AIS/TIS data, ledger entries, bank extracts, and transactional rationale.' },
          { number: '03', title: 'Written Submission & Virtual Hearing', description: 'Uploading indexed legal brief and conducting oral argument via the IT portal virtual court.' },
          { number: '04', title: 'Appellate Action & Stay Protection', description: 'Immediate filing of Form 35 or stay petition in the event of an adverse draft assessment order.' },
        ],
      },
      trust: {
        sectionTitle: 'Standards of Professional Governance',
        badges: [
          { title: 'ICAI Ethical Guidelines Compliant', description: 'Strict adherence to code of professional ethics, audit quality standards, and independence norms.', iconName: 'ShieldCheck' },
          { title: 'Tribunal Advocacy Standards', description: 'Meticulous preparation of appellate paperbooks following Income Tax Appellate Tribunal rules.', iconName: 'CheckCircle2' },
          { title: 'Ironclad Privilege & Discretion', description: 'Strict legal confidentiality safeguarding litigation strategy and sensitive family disclosures.', iconName: 'Lock' },
          { title: 'Zero Compromise Legal Integrity', description: 'Principled defense grounded entirely in lawful statutory interpretation and binding judicial authority.', iconName: 'ShieldCheck' },
        ],
      },
      expertise: {
        sectionTitle: 'Litigation Practice Areas',
        sectionSubtitle: 'Specialized proficiency across critical direct tax dispute mechanisms.',
        items: [
          { title: 'Section 148A Reassessment Challenges', description: 'Filing objections challenging information suggesting income escaping assessment.', tags: ['Sec 148A', 'Reassessment', 'Limitation'] },
          { title: 'Section 68/69 Unexplained Cash Credits', description: 'Establishing identity, creditworthiness, and genuineness of transactions to rebut arbitrary additions.', tags: ['Sec 68', 'Cash Credit', 'Additions'] },
          { title: 'Section 270AA Immunity from Penalty', description: 'Securing statutory waivers from heavy misreporting penalties upon timely compliance.', tags: ['Sec 270AA', 'Immunity', 'Penalty'] },
          { title: 'ITAT Appeal Paperbooks', description: 'Compiling indexed, verified documentation folders for High-Bench tribunal hearings.', tags: ['ITAT', 'Paperbook', 'Tribunal'] },
        ],
      },
      ctaBanner: {
        title: `Facing an Income Tax Scrutiny or Reassessment Notice?`,
        subtitle: 'Have your notice reviewed by senior direct tax litigation practitioners before filing a response.',
        primaryCta: { label: 'Submit Notice for Case Assessment', href: '#contact' },
        secondaryCta: { label: 'Review Scrutiny Focus', href: '#services' },
      },
      industries: {
        enabled: true,
        sectionTitle: 'Taxpayers & Profiles Represented',
        items: [
          'HNI Business Promoters & Family Patriarchs',
          'Real Estate Developers & Landowners',
          'Trading & Manufacturing Partnerships',
          'Gems, Jewellery & Bullion Merchants',
          'Healthcare & Hospital Enterprises',
          'Multi-Entity Business Conglomerates',
        ],
      },
      testimonials: { enabled: false, sectionTitle: 'Client Testimonials', items: [] },
      faq: {
        sectionTitle: 'Direct Tax Litigation FAQ',
        items: [
          { question: 'What is the first step when a Section 148A(b) show-cause notice is received?', answer: 'Immediately examine the underlying information relied upon by the Assessing Officer, verify if prior approval of the specified authority (Pr. CCIT/Pr. CIT) was obtained, and review whether the notice was issued within the 3-year or 10-year limitation window under Section 149.' },
          { question: 'How do virtual hearings work in the Faceless Assessment scheme?', answer: 'Virtual hearings are requested through the e-filing portal upon receipt of a Show Cause Notice or Draft Assessment Order. The hearing is conducted via secure video conference with the Assessment Unit, allowing our arguing counsel to present facts and screen-share supporting evidence.' },
          { question: 'Can the tax department automatically attach bank accounts while an appeal is pending?', answer: 'The department cannot proceed with recovery if a valid Stay of Demand petition under Section 220(6) has been filed and the required statutory pre-deposit (normally 20% or waiver grounds) is adjudicated. In case of arbitrary recovery, we file immediate stay applications before the CIT(A).' },
          { question: 'What is the significance of applying for immunity under Section 270AA?', answer: 'Section 270AA allows a taxpayer to apply for immunity from penalty under Section 270A and prosecution under Chapter XXII, provided the tax and interest demand is paid within the stipulated period and no appeal is preferred against the assessment order.' },
        ],
      },
      contact: {
        sectionTitle: 'Consult with Our Litigation Counsel',
        sectionSubtitle: 'Schedule a confidential consultation to review pending notices, assessment orders, or appellate deadlines.',
        formTitle: 'Submit Notice for Assessment',
        simulatedDisclaimer: 'Demo concept only — inquiries submitted through this form are simulated and are not delivered to the business.',
        publicEmail: facts.publicEmail || null,
        publicPhone: facts.publicPhone || null,
        ctaSubmitText: 'Request Case Assessment (Simulated)',
      },
      location: {
        address: facts.address || `${city}, India`,
        city: facts.city || 'Gurugram',
        officeHours: 'Monday – Friday: 9:30 AM – 7:00 PM IST',
        mapPlaceholder: true,
      },
      footer: {
        copyright: `© ${currentYear} ${brandName}. All rights reserved.`,
        disclaimer: 'Personalized website demonstration concept generated by GetVisible. Prepared exclusively for professional review.',
      },
    };
  },
};

/* =========================================================================
 * 7. BOUTIQUE FAMILY OFFICE & ESTATE SUCCESSION
 * ========================================================================= */
export const FAMILY_OFFICE_ESTATE_TEMPLATE: ProfessionTemplate = {
  id: 'FAMILY_OFFICE_ESTATE',
  name: 'Boutique Family Office & Estate Succession',
  profession: 'Chartered Accountant',
  description: 'Discreet wealth preservation, private family trusts, HUF restructuring, and succession charters for multi-generational business families.',
  themes: [THEMES.heritageBronze, THEMES.classicBurgundy, THEMES.corporateSlate],
  defaultTheme: THEMES.heritageBronze,
  buildContent(facts: LeadFacts, theme?: WebsiteTheme, design?: WebsiteDesign): WebsiteContent {
    const brandName = facts.businessName || 'Family Office & Estate Succession Counsel';
    const city = facts.city || 'Gurugram';
    const activeTheme = theme || (design ? design.theme : THEMES.heritageBronze);
    const currentYear = new Date().getFullYear();

    return {
      meta: {
        title: `${brandName} | Family Office & Estate Succession Advisory in ${city}`,
        description: `Bespoke chartered accountancy practice in ${city} advising business dynasties on private family trusts, HUF settlement deeds, holding company governance, and succession charters.`,
        profession: facts.profession || 'Chartered Accountant',
        templateId: 'FAMILY_OFFICE_ESTATE',
      },
      brand: {
        businessName: brandName,
        tagline: `Generational Wealth Preservation & Family Governance in ${city}`,
        provenance: facts.businessName ? 'VERIFIED_LEAD' : 'NEUTRAL_PLACEHOLDER',
      },
      theme: activeTheme,
      design,
      navigation: {
        items: [
          { label: 'Family Office', href: '#services' },
          { label: 'Succession Philosophy', href: '#about' },
          { label: 'Trust Structuring', href: '#expertise' },
          { label: 'Contact', href: '#contact' },
        ],
        ctaText: 'Request Private Dialogue',
        ctaHref: '#contact',
      },
      hero: {
        badge: 'Private Family Office & Estate Advisory',
        headline: `Bespoke Family Office Governance & Wealth Succession for ${city} Dynasties`,
        subheadline: `Advising prominent business families on private discretionary trusts, HUF settlement deeds, holding company governance, and cross-generational wealth protection.`,
        primaryCta: { label: 'Initiate Confidential Discussion', href: '#contact' },
        secondaryCta: { label: 'Explore Family Office Services', href: '#services' },
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      about: {
        title: 'Preserving Family Legacies Across Generations',
        leadParagraph: `${brandName} serves as trusted counsel to business promoters, industrial families, and multi-generational lineages across ${city}, structuring enduring architectures for wealth preservation.`,
        body: `Accumulating wealth requires commercial acumen; preserving it across multiple generations demands legal foresight, tax efficiency, and structured family governance. We architect private discretionary trusts, draft equitable family settlement deeds, and consolidate operating company equity into clean holding structures. Our work shields family assets from partition disputes, ensures seamless succession, and preserves harmonious family leadership.`,
        highlights: [
          { title: 'Generational Discretion', description: 'Enduring relationships built on absolute confidentiality and objective family stewardship.' },
          { title: 'Private Trust Architectures', description: 'Drafting discretionary trust deeds that ring-fence family assets while ensuring tax pass-through.' },
          { title: 'HUF Settlement Precision', description: 'Resolving complex coparcenary rights and structuring total or partial HUF partitions.' },
          { title: 'HoldCo Restructuring', description: 'Consolidating promoter equity into holding companies for tax-efficient dividend flows.' },
        ],
        provenance: 'NEUTRAL_PLACEHOLDER',
      },
      services: {
        sectionTitle: 'Family Office & Succession Capabilities',
        sectionSubtitle: 'Comprehensive private advisory safeguarding family capital, assets, and harmony.',
        items: [
          {
            id: 'fo-1',
            title: 'Private Discretionary Family Trust Formation',
            description: 'Drafting bespoke trust deeds, trustee selection, beneficiary rights structuring, and ring-fencing assets against future claims.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'fo-2',
            title: 'HUF Restructuring & Family Settlement Deeds',
            description: 'Partition documentation, coparcenary rights alignment, family charters, and formal family arrangement agreements.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'fo-3',
            title: 'Holding Company (HoldCo) Consolidation',
            description: 'Structuring operating company shareholding under clean holding vehicles, optimizing dividend distribution and inter-company lending.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'fo-4',
            title: 'Comprehensive Succession Charters & Wills',
            description: 'Drafting multi-generational family constitutions, succession roadmaps for operating businesses, and testamentary wills.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'fo-5',
            title: 'Promoter Real Estate & Capital Gains Rollover',
            description: 'Tax-efficient restructuring of ancestral commercial and residential property holdings utilizing Section 54 and 54EC exemptions.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
          {
            id: 'fo-6',
            title: 'Philanthropic & Section 8 Charitable Governance',
            description: '12AB and 80G registrations, CSR governance, family foundation structuring, and public charitable trust stewardship.',
            isConfirmed: false,
            provenance: 'NEUTRAL_PLACEHOLDER',
          },
        ],
      },
      whyChooseUs: {
        sectionTitle: 'Principles of Family Office Stewardship',
        sectionSubtitle: 'Why premier business lineages entrust their succession to our practice.',
        points: [
          { title: 'Absolute Discretion & Trust', description: 'Decades of experience handling sensitive family assets with unwavering confidentiality.', iconName: 'Lock' },
          { title: 'Conflict-Preventing Charters', description: 'Crafting clear rules of governance that align family aspirations before disputes arise.', iconName: 'ShieldCheck' },
          { title: 'Holistic Law & Tax Integration', description: 'Harmonizing Indian Trusts Act, Income Tax Act, and Hindu Succession Act provisions.', iconName: 'CheckCircle2' },
          { title: 'Generational Continuity', description: 'Stewardship that bridges patriarchs, operating executives, and next-generation inheritors.', iconName: 'UserCheck' },
        ],
      },
      process: {
        sectionTitle: 'The Succession Planning Roadmap',
        sectionSubtitle: 'A methodical, dignified process tailored to the family vision.',
        steps: [
          { number: '01', title: 'Family Dialogue & Asset Inventory', description: 'Confidential discovery mapping all operating businesses, real estate, trusts, and personal holdings.' },
          { number: '02', title: 'Architecture Blueprint & Tax Modeling', description: 'Designing private trust structures, beneficiary entitlements, and tax pass-through simulations.' },
          { number: '03', title: 'Deed Drafting & Legal Execution', description: 'Finalizing trust deeds, family settlement agreements, and testamentary wills with proper witnessing.' },
          { number: '04', title: 'Ongoing Governance & Annual Review', description: 'Periodic family council reviews, trust asset compliance, and statutory annual tax filings.' },
        ],
      },
      trust: {
        sectionTitle: 'Standards of Professional Governance',
        badges: [
          { title: 'ICAI Ethical Guidelines Compliant', description: 'Strict adherence to code of professional ethics, audit quality standards, and independence norms.', iconName: 'ShieldCheck' },
          { title: 'Fiduciary Independence Standards', description: 'Independent counsel prioritizing the long-term preservation of family capital.', iconName: 'CheckCircle2' },
          { title: 'Ironclad Vault Data Security', description: 'Encrypted offline repositories protecting family wills, charters, and shareholding agreements.', iconName: 'Lock' },
          { title: 'Generational Fiduciary Stewardship', description: 'Commitment to serving as objective counsel across patriarch transitions.', iconName: 'UserCheck' },
        ],
      },
      expertise: {
        sectionTitle: 'Specialized Family Wealth Domains',
        sectionSubtitle: 'Core technical focus areas in private estate and succession advisory.',
        items: [
          { title: 'Private Discretionary Family Trusts', description: 'Structuring trusts where trustee holds discretionary distribution powers to shield assets from creditors.', tags: ['Private Trust', 'Trusts Act', 'Pass-Through'] },
          { title: 'HUF Partition Agreements', description: 'Formalizing partitions to separate family coparcenary interests without incurring adverse tax penalties.', tags: ['HUF', 'Partition', 'Family Deed'] },
          { title: 'Family Constitution & Council Rules', description: 'Codifying next-gen employment rules, voting rights, and conflict resolution mechanisms.', tags: ['Constitution', 'Council', 'Governance'] },
          { title: 'Charitable Foundation Structuring', description: 'Establishing Section 8 entities and public trusts with 12AB and 80G tax exemptions.', tags: ['Sec 8', '12AB', 'Philanthropy'] },
        ],
      },
      ctaBanner: {
        title: `Protect Your Family Capital Across Generations in ${city}`,
        subtitle: 'Request a discreet, private dialogue with our family office and estate succession partners.',
        primaryCta: { label: 'Initiate Confidential Discussion', href: '#contact' },
        secondaryCta: { label: 'Review Succession Focus', href: '#services' },
      },
      industries: {
        enabled: true,
        sectionTitle: 'Dynasties & Families Advised',
        items: [
          'Promoters of Listed & Large Private Companies',
          'Multi-Generational Industrial Lineages',
          'Real Estate & Landholding Family Patriarchs',
          'Tech Founders with Liquidity Events',
          'Prominent Professional & Medical Lineages',
          'Single & Multi-Family Office Structures',
        ],
      },
      testimonials: { enabled: false, sectionTitle: 'Client Testimonials', items: [] },
      faq: {
        sectionTitle: 'Family Office & Succession FAQ',
        items: [
          { question: 'Why is a Private Discretionary Trust superior to a traditional Will?', answer: 'A Will only takes effect upon demise and is frequently vulnerable to probate delays and family challenges in court. A Private Family Trust takes effect immediately during lifetime, protects assets from future business creditors or marital partitions, and enables smooth distribution without public probate.' },
          { question: 'What are the tax implications of transferring assets into a private family trust?', answer: 'Under Section 56(2)(x) of the Income Tax Act, gifts and transfers of assets to a trust created solely for the benefit of relatives of the settlor are exempt from tax. We structure the trust deed to ensure it qualifies for complete tax pass-through status.' },
          { question: 'How can HUF assets be partitioned without creating income tax litigation?', answer: 'Income Tax Act Section 171 requires that only a total partition (and not a partial partition) is recognized for derecognizing an HUF. We draft complete family settlement deeds recording the physical division of assets accompanied by proper accounting entries.' },
          { question: 'What is a Family Constitution and when should a business family adopt one?', answer: 'A Family Constitution is a formal agreement establishing rules for family member employment in operating businesses, dividend distribution policies, board representation, and dispute resolution. It is best adopted while the family patriarch is active and harmony prevails.' },
        ],
      },
      contact: {
        sectionTitle: 'Request a Private Family Dialogue',
        sectionSubtitle: 'Connect with our senior partners for an entirely confidential discussion regarding your estate, trusts, or family charters.',
        formTitle: 'Request Private Dialogue',
        simulatedDisclaimer: 'Demo concept only — inquiries submitted through this form are simulated and are not delivered to the business.',
        publicEmail: facts.publicEmail || null,
        publicPhone: facts.publicPhone || null,
        ctaSubmitText: 'Request Dialogue (Simulated)',
      },
      location: {
        address: facts.address || `${city}, India`,
        city: facts.city || 'Gurugram',
        officeHours: 'Monday – Friday: 10:00 AM – 6:00 PM IST (Private Appointments Only)',
        mapPlaceholder: true,
      },
      footer: {
        copyright: `© ${currentYear} ${brandName}. All rights reserved.`,
        disclaimer: 'Personalized website demonstration concept generated by GetVisible. Prepared exclusively for professional review.',
      },
    };
  },
};
