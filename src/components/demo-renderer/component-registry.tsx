'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme } from '@/types';
import { ComponentType, BlueprintSection } from '@/lib/blueprint/blueprint-schema';
import { TemplateHero } from './template-heroes';
import { TemplateServices } from './template-services';
import { TemplateHeader } from './template-headers';
import { TemplateCta } from './template-ctas';
import { AboutSection } from './about-section';
import { WhyChooseUsSection } from './why-choose-us-section';
import { IndustriesSection } from './industries-section';
import { TestimonialsSection } from './testimonials-section';
import { FaqSection } from './faq-section';
import { ContactSection } from './contact-section';
import { LocationSection } from './location-section';
import { FooterSection } from './footer-section';
import { ProcessSection } from './process-section';
import { TrustSection } from './trust-section';
import { ExpertiseSection } from './expertise-section';
import { MessageSquare } from 'lucide-react';

export interface ComponentRenderContext {
  content: WebsiteContent;
  theme: WebsiteTheme;
  section: BlueprintSection;
}

/**
 * Reusable WhatsApp Floating CTA Component
 */
export function WhatsAppFloatingButton({
  phone,
  businessName,
}: {
  phone?: string | null;
  businessName: string;
}) {
  if (!phone) return null;
  const cleanPhone = phone.replace(/\D/g, '');
  const msg = encodeURIComponent(`Hi ${businessName}, I would like to inquire about your services.`);
  const href = `https://wa.me/${cleanPhone}?text=${msg}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-sm font-semibold tracking-wide"
      aria-label="Contact via WhatsApp"
    >
      <MessageSquare className="w-5 h-5 fill-current" />
      <span className="hidden sm:inline">WhatsApp Us</span>
    </a>
  );
}

/**
 * Strictly controlled Component Registry.
 * Maps validated blueprint component types to verified, safe React implementations.
 * NEVER executes arbitrary AI-generated Javascript or uncontrolled raw HTML.
 */
export const COMPONENT_REGISTRY: Record<
  ComponentType,
  React.FC<ComponentRenderContext>
> = {
  HEADER: ({ content, theme }) => (
    <TemplateHeader
      brand={content.brand}
      navigation={content.navigation}
      theme={theme}
      template="MODERN_INDIAN"
    />
  ),
  HERO: ({ content, theme }) => (
    <TemplateHero
      hero={content.hero}
      brand={content.brand}
      theme={theme}
      template="MODERN_INDIAN"
    />
  ),
  SERVICES: ({ content, theme }) => (
    <TemplateServices
      services={content.services}
      theme={theme}
      template="MODERN_INDIAN"
    />
  ),
  ABOUT: ({ content, theme }) => (
    <AboutSection
      about={content.about}
      brand={content.brand}
      theme={theme}
      template="MODERN_INDIAN"
    />
  ),
  TRUST: ({ content, theme }) =>
    content.trust ? (
      <TrustSection
        trust={content.trust}
        brand={content.brand}
        theme={theme}
        layout="MODERN_INDIAN"
      />
    ) : null,
  PROCESS: ({ content, theme }) =>
    content.process ? (
      <ProcessSection
        process={content.process}
        theme={theme}
        layout="MODERN_INDIAN"
      />
    ) : null,
  EXPERTISE: ({ content, theme }) =>
    content.expertise ? (
      <ExpertiseSection
        expertise={content.expertise}
        theme={theme}
        layout="MODERN_INDIAN"
      />
    ) : null,
  WHY_CHOOSE_US: ({ content, theme }) =>
    content.whyChooseUs?.points?.length ? (
      <WhyChooseUsSection whyChooseUs={content.whyChooseUs} theme={theme} />
    ) : null,
  INDUSTRIES: ({ content, theme }) =>
    content.industries?.enabled && content.industries.items?.length ? (
      <IndustriesSection industries={content.industries} theme={theme} />
    ) : null,
  TESTIMONIALS: ({ content, theme }) =>
    content.testimonials?.enabled && content.testimonials.items?.length ? (
      <TestimonialsSection testimonials={content.testimonials} theme={theme} />
    ) : null,
  FAQ: ({ content, theme }) =>
    content.faq?.items?.length ? (
      <FaqSection faq={content.faq} theme={theme} />
    ) : null,
  CTA: ({ content, theme }) =>
    content.ctaBanner ? (
      <TemplateCta
        ctaBanner={content.ctaBanner}
        brand={content.brand}
        theme={theme}
        template="MODERN_INDIAN"
      />
    ) : null,
  CONTACT: ({ content, theme }) => (
    <ContactSection
      contact={content.contact}
      theme={theme}
    />
  ),
  LOCATION: ({ content, theme }) => (
    <LocationSection
      location={content.location}
      brand={content.brand}
      theme={theme}
    />
  ),
  FOOTER: ({ content, theme }) => (
    <FooterSection
      footer={content.footer}
      brand={content.brand}
      navigation={content.navigation}
      theme={theme}
    />
  ),
  WHATSAPP_BUTTON: ({ content }) => (
    <WhatsAppFloatingButton
      phone={content.contact.publicPhone}
      businessName={content.brand.businessName}
    />
  ),
};
