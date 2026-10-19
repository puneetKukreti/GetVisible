'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme, WebsiteDesign, WebsiteSectionType, WebsiteLayout, WebsiteTemplate } from '@/types';
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
import { WhatsAppFloatingButton } from './component-registry';
import { WebsiteBlueprint } from '@/lib/blueprint/blueprint-schema';

import { isStitchLayout, STITCH_DESIGN_MAP } from '@/lib/demos/stitch-personalizer';
import { StitchDemoView } from './stitch-demo-view';
import { GallerySection } from './gallery-section';
import { MenuPricingSection } from './menu-pricing-section';
import { getProfessionPreset } from '@/lib/demos/profession-config';

interface DemoRendererProps {
  content: WebsiteContent;
  theme?: WebsiteTheme;
  design?: WebsiteDesign;
  blueprint?: WebsiteBlueprint;
  demoId?: string;
  leadId?: string;
  version?: number;
  /**
   * True when the viewer is anonymous (public prospect link). The Stitch iframe
   * then serves the demo's OWN stored layout instead of requesting a `?layout=`
   * override — the override endpoint is owner-only, and an anonymous request
   * with it would 401 and blank the prospect's site.
   */
  publicView?: boolean;
}

const DEFAULT_SECTION_ORDER: WebsiteSectionType[] = [
  'HERO',
  'SERVICES',
  'ABOUT',
  'WHY_CHOOSE_US',
  'INDUSTRIES',
  'FAQ',
  'CONTACT',
  'LOCATION',
];

export const TEMPLATE_MAP: Record<string, WebsiteTemplate> = {
  EDITORIAL_FINANCE: 'EDITORIAL_FINANCE',
  MODERN_FINTECH: 'MODERN_FINTECH',
  LUXURY_PROFESSIONAL: 'LUXURY_PROFESSIONAL',
  SWISS_MINIMAL: 'SWISS_MINIMAL',
  MODERN_INDIAN: 'MODERN_INDIAN',
  MODERN_CORPORATE: 'MODERN_FINTECH',
  PREMIUM_PROFESSIONAL: 'LUXURY_PROFESSIONAL',
  TRADITIONAL_CA: 'SWISS_MINIMAL',
  CA_ACCOUNTING_PROFESSIONAL: 'MODERN_INDIAN',
  CORPORATE_TRANSFER_PRICING: 'EDITORIAL_FINANCE',
  MANUFACTURING_GST_LITIGATION: 'SWISS_MINIMAL',
  VIRTUAL_CFO_STARTUP: 'MODERN_FINTECH',
  INSTITUTIONAL_AUDIT_ASSURANCE: 'SWISS_MINIMAL',
  NRI_CROSS_BORDER_TAX: 'MODERN_INDIAN',
  DIRECT_TAX_LITIGATION: 'EDITORIAL_FINANCE',
  FAMILY_OFFICE_ESTATE: 'LUXURY_PROFESSIONAL',
};

export function DemoRenderer({
  content,
  theme,
  design,
  blueprint,
  demoId,
  leadId,
  version,
  publicView = false,
}: DemoRendererProps) {
  // Ensure content and theme are objects in case they were parsed from raw JSON
  const safeContent: WebsiteContent =
    typeof content === 'string' ? JSON.parse(content) : (content || {});

  const activeDesign: WebsiteDesign | undefined = design || safeContent.design;
  const rawTheme = theme || activeDesign?.theme || safeContent.theme;
  const activeTheme: WebsiteTheme =
    typeof rawTheme === 'string' ? JSON.parse(rawTheme) : rawTheme;

  const preset = getProfessionPreset(safeContent.meta?.profession, safeContent.brand?.businessName);
  const rawLayout = activeDesign?.layout || safeContent.meta?.templateId || preset.defaultLayout;

  // Render a high-end Stitch template when the layout is a Stitch design that
  // matches the profession: the three CA-only templates for verified CA
  // practices, and ANY profession archetype for non-CA professions (the
  // archetype is chosen per-lead, so the gate is no longer category-locked).
  const stitchMeta = isStitchLayout(rawLayout) ? STITCH_DESIGN_MAP[rawLayout] : undefined;
  const stitchAllowedForProfession = stitchMeta
    ? stitchMeta.isCaOnly
      ? preset.isCaPractice
      : !preset.isCaPractice
    : false;

  if (stitchAllowedForProfession) {
    return (
      <StitchDemoView
        demoId={demoId}
        leadId={leadId}
        layout={rawLayout}
        version={version}
        content={safeContent}
        design={activeDesign}
        publicView={publicView}
      />
    );
  }

  const safeTheme: WebsiteTheme = {
    id: activeTheme?.id || preset.defaultTheme.id || 'executive-navy',
    name: activeTheme?.name || preset.defaultTheme.name || 'Executive Navy',
    primaryColor: activeTheme?.primaryColor || preset.defaultTheme.primaryColor || '#1e3a8a',
    secondaryColor: activeTheme?.secondaryColor || preset.defaultTheme.secondaryColor || '#1e293b',
    accentColor: activeTheme?.accentColor || preset.defaultTheme.accentColor || '#2563eb',
    fontFamily: activeTheme?.fontFamily || preset.defaultTheme.fontFamily || 'sans',
    style: activeTheme?.style || preset.defaultTheme.style || 'corporate',
    borderRadius: activeTheme?.borderRadius || preset.defaultTheme.borderRadius || 'md',
  };

  const activeTemplate: WebsiteTemplate =
    activeDesign?.template ||
    TEMPLATE_MAP[rawLayout] ||
    (TEMPLATE_MAP[activeDesign?.layout || ''] as WebsiteTemplate) ||
    preset.defaultTemplate ||
    'MODERN_INDIAN';

  const layout: WebsiteLayout = activeTemplate;

  const rawOrder = activeDesign?.sectionOrder;
  const sectionOrder: WebsiteSectionType[] =
    Array.isArray(rawOrder) && rawOrder.length > 0
      ? [...rawOrder]
      : [...(preset.sectionOrder || DEFAULT_SECTION_ORDER)];

  // If safeContent has gallery and sectionOrder doesn't include it, insert before CONTACT or at end
  if (safeContent.gallery && !sectionOrder.includes('GALLERY')) {
    const contactIdx = sectionOrder.indexOf('CONTACT');
    if (contactIdx !== -1) {
      sectionOrder.splice(contactIdx, 0, 'GALLERY');
    } else {
      sectionOrder.push('GALLERY');
    }
  }

  // If safeContent has menu and sectionOrder doesn't include it, insert after SERVICES or at index 2
  if (safeContent.menu && !sectionOrder.includes('MENU')) {
    const srvIdx = sectionOrder.indexOf('SERVICES');
    if (srvIdx !== -1) {
      sectionOrder.splice(srvIdx + 1, 0, 'MENU');
    } else {
      sectionOrder.splice(2, 0, 'MENU');
    }
  }

  const brandData = safeContent.brand || {
    businessName: safeContent.meta?.title?.split('|')[0]?.trim() || 'Professional Practice',
    tagline: safeContent.hero?.headline || `${safeContent.meta?.profession || 'Professional'} Practice`,
    provenance: 'NEUTRAL_PLACEHOLDER' as const,
  };

  const navigationData = safeContent.navigation || {
    items: preset.navItems || [
      { label: 'Home', href: '#hero' },
      { label: 'Services', href: '#services' },
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#contact' },
    ],
    ctaText: preset.ctaText || 'Schedule Consultation',
    ctaHref: '#contact',
  };

  const footerData = safeContent.footer || {
    copyright: `© ${new Date().getFullYear()} ${brandData.businessName}. All rights reserved.`,
    disclaimer: 'Personalized website demonstration concept generated by GetVisible. Prepared exclusively for evaluation.',
  };

  const renderSection = (sectionType: WebsiteSectionType) => {
    switch (sectionType) {
      case 'HERO':
        return safeContent.hero ? (
          <TemplateHero
            key="hero"
            hero={safeContent.hero}
            brand={brandData}
            theme={safeTheme}
            template={activeTemplate}
            images={safeContent.images}
          />
        ) : null;
      case 'TRUST':
        return safeContent.trust ? (
          <TrustSection key="trust" trust={safeContent.trust} brand={brandData} theme={safeTheme} layout={layout} />
        ) : null;
      case 'SERVICES':
        return safeContent.services && safeContent.services.items?.length > 0 ? (
          <TemplateServices key="services" services={safeContent.services} theme={safeTheme} template={activeTemplate} />
        ) : null;
      case 'ABOUT':
        return safeContent.about ? (
          <AboutSection
            key="about"
            about={safeContent.about}
            brand={brandData}
            theme={safeTheme}
            template={activeTemplate}
            images={safeContent.images}
          />
        ) : null;
      case 'EXPERTISE':
        return safeContent.expertise ? (
          <ExpertiseSection key="expertise" expertise={safeContent.expertise} theme={safeTheme} layout={layout} />
        ) : null;
      case 'PROCESS':
        return safeContent.process ? (
          <ProcessSection key="process" process={safeContent.process} theme={safeTheme} layout={layout} />
        ) : null;
      case 'GALLERY':
        return safeContent.gallery ? (
          <GallerySection key="gallery" gallery={safeContent.gallery} theme={safeTheme} />
        ) : null;
      case 'MENU':
        return safeContent.menu ? (
          <MenuPricingSection key="menu" menu={safeContent.menu} theme={safeTheme} />
        ) : null;
      case 'WHY_CHOOSE_US':
        return safeContent.whyChooseUs && safeContent.whyChooseUs.points?.length > 0 ? (
          <WhyChooseUsSection key="why-choose-us" whyChooseUs={safeContent.whyChooseUs} theme={safeTheme} />
        ) : null;
      case 'INDUSTRIES':
        return safeContent.industries && safeContent.industries.enabled !== false && safeContent.industries.items?.length > 0 ? (
          <IndustriesSection key="industries" industries={safeContent.industries} theme={safeTheme} />
        ) : null;
      case 'TESTIMONIALS':
        return safeContent.testimonials && safeContent.testimonials.enabled !== false && safeContent.testimonials.items?.length > 0 ? (
          <TestimonialsSection key="testimonials" testimonials={safeContent.testimonials} theme={safeTheme} />
        ) : null;
      case 'FAQ':
        return safeContent.faq && safeContent.faq.items?.length > 0 ? (
          <FaqSection key="faq" faq={safeContent.faq} theme={safeTheme} />
        ) : null;
      case 'CTA':
      case 'CTA_BANNER' as any:
        return safeContent.ctaBanner ? (
          <TemplateCta key="cta" ctaBanner={safeContent.ctaBanner} brand={brandData} theme={safeTheme} template={activeTemplate} />
        ) : null;
      case 'CONTACT':
        return safeContent.contact ? (
          <ContactSection key="contact" contact={safeContent.contact} theme={safeTheme} />
        ) : null;
      case 'LOCATION':
        return safeContent.location ? (
          <LocationSection key="location" location={safeContent.location} brand={brandData} theme={safeTheme} />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div
      className={`min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500/20 ${
        safeTheme.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
      }`}
      style={
        {
          '--demo-primary': safeTheme.primaryColor,
          '--demo-secondary': safeTheme.secondaryColor,
          '--demo-accent': safeTheme.accentColor,
        } as React.CSSProperties
      }
    >
      {/* Template-Specific Navigation Header */}
      <TemplateHeader
        brand={brandData}
        navigation={navigationData}
        theme={safeTheme}
        template={activeTemplate}
      />

      {/* Main Sections Ordered Dynamically by Template Configuration */}
      <main>
        {sectionOrder.map((sectionType) => renderSection(sectionType))}
      </main>

      {/* Footer */}
      <FooterSection
        footer={footerData}
        brand={brandData}
        navigation={navigationData}
        theme={safeTheme}
      />

      {/* Reusable Floating WhatsApp Button Component */}
      <WhatsAppFloatingButton
        phone={safeContent.contact?.publicPhone}
        businessName={brandData.businessName}
      />
    </div>
  );
}

