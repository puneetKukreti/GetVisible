'use client';

import React, { useState } from 'react';
import { WebsiteDemoData, WebsiteContent } from '@/types';
import { X, Save, CheckCircle, AlertTriangle } from 'lucide-react';

interface DemoEditorModalProps {
  demo: WebsiteDemoData;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedDemo: WebsiteDemoData) => void;
}

export function DemoEditorModal({ demo, isOpen, onClose, onSaved }: DemoEditorModalProps) {
  const [headline, setHeadline] = useState(demo.content.hero.headline);
  const [subheadline, setSubheadline] = useState(demo.content.hero.subheadline);
  const [tagline, setTagline] = useState(demo.content.brand.tagline);
  const [aboutStory, setAboutStory] = useState(demo.content.about.body);
  const [officeHours, setOfficeHours] = useState(demo.content.location.officeHours);
  const [services, setServices] = useState(demo.content.services.items);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleServiceConfirmation = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, isConfirmed: !s.isConfirmed } : s))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updatedContent: WebsiteContent = {
        ...demo.content,
        brand: {
          ...demo.content.brand,
          tagline,
          provenance: 'USER_ENTERED',
        },
        hero: {
          ...demo.content.hero,
          headline,
          subheadline,
          provenance: 'USER_ENTERED',
        },
        about: {
          ...demo.content.about,
          body: aboutStory,
          provenance: 'USER_ENTERED',
        },
        location: {
          ...demo.content.location,
          officeHours,
        },
        services: {
          ...demo.content.services,
          items: services,
        },
      };

      const res = await fetch(`/api/demos/${demo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updatedContent }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save demo edits');
      }

      onSaved(json.demo);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Edit Demo Concept Content
            </h3>
            <p className="text-xs text-slate-500">
              {demo.content.brand.businessName} (v{demo.version})
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Brand Tagline */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Brand Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Hero Headline */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hero Headline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Hero Subheadline */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hero Subheadline
            </label>
            <textarea
              rows={3}
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* About Story */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              About Practice Narrative
            </label>
            <textarea
              rows={4}
              value={aboutStory}
              onChange={(e) => setAboutStory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Office Hours */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Office Hours
            </label>
            <input
              type="text"
              value={officeHours}
              onChange={(e) => setOfficeHours(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Services Confirmation Controls */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Practice Areas (Toggle Confirmed vs Suggested)
            </label>
            <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {srv.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleServiceConfirmation(srv.id)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                      srv.isConfirmed
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                    }`}
                  >
                    {srv.isConfirmed ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        <span>Confirmed</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                        <span>Suggested</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Saving...' : 'Save Edits'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
