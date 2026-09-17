'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DateRangeOption,
  DateRangeFilter,
  SalesAnalyticsResponse,
  BreakdownMetric,
  ActionQueueItem,
} from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DemoBadge } from '@/components/ui/demo-badge';
import {
  Users,
  CheckCircle2,
  FileCode2,
  ShieldCheck,
  Send,
  MessageSquare,
  ThumbsUp,
  Award,
  Download,
  Calendar,
  Clock,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Layers,
  Sparkles,
  TrendingUp,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface DashboardClientProps {
  initialData: SalesAnalyticsResponse;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [data, setData] = useState<SalesAnalyticsResponse>(initialData);
  const [preset, setPreset] = useState<DateRangeOption>(initialData.dateRange.preset || 'LAST_30_DAYS');
  const [customStart, setCustomStart] = useState<string>(initialData.dateRange.startDate?.split('T')[0] || '');
  const [customEnd, setCustomEnd] = useState<string>(initialData.dateRange.endDate?.split('T')[0] || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'themes' | 'channels' | 'sources' | 'geographies'>('templates');
  const [exporting, setExporting] = useState<boolean>(false);

  const fetchAnalytics = async (newPreset: DateRangeOption, start?: string, end?: string) => {
    setLoading(true);
    try {
      let url = `/api/analytics?preset=${newPreset}`;
      if (newPreset === 'CUSTOM') {
        if (start) url += `&startDate=${start}`;
        if (end) url += `&endDate=${end}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (newPreset: DateRangeOption) => {
    setPreset(newPreset);
    if (newPreset !== 'CUSTOM') {
      fetchAnalytics(newPreset);
    }
  };

  const handleApplyCustomDate = () => {
    if (customStart) {
      fetchAnalytics('CUSTOM', customStart, customEnd);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      let url = `/api/leads/export?`;
      if (preset === 'CUSTOM' && customStart) {
        url += `startDate=${customStart}&`;
        if (customEnd) url += `endDate=${customEnd}&`;
      }
      window.location.href = url;
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setTimeout(() => setExporting(false), 2000);
    }
  };

  const { funnel, rates, trends, templates, themes, channels, sources, geographies, aging, actionQueue } = data;

  const statCards = [
    { label: 'Total Leads', value: funnel.totalLeads, icon: Users, color: 'text-foreground', bg: 'bg-muted' },
    { label: 'Qualified', value: funnel.qualified, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Demos Generated', value: funnel.demosGenerated, icon: FileCode2, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Demos Approved', value: funnel.demosApproved, icon: ShieldCheck, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Contacted', value: funnel.contacted, icon: Send, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Responded', value: funnel.responded, icon: MessageSquare, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
    { label: 'Interested', value: funnel.interested, icon: ThumbsUp, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Converted', value: funnel.converted, icon: Award, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-600/15' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Date Range Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-1 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Sales Funnel & Intelligence</h1>
            <DemoBadge size="sm" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full-cycle sales conversion funnel, cohort performance, and optimization metrics for Chartered Accountant practices.
          </p>
        </div>

        {/* Date Filter & Export Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/70 text-xs">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground ml-1.5" />
            <select
              value={preset}
              onChange={(e) => handlePresetChange(e.target.value as DateRangeOption)}
              className="bg-transparent border-none text-xs font-medium text-foreground focus:outline-none cursor-pointer pr-2"
            >
              <option value="TODAY">Today</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="LAST_90_DAYS">Last 90 Days</option>
              <option value="ALL_TIME">All Time</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>

          {preset === 'CUSTOM' && (
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/70">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-transparent text-xs text-foreground px-1 border-none focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-transparent text-xs text-foreground px-1 border-none focus:outline-none"
              />
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={handleApplyCustomDate}>
                Apply
              </Button>
            </div>
          )}

          {/* Refresh Button */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1 text-xs"
            onClick={() => fetchAnalytics(preset, customStart, customEnd)}
            disabled={loading}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {/* CSV Export Button */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs font-medium border-emerald-600/40 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            onClick={handleExportCsv}
            disabled={exporting}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Exporting...' : 'Export Leads (CSV)'}</span>
          </Button>
        </div>
      </div>

      {/* Action Queue ("Needs Attention") - Prominent Operational Alert Box */}
      {actionQueue && actionQueue.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 shadow-none">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Action Queue — Immediate Operational Attention ({actionQueue.reduce((acc, q) => acc + q.count, 0)} Items)
              </CardTitle>
              <span className="text-[11px] text-muted-foreground font-medium">Human-in-the-Loop Sales Flow</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {actionQueue.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-amber-500/20 bg-background/80 shadow-xs flex flex-col justify-between gap-2.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">{item.title}</span>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400">
                      {item.count}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
                </div>
                <Link href={item.actionUrl}>
                  <Button size="sm" variant="default" className="w-full h-7 text-xs gap-1 font-medium shadow-none">
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 8 Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-border/80 shadow-none">
              <CardContent className="p-3 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-medium">{stat.label}</span>
                  <div className={`w-6 h-6 rounded ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-3 h-3" />
                  </div>
                </div>
                <p className="text-xl font-bold tracking-tight text-foreground mt-2">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sales Funnel Staircase with Stage Drop-Off Metrics */}
      <Card className="border-border/80 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Sales Funnel Progression & Conversion Drop-Off
              </CardTitle>
              <CardDescription className="text-xs">
                Sequential progression of leads through qualification, concept demo generation, human review, outreach, and conversion.
              </CardDescription>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Overall Lead → Customer:</span>{' '}
              <span className="font-bold text-emerald-600 text-sm">{rates.overallLeadToCustomerRate}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {funnel.stages.map((stage, idx) => {
            const widthPct = Math.max(stage.percentOfTotal, 3); // minimum visible width
            const isFirst = idx === 0;

            const stageColors = [
              'bg-slate-600',
              'bg-emerald-600',
              'bg-cyan-600',
              'bg-blue-600',
              'bg-indigo-600',
              'bg-teal-600',
              'bg-amber-600',
              'bg-emerald-700',
            ];
            const colorClass = stageColors[idx % stageColors.length];

            return (
              <div key={stage.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground flex items-center gap-2">
                    <span className="font-mono text-muted-foreground text-[10px]">0{idx + 1}</span>
                    <span>{stage.label}</span>
                  </span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-bold text-foreground">{stage.count} leads</span>
                    {!isFirst && (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {stage.percentOfPrevious}% of prev
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-primary font-mono w-16 text-right">
                      {stage.percentOfTotal}% total
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted/60 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`${colorClass} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 8 Grounded Conversion Rates Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Mathematical Conversion Ratios (Zero Artificial Predictions)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border/80 shadow-none bg-muted/10">
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Qualification Rate</span>
                <span className="font-bold text-emerald-600">{rates.qualificationRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                <div className="bg-emerald-600 h-1 rounded-full" style={{ width: `${rates.qualificationRate}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground">Qualified / Total Leads</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-none bg-muted/10">
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Demo Gen. Rate</span>
                <span className="font-bold text-cyan-600">{rates.demoGenerationRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                <div className="bg-cyan-600 h-1 rounded-full" style={{ width: `${rates.demoGenerationRate}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground">Demos / Qualified Leads</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-none bg-muted/10">
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Demo Approval Rate</span>
                <span className="font-bold text-blue-600">{rates.demoApprovalRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${rates.demoApprovalRate}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground">Approved / Demos Generated</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-none bg-muted/10">
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Contact Rate</span>
                <span className="font-bold text-indigo-600">{rates.contactRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                <div className="bg-indigo-600 h-1 rounded-full" style={{ width: `${rates.contactRate}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground">Contacted / Approved Demos</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-none bg-muted/10">
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Response Rate</span>
                <span className="font-bold text-teal-600">{rates.responseRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                <div className="bg-teal-600 h-1 rounded-full" style={{ width: `${rates.responseRate}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground">Responded / Contacted</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-none bg-muted/10">
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Interest Rate</span>
                <span className="font-bold text-amber-600">{rates.interestRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                <div className="bg-amber-600 h-1 rounded-full" style={{ width: `${rates.interestRate}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground">Interested / Responded</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-none bg-muted/10">
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Conversion Rate</span>
                <span className="font-bold text-emerald-600">{rates.conversionRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                <div className="bg-emerald-600 h-1 rounded-full" style={{ width: `${rates.conversionRate}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground">Converted / Interested</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 shadow-none bg-emerald-500/5">
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-800 dark:text-emerald-300 font-semibold">Lead to Customer</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{rates.overallLeadToCustomerRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                <div className="bg-emerald-600 h-1 rounded-full" style={{ width: `${rates.overallLeadToCustomerRate}%` }} />
              </div>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400">Converted / Total Leads</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Two-Column Section: Activity Trends + Lead Aging & Latency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Trends Over Time (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <Card className="border-border/80 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  Activity Trends Over Time
                </CardTitle>
                <span className="text-[11px] text-muted-foreground font-mono">{trends.length} periods tracked</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {trends.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No trend activity in selected date window.</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {trends.map((point) => (
                    <div
                      key={point.period}
                      className="p-2.5 rounded border border-border/60 bg-muted/10 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono text-muted-foreground font-semibold">{point.period}</span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-foreground">
                          <strong className="text-foreground">{point.leadsAdded}</strong> added
                        </span>
                        <span className="text-cyan-600">
                          <strong>{point.demosGenerated}</strong> demos
                        </span>
                        <span className="text-indigo-600">
                          <strong>{point.contacted}</strong> contacted
                        </span>
                        <span className="text-emerald-600 font-bold">
                          {point.converted} converted
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lead Aging & Stage Latency (1 Col) */}
        <div className="space-y-3">
          <Card className="border-border/80 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Pipeline Aging & Stale Latency
              </CardTitle>
              <CardDescription className="text-xs">
                Average days in stage and leads untouched for 7+ days.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aging.map((bucket) => (
                <div key={bucket.stage} className="p-2.5 rounded border border-border/60 bg-muted/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{bucket.stageLabel}</span>
                    <span className="font-bold text-foreground">{bucket.count} leads</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Avg Duration: <strong className="text-foreground">{bucket.averageDaysInStage} days</strong></span>
                    {bucket.staleCount > 0 ? (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {bucket.staleCount} Stale (&gt;7d)
                      </span>
                    ) : (
                      <span className="text-emerald-600 text-[10px]">Healthy pace</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Multi-dimensional Breakdowns: Templates, Themes, Channels, Sources, Geographies */}
      <Card className="border-border/80 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Multi-Dimensional Conversion Intelligence
              </CardTitle>
              <CardDescription className="text-xs">
                Compare which website layouts, color palettes, outreach channels, and cities generate the highest conversions.
              </CardDescription>
            </div>

            {/* Dimension Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/70 text-xs">
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'templates' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveTab('themes')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'themes' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Themes
              </button>
              <button
                onClick={() => setActiveTab('channels')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'channels' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Channels
              </button>
              <button
                onClick={() => setActiveTab('sources')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'sources' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sources
              </button>
              <button
                onClick={() => setActiveTab('geographies')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'geographies' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Cities
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground font-semibold">
                  <th className="pb-2">Segment Name</th>
                  <th className="pb-2 text-right">Leads</th>
                  <th className="pb-2 text-right">Qualified</th>
                  <th className="pb-2 text-right">Demos</th>
                  <th className="pb-2 text-right">Approved</th>
                  <th className="pb-2 text-right">Contacted</th>
                  <th className="pb-2 text-right">Responded</th>
                  <th className="pb-2 text-right">Converted</th>
                  <th className="pb-2 text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(() => {
                  let activeList: BreakdownMetric[] = [];
                  if (activeTab === 'templates') activeList = templates;
                  else if (activeTab === 'themes') activeList = themes;
                  else if (activeTab === 'channels') activeList = channels;
                  else if (activeTab === 'sources') activeList = sources;
                  else if (activeTab === 'geographies') activeList = geographies;

                  if (!activeList || activeList.length === 0) {
                    return (
                      <tr>
                        <td colSpan={9} className="py-6 text-center text-muted-foreground">
                          No performance records available for this segment in the current date range.
                        </td>
                      </tr>
                    );
                  }

                  return activeList.map((item) => {
                    const convRate = item.leads > 0 ? ((item.converted / item.leads) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={item.name} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 font-medium text-foreground">{item.name}</td>
                        <td className="py-2.5 text-right font-mono text-muted-foreground">{item.leads}</td>
                        <td className="py-2.5 text-right font-mono text-emerald-600">{item.qualified}</td>
                        <td className="py-2.5 text-right font-mono text-cyan-600">{item.demos}</td>
                        <td className="py-2.5 text-right font-mono text-blue-600">{item.approved}</td>
                        <td className="py-2.5 text-right font-mono text-indigo-600">{item.contacted}</td>
                        <td className="py-2.5 text-right font-mono text-teal-600">{item.responded}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-600">{item.converted}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-foreground">
                          {convRate}%
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
