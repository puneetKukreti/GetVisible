import { NextRequest, NextResponse } from 'next/server';
import { getResolvedOrganizationId } from '@/lib/auth';
import { requireOwnerSession } from '@/lib/owner-guard';
import { LeadExtractorStorage } from '@/lib/discovery/storage';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateSavedSearchSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  location: z.string().min(1),
  locality: z.string().optional(),
  radius: z.number().optional(),
  limit: z.number().default(25),
  providerId: z.string().default('live-search'),
  fieldsToCollect: z.array(z.string()).default([]),
  exportFormat: z.enum(['XLSX', 'CSV']).default('XLSX'),
});

const UpdateSavedSearchSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  lastRunAt: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const unauthorized = await requireOwnerSession(request);
    if (unauthorized) return unauthorized;

    const orgId = (await getResolvedOrganizationId(request)) || 'demo-org-getvisible';
    const searches = LeadExtractorStorage.listSavedSearches(orgId);
    return NextResponse.json(searches);
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to list saved searches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireOwnerSession(request);
    if (unauthorized) return unauthorized;

    const orgId = (await getResolvedOrganizationId(request)) || 'demo-org-getvisible';
    const body = await request.json();
    const validated = CreateSavedSearchSchema.parse(body);

    const saved = LeadExtractorStorage.createSavedSearch(orgId, validated);
    return NextResponse.json(saved, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save search configuration' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const unauthorized = await requireOwnerSession(request);
    if (unauthorized) return unauthorized;

    const orgId = (await getResolvedOrganizationId(request)) || 'demo-org-getvisible';
    const body = await request.json();
    const validated = UpdateSavedSearchSchema.parse(body);

    const updated = LeadExtractorStorage.updateSavedSearch(orgId, validated.id, {
      name: validated.name,
      lastRunAt: validated.lastRunAt,
    });
    if (!updated) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to update saved search' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const unauthorized = await requireOwnerSession(request);
    if (unauthorized) return unauthorized;

    const orgId = (await getResolvedOrganizationId(request)) || 'demo-org-getvisible';
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id query parameter' }, { status: 400 });
    }

    const success = LeadExtractorStorage.deleteSavedSearch(orgId, id);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to delete saved search' }, { status: 500 });
  }
}
