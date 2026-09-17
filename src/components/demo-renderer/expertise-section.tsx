'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme, WebsiteLayout } from '@/types';
import { Layers, CheckCircle2 } from 'lucide-react';

interface ExpertiseSectionProps {
  expertise?: WebsiteContent['expertise'];
  theme: WebsiteTheme;
  layout?: WebsiteLayout;
}

export function ExpertiseSection({ expertise, theme, layout }: ExpertiseSectionProps) {
  if (!expertise || !expertise.items || expertise.items.length === 0) {
    return null;
  }

  const isPremium = layout === 'PREMIUM_PROFESSIONAL';
  const isTraditional = layout === 'TRADITIONAL_CA';

  return (
    <section id="expertise" className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-block rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 mb-3">
            Domain Specialization
          </div>
          <h2
            className={`text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 ${
              theme.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
            }`}
          >
            {expertise.sectionTitle}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            {expertise.sectionSubtitle}
          </p>
        </div>

        {/* Expertise Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expertise.items.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-6 flex flex-col justify-between transition ${
                isPremium
                  ? 'border-2 border-slate-200/90 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 shadow-xs hover:border-slate-400'
                  : isTraditional
                  ? 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                  : 'border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <Layers className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap gap-1.5">
                  {item.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      <CheckCircle2 className="h-2.5 w-2.5 text-slate-400" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
