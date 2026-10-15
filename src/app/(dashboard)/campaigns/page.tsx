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
  RefreshCw,
} from 'lucide-react';
import { generatePublicDemoToken, getAppBaseUrl } from '@/lib/demos/public';

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

// ─── Screenshot & Media Utilities ──────────────────────────────────────────

function getScreenshotImageUrl(lead: LeadData, refresh = false) {
  const params = new URLSearchParams({
    format: 'image',
    name: lead.businessName || '',
    city: lead.city || 'Delhi NCR',
    profession: lead.profession || 'CA',
  });
  if (refresh) {
    params.set('refresh', 'true');
    params.set('t', String(Date.now()));
  }
  return `/api/demos/${encodeURIComponent(lead.id)}/screenshot?${params.toString()}`;
}

function generateInlineSvgDataUri(brandName: string, city: string, profession: string = 'Chartered Accountants') {
  const escapedBrand = (brandName || 'Chartered Accountants')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  const escapedCity = (city || 'Delhi NCR')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  const escapedProf = (profession || 'Chartered Accountants')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 640" width="1024" height="640">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00152a"/>
      <stop offset="50%" stop-color="#08213d"/>
      <stop offset="100%" stop-color="#0c2d52"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#d4af37"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="640" fill="url(#bg)"/>
  <rect width="1024" height="74" fill="#001122" fill-opacity="0.95"/>
  <circle cx="56" cy="37" r="16" fill="#fde047" fill-opacity="0.15" stroke="#fde047" stroke-width="1.5"/>
  <text x="56" y="42" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#fde047" text-anchor="middle">CA</text>
  <text x="86" y="38" font-family="Georgia, serif" font-size="16" font-weight="bold" fill="#ffffff">${escapedBrand}</text>
  <text x="86" y="52" font-family="system-ui, sans-serif" font-size="10" letter-spacing="1.5" fill="#a0aec0">${escapedProf.toUpperCase()}</text>
  <rect x="70" y="140" width="380" height="34" rx="17" fill="#fde047" fill-opacity="0.15" stroke="#fde047" stroke-opacity="0.4" stroke-width="1.5"/>
  <text x="90" y="162" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#fde047" letter-spacing="0.5">✦ ${escapedBrand} • ${escapedCity.toUpperCase()}</text>
  <text x="70" y="235" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="#ffffff">${escapedBrand}</text>
  <text x="70" y="285" font-family="Georgia, serif" font-size="28" font-weight="normal" fill="#e2e8f0">Trusted Financial Clarity &amp; Strategic Advisory</text>
  <text x="70" y="325" font-family="system-ui, sans-serif" font-size="17" fill="#94a3b8">Comprehensive Statutory Audit, Direct Tax Defense &amp; Corporate Advisory in ${escapedCity}.</text>
  <rect x="70" y="385" width="220" height="48" rx="8" fill="url(#gold)"/>
  <text x="180" y="415" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#00152a" text-anchor="middle">Schedule Consultation →</text>
  <rect x="310" y="385" width="180" height="48" rx="8" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1.5"/>
  <text x="400" y="415" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">Explore Practice</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function renderUrlToPngBlob(imageUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1024;
        canvas.height = img.naturalHeight || 640;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }
        ctx.fillStyle = '#00152a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Image failed to load onto canvas'));
    img.src = imageUrl;
  });
}

function getMeaningfulWhatsAppMessage(lead: LeadData): {
  message: string;
  demoUrl: string;
  quickInterestedUrl: string;
  followUpWithLink: string;
} {
  const businessSlug = generatePublicDemoToken(lead.businessName);
  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : getAppBaseUrl();
  const demoUrl = `${baseOrigin}/demo/${lead.websiteDemos?.[0]?.publicToken || businessSlug}`;

  const myWhatsApp = (
    process.env.NEXT_PUBLIC_PUNEET_WHATSAPP ||
    process.env.NEXT_PUBLIC_AGENCY_WHATSAPP ||
    '919811122233'
  ).replace(/[^0-9]/g, '');

  const quickInterestedUrl = `https://wa.me/${myWhatsApp}?text=${encodeURIComponent(
    `Hi Puneet, I viewed the website preview for ${lead.businessName} (${demoUrl}) and I am INTERESTED in making it live.`
  )}`;

  const cityLabel = lead.city || 'Delhi NCR';

  const message = `Namaste *${lead.businessName}* 👋

When prospective clients or businesses in *${cityLabel}* are referred to you, the first thing they do before reaching out is search your name online to view your profile and services.

To help *${lead.businessName}* build that instant digital trust, I designed a clean, professional website concept tailored specifically for you *(preview image attached above 👆)*.

🌐 *View Your Custom Website Preview:*
${demoUrl}

━━━━━━━━━━━━━━━━━━━━
✅ *Interested in making this live on your own domain?*
👉 *Click here if Interested:* ${quickInterestedUrl}
*(Or simply reply *"INTERESTED"* to this message)*`;

  const followUpWithLink = `Thanks for replying! 🙌 Here is the official live preview link we prepared for *${lead.businessName}*:

👉 ${demoUrl}

You can scroll through it right on your phone. Let me know if you'd like any color or text changes — we can make this live on your own domain within 48 hours!`;

  return { message, demoUrl, quickInterestedUrl, followUpWithLink };
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
  const initialWa = getMeaningfulWhatsAppMessage(lead);
  const [draft, setDraft] = useState(initialWa.message);
  const [emailDraft, setEmailDraft] = useState('');
  const [whatsappStep, setWhatsappStep] = useState<'step1' | 'step2'>('step1');
  const [whatsappMessage, setWhatsappMessage] = useState(initialWa.message);
  const [whatsappFollowUpWithLink, setWhatsappFollowUpWithLink] = useState(initialWa.followUpWithLink);
  const [screenshotUrl, setScreenshotUrl] = useState<string>(() => getScreenshotImageUrl(lead));
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [refreshingHeroShot, setRefreshingHeroShot] = useState(false);
  const [whatsappShareUrl, setWhatsappShareUrl] = useState<string | null>(null);
  const [whatsappFollowUpShareUrl, setWhatsappFollowUpShareUrl] = useState<string | null>(null);
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

  // Automatically ensure hero screenshot and tailored copy are ready with zero-stuck hard timer
  useEffect(() => {
    const wa = getMeaningfulWhatsAppMessage(lead);
    setWhatsappMessage(wa.message);
    setWhatsappFollowUpWithLink(wa.followUpWithLink);
    if (channel === 'WHATSAPP') {
      setDraft(whatsappStep === 'step1' ? wa.message : wa.followUpWithLink);
    }

    const cleanPhone = (lead.publicPhone || '').replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    if (waPhone) {
      setWhatsappShareUrl(`https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(wa.message)}`);
      setWhatsappFollowUpShareUrl(`https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(wa.followUpWithLink)}`);
    }

    setScreenshotUrl(getScreenshotImageUrl(lead));
    setImgLoaded(false);

    // Hard fallback timeout: ensure loading overlay never stays stuck over 2.2s
    const timer = setTimeout(() => {
      setImgLoaded(true);
      setScreenshotLoading(false);
      setRefreshingHeroShot(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, [lead.id, lead.businessName]);

  const handleSelectChannel = (ch: OutreachChannel) => {
    setChannel(ch);
    if (ch === 'WHATSAPP') {
      setDraft(whatsappStep === 'step1' ? whatsappMessage : whatsappFollowUpWithLink);
    } else if (ch === 'EMAIL' && emailDraft) {
      setDraft(emailDraft);
    }
  };

  const handleSwitchWhatsappStep = (step: 'step1' | 'step2') => {
    setWhatsappStep(step);
    if (step === 'step1') {
      setDraft(whatsappMessage || '');
    } else {
      setDraft(whatsappFollowUpWithLink || '');
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
      if (data.outreach?.message) setEmailDraft(data.outreach.message);
      if (data.whatsappMessage) setWhatsappMessage(data.whatsappMessage);
      if (data.whatsappFollowUpWithLink) setWhatsappFollowUpWithLink(data.whatsappFollowUpWithLink);
      if (data.subject) setDraftSubject(data.subject);
      if (data.screenshotUrl) setScreenshotUrl(data.screenshotUrl);
      if (data.whatsappShareUrl) setWhatsappShareUrl(data.whatsappShareUrl);
      if (data.whatsappFollowUpShareUrl) setWhatsappFollowUpShareUrl(data.whatsappFollowUpShareUrl);

      if (channel === 'WHATSAPP') {
        setDraft(whatsappStep === 'step1' ? (data.whatsappMessage || data.draft) : (data.whatsappFollowUpWithLink || data.draft));
      } else {
        setDraft(data.draft);
      }
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
      const imgUrl = screenshotUrl || getScreenshotImageUrl(lead);
      const pngBlob = await renderUrlToPngBlob(imgUrl);
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob }),
      ]);
      setCopyImageStatus('COPIED');
      setTimeout(() => setCopyImageStatus('IDLE'), 3500);
    } catch (err) {
      console.warn('Clipboard image copy fallback to direct download:', err);
      downloadScreenshot();
      setCopyImageStatus('COPIED');
      setTimeout(() => setCopyImageStatus('IDLE'), 3500);
    }
  };

  const downloadScreenshot = async () => {
    try {
      const imgUrl = screenshotUrl || getScreenshotImageUrl(lead);
      const pngBlob = await renderUrlToPngBlob(imgUrl);
      const url = URL.createObjectURL(pngBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(lead.businessName || 'website').replace(/[^a-z0-9]/gi, '_')}_hero_concept.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement('a');
      a.href = getScreenshotImageUrl(lead);
      a.download = `${(lead.businessName || 'website').replace(/[^a-z0-9]/gi, '_')}_hero_concept.png`;
      a.target = '_blank';
      a.click();
    }
  };

  const handleRefreshHeroShot = () => {
    setRefreshingHeroShot(true);
    setImgLoaded(false);
    const newUrl = getScreenshotImageUrl(lead, true);
    setScreenshotUrl(newUrl);
    setTimeout(() => {
      setRefreshingHeroShot(false);
      setImgLoaded(true);
      setScreenshotLoading(false);
    }, 2200);
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
            {/* 2-Pill Touch 1 vs Touch 2 Toggle */}
            <div className="flex p-1 bg-muted/60 rounded-lg border border-border/80 gap-1 select-none text-xs">
              <button
                type="button"
                onClick={() => handleSwitchWhatsappStep('step1')}
                className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-center transition-all ${
                  whatsappStep === 'step1'
                    ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-xs border border-emerald-500/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🛡️ Step 1: Safe Image Pitch (No Link — High Reply)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchWhatsappStep('step2')}
                className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-center transition-all ${
                  whatsappStep === 'step2'
                    ? 'bg-background text-primary shadow-xs border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🔗 Step 2: Send Live Link (After Reply)
              </button>
            </div>

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
                    <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden border-b border-border/30 group">
                      {/* Loading & Rendering Overlay */}
                      {(!imgLoaded || screenshotLoading || refreshingHeroShot) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs z-10 text-center p-3 text-slate-200">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-500 mb-1.5" />
                          <span className="text-[11px] font-bold">
                            {refreshingHeroShot ? 'Zooming Hero Section…' : 'Rendering Website Concept Snapshot…'}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Tailored for {lead.businessName}
                          </span>
                        </div>
                      )}

                      {/* 1-Click Refresh Hero Shot button overlay */}
                      <button
                        type="button"
                        onClick={handleRefreshHeroShot}
                        disabled={refreshingHeroShot || screenshotLoading}
                        className="absolute top-2 right-2 z-20 px-2 py-1 rounded bg-black/75 hover:bg-black/90 text-white text-[10px] font-semibold flex items-center gap-1 shadow-md backdrop-blur-xs transition transform hover:scale-105 active:scale-95 cursor-pointer"
                        title="Force re-capture zoomed hero section screenshot"
                      >
                        {refreshingHeroShot ? (
                          <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        <span>{refreshingHeroShot ? 'Zooming…' : '🔄 Refresh Hero Shot'}</span>
                      </button>

                      {screenshotUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={screenshotUrl}
                          alt={`Website concept for ${lead.businessName}`}
                          className={`w-full h-full object-cover object-top transition-opacity duration-300 ${
                            imgLoaded ? 'opacity-100' : 'opacity-0'
                          }`}
                          onLoad={() => {
                            setImgLoaded(true);
                            setScreenshotLoading(false);
                            setRefreshingHeroShot(false);
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.startsWith('data:image/svg+xml')) {
                              target.src = generateInlineSvgDataUri(lead.businessName, lead.city, lead.profession);
                            }
                            setImgLoaded(true);
                            setScreenshotLoading(false);
                            setRefreshingHeroShot(false);
                          }}
                        />
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
                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyScreenshotImage}
                      disabled={copyImageStatus === 'COPYING' || !screenshotUrl}
                      className={`text-xs h-8 gap-1 font-medium bg-white dark:bg-card shadow-xs ${
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
                      <span>{copyImageStatus === 'COPIED' ? 'Copied!' : '📋 Copy Image'}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyDraftText}
                      disabled={!draft}
                      className="text-xs h-8 gap-1 font-medium bg-white dark:bg-card border-border shadow-xs hover:bg-muted"
                    >
                      {copyTextStatus === 'COPIED' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span>{copyTextStatus === 'COPIED' ? 'Copied!' : '📋 Copy Text'}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshHeroShot}
                      disabled={refreshingHeroShot || screenshotLoading}
                      className="text-xs h-8 gap-1 font-medium bg-white dark:bg-card border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 shadow-xs"
                      title="Force re-capture zoomed hero section screenshot"
                    >
                      {refreshingHeroShot ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>{refreshingHeroShot ? 'Zooming…' : '🔄 Refresh Hero'}</span>
                    </Button>
                  </div>

                  {(whatsappStep === 'step1' ? whatsappShareUrl : (whatsappFollowUpShareUrl || whatsappShareUrl)) && (
                    <a
                      href={whatsappStep === 'step1' ? whatsappShareUrl! : (whatsappFollowUpShareUrl || whatsappShareUrl)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg shadow-sm transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open in WhatsApp Web ({whatsappStep === 'step1' ? 'Zero-Link Pitch' : 'Follow-Up Link'})</span>
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
                <div className="flex items-center gap-2">
                  {screenshotLoading && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Capturing snapshot…
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshHeroShot}
                    disabled={refreshingHeroShot || screenshotLoading}
                    className="h-6 text-[10px] px-2 gap-1 text-muted-foreground hover:text-foreground border border-border/60"
                  >
                    {refreshingHeroShot ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    <span>{refreshingHeroShot ? 'Zooming…' : 'Refresh Hero Shot'}</span>
                  </Button>
                </div>
              </div>

              {screenshotUrl ? (
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-md overflow-hidden border border-border bg-slate-900 shadow-inner group">
                    {/* Loading & Rendering Overlay */}
                    {(!imgLoaded || screenshotLoading || refreshingHeroShot) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs z-10 text-center p-3 text-slate-200">
                        <Loader2 className="w-5 h-5 animate-spin text-amber-500 mb-1.5" />
                        <span className="text-[11px] font-bold">
                          {refreshingHeroShot ? 'Zooming Hero Section…' : 'Capturing Hero Snapshot…'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          Tailored for {lead.businessName}
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleRefreshHeroShot}
                      disabled={refreshingHeroShot || screenshotLoading}
                      className="absolute top-2 right-2 z-20 px-2 py-1 rounded bg-black/75 hover:bg-black/90 text-white text-[10px] font-semibold flex items-center gap-1 shadow-md backdrop-blur-xs transition transform hover:scale-105 active:scale-95 cursor-pointer"
                      title="Force re-capture zoomed hero section screenshot"
                    >
                      {refreshingHeroShot ? (
                        <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      <span>{refreshingHeroShot ? 'Zooming…' : '🔄 Refresh Hero Shot'}</span>
                    </button>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshotUrl}
                      alt={`Demo website preview for ${lead.businessName}`}
                      className={`w-full h-full object-cover object-top hover:scale-105 transition-all duration-300 ${
                        imgLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => {
                        setImgLoaded(true);
                        setScreenshotLoading(false);
                        setRefreshingHeroShot(false);
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.startsWith('data:image/svg+xml')) {
                          target.src = generateInlineSvgDataUri(lead.businessName, lead.city, lead.profession);
                        }
                        setImgLoaded(true);
                        setScreenshotLoading(false);
                        setRefreshingHeroShot(false);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyScreenshotImage}
                      disabled={copyImageStatus === 'COPYING'}
                      className="text-xs h-8 gap-1 font-medium border-border"
                    >
                      {copyImageStatus === 'COPIED' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-primary" />
                      )}
                      <span>{copyImageStatus === 'COPIED' ? 'Copied!' : '📋 Copy Image'}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={downloadScreenshot}
                      className="text-xs h-8 gap-1 font-medium border-border"
                    >
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>⬇️ Download</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshHeroShot}
                      disabled={refreshingHeroShot || screenshotLoading}
                      className="text-xs h-8 gap-1 font-medium border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 shadow-xs"
                      title="Force re-capture zoomed hero section screenshot"
                    >
                      {refreshingHeroShot ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>{refreshingHeroShot ? 'Zooming…' : '🔄 Refresh Hero'}</span>
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
  missingDemoCount?: number;
  onBatchGenerate?: () => Promise<void>;
  batchGenerating?: boolean;
}

function OutreachQueueTab({
  leads,
  loading,
  error,
  onRefresh,
  missingDemoCount = 0,
  onBatchGenerate,
  batchGenerating = false,
}: OutreachQueueTabProps) {
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<'ALL' | 'VIEWED' | 'INTERESTED' | 'PHONE' | 'READY'>('ALL');
  const [approvingAll, setApprovingAll] = useState(false);
  const [blitzLoadingId, setBlitzLoadingId] = useState<string | null>(null);
  const [blitzSentIds, setBlitzSentIds] = useState<Set<string>>(new Set());

  const handleBlitzWhatsApp = async (lead: LeadData) => {
    if (!lead.publicPhone) return;
    setBlitzLoadingId(lead.id);

    try {
      // 1. Copy screenshot PNG to OS clipboard if available
      try {
        const imgUrl = getScreenshotImageUrl(lead);
        const pngBlob = await renderUrlToPngBlob(imgUrl);
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': pngBlob }),
        ]);
      } catch (clipErr) {
        console.warn('Clipboard image copy skipped/unsupported:', clipErr);
      }

      // 2. Format high-converting WhatsApp message
      const cleanPhone = (lead.publicPhone || '').replace(/[^0-9]/g, '');
      const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

      const { message: meaningfulMsg } = getMeaningfulWhatsAppMessage(lead);

      // 3. Open WhatsApp Web deep link
      const waUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(meaningfulMsg)}`;
      window.open(waUrl, '_blank');

      // 4. Record contacted via send-whatsapp endpoint
      await fetch('/api/outreach/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          phone: waPhone,
          message: meaningfulMsg,
          screenshotUrl: lead.websiteDemos?.[0]?.screenshotUrl || null,
          notes: 'Dispatched via 1-Click Blitz WhatsApp (Meaningful Value Hook + Branded Demo Link + Screenshot in Clipboard)',
        }),
      }).catch(() => {
        fetch('/api/outreach/contacted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: lead.id,
            channel: 'WHATSAPP',
            notes: 'Dispatched via 1-Click Blitz WhatsApp',
          }),
        }).catch(() => {});
      });

      setBlitzSentIds((prev) => new Set([...Array.from(prev), lead.id]));
      handleContacted(lead.id);
    } catch (err) {
      console.error('Blitz WhatsApp failed:', err);
    } finally {
      setBlitzLoadingId(null);
    }
  };

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
          {missingDemoCount > 0 && onBatchGenerate && (
            <Button
              size="sm"
              disabled={batchGenerating}
              onClick={onBatchGenerate}
              className="h-8 text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs"
              title="1-Click: Automatically generates and approves website demos for all leads without one"
            >
              {batchGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{batchGenerating ? 'Generating Websites…' : `⚡ 1-Click Generate All Websites (${missingDemoCount})`}</span>
            </Button>
          )}
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
                      {blitzSentIds.has(lead.id) || contactedIds.has(lead.id) ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] h-7 px-2 font-bold gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>✓ Sent / Copied</span>
                        </Badge>
                      ) : lead.publicPhone ? (
                        <Button
                          size="sm"
                          disabled={blitzLoadingId === lead.id}
                          className="h-7 px-2.5 text-[11px] gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-emerald-600 shadow-xs"
                          onClick={() => handleBlitzWhatsApp(lead)}
                          title="1-Click Blitz: Copies screenshot to clipboard, opens WhatsApp Web pre-filled, and marks lead as Contacted"
                        >
                          {blitzLoadingId === lead.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Zap className="w-3 h-3 fill-current" />
                          )}
                          <span>⚡ 1-Click WhatsApp</span>
                        </Button>
                      ) : null}

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground font-medium"
                        onClick={() => setSelectedLead(lead)}
                        title="Open deep customization drawer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Customize</span>
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

  const missingDemoCount = allLeads.filter(
    (l) =>
      l.websiteStatus === 'NO_WEBSITE' &&
      (!l.websiteDemos ||
        l.websiteDemos.length === 0 ||
        !l.websiteDemos.some((d) => d.approvalStatus === 'APPROVED'))
  ).length;

  const [batchGenerating, setBatchGenerating] = useState(false);

  const handleBatchGenerateDemos = async () => {
    setBatchGenerating(true);
    try {
      const res = await fetch('/api/demos/batch-generate', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        await fetchLeads();
      }
    } catch (err) {
      console.error('Batch generation failed:', err);
    } finally {
      setBatchGenerating(false);
    }
  };

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
          {missingDemoCount > 0 && (
            <Button
              size="sm"
              disabled={batchGenerating}
              onClick={handleBatchGenerateDemos}
              className="gap-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm"
              title="Auto-generates and approves website concept demos for all leads without one"
            >
              {batchGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Websites…</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>⚡ 1-Click Generate All Websites ({missingDemoCount})</span>
                </>
              )}
            </Button>
          )}
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
      <OutreachQueueTab
        leads={allLeads}
        loading={loading}
        error={error}
        onRefresh={fetchLeads}
        missingDemoCount={missingDemoCount}
        onBatchGenerate={handleBatchGenerateDemos}
        batchGenerating={batchGenerating}
      />
    </div>
  );
}
