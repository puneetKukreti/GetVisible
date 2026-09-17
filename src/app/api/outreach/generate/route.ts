import { NextRequest, NextResponse } from 'next/server';
import { LeadRepository, WebsiteDemoRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { OutreachGeneratorService } from '@/lib/sales/outreach';

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
    const { leadId, demoId } = body;

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
    const origin = request.nextUrl.origin || '';

    const result = await service.generateOutreach(lead, demo, {
      baseUrl: origin,
      usePublicToken: true,
    });

    const publicUrl = demo?.publicToken
      ? `${origin}/demo/${demo.publicToken}`
      : `${origin}/demo/${lead.id}`;

    return NextResponse.json({
      success: true,
      outreach: result.outreach,
      isAiGenerated: result.isAiGenerated,
      demoUrl: publicUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate outreach';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
