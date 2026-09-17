import { describe, it, expect, beforeEach } from 'vitest';
import { LeadRepository, WebsiteDemoRepository } from '@/lib/db/repository';
import {
  computeSalesAnalytics,
  resolveDateRange,
  calculateSafeRate,
  calculateOperationalLeadScore,
  generateLeadsCsv,
} from '@/lib/analytics/service';
import { LeadData, WebsiteDemoData, Channel } from '@/types';

describe('Phase 6 — Sales Analytics & Funnel Intelligence', () => {
  const orgA = 'org-analytics-test-a';
  const orgB = 'org-analytics-test-b';

  beforeEach(() => {
    process.env.DEMO_MODE = 'true';
  });

  describe('1. Date Range Resolution & Zero-Division Safety', () => {
    it('resolves standard presets correctly', () => {
      const now = new Date();
      const todayRange = resolveDateRange({ preset: 'TODAY' });
      expect(todayRange.startDate.getDate()).toBe(now.getDate());
      expect(todayRange.endDate.getTime()).toBeGreaterThanOrEqual(todayRange.startDate.getTime());

      const sevenDays = resolveDateRange({ preset: 'LAST_7_DAYS' });
      const diffDays7 = Math.round((sevenDays.endDate.getTime() - sevenDays.startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays7).toBe(7);

      const thirtyDays = resolveDateRange({ preset: 'LAST_30_DAYS' });
      const diffDays30 = Math.round((thirtyDays.endDate.getTime() - thirtyDays.startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays30).toBe(30);

      const allTime = resolveDateRange({ preset: 'ALL_TIME' });
      expect(allTime.startDate.getTime()).toBe(0);

      const customRange = resolveDateRange({
        preset: 'CUSTOM',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });
      expect(customRange.startDate.getFullYear()).toBe(2026);
      expect(customRange.startDate.getMonth()).toBe(0);
      expect(customRange.endDate.getDate()).toBe(31);
    });

    it('prevents NaN and Infinity with safe rate calculation', () => {
      expect(calculateSafeRate(0, 0)).toBe(0);
      expect(calculateSafeRate(10, 0)).toBe(0);
      expect(calculateSafeRate(NaN, 10)).toBe(0);
      expect(calculateSafeRate(5, NaN)).toBe(0);
      expect(calculateSafeRate(1, 3)).toBe(33.3);
      expect(calculateSafeRate(5, 10)).toBe(50.0);
      expect(calculateSafeRate(10, 10)).toBe(100.0);
    });
  });

  describe('2. Operational Lead Scoring (Explainable Rules)', () => {
    it('calculates deterministic score based on verified facts', () => {
      const lead1: LeadData = {
        id: 'score-lead-1',
        businessName: 'Apex Tax Advisors',
        profession: 'Chartered Accountant',
        city: 'Gurgaon',
        address: 'Sector 29, Gurgaon',
        websiteStatus: 'NO_WEBSITE', // +25
        publicPhone: '+91-9811122334', // +20
        publicEmail: 'contact@apextax.in', // +15
        leadStatus: 'NEW',
        opportunityScore: 50,
        opportunityReason: 'Test',
        isDemoData: false,
        organizationId: orgA,
        source: 'CSV Import',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const scoreResult1 = calculateOperationalLeadScore(lead1);
      // Rules:
      // no_website (+25)
      // phone_available (+20)
      // email_available (+15)
      // target_metro (Gurgaon: +10)
      // demo_generated (false: 0)
      // demo_approved (false: 0)
      // Total = 70
      expect(scoreResult1.score).toBe(70);
      expect(scoreResult1.maxScore).toBe(100);
      expect(scoreResult1.rules.find((r) => r.id === 'no_website')?.satisfied).toBe(true);
      expect(scoreResult1.rules.find((r) => r.id === 'target_metro')?.satisfied).toBe(true);
      expect(scoreResult1.rules.find((r) => r.id === 'demo_generated')?.satisfied).toBe(false);
      expect(scoreResult1.summary).toContain('Medium Opportunity');
    });

    it('awards full 100 points when demo is generated and approved', () => {
      const lead2: LeadData = {
        id: 'score-lead-2',
        businessName: 'Vanguard Chartered Accountants',
        profession: 'Chartered Accountant',
        city: 'Delhi NCR',
        address: 'Connaught Place, New Delhi',
        websiteStatus: 'NO_WEBSITE', // +25
        publicPhone: '+91-9876543210', // +20
        publicEmail: 'info@vanguardca.in', // +15
        leadStatus: 'APPROVED', // +15 demo_generated, +15 demo_approved
        opportunityScore: 90,
        opportunityReason: 'High priority lead',
        isDemoData: false,
        organizationId: orgA,
        source: 'Public Directory',
        websiteDemos: [
          {
            id: 'demo-2',
            leadId: 'score-lead-2',
            organizationId: orgA,
            templateId: 'MODERN_FINTECH',
            version: 1,
            generationStatus: 'COMPLETED',
            approvalStatus: 'APPROVED',
            theme: { id: 'executive-navy', name: 'Executive Navy', primaryColor: '#000', secondaryColor: '#111', accentColor: '#222', fontFamily: 'sans', style: 'corporate', borderRadius: 'md' },
            content: {} as any,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const scoreResult2 = calculateOperationalLeadScore(lead2);
      expect(scoreResult2.score).toBe(100);
      expect(scoreResult2.summary).toContain('High Opportunity');
    });
  });

  describe('3. RFC 4180 CSV Export', () => {
    it('generates valid CSV with headers and proper escaping', () => {
      const leads: LeadData[] = [
        {
          id: 'lead-csv-1',
          businessName: 'Sharma, Verma & Co.',
          profession: 'Chartered Accountant',
          city: 'Gurgaon',
          address: 'Building 10, DLF Phase 2',
          websiteStatus: 'NO_WEBSITE',
          leadStatus: 'CONTACTED',
          contactChannel: 'EMAIL',
          publicEmail: 'sharma@example.com',
          publicPhone: '+91-9999888877',
          opportunityScore: 85,
          opportunityReason: 'Target firm has verified NO_WEBSITE status.',
          source: 'User CSV, Import',
          isDemoData: false,
          organizationId: orgA,
          createdAt: '2026-03-01T10:00:00.000Z',
          updatedAt: '2026-03-05T12:00:00.000Z',
        },
      ];

      const csv = generateLeadsCsv(leads);
      const lines = csv.split('\r\n');
      expect(lines.length).toBe(2);

      // Check header
      expect(lines[0]).toBe(
        'ID,Business Name,Profession,City,Address,Website Status,Lead Status,Contact Channel,Public Email,Public Phone,Opportunity Score,Source,Created At,Updated At'
      );

      // Check proper escaping of comma in "Sharma, Verma & Co."
      expect(lines[1]).toContain('"Sharma, Verma & Co."');
      expect(lines[1]).toContain('"User CSV, Import"');
      expect(lines[1]).toContain('CONTACTED');
      expect(lines[1]).toContain('EMAIL');
    });
  });

  describe('4. Funnel Analytics, Multi-Tenancy & Breakdowns', () => {
    it('computes isolated funnel metrics and conversion rates for an organization', async () => {
      // Create test leads in orgA across different lifecycle stages
      const l1 = await LeadRepository.createLead(
        {
          businessName: 'Org A Firm 1',
          profession: 'Chartered Accountant',
          city: 'Gurgaon',
          address: 'Sec 44, Gurgaon',
          websiteStatus: 'NO_WEBSITE',
          leadStatus: 'NEW',
          publicEmail: 'firm1@test.com',
          publicPhone: '+91-1111111111',
          source: 'CSV Upload',
        },
        orgA,
        'Test Suite'
      );

      const l2 = await LeadRepository.createLead(
        {
          businessName: 'Org A Firm 2',
          profession: 'Chartered Accountant',
          city: 'Delhi',
          address: 'Connaught Place',
          websiteStatus: 'NO_WEBSITE',
          leadStatus: 'QUALIFIED',
          publicEmail: 'firm2@test.com',
          publicPhone: '+91-2222222222',
          source: 'CSV Upload',
        },
        orgA,
        'Test Suite'
      );

      const l3 = await LeadRepository.createLead(
        {
          businessName: 'Org A Firm 3',
          profession: 'Chartered Accountant',
          city: 'Gurgaon',
          address: 'Golf Course Road',
          websiteStatus: 'NO_WEBSITE',
          leadStatus: 'QUALIFIED',
          publicEmail: 'firm3@test.com',
          publicPhone: '+91-3333333333',
          source: 'Public Directory',
        },
        orgA,
        'Test Suite'
      );

      // Save demo for l3 and approve it
      const demo3 = await WebsiteDemoRepository.saveDemo(
        orgA,
        {
          id: `demo-${l3.id}`,
          leadId: l3.id,
          organizationId: orgA,
          templateId: 'MODERN_FINTECH',
          version: 1,
          generationStatus: 'COMPLETED',
          approvalStatus: 'APPROVED',
          theme: {
            id: 'executive-navy',
            name: 'Executive Navy',
            primaryColor: '#1e3a8a',
            secondaryColor: '#1e293b',
            accentColor: '#2563eb',
            fontFamily: 'sans',
            style: 'corporate',
            borderRadius: 'md',
          },
          content: {} as any,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );

      // Move l3 to APPROVED then CONTACTED via EMAIL
      await LeadRepository.updateLeadStatus(l3.id, 'APPROVED', orgA, 'Specialist');
      await LeadRepository.updateLeadStatus(l3.id, 'CONTACTED', orgA, 'Specialist', 'Contacted via Email', 'EMAIL');

      // Create a lead in orgB to test isolation
      await LeadRepository.createLead(
        {
          businessName: 'Org B Isolated CA',
          profession: 'Chartered Accountant',
          city: 'Mumbai',
          address: 'Nariman Point',
          websiteStatus: 'NO_WEBSITE',
          leadStatus: 'CONVERTED',
          source: 'Manual Entry',
        },
        orgB,
        'Test Suite'
      );

      // Compute analytics for orgA with ALL_TIME
      const analyticsA = await computeSalesAnalytics(orgA, { preset: 'ALL_TIME' });

      // OrgA should have exactly 3 leads (orgB's lead must NOT bleed in)
      expect(analyticsA.funnel.totalLeads).toBe(3);
      expect(analyticsA.funnel.contacted).toBe(1);

      // Rates check
      expect(analyticsA.rates.qualificationRate).toBeGreaterThan(0);
      expect(analyticsA.rates.contactRate).toBe(100.0); // 1 contacted of 1 approved
      expect(analyticsA.rates.overallLeadToCustomerRate).toBe(0); // None converted yet

      // Action Queue check
      expect(analyticsA.actionQueue).toBeDefined();

      // Channels breakdown check
      const emailChannel = analyticsA.channels.find((c) => c.name === 'Email Outreach');
      expect(emailChannel).toBeDefined();
      expect(emailChannel?.contacted).toBe(1);

      // Compute analytics for orgB
      const analyticsB = await computeSalesAnalytics(orgB, { preset: 'ALL_TIME' });
      expect(analyticsB.funnel.totalLeads).toBe(1);
      expect(analyticsB.funnel.converted).toBe(1);
      expect(analyticsB.rates.overallLeadToCustomerRate).toBe(100.0);
    });

    it('calculates lead aging and flags stale leads correctly', async () => {
      const orgAging = 'org-aging-test';

      const freshLead = await LeadRepository.createLead(
        {
          businessName: 'Fresh CA Firm',
          profession: 'Chartered Accountant',
          city: 'Gurgaon',
          address: 'Sec 15',
          websiteStatus: 'NO_WEBSITE',
          leadStatus: 'QUALIFIED',
        },
        orgAging,
        'Test Suite'
      );

      await LeadRepository.updateLeadStatus(freshLead.id, 'APPROVED', orgAging, 'Specialist');

      const analytics = await computeSalesAnalytics(orgAging, { preset: 'ALL_TIME' });
      const approvedAging = analytics.aging.find((b) => b.stage === 'APPROVED');

      expect(approvedAging).toBeDefined();
      expect(approvedAging?.count).toBe(1);
      expect(approvedAging?.averageDaysInStage).toBe(0);
      expect(approvedAging?.staleCount).toBe(0);
    });
  });
});
