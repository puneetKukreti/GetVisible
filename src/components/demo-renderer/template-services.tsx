'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme, WebsiteTemplate } from '@/types';
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
  ArrowRight,
} from 'lucide-react';

interface ServicesProps {
  services: WebsiteContent['services'];
  theme: WebsiteTheme;
  template?: WebsiteTemplate;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Calculator,
  ShieldCheck,
  FileText,
  Globe,
  Building2,
  TrendingUp,
};

export function TemplateServices({ services, theme, template = 'MODERN_FINTECH' }: ServicesProps) {
  // 1. Template 1: Editorial Finance — Large Numbered Typography List (NO CARDS)
  if (template === 'EDITORIAL_FINANCE') {
    return (
      <section id="services" className="py-24 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-900 dark:border-slate-100 pb-8 mb-16">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
                {"// Practice Areas & Manifesto"}
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-bold text-slate-900 dark:text-white mt-2">
                {services.sectionTitle}
              </h2>
            </div>
            <p className="text-sm font-serif text-slate-600 dark:text-slate-400 max-w-md mt-4 md:mt-0">
              {services.sectionSubtitle}
            </p>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {services.items.map((service, idx) => {
              const num = String(idx + 1).padStart(2, '0');

              return (
                <div key={service.id} className="py-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition px-4 rounded-lg">
                  <div className="md:col-span-2 font-mono text-2xl font-bold text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition">
                    {num}
                  </div>
                  <div className="md:col-span-5">
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
                      {service.title}
                    </h3>
                    <div className="mt-2">
                      {service.isConfirmed ? (
                        <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                          [ Verified Service ]
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
                          [ Suggested Practice Area ]
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-5 text-sm font-serif text-slate-600 dark:text-slate-400 leading-relaxed">
                    {service.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // 2. Template 2: Modern Fintech / SaaS — Feature Cards with Subtle Gradient Glow
  if (template === 'MODERN_FINTECH') {
    return (
      <section id="services" className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600 bg-white dark:bg-slate-800 shadow-xs mb-3">
              Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {services.sectionTitle}
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              {services.sectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.items.map((service) => {
              const Icon = ICON_MAP[service.id] || Briefcase;

              return (
                <div
                  key={service.id}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative group overflow-hidden flex flex-col justify-between"
                >
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-10 transition pointer-events-none"
                    style={{ backgroundColor: theme.primaryColor }}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl shadow-xs"
                        style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
                      >
                        <Icon className="h-6 w-6" />
                      </div>

                      {service.isConfirmed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Confirmed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>Suggested</span>
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

  // 3. Template 3: Luxury Professional — Full-width Horizontal Service Rows
  if (template === 'LUXURY_PROFESSIONAL') {
    return (
      <section id="services" className="py-24 bg-slate-950 text-white border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-slate-400">
              CORE PRACTICE AREAS
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-light text-white">
              {services.sectionTitle}
            </h2>
            <div className="w-12 h-px mx-auto opacity-60" style={{ backgroundColor: theme.primaryColor }} />
          </div>

          <div className="border-t border-slate-800 divide-y divide-slate-800/80">
            {services.items.map((service, idx) => (
              <div
                key={service.id}
                className="py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center group hover:bg-slate-900/40 px-4 transition"
              >
                <div className="md:col-span-1 font-serif text-sm text-slate-500">
                  {String(idx + 1).padStart(2, '0')}.
                </div>
                <div className="md:col-span-5">
                  <h3 className="text-lg font-serif font-normal text-white group-hover:translate-x-1 transition duration-200">
                    {service.title}
                  </h3>
                </div>
                <div className="md:col-span-6 text-xs text-slate-400 font-sans leading-relaxed">
                  {service.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 4. Template 4: Swiss Minimal — Strict Grid with 1px Border Boxes
  if (template === 'SWISS_MINIMAL') {
    return (
      <section id="services" className="bg-white dark:bg-slate-950 border-b-2 border-slate-900 dark:border-slate-100">
        <div className="mx-auto max-w-7xl">
          <div className="p-8 sm:p-12 border-b-2 border-slate-900 dark:border-slate-100">
            <span className="font-mono text-xs uppercase tracking-widest text-slate-500">[02 / SERVICES]</span>
            <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-slate-900 dark:text-slate-100 mt-2 font-mono">
              {services.sectionTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {services.items.map((service, idx) => (
              <div
                key={service.id}
                className="p-8 border-b md:border-r border-slate-900 dark:border-slate-100 flex flex-col justify-between hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              >
                <div>
                  <div className="font-mono text-xs font-bold text-slate-500 mb-6">
                    [0{idx + 1}]
                  </div>
                  <h3 className="text-base font-mono font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-3">
                    {service.title}
                  </h3>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-400 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500">
                  STATUS: {service.isConfirmed ? 'CONFIRMED' : 'SUGGESTED'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 5. Template 5: Modern Indian Professional — Interactive Practice Cards
  return (
    <section id="services" className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-block rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-200/60 dark:bg-slate-800 mb-3">
            Practice Areas
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {services.sectionTitle}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            {services.sectionSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.items.map((service) => {
            const Icon = ICON_MAP[service.id] || Briefcase;

            return (
              <div
                key={service.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs hover:shadow-md transition group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
                    >
                      <Icon className="h-5 w-5" />
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
