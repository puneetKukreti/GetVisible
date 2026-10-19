import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { LeadRepository, WebsiteDemoRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { DEMO_ORGANIZATION_ID, PILOT_ORGANIZATION_ID } from '@/lib/workspace';
import { isRealHumanVisit, generatePublicDemoToken } from '@/lib/demos/public';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import { getProfessionPreset } from '@/lib/demos/profession-config';
import { selectWebsiteDesign } from '@/lib/demos/personalization';
import { OWNER_AUTH_COOKIE, verifyOwnerSessionToken } from '@/lib/session';
import { DemoViewWrapper } from './demo-view-wrapper';
import { WebsiteDemoData, LeadData } from '@/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    leadId: string;
  } | Promise<{ leadId: string }>;
  searchParams?: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>;
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
        const brandName = publicDemo.content?.brand?.businessName || 'Local Business';
        const profession = publicDemo.content?.meta?.profession || 'Business';
        const title =
          publicDemo.content?.meta?.title ||
          `${brandName} | ${profession}`;
        const description =
          publicDemo.content?.meta?.description ||
          publicDemo.content?.brand?.tagline ||
          `Personalised website concept for ${brandName}.`;

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

export default async function LeadDemoPage({ params, searchParams }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const rawId = resolvedParams?.leadId;
  const tokenOrId = rawId ? decodeURIComponent(rawId).trim() : '';

  if (!tokenOrId) {
    notFound();
  }

  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined;
  const headersList = headers();

  const orgId = (await getResolvedOrganizationId()) || PILOT_ORGANIZATION_ID;
  const altOrgId = orgId === DEMO_ORGANIZATION_ID ? PILOT_ORGANIZATION_ID : DEMO_ORGANIZATION_ID;

  // 1. Check if token matches an approved public demo in SSR memory
  let initialPublicDemo: WebsiteDemoData | null = null;
  try {
    initialPublicDemo = await WebsiteDemoRepository.getApprovedDemoByPublicToken(tokenOrId);
    if (initialPublicDemo) {
      if (isRealHumanVisit(headersList, resolvedSearchParams)) {
        await WebsiteDemoRepository.recordPublicDemoView(initialPublicDemo.id, initialPublicDemo.organizationId);
      }
    }
  } catch {}

  // 1b. Render the personalized site NOW, on the server, so the prospect's first
  // paint IS the website — the iframe embeds this HTML via srcDoc and no
  // loading screen is ever shown. If rendering fails (cold route, self-fetch
  // hiccup), fall back to the previous client-side iframe load.
  let initialHtml: string | null = null;
  if (initialPublicDemo) {
    try {
      const host =
        headersList.get('x-forwarded-host') ||
        headersList.get('host') ||
        'localhost:3000';
      const proto =
        headersList.get('x-forwarded-proto') ||
        (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
      const htmlUrl = `${proto}://${host}/api/demos/${encodeURIComponent(
        initialPublicDemo.publicToken || tokenOrId
      )}/html`;
      const res = await fetch(htmlUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok && (res.headers.get('content-type') || '').includes('text/html')) {
        initialHtml = await res.text();
      }
    } catch {
      // Client-side iframe fallback still works.
    }
  }

  // 2. Check if user is reviewing an internal lead in active organization or fallback org
  //
  // SECURITY: the internal branch renders the prospect CRM editor (lead data,
  // regeneration controls). It is only reachable with a valid owner session; an
  // anonymous visitor hitting /demo/<leadId> gets the same "not found" state as a
  // bogus token instead of internal pipeline data.
  const isOwner = await verifyOwnerSessionToken(cookies().get(OWNER_AUTH_COOKIE)?.value);

  let initialLead: LeadData | null = null;
  let initialDemos: WebsiteDemoData[] = [];
  if (isOwner) try {
    initialLead = await LeadRepository.getLeadById(tokenOrId, orgId);
    if (!initialLead) {
      initialLead = await LeadRepository.getLeadById(tokenOrId, altOrgId);
    }
    if (initialLead) {
      const targetOrg = initialLead.organizationId || orgId;
      initialDemos = await WebsiteDemoRepository.listDemos(targetOrg, initialLead.id);
      if (initialDemos.length === 0 && targetOrg !== altOrgId) {
        const altDemos = await WebsiteDemoRepository.listDemos(altOrgId, initialLead.id);
        if (altDemos.length > 0) initialDemos = altDemos;
      }

      // If lead exists but demo hasn't been generated yet, generate one on-the-fly
      if (initialDemos.length === 0) {
        try {
          const generated = await WebsiteDemoGeneratorService.generateDemo(initialLead, {
            organizationId: targetOrg,
            version: 1,
          });
          generated.id = `demo-${initialLead.id}-v1`;
          generated.publicToken = generatePublicDemoToken(initialLead.businessName);
          generated.approvalStatus = 'APPROVED';
          const saved = await WebsiteDemoRepository.saveDemo(targetOrg, generated, 'system');
          if (saved) {
            initialDemos = [saved];
            initialPublicDemo = saved;
          }
        } catch {
          // Profession-aware minimal fallback (never CA-biased)
          try {
            const preset = getProfessionPreset(initialLead.profession, initialLead.businessName);
            const design = selectWebsiteDesign(
              {
                id: initialLead.id,
                businessName: initialLead.businessName,
                city: initialLead.city,
                profession: initialLead.profession,
              },
              1
            );
            const newDemo: WebsiteDemoData = {
              id: `demo-${initialLead.id}-v1`,
              leadId: initialLead.id,
              organizationId: targetOrg,
              templateId: design.layout,
              version: 1,
              generationStatus: 'COMPLETED',
              approvalStatus: 'APPROVED',
              publicToken: generatePublicDemoToken(initialLead.businessName),
              viewCount: 0,
              theme: preset.defaultTheme,
              content: {
                brand: { businessName: initialLead.businessName },
                location: { city: initialLead.city, address: initialLead.address },
                contact: { publicPhone: initialLead.publicPhone, publicEmail: initialLead.publicEmail },
                meta: { profession: initialLead.profession },
              } as any,
              design,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            const saved = await WebsiteDemoRepository.saveDemo(targetOrg, newDemo, 'system');
            if (saved) {
              initialDemos = [saved];
              initialPublicDemo = saved;
            }
          } catch {}
        }
      }
    }
  } catch {}

  // 3. If tokenOrId was a demo ID instead of lead ID, resolve the demo and lead
  if (isOwner && !initialLead && !initialPublicDemo) {
    try {
      let demo = await WebsiteDemoRepository.getDemo(orgId, tokenOrId);
      if (!demo) {
        demo = await WebsiteDemoRepository.getDemo(altOrgId, tokenOrId);
      }
      if (demo) {
        const demoOrg = demo.organizationId || orgId;
        initialLead =
          (await LeadRepository.getLeadById(demo.leadId, demoOrg)) ||
          (await LeadRepository.getLeadById(demo.leadId, altOrgId)) ||
          (await LeadRepository.getLeadById(demo.leadId, orgId));
        const demos = await WebsiteDemoRepository.listDemos(initialLead?.organizationId || demoOrg, demo.leadId);
        initialDemos = demos.length > 0 ? demos : [demo];
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
      initialHtml={initialHtml}
    />
  );
}

