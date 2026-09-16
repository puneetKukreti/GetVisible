import { notFound } from 'next/navigation';
import { LeadRepository, WebsiteDemoRepository } from '@/lib/db/repository';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';
import { DemoClient } from './demo-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    leadId: string;
  };
}

export default async function LeadDemoPage({ params }: PageProps) {
  const { leadId } = params;
  const orgId = DEMO_ORGANIZATION_ID;

  // Retrieve lead
  const lead = await LeadRepository.getLeadById(leadId, orgId);
  if (!lead) {
    notFound();
  }

  // Retrieve generated demos for this lead
  const demos = await WebsiteDemoRepository.listDemos(orgId, leadId);

  return <DemoClient initialLead={lead} initialDemos={demos} />;
}
