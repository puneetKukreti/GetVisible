import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Clock, LucideIcon } from 'lucide-react';

interface Phase2FeaturePreviewProps {
  title: string;
  description: string;
  icon: LucideIcon;
  phase1Foundation: string[];
  phase2Roadmap: string[];
  actionLabel?: string;
}

export function Phase2FeaturePreview({
  title,
  description,
  icon: Icon,
  phase1Foundation,
  phase2Roadmap,
  actionLabel = 'Launch Pipeline',
}: Phase2FeaturePreviewProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
            Phase 2 Pipeline
          </span>
        </div>
        <p className="text-xs text-muted-foreground max-w-2xl">{description}</p>
      </div>

      {/* Main Preview Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Architectural Foundation & Phasing</CardTitle>
          <CardDescription className="text-xs">
            Phase 1 established the database models, tenant security, and provider abstractions for this module.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phase 1 established */}
            <div className="p-3.5 rounded-md border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <div className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Phase 1 Completed Foundation</span>
              </div>
              <ul className="space-y-1 text-[11px] text-muted-foreground list-disc list-inside">
                {phase1Foundation.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Phase 2 queue */}
            <div className="p-3.5 rounded-md border border-border bg-muted/20 space-y-2">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                <span>Phase 2 Implementation Queue</span>
              </div>
              <ul className="space-y-1 text-[11px] text-muted-foreground list-disc list-inside">
                {phase2Roadmap.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-border/80">
            <Link href="/leads">
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Leads</span>
              </Button>
            </Link>

            <Button
              size="sm"
              disabled={true}
              disabledExplanation="This capability is scheduled for Phase 2 and is currently disabled by system architecture."
              className="text-xs"
            >
              {actionLabel} (Phase 2)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
