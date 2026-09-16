'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Building,
  Globe,
  Mail,
  Phone,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Clock,
  Send,
  FileCode,
  CheckCircle,
  XCircle,
  User,
  History,
  Lock,
  Smartphone,
  Gauge,
  Tag,
  Sparkles,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { LeadData, LeadStatus, Channel } from '@/types';
import { LeadStatusBadge, WebsiteStatusBadge, OpportunityScoreBadge } from '@/components/ui/status-badge';
import { DemoBadge } from '@/components/ui/demo-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<LeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | ''>('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  const fetchLead = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      const data: LeadData = await res.json();
      setLead(data);
      setSelectedStatus(data.leadStatus);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (leadId) fetchLead();
  }, [leadId, fetchLead]);

  const handleStatusChange = async (newStatus: LeadStatus, customReason?: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadStatus: newStatus,
          reason: customReason || statusReason || `Status changed to ${newStatus}`,
          actor: 'Agency Lead Specialist',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to update status');
      }

      setShowStatusModal(false);
      setStatusReason('');
      fetchLead();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error changing status');
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateDemo = async () => {
    if (!lead) return;
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
      await fetchLead();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error generating demo');
    } finally {
      setGeneratingDemo(false);
    }
  };

  if (loading && !lead) {
    return (
      <div className="p-12 text-center text-muted-foreground text-xs">
        <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
        Loading lead details...
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-4">
        <Link href="/leads">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            <ChevronLeft className="w-4 h-4" /> Back to Leads
          </Button>
        </Link>
        <Card className="border-destructive/30 bg-destructive/10 text-destructive p-6">
          <h2 className="font-bold text-sm">Lead Not Found</h2>
          <p className="text-xs mt-1">{error || 'Unable to locate lead in this organization context.'}</p>
        </Card>
      </div>
    );
  }

  const primaryContact = lead.contacts?.find((c) => c.isPrimary) || lead.contacts?.[0];
  const websiteAudit = lead.websites?.[0];
  const isSuppressed = lead.leadStatus === 'DO_NOT_CONTACT' || (lead.suppressionRecords && lead.suppressionRecords.length > 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/leads">
            <Button variant="outline" size="sm" className="h-8 px-2.5">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{lead.businessName}</h1>
              {lead.isDemoData && <DemoBadge />}
              {lead.sourceQuality && (
                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                  {lead.sourceQuality}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
              <span>{lead.profession}</span>
              <span>•</span>
              <span>{lead.city}</span>
              <span>•</span>
              <span>Discovered {formatDate(lead.createdAt)}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons: Status Changer & Compliance Safeguard */}
        <div className="flex items-center gap-2">
          {lead.leadStatus !== 'DO_NOT_CONTACT' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (
                  confirm(
                    'Are you sure you want to mark this lead as DO NOT CONTACT? This will immediately add global suppression across all communication channels.'
                  )
                ) {
                  handleStatusChange('DO_NOT_CONTACT', 'Explicit opt-out or DNC instruction recorded.');
                }
              }}
              disabled={updating}
              className="gap-1 text-xs"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Mark DO NOT CONTACT</span>
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

      {/* Possible Duplicate Warning Banner */}
      {lead.isPossibleDuplicate && (
        <div className="p-4 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div className="text-xs space-y-1">
            <div className="font-bold">Possible Duplicate Flagged For Review</div>
            <p className="leading-relaxed">
              {lead.duplicateNotes ||
                'This CA firm was identified as a potential duplicate of an existing record in your CRM. Human review is recommended before outreach.'}
            </p>
          </div>
        </div>
      )}

      {/* Suppression & Compliance Alert Banner */}
      {isSuppressed && (
        <div className="p-4 rounded-md border border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold">Suppression Enforced (DO NOT CONTACT)</div>
            <p className="leading-relaxed">
              This CA firm is in the organization suppression registry. Per anti-spam principles, all automated or manual outbound emails, calls, and WhatsApp messages are blocked at the engine level.
            </p>
          </div>
        </div>
      )}

      {/* Human Approval Safeguard Banner */}
      <div className="p-3 rounded-md border border-emerald-500/20 bg-emerald-500/5 text-xs text-muted-foreground flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <span className="font-semibold text-foreground">Anti-Spam Human-in-the-Loop Protocol: </span>
          Outbound commercial communication is never sent automatically. Any outreach angle or custom website demo preview requires explicit review and approval by an authorized agency team member before transmission.
        </div>
      </div>

      {/* Main Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Columns): Business Info, Opportunity, Website, Contacts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Opportunity Assessment Card */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <OpportunityScoreBadge score={lead.opportunityScore} />
                  <span>Website Agency Opportunity Assessment</span>
                </CardTitle>
                <LeadStatusBadge status={lead.leadStatus} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-md bg-muted/40 border border-border/80">
                <div className="font-semibold text-foreground mb-1">Diagnosis & Redesign Rationale</div>
                <p className="text-muted-foreground leading-relaxed">
                  {lead.opportunityReason}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded border border-border/60 bg-card">
                  <div className="text-[11px] font-semibold text-foreground">Recommended Pitch Angle</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Highlight corporate client onboarding portal, secure GST document drop box, and HTTPS SSL security compliance.
                  </div>
                </div>
                <div className="p-2.5 rounded border border-border/60 bg-card">
                  <div className="text-[11px] font-semibold text-foreground">Target Decision Maker</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Managing Partner / Senior Partner handling enterprise tax audits in {lead.city}.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phase 4 Personalized Website Concept Card */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Personalized Website Concept (Phase 4)</span>
                </CardTitle>
                {lead.websiteStatus === 'NO_WEBSITE' ? (
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px]">
                    Eligible: No Website
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Ineligible: {lead.websiteStatus}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {lead.websiteStatus === 'NO_WEBSITE' ? (
                <>
                  {lead.websiteDemos && lead.websiteDemos.length > 0 ? (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">
                              Active Concept: v{lead.websiteDemos[0].version}
                            </span>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">
                              {lead.websiteDemos[0].theme.name || lead.websiteDemos[0].theme.id || 'Executive Navy'}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Generated on {formatDateTime(lead.websiteDemos[0].createdAt)}. Purely factual, safe claim bounds enforced.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/demo/${lead.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-1.5 font-bold text-xs shadow-xs transition"
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
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${generatingDemo ? 'animate-spin' : ''}`} />
                            <span>Regenerate (v{lead.websiteDemos.length + 1})</span>
                          </Button>
                        </div>
                      </div>

                      {lead.websiteDemos.length > 1 && (
                        <div className="pt-1">
                          <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                            Version History ({lead.websiteDemos.length} versions generated):
                          </span>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {lead.websiteDemos.map((demo) => (
                              <div
                                key={demo.id}
                                className="flex items-center justify-between p-2 rounded bg-muted/30 text-[11px] border border-border/50"
                              >
                                <span>Version {demo.version} • {demo.theme.name || 'Executive Navy'}</span>
                                <span className="text-muted-foreground">{formatDate(demo.createdAt)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 text-center space-y-3">
                      <p className="text-muted-foreground leading-relaxed">
                        This business has verified <strong>NO_WEBSITE</strong> status. You can generate a tailored, functional website demonstration with one click.
                      </p>
                      <Button
                        onClick={handleGenerateDemo}
                        disabled={generatingDemo}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-2 text-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{generatingDemo ? 'Synthesizing Website Concept...' : 'Generate Website Concept Demo'}</span>
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3.5 rounded-lg border border-border bg-muted/20 text-muted-foreground space-y-1">
                  <div className="font-semibold text-foreground">Generation Blocked by Verification Rules</div>
                  <p className="leading-relaxed">
                    {lead.websiteStatus === 'WEBSITE_EXISTS'
                      ? `This business already operates an official website (${lead.website || 'recorded in directory'}). Demo concept generation is strictly permitted only for verified businesses with NO_WEBSITE.`
                      : `Website status is currently ${lead.websiteStatus}. Please complete website verification review before generating a demo concept.`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Website Diagnostics Card */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <span>Website & Technical Audit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-md bg-muted/30 border border-border/60">
                <div>
                  <div className="text-[11px] text-muted-foreground">Current Website URL</div>
                  {lead.website ? (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                    >
                      {lead.website}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No website discovered</span>
                  )}
                </div>
                <div>
                  <WebsiteStatusBadge status={lead.websiteStatus} />
                </div>
              </div>

              {websiteAudit && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-2 rounded border border-border/60 bg-card">
                    <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" /> SSL Security
                    </div>
                    <div className={`font-semibold text-xs mt-1 ${websiteAudit.hasSsl ? 'text-emerald-600' : 'text-red-500'}`}>
                      {websiteAudit.hasSsl ? 'Secured' : 'Missing SSL'}
                    </div>
                  </div>

                  <div className="p-2 rounded border border-border/60 bg-card">
                    <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      <Smartphone className="w-3 h-3" /> Mobile Friendly
                    </div>
                    <div className={`font-semibold text-xs mt-1 ${websiteAudit.mobileFriendly ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {websiteAudit.mobileFriendly ? 'Responsive' : 'Non-Mobile'}
                    </div>
                  </div>

                  <div className="p-2 rounded border border-border/60 bg-card">
                    <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      <Gauge className="w-3 h-3" /> Speed Score
                    </div>
                    <div className="font-semibold text-xs mt-1 font-mono text-foreground">
                      {websiteAudit.speedScore ? `${websiteAudit.speedScore}/100` : 'N/A'}
                    </div>
                  </div>

                  <div className="p-2 rounded border border-border/60 bg-card">
                    <div className="text-[10px] text-muted-foreground">CMS Platform</div>
                    <div className="font-semibold text-xs mt-1 text-foreground truncate">
                      {websiteAudit.cms || 'Custom/Legacy'}
                    </div>
                  </div>
                </div>
              )}

              {websiteAudit?.auditNotes && (
                <div className="p-2.5 rounded bg-muted/20 border border-border/50 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground block mb-0.5">Audit Findings:</span>
                  {websiteAudit.auditNotes}
                </div>
              )}

              {/* Factual Website Verification Evidence */}
              {websiteAudit && (
                <div className="p-3 rounded-md bg-muted/30 border border-border/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      Factual Website Ownership Verification
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        websiteAudit.verificationStatus === 'VERIFIED'
                          ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                          : websiteAudit.verificationStatus === 'FAILED'
                          ? 'border-destructive/30 text-destructive bg-destructive/10'
                          : 'border-amber-500/30 text-amber-600 bg-amber-500/10'
                      }`}
                    >
                      {websiteAudit.verificationStatus || 'REQUIRES_REVIEW'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {websiteAudit.verificationEvidence?.details ||
                      'Factual signals evaluated against registered firm name, location, and verified email domain. Ownership is not claimed without corroborating factual signals.'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px]">
                    <div className="p-1.5 rounded bg-card border border-border/50">
                      <span className="text-muted-foreground block">Name Found:</span>
                      <span className="font-semibold text-foreground">{websiteAudit.verificationEvidence?.businessNameFound ? 'YES' : 'UNCONFIRMED'}</span>
                    </div>
                    <div className="p-1.5 rounded bg-card border border-border/50">
                      <span className="text-muted-foreground block">Phone Match:</span>
                      <span className="font-semibold text-foreground">{websiteAudit.verificationEvidence?.phoneMatch ? 'YES' : 'UNCONFIRMED'}</span>
                    </div>
                    <div className="p-1.5 rounded bg-card border border-border/50">
                      <span className="text-muted-foreground block">Address Match:</span>
                      <span className="font-semibold text-foreground">{websiteAudit.verificationEvidence?.addressMatch ? 'YES' : 'UNCONFIRMED'}</span>
                    </div>
                    <div className="p-1.5 rounded bg-card border border-border/50">
                      <span className="text-muted-foreground block">Domain Match:</span>
                      <span className="font-semibold text-foreground">{websiteAudit.verificationEvidence?.domainMatch ? 'YES' : 'UNCONFIRMED'}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business & Discovery Information */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" />
                <span>Firm Overview & Verified Public Source</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Physical Address</span>
                  <span className="font-medium text-foreground">{lead.address}</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Location / Hub</span>
                  <span className="font-medium text-foreground">{lead.city}, Haryana / Delhi NCR</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Discovery Source</span>
                  <span className="font-medium text-foreground">{lead.source}</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Public Source Reference</span>
                  {lead.sourceUrl ? (
                    <a
                      href={lead.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <span>Public Directory Link</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Public ICAI registry record</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Field Provenance: Raw Values vs Normalized Values */}
          {lead.fieldProvenance && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Field Provenance & Normalization Audit Trail</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Original source values are preserved alongside normalized CRM entities to guarantee complete auditability.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                {lead.fieldProvenance.businessName && (
                  <div className="p-2 rounded bg-muted/20 border border-border/50 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-foreground">Business Name</span>
                      <span className="text-muted-foreground font-mono text-[10px]">Source: {lead.fieldProvenance.businessName.source}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Raw Source Value:</span>
                        <code className="text-foreground">{lead.fieldProvenance.businessName.rawValue}</code>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Normalized CRM Value:</span>
                        <code className="text-primary">{lead.fieldProvenance.businessName.normalizedValue}</code>
                      </div>
                    </div>
                  </div>
                )}

                {lead.fieldProvenance.website && (
                  <div className="p-2 rounded bg-muted/20 border border-border/50 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-foreground">Website URL</span>
                      <span className="text-muted-foreground font-mono text-[10px]">Source: {lead.fieldProvenance.website.source}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Raw Source Value:</span>
                        <code className="text-foreground">{lead.fieldProvenance.website.rawValue}</code>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Normalized CRM Value:</span>
                        <code className="text-primary">{lead.fieldProvenance.website.normalizedValue}</code>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contacts Information */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span>Contact Persons & Channels</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Public business contacts. Subject to channel consent and suppression rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {lead.contacts && lead.contacts.length > 0 ? (
                <div className="space-y-2">
                  {lead.contacts.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-md border border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{c.name}</span>
                          {c.isPrimary && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-medium">
                              Primary Contact
                            </span>
                          )}
                          <span className="text-muted-foreground">• {c.role || 'Partner'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                          {c.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {c.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      {c.linkedinUrl && (
                        <a
                          href={c.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          LinkedIn <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-md border border-border/60 bg-muted/20 text-muted-foreground">
                  No individual contact records attached yet. Public firm telephone: {lead.publicPhone || 'None'} / Email: {lead.publicEmail || 'None'}.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Column): Compliance Status, Action Panel, Activity Timeline */}
        <div className="space-y-6">
          {/* Phase 1 Action Controls */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Outreach & Pipeline Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-xs"
                onClick={() => handleStatusChange('RESEARCHING')}
                disabled={updating || lead.leadStatus === 'RESEARCHING'}
              >
                <Clock className="w-3.5 h-3.5 text-purple-500" />
                <span>Mark as Researching</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-xs"
                onClick={() => handleStatusChange('QUALIFIED')}
                disabled={updating || lead.leadStatus === 'QUALIFIED'}
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mark as Qualified Lead</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-xs"
                onClick={() => handleStatusChange('DEMO_GENERATED')}
                disabled={updating || lead.leadStatus === 'DEMO_GENERATED'}
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-500" />
                <span>Mark as Demo Generated</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-xs"
                disabled={true}
                disabledExplanation="Phase 1 Safeguard: Direct email dispatch is scheduled for Phase 2 after compliance sign-off."
              >
                <Send className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Send Outbound Pitch (Phase 2)</span>
              </Button>
            </CardContent>
          </Card>

          {/* Compliance & Suppression Status */}
          <Card className="border-border bg-muted/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Compliance & Channel Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/50 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-muted-foreground" /> Email Channel
                </span>
                <span className={lead.leadStatus === 'DO_NOT_CONTACT' ? 'text-destructive font-bold' : 'text-emerald-600 font-medium'}>
                  {lead.leadStatus === 'DO_NOT_CONTACT' ? 'SUPPRESSED' : 'ELIGIBLE'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/50 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-muted-foreground" /> Voice / SMS
                </span>
                <span className={lead.leadStatus === 'DO_NOT_CONTACT' ? 'text-destructive font-bold' : 'text-emerald-600 font-medium'}>
                  {lead.leadStatus === 'DO_NOT_CONTACT' ? 'SUPPRESSED' : 'ELIGIBLE'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 text-[11px]">
                <span>Automated Blasting</span>
                <span className="text-destructive font-bold">BLOCKED (ZERO-SPAM)</span>
              </div>
            </CardContent>
          </Card>

          {/* Activity & Audit Timeline */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <History className="w-3.5 h-3.5 text-primary" />
                <span>Activity & Audit Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {lead.activities && lead.activities.length > 0 ? (
                <div className="relative pl-4 space-y-4 before:content-[''] before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
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
                <div className="text-muted-foreground text-xs italic">No activity recorded yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Change Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Change Lead Status</CardTitle>
              <CardDescription className="text-xs">
                Transitioning status automatically generates an immutable audit log record.
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
                  <option value="RESEARCHING">RESEARCHING</option>
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="DEMO_GENERATED">DEMO_GENERATED</option>
                  <option value="OUTREACH_PENDING">OUTREACH_PENDING</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="REPLIED">REPLIED</option>
                  <option value="INTERESTED">INTERESTED</option>
                  <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                  <option value="DO_NOT_CONTACT">DO_NOT_CONTACT (Suppresses all channels)</option>
                  <option value="PROPOSAL">PROPOSAL</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="LOST">LOST</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Reviewed website audit with client"
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
