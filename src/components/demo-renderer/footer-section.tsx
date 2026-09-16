'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme } from '@/types';
import { Shield } from 'lucide-react';

interface FooterSectionProps {
  footer: WebsiteContent['footer'];
  brand: WebsiteContent['brand'];
  navigation: WebsiteContent['navigation'];
  theme: WebsiteTheme;
}

export function FooterSection({ footer, brand, navigation, theme }: FooterSectionProps) {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-white" />
              <span className="text-lg font-bold text-white tracking-tight">
                {brand.businessName}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              {brand.tagline}
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-300">
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
          <div>{footer.copyright}</div>
          <div className="text-center sm:text-right max-w-md text-[11px] leading-relaxed">
            {footer.disclaimer}
          </div>
        </div>
      </div>
    </footer>
  );
}
