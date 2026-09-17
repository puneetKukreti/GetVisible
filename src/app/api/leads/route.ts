import { NextRequest, NextResponse } from 'next/server';
import { LeadRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { z } from 'zod';
import { LeadFilterParams, LeadStatus, WebsiteStatus, Channel } from '@/types';

export const dynamic = 'force-dynamic';

const CreateLeadSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  profession: z.string().default('Chartered Accountant'),
  city: z.string().default('Gurgaon'),
  address: z.string().min(3, 'Address is required'),
  website: z.string().url().optional().nullable().or(z.literal('')),
  publicEmail: z.string().email().optional().nullable().or(z.literal('')),
  publicPhone: z.string().optional().nullable(),
  source: z.string().default('Manual Entry'),
  sourceUrl: z.string().url().optional().nullable().or(z.literal('')),
  websiteStatus: z.enum(['NO_WEBSITE', 'WEBSITE_EXISTS', 'UNKNOWN', 'REQUIRES_REVIEW']).default('NO_WEBSITE'),
  opportunityScore: z.number().min(0).max(100).default(50),
  opportunityReason: z.string().min(5, 'Opportunity reason is required'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: Organization context required' }, { status: 401 });
    }

    const params: LeadFilterParams = {
      search: searchParams.get('search') || undefined,
      profession: searchParams.get('profession') || undefined,
      city: searchParams.get('city') || undefined,
      leadStatus: (searchParams.get('status') as LeadStatus) || 'ALL',
      websiteStatus: (searchParams.get('websiteStatus') as WebsiteStatus) || 'ALL',
      source: searchParams.get('source') || undefined,
      isDemoData:
        searchParams.get('isDemoData') === 'true'
          ? true
          : searchParams.get('isDemoData') === 'false'
          ? false
          : undefined,
      hasContact: (searchParams.get('hasContact') as 'ANY' | 'EMAIL' | 'PHONE' | 'BOTH') || undefined,
      channel: (searchParams.get('channel') as Channel | 'ALL') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      sortBy: (searchParams.get('sortBy') as 'opportunityScore' | 'createdAt' | 'businessName' | 'updatedAt') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!, 10) : 10,
    };

    if (searchParams.get('minScore')) {
      params.minScore = parseInt(searchParams.get('minScore')!, 10);
    }
    if (searchParams.get('maxScore')) {
      params.maxScore = parseInt(searchParams.get('maxScore')!, 10);
    }

    const result = await LeadRepository.listLeads(orgId, params);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch leads';
    const status = (error as { name?: string }).name === 'DatabaseConnectionError' ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: Organization context required' }, { status: 401 });
    }
    const body = await request.json();
    const validated = CreateLeadSchema.parse(body);

    const lead = await LeadRepository.createLead(
      validated,
      orgId,
      'Agency User'
    );


    return NextResponse.json(lead, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Failed to create lead';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
