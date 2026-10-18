import { NextRequest, NextResponse } from 'next/server';
import { WebsiteDemoRepository, LeadRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { requireOwnerSession } from '@/lib/owner-guard';
import { DEMO_ORGANIZATION_ID, PILOT_ORGANIZATION_ID } from '@/lib/workspace';
import { WebsiteContentSchema, WebsiteThemeSchema } from '@/lib/demos/schema';
import { isRealHumanVisit } from '@/lib/demos/public';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const UpdateDemoRequestSchema = z.object({
  content: WebsiteContentSchema.optional(),
  theme: WebsiteThemeSchema.optional(),
  generationStatus: z.enum(['QUEUED', 'GENERATING', 'COMPLETED', 'FAILED']).optional(),
  error: z.string().nullable().optional(),
});

interface RouteProps {
  params: { id: string } | Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteProps
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id ? decodeURIComponent(resolvedParams.id).trim() : '';

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID parameter required' }, { status: 400 });
    }

    // 1. Prospect-Facing: Check if id matches an approved public demo token
    const publicDemo = await WebsiteDemoRepository.getApprovedDemoByPublicToken(id);
    if (publicDemo) {
      if (isRealHumanVisit(request.headers, request.nextUrl.searchParams)) {
        await WebsiteDemoRepository.recordPublicDemoView(publicDemo.id, publicDemo.organizationId);
      }
      return NextResponse.json(
        { success: true, isPublic: true, demo: publicDemo },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }

    // 2. Internal GetVisible sales-specialist branches require an owner session.
    //    Fail with the same 404 the public path would produce so an unauthenticated
    //    caller cannot probe which ids exist.
    const unauthorized = await requireOwnerSession(request);
    if (unauthorized) {
      return NextResponse.json(
        { success: false, error: 'Demo concept or lead not found' },
        { status: 404 }
      );
    }

    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Organization context required' }, { status: 401 });
    }
    const altOrgId = orgId === DEMO_ORGANIZATION_ID ? PILOT_ORGANIZATION_ID : DEMO_ORGANIZATION_ID;

    // 2a. Check if id is a demoId
    let demo = await WebsiteDemoRepository.getDemo(orgId, id);
    let demoOrg = orgId;
    if (!demo) {
      demo = await WebsiteDemoRepository.getDemo(altOrgId, id);
      if (demo) demoOrg = altOrgId;
    }
    if (demo) {
      const targetOrg = demo.organizationId || demoOrg;
      const lead =
        (await LeadRepository.getLeadById(demo.leadId, targetOrg)) ||
        (await LeadRepository.getLeadById(demo.leadId, altOrgId)) ||
        (await LeadRepository.getLeadById(demo.leadId, orgId));
      let demos = await WebsiteDemoRepository.listDemos(targetOrg, demo.leadId);
      if (demos.length === 0 && targetOrg !== altOrgId) {
        const altDemos = await WebsiteDemoRepository.listDemos(altOrgId, demo.leadId);
        if (altDemos.length > 0) demos = altDemos;
      }
      return NextResponse.json({
        success: true,
        isPublic: false,
        demo,
        lead: lead || undefined,
        demos: demos.length > 0 ? demos : [demo],
      });
    }

    // 2b. Check if id is a leadId
    let lead = await LeadRepository.getLeadById(id, orgId);
    let leadOrg = orgId;
    if (!lead) {
      lead = await LeadRepository.getLeadById(id, altOrgId);
      if (lead) leadOrg = altOrgId;
    }
    if (lead) {
      const targetOrg = lead.organizationId || leadOrg;
      let demos = await WebsiteDemoRepository.listDemos(targetOrg, lead.id);
      if (demos.length === 0 && targetOrg !== altOrgId) {
        const altDemos = await WebsiteDemoRepository.listDemos(altOrgId, lead.id);
        if (altDemos.length > 0) demos = altDemos;
      }
      return NextResponse.json({
        success: true,
        isPublic: false,
        lead,
        demos,
        demo: demos[0] || null,
      });
    }

    return NextResponse.json({ success: false, error: 'Demo concept or lead not found' }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve demo';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteProps
) {
  try {
    const unauthorized = await requireOwnerSession(request);
    if (unauthorized) return unauthorized;

    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Organization context required' }, { status: 401 });
    }
    const altOrgId = orgId === DEMO_ORGANIZATION_ID ? PILOT_ORGANIZATION_ID : DEMO_ORGANIZATION_ID;
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id ? decodeURIComponent(resolvedParams.id).trim() : '';

    let targetOrg = orgId;
    let existing = await WebsiteDemoRepository.getDemo(orgId, id);
    if (!existing) {
      existing = await WebsiteDemoRepository.getDemo(altOrgId, id);
      if (existing) targetOrg = altOrgId;
    }

    const body = await request.json();

    if (body.action === 'APPROVE') {
      const result = await WebsiteDemoRepository.approveDemo(
        targetOrg,
        id,
        body.actor || 'Sales Specialist'
      );
      return NextResponse.json({ success: true, ...result });
    }

    if (body.action === 'REJECT') {
      const result = await WebsiteDemoRepository.rejectDemo(
        targetOrg,
        id,
        body.reason || 'Design not suitable',
        body.actor || 'Sales Specialist'
      );
      return NextResponse.json({ success: true, ...result });
    }

    const parsed = UpdateDemoRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Demo not found' }, { status: 404 });
    }

    const updated = await WebsiteDemoRepository.updateDemo(targetOrg, id, parsed.data, 'user');
    return NextResponse.json({ success: true, demo: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update demo';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    const unauthorized = await requireOwnerSession(request);
    if (unauthorized) return unauthorized;

    const orgId = (await getResolvedOrganizationId(request)) || DEMO_ORGANIZATION_ID;
    const altOrgId = orgId === DEMO_ORGANIZATION_ID ? PILOT_ORGANIZATION_ID : DEMO_ORGANIZATION_ID;
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id ? decodeURIComponent(resolvedParams.id).trim() : '';
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    // Deletions are organization-scoped, so attempt both workspaces the single
    // operator may own (the id may be a demoId, a leadId or a public token).
    const deletedDemo = await WebsiteDemoRepository.deleteDemo(orgId, id);
    const deletedAltDemo = deletedDemo ? false : await WebsiteDemoRepository.deleteDemo(altOrgId, id);
    await WebsiteDemoRepository.deleteDemosForLead(orgId, id);
    await WebsiteDemoRepository.deleteDemosForLead(altOrgId, id);
    if (!deletedDemo && !deletedAltDemo) {
      return NextResponse.json({ success: false, error: 'Demo not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Demo deleted and public link revoked' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete demo';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
