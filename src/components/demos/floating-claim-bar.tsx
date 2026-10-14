'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, ChevronUp, X } from 'lucide-react';

interface FloatingClaimBarProps {
  businessName: string;
}

export function FloatingClaimBar({ businessName }: FloatingClaimBarProps) {
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (search.includes('screenshot=true')) {
        setIsScreenshotMode(true);
      }
    }
  }, []);

  if (isScreenshotMode) return null;

  // WhatsApp Link Generation
  const rawPhone =
    process.env.NEXT_PUBLIC_PUNEET_WHATSAPP ||
    process.env.NEXT_PUBLIC_AGENCY_WHATSAPP ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    '919811122233';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  const encodedWhatsAppMsg = encodeURIComponent(
    `Hi, I just viewed the website preview for ${businessName} and want to discuss making it live.`
  );
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedWhatsAppMsg}`;

  if (isCollapsed) {
    return (
      <div className="fixed bottom-3 right-3 sm:right-6 sm:bottom-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/95 hover:bg-slate-900 text-white border border-slate-700/80 rounded-full shadow-lg backdrop-blur-md text-xs font-semibold transition hover:scale-105 active:scale-95 ring-1 ring-white/10"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Claim on WhatsApp</span>
          <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 left-3 sm:left-auto sm:right-6 sm:bottom-4 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto">
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-xl shadow-black/50 px-3 py-1.5 text-white ring-1 ring-white/10 flex items-center justify-between sm:justify-end gap-2.5 max-w-full">
        {/* Brand Indicator */}
        <div className="flex items-center gap-2 min-w-0 pr-1">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-200 truncate block max-w-[130px] sm:max-w-[220px]">
              {businessName}
            </span>
            <span className="text-[9px] text-emerald-400 font-medium hidden sm:block leading-none">
              Ready to launch in 48h
            </span>
          </div>
        </div>

        {/* Primary CTA: Claim on WhatsApp ONLY */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm shadow-emerald-950/30 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white text-emerald-600 shrink-0" />
            <span>Claim on WhatsApp</span>
          </a>

          {/* Minimize Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition shrink-0"
            title="Minimize"
            aria-label="Minimize claim banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
