import { NextRequest, NextResponse } from 'next/server';
import { WebsiteDemoRepository, LeadRepository } from '@/lib/db/repository';
import { DEMO_ORGANIZATION_ID, PILOT_ORGANIZATION_ID } from '@/lib/workspace';

export const dynamic = 'force-dynamic';

interface RouteProps {
  params: { id: string } | Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteProps
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const rawId = resolvedParams?.id ? decodeURIComponent(resolvedParams.id).trim() : '';

    if (!rawId) {
      return NextResponse.json({ success: false, error: 'ID parameter required' }, { status: 400 });
    }

    // 1. Resolve demo & lead (by publicToken, demoId, or leadId across workspaces)
    let demo = await WebsiteDemoRepository.getApprovedDemoByPublicToken(rawId);
    let targetOrg = demo?.organizationId || PILOT_ORGANIZATION_ID;
    let leadId = demo?.leadId;

    if (!demo) {
      demo =
        (await WebsiteDemoRepository.getDemo(PILOT_ORGANIZATION_ID, rawId)) ||
        (await WebsiteDemoRepository.getDemo(DEMO_ORGANIZATION_ID, rawId));
      if (demo) {
        targetOrg = demo.organizationId;
        leadId = demo.leadId;
      }
    }

    let lead = null;
    if (leadId) {
      lead =
        (await LeadRepository.getLeadById(leadId, targetOrg)) ||
        (await LeadRepository.getLeadById(leadId, DEMO_ORGANIZATION_ID)) ||
        (await LeadRepository.getLeadById(leadId, PILOT_ORGANIZATION_ID));
    } else {
      lead =
        (await LeadRepository.getLeadById(rawId, PILOT_ORGANIZATION_ID)) ||
        (await LeadRepository.getLeadById(rawId, DEMO_ORGANIZATION_ID));
      if (lead) {
        targetOrg = lead.organizationId;
        leadId = lead.id;
        const demos = await WebsiteDemoRepository.listDemos(targetOrg, lead.id);
        demo = demos[0] || null;
      }
    }

    if (!lead || !leadId) {
      return NextResponse.json(
        { success: false, error: 'Lead or demo concept not found' },
        { status: 404 }
      );
    }

    // 2. Parse submitted change request options
    const body = await request.json().catch(() => ({}));
    const { changes = [], callTime, phone, notes } = body;

    const changeList: string[] = Array.isArray(changes) && changes.length > 0 ? changes : ['General styling adjustments'];
    const callText = callTime ? ` | Call time preference: ${callTime}` : '';
    const phoneText = phone ? ` | Contact phone: ${phone}` : '';
    const notesText = notes ? ` | Notes: ${notes}` : '';
    const summary = `Prospect requested free changes from live website concept: ${changeList.join(', ')}${callText}${phoneText}${notesText}`;

    // 3. Automatically advance lead status to INTERESTED in CRM
    const updatedLead = await LeadRepository.updateLeadStatus(
      leadId,
      'INTERESTED',
      targetOrg,
      'Prospect (Public Demo)',
      summary,
      'WHATSAPP'
    );

    // 4. Record detailed prospect interaction activity
    await LeadRepository.addActivity(targetOrg, leadId, {
      type: 'PROSPECT_REQUESTED_CHANGES',
      title: 'Prospect Requested Free Changes (Interest Confirmed)',
      description: summary,
      metadata: {
        changes: changeList,
        callTime: callTime || null,
        phone: phone || null,
        notes: notes || null,
        demoId: demo?.id || null,
        publicToken: demo?.publicToken || null,
        submittedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Your change request has been recorded. Our design team will review the adjustments and reach out to you shortly.',
      leadId,
      status: updatedLead.leadStatus,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to record change request';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
