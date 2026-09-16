import React from 'react';
import { Phase2FeaturePreview } from '@/components/layout/phase2-feature-preview';
import { BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  return (
    <Phase2FeaturePreview
      title="Advanced Pipeline Analytics"
      description="Deep analytical metrics on lead qualification ratios, demo engagement rates, and client acquisition cost across Delhi NCR."
      icon={BarChart3}
      phase1Foundation={[
        'Deterministic metric calculation engine in LeadRepository',
        '8 real database metrics aggregated dynamically',
        'Pipeline funnel stage distribution tracking',
      ]}
      phase2Roadmap={[
        'Cohort retention and conversion time velocity analytics',
        'Outreach channel efficacy comparison (Direct vs Public Directory)',
        'Auditor niche penetration heat-map across Gurgaon, Noida, and Delhi',
        'Revenue forecasting based on current proposal pipeline value',
      ]}
      actionLabel="Export Analytical Report"
    />
  );
}
