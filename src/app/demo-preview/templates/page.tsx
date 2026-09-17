'use client';

import React, { useState } from 'react';
import { WebsiteTheme, WebsiteTemplate, WebsiteDesign } from '@/types';
import { DemoRenderer } from '@/components/demo-renderer/demo-renderer';
import { CA_LAYOUTS, CA_THEMES } from '@/lib/demos/personalization';
import { getTemplate } from '@/lib/demos/templates';
import { Sparkles, Layers, Palette, Monitor, Smartphone, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';

const TEMPLATE_META: Record<
  WebsiteTemplate,
  { name: string; tag: string; description: string; highlights: string[] }
> = {
  EDITORIAL_FINANCE: {
    name: 'Editorial Finance',
    tag: 'Asymmetric & Typographic',
    description:
      'High-contrast editorial layout with massive numbered manifesto services, two-column narrative about section, and abstract geometric vector artwork.',
    highlights: ['Bold numbered entries (01, 02)', 'Two-column editorial essay', 'Minimal geometric charts'],
  },
  MODERN_FINTECH: {
    name: 'Modern Fintech',
    tag: 'Modern SaaS / Advisory',
    description:
      'Floating rounded glass header, two-column hero with decorative compliance dashboard widget, subtle gradient glow cards, and visual timeline.',
    highlights: ['Floating glassmorphism navigation', 'Simulated compliance card visual', 'Glow border cards'],
  },
  LUXURY_PROFESSIONAL: {
    name: 'Luxury Professional',
    tag: 'Private Wealth & Advisory',
    description:
      'Ultra-refined aesthetic with serif display typography, dramatic whitespace, hairline dividers, and full-width horizontal luxury service rows.',
    highlights: ['Serif editorial typography', 'Horizontal service strips', 'Hairline luxury borders'],
  },
  SWISS_MINIMAL: {
    name: 'Swiss Minimal',
    tag: 'Strict Architectural Grid',
    description:
      'Strict 1px grid borders, heavy uppercase Swiss headings, numbered border boxes, and clean 50/50 split layout with restrained accenting.',
    highlights: ['1px structured grid boxes', 'Heavy brutalist-inspired typography', 'Monochrome aesthetic'],
  },
  MODERN_INDIAN: {
    name: 'Modern Indian CA',
    tag: 'Regional & Practice-Focused',
    description:
      'Tailored specifically for Indian accounting practices. Prominent ICAI firm profile badge, large practice area cards (GST, Direct Tax, Statutory Audit), and Gurugram location card.',
    highlights: ['ICAI compliance credentials card', 'Prominent practice cards', 'Localized address card'],
  },
};

export default function TemplatesPreviewPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<WebsiteTemplate>('EDITORIAL_FINANCE');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('executive-navy');
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  const activeTheme: WebsiteTheme =
    CA_THEMES.find((t: WebsiteTheme) => t.id === selectedThemeId) || CA_THEMES[0];
  const layoutConfig = CA_LAYOUTS[selectedTemplate];

  const design: WebsiteDesign = {
    layout: selectedTemplate,
    template: selectedTemplate,
    theme: activeTheme,
    heroLayout: layoutConfig.heroLayout,
    servicesLayout: layoutConfig.servicesLayout,
    sectionOrder: layoutConfig.sectionOrder,
    features: layoutConfig.features,
    contentDensity: layoutConfig.contentDensity,
  };

  const templateBuilder = getTemplate('CA_ACCOUNTING_PROFESSIONAL');
  const content = templateBuilder.buildContent(
    {
      businessName: 'Sharma & Associates, Chartered Accountants',
      profession: 'Chartered Accountant',
      city: 'Gurugram',
      address: 'DLF Cyber City, Tower B, Sector 24, Gurugram, Haryana 122002',
      publicEmail: 'contact@sharma-associates-ca.in',
      publicPhone: '+91 98112 34567',
      source: 'ICAI Directory',
    },
    activeTheme,
    design
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top QA Showcase Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/leads"
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
            >
              ← Back to CRM
            </Link>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Phase 4.2 Template Showcase
              </h1>
            </div>
            <span className="hidden sm:inline-block text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
              5 Distinct CA Designs
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Palette className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Theme:</span>
              <select
                value={selectedThemeId}
                onChange={(e) => setSelectedThemeId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-amber-400"
              >
                {CA_THEMES.map((theme: WebsiteTheme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Viewport Toggle */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setIsMobileView(false)}
                className={`p-1.5 rounded transition ${
                  !isMobileView ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Desktop View"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsMobileView(true)}
                className={`p-1.5 rounded transition ${
                  isMobileView ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Mobile View"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Template Selector Tabs */}
        <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1 mr-1">
            <Layers className="h-3.5 w-3.5 text-amber-400" />
            Select Template:
          </span>
          {(Object.keys(TEMPLATE_META) as WebsiteTemplate[]).map((tmplKey) => {
            const isSelected = selectedTemplate === tmplKey;
            const meta = TEMPLATE_META[tmplKey];
            return (
              <button
                key={tmplKey}
                onClick={() => setSelectedTemplate(tmplKey)}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                <span>{meta.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                    isSelected ? 'bg-slate-900/20 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  {meta.tag}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Template Info Card */}
      <div className="bg-slate-900/60 border-b border-slate-800/60 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="font-semibold text-white">{TEMPLATE_META[selectedTemplate].name}:</span>
            <span className="text-slate-400">{TEMPLATE_META[selectedTemplate].description}</span>
          </div>
          <div className="flex items-center gap-3">
            {TEMPLATE_META[selectedTemplate].highlights.map((hl, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                {hl}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Preview Container */}
      <main className="flex-1 bg-slate-950 py-6 px-4 flex justify-center">
        <div
          className={`transition-all duration-300 w-full ${
            isMobileView
              ? 'max-w-md border-[6px] border-slate-800 rounded-3xl overflow-hidden shadow-2xl bg-white'
              : 'max-w-7xl shadow-xl'
          }`}
        >
          <DemoRenderer content={content} theme={activeTheme} design={design} />
        </div>
      </main>
    </div>
  );
}
