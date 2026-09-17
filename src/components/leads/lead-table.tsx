'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ExternalLink,
  Plus,
  RefreshCw,
  X,
  Mail,
  Phone,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { LeadData, LeadStatus, WebsiteStatus, PaginatedLeads } from '@/types';
import { LeadStatusBadge, WebsiteStatusBadge, OpportunityScoreBadge } from '@/components/ui/status-badge';
import { DemoBadge } from '@/components/ui/demo-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { CsvImportModal } from './csv-import-modal';

export function LeadTable() {
  const [data, setData] = useState<PaginatedLeads | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and sorting state
  const [search, setSearch] = useState('');
  const [professionFilter, setProfessionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [websiteFilter, setWebsiteFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [demoFilter, setDemoFilter] = useState<string>('ALL');
  const [contactFilter, setContactFilter] = useState<string>('ANY');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'opportunityScore' | 'createdAt' | 'businessName' | 'updatedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // New Lead Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newProfession, setNewProfession] = useState('Chartered Accountant');
  const [newCustomProfession, setNewCustomProfession] = useState('');
  const [newCity, setNewCity] = useState('Gurgaon');
  const [newAddress, setNewAddress] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newReason, setNewReason] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        sortOrder,
      });

      if (search.trim()) params.set('search', search.trim());
      if (professionFilter !== 'ALL') params.set('profession', professionFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (websiteFilter !== 'ALL') params.set('websiteStatus', websiteFilter);
      if (sourceFilter !== 'ALL') params.set('source', sourceFilter);
      if (demoFilter === 'DEMO_ONLY') params.set('isDemoData', 'true');
      if (demoFilter === 'REAL_ONLY') params.set('isDemoData', 'false');
      if (contactFilter !== 'ANY') params.set('hasContact', contactFilter);
      if (channelFilter !== 'ALL') params.set('channel', channelFilter);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }
      const json: PaginatedLeads = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, search, professionFilter, statusFilter, websiteFilter, sourceFilter, demoFilter, contactFilter, channelFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const effectiveProf =
        newProfession === 'Other' ? newCustomProfession.trim() || 'Business' : newProfession;

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: newBusinessName,
          profession: effectiveProf,
          city: newCity,
          address: newAddress || `${newCity} Commercial Area`,
          website: newWebsite || null,
          publicEmail: newEmail || null,
          publicPhone: newPhone || null,
          opportunityReason: newReason || `Manual qualification added for ${effectiveProf} lead.`,
          opportunityScore: 75,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to create lead');
      }

      setShowAddModal(false);
      setNewBusinessName('');
      setNewProfession('Chartered Accountant');
      setNewCustomProfession('');
      setNewAddress('');
      setNewWebsite('');
      setNewEmail('');
      setNewPhone('');
      setNewReason('');
      fetchLeads();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error creating lead');
    } finally {
      setCreating(false);
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (professionFilter !== 'ALL') params.set('profession', professionFilter);
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (websiteFilter !== 'ALL') params.set('websiteStatus', websiteFilter);
    if (sourceFilter !== 'ALL') params.set('source', sourceFilter);
    if (channelFilter !== 'ALL') params.set('channel', channelFilter);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder) params.set('sortOrder', sortOrder);
    window.location.href = `/api/leads/export?${params.toString()}`;
  };

  const toggleSort = (field: 'opportunityScore' | 'createdAt' | 'businessName' | 'updatedAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by firm name, city, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1.5 h-9 text-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {(statusFilter !== 'ALL' || websiteFilter !== 'ALL' || professionFilter !== 'ALL' || channelFilter !== 'ALL') && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchLeads}
            title="Reload leads"
            className="h-9 w-9 text-muted-foreground"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-1.5 h-9 text-xs border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
            title="Export filtered leads to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCsvModal(true)}
            className="gap-1.5 h-9 text-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="gap-1.5 h-9 text-xs shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </Button>
        </div>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <Card className="border-border/80 bg-muted/20">
          <CardContent className="p-3.5 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Profession:</span>
              <select
                value={professionFilter}
                onChange={(e) => {
                  setProfessionFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Professions</option>
                <option value="Chartered Accountant">Chartered Accountant</option>
                <option value="Dentist">Dentist</option>
                <option value="Lawyer">Lawyer</option>
                <option value="Doctor / Clinic">Doctor / Clinic</option>
                <option value="Architect">Architect</option>
                <option value="Interior Designer">Interior Designer</option>
                <option value="Real Estate Agent">Real Estate Agent</option>
                <option value="Consultant">Consultant</option>
                <option value="Gym / Fitness">Gym / Fitness</option>
                <option value="Coaching Institute">Coaching Institute</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Pipeline Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="DEMO_GENERATED">Demo Generated</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CONTACTED">Contacted</option>
                <option value="RESPONDED">Responded</option>
                <option value="INTERESTED">Interested</option>
                <option value="CONVERTED">Converted</option>
                <option value="NOT_INTERESTED">Not Interested</option>
                <option value="DO_NOT_CONTACT">Do Not Contact</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Website Status:</span>
              <select
                value={websiteFilter}
                onChange={(e) => {
                  setWebsiteFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Statuses</option>
                <option value="NO_WEBSITE">No Website (Demo Eligible)</option>
                <option value="WEBSITE_EXISTS">Website Exists</option>
                <option value="REQUIRES_REVIEW">Requires Review</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Source Type:</span>
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Sources</option>
                <option value="USER_IMPORTED">CSV / User Imported</option>
                <option value="Demo">Demo Directory</option>
                <option value="Public">Public Directory</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Data Type:</span>
              <select
                value={demoFilter}
                onChange={(e) => {
                  setDemoFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Records</option>
                <option value="REAL_ONLY">Real Records Only</option>
                <option value="DEMO_ONLY">Demo Records Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Contact Info:</span>
              <select
                value={contactFilter}
                onChange={(e) => {
                  setContactFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ANY">Any Contact</option>
                <option value="EMAIL">Has Public Email</option>
                <option value="PHONE">Has Public Phone</option>
                <option value="BOTH">Has Both Email & Phone</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Outreach Channel:</span>
              <select
                value={channelFilter}
                onChange={(e) => {
                  setChannelFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Channels</option>
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="PHONE">Phone</option>
                <option value="SMS">SMS</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Page Size:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
              </select>
            </div>

            {(statusFilter !== 'ALL' || websiteFilter !== 'ALL' || professionFilter !== 'ALL' || sourceFilter !== 'ALL' || demoFilter !== 'ALL' || contactFilter !== 'ANY' || channelFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('ALL');
                  setWebsiteFilter('ALL');
                  setProfessionFilter('ALL');
                  setSourceFilter('ALL');
                  setDemoFilter('ALL');
                  setContactFilter('ANY');
                  setChannelFilter('ALL');
                  setPage(1);
                }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Database Error Banner */}
      {error && (
        <div className="p-4 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs space-y-1">
          <span className="font-bold block">Error Loading Leads</span>
          <p>{error}</p>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                <th
                  className="py-3 px-4 cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort('businessName')}
                >
                  <div className="flex items-center gap-1">
                    <span>Business</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">City</th>
                <th className="py-3 px-3">Qualification</th>
                <th className="py-3 px-3">Demo</th>
                <th className="py-3 px-3">Sales Status</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    <span>Last Activity</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading && !data && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                      <span>Loading leads...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && data && data.leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No matching leads found in this organization.
                  </td>
                </tr>
              )}

              {data &&
                data.leads.map((lead) => {
                  const activeDemo = lead.websiteDemos?.find((d) => d.isActive) || lead.websiteDemos?.[0];

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Business */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/leads/${lead.id}`}
                              className="font-semibold text-foreground hover:text-primary transition-colors"
                            >
                              {lead.businessName}
                            </Link>
                            {lead.isDemoData && <DemoBadge size="sm" />}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                            {lead.profession} • {lead.address}
                          </div>
                        </div>
                      </td>

                      {/* City */}
                      <td className="py-3 px-3 font-medium text-foreground">
                        {lead.city}
                      </td>

                      {/* Qualification */}
                      <td className="py-3 px-3">
                        <WebsiteStatusBadge status={lead.websiteStatus} />
                      </td>

                      {/* Demo */}
                      <td className="py-3 px-3">
                        {activeDemo ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                              v{activeDemo.version}
                            </span>
                            {activeDemo.approvalStatus === 'APPROVED' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                Approved
                              </span>
                            ) : activeDemo.approvalStatus === 'REJECTED' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                Pending Review
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">None</span>
                        )}
                      </td>

                      {/* Sales Status */}
                      <td className="py-3 px-3">
                        <LeadStatusBadge status={lead.leadStatus} />
                      </td>

                      {/* Last Activity */}
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {formatDate(lead.updatedAt || lead.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/leads/${lead.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                              Inspect
                            </Button>
                          </Link>
                          {activeDemo && (
                            <Link href={`/demo/${lead.id}`} target="_blank">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2 text-primary hover:text-primary/80 gap-1"
                                title="Open Demo in new tab"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Demo</span>
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && data.totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/10">
            <div>
              Showing <span className="font-semibold text-foreground">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(page * pageSize, data.total)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{data.total}</span> leads
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 px-2"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>

              <span className="px-2 py-1 text-xs font-medium">
                Page {page} of {data.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="h-7 px-2"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border shadow-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground">Add New Business Lead</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Business Name *</label>
                <Input
                  type="text"
                  placeholder="e.g. Demo Dental Clinic Gurgaon"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Profession *</label>
                  <select
                    value={newProfession}
                    onChange={(e) => setNewProfession(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Chartered Accountant">Chartered Accountant</option>
                    <option value="Dentist">Dentist</option>
                    <option value="Lawyer">Lawyer</option>
                    <option value="Doctor / Clinic">Doctor / Clinic</option>
                    <option value="Architect">Architect</option>
                    <option value="Interior Designer">Interior Designer</option>
                    <option value="Real Estate Agent">Real Estate Agent</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Gym / Fitness">Gym / Fitness</option>
                    <option value="Coaching Institute">Coaching Institute</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-foreground block mb-1">City *</label>
                  <Input
                    type="text"
                    placeholder="e.g. Gurgaon, Noida, Mumbai"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    required
                  />
                </div>
              </div>

              {newProfession === 'Other' && (
                <div>
                  <label className="font-semibold text-foreground block mb-1">Specify Custom Profession *</label>
                  <Input
                    type="text"
                    placeholder="e.g. Physiotherapist, Event Planner..."
                    value={newCustomProfession}
                    onChange={(e) => setNewCustomProfession(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-foreground block mb-1">Address *</label>
                <Input
                  type="text"
                  placeholder="e.g. DLF Phase 1, Gurgaon"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Website URL</label>
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground block mb-1">Public Email</label>
                  <Input
                    type="email"
                    placeholder="contact@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Public Phone</label>
                <Input
                  type="text"
                  placeholder="+91-124-5550100"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Opportunity Assessment *</label>
                <Input
                  type="text"
                  placeholder="Why does this business need a new website or redesign?"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creating}>
                  {creating ? 'Saving...' : 'Save Lead'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showCsvModal && (
        <CsvImportModal
          isOpen={showCsvModal}
          onClose={() => setShowCsvModal(false)}
          onImportComplete={() => fetchLeads()}
        />
      )}
    </div>
  );
}
