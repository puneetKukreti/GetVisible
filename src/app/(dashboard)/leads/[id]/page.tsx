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

  if (!leadId) {
    notFound();
  }

  // Attempt server-side retrieval if available in current serverless execution context
  let initialLead = null;
  if (orgId) {
    try {
      initialLead = await LeadRepository.getLeadById(leadId, orgId);
    } catch {
      // In serverless environments, in-memory cache may miss in Page lambda;
      // client component will gracefully retrieve the lead via /api/leads/[id].
    }
  }

  return <LeadDetailClient key={leadId} leadId={leadId} initialLead={initialLead} />;
}

