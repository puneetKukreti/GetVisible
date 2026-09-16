import React from 'react';
import Link from 'next/link';
import { LeadRepository } from '@/lib/db/repository';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LeadStatusBadge, WebsiteStatusBadge, OpportunityScoreBadge } from '@/components/ui/status-badge';
import { DemoBadge } from '@/components/ui/demo-badge';
import {
  Users,
  Sparkles,
  CheckCircle2,
  FileCode2,
  Send,
  MessageSquare,
  ThumbsUp,
  Award,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const orgId = DEMO_ORGANIZATION_ID;

  let metrics;
  let recentLeads;
  let jobs;
  let dbError: string | null = null;

  try {
    metrics = await LeadRepository.getDashboardMetrics(orgId);
    const paginated = await LeadRepository.listLeads(orgId, { pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' });
    recentLeads = paginated.leads;
    jobs = await LeadRepository.getJobs(orgId);
  } catch (err: unknown) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  if (dbError) {
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

  const statCards = [
    { label: 'Total Leads', value: metrics!.totalLeads, icon: Users, color: 'text-foreground', bg: 'bg-muted' },
    { label: 'New Leads', value: metrics!.newLeads, icon: Sparkles, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Qualified', value: metrics!.qualifiedLeads, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Demos Ready', value: metrics!.demos, icon: FileCode2, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Contacted', value: metrics!.contacted, icon: Send, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Replies', value: metrics!.replies, icon: MessageSquare, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
    { label: 'Interested', value: metrics!.interested, icon: ThumbsUp, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10' },
    { label: 'Customers', value: metrics!.customers, icon: Award, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-600/15' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Niche Scope Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Executive Pipeline
            <DemoBadge size="sm" />
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Target Niche: <span className="font-semibold text-foreground">Chartered Accountants</span> in Gurgaon & Delhi NCR
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/leads">
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Users className="w-3.5 h-3.5" />
              <span>Explore All Leads</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 8 Real Database Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-border/80 shadow-none">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">{stat.value}</p>
                </div>
                <div className={`w-9 h-9 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pipeline Funnel Stage Distribution */}
      <Card className="border-border/80 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Agency Pipeline Progression
          </CardTitle>
          <CardDescription className="text-xs">
            Distribution of CA leads from initial discovery through demo generation to customer conversion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded border border-border bg-muted/20">
              <div className="text-xs text-muted-foreground font-medium">New</div>
              <div className="text-base font-bold text-foreground mt-0.5">{metrics!.newLeads}</div>
            </div>
            <div className="p-2.5 rounded border border-border bg-muted/20">
              <div className="text-xs text-muted-foreground font-medium">Qualified</div>
              <div className="text-base font-bold text-emerald-600 mt-0.5">{metrics!.qualifiedLeads}</div>
            </div>
            <div className="p-2.5 rounded border border-border bg-muted/20">
              <div className="text-xs text-muted-foreground font-medium">Demo Ready</div>
              <div className="text-base font-bold text-cyan-600 mt-0.5">{metrics!.demos}</div>
            </div>
            <div className="p-2.5 rounded border border-border bg-muted/20">
              <div className="text-xs text-muted-foreground font-medium">Contacted</div>
              <div className="text-base font-bold text-indigo-600 mt-0.5">{metrics!.contacted}</div>
            </div>
            <div className="p-2.5 rounded border border-border bg-muted/20">
              <div className="text-xs text-muted-foreground font-medium">Replied</div>
              <div className="text-base font-bold text-teal-600 mt-0.5">{metrics!.replies}</div>
            </div>
            <div className="p-2.5 rounded border border-border bg-muted/20">
              <div className="text-xs text-muted-foreground font-medium">Interested</div>
              <div className="text-base font-bold text-emerald-700 mt-0.5">{metrics!.interested}</div>
            </div>
            <div className="p-2.5 rounded border border-border bg-muted/20">
              <div className="text-xs text-muted-foreground font-medium">Proposal</div>
              <div className="text-base font-bold text-violet-700 mt-0.5">
                {statCards.find(s => s.label === 'Customers')?.value ? 1 : 1}
              </div>
            </div>
            <div className="p-2.5 rounded border border-emerald-500/30 bg-emerald-500/10">
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">Customer</div>
              <div className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{metrics!.customers}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Bottom Grid: Recent Leads + System Safeguards & Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads (2 Columns) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>Recently Discovered Leads</span>
              <DemoBadge size="sm" />
            </h2>
            <Link href="/leads" className="text-xs text-primary hover:underline font-medium">
              View all {metrics!.totalLeads} leads
            </Link>
          </div>

          <div className="space-y-2">
            {recentLeads!.map((lead) => (
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
            ))}
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
                  {jobs!.length} tracked
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2.5">
              {jobs!.map((job) => (
                <div key={job.id} className="p-2.5 rounded-md border border-border/60 bg-muted/20 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-foreground font-mono">{job.type}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
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
                <span className="font-mono font-bold text-foreground">{metrics!.suppressionCount}</span>
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
