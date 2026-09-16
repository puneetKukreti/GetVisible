'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme } from '@/types';
import { MessageSquareQuote, Info } from 'lucide-react';

interface TestimonialsSectionProps {
  testimonials: WebsiteContent['testimonials'];
  theme: WebsiteTheme;
}

export function TestimonialsSection({ testimonials, theme }: TestimonialsSectionProps) {
  // If testimonials are disabled, render nothing
  if (!testimonials.enabled || testimonials.items.length === 0) {
    return null;
  }

  return (
    <section id="testimonials" className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-block rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 mb-3">
            Endorsements
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 ${
            theme.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
          }`}>
            {testimonials.sectionTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.items.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-6 flex flex-col justify-between ${
                item.isPlaceholder
                  ? 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs'
              }`}
            >
              <div>
                <MessageSquareQuote
                  className="h-6 w-6 mb-4 opacity-50"
                  style={{ color: theme.primaryColor }}
                />
                <p className="text-sm italic text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div>
                {item.isPlaceholder && (
                  <div className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 mb-2">
                    <Info className="h-3 w-3" />
                    <span>Neutral Placeholder — Add verified client feedback before publishing</span>
                  </div>
                )}
                <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {item.author}
                </div>
                {item.role && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.role}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
