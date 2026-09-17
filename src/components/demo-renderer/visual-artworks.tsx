'use client';

import React from 'react';
import { WebsiteTheme } from '@/types';
import { Shield, CheckCircle2, TrendingUp, Calendar, FileText, Lock } from 'lucide-react';

interface ArtworkProps {
  theme: WebsiteTheme;
  className?: string;
}

/**
 * Editorial Finance: Abstract geometric financial chart & nodes.
 * Replaces fake stock photography with sophisticated vector artwork.
 */
export function FinancialGeometricArtwork({ theme, className = '' }: ArtworkProps) {
  return (
    <div className={`relative w-full aspect-square max-w-md mx-auto p-6 rounded-3xl bg-slate-900/5 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 backdrop-blur-xs flex items-center justify-center overflow-hidden ${className}`}>
      {/* Ambient gradient glow */}
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: theme.primaryColor }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: theme.accentColor }}
      />

      <svg viewBox="0 0 400 400" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Subtle coordinate grid lines */}
        <line x1="50" y1="350" x2="350" y2="350" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5" />
        <line x1="50" y1="270" x2="350" y2="270" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
        <line x1="50" y1="190" x2="350" y2="190" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
        <line x1="50" y1="110" x2="350" y2="110" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />

        {/* Geometric primary curve */}
        <path
          d="M 60 320 Q 140 290 190 210 T 340 90"
          stroke={theme.primaryColor}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Secondary accent projection */}
        <path
          d="M 60 335 Q 160 310 230 250 T 340 140"
          stroke={theme.accentColor}
          strokeWidth="2"
          strokeDasharray="6 6"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />

        {/* Node Points */}
        <circle cx="60" cy="320" r="5" fill={theme.primaryColor} />
        <circle cx="190" cy="210" r="6" fill={theme.primaryColor} />
        <circle cx="340" cy="90" r="7" fill={theme.primaryColor} />

        {/* Halo on key node */}
        <circle cx="340" cy="90" r="14" stroke={theme.primaryColor} strokeWidth="1.5" strokeOpacity="0.4" />
      </svg>

      {/* Floating Insight Pill */}
      <div className="absolute bottom-6 left-6 right-6 p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-lg flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">Statutory Precision</p>
            <p className="text-[11px] text-slate-500">Continuous Compliance Model</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          Structured
        </span>
      </div>
    </div>
  );
}

/**
 * Modern Fintech / SaaS: Decorative Compliance & Audit Dashboard Widget.
 * Clearly decorative — communicates modern digital-first capability without fake client claims.
 */
export function FintechDashboardVisual({ theme, className = '' }: ArtworkProps) {
  return (
    <div className={`relative w-full max-w-lg mx-auto rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden ${className}`}>
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: theme.primaryColor }}
      />

      {/* Dashboard Topbar */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Advisory & Assurance Workspace
          </span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          Statutory Framework
        </span>
      </div>

      {/* Milestone Trackers */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <FileText className="h-4 w-4" style={{ color: theme.primaryColor }} />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Statutory Audit</span>
          </div>
          <p className="text-[11px] text-slate-500">Methodical Workpaper Review</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">GST Filing Cycles</span>
          </div>
          <p className="text-[11px] text-slate-500">Monthly / Annual Recs</p>
        </div>
      </div>

      {/* Structured Status List */}
      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Direct Tax Computations
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">ICAI Aligned</span>
        </div>
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" style={{ color: theme.primaryColor }} />
            Confidential Client Repository
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">Secure Protocol</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Swiss / Minimal Corporate: Strict architectural grid visual.
 */
export function SwissGridVisual({ theme, className = '' }: ArtworkProps) {
  return (
    <div className={`border-2 border-slate-900 dark:border-slate-100 p-8 flex flex-col justify-between aspect-square max-w-sm mx-auto ${className}`}>
      <div className="flex justify-between items-start text-xs font-mono uppercase tracking-widest text-slate-500">
        <span>[SYSTEM 04]</span>
        <span>AUDIT / TAX</span>
      </div>
      <div className="my-auto space-y-2">
        <div className="text-4xl font-extrabold tracking-tighter text-slate-900 dark:text-slate-100 font-mono">
          00:100
        </div>
        <div className="text-xs uppercase tracking-widest text-slate-600 dark:text-slate-400">
          Meticulous Regulatory Adherence
        </div>
      </div>
      <div className="border-t border-slate-900 dark:border-slate-100 pt-3 flex justify-between text-[10px] font-mono text-slate-500">
        <span>GURUGRAM / INDIA</span>
        <span>STATUTORY</span>
      </div>
    </div>
  );
}

/**
 * Modern Indian Professional: Sophisticated geometric credential panel.
 */
export function IndianGeometricMotif({ theme, className = '' }: ArtworkProps) {
  return (
    <div className={`p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-amber-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 shadow-lg ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl text-white font-bold shadow-md"
          style={{ backgroundColor: theme.primaryColor }}
        >
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Chartered Accountancy Practice
          </h4>
          <p className="text-xs text-slate-500">National Compliance & Corporate Advisory</p>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-400">MCA & ROC Secretarial</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">Active</span>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-400">GST Audit & Advisory</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">Verified Practice</span>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-400">Statutory Tax Assurance</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">Quarterly Audits</span>
        </div>
      </div>
    </div>
  );
}
