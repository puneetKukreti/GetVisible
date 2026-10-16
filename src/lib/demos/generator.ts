import { LeadData, WebsiteDemoData, WebsiteTheme, WebsiteContent, WebsiteLayout, WebsiteDesign, WebsiteSectionType, WebsiteGalleryItem, WebsiteMenuCategory } from '@/types';
import { WebsiteContentSchema, ValidatedWebsiteContent } from './schema';
import { getTemplate, THEMES, LeadFacts } from './templates';
import { GeminiAIProvider, MockAIProvider } from '@/lib/providers/ai.provider';
import { selectWebsiteDesign } from './personalization';
import { getTemplateScreenshotPath } from './stitch-templates';
import {
  generateAiBusinessContent,
  getDeterministicProfessionProfile,
  getGeminiApiKey,
  AiBusinessContent,
} from './ai-content-generator';
import { buildWebsiteImagesObject, getContextualImageUrl } from './image-engine';
import { getIndustryImages } from './industry-images';
import { getProfessionPreset, ProfessionCategory, ProfessionDesignPreset } from './profession-config';
import {
  getProfessionContentPlan,
  normalizeSectionOrder,
  scrubContentCaLeakage,
  ProfessionContentPlan,
} from './profession-sections';
import { isProfessionArchetypeId } from './profession-stitch';

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
      { id: lead.id, businessName: lead.businessName, city: lead.city, profession: lead.profession },
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

    // Profession-aware content & section plan (never defaults to CA)
    const plan = getProfessionContentPlan(lead.profession, lead.businessName);
    const isCaPractice = plan.isCaPractice;

    // Structured AI Enrichment via Gemini Flash or profession-tailored engine
    const liveApiKey = getGeminiApiKey();
    const hasGeminiKey = Boolean(liveApiKey);
    const shouldEnrichWithAi = options.useAiEnrichment !== false;

    let aiProfile: AiBusinessContent | null = null;
    if (shouldEnrichWithAi) {
      if (hasGeminiKey) {
        try {
          aiProfile = await generateAiBusinessContent({
            businessName: lead.businessName,
            profession: lead.profession,
            city: lead.city,
            address: lead.address,
          });
        } catch (aiErr) {
          console.warn('Gemini Flash content generation skipped/failed:', aiErr);
        }
      }

      // If Gemini did not return content (no key or call failed), fall back to rich profession engine
      if (!aiProfile) {
        aiProfile = getDeterministicProfessionProfile({
          businessName: lead.businessName,
          profession: lead.profession,
          city: lead.city,
          address: lead.address,
        });
      }

      if (aiProfile) {
        content = {
          ...content,
          meta: {
            ...content.meta,
            title: (aiProfile.seo?.title || `${lead.businessName} | ${aiProfile.heroBadge || lead.profession} in ${lead.city}`).slice(0, 150),
            description: (aiProfile.seo?.description || aiProfile.heroSubheadline || content.meta.description).slice(0, 300),
            profession: lead.profession,
          },
          brand: {
            ...content.brand,
            businessName: lead.businessName,
            tagline: aiProfile.heroHeadline || content.brand.tagline,
            provenance: 'AI_SYNTHESIZED',
          },
          hero: {
            ...content.hero,
            badge: aiProfile.heroBadge || content.hero.badge,
            headline: aiProfile.heroHeadline || content.hero.headline,
            subheadline: aiProfile.heroSubheadline || content.hero.subheadline,
            primaryCta: {
              ...content.hero.primaryCta,
              label: aiProfile.primaryCtaLabel || content.hero.primaryCta.label,
            },
            provenance: 'AI_SYNTHESIZED',
          },
          about: {
            ...content.about,
            title: `About ${lead.businessName}`,
            leadParagraph: aiProfile.aboutLead || content.about.leadParagraph,
            body: aiProfile.aboutBody || content.about.body,
            highlights:
              aiProfile.highlights && aiProfile.highlights.length > 0
                ? aiProfile.highlights
                : content.about.highlights,
            provenance: 'AI_SYNTHESIZED',
          },
          services: {
            ...content.services,
            sectionTitle: aiProfile.servicesSectionTitle || content.services.sectionTitle,
            sectionSubtitle: aiProfile.servicesSectionSubtitle || content.services.sectionSubtitle,
            items:
              aiProfile.services && aiProfile.services.length > 0
                ? aiProfile.services.map((s, idx) => ({
                    id: `srv-${idx + 1}`,
                    title: s.title,
                    description: s.description,
                    isConfirmed: false,
                    provenance: 'AI_SYNTHESIZED' as const,
                  }))
                : content.services.items,
          },
          whyChooseUs: {
            ...content.whyChooseUs,
            points:
              aiProfile.whyChooseUs && aiProfile.whyChooseUs.length > 0
                ? aiProfile.whyChooseUs.map((w, idx) => ({
                    title: w.title,
                    description: w.description,
                    iconName: content.whyChooseUs.points[idx]?.iconName || 'ShieldCheck',
                  }))
                : content.whyChooseUs.points,
          },
          process:
            aiProfile.processSteps && aiProfile.processSteps.length > 0
              ? {
                  sectionTitle: 'Our Working Process',
                  sectionSubtitle: 'How we collaborate with clients from consultation to delivery.',
                  steps: aiProfile.processSteps.map((p, idx) => ({
                    number: p.number || `0${idx + 1}`,
                    title: p.title,
                    description: p.description,
                  })),
                }
              : content.process,
          faq:
            aiProfile.faqs && aiProfile.faqs.length > 0
              ? {
                  sectionTitle: 'Frequently Asked Questions',
                  items: aiProfile.faqs.map((f) => ({
                    question: f.question,
                    answer: f.answer,
                  })),
                }
              : content.faq,
          expertise:
            aiProfile.expertise && aiProfile.expertise.items.length > 0
              ? {
                  sectionTitle: aiProfile.expertise.sectionTitle || plan.content.expertiseTitle,
                  sectionSubtitle: aiProfile.expertise.sectionSubtitle || plan.content.expertiseSubtitle,
                  items: aiProfile.expertise.items.map((it) => ({
                    title: it.title,
                    description: it.description,
                    tags: it.tags && it.tags.length > 0 ? it.tags : [lead.profession],
                  })),
                }
              : content.expertise,
          navigation:
            aiProfile.navItems && aiProfile.navItems.length > 0
              ? {
                  items: aiProfile.navItems.map((n) => ({ label: n.label, href: n.href || '#contact' })),
                  ctaText: aiProfile.primaryCtaLabel || content.navigation.ctaText,
                  ctaHref: '#contact',
                }
              : content.navigation,
          ctaBanner: {
            title: aiProfile.ctaBanner?.title || plan.content.ctaBannerTitle,
            subtitle: aiProfile.ctaBanner?.subtitle || plan.content.ctaBannerSubtitle,
            primaryCta: {
              label: aiProfile.ctaBanner?.primaryCtaLabel || aiProfile.primaryCtaLabel || content.hero.primaryCta.label,
              href: '#contact',
            },
            secondaryCta: {
              label: aiProfile.ctaBanner?.secondaryCtaLabel || 'View Services',
              href: '#services',
            },
          },
          industries: {
            enabled: false,
            sectionTitle: aiProfile.industries?.sectionTitle || plan.content.industriesTitle,
            items: aiProfile.industries?.items?.length ? aiProfile.industries.items : plan.content.industries,
          },
          trust:
            aiProfile.trustBadges && aiProfile.trustBadges.length > 0
              ? {
                  sectionTitle: content.trust?.sectionTitle || 'Standards & Trust',
                  badges: aiProfile.trustBadges.map((b) => ({
                    title: b.title,
                    description: b.description,
                    iconName: b.iconName || 'ShieldCheck',
                  })),
                }
              : content.trust,
        };
      }
    }

    // ---------------------------------------------------------------------
    // Profession-aware section planning, imagery, and enrichment blocks
    // ---------------------------------------------------------------------
    const industryImgs = getIndustryImages(lead.profession, lead.businessName);
    const preset = getProfessionPreset(lead.profession, lead.businessName);
    const imageSet = buildWebsiteImagesObject(lead.profession, lead.businessName);

    // Prefer the profession-categorised preset imagery, then the industry engine.
    const heroImgUrl = preset.heroImage || industryImgs.heroImage || imageSet.heroImage?.url;
    const aboutImgUrl = preset.aboutImage || industryImgs.aboutImage || imageSet.aboutImage?.url;

    if (heroImgUrl) {
      content.hero.imageUrl = heroImgUrl;
      imageSet.heroImage = {
        url: heroImgUrl,
        alt: `${lead.businessName} - ${lead.profession}`,
        slot: 'HERO' as const,
        aspectRatio: '16:9',
      };
    }
    if (aboutImgUrl) {
      content.about.imageUrl = aboutImgUrl;
      imageSet.aboutImage = {
        url: aboutImgUrl,
        alt: `About ${lead.businessName}`,
        slot: 'ABOUT' as const,
        aspectRatio: '4:5',
      };
    }
    content.images = imageSet;

    // Section composition: honor Gemini's chosen sections when valid, otherwise
    // use the deterministic profession plan. This is what makes the same
    // reusable components produce a photography site vs. a restaurant site.
    // CA practices keep their existing (Stitch-driven) layout order untouched.
    let sectionOrder: WebsiteSectionType[] =
      design.sectionOrder && design.sectionOrder.length > 0 ? design.sectionOrder : plan.sectionOrder;
    if (!isCaPractice) {
      sectionOrder = normalizeSectionOrder(aiProfile?.sections, plan.sectionOrder);
      design.sectionOrder = sectionOrder;
    }

    // Apply safe subset of AI design recommendations.
    if (aiProfile?.design) {
      if (aiProfile.design.contentDensity) design.contentDensity = aiProfile.design.contentDensity;
      if (aiProfile.design.heroLayout) design.heroLayout = aiProfile.design.heroLayout;
      if (aiProfile.design.servicesLayout) design.servicesLayout = aiProfile.design.servicesLayout;
    }

    // Generalized profession design: the AI may pick any registered archetype
    // (validated against the allow-list) and suggest an accent colour. This is
    // what lets "just type a profession" produce a tailored Stitch design with
    // zero per-profession code. CA practices keep their deterministic layout.
    if (!isCaPractice) {
      const chosenArchetype = aiProfile?.design?.archetype;
      if (chosenArchetype && isProfessionArchetypeId(chosenArchetype)) {
        design.layout = chosenArchetype as WebsiteLayout;
      }
      const accent = aiProfile?.design?.accentColor;
      design.stitch = {
        archetype: design.layout,
        accentColor: accent && /^#[0-9a-fA-F]{6}$/.test(accent) ? accent.toLowerCase() : undefined,
      };

      // Persist the resolved design (including the Stitch directive) onto the
      // content so server-side rendering stays fully deterministic.
      content.design = {
        ...(content.design || ({} as WebsiteDesign)),
        layout: design.layout,
        template: design.template,
        theme: design.theme,
        sectionOrder: design.sectionOrder,
        heroLayout: design.heroLayout,
        servicesLayout: design.servicesLayout,
        features: design.features,
        contentDensity: design.contentDensity,
        stitch: design.stitch,
      } as WebsiteDesign;
    }

    // Trust badges — always profession-appropriate; never CA copy for non-CA.
    const trustBadgeSource: any[] =
      plan.trustBadges && plan.trustBadges.length > 0
        ? plan.trustBadges
        : content.trust?.badges
        ? content.trust.badges.map((b) => b.title)
        : [];
    if (trustBadgeSource.length > 0) {
      content.trust = {
        sectionTitle: isCaPractice ? 'Accreditation & Professional Standards' : 'Standards & Commitments',
        badges: trustBadgeSource.slice(0, 6).map((b: any) => ({
          title: typeof b === 'string' ? b : b.title,
          description:
            typeof b === 'string' ? 'Recognised industry standards and client commitment.' : b.description,
          iconName: (typeof b === 'object' && b.iconName) || 'ShieldCheck',
        })),
      };
    }

    // Expertise (specialities / signature style) — profession-titled.
    if (sectionOrder.includes('EXPERTISE')) {
      const aiExpertise = aiProfile?.expertise;
      if (!content.expertise || content.expertise.items.length === 0) {
        content.expertise = {
          sectionTitle: aiExpertise?.sectionTitle || plan.content.expertiseTitle,
          sectionSubtitle: aiExpertise?.sectionSubtitle || plan.content.expertiseSubtitle,
          items: content.services.items.slice(0, 6).map((s) => ({
            title: s.title,
            description: s.description,
            tags: [lead.profession],
          })),
        };
      } else {
        content.expertise = {
          ...content.expertise,
          sectionTitle: aiExpertise?.sectionTitle || plan.content.expertiseTitle,
          sectionSubtitle: aiExpertise?.sectionSubtitle || plan.content.expertiseSubtitle,
        };
      }
    }

    // Gallery for visually-led professions and AI-requested galleries.
    if (sectionOrder.includes('GALLERY')) {
      const galleryItems = buildProfessionGallery(lead, plan, preset, aiProfile);
      if (galleryItems.length > 0) {
        content.gallery = {
          sectionTitle: aiProfile?.gallery?.sectionTitle || plan.content.galleryTitle,
          sectionSubtitle: aiProfile?.gallery?.sectionSubtitle || plan.content.gallerySubtitle,
          items: galleryItems,
        };
      }
    }

    // Menu / packages / memberships / listings.
    if (sectionOrder.includes('MENU')) {
      if (aiProfile?.menu && aiProfile.menu.categories.length > 0) {
        content.menu = {
          sectionTitle: aiProfile.menu.sectionTitle || plan.content.menuTitle,
          sectionSubtitle: aiProfile.menu.sectionSubtitle || plan.content.menuSubtitle,
          categories: aiProfile.menu.categories,
        };
      } else if (!content.menu || content.menu.categories.length === 0) {
        content.menu = {
          sectionTitle: plan.content.menuTitle,
          sectionSubtitle: plan.content.menuSubtitle,
          categories: getDefaultMenusForCategory(plan.category),
        };
      }
    }

    // "Who we serve" is profession-aware and only rendered when planned.
    content.industries = {
      enabled: sectionOrder.includes('INDUSTRIES'),
      sectionTitle: aiProfile?.industries?.sectionTitle || plan.content.industriesTitle,
      items: aiProfile?.industries?.items?.length ? aiProfile.industries.items : plan.content.industries,
    };

    // Guarantee zero CA-specific content for non-CA professions, regardless of
    // whether it originated from AI, the fallback engine, or cached content.
    content = scrubContentCaLeakage(content, isCaPractice) as WebsiteContent;

    // Strict Claim Safety Enforcement
    content = this.enforceClaimSafety(content);

    // Validate using Zod schema to ensure no unsafe URLs or boundary violations
    const validatedContent = WebsiteContentSchema.parse(content) as ValidatedWebsiteContent;

    // Generate structured, validated WebsiteBlueprint
    let blueprint: any = null;
    try {
      const { BlueprintGeneratorService } = await import('@/lib/blueprint/blueprint-generator');
      blueprint = await BlueprintGeneratorService.generateBlueprint(lead, {
        useAi: options.useAiEnrichment,
        version: versionNumber,
      });
    } catch {
      // Non-blocking fallback
    }

    const demoId = `demo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const screenshotUrl = `/generated-screenshots/${lead.id}.png`;

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
      blueprint,
      screenshotUrl,
      screenshotTakenAt: new Date().toISOString(),
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

/**
 * Builds a profession-appropriate gallery. Prefers Gemini-authored gallery
 * items (each mapped to a matching image), then curated preset collections,
 * then the profession image engine.
 */
function buildProfessionGallery(
  lead: LeadData,
  plan: ProfessionContentPlan,
  preset: ProfessionDesignPreset,
  aiProfile: AiBusinessContent | null
): WebsiteGalleryItem[] {
  const briefs = plan.content.galleryBriefs.length > 0 ? plan.content.galleryBriefs : ['Our work'];
  const maxItems = 8;

  if (aiProfile?.gallery?.items?.length) {
    return aiProfile.gallery.items.slice(0, maxItems).map((g, i) => ({
      id: `gal-${i + 1}`,
      title: g.title,
      category: g.category || plan.content.galleryTitle,
      imageUrl: getContextualImageUrl({
        profession: lead.profession,
        businessName: lead.businessName,
        purpose: 'GALLERY',
        serviceIndex: i,
        customKeyword: g.imageQuery,
      }),
      description: g.description || briefs[i % briefs.length],
    }));
  }

  if (preset.galleryImages && preset.galleryImages.length > 0) {
    return preset.galleryImages.slice(0, maxItems).map((g, i) => ({
      id: `gal-${i + 1}`,
      title: g.caption || briefs[i % briefs.length],
      category: g.category || plan.content.galleryTitle,
      imageUrl: g.url,
      description: plan.content.gallerySubtitle,
    }));
  }

  const count = Math.max(3, Math.min(briefs.length, 6));
  return Array.from({ length: count }).map((_, i) => ({
    id: `gal-${i + 1}`,
    title: briefs[i % briefs.length],
    category: plan.content.galleryTitle,
    imageUrl: getContextualImageUrl({
      profession: lead.profession,
      businessName: lead.businessName,
      purpose: 'GALLERY',
      serviceIndex: i,
    }),
    description: plan.content.gallerySubtitle,
  }));
}

/**
 * Deterministic menu/packages/listings used when MENU is part of the plan but
 * neither Gemini nor the base template supplied content. Prices are always
 * "On enquiry" so no unverified commercial figures are fabricated.
 */
function getDefaultMenusForCategory(category: ProfessionCategory): WebsiteMenuCategory[] {
  const p = 'On enquiry';
  switch (category) {
    case 'RESTAURANT_HOSPITALITY':
      return [
        {
          name: 'Starters & Small Plates',
          items: [
            { name: 'House Special Starter', description: 'A rotating house favourite, prepared fresh to order.', price: p, badge: 'Popular' },
            { name: 'Sharing Platter', description: 'A generous selection to begin your meal together.', price: p },
          ],
        },
        {
          name: 'Mains',
          items: [
            { name: 'Signature Main Course', description: 'A chef-curated main from our regular menu.', price: p, badge: 'Chef’s Pick' },
            { name: 'Everyday Favourite', description: 'A comforting classic loved by regulars.', price: p },
          ],
        },
        {
          name: 'Desserts & Beverages',
          items: [
            { name: 'Dessert of the Day', description: 'Ask our team about today’s fresh preparation.', price: p },
            { name: 'Beverage Selection', description: 'Hot and cold options to complete your meal.', price: p },
          ],
        },
      ];
    case 'PHOTOGRAPHY_CREATIVE':
      return [
        {
          name: 'Shoot Packages',
          items: [
            { name: 'Essentials Coverage', description: 'Core coverage for smaller sessions and intimate events.', price: p, badge: 'Popular' },
            { name: 'Full-Day Coverage', description: 'Extended coverage for weddings and large celebrations.', price: p },
            { name: 'Portrait Session', description: 'Studio or outdoor portrait session tailored to you.', price: p },
          ],
        },
      ];
    case 'FITNESS_GYM':
      return [
        {
          name: 'Membership Plans',
          items: [
            { name: 'Monthly Membership', description: 'Full access to the training floor and group sessions.', price: p, badge: 'Popular' },
            { name: 'Quarterly Membership', description: 'A longer commitment with continued coach support.', price: p },
            { name: 'Personal Training', description: 'One-to-one coaching tailored to your goals.', price: p },
          ],
        },
      ];
    case 'REAL_ESTATE_PROPERTY':
      return [
        {
          name: 'Featured Listings',
          items: [
            { name: 'Residential Apartments', description: 'Options matched to your budget and preferred locality.', price: p, badge: 'Popular' },
            { name: 'Independent Homes & Villas', description: 'Larger homes for families seeking more space.', price: p },
            { name: 'Commercial Spaces', description: 'Shops and offices suited to your business needs.', price: p },
          ],
        },
      ];
    case 'INTERIOR_ARCHITECTURE':
      return [
        {
          name: 'Design Packages',
          items: [
            { name: 'Design Consultation', description: 'Concept, layout planning, and material guidance.', price: p, badge: 'Popular' },
            { name: 'Space-Wise Packages', description: 'Modular kitchens, wardrobes, and full-room interiors.', price: p },
            { name: 'Turnkey Execution', description: 'End-to-end delivery from design to handover.', price: p },
          ],
        },
      ];
    case 'BEAUTY_SALON':
      return [
        {
          name: 'Popular Services',
          items: [
            { name: 'Haircut & Styling', description: 'A consultation-led cut finished to suit you.', price: p, badge: 'Popular' },
            { name: 'Colour & Highlights', description: 'Ammonia-free colour options with expert advice.', price: p },
            { name: 'Skin & Facial', description: 'A treatment selected for your skin’s needs.', price: p },
          ],
        },
      ];
    case 'HEALTHCARE_MEDICAL':
      return [
        {
          name: 'Consultations & Care',
          items: [
            { name: 'General Consultation', description: 'An unhurried assessment of your concerns.', price: p, badge: 'Popular' },
            { name: 'Preventive Check-Up', description: 'Routine review and preventive guidance.', price: p },
            { name: 'Follow-Up Visit', description: 'A review of progress and next steps.', price: p },
          ],
        },
      ];
    default:
      return [
        {
          name: 'Service Options',
          items: [
            { name: 'Consultation & Assessment', description: 'An initial discussion of your requirements.', price: p, badge: 'Popular' },
            { name: 'Standard Package', description: 'The most commonly requested scope of work.', price: p },
            { name: 'Premium Package', description: 'An extended scope with additional support.', price: p },
          ],
        },
      ];
  }
}
