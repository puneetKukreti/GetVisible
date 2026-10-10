import { z } from 'zod';
import { WebsiteContentSchema } from '@/lib/demos/schema';

// Safe URL validator: strictly permits http, https, mailto, tel, or relative hash anchors
const safeUrlRegex = /^(https?:\/\/|mailto:|tel:|#)/i;
const safeUrlSchema = z
  .string()
  .refine((url) => !url || safeUrlRegex.test(url.trim()), {
    message: 'URL must use https, http, mailto, tel, or anchor links. Dangerous protocols are forbidden.',
  });

export const ComponentTypeSchema = z.enum([
  'HEADER',
  'HERO',
  'SERVICES',
  'ABOUT',
  'TRUST',
  'PROCESS',
  'EXPERTISE',
  'WHY_CHOOSE_US',
  'INDUSTRIES',
  'TESTIMONIALS',
  'FAQ',
  'CTA',
  'CONTACT',
  'LOCATION',
  'FOOTER',
  'WHATSAPP_BUTTON',
]);

export type ComponentType = z.infer<typeof ComponentTypeSchema>;

export const BlueprintSectionSchema = z.object({
  id: z.string(),
  type: ComponentTypeSchema,
  title: z.string().optional(),
  subtitle: z.string().optional(),
  order: z.number(),
  isVisible: z.boolean().default(true),
  props: z.record(z.any()).default({}),
});

export type BlueprintSection = z.infer<typeof BlueprintSectionSchema>;

export const WebsiteBlueprintSchema = z.object({
  id: z.string(),
  version: z.number().default(1),
  profession: z.string(),
  designSystemId: z.string(),
  brand: z.object({
    businessName: z.string().min(2),
    tagline: z.string(),
    city: z.string(),
    address: z.string().optional(),
    publicEmail: z.string().email().nullable().optional(),
    publicPhone: z.string().nullable().optional(),
  }),
  palette: z.object({
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    fontFamily: z.enum(['sans', 'serif']),
    borderRadius: z.enum(['none', 'sm', 'md', 'lg']),
    style: z.enum(['corporate', 'modern', 'minimal']),
  }),
  seo: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()).default([]),
  }),
  navigation: z.object({
    items: z.array(
      z.object({
        label: z.string(),
        href: safeUrlSchema,
      })
    ),
    ctaText: z.string(),
    ctaHref: safeUrlSchema,
  }),
  sections: z.array(BlueprintSectionSchema).min(1),
  content: WebsiteContentSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WebsiteBlueprint = z.infer<typeof WebsiteBlueprintSchema>;

/**
 * Validates a structured blueprint. If validation fails, attempts a controlled repair.
 */
export function validateAndRepairBlueprint(data: unknown): {
  success: boolean;
  blueprint?: WebsiteBlueprint;
  repaired: boolean;
  errors?: string[];
} {
  const result = WebsiteBlueprintSchema.safeParse(data);
  if (result.success) {
    return {
      success: true,
      blueprint: result.data,
      repaired: false,
    };
  }

  // Controlled Repair Attempt
  try {
    const raw = (data && typeof data === 'object' ? data : {}) as Record<string, any>;
    const brand = raw.brand || {};
    const content = raw.content || {};

    const repairedSections: BlueprintSection[] = Array.isArray(raw.sections) && raw.sections.length > 0
      ? raw.sections.map((s: any, idx: number) => ({
          id: s.id || `section-${idx}`,
          type: (ComponentTypeSchema.safeParse(s.type).success ? s.type : 'SERVICES') as ComponentType,
          title: s.title || '',
          subtitle: s.subtitle || '',
          order: typeof s.order === 'number' ? s.order : idx,
          isVisible: s.isVisible !== false,
          props: s.props || {},
        }))
      : [
          { id: 'sec-hero', type: 'HERO', order: 0, isVisible: true, props: {} },
          { id: 'sec-services', type: 'SERVICES', order: 1, isVisible: true, props: {} },
          { id: 'sec-about', type: 'ABOUT', order: 2, isVisible: true, props: {} },
          { id: 'sec-faq', type: 'FAQ', order: 3, isVisible: true, props: {} },
          { id: 'sec-contact', type: 'CONTACT', order: 4, isVisible: true, props: {} },
        ];

    // Synthesize valid minimal content structure if missing or broken
    let safeContent = content;
    const contentCheck = WebsiteContentSchema.safeParse(content);
    if (!contentCheck.success) {
      safeContent = {
        meta: {
          title: `${brand.businessName || 'Practice'} | Concept`,
          description: `Personalized website concept for ${brand.businessName || 'professional practice'}.`,
          profession: raw.profession || 'Professional Practice',
          templateId: raw.designSystemId || 'modern-corporate',
        },
        brand: {
          businessName: brand.businessName || 'Professional Practice',
          tagline: brand.tagline || 'Excellence in Client Advisory & Practice',
          provenance: 'NEUTRAL_PLACEHOLDER',
        },
        theme: {
          id: 'modern-corporate',
          primaryColor: '#1e3a8a',
          secondaryColor: '#1e293b',
          accentColor: '#2563eb',
          fontFamily: 'sans',
          borderRadius: 'md',
          style: 'corporate',
        },
        navigation: {
          items: [
            { label: 'Home', href: '#hero' },
            { label: 'Services', href: '#services' },
            { label: 'About', href: '#about' },
            { label: 'Contact', href: '#contact' },
          ],
          ctaText: 'Schedule Consultation',
          ctaHref: '#contact',
        },
        hero: {
          badge: 'Verified Practice',
          headline: `Welcome to ${brand.businessName || 'Our Practice'}`,
          subheadline: 'Delivering disciplined, client-centered solutions with measurable excellence.',
          primaryCta: { label: 'Book Consultation', href: '#contact' },
          secondaryCta: { label: 'Explore Services', href: '#services' },
          provenance: 'NEUTRAL_PLACEHOLDER',
        },
        about: {
          title: `About ${brand.businessName || 'Our Practice'}`,
          leadParagraph: 'Committed to delivering reliable, customized solutions for our clients.',
          body: 'We combine rigorous domain expertise with transparent communication and responsive execution.',
          highlights: [
            { title: 'Quality Standards', description: 'Strict adherence to proven professional conduct.' },
          ],
          provenance: 'NEUTRAL_PLACEHOLDER',
        },
        services: {
          sectionTitle: 'Our Services',
          sectionSubtitle: 'Comprehensive solutions tailored to your operational priorities.',
          items: [
            {
              id: 'srv-1',
              title: 'Advisory & Consultation',
              description: 'Disciplined professional services structured to achieve client goals.',
              isConfirmed: false,
              provenance: 'NEUTRAL_PLACEHOLDER',
            },
          ],
        },
        whyChooseUs: {
          sectionTitle: 'Why Choose Us',
          sectionSubtitle: 'Key principles guiding our daily client commitments.',
          points: [
            { title: 'Demonstrated Expertise', description: 'Proven methodology and disciplined execution.' },
          ],
        },
        industries: { enabled: false, sectionTitle: 'Industries', items: [] },
        testimonials: { enabled: false, sectionTitle: 'Testimonials', items: [] },
        faq: {
          sectionTitle: 'Frequently Asked Questions',
          items: [
            { question: 'How do we get started?', answer: 'Contact our office to arrange an introductory briefing.' },
          ],
        },
        contact: {
          sectionTitle: 'Contact Us',
          sectionSubtitle: 'Reach out to schedule a discussion.',
          formTitle: 'Inquiry Form',
          simulatedDisclaimer: 'Demo concept only — inquiries are simulated.',
          publicEmail: brand.publicEmail || null,
          publicPhone: brand.publicPhone || null,
          ctaSubmitText: 'Submit Inquiry',
        },
        location: {
          address: brand.address || `${brand.city || 'Gurgaon'}, India`,
          city: brand.city || 'Gurgaon',
          officeHours: 'Monday – Friday: 9:30 AM – 6:30 PM',
          mapPlaceholder: true,
        },
        footer: {
          copyright: `© ${new Date().getFullYear()} ${brand.businessName || 'Professional Practice'}. All rights reserved.`,
          disclaimer: 'Personalized website concept generated by GetVisible.',
        },
      };
    }

    const repairedBlueprint: Record<string, any> = {
      id: raw.id || `blueprint-${Date.now()}`,
      version: typeof raw.version === 'number' ? raw.version : 1,
      profession: raw.profession || 'Business Professional',
      designSystemId: raw.designSystemId || 'modern-corporate',
      brand: {
        businessName: brand.businessName || 'Professional Practice',
        tagline: brand.tagline || 'Excellence in Professional Services',
        city: brand.city || 'Gurgaon',
        address: brand.address || undefined,
        publicEmail: brand.publicEmail || null,
        publicPhone: brand.publicPhone || null,
      },
      palette: {
        primaryColor: raw.palette?.primaryColor && /^#[0-9a-fA-F]{6}$/.test(raw.palette.primaryColor) ? raw.palette.primaryColor : '#1e3a8a',
        secondaryColor: raw.palette?.secondaryColor && /^#[0-9a-fA-F]{6}$/.test(raw.palette.secondaryColor) ? raw.palette.secondaryColor : '#1e293b',
        accentColor: raw.palette?.accentColor && /^#[0-9a-fA-F]{6}$/.test(raw.palette.accentColor) ? raw.palette.accentColor : '#2563eb',
        fontFamily: raw.palette?.fontFamily === 'serif' ? 'serif' : 'sans',
        borderRadius: raw.palette?.borderRadius || 'md',
        style: raw.palette?.style || 'corporate',
      },
      seo: {
        title: raw.seo?.title || `${brand.businessName || 'Professional Practice'} | Website Concept`,
        description: raw.seo?.description || `Personalized website concept for ${brand.businessName || 'professional practice'}.`,
        keywords: Array.isArray(raw.seo?.keywords) ? raw.seo.keywords : ['professional services', 'consultation'],
      },
      navigation: {
        items: Array.isArray(raw.navigation?.items) && raw.navigation.items.length > 0
          ? raw.navigation.items
          : [
              { label: 'Home', href: '#hero' },
              { label: 'Services', href: '#services' },
              { label: 'About', href: '#about' },
              { label: 'Contact', href: '#contact' },
            ],
        ctaText: raw.navigation?.ctaText || 'Schedule Consultation',
        ctaHref: raw.navigation?.ctaHref || '#contact',
      },
      sections: repairedSections,
      content: safeContent,
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const recheck = WebsiteBlueprintSchema.safeParse(repairedBlueprint);
    if (recheck.success) {
      return {
        success: true,
        blueprint: recheck.data,
        repaired: true,
      };
    }
  } catch {
    // Return original error
  }

  return {
    success: false,
    repaired: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  };
}
