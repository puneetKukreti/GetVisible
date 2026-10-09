'use client';

import React, { useState, useEffect } from 'react';
import { LeadData } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  CheckCircle2,
  Package,
  IndianRupee,
  Calendar,
  Send,
  Download,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Package definitions
// ─────────────────────────────────────────────────────────────
type PackageId = 'starter' | 'professional' | 'premium';

interface CAPackage {
  id: PackageId;
  name: string;
  oneTime: number;
  monthly: number;
  features: string[];
  popular?: boolean;
}

const CA_PACKAGES: CAPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    oneTime: 15000,
    monthly: 2000,
    features: [
      '5-page static website',
      'Mobile-responsive design',
      'Contact form integration',
      'SSL certificate included',
      'Basic SEO setup',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    oneTime: 35000,
    monthly: 3500,
    popular: true,
    features: [
      '10-page dynamic website',
      'Blog & news section',
      'GST invoicing integration',
      'Client portal (login)',
      'Mobile-responsive design',
      'Advanced SEO & analytics',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    oneTime: 75000,
    monthly: 5000,
    features: [
      'Full CA practice portal',
      'ITR filing tracker',
      'Document vault (secure)',
      'Client dashboard',
      'Multi-staff login',
      'Priority support & SLA',
    ],
  },
];

const PROPOSAL_READY_STATUSES: LeadData['leadStatus'][] = [
  'INTERESTED',
  'DEMO_GENERATED',
  'APPROVED',
];

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function todayFormatted(): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

/** Section 1: Package pricing cards */
function PackageCards({
  selected,
  onSelect,
}: {
  selected: PackageId;
  onSelect: (id: PackageId) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {CA_PACKAGES.map((pkg) => {
        const isSelected = selected === pkg.id;
        return (
          <div key={pkg.id} className="relative flex flex-col">
            {/* Popular ribbon */}
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                  Most Popular
                </span>
              </div>
            )}
            <Card
              className={`flex flex-col h-full transition-all duration-150 ${
                pkg.popular ? 'border-primary/60 shadow-md' : 'border-border/70'
              } ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            >
              <CardHeader className="pb-3 pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <Package
                    className={`w-4 h-4 ${pkg.popular ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <CardTitle className="text-base font-bold">{pkg.name}</CardTitle>
                </div>
                <div className="flex items-end gap-1 mt-2">
                  <IndianRupee className="w-4 h-4 text-foreground mb-0.5" />
                  <span className="text-2xl font-extrabold text-foreground">
                    {pkg.oneTime.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-muted-foreground mb-1 ml-0.5">one-time</span>
                </div>
                <CardDescription className="text-xs">
                  + ₹{pkg.monthly.toLocaleString('en-IN')}/mo hosting
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 gap-4">
                <ul className="space-y-2 flex-1">
                  {pkg.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-xs text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="sm"
                  variant={isSelected ? 'default' : pkg.popular ? 'default' : 'outline'}
                  className={`w-full text-xs font-semibold mt-2 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : pkg.popular && !isSelected
                      ? 'bg-primary/90 text-primary-foreground hover:bg-primary'
                      : ''
                  }`}
                  onClick={() => onSelect(pkg.id)}
                >
                  {isSelected ? '✓ Selected' : 'Select'}
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

/** Section 2: Proposal Generator form + preview */
function ProposalGenerator({
  leads,
  selectedPackage,
  onPackageChange,
}: {
  leads: LeadData[];
  selectedPackage: PackageId;
  onPackageChange: (id: PackageId) => void;
}) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [scopeNotes, setScopeNotes] = useState('');
  const [proposalGenerated, setProposalGenerated] = useState(false);
  const [markedSent, setMarkedSent] = useState(false);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) ?? null;
  const pkg = CA_PACKAGES.find((p) => p.id === selectedPackage)!;

  function handleGenerate() {
    if (!selectedLeadId) return;
    setProposalGenerated(true);
    setMarkedSent(false);
  }

  // Reset proposal when lead/package changes
  useEffect(() => {
    setProposalGenerated(false);
    setMarkedSent(false);
  }, [selectedLeadId, selectedPackage]);

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Configure Proposal
          </CardTitle>
          <CardDescription className="text-xs">
            Select a proposal-ready lead and configure the scope to generate a client-ready document.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Lead Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Select Lead *</label>
            {leads.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No proposal-ready leads found (INTERESTED / DEMO_GENERATED / APPROVED).
              </p>
            ) : (
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— Choose a lead —</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.businessName} · {l.city}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Package Radio */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Select Package *</label>
            <div className="flex flex-wrap gap-3">
              {CA_PACKAGES.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 text-xs transition-colors ${
                    selectedPackage === p.id
                      ? 'border-primary bg-primary/5 text-primary font-semibold'
                      : 'border-border text-foreground hover:border-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="package"
                    value={p.id}
                    checked={selectedPackage === p.id}
                    onChange={() => onPackageChange(p.id)}
                    className="accent-primary"
                  />
                  {p.name} — {formatINR(p.oneTime)}
                </label>
              ))}
            </div>
          </div>

          {/* Scope Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Scope Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={scopeNotes}
              onChange={(e) => setScopeNotes(e.target.value)}
              placeholder="Add any custom requirements, special integrations, or notes for this proposal…"
              rows={3}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Payment Terms (informational) */}
          <div className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 flex items-start gap-3">
            <IndianRupee className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p className="font-semibold text-foreground text-[11px] uppercase tracking-wide">
                Standard Payment Terms
              </p>
              <p>50% upfront upon agreement signing</p>
              <p>50% on deployment & handover</p>
            </div>
          </div>

          <Button
            size="sm"
            className="gap-2 text-xs font-semibold"
            disabled={!selectedLeadId}
            onClick={handleGenerate}
          >
            <FileText className="w-3.5 h-3.5" />
            Generate Proposal Document
          </Button>
        </CardContent>
      </Card>

      {/* Proposal Preview */}
      {proposalGenerated && selectedLead && (
        <ProposalPreview
          lead={selectedLead}
          pkg={pkg}
          scopeNotes={scopeNotes}
          markedSent={markedSent}
          onMarkSent={() => setMarkedSent(true)}
        />
      )}
    </div>
  );
}

/** Rendered proposal document preview */
function ProposalPreview({
  lead,
  pkg,
  scopeNotes,
  markedSent,
  onMarkSent,
}: {
  lead: LeadData;
  pkg: CAPackage;
  scopeNotes: string;
  markedSent: boolean;
  onMarkSent: () => void;
}) {
  const upfront = Math.round(pkg.oneTime * 0.5);
  const onDeployment = pkg.oneTime - upfront;

  return (
    <Card className="border-primary/30 shadow-md bg-card">
      {/* Document Header Bar */}
      <div className="h-1.5 w-full rounded-t-lg bg-gradient-to-r from-primary via-primary/70 to-primary/30" />

      <CardContent className="p-6 space-y-6">
        {/* Title block */}
        <div className="space-y-1 border-b border-border pb-4">
          <h2 className="text-lg font-extrabold text-foreground">
            Website Redesign Proposal —{' '}
            <span className="text-primary">{lead.businessName}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {todayFormatted()}
            </span>
            <span>Prepared by: <strong className="text-foreground">GetVisible Web Agency</strong></span>
            <span>Ref: GV-{lead.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>

        {/* Client & Package Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Client Details
            </p>
            <div className="space-y-1.5 text-foreground">
              <div className="flex justify-between border-b border-border/40 pb-1">
                <span className="text-muted-foreground">Business</span>
                <span className="font-semibold">{lead.businessName}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1">
                <span className="text-muted-foreground">Profession</span>
                <span className="font-semibold">{lead.profession}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-1">
                <span className="text-muted-foreground">City</span>
                <span className="font-semibold">{lead.city}</span>
              </div>
              {lead.publicEmail && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-semibold">{lead.publicEmail}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Selected Package
            </p>
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{pkg.name} Package</span>
                {pkg.popular && (
                  <Badge className="bg-primary/10 text-primary border border-primary/30 text-[10px]">
                    Most Popular
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground space-y-0.5">
                <p>One-time: <strong className="text-foreground">{formatINR(pkg.oneTime)}</strong></p>
                <p>Monthly hosting: <strong className="text-foreground">{formatINR(pkg.monthly)}/mo</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* Scope of Work */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Scope of Work
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {pkg.features.map((feat) => (
              <li key={feat} className="flex items-center gap-2 text-xs text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {feat}
              </li>
            ))}
          </ul>
          {scopeNotes.trim() && (
            <div className="mt-2 rounded-md border border-border/60 bg-muted/30 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Custom Notes
              </p>
              <p className="text-xs text-foreground whitespace-pre-wrap">{scopeNotes}</p>
            </div>
          )}
        </div>

        {/* Investment & Payment Schedule */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Investment & Payment Schedule
          </p>
          <div className="rounded-md border border-border/60 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground text-[11px]">Milestone</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground text-[11px]">Trigger</th>
                  <th className="text-right px-3 py-2 font-semibold text-muted-foreground text-[11px]">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border/50">
                  <td className="px-3 py-2 text-foreground font-medium">Milestone 1 — 50% Upfront</td>
                  <td className="px-3 py-2 text-muted-foreground">Agreement signed</td>
                  <td className="px-3 py-2 text-right font-bold text-foreground">{formatINR(upfront)}</td>
                </tr>
                <tr className="border-t border-border/50">
                  <td className="px-3 py-2 text-foreground font-medium">Milestone 2 — 50% on Deploy</td>
                  <td className="px-3 py-2 text-muted-foreground">Site live & handed over</td>
                  <td className="px-3 py-2 text-right font-bold text-foreground">{formatINR(onDeployment)}</td>
                </tr>
                <tr className="border-t border-border bg-muted/20">
                  <td className="px-3 py-2 font-bold text-foreground" colSpan={2}>Total One-Time</td>
                  <td className="px-3 py-2 text-right font-extrabold text-primary">{formatINR(pkg.oneTime)}</td>
                </tr>
                <tr className="border-t border-border/50">
                  <td className="px-3 py-2 text-muted-foreground" colSpan={2}>Recurring hosting (monthly)</td>
                  <td className="px-3 py-2 text-right font-semibold text-foreground">{formatINR(pkg.monthly)}/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
          {/* Download PDF — disabled with tooltip */}
          <div className="relative group">
            <Button
              size="sm"
              variant="outline"
              disabled
              className="gap-2 text-xs opacity-60 cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </Button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
              <div className="bg-popover text-popover-foreground border border-border rounded-md px-2.5 py-1.5 text-[11px] shadow-lg whitespace-nowrap">
                PDF export coming in Phase 2
              </div>
            </div>
          </div>

          {/* Mark Lead as Proposal Sent */}
          {markedSent ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Marked as Proposal Sent
            </div>
          ) : (
            <Button
              size="sm"
              className="gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onMarkSent}
            >
              <Send className="w-3.5 h-3.5" />
              Mark Lead as Proposal Sent
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Section 3: Proposal Pipeline table */
function ProposalPipeline({ leads }: { leads: LeadData[] }) {
  const proposalLeads = leads.filter((l) => l.leadStatus === 'PROPOSAL');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Send className="w-4 h-4 text-primary" />
          Proposal Pipeline
          <Badge variant="outline" className="text-[10px] font-mono">
            {proposalLeads.length} active
          </Badge>
        </h2>
      </div>

      {proposalLeads.length === 0 ? (
        <Card className="border-dashed border-border">
          <CardContent className="p-10 text-center space-y-3">
            <FileText className="w-9 h-9 text-muted-foreground mx-auto opacity-40" />
            <p className="text-sm font-semibold text-foreground">No proposals in pipeline yet</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Generate proposals for interested leads above — once marked sent, they will appear
              here when their status is updated to{' '}
              <code className="bg-muted px-1 rounded text-[10px]">PROPOSAL</code> in the CRM.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">
                    Business Name
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">
                    City
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">
                    Score
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">
                    Package
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {proposalLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{lead.businessName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.city}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[11px] ${
                          lead.opportunityScore >= 75
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : lead.opportunityScore >= 50
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {lead.opportunityScore}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] font-medium">
                        Professional
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-blue-500/10 text-blue-600 border border-blue-500/30 text-[10px] font-semibold">
                        PROPOSAL SENT
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function ProposalsPage() {
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<PackageId>('professional');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/leads');
        if (res.ok) {
          const json = await res.json();
          if (json.leads) setLeads(json.leads as LeadData[]);
        }
      } catch {
        // silently fail — empty state handled below
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const proposalReadyLeads = leads.filter((l) =>
    PROPOSAL_READY_STATUSES.includes(l.leadStatus),
  );

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Proposals &amp; Scope of Work
            </h1>
            <Badge className="bg-primary/10 text-primary border border-primary/30 text-[11px] font-mono">
              PHASE 2
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Create and send customised website redesign proposals to interested CA practices across
            Gurgaon &amp; Delhi NCR.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>{todayFormatted()}</span>
        </div>
      </div>

      {/* Section 1: Package Cards */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            CA Website Packages
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Three tiered offerings covering every stage of a CA practice&apos;s digital journey.
          </p>
        </div>
        <PackageCards selected={selectedPackage} onSelect={setSelectedPackage} />
      </section>

      {/* Section 2: Proposal Generator */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Proposal Generator
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a proposal-ready lead and generate a formatted proposal document.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            Loading leads…
          </div>
        ) : (
          <ProposalGenerator
            leads={proposalReadyLeads}
            selectedPackage={selectedPackage}
            onPackageChange={setSelectedPackage}
          />
        )}
      </section>

      {/* Section 3: Proposal Pipeline */}
      <section>
        {loading ? null : <ProposalPipeline leads={leads} />}
      </section>
    </div>
  );
}
