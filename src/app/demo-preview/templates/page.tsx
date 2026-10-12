'use client';

import React from 'react';
import Link from 'next/link';
import { STITCH_TEMPLATES } from '@/lib/demos/stitch-templates';
import {
  Sparkles,
  ExternalLink,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Monitor,
  Tablet,
  Smartphone,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function DemoTemplatesPage() {
  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Selectable Website Demo Designs</h1>
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">
              3 Authentic Stitch Models
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Choose from 3 curated website layouts generated using Google Stitch for Chartered Accountant firms.
            Each design features authentic typography, distinct color palettes, and fully responsive layouts across desktop, tablet, and mobile.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/demos">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Layers className="h-3.5 w-3.5" />
              <span>Demos Hub</span>
            </Button>
          </Link>
          <Link href="/proposals">
            <Button size="sm" className="gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Client Proposals</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-500">
            <Sparkles className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Authentic Aesthetics</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Google Stitch-designed layouts with distinctive geometry, typography scales, and tokenized colors.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-blue-500">
            <Monitor className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Multi-Device Preview</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Instant toggle between Desktop (100%), Tablet (768px), and Mobile (390px) responsive viewports.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-500">
            <ShieldCheck className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">ICAI Compliant</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Strict adherence to professional ethics: zero fabricated testimonials or misleading statutory claims.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-purple-500">
            <Layers className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">CSS Style Isolated</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Rendered inside isolated sandboxes to eliminate cross-template style pollution and global CSS leakage.
          </p>
        </div>
      </div>

      {/* 3 Selectable Demo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STITCH_TEMPLATES.map((tmpl) => (
          <Card
            key={tmpl.id}
            className="flex flex-col overflow-hidden border-border/60 hover:border-amber-500/50 transition-all duration-300 shadow-sm hover:shadow-xl group"
          >
            {/* Card Thumbnail Image */}
            <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden border-b border-border/50">
              <img
                src={tmpl.thumbnail}
                alt={tmpl.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute top-3 left-3">
                <Badge className="bg-slate-900/90 text-amber-400 border border-amber-400/30 text-[11px] font-semibold backdrop-blur-sm">
                  {tmpl.badge}
                </Badge>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                <span className="font-mono text-[10px] bg-slate-900/90 px-2 py-0.5 rounded border border-white/10 backdrop-blur-sm">
                  {tmpl.conceptName}
                </span>
                <span className="text-[11px] text-slate-300 font-medium">
                  {tmpl.typography}
                </span>
              </div>
            </div>

            {/* Card Header & Content */}
            <CardHeader className="space-y-1.5 pb-3">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>{tmpl.name}</span>
              </CardTitle>
              <CardDescription className="text-xs line-clamp-2">
                {tmpl.shortDescription}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 flex-1 flex flex-col justify-between text-xs pt-0">
              <div className="space-y-3">
                {/* Color Palette Swatches */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Color Architecture
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {tmpl.palette.map((c) => (
                      <div
                        key={c.name}
                        className="inline-flex items-center gap-1 bg-muted/50 border border-border px-1.5 py-0.5 rounded text-[10px]"
                        title={`${c.name}: ${c.hex}`}
                      >
                        <span
                          className="h-2 w-2 rounded-full border border-black/20"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="font-mono text-[9px]">{c.hex}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Best Fit Practice */}
                <div className="space-y-1 bg-muted/30 p-2.5 rounded-lg border border-border/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Recommended For
                  </span>
                  <span className="text-xs text-foreground font-medium">
                    {tmpl.bestFor}
                  </span>
                </div>

                {/* Key Features */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Core Capabilities
                  </span>
                  <ul className="space-y-1">
                    {tmpl.keyFeatures.slice(0, 3).map((f, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border/40 flex items-center gap-2">
                <Link
                  href={`/demo-preview/template/${tmpl.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs shadow transition"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview Live</span>
                </Link>

                <a
                  href={tmpl.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition"
                  title="Open standalone full-screen site in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom CTA Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/20 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
            <Sparkles className="h-3 w-3" />
            <span>Ready for Pitching</span>
          </div>
          <h3 className="text-xl font-bold text-white">Need to Pitch One of These Websites to a CA Client?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Attach any of these 3 live preview links directly to your WhatsApp or Email outreach cards. 
            When the firm responds with interest, generate a scoped proposal in our Proposals module with one click.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/campaigns">
            <Button variant="outline" className="text-xs gap-1.5 border-slate-700 hover:bg-slate-800">
              <span>View Outreach Queue</span>
            </Button>
          </Link>
          <Link href="/proposals">
            <Button className="text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
              <span>Open Proposal Generator</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
