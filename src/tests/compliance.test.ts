import { describe, it, expect } from 'vitest';
import { checkOutreachEligibility } from '@/lib/compliance';
import { LeadData, Channel, SuppressionRecordData, ConsentRecordData } from '@/types';

describe('Compliance & Anti-Spam Safeguards', () => {
  const baseLead: LeadData = {
    id: 'test-lead-1',
    businessName: 'Example CA Firm',
    profession: 'Chartered Accountant',
    city: 'Gurgaon',
    address: 'DLF Cyber City',
    websiteStatus: 'WEBSITE_EXISTS',
    leadStatus: 'QUALIFIED',
    opportunityScore: 85,
    opportunityReason: 'Test opportunity',
    isDemoData: true,
    organizationId: 'org-test-1',
    source: 'Test',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('rejects outbound outreach when human approval is missing', () => {
    const result = checkOutreachEligibility(baseLead, 'EMAIL', false);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Human approval is mandatory');
  });

  it('strictly blocks leads marked as DO_NOT_CONTACT even if humanApproved is true', () => {
    const dncLead: LeadData = { ...baseLead, leadStatus: 'DO_NOT_CONTACT' };
    const result = checkOutreachEligibility(dncLead, 'EMAIL', true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('explicit DO_NOT_CONTACT status');
  });

  it('blocks communication on channels with active suppression records', () => {
    const suppressions: SuppressionRecordData[] = [
      {
        id: 'supp-1',
        leadId: 'test-lead-1',
        organizationId: 'org-test-1',
        channel: 'EMAIL',
        reason: 'Partner requested email opt-out',
        createdAt: new Date().toISOString(),
      },
    ];

    const emailCheck = checkOutreachEligibility(baseLead, 'EMAIL', true, suppressions);
    expect(emailCheck.allowed).toBe(false);
    expect(emailCheck.reason).toContain('suppression list');

    // Other non-suppressed channels with human approval should pass
    const phoneCheck = checkOutreachEligibility(baseLead, 'VOICE', true, suppressions);
    expect(phoneCheck.allowed).toBe(true);
  });

  it('blocks communication if consent is explicitly OPTED_OUT', () => {
    const consents: ConsentRecordData[] = [
      {
        id: 'consent-1',
        leadId: 'test-lead-1',
        organizationId: 'org-test-1',
        channel: 'EMAIL',
        status: 'OPTED_OUT',
        source: 'Email Reply',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const result = checkOutreachEligibility(baseLead, 'EMAIL', true, [], consents);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('OPTED_OUT');
  });
});
