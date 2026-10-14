'use client';

import React, { useState, useRef } from 'react';
import { WebsiteContent, WebsiteDesign } from '@/types';

interface StitchDemoViewProps {
  demoId?: string;
  leadId?: string;
  layout?: string;
  version?: number;
  content?: WebsiteContent;
  design?: WebsiteDesign;
  className?: string;
}

export function StitchDemoView({
  demoId,
  leadId,
  layout = 'design-1-premium',
  version = 1,
  content,
  className = '',
}: StitchDemoViewProps) {
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Determine iframe source URL
  const targetId = demoId || leadId || 'preview';
  const iframeSrc = `/api/demos/${encodeURIComponent(targetId)}/html?layout=${encodeURIComponent(layout)}&v=${version}`;

  return (
    <div
      className={`relative w-full h-full min-h-screen ${className}`}
      onWheel={(e) => {
        try {
          iframeRef.current?.contentWindow?.scrollBy({ top: e.deltaY, behavior: 'auto' });
        } catch {}
      }}
    >
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 z-10 pointer-events-none transition-opacity">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin mb-3" />
          <p className="text-xs text-slate-300 font-medium">Loading Website Preview...</p>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title={content?.brand?.businessName || 'Website Demo'}
        className="w-full h-full min-h-screen border-0 block"
        style={{
          height: '100vh',
          minHeight: '100vh',
          width: '100%',
          display: 'block',
        }}
        scrolling="yes"
        onLoad={() => {
          setLoading(false);
          try {
            iframeRef.current?.contentWindow?.focus();
          } catch {}
        }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
