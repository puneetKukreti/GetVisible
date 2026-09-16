import { describe, it, expect, beforeEach } from 'vitest';
import { LeadRepository, WebsiteDemoRepository } from '@/lib/db/repository';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';

describe('Leads Navigation, State Isolation & Route Parameter Resolution', () => {
  const testOrg = 'org-navigation-test';

  beforeEach(() => {
    process.env.DEMO_MODE = 'true';
  });

  it('proves that Lead A, Lead B, and Lead C resolve strictly to their own unique records', async () => {
    // 1. Create 3 distinct leads
    const leadA = await LeadRepository.createLead(
      {
        businessName: 'Alpha & Associates CA',
        profession: 'Chartered Accountant',
        city: 'Gurgaon',
        address: 'Tower A, DLF Cyber City, Gurgaon',
        publicPhone: '+91-124-1111111',
        publicEmail: 'alpha@example.com',
        websiteStatus: 'NO_WEBSITE',
        leadStatus: 'NEW',
      },
      testOrg,
      'Test Suite'
    );

    const leadB = await LeadRepository.createLead(
      {
        businessName: 'Beta Tax Consultants',
        profession: 'Chartered Accountant',
        city: 'Delhi NCR',
        address: 'Sector 62, Noida, Delhi NCR',
        publicPhone: '+91-11-2222222',
        publicEmail: 'beta@example.com',
        websiteStatus: 'NO_WEBSITE',
        leadStatus: 'QUALIFIED',
      },
      testOrg,
      'Test Suite'
    );

    const leadC = await LeadRepository.createLead(
      {
        businessName: 'Gamma Audit & Law Advisory',
        profession: 'Lawyer',
        city: 'Gurgaon',
        address: 'Golf Course Road, Gurgaon',
        publicPhone: '+91-124-3333333',
        publicEmail: 'gamma@example.com',
        websiteStatus: 'NO_WEBSITE',
        leadStatus: 'RESEARCHING',
      },
      testOrg,
      'Test Suite'
    );

    // Verify all IDs are unique
    expect(leadA.id).not.toBe(leadB.id);
    expect(leadB.id).not.toBe(leadC.id);
    expect(leadA.id).not.toBe(leadC.id);

    // 2. Click Lead A -> fetches /leads/leadA.id
    const retrievedA = await LeadRepository.getLeadById(leadA.id, testOrg);
    expect(retrievedA).not.toBeNull();
    expect(retrievedA?.id).toBe(leadA.id);
    expect(retrievedA?.businessName).toBe('Alpha & Associates CA');
    expect(retrievedA?.publicPhone).toBe('+91-124-1111111');

    // 3. Generate demo on Lead A
    const demoA = await WebsiteDemoGeneratorService.generateDemo(leadA, {
      organizationId: testOrg,
      version: 1,
    });
    await WebsiteDemoRepository.saveDemo(testOrg, demoA, 'Test Suite');

    // Verify Lead A now has demo
    const refreshedA = await LeadRepository.getLeadById(leadA.id, testOrg);
    expect(refreshedA?.websiteDemos?.length).toBe(1);

    // 4. Click Lead B -> fetches /leads/leadB.id (Must NOT return Lead A or demo from Lead A)
    const retrievedB = await LeadRepository.getLeadById(leadB.id, testOrg);
    expect(retrievedB).not.toBeNull();
    expect(retrievedB?.id).toBe(leadB.id);
    expect(retrievedB?.businessName).toBe('Beta Tax Consultants');
    expect(retrievedB?.publicPhone).toBe('+91-11-2222222');
    expect(retrievedB?.websiteDemos?.length).toBe(0); // Lead B has no demo

    // 5. Click Lead C -> fetches /leads/leadC.id
    const retrievedC = await LeadRepository.getLeadById(leadC.id, testOrg);
    expect(retrievedC).not.toBeNull();
    expect(retrievedC?.id).toBe(leadC.id);
    expect(retrievedC?.businessName).toBe('Gamma Audit & Law Advisory');
    expect(retrievedC?.publicPhone).toBe('+91-124-3333333');
    expect(retrievedC?.profession).toBe('Lawyer');

    // 6. Test arbitrary sequence: Lead A -> Lead C -> Lead B -> Lead A
    const sequenceTest = [leadA.id, leadC.id, leadB.id, leadA.id];
    const expectedNames = [
      'Alpha & Associates CA',
      'Gamma Audit & Law Advisory',
      'Beta Tax Consultants',
      'Alpha & Associates CA',
    ];

    for (let i = 0; i < sequenceTest.length; i++) {
      const targetId = sequenceTest[i];
      const result = await LeadRepository.getLeadById(targetId, testOrg);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(targetId);
      expect(result?.businessName).toBe(expectedNames[i]);
    }
  });

  it('guarantees that non-existent lead IDs return null rather than falling back to the first lead', async () => {
    const nonExistent = await LeadRepository.getLeadById('non-existent-id-99999', testOrg);
    expect(nonExistent).toBeNull();
  });

  it('verifies unique keys and IDs across all CRM leads in demo store', async () => {
    const res = await LeadRepository.listLeads(DEMO_ORGANIZATION_ID, { pageSize: 100 });
    const ids = res.leads.map((l) => l.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});
