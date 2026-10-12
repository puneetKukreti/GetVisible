import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ArrowRight, MessageSquare, Users, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Agency Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Executive overview of client acquisition, website concepts, and conversion pipeline.
        </p>
      </div>

      <Card className="border-dashed border-border/80 shadow-none bg-muted/5">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <LayoutDashboard className="w-7 h-7" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-semibold text-foreground">
              Dashboard Cleared
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This dashboard has been cleared for now and is awaiting your upcoming custom layout and KPI requirements.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <Link href="/campaigns">
              <Button size="sm" className="text-xs gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Campaigns &amp; Outreach</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/leads">
              <Button size="sm" variant="outline" className="text-xs gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Leads CRM</span>
              </Button>
            </Link>
            <Link href="/proposals">
              <Button size="sm" variant="outline" className="text-xs gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Proposals &amp; Pricing</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
