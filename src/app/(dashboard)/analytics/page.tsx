'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DemoBadge } from '@/components/ui/demo-badge';

// ─── Types ───────────────────────────────────────────────────────────────────

type DatePreset = 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'ALL_TIME';

interface FunnelStage {
  stage: string;
  stageLabel: string;
  count: number;
  percentage: number;
}

interface Funnel {
  totalLeads: number;
  qualified: number;
  demosGenerated: number;
  demosApproved: number;
  contacted: number;
  responded: number;
  interested: number;
  converted: number;
  stages: FunnelStage[];
}

interface Rates {
  qualificationRate: number;
  demoGenerationRate: number;
  demoApprovalRate: number;
  contactRate: number;
  responseRate: number;
  interestRate: number;
  conversionRate: number;
  overallLeadToCustomerRate: number;
}

interface ActivityTrendPoint {
  period: string;
  leadsAdded: number;
  qualified: number;
  demosGenerated: number;
  contacted: number;
  responded: number;
  interested: number;
  converted: number;
}

interface BreakdownMetric {
  name: string;
  leads: number;
  qualified: number;
  demos: number;
  approved: number;
  contacted: number;
  responded: number;
  interested: number;
  converted: number;
}

interface LeadAgingBucket {
  stage: string;
  stageLabel: string;
  count: number;
  averageDaysInStage: number;
  staleCount: number;
}

interface ActionQueueItem {
  id: string;
  type: string;
  title: string;
  description: string;
  count: number;
  actionLabel: string;
  actionUrl: string;
}

interface SalesAnalyticsResponse {
  dateRange: { preset: DatePreset; startDate: string; endDate: string };
  funnel: Funnel;
  rates: Rates;
  trends: ActivityTrendPoint[];
  templates: BreakdownMetric[];
  channels: BreakdownMetric[];
  sources: BreakdownMetric[];
  professions: BreakdownMetric[];
  geographies: BreakdownMetric[];
  aging: LeadAgingBucket[];
  actionQueue: ActionQueueItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null): string {
  if (n === undefined || n === null) return '0';
  return n.toLocaleString();
}

function fmtPct(n: number | undefined | null): string {
  if (n === undefined || n === null) return '0.0%';
  return `${Number(n).toFixed(1)}%`;
}

/** Clamp a percentage 0–100 for bar widths */
function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, v));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Horizontal progress-style bar */
function MiniBar({ value, color = 'bg-primary' }: { value: number; color?: string }) {
  return (
    <div className="h-1 w-full rounded-full bg-muted mt-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all`}
        style={{ width: `${clamp(value)}%` }}
      />
    </div>
  );
}

/** Funnel stage row */
function FunnelRow({
  label,
  count,
  pct,
  maxCount,
  colorFrom,
  colorTo,
}: {
  label: string;
  count: number;
  pct: number;
  maxCount: number;
  colorFrom: string;
  colorTo: string;
}) {
  const barWidth = maxCount > 0 ? clamp((count / maxCount) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="w-32 shrink-0 text-right text-muted-foreground font-medium truncate">{label}</div>
      <div className="flex-1 relative h-7 flex items-center">
        <div
          className={`h-full rounded-md ${colorFrom} ${colorTo} bg-gradient-to-r transition-all`}
          style={{ width: `${barWidth}%`, minWidth: count > 0 ? '1.5rem' : '0' }}
        />
        <span className="absolute left-2 text-[10px] font-bold text-white mix-blend-difference select-none">
          {count > 0 ? fmt(count) : ''}
        </span>
      </div>
      <div className="w-14 shrink-0 text-right font-semibold text-foreground">{fmt(count)}</div>
      <div className="w-12 shrink-0 text-right text-muted-foreground">{fmtPct(pct)}</div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Last 7 Days', value: 'LAST_7_DAYS' },
  { label: 'Last 30 Days', value: 'LAST_30_DAYS' },
  { label: 'Last 90 Days', value: 'LAST_90_DAYS' },
  { label: 'All Time', value: 'ALL_TIME' },
];

type BreakdownTab = 'templates' | 'channels' | 'sources' | 'geographies';

const BREAKDOWN_TABS: { label: string; key: BreakdownTab }[] = [
  { label: 'Templates', key: 'templates' },
  { label: 'Channels', key: 'channels' },
  { label: 'Sources', key: 'sources' },
  { label: 'Geographies', key: 'geographies' },
];

const RATE_LABELS: { key: keyof Rates; label: string; color: string }[] = [
  { key: 'qualificationRate', label: 'Qualification Rate', color: 'bg-blue-500' },
  { key: 'demoGenerationRate', label: 'Demo Generation Rate', color: 'bg-indigo-500' },
  { key: 'demoApprovalRate', label: 'Demo Approval Rate', color: 'bg-violet-500' },
  { key: 'contactRate', label: 'Contact Rate', color: 'bg-purple-500' },
  { key: 'responseRate', label: 'Response Rate', color: 'bg-cyan-500' },
  { key: 'interestRate', label: 'Interest Rate', color: 'bg-teal-500' },
  { key: 'conversionRate', label: 'Conversion Rate', color: 'bg-emerald-500' },
  { key: 'overallLeadToCustomerRate', label: 'Lead → Customer Rate', color: 'bg-green-600' },
];

// Funnel gradient pairs (blue → green as funnel narrows)
const FUNNEL_COLORS: [string, string][] = [
  ['from-blue-500', 'to-blue-600'],
  ['from-blue-500', 'to-indigo-500'],
  ['from-indigo-500', 'to-violet-500'],
  ['from-violet-500', 'to-purple-500'],
  ['from-purple-500', 'to-cyan-500'],
  ['from-cyan-500', 'to-teal-500'],
  ['from-teal-500', 'to-emerald-500'],
  ['from-emerald-500', 'to-green-600'],
];

export default function AnalyticsPage() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const [preset, setPreset] = useState<DatePreset>('LAST_30_DAYS');
  const [data, setData] = useState<SalesAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [breakdownTab, setBreakdownTab] = useState<BreakdownTab>('templates');

  const fetchAnalytics = useCallback(async (p: DatePreset) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?preset=${p}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const json: SalesAnalyticsResponse = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(preset);
  }, [preset, fetchAnalytics]);

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Pipeline Analytics
              {isDemoMode && <DemoBadge />}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Loading sales analytics data…
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg border border-border bg-muted/20 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-lg border border-border bg-muted/20 animate-pulse" />
        <div className="h-48 rounded-lg border border-border bg-muted/20 animate-pulse" />
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Pipeline Analytics
              {isDemoMode && <DemoBadge />}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Business intelligence dashboard</p>
          </div>
        </div>
        <div className="p-5 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertCircle className="w-4 h-4" />
            Failed to load analytics
          </div>
          <p className="text-xs">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(preset)}
            className="gap-1.5 mt-1 text-xs h-7 border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { funnel, rates, trends, aging, actionQueue } = data;
  const breakdownData: BreakdownMetric[] = data[breakdownTab] ?? [];

  // Compute funnel stages: prefer API stages array, else build from funnel fields
  const funnelStages: { label: string; count: number; pct: number }[] =
    funnel.stages && funnel.stages.length > 0
      ? funnel.stages.map((s) => ({ label: s.stageLabel, count: s.count, pct: s.percentage }))
      : [
          { label: 'Total Leads', count: funnel.totalLeads, pct: 100 },
          { label: 'Qualified', count: funnel.qualified, pct: funnel.totalLeads > 0 ? (funnel.qualified / funnel.totalLeads) * 100 : 0 },
          { label: 'Demos Generated', count: funnel.demosGenerated, pct: funnel.totalLeads > 0 ? (funnel.demosGenerated / funnel.totalLeads) * 100 : 0 },
          { label: 'Demos Approved', count: funnel.demosApproved, pct: funnel.totalLeads > 0 ? (funnel.demosApproved / funnel.totalLeads) * 100 : 0 },
          { label: 'Contacted', count: funnel.contacted, pct: funnel.totalLeads > 0 ? (funnel.contacted / funnel.totalLeads) * 100 : 0 },
          { label: 'Responded', count: funnel.responded, pct: funnel.totalLeads > 0 ? (funnel.responded / funnel.totalLeads) * 100 : 0 },
          { label: 'Interested', count: funnel.interested, pct: funnel.totalLeads > 0 ? (funnel.interested / funnel.totalLeads) * 100 : 0 },
          { label: 'Converted', count: funnel.converted, pct: funnel.totalLeads > 0 ? (funnel.converted / funnel.totalLeads) * 100 : 0 },
        ];

  const maxFunnelCount = Math.max(...funnelStages.map((s) => s.count), 1);

  // Trends bar chart
  const maxTrend = Math.max(...trends.map((t) => t.leadsAdded), 1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Pipeline Analytics
            {isDemoMode && <DemoBadge />}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sales funnel metrics, conversion rates and lead activity intelligence ·{' '}
            <span className="font-mono">
              {data.dateRange.startDate} → {data.dateRange.endDate}
            </span>
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex items-center gap-1 p-1 rounded-md bg-muted/60 border border-border shrink-0">
          {PRESETS.map((p) => (
            <Button
              key={p.value}
              variant={preset === p.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreset(p.value)}
              className="text-xs h-7 px-3"
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Action Queue (orange alert strip) ── */}
      {actionQueue.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Action Queue
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {actionQueue.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/8"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      {item.title}
                      {item.count > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 border-amber-500/40 text-amber-600 bg-amber-500/10"
                        >
                          {item.count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                  </div>
                </div>
                <Link href={item.actionUrl} className="shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2 gap-1 border-amber-500/40 text-amber-700 hover:bg-amber-500/15 whitespace-nowrap"
                  >
                    {item.actionLabel}
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Leads */}
        <Card className="border-border shadow-none">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Total Leads
              </span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-foreground">{fmt(funnel.totalLeads)}</div>
            <div className="text-[11px] text-muted-foreground">
              {fmt(funnel.qualified)} qualified
            </div>
          </CardContent>
        </Card>

        {/* Converted */}
        <Card className="border-border shadow-none">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Converted
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-foreground">{fmt(funnel.converted)}</div>
            <div className="text-[11px] text-muted-foreground">
              {fmt(funnel.interested)} interested
            </div>
          </CardContent>
        </Card>

        {/* Overall Conversion Rate */}
        <Card className="border-border shadow-none">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Conversion Rate
              </span>
              <TrendingUp className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              {fmtPct(rates.overallLeadToCustomerRate)}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Lead → customer overall
            </div>
          </CardContent>
        </Card>

        {/* Demos Generated */}
        <Card className="border-border shadow-none">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Demos
              </span>
              <Target className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-3xl font-bold text-foreground">{fmt(funnel.demosGenerated)}</div>
            <div className="text-[11px] text-muted-foreground">
              {fmt(funnel.demosApproved)} approved
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Sales Funnel ── */}
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Sales Funnel
          </CardTitle>
          <CardDescription className="text-xs">
            Lead progression from discovery through to converted customer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {funnelStages.length === 0 || funnel.totalLeads === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              No funnel data available for this period.
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="flex items-center gap-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-1.5 mb-1">
                <div className="w-32 shrink-0 text-right">Stage</div>
                <div className="flex-1">Progress</div>
                <div className="w-14 shrink-0 text-right">Count</div>
                <div className="w-12 shrink-0 text-right">%</div>
              </div>
              {funnelStages.map((s, idx) => {
                const [from, to] = FUNNEL_COLORS[idx % FUNNEL_COLORS.length];
                return (
                  <FunnelRow
                    key={s.label}
                    label={s.label}
                    count={s.count}
                    pct={s.pct}
                    maxCount={maxFunnelCount}
                    colorFrom={from}
                    colorTo={to}
                  />
                );
              })}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Two-column row: Activity Trends + Conversion Rates ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Activity Trends */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Activity Trends
            </CardTitle>
            <CardDescription className="text-xs">
              Leads added per period during the selected window.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trends.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                No trend data available for this period.
              </div>
            ) : (
              <div className="flex items-end gap-1 h-36 relative">
                {/* Y-axis implied by bar heights */}
                {trends.map((t, idx) => {
                  const barH = maxTrend > 0 ? clamp((t.leadsAdded / maxTrend) * 100) : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-1 group">
                      {/* Tooltip on hover */}
                      <div className="hidden group-hover:flex absolute -top-1 left-1/2 -translate-x-1/2 bg-popover border border-border rounded px-2 py-1 text-[10px] shadow-md z-10 whitespace-nowrap flex-col items-center pointer-events-none">
                        <span className="font-bold">{t.leadsAdded} leads</span>
                        <span className="text-muted-foreground">{t.period}</span>
                      </div>
                      <div
                        className="w-full bg-blue-500 rounded-t-sm transition-all"
                        style={{ height: `${barH}%` }}
                        title={`${t.period}: ${t.leadsAdded} leads`}
                      />
                      <span className="text-[9px] text-muted-foreground truncate max-w-full px-0.5">
                        {t.period.length > 5 ? t.period.slice(-5) : t.period}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion Rates Grid */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Conversion Rates
            </CardTitle>
            <CardDescription className="text-xs">
              Stage-by-stage conversion ratios across the pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {RATE_LABELS.map(({ key, label, color }) => {
                const val = rates[key] ?? 0;
                return (
                  <div key={key} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
                      <span className="text-[11px] font-bold text-foreground">{fmtPct(val)}</span>
                    </div>
                    <MiniBar value={val} color={color} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Lead Aging Table ── */}
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Lead Aging by Stage
          </CardTitle>
          <CardDescription className="text-xs">
            Average time leads spend in each stage and stale counts (&gt;7 days).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {aging.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground px-6">
              No aging data available for this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-3">Stage</th>
                    <th className="p-3 text-right">Count</th>
                    <th className="p-3 text-right">Avg Days in Stage</th>
                    <th className="p-3 text-right">Stale (&gt;7 days)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {aging.map((row) => (
                    <tr key={row.stage} className="hover:bg-muted/20">
                      <td className="p-3 font-medium text-foreground">{row.stageLabel}</td>
                      <td className="p-3 text-right font-mono">{fmt(row.count)}</td>
                      <td className="p-3 text-right font-mono">
                        {row.averageDaysInStage != null
                          ? `${Number(row.averageDaysInStage).toFixed(1)}d`
                          : '—'}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {row.staleCount > 0 ? (
                          <span className="font-bold text-destructive">{fmt(row.staleCount)}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Breakdowns Tabs ── */}
      <Card className="border-border shadow-none">
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Breakdowns
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Pipeline performance segmented by dimension.
              </CardDescription>
            </div>
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-md bg-muted/60 border border-border">
              {BREAKDOWN_TABS.map((tab) => (
                <Button
                  key={tab.key}
                  variant={breakdownTab === tab.key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBreakdownTab(tab.key)}
                  className="text-xs h-7 px-3"
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          {breakdownData.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground px-6">
              No {breakdownTab} breakdown data available for this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3 text-right">Leads</th>
                    <th className="p-3 text-right">Qualified</th>
                    <th className="p-3 text-right">Demos</th>
                    <th className="p-3 text-right">Converted</th>
                    <th className="p-3 text-right">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {breakdownData.map((row) => {
                    const convRate = row.leads > 0 ? (row.converted / row.leads) * 100 : 0;
                    return (
                      <tr key={row.name} className="hover:bg-muted/20">
                        <td className="p-3 font-medium text-foreground max-w-[160px] truncate">
                          {row.name}
                        </td>
                        <td className="p-3 text-right font-mono">{fmt(row.leads)}</td>
                        <td className="p-3 text-right font-mono">{fmt(row.qualified)}</td>
                        <td className="p-3 text-right font-mono">{fmt(row.demos)}</td>
                        <td className="p-3 text-right font-mono">{fmt(row.converted)}</td>
                        <td className="p-3 text-right">
                          <span
                            className={`font-semibold ${
                              convRate >= 10
                                ? 'text-emerald-600'
                                : convRate >= 3
                                ? 'text-amber-600'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {fmtPct(convRate)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
