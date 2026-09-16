'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme } from '@/types';
import { UserCheck, CheckCircle2, Lock, Clock, Shield } from 'lucide-react';

interface WhyChooseUsSectionProps {
  whyChooseUs: WebsiteContent['whyChooseUs'];
  theme: WebsiteTheme;
}

const ICON_MAP: Record<string, React.ElementType> = {
  UserCheck,
  CheckCircle2,
  Lock,
  Clock,
};

export function WhyChooseUsSection({ whyChooseUs, theme }: WhyChooseUsSectionProps) {
  return (
    <section id="why-choose-us" className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-block rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 mb-3">
            Standards & Governance
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 ${
            theme.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
          }`}>
            {whyChooseUs.sectionTitle}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            {whyChooseUs.sectionSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyChooseUs.points.map((pt, idx) => {
            const IconComponent = (pt.iconName && ICON_MAP[pt.iconName]) || Shield;

            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-6 flex flex-col justify-start"
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-lg mb-4"
                  style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
                >
                  <IconComponent className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {pt.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {pt.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
