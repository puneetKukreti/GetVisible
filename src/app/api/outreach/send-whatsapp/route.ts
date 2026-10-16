import { NextRequest, NextResponse } from 'next/server';
import { getResolvedOrganizationId } from '@/lib/auth';
import { LeadRepository } from '@/lib/db/repository';
import { createAuditLogEntry } from '@/lib/audit';
import { checkOutreachEligibility } from '@/lib/compliance';

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
    const { leadId, phone, message, screenshotUrl, notes } = body;

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'leadId is required' },
        { status: 400 }
      );
    }

    const lead = await LeadRepository.getLeadById(leadId, orgId);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found in this organization' },
        { status: 404 }
      );
    }

    // Compliance gate: block suppressed / opted-out / DO_NOT_CONTACT leads
    // before any outreach staging or dispatch.
    const eligibility = checkOutreachEligibility(
      lead,
      'WHATSAPP',
      true,
      lead.suppressionRecords || [],
      lead.consentRecords || []
    );

    if (!eligibility.allowed) {
      return NextResponse.json(
        { success: false, error: eligibility.reason || 'Outreach blocked by compliance rules' },
        { status: 403 }
      );
    }

    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiToken = process.env.WHATSAPP_API_TOKEN;

    // Optional automated API dispatch if environment webhook is configured
    if (apiUrl && apiToken) {
      try {
        const dispatchRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: phone || lead.publicPhone,
            imageUrl: screenshotUrl || lead.websiteDemos?.[0]?.screenshotUrl || null,
            caption: message,
          }),
        });

        if (!dispatchRes.ok) {
          const errText = await dispatchRes.text().catch(() => '');
          throw new Error(`WhatsApp API error (${dispatchRes.status}): ${errText}`);
        }

        // Mark as contacted
        await LeadRepository.updateLeadStatus(
          leadId,
          'CONTACTED',
          orgId,
          'Solo Agency Operator (WhatsApp API)',
          notes || 'Dispatched via WhatsApp API Webhook',
          'WHATSAPP'
        );

        createAuditLogEntry({
          action: 'OUTREACH_APPROVED',
          entity: 'Lead',
          entityId: leadId,
          actor: 'WhatsApp API',
          organizationId: orgId,
          details: { channel: 'WHATSAPP', mode: 'API_DISPATCHED' },
        });

        return NextResponse.json({
          success: true,
          mode: 'API_DISPATCHED',
          message: 'WhatsApp card dispatched successfully via configured API gateway.',
        });
      } catch (apiErr: unknown) {
        console.warn('WhatsApp API webhook failed, falling back to Web-Assisted flow:', apiErr);
      }
    }

    // Default Solo Operator Mode: WEB_ASSISTED (uses browser clipboard image copy + WhatsApp Web deep link)
    // Mark lead as contacted
    await LeadRepository.updateLeadStatus(
      leadId,
      'CONTACTED',
      orgId,
      'Solo Agency Operator',
      notes || 'Dispatched via 1-Click Blitz WhatsApp (Clipboard Image + WhatsApp Web)',
      'WHATSAPP'
    );

    createAuditLogEntry({
      action: 'OUTREACH_APPROVED',
      entity: 'Lead',
      entityId: leadId,
      actor: 'Solo Agency Operator',
      organizationId: orgId,
      details: { channel: 'WHATSAPP', mode: 'WEB_ASSISTED' },
    });

    return NextResponse.json({
      success: true,
      mode: 'WEB_ASSISTED',
      message: 'Lead staged for WhatsApp Web assisted dispatch.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process WhatsApp outreach';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
