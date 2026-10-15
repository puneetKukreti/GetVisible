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
import { getHeroTypographyConfig, splitFirmName } from '@/lib/demos/brand-typography';

interface HeroProps {
  hero: WebsiteContent['hero'];
  brand: WebsiteContent['brand'];
  theme: WebsiteTheme;
  template?: WebsiteTemplate;
  images?: WebsiteContent['images'];
}

function HeroVisual({
  images,
  theme,
  fallback,
  firmName,
}: {
  images?: any;
  theme: WebsiteTheme;
  fallback: React.ReactNode;
  firmName: string;
}) {
  const heroUrl = typeof images?.heroImage === 'string' ? images.heroImage : images?.heroImage?.url;
  const heroAlt = (typeof images?.heroImage === 'object' && images?.heroImage?.alt) || firmName;

  if (heroUrl) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800/80 aspect-[16/10] bg-slate-100 dark:bg-slate-900 group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroUrl}
          alt={heroAlt}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-[11px] font-semibold bg-black/60 backdrop-blur-md text-white border border-white/20">
          ✦ Verified Presence
        </div>
      </div>
    );
  }
  return <>{fallback}</>;
}

export function TemplateHero({ hero, brand, theme, template = 'MODERN_FINTECH', images }: HeroProps) {
  const firmName = brand?.businessName || 'Chartered Accountants';
  const typo = getHeroTypographyConfig(firmName, template);
  const split = splitFirmName(firmName);
  const isScreenshot = typeof window !== 'undefined' && window.location.search.includes('screenshot=true');

  // 1. Template 1: Editorial Finance — Asymmetric large editorial statement + artwork
  if (template === 'EDITORIAL_FINANCE') {
    return (
      <section
        id="hero"
        style={isScreenshot ? { zoom: '1.22' } : undefined}
        className="relative py-16 sm:py-20 lg:py-28 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className={`lg:col-span-7 space-y-6 sm:space-y-8 ${typo.containerClass}`}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <span>✦ {firmName} • {hero.badge || 'Professional Practice'}</span>
                {split.hasSuffix && (
                  <span className="inline-block px-2 py-0.5 text-[10px] rounded bg-amber-500/20 font-mono text-amber-800 dark:text-amber-200">
                    {split.suffix}
                  </span>
                )}
              </div>

              {/* Primary Visual Identity: Firm Name as Hero Title */}
              <h1 className={`${typo.titleClass} text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight`}>
                {firmName}
              </h1>

              {/* Practice Philosophy / Value Headline as Editorial Thesis */}
              <div
                className="border-l-2 pl-4 py-1"
                style={{ borderColor: theme.primaryColor }}
              >
                <p className="text-xl sm:text-2xl font-serif text-slate-800 dark:text-slate-200 leading-snug">
                  {hero.headline}
                </p>
              </div>

              <p className={typo.subheadlineClass}>
                {hero.subheadline}
              </p>

              <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-6">
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
              <HeroVisual
                images={images}
                theme={theme}
                firmName={firmName}
                fallback={<FinancialGeometricArtwork theme={theme} />}
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2. Template 2: Modern Fintech / SaaS — 2-Column with Dashboard Widget
  if (template === 'MODERN_FINTECH') {
    return (
      <section
        id="hero"
        style={isScreenshot ? { zoom: '1.22' } : undefined}
        className="relative py-14 sm:py-16 lg:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className={`lg:col-span-7 space-y-5 sm:space-y-6 ${typo.containerClass}`}>
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold border shadow-xs"
                  style={{
                    backgroundColor: `${theme.primaryColor}15`,
                    color: theme.primaryColor,
                    borderColor: `${theme.primaryColor}40`,
                  }}
                >
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  <span>✦ {firmName} • {hero.badge || 'Professional Practice'}</span>
                </div>
                {split.hasSuffix && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {split.suffix}
                  </span>
                )}
              </div>

              {/* Primary Visual Identity: Firm Name as Hero Title */}
              <h1 className={`${typo.titleClass} text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight`}>
                {firmName}
              </h1>

              {/* Value Proposition Headline */}
              <p className="text-lg sm:text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-200 leading-snug">
                {hero.headline}
              </p>

              <p className={typo.subheadlineClass}>
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
              <HeroVisual
                images={images}
                theme={theme}
                firmName={firmName}
                fallback={<FintechDashboardVisual theme={theme} />}
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 3. Template 3: Luxury Professional — Private Advisory Minimalist Hero
  if (template === 'LUXURY_PROFESSIONAL') {
    return (
      <section
        id="hero"
        style={isScreenshot ? { zoom: '1.22' } : undefined}
        className="relative py-20 sm:py-28 lg:py-36 bg-slate-950 text-white border-b border-slate-800 overflow-hidden"
      >
        <div className={`mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6 sm:space-y-8 ${typo.containerClass}`}>
          <div className="inline-flex items-center justify-center gap-2 text-xs font-mono tracking-widest uppercase text-amber-300 bg-amber-400/10 border border-amber-400/30 px-4 py-1.5 rounded-full mx-auto font-bold">
            <span>✦ {firmName} • {hero.badge || 'CHARTERED ACCOUNTANTS & CORPORATE ADVISORS'}</span>
            {split.hasSuffix && (
              <span className="tracking-widest text-amber-200">
                • {split.suffix}
              </span>
            )}
          </div>

          {/* Primary Visual Identity: Firm Name as Hero Title */}
          <h1 className={`${typo.titleClass} text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white`}>
            {firmName}
          </h1>

          <div
            className="w-16 h-px mx-auto my-6 sm:my-8 opacity-60"
            style={{ backgroundColor: theme.primaryColor }}
          />

          {/* Practice Focus Headline */}
          <p className="text-lg sm:text-2xl font-serif font-light text-slate-200 max-w-2xl mx-auto leading-relaxed">
            {hero.headline}
          </p>

          <p className={typo.subheadlineClass}>
            {hero.subheadline}
          </p>

          <div className="pt-4 sm:pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
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
      <section
        id="hero"
        style={isScreenshot ? { zoom: '1.22' } : undefined}
        className="relative bg-white dark:bg-slate-950 border-b-2 border-slate-900 dark:border-slate-100"
      >
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12">
          {/* Left Block: Massive Swiss Typography */}
          <div className={`lg:col-span-8 p-6 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r-2 border-slate-900 dark:border-slate-100 space-y-6 ${typo.containerClass}`}>
            <div className="inline-flex items-center gap-2 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest border border-slate-900 dark:border-slate-100 px-3 py-1 bg-slate-100 dark:bg-slate-900">
              <span>✦ {firmName} • [{hero.badge || 'PRACTICE DIRECTORY'} / {new Date().getFullYear()}]</span>
              {split.hasSuffix && (
                <span className="border-l border-slate-900 dark:border-slate-100 pl-2 text-[10px] font-mono text-slate-700 dark:text-slate-300">
                  {split.suffix}
                </span>
              )}
            </div>

            {/* Primary Visual Identity: Firm Name as Hero Title */}
            <h1 className={`${typo.titleClass} text-3xl sm:text-5xl lg:text-6xl font-black uppercase`}>
              {firmName}
            </h1>

            {/* Practice Specialization Index Line */}
            <div className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-l-2 border-slate-900 dark:border-slate-100 pl-3">
              {`// ${hero.headline}`}
            </div>

            <p className={typo.subheadlineClass}>
              {hero.subheadline}
            </p>

            <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-4 font-mono text-xs">
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
            <HeroVisual
              images={images}
              theme={theme}
              firmName={firmName}
              fallback={<SwissGridVisual theme={theme} />}
            />
          </div>
        </div>
      </section>
    );
  }

  // 5. Template 5: Modern Indian Professional — Left Headline + Credential Panel
  return (
    <section
      id="hero"
      style={isScreenshot ? { zoom: '1.22' } : undefined}
      className="relative py-14 sm:py-16 lg:py-24 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className={`lg:col-span-7 space-y-5 sm:space-y-6 ${typo.containerClass}`}>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-md bg-amber-500/15 border border-amber-500/40 px-3.5 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-200">
                <Scale className="h-3.5 w-3.5 shrink-0" />
                <span>✦ {firmName} • {hero.badge || 'Professional Practice'}</span>
              </div>
              {split.hasSuffix && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {split.suffix}
                </span>
              )}
            </div>

            {/* Primary Visual Identity: Firm Name as Hero Title */}
            <h1 className={`${typo.titleClass} text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight`}>
              {firmName}
            </h1>

            {/* Core Practice Focus Headline */}
            <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 leading-snug">
              {hero.headline}
            </p>

            <p className={typo.subheadlineClass}>
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
            <HeroVisual
              images={images}
              theme={theme}
              firmName={firmName}
              fallback={<IndianGeometricMotif theme={theme} />}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
