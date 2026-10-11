import { NextRequest, NextResponse } from 'next/server';
import { getResolvedOrganizationId } from '@/lib/auth';
import { LeadExtractorStorage } from '@/lib/discovery/storage';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateExportHistorySchema = z.object({
  fileName: z.string().min(1),
  format: z.enum(['XLSX', 'CSV']),
  rowCount: z.number().default(0),
  searchKeyword: z.string().default(''),
  searchLocation: z.string().default(''),
  providerUsed: z.string().default(''),
});

export async function GET(request: NextRequest) {
  try {
    const orgId = (await getResolvedOrganizationId(request)) || 'demo-org-getvisible';
    const history = LeadExtractorStorage.listExportHistory(orgId);
    return NextResponse.json(history);
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to list export history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = (await getResolvedOrganizationId(request)) || 'demo-org-getvisible';
    const body = await request.json();
    const validated = CreateExportHistorySchema.parse(body);

    const record = LeadExtractorStorage.recordExport(orgId, validated);
    return NextResponse.json(record, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to record export history' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const orgId = (await getResolvedOrganizationId(request)) || 'demo-org-getvisible';
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id query parameter' }, { status: 400 });
    }

    const success = LeadExtractorStorage.deleteExportHistory(orgId, id);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to delete export record' }, { status: 500 });
  }
}
