import { NextRequest, NextResponse } from 'next/server';
import { LeadRepository, WebsiteDemoRepository } from '@/lib/db/repository';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import { getResolvedOrganizationId } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const GenerateDemoRequestSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  templateId: z.string().optional(),
  themeId: z.string().optional(),
  useAiEnrichment: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Organization context required' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId') || undefined;

    const demos = await WebsiteDemoRepository.listDemos(orgId, leadId);
    return NextResponse.json({ success: true, demos });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve website demos';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Organization context required' }, { status: 401 });
    }
    const body = await request.json();


    const parsed = GenerateDemoRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { leadId, templateId, themeId, useAiEnrichment } = parsed.data;

    // Fetch lead with organization isolation
    const lead = await LeadRepository.getLeadById(leadId, orgId);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: `Lead not found for ID: ${leadId}` },
        { status: 404 }
      );
    }

    // Check eligibility
    const eligibility = WebsiteDemoGeneratorService.canGenerateDemo(lead);
    if (!eligibility.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: eligibility.reason || 'Lead is not eligible for website demo generation',
          leadStatus: lead.leadStatus,
          websiteStatus: lead.websiteStatus,
        },
        { status: 400 }
      );
    }

    // Calculate non-destructive version number
    const existingDemos = await WebsiteDemoRepository.listDemos(orgId, leadId);
    const nextVersion = existingDemos.length + 1;

    // Generate demo
    const demo = await WebsiteDemoGeneratorService.generateDemo(lead, {
      templateId,
      themeId,
      organizationId: orgId,
      version: nextVersion,
      useAiEnrichment,
    });

    // Save to repository
    const savedDemo = await WebsiteDemoRepository.saveDemo(orgId, demo, 'system');

    // Update lead status to DEMO_GENERATED if currently NEW or QUALIFIED
    if (lead.leadStatus === 'NEW' || lead.leadStatus === 'QUALIFIED' || lead.leadStatus === 'RESEARCHING') {
      await LeadRepository.updateLeadStatus(
        leadId,
        'DEMO_GENERATED',
        orgId,
        'System generated website demonstration concept (v' + nextVersion + ')'
      );
    }

    return NextResponse.json({ success: true, demo: savedDemo }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Demo generation failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
