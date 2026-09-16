'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme } from '@/types';
import { CheckCircle2 } from 'lucide-react';

interface AboutSectionProps {
  about: WebsiteContent['about'];
  theme: WebsiteTheme;
}

export function AboutSection({ about, theme }: AboutSectionProps) {
  return (
    <section id="about" className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Heading & Narrative */}
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

          {/* Right Column: Highlights / Values Grid */}
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
