'use client';

import React, { useState } from 'react';
import { WebsiteDemoData, LeadData, WebsiteTheme, WebsiteLayout, WebsiteTemplate } from '@/types';
import { WatermarkBanner } from '@/components/demo-renderer/watermark-banner';
import { DemoRenderer } from '@/components/demo-renderer/demo-renderer';
import { DemoEditorModal } from '@/components/demos/demo-editor-modal';
import { CA_LAYOUTS } from '@/lib/demos/personalization';
import { INDIAN_CA_ARCHETYPES } from '@/lib/demos/ca-archetypes';
import { getTemplate } from '@/lib/demos/templates';
import Link from 'next/link';
import { Sparkles, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { FloatingClaimBar } from '@/components/demos/floating-claim-bar';

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
    initialDemos[0]?.design?.layout || 'design-1-premium'
  );
  const [selectedArchetype, setSelectedArchetype] = useState<string>('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeDemo: WebsiteDemoData =
    demos.find((d) => d.version === activeVersion) ||
    demos[0] ||
    ({
      id: `demo-${initialLead.id}-v1`,
      leadId: initialLead.id,
      organizationId: initialLead.organizationId || 'org-demo-gurgaon',
      templateId: 'design-1-premium',
      version: 1,
      generationStatus: 'COMPLETED',
      approvalStatus: 'APPROVED',
      publicToken: `token-${initialLead.id}`,
      viewCount: 0,
      theme: activeTheme,
      content: {
        brand: { businessName: initialLead.businessName },
        location: { city: initialLead.city, address: initialLead.address },
        contact: { publicPhone: initialLead.publicPhone, publicEmail: initialLead.publicEmail },
        meta: { profession: initialLead.profession },
      } as any,
      design: {
        layout: activeLayout,
        template: activeLayout as WebsiteTemplate,
        theme: activeTheme,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as WebsiteDemoData);

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
          templateId: selectedArchetype || undefined,
          layout: selectedArchetype || activeLayout,
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

  // Live content adaptation when switching between the 7 CA archetypes in the top banner
  const renderedContent = React.useMemo(() => {
    if (!activeDemo) return null;
    if (INDIAN_CA_ARCHETYPES.some((a) => a.id === activeLayout)) {
      const archetypeBuilder = getTemplate(activeLayout);
      return archetypeBuilder.buildContent(
        {
          businessName: initialLead.businessName,
          profession: initialLead.profession,
          city: initialLead.city,
          address: initialLead.address,
          publicEmail: initialLead.publicEmail,
          publicPhone: initialLead.publicPhone,
          source: initialLead.source,
        },
        activeTheme,
        {
          layout: activeLayout,
          template: (activeLayout as WebsiteTemplate),
          theme: activeTheme,
          sectionOrder: CA_LAYOUTS[activeLayout]?.sectionOrder || CA_LAYOUTS.MODERN_INDIAN.sectionOrder,
          heroLayout: CA_LAYOUTS[activeLayout]?.heroLayout,
          servicesLayout: CA_LAYOUTS[activeLayout]?.servicesLayout,
          features: CA_LAYOUTS[activeLayout]?.features,
          contentDensity: CA_LAYOUTS[activeLayout]?.contentDensity,
        }
      );
    }
    return activeDemo.content;
  }, [activeLayout, activeTheme, activeDemo, initialLead]);

  const handleDemoSaved = (updatedDemo: WebsiteDemoData) => {
    setDemos((prev) =>
      prev.map((d) => (d.id === updatedDemo.id ? updatedDemo : d))
    );
  };

  const availableVersions = demos.length > 0 ? demos.map((d) => d.version).sort((a, b) => b - a) : [1];

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
      <div className="flex-1 min-h-[calc(100vh-52px)]">
        <DemoRenderer
          content={renderedContent || activeDemo.content}
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
          blueprint={activeDemo.blueprint}
          demoId={activeDemo?.id}
          leadId={initialLead.id}
          version={activeVersion}
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

      {/* Sleek Floating Claim Bar (ONLY Claim on WhatsApp) */}
      <FloatingClaimBar
        businessName={initialLead.businessName}
      />
    </div>
  );
}
