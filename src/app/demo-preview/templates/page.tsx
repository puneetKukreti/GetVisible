'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { WebsiteTheme, WebsiteTemplate, WebsiteDesign, WebsiteLayout } from '@/types';
import { DemoRenderer } from '@/components/demo-renderer/demo-renderer';
import { CA_LAYOUTS, CA_THEMES } from '@/lib/demos/personalization';
import { getTemplate } from '@/lib/demos/templates';
import { INDIAN_CA_ARCHETYPES, CAArchetypeMeta } from '@/lib/demos/ca-archetypes';
import { Sparkles, Layers, Palette, Monitor, Smartphone, CheckCircle, Info, Briefcase, Award } from 'lucide-react';
import Link from 'next/link';

interface LayoutMeta {
  name: string;
  tag: string;
  description: string;
  highlights: string[];
}

const VISUAL_LAYOUT_META: Record<string, LayoutMeta> = {
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
      'Tailored specifically for Indian accounting practices. Prominent ICAI firm profile badge, large practice area cards (GST, Direct Tax, Statutory Audit), and localized address card.',
    highlights: ['ICAI compliance credentials card', 'Prominent practice cards', 'Localized address card'],
  },
};

function TemplatesPreviewContent() {
  const searchParams = useSearchParams();
  const archetypeParam = searchParams.get('archetype');

  const [viewMode, setViewMode] = useState<'archetypes' | 'layouts'>('archetypes');
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>(
    archetypeParam && INDIAN_CA_ARCHETYPES.some((a) => a.id === archetypeParam)
      ? archetypeParam
      : 'CORPORATE_TRANSFER_PRICING'
  );
  const [selectedLayoutKey, setSelectedLayoutKey] = useState<string>('EDITORIAL_FINANCE');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('executive-navy');
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  // Sync if URL search params change
  useEffect(() => {
    if (archetypeParam && INDIAN_CA_ARCHETYPES.some((a) => a.id === archetypeParam)) {
      setSelectedArchetypeId(archetypeParam);
      setViewMode('archetypes');
      const found = INDIAN_CA_ARCHETYPES.find((a) => a.id === archetypeParam);
      if (found) {
        setSelectedThemeId(found.defaultThemeId);
      }
    }
  }, [archetypeParam]);

  const activeArchetype: CAArchetypeMeta =
    INDIAN_CA_ARCHETYPES.find((a) => a.id === selectedArchetypeId) || INDIAN_CA_ARCHETYPES[0];

  const activeTheme: WebsiteTheme =
    CA_THEMES.find((t: WebsiteTheme) => t.id === selectedThemeId) || CA_THEMES[0];

  // Determine active layout configuration
  const activeLayoutKey: WebsiteLayout =
    viewMode === 'archetypes' ? activeArchetype.defaultLayout : (selectedLayoutKey as WebsiteLayout);
  const layoutConfig = CA_LAYOUTS[activeLayoutKey] || CA_LAYOUTS['MODERN_INDIAN'];

  const design: WebsiteDesign = {
    layout: activeLayoutKey,
    template: layoutConfig.template || (activeLayoutKey as WebsiteTemplate),
    theme: activeTheme,
    heroLayout: layoutConfig.heroLayout,
    servicesLayout: layoutConfig.servicesLayout,
    sectionOrder: layoutConfig.sectionOrder,
    features: layoutConfig.features,
    contentDensity: layoutConfig.contentDensity,
  };

  // Build authentic content
  const templateBuilderId = viewMode === 'archetypes' ? activeArchetype.id : 'CA_ACCOUNTING_PROFESSIONAL';
  const templateBuilder = getTemplate(templateBuilderId);

  const content = templateBuilder.buildContent(
    {
      businessName:
        viewMode === 'archetypes'
          ? `Singhal & Associates, Chartered Accountants`
          : 'Sharma & Associates, Chartered Accountants',
      profession: 'Chartered Accountant',
      city: 'Gurugram',
      address: 'DLF Cyber City, Tower B, Sector 24, Gurugram, Haryana 122002',
      publicEmail: 'partner@singhal-associates-ca.in',
      publicPhone: '+91 124 4991100',
      source: 'ICAI Directory',
    },
    activeTheme,
    design
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top QA Showcase Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/demos"
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
            >
              ← Back to Demos Hub
            </Link>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Indian CA Website Showcase
              </h1>
            </div>
            {/* View Mode Pill Toggle */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setViewMode('archetypes')}
                className={`px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
                  viewMode === 'archetypes'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="h-3 w-3" />
                <span>7 CA Archetypes</span>
              </button>
              <button
                onClick={() => setViewMode('layouts')}
                className={`px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
                  viewMode === 'layouts'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>5 Visual Styles</span>
              </button>
            </div>
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

        {/* Dynamic Selector Tabs */}
        <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {viewMode === 'archetypes' ? (
            <>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1 mr-1">
                <Briefcase className="h-3.5 w-3.5 text-amber-400" />
                Select CA Archetype:
              </span>
              {INDIAN_CA_ARCHETYPES.map((arch) => {
                const isSelected = selectedArchetypeId === arch.id;
                return (
                  <button
                    key={arch.id}
                    onClick={() => {
                      setSelectedArchetypeId(arch.id);
                      setSelectedThemeId(arch.defaultThemeId);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <span>{arch.shortName}</span>
                  </button>
                );
              })}
            </>
          ) : (
            <>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1 mr-1">
                <Layers className="h-3.5 w-3.5 text-amber-400" />
                Select Visual Style:
              </span>
              {Object.keys(VISUAL_LAYOUT_META).map((tmplKey) => {
                const isSelected = selectedLayoutKey === tmplKey;
                const meta = VISUAL_LAYOUT_META[tmplKey];
                return (
                  <button
                    key={tmplKey}
                    onClick={() => setSelectedLayoutKey(tmplKey)}
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
            </>
          )}
        </div>
      </header>

      {/* Info & Regulatory Context Card */}
      <div className="bg-slate-900/80 border-b border-slate-800/80 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          {viewMode === 'archetypes' ? (
            <>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-white">{activeArchetype.name}:</span>
                <span className="text-slate-400">{activeArchetype.tagline}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">Key Regulations:</span>
                {activeArchetype.keyRegulations.map((reg, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[10px] font-mono bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700"
                  >
                    <CheckCircle className="h-2.5 w-2.5 text-emerald-400" />
                    {reg}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-white">{VISUAL_LAYOUT_META[selectedLayoutKey]?.name}:</span>
                <span className="text-slate-400">{VISUAL_LAYOUT_META[selectedLayoutKey]?.description}</span>
              </div>
              <div className="flex items-center gap-3">
                {VISUAL_LAYOUT_META[selectedLayoutKey]?.highlights.map((hl, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <CheckCircle className="h-3 w-3 text-emerald-400" />
                    {hl}
                  </span>
                ))}
              </div>
            </>
          )}
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

export default function TemplatesPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading Templates Showcase...
        </div>
      }
    >
      <TemplatesPreviewContent />
    </Suspense>
  );
}
