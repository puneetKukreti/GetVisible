import { NextRequest, NextResponse } from 'next/server';
import { LeadRepository, WebsiteDemoRepository, OutreachQueueRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { requireOwnerSession } from '@/lib/owner-guard';
import { OutreachGeneratorService } from '@/lib/sales/outreach';
import { getAppBaseUrl } from '@/lib/demos/public';
import { checkOutreachEligibility } from '@/lib/compliance';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const unauthorized = await requireOwnerSession(request);
    if (unauthorized) return unauthorized;

    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const statuses = statusParam ? statusParam.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10) || 200, 500);

    const items = await OutreachQueueRepository.list(orgId, {
      status: statuses as any,
      limit,
    });

    return NextResponse.json({ success: true, items, total: items.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list queue';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireOwnerSession(request);
    if (unauthorized) return unauthorized;

    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const leadIds: string[] = Array.isArray(body.leadIds) ? body.leadIds : body.leadId ? [body.leadId] : [];
    const mode: 'MANUAL' | 'AUTO' = body.mode === 'AUTO' ? 'AUTO' : 'MANUAL';
    const channel = body.channel || 'WHATSAPP';
    const scheduledAt = body.scheduledAt || null;
    const baseUrl = getAppBaseUrl(request.nextUrl.origin);

    if (leadIds.length === 0) {
      return NextResponse.json({ success: false, error: 'leadIds is required' }, { status: 400 });
    }

    const service = new OutreachGeneratorService();
    const enqueued: any[] = [];
    const skipped: { leadId: string; reason: string }[] = [];

    for (const leadId of leadIds) {
      const lead = await LeadRepository.getLeadById(leadId, orgId);
      if (!lead) {
        skipped.push({ leadId, reason: 'Lead not found' });
        continue;
      }

      const eligibility = checkOutreachEligibility(
        lead,
        channel,
        true,
        lead.suppressionRecords || [],
        lead.consentRecords || []
      );
      if (!eligibility.allowed) {
        skipped.push({ leadId, reason: eligibility.reason || 'Blocked by compliance' });
        continue;
      }

      let demo = null;
      if (lead.websiteDemos && lead.websiteDemos.length > 0) {
        demo = lead.websiteDemos[0];
      } else {
        const demos = await WebsiteDemoRepository.listDemos(orgId, leadId);
        demo = demos.length > 0 ? demos[0] : null;
      }

      let result;
      try {
        result = await service.generateOutreach(lead, demo, { baseUrl, usePublicToken: true, channel });
      } catch (err: unknown) {
        skipped.push({ leadId, reason: err instanceof Error ? err.message : 'Generation failed' });
        continue;
      }

      const item = await OutreachQueueRepository.enqueue(orgId, {
        leadId,
        demoId: demo?.id || null,
        channel,
        mode,
        message: result.outreach.whatsappMessage || result.outreach.message,
        screenshotUrl: result.outreach.screenshotUrl || null,
        scheduledAt,
        createdBy: 'Owner',
      });

      enqueued.push(item);
    }

    return NextResponse.json({
      success: true,
      enqueued: enqueued.length,
      skipped: skipped.length,
      items: enqueued,
      skippedDetails: skipped,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to enqueue outreach';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
