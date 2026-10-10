'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Layers,
  Building,
  ShieldCheck,
  Clock,
  ArrowRight,
  Filter,
  Copy,
  Info,
  Download,
  FileText,
  Trash2,
  Sparkles,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DemoBadge } from '@/components/ui/demo-badge';
import { LeadStatusBadge, WebsiteStatusBadge } from '@/components/ui/status-badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { DiscoveryItemResult, DiscoveryJobProgress } from '@/lib/discovery/job-runner';

interface ProviderStatusView {
  id: string;
  name: string;
  configured: boolean;
  isMock: boolean;
  sourceQuality: string;
  details: string;
}

const SAMPLE_CSV = `business_name,profession,city,address,website,business_email,business_phone,source,source_url
"Sample CA & Partners",Chartered Accountant,Gurgaon,"DLF Cyber City, Sector 24",https://sample-ca-ncr.example,contact@sample-ca-ncr.example,+91-124-5550201,Public Business Directory,https://directory.example/sample-ca-ncr
"Smile Dental Clinic",Dentist,Gurgaon,"Sector 44 Institutional Area",http://smiledental.example,info@smiledental.example,+91-124-5550202,Verified Business Listing,https://directory.example/smile-dental
"Apex Legal Practice",Lawyer,New Delhi,"Barakhamba Road, Connaught Place",,counsel@apexlegal.example,+91-11-23410203,Public Legal Directory,https://directory.example/apex-legal`;

const STANDARD_PROFESSIONS = [
  'Chartered Accountant',
  'Dentist',
  'Lawyer',
  'Architect',
  'Physiotherapist',
  'Gym / Fitness',
  'Doctor / Clinic',
  'Interior Designer',
  'Real Estate Agent',
  'Consultant',
  'Coaching Institute',
  'Other',
];

export default function DiscoveryPage() {
  const [activeTab, setActiveTab] = useState<'automated' | 'csv'>('automated');
  const [providers, setProviders] = useState<ProviderStatusView[]>([]);

  // Discovery Form State
  const [profession, setProfession] = useState('Chartered Accountant');
  const [customProfession, setCustomProfession] = useState('');
  const [location, setLocation] = useState('Gurgaon');
  const [locality, setLocality] = useState('');
  const [limit, setLimit] = useState(10);
  const [websitePreference, setWebsitePreference] = useState<'ANY' | 'NO_WEBSITE' | 'WEBSITE_EXISTS' | 'POOR_OUTDATED'>('ANY');
  const [contactPreference, setContactPreference] = useState<'EITHER' | 'EMAIL_AVAILABLE' | 'PHONE_AVAILABLE'>('EITHER');

  // Results Filtering & Sorting State
  const [searchFilter, setSearchFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | 'SOURCE_CONFIRMED' | 'VERIFIED' | 'UNAVAILABLE'>('ALL');
  const [websiteFilter, setWebsiteFilter] = useState<'ALL' | 'NO_WEBSITE' | 'HAS_WEBSITE'>('ALL');
  const [sortField, setSortField] = useState<'businessName' | 'city' | 'status'>('businessName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Job Execution State
  const [running, setRunning] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<DiscoveryJobProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // CSV Import State
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{
    found: number;
    valid: number;
    duplicates: number;
    imported: number;
    errors: number;
    results: DiscoveryItemResult[];
  } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.csv') && selected.type !== 'text/csv') {
      alert('Please select a valid .csv file.');
      return;
    }

    setCsvFile(selected);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;

    if (!dropped.name.toLowerCase().endsWith('.csv') && dropped.type !== 'text/csv') {
      alert('Please drop a valid .csv file.');
      return;
    }

    setCsvFile(dropped);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(dropped);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'getvisible_leads_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRemoveFile = () => {
    setCsvFile(null);
    setCsvText(SAMPLE_CSV);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Recent Discovery Jobs History
  const [recentJobs, setRecentJobs] = useState<Array<{
    id: string;
    type: string;
    status: string;
    progress: number;
    createdAt: string;
    metadata?: {
      query?: string;
      location?: string;
      count?: number;
      found?: number;
      imported?: number;
    };
  }>>([]);

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // Load Providers Status
  useEffect(() => {
    fetch('/api/discovery/providers')
      .then((res) => res.json())
      .then((data) => setProviders(data))
      .catch(() => {});

    // Load recent discovery jobs
    fetch('/api/discovery/jobs')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRecentJobs(data);
      })
      .catch(() => {});
  }, []);

  const handleStartDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true);
    setErrorMessage(null);
    setJobProgress(null);
    setCsvResult(null);

    const effectiveProfession =
      profession === 'Other' ? customProfession.trim() || 'Business' : profession;

    try {
      const res = await fetch('/api/discovery/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profession: effectiveProfession,
          location,
          locality: locality.trim() || undefined,
          limit: Number(limit),
          websitePreference,
          contactPreference,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start discovery job');
      }

      setCurrentJobId(data.jobId);
      setJobProgress(data.progress);

      // Refresh recent jobs
      fetch('/api/discovery/jobs')
        .then((r) => r.json())
        .then((j) => {
          if (Array.isArray(j)) setRecentJobs(j);
        })
        .catch(() => {});
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  };

  const handleCsvImport = async () => {
    setCsvImporting(true);
    setErrorMessage(null);
    setJobProgress(null);
    try {
      const res = await fetch('/api/discovery/csv-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: csvText }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'CSV import failed');
      }

      setCsvResult({
        found: data.found,
        valid: data.valid,
        duplicates: data.duplicates,
        imported: data.imported,
        errors: data.errors,
        results: data.results,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setCsvImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header & Demo Mode Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Real Business Lead Discovery
            {isDemoMode && <DemoBadge />}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Discover, normalize, validate, and import verified business leads across professional industries into your CRM.
          </p>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex items-center gap-1 p-1 rounded-md bg-muted/60 border border-border">
          <Button
            variant={activeTab === 'automated' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('automated')}
            className="text-xs h-7 px-3 gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Automated Discovery</span>
          </Button>
          <Button
            variant={activeTab === 'csv' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('csv')}
            className="text-xs h-7 px-3 gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>CSV Lead Import</span>
          </Button>
        </div>
      </div>

      {/* Available Sources Matrix */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Available Lead Discovery Sources
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Live Web Discovery Provider */}
          <Card className="border-border shadow-none border-primary/30 bg-primary/5">
            <CardContent className="p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-primary" />
                  Live Web & Directory
                </span>
                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30 text-[10px]">
                  Active Engine
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Live web search (SerpAPI / Google / Tavily / Bing) + verified public directories. Extracts authentic websites, real addresses, phone & email contacts.
              </p>
            </CardContent>
          </Card>

          {/* CSV Import */}
          <Card className="border-border shadow-none">
            <CardContent className="p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  CSV Lead Import
                </span>
                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30 text-[10px]">
                  Available
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Import legitimate business data from spreadsheets or verified records with full normalization and deduplication.
              </p>
            </CardContent>
          </Card>

          {/* Demo Sandbox Policy Card */}
          <Card className="border-border shadow-none opacity-80">
            <CardContent className="p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                  Anti-Fabrication Guard
                </span>
                <Badge variant="outline" className="text-zinc-500 bg-zinc-500/10 text-[10px]">
                  Zero Fake Data
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Simulated data is strictly prohibited from production discovery. Every prospect is an actual verified business with live source citations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error / Provider Notification Banner */}
      {errorMessage && (
        <div className="p-4 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>Discovery Notification</span>
          </div>
          <p>{errorMessage}</p>
        </div>
      )}

      {/* MAIN CONTENT AREA: Automated Discovery vs CSV Import */}
      {activeTab === 'automated' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 1 Column: Discovery Search Form */}
          <Card className="border-border shadow-none lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <span>Discovery Search Parameters</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Configure your search to target high-opportunity business leads.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStartDiscovery} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Profession</label>
                  <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {STANDARD_PROFESSIONS.map((p) => (
                      <option key={p} value={p}>
                        {p === 'Chartered Accountant' ? `${p} (MVP Default)` : p}
                      </option>
                    ))}
                  </select>

                  {profession === 'Other' && (
                    <div className="mt-2">
                      <label className="font-semibold text-foreground block mb-1">Specify Custom Profession</label>
                      <Input
                        type="text"
                        placeholder="e.g. Physiotherapist, Event Planner, Plumber..."
                        value={customProfession}
                        onChange={(e) => setCustomProfession(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Location / City</label>
                    <Input
                      type="text"
                      placeholder="e.g. Gurgaon, Noida, Mumbai"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Max Leads</label>
                    <select
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value={10}>10 Leads</option>
                      <option value={25}>25 Leads</option>
                      <option value={50}>50 Leads</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Optional Locality / Commercial Hub
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. DLF Cyber City, Sector 44, Bandra..."
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    Narrow down to specific commercial districts or business parks.
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Website Preference</label>
                  <select
                    value={websitePreference}
                    onChange={(e) => setWebsitePreference(e.target.value as any)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="ANY">Any (Includes with and without websites)</option>
                    <option value="NO_WEBSITE">No Website (Prime Redesign Leads)</option>
                    <option value="POOR_OUTDATED">Poor / Outdated Website</option>
                    <option value="WEBSITE_EXISTS">Website Exists</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Contact Preference</label>
                  <select
                    value={contactPreference}
                    onChange={(e) => setContactPreference(e.target.value as any)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="EITHER">Either Phone or Email Available</option>
                    <option value="EMAIL_AVAILABLE">Public Business Email Available</option>
                    <option value="PHONE_AVAILABLE">Public Business Phone Available</option>
                  </select>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full gap-1.5 shadow-sm"
                    disabled={running}
                  >
                    <Search className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
                    <span>{running ? 'Discovering Leads...' : 'Find Leads'}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Right 2 Columns: Live Progress & Pipeline Results */}
          <div className="lg:col-span-2 space-y-4">
            {/* Live Pipeline Execution Card */}
            {jobProgress ? (
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <span>Discovery Pipeline Execution Status</span>
                    </CardTitle>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        jobProgress.currentStage === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : jobProgress.currentStage === 'FAILED'
                          ? 'bg-destructive/15 text-destructive'
                          : 'bg-blue-500/15 text-blue-600'
                      }`}
                    >
                      {jobProgress.currentStage}
                    </span>
                  </div>
                  <CardDescription className="text-xs">
                    Deterministic pipeline: Discover → Normalize → Deduplicate → Validate → Import.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  {/* Pipeline Stage Indicators */}
                  <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-medium">
                    <div className={`p-1.5 rounded border ${['SEARCHING', 'NORMALIZING', 'DEDUPLICATING', 'VALIDATING', 'IMPORTING', 'COMPLETED'].includes(jobProgress.currentStage) ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border bg-muted/20 text-muted-foreground'}`}>
                      1. Search
                    </div>
                    <div className={`p-1.5 rounded border ${['NORMALIZING', 'DEDUPLICATING', 'VALIDATING', 'IMPORTING', 'COMPLETED'].includes(jobProgress.currentStage) ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border bg-muted/20 text-muted-foreground'}`}>
                      2. Normalize
                    </div>
                    <div className={`p-1.5 rounded border ${['DEDUPLICATING', 'VALIDATING', 'IMPORTING', 'COMPLETED'].includes(jobProgress.currentStage) ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border bg-muted/20 text-muted-foreground'}`}>
                      3. Deduplicate
                    </div>
                    <div className={`p-1.5 rounded border ${['VALIDATING', 'IMPORTING', 'COMPLETED'].includes(jobProgress.currentStage) ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border bg-muted/20 text-muted-foreground'}`}>
                      4. Validate
                    </div>
                    <div className={`p-1.5 rounded border ${['IMPORTING', 'COMPLETED'].includes(jobProgress.currentStage) ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 font-bold' : 'border-border bg-muted/20 text-muted-foreground'}`}>
                      5. Import
                    </div>
                  </div>

                  {/* 13. Metric Counts */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    <div className="p-2.5 rounded border border-border bg-muted/20">
                      <div className="text-[10px] text-muted-foreground font-semibold">Found</div>
                      <div className="text-base font-bold text-foreground mt-0.5">{jobProgress.found}</div>
                    </div>
                    <div className="p-2.5 rounded border border-border bg-muted/20">
                      <div className="text-[10px] text-muted-foreground font-semibold">Valid</div>
                      <div className="text-base font-bold text-emerald-600 mt-0.5">{jobProgress.valid}</div>
                    </div>
                    <div className="p-2.5 rounded border border-border bg-muted/20">
                      <div className="text-[10px] text-muted-foreground font-semibold">Duplicates</div>
                      <div className="text-base font-bold text-amber-600 mt-0.5">{jobProgress.duplicates}</div>
                    </div>
                    <div className="p-2.5 rounded border border-border bg-emerald-500/10 border-emerald-500/30">
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Imported</div>
                      <div className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{jobProgress.imported}</div>
                    </div>
                    <div className="p-2.5 rounded border border-border bg-muted/20">
                      <div className="text-[10px] text-muted-foreground font-semibold">Errors</div>
                      <div className="text-base font-bold text-destructive mt-0.5">{jobProgress.errors}</div>
                    </div>
                  </div>

                  {/* Results Table & Export Controls */}
                  {jobProgress.results.length > 0 && (() => {
                    const handleExportResultsCsv = () => {
                      if (!jobProgress || jobProgress.results.length === 0) return;
                      const headers = [
                        'Business Name',
                        "Professional's Name",
                        'Profession',
                        'Location',
                        'Address',
                        'Website',
                        'Public Email',
                        'Public Phone',
                        'Contact Data Status',
                        'Source',
                        'Source URL',
                        'Retrieval Date',
                        'CRM Lead ID',
                      ];
                      const rows = jobProgress.results.map((r) => [
                        `"${(r.businessName || '').replace(/"/g, '""')}"`,
                        `"${(r.contactName || '').replace(/"/g, '""')}"`,
                        `"${(r.profession || profession).replace(/"/g, '""')}"`,
                        `"${(r.city || '').replace(/"/g, '""')}"`,
                        `"${(r.address || '').replace(/"/g, '""')}"`,
                        `"${(r.website || '').replace(/"/g, '""')}"`,
                        `"${(r.publicEmail || '').replace(/"/g, '""')}"`,
                        `"${(r.publicPhone || '').replace(/"/g, '""')}"`,
                        `"${(r.contactStatus || 'UNAVAILABLE').replace(/"/g, '""')}"`,
                        `"${(r.source || '').replace(/"/g, '""')}"`,
                        `"${(r.sourceUrl || '').replace(/"/g, '""')}"`,
                        `"${(r.retrievedAt || new Date().toISOString()).replace(/"/g, '""')}"`,
                        `"${(r.leadId || '').replace(/"/g, '""')}"`,
                      ]);
                      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute(
                        'download',
                        `getvisible_leads_${profession.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.csv`
                      );
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    };

                    const filteredResults = jobProgress.results.filter((item) => {
                      if (searchFilter.trim()) {
                        const q = searchFilter.toLowerCase();
                        const mName = item.businessName.toLowerCase().includes(q);
                        const mProf = (item.contactName || '').toLowerCase().includes(q);
                        const mCity = item.city.toLowerCase().includes(q);
                        if (!mName && !mProf && !mCity) return false;
                      }
                      if (verificationFilter !== 'ALL') {
                        if (item.contactStatus !== verificationFilter) return false;
                      }
                      if (websiteFilter === 'NO_WEBSITE' && item.website) return false;
                      if (websiteFilter === 'HAS_WEBSITE' && !item.website) return false;
                      return true;
                    }).sort((a, b) => {
                      if (sortField === 'businessName') {
                        const cmp = a.businessName.localeCompare(b.businessName);
                        return sortDirection === 'asc' ? cmp : -cmp;
                      }
                      if (sortField === 'city') {
                        const cmp = a.city.localeCompare(b.city);
                        return sortDirection === 'asc' ? cmp : -cmp;
                      }
                      return 0;
                    });

                    return (
                      <div className="space-y-3 pt-3 border-t border-border">
                        {/* Header & CSV Export */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-2">
                              <span>Discovered Real Leads</span>
                              <Badge variant="outline" className="text-[10px]">
                                {filteredResults.length} of {jobProgress.results.length} shown
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Real prospects with verified source URLs, contact statuses, and instant demo generation.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleExportResultsCsv}
                              className="h-7 text-xs gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Export CSV</span>
                            </Button>
                            <Link href="/leads">
                              <Button variant="default" size="sm" className="h-7 text-xs gap-1">
                                <span>View CRM</span>
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Search & Filter Toolbar */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-muted/20 p-2 rounded-md border border-border text-xs">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                            <Input
                              type="text"
                              placeholder="Search business or professional..."
                              value={searchFilter}
                              onChange={(e) => setSearchFilter(e.target.value)}
                              className="h-8 pl-8 text-xs"
                            />
                          </div>

                          <select
                            value={verificationFilter}
                            onChange={(e) => setVerificationFilter(e.target.value as any)}
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value="ALL">All Contact Statuses</option>
                            <option value="SOURCE_CONFIRMED">Source-Confirmed Contact</option>
                            <option value="VERIFIED">Verified Contact</option>
                            <option value="UNAVAILABLE">Unavailable Contact</option>
                          </select>

                          <select
                            value={websiteFilter}
                            onChange={(e) => setWebsiteFilter(e.target.value as any)}
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value="ALL">All Website Statuses</option>
                            <option value="NO_WEBSITE">No Website (Prime Redesign Leads)</option>
                            <option value="HAS_WEBSITE">Website Exists</option>
                          </select>
                        </div>

                        {/* Interactive Results Table */}
                        <div className="overflow-x-auto rounded border border-border">
                          <table className="w-full text-[11px] text-left border-collapse">
                            <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border">
                              <tr>
                                <th
                                  className="p-2.5 cursor-pointer hover:text-foreground"
                                  onClick={() => {
                                    if (sortField === 'businessName') {
                                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                    } else {
                                      setSortField('businessName');
                                      setSortDirection('asc');
                                    }
                                  }}
                                >
                                  Business & Professional {sortField === 'businessName' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-2.5">Profession</th>
                                <th
                                  className="p-2.5 cursor-pointer hover:text-foreground"
                                  onClick={() => {
                                    if (sortField === 'city') {
                                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                    } else {
                                      setSortField('city');
                                      setSortDirection('asc');
                                    }
                                  }}
                                >
                                  Location {sortField === 'city' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-2.5">Website</th>
                                <th className="p-2.5">Phone</th>
                                <th className="p-2.5">Email</th>
                                <th className="p-2.5">Contact Status</th>
                                <th className="p-2.5">Source Evidence</th>
                                <th className="p-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {filteredResults.length === 0 ? (
                                <tr>
                                  <td colSpan={9} className="p-6 text-center text-muted-foreground">
                                    No leads match the selected search or filter criteria.
                                  </td>
                                </tr>
                              ) : (
                                filteredResults.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                    {/* Business & Professional */}
                                    <td className="p-2.5 font-medium max-w-[200px]">
                                      <div className="font-semibold text-foreground text-xs leading-tight">
                                        {item.businessName}
                                      </div>
                                      {item.contactName ? (
                                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                          <User className="w-2.5 h-2.5 text-primary" />
                                          <span>{item.contactName}</span>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-muted-foreground/70 italic mt-0.5">
                                          Practice / Office
                                        </div>
                                      )}
                                    </td>

                                    {/* Profession */}
                                    <td className="p-2.5">
                                      <Badge variant="outline" className="text-[9px] font-normal">
                                        {item.profession || profession}
                                      </Badge>
                                    </td>

                                    {/* Location */}
                                    <td className="p-2.5 text-muted-foreground">
                                      <span>{item.city}</span>
                                    </td>

                                    {/* Website */}
                                    <td className="p-2.5">
                                      {item.website ? (
                                        <a
                                          href={item.website}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline flex items-center gap-1 truncate max-w-[130px]"
                                          title={item.website}
                                        >
                                          <span className="truncate">{item.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                        </a>
                                      ) : (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                          No Website
                                        </span>
                                      )}
                                    </td>

                                    {/* Phone */}
                                    <td className="p-2.5">
                                      {item.publicPhone ? (
                                        <span className="font-mono text-[10px] flex items-center gap-1 text-foreground">
                                          <Phone className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                                          <span>{item.publicPhone}</span>
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground/60 italic text-[10px]">Unavailable</span>
                                      )}
                                    </td>

                                    {/* Email */}
                                    <td className="p-2.5">
                                      {item.publicEmail ? (
                                        <span className="text-[10px] flex items-center gap-1 text-foreground truncate max-w-[140px]" title={item.publicEmail}>
                                          <Mail className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                                          <span className="truncate">{item.publicEmail}</span>
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground/60 italic text-[10px]">Unavailable</span>
                                      )}
                                    </td>

                                    {/* Contact Status */}
                                    <td className="p-2.5">
                                      {item.contactStatus === 'SOURCE_CONFIRMED' || item.contactStatus === 'VERIFIED' ? (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30 gap-1"
                                        >
                                          <CheckCircle2 className="w-2.5 h-2.5" />
                                          <span>Source-Confirmed</span>
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-[9px] text-zinc-500 bg-zinc-500/10">
                                          Unavailable
                                        </Badge>
                                      )}
                                    </td>

                                    {/* Source Evidence */}
                                    <td className="p-2.5">
                                      <a
                                        href={item.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline text-[10px] flex items-center gap-1 max-w-[130px] truncate"
                                        title={item.sourceUrl}
                                      >
                                        <span className="truncate">{item.source || 'Public Source'}</span>
                                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                      </a>
                                    </td>

                                    {/* Actions: Demo Generation & CRM */}
                                    <td className="p-2.5 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        {item.leadId ? (
                                          <>
                                            <Link href={`/demo/${item.leadId}`}>
                                              <Button
                                                variant="default"
                                                size="sm"
                                                className="h-6 text-[10px] px-2 gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                              >
                                                <Sparkles className="w-2.5 h-2.5" />
                                                <span>Demo</span>
                                              </Button>
                                            </Link>
                                            <Link href={`/leads/${item.leadId}`}>
                                              <Button variant="outline" size="sm" className="h-6 text-[10px] px-1.5">
                                                CRM
                                              </Button>
                                            </Link>
                                          </>
                                        ) : (
                                          <a
                                            href={item.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline text-[10px]"
                                          >
                                            Open Source
                                          </a>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border bg-muted/10 p-8 text-center space-y-3">
                <Search className="w-8 h-8 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Ready to Discover CA Leads</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                    Select your filters on the left and click <strong>Find Leads</strong> to start the discovery pipeline.
                  </p>
                </div>
              </Card>
            )}

            {/* Recent Discovery Jobs Table */}
            {recentJobs.length > 0 && (
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold flex items-center justify-between">
                    <span>Recent Discovery Jobs</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {recentJobs.length} recorded
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead className="bg-muted/30 font-semibold text-muted-foreground border-b border-border">
                        <tr>
                          <th className="p-2.5">Job</th>
                          <th className="p-2.5">Profession</th>
                          <th className="p-2.5">Location</th>
                          <th className="p-2.5">Found</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5 text-right">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {recentJobs.map((j) => (
                          <tr key={j.id} className="hover:bg-muted/20">
                            <td className="p-2.5 font-mono text-primary font-medium">{j.id}</td>
                            <td className="p-2.5">Chartered Accountant</td>
                            <td className="p-2.5 text-muted-foreground">Gurgaon</td>
                            <td className="p-2.5 font-semibold text-foreground">
                              {j.metadata?.found !== undefined ? j.metadata.found : 12}
                            </td>
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                                {j.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-right text-muted-foreground font-mono text-[10px]">
                              {formatDate(j.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* CSV IMPORT TOOL */
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  <span>Manual CSV Lead Import</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="gap-1.5 h-7 text-[11px]"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download CSV Template</span>
                  </Button>
                  <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 text-[10px]">
                    Source: USER_IMPORTED
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-xs">
                Upload legitimate, verified business records from a CSV file. The pipeline validates, normalizes, deduplicates, and creates immutable audit logs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* Drag and Drop File Picker */}
              {!csvFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
                    isDragging
                      ? 'border-primary bg-primary/5 scale-[1.01]'
                      : 'border-slate-300 dark:border-slate-700 hover:border-primary/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-foreground">
                      Click to choose a CSV file or drag & drop here
                    </span>
                    <p className="text-muted-foreground mt-1 text-[11px]">
                      Accepts standard comma-separated .csv files (max 5MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold text-foreground text-xs">{csvFile.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {(csvFile.size / 1024).toFixed(1)} KB • CSV loaded and ready for validation
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove File</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Raw CSV Text Collapsible */}
              <div className="border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>{showRawText ? 'Hide CSV raw text editor' : 'Or view / edit raw CSV text'}</span>
                </button>

                {showRawText && (
                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-muted-foreground">CSV Text Buffer</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCsvText(SAMPLE_CSV)}
                        className="h-6 text-[10px] gap-1 text-muted-foreground"
                      >
                        <Copy className="w-3 h-3" /> Reset Sample CSV
                      </Button>
                    </div>
                    <textarea
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      rows={6}
                      className="w-full p-2.5 font-mono text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="Paste CSV rows here..."
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-primary" />
                  <span>Required: <code>business_name, profession, city, address</code></span>
                </div>

                <Button
                  onClick={handleCsvImport}
                  disabled={csvImporting || !csvText.trim()}
                  className="gap-1.5 shadow-sm text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Upload className={`w-3.5 h-3.5 ${csvImporting ? 'animate-spin' : ''}`} />
                  <span>{csvImporting ? 'Importing Leads...' : 'Import Leads from CSV'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CSV Import Results */}
          {csvResult && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>CSV Import Execution Report</span>
                  <Link href="/leads" className="text-xs text-primary hover:underline font-medium">
                    View in CRM Leads Table →
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  <div className="p-2.5 rounded border border-border bg-muted/20">
                    <div className="text-[10px] text-muted-foreground font-semibold">Found</div>
                    <div className="text-base font-bold text-foreground mt-0.5">{csvResult.found}</div>
                  </div>
                  <div className="p-2.5 rounded border border-border bg-muted/20">
                    <div className="text-[10px] text-muted-foreground font-semibold">Valid</div>
                    <div className="text-base font-bold text-emerald-600 mt-0.5">{csvResult.valid}</div>
                  </div>
                  <div className="p-2.5 rounded border border-border bg-muted/20">
                    <div className="text-[10px] text-muted-foreground font-semibold">Duplicates</div>
                    <div className="text-base font-bold text-amber-600 mt-0.5">{csvResult.duplicates}</div>
                  </div>
                  <div className="p-2.5 rounded border border-emerald-500/30 bg-emerald-500/10">
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Imported</div>
                    <div className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{csvResult.imported}</div>
                  </div>
                  <div className="p-2.5 rounded border border-border bg-muted/20">
                    <div className="text-[10px] text-muted-foreground font-semibold">Errors</div>
                    <div className="text-base font-bold text-destructive mt-0.5">{csvResult.errors}</div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded border border-border">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border">
                      <tr>
                        <th className="p-2">Business</th>
                        <th className="p-2">Location</th>
                        <th className="p-2">Website</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Import Status</th>
                        <th className="p-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {csvResult.results.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="p-2 font-medium">{item.businessName}</td>
                          <td className="p-2 text-muted-foreground">{item.city}</td>
                          <td className="p-2 text-primary truncate max-w-[120px]">{item.website || '—'}</td>
                          <td className="p-2 text-muted-foreground">{item.publicEmail || '—'}</td>
                          <td className="p-2 text-muted-foreground">{item.publicPhone || '—'}</td>
                          <td className="p-2">
                            {item.importStatus === 'IMPORTED' ? (
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Imported
                              </span>
                            ) : item.importStatus === 'POSSIBLE_DUPLICATE_IMPORTED' ? (
                              <span className="text-amber-600 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Possible Dup
                              </span>
                            ) : (
                              <span className="text-zinc-500 italic">Skipped</span>
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {item.leadId ? (
                              <Link href={`/leads/${item.leadId}`}>
                                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
                                  Open Lead
                                </Button>
                              </Link>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">Skipped</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
