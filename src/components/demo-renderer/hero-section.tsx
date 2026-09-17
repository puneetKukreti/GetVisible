'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme, WebsiteLayout } from '@/types';
import { ArrowRight, FileCheck2, Shield, CheckCircle2, Building, Scale, Lock } from 'lucide-react';

interface HeroSectionProps {
  hero: WebsiteContent['hero'];
  brand: WebsiteContent['brand'];
  theme: WebsiteTheme;
  layout?: WebsiteLayout;
}

export function HeroSection({ hero, brand, theme, layout = 'MODERN_CORPORATE' }: HeroSectionProps) {
  // 1. Layout A — Modern Corporate: Dynamic 2-column composition with practice highlights card
  if (layout === 'MODERN_CORPORATE') {
    return (
      <section id="hero" className="relative overflow-hidden py-16 lg:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Copy & Actions */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {hero.badge && (
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold border shadow-2xs"
                  style={{
                    backgroundColor: `${theme.primaryColor}12`,
                    color: theme.primaryColor,
                    borderColor: `${theme.primaryColor}30`,
                  }}
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>{hero.badge}</span>
                </div>
              )}

              <h1 className={`text-4xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.15] ${
                theme.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
              }`}>
                {hero.headline}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                {hero.subheadline}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href={hero.primaryCta.href}
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <span>{hero.primaryCta.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={hero.secondaryCta.href}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  <span>{hero.secondaryCta.label}</span>
                </a>
              </div>

              {/* Quick credential chips */}
              <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Statutory Compliance
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Audit Assurance
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Tax Advisory
                </span>
              </div>
            </div>

            {/* Right Column: Modern Practice Overview Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: theme.primaryColor }}
                />

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {brand.businessName}
                      </h4>
                      <p className="text-[11px] text-slate-500">Chartered Practice Profile</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Active Practice
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Statutory Audits</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Full Assurance</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Corporate Taxation</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Direct & Indirect</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">GST Compliance</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Filing & Litigation</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Advisory Engagement</span>
                  <a
                    href="#contact"
                    className="text-xs font-bold hover:underline inline-flex items-center gap-1"
                    style={{ color: theme.primaryColor }}
                  >
                    <span>Schedule Initial Review</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2. Layout B — Premium Professional: Sophisticated high-contrast executive styling
  if (layout === 'PREMIUM_PROFESSIONAL') {
    return (
      <section id="hero" className="relative overflow-hidden py-24 lg:py-32 bg-slate-950 text-white border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-800/30 via-slate-950 to-slate-950" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
          {hero.badge && (
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-8 border backdrop-blur-md"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.07)',
                color: '#f1f5f9',
                borderColor: `${theme.primaryColor}80`,
              }}
            >
              <Scale className="h-3.5 w-3.5 text-amber-400" />
              <span>{hero.badge}</span>
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight font-serif">
            {hero.headline}
          </h1>

          <div
            className="w-20 h-1 mx-auto my-6 rounded-full"
            style={{ backgroundColor: theme.primaryColor }}
          />

          <p className="mx-auto max-w-2xl text-lg text-slate-300 leading-relaxed font-light">
            {hero.subheadline}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={hero.primaryCta.href}
              className="inline-flex items-center gap-2 rounded-md px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition transform hover:-translate-y-0.5"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <span>{hero.primaryCta.label}</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={hero.secondaryCta.href}
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/80 px-7 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              <span>{hero.secondaryCta.label}</span>
            </a>
          </div>
        </div>
      </section>
    );
  }

  // 3. Layout C — Traditional CA Firm: Conservative, trustworthy, structured centered presentation
  return (
    <section id="hero" className="relative overflow-hidden py-20 lg:py-28 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        {/* Classical Bordered Frame */}
        <div className="p-8 sm:p-12 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-900/30">
          {hero.badge && (
            <div
              className="inline-flex items-center gap-2 rounded-sm px-3.5 py-1 text-xs font-bold uppercase tracking-widest mb-6 border"
              style={{
                backgroundColor: `${theme.primaryColor}10`,
                color: theme.primaryColor,
                borderColor: `${theme.primaryColor}30`,
              }}
            >
              <Building className="h-3.5 w-3.5" />
              <span>{hero.badge}</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-serif leading-snug">
            {hero.headline}
          </h1>

          <div className="w-16 h-0.5 mx-auto my-6 bg-slate-300 dark:bg-slate-700" />

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            {hero.subheadline}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={hero.primaryCta.href}
              className="inline-flex items-center gap-2 rounded-sm px-6 py-3 text-sm font-bold text-white shadow-xs hover:opacity-95 transition"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <span>{hero.primaryCta.label}</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={hero.secondaryCta.href}
              className="inline-flex items-center gap-2 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <span>{hero.secondaryCta.label}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
