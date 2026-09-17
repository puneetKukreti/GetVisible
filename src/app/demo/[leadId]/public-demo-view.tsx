'use client';

import React from 'react';
import { WebsiteDemoData, WebsiteTemplate, WebsiteLayout } from '@/types';
import { DemoRenderer } from '@/components/demo-renderer/demo-renderer';
import { CA_LAYOUTS } from '@/lib/demos/personalization';

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
    'MODERN_INDIAN';

  const activeLayout: WebsiteLayout =
    (CA_LAYOUTS[rawLayoutKey as WebsiteLayout]
      ? (rawLayoutKey as WebsiteLayout)
      : null) ||
    (rawLayoutKey === 'CA_ACCOUNTING_PROFESSIONAL' ? 'MODERN_INDIAN' : null) ||
    'MODERN_INDIAN';

  const rawSectionOrder =
    demo.design?.sectionOrder ||
    contentObj?.design?.sectionOrder ||
    CA_LAYOUTS[activeLayout]?.sectionOrder;

  const sectionOrder =
    Array.isArray(rawSectionOrder) && rawSectionOrder.length > 0
      ? rawSectionOrder
      : CA_LAYOUTS.MODERN_INDIAN.sectionOrder;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
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
      />
    </div>
  );

}

