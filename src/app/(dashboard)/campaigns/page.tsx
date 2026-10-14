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
  Copy,
  Download,
  Eye,
  FileText,
  Check,
  ExternalLink,
  Flame,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  CornerDownLeft,
  CheckCheck,
  Edit3,
  Zap,
  Plus,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type OutreachChannel = 'EMAIL' | 'WHATSAPP' | 'PHONE';

interface DraftResult {
  draft: string;
  leadName?: string;
  channel?: string;
  screenshotUrl?: string | null;
  whatsappMessage?: string;
  whatsappShareUrl?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export type QueueFilter = 'READY' | 'ALL' | 'QUALIFIED' | 'DEMO_READY';

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
  onRefresh?: () => void;
}

function OutreachPanel({ lead, onClose, onContacted, onRefresh }: OutreachPanelProps) {
  const [channel, setChannel] = useState<OutreachChannel>('WHATSAPP');
  const [intent, setIntent] = useState(DEFAULT_INTENT);
  const [draft, setDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [whatsappShareUrl, setWhatsappShareUrl] = useState<string | null>(null);
  const [draftSubject, setDraftSubject] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [contactedLoading, setContactedLoading] = useState(false);
  const [contactedDone, setContactedDone] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [notes, setNotes] = useState('');

  // Image & Text Clipboard State
  const [copyImageStatus, setCopyImageStatus] = useState<'IDLE' | 'COPYING' | 'COPIED' | 'FAILED'>('IDLE');
  const [copyTextStatus, setCopyTextStatus] = useState<'IDLE' | 'COPIED'>('IDLE');
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  // Interest Outcome State
  const [interestStatus, setInterestStatus] = useState<string | null>(lead.leadStatus);
  const [updatingInterest, setUpdatingInterest] = useState(false);
  const [interestNotice, setInterestNotice] = useState<string | null>(null);

  // Auto-fetch or capture demo screenshot when opening drawer
  useEffect(() => {
    let cancelled = false;
    async function loadScreenshot() {
      setScreenshotLoading(true);
      try {
        const res = await fetch(`/api/demos/${lead.id}/screenshot`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (data.screenshotUrl) {
            setScreenshotUrl(data.screenshotUrl);
          }
        }
      } catch {
        // Non-blocking
      } finally {
        if (!cancelled) setScreenshotLoading(false);
      }
    }
    loadScreenshot();
    return () => {
      cancelled = true;
    };
  }, [lead.id]);

  const handleSelectChannel = (ch: OutreachChannel) => {
    setChannel(ch);
    if (ch === 'WHATSAPP' && whatsappMessage) {
      setDraft(whatsappMessage);
    } else if (ch === 'EMAIL' && emailDraft) {
      setDraft(emailDraft);
    }
  };

  const generateDraft = async () => {
    setDraftLoading(true);
    setDraftError('');
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
      const data = await res.json();
      setDraft(data.draft);
      if (data.outreach?.message) setEmailDraft(data.outreach.message);
      if (data.whatsappMessage) setWhatsappMessage(data.whatsappMessage);
      if (data.subject) setDraftSubject(data.subject);
      if (data.screenshotUrl) setScreenshotUrl(data.screenshotUrl);
      if (data.whatsappShareUrl) setWhatsappShareUrl(data.whatsappShareUrl);
    } catch (err: unknown) {
      setDraftError(err instanceof Error ? err.message : 'Failed to generate draft.');
    } finally {
      setDraftLoading(false);
    }
  };

  const [fastGenerating, setFastGenerating] = useState(false);

  const handleFastGenerateDemoAndCard = async () => {
    setFastGenerating(true);
    setDraftError('');
    try {
      // 1. POST /api/demos (auto-approved in solo fast mode)
      const demoRes = await fetch('/api/demos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      });
      if (!demoRes.ok) {
        const errJson = await demoRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate demo concept');
      }
      const demoData = await demoRes.json();
      if (demoData.demo) {
        if (!lead.websiteDemos) lead.websiteDemos = [];
        lead.websiteDemos.unshift(demoData.demo);
      }

      // 2. Fetch screenshot in parallel background
      setScreenshotLoading(true);
      fetch(`/api/demos/${lead.id}/screenshot`)
        .then(async (sRes) => {
          if (sRes.ok) {
            const sData = await sRes.json();
            if (sData.screenshotUrl) setScreenshotUrl(sData.screenshotUrl);
          }
        })
        .catch(() => {})
        .finally(() => setScreenshotLoading(false));

      // 3. Generate initial draft
      await generateDraft();
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      setDraftError(err instanceof Error ? err.message : 'Fast Generation failed.');
    } finally {
      setFastGenerating(false);
    }
  };

  const copyScreenshotImage = async () => {
    setCopyImageStatus('COPYING');
    try {
      // Fetch binary image from same-origin proxy to eliminate any CORS issues
      const proxyUrl = `/api/demos/${lead.id}/screenshot?format=image`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error('Could not fetch screenshot image');
      const blob = await res.blob();
      const pngBlob = blob.type === 'image/png' ? blob : new Blob([await blob.arrayBuffer()], { type: 'image/png' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob }),
      ]);
      setCopyImageStatus('COPIED');
      setTimeout(() => setCopyImageStatus('IDLE'), 3500);
    } catch (err) {
      console.warn('Clipboard image copy error:', err);
      setCopyImageStatus('FAILED');
      setTimeout(() => setCopyImageStatus('IDLE'), 3500);
    }
  };

  const downloadScreenshot = async () => {
    try {
      const proxyUrl = `/api/demos/${lead.id}/screenshot?format=image`;
      const res = await fetch(proxyUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lead.businessName.replace(/[^a-z0-9]/gi, '_')}_website_concept.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      if (screenshotUrl) window.open(screenshotUrl, '_blank');
    }
  };

  const copyDraftText = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopyTextStatus('COPIED');
      setTimeout(() => setCopyTextStatus('IDLE'), 3000);
    } catch {
      // fallback
    }
  };

  const handleUpdateInterest = async (newStatus: LeadStatus) => {
    setUpdatingInterest(true);
    setInterestNotice(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadStatus: newStatus,
          reason:
            newStatus === 'INTERESTED'
              ? 'Prospect expressed positive interest in website concept'
              : `Lead status updated to ${newStatus} following outreach review`,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to update interest status');
      }
      setInterestStatus(newStatus);
      if (newStatus === 'INTERESTED') {
        setInterestNotice('🎉 Prospect marked as INTERESTED! Ready to send website proposal.');
      } else if (newStatus === 'NOT_INTERESTED') {
        setInterestNotice('Lead marked as Not Interested.');
      } else if (newStatus === 'DO_NOT_CONTACT') {
        setInterestNotice('Compliance suppression active: Marked as DO NOT CONTACT.');
      }
      onContacted(lead.id);
    } catch (err: unknown) {
      setDraftError(err instanceof Error ? err.message : 'Failed to update interest status');
    } finally {
      setUpdatingInterest(false);
    }
  };

  const sendEmail = async () => {
    if (!lead.publicEmail) {
      setDraftError('Lead has no public email address.');
      return;
    }
    setEmailSending(true);
    setDraftError('');
    try {
      const res = await fetch('/api/outreach/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          subject: draftSubject || `Website Concept Prepared for ${lead.businessName}`,
          message: emailDraft || draft,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch email.');
      }
      setEmailSent(true);
      setContactedDone(true);
      onContacted(lead.id);
    } catch (err: unknown) {
      setDraftError(err instanceof Error ? err.message : 'Failed to dispatch email.');
    } finally {
      setEmailSending(false);
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

  const activeDemo = lead.websiteDemos?.[0];
  const demoViewCount = activeDemo?.viewCount || 0;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg shadow-2xl border-l border-border bg-background flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
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
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs">
        {/* Real-time Engagement Signal Tracker */}
        {demoViewCount > 0 ? (
          <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                <Eye className="w-4 h-4 text-emerald-600 animate-pulse" />
                🔥 Active Interest: Concept Viewed {demoViewCount}x!
              </span>
              <Badge className="bg-emerald-600 text-white text-[10px]">
                High Intent
              </Badge>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              The prospect opened and viewed their private website concept{activeDemo?.lastViewedAt ? ` on ${new Date(activeDemo.lastViewedAt).toLocaleDateString()}` : ''}. They are evaluating the design!
            </p>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Eye className="w-3.5 h-3.5 text-muted-foreground/70" />
              <span>Awaiting concept link click (Views tracked in real-time)</span>
            </span>
            <Badge variant="outline" className="text-[9px] font-mono">0 views</Badge>
          </div>
        )}

        {/* Solo-Operator 1-Click Fast Generation if no demo yet */}
        {(!lead.websiteDemos?.length || !activeDemo) && (
          <div className="p-3.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs font-bold text-foreground">No Website Demo Generated Yet</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Generate a personalized website concept demo, capture preview screenshot, and craft your WhatsApp outreach card in 1-click.
            </p>
            <Button
              size="sm"
              disabled={fastGenerating}
              onClick={handleFastGenerateDemoAndCard}
              className="w-full gap-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md"
            >
              {fastGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Demo &amp; WhatsApp Card…</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>⚡ 1-Click Generate Demo &amp; WhatsApp Card</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Lead Summary */}
        <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-2">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Lead Context</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <span className="text-muted-foreground">Website</span>
            <Badge variant={websiteStatusVariant(lead.websiteStatus)} className="w-fit text-[10px]">
              {websiteStatusLabel(lead.websiteStatus)}
            </Badge>
            <span className="text-muted-foreground">Status</span>
            <Badge variant={leadStatusVariant(interestStatus || lead.leadStatus)} className="w-fit text-[10px]">
              {(interestStatus || lead.leadStatus).replace(/_/g, ' ')}
            </Badge>
            <span className="text-muted-foreground">Opp. Score</span>
            <span className={`font-bold ${scoreColor(lead.opportunityScore)}`}>{lead.opportunityScore}/100</span>
            {lead.publicPhone && (
              <>
                <span className="text-muted-foreground">WhatsApp/Phone</span>
                <span className="text-foreground font-mono font-medium">{lead.publicPhone}</span>
              </>
            )}
            {lead.publicEmail && (
              <>
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground font-mono truncate">{lead.publicEmail}</span>
              </>
            )}
          </div>
        </div>

        {/* Channel Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">Select Channel</p>
            <span className="text-[10px] text-muted-foreground">Tailored copy per channel</span>
          </div>
          <div className="flex gap-2">
            {(Object.keys(CHANNEL_META) as OutreachChannel[]).map((ch) => {
              const meta = CHANNEL_META[ch];
              const Icon = meta.icon;
              const active = channel === ch;
              return (
                <button
                  key={ch}
                  onClick={() => handleSelectChannel(ch)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    active
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
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

        {/* WhatsApp Channel: Exact Card Message with Image at Top and Quick Reply Buttons */}
        {channel === 'WHATSAPP' ? (
          <div className="space-y-3">
            {/* Generate / Refresh Button */}
            <Button
              onClick={generateDraft}
              disabled={draftLoading || !intent.trim()}
              className="w-full gap-2 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
            >
              {draftLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{draftLoading ? 'Generating Card Copy…' : 'Generate Tailored WhatsApp Card'}</span>
            </Button>

            {/* Error */}
            {draftError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {draftError}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-foreground">WhatsApp Card Message</span>
                <Badge variant="outline" className="text-[9px] py-0 border-emerald-500/30 text-emerald-600">
                  Quick Reply Card
                </Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingDraft(!isEditingDraft)}
                className="h-6 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingDraft ? 'Card Preview' : 'Edit Text'}</span>
              </Button>
            </div>

            {isEditingDraft ? (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">Edit message text below, then switch back to Card Preview:</p>
                <textarea
                  rows={8}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full text-xs rounded-md border border-border bg-muted/20 px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed font-sans"
                />
              </div>
            ) : (
              /* WhatsApp Simulated Chat Canvas (Exact match to uploaded image) */
              <div className="rounded-2xl border border-border/80 overflow-hidden shadow-xs">
                {/* 1. WhatsApp Top Bar */}
                <div className="bg-[#075e54] text-white px-3.5 py-2.5 flex items-center justify-between text-xs shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs uppercase border border-white/30 text-white shadow-2xs">
                      {lead.businessName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-xs leading-none">{lead.businessName}</div>
                      <div className="text-[10px] text-emerald-100/90 font-normal mt-0.5">Business Account</div>
                    </div>
                  </div>
                  <div className="text-white/80 text-sm font-bold tracking-widest">⋮</div>
                </div>

                {/* 2. Chat Canvas with Wallpaper */}
                <div className="bg-[#efeae2] dark:bg-[#0b141a] p-3 space-y-3">
                  {/* Date Badge */}
                  <div className="flex justify-center">
                    <span className="bg-white/85 dark:bg-card/85 text-[10px] font-medium text-muted-foreground px-2.5 py-0.5 rounded-full shadow-2xs">
                      Today
                    </span>
                  </div>

                  {/* 3. The WhatsApp Card Bubble (Identical to image) */}
                  <div className="bg-white dark:bg-[#1f2c34] rounded-2xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden max-w-sm mx-auto">
                    {/* Image at Top */}
                    <div className="relative aspect-[16/10] bg-black/5 overflow-hidden border-b border-border/30">
                      {screenshotUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={screenshotUrl}
                          alt={`Website concept for ${lead.businessName}`}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-xs p-4 text-center">
                          {screenshotLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin mb-1 text-emerald-600" />
                              <span>Rendering website concept snapshot…</span>
                            </>
                          ) : (
                            <span>Mockup will render on draft generation</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Message Body below Image */}
                    <div className="p-3.5 space-y-2 text-xs leading-relaxed text-[#111b21] dark:text-[#e9edef] whitespace-pre-line font-sans">
                      {draft || whatsappMessage || 'Click "Generate Tailored WhatsApp Card" to draft personalized announcement…'}

                      <div className="flex justify-end items-center gap-1 text-[10px] text-muted-foreground pt-1 select-none">
                        <span>11:50 AM</span>
                        <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" />
                      </div>
                    </div>

                    {/* 4. Quick Reply Buttons (Exact design as in user's image!) */}
                    <div className="border-t border-border/40 divide-y divide-border/40 bg-card/20 select-none">
                      <button
                        type="button"
                        onClick={() => handleUpdateInterest('INTERESTED')}
                        className="w-full py-2.5 px-3 text-xs font-semibold text-[#00a884] dark:text-[#00a884] hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Click to log prospect as Interested & stage for Proposal"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5" />
                        <span>Quick Reply: Interested</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateInterest('DO_NOT_CONTACT')}
                        className="w-full py-2 px-3 text-xs font-medium text-[#00a884]/80 dark:text-[#00a884]/80 hover:bg-rose-500/10 hover:text-rose-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Click to opt out"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5" />
                        <span>stop</span>
                      </button>
                    </div>
                  </div>

                  {/* Dispatch Guide banner */}
                  <div className="p-2 rounded bg-white/70 dark:bg-card/70 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>Click <strong>&ldquo;📋 Copy Image&rdquo;</strong> &rarr; In WhatsApp Web press <strong>Ctrl + V</strong> to send the card image directly!</span>
                  </div>

                  {/* Action Toolbar */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyScreenshotImage}
                      disabled={copyImageStatus === 'COPYING' || !screenshotUrl}
                      className={`text-xs h-8 gap-1.5 font-medium bg-white dark:bg-card shadow-xs ${
                        copyImageStatus === 'COPIED'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                          : 'border-border'
                      }`}
                      title="Copy PNG screenshot directly to OS clipboard for Ctrl+V in WhatsApp"
                    >
                      {copyImageStatus === 'COPYING' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : copyImageStatus === 'COPIED' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-primary" />
                      )}
                      <span>{copyImageStatus === 'COPIED' ? 'Image Copied!' : '📋 Copy Image'}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyDraftText}
                      disabled={!draft}
                      className="text-xs h-8 gap-1.5 font-medium bg-white dark:bg-card border-border shadow-xs hover:bg-muted"
                    >
                      {copyTextStatus === 'COPIED' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span>{copyTextStatus === 'COPIED' ? 'Text Copied!' : '📋 Copy Text'}</span>
                    </Button>
                  </div>

                  {whatsappShareUrl && (
                    <a
                      href={whatsappShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg shadow-sm transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open in WhatsApp Web</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Email & Phone Channels */
          <div className="space-y-3">
            {/* Visual Screenshot Card */}
            <div className="space-y-2 rounded-lg border border-border bg-muted/10 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <span>Website Concept Mockup</span>
                  <Badge variant="outline" className="text-[9px] font-normal py-0">
                    Direct Image Ready
                  </Badge>
                </p>
                {screenshotLoading && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Capturing snapshot…
                  </span>
                )}
              </div>

              {screenshotUrl ? (
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-md overflow-hidden border border-border bg-black/5 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshotUrl}
                      alt={`Demo website preview for ${lead.businessName}`}
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyScreenshotImage}
                      disabled={copyImageStatus === 'COPYING'}
                      className="text-xs h-8 gap-1.5 font-medium border-border"
                    >
                      {copyImageStatus === 'COPIED' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-primary" />
                      )}
                      <span>{copyImageStatus === 'COPIED' ? 'Image Copied!' : '📋 Copy Image'}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={downloadScreenshot}
                      className="text-xs h-8 gap-1.5 font-medium border-border"
                    >
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>⬇️ Download PNG</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-muted-foreground border border-dashed border-border rounded-md">
                  {screenshotLoading ? 'Generating preview snapshot…' : 'Snapshot will attach on draft generation'}
                </div>
              )}
            </div>

            {/* Email Subject */}
            {channel === 'EMAIL' && draftSubject && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Subject Line</label>
                <Input
                  value={draftSubject}
                  onChange={(e) => setDraftSubject(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            )}

            {/* Generate Draft Button */}
            <Button
              onClick={generateDraft}
              disabled={draftLoading || !intent.trim()}
              className="w-full gap-2 text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {draftLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{draftLoading ? 'Drafting Tailored Copy…' : `Generate Tailored ${CHANNEL_META[channel].label} Draft`}</span>
            </Button>

            {/* Error */}
            {draftError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {draftError}
              </div>
            )}

            {/* Draft output for email */}
            {draft && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Generated Draft ({CHANNEL_META[channel].label})</span>
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copyDraftText}
                    className="h-6.5 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                  >
                    {copyTextStatus === 'COPIED' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </Button>
                </div>

                <textarea
                  rows={8}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full text-xs rounded-md border border-border bg-muted/20 px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed font-sans"
                />
              </div>
            )}
          </div>
        )}

        {/* Log Prospect Response & Interest */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>Log Prospect Response &amp; Intent</span>
            </p>
            {interestStatus && (
              <Badge variant="outline" className="text-[10px]">
                Current: {interestStatus.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            How did {lead.businessName} respond to your outreach?
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleUpdateInterest('INTERESTED')}
              disabled={updatingInterest}
              className="text-xs h-8 border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5 font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Replied YES / Interested</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleUpdateInterest('PROPOSAL')}
              disabled={updatingInterest}
              className="text-xs h-8 border-blue-600/40 text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Asked Pricing / Details</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleUpdateInterest('NOT_INTERESTED')}
              disabled={updatingInterest}
              className="text-xs h-8 border-border text-muted-foreground hover:bg-muted gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Declined / Not Now</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleUpdateInterest('DO_NOT_CONTACT')}
              disabled={updatingInterest}
              className="text-xs h-8 border-destructive/40 text-destructive hover:bg-destructive/10 gap-1.5"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Opt-Out / Stop Contact</span>
            </Button>
          </div>

          {interestNotice && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
              <span>{interestNotice}</span>
              {interestStatus === 'INTERESTED' && (
                <Link
                  href="/proposals"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 underline ml-2"
                >
                  Create Proposal →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-semibold text-foreground">Contact Notes (optional)</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Sent via WhatsApp with concept image attached…"
            className="text-xs h-8"
          />
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-5 py-4 border-t border-border bg-muted/20 space-y-2">
        {emailSent ? (
          <div className="flex items-center gap-2 justify-center py-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Email Dispatched to {lead.publicEmail}
          </div>
        ) : contactedDone ? (
          <div className="flex items-center gap-2 justify-center py-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Marked as Contacted
          </div>
        ) : (
          <>
            {channel === 'EMAIL' && draft && lead.publicEmail && (
              <Button
                variant="default"
                className="w-full gap-2 text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={sendEmail}
                disabled={emailSending}
              >
                {emailSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                {emailSending ? 'Sending Email…' : `Send Email to ${lead.publicEmail} (w/ Screenshot)`}
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full gap-2 text-xs h-9 border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
              onClick={markContacted}
              disabled={contactedLoading || emailSending}
            >
              {contactedLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              {contactedLoading ? 'Saving…' : 'Mark as Contacted (Manual)'}
            </Button>
          </>
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
  onRefresh: () => void;
}

function OutreachQueueTab({ leads, loading, error, onRefresh }: OutreachQueueTabProps) {
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<'ALL' | 'VIEWED' | 'INTERESTED' | 'PHONE' | 'READY'>('ALL');
  const [approvingAll, setApprovingAll] = useState(false);

  const handleContacted = useCallback((leadId: string) => {
    setContactedIds((prev) => new Set([...Array.from(prev), leadId]));
  }, []);

  const uncontacted = leads.filter((l) => !contactedIds.has(l.id));

  const displayLeads = uncontacted.filter((l) => {
    if (filterMode === 'VIEWED') {
      return Boolean(l.websiteDemos?.[0]?.viewCount && l.websiteDemos[0].viewCount > 0);
    }
    if (filterMode === 'INTERESTED') {
      return l.leadStatus === 'INTERESTED';
    }
    if (filterMode === 'PHONE') {
      return Boolean(l.publicPhone);
    }
    if (filterMode === 'READY') {
      return l.leadStatus === 'APPROVED' || l.leadStatus === 'OUTREACH_PENDING';
    }
    return true; // ALL
  });

  const readyCount = uncontacted.filter(
    (l) => l.leadStatus === 'APPROVED' || l.leadStatus === 'OUTREACH_PENDING'
  ).length;
  const viewedCount = uncontacted.filter(
    (l) => Boolean(l.websiteDemos?.[0]?.viewCount && l.websiteDemos[0].viewCount > 0)
  ).length;
  const interestedCount = uncontacted.filter(
    (l) => l.leadStatus === 'INTERESTED'
  ).length;
  const phoneCount = uncontacted.filter((l) => Boolean(l.publicPhone)).length;

  const handleQuickApproveAll = async () => {
    setApprovingAll(true);
    try {
      const leadsToApprove = uncontacted.filter(
        (l) => l.leadStatus !== 'APPROVED' && l.leadStatus !== 'CONTACTED' && l.leadStatus !== 'DO_NOT_CONTACT'
      );
      const BATCH_SIZE = 10;
      for (let i = 0; i < leadsToApprove.length; i += BATCH_SIZE) {
        const chunk = leadsToApprove.slice(i, i + BATCH_SIZE);
        await Promise.all(
          chunk.map((l) =>
            fetch(`/api/leads/${l.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                leadStatus: 'APPROVED',
                reason: 'Batch approved for automated outreach campaign',
                actor: 'Solo Agency Operator',
              }),
            })
          )
        );
      }
      onRefresh();
    } catch {
      // Non-blocking
    } finally {
      setApprovingAll(false);
    }
  };

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

  if (leads.length === 0) {
    return (
      <Card className="border-border/60 shadow-none">
        <CardContent className="p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Your CRM has zero leads</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              Go to the Discovery page to run an automated search or drag-and-drop a CSV file of CA firms.
            </p>
          </div>
          <Link href="/discovery">
            <Button size="sm" className="gap-2 text-xs">
              <ArrowRight className="w-3.5 h-3.5" />
              Go to Lead Discovery
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
          onRefresh={onRefresh}
        />
      )}

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-md border border-border/60 flex-wrap">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterMode === 'ALL'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Leads ({uncontacted.length})
          </button>
          <button
            onClick={() => setFilterMode('VIEWED')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              filterMode === 'VIEWED'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-xs font-bold'
                : 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
            }`}
          >
            <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span>🔥 Viewed ({viewedCount})</span>
          </button>
          <button
            onClick={() => setFilterMode('INTERESTED')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              filterMode === 'INTERESTED'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-xs font-bold'
                : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>🟢 Interested ({interestedCount})</span>
          </button>
          <button
            onClick={() => setFilterMode('PHONE')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterMode === 'PHONE'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            WhatsApp Ready ({phoneCount})
          </button>
          <button
            onClick={() => setFilterMode('READY')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterMode === 'READY'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Ready ({readyCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {readyCount < uncontacted.length && (
            <Button
              size="sm"
              variant="outline"
              disabled={approvingAll}
              onClick={handleQuickApproveAll}
              className="h-8 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
            >
              {approvingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              {approvingAll ? 'Approving All…' : '1-Click Approve All Leads'}
            </Button>
          )}
          <Link href="/discovery">
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
              + Discover More Leads
            </Button>
          </Link>
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
                  <td className="px-4 py-3 font-medium text-foreground max-w-[220px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="truncate max-w-[150px]">{lead.businessName}</span>
                      {lead.isDemoData && (
                        <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1 py-0.5 rounded">
                          DEMO
                        </span>
                      )}
                      {Boolean(lead.websiteDemos?.[0]?.viewCount && lead.websiteDemos[0].viewCount > 0) && (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[9px] h-4 px-1 gap-0.5 font-semibold">
                          <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          {lead.websiteDemos![0].viewCount}x
                        </Badge>
                      )}
                      {lead.leadStatus === 'INTERESTED' && (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[9px] h-4 px-1 font-semibold">
                          🟢 Interested
                        </Badge>
                      )}
                    </div>
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
                    <div className="flex items-center justify-end gap-1.5">
                      {lead.publicPhone && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 font-medium"
                          onClick={() => setSelectedLead(lead)}
                          title="Open WhatsApp Outreach Drawer (Direct image copy + tailored pitch)"
                        >
                          <MessageSquare className="w-3 h-3" />
                          WhatsApp
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 px-2.5 text-[11px] gap-1.5 font-medium"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <Send className="w-3 h-3" />
                        Draft &amp; Attach
                      </Button>
                    </div>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [allLeads, setAllLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/leads?pageSize=200');
      if (!res.ok) throw new Error(`Failed to load leads (${res.status})`);
      const data = await res.json();
      setAllLeads(data.leads ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load leads.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Compute 4 core solo operator KPIs
  const totalLeads = allLeads.length;
  const readyOrGenerated = allLeads.filter(
    (l) =>
      l.leadStatus === 'APPROVED' ||
      l.leadStatus === 'OUTREACH_PENDING' ||
      l.leadStatus === 'DEMO_GENERATED' ||
      Boolean(l.websiteDemos?.length)
  ).length;
  const viewedByProspect = allLeads.filter(
    (l) => Boolean(l.websiteDemos?.[0]?.viewCount && l.websiteDemos[0].viewCount > 0)
  ).length;
  const interestedCount = allLeads.filter((l) => l.leadStatus === 'INTERESTED').length;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Outreach Workbench
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Direct prospect conversion engine — 1-click WhatsApp card pitches with automated website previews.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/discovery">
            <Button size="sm" className="gap-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add / Import Leads</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4-Stat KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Leads */}
        <Card className="p-3 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">Total Leads</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{loading ? '…' : totalLeads}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">In CRM Pipeline</div>
        </Card>

        {/* Ready / Demos Generated */}
        <Card className="p-3 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">Ready / Demos</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {loading ? '…' : readyOrGenerated}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Approved &amp; Pitch Ready</div>
        </Card>

        {/* Viewed by Prospect */}
        <Card className="p-3 border-amber-500/30 bg-amber-500/5 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-[11px] font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Viewed by Prospect</span>
            </span>
            <Eye className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {loading ? '…' : viewedByProspect}
          </div>
          <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">Opened demo link</div>
        </Card>

        {/* Interested */}
        <Card className="p-3 border-emerald-500/30 bg-emerald-500/5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-[11px] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>🟢 Interested</span>
            </span>
            <ArrowRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {loading ? '…' : interestedCount}
          </div>
          <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">Ready for Proposal</div>
        </Card>
      </div>

      {/* Main Outreach Workbench */}
      <OutreachQueueTab leads={allLeads} loading={loading} error={error} onRefresh={fetchLeads} />
    </div>
  );
}
