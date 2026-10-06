'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LeadData, LeadStatus } from '@/types';
import {
  Send,
  ShieldCheck,
  Users,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  X,
  Loader2,
  ArrowRight,
  Ban,
  Sparkles,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type OutreachChannel = 'EMAIL' | 'WHATSAPP' | 'PHONE';

interface DraftResult {
  draft: string;
  leadName: string;
  channel: string;
}

type PageTab = 'queue' | 'compliance';

// ─── Constants ───────────────────────────────────────────────────────────────

const READY_STATUSES: LeadStatus[] = ['APPROVED', 'OUTREACH_PENDING'];

const DEFAULT_INTENT =
  'We have created a personalized website concept for your CA practice. We would love to show you a 5-minute preview.';

const CHANNEL_META: Record<
  OutreachChannel,
  { label: string; icon: React.ElementType; apiChannel: string }
> = {
  EMAIL: { label: 'Email', icon: Mail, apiChannel: 'EMAIL' },
  WHATSAPP: { label: 'WhatsApp', icon: MessageSquare, apiChannel: 'WHATSAPP' },
  PHONE: { label: 'Phone Call', icon: Phone, apiChannel: 'VOICE' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function websiteStatusLabel(s: string) {
  if (s === 'NO_WEBSITE') return 'No Website';
  if (s === 'WEBSITE_EXISTS') return 'Has Website';
  if (s === 'REQUIRES_REVIEW') return 'Needs Review';
  return 'Unknown';
}

function websiteStatusVariant(s: string): 'success' | 'warning' | 'destructive' | 'outline' {
  if (s === 'NO_WEBSITE') return 'success'; // opportunity
  if (s === 'WEBSITE_EXISTS') return 'outline';
  if (s === 'REQUIRES_REVIEW') return 'warning';
  return 'outline';
}

function leadStatusVariant(s: string): 'success' | 'warning' | 'info' | 'outline' {
  if (s === 'APPROVED') return 'success';
  if (s === 'OUTREACH_PENDING') return 'warning';
  return 'outline';
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-muted-foreground';
}

// ─── Outreach Panel ──────────────────────────────────────────────────────────

interface OutreachPanelProps {
  lead: LeadData;
  onClose: () => void;
  onContacted: (leadId: string) => void;
}

function OutreachPanel({ lead, onClose, onContacted }: OutreachPanelProps) {
  const [channel, setChannel] = useState<OutreachChannel>('EMAIL');
  const [intent, setIntent] = useState(DEFAULT_INTENT);
  const [draft, setDraft] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [contactedLoading, setContactedLoading] = useState(false);
  const [contactedDone, setContactedDone] = useState(false);
  const [notes, setNotes] = useState('');

  const generateDraft = async () => {
    setDraftLoading(true);
    setDraftError('');
    setDraft('');
    try {
      const res = await fetch('/api/outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          channel: CHANNEL_META[channel].apiChannel,
          intent,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error ${res.status}`);
      }
      const data: DraftResult = await res.json();
      setDraft(data.draft);
    } catch (err: unknown) {
      setDraftError(err instanceof Error ? err.message : 'Failed to generate draft.');
    } finally {
      setDraftLoading(false);
    }
  };

  const markContacted = async () => {
    setContactedLoading(true);
    try {
      const res = await fetch('/api/outreach/contacted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          channel: CHANNEL_META[channel].apiChannel,
          notes,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error ${res.status}`);
      }
      setContactedDone(true);
      onContacted(lead.id);
    } catch (err: unknown) {
      setDraftError(err instanceof Error ? err.message : 'Failed to mark as contacted.');
    } finally {
      setContactedLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md shadow-2xl border-l border-border bg-background flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <div>
          <h2 className="text-sm font-bold text-foreground">{lead.businessName}</h2>
          <p className="text-xs text-muted-foreground">{lead.city} · {lead.profession}</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Compliance Notice */}
      <div className="mx-5 mt-4 px-3 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
          Each message requires <strong>manual review and dispatch</strong>. Bulk sending is disabled.
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Lead Summary */}
        <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-2">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Lead Summary</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <span className="text-muted-foreground">Website</span>
            <Badge variant={websiteStatusVariant(lead.websiteStatus)} className="w-fit text-[10px]">
              {websiteStatusLabel(lead.websiteStatus)}
            </Badge>
            <span className="text-muted-foreground">Status</span>
            <Badge variant={leadStatusVariant(lead.leadStatus)} className="w-fit text-[10px]">
              {lead.leadStatus.replace(/_/g, ' ')}
            </Badge>
            <span className="text-muted-foreground">Opp. Score</span>
            <span className={`font-bold ${scoreColor(lead.opportunityScore)}`}>{lead.opportunityScore}/100</span>
            {lead.publicEmail && (
              <>
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground font-mono truncate">{lead.publicEmail}</span>
              </>
            )}
            {lead.publicPhone && (
              <>
                <span className="text-muted-foreground">Phone</span>
                <span className="text-foreground font-mono">{lead.publicPhone}</span>
              </>
            )}
          </div>
        </div>

        {/* Channel Selector */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Channel</p>
          <div className="flex gap-2">
            {(Object.keys(CHANNEL_META) as OutreachChannel[]).map((ch) => {
              const meta = CHANNEL_META[ch];
              const Icon = meta.icon;
              const active = channel === ch;
              return (
                <button
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Intent */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Outreach Intent</label>
          <textarea
            rows={3}
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            className="w-full text-xs rounded-md border border-border bg-muted/10 px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateDraft}
          disabled={draftLoading || !intent.trim()}
          className="w-full gap-2 text-xs h-9"
        >
          {draftLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {draftLoading ? 'Generating Draft…' : 'Generate AI Draft'}
        </Button>

        {/* Error */}
        {draftError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {draftError}
          </div>
        )}

        {/* Draft output */}
        {draft && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Generated Draft
            </p>
            <textarea
              readOnly
              rows={6}
              value={draft}
              className="w-full text-xs rounded-md border border-border bg-muted/20 px-3 py-2 text-foreground resize-none focus:outline-none leading-relaxed font-mono"
            />
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Contact Notes (optional)</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Called at 3pm, left voicemail…"
            className="text-xs h-8"
          />
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-5 py-4 border-t border-border bg-muted/20 space-y-2">
        {contactedDone ? (
          <div className="flex items-center gap-2 justify-center py-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Marked as Contacted
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full gap-2 text-xs h-9 border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
            onClick={markContacted}
            disabled={contactedLoading}
          >
            {contactedLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            {contactedLoading ? 'Saving…' : 'Mark as Contacted'}
          </Button>
        )}
        <Button variant="ghost" className="w-full text-xs h-8" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

// ─── Outreach Queue Tab ───────────────────────────────────────────────────────

interface OutreachQueueTabProps {
  leads: LeadData[];
  loading: boolean;
  error: string;
}

function OutreachQueueTab({ leads, loading, error }: OutreachQueueTabProps) {
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());

  const handleContacted = useCallback((leadId: string) => {
    setContactedIds((prev) => new Set([...Array.from(prev), leadId]));
  }, []);

  const displayLeads = leads.filter((l) => !contactedIds.has(l.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading outreach queue…</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 shadow-none">
        <CardContent className="p-5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (displayLeads.length === 0) {
    return (
      <Card className="border-border/60 shadow-none">
        <CardContent className="p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">No leads ready for outreach</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              Leads with status <strong>APPROVED</strong> or <strong>OUTREACH PENDING</strong> will appear here.
              Review and approve leads on the Leads page first.
            </p>
          </div>
          <Link href="/leads">
            <Button size="sm" className="gap-2 text-xs">
              <ArrowRight className="w-3.5 h-3.5" />
              Go to Leads Pipeline
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Backdrop */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setSelectedLead(null)}
        />
      )}

      {/* Side panel */}
      {selectedLead && (
        <OutreachPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onContacted={handleContacted}
        />
      )}

      {/* Summary bar */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{displayLeads.length}</span> lead
          {displayLeads.length !== 1 ? 's' : ''} ready for outreach
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          Manual dispatch only
        </div>
      </div>

      {/* Table */}
      <Card className="border-border/80 shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Business Name</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">City</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Website</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Email</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Phone</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap text-right">Score</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {displayLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`hover:bg-muted/20 transition-colors ${
                    selectedLead?.id === lead.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate">
                    {lead.businessName}
                    {lead.isDemoData && (
                      <span className="ml-1.5 text-[9px] font-bold text-muted-foreground bg-muted px-1 py-0.5 rounded">
                        DEMO
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{lead.city}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant={websiteStatusVariant(lead.websiteStatus)} className="text-[10px]">
                      {websiteStatusLabel(lead.websiteStatus)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant={leadStatusVariant(lead.leadStatus)} className="text-[10px]">
                      {lead.leadStatus.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[160px] truncate font-mono">
                    {lead.publicEmail ?? <span className="text-muted-foreground/40 italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap font-mono">
                    {lead.publicPhone ?? <span className="text-muted-foreground/40 italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${scoreColor(lead.opportunityScore)}`}>
                      {lead.opportunityScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-[11px] gap-1.5 font-medium"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <Send className="w-3 h-3" />
                      Draft Outreach
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ─── Compliance Shield Tab ────────────────────────────────────────────────────

function ComplianceShieldTab() {
  const pillars = [
    {
      icon: Ban,
      title: 'No Bulk Sending',
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      body:
        'Automated mass emails and blast campaigns are architecturally disabled. Every outreach is a single, individual message drafted specifically for one recipient.',
    },
    {
      icon: Users,
      title: 'Human Required',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      body:
        'Every dispatch requires a human to read, approve, and manually send the message. No message is ever transmitted programmatically without a conscious human decision.',
    },
    {
      icon: ShieldCheck,
      title: 'Suppression Engine',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      body:
        'Leads marked DO_NOT_CONTACT are instantly blocked across all channels — Email, WhatsApp, SMS, and Voice. The suppression is enforced at the database layer, not just the UI.',
    },
  ];

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Hero Shield Card */}
      <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-none">
        <CardContent className="p-6 flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-foreground">Zero-Spam Architecture</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              GetVisible is built on a <strong>consent-first, human-in-the-loop</strong> outreach model.
              Every interaction with a CA firm is personal, purposeful, and explicitly approved before it
              reaches the recipient. Bulk spam is not just policy-prohibited — it is technically impossible.
            </p>
            <div className="pt-1 flex flex-wrap gap-2">
              <Badge variant="success" className="text-[11px] gap-1">
                <CheckCircle2 className="w-3 h-3" />
                GDPR Aligned
              </Badge>
              <Badge variant="success" className="text-[11px] gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Indian IT Act 2000
              </Badge>
              <Badge variant="info" className="text-[11px] gap-1">
                <ShieldCheck className="w-3 h-3" />
                Consent-First Architecture
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Three Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <Card key={pillar.title} className={`border shadow-none ${pillar.border}`}>
              <CardHeader className="pb-2 pt-5 px-5">
                <div className={`w-9 h-9 rounded-lg ${pillar.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${pillar.color}`} />
                </div>
                <CardTitle className="text-sm font-semibold">{pillar.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p className="text-xs text-muted-foreground leading-relaxed">{pillar.body}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Compliance Detail */}
      <Card className="border-border/70 shadow-none bg-muted/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Compliance Assurance Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              label: 'Data Source',
              value: 'All leads originate from public business directories (ICAI listings, JustDial, IndiaMart). No scraped personal data.',
            },
            {
              label: 'Contact Gating',
              value: 'DO_NOT_CONTACT status is checked server-side before any draft is generated. It cannot be bypassed from the UI.',
            },
            {
              label: 'Audit Trail',
              value: 'Every "Mark as Contacted" action is timestamped and attributed to the logged-in user for full accountability.',
            },
            {
              label: 'Channel Consent',
              value: 'Only publicly listed business emails and phones are used. Personal contact details are never used without explicit opt-in.',
            },
          ].map((item) => (
            <div key={item.label} className="flex gap-3 text-xs">
              <span className="w-28 shrink-0 font-semibold text-foreground">{item.label}</span>
              <span className="text-muted-foreground leading-relaxed">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Final note */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
        <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>Note:</strong> GetVisible&apos;s outreach module is designed to complement — not replace — the
          relationship-building efforts of your agency team. It generates personalised first-contact drafts
          that your team reads, edits, and sends manually. Think of it as an intelligent writing assistant,
          not an email automation tool.
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<PageTab>('queue');
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/leads?pageSize=200');
        if (!res.ok) throw new Error(`Failed to load leads (${res.status})`);
        const data = await res.json();
        const allLeads: LeadData[] = data.leads ?? [];
        const ready = allLeads.filter((l) =>
          READY_STATUSES.includes(l.leadStatus as LeadStatus)
        );
        setLeads(ready);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load leads.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const tabs: { id: PageTab; label: string; icon: React.ElementType }[] = [
    { id: 'queue', label: 'Outreach Queue', icon: Send },
    { id: 'compliance', label: 'Compliance Shield', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Campaigns &amp; Outreach
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compliance-gated, 1-to-1 personalised outreach to CA firms. Every message requires human
            review.
          </p>
        </div>
        {!loading && leads.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {leads.length} lead{leads.length !== 1 ? 's' : ''} ready
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'queue' ? (
        <OutreachQueueTab leads={leads} loading={loading} error={error} />
      ) : (
        <ComplianceShieldTab />
      )}
    </div>
  );
}
