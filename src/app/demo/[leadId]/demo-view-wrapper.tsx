'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { WebsiteDemoData, LeadData } from '@/types';
import { PublicDemoView } from './public-demo-view';
import { DemoClient } from './demo-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, AlertCircle, ArrowLeft, Building } from 'lucide-react';

interface DemoViewWrapperProps {
  tokenOrId: string;
  initialPublicDemo?: WebsiteDemoData | null;
  initialLead?: LeadData | null;
  initialDemos?: WebsiteDemoData[];
}

export function DemoViewWrapper({
  tokenOrId,
  initialPublicDemo,
  initialLead,
  initialDemos = [],
}: DemoViewWrapperProps) {
  const [publicDemo, setPublicDemo] = useState<WebsiteDemoData | null>(initialPublicDemo ?? null);
  const [lead, setLead] = useState<LeadData | null>(initialLead ?? null);
  const [demos, setDemos] = useState<WebsiteDemoData[]>(initialDemos);
  const [loading, setLoading] = useState<boolean>(!initialPublicDemo && !initialLead);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialPublicDemo) {
      setPublicDemo(initialPublicDemo);
      setLoading(false);
      return;
    }
    if (initialLead) {
      setLead(initialLead);
      setDemos(initialDemos);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadDemo() {
      setLoading(true);
      setIsNotFound(false);
      setErrorMsg(null);

      try {
        let res = await fetch(`/api/demos/${encodeURIComponent(tokenOrId)}`, { cache: 'no-store' });

        // If 404 in pilot workspace, attempt auto-healing from browser CSV backup
        if (
          res.status === 404 &&
          typeof window !== 'undefined' &&
          document.cookie.includes('getvisible_workspace_mode=pilot')
        ) {
          const backupCsv = localStorage.getItem('getvisible_pilot_csv_backup');
          if (backupCsv && backupCsv.trim().length > 0) {
            try {
              const importRes = await fetch('/api/discovery/csv-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csvContent: backupCsv }),
              });
              if (importRes.ok) {
                res = await fetch(`/api/demos/${encodeURIComponent(tokenOrId)}`, { cache: 'no-store' });
              }
            } catch {
              // Ignore background auto-heal failure
            }
          }
        }

        if (res.status === 404) {
          if (isMounted) {
            setIsNotFound(true);
            setLoading(false);
          }
          return;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        if (isMounted) {
          if (data.isPublic && data.demo) {
            setPublicDemo(data.demo);
          } else if (data.lead) {
            setLead(data.lead);
            setDemos(data.demos || (data.demo ? [data.demo] : []));
          } else if (data.demo) {
            setPublicDemo(data.demo);
          } else {
            setIsNotFound(true);
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to retrieve demo concept');
          setIsNotFound(true);
          setLoading(false);
        }
      }
    }

    loadDemo();
    return () => {
      isMounted = false;
    };
  }, [tokenOrId, initialPublicDemo, initialLead, initialDemos]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-4 max-w-sm">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
            <Building className="w-5 h-5 text-amber-500 absolute inset-0 m-auto" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-100">Loading Demonstration Concept...</h3>
            <p className="text-xs text-slate-400">
              Retrieving personalized website layout, practice areas, and credentials.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isNotFound || (!publicDemo && !lead)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <Card className="max-w-md p-8 bg-slate-900 border-slate-800 text-slate-100 space-y-5">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold">Demo Concept Not Found</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Could not find a website demo concept for token or lead <code className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-xs text-amber-400">{tokenOrId}</code>.
            </p>
            {errorMsg && (
              <p className="text-[11px] text-rose-400 font-mono mt-1">{errorMsg}</p>
            )}
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/leads">
              <Button size="sm" className="gap-2 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Leads Pipeline</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Prospect-Facing Public Demo
  if (publicDemo) {
    return <PublicDemoView demo={publicDemo} />;
  }

  // Internal Sales Specialist Preview & Editor
  if (lead) {
    return <DemoClient initialLead={lead} initialDemos={demos} />;
  }

  return null;
}
