'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [iframeHeight, setIframeHeight] = useState<number>(1200);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Determine iframe source URL
  const targetId = demoId || leadId || 'preview';
  const iframeSrc = `/api/demos/${encodeURIComponent(targetId)}/html?layout=${encodeURIComponent(layout)}&v=${version}`;

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data && event.data.type === 'GETVISIBLE_IFRAME_HEIGHT' && typeof event.data.height === 'number') {
        if (event.data.height > 200) {
          setIframeHeight(event.data.height);
          setLoading(false);
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
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
        className="w-full border-0 block"
        style={{
          height: iframeHeight > 0 ? `${iframeHeight}px` : '100vh',
          width: '100%',
        }}
        onLoad={() => {
          setLoading(false);
          try {
            iframeRef.current?.contentWindow?.postMessage({ type: 'GETVISIBLE_REQUEST_HEIGHT' }, '*');
          } catch (e) {}
        }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
