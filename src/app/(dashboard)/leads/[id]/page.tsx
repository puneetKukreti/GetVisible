import { notFound } from 'next/navigation';
import { LeadRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { LeadDetailClient } from './lead-detail-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  } | Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const rawId = resolvedParams?.id;
  const leadId = rawId ? decodeURIComponent(rawId).trim() : '';
  const orgId = await getResolvedOrganizationId();

  if (!orgId || !leadId) {
    notFound();
  }

  // Retrieve lead strictly scoped to active organization context
  const lead = await LeadRepository.getLeadById(leadId, orgId);
  if (!lead) {
    notFound();
  }

  return <LeadDetailClient key={lead.id} initialLead={lead} />;
}

