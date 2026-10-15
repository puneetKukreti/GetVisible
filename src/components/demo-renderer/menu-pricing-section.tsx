'use client';

import React, { useState } from 'react';
import { WebsiteMenuSection, WebsiteTheme } from '@/types';
import { Utensils, Star, BadgeCheck } from 'lucide-react';

interface MenuPricingSectionProps {
  menu: WebsiteMenuSection;
  theme: WebsiteTheme;
}

export function MenuPricingSection({ menu, theme }: MenuPricingSectionProps) {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  if (!menu || !menu.categories || menu.categories.length === 0) {
    return null;
  }

  const currentCategory = menu.categories[activeCategoryIndex] || menu.categories[0];

  return (
    <section id="menu" className="py-20 bg-white dark:bg-slate-950 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 mb-3">
            <Utensils className="w-3.5 h-3.5" />
            <span>Signature Offerings</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {menu.sectionTitle || 'Menu & Specialties'}
          </h2>
          {menu.sectionSubtitle && (
            <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-400">
              {menu.sectionSubtitle}
            </p>
          )}
        </div>

        {/* Category Tabs if multiple categories */}
        {menu.categories.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {menu.categories.map((cat: any, idx: number) => (
              <button
                key={cat.name || idx}
                onClick={() => setActiveCategoryIndex(idx)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeCategoryIndex === idx
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Menu Items List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentCategory.items.map((item: any, idx: number) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </h3>
                    {item.badge && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {item.price}
                  </span>
                </div>
                {item.description && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
