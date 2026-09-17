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
  const activeLayout: WebsiteLayout =
    demo.design?.layout || (demo.templateId as WebsiteTemplate) || 'MODERN_FINTECH';

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
      <DemoRenderer
        content={demo.content}
        theme={demo.theme}
        design={{
          ...demo.design,
          layout: activeLayout,
          template: activeLayout as WebsiteTemplate,
          theme: demo.theme,
          sectionOrder:
            CA_LAYOUTS[activeLayout]?.sectionOrder || demo.design?.sectionOrder || [],
        }}
      />
    </div>
  );
}
