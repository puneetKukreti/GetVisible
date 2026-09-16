import { NextRequest, NextResponse } from 'next/server';
import { DiscoveryJobRunner } from '@/lib/discovery/job-runner';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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
