import React from 'react';
import { Phase2FeaturePreview } from '@/components/layout/phase2-feature-preview';
import { Inbox } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function InboxPage() {
  return (
    <Phase2FeaturePreview
      title="Unified Communications Inbox"
      description="Track inbound replies from CA partners, classify intent, and advance qualified prospects into proposal stages."
      icon={Inbox}
      phase1Foundation={[
        'REPLIED, INTERESTED, NOT_INTERESTED lead statuses active',
        'Activity model recording all communications and state updates',
        'Multi-tenant scoped conversation tracking',
      ]}
      phase2Roadmap={[
        'Inbound email webhook listener (Resend / SendGrid)',
        'Gemini sentiment & intent classifier (Meeting Request, Pricing Inquiry, Opt-Out)',
        'Automated opt-out processing creating instant SuppressionRecords',
        'Threaded response composer with CA service pitch suggestions',
      ]}
      actionLabel="Sync Inbound Mailbox"
    />
  );
}
