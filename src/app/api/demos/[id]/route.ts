import { NextRequest, NextResponse } from 'next/server';
import { WebsiteDemoRepository, LeadRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { WebsiteContentSchema, WebsiteThemeSchema } from '@/lib/demos/schema';
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
      await WebsiteDemoRepository.recordPublicDemoView(publicDemo.id, publicDemo.organizationId);
      return NextResponse.json(
        { success: true, isPublic: true, demo: publicDemo },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }

    // 2. Internal Authenticated GetVisible Sales Specialist
    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Organization context required' }, { status: 401 });
    }

    // 2a. Check if id is a demoId
    const demo = await WebsiteDemoRepository.getDemo(orgId, id);
    if (demo) {
      return NextResponse.json({ success: true, isPublic: false, demo });
    }

    // 2b. Check if id is a leadId
    const lead = await LeadRepository.getLeadById(id, orgId);
    if (lead) {
      const demos = await WebsiteDemoRepository.listDemos(orgId, lead.id);
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
    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Organization context required' }, { status: 401 });
    }
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id ? decodeURIComponent(resolvedParams.id).trim() : '';

    const body = await request.json();

    if (body.action === 'APPROVE') {
      const result = await WebsiteDemoRepository.approveDemo(
        orgId,
        id,
        body.actor || 'Sales Specialist'
      );
      return NextResponse.json({ success: true, ...result });
    }

    if (body.action === 'REJECT') {
      const result = await WebsiteDemoRepository.rejectDemo(
        orgId,
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

    const existing = await WebsiteDemoRepository.getDemo(orgId, id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Demo not found' }, { status: 404 });
    }

    const updated = await WebsiteDemoRepository.updateDemo(orgId, id, parsed.data, 'user');
    return NextResponse.json({ success: true, demo: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update demo';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
