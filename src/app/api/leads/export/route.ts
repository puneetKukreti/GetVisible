import { NextRequest, NextResponse } from 'next/server';
import { getResolvedOrganizationId } from '@/lib/auth';
import { LeadRepository } from '@/lib/db/repository';
import { generateLeadsCsv } from '@/lib/analytics/service';
import { LeadFilterParams, LeadStatus, WebsiteStatus, Channel } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json(
        { error: 'Unauthorized: Organization context required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const params: LeadFilterParams = {
      search: searchParams.get('search') || undefined,
      profession: searchParams.get('profession') || undefined,
      city: searchParams.get('city') || undefined,
      leadStatus: (searchParams.get('status') as LeadStatus) || 'ALL',
      websiteStatus: (searchParams.get('websiteStatus') as WebsiteStatus) || 'ALL',
      source: searchParams.get('source') || undefined,
      channel: (searchParams.get('channel') as Channel | 'ALL') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      page: 1,
      pageSize: 10000, // Export all matching records for the organization
    };

    const result = await LeadRepository.listLeads(orgId, params);
    const csvContent = generateLeadsCsv(result.leads);

    const filename = `getvisible-leads-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to export leads';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
