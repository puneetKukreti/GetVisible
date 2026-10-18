import { describe, it, expect, beforeEach } from 'vitest';
import { LeadRepository, WebsiteDemoRepository } from '@/lib/db/repository';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import { validateStatusTransition } from '@/lib/sales/lifecycle';
import { POST as requestChangesHandler } from '@/app/api/demos/[id]/request-changes/route';
import { NextRequest } from 'next/server';

describe('Public Demo Conversion Bar & Request Changes Feature', () => {
  const testOrg = 'org-conversion-test';

  beforeEach(() => {
    process.env.DEMO_MODE = 'true';
  });

  it('allows transition to INTERESTED from DEMO_GENERATED, APPROVED, and OUTREACH_PENDING', () => {
    expect(validateStatusTransition('DEMO_GENERATED', 'INTERESTED').valid).toBe(true);
    expect(validateStatusTransition('APPROVED', 'INTERESTED').valid).toBe(true);
    expect(validateStatusTransition('OUTREACH_PENDING', 'INTERESTED').valid).toBe(true);
    expect(validateStatusTransition('CONTACTED', 'INTERESTED').valid).toBe(true);
    expect(validateStatusTransition('RESPONDED', 'INTERESTED').valid).toBe(true);
  });

  it('updates lead status to INTERESTED and records activity when prospect requests free changes', async () => {
    // 1. Create a qualified lead
    const lead = await LeadRepository.createLead(
      {
        businessName: 'Sharma & Associates CA',
        profession: 'Chartered Accountant',
        city: 'Gurgaon',
        address: 'Sector 44 Institutional Area, Gurgaon',
        websiteStatus: 'NO_WEBSITE',
        leadStatus: 'QUALIFIED',
      },
      testOrg,
      'Test Suite'
    );

    // 2. Generate and approve a website demo
    const demo = await WebsiteDemoGeneratorService.generateDemo(lead, {
      organizationId: testOrg,
      layout: 'MODERN_INDIAN',
    });
    await WebsiteDemoRepository.saveDemo(testOrg, demo, 'test-system');

    const approveResult = await WebsiteDemoRepository.approveDemo(testOrg, demo.id, 'Puneet Kukreti');
    const approved = approveResult.demo;
    expect(approved.publicToken).toBeDefined();

    // 3. Simulate prospect calling the request-changes API using publicToken
    const request = new NextRequest(
      `http://localhost:3000/api/demos/${approved.publicToken}/request-changes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changes: ['Change colors & styling', 'Update services & practice areas', 'Call me at preferred time'],
          callTime: 'Tomorrow at 11:30 AM',
          phone: '+91-9811122233',
          notes: 'Please highlight corporate tax audit and GST advisory services.',
        }),
      }
    );

    const res = await requestChangesHandler(request, {
      params: Promise.resolve({ id: approved.publicToken! }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.status).toBe('INTERESTED');

    // 4. Verify in LeadRepository that the lead status is now INTERESTED
    const updatedLead = await LeadRepository.getLeadById(lead.id, testOrg);
    expect(updatedLead?.leadStatus).toBe('INTERESTED');

    // 5. Verify activity history records the prospect interaction
    const activities = updatedLead?.activities || [];
    const changeActivity = activities.find(
      (a) => a.type === 'PROSPECT_REQUESTED_CHANGES' || a.title.includes('Prospect Requested')
    );
    expect(changeActivity).toBeDefined();
    expect(changeActivity?.description).toContain('Tomorrow at 11:30 AM');
    expect(changeActivity?.description).toContain('+91-9811122233');
  });

  // A public form must never resurrect a suppressed/closed lead. The prospect UI
  // hides the form for these leads, so a hit is a stale page (or abuse).
  it('revokes the public link when the lead is suppressed', async () => {
    const lead = await LeadRepository.createLead(
      {
        businessName: 'Suppressed Prospect & Co',
        profession: 'Chartered Accountant',
        city: 'Gurgaon',
        address: 'Sector 14, Gurgaon',
        websiteStatus: 'NO_WEBSITE',
        leadStatus: 'QUALIFIED',
      },
      testOrg,
      'Test Suite'
    );

    const demo = await WebsiteDemoGeneratorService.generateDemo(lead, {
      organizationId: testOrg,
      layout: 'MODERN_INDIAN',
    });
    await WebsiteDemoRepository.saveDemo(testOrg, demo, 'test-system');
    const approved = (await WebsiteDemoRepository.approveDemo(testOrg, demo.id, 'Puneet Kukreti'))
      .demo;

    // Operator suppresses the lead: suppression also revokes the public concept.
    await LeadRepository.updateLeadStatus(
      lead.id,
      'DO_NOT_CONTACT',
      testOrg,
      'Test Suite',
      'Requested no contact'
    );

    const res = await requestChangesHandler(
      new NextRequest(
        `http://localhost:3000/api/demos/${approved.publicToken}/request-changes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changes: ['Change colors & styling'] }),
        }
      ),
      { params: Promise.resolve({ id: approved.publicToken! }) }
    );

    // The public token no longer resolves, so the link is dead.
    expect(res.status).toBe(404);

    const reloaded = await LeadRepository.getLeadById(lead.id, testOrg);
    expect(reloaded?.leadStatus).toBe('DO_NOT_CONTACT');
  });

  it('records the request but does not downgrade a customer to INTERESTED', async () => {
    const lead = await LeadRepository.createLead(
      {
        businessName: 'Paying Client Advisory',
        profession: 'Chartered Accountant',
        city: 'Gurgaon',
        address: 'Cyber City, Gurgaon',
        websiteStatus: 'NO_WEBSITE',
        leadStatus: 'QUALIFIED',
      },
      testOrg,
      'Test Suite'
    );

    const demo = await WebsiteDemoGeneratorService.generateDemo(lead, {
      organizationId: testOrg,
      layout: 'MODERN_INDIAN',
    });
    await WebsiteDemoRepository.saveDemo(testOrg, demo, 'test-system');
    const approved = (await WebsiteDemoRepository.approveDemo(testOrg, demo.id, 'Puneet Kukreti'))
      .demo;

    // Walk the lead to CUSTOMER. These statuses do NOT revoke the demo, so the
    // prospect link is still live when the stale form is submitted.
    await LeadRepository.updateLeadStatus(lead.id, 'CONTACTED', testOrg, 'Test Suite');
    await LeadRepository.updateLeadStatus(lead.id, 'RESPONDED', testOrg, 'Test Suite');
    await LeadRepository.updateLeadStatus(lead.id, 'CUSTOMER', testOrg, 'Test Suite');

    const res = await requestChangesHandler(
      new NextRequest(
        `http://localhost:3000/api/demos/${approved.publicToken}/request-changes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changes: ['Update services & practice areas'], notes: 'New GST page' }),
        }
      ),
      { params: Promise.resolve({ id: approved.publicToken! }) }
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    // Reported as CUSTOMER (not downgraded), and the request is still recorded.
    expect(data.status).toBe('CUSTOMER');

    const reloaded = await LeadRepository.getLeadById(lead.id, testOrg);
    expect(reloaded?.leadStatus).toBe('CUSTOMER');
    const requested = (reloaded?.activities || []).find(
      (a) => a.type === 'PROSPECT_REQUESTED_CHANGES'
    );
    expect(requested).toBeDefined();
    expect(requested?.description).toContain('New GST page');
  });
});
