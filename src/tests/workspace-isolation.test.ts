import { describe, it, expect, beforeEach } from 'vitest';
import { LeadRepository, WebsiteDemoRepository } from '@/lib/db/repository';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';
import { PILOT_ORGANIZATION_ID } from '@/lib/workspace';
import { computeSalesAnalytics, generateLeadsCsv } from '@/lib/analytics/service';

describe('Workspace & Data Isolation: Demo Mode vs Real Pilot Workspace', () => {
  const TEST_PILOT_ORG = `org-pilot-test-${Date.now()}`;

  beforeEach(() => {
    process.env.DEMO_MODE = 'true';
  });

  // Criterion 1: Demo records are visible in demo workspace
  it('1. Demo records are visible in demo workspace', async () => {
    const demoLeads = await LeadRepository.listLeads(DEMO_ORGANIZATION_ID);
    expect(demoLeads.total).toBeGreaterThan(0);
    expect(demoLeads.leads.length).toBeGreaterThan(0);

    // Every record in demo workspace is marked as demo data
    const allDemoMarked = demoLeads.leads.every(
      (lead) => lead.isDemoData === true && lead.organizationId === DEMO_ORGANIZATION_ID
    );
    expect(allDemoMarked).toBe(true);

    // Demo website demos are visible
    const demoDemos = await WebsiteDemoRepository.listDemos(DEMO_ORGANIZATION_ID);
    expect(demoDemos.length).toBeGreaterThan(0);
  });

  // Criterion 2: Demo records are NOT visible in real pilot workspace
  it('2. Demo records are NOT visible in real pilot workspace', async () => {
    // Check initial state of a pilot organization
    const pilotLeads = await LeadRepository.listLeads(TEST_PILOT_ORG);
    expect(pilotLeads.total).toBe(0);
    expect(pilotLeads.leads).toEqual([]);

    // Check demos in pilot organization
    const pilotDemos = await WebsiteDemoRepository.listDemos(TEST_PILOT_ORG);
    expect(pilotDemos).toEqual([]);

    // Check audit logs in pilot organization
    const pilotLogs = await LeadRepository.getAuditLogs(TEST_PILOT_ORG);
    expect(pilotLogs).toEqual([]);
  });

  // Criterion 3: Real records are NOT visible in demo workspace
  it('3. Real prospect records created in pilot workspace are NOT visible in demo workspace', async () => {
    const initialDemoCount = (await LeadRepository.listLeads(DEMO_ORGANIZATION_ID)).total;

    // Create a real prospect lead in the pilot workspace
    const realProspect = await LeadRepository.createLead(
      {
        businessName: 'Apex Tax & Corporate Advisors LLP',
        profession: 'Chartered Accountant',
        city: 'Gurgaon',
        address: 'Golf Course Road, Sector 54, Gurgaon',
        publicEmail: 'contact@apextax.in',
        publicPhone: '+91-124-4900100',
        source: 'Client Inbound Pilot CSV',
        opportunityScore: 92,
        leadStatus: 'NEW',
        websiteStatus: 'NO_WEBSITE',
        isDemoData: false,
      },
      TEST_PILOT_ORG,
      'Pilot Sales Specialist'
    );

    expect(realProspect.id).toBeDefined();
    expect(realProspect.organizationId).toBe(TEST_PILOT_ORG);
    expect(realProspect.isDemoData).toBe(false);

    // Verify it appears in the pilot organization
    const pilotLeads = await LeadRepository.listLeads(TEST_PILOT_ORG);
    expect(pilotLeads.total).toBe(1);
    expect(pilotLeads.leads[0].id).toBe(realProspect.id);
    expect(pilotLeads.leads[0].businessName).toBe('Apex Tax & Corporate Advisors LLP');

    // Crucial: Verify demo workspace count did NOT increase, and the real lead is NOT accessible in demo org
    const demoLeads = await LeadRepository.listLeads(DEMO_ORGANIZATION_ID);
    expect(demoLeads.total).toBe(initialDemoCount);
    expect(demoLeads.leads.some((l) => l.id === realProspect.id)).toBe(false);
    expect(demoLeads.leads.some((l) => l.businessName === 'Apex Tax & Corporate Advisors LLP')).toBe(false);

    // Direct fetch by ID with demo org ID must fail
    const fetchedFromDemo = await LeadRepository.getLeadById(realProspect.id, DEMO_ORGANIZATION_ID);
    expect(fetchedFromDemo).toBeNull();
  });

  // Criterion 4: Demo analytics do NOT contaminate real pilot analytics
  it('4. Demo analytics do NOT contaminate real pilot analytics', async () => {
    const pilotOrgForAnalytics = `org-pilot-analytics-${Date.now()}`;

    // Fresh pilot organization analytics must report ZERO activity across all funnel metrics
    const initialPilotAnalytics = await computeSalesAnalytics(pilotOrgForAnalytics);
    expect(initialPilotAnalytics.funnel.totalLeads).toBe(0);
    expect(initialPilotAnalytics.funnel.qualified).toBe(0);
    expect(initialPilotAnalytics.funnel.demosGenerated).toBe(0);
    expect(initialPilotAnalytics.funnel.demosApproved).toBe(0);
    expect(initialPilotAnalytics.funnel.contacted).toBe(0);
    expect(initialPilotAnalytics.funnel.responded).toBe(0);
    expect(initialPilotAnalytics.funnel.interested).toBe(0);
    expect(initialPilotAnalytics.funnel.converted).toBe(0);
    expect(initialPilotAnalytics.rates.overallLeadToCustomerRate).toBe(0);
    expect(initialPilotAnalytics.rates.conversionRate).toBe(0);

    // Demo organization analytics must reflect existing demo data
    const demoAnalytics = await computeSalesAnalytics(DEMO_ORGANIZATION_ID);
    expect(demoAnalytics.funnel.totalLeads).toBeGreaterThan(0);

    // Now create a lead in pilot org, qualify it, approve demo, contact, convert
    const lead = await LeadRepository.createLead(
      {
        businessName: 'Real CA Partners',
        opportunityScore: 85,
        leadStatus: 'QUALIFIED',
        isDemoData: false,
      },
      pilotOrgForAnalytics,
      'Pilot Specialist'
    );

    // Pilot analytics now reflects 1 lead
    const updatedPilotAnalytics = await computeSalesAnalytics(pilotOrgForAnalytics);
    expect(updatedPilotAnalytics.funnel.totalLeads).toBe(1);
    expect(updatedPilotAnalytics.funnel.qualified).toBe(1);

    // Demo analytics totalLeads remains completely independent
    const finalDemoAnalytics = await computeSalesAnalytics(DEMO_ORGANIZATION_ID);
    expect(finalDemoAnalytics.funnel.totalLeads).toBe(demoAnalytics.funnel.totalLeads);
  });

  // Criterion 5: Demo CSV export does NOT contain real records
  it('5. Demo CSV export does NOT contain real prospect records', async () => {
    const pilotOrgForCsv = `org-pilot-csv-${Date.now()}`;

    // Create real prospect
    await LeadRepository.createLead(
      {
        businessName: 'Real Confidential Client CA Firm',
        publicEmail: 'confidential@realclient.in',
        opportunityScore: 95,
        isDemoData: false,
      },
      pilotOrgForCsv,
      'Pilot Specialist'
    );

    // Export demo leads
    const demoResults = await LeadRepository.listLeads(DEMO_ORGANIZATION_ID, { pageSize: 1000 });
    const demoCsv = generateLeadsCsv(demoResults.leads);

    expect(demoCsv).toContain('Business Name');
    expect(demoCsv).not.toContain('Real Confidential Client CA Firm');
    expect(demoCsv).not.toContain('confidential@realclient.in');
  });

  // Criterion 6: Real CSV export does NOT contain demo records
  it('6. Real CSV export does NOT contain demo records', async () => {
    const pilotOrgForCsv = `org-pilot-csv-2-${Date.now()}`;

    // Create real prospect in pilot org
    const realLead = await LeadRepository.createLead(
      {
        businessName: 'Pilot Spectrum Audit & Advisory',
        publicEmail: 'audit@spectrumpilot.in',
        opportunityScore: 90,
        isDemoData: false,
      },
      pilotOrgForCsv,
      'Pilot Specialist'
    );

    // Export pilot leads
    const pilotResults = await LeadRepository.listLeads(pilotOrgForCsv, { pageSize: 1000 });
    const pilotCsv = generateLeadsCsv(pilotResults.leads);

    expect(pilotCsv).toContain('Business Name');
    expect(pilotCsv).toContain('Pilot Spectrum Audit & Advisory');
    expect(pilotCsv).toContain('audit@spectrumpilot.in');

    // Demo firm names must NOT appear in pilot CSV
    expect(pilotCsv).not.toContain('Demo CA Firm 01');
    expect(pilotCsv).not.toContain('Example Accounting Services');
    expect(pilotCsv).not.toContain('org-demo-gurgaon');
    expect(pilotCsv).not.toContain('demo-lead-');
  });
});
