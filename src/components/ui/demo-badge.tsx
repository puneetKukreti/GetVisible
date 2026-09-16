import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DemoBadge({ className, size = 'default' }: { className?: string; size?: 'default' | 'sm' }) {
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

export function DemoModeBanner() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true' && process.env.DEMO_MODE !== 'true') {
    return null;
  }

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
      <span className="text-[11px] opacity-80">DEMO_MODE=true</span>
    </div>
  );
}
