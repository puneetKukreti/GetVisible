'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme } from '@/types';
import { ArrowRight, FileCheck2 } from 'lucide-react';

interface HeroSectionProps {
  hero: WebsiteContent['hero'];
  brand: WebsiteContent['brand'];
  theme: WebsiteTheme;
}

export function HeroSection({ hero, brand, theme }: HeroSectionProps) {
  return (
    <section id="hero" className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
        {/* Badge */}
        {hero.badge && (
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold mb-6 border shadow-xs"
               style={{
                 backgroundColor: `${theme.primaryColor}15`,
                 color: theme.primaryColor,
                 borderColor: `${theme.primaryColor}30`,
               }}>
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>{hero.badge}</span>
          </div>
        )}

        {/* Headline */}
        <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 ${
          theme.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
        }`}>
          {hero.headline}
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
          {hero.subheadline}
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href={hero.primaryCta.href}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <span>{hero.primaryCta.label}</span>
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href={hero.secondaryCta.href}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <span>{hero.secondaryCta.label}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
