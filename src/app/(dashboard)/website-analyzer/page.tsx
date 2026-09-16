import React from 'react';
import { Phase2FeaturePreview } from '@/components/layout/phase2-feature-preview';
import { Globe2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function WebsiteAnalyzerPage() {
  return (
    <Phase2FeaturePreview
      title="Website Analyzer"
      description="Deep technical and visual audit of CA firm websites: mobile responsiveness, SSL security, load speed, and client portal presence."
      icon={Globe2}
      phase1Foundation={[
        'Website database model with status enums and audit notes',
        'WebsiteAnalyzerProvider abstraction implemented',
        'Lighthouse and PageSpeed payload contracts prepared',
        'Diagnostic scoring pipeline linked to lead opportunity score',
      ]}
      phase2Roadmap={[
        'Live Google PageSpeed Insights & Lighthouse API integration',
        'Automated screenshot capture of outdated design elements',
        'Broken SSL certificate and security headers detection',
        'CMS fingerprinting (legacy WordPress, Joomla, HTML4 tables)',
      ]}
      actionLabel="Analyze Website URL"
    />
  );
}
