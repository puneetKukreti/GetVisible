import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LeadRepository, WebsiteDemoRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { DemoViewWrapper } from './demo-view-wrapper';
import { WebsiteDemoData, LeadData } from '@/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    leadId: string;
  } | Promise<{ leadId: string }>;
}

/**
 * Generate appropriate metadata for prospect-facing website concepts.
 * Never leaks internal GetVisible CRM branding or lead IDs in browser title.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const rawId = resolvedParams?.leadId;
  const tokenOrId = rawId ? decodeURIComponent(rawId).trim() : '';

  if (tokenOrId) {
    try {
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
          robots: { index: false, follow: false },
          openGraph: { title, description },
        };
      }
    } catch {
      // Safe fallback
    }
  }

  // 2. Internal CRM fallback
  return {
    title: 'Website Concept Review | GetVisible',
    robots: { index: false, follow: false },
  };
}

export default async function LeadDemoPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const rawId = resolvedParams?.leadId;
  const tokenOrId = rawId ? decodeURIComponent(rawId).trim() : '';

  if (!tokenOrId) {
    notFound();
  }

  // 1. Check if token matches an approved public demo in SSR memory
  let initialPublicDemo: WebsiteDemoData | null = null;
  try {
    initialPublicDemo = await WebsiteDemoRepository.getApprovedDemoByPublicToken(tokenOrId);
    if (initialPublicDemo) {
      await WebsiteDemoRepository.recordPublicDemoView(initialPublicDemo.id, initialPublicDemo.organizationId);
    }
  } catch {}

  // 2. Check if user is reviewing an internal lead in active organization
  let initialLead: LeadData | null = null;
  let initialDemos: WebsiteDemoData[] = [];
  const orgId = await getResolvedOrganizationId();
  if (orgId) {
    try {
      initialLead = await LeadRepository.getLeadById(tokenOrId, orgId);
      if (initialLead) {
        initialDemos = await WebsiteDemoRepository.listDemos(orgId, initialLead.id);
      }
    } catch {}
  }

  // Render unified DemoViewWrapper with SSR data or resilient client fallback (avoids serverless 404)
  return (
    <DemoViewWrapper
      tokenOrId={tokenOrId}
      initialPublicDemo={initialPublicDemo}
      initialLead={initialLead}
      initialDemos={initialDemos}
    />
  );
}

