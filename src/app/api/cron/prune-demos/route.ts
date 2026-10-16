import { NextRequest, NextResponse } from 'next/server';
import { WebsiteDemoRepository } from '@/lib/db/repository';
import { DEMO_PUBLIC_TTL_DAYS } from '@/lib/demos/public';

export const dynamic = 'force-dynamic';

/**
 * Daily retention job: permanently deletes client demo links that are older than
 * the public TTL (3 days). Scheduled via `vercel.json` crons.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set
 * on the project; if it is not configured the endpoint still runs (the operation
 * is idempotent and only ever removes already-expired records).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const pruned = await WebsiteDemoRepository.pruneExpiredDemos();
    return NextResponse.json({
      success: true,
      pruned,
      ttlDays: DEMO_PUBLIC_TTL_DAYS,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
