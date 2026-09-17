'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme, WebsiteTemplate } from '@/types';
import { ArrowRight, Scale, Shield, ArrowUpRight } from 'lucide-react';
import {
  FinancialGeometricArtwork,
  FintechDashboardVisual,
  SwissGridVisual,
  IndianGeometricMotif,
} from './visual-artworks';

interface HeroProps {
  hero: WebsiteContent['hero'];
  brand: WebsiteContent['brand'];
  theme: WebsiteTheme;
  template?: WebsiteTemplate;
}

export function TemplateHero({ hero, brand, theme, template = 'MODERN_FINTECH' }: HeroProps) {
  // 1. Template 1: Editorial Finance — Asymmetric large editorial statement + artwork
  if (template === 'EDITORIAL_FINANCE') {
    return (
      <section id="hero" className="relative py-20 lg:py-28 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-8">
              <div className="text-xs font-mono uppercase tracking-widest text-slate-500">
                {`// ${hero.badge || 'Chartered Accountancy Practice'}`}
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-slate-900 dark:text-white font-serif leading-[1.05]">
                {hero.headline}
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-serif leading-relaxed max-w-xl">
                {hero.subheadline}
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-6">
                <a
                  href={hero.primaryCta.href}
                  className="inline-flex items-center gap-3 border-b-2 font-mono text-sm font-bold pb-1 hover:opacity-75 transition"
                  style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                >
                  <span>{hero.primaryCta.label}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>

                <a
                  href={hero.secondaryCta.href}
                  className="text-xs font-mono uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                >
                  {hero.secondaryCta.label}
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <FinancialGeometricArtwork theme={theme} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2. Template 2: Modern Fintech / SaaS — 2-Column with Dashboard Widget
  if (template === 'MODERN_FINTECH') {
    return (
      <section id="hero" className="relative py-16 lg:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              {hero.badge && (
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold border shadow-2xs"
                  style={{
                    backgroundColor: `${theme.primaryColor}12`,
                    color: theme.primaryColor,
                    borderColor: `${theme.primaryColor}30`,
                  }}
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>{hero.badge}</span>
                </div>
              )}

              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                {hero.headline}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                {hero.subheadline}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href={hero.primaryCta.href}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <span>{hero.primaryCta.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={hero.secondaryCta.href}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  <span>{hero.secondaryCta.label}</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <FintechDashboardVisual theme={theme} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 3. Template 3: Luxury Professional — Private Advisory Minimalist Hero
  if (template === 'LUXURY_PROFESSIONAL') {
    return (
      <section id="hero" className="relative py-28 lg:py-36 bg-slate-950 text-white border-b border-slate-800 overflow-hidden">
        <div className="mx-auto max-w-4xl px-6 text-center space-y-8">
          <div className="text-[11px] font-mono tracking-[0.3em] uppercase text-slate-400">
            {hero.badge || 'CHARTERED ACCOUNTANTS & CORPORATE ADVISORS'}
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-white font-serif leading-[1.1]">
            {hero.headline}
          </h1>

          <div
            className="w-16 h-px mx-auto my-8 opacity-60"
            style={{ backgroundColor: theme.primaryColor }}
          />

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-300 font-serif leading-relaxed">
            {hero.subheadline}
          </p>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6">
            <a
              href={hero.primaryCta.href}
              className="rounded-sm px-8 py-3.5 text-xs font-semibold tracking-widest uppercase text-white transition transform hover:-translate-y-0.5 shadow-lg"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {hero.primaryCta.label}
            </a>
            <a
              href={hero.secondaryCta.href}
              className="text-xs font-semibold tracking-widest uppercase text-slate-400 hover:text-white transition"
            >
              {hero.secondaryCta.label} →
            </a>
          </div>
        </div>
      </section>
    );
  }

  // 4. Template 4: Swiss / Minimal Corporate — Strict 1px Grid Hero
  if (template === 'SWISS_MINIMAL') {
    return (
      <section id="hero" className="relative bg-white dark:bg-slate-950 border-b-2 border-slate-900 dark:border-slate-100">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12">
          {/* Left Block: Massive Swiss Typography */}
          <div className="lg:col-span-8 p-8 sm:p-14 lg:p-16 border-b lg:border-b-0 lg:border-r-2 border-slate-900 dark:border-slate-100 space-y-6">
            <div className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest">
              [PRACTICE DIRECTORY / 2026]
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter uppercase text-slate-900 dark:text-slate-100 leading-none">
              {hero.headline}
            </h1>

            <p className="text-base sm:text-lg font-mono text-slate-600 dark:text-slate-400 max-w-2xl">
              {hero.subheadline}
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4 font-mono text-xs">
              <a
                href={hero.primaryCta.href}
                className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold px-6 py-3 uppercase tracking-wider hover:opacity-90 transition"
              >
                {hero.primaryCta.label} →
              </a>
              <a
                href={hero.secondaryCta.href}
                className="border border-slate-900 dark:border-slate-100 font-bold px-6 py-3 uppercase tracking-wider text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              >
                {hero.secondaryCta.label}
              </a>
            </div>
          </div>

          {/* Right Block: Strict Grid Visual */}
          <div className="lg:col-span-4 p-8 sm:p-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <SwissGridVisual theme={theme} />
          </div>
        </div>
      </section>
    );
  }

  // 5. Template 5: Modern Indian Professional — Left Headline + Credential Panel
  return (
    <section id="hero" className="relative py-16 lg:py-24 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
              <Scale className="h-3.5 w-3.5" />
              <span>{hero.badge || 'Chartered Accountancy & Corporate Advisory'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              {hero.headline}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {hero.subheadline}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={hero.primaryCta.href}
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <span>{hero.primaryCta.label}</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={hero.secondaryCta.href}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
              >
                <span>{hero.secondaryCta.label}</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <IndianGeometricMotif theme={theme} />
          </div>
        </div>
      </div>
    </section>
  );
}
