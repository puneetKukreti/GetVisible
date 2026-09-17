import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LeadRepository, WebsiteDemoRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { DemoClient } from './demo-client';
import { PublicDemoView } from './public-demo-view';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    leadId: string;
  };
}

/**
 * Generate appropriate metadata for prospect-facing website concepts.
 * Never leaks internal GetVisible CRM branding or lead IDs in browser title.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tokenOrId = params.leadId;

  // 1. Check if token matches an approved public demo
  const publicDemo = await WebsiteDemoRepository.getApprovedDemoByPublicToken(tokenOrId);
  if (publicDemo) {
    const brandName = publicDemo.content?.brand?.businessName || 'Chartered Accountants';
    const title =
      publicDemo.content?.meta?.title ||
      `${brandName} | Chartered Accountants & Tax Advisory`;
    const description =
      publicDemo.content?.meta?.description ||
      publicDemo.content?.brand?.tagline ||
      'Dedicated chartered accountancy practice providing audit, tax, and corporate advisory.';

    return {
      title,
      description,
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title,
        description,
      },
    };
  }

  // 2. Internal CRM fallback
  return {
    title: 'Website Concept Review | GetVisible',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function LeadDemoPage({ params }: PageProps) {
  const tokenOrId = params.leadId;

  // PATHWAY 1: Public Shareable Demo (Prospect-Facing)
  // Check if token matches an explicitly APPROVED public website concept.
  const publicDemo = await WebsiteDemoRepository.getApprovedDemoByPublicToken(tokenOrId);
  if (publicDemo) {
    // Record lightweight view event without exposing personal data
    await WebsiteDemoRepository.recordPublicDemoView(publicDemo.id, publicDemo.organizationId);

    // Render pure website presentation without any CRM chrome or admin data
    return <PublicDemoView demo={publicDemo} />;
  }

  // PATHWAY 2: Internal Authenticated GetVisible Preview
  // If not an approved public token, check if authenticated user is reviewing internal lead
  const orgId = await getResolvedOrganizationId();
  if (orgId) {
    const lead = await LeadRepository.getLeadById(tokenOrId, orgId);
    if (lead) {
      const demos = await WebsiteDemoRepository.listDemos(orgId, lead.id);
      return <DemoClient initialLead={lead} initialDemos={demos} />;
    }
  }

  // PATHWAY 3: Neither public token nor internal lead found -> 404
  notFound();
}

