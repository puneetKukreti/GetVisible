import { NextRequest, NextResponse } from 'next/server';
import { getResolvedOrganizationId } from '@/lib/auth';
import {
  generateExcelBuffer,
  generateCsvString,
  computeExportSummary,
  ExportLeadItem,
} from '@/lib/discovery/export-helper';
import { LeadExtractorStorage } from '@/lib/discovery/storage';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ExportRequestSchema = z.object({
  leads: z.array(
    z.object({
      businessName: z.string(),
      profession: z.string().optional(),
      publicPhone: z.string().nullable().optional(),
      publicEmail: z.string().nullable().optional(),
      website: z.string().nullable().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().nullable().optional(),
      country: z.string().nullable().optional(),
      postalCode: z.string().nullable().optional(),
      rating: z.number().nullable().optional(),
      reviewCount: z.number().nullable().optional(),
      contactStatus: z.string().optional(),
      source: z.string().optional(),
      sourceUrl: z.string().optional(),
      retrievedAt: z.string().optional(),
    })
  ),
  format: z.enum(['XLSX', 'CSV']).default('XLSX'),
  searchKeyword: z.string().default('Business Leads'),
  searchLocation: z.string().default('General'),
  providerUsed: z.string().default('GetVisible Lead Extractor'),
});

export async function POST(request: NextRequest) {
  try {
    const orgId = (await getResolvedOrganizationId(request)) || 'demo-org-getvisible';
    const body = await request.json();
    const validated = ExportRequestSchema.parse(body);

    const summary = computeExportSummary(validated.leads as ExportLeadItem[], {
      searchKeyword: validated.searchKeyword,
      searchLocation: validated.searchLocation,
      providerUsed: validated.providerUsed,
    });

    const timestamp = Date.now();
    const cleanKw = validated.searchKeyword.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanLoc = validated.searchLocation.toLowerCase().replace(/[^a-z0-9]/g, '_');

    if (validated.format === 'XLSX') {
      const buffer = generateExcelBuffer(validated.leads as ExportLeadItem[], summary);
      const fileName = `leads_${cleanKw}_${cleanLoc}_${timestamp}.xlsx`;

      // Log export history
      LeadExtractorStorage.recordExport(orgId, {
        fileName,
        format: 'XLSX',
        rowCount: validated.leads.length,
        searchKeyword: validated.searchKeyword,
        searchLocation: validated.searchLocation,
        providerUsed: validated.providerUsed,
      });

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'no-store',
        },
      });
    } else {
      const csv = generateCsvString(validated.leads as ExportLeadItem[]);
      const fileName = `leads_${cleanKw}_${cleanLoc}_${timestamp}.csv`;

      // Log export history
      LeadExtractorStorage.recordExport(orgId, {
        fileName,
        format: 'CSV',
        rowCount: validated.leads.length,
        searchKeyword: validated.searchKeyword,
        searchLocation: validated.searchLocation,
        providerUsed: validated.providerUsed,
      });

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'no-store',
        },
      });
    }
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters', details: err.errors }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Export generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
