'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme } from '@/types';
import { Layers } from 'lucide-react';

interface IndustriesSectionProps {
  industries: WebsiteContent['industries'];
  theme: WebsiteTheme;
}

export function IndustriesSection({ industries, theme }: IndustriesSectionProps) {
  if (!industries.enabled || industries.items.length === 0) {
    return null;
  }

  return (
    <section id="industries" className="py-16 bg-slate-100/70 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 bg-white dark:bg-slate-800 mb-2 border border-slate-200 dark:border-slate-700">
              <Layers className="h-3 w-3" />
              <span>Coverage</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {industries.sectionTitle}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Tailoring statutory compliance and advisory frameworks to specialized sector demands.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 max-w-xl">
            {industries.items.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
