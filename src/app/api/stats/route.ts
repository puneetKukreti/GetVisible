import { NextRequest, NextResponse } from 'next/server';
import { LeadRepository } from '@/lib/db/repository';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-organization-id') || DEMO_ORGANIZATION_ID;
    const metrics = await LeadRepository.getDashboardMetrics(orgId);
    return NextResponse.json(metrics);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dashboard metrics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
