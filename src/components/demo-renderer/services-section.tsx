'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme } from '@/types';
import {
  Calculator,
  ShieldCheck,
  FileText,
  Globe,
  Building2,
  TrendingUp,
  Briefcase,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ServicesSectionProps {
  services: WebsiteContent['services'];
  theme: WebsiteTheme;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Calculator,
  ShieldCheck,
  FileText,
  Globe,
  Building2,
  TrendingUp,
};

export function ServicesSection({ services, theme }: ServicesSectionProps) {
  return (
    <section id="services" className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-block rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-200/60 dark:bg-slate-800 mb-3">
            Capabilities
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 ${
            theme.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
          }`}>
            {services.sectionTitle}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            {services.sectionSubtitle}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.items.map((service) => {
            const IconComponent = ICON_MAP[service.id] || Briefcase;

            return (
              <div
                key={service.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:shadow-md transition group"
              >
                <div>
                  {/* Status Badges */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>

                    {service.isConfirmed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Confirmed Service</span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                        title="Unverified template service. Please review and confirm before publishing commercial website."
                      >
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>Suggested Service — Review Before Publishing</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
