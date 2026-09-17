'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme, WebsiteLayout } from '@/types';
import { ArrowRight, Calendar } from 'lucide-react';

interface CtaSectionProps {
  ctaBanner?: WebsiteContent['ctaBanner'];
  brand: WebsiteContent['brand'];
  theme: WebsiteTheme;
  layout?: WebsiteLayout;
}

export function CtaSection({ ctaBanner, brand, theme, layout }: CtaSectionProps) {
  if (!ctaBanner) {
    return null;
  }

  const isPremium = layout === 'PREMIUM_PROFESSIONAL';
  const isTraditional = layout === 'TRADITIONAL_CA';

  return (
    <section
      id="cta"
      className="relative overflow-hidden py-16 lg:py-20 border-b border-slate-200 dark:border-slate-800"
      style={{
        backgroundColor: isPremium
          ? theme.secondaryColor
          : isTraditional
          ? `${theme.primaryColor}10`
          : `${theme.primaryColor}08`,
      }}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold mb-4 border shadow-2xs"
          style={{
            borderColor: isPremium ? 'rgba(255,255,255,0.2)' : `${theme.primaryColor}30`,
            color: isPremium ? '#e2e8f0' : theme.primaryColor,
            backgroundColor: isPremium ? 'rgba(255,255,255,0.1)' : 'white',
          }}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Confidential Consultation</span>
        </div>

        <h2
          className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 ${
            isPremium ? 'text-white' : 'text-slate-900 dark:text-slate-100'
          } ${theme.fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}
        >
          {ctaBanner.title}
        </h2>

        <p
          className={`mx-auto max-w-2xl text-base sm:text-lg mb-8 leading-relaxed ${
            isPremium ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {ctaBanner.subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={ctaBanner.primaryCta.href}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <span>{ctaBanner.primaryCta.label}</span>
            <ArrowRight className="h-4 w-4" />
          </a>

          {ctaBanner.secondaryCta && (
            <a
              href={ctaBanner.secondaryCta.href}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold border transition ${
                isPremium
                  ? 'border-slate-600 text-slate-200 bg-slate-800/80 hover:bg-slate-700'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{ctaBanner.secondaryCta.label}</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
