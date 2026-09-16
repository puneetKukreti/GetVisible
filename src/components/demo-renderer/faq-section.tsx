'use client';

import React, { useState } from 'react';
import { WebsiteContent, WebsiteTheme } from '@/types';
import { ChevronDown } from 'lucide-react';

interface FaqSectionProps {
  faq: WebsiteContent['faq'];
  theme: WebsiteTheme;
}

export function FaqSection({ faq, theme }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <div className="inline-block rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-200/60 dark:bg-slate-800 mb-3">
            Inquiries & Answers
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 ${
            theme.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
          }`}>
            {faq.sectionTitle}
          </h2>
        </div>

        <div className="space-y-3">
          {faq.items.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs transition"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <span className="pr-4">{item.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 text-slate-400 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-800 px-5 pb-5 pt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
