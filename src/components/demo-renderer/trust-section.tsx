'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme, WebsiteLayout } from '@/types';
import { ShieldCheck, UserCheck, Lock, CheckCircle2, Award, Shield } from 'lucide-react';

interface TrustSectionProps {
  trust?: WebsiteContent['trust'];
  brand: WebsiteContent['brand'];
  theme: WebsiteTheme;
  layout?: WebsiteLayout;
}

const ICON_MAP: Record<string, React.ElementType> = {
  ShieldCheck,
  UserCheck,
  Lock,
  CheckCircle2,
  Award,
};

export function TrustSection({ trust, brand, theme, layout }: TrustSectionProps) {
  if (!trust || !trust.badges || trust.badges.length === 0) {
    return null;
  }

  const isPremium = layout === 'PREMIUM_PROFESSIONAL';

  return (
    <section
      id="trust"
      className={`py-12 border-b border-slate-200 dark:border-slate-800 ${
        isPremium
          ? 'bg-slate-900 text-slate-100'
          : 'bg-slate-100/70 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-8">
          <span
            className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border"
            style={{
              borderColor: `${theme.primaryColor}40`,
              color: isPremium ? '#e2e8f0' : theme.primaryColor,
              backgroundColor: `${theme.primaryColor}15`,
            }}
          >
            {trust.sectionTitle || 'Standards of Professional Governance'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trust.badges.map((badge, idx) => {
            const IconComponent = (badge.iconName && ICON_MAP[badge.iconName]) || Shield;

            return (
              <div
                key={idx}
                className={`rounded-xl p-5 transition flex flex-col justify-start ${
                  isPremium
                    ? 'bg-slate-800/80 border border-slate-700/80 hover:border-slate-500'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs'
                }`}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg mb-3 shrink-0"
                  style={{
                    backgroundColor: `${theme.primaryColor}20`,
                    color: isPremium ? '#60a5fa' : theme.primaryColor,
                  }}
                >
                  <IconComponent className="h-5 w-5" />
                </div>
                <h3
                  className={`text-sm font-bold mb-1.5 ${
                    isPremium ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {badge.title}
                </h3>
                <p
                  className={`text-xs leading-relaxed ${
                    isPremium ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {badge.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
