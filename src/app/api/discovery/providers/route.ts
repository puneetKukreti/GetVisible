import { NextRequest, NextResponse } from 'next/server';
import { providerRegistry } from '@/lib/discovery/providers/registry';
import { requireOwnerSession } from '@/lib/owner-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const unauthorized = await requireOwnerSession(request);
  if (unauthorized) return unauthorized;

  const statuses = providerRegistry.getAllStatuses();
  return NextResponse.json(statuses);
}
