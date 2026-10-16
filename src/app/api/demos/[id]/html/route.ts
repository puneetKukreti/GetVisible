import { NextRequest, NextResponse } from 'next/server';
import { WebsiteDemoRepository, LeadRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { DEMO_ORGANIZATION_ID, PILOT_ORGANIZATION_ID } from '@/lib/workspace';
import { getStitchRawHtml } from '@/lib/demos/stitch-loader.server';
import { personalizeStitchHtml, isStitchLayout } from '@/lib/demos/stitch-personalizer';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import { isCaPracticeProfession, contentHasCaLeakageForProfession } from '@/lib/demos/profession-sections';
import { WebsiteContent } from '@/types';

export const dynamic = 'force-dynamic';

interface RouteProps {
  params: { id: string } | Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id ? decodeURIComponent(resolvedParams.id).trim() : '';

    if (!id) {
      return new NextResponse('Demo or Lead ID parameter required', { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const layoutOverride = searchParams.get('layout') || undefined;

    // 1. Try public token lookup first
    let demo = await WebsiteDemoRepository.getApprovedDemoByPublicToken(id);
    let lead: any = null;

    // 2. If not a public token, resolve organization and look up demo or lead
    if (!demo) {
      const orgId = (await getResolvedOrganizationId(request)) || DEMO_ORGANIZATION_ID;
      const altOrgId = orgId === DEMO_ORGANIZATION_ID ? PILOT_ORGANIZATION_ID : DEMO_ORGANIZATION_ID;

      // Check if id is a demo ID
      demo = await WebsiteDemoRepository.getDemo(orgId, id);
      if (!demo) {
        demo = await WebsiteDemoRepository.getDemo(altOrgId, id);
      }

      // Check if id is a lead ID
      if (!demo) {
        lead = await LeadRepository.getLeadById(id, orgId);
        if (!lead) {
          lead = await LeadRepository.getLeadById(id, altOrgId);
        }

        if (lead) {
          const demos = await WebsiteDemoRepository.listDemos(lead.organizationId || orgId, lead.id);
          demo = demos[0] || null;
        }
      } else {
        lead = await LeadRepository.getLeadById(demo.leadId, demo.organizationId || orgId);
        if (!lead) {
          lead = await LeadRepository.getLeadById(demo.leadId, altOrgId);
        }
      }
    } else if (demo?.leadId) {
      lead = await LeadRepository.getLeadById(demo.leadId, demo.organizationId || DEMO_ORGANIZATION_ID);
      if (!lead) {
        lead = await LeadRepository.getLeadById(demo.leadId, PILOT_ORGANIZATION_ID);
      }
    }

    // Auto-regenerate if a non-CA lead has stale CA content or a missing demo
    const effectiveOrgId = lead?.organizationId || demo?.organizationId || DEMO_ORGANIZATION_ID;
    const isCaPractice = isCaPracticeProfession(lead?.profession, lead?.businessName);

    if (lead && !isCaPractice) {
      const hasStaleCaContent =
        !demo ||
        contentHasCaLeakageForProfession(demo.content, lead.profession, lead.businessName);

      if (hasStaleCaContent) {
        try {
          const freshDemo = await WebsiteDemoGeneratorService.generateDemo(lead, {
            useAiEnrichment: true,
            organizationId: effectiveOrgId,
          });
          demo = await WebsiteDemoRepository.saveDemo(effectiveOrgId, freshDemo, 'system');
        } catch (genErr) {
          console.warn('Auto-regeneration of non-CA demo failed:', genErr);
        }
      }
    }

    // Prepare content object for personalization
    let content: WebsiteContent | any = null;

    if (demo?.content) {
      content = typeof demo.content === 'string' ? JSON.parse(demo.content) : demo.content;
    } else if (lead) {
      content = {
        brand: { businessName: lead.businessName },
        location: { city: lead.city, address: lead.address },
        contact: { publicPhone: lead.publicPhone, publicEmail: lead.publicEmail },
        meta: { profession: lead.profession },
      };
    } else {
      // Neutral fallback preview (used only when neither a demo nor a lead can be resolved)
      content = {
        brand: { businessName: 'Your Business' },
        location: { city: 'Your City', address: 'Your City, India' },
        contact: { publicPhone: '+91 00000 00000', publicEmail: 'hello@example.com' },
        meta: { profession: 'Business' },
      };
    }

    // Determine layout key
    const chosenLayout =
      layoutOverride ||
      demo?.design?.layout ||
      content?.design?.layout ||
      demo?.templateId ||
      'design-1-premium';

    // Get Stitch HTML template and personalize
    const rawHtml = getStitchRawHtml(chosenLayout);
    const personalizedHtml = personalizeStitchHtml(rawHtml, content);

    return new NextResponse(personalizedHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error rendering demo HTML';
    return new NextResponse(`<html><body><h1>Error Rendering Demo</h1><p>${message}</p></body></html>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
