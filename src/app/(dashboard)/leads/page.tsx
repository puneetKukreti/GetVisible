import React from 'react';
import { LeadTable } from '@/components/leads/lead-table';
import { DemoBadge } from '@/components/ui/demo-badge';

export const dynamic = 'force-dynamic';

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Business Leads & Pipeline
            <DemoBadge size="sm" />
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verified public business directory records across professional industries (Primary MVP Focus: Chartered Accountants).
          </p>
        </div>
      </div>

      <LeadTable />
    </div>
  );
}
