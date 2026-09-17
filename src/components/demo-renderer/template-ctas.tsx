'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme, WebsiteTemplate } from '@/types';
import { ArrowRight, ArrowUpRight, Calendar, Phone } from 'lucide-react';

interface CtaProps {
  ctaBanner?: WebsiteContent['ctaBanner'];
  brand: WebsiteContent['brand'];
  theme: WebsiteTheme;
  template?: WebsiteTemplate;
}

export function TemplateCta({ ctaBanner, brand, theme, template = 'MODERN_FINTECH' }: CtaProps) {
  if (!ctaBanner) return null;

  // 1. Template 1: Editorial Finance — Full-width Editorial Statement
  if (template === 'EDITORIAL_FINANCE') {
    return (
      <section id="cta" className="py-24 lg:py-32 bg-slate-900 text-white border-b border-slate-800">
        <div className="mx-auto max-w-5xl px-6 text-center space-y-8">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-400">
            {"// Confidential Advisory Inquiry"}
          </span>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white leading-tight">
            {ctaBanner.title}
          </h2>

          <p className="text-base sm:text-lg font-serif text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {ctaBanner.subtitle}
          </p>

          <div className="pt-6">
            <a
              href={ctaBanner.primaryCta.href}
              className="inline-flex items-center gap-3 border-b-2 border-white text-white font-mono text-base font-bold pb-2 hover:opacity-80 transition"
            >
              <span>{ctaBanner.primaryCta.label}</span>
              <ArrowUpRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>
    );
  }

  // 2. Template 2: Modern Fintech / SaaS — Rounded Card with Subtle Glow
  if (template === 'MODERN_FINTECH') {
    return (
      <section id="cta" className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative rounded-3xl p-10 sm:p-14 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white shadow-2xl overflow-hidden text-center">
            <div
              className="absolute -top-32 -left-32 w-64 h-64 rounded-full blur-3xl opacity-30"
              style={{ backgroundColor: theme.primaryColor }}
            />
            <div
              className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full blur-3xl opacity-30"
              style={{ backgroundColor: theme.accentColor }}
            />

            <div className="relative space-y-6 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold bg-white/10 text-slate-200 border border-white/10">
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
                <span>Confidential Consultation</span>
              </span>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {ctaBanner.title}
              </h2>

              <p className="text-base text-slate-300 leading-relaxed">
                {ctaBanner.subtitle}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <a
                  href={ctaBanner.primaryCta.href}
                  className="rounded-xl px-7 py-3.5 text-sm font-bold text-white shadow-lg transition transform hover:-translate-y-0.5"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {ctaBanner.primaryCta.label}
                </a>
                {ctaBanner.secondaryCta && (
                  <a
                    href={ctaBanner.secondaryCta.href}
                    className="rounded-xl border border-slate-700 bg-slate-800/80 px-7 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
                  >
                    {ctaBanner.secondaryCta.label}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 3. Template 3: Luxury Professional — Private Advisory Statement
  if (template === 'LUXURY_PROFESSIONAL') {
    return (
      <section id="cta" className="py-28 bg-slate-950 text-white border-b border-slate-800">
        <div className="mx-auto max-w-4xl px-6 text-center space-y-8">
          <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-slate-400">
            PRIVATE ENGAGEMENT
          </span>

          <h2 className="text-3xl sm:text-5xl font-serif font-light text-white leading-tight">
            {ctaBanner.title}
          </h2>

          <div className="w-16 h-px mx-auto my-6 opacity-60" style={{ backgroundColor: theme.primaryColor }} />

          <p className="text-base text-slate-400 font-serif leading-relaxed max-w-xl mx-auto">
            {ctaBanner.subtitle}
          </p>

          <div className="pt-4">
            <a
              href={ctaBanner.primaryCta.href}
              className="rounded-sm px-8 py-3.5 text-xs font-semibold tracking-widest uppercase text-white shadow-md transition transform hover:-translate-y-0.5 inline-block"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {ctaBanner.primaryCta.label}
            </a>
          </div>
        </div>
      </section>
    );
  }

  // 4. Template 4: Swiss Minimal — Strict Grid Box
  if (template === 'SWISS_MINIMAL') {
    return (
      <section id="cta" className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-b-2 border-slate-900 dark:border-slate-100 p-10 sm:p-16">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-slate-400 dark:text-slate-600">
              [ACTION / CONSULTATION]
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-none font-mono">
              {ctaBanner.title}
            </h2>
            <p className="text-sm font-mono text-slate-300 dark:text-slate-700">
              {ctaBanner.subtitle}
            </p>
          </div>

          <a
            href={ctaBanner.primaryCta.href}
            className="shrink-0 font-mono text-xs font-bold uppercase bg-white text-slate-900 dark:bg-slate-900 dark:text-white px-8 py-4 hover:opacity-90 transition"
          >
            {ctaBanner.primaryCta.label} →
          </a>
        </div>
      </section>
    );
  }

  // 5. Template 5: Modern Indian Professional — High Conversion Panel
  return (
    <section id="cta" className="py-16 lg:py-20 border-b border-slate-200 dark:border-slate-800" style={{ backgroundColor: `${theme.primaryColor}08` }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold mb-4 border bg-white dark:bg-slate-900 shadow-2xs"
          style={{ borderColor: `${theme.primaryColor}30`, color: theme.primaryColor }}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Introductory Consultation</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-slate-100">
          {ctaBanner.title}
        </h2>

        <p className="mx-auto max-w-2xl text-base sm:text-lg mb-8 text-slate-600 dark:text-slate-400 leading-relaxed">
          {ctaBanner.subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={ctaBanner.primaryCta.href}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <span>{ctaBanner.primaryCta.label}</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
