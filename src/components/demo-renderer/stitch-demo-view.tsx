'use client';

import React, { useState, useRef, useEffect } from 'react';
import { WebsiteContent, WebsiteDesign } from '@/types';
import { RefreshCw, ExternalLink } from 'lucide-react';

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
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Determine iframe source URL
  const targetId = demoId || leadId || 'preview';
  const iframeSrc = `/api/demos/${encodeURIComponent(targetId)}/html?layout=${encodeURIComponent(layout)}&v=${version}&k=${reloadKey}`;

  // Robust lifecycle listener: ensures loader is NEVER stuck on screen
  useEffect(() => {
    setLoading(true);
    setLoadError(false);

    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setLoading(false);
      setLoadError(false);
      try {
        iframe.contentWindow?.focus();
      } catch {}
    };

    const handleError = () => {
      setLoading(false);
      setLoadError(true);
    };

    // Check if already loaded from browser cache
    try {
      if (
        iframe.contentDocument &&
        (iframe.contentDocument.readyState === 'complete' ||
          iframe.contentDocument.readyState === 'interactive')
      ) {
        setLoading(false);
      }
    } catch {}

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    // Hard fallback safety timer: dismiss loader after 1200ms under any network conditions
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
      clearTimeout(safetyTimer);
    };
  }, [iframeSrc, reloadKey]);

  return (
    <div
      className={`relative w-full h-full min-h-screen bg-slate-900 ${className}`}
      onWheel={(e) => {
        try {
          iframeRef.current?.contentWindow?.scrollBy({ top: e.deltaY, behavior: 'auto' });
        } catch {}
      }}
    >
      {/* Loading Overlay with graceful auto-fade */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-xs z-10 transition-opacity duration-300">
          <div className="w-9 h-9 rounded-full border-3 border-amber-500/30 border-t-amber-500 animate-spin mb-3 shadow-lg" />
          <p className="text-xs text-amber-200/90 font-medium tracking-wide">
            Rendering Interactive Website Preview…
          </p>
        </div>
      )}

      {/* Error state if iframe fails to load */}
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-20 p-6 text-center text-slate-100">
          <div className="max-w-md space-y-4">
            <h3 className="text-base font-bold text-amber-400">Website Preview Taking Longer Than Expected</h3>
            <p className="text-xs text-slate-400">
              You can refresh the preview or open the personalized website concept directly in a new tab.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Preview</span>
              </button>
              <a
                href={iframeSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs inline-flex items-center gap-1.5 border border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in New Tab</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        key={reloadKey}
        src={iframeSrc}
        title={content?.brand?.businessName || 'Website Demo'}
        className="w-full h-full min-h-screen border-0 block bg-white"
        style={{
          height: '100vh',
          minHeight: '100vh',
          width: '100%',
          display: 'block',
        }}
        scrolling="yes"
        onLoad={() => {
          setLoading(false);
          setLoadError(false);
        }}
        onError={() => {
          setLoading(false);
          setLoadError(true);
        }}
        sandbox="allow-scripts allow-forms allow-popups"
      />
    </div>
  );
}

