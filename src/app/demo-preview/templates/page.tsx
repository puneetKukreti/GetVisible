'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutTemplate, ArrowLeft, Sparkles } from 'lucide-react';

export default function TemplatesPreviewPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 flex flex-col items-center justify-center">
      <Card className="max-w-md w-full border-dashed border-border/80 bg-muted/5 shadow-none">
        <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <LayoutTemplate className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-foreground">
              Demo Templates Cleared
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All previous demo templates have been removed. This section is cleared and awaiting your new template configurations and layouts.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Link href="/demos">
              <Button size="sm" variant="outline" className="text-xs gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Demos</span>
              </Button>
            </Link>
            <Link href="/campaigns">
              <Button size="sm" className="text-xs gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Campaigns</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
