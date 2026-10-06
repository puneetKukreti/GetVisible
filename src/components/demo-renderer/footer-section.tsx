'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme } from '@/types';
import { Shield } from 'lucide-react';
import { categorizeFirmName, splitFirmName } from '@/lib/demos/brand-typography';

interface FooterSectionProps {
  footer: WebsiteContent['footer'];
  brand: WebsiteContent['brand'];
  navigation: WebsiteContent['navigation'];
  theme: WebsiteTheme;
}

export function FooterSection({ footer, brand, navigation, theme }: FooterSectionProps) {
  const firmName = brand?.businessName || 'Chartered Accountants';
  const category = categorizeFirmName(firmName);
  const split = splitFirmName(firmName);

  return (
    <footer className="bg-slate-900 text-slate-400 py-10 sm:py-12 border-t border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div className="max-w-xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Shield className="h-5 w-5 text-white shrink-0" />
              <span className={`${
                category === 'VERY_LONG'
                  ? 'text-base sm:text-lg'
                  : category === 'LONG'
                  ? 'text-base sm:text-lg'
                  : 'text-lg sm:text-xl'
              } font-bold text-white tracking-tight break-words`}>
                {firmName}
              </span>
              {split.hasSuffix && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {split.suffix}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
              {brand.tagline}
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-medium text-slate-300">
            {navigation.items.map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                className="hover:text-white transition"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="text-center sm:text-left">{footer.copyright}</div>
          <div className="text-center sm:text-right max-w-md text-[11px] leading-relaxed">
            {footer.disclaimer}
          </div>
        </div>
      </div>
    </footer>
  );
}
