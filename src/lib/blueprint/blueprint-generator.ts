import { LeadData, WebsiteContent, WebsiteTheme, WebsiteDesign, WebsiteSectionType } from '@/types';
import { resolveProfessionConfig, DESIGN_SYSTEMS, ProfessionConfig, DesignSystemId } from './profession-config';
import { WebsiteBlueprint, BlueprintSection, ComponentType, validateAndRepairBlueprint } from './blueprint-schema';
import { GeminiAIProvider, MockAIProvider } from '@/lib/providers/ai.provider';

export interface GenerateBlueprintOptions {
  designSystemId?: DesignSystemId;
  useAi?: boolean;
  version?: number;
}

export class BlueprintGeneratorService {
  /**
   * Generates a validated, structured JSON blueprint for any profession and prospect.
   * If AI fails or is unconfigured, produces a rich, deterministic, factual baseline.
   */
  static async generateBlueprint(
    lead: LeadData,
    options: GenerateBlueprintOptions = {}
  ): Promise<WebsiteBlueprint> {
    const config: ProfessionConfig = resolveProfessionConfig(lead.profession);
    const chosenSystemId: DesignSystemId = options.designSystemId || config.defaultDesignSystem;
    const designTheme = DESIGN_SYSTEMS[chosenSystemId] || DESIGN_SYSTEMS['modern-corporate'];

    // Map profession section order to blueprint sections
    const rawSectionOrder = config.recommendedSectionOrder;
    const sections: BlueprintSection[] = rawSectionOrder.map((secType, idx) => ({
      id: `sec-${secType.toLowerCase()}-${idx}`,
      type: secType as ComponentType,
      title: secType === 'HERO' ? 'Welcome' : secType.charAt(0) + secType.slice(1).toLowerCase(),
      subtitle: `${config.name} practice services`,
      order: idx,
      isVisible: true,
      props: {},
    }));

    // Create theme object compatible with WebsiteTheme
    const theme: WebsiteTheme = {
      id: designTheme.id,
      name: designTheme.name,
      primaryColor: designTheme.primaryColor,
      secondaryColor: designTheme.secondaryColor,
      accentColor: designTheme.accentColor,
      fontFamily: designTheme.fontFamily,
      borderRadius: designTheme.borderRadius,
      style: designTheme.style,
    };

    const design: WebsiteDesign = {
      layout: 'MODERN_INDIAN',
      theme,
      sectionOrder: rawSectionOrder as WebsiteSectionType[],
      features: {
        designSystem: chosenSystemId,
      },
    };

    const businessName = lead.businessName;
    const city = lead.city || 'Gurgaon';
    const professionTitle = config.name;

    // Build foundational content tailored specifically to the profession
    let content: WebsiteContent = {
      meta: {
        title: `${businessName} | ${professionTitle} in ${city}`,
        description: `Verified professional practice providing specialized ${config.keywords.slice(0, 3).join(', ')} in ${city}.`,
        profession: config.name,
        templateId: chosenSystemId,
      },
      brand: {
        businessName,
        tagline: `${professionTitle} Practice & Client Advisory`,
        provenance: 'VERIFIED_LEAD',
      },
      theme,
      design,
      navigation: {
        items: [
          { label: 'Home', href: '#hero' },
          { label: 'Services', href: '#services' },
          { label: 'About', href: '#about' },
          { label: 'FAQ', href: '#faq' },
          { label: 'Contact', href: '#contact' },
        ],
        ctaText: config.ctaLabel,
        ctaHref: '#contact',
      },
      hero: {
        badge: config.heroBadgeDefault,
        headline: `Specialized ${professionTitle} Solutions in ${city}`,
        subheadline: `Delivering disciplined, client-centered ${config.category} with measurable integrity and certified practice standards.`,
        primaryCta: {
          label: config.ctaLabel,
          href: '#contact',
        },
        secondaryCta: {
          label: 'Explore Services',
          href: '#services',
        },
        provenance: 'AI_SYNTHESIZED',
      },
      about: {
        title: `About ${businessName}`,
        leadParagraph: `Based in ${city}, ${businessName} is a dedicated ${professionTitle} practice committed to excellence and tailored client solutions.`,
        body: `We focus on strategic clarity, regulatory compliance, and enduring value for our clients. Our practice blends established domain methodologies with responsive communication.`,
        highlights: [
          {
            title: 'Client-Centric Discipline',
            description: `Every engagement begins with understanding your specific operational and strategic priorities in ${city}.`,
          },
          {
            title: 'Regulatory & Quality Standards',
            description: `Adherence to standard professional practice ethics, confidentiality, and statutory guidelines.`,
          },
        ],
        provenance: 'AI_SYNTHESIZED',
      },
      services: {
        sectionTitle: `${professionTitle} Services`,
        sectionSubtitle: `Comprehensive solutions covering every facet of ${config.category}.`,
        items: config.sampleServices.map((srv, idx) => ({
          id: `srv-${idx + 1}`,
          title: srv.title,
          description: srv.description,
          isConfirmed: false,
          provenance: 'AI_SYNTHESIZED',
        })),
      },
      whyChooseUs: {
        sectionTitle: `Why Choose ${businessName}`,
        sectionSubtitle: `Principles that guide our ${professionTitle} practice daily.`,
        points: [
          {
            title: 'Demonstrated Technical Competence',
            description: `Consistent execution following recognized industry standards and regulatory compliance frameworks.`,
          },
          {
            title: 'Direct Senior Oversight',
            description: `Every assignment receives hands-on review and strategic guidance from experienced practitioners.`,
          },
          {
            title: 'Complete Confidentiality',
            description: `Your sensitive records, data, and communications are safeguarded under strict privacy protocols.`,
          },
        ],
      },
      process: {
        sectionTitle: 'Our Engagement Process',
        sectionSubtitle: 'A structured, transparent pathway from discovery to delivery.',
        steps: [
          {
            number: '01',
            title: 'Discovery & Consultation',
            description: `Initial discussion to review your requirements, scope, and timeline in ${city}.`,
          },
          {
            number: '02',
            title: 'Strategy & Execution Plan',
            description: 'Formulation of tailored solutions, resource allocation, and key milestone schedules.',
          },
          {
            number: '03',
            title: 'Implementation & Reviews',
            description: 'Disciplined execution accompanied by regular status check-ins and documentation.',
          },
        ],
      },
      trust: {
        sectionTitle: 'Standards & Practice Badges',
        badges: [
          {
            title: 'Professional Code',
            description: 'Strict adherence to formal professional practice conduct.',
          },
          {
            title: 'Secure Records',
            description: 'Encrypted communication and privileged confidentiality.',
          },
        ],
      },
      testimonials: {
        enabled: false,
        sectionTitle: 'Client Perspectives',
        items: [],
      },
      industries: {
        enabled: false,
        sectionTitle: 'Sectors We Serve',
        items: [],
      },
      faq: {
        sectionTitle: 'Frequently Asked Questions',
        items: config.sampleFaq.map((f) => ({
          question: f.question,
          answer: f.answer,
        })),
      },
      contact: {
        sectionTitle: 'Get in Touch',
        sectionSubtitle: `Contact our ${city} practice to discuss how we can assist you.`,
        formTitle: config.ctaLabel,
        simulatedDisclaimer:
          'Demo concept only — inquiries submitted through this form are simulated and are not delivered to the business.',
        publicEmail: lead.publicEmail || null,
        publicPhone: lead.publicPhone || null,
        ctaSubmitText: 'Submit Inquiry',
      },
      location: {
        address: lead.address || `${city}, Haryana, India`,
        city: city,
        officeHours: 'Monday – Friday: 9:30 AM – 6:30 PM',
        mapPlaceholder: true,
      },
      footer: {
        copyright: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`,
        disclaimer:
          'Personalized website demonstration concept generated by GetVisible. Prepared exclusively for prospect evaluation.',
      },
    };

    // Enrich with AI if requested
    if (options.useAi) {
      content = await this.enrichContentWithAi(content, lead, config);
    }

    const blueprintRaw: WebsiteBlueprint = {
      id: `bp-${lead.id}-${Date.now()}`,
      version: options.version || 1,
      profession: config.name,
      designSystemId: chosenSystemId,
      brand: {
        businessName,
        tagline: content.brand.tagline,
        city,
        address: lead.address || undefined,
        publicEmail: lead.publicEmail || null,
        publicPhone: lead.publicPhone || null,
      },
      palette: {
        primaryColor: designTheme.primaryColor,
        secondaryColor: designTheme.secondaryColor,
        accentColor: designTheme.accentColor,
        fontFamily: designTheme.fontFamily,
        borderRadius: designTheme.borderRadius,
        style: designTheme.style,
      },
      seo: {
        title: content.meta.title,
        description: content.meta.description,
        keywords: config.keywords,
      },
      navigation: content.navigation,
      sections,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const validated = validateAndRepairBlueprint(blueprintRaw);
    if (!validated.success || !validated.blueprint) {
      throw new Error(`Blueprint validation failed: ${(validated.errors || []).join(', ')}`);
    }

    return validated.blueprint;
  }

  /**
   * Calls AI provider with strict anti-fabrication guidelines to refine copy
   */
  private static async enrichContentWithAi(
    content: WebsiteContent,
    lead: LeadData,
    config: ProfessionConfig
  ): Promise<WebsiteContent> {
    const gemini = new GeminiAIProvider();
    const mock = new MockAIProvider();
    const ai = gemini.isConfigured() ? gemini : mock.isConfigured() ? mock : null;

    if (!ai) return content;

    try {
      const res = await ai.generatePersonalizedContent({
        businessName: lead.businessName,
        profession: config.name,
        city: lead.city || 'Gurgaon',
        address: lead.address,
      });

      if (!res.success || !res.data) return content;

      const aiData = res.data;
      return {
        ...content,
        brand: {
          ...content.brand,
          tagline: aiData.tagline || content.brand.tagline,
          provenance: 'AI_SYNTHESIZED',
        },
        hero: {
          ...content.hero,
          headline: aiData.heroHeadline || content.hero.headline,
          subheadline: aiData.heroSubheadline || content.hero.subheadline,
          primaryCta: {
            ...content.hero.primaryCta,
            label: aiData.ctaText || content.hero.primaryCta.label,
          },
          provenance: 'AI_SYNTHESIZED',
        },
        about: {
          ...content.about,
          leadParagraph: aiData.aboutLead || content.about.leadParagraph,
          body: aiData.aboutBody || content.about.body,
          provenance: 'AI_SYNTHESIZED',
        },
      };
    } catch {
      return content;
    }
  }
}
