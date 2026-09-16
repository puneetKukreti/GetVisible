import { NextRequest, NextResponse } from 'next/server';
import { LeadRepository } from '@/lib/db/repository';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';
import { LeadStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orgId = request.headers.get('x-organization-id') || DEMO_ORGANIZATION_ID;
    const lead = await LeadRepository.getLeadById(params.id, orgId);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found in this organization' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch lead';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orgId = request.headers.get('x-organization-id') || DEMO_ORGANIZATION_ID;
    const body = await request.json();

    if (body.leadStatus) {
      const updated = await LeadRepository.updateLeadStatus(
        params.id,
        body.leadStatus as LeadStatus,
        orgId,
        body.actor || 'Agency User',
        body.reason
      );
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'No valid update parameters supplied' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update lead';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
