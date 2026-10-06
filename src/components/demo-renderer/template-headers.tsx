'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme, WebsiteTemplate } from '@/types';
import { Shield } from 'lucide-react';
import { getHeaderTypographyConfig, splitFirmName } from '@/lib/demos/brand-typography';

interface HeaderProps {
  brand: WebsiteContent['brand'];
  navigation: WebsiteContent['navigation'];
  theme: WebsiteTheme;
  template?: WebsiteTemplate;
}

export function TemplateHeader({ brand, navigation, theme, template = 'MODERN_FINTECH' }: HeaderProps) {
  const firmName = brand?.businessName || 'Chartered Accountants';
  const typo = getHeaderTypographyConfig(firmName, template);
  const split = splitFirmName(firmName);

  // 1. Floating Header for Modern Fintech / SaaS
  if (template === 'MODERN_FINTECH') {
    return (
      <div className="sticky top-4 z-40 w-full px-3 sm:px-6 pointer-events-none mb-4">
        <nav className="mx-auto max-w-5xl rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-2.5 sm:py-3 shadow-lg flex items-center justify-between pointer-events-auto transition gap-3">
          <a
            href="#hero"
            className={`flex items-center gap-2 text-slate-900 dark:text-white shrink min-w-0 ${typo.containerClass}`}
            title={firmName}
          >
            <div
              className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-white font-black text-xs"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <span className="text-[10px] font-mono sm:text-xs">{typo.monogram}</span>
            </div>
            <span className={typo.titleClass}>{firmName}</span>
          </a>

          <div className="hidden md:flex items-center gap-5 lg:gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
            {navigation.items.map((item, idx) => (
              <a key={idx} href={item.href} className="hover:text-slate-900 dark:hover:text-white transition">
                {item.label}
              </a>
            ))}
          </div>

          <a
            href={navigation.ctaHref}
            className="shrink-0 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white shadow-xs hover:opacity-95 transition"
            style={{ backgroundColor: theme.primaryColor }}
          >
            {navigation.ctaText}
          </a>
        </nav>
      </div>
    );
  }

  // 2. Minimal Editorial Header for Editorial Finance
  if (template === 'EDITORIAL_FINANCE') {
    return (
      <header className="sticky top-[41px] z-40 w-full border-b border-slate-900/10 dark:border-slate-100/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4 sm:py-5 gap-4">
          <a
            href="#hero"
            className={`tracking-tight text-slate-900 dark:text-white shrink min-w-0 ${typo.containerClass}`}
            title={firmName}
          >
            <span className={typo.titleClass}>{firmName}</span>
          </a>

          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-mono uppercase tracking-widest text-slate-600 dark:text-slate-300 shrink-0">
            {navigation.items.map((item, idx) => (
              <a key={idx} href={item.href} className="hover:text-slate-900 dark:hover:text-white transition hover:underline">
                {item.label}
              </a>
            ))}
          </div>

          <a
            href={navigation.ctaHref}
            className="shrink-0 text-[11px] sm:text-xs font-mono uppercase tracking-wider font-bold underline underline-offset-4 hover:opacity-80 transition"
            style={{ color: theme.primaryColor }}
          >
            [ {navigation.ctaText} ]
          </a>
        </div>
      </header>
    );
  }

  // 3. Ultra-minimal Header for Luxury Professional
  if (template === 'LUXURY_PROFESSIONAL') {
    return (
      <header className="sticky top-[41px] z-40 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-950/95 text-white backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4 sm:py-5 gap-4">
          <a
            href="#hero"
            className={`text-slate-200 shrink min-w-0 ${typo.containerClass}`}
            title={firmName}
          >
            <span className={typo.titleClass}>{firmName}</span>
          </a>

          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-[11px] font-sans tracking-widest uppercase text-slate-400 shrink-0">
            {navigation.items.map((item, idx) => (
              <a key={idx} href={item.href} className="hover:text-white transition">
                {item.label}
              </a>
            ))}
          </div>

          <a
            href={navigation.ctaHref}
            className="shrink-0 rounded-sm border border-slate-700 px-3 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-slate-200 hover:bg-slate-800 transition"
          >
            {navigation.ctaText}
          </a>
        </div>
      </header>
    );
  }

  // 4. Strict Grid Header for Swiss Minimal
  if (template === 'SWISS_MINIMAL') {
    return (
      <header className="sticky top-[41px] z-40 w-full border-b-2 border-slate-900 dark:border-slate-100 bg-white dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-4">
          <a
            href="#hero"
            className={`text-slate-900 dark:text-slate-100 shrink min-w-0 ${typo.containerClass}`}
            title={firmName}
          >
            <span className={typo.titleClass}>{firmName}</span>
          </a>

          <div className="hidden md:flex items-center border-l border-r border-slate-900 dark:border-slate-100 text-xs font-mono shrink-0">
            {navigation.items.map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                className="px-3 lg:px-4 py-2 border-r last:border-r-0 border-slate-900 dark:border-slate-100 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 transition"
              >
                {item.label}
              </a>
            ))}
          </div>

          <a
            href={navigation.ctaHref}
            className="shrink-0 font-mono text-[11px] sm:text-xs font-bold uppercase bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 sm:px-4 py-1.5 sm:py-2"
          >
            {navigation.ctaText} →
          </a>
        </div>
      </header>
    );
  }

  // 5. Modern Indian Professional Header (Default / Indian)
  return (
    <header className="sticky top-[41px] z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-3.5 sm:px-6 gap-3">
        <a
          href="#hero"
          className={`flex items-center gap-2.5 text-slate-900 dark:text-white shrink min-w-0 ${typo.containerClass}`}
          title={firmName}
        >
          <div
            className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-white font-black text-xs"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <span className="text-[10px] font-mono sm:text-xs">{typo.monogram}</span>
          </div>
          <span className={typo.titleClass}>{firmName}</span>
        </a>

        <div className="hidden md:flex items-center gap-5 lg:gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
          {navigation.items.map((item, idx) => (
            <a key={idx} href={item.href} className="hover:text-slate-900 dark:hover:text-white transition">
              {item.label}
            </a>
          ))}
        </div>

        <a
          href={navigation.ctaHref}
          className="shrink-0 rounded-lg px-3.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white shadow-xs hover:opacity-95 transition"
          style={{ backgroundColor: theme.primaryColor }}
        >
          {navigation.ctaText}
        </a>
      </div>
    </header>
  );
}
