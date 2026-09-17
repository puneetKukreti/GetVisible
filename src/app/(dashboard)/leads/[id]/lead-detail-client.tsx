'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Building,
  Globe,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Clock,
  Send,
  FileCode,
  CheckCircle,
  User,
  History,
  Lock,
  Smartphone,
  Gauge,
  Tag,
  Sparkles,
  Eye,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ThumbsUp,
  Award,
  ArrowRight,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { LeadData, LeadStatus, OutreachMessage, WebsiteDemoData, Channel } from '@/types';
import { LeadStatusBadge, WebsiteStatusBadge, OpportunityScoreBadge } from '@/components/ui/status-badge';
import { DemoBadge } from '@/components/ui/demo-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { formatDate, formatDateTime } from '@/lib/utils';
import { calculateOperationalLeadScore } from '@/lib/analytics/service';
import {
  canPrepareOutreach,
  getNextActionRecommendation,
  ALLOWED_TRANSITIONS,
} from '@/lib/sales/lifecycle';
import { getPublicDemoUrl } from '@/lib/demos/public';

interface LeadDetailClientProps {
  initialLead: LeadData;
}

const REJECTION_REASONS = [
  'Design not suitable for this firm',
  'Content needs correction / revision',
  'Wrong business or service information',
  'Not interested in this lead',
  'Other',
];

const NOTE_PRESETS = [
  'Interested in custom website concept',
  'Requested pricing & timeline details',
  'Follow up next week',
  'Requested WhatsApp contact',
  'Not interested at this time',
];

export function LeadDetailClient({ initialLead }: LeadDetailClientProps) {
  const router = useRouter();
  const [lead, setLead] = useState<LeadData>(initialLead);
  const [updating, setUpdating] = useState(false);
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | ''>(initialLead.leadStatus);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Outreach workspace state
  const [outreachMessage, setOutreachMessage] = useState<OutreachMessage | null>(null);
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contactNotes, setContactNotes] = useState('');
  const [contactChannel, setContactChannel] = useState<Channel>('EMAIL');
  const [markingContacted, setMarkingContacted] = useState(false);

  // Demo approval & rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState(REJECTION_REASONS[0]);
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [approvingDemo, setApprovingDemo] = useState(false);
  const [rejectingDemo, setRejectingDemo] = useState(false);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);

  const handleCopyPublicLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPublicLink(true);
      setTimeout(() => setCopiedPublicLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Lead notes state
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Sync if prop changes
  useEffect(() => {
    setLead(initialLead);
    setSelectedStatus(initialLead.leadStatus);
  }, [initialLead]);

  const refetchLead = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { cache: 'no-store' });
      if (res.ok) {
        const updated: LeadData = await res.json();
        setLead(updated);
        setSelectedStatus(updated.leadStatus);
      }
    } catch {
      // Ignore background refetch failure
    }
  }, [lead.id]);

  const handleStatusChange = async (newStatus: LeadStatus, customReason?: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadStatus: newStatus,
          reason: customReason || statusReason || `Status changed to ${newStatus}`,
          actor: 'Agency Sales Specialist',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to update status');
      }

      setShowStatusModal(false);
      setStatusReason('');
      await refetchLead();
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error changing status');
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateDemo = async () => {
    setGeneratingDemo(true);
    try {
      const res = await fetch('/api/demos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate website demo concept');
      }
      await refetchLead();
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error generating demo');
    } finally {
      setGeneratingDemo(false);
    }
  };

  const handleApproveDemo = async (demoId: string) => {
    setApprovingDemo(true);
    try {
      const res = await fetch(`/api/demos/${demoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE', actor: 'Sales Specialist' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to approve demo');
      }
      await refetchLead();
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error approving demo');
    } finally {
      setApprovingDemo(false);
    }
  };

  const handleRejectDemo = async (demoId: string) => {
    setRejectingDemo(true);
    try {
      const effectiveReason =
        selectedRejectReason === 'Other'
          ? customRejectReason.trim() || 'Other reason'
          : selectedRejectReason;

      const res = await fetch(`/api/demos/${demoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          reason: effectiveReason,
          actor: 'Sales Specialist',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject demo');
      }
      setShowRejectModal(false);
      setCustomRejectReason('');
      await refetchLead();
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error rejecting demo');
    } finally {
      setRejectingDemo(false);
    }
  };

  const handleGenerateOutreach = async () => {
    setGeneratingOutreach(true);
    try {
      const activeDemo = lead.websiteDemos?.[0];
      const res = await fetch('/api/outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, demoId: activeDemo?.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate outreach');
      }
      setOutreachMessage(data.outreach);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error generating outreach');
    } finally {
      setGeneratingOutreach(false);
    }
  };

  const handleCopyOutreach = async () => {
    if (!outreachMessage) return;
    const fullText = outreachMessage.subject
      ? `Subject: ${outreachMessage.subject}\n\n${outreachMessage.message}`
      : outreachMessage.message;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Could not copy to clipboard. Please copy manually.');
    }
  };

  const handleMarkContacted = async () => {
    setMarkingContacted(true);
    try {
      const activeDemo = lead.websiteDemos?.[0];
      const res = await fetch('/api/outreach/contacted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          demoVersion: activeDemo?.version || 1,
          notes: contactNotes,
          actor: 'Sales Specialist',
          channel: contactChannel,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to mark as contacted');
      }
      setContactNotes('');
      await refetchLead();
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error marking as contacted');
    } finally {
      setMarkingContacted(false);
    }
  };

  const handleAddNote = async (text?: string) => {
    const note = (text || newNoteText).trim();
    if (!note) return;

    setSavingNote(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, actor: 'Sales Specialist' }),
      });
      if (!res.ok) {
        throw new Error('Failed to save note');
      }
      setNewNoteText('');
      await refetchLead();
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error saving note');
    } finally {
      setSavingNote(false);
    }
  };

  const activeDemo: WebsiteDemoData | null =
    lead.websiteDemos && lead.websiteDemos.length > 0 ? lead.websiteDemos[0] : null;

  const isDemoApproved =
    activeDemo?.approvalStatus === 'APPROVED' || lead.leadStatus === 'APPROVED';

  const outreachGate = canPrepareOutreach(lead, activeDemo);
  const nextAction = getNextActionRecommendation(lead, activeDemo);
  const isSuppressed =
    lead.leadStatus === 'DO_NOT_CONTACT' ||
    (lead.suppressionRecords && lead.suppressionRecords.length > 0);

  const demoUrl = `/demo/${lead.id}`;
  const publicDemoUrl = activeDemo?.publicToken ? getPublicDemoUrl(activeDemo.publicToken) : '';
  const operationalScore = calculateOperationalLeadScore(lead);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      {/* 1. Top Sales Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/leads">
            <Button variant="outline" size="sm" className="h-8 px-2.5">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{lead.businessName}</h1>
              {lead.isDemoData && <DemoBadge />}
              <WebsiteStatusBadge status={lead.websiteStatus} />
              <LeadStatusBadge status={lead.leadStatus} />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
              <span>{lead.profession}</span>
              <span>•</span>
              <span>{lead.city}</span>
              <span>•</span>
              <span>Discovered {formatDate(lead.createdAt)}</span>
            </p>
          </div>
        </div>

        {/* Global Controls: Change Status & DO NOT CONTACT */}
        <div className="flex items-center gap-2">
          {lead.leadStatus !== 'DO_NOT_CONTACT' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (
                  confirm(
                    'Mark this lead as DO NOT CONTACT? All outbound communication will be suppressed.'
                  )
                ) {
                  handleStatusChange('DO_NOT_CONTACT', 'Explicit opt-out / DO NOT CONTACT requested.');
                }
              }}
              disabled={updating}
              className="gap-1 text-xs"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>DO NOT CONTACT</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatusModal(true)}
            className="gap-1 text-xs"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Change Status</span>
          </Button>
        </div>
      </div>

      {/* Suppression Alert */}
      {isSuppressed && (
        <div className="p-3.5 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-3 text-xs">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Compliance Suppression Active (DO NOT CONTACT)</span>
            <span>Per anti-spam rules, outbound messaging to this lead is blocked across all channels.</span>
          </div>
        </div>
      )}

      {/* 2. Visual Pipeline Flow Stepper (GetVisible End-to-End Workflow) */}
      <div className="p-3 rounded-xl border border-border bg-card/60 overflow-x-auto shadow-2xs">
        <div className="flex items-center min-w-[780px] justify-between text-[11px] font-medium text-muted-foreground">
          {/* Step 1: Find CA Lead */}
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">1</span>
            <span>Find CA Lead</span>
          </div>
          <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />

          {/* Step 2: No Website */}
          <div className={`flex items-center gap-1.5 ${lead.websiteStatus === 'NO_WEBSITE' ? 'font-semibold text-emerald-600 dark:text-emerald-400' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${lead.websiteStatus === 'NO_WEBSITE' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-muted'}`}>2</span>
            <span>No Website</span>
          </div>
          <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />

          {/* Step 3: Generate Website */}
          <div className={`flex items-center gap-1.5 ${activeDemo ? 'font-semibold text-cyan-600 dark:text-cyan-400' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeDemo ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' : 'bg-muted'}`}>3</span>
            <span>Generate Website</span>
          </div>
          <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />

          {/* Step 4: Human Reviews */}
          <div className={`flex items-center gap-1.5 ${activeDemo ? (activeDemo.approvalStatus === 'APPROVED' ? 'font-semibold text-emerald-600 dark:text-emerald-400' : activeDemo.approvalStatus === 'REJECTED' ? 'font-semibold text-rose-600 dark:text-rose-400' : 'font-semibold text-amber-600 dark:text-amber-400') : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeDemo?.approvalStatus === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : activeDemo?.approvalStatus === 'REJECTED' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-muted'}`}>4</span>
            <span>
              {activeDemo?.approvalStatus === 'REJECTED' ? 'Reject (Improve)' : activeDemo?.approvalStatus === 'APPROVED' ? 'Approve' : 'Human Reviews'}
            </span>
          </div>
          <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />

          {/* Step 5: Outreach */}
          <div className={`flex items-center gap-1.5 ${isDemoApproved ? 'font-semibold text-primary' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isDemoApproved ? 'bg-primary/20 text-primary' : 'bg-muted'}`}>5</span>
            <span>Outreach</span>
          </div>
          <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />

          {/* Step 6: Mark Contacted */}
          <div className={`flex items-center gap-1.5 ${lead.leadStatus === 'CONTACTED' ? 'font-semibold text-indigo-600 dark:text-indigo-400' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${lead.leadStatus === 'CONTACTED' ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-muted'}`}>6</span>
            <span>Contacted</span>
          </div>
          <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />

          {/* Step 7: Response */}
          <div className={`flex items-center gap-1.5 ${lead.leadStatus === 'RESPONDED' || lead.leadStatus === 'REPLIED' ? 'font-semibold text-teal-600 dark:text-teal-400' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${lead.leadStatus === 'RESPONDED' || lead.leadStatus === 'REPLIED' ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400' : 'bg-muted'}`}>7</span>
            <span>Response</span>
          </div>
          <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />

          {/* Step 8: Interested */}
          <div className={`flex items-center gap-1.5 ${lead.leadStatus === 'INTERESTED' ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${lead.leadStatus === 'INTERESTED' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-muted'}`}>8</span>
            <span>Interested</span>
          </div>
          <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />

          {/* Step 9: Converted */}
          <div className={`flex items-center gap-1.5 ${lead.leadStatus === 'CONVERTED' || lead.leadStatus === 'CUSTOMER' ? 'font-semibold text-emerald-600 dark:text-emerald-400' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${lead.leadStatus === 'CONVERTED' || lead.leadStatus === 'CUSTOMER' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-muted'}`}>9</span>
            <span>Converted</span>
          </div>
        </div>
      </div>

      {/* 3. Contextual Sales Guidance Banner ("What should I do next?") */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <span className="flex h-5 w-5 rounded-full bg-primary/20 text-primary items-center justify-center text-[11px] font-bold">
              {nextAction.stepNumber}
            </span>
            <span>Current Stage: {nextAction.stageTitle}</span>
          </div>
          <p className="text-xs text-foreground font-medium">{nextAction.actionPrompt}</p>
        </div>

        {nextAction.recommendedButton && (
          <div className="shrink-0 flex items-center gap-2">
            {nextAction.recommendedButton.action === 'GENERATE_DEMO' && (
              <Button
                size="sm"
                onClick={handleGenerateDemo}
                disabled={generatingDemo || lead.websiteStatus !== 'NO_WEBSITE'}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1.5 text-xs shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{generatingDemo ? 'Generating...' : nextAction.recommendedButton.label}</span>
              </Button>
            )}

            {nextAction.recommendedButton.action === 'REVIEW_DEMO' && activeDemo && (
              <div className="flex items-center gap-2">
                <Link
                  href={demoUrl}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 font-medium transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Demo</span>
                </Link>
                <Button
                  size="sm"
                  onClick={() => handleApproveDemo(activeDemo.id)}
                  disabled={approvingDemo}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 text-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{approvingDemo ? 'Approving...' : 'Approve for Outreach'}</span>
                </Button>
              </div>
            )}

            {nextAction.recommendedButton.action === 'PREPARE_OUTREACH' && (
              <Button
                size="sm"
                onClick={() => {
                  if (!outreachMessage) {
                    handleGenerateOutreach();
                  }
                  document.getElementById('outreach-workspace')?.scrollIntoView({ behavior: 'smooth' });
                }}
                disabled={generatingOutreach}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-1 text-xs shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{generatingOutreach ? 'Generating Copy...' : nextAction.recommendedButton.label}</span>
              </Button>
            )}

            {nextAction.recommendedButton.action === 'RECORD_RESPONSE' && (
              <Button
                size="sm"
                onClick={() => {
                  const replyText = prompt('Enter a brief summary of the client reply / response:');
                  if (replyText !== null) {
                    handleStatusChange('RESPONDED', replyText || 'Client responded to outreach.');
                  }
                }}
                disabled={updating}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1 text-xs shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{nextAction.recommendedButton.label}</span>
              </Button>
            )}

            {nextAction.recommendedButton.action === 'MARK_INTERESTED' && (
              <Button
                size="sm"
                onClick={() => handleStatusChange('INTERESTED', 'Client confirmed interest in website design engagement.')}
                disabled={updating}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1 text-xs shadow-xs"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{nextAction.recommendedButton.label}</span>
              </Button>
            )}

            {nextAction.recommendedButton.action === 'MARK_CONVERTED' && (
              <Button
                size="sm"
                onClick={() => handleStatusChange('CONVERTED', 'Proposal accepted and client onboarded!')}
                disabled={updating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 text-xs shadow-xs"
              >
                <Award className="w-3.5 h-3.5" />
                <span>{nextAction.recommendedButton.label}</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Main Sales Execution Cards (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION A: WEBSITE DEMO & APPROVAL */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Website Concept Demo (Phase 4.2)</span>
                </CardTitle>
                {activeDemo?.approvalStatus ? (
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${
                      activeDemo.approvalStatus === 'APPROVED'
                        ? 'border-emerald-500 text-emerald-600 bg-emerald-500/10'
                        : activeDemo.approvalStatus === 'REJECTED'
                        ? 'border-rose-500 text-rose-600 bg-rose-500/10'
                        : 'border-amber-500 text-amber-600 bg-amber-500/10'
                    }`}
                  >
                    {activeDemo.approvalStatus === 'APPROVED'
                      ? '✓ Concept Approved'
                      : activeDemo.approvalStatus === 'REJECTED'
                      ? '✗ Concept Rejected'
                      : 'Review Required'}
                  </Badge>
                ) : activeDemo ? (
                  <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600 bg-amber-500/10">
                    Review Required
                  </Badge>
                ) : null}
              </div>
              <CardDescription className="text-xs">
                Personalized website concept generated exclusively for verified NO_WEBSITE businesses.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              {activeDemo ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">
                          Version {activeDemo.version}
                        </span>
                        <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded font-mono font-medium">
                          {activeDemo.design?.layout || activeDemo.templateId}
                        </span>
                        <span className="text-[11px] bg-slate-800 text-slate-200 px-2 py-0.5 rounded font-mono">
                          {activeDemo.theme?.name || 'Executive Navy'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Generated {formatDateTime(activeDemo.createdAt)} • Zero unsupported claims guaranteed.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={demoUrl}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 font-bold text-xs shadow-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Open Demo</span>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={generatingDemo}
                        onClick={handleGenerateDemo}
                        className="gap-1 text-xs"
                        title="Generate a new version"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${generatingDemo ? 'animate-spin' : ''}`} />
                        <span>Regenerate (v{lead.websiteDemos ? lead.websiteDemos.length + 1 : 2})</span>
                      </Button>
                    </div>
                  </div>

                  {/* 4-Stage Lifecycle Indicator */}
                  <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                    <div className="flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
                      {/* Stage 1: Generated */}
                      <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>1. Concept Generated</span>
                      </div>

                      <span className="text-muted-foreground">→</span>

                      {/* Stage 2: Pending Review */}
                      <div
                        className={`flex items-center gap-1.5 font-medium ${
                          activeDemo.approvalStatus === 'APPROVED'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : activeDemo.approvalStatus === 'REJECTED'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400 font-bold'
                        }`}
                      >
                        {activeDemo.approvalStatus === 'APPROVED' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : activeDemo.approvalStatus === 'REJECTED' ? (
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>2. Review</span>
                      </div>

                      <span className="text-muted-foreground">→</span>

                      {/* Stage 3: Approved */}
                      <div
                        className={`flex items-center gap-1.5 font-medium ${
                          activeDemo.approvalStatus === 'APPROVED'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : activeDemo.approvalStatus === 'REJECTED'
                            ? 'text-rose-600 line-through opacity-70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {activeDemo.approvalStatus === 'APPROVED' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : activeDemo.approvalStatus === 'REJECTED' ? (
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-muted-foreground/40 shrink-0" />
                        )}
                        <span>3. Approved</span>
                      </div>

                      <span className="text-muted-foreground">→</span>

                      {/* Stage 4: Public Demo Available */}
                      <div
                        className={`flex items-center gap-1.5 font-medium ${
                          activeDemo.approvalStatus === 'APPROVED' && activeDemo.publicToken
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {activeDemo.approvalStatus === 'APPROVED' && activeDemo.publicToken ? (
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>4. Public Demo Available</span>
                      </div>
                    </div>
                  </div>

                  {/* Public Shareable Demo Link Card (Shown only when APPROVED) */}
                  {activeDemo.approvalStatus === 'APPROVED' && publicDemoUrl ? (
                    <div className="p-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-foreground text-xs">Public Shareable Demo URL</span>
                            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                              Prospect-Facing
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Safe public link. Contains zero CRM chrome, no internal IDs, and no admin controls.
                          </p>
                        </div>

                        {/* Lightweight Analytics Summary */}
                        <div className="text-left sm:text-right text-[11px] text-muted-foreground">
                          <div>
                            <span className="font-semibold text-foreground font-mono">
                              {activeDemo.viewCount || 0}
                            </span>{' '}
                            <span>{activeDemo.viewCount === 1 ? 'view' : 'views'}</span>
                          </div>
                          {activeDemo.lastViewedAt && (
                            <span className="block text-[10px] text-muted-foreground/80">
                              Last opened: {formatDateTime(activeDemo.lastViewedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* URL Bar & Action Buttons */}
                      <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-1.5 pl-3">
                        <code className="text-xs font-mono text-foreground flex-1 truncate select-all">
                          {publicDemoUrl}
                        </code>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyPublicLink(publicDemoUrl)}
                          className="h-7 text-xs px-2.5 gap-1.5 shrink-0 border-border hover:bg-muted"
                          title="Copy public URL to clipboard"
                        >
                          {copiedPublicLink ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-semibold">Demo link copied.</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </Button>

                        <a
                          href={publicDemoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Demo</span>
                        </a>
                      </div>
                    </div>
                  ) : activeDemo.approvalStatus === 'PENDING_REVIEW' ? (
                    <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Concept is pending review. The public prospect link will become active once approved.
                      </span>
                    </div>
                  ) : activeDemo.approvalStatus === 'REJECTED' ? (
                    <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        Concept was rejected. Public share link is disabled and inaccessible to prospects.
                      </span>
                    </div>
                  ) : null}

                  {/* Demo Approval Actions */}
                  <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-foreground text-xs block">Human Review & Approval</span>
                        <span className="text-[11px] text-muted-foreground">
                          A human must approve the website concept before outreach can be prepared.
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveDemo(activeDemo.id)}
                          disabled={approvingDemo || activeDemo.approvalStatus === 'APPROVED'}
                          className={`text-xs gap-1.5 ${
                            activeDemo.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-600/20 text-emerald-600 border border-emerald-500/40 cursor-default'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{activeDemo.approvalStatus === 'APPROVED' ? 'Approved' : 'Approve for Outreach'}</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRejectModal(true)}
                          disabled={rejectingDemo}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-rose-500/30 gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject Demo</span>
                        </Button>
                      </div>
                    </div>

                    {activeDemo.approvalStatus === 'REJECTED' && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs">
                        <span className="font-semibold block">Rejection Feedback:</span>
                        <span>{activeDemo.rejectionReason || 'Requires revision before client review.'}</span>
                      </div>
                    )}
                  </div>

                  {/* Version History List */}
                  {lead.websiteDemos && lead.websiteDemos.length > 1 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-muted-foreground block">
                        Concept History ({lead.websiteDemos.length} versions):
                      </span>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {lead.websiteDemos.map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between p-2 rounded bg-muted/30 text-[11px] border border-border/50"
                          >
                            <span className="font-medium">
                              v{d.version} • {d.design?.layout || d.templateId} ({d.theme?.name || 'Navy'})
                            </span>
                            <div className="flex items-center gap-2">
                              {d.approvalStatus && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                    d.approvalStatus === 'APPROVED'
                                      ? 'bg-emerald-500/10 text-emerald-600'
                                      : d.approvalStatus === 'REJECTED'
                                      ? 'bg-rose-500/10 text-rose-600'
                                      : 'bg-amber-500/10 text-amber-600'
                                  }`}
                                >
                                  {d.approvalStatus}
                                </span>
                              )}
                              <span className="text-muted-foreground font-mono">{formatDate(d.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : lead.websiteStatus === 'NO_WEBSITE' ? (
                <div className="p-6 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 text-center space-y-3">
                  <Sparkles className="w-6 h-6 text-amber-500 mx-auto" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">No Website Concept Generated Yet</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                      This firm is verified as having NO WEBSITE. Generate a tailored, 2026-grade concept demo to initiate the sales workflow.
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateDemo}
                    disabled={generatingDemo}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-2 text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{generatingDemo ? 'Generating Website Concept...' : 'Generate Website Concept Demo'}</span>
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-border bg-muted/20 text-muted-foreground space-y-1 text-xs">
                  <span className="font-semibold text-foreground block">Demo Concept Generation Blocked</span>
                  <p>
                    Demo generation is restricted strictly to businesses verified with <strong>NO_WEBSITE</strong>. Current status: <strong>{lead.websiteStatus}</strong>.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION B: OUTREACH WORKSPACE (HUMAN-CONTROLLED) */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-500" />
                  <span>Personalized Outreach Workspace</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                  Human-in-the-Loop Only
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Zero automated sending. Review, edit, copy, and send outreach manually through your own communication channels.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              {!outreachGate.allowed ? (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Outreach Preparation Gated</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    A reviewed and approved website demo is required before outreach can be prepared. Current requirement:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-muted-foreground">
                    <li className={lead.websiteStatus === 'NO_WEBSITE' ? 'text-emerald-600' : 'text-amber-600'}>
                      Qualification: Verified NO_WEBSITE ({lead.websiteStatus === 'NO_WEBSITE' ? 'Satisfied' : 'Pending'})
                    </li>
                    <li className={activeDemo ? 'text-emerald-600' : 'text-amber-600'}>
                      Demo Generated ({activeDemo ? `v${activeDemo.version} exists` : 'Pending'})
                    </li>
                    <li className={isDemoApproved ? 'text-emerald-600' : 'text-amber-600'}>
                      Demo Approved for Outreach ({isDemoApproved ? 'Approved' : 'Pending Review'})
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Verified Demo Link Confirmation */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-foreground">Verified Demo Link:</span>
                      <code className="text-primary font-mono text-xs">{publicDemoUrl || demoUrl}</code>
                    </div>
                    <Link
                      href={publicDemoUrl || demoUrl}
                      target="_blank"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <span>Test Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Outreach Generator Button / Status */}
                  {!outreachMessage ? (
                    <div className="p-4 rounded-xl border border-border bg-card text-center space-y-3">
                      <p className="text-muted-foreground">
                        Click below to generate a tailored, professional pitch based on verified business facts and the approved concept demo.
                      </p>
                      <Button
                        onClick={handleGenerateOutreach}
                        disabled={generatingOutreach}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 text-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{generatingOutreach ? 'Drafting Outreach Copy...' : 'Generate Personalized Message'}</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Outreach Message Draft</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateOutreach}
                            disabled={generatingOutreach}
                            className="gap-1 text-xs h-7"
                          >
                            <RefreshCw className={`w-3 h-3 ${generatingOutreach ? 'animate-spin' : ''}`} />
                            <span>Regenerate</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleCopyOutreach}
                            className="gap-1.5 text-xs h-7 bg-primary text-primary-foreground font-bold"
                          >
                            {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied to Clipboard!' : 'Copy Message'}</span>
                          </Button>
                        </div>
                      </div>

                      {/* Subject Line */}
                      {outreachMessage.subject && (
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Email Subject Line:
                          </label>
                          <input
                            type="text"
                            value={outreachMessage.subject}
                            onChange={(e) =>
                              setOutreachMessage({ ...outreachMessage, subject: e.target.value })
                            }
                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                      )}

                      {/* Message Body */}
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Message Body (Editable):
                        </label>
                        <textarea
                          rows={8}
                          value={outreachMessage.message}
                          onChange={(e) =>
                            setOutreachMessage({ ...outreachMessage, message: e.target.value })
                          }
                          className="w-full rounded-md border border-input bg-background p-3 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring font-sans"
                        />
                      </div>

                      {outreachMessage.personalizationReason && (
                        <p className="text-[11px] text-muted-foreground italic">
                          Rationale: {outreachMessage.personalizationReason}
                        </p>
                      )}

                      {/* Mark as Contacted Manual Action */}
                      <div className="pt-3 border-t border-border space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-foreground block">Manual Outreach Dispatch Tracking</span>
                            <span className="text-[11px] text-muted-foreground">
                              After copying and sending this message via email or messaging, record it here.
                            </span>
                          </div>
                          <Button
                            size="sm"
                            onClick={handleMarkContacted}
                            disabled={markingContacted || lead.leadStatus === 'CONTACTED'}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs shrink-0"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>
                              {markingContacted
                                ? 'Recording...'
                                : lead.leadStatus === 'CONTACTED'
                                ? 'Already Marked Contacted'
                                : 'Mark as Contacted'}
                            </span>
                          </Button>
                        </div>

                        {/* Channel selector */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[11px] font-semibold text-muted-foreground">Outreach Channel:</span>
                          {(['EMAIL', 'WHATSAPP', 'PHONE'] as Channel[]).map((ch) => (
                            <button
                              key={ch}
                              type="button"
                              onClick={() => setContactChannel(ch)}
                              className={`text-[11px] px-2.5 py-0.5 rounded border transition-colors ${
                                contactChannel === ch
                                  ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                                  : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {ch === 'EMAIL' ? 'Email' : ch === 'WHATSAPP' ? 'WhatsApp' : 'Phone Call'}
                            </button>
                          ))}
                        </div>

                        <input
                          type="text"
                          placeholder="Optional notes: e.g. Dispatched proposal via chosen channel to partner"
                          value={contactNotes}
                          onChange={(e) => setContactNotes(e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION C: CONTACT INFORMATION & BUSINESS FACTS */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" />
                <span>Verified Business Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Phone</span>
                  <span className="font-medium text-foreground">{lead.publicPhone || 'Not recorded'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Email</span>
                  <span className="font-medium text-foreground">{lead.publicEmail || 'Not recorded'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Office Address</span>
                  <span className="font-medium text-foreground">{lead.address || 'Delhi NCR'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">City / Territory</span>
                  <span className="font-medium text-foreground">{lead.city}</span>
                </div>
              </div>

              {lead.source && (
                <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                  Source: <strong className="text-foreground">{lead.source}</strong> ({lead.sourceQuality || 'PUBLIC_BUSINESS_DIRECTORY'})
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Notes & Sales Timeline (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* OPERATIONAL LEAD SCORE BREAKDOWN */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 text-foreground">
                  <Gauge className="w-3.5 h-3.5 text-primary" />
                  <span>Operational Lead Score</span>
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-foreground">{operationalScore.score}</span>
                  <span className="text-xs text-muted-foreground font-mono">/ {operationalScore.maxScore}</span>
                </div>
              </div>
              <CardDescription className="text-[11px] mt-0.5 text-muted-foreground">
                {operationalScore.summary}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3 space-y-2 text-xs">
              <div className="space-y-1.5">
                {operationalScore.rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-2 rounded border text-[11px] flex items-start justify-between gap-2 ${
                      rule.satisfied
                        ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
                        : 'border-border/50 bg-muted/20 text-muted-foreground'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        {rule.satisfied ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span>{rule.label}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight pl-5">
                        {rule.explanation}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold shrink-0 ${
                        rule.satisfied ? 'text-emerald-600' : 'text-muted-foreground'
                      }`}
                    >
                      +{rule.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SALES NOTES */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 text-foreground">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Sales Notes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3 text-xs">
              {/* Note input */}
              <div className="space-y-2">
                <textarea
                  rows={2}
                  placeholder="Add note: e.g. Asked for pricing, follow up Tuesday..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button
                  size="sm"
                  onClick={() => handleAddNote()}
                  disabled={savingNote || !newNoteText.trim()}
                  className="w-full text-xs h-7"
                >
                  {savingNote ? 'Saving...' : 'Add Note'}
                </Button>
              </div>

              {/* Quick tags */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Quick Note Tags:
                </span>
                <div className="flex flex-wrap gap-1">
                  {NOTE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddNote(preset)}
                      className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/60 transition"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stored notes list */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Notes Log ({lead.notes?.length || 0}):
                </span>
                {lead.notes && lead.notes.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {lead.notes.map((n) => (
                      <div key={n.id} className="p-2 rounded bg-muted/30 border border-border/50 text-[11px] space-y-0.5">
                        <p className="text-foreground">{n.text}</p>
                        <div className="text-[9px] text-muted-foreground flex items-center justify-between">
                          <span>{n.createdBy}</span>
                          <span>{formatDate(n.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-[11px] italic">No notes recorded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ACTIVITY & AUDIT TIMELINE */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 text-foreground">
                <History className="w-3.5 h-3.5 text-primary" />
                <span>Sales Activity Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3 text-xs">
              {lead.activities && lead.activities.length > 0 ? (
                <div className="relative pl-4 space-y-3.5 before:content-[''] before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {lead.activities.map((act) => (
                    <div key={act.id} className="relative space-y-0.5">
                      <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                      <div className="font-semibold text-foreground text-xs leading-none">{act.title}</div>
                      <div className="text-[11px] text-muted-foreground leading-tight pt-0.5">
                        {act.description}
                      </div>
                      <div className="text-[10px] text-muted-foreground/80 font-mono">
                        {formatDateTime(act.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs italic">No sales activity recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* REJECT DEMO MODAL */}
      {showRejectModal && activeDemo && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-border shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-600">
                <XCircle className="w-4 h-4" />
                <span>Reject Website Demo Concept</span>
              </CardTitle>
              <CardDescription className="text-xs">
                The demo will be marked as rejected with your reason. It will remain stored for audit history and will NOT be deleted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Reason for Rejection</label>
                <select
                  value={selectedRejectReason}
                  onChange={(e) => setSelectedRejectReason(e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {REJECTION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRejectReason === 'Other' && (
                <div>
                  <label className="font-semibold text-foreground block mb-1">Specify Reason</label>
                  <input
                    type="text"
                    placeholder="Enter reason..."
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={rejectingDemo}
                  onClick={() => handleRejectDemo(activeDemo.id)}
                >
                  {rejectingDemo ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CHANGE STATUS MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-border shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Change Lead Sales Status</CardTitle>
              <CardDescription className="text-xs">
                Transitioning status records an audit log entry in the activity timeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">New Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as LeadStatus)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="NEW">NEW</option>
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="DEMO_GENERATED">DEMO_GENERATED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="RESPONDED">RESPONDED</option>
                  <option value="INTERESTED">INTERESTED</option>
                  <option value="CONVERTED">CONVERTED</option>
                  <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                  <option value="DO_NOT_CONTACT">DO_NOT_CONTACT (Suppression Override)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Discussed with lead on telephone"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={updating || !selectedStatus}
                  onClick={() => handleStatusChange(selectedStatus as LeadStatus)}
                >
                  {updating ? 'Updating...' : 'Confirm Update'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
