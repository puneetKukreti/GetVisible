'use client';

import React from 'react';
import Link from 'next/link';
import { WebsiteTheme, WebsiteLayout } from '@/types';
import { THEMES } from '@/lib/demos/templates';
import {
  Eye,
  ArrowLeft,
  Palette,
  Edit3,
  Check,
  LayoutGrid,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface WatermarkBannerProps {
  leadId: string;
  businessName: string;
  currentTheme: WebsiteTheme;
  layout?: WebsiteLayout;
  onLayoutChange?: (layout: WebsiteLayout) => void;
  onThemeChange?: (theme: WebsiteTheme) => void;
  onOpenEditor?: () => void;
  version?: number;
  availableVersions?: number[];
  onSelectVersion?: (version: number) => void;
  viewport?: 'desktop' | 'tablet' | 'mobile';
  onViewportChange?: (vp: 'desktop' | 'tablet' | 'mobile') => void;
  onRegenerateSection?: (sectionType: string) => Promise<void> | void;
  isRegeneratingSection?: boolean;
}

const LAYOUT_NAMES: Record<string, string> = {
  'design-1-premium': 'Design 1: Premium Editorial (Stitch)',
  'design-2-minimalist': 'Design 2: Minimalist Ledger (Stitch)',
  'design-3-contemporary': 'Design 3: Contemporary Corporate (Stitch)',
  CLINIC_HEALTHCARE: 'Healthcare & Dental Clinic',
  INTERIOR_ARCHITECTURE: 'Interior & Architecture Studio',
  EDITORIAL_FINANCE: 'Editorial Finance (Classic)',
  MODERN_FINTECH: 'Modern Fintech (Classic)',
  LUXURY_PROFESSIONAL: 'Luxury Professional (Classic)',
  SWISS_MINIMAL: 'Swiss Minimal (Classic)',
  MODERN_INDIAN: 'Modern Indian (Classic)',
  MODERN_CORPORATE: 'Modern Corporate',
  PREMIUM_PROFESSIONAL: 'Premium Professional',
  TRADITIONAL_CA: 'Traditional CA',
};

const TEMPLATE_OPTIONS: { id: WebsiteLayout; label: string }[] = [
  { id: 'design-1-premium', label: '✨ Design 1: Premium Editorial (Stitch)' },
  { id: 'design-2-minimalist', label: '✨ Design 2: Minimalist Ledger (Stitch)' },
  { id: 'design-3-contemporary', label: '✨ Design 3: Contemporary Corporate (Stitch)' },
  { id: 'CLINIC_HEALTHCARE', label: '🏥 Healthcare & Dental Clinic' },
  { id: 'INTERIOR_ARCHITECTURE', label: '🏛️ Interior & Architecture Studio' },
  { id: 'EDITORIAL_FINANCE', label: 'Editorial Finance (Classic)' },
  { id: 'MODERN_FINTECH', label: 'Modern Fintech (Classic)' },
  { id: 'LUXURY_PROFESSIONAL', label: 'Luxury Professional (Classic)' },
  { id: 'SWISS_MINIMAL', label: 'Swiss Minimal (Classic)' },
  { id: 'MODERN_INDIAN', label: 'Modern Indian (Classic)' },
];

export function WatermarkBanner({
  leadId,
  businessName,
  currentTheme,
  layout = 'design-1-premium',
  onLayoutChange,
  onThemeChange,
  onOpenEditor,
  version = 1,
  availableVersions = [1],
  onSelectVersion,
  viewport,
  onViewportChange,
  onRegenerateSection,
  isRegeneratingSection,
}: WatermarkBannerProps) {
  const themeList = Object.values(THEMES);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber-500/30 bg-amber-950/90 backdrop-blur-md text-amber-100 shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Left: GetVisible Concept Badge & Backlink */}
        <div className="flex items-center gap-3">
          <Link
            href={`/leads/${leadId}`}
            className="inline-flex items-center gap-1.5 rounded bg-amber-900/80 px-2.5 py-1 text-xs font-medium text-amber-200 hover:bg-amber-800 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>CRM Lead</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Demo Concept
            </span>
            {layout && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-900/80 border border-amber-700/60 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                <LayoutGrid className="h-3 w-3" />
                <span>{LAYOUT_NAMES[layout] || layout}</span>
              </span>
            )}
            <span className="text-xs text-amber-200/80 hidden sm:inline">
              • Private evaluation preview for <strong className="text-white">{businessName}</strong>
            </span>
          </div>
        </div>

        {/* Right: Controls (Template, Version, Theme, Edit) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Template Switcher */}
          {onLayoutChange && (
            <div className="flex items-center gap-1 text-xs text-amber-200">
              <span className="text-amber-300/80 font-medium hidden md:inline">Template:</span>
              <select
                value={layout}
                onChange={(e) => onLayoutChange(e.target.value as WebsiteLayout)}
                aria-label="Select website template"
                className="rounded border border-amber-700 bg-amber-900/70 px-2 py-0.5 text-xs font-semibold text-amber-100 focus:outline-none"
              >
                {TEMPLATE_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Version Switcher */}
          {availableVersions.length > 1 && onSelectVersion && (
            <div className="flex items-center gap-1.5 text-xs text-amber-200">
              <span className="text-amber-300/80 font-medium">Ver:</span>
              <select
                value={version}
                onChange={(e) => onSelectVersion(Number(e.target.value))}
                aria-label="Select demo version"
                className="rounded border border-amber-700 bg-amber-900/70 px-2 py-0.5 text-xs font-semibold text-amber-100 focus:outline-none"
              >
                {availableVersions.map((v) => (
                  <option key={v} value={v}>
                    v{v}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Theme Switcher */}
          {onThemeChange && (
            <div className="flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-amber-300" />
              <div className="flex items-center gap-1">
                {themeList.map((t) => {
                  const isActive = currentTheme.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onThemeChange(t)}
                      title={`Theme: ${t.name}`}
                      className={`h-5 w-5 rounded-full border-2 transition flex items-center justify-center ${
                        isActive
                          ? 'border-white scale-110 shadow-sm'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: t.primaryColor }}
                    >
                      {isActive && <Check className="h-2.5 w-2.5 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Device Viewport Switcher */}
          {onViewportChange && (
            <div className="hidden sm:flex items-center rounded-lg bg-amber-900/60 p-0.5 border border-amber-700/60">
              <button
                onClick={() => onViewportChange('desktop')}
                title="Desktop View"
                className={`p-1.5 rounded-md transition ${
                  viewport === 'desktop' ? 'bg-amber-700 text-white shadow-xs' : 'text-amber-300 hover:text-white'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onViewportChange('tablet')}
                title="Tablet View (768px)"
                className={`p-1.5 rounded-md transition ${
                  viewport === 'tablet' ? 'bg-amber-700 text-white shadow-xs' : 'text-amber-300 hover:text-white'
                }`}
              >
                <Tablet className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onViewportChange('mobile')}
                title="Mobile View (390px)"
                className={`p-1.5 rounded-md transition ${
                  viewport === 'mobile' ? 'bg-amber-700 text-white shadow-xs' : 'text-amber-300 hover:text-white'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* AI Section Regeneration */}
          {onRegenerateSection && (
            <div className="flex items-center gap-1">
              <select
                disabled={isRegeneratingSection}
                onChange={(e) => {
                  if (e.target.value) {
                    onRegenerateSection(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="rounded border border-amber-500/60 bg-amber-800/80 px-2.5 py-1 text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="" disabled>
                  {isRegeneratingSection ? '⚡ Regenerating...' : '✨ Regenerate Section'}
                </option>
                <option value="HERO">⚡ Hero Section</option>
                <option value="SERVICES">⚡ Core Services</option>
                <option value="ABOUT">⚡ About Story</option>
                <option value="WHY_CHOOSE_US">⚡ Why Choose Us</option>
                <option value="FAQ">⚡ FAQ Answers</option>
              </select>
            </div>
          )}

          {/* Edit Button */}
          {onOpenEditor && (
            <button
              onClick={onOpenEditor}
              className="inline-flex items-center gap-1.5 rounded bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs font-medium text-white transition border border-white/20"
            >
              <Edit3 className="h-3.5 w-3.5 text-amber-300" />
              <span>Edit Content</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
