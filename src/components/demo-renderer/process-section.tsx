'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme, WebsiteLayout } from '@/types';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface ProcessSectionProps {
  process?: WebsiteContent['process'];
  theme: WebsiteTheme;
  layout?: WebsiteLayout;
}

export function ProcessSection({ process, theme, layout }: ProcessSectionProps) {
  if (!process || !process.steps || process.steps.length === 0) {
    return null;
  }

  const isTraditional = layout === 'TRADITIONAL_CA';
  const isPremium = layout === 'PREMIUM_PROFESSIONAL';

  return (
    <section id="process" className="py-20 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-block rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-200/70 dark:bg-slate-800 mb-3">
            Engagement Model
          </div>
          <h2
            className={`text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 ${
              theme.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
            }`}
          >
            {process.sectionTitle}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            {process.sectionSubtitle}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {process.steps.map((step, idx) => (
            <div
              key={idx}
              className={`relative flex flex-col justify-between rounded-xl p-6 transition shadow-xs ${
                isPremium
                  ? 'bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 hover:border-slate-400'
                  : isTraditional
                  ? 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-sm text-white shadow-xs"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    {step.number}
                  </span>
                  {idx < process.steps.length - 1 && (
                    <ArrowRight className="hidden lg:block h-4 w-4 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] text-slate-500">
                <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Standardized milestone</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
