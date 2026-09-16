'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme } from '@/types';
import { HeroSection } from './hero-section';
import { AboutSection } from './about-section';
import { ServicesSection } from './services-section';
import { WhyChooseUsSection } from './why-choose-us-section';
import { IndustriesSection } from './industries-section';
import { TestimonialsSection } from './testimonials-section';
import { FaqSection } from './faq-section';
import { ContactSection } from './contact-section';
import { LocationSection } from './location-section';
import { FooterSection } from './footer-section';
import { Shield } from 'lucide-react';

interface DemoRendererProps {
  content: WebsiteContent;
  theme?: WebsiteTheme;
}

export function DemoRenderer({ content, theme }: DemoRendererProps) {
  const activeTheme: WebsiteTheme = theme || content.theme;

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
      {/* Public Site Navigation Header */}
      <nav className="sticky top-[41px] z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <a href="#hero" className="flex items-center gap-2 font-bold text-base tracking-tight text-slate-900 dark:text-white">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-black text-sm"
              style={{ backgroundColor: activeTheme.primaryColor }}
            >
              <Shield className="h-4 w-4" />
            </div>
            <span>{content.brand.businessName}</span>
          </a>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {content.navigation.items.map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                className="hover:text-slate-900 dark:hover:text-white transition"
              >
                {item.label}
              </a>
            ))}
          </div>

          <a
            href={content.navigation.ctaHref}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-95 transition"
            style={{ backgroundColor: activeTheme.primaryColor }}
          >
            {content.navigation.ctaText}
          </a>
        </div>
      </nav>

      {/* Main Sections */}
      <main>
        <HeroSection hero={content.hero} brand={content.brand} theme={activeTheme} />
        <AboutSection about={content.about} theme={activeTheme} />
        <ServicesSection services={content.services} theme={activeTheme} />
        <WhyChooseUsSection whyChooseUs={content.whyChooseUs} theme={activeTheme} />
        <IndustriesSection industries={content.industries} theme={activeTheme} />
        <TestimonialsSection testimonials={content.testimonials} theme={activeTheme} />
        <FaqSection faq={content.faq} theme={activeTheme} />
        <ContactSection contact={content.contact} theme={activeTheme} />
        <LocationSection location={content.location} brand={content.brand} theme={activeTheme} />
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
