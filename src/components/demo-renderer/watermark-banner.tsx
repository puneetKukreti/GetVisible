'use client';

import React from 'react';
import Link from 'next/link';
import { WebsiteTheme } from '@/types';
import { THEMES } from '@/lib/demos/templates';
import { Eye, ArrowLeft, Palette, Edit3, Check } from 'lucide-react';

interface WatermarkBannerProps {
  leadId: string;
  businessName: string;
  currentTheme: WebsiteTheme;
  onThemeChange?: (theme: WebsiteTheme) => void;
  onOpenEditor?: () => void;
  version?: number;
  availableVersions?: number[];
  onSelectVersion?: (version: number) => void;
}

export function WatermarkBanner({
  leadId,
  businessName,
  currentTheme,
  onThemeChange,
  onOpenEditor,
  version = 1,
  availableVersions = [1],
  onSelectVersion,
}: WatermarkBannerProps) {
  const themeList = Object.values(THEMES);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber-500/30 bg-amber-950/90 backdrop-blur-md text-amber-100 shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Left: LeadForge Concept Badge & Backlink */}
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
            <span className="text-xs text-amber-200/80 hidden sm:inline">
              • Private evaluation preview for <strong className="text-white">{businessName}</strong>
            </span>
          </div>
        </div>

        {/* Right: Controls (Version, Theme, Edit) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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
