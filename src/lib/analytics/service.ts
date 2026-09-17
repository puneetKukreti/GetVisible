import {
  LeadData,
  WebsiteDemoData,
  DateRangeFilter,
  DateRangeOption,
  SalesAnalyticsResponse,
  SalesFunnelData,
  SalesFunnelStage,
  ConversionRates,
  ActivityTrendPoint,
  BreakdownMetric,
  LeadAgingBucket,
  ActionQueueItem,
  OperationalLeadScore,
  OperationalScoreRule,
  LeadStatus,
  Channel,
} from '@/types';
import { LeadRepository, WebsiteDemoRepository } from '@/lib/db/repository';
import { THEMES } from '@/lib/demos/templates';

/**
 * Resolves a DateRangeFilter into concrete start and end Date objects.
 */
export function resolveDateRange(filter?: DateRangeFilter): { startDate: Date; endDate: Date } {
  const now = new Date();
  const preset: DateRangeOption = filter?.preset || 'LAST_30_DAYS';

  if (preset === 'TODAY') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return { startDate: start, endDate: now };
  }

  if (preset === 'LAST_7_DAYS') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { startDate: start, endDate: now };
  }

  if (preset === 'LAST_30_DAYS') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { startDate: start, endDate: now };
  }

  if (preset === 'LAST_90_DAYS') {
    const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return { startDate: start, endDate: now };
  }

  if (preset === 'ALL_TIME') {
    return { startDate: new Date(0), endDate: now };
  }

  if (preset === 'CUSTOM' && filter?.startDate) {
    const start = new Date(filter.startDate);
    const end = filter.endDate ? new Date(filter.endDate) : now;
    // If end date is specified as date-only (00:00:00), push to end of that day
    if (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0) {
      end.setHours(23, 59, 59, 999);
    }
    return { startDate: isNaN(start.getTime()) ? new Date(0) : start, endDate: isNaN(end.getTime()) ? now : end };
  }

  return { startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), endDate: now };
}

/**
 * Safe rate calculation returning 0 when denominator is zero to prevent NaN / Infinity.
 */
export function calculateSafeRate(numerator: number, denominator: number): number {
  if (denominator <= 0 || isNaN(denominator) || isNaN(numerator)) {
    return 0;
  }
  return Number(((numerator / denominator) * 100).toFixed(1));
}

/**
 * Calculates a transparent, explainable operational lead score (0-100) based on deterministic criteria.
 * Zero opaque black-box AI algorithms.
 */
export function calculateOperationalLeadScore(lead: LeadData): OperationalLeadScore {
  const rules: OperationalScoreRule[] = [
    {
      id: 'no_website',
      label: 'Verified No Website',
      points: 25,
      satisfied: lead.websiteStatus === 'NO_WEBSITE',
      explanation:
        lead.websiteStatus === 'NO_WEBSITE'
          ? 'Target practice has no digital website presence, presenting prime opportunity.'
          : 'Business already possesses a website or status is unverified.',
    },
    {
      id: 'phone_available',
      label: 'Direct Phone Available',
      points: 20,
      satisfied: Boolean(lead.publicPhone && lead.publicPhone.trim().length > 0),
      explanation: lead.publicPhone
        ? `Direct telephone (${lead.publicPhone}) verified for rapid contact.`
        : 'Missing verified telephone number.',
    },
    {
      id: 'email_available',
      label: 'Public Email Available',
      points: 15,
      satisfied: Boolean(lead.publicEmail && lead.publicEmail.trim().length > 0),
      explanation: lead.publicEmail
        ? `Official email (${lead.publicEmail}) available for formal written outreach.`
        : 'Missing business email contact.',
    },
    {
      id: 'target_metro',
      label: 'High-Growth Metro Location',
      points: 10,
      satisfied: Boolean(
        lead.city &&
          ['gurgaon', 'delhi', 'noida', 'mumbai', 'bengaluru', 'bangalore', 'pune', 'hyderabad', 'chennai'].some((c) =>
            lead.city.toLowerCase().includes(c)
          )
      ),
      explanation: lead.city
        ? `Located in tier-1 financial hub (${lead.city}).`
        : 'Unspecified geographic territory.',
    },
    {
      id: 'demo_generated',
      label: 'Concept Demo Generated',
      points: 15,
      satisfied:
        Boolean(lead.websiteDemos && lead.websiteDemos.length > 0) ||
        ['DEMO_GENERATED', 'UNDER_REVIEW', 'APPROVED', 'OUTREACH_PENDING', 'CONTACTED', 'RESPONDED', 'REPLIED', 'INTERESTED', 'CONVERTED', 'CUSTOMER'].includes(
          lead.leadStatus
        ),
      explanation:
        Boolean(lead.websiteDemos && lead.websiteDemos.length > 0) || lead.leadStatus !== 'NEW'
          ? 'Personalized modern concept demo generated and available for preview.'
          : 'No concept demo generated yet.',
    },
    {
      id: 'demo_approved',
      label: 'Concept Demo Approved',
      points: 15,
      satisfied:
        Boolean(lead.websiteDemos && lead.websiteDemos.some((d) => d.approvalStatus === 'APPROVED')) ||
        ['APPROVED', 'OUTREACH_PENDING', 'CONTACTED', 'RESPONDED', 'REPLIED', 'INTERESTED', 'CONVERTED', 'CUSTOMER'].includes(lead.leadStatus),
      explanation:
        Boolean(lead.websiteDemos && lead.websiteDemos.some((d) => d.approvalStatus === 'APPROVED')) ||
        ['APPROVED', 'CONTACTED', 'RESPONDED', 'INTERESTED', 'CONVERTED'].includes(lead.leadStatus)
          ? 'Concept demo reviewed and approved by human specialist.'
          : 'Demo pending review or rejected.',
    },
  ];

  const totalScore = rules.reduce((acc, rule) => (rule.satisfied ? acc + rule.points : acc), 0);
  const maxScore = rules.reduce((acc, rule) => acc + rule.points, 0);

  let summary = 'Low Priority — Missing critical contact details or not qualified.';
  if (totalScore >= 80) {
    summary = 'High Opportunity — Complete contact info and approved concept demo.';
  } else if (totalScore >= 50) {
    summary = 'Medium Opportunity — Good target profile, pending verification or demo review.';
  }

  return {
    score: totalScore,
    maxScore,
    rules,
    summary,
  };
}

/**
 * Generates an RFC 4180 compliant CSV string from an array of leads.
 */
export function generateLeadsCsv(leads: LeadData[]): string {
  const headers = [
    'ID',
    'Business Name',
    'Profession',
    'City',
    'Address',
    'Website Status',
    'Lead Status',
    'Contact Channel',
    'Public Email',
    'Public Phone',
    'Opportunity Score',
    'Source',
    'Created At',
    'Updated At',
  ];

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = leads.map((lead) => [
    escapeCsv(lead.id),
    escapeCsv(lead.businessName),
    escapeCsv(lead.profession),
    escapeCsv(lead.city),
    escapeCsv(lead.address),
    escapeCsv(lead.websiteStatus),
    escapeCsv(lead.leadStatus),
    escapeCsv(lead.contactChannel || ''),
    escapeCsv(lead.publicEmail || ''),
    escapeCsv(lead.publicPhone || ''),
    escapeCsv(lead.opportunityScore),
    escapeCsv(lead.source),
    escapeCsv(lead.createdAt),
    escapeCsv(lead.updatedAt),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Status check helpers for funnel progression
 */
function isQualified(lead: LeadData): boolean {
  if (['QUALIFIED', 'DEMO_GENERATED', 'UNDER_REVIEW', 'APPROVED', 'OUTREACH_PENDING', 'CONTACTED', 'RESPONDED', 'REPLIED', 'INTERESTED', 'CONVERTED', 'CUSTOMER'].includes(lead.leadStatus)) {
    return true;
  }
  return lead.websiteStatus === 'NO_WEBSITE' && (Boolean(lead.publicPhone) || Boolean(lead.publicEmail));
}

function hasDemoGenerated(lead: LeadData, demos: WebsiteDemoData[]): boolean {
  if (['DEMO_GENERATED', 'UNDER_REVIEW', 'APPROVED', 'OUTREACH_PENDING', 'CONTACTED', 'RESPONDED', 'REPLIED', 'INTERESTED', 'CONVERTED', 'CUSTOMER'].includes(lead.leadStatus)) {
    return true;
  }
  return demos.some((d) => d.leadId === lead.id);
}

function hasDemoApproved(lead: LeadData, demos: WebsiteDemoData[]): boolean {
  if (['APPROVED', 'OUTREACH_PENDING', 'CONTACTED', 'RESPONDED', 'REPLIED', 'INTERESTED', 'CONVERTED', 'CUSTOMER'].includes(lead.leadStatus)) {
    return true;
  }
  return demos.some((d) => d.leadId === lead.id && d.approvalStatus === 'APPROVED');
}

function isContacted(lead: LeadData): boolean {
  return ['CONTACTED', 'RESPONDED', 'REPLIED', 'INTERESTED', 'CONVERTED', 'CUSTOMER'].includes(lead.leadStatus);
}

function hasResponded(lead: LeadData): boolean {
  return ['RESPONDED', 'REPLIED', 'INTERESTED', 'CONVERTED', 'CUSTOMER'].includes(lead.leadStatus);
}

function isInterested(lead: LeadData): boolean {
  return ['INTERESTED', 'CONVERTED', 'CUSTOMER'].includes(lead.leadStatus);
}

function isConverted(lead: LeadData): boolean {
  return ['CONVERTED', 'CUSTOMER'].includes(lead.leadStatus);
}

/**
 * Computes all sales analytics and funnel intelligence strictly scoped by organizationId.
 */
export async function computeSalesAnalytics(
  organizationId: string,
  filter?: DateRangeFilter
): Promise<SalesAnalyticsResponse> {
  if (!organizationId) {
    throw new Error('Unauthorized: organizationId is required for data isolation.');
  }

  const { startDate, endDate } = resolveDateRange(filter);
  const preset = filter?.preset || 'LAST_30_DAYS';

  // 1. Fetch organization scoped leads & demos
  const paginatedResult = await LeadRepository.listLeads(organizationId, {
    pageSize: 10000,
  });
  const allLeads = paginatedResult.leads;
  const allDemos = await WebsiteDemoRepository.listDemos(organizationId);

  // 2. Filter leads within date range based on createdAt
  const filteredLeads = allLeads.filter((l) => {
    const created = new Date(l.createdAt).getTime();
    return created >= startDate.getTime() && created <= endDate.getTime();
  });

  // Filter demos within date range
  const filteredDemos = allDemos.filter((d) => {
    const created = new Date(d.createdAt).getTime();
    return created >= startDate.getTime() && created <= endDate.getTime();
  });

  // 3. Compute Funnel Counts
  const totalLeads = filteredLeads.length;
  const qualified = filteredLeads.filter(isQualified).length;
  const demosGenerated = filteredLeads.filter((l) => hasDemoGenerated(l, allDemos)).length;
  const demosApproved = filteredLeads.filter((l) => hasDemoApproved(l, allDemos)).length;
  const contacted = filteredLeads.filter(isContacted).length;
  const responded = filteredLeads.filter(hasResponded).length;
  const interested = filteredLeads.filter(isInterested).length;
  const converted = filteredLeads.filter(isConverted).length;

  // Stages array with percent of previous and percent of total
  const stages: SalesFunnelStage[] = [
    {
      id: 'total_leads',
      label: 'Total Leads',
      count: totalLeads,
      percentOfPrevious: 100,
      percentOfTotal: 100,
    },
    {
      id: 'qualified',
      label: 'Qualified Leads',
      count: qualified,
      percentOfPrevious: calculateSafeRate(qualified, totalLeads),
      percentOfTotal: calculateSafeRate(qualified, totalLeads),
    },
    {
      id: 'demos_generated',
      label: 'Demos Generated',
      count: demosGenerated,
      percentOfPrevious: calculateSafeRate(demosGenerated, qualified),
      percentOfTotal: calculateSafeRate(demosGenerated, totalLeads),
    },
    {
      id: 'demos_approved',
      label: 'Demos Approved',
      count: demosApproved,
      percentOfPrevious: calculateSafeRate(demosApproved, demosGenerated),
      percentOfTotal: calculateSafeRate(demosApproved, totalLeads),
    },
    {
      id: 'contacted',
      label: 'Contacted',
      count: contacted,
      percentOfPrevious: calculateSafeRate(contacted, demosApproved),
      percentOfTotal: calculateSafeRate(contacted, totalLeads),
    },
    {
      id: 'responded',
      label: 'Responded',
      count: responded,
      percentOfPrevious: calculateSafeRate(responded, contacted),
      percentOfTotal: calculateSafeRate(responded, totalLeads),
    },
    {
      id: 'interested',
      label: 'Interested',
      count: interested,
      percentOfPrevious: calculateSafeRate(interested, responded),
      percentOfTotal: calculateSafeRate(interested, totalLeads),
    },
    {
      id: 'converted',
      label: 'Converted',
      count: converted,
      percentOfPrevious: calculateSafeRate(converted, interested),
      percentOfTotal: calculateSafeRate(converted, totalLeads),
    },
  ];

  const funnel: SalesFunnelData = {
    totalLeads,
    qualified,
    demosGenerated,
    demosApproved,
    contacted,
    responded,
    interested,
    converted,
    stages,
  };

  // 4. Conversion Rates (8 rates)
  const rates: ConversionRates = {
    qualificationRate: calculateSafeRate(qualified, totalLeads),
    demoGenerationRate: calculateSafeRate(demosGenerated, qualified),
    demoApprovalRate: calculateSafeRate(demosApproved, demosGenerated),
    contactRate: calculateSafeRate(contacted, demosApproved),
    responseRate: calculateSafeRate(responded, contacted),
    interestRate: calculateSafeRate(interested, responded),
    conversionRate: calculateSafeRate(converted, interested),
    overallLeadToCustomerRate: calculateSafeRate(converted, totalLeads),
  };

  // 5. Activity Trends over Time (Daily for <= 31 days, Weekly for <= 120 days, Monthly otherwise)
  const daysDiff = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const trends: ActivityTrendPoint[] = [];

  if (daysDiff <= 31) {
    // Daily buckets
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);

    while (cursor <= endDate) {
      const nextDay = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
      const period = cursor.toISOString().split('T')[0];

      const dayLeads = filteredLeads.filter((l) => {
        const t = new Date(l.createdAt).getTime();
        return t >= cursor.getTime() && t < nextDay.getTime();
      });

      const dayDemos = filteredDemos.filter((d) => {
        const t = new Date(d.createdAt).getTime();
        return t >= cursor.getTime() && t < nextDay.getTime();
      });

      trends.push({
        period,
        leadsAdded: dayLeads.length,
        qualified: dayLeads.filter(isQualified).length,
        demosGenerated: dayDemos.length,
        demosApproved: dayDemos.filter((d) => d.approvalStatus === 'APPROVED').length,
        contacted: dayLeads.filter(isContacted).length,
        responded: dayLeads.filter(hasResponded).length,
        interested: dayLeads.filter(isInterested).length,
        converted: dayLeads.filter(isConverted).length,
      });

      cursor.setTime(nextDay.getTime());
    }
  } else if (daysDiff <= 120) {
    // Weekly buckets (7-day intervals)
    const cursor = new Date(startDate);
    let weekIndex = 1;

    while (cursor <= endDate) {
      const nextWeek = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
      const period = `W${weekIndex} (${cursor.getMonth() + 1}/${cursor.getDate()})`;

      const weekLeads = filteredLeads.filter((l) => {
        const t = new Date(l.createdAt).getTime();
        return t >= cursor.getTime() && t < nextWeek.getTime();
      });

      const weekDemos = filteredDemos.filter((d) => {
        const t = new Date(d.createdAt).getTime();
        return t >= cursor.getTime() && t < nextWeek.getTime();
      });

      trends.push({
        period,
        leadsAdded: weekLeads.length,
        qualified: weekLeads.filter(isQualified).length,
        demosGenerated: weekDemos.length,
        demosApproved: weekDemos.filter((d) => d.approvalStatus === 'APPROVED').length,
        contacted: weekLeads.filter(isContacted).length,
        responded: weekLeads.filter(hasResponded).length,
        interested: weekLeads.filter(isInterested).length,
        converted: weekLeads.filter(isConverted).length,
      });

      weekIndex++;
      cursor.setTime(nextWeek.getTime());
    }
  } else {
    // Monthly buckets
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (cursor <= endDate) {
      const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      const period = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;

      const monthLeads = filteredLeads.filter((l) => {
        const t = new Date(l.createdAt).getTime();
        return t >= cursor.getTime() && t < nextMonth.getTime();
      });

      const monthDemos = filteredDemos.filter((d) => {
        const t = new Date(d.createdAt).getTime();
        return t >= cursor.getTime() && t < nextMonth.getTime();
      });

      trends.push({
        period,
        leadsAdded: monthLeads.length,
        qualified: monthLeads.filter(isQualified).length,
        demosGenerated: monthDemos.length,
        demosApproved: monthDemos.filter((d) => d.approvalStatus === 'APPROVED').length,
        contacted: monthLeads.filter(isContacted).length,
        responded: monthLeads.filter(hasResponded).length,
        interested: monthLeads.filter(isInterested).length,
        converted: monthLeads.filter(isConverted).length,
      });

      cursor.setTime(nextMonth.getTime());
    }
  }

  // 6. Multi-dimensional Breakdowns
  const aggregateMetrics = (name: string, leadsSubset: LeadData[], demosSubset: WebsiteDemoData[]): BreakdownMetric => {
    const lCount = leadsSubset.length;
    const qCount = leadsSubset.filter(isQualified).length;
    const dCount = demosSubset.length;
    const aCount = demosSubset.filter((d) => d.approvalStatus === 'APPROVED').length;
    const cCount = leadsSubset.filter(isContacted).length;
    const rCount = leadsSubset.filter(hasResponded).length;
    const iCount = leadsSubset.filter(isInterested).length;
    const convCount = leadsSubset.filter(isConverted).length;

    return {
      name,
      leads: lCount,
      qualified: qCount,
      demos: dCount,
      approved: aCount,
      contacted: cCount,
      responded: rCount,
      interested: iCount,
      converted: convCount,
    };
  };

  // 6a. Website Templates Breakdown
  const templateDefinitions: { id: string; name: string }[] = [
    { id: 'EDITORIAL_FINANCE', name: 'Editorial Finance' },
    { id: 'MODERN_FINTECH', name: 'Modern Fintech' },
    { id: 'LUXURY_PROFESSIONAL', name: 'Luxury Professional' },
    { id: 'SWISS_MINIMAL', name: 'Swiss Minimal' },
    { id: 'MODERN_INDIAN', name: 'Modern Indian Professional' },
    { id: 'CA_ACCOUNTING_PROFESSIONAL', name: 'Chartered Accountant Default' },
  ];

  const templates: BreakdownMetric[] = templateDefinitions.map((tmpl) => {
    const matchingDemos = allDemos.filter(
      (d) =>
        d.templateId === tmpl.id ||
        (d.content?.meta as any)?.templateId === tmpl.id ||
        (d.content?.design as any)?.template === tmpl.id
    );
    const matchingLeadIds = new Set(matchingDemos.map((d) => d.leadId));
    const matchingLeads = filteredLeads.filter((l) => matchingLeadIds.has(l.id));

    return aggregateMetrics(tmpl.name, matchingLeads, matchingDemos);
  });

  // 6b. Themes Breakdown
  const themeDefinitions = Object.values(THEMES);
  const themes: BreakdownMetric[] = themeDefinitions.map((thm) => {
    const matchingDemos = allDemos.filter((d) => d.theme?.id === thm.id || (d.content?.theme as any)?.id === thm.id);
    const matchingLeadIds = new Set(matchingDemos.map((d) => d.leadId));
    const matchingLeads = filteredLeads.filter((l) => matchingLeadIds.has(l.id));

    return aggregateMetrics(thm.name || thm.id || 'Theme', matchingLeads, matchingDemos);
  });

  // 6c. Channels Breakdown
  const channelDefinitions: Channel[] = ['EMAIL', 'WHATSAPP', 'SMS', 'VOICE'];
  const channels: BreakdownMetric[] = channelDefinitions.map((ch) => {
    const matchingLeads = filteredLeads.filter((l) => {
      if (l.contactChannel === ch) return true;
      if (l.activities && l.activities.some((a) => (a.metadata as any)?.channel === ch)) return true;
      return false;
    });
    const matchingDemos = allDemos.filter((d) => matchingLeads.some((l) => l.id === d.leadId));

    const channelNames: Record<Channel, string> = {
      EMAIL: 'Email Outreach',
      WHATSAPP: 'WhatsApp Message',
      SMS: 'SMS Notice',
      VOICE: 'Direct Phone',
    };

    return aggregateMetrics(channelNames[ch] || ch, matchingLeads, matchingDemos);
  });

  // 6d. Sources Breakdown
  const sourcesMap = new Map<string, LeadData[]>();
  filteredLeads.forEach((l) => {
    const src = l.source || 'Manual Entry';
    if (!sourcesMap.has(src)) sourcesMap.set(src, []);
    sourcesMap.get(src)!.push(l);
  });

  const sources: BreakdownMetric[] = Array.from(sourcesMap.entries()).map(([src, lSubset]) => {
    const matchingDemos = allDemos.filter((d) => lSubset.some((l) => l.id === d.leadId));
    return aggregateMetrics(src, lSubset, matchingDemos);
  });

  // 6e. Professions Breakdown
  const professionsMap = new Map<string, LeadData[]>();
  filteredLeads.forEach((l) => {
    const prof = l.profession || 'Chartered Accountant';
    if (!professionsMap.has(prof)) professionsMap.set(prof, []);
    professionsMap.get(prof)!.push(l);
  });

  const professions: BreakdownMetric[] = Array.from(professionsMap.entries()).map(([prof, lSubset]) => {
    const matchingDemos = allDemos.filter((d) => lSubset.some((l) => l.id === d.leadId));
    return aggregateMetrics(prof, lSubset, matchingDemos);
  });

  // 6f. Geographies Breakdown
  const geoMap = new Map<string, LeadData[]>();
  filteredLeads.forEach((l) => {
    const city = l.city || 'Unknown';
    if (!geoMap.has(city)) geoMap.set(city, []);
    geoMap.get(city)!.push(l);
  });

  const geographies: BreakdownMetric[] = Array.from(geoMap.entries()).map(([city, lSubset]) => {
    const matchingDemos = allDemos.filter((d) => lSubset.some((l) => l.id === d.leadId));
    return aggregateMetrics(city, lSubset, matchingDemos);
  });

  // 7. Lead Aging / Stage Latency
  const activeStages: { stage: LeadStatus; label: string }[] = [
    { stage: 'UNDER_REVIEW', label: 'Under Review' },
    { stage: 'APPROVED', label: 'Approved (Pending Outreach)' },
    { stage: 'CONTACTED', label: 'Contacted (Awaiting Reply)' },
    { stage: 'INTERESTED', label: 'Interested (Pending Close)' },
  ];

  const nowMs = Date.now();
  const aging: LeadAgingBucket[] = activeStages.map(({ stage, label }) => {
    const leadsInStage = allLeads.filter((l) => l.leadStatus === stage);
    const count = leadsInStage.length;

    let totalDays = 0;
    const staleLeadIds: string[] = [];

    leadsInStage.forEach((lead) => {
      const updatedAtMs = new Date(lead.updatedAt || lead.createdAt).getTime();
      const days = Math.max(0, Math.floor((nowMs - updatedAtMs) / (1000 * 60 * 60 * 24)));
      totalDays += days;
      if (days >= 7) {
        staleLeadIds.push(lead.id);
      }
    });

    const averageDaysInStage = count > 0 ? Number((totalDays / count).toFixed(1)) : 0;

    return {
      stage,
      stageLabel: label,
      count,
      averageDaysInStage,
      staleCount: staleLeadIds.length,
      staleLeadIds,
    };
  });

  // 8. Action Queue ("Needs Attention" items)
  const actionQueue: ActionQueueItem[] = [];

  // 8a. NEED_DEMO_REVIEW: Leads with demo generated, still in DEMO_GENERATED or UNDER_REVIEW
  const needReviewLeads = allLeads.filter(
    (l) =>
      (l.leadStatus === 'DEMO_GENERATED' || l.leadStatus === 'UNDER_REVIEW') &&
      allDemos.some((d) => d.leadId === l.id && d.approvalStatus !== 'APPROVED' && d.approvalStatus !== 'REJECTED')
  );
  if (needReviewLeads.length > 0) {
    actionQueue.push({
      id: 'queue-demo-review',
      type: 'NEED_DEMO_REVIEW',
      title: 'Review Website Concept Demos',
      description: `${needReviewLeads.length} personalized website concept${needReviewLeads.length === 1 ? ' is' : 's are'} awaiting human specialist approval.`,
      count: needReviewLeads.length,
      leadIds: needReviewLeads.map((l) => l.id),
      actionLabel: 'Review First Demo',
      actionUrl: `/leads/${needReviewLeads[0].id}`,
    });
  }

  // 8b. APPROVED_NOT_CONTACTED: Leads with APPROVED demo / status APPROVED, not yet contacted
  const approvedNotContactedLeads = allLeads.filter((l) => l.leadStatus === 'APPROVED');
  if (approvedNotContactedLeads.length > 0) {
    actionQueue.push({
      id: 'queue-send-outreach',
      type: 'APPROVED_NOT_CONTACTED',
      title: 'Send Approved Outreach',
      description: `${approvedNotContactedLeads.length} lead${approvedNotContactedLeads.length === 1 ? ' has' : 's have'} approved website demos ready for manual outreach dispatch.`,
      count: approvedNotContactedLeads.length,
      leadIds: approvedNotContactedLeads.map((l) => l.id),
      actionLabel: 'Send Outreach',
      actionUrl: `/leads/${approvedNotContactedLeads[0].id}`,
    });
  }

  // 8c. CONTACTED_NO_RESPONSE: Leads contacted > 3 days ago with no response
  const threeDaysAgoMs = nowMs - 3 * 24 * 60 * 60 * 1000;
  const contactedNoResponseLeads = allLeads.filter((l) => {
    if (l.leadStatus !== 'CONTACTED') return false;
    const lastUpdate = new Date(l.updatedAt || l.createdAt).getTime();
    return lastUpdate <= threeDaysAgoMs;
  });
  if (contactedNoResponseLeads.length > 0) {
    actionQueue.push({
      id: 'queue-follow-up',
      type: 'CONTACTED_NO_RESPONSE',
      title: 'Follow Up with Stale Contacted Leads',
      description: `${contactedNoResponseLeads.length} lead${contactedNoResponseLeads.length === 1 ? ' was' : 's were'} contacted over 3 days ago with no response recorded.`,
      count: contactedNoResponseLeads.length,
      leadIds: contactedNoResponseLeads.map((l) => l.id),
      actionLabel: 'View Follow-ups',
      actionUrl: `/leads/${contactedNoResponseLeads[0].id}`,
    });
  }

  // 8d. INTERESTED_FOLLOWUP: Leads in INTERESTED status needing proposal / final close
  const interestedLeads = allLeads.filter((l) => l.leadStatus === 'INTERESTED');
  if (interestedLeads.length > 0) {
    actionQueue.push({
      id: 'queue-convert-interested',
      type: 'INTERESTED_FOLLOWUP',
      title: 'Convert Interested Prospects',
      description: `${interestedLeads.length} chartered accountant practice${interestedLeads.length === 1 ? ' has' : 's have'} expressed positive interest.`,
      count: interestedLeads.length,
      leadIds: interestedLeads.map((l) => l.id),
      actionLabel: 'Finalize Proposal',
      actionUrl: `/leads/${interestedLeads[0].id}`,
    });
  }

  return {
    dateRange: {
      preset,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    funnel,
    rates,
    trends,
    templates,
    themes,
    channels,
    sources,
    professions,
    geographies,
    aging,
    actionQueue,
  };
}
