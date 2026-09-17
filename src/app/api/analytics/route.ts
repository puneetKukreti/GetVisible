import { NextRequest, NextResponse } from 'next/server';
import { getResolvedOrganizationId } from '@/lib/auth';
import { computeSalesAnalytics } from '@/lib/analytics/service';
import { DateRangeOption } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json(
        { error: 'Unauthorized: Organization context required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const preset = (searchParams.get('preset') as DateRangeOption) || 'LAST_30_DAYS';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const analytics = await computeSalesAnalytics(orgId, {
      preset,
      startDate,
      endDate,
    });

    return NextResponse.json(analytics);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to compute sales analytics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
