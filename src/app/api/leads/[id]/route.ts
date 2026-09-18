import { NextRequest, NextResponse } from 'next/server';
import { LeadRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { LeadStatus } from '@/types';

export const dynamic = 'force-dynamic';

interface RouteProps {
  params: { id: string } | Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteProps
) {
  try {
    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: Organization context required' }, { status: 401 });
    }
    const resolvedParams = await Promise.resolve(params);
    const rawId = resolvedParams?.id;
    const leadId = rawId ? decodeURIComponent(rawId).trim() : '';

    const lead = await LeadRepository.getLeadById(leadId, orgId);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found in this organization' }, { status: 404 });
    }

    return NextResponse.json(lead, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch lead';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteProps
) {
  try {
    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: Organization context required' }, { status: 401 });
    }
    const resolvedParams = await Promise.resolve(params);
    const rawId = resolvedParams?.id;
    const leadId = rawId ? decodeURIComponent(rawId).trim() : '';
    const body = await request.json();

    let updatedLead = null;

    if (body.note) {
      await LeadRepository.addNote(
        orgId,
        leadId,
        body.note,
        body.actor || 'Sales Rep'
      );
    }

    if (body.leadStatus) {
      updatedLead = await LeadRepository.updateLeadStatus(
        leadId,
        body.leadStatus as LeadStatus,
        orgId,
        body.actor || 'Agency User',
        body.reason
      );
    } else {
      updatedLead = await LeadRepository.getLeadById(leadId, orgId);
    }

    if (updatedLead) {
      return NextResponse.json(updatedLead);
    }

    return NextResponse.json({ error: 'No valid update parameters supplied' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update lead';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
