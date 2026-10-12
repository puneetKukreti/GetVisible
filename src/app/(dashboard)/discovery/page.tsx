'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Layers,
  Building,
  Building2,
  ShieldCheck,
  Clock,
  ArrowRight,
  Filter,
  Copy,
  Info,
  Trash2,
  Sparkles,
  Phone,
  Mail,
  User,
  Star,
  MapPin,
  Globe,
  SlidersHorizontal,
  Edit3,
  Save,
  Check,
  X,
  RotateCcw,
  FileCheck,
  Settings,
  FolderOpen,
  History,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DemoBadge } from '@/components/ui/demo-badge';
import { LeadStatusBadge, WebsiteStatusBadge } from '@/components/ui/status-badge';
import { DiscoveryItemResult, DiscoveryJobProgress } from '@/lib/discovery/job-runner';
import { SavedSearchProject, ExportHistoryRecord } from '@/lib/discovery/storage';

interface ProviderStatusView {
  id: string;
  name: string;
  configured: boolean;
  isMock: boolean;
  sourceQuality: string;
  details: string;
}

const CATEGORY_SUGGESTIONS = [
  'Lawyers & Law Firms',
  'Doctors, Dentists & Clinics',
  'Real Estate Agents',
  'Restaurants & Cafes',
  'Gyms & Fitness Centers',
  'Manufacturers & Wholesalers',
  'Importers & Exporters',
  'Digital Marketing Agencies',
  'Hotels & Travel Agencies',
  'Salons & Beauty Centers',
  'Contractors & Repair Services',
  'Chartered Accountants',
  'Architects & Interior Designers',
  'Physiotherapy & Rehab Clinics',
];

const SAMPLE_CSV = `business_name,profession,city,address,website,business_email,business_phone,rating,review_count,source,source_url
"Apex Corporate Law Firm",Lawyer,Gurgaon,"DLF Cyber City, Tower B",https://apexlaw-india.example,contact@apexlaw-india.example,+91-124-4291122,4.8,42,Bar Council Directory,https://directory.example/apex-law
"Smile Well Dental Clinic",Dentist,Gurgaon,"Sector 44 Commercial Hub",http://smilewell.example,info@smilewell.example,+91-124-4063344,4.9,89,Dental Directory,https://directory.example/smile-well
"Grand Horizon Real Estate",Real Estate,Noida,"Sector 62 IT Park",https://grandhorizon.example,sales@grandhorizon.example,+91-120-4567890,4.6,28,Public Business Registry,https://directory.example/grand-horizon
"Urban Fitness Club",Gym / Fitness,South Delhi,"Greater Kailash 1",,connect@urbanfitness.example,+91-11-29231234,4.7,65,Verified Fitness Directory,https://directory.example/urban-fitness`;

export default function LeadExtractorPage() {
  const [activeTab, setActiveTab] = useState<'search' | 'results' | 'duplicates' | 'saved' | 'import' | 'history' | 'providers'>('search');
  const [providers, setProviders] = useState<ProviderStatusView[]>([]);

  // Search parameters
  const [category, setCategory] = useState('Lawyers & Law Firms');
  const [customCategory, setCustomCategory] = useState('');
  const [searchScope, setSearchScope] = useState<'INDIVIDUAL_FIRMS' | 'SOLO_PRACTITIONERS' | 'ALL_COMMERCIAL'>('INDIVIDUAL_FIRMS');
  const [location, setLocation] = useState('Gurgaon');
  const [locality, setLocality] = useState('');
  const [radius, setRadius] = useState<number | ''>('');
  const [limit, setLimit] = useState<number>(25);
  const [providerId, setProviderId] = useState<string>('auto');
  const [websitePreference, setWebsitePreference] = useState<'ANY' | 'NO_WEBSITE' | 'WEBSITE_EXISTS'>('ANY');
  const [contactPreference, setContactPreference] = useState<'EITHER' | 'EMAIL_AVAILABLE' | 'PHONE_AVAILABLE'>('EITHER');
  const [exportFormat, setExportFormat] = useState<'XLSX' | 'CSV'>('XLSX');

  // Fields to collect checkboxes
  const [collectFields, setCollectFields] = useState<{ [key: string]: boolean }>({
    name: true,
    phone: true,
    email: true,
    website: true,
    address: true,
    category: true,
    rating: true,
    sourceUrl: true,
  });

  // Execution & Progress State
  const [running, setRunning] = useState(false);
  const [jobProgress, setJobProgress] = useState<DiscoveryJobProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Extracted leads staged in local state (can be edited, filtered, selected)
  const [leads, setLeads] = useState<DiscoveryItemResult[]>([]);
  const [selectedLeadIndices, setSelectedLeadIndices] = useState<Set<number>>(new Set());

  // Table filtering & sorting
  const [searchFilter, setSearchFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState<'ALL' | 'HAS_PHONE' | 'NO_PHONE'>('ALL');
  const [emailFilter, setEmailFilter] = useState<'ALL' | 'HAS_EMAIL' | 'NO_EMAIL'>('ALL');
  const [websiteFilter, setWebsiteFilter] = useState<'ALL' | 'HAS_WEBSITE' | 'NO_WEBSITE'>('ALL');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | 'RATED' | 'HIGH_RATED'>('ALL');
  const [sortField, setSortField] = useState<'businessName' | 'city' | 'rating'>('businessName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    businessName: true,
    category: true,
    phone: true,
    email: true,
    website: true,
    address: true,
    rating: true,
    contactStatus: true,
    source: true,
    actions: true,
  });

  // Row inline edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<DiscoveryItemResult>>({});

  // Saved Searches
  const [savedSearches, setSavedSearches] = useState<SavedSearchProject[]>([]);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Export History
  const [exportHistory, setExportHistory] = useState<ExportHistoryRecord[]>([]);
  const [exporting, setExporting] = useState(false);

  // CSV/XLSX Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importText, setImportText] = useState(SAMPLE_CSV);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // Load providers, saved searches, and export history on mount
  useEffect(() => {
    fetch('/api/discovery/providers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProviders(data);
      })
      .catch(() => {});

    loadSavedSearches();
    loadExportHistory();
  }, []);

  const loadSavedSearches = () => {
    fetch('/api/discovery/saved-searches')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSavedSearches(data);
      })
      .catch(() => {});
  };

  const loadExportHistory = () => {
    fetch('/api/discovery/export-history')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setExportHistory(data);
      })
      .catch(() => {});
  };

  const effectiveCategory = category === 'Custom' || !category ? customCategory.trim() || 'Business' : category;

  // Handle Search Execution
  const handleStartExtraction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setRunning(true);
    setErrorMessage(null);
    setSuccessNotice(null);
    setJobProgress(null);

    try {
      const payload: Record<string, unknown> = {
        profession: effectiveCategory,
        category: effectiveCategory,
        location: location.trim(),
        locality: locality.trim() || undefined,
        limit: Number(limit),
        websitePreference,
        contactPreference,
        exportFormat,
        searchScope,
      };

      if (radius && Number(radius) > 0) {
        payload.radius = Number(radius);
      }
      if (providerId && providerId !== 'auto') {
        payload.providerId = providerId;
      }

      const res = await fetch('/api/discovery/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start extraction job');
      }

      setJobProgress(data.progress);
      if (data.progress?.results && Array.isArray(data.progress.results)) {
        setLeads(data.progress.results);
        // Select all by default
        const allIdxs = new Set<number>(data.progress.results.map((_: any, idx: number) => idx));
        setSelectedLeadIndices(allIdxs);
        setActiveTab('results');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  };

  // Handle Save Current Search
  const handleSaveSearch = async () => {
    if (!saveSearchName.trim()) return;
    try {
      const activeFields = Object.keys(collectFields).filter((k) => collectFields[k]);
      const res = await fetch('/api/discovery/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveSearchName.trim(),
          category: effectiveCategory,
          location,
          locality: locality.trim() || undefined,
          radius: radius ? Number(radius) : undefined,
          limit: Number(limit),
          providerId,
          fieldsToCollect: activeFields,
          exportFormat,
        }),
      });

      if (res.ok) {
        setShowSaveModal(false);
        setSaveSearchName('');
        setSuccessNotice('Search configuration saved to projects.');
        loadSavedSearches();
      }
    } catch {
      // ignore
    }
  };

  // Handle Rerun Saved Search
  const handleRunSavedSearch = (project: SavedSearchProject) => {
    setCategory(project.category);
    setCustomCategory(project.category);
    setLocation(project.location);
    setLocality(project.locality || '');
    setRadius(project.radius || '');
    setLimit(project.limit || 25);
    setProviderId(project.providerId || 'auto');
    setExportFormat(project.exportFormat || 'XLSX');
    setActiveTab('search');

    // Update lastRunAt
    fetch('/api/discovery/saved-searches', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: project.id, lastRunAt: new Date().toISOString() }),
    }).catch(() => {});
  };

  // Handle Delete Saved Search
  const handleDeleteSavedSearch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved project?')) return;
    try {
      await fetch(`/api/discovery/saved-searches?id=${id}`, { method: 'DELETE' });
      loadSavedSearches();
    } catch {}
  };

  // Handle Export (Excel XLSX or CSV)
  const handleExport = async (formatOverride?: 'XLSX' | 'CSV') => {
    const targetFormat = formatOverride || exportFormat;
    setExporting(true);
    setErrorMessage(null);

    try {
      // Use selected leads if any are selected, else use all filtered leads
      const selectedList = leads.filter((_, idx) =>
        selectedLeadIndices.size > 0 ? selectedLeadIndices.has(idx) : true
      );

      if (selectedList.length === 0) {
        alert('No leads available to export.');
        setExporting(false);
        return;
      }

      const res = await fetch('/api/discovery/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: selectedList,
          format: targetFormat,
          searchKeyword: effectiveCategory,
          searchLocation: location,
          providerUsed: providerId === 'auto' ? 'GetVisible Multi-Engine' : providerId,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to generate export file');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = targetFormat === 'XLSX' ? 'xlsx' : 'csv';
      const cleanKw = effectiveCategory.toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.setAttribute('download', `leads_${cleanKw}_${Date.now()}.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessNotice(`Successfully exported ${selectedList.length} leads as .${extension}`);
      loadExportHistory();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  // Handle File Import (CSV or XLSX)
  const handleImportSubmit = async () => {
    setImporting(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const formData = new FormData();
      if (importFile) {
        formData.append('file', importFile);
      } else {
        formData.append('csvContent', importText);
      }

      const res = await fetch('/api/discovery/csv-import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      if (Array.isArray(data.results)) {
        setLeads(data.results);
        const allIdxs = new Set<number>(data.results.map((_: any, idx: number) => idx));
        setSelectedLeadIndices(allIdxs);
        setSuccessNotice(
          `Import complete: ${data.found} found, ${data.valid} valid, ${data.duplicates} duplicates flagged, ${data.imported} staged.`
        );
        setActiveTab('results');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to import file');
    } finally {
      setImporting(false);
    }
  };

  // Row Editing
  const startEditing = (idx: number) => {
    setEditingIndex(idx);
    setEditForm({ ...leads[idx] });
  };

  const saveEditing = (idx: number) => {
    const updated = [...leads];
    updated[idx] = { ...updated[idx], ...editForm };
    setLeads(updated);
    setEditingIndex(null);
    setEditForm({});
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditForm({});
  };

  // Filtered Leads Calculation
  const filteredLeads = useMemo(() => {
    return leads
      .filter((item) => {
        // Search text
        if (searchFilter.trim()) {
          const q = searchFilter.toLowerCase();
          const mName = item.businessName.toLowerCase().includes(q);
          const mProf = (item.profession || '').toLowerCase().includes(q);
          const mCity = (item.city || '').toLowerCase().includes(q);
          const mPhone = (item.publicPhone || '').toLowerCase().includes(q);
          const mEmail = (item.publicEmail || '').toLowerCase().includes(q);
          if (!mName && !mProf && !mCity && !mPhone && !mEmail) return false;
        }
        // Phone filter
        if (phoneFilter === 'HAS_PHONE' && !item.publicPhone) return false;
        if (phoneFilter === 'NO_PHONE' && item.publicPhone) return false;
        // Website filter
        if (websiteFilter === 'HAS_WEBSITE' && !item.website) return false;
        if (websiteFilter === 'NO_WEBSITE' && item.website) return false;
        // Email filter
        if (emailFilter === 'HAS_EMAIL' && !item.publicEmail) return false;
        if (emailFilter === 'NO_EMAIL' && item.publicEmail) return false;
        // Rating filter
        if (ratingFilter === 'RATED' && !item.rating) return false;
        if (ratingFilter === 'HIGH_RATED' && (!item.rating || item.rating < 4.5)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'businessName') {
          const cmp = a.businessName.localeCompare(b.businessName);
          return sortDirection === 'asc' ? cmp : -cmp;
        }
        if (sortField === 'city') {
          const cmp = (a.city || '').localeCompare(b.city || '');
          return sortDirection === 'asc' ? cmp : -cmp;
        }
        if (sortField === 'rating') {
          const rA = a.rating || 0;
          const rB = b.rating || 0;
          return sortDirection === 'asc' ? rA - rB : rB - rA;
        }
        return 0;
      });
  }, [leads, searchFilter, phoneFilter, websiteFilter, emailFilter, ratingFilter, sortField, sortDirection]);

  // Duplicates list
  const duplicateLeads = useMemo(() => {
    return leads.filter((l) => l.importStatus === 'DUPLICATE_SKIPPED' || l.importStatus === 'POSSIBLE_DUPLICATE_IMPORTED');
  }, [leads]);

  // Metrics
  const metrics = useMemo(() => {
    let phoneCount = 0;
    let websiteCount = 0;
    let emailCount = 0;
    const uniqueSet = new Set<string>();

    for (const l of leads) {
      uniqueSet.add(l.businessName.toLowerCase().trim());
      if (l.publicPhone) phoneCount++;
      if (l.website) websiteCount++;
      if (l.publicEmail) emailCount++;
    }

    return {
      total: leads.length,
      unique: uniqueSet.size,
      phone: phoneCount,
      website: websiteCount,
      email: emailCount,
      duplicates: duplicateLeads.length,
    };
  }, [leads, duplicateLeads]);

  // Bulk Selection Toggles
  const isAllSelected = filteredLeads.length > 0 && filteredLeads.every((_, idx) => selectedLeadIndices.has(idx));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLeadIndices(new Set());
    } else {
      const next = new Set<number>();
      filteredLeads.forEach((_, idx) => next.add(idx));
      setSelectedLeadIndices(next);
    }
  };

  const toggleSelectRow = (idx: number) => {
    const next = new Set(selectedLeadIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedLeadIndices(next);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Top Application Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Business Lead Extractor
              {isDemoMode && <DemoBadge />}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Universal business lead extraction, data cleansing, duplicate detection, and XLSX/CSV export across any industry.
          </p>
        </div>

        {/* Global Export & Save Actions */}
        <div className="flex items-center gap-2">
          {leads.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('XLSX')}
                disabled={exporting}
                className="h-8 text-xs gap-1.5 shadow-sm border-emerald-600/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('CSV')}
                disabled={exporting}
                className="h-8 text-xs gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </Button>
            </>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={() => setShowSaveModal(true)}
            className="h-8 text-xs gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Search</span>
          </Button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'search'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>New Search</span>
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'results'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Results Table</span>
          {leads.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 ml-1">
              {leads.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab('duplicates')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'duplicates'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Duplicate Review</span>
          {duplicateLeads.length > 0 && (
            <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 ml-1 border-amber-500/40 text-amber-600 bg-amber-500/10">
              {duplicateLeads.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'saved'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Saved Projects</span>
          {savedSearches.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 ml-1">
              {savedSearches.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'import'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import CSV/XLSX</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Export History</span>
          {exportHistory.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 ml-1">
              {exportHistory.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'providers'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Data Providers</span>
        </button>
      </div>

      {/* Notifications Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Error: </span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-destructive/70 hover:text-destructive">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successNotice && (
        <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <div className="flex-1">
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TAB 1: NEW SEARCH (Lead Extractor Dashboard) */}
      {activeTab === 'search' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Search Config Form */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="border-border shadow-none">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                    Configure Lead Search Parameters
                  </span>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Multi-Industry Engine
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Specify any business category, target geography, collection criteria, and data source.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleStartExtraction} className="space-y-4 text-xs">
                  {/* Category Selection with Quick Chips */}
                  <div>
                    <label className="font-semibold text-foreground block mb-1">
                      Business Category / Industry
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {CATEGORY_SUGGESTIONS.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCategory(cat);
                            setCustomCategory('');
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                            category === cat
                              ? 'border-primary bg-primary text-primary-foreground font-medium shadow-xs'
                              : 'border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCategory('Custom')}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                          category === 'Custom'
                            ? 'border-primary bg-primary text-primary-foreground font-medium shadow-xs'
                            : 'border-dashed border-border bg-background hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        + Custom Category
                      </button>
                    </div>

                    {category === 'Custom' && (
                      <div className="mt-2">
                        <Input
                          type="text"
                          placeholder="Type custom business category (e.g. Solar Panel Installers, Wedding Venues, Pet Groomers...)"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          required
                          className="h-8 text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Search Precision & Target Scope */}
                  <div className="p-3 rounded-md bg-muted/30 border border-border/80">
                    <label className="font-semibold text-foreground block mb-1 text-[11px] uppercase tracking-wider">
                      Search Precision & Target Scope
                    </label>
                    <p className="text-[11px] text-muted-foreground mb-2.5">
                      Bypasses high-level aggregator listicles (&ldquo;Top 10...&rdquo;) and targets direct clients with authentic commercial footprints.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSearchScope('INDIVIDUAL_FIRMS')}
                        className={`text-left p-2.5 rounded-md border transition-all text-xs ${
                          searchScope === 'INDIVIDUAL_FIRMS'
                            ? 'border-primary bg-primary/10 text-primary font-medium shadow-xs'
                            : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <div className="font-semibold text-foreground flex items-center justify-between">
                          <span>🏢 Individual Firms</span>
                          {searchScope === 'INDIVIDUAL_FIRMS' && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                          Commercial practices (&amp; Associates, Chambers, Clinics, LLP)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSearchScope('SOLO_PRACTITIONERS')}
                        className={`text-left p-2.5 rounded-md border transition-all text-xs ${
                          searchScope === 'SOLO_PRACTITIONERS'
                            ? 'border-primary bg-primary/10 text-primary font-medium shadow-xs'
                            : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <div className="font-semibold text-foreground flex items-center justify-between">
                          <span>👨‍⚕️ Solo Practitioners</span>
                          {searchScope === 'SOLO_PRACTITIONERS' && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                          Named professionals (Dr., CA, Advocate, Architect)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSearchScope('ALL_COMMERCIAL')}
                        className={`text-left p-2.5 rounded-md border transition-all text-xs ${
                          searchScope === 'ALL_COMMERCIAL'
                            ? 'border-primary bg-primary/10 text-primary font-medium shadow-xs'
                            : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <div className="font-semibold text-foreground flex items-center justify-between">
                          <span>🌐 All Commercial</span>
                          {searchScope === 'ALL_COMMERCIAL' && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                          Broad commercial search including directories
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Location & Radius */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="font-semibold text-foreground block mb-1">
                        Location / City / Country
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. Gurgaon, South Delhi, Mumbai, London"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="font-semibold text-foreground block mb-1">
                        Locality / Commercial Hub (Optional)
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. DLF Cyber City, Sector 44"
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="font-semibold text-foreground block mb-1">
                        Search Radius
                      </label>
                      <select
                        value={radius}
                        onChange={(e) => setRadius(e.target.value ? Number(e.target.value) : '')}
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Default / City-wide</option>
                        <option value={5}>5 km radius</option>
                        <option value={10}>10 km radius</option>
                        <option value={25}>25 km radius</option>
                        <option value={50}>50 km radius</option>
                      </select>
                    </div>
                  </div>

                  {/* Max Results & Data Source */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-foreground block mb-1">
                        Maximum Results
                      </label>
                      <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value={10}>10 Records</option>
                        <option value={25}>25 Records (Standard)</option>
                        <option value={50}>50 Records</option>
                        <option value={100}>100 Records</option>
                        <option value={250}>250 Records</option>
                        <option value={500}>500 Records</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-foreground block mb-1">
                        Data Source Provider
                      </label>
                      <select
                        value={providerId}
                        onChange={(e) => setProviderId(e.target.value)}
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="auto">Auto (Live Multi-Engine Search & Directory)</option>
                        <option value="google-places">Google Places API (Maps & Places)</option>
                        <option value="live-search">Live Web & Directory Search</option>
                        <option value="public-registry">Licensed Public Registry</option>
                      </select>
                    </div>
                  </div>

                  {/* Fields to Collect Checkboxes */}
                  <div className="p-3 rounded-md bg-muted/30 border border-border/80">
                    <span className="font-semibold text-foreground block mb-2 text-[11px] uppercase tracking-wider">
                      Fields to Collect & Extract
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { id: 'name', label: 'Business Name', required: true },
                        { id: 'phone', label: 'Phone Number' },
                        { id: 'email', label: 'Email Address' },
                        { id: 'website', label: 'Website URL' },
                        { id: 'address', label: 'Full Address' },
                        { id: 'category', label: 'Category' },
                        { id: 'rating', label: 'Rating & Reviews' },
                        { id: 'sourceUrl', label: 'Source URL' },
                      ].map((f) => (
                        <label key={f.id} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={collectFields[f.id]}
                            disabled={f.required}
                            onChange={(e) =>
                              setCollectFields({ ...collectFields, [f.id]: e.target.checked })
                            }
                            className="rounded border-input text-primary focus:ring-primary w-3.5 h-3.5"
                          />
                          <span className="text-[11px] text-foreground">{f.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Export Format & Run Button */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground font-medium">Export Format:</span>
                      <div className="flex items-center rounded-md border border-border p-0.5 bg-muted/40">
                        <button
                          type="button"
                          onClick={() => setExportFormat('XLSX')}
                          className={`text-xs px-2.5 py-1 rounded transition-colors ${
                            exportFormat === 'XLSX'
                              ? 'bg-background font-semibold text-foreground shadow-xs'
                              : 'text-muted-foreground'
                          }`}
                        >
                          XLSX (Excel)
                        </button>
                        <button
                          type="button"
                          onClick={() => setExportFormat('CSV')}
                          className={`text-xs px-2.5 py-1 rounded transition-colors ${
                            exportFormat === 'CSV'
                              ? 'bg-background font-semibold text-foreground shadow-xs'
                              : 'text-muted-foreground'
                          }`}
                        >
                          CSV
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSaveModal(true)}
                        className="text-xs h-9 px-3 gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Config</span>
                      </Button>

                      <Button
                        type="submit"
                        disabled={running}
                        className="text-xs h-9 px-5 gap-1.5 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      >
                        <Search className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
                        <span>{running ? 'Extracting Leads...' : 'Run Lead Extraction'}</span>
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Live Progress Stage Monitor */}
            {jobProgress && (
              <Card className="border-border">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <span>Pipeline Progress & Data Quality Engine</span>
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        jobProgress.currentStage === 'COMPLETED'
                          ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                          : jobProgress.currentStage === 'FAILED'
                          ? 'border-destructive/30 text-destructive bg-destructive/10'
                          : 'border-blue-500/30 text-blue-600 bg-blue-500/10'
                      }`}
                    >
                      {jobProgress.currentStage}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-3.5 space-y-3.5 text-xs">
                  {/* Progress Stages */}
                  <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-semibold">
                    {['SEARCHING', 'NORMALIZING', 'DEDUPLICATING', 'VALIDATING', 'IMPORTING'].map(
                      (stage, idx) => {
                        const stagesOrder = [
                          'SEARCHING',
                          'NORMALIZING',
                          'DEDUPLICATING',
                          'VALIDATING',
                          'IMPORTING',
                          'COMPLETED',
                        ];
                        const currentIdx = stagesOrder.indexOf(jobProgress.currentStage);
                        const isDone = currentIdx > idx || jobProgress.currentStage === 'COMPLETED';
                        const isCurrent = stagesOrder[idx] === jobProgress.currentStage;

                        return (
                          <div
                            key={stage}
                            className={`p-1.5 rounded border transition-colors ${
                              isDone
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                : isCurrent
                                ? 'border-primary bg-primary/10 text-primary animate-pulse'
                                : 'border-border bg-muted/20 text-muted-foreground'
                            }`}
                          >
                            {idx + 1}. {stage.charAt(0) + stage.slice(1).toLowerCase()}
                          </div>
                        );
                      }
                    )}
                  </div>

                  {/* Summary Metric Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    <div className="p-2 rounded border border-border bg-muted/20">
                      <div className="text-[10px] text-muted-foreground">Found</div>
                      <div className="text-sm font-bold text-foreground mt-0.5">{jobProgress.found}</div>
                    </div>
                    <div className="p-2 rounded border border-border bg-muted/20">
                      <div className="text-[10px] text-muted-foreground">Valid</div>
                      <div className="text-sm font-bold text-emerald-600 mt-0.5">{jobProgress.valid}</div>
                    </div>
                    <div className="p-2 rounded border border-border bg-muted/20">
                      <div className="text-[10px] text-muted-foreground">Duplicates</div>
                      <div className="text-sm font-bold text-amber-600 mt-0.5">{jobProgress.duplicates}</div>
                    </div>
                    <div className="p-2 rounded border border-emerald-500/30 bg-emerald-500/10">
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-300">Clean Records</div>
                      <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {jobProgress.results.length}
                      </div>
                    </div>
                    <div className="p-2 rounded border border-border bg-muted/20">
                      <div className="text-[10px] text-muted-foreground">Errors</div>
                      <div className="text-sm font-bold text-destructive mt-0.5">{jobProgress.errors}</div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setActiveTab('results')}
                      className="h-7 text-xs gap-1"
                    >
                      <span>View in Results Table</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right 1 Col: Quick Info & Provider Cards */}
          <div className="space-y-4 text-xs">
            {/* Quick Metrics of Extracted Leads */}
            <Card className="border-border shadow-none">
              <CardHeader className="pb-2.5 border-b border-border/60">
                <CardTitle className="text-xs font-semibold flex items-center justify-between">
                  <span>Current Extractor Metrics</span>
                  <Badge variant="outline" className="text-[10px]">
                    Session
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-primary" />
                    Total Leads Staged:
                  </span>
                  <span className="font-bold text-foreground">{metrics.total}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    With Phone Number:
                  </span>
                  <span className="font-bold text-foreground">{metrics.phone}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    With Website:
                  </span>
                  <span className="font-bold text-foreground">{metrics.website}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-500" />
                    With Business Email:
                  </span>
                  <span className="font-bold text-foreground">{metrics.email}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    Flagged Duplicates:
                  </span>
                  <span className="font-bold text-amber-600">{metrics.duplicates}</span>
                </div>
              </CardContent>
            </Card>

            {/* Anti-Fabrication Guarantee Card */}
            <Card className="border-border shadow-none border-primary/20 bg-primary/5">
              <CardContent className="p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Zero-Fake-Data Standard
                  </span>
                  <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">
                    Verified
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Every lead is backed by genuine public business registries, Google Places, or verified official websites. Simulated records are never presented as real leads.
                </p>
              </CardContent>
            </Card>

            {/* Quick Provider Status */}
            <Card className="border-border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold flex items-center justify-between">
                  <span>Available Data Sources</span>
                  <button onClick={() => setActiveTab('providers')} className="text-primary hover:underline text-[10px]">
                    Configure
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-1 text-[11px]">
                <div className="p-2 rounded border border-border flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">Google Places API</div>
                    <div className="text-[10px] text-muted-foreground">Official places & phone directory</div>
                  </div>
                  <Badge variant="outline" className="text-[9px]">
                    Places New / Text
                  </Badge>
                </div>
                <div className="p-2 rounded border border-border flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">Live Web & Directory</div>
                    <div className="text-[10px] text-muted-foreground">Multi-engine + website contact crawler</div>
                  </div>
                  <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                    Active
                  </Badge>
                </div>
                <div className="p-2 rounded border border-border flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">CSV / XLSX Import</div>
                    <div className="text-[10px] text-muted-foreground">Uploaded spreadsheet normalizer</div>
                  </div>
                  <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                    Available
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: RESULTS TABLE */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <Card className="border-border shadow-none p-3 space-y-1">
              <span className="text-muted-foreground text-[11px]">Total Extracted</span>
              <div className="text-xl font-bold text-foreground">{metrics.total}</div>
              <span className="text-[10px] text-muted-foreground">{metrics.unique} unique names</span>
            </Card>
            <Card className="border-border shadow-none p-3 space-y-1">
              <span className="text-muted-foreground text-[11px]">With Phone Number</span>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{metrics.phone}</div>
              <span className="text-[10px] text-muted-foreground">
                {metrics.total ? Math.round((metrics.phone / metrics.total) * 100) : 0}% coverage
              </span>
            </Card>
            <Card className="border-border shadow-none p-3 space-y-1">
              <span className="text-muted-foreground text-[11px]">With Official Website</span>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.website}</div>
              <span className="text-[10px] text-muted-foreground">
                {metrics.total ? Math.round((metrics.website / metrics.total) * 100) : 0}% coverage
              </span>
            </Card>
            <Card className="border-border shadow-none p-3 space-y-1">
              <span className="text-muted-foreground text-[11px]">With Public Email</span>
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{metrics.email}</div>
              <span className="text-[10px] text-muted-foreground">
                {metrics.total ? Math.round((metrics.email / metrics.total) * 100) : 0}% coverage
              </span>
            </Card>
            <Card className="border-border shadow-none p-3 space-y-1">
              <span className="text-muted-foreground text-[11px]">Flagged Duplicates</span>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{metrics.duplicates}</div>
              <button
                onClick={() => setActiveTab('duplicates')}
                className="text-[10px] text-primary hover:underline font-medium"
              >
                Review duplicates →
              </button>
            </Card>
          </div>

          {/* Search, Filter & Column Toggle Bar */}
          <Card className="border-border shadow-none">
            <CardContent className="p-3 space-y-2.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {/* Search Text Input */}
                <div className="sm:col-span-2 relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                  <Input
                    type="text"
                    placeholder="Search by business name, city, phone, email..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                {/* Phone Filter */}
                <select
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value as any)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="ALL">All Phone Statuses</option>
                  <option value="HAS_PHONE">Has Phone Number</option>
                  <option value="NO_PHONE">No Phone Number</option>
                </select>

                {/* Website Filter */}
                <select
                  value={websiteFilter}
                  onChange={(e) => setWebsiteFilter(e.target.value as any)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="ALL">All Website Statuses</option>
                  <option value="HAS_WEBSITE">Has Website</option>
                  <option value="NO_WEBSITE">No Website</option>
                </select>

                {/* Rating Filter */}
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value as any)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="ALL">All Ratings</option>
                  <option value="RATED">Has Rating</option>
                  <option value="HIGH_RATED">Top Rated (4.5+ ★)</option>
                </select>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    Showing {filteredLeads.length} of {leads.length} leads
                    {selectedLeadIndices.size > 0 && ` (${selectedLeadIndices.size} selected)`}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="h-6 text-[10px] px-2 text-primary"
                  >
                    {isAllSelected ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('XLSX')}
                    disabled={exporting || filteredLeads.length === 0}
                    className="h-7 text-xs gap-1.5 border-emerald-600/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download Excel (.xlsx)</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('CSV')}
                    disabled={exporting || filteredLeads.length === 0}
                    className="h-7 text-xs gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </Button>
                  <Link href="/leads">
                    <Button variant="default" size="sm" className="h-7 text-xs gap-1">
                      <span>View in CRM</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead className="bg-muted/50 font-semibold text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-2.5 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-input text-primary w-3.5 h-3.5"
                    />
                  </th>
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
                    Business Name {sortField === 'businessName' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Phone Number</th>
                  <th className="p-2.5">Email Address</th>
                  <th className="p-2.5">Website</th>
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
                  <th
                    className="p-2.5 cursor-pointer hover:text-foreground"
                    onClick={() => {
                      if (sortField === 'rating') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('rating');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    Rating {sortField === 'rating' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Source</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-muted-foreground">
                      <div className="space-y-2">
                        <Search className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                        <div className="font-semibold text-foreground">No business leads to display</div>
                        <p className="text-xs max-w-sm mx-auto">
                          Click <strong>New Search</strong> to extract leads across any industry or <strong>Import CSV/XLSX</strong> to load a spreadsheet.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((item, idx) => {
                    const isEditing = editingIndex === idx;
                    const isSelected = selectedLeadIndices.has(idx);

                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-muted/30 transition-colors ${
                          isSelected ? 'bg-primary/5' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(idx)}
                            className="rounded border-input text-primary w-3.5 h-3.5"
                          />
                        </td>

                        {/* Business Name */}
                        <td className="p-2.5 font-medium max-w-[220px]">
                          {isEditing ? (
                            <Input
                              type="text"
                              value={editForm.businessName || ''}
                              onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                              className="h-6 text-xs p-1"
                            />
                          ) : (
                            <div>
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
                                  Office / Business
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="p-2.5">
                          {isEditing ? (
                            <Input
                              type="text"
                              value={editForm.profession || ''}
                              onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })}
                              className="h-6 text-xs p-1"
                            />
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-normal">
                              {item.profession || effectiveCategory}
                            </Badge>
                          )}
                        </td>

                        {/* Phone */}
                        <td className="p-2.5">
                          {isEditing ? (
                            <Input
                              type="text"
                              value={editForm.publicPhone || ''}
                              onChange={(e) => setEditForm({ ...editForm, publicPhone: e.target.value })}
                              className="h-6 text-xs p-1"
                            />
                          ) : item.publicPhone ? (
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
                          {isEditing ? (
                            <Input
                              type="text"
                              value={editForm.publicEmail || ''}
                              onChange={(e) => setEditForm({ ...editForm, publicEmail: e.target.value })}
                              className="h-6 text-xs p-1"
                            />
                          ) : item.publicEmail ? (
                            <span className="text-[10px] flex items-center gap-1 text-foreground truncate max-w-[140px]" title={item.publicEmail}>
                              <Mail className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{item.publicEmail}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60 italic text-[10px]">Unavailable</span>
                          )}
                        </td>

                        {/* Website */}
                        <td className="p-2.5">
                          {isEditing ? (
                            <Input
                              type="text"
                              value={editForm.website || ''}
                              onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                              className="h-6 text-xs p-1"
                            />
                          ) : item.website ? (
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
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              No Website
                            </span>
                          )}
                        </td>

                        {/* Location */}
                        <td className="p-2.5 text-muted-foreground max-w-[140px] truncate" title={item.address || item.city}>
                          {isEditing ? (
                            <Input
                              type="text"
                              value={editForm.city || ''}
                              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                              className="h-6 text-xs p-1"
                            />
                          ) : (
                            <div className="truncate">
                              <span>{item.city}</span>
                              {item.state && <span className="text-[9px] text-muted-foreground/70">, {item.state}</span>}
                            </div>
                          )}
                        </td>

                        {/* Rating */}
                        <td className="p-2.5">
                          {item.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="font-semibold text-foreground text-[10px]">{item.rating}</span>
                              {item.reviewCount ? (
                                <span className="text-[9px] text-muted-foreground">({item.reviewCount})</span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60 text-[10px]">—</span>
                          )}
                        </td>

                        {/* Contact Status */}
                        <td className="p-2.5">
                          {item.contactStatus === 'SOURCE_CONFIRMED' || item.contactStatus === 'VERIFIED' ? (
                            <Badge variant="outline" className="text-[9px] text-emerald-600 bg-emerald-500/10 border-emerald-500/30 gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Verified</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] text-zinc-500 bg-zinc-500/10">
                              Unavailable
                            </Badge>
                          )}
                        </td>

                        {/* Source Evidence */}
                        <td className="p-2.5">
                          {item.sourceUrl ? (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-[10px] flex items-center gap-1 max-w-[120px] truncate"
                              title={item.sourceUrl}
                            >
                              <span className="truncate">{item.source || 'Source Link'}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">{item.source || 'Directory'}</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => saveEditing(idx)}
                                  className="h-6 text-[10px] px-2 gap-1 bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Save</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEditing}
                                  className="h-6 text-[10px] px-1.5"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditing(idx)}
                                  className="h-6 text-[10px] px-1.5 text-muted-foreground hover:text-foreground"
                                  title="Edit lead details"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                </Button>
                                {item.leadId && (
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
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DUPLICATE REVIEW */}
      {activeTab === 'duplicates' && (
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                Duplicate Detection & Merging Studio
              </span>
              <Badge variant="outline" className="text-[10px]">
                {duplicateLeads.length} flagged records
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Review flagged duplicates detected via canonical website domain, phone number match, or exact business name.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs space-y-3">
            {duplicateLeads.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <div className="font-semibold text-foreground">No duplicates detected</div>
                <p className="text-xs max-w-sm mx-auto">
                  All staged records are unique based on website domain, phone number, and location matching.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {duplicateLeads.map((dup, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-foreground text-xs flex items-center gap-2">
                        <span>{dup.businessName}</span>
                        <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-600 bg-amber-500/10">
                          {dup.importStatus}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{dup.city}</span>
                    </div>

                    <div className="text-[11px] text-muted-foreground bg-background p-2 rounded border border-border/60">
                      <strong>Detection Reason: </strong>
                      <span>{dup.details || 'Matched existing lead by canonical domain, phone, or name.'}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        {dup.publicPhone && <span>Phone: {dup.publicPhone}</span>}
                        {dup.website && <span>Website: {dup.website}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Keep lead
                            setSuccessNotice(`Lead "${dup.businessName}" marked as unique.`);
                          }}
                          className="h-6 text-[10px] px-2"
                        >
                          Keep as Separate
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setLeads(leads.filter((l) => l !== dup));
                            setSuccessNotice(`Removed duplicate record "${dup.businessName}".`);
                          }}
                          className="h-6 text-[10px] px-2"
                        >
                          Discard
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: SAVED SEARCHES & PROJECTS */}
      {activeTab === 'saved' && (
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" />
                Saved Search Configurations & Projects
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveModal(true)}
                className="h-7 text-xs gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Current Config</span>
              </Button>
            </CardTitle>
            <CardDescription className="text-xs">
              Saved search parameters allow you to rerun targeted lead extractions with one click.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs">
            {savedSearches.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground space-y-2">
                <FolderOpen className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                <div className="font-semibold text-foreground">No saved projects yet</div>
                <p className="text-xs max-w-sm mx-auto">
                  Configure your category and location in <strong>New Search</strong>, then click <strong>Save Search</strong> to store it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedSearches.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3.5 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-foreground text-xs">{proj.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {proj.category} in {proj.location}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px]">
                        {proj.limit} leads
                      </Badge>
                    </div>

                    <div className="text-[10px] text-muted-foreground space-y-0.5">
                      <div>Provider: {proj.providerId}</div>
                      <div>Format: {proj.exportFormat}</div>
                      {proj.lastRunAt && (
                        <div>Last Run: {new Date(proj.lastRunAt).toLocaleDateString()}</div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleRunSavedSearch(proj)}
                        className="h-7 text-xs gap-1"
                      >
                        <Search className="w-3 h-3" />
                        <span>Rerun Search</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSavedSearch(proj.id)}
                        className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 5: FILE IMPORT (CSV / XLSX) */}
      {activeTab === 'import' && (
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                Upload & Clean Spreadsheet (.csv, .xlsx, .xls)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.setAttribute('download', 'lead_extractor_sample.csv');
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="h-7 text-xs gap-1"
              >
                <Download className="w-3 h-3" />
                <span>Sample Template</span>
              </Button>
            </CardTitle>
            <CardDescription className="text-xs">
              Upload any existing business list. Our pipeline will automatically normalize phone numbers, clean emails, detect canonical domains, and flag duplicates.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            {/* File Drag and Drop */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-border rounded-lg text-center cursor-pointer hover:border-primary/50 transition-colors space-y-2 bg-muted/10"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setImportFile(f);
                }}
                className="hidden"
              />
              <FileSpreadsheet className="w-8 h-8 text-primary mx-auto" />
              <div>
                <span className="font-semibold text-foreground">
                  {importFile ? importFile.name : 'Click to select or drag & drop CSV or Excel file'}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Supports .csv, .xlsx, and .xls spreadsheets with business headers
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <Button
                variant="default"
                disabled={importing || (!importFile && !importText.trim())}
                onClick={handleImportSubmit}
                className="text-xs h-8 px-4 gap-1.5 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${importing ? 'animate-spin' : ''}`} />
                <span>{importing ? 'Processing & Cleansing...' : 'Clean & Extract Leads'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 6: EXPORT HISTORY */}
      {activeTab === 'history' && (
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Export Audit & Download History
              </span>
              <Badge variant="outline" className="text-[10px]">
                {exportHistory.length} downloads logged
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Every exported spreadsheet is logged with record counts, target parameters, and timestamps.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs">
            {exportHistory.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground space-y-2">
                <History className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                <div className="font-semibold text-foreground">No exports recorded yet</div>
                <p className="text-xs max-w-sm mx-auto">
                  Export leads from the Results table to generate and log downloadable XLSX or CSV files.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded border border-border">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-2.5">File Name</th>
                      <th className="p-2.5">Format</th>
                      <th className="p-2.5">Records</th>
                      <th className="p-2.5">Search Query</th>
                      <th className="p-2.5">Location</th>
                      <th className="p-2.5">Export Date</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {exportHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2.5 font-medium text-foreground">{item.fileName}</td>
                        <td className="p-2.5">
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${
                              item.format === 'XLSX'
                                ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
                                : 'border-blue-500/40 text-blue-600 bg-blue-500/10'
                            }`}
                          >
                            {item.format}
                          </Badge>
                        </td>
                        <td className="p-2.5 font-bold text-foreground">{item.rowCount}</td>
                        <td className="p-2.5 text-muted-foreground">{item.searchKeyword}</td>
                        <td className="p-2.5 text-muted-foreground">{item.searchLocation}</td>
                        <td className="p-2.5 text-muted-foreground">
                          {new Date(item.exportedAt).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              await fetch(`/api/discovery/export-history?id=${item.id}`, { method: 'DELETE' });
                              loadExportHistory();
                            }}
                            className="h-6 text-[10px] px-2 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 7: DATA PROVIDERS & SETTINGS */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  Lead Source Providers Architecture
                </span>
                <Badge variant="outline" className="text-[10px]">
                  Modular Adapters
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Configure authorized business data sources. All credentials remain secure in server environment variables.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Google Places API */}
                <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-primary" />
                      Google Places API
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Places API (New & Text)
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Direct access to Google Places business listings, physical addresses, ratings, review counts, and international phone numbers.
                  </p>
                  <div className="pt-2 border-t border-border/40 text-[11px] space-y-1">
                    <div className="font-semibold text-foreground">Setup Instructions:</div>
                    <code className="block p-2 rounded bg-muted/50 font-mono text-[10px] text-foreground">
                      GOOGLE_PLACES_API_KEY=your_api_key_here
                    </code>
                    <p className="text-[10px] text-muted-foreground">
                      Add to your <span className="font-mono">.env</span> file. Obtain a key from Google Cloud Console with Places API enabled.
                    </p>
                  </div>
                </div>

                {/* Live Web & Directory */}
                <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-emerald-600" />
                      Live Web & Professional Directory
                    </span>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                      Active
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Multi-engine search (SerpAPI / Google CSE / Tavily / Bing) with live homepage and contact page scraping for verified phone & email contacts.
                  </p>
                  <div className="pt-2 border-t border-border/40 text-[11px] space-y-1">
                    <div className="font-semibold text-foreground">Optional API Accelerators:</div>
                    <code className="block p-2 rounded bg-muted/50 font-mono text-[10px] text-foreground">
                      SERPAPI_API_KEY=your_key<br />
                      TAVILY_API_KEY=your_key
                    </code>
                  </div>
                </div>

                {/* Licensed Public Registry */}
                <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      Licensed Public Directory & Registries
                    </span>
                    <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-500/30 bg-blue-500/10">
                      Authorized
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Official public corporate registers and professional association directories (ICAI, Bar Council, DCI, COA).
                  </p>
                  <div className="pt-2 border-t border-border/40 text-[11px] space-y-1">
                    <div className="font-semibold text-foreground">Configuration:</div>
                    <code className="block p-2 rounded bg-muted/50 font-mono text-[10px] text-foreground">
                      PUBLIC_REGISTRY_API_KEY=your_key
                    </code>
                  </div>
                </div>

                {/* User File Import Provider */}
                <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                      Spreadsheet Import Engine
                    </span>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                      Active
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Imports user-provided CSV and Excel files. Detects columns, standardizes phones and emails, and removes duplicates.
                  </p>
                  <div className="pt-2 border-t border-border/40 text-[11px]">
                    <span className="text-muted-foreground">No API key required. Built-in SheetJS processor.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Search Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <Save className="w-4 h-4 text-primary" />
                Save Search Project
              </h3>
              <button onClick={() => setShowSaveModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-muted-foreground text-xs">
              Save this search configuration so you can repeat it or run scheduled extractions later.
            </p>

            <div className="space-y-2">
              <label className="font-semibold text-foreground block">Project Name</label>
              <Input
                type="text"
                placeholder="e.g. Lawyers in Gurgaon 50 Leads"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                autoFocus
                className="h-8 text-xs"
              />
            </div>

            <div className="p-2.5 rounded bg-muted/40 border border-border/60 text-[11px] space-y-1">
              <div><strong>Category:</strong> {effectiveCategory}</div>
              <div><strong>Location:</strong> {location} {locality ? `(${locality})` : ''}</div>
              <div><strong>Limit:</strong> {limit} records</div>
              <div><strong>Format:</strong> {exportFormat}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowSaveModal(false)}>
                Cancel
              </Button>
              <Button variant="default" size="sm" onClick={handleSaveSearch} disabled={!saveSearchName.trim()}>
                Save Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
