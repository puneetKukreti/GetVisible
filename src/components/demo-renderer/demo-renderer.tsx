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

interface DemoRendererProps {
  content: WebsiteContent;
  theme?: WebsiteTheme;
  design?: WebsiteDesign;
}

const DEFAULT_SECTION_ORDER: WebsiteSectionType[] = [
  'HERO',
  'SERVICES',
  'ABOUT',
  'CONTACT',
  'LOCATION',
];

const TEMPLATE_MAP: Record<string, WebsiteTemplate> = {
  EDITORIAL_FINANCE: 'EDITORIAL_FINANCE',
  MODERN_FINTECH: 'MODERN_FINTECH',
  LUXURY_PROFESSIONAL: 'LUXURY_PROFESSIONAL',
  SWISS_MINIMAL: 'SWISS_MINIMAL',
  MODERN_INDIAN: 'MODERN_INDIAN',
  MODERN_CORPORATE: 'MODERN_FINTECH',
  PREMIUM_PROFESSIONAL: 'LUXURY_PROFESSIONAL',
  TRADITIONAL_CA: 'SWISS_MINIMAL',
};

export function DemoRenderer({ content, theme, design }: DemoRendererProps) {
  const activeDesign: WebsiteDesign | undefined = design || content.design;
  const activeTheme: WebsiteTheme = theme || activeDesign?.theme || content.theme;
  const layout: WebsiteLayout = activeDesign?.layout || 'MODERN_FINTECH';
  const activeTemplate: WebsiteTemplate =
    activeDesign?.template ||
    TEMPLATE_MAP[layout] ||
    'MODERN_FINTECH';
  const sectionOrder: WebsiteSectionType[] = activeDesign?.sectionOrder || DEFAULT_SECTION_ORDER;

  const renderSection = (sectionType: WebsiteSectionType) => {
    switch (sectionType) {
      case 'HERO':
        return <TemplateHero key="hero" hero={content.hero} brand={brandData} theme={activeTheme} template={activeTemplate} />;
      case 'TRUST':
        return <TrustSection key="trust" trust={content.trust} brand={brandData} theme={activeTheme} layout={layout} />;
      case 'SERVICES':
        return <TemplateServices key="services" services={content.services} theme={activeTheme} template={activeTemplate} />;
      case 'ABOUT':
        return <AboutSection key="about" about={content.about} theme={activeTheme} template={activeTemplate} />;
      case 'EXPERTISE':
        return <ExpertiseSection key="expertise" expertise={content.expertise} theme={activeTheme} layout={layout} />;
      case 'PROCESS':
        return <ProcessSection key="process" process={content.process} theme={activeTheme} layout={layout} />;
      case 'WHY_CHOOSE_US':
        return <WhyChooseUsSection key="why-choose-us" whyChooseUs={content.whyChooseUs} theme={activeTheme} />;
      case 'INDUSTRIES':
        return <IndustriesSection key="industries" industries={content.industries} theme={activeTheme} />;
      case 'TESTIMONIALS':
        return <TestimonialsSection key="testimonials" testimonials={content.testimonials} theme={activeTheme} />;
      case 'FAQ':
        return <FaqSection key="faq" faq={content.faq} theme={activeTheme} />;
      case 'CTA':
        return <TemplateCta key="cta" ctaBanner={content.ctaBanner} brand={brandData} theme={activeTheme} template={activeTemplate} />;
      case 'CONTACT':
        return <ContactSection key="contact" contact={content.contact} theme={activeTheme} />;
      case 'LOCATION':
        return <LocationSection key="location" location={content.location} brand={brandData} theme={activeTheme} />;
      default:
        return null;
    }
  };

  const brandData = content.brand;

  return (
    <div
      className={`min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500/20 ${
        activeTheme.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
      }`}
      style={
        {
          '--demo-primary': activeTheme.primaryColor,
          '--demo-secondary': activeTheme.secondaryColor,
          '--demo-accent': activeTheme.accentColor,
        } as React.CSSProperties
      }
    >
      {/* Template-Specific Navigation Header */}
      <TemplateHeader
        brand={content.brand}
        navigation={content.navigation}
        theme={activeTheme}
        template={activeTemplate}
      />

      {/* Main Sections Ordered Dynamically by Template Configuration */}
      <main>
        {sectionOrder.map((sectionType) => renderSection(sectionType))}
      </main>

      {/* Footer */}
      <FooterSection
        footer={content.footer}
        brand={content.brand}
        navigation={content.navigation}
        theme={activeTheme}
      />
    </div>
  );
}
