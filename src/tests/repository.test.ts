import { describe, it, expect, beforeEach } from 'vitest';
import { LeadRepository } from '@/lib/db/repository';
import { DEMO_ORGANIZATION_ID, INITIAL_DEMO_LEADS } from '@/lib/db/demo-data';

describe('LeadRepository Multi-Tenancy & Integrity', () => {
  beforeEach(() => {
    process.env.DEMO_MODE = 'true';
  });

  it('enforces that all initial demo leads are explicitly marked isDemoData = true', () => {
    for (const lead of INITIAL_DEMO_LEADS) {
      expect(lead.isDemoData).toBe(true);
      expect(lead.businessName).toMatch(/Demo|Example|Mock|Sample|Fictional|Test/);
      if (lead.website) {
        expect(lead.website).toContain('.example');
      }
      if (lead.publicEmail) {
        expect(lead.publicEmail).toContain('.example');
      }
    }
  });

  it('enforces multi-tenant data isolation between organizations', async () => {
    // Org A (Demo organization) has records
    const orgALeads = await LeadRepository.listLeads(DEMO_ORGANIZATION_ID);
    expect(orgALeads.total).toBeGreaterThan(0);

    // Unrelated Org B should have zero access to Org A records
    const orgBLeads = await LeadRepository.listLeads('org-separate-tenant-b');
    expect(orgBLeads.total).toBe(0);
    expect(orgBLeads.leads).toEqual([]);
  });

  it('performs deterministic filtering and sorting without AI', async () => {
    // Filter by leadStatus: QUALIFIED
    const qualified = await LeadRepository.listLeads(DEMO_ORGANIZATION_ID, {
      leadStatus: 'QUALIFIED',
    });
    expect(qualified.leads.every((l) => l.leadStatus === 'QUALIFIED')).toBe(true);

    // Search by text: Cyber City
    const cyberCity = await LeadRepository.listLeads(DEMO_ORGANIZATION_ID, {
      search: 'Cyber City',
    });
    expect(cyberCity.leads.length).toBeGreaterThan(0);

    // Sort by opportunityScore desc
    const sorted = await LeadRepository.listLeads(DEMO_ORGANIZATION_ID, {
      sortBy: 'opportunityScore',
      sortOrder: 'desc',
    });
    for (let i = 0; i < sorted.leads.length - 1; i++) {
      expect(sorted.leads[i].opportunityScore).toBeGreaterThanOrEqual(sorted.leads[i + 1].opportunityScore);
    }
  });

  it('creates automatic multi-channel suppression records when status is updated to DO_NOT_CONTACT', async () => {
    // Create a new lead
    const newLead = await LeadRepository.createLead(
      {
        businessName: 'Demo Test Firm for DNC',
        city: 'Gurgaon',
        address: 'Sector 29',
        opportunityReason: 'Test qualification',
      },
      DEMO_ORGANIZATION_ID,
      'Test Runner'
    );

    // Update status to DO_NOT_CONTACT
    const updated = await LeadRepository.updateLeadStatus(
      newLead.id,
      'DO_NOT_CONTACT',
      DEMO_ORGANIZATION_ID,
      'Compliance Officer',
      'Explicit DNC request'
    );

    expect(updated.leadStatus).toBe('DO_NOT_CONTACT');

    // Fetch lead details and verify suppression records were created
    const refreshed = await LeadRepository.getLeadById(newLead.id, DEMO_ORGANIZATION_ID);
    expect(refreshed?.suppressionRecords?.length).toBeGreaterThanOrEqual(4); // EMAIL, WHATSAPP, SMS, VOICE
  });

  it('calculates real database metrics deterministically', async () => {
    const metrics = await LeadRepository.getDashboardMetrics(DEMO_ORGANIZATION_ID);
    expect(metrics.totalLeads).toBeGreaterThan(0);
    expect(metrics.newLeads + metrics.qualifiedLeads + metrics.demos).toBeGreaterThanOrEqual(0);
    expect(metrics.activeJobsCount).toBeGreaterThanOrEqual(0);
  });
});
