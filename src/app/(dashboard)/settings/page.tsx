import React from 'react';
import { getAllProviderStatuses } from '@/lib/providers';
import { LeadRepository } from '@/lib/db/repository';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DemoBadge } from '@/components/ui/demo-badge';
import {
  ShieldCheck,
  Building,
  Cpu,
  History,
  CheckCircle,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

import { getResolvedOrganizationId } from '@/lib/auth';
import { getDefaultOrganizationId, isPilotMode, WORKSPACE_CONFIGS } from '@/lib/workspace';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const orgId = (await getResolvedOrganizationId()) || getDefaultOrganizationId();
  const pilotActive = isPilotMode();
  const config = WORKSPACE_CONFIGS[pilotActive ? 'pilot' : 'demo'];
  const providerStatuses = getAllProviderStatuses();

  let auditLogs: import('@/types').AuditLogData[] = [];
  try {
    auditLogs = await LeadRepository.getAuditLogs(orgId);
  } catch {
    auditLogs = [];
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Organization & System Settings
          <DemoBadge size="sm" variant={pilotActive ? 'pilot' : 'demo'} />
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage agency tenancy, compliance suppression lists, and provider integration statuses.
        </p>
      </div>

      {/* Tenancy & Security Scope */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building className="w-4 h-4 text-primary" />
            <span>Organization Tenancy & Isolation</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Multi-tenant data isolation is enforced at the database layer using strict <code>organizationId</code> scoping.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-md bg-muted/30 border border-border">
              <span className="text-muted-foreground text-[11px] block">Workspace Name</span>
              <span className="font-semibold text-foreground">{config.name}</span>
            </div>
            <div className="p-3 rounded-md bg-muted/30 border border-border">
              <span className="text-muted-foreground text-[11px] block">Tenant Organization ID</span>
              <span className="font-mono text-foreground">{orgId}</span>
            </div>
            <div className="p-3 rounded-md bg-muted/30 border border-border">
              <span className="text-muted-foreground text-[11px] block">Active Environment</span>
              <span className={`font-semibold ${pilotActive ? 'text-emerald-600' : 'text-amber-600'}`}>
                {pilotActive ? 'REAL SALES PILOT' : 'DEMO SANDBOX'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Abstraction & Status Matrix */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <span>Service Provider Abstraction Matrix</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Decoupled service layer. Unconfigured providers are explicitly reported—never faked in production.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {providerStatuses.map((p) => (
              <div
                key={p.name}
                className="p-3 rounded-md border border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground font-mono">{p.name}</span>
                    {p.isMock && <DemoBadge size="sm" />}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{p.details}</div>
                </div>

                <div>
                  {p.configured ? (
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 gap-1 text-[10px]">
                      <CheckCircle className="w-3 h-3" /> Ready
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1 text-[10px]">
                      <AlertTriangle className="w-3 h-3" /> Provider Not Configured
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance & Anti-Spam Safeguards */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Anti-Spam & Ethical Compliance Rules</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-md border border-border/60 bg-muted/20 space-y-1">
              <span className="font-semibold text-foreground block">Mandatory Human Sign-Off</span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Autonomous outbound email dispatch and automated calling are prohibited by platform architecture.
              </p>
            </div>
            <div className="p-3 rounded-md border border-border/60 bg-muted/20 space-y-1">
              <span className="font-semibold text-foreground block">Global Suppression Sync</span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Leads marked as DO NOT CONTACT or opted-out are suppressed immediately across all channels.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Audit Log Stream */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <span>Organization Immutable Audit Trail</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Capturing status changes, lead updates, DNC suppressions, and user actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded border border-border/60 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{log.action}</span>
                    <span className="text-muted-foreground">on {log.entity} ({log.entityId})</span>
                    <span className="text-muted-foreground">by {log.actor}</span>
                  </div>
                  <div className="text-muted-foreground/80 font-mono text-[10px]">
                    {formatDateTime(log.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground italic">No audit events recorded yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
