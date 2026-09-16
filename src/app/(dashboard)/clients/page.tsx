import React from 'react';
import { Phase2FeaturePreview } from '@/components/layout/phase2-feature-preview';
import { Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ClientsPage() {
  return (
    <Phase2FeaturePreview
      title="Active Agency Clients"
      description="Manage ongoing website clients, maintenance retainers, domain renewals, and quarterly security audits."
      icon={Building2}
      phase1Foundation={[
        'CUSTOMER lead pipeline status in schema',
        'Multi-tenant database isolation ensuring strict client confidentiality',
        'Activity model preserving complete sales-to-client historical context',
      ]}
      phase2Roadmap={[
        'Client portal with monthly uptime and traffic reporting',
        'Automated quarterly SEO and compliance checklist generator',
        'Support ticket management for CA firm partner requests',
        'Retainer billing and contract renewal alerts',
      ]}
      actionLabel="Onboard New Client"
    />
  );
}
