import { notFound } from 'next/navigation';
import { LeadRepository, WebsiteDemoRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { DemoClient } from './demo-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    leadId: string;
  };
}

export default async function LeadDemoPage({ params }: PageProps) {
  const { leadId } = params;
  const orgId = await getResolvedOrganizationId();

  if (!orgId) {
    notFound();
  }

  // Retrieve lead scoped strictly to active organization context
  const lead = await LeadRepository.getLeadById(leadId, orgId);
  if (!lead) {
    notFound();
  }

  // Retrieve generated demos for this lead and organization
  const demos = await WebsiteDemoRepository.listDemos(orgId, leadId);

  return <DemoClient initialLead={lead} initialDemos={demos} />;
}

