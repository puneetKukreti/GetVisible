'use client';

import React, { useState } from 'react';
import { WebsiteDemoData, LeadData, WebsiteTheme, WebsiteLayout, WebsiteTemplate } from '@/types';
import { WatermarkBanner } from '@/components/demo-renderer/watermark-banner';
import { DemoRenderer } from '@/components/demo-renderer/demo-renderer';
import { DemoEditorModal } from '@/components/demos/demo-editor-modal';
import { CA_LAYOUTS } from '@/lib/demos/personalization';
import Link from 'next/link';
import { Sparkles, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

interface DemoClientProps {
  initialLead: LeadData;
  initialDemos: WebsiteDemoData[];
}

export function DemoClient({ initialLead, initialDemos }: DemoClientProps) {
  const [demos, setDemos] = useState<WebsiteDemoData[]>(initialDemos);
  const [activeVersion, setActiveVersion] = useState<number>(
    initialDemos.length > 0 ? initialDemos[0].version : 1
  );
  const [activeTheme, setActiveTheme] = useState<WebsiteTheme>(
    initialDemos.length > 0 ? initialDemos[0].theme : initialLead.websiteDemos?.[0]?.theme || {
      id: 'executive-navy',
      name: 'Executive Navy',
      primaryColor: '#1e3a8a',
      secondaryColor: '#1e293b',
      accentColor: '#2563eb',
      fontFamily: 'sans',
      style: 'corporate',
      borderRadius: 'md',
    }
  );
  const [activeLayout, setActiveLayout] = useState<WebsiteLayout>(
    initialDemos[0]?.design?.layout || 'MODERN_FINTECH'
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeDemo = demos.find((d) => d.version === activeVersion) || demos[0];

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/demos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: initialLead.id,
          themeId: activeTheme.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate demo concept');
      }

      setDemos((prev) => [data.demo, ...prev]);
      setActiveVersion(data.demo.version);
      setActiveTheme(data.demo.theme);
      if (data.demo.design?.layout) {
        setActiveLayout(data.demo.design.layout);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error generating demo');
    } finally {
      setGenerating(false);
    }
  };

  const handleDemoSaved = (updatedDemo: WebsiteDemoData) => {
    setDemos((prev) =>
      prev.map((d) => (d.id === updatedDemo.id ? updatedDemo : d))
    );
  };

  const availableVersions = demos.map((d) => d.version).sort((a, b) => b - a);

  // If no demo exists yet
  if (!activeDemo) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30">
            <Sparkles className="h-8 w-8 text-amber-400" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">No Website Demo Generated Yet</h1>
            <p className="mt-2 text-sm text-slate-400">
              {initialLead.businessName} has verified status: <strong className="text-amber-400">{initialLead.websiteStatus}</strong>.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-950/60 border border-red-800 p-3 text-xs text-red-300 text-left">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {initialLead.websiteStatus === 'NO_WEBSITE' ? (
            <div className="space-y-3">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3.5 text-sm shadow-lg transition disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Synthesizing Website Concept...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Personalized Concept (v1)</span>
                  </>
                )}
              </button>
              <Link
                href={`/leads/${initialLead.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Lead in CRM</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                Website concept generation is restricted to verified businesses with <strong>NO_WEBSITE</strong>. This business has status: <strong>{initialLead.websiteStatus}</strong>.
              </p>
              <Link
                href={`/leads/${initialLead.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Lead in CRM</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950">
      {/* Persistent Watermark Banner */}
      <WatermarkBanner
        leadId={initialLead.id}
        businessName={initialLead.businessName}
        currentTheme={activeTheme}
        layout={activeLayout}
        onLayoutChange={(newLayout) => setActiveLayout(newLayout)}
        onThemeChange={(newTheme) => setActiveTheme(newTheme)}
        onOpenEditor={() => setIsEditorOpen(true)}
        version={activeVersion}
        availableVersions={availableVersions}
        onSelectVersion={(v) => {
          setActiveVersion(v);
          const sel = demos.find((d) => d.version === v);
          if (sel) {
            setActiveTheme(sel.theme);
            if (sel.design?.layout) {
              setActiveLayout(sel.design.layout);
            }
          }
        }}
      />

      {/* Rendered Public Site Demonstration */}
      <div className="flex-1">
        <DemoRenderer
          content={activeDemo.content}
          theme={activeTheme}
          design={{
            ...activeDemo.design,
            layout: activeLayout,
            template: (activeLayout as WebsiteTemplate),
            theme: activeTheme,
            sectionOrder:
              (CA_LAYOUTS[activeLayout]?.sectionOrder && CA_LAYOUTS[activeLayout].sectionOrder.length > 0)
                ? CA_LAYOUTS[activeLayout].sectionOrder
                : (activeDemo.design?.sectionOrder && activeDemo.design.sectionOrder.length > 0)
                ? activeDemo.design.sectionOrder
                : CA_LAYOUTS.MODERN_INDIAN.sectionOrder,
          }}
        />


      </div>

      {/* Human Review & Edit Modal */}
      {isEditorOpen && (
        <DemoEditorModal
          demo={activeDemo}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSaved={handleDemoSaved}
        />
      )}
    </div>
  );
}
