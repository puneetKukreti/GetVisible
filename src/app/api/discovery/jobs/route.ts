import { NextRequest, NextResponse } from 'next/server';
import { LeadRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { DiscoveryJobRunner } from '@/lib/discovery/job-runner';
import { DiscoverySearchInput } from '@/lib/discovery/providers/types';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const DiscoveryRequestSchema = z.object({
  profession: z.string().default('Chartered Accountant'),
  location: z.string().default('Gurgaon'),
  locality: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
  websitePreference: z.enum(['ANY', 'NO_WEBSITE', 'WEBSITE_EXISTS', 'POOR_OUTDATED']).default('ANY'),
  contactPreference: z.enum(['EITHER', 'EMAIL_AVAILABLE', 'PHONE_AVAILABLE']).default('EITHER'),
});

export async function POST(request: NextRequest) {
  try {
    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: Organization context required' }, { status: 401 });
    }
    const body = await request.json();
    const validated = DiscoveryRequestSchema.parse(body);

    const jobId = `job-disc-${Date.now()}`;

    // Run discovery job asynchronously
    // In Node.js / Next.js API, we can await or start it
    await DiscoveryJobRunner.runJob(jobId, validated as DiscoverySearchInput, orgId, 'Agency Specialist');

    const progress = DiscoveryJobRunner.getJobProgress(jobId);

    return NextResponse.json(
      {
        jobId,
        status: progress?.currentStage || 'COMPLETED',
        progress,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters', details: err.errors }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Discovery job failed to start';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: Organization context required' }, { status: 401 });
    }
    const allJobs = await LeadRepository.getJobs(orgId);
    const discoveryJobs = allJobs.filter((j) => j.type === 'LEAD_DISCOVERY');
    return NextResponse.json(discoveryJobs);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve discovery jobs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

