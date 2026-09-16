import { describe, it, expect } from 'vitest';
import { DuplicateDetector } from '@/lib/discovery/deduplicator';
import { LeadNormalizer } from '@/lib/discovery/normalizer';
import { LeadData } from '@/types';

describe('DuplicateDetector (High-Confidence Skipping vs POSSIBLE_DUPLICATE Review)', () => {
  const existingLeads: LeadData[] = [
    {
      id: 'lead-existing-1',
      businessName: 'Apex Chartered Accountants',
      profession: 'Chartered Accountant',
      city: 'Gurgaon',
      address: 'DLF Cyber City, Sector 24',
      website: 'https://apex-ca.example',
      publicEmail: 'office@apex-ca.example',
      publicPhone: '+91-124-5550111',
      source: 'Directory',
      websiteStatus: 'WEBSITE_EXISTS',
      leadStatus: 'QUALIFIED',
      opportunityScore: 70,
      opportunityReason: 'Test',
      isDemoData: false,
      organizationId: 'org-test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('detects high-confidence duplicate by exact canonical website domain', () => {
    const candidate = LeadNormalizer.normalize({
      sourceRecordId: 'new-1',
      businessName: 'Different Name But Same Domain',
      profession: 'Chartered Accountant',
      city: 'Gurgaon',
      address: 'Sector 44',
      website: 'http://www.apex-ca.example/contact/',
      source: 'CSV',
      sourceUrl: 'https://test.example',
      sourceQuality: 'USER_IMPORTED',
      isDemoData: false,
    });

    const result = DuplicateDetector.check(candidate, existingLeads);
    expect(result.isDuplicate).toBe(true);
    expect(result.confidence).toBe('HIGH');
    expect(result.reason).toContain('Exact canonical website domain match');
    expect(result.matchedLeadId).toBe('lead-existing-1');
  });

  it('detects high-confidence duplicate by public business email', () => {
    const candidate = LeadNormalizer.normalize({
      sourceRecordId: 'new-2',
      businessName: 'Apex Tax Partners',
      profession: 'Chartered Accountant',
      city: 'Gurgaon',
      address: 'Different Address',
      website: null,
      publicEmail: 'office@apex-ca.example',
      source: 'CSV',
      sourceUrl: 'https://test.example',
      sourceQuality: 'USER_IMPORTED',
      isDemoData: false,
    });

    const result = DuplicateDetector.check(candidate, existingLeads);
    expect(result.isDuplicate).toBe(true);
    expect(result.confidence).toBe('HIGH');
    expect(result.reason).toContain('Exact public business email match');
  });

  it('detects high-confidence duplicate by exact business name and city', () => {
    const candidate = LeadNormalizer.normalize({
      sourceRecordId: 'new-3',
      businessName: 'Apex Chartered Accountants',
      profession: 'Chartered Accountant',
      city: 'Gurgaon',
      address: 'Another address',
      source: 'CSV',
      sourceUrl: 'https://test.example',
      sourceQuality: 'USER_IMPORTED',
      isDemoData: false,
    });

    const result = DuplicateDetector.check(candidate, existingLeads);
    expect(result.isDuplicate).toBe(true);
    expect(result.confidence).toBe('HIGH');
    expect(result.reason).toContain('Exact business name and city match');
  });

  it('does NOT auto-merge uncertain similarity: flags as POSSIBLE_DUPLICATE for human review', () => {
    const candidate = LeadNormalizer.normalize({
      sourceRecordId: 'new-4',
      businessName: 'Apex Chartered Accountants & Associates',
      profession: 'Chartered Accountant',
      city: 'Gurgaon',
      address: 'Sector 54, Golf Course Road',
      website: 'https://apex-associates.example',
      publicEmail: 'team@apex-associates.example',
      source: 'CSV',
      sourceUrl: 'https://test.example',
      sourceQuality: 'USER_IMPORTED',
      isDemoData: false,
    });

    const result = DuplicateDetector.check(candidate, existingLeads);
    // Should NOT be auto-skipped as duplicate
    expect(result.isDuplicate).toBe(false);
    // Should be flagged for human review
    expect(result.isPossibleDuplicate).toBe(true);
    expect(result.confidence).toBe('UNCERTAIN');
    expect(result.reason).toContain('Possible duplicate');
    expect(result.reason).toContain('Flagged for human review');
  });

  it('allows completely unique firm records to pass cleanly', () => {
    const candidate = LeadNormalizer.normalize({
      sourceRecordId: 'new-5',
      businessName: 'Sterling Tax Advisors',
      profession: 'Chartered Accountant',
      city: 'Gurgaon',
      address: 'Udyog Vihar',
      website: 'https://sterling-tax.example',
      publicEmail: 'info@sterling-tax.example',
      source: 'CSV',
      sourceUrl: 'https://test.example',
      sourceQuality: 'USER_IMPORTED',
      isDemoData: false,
    });

    const result = DuplicateDetector.check(candidate, existingLeads);
    expect(result.isDuplicate).toBe(false);
    expect(result.isPossibleDuplicate).toBe(false);
    expect(result.confidence).toBe('NONE');
  });

  it('does NOT falsely collide businesses with the same name in the same city if professions differ', () => {
    // Existing lead: "Apex Chartered Accountants" (Chartered Accountant) in Gurgaon
    const dentistCandidate = LeadNormalizer.normalize({
      sourceRecordId: 'new-dentist',
      businessName: 'Apex Dental Care',
      profession: 'Dentist',
      city: 'Gurgaon',
      address: 'Sector 44 Institutional Area',
      website: 'https://apex-dental.example',
      publicEmail: 'smile@apex-dental.example',
      source: 'CSV',
      sourceUrl: 'https://test.example',
      sourceQuality: 'USER_IMPORTED',
      isDemoData: false,
    });

    const result = DuplicateDetector.check(dentistCandidate, existingLeads);
    expect(result.isDuplicate).toBe(false);
    expect(result.isPossibleDuplicate).toBe(false);
  });

  it('recognizes Gurugram and Gurgaon as equivalent locations for deduplication', () => {
    const candidate = LeadNormalizer.normalize({
      sourceRecordId: 'new-gurugram',
      businessName: 'Apex Chartered Accountants',
      profession: 'Chartered Accountant',
      city: 'Gurugram', // Gurugram instead of Gurgaon
      address: 'DLF Cyber City',
      source: 'CSV',
      sourceUrl: 'https://test.example',
      sourceQuality: 'USER_IMPORTED',
      isDemoData: false,
    });

    const result = DuplicateDetector.check(candidate, existingLeads);
    expect(result.isDuplicate).toBe(true);
    expect(result.confidence).toBe('HIGH');
  });
});
