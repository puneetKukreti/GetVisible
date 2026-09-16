import { NextResponse } from 'next/server';
import { providerRegistry } from '@/lib/discovery/providers/registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  const statuses = providerRegistry.getAllStatuses();
  return NextResponse.json(statuses);
}
