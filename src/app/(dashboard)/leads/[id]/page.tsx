import { notFound } from 'next/navigation';
import { LeadRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { LeadDetailClient } from './lead-detail-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function LeadDetailPage({ params }: PageProps) {
  const leadId = params.id;
  const orgId = await getResolvedOrganizationId();

  if (!orgId) {
    notFound();
  }

  // Retrieve lead strictly scoped to active organization context
  const lead = await LeadRepository.getLeadById(leadId, orgId);
  if (!lead) {
    notFound();
  }

  return <LeadDetailClient key={lead.id} initialLead={lead} />;
}
