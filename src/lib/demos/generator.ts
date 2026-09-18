import { LeadData, WebsiteDemoData, WebsiteTheme, WebsiteContent, WebsiteLayout, WebsiteDesign } from '@/types';
import { WebsiteContentSchema, ValidatedWebsiteContent } from './schema';
import { getTemplate, THEMES, LeadFacts } from './templates';
import { GeminiAIProvider, MockAIProvider } from '@/lib/providers/ai.provider';
import { selectWebsiteDesign } from './personalization';

export interface GenerateDemoOptions {
  templateId?: string;
  themeId?: string;
  layout?: WebsiteLayout;
  organizationId?: string;
  version?: number;
  useAiEnrichment?: boolean;
}

export class WebsiteDemoGeneratorService {
  /**
   * Evaluates whether a lead is eligible for Phase 4 website demo generation.
   * STRICT RULE: Only leads with NO_WEBSITE status are eligible.
   */
  static canGenerateDemo(lead: LeadData): { allowed: boolean; reason?: string } {
    if (lead.websiteStatus === 'WEBSITE_EXISTS') {
      return {
        allowed: false,
        reason: 'Business already has an existing official website. Website concept generation is only permitted for businesses verified with NO_WEBSITE.',
      };
    }

    if (lead.websiteStatus === 'UNKNOWN') {
      return {
        allowed: false,
        reason: 'Website status is UNKNOWN. Verification must be completed before generating a website concept.',
      };
    }

    if (lead.websiteStatus === 'REQUIRES_REVIEW') {
      return {
        allowed: false,
        reason: 'Website status REQUIRES_REVIEW. Manual review must be resolved before generating a website concept.',
      };
    }

    if (lead.websiteStatus === 'NO_WEBSITE') {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Unsupported website status: ${lead.websiteStatus}. Demo generation is blocked.`,
    };
  }

  /**
   * Generates a complete, validated WebsiteDemoData concept for an eligible lead.
   */
  static async generateDemo(
    lead: LeadData,
    options: GenerateDemoOptions = {}
  ): Promise<WebsiteDemoData> {
    const eligibility = this.canGenerateDemo(lead);
    if (!eligibility.allowed) {
      throw new Error(`Demo Generation Blocked: ${eligibility.reason}`);
    }

    const versionNumber = options.version || 1;

    // Deterministically pick layout, theme, and sectionOrder
    const design: WebsiteDesign = selectWebsiteDesign(
      { id: lead.id, businessName: lead.businessName, city: lead.city },
      versionNumber,
      {
        layout: options.layout,
        themeId: options.themeId,
      }
    );

    const leadFacts: LeadFacts = {
      businessName: lead.businessName,
      profession: lead.profession,
      city: lead.city,
      address: lead.address,
      publicEmail: lead.publicEmail,
      publicPhone: lead.publicPhone,
      source: lead.source,
    };

    const requestedTemplateId = options.templateId || options.layout;
    const template = getTemplate(requestedTemplateId, lead.profession, leadFacts);
    const selectedTheme: WebsiteTheme = design.theme;

    // Synthesize factual baseline content tailored to design and facts
    let content: WebsiteContent = template.buildContent(leadFacts, selectedTheme, design);

    // Structured AI Enrichment if configured and requested
    if (options.useAiEnrichment) {
      content = await this.enrichWithAi(content, leadFacts, design.layout);
    }

    // Strict Claim Safety Enforcement
    content = this.enforceClaimSafety(content);

    // Validate using Zod schema to ensure no unsafe URLs or boundary violations
    const validatedContent = WebsiteContentSchema.parse(content) as ValidatedWebsiteContent;

    const demoId = `demo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const websiteDemo: WebsiteDemoData = {
      id: demoId,
      leadId: lead.id,
      organizationId: options.organizationId || lead.organizationId,
      templateId: template.id,
      version: versionNumber,
      generationStatus: 'COMPLETED',
      content: validatedContent as WebsiteContent,
      theme: selectedTheme,
      design,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return websiteDemo;
  }

  /**
   * Strictly enforces claim safety guards:
   * 1. No fabricated social proof or testimonials (must be disabled or marked placeholder)
   * 2. No unsupported claims in Why Choose Us (no fake numbers, awards, or years)
   * 3. Unverified template services must be marked as not confirmed (isConfirmed: false)
   * 4. Clear simulated disclaimer on contact form
   */
  private static enforceClaimSafety(content: WebsiteContent): WebsiteContent {
    // 1. Enforce Testimonials Safety
    const safeTestimonials = {
      ...content.testimonials,
      enabled: false, // Default to disabled to prevent misleading social proof
      items: (content.testimonials.items || []).map((t) => ({
        ...t,
        isPlaceholder: true,
      })),
    };

    // 2. Enforce Services Safety (All unverified services marked isConfirmed: false)
    const safeServices = {
      ...content.services,
      items: content.services.items.map((item) => ({
        ...item,
        isConfirmed: item.isConfirmed === true ? true : false,
      })),
    };

    // 3. Clean Why Choose Us: strip unsupported metric claims (e.g., "500+ audits", "25 years experience")
    const safeWhyChooseUs = {
      ...content.whyChooseUs,
      points: content.whyChooseUs.points.map((pt) => {
        let cleanedDesc = pt.description;
        // Replace unsupported boast patterns if introduced by external input
        cleanedDesc = cleanedDesc.replace(/\b\d+\+?\s*(years?|awards?|clients?|audits?)\b/gi, 'demonstrated expertise');
        return {
          ...pt,
          description: cleanedDesc,
        };
      }),
    };

    // 4. Contact Form Simulated Disclaimer
    const safeContact = {
      ...content.contact,
      simulatedDisclaimer:
        'Demo concept only — inquiries submitted through this form are simulated and are not delivered to the business.',
    };

    return {
      ...content,
      testimonials: safeTestimonials,
      services: safeServices,
      whyChooseUs: safeWhyChooseUs,
      contact: safeContact,
    };
  }

  /**
   * Calls Gemini or Mock AI provider if configured, with strict claim safety prompt constraints.
   * If not configured or if error occurs, falls back cleanly to factual synthesizer.
   */
  private static async enrichWithAi(
    content: WebsiteContent,
    facts: LeadFacts,
    layout?: WebsiteLayout
  ): Promise<WebsiteContent> {
    const gemini = new GeminiAIProvider();
    const mock = new MockAIProvider();
    const ai = gemini.isConfigured() ? gemini : mock.isConfigured() ? mock : null;

    if (!ai) {
      return content;
    }

    try {
      const res = await ai.generatePersonalizedContent({
        businessName: facts.businessName,
        profession: facts.profession,
        city: facts.city,
        address: facts.address,
        layout,
      });

      if (!res.success || !res.data) {
        return content;
      }

      const copy = res.data;

      return {
        ...content,
        brand: {
          ...content.brand,
          tagline: copy.tagline || content.brand.tagline,
          provenance: 'AI_SYNTHESIZED',
        },
        hero: {
          ...content.hero,
          headline: copy.heroHeadline || content.hero.headline,
          subheadline: copy.heroSubheadline || content.hero.subheadline,
          primaryCta: {
            ...content.hero.primaryCta,
            label: copy.ctaText || content.hero.primaryCta.label,
          },
          provenance: 'AI_SYNTHESIZED',
        },
        about: {
          ...content.about,
          leadParagraph: copy.aboutLead || content.about.leadParagraph,
          body: copy.aboutBody || content.about.body,
          provenance: 'AI_SYNTHESIZED',
        },
      };
    } catch {
      // Safe fallback to deterministic baseline
      return content;
    }
  }
}
