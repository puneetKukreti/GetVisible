import { NextRequest, NextResponse } from 'next/server';
import { getResolvedOrganizationId } from '@/lib/auth';
import { LeadRepository } from '@/lib/db/repository';
import { ProductionEmailProvider, MockEmailProvider, GmailSmtpProvider } from '@/lib/providers/email.provider';

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
    const { leadId, subject, message } = body;

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

    if (!lead.publicEmail) {
      return NextResponse.json(
        { success: false, error: 'Lead does not have an email address listed' },
        { status: 400 }
      );
    }

    // Prioritize Gmail SMTP (sends from authentic govisibleonweb@gmail.com to ANY recipient)
    const gmailProvider = new GmailSmtpProvider();
    const resendProvider = new ProductionEmailProvider();
    const emailProvider = gmailProvider.isConfigured()
      ? gmailProvider
      : resendProvider.isConfigured()
      ? resendProvider
      : new MockEmailProvider();

    const sendResult = await emailProvider.sendOutreachEmail({
      to: lead.publicEmail,
      subject: subject || `Website Concept Prepared for ${lead.businessName}`,
      body: message,
      leadId: lead.id,
      organizationId: orgId,
      approvedByHuman: true,
    });

    if (!sendResult.success) {
      return NextResponse.json(
        { success: false, error: sendResult.error || 'Failed to dispatch email' },
        { status: 400 }
      );
    }

    // Automatically transition lead status to CONTACTED
    await LeadRepository.updateLeadStatus(
      leadId,
      'CONTACTED',
      orgId,
      'Campaign Outreach Specialist',
      `Sent concept email with embedded demo preview snapshot to ${lead.publicEmail}`,
      'EMAIL'
    );

    return NextResponse.json({
      success: true,
      messageId: sendResult.data?.messageId,
      message: `Email successfully dispatched to ${lead.publicEmail}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send outreach email';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
