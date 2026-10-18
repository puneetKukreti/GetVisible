import { NextRequest, NextResponse } from 'next/server';
import { DiscoveryJobRunner } from '@/lib/discovery/job-runner';
import { requireOwnerSession } from '@/lib/owner-guard';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauthorized = await requireOwnerSession(request);
  if (unauthorized) return unauthorized;

  const progress = DiscoveryJobRunner.getJobProgress(params.id);

  if (!progress) {
    return NextResponse.json(
      { error: `Discovery job ${params.id} not found or expired.` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    jobId: params.id,
    ...progress,
  });
}
