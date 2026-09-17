import { NextRequest, NextResponse } from 'next/server';
import { LeadRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Organization context required' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { leadId, demoVersion, notes, actor, channel } = body;

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'leadId is required' },
        { status: 400 }
      );
    }

    const actorName = actor || 'Sales Specialist';
    const channelText = channel ? ` via ${channel}` : '';
    const reasonText = notes
      ? `Marked as contacted manually${channelText} (v${demoVersion || 1}). Notes: ${notes}`
      : `Marked as contacted manually${channelText} (v${demoVersion || 1}). Outreach message dispatched outside system.`;

    const updated = await LeadRepository.updateLeadStatus(
      leadId,
      'CONTACTED',
      orgId,
      actorName,
      reasonText,
      channel
    );

    if (notes && notes.trim().length > 0) {
      await LeadRepository.addNote(orgId, leadId, notes, actorName);
    }

    return NextResponse.json({
      success: true,
      lead: updated,
      message: 'Marked as contacted manually. Zero automated outreach used.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to record outreach contact';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
