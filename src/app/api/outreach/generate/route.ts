import { NextRequest, NextResponse } from 'next/server';
import { LeadRepository, WebsiteDemoRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { requireOwnerSession } from '@/lib/owner-guard';
import { OutreachGeneratorService } from '@/lib/sales/outreach';
import { getAppBaseUrl, getPublicDemoUrl } from '@/lib/demos/public';

export const dynamic = 'force-dynamic';
// Deterministic copy is instant, but the AI-personalized draft path is not.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireOwnerSession(request);
    if (unauthorized) return unauthorized;

    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Organization context required' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { leadId, demoId, channel, intent } = body;

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

    let demo = null;
    if (demoId) {
      demo = await WebsiteDemoRepository.getDemo(orgId, demoId);
    } else if (lead.websiteDemos && lead.websiteDemos.length > 0) {
      demo = lead.websiteDemos[0];
    } else {
      const demos = await WebsiteDemoRepository.listDemos(orgId, leadId);
      demo = demos.length > 0 ? demos[0] : null;
    }

    const service = new OutreachGeneratorService();
    const baseUrl = getAppBaseUrl(request.nextUrl.origin);

    const result = await service.generateOutreach(lead, demo, {
      baseUrl,
      usePublicToken: true,
      channel,
      intent,
    });

    const publicUrl = demo?.publicToken
      ? getPublicDemoUrl(demo.publicToken, baseUrl)
      : `${baseUrl}/demo/${lead.id}`;

    const chosenDraft =
      channel === 'WHATSAPP'
        ? (result.outreach.whatsappMessage || result.outreach.message)
        : result.outreach.message;

    return NextResponse.json({
      success: true,
      draft: chosenDraft,
      subject: result.outreach.subject,
      screenshotUrl: result.outreach.screenshotUrl,
      whatsappMessage: result.outreach.whatsappMessage,
      whatsappShareUrl: result.outreach.whatsappShareUrl,
      whatsappFollowUpWithLink: result.outreach.whatsappFollowUpWithLink,
      whatsappFollowUpShareUrl: result.outreach.whatsappFollowUpShareUrl,
      businessImprovementPitch: result.outreach.businessImprovementPitch,
      interestDetectionHook: result.outreach.interestDetectionHook,
      outreach: result.outreach,
      isAiGenerated: result.isAiGenerated,
      demoUrl: publicUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate outreach';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
