import { NextRequest, NextResponse } from 'next/server';
import { getResolvedOrganizationId } from '@/lib/auth';
import { requireOwnerSession } from '@/lib/owner-guard';
import { OutreachQueueRepository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const unauthorized = await requireOwnerSession(request);
    if (unauthorized) return unauthorized;

    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id ? decodeURIComponent(resolvedParams.id).trim() : '';
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const scheduledAt = body?.scheduledAt || null;

    const updated = await OutreachQueueRepository.approve(id, orgId, 'Owner', scheduledAt);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Queue item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to approve';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
