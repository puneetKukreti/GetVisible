'use client';

import React, { useState, useEffect } from 'react';
import { WebsiteDemoData, WebsiteTemplate, WebsiteLayout } from '@/types';
import { DemoRenderer } from '@/components/demo-renderer/demo-renderer';
import { CA_LAYOUTS } from '@/lib/demos/personalization';
import {
  MessageCircle,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Clock,
  Phone,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react';

interface PublicDemoViewProps {
  demo: WebsiteDemoData;
}

/**
 * PublicDemoView: Prospect-facing website concept view.
 *
 * CRITICAL PRIVACY & SECURITY RULES:
 * 1. Zero GetVisible dashboard chrome (no sidebar, no header, no CRM controls).
 * 2. Zero admin editing buttons or watermark toolbar.
 * 3. Zero internal lead information exposed (no internal lead IDs, organization IDs, scores, notes, or sales status).
 * 4. Only the structured, personalized website is rendered.
 * 5. Full responsiveness across mobile, tablet, and desktop screens.
 * 6. High-conversion floating bottom bar to claim the site or request free changes (hidden in screenshot mode).
 */
export function PublicDemoView({ demo }: PublicDemoViewProps) {
  const contentObj =
    typeof demo.content === 'string' ? JSON.parse(demo.content) : demo.content;
  const themeObj =
    typeof demo.theme === 'string' ? JSON.parse(demo.theme) : demo.theme;

  const rawLayoutKey =
    demo.design?.layout ||
    contentObj?.design?.layout ||
    demo.templateId ||
    'design-1-premium';

  const activeLayout: WebsiteLayout =
    (CA_LAYOUTS[rawLayoutKey as WebsiteLayout]
      ? (rawLayoutKey as WebsiteLayout)
      : null) ||
    (rawLayoutKey === 'CA_ACCOUNTING_PROFESSIONAL' ? 'design-1-premium' : null) ||
    'design-1-premium';

  const rawSectionOrder =
    demo.design?.sectionOrder ||
    contentObj?.design?.sectionOrder ||
    CA_LAYOUTS[activeLayout]?.sectionOrder;

  const sectionOrder =
    Array.isArray(rawSectionOrder) && rawSectionOrder.length > 0
      ? rawSectionOrder
      : (CA_LAYOUTS[activeLayout]?.sectionOrder || CA_LAYOUTS.MODERN_INDIAN.sectionOrder);

  const businessName =
    contentObj?.brand?.businessName ||
    demo.content?.brand?.businessName ||
    'Your Business';

  // 1. Detect automated screenshot mode (?screenshot=true in URL)
  const [isScreenshotMode, setIsScreenshotMode] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form State for "Request Free Changes"
  const [changeOptions, setChangeOptions] = useState<{
    changeColors: boolean;
    updateServices: boolean;
    callMe: boolean;
  }>({
    changeColors: false,
    updateServices: true,
    callMe: false,
  });
  const [callTime, setCallTime] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (search.includes('screenshot=true')) {
        setIsScreenshotMode(true);
      }
    }
  }, []);

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

  // Handle Form Submission
  const handleSubmitChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const selectedList: string[] = [];
    if (changeOptions.changeColors) selectedList.push('Change colors & styling');
    if (changeOptions.updateServices) selectedList.push('Update services & practice areas');
    if (changeOptions.callMe) selectedList.push(`Call me${callTime ? ` at ${callTime}` : ''}`);

    if (selectedList.length === 0 && !notes.trim()) {
      selectedList.push('General review request');
    }

    try {
      const targetId = demo.publicToken || demo.id;
      const res = await fetch(`/api/demos/${encodeURIComponent(targetId)}/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changes: selectedList,
          callTime: changeOptions.callMe ? callTime : undefined,
          phone: contactPhone || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 pb-28 md:pb-24">
      {/* Personalized Website Canvas */}
      <DemoRenderer
        content={contentObj}
        theme={themeObj}
        design={{
          ...demo.design,
          layout: activeLayout,
          template: activeLayout as WebsiteTemplate,
          theme: themeObj,
          sectionOrder,
        }}
        blueprint={demo.blueprint}
        demoId={demo.publicToken || demo.id}
        leadId={demo.leadId}
        version={demo.version}
      />

      {/* Floating Bottom Conversion Bar (Hidden when ?screenshot=true) */}
      {!isScreenshotMode && (
        <>
          {isCollapsed ? (
            /* Minimized Sleek Pill */
            <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-950/95 hover:bg-slate-900 text-white border border-slate-700/80 rounded-full shadow-2xl backdrop-blur-md text-xs font-semibold transition hover:scale-105 active:scale-95 ring-1 ring-white/10"
              >
                <span>💬 Claim This Site</span>
                <ChevronUp className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          ) : (
            /* Expanded Full Floating Bar */
            <div className="fixed bottom-3 inset-x-3 md:bottom-5 md:max-w-4xl md:mx-auto z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/70 p-3 md:p-4 text-white ring-1 ring-white/10 space-y-2.5">
                {/* Header row with badge & minimize toggle button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
                      <span>✨ Preview built for {businessName}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-100 leading-snug">
                      Want this website live on your own .in / .com domain in 48 hours?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCollapsed(true)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition shrink-0"
                    title="Minimize"
                    aria-label="Minimize preview banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Conversion Buttons Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-0.5">
                  {/* Primary CTA Button (Emerald green, WhatsApp icon) */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.01] active:scale-95 text-center"
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-emerald-600 shrink-0" />
                    <span>Claim Website on WhatsApp</span>
                  </a>

                  {/* Secondary Button: Request Free Changes */}
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-900 text-slate-200 border border-slate-600 hover:border-slate-400 font-semibold rounded-xl text-xs sm:text-sm transition-all hover:scale-[1.01] active:scale-95 text-center"
                  >
                    {isSubmitted ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-emerald-300">Changes Requested ✓</span>
                      </>
                    ) : (
                      <>
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Request Free Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Request Free Changes Modal Dialog */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-lg w-full p-5 sm:p-6 text-white shadow-2xl relative animate-in zoom-in-95 duration-200 space-y-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>

                {isSubmitted ? (
                  /* Success Confirmation State */
                  <div className="text-center py-6 space-y-4">
                    <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-white">Request Received!</h3>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                        We have reserved your concept for <strong className="text-amber-400">{businessName}</strong> and notified Puneet. We will review your preferences and get in touch shortly.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chat on WhatsApp Directly</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition"
                      >
                        Return to Preview
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Change Request Form */
                  <form onSubmit={handleSubmitChanges} className="space-y-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-semibold border border-amber-500/20">
                        <Sparkles className="w-3 h-3" />
                        <span>Free Customization &amp; Revision</span>
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        Request Free Changes for {businessName}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Select the adjustments you want. We will fine-tune your preview and lock in your ₹9,999 launch package.
                      </p>
                    </div>

                    {/* Quick Selection Checkboxes */}
                    <div className="space-y-2.5 pt-1">
                      {/* Checkbox 1: Colors */}
                      <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition select-none">
                        <input
                          type="checkbox"
                          checked={changeOptions.changeColors}
                          onChange={(e) =>
                            setChangeOptions((prev) => ({ ...prev, changeColors: e.target.checked }))
                          }
                          className="mt-0.5 h-4 w-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-slate-100 block">
                            Change colors &amp; design styling
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            Match your existing firm logo, corporate palette, or preferred font aesthetic.
                          </span>
                        </div>
                      </label>

                      {/* Checkbox 2: Services */}
                      <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition select-none">
                        <input
                          type="checkbox"
                          checked={changeOptions.updateServices}
                          onChange={(e) =>
                            setChangeOptions((prev) => ({ ...prev, updateServices: e.target.checked }))
                          }
                          className="mt-0.5 h-4 w-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-slate-100 block">
                            Update services &amp; practice specializations
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            Add or adjust key areas like GST, Direct Tax, Statutory Audit, Corporate Law, or Transfer Pricing.
                          </span>
                        </div>
                      </label>

                      {/* Checkbox 3: Call me */}
                      <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition select-none">
                        <input
                          type="checkbox"
                          checked={changeOptions.callMe}
                          onChange={(e) =>
                            setChangeOptions((prev) => ({ ...prev, callMe: e.target.checked }))
                          }
                          className="mt-0.5 h-4 w-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                        />
                        <div className="space-y-0.5 flex-1">
                          <span className="text-xs font-semibold text-slate-100 block">
                            Call me at preferred time
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            Schedule a quick 5-minute walkthrough to review the concept over phone or Google Meet.
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Conditional Call Time & Phone Inputs */}
                    {changeOptions.callMe && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 animate-in fade-in duration-150">
                        <div>
                          <label className="block text-[11px] font-semibold text-amber-300 mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Preferred Day &amp; Time</span>
                          </label>
                          <input
                            type="text"
                            value={callTime}
                            onChange={(e) => setCallTime(e.target.value)}
                            placeholder="e.g. Tomorrow at 11:30 AM"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-amber-300 mb-1 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>Your Direct Phone / WhatsApp</span>
                          </label>
                          <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="e.g. +91 98111..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    )}

                    {/* Notes Textarea */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Any specific additions or revisions? (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Please highlight our 15 years of forensic audit experience and add our partner profile."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                      />
                    </div>

                    {submitError && (
                      <p className="text-xs text-rose-400 font-medium">{submitError}</p>
                    )}

                    {/* Submit Actions */}
                    <div className="pt-2 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <span>Submit Changes &amp; Reserve Domain</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
