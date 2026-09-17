'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme, WebsiteTemplate } from '@/types';
import { CheckCircle2 } from 'lucide-react';

interface AboutSectionProps {
  about: WebsiteContent['about'];
  theme: WebsiteTheme;
  template?: WebsiteTemplate;
}

export function AboutSection({ about, theme, template = 'MODERN_FINTECH' }: AboutSectionProps) {
  // 1. Template 1: Editorial Finance — Asymmetric Editorial Storytelling
  if (template === 'EDITORIAL_FINANCE') {
    return (
      <section id="about" className="py-24 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-4">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
                {"// Foundation & Philosophy"}
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 dark:text-white mt-2">
                {about.title}
              </h2>
            </div>
            <div className="lg:col-span-8 space-y-6">
              <p className="text-xl sm:text-2xl font-serif text-slate-900 dark:text-slate-100 leading-relaxed">
                {about.leadParagraph}
              </p>
              <div className="w-12 h-0.5 bg-slate-900 dark:bg-slate-100 opacity-30" />
              <p className="text-sm sm:text-base font-serif text-slate-600 dark:text-slate-400 leading-relaxed">
                {about.body}
              </p>

              <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-800">
                {about.highlights.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <h4 className="font-mono text-xs uppercase tracking-wider font-bold text-slate-900 dark:text-slate-200">
                      [ {item.title} ]
                    </h4>
                    <p className="text-xs font-serif text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2. Template 3: Luxury Professional — Private Advisory Narrative
  if (template === 'LUXURY_PROFESSIONAL') {
    return (
      <section id="about" className="py-28 bg-slate-950 text-white border-b border-slate-800">
        <div className="mx-auto max-w-5xl px-6 text-center space-y-8">
          <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-slate-400">
            PRACTICE HERITAGE
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-light text-white">
            {about.title}
          </h2>
          <div className="w-12 h-px mx-auto opacity-50" style={{ backgroundColor: theme.primaryColor }} />

          <p className="text-lg sm:text-xl font-serif text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {about.leadParagraph}
          </p>

          <p className="text-sm font-sans text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {about.body}
          </p>

          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-slate-800">
            {about.highlights.map((item, idx) => (
              <div key={idx} className="p-4 rounded-sm border border-slate-800/80 bg-slate-900/40 text-left">
                <h4 className="font-serif text-sm font-normal text-white mb-1">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 3. Template 4: Swiss Minimal — Structured 50/50 Split Module
  if (template === 'SWISS_MINIMAL') {
    return (
      <section id="about" className="bg-white dark:bg-slate-950 border-b-2 border-slate-900 dark:border-slate-100">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-5 p-8 sm:p-12 border-b lg:border-b-0 lg:border-r-2 border-slate-900 dark:border-slate-100 space-y-4">
            <span className="font-mono text-xs uppercase tracking-widest text-slate-500">[03 / ABOUT]</span>
            <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-slate-900 dark:text-slate-100 font-mono leading-tight">
              {about.title}
            </h2>
            <p className="text-base font-mono font-bold text-slate-800 dark:text-slate-200 pt-4">
              {about.leadParagraph}
            </p>
          </div>

          <div className="lg:col-span-7 p-8 sm:p-12 space-y-8 flex flex-col justify-between">
            <p className="text-sm font-mono text-slate-700 dark:text-slate-300 leading-relaxed">
              {about.body}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-900 dark:border-slate-100">
              {about.highlights.map((item, idx) => (
                <div key={idx} className="border border-slate-900 dark:border-slate-100 p-4 font-mono">
                  <h4 className="text-xs uppercase font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 4. Modern Fintech & Modern Indian (Default 2-Column with Highlight Grid)
  return (
    <section id="about" className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-block rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800">
              Overview
            </div>
            <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 ${
              theme.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
            }`}>
              {about.title}
            </h2>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
              {about.leadParagraph}
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {about.body}
            </p>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {about.highlights.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-5 shadow-xs transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2
                    className="h-4 w-4 shrink-0"
                    style={{ color: theme.primaryColor }}
                  />
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

