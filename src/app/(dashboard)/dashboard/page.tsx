import React from 'react';
import { getResolvedOrganizationId } from '@/lib/auth';
import { getDefaultOrganizationId } from '@/lib/workspace';
import { computeSalesAnalytics } from '@/lib/analytics/service';
import { DashboardClient } from './dashboard-client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const orgId = (await getResolvedOrganizationId()) || getDefaultOrganizationId();
  const analytics = await computeSalesAnalytics(orgId, { preset: 'LAST_30_DAYS' });

  return <DashboardClient initialData={analytics} />;
}
