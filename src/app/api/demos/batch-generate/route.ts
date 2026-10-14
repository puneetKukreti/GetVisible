import { NextRequest, NextResponse } from 'next/server';
import { getResolvedOrganizationId } from '@/lib/auth';
import { LeadRepository, WebsiteDemoRepository } from '@/lib/db/repository';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';

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

    const { leads } = await LeadRepository.listLeads(orgId, { pageSize: 500 });

    // Identify leads with NO_WEBSITE that do not yet have an approved demo
    const missingLeads = [];
    for (const lead of leads) {
      if (lead.websiteStatus === 'NO_WEBSITE') {
        const hasApprovedDemo =
          lead.websiteDemos && lead.websiteDemos.some((d) => d.approvalStatus === 'APPROVED');
        if (!hasApprovedDemo) {
          missingLeads.push(lead);
        }
      }
    }

    let generatedCount = 0;
    const CHUNK_SIZE = 10;

    for (let i = 0; i < missingLeads.length; i += CHUNK_SIZE) {
      const chunk = missingLeads.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (lead) => {
          try {
            const demo = await WebsiteDemoGeneratorService.generateDemo(lead, {
              organizationId: orgId,
              version: 1,
            });
            await WebsiteDemoRepository.saveDemo(orgId, demo);
            await WebsiteDemoRepository.approveDemo(orgId, demo.id, '1-Click Batch Generator');
            generatedCount++;
          } catch (err) {
            console.error(`Failed to batch generate demo for lead ${lead.id}:`, err);
          }
        })
      );
    }

    // Refresh lead count with approved demos
    const refreshed = await LeadRepository.listLeads(orgId, { pageSize: 500 });
    const totalReady = refreshed.leads.filter(
      (l) => l.websiteDemos && l.websiteDemos.some((d) => d.approvalStatus === 'APPROVED')
    ).length;

    return NextResponse.json({
      success: true,
      generatedCount,
      totalReady,
      missingProcessed: missingLeads.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Batch demo generation failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
