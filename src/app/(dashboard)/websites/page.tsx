import React from 'react';
import { Phase2FeaturePreview } from '@/components/layout/phase2-feature-preview';
import { Laptop } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function WebsitesPage() {
  return (
    <Phase2FeaturePreview
      title="Deployed Client Websites & Demos"
      description="Central command center for deployed demo preview environments, staging instances, and production client websites."
      icon={Laptop}
      phase1Foundation={[
        'Website entity model with speedScore, SSL status, and CMS attributes',
        'DeploymentProvider interface for Vercel/Cloudflare',
        'Safe guard requiring human sign-off before irreversible actions',
      ]}
      phase2Roadmap={[
        'One-click DNS provisioning and SSL certificate renewal monitoring',
        'Global CDN caching status and uptime health-check pings',
        'Production release staging and git-backed deployment rollback',
        'Automated Lighthouse regression checks on every deployment',
      ]}
      actionLabel="Provision New Site"
    />
  );
}
