import { NextRequest, NextResponse } from 'next/server';
import { WebsiteDemoRepository } from '@/lib/db/repository';
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Organization context required' }, { status: 401 });
    }
    const { id } = params;

    const demo = await WebsiteDemoRepository.getDemo(orgId, id);
    if (!demo) {
      return NextResponse.json({ success: false, error: 'Demo not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, demo });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve demo';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Organization context required' }, { status: 401 });
    }
    const { id } = params;

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
