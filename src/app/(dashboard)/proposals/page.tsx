import React from 'react';
import { Phase2FeaturePreview } from '@/components/layout/phase2-feature-preview';
import { FileSpreadsheet } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ProposalsPage() {
  return (
    <Phase2FeaturePreview
      title="Proposals & Scope of Work"
      description="Create, send, and track customized website redesign and client portal proposals for interested CA practices."
      icon={FileSpreadsheet}
      phase1Foundation={[
        'PROPOSAL pipeline stage in Lead model',
        'AuditLog entity recording proposal lifecycle',
        'Lead pricing & opportunity score diagnostics',
      ]}
      phase2Roadmap={[
        'Automated SOW document generator with CA package pricing tiers',
        'Interactive proposal web view with digital signature sign-off',
        'Integration with GST-compliant invoicing workflows',
        'Milestone payment schedule tracking (50% upfront, 50% on deployment)',
      ]}
      actionLabel="Create Proposal Draft"
    />
  );
}
