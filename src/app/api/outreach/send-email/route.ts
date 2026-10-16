import { NextRequest, NextResponse } from 'next/server';
import { getResolvedOrganizationId } from '@/lib/auth';
import { LeadRepository } from '@/lib/db/repository';
import { ProductionEmailProvider, MockEmailProvider, GmailSmtpProvider } from '@/lib/providers/email.provider';
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
    const { leadId, subject, message, screenshotUrl } = body;

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

    // Compliance gate: block suppressed / opted-out / DO_NOT_CONTACT leads
    // before any transmission attempt.
    const eligibility = checkOutreachEligibility(
      lead,
      'EMAIL',
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

    // Guarantee the email body carries a clickable demo link and resolve the
    // screenshot to an absolute URL the provider can embed.
    const origin = request.nextUrl.origin;
    const activeDemo = lead.websiteDemos?.[0];
    const demoUrl = `${origin}/demo/${activeDemo?.publicToken || lead.id}`;

    let emailBody = typeof message === 'string' ? message : '';
    if (!/https?:\/\//.test(emailBody)) {
      emailBody = `${emailBody}\n\nPreview the concept: ${demoUrl}`.trim();
    }

    // Resolve the inline preview image. The personalized screenshot route returns
    // an SVG when no headless browser is available, and email clients cannot render
    // SVG, so prefer the bundled raster template art (matching the prospect's
    // chosen layout) in that case.
    const personalizedRouteUrl = `${origin}/api/demos/${encodeURIComponent(lead.id)}/screenshot`;
    const isPersonalizedRoute = (u: string) =>
      u.startsWith('/api/demos/') || u.startsWith(personalizedRouteUrl);

    let absoluteScreenshot: string;
    if (
      typeof screenshotUrl === 'string' &&
      screenshotUrl.trim().length > 0 &&
      !isPersonalizedRoute(screenshotUrl)
    ) {
      absoluteScreenshot = screenshotUrl.startsWith('http')
        ? screenshotUrl
        : new URL(screenshotUrl, origin).toString();
    } else if (activeDemo?.screenshotUrl) {
      absoluteScreenshot = activeDemo.screenshotUrl.startsWith('http')
        ? activeDemo.screenshotUrl
        : new URL(activeDemo.screenshotUrl, origin).toString();
    } else {
      absoluteScreenshot = `${personalizedRouteUrl}?format=image&name=${encodeURIComponent(
        lead.businessName || ''
      )}&city=${encodeURIComponent(lead.city || '')}&profession=${encodeURIComponent(
        lead.profession || ''
      )}`;
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
      body: emailBody,
      leadId: lead.id,
      organizationId: orgId,
      approvedByHuman: true,
      screenshotUrl: absoluteScreenshot,
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
