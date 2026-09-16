import React from 'react';
import { Phase2FeaturePreview } from '@/components/layout/phase2-feature-preview';
import { Send } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function CampaignsPage() {
  return (
    <Phase2FeaturePreview
      title="Compliance-Gated Outreach Campaigns"
      description="Personalized 1-on-1 agency outreach with strict zero-spam, channel consent, and human approval verification."
      icon={Send}
      phase1Foundation={[
        'ConsentRecord and SuppressionRecord models implemented',
        'Strict channel check prohibiting contact with suppressed leads',
        'Mandatory human sign-off enforcement on every action',
        'EmailProvider abstraction with Resend/SMTP contracts',
      ]}
      phase2Roadmap={[
        'Individualized draft generation utilizing Gemini reasoning',
        'Agency director approval queue and preview workspace',
        'Opt-out token injection and unsubscribe link automation',
        'Delivery and open tracking without intrusive tracking pixels',
      ]}
      actionLabel="Create Outreach Campaign"
    />
  );
}
