import { z } from 'zod';
import { ContentProvenance } from '@/types';

// Safe URL validator: strictly permits http, https, mailto, tel, or relative hash anchors
const safeUrlRegex = /^(https?:\/\/|mailto:|tel:|#)/i;
const safeUrlSchema = z
  .string()
  .refine((url) => !url || safeUrlRegex.test(url.trim()), {
    message: 'URL must use https, http, mailto, tel, or anchor links. Dangerous protocols are forbidden.',
  });

export const ContentProvenanceSchema: z.ZodType<ContentProvenance> = z.enum([
  'VERIFIED_LEAD',
  'VERIFIED_SOURCE',
  'USER_ENTERED',
  'AI_SYNTHESIZED',
  'NEUTRAL_PLACEHOLDER',
]);

export const WebsiteThemeSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color code'),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color code'),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color code'),
  fontFamily: z.enum(['sans', 'serif']),
  style: z.enum(['corporate', 'modern', 'minimal']),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg']),
});

export const WebsiteNavigationItemSchema = z.object({
  label: z.string().min(1).max(40),
  href: safeUrlSchema,
});

export const ServiceItemSchema = z.object({
  id: z.string(),
  title: z.string().min(2).max(100),
  description: z.string().min(5).max(400),
  isConfirmed: z.boolean(),
  provenance: ContentProvenanceSchema,
});

export const WhyChooseUsPointSchema = z.object({
  title: z.string().min(2).max(80),
  description: z.string().min(5).max(350),
  iconName: z.string().optional(),
});

export const TestimonialItemSchema = z.object({
  quote: z.string().min(5).max(400),
  author: z.string().min(2).max(80),
  role: z.string().max(80).optional(),
  isPlaceholder: z.boolean(),
});

export const FaqItemSchema = z.object({
  question: z.string().min(5).max(150),
  answer: z.string().min(10).max(600),
});

export const WebsiteContentSchema = z.object({
  meta: z.object({
    title: z.string().min(2).max(150),
    description: z.string().min(5).max(300),
    profession: z.string().min(2).max(80),
    templateId: z.string().min(2).max(80),
  }),
  brand: z.object({
    businessName: z.string().min(2).max(120),
    tagline: z.string().min(3).max(200),
    provenance: ContentProvenanceSchema,
  }),
  theme: WebsiteThemeSchema,
  navigation: z.object({
    items: z.array(WebsiteNavigationItemSchema),
    ctaText: z.string().min(2).max(40),
    ctaHref: safeUrlSchema,
  }),
  hero: z.object({
    badge: z.string().min(2).max(60),
    headline: z.string().min(5).max(150),
    subheadline: z.string().min(10).max(350),
    primaryCta: z.object({
      label: z.string().min(2).max(40),
      href: safeUrlSchema,
    }),
    secondaryCta: z.object({
      label: z.string().min(2).max(40),
      href: safeUrlSchema,
    }),
    provenance: ContentProvenanceSchema,
  }),
  about: z.object({
    title: z.string().min(2).max(100),
    leadParagraph: z.string().min(10).max(400),
    body: z.string().min(20).max(1200),
    highlights: z.array(
      z.object({
        title: z.string().min(2).max(80),
        description: z.string().min(5).max(300),
      })
    ),
    provenance: ContentProvenanceSchema,
  }),
  services: z.object({
    sectionTitle: z.string().min(2).max(80),
    sectionSubtitle: z.string().min(5).max(200),
    items: z.array(ServiceItemSchema).min(1).max(12),
  }),
  whyChooseUs: z.object({
    sectionTitle: z.string().min(2).max(80),
    sectionSubtitle: z.string().min(5).max(200),
    points: z.array(WhyChooseUsPointSchema).min(1).max(8),
  }),
  industries: z.object({
    enabled: z.boolean(),
    sectionTitle: z.string().min(2).max(80),
    items: z.array(z.string().min(2).max(60)).max(12),
  }),
  testimonials: z.object({
    enabled: z.boolean(),
    sectionTitle: z.string().min(2).max(80),
    items: z.array(TestimonialItemSchema).max(6),
  }),
  faq: z.object({
    sectionTitle: z.string().min(2).max(80),
    items: z.array(FaqItemSchema).min(1).max(10),
  }),
  contact: z.object({
    sectionTitle: z.string().min(2).max(80),
    sectionSubtitle: z.string().min(5).max(200),
    formTitle: z.string().min(2).max(80),
    simulatedDisclaimer: z.string().min(10).max(300),
    publicEmail: z.string().email().nullable(),
    publicPhone: z.string().nullable(),
    ctaSubmitText: z.string().min(2).max(40),
  }),
  location: z.object({
    address: z.string().min(3).max(250),
    city: z.string().min(2).max(80),
    officeHours: z.string().min(3).max(100),
    mapPlaceholder: z.boolean(),
  }),
  footer: z.object({
    copyright: z.string().min(5).max(150),
    disclaimer: z.string().min(10).max(350),
  }),
});

export type ValidatedWebsiteContent = z.infer<typeof WebsiteContentSchema>;
