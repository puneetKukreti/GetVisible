'use client';

import React from 'react';
import { WebsiteDemoData, WebsiteTemplate, WebsiteLayout } from '@/types';
import { DemoRenderer } from '@/components/demo-renderer/demo-renderer';
import { CA_LAYOUTS } from '@/lib/demos/personalization';
import { isStitchLayout } from '@/lib/demos/stitch-personalizer';
import { FloatingClaimBar } from '@/components/demos/floating-claim-bar';

interface PublicDemoViewProps {
  demo: WebsiteDemoData;
}

/**
 * PublicDemoView: Prospect-Facing Interactive Website Demonstration
 *
 * Requirements:
 * 1. Zero internal GetVisible CRM branding or watermarks.
 * 2. Zero admin editing buttons or watermark toolbar.
 * 3. Zero internal lead information exposed.
 * 4. Only the structured, personalized website is rendered with full native smooth scrolling.
 * 5. High-conversion floating WhatsApp conversion bar ("Claim on WhatsApp").
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

  const isKnownLayout =
    Boolean(CA_LAYOUTS[rawLayoutKey as WebsiteLayout]) || isStitchLayout(rawLayoutKey);

  const activeLayout: WebsiteLayout = isKnownLayout
    ? (rawLayoutKey as WebsiteLayout)
    : 'design-1-premium';

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
    'Your Practice';

  return (
    <div className="min-h-screen w-full relative bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Personalized Website Canvas */}
      <DemoRenderer
        content={contentObj}
        theme={themeObj}
        design={{
          ...demo.design,
          layout: activeLayout,
          template: (demo.design?.template || activeLayout) as WebsiteTemplate,
          theme: themeObj,
          sectionOrder,
        }}
        blueprint={demo.blueprint}
        demoId={demo.publicToken || demo.id}
        leadId={demo.leadId}
        version={demo.version}
      />

      {/* Floating Conversion Bar: ONLY Claim on WhatsApp */}
      <FloatingClaimBar businessName={businessName} />
    </div>
  );
}
