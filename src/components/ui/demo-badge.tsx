import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getActiveWorkspaceMode, WorkspaceMode } from '@/lib/workspace';

export interface DemoBadgeProps {
  className?: string;
  size?: 'default' | 'sm';
  variant?: 'demo' | 'pilot' | 'auto';
  isDemoData?: boolean;
}

export function DemoBadge({
  className,
  size = 'default',
  variant = 'auto',
  isDemoData,
}: DemoBadgeProps) {
  let resolvedMode: WorkspaceMode = 'demo';

  if (variant === 'pilot' || isDemoData === false) {
    resolvedMode = 'pilot';
  } else if (variant === 'demo' || isDemoData === true) {
    resolvedMode = 'demo';
  } else {
    resolvedMode = getActiveWorkspaceMode();
  }

  if (resolvedMode === 'pilot') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold tracking-wide select-none',
          size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
          className
        )}
        title="Real prospect sales record. Handled with strict data isolation."
      >
        <ShieldCheck className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        REAL/PILOT DATA
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold tracking-wide select-none',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        className
      )}
      title="Fictional simulated record for development and evaluation. Not a real business."
    >
      <AlertCircle className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      DEMO DATA
    </span>
  );
}

export function DemoModeBanner({ mode }: { mode?: WorkspaceMode }) {
  const currentMode = mode || getActiveWorkspaceMode();

  if (currentMode === 'pilot') {
    return (
      <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider bg-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] text-emerald-700 dark:text-emerald-300">
            REAL / PILOT SALES WORKSPACE
          </span>
          <span>
            Production sales pilot active. Records are real business prospects. Human-controlled outreach only — no automated messaging.
          </span>
        </div>
        <span className="text-[11px] opacity-80 font-mono">org-pilot-gurgaon</span>
      </div>
    );
  }

  // Demo mode
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-bold uppercase tracking-wider bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px]">
          DEMO MODE ACTIVE
        </span>
        <span>
          Explicit sandbox environment. All records are clearly fictional CA firms in Gurgaon / Delhi NCR. No external emails or calls are dispatched.
        </span>
      </div>
      <span className="text-[11px] opacity-80 font-mono">DEMO_MODE=true</span>
    </div>
  );
}
