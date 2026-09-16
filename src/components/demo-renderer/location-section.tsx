'use client';

import React from 'react';
import { WebsiteContent, WebsiteTheme } from '@/types';
import { MapPin, Clock, Navigation } from 'lucide-react';

interface LocationSectionProps {
  location: WebsiteContent['location'];
  brand: WebsiteContent['brand'];
  theme: WebsiteTheme;
}

export function LocationSection({ location, brand, theme }: LocationSectionProps) {
  return (
    <section id="location" className="py-16 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Details */}
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-block rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-200/60 dark:bg-slate-800">
              Office & Location
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Visit Our Practice in {location.city}
            </h3>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                <MapPin className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                <span>{location.address}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                <Clock className="h-5 w-5 text-slate-500 shrink-0" />
                <span>{location.officeHours}</span>
              </div>
            </div>
          </div>

          {/* Interactive Map Visual Placeholder */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 h-64 flex flex-col items-center justify-center p-6 text-center shadow-inner overflow-hidden">
              {/* Stylized map grid background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
              
              <div
                className="relative flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg mb-3"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <Navigation className="h-6 w-6" />
              </div>
              <h4 className="relative text-sm font-bold text-slate-800 dark:text-slate-200">
                {brand.businessName}
              </h4>
              <p className="relative text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xs">
                {location.address}
              </p>
              <span className="relative mt-3 rounded-full bg-white/80 dark:bg-slate-800/80 px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 backdrop-blur-xs">
                Static Map Concept
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
