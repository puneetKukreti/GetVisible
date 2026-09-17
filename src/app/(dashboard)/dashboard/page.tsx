import React from 'react';
import Link from 'next/link';
import { LeadRepository } from '@/lib/db/repository';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';
import { computeSalesAnalytics } from '@/lib/analytics/service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LeadStatusBadge, WebsiteStatusBadge, OpportunityScoreBadge } from '@/components/ui/status-badge';
import { DemoBadge } from '@/components/ui/demo-badge';
import { Activity, ShieldCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { DashboardClient } from './dashboard-client';

import { getResolvedOrganizationId } from '@/lib/auth';
import { getDefaultOrganizationId, isPilotMode } from '@/lib/workspace';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const orgId = (await getResolvedOrganizationId()) || getDefaultOrganizationId();
  const pilotActive = isPilotMode();

  let analytics = null;
  let recentLeads = [] as any[];
  let jobs = [] as any[];
  let metrics = null as any;
  let dbError: string | null = null;

  try {
    analytics = await computeSalesAnalytics(orgId, { preset: 'LAST_30_DAYS' });
    metrics = await LeadRepository.getDashboardMetrics(orgId);
    const paginated = await LeadRepository.listLeads(orgId, { pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' });
    recentLeads = paginated.leads;
    jobs = await LeadRepository.getJobs(orgId);
  } catch (err: unknown) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  if (dbError || !analytics) {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive space-y-3">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span>Database Connection Error</span>
          </div>
          <p className="text-sm leading-relaxed">{dbError}</p>
          <p className="text-xs text-muted-foreground">
            Per production principles, fake data is never silently substituted. If you wish to run in local demo mode, set <code>DEMO_MODE=true</code> in your <code>.env</code> file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Interactive Sales Intelligence & Analytics Client */}
      <DashboardClient initialData={analytics} />

      {/* Main Bottom Grid: Recent Leads + System Safeguards & Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 border-t border-border/50">
        {/* Recent Leads (2 Columns) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>Recently Discovered Leads</span>
              <DemoBadge size="sm" variant={pilotActive ? 'pilot' : 'demo'} />
            </h2>
            <Link href="/leads" className="text-xs text-primary hover:underline font-medium">
              View all {analytics.funnel.totalLeads} leads
            </Link>
          </div>

          <div className="space-y-2">
            {recentLeads?.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-lg space-y-3 bg-card/30">
                <div className="text-sm font-semibold text-foreground">No leads in this workspace yet</div>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  This workspace is currently clean with zero records. Import real prospect leads via CSV to begin your sales pilot.
                </p>
                <div>
                  <Link href="/leads">
                    <Button size="sm" variant="default" className="text-xs">
                      Go to Leads & Import CSV
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              recentLeads?.map((lead) => (
              <Card key={lead.id} className="border-border/80 hover:border-border transition-colors">
                <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/leads/${lead.id}`} className="font-semibold text-xs text-foreground hover:text-primary transition-colors">
                        {lead.businessName}
                      </Link>
                      <LeadStatusBadge status={lead.leadStatus} />
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                      <span>{lead.city}</span>
                      <span>•</span>
                      <WebsiteStatusBadge status={lead.websiteStatus} />
                      <span>•</span>
                      <span>{formatDate(lead.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground font-medium">Opportunity</div>
                      <OpportunityScoreBadge score={lead.opportunityScore} />
                    </div>
                    <Link href={`/leads/${lead.id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                        Inspect
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar: Asynchronous Jobs & Compliance Safeguards */}
        <div className="space-y-4">
          {/* Active Jobs Card */}
          <Card className="border-border/80 shadow-none">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  Background Jobs
                </span>
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                  {jobs?.length || 0} tracked
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2.5">
              {jobs?.map((job) => (
                <div key={job.id} className="p-2.5 rounded-md border border-border/60 bg-muted/20 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-foreground font-mono">{job.type}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        job.status === 'RUNNING'
                          ? 'bg-blue-500/15 text-blue-600'
                          : job.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Progress: {job.progress}%</span>
                    <span>{formatDate(job.createdAt)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Compliance & Safeguards Health */}
          <Card className="border-border/80 shadow-none bg-muted/10">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Compliance & Consent Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-xs space-y-2 text-muted-foreground">
              <div className="flex justify-between items-center py-1 border-b border-border/50 text-[11px]">
                <span>Suppression Records</span>
                <span className="font-mono font-bold text-foreground">{metrics?.suppressionCount || 0}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50 text-[11px]">
                <span>Human Approval Rule</span>
                <span className="font-semibold text-emerald-600">ENFORCED</span>
              </div>
              <div className="flex justify-between items-center py-1 text-[11px]">
                <span>Multi-Tenant Isolation</span>
                <span className="font-semibold text-emerald-600">ACTIVE</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
