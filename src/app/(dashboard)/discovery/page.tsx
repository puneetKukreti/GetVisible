'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, ArrowRight } from 'lucide-react';

export default function DiscoveryPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Lead Discovery</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Find and extract verified professional business leads across industries and locations.
        </p>
      </div>

      <Card className="border-dashed border-border/80 shadow-none bg-muted/5">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Search className="w-7 h-7" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-semibold text-foreground">
              Discovery Engine Cleared
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This section has been cleared and is awaiting your new discovery specifications and search provider integrations.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Link href="/campaigns">
              <Button size="sm" className="text-xs gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Go to Campaigns &amp; Outreach</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/leads">
              <Button size="sm" variant="outline" className="text-xs">
                View CRM Leads
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
