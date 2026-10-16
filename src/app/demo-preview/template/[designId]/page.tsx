'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  STITCH_TEMPLATES,
  getStitchTemplate,
  StitchTemplateMeta,
} from '@/lib/demos/stitch-templates';
import {
  Monitor,
  Tablet,
  Smartphone,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  PhoneCall,
} from 'lucide-react';

interface TemplatePreviewPageProps {
  params: {
    designId: string;
  };
}

export default function TemplatePreviewPage({ params }: TemplatePreviewPageProps) {
  const router = useRouter();
  const currentTemplate = getStitchTemplate(params.designId) || STITCH_TEMPLATES[0];

  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showOrderModal, setShowOrderModal] = useState(false);

  const deviceWidths = {
    desktop: 'w-full h-full',
    tablet: 'w-[768px] h-[92vh] max-h-[1024px] rounded-2xl shadow-2xl border-8 border-slate-800',
    mobile: 'w-[390px] h-[85vh] max-h-[844px] rounded-[36px] shadow-2xl border-8 border-slate-800',
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Floating Control Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0 z-50">
        {/* Left: Back & Template Info */}
        <div className="flex items-center gap-3">
          <Link
            href="/demo-preview/templates"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">All Templates</span>
          </Link>

          <div className="h-4 w-px bg-slate-800" />

          {/* Quick Template Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white hidden md:inline">
              {currentTemplate.name}:
            </span>
            <select
              value={currentTemplate.id}
              onChange={(e) => router.push(`/demo-preview/template/${e.target.value}`)}
              className="bg-slate-800 border border-slate-700 text-xs text-amber-400 font-medium rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-amber-400 outline-none cursor-pointer"
            >
              {STITCH_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.conceptName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Device Viewport Controls */}
        <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
          <button
            onClick={() => setDevice('desktop')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              device === 'desktop'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Desktop View (100%)"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              device === 'tablet'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="h-3.5 w-3.5" />
            <span>Tablet</span>
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              device === 'mobile'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile View (390px)"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Mobile</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <a
            href={currentTemplate.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
            title="Open standalone HTML in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Open Standalone</span>
          </a>

          <button
            onClick={() => setShowOrderModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 rounded-lg shadow-md transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Order This Design</span>
          </button>
        </div>
      </header>

      {/* Main Isolated Viewport Area */}
      <main className="flex-1 bg-slate-950/80 flex items-center justify-center p-2 md:p-4 overflow-hidden relative">
        <div
          className={`transition-all duration-300 ease-in-out bg-white overflow-hidden relative ${deviceWidths[device]}`}
        >
          {/* Subtle mobile/tablet speaker notch for authentic realism */}
          {device === 'mobile' && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full z-40 pointer-events-none" />
          )}

          {/* Fully isolated iframe with zero style bleed */}
          <iframe
            src={currentTemplate.htmlUrl}
            title={currentTemplate.name}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-forms allow-popups"
          />
        </div>
      </main>

      {/* Order Website Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowOrderModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
                <Sparkles className="h-3 w-3" />
                <span>Selected Design: {currentTemplate.name}</span>
              </div>
              <h2 className="text-xl font-bold text-white">Deploy Website for Your CA Firm</h2>
              <p className="text-xs text-slate-400">
                GetVisible Digital Studio customizes this exact template for your practice with verified credentials, domain, and fast hosting.
              </p>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Turnaround: 48 to 72 hours for complete personalization</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>ICAI Guidelines: Strict zero-fabricated claims and ethical compliance</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Hosting & Security: SSL certificate, automated backups, and 99.9% uptime</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/proposals"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition"
              >
                <span>Generate Client Proposal</span>
              </Link>
              <a
                href="https://wa.me/911123456789?text=Hello%20GetVisible%2C%20I%20am%20interested%20in%20ordering%20the%20CA%20website%20template%3A%20"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>WhatsApp Us</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
