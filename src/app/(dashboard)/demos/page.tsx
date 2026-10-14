'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { WebsiteDemoData, LeadData } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import {
  Sparkles,
  Eye,
  Building,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  FileCode,
  Award,
} from 'lucide-react';
import { STITCH_TEMPLATES } from '@/lib/demos/stitch-templates';
import { STITCH_DESIGN_MAP } from '@/lib/demos/stitch-personalizer';

export default function DemosPage() {
  const [demos, setDemos] = useState<WebsiteDemoData[]>([]);
  const [eligibleLeads, setEligibleLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [demosRes, leadsRes] = await Promise.all([
          fetch('/api/demos'),
          fetch('/api/leads?websiteStatus=NO_WEBSITE&pageSize=50'),
        ]);

        if (demosRes.ok) {
          const demosJson = await demosRes.json();
          if (demosJson.success) setDemos(demosJson.demos || []);
        }

        if (leadsRes.ok) {
          const leadsJson = await leadsRes.json();
          if (leadsJson.leads) setEligibleLeads(leadsJson.leads);
        }
      } catch (err) {
        console.error('Error loading demos:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredDemos = demos.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.content.brand.businessName.toLowerCase().includes(q) ||
      d.content.meta.profession.toLowerCase().includes(q) ||
      d.content.location.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Website Demo Generator Hub</h1>
            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-mono">
              PHASE 4 ACTIVE
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Personalized, interactive website concept demonstrations generated for verified businesses with no existing website.
          </p>
        </div>

        <Link href="/leads?websiteStatus=NO_WEBSITE">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Building className="w-3.5 h-3.5 text-amber-500" />
            <span>View All Leads With No Website ({eligibleLeads.length})</span>
          </Button>
        </Link>
      </div>

      {/* Safety & Protocol Banner */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-muted-foreground flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-[11px] leading-relaxed">
          <span className="font-bold text-foreground">Strict Concept Safety Protocol: </span>
          Demos use deterministic React components consuming validated JSON schemas. No unverified testimonials or client logos are fabricated. All simulated contact submissions are retained inside a demo sandbox.
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Total Concepts Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{demos.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Across all eligible leads</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Eligible Leads (NO_WEBSITE)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{eligibleLeads.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Verified prime conversion opportunities</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Google Stitch Designs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">3 Available</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Selectable responsive templates</p>
          </CardContent>
        </Card>
      </div>

      {/* 3 Selectable Google Stitch Templates Showcase */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              <span>Selectable Website Demo Templates</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Google Stitch templates ready to preview across desktop, tablet, and mobile.
            </p>
          </div>
          <Link
            href="/demo-preview/templates"
            className="text-xs text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1"
          >
            <span>View All Details</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STITCH_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="rounded-xl border border-border bg-card overflow-hidden hover:border-amber-500/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden border-b border-border">
                <img
                  src={tmpl.thumbnail}
                  alt={tmpl.name}
                  className="w-full h-full object-cover object-top"
                />
                <Badge className="absolute top-2 left-2 bg-slate-900/90 text-amber-400 border border-amber-400/30 text-[10px]">
                  {tmpl.badge}
                </Badge>
              </div>

              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-foreground">{tmpl.name}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {tmpl.shortDescription}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center gap-2">
                  <Link
                    href={`/demo-preview/template/${tmpl.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-1.5 rounded-lg text-xs transition"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Live Preview</span>
                  </Link>
                  <a
                    href={tmpl.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition"
                    title="Open standalone"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search demo concepts by firm name, city, or profession..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Demos Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          Loading website demo concepts...
        </div>
      ) : filteredDemos.length === 0 ? (
        <Card className="border-dashed border-border p-12 text-center">
          <FileCode className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-sm font-bold text-foreground">No Demo Concepts Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            {searchQuery
              ? 'No demos match your search query.'
              : 'You have not generated any website demonstrations yet. Go to a lead with NO_WEBSITE to generate your first concept.'}
          </p>
          {eligibleLeads.length > 0 && (
            <div className="mt-4">
              <Link href={`/leads/${eligibleLeads[0].id}`}>
                <Button size="sm" className="gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate for {eligibleLeads[0].businessName}</span>
                </Button>
              </Link>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDemos.map((demo) => (
            <Card
              key={demo.id}
              className="border-border hover:border-amber-500/40 transition flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md"
            >
              <div>
                {/* Visual Header Strip with Primary Color */}
                <div
                  className="h-3 w-full"
                  style={{ backgroundColor: demo.theme.primaryColor }}
                />
                <CardHeader className="pt-4 pb-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      v{demo.version}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(demo.createdAt)}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-foreground line-clamp-1">
                    {demo.content.brand.businessName}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {demo.content.meta.profession} • {demo.content.location.city}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3 text-xs pt-1">
                  <p className="text-muted-foreground text-[11px] line-clamp-2 italic">
                    &ldquo;{demo.content.hero.headline}&rdquo;
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: demo.theme.primaryColor }}
                        />
                        <span className="text-muted-foreground font-medium truncate max-w-[120px]">
                          {demo.theme.name || demo.theme.id || 'Executive Navy'}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium truncate max-w-[160px]">
                        {demo.design?.layout && STITCH_DESIGN_MAP[demo.design.layout]
                          ? STITCH_DESIGN_MAP[demo.design.layout].name
                          : demo.design?.layout || 'Design 1: Premium Editorial'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-border/50 mt-3">
                <Link
                  href={`/leads/${demo.leadId}`}
                  className="text-[11px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
                >
                  <span>CRM Lead</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>

                <Link
                  href={`/demo/${demo.leadId}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 text-xs font-bold shadow-xs transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Demo</span>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
