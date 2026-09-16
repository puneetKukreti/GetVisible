import { describe, it, expect } from 'vitest';
import { LeadNormalizer } from '@/lib/discovery/normalizer';
import { DiscoveredBusinessRecord } from '@/lib/discovery/providers/types';

describe('LeadNormalizer (Preserving Raw Values & Quality Normalization)', () => {
  it('normalizes website URLs and computes canonical domains while preserving raw value', () => {
    const raw1 = 'HTTP://WWW.ABC-CA.EXAMPLE/';
    const result1 = LeadNormalizer.normalizeWebsite(raw1);
    expect(result1).not.toBeNull();
    expect(result1?.normalizedUrl).toBe('http://www.abc-ca.example');
    expect(result1?.canonicalDomain).toBe('abc-ca.example');

    const raw2 = 'demo-ca-practice.example/about/';
    const result2 = LeadNormalizer.normalizeWebsite(raw2);
    expect(result2?.normalizedUrl).toBe('https://demo-ca-practice.example/about');
    expect(result2?.canonicalDomain).toBe('demo-ca-practice.example');
  });

  it('normalizes email casing and trims whitespace', () => {
    expect(LeadNormalizer.normalizeEmail('   PARTNER@ABC-CA.EXAMPLE  ')).toBe('partner@abc-ca.example');
    expect(LeadNormalizer.normalizeEmail('invalid-email-address')).toBeNull();
  });

  it('normalizes Indian phone numbers without guessing missing digits', () => {
    // 10 digits
    expect(LeadNormalizer.normalizePhone('9815550101')).toBe('+91-98155-50101');
    // Gurgaon STD landline (0124)
    expect(LeadNormalizer.normalizePhone('01245550101')).toBe('+91-124-5550101');
    // Already with +91
    expect(LeadNormalizer.normalizePhone('+91 124 555 0102')).toBe('+91-124-5550102');
    // Short incomplete number: preserved without hallucination
    expect(LeadNormalizer.normalizePhone('12345')).toBe('12345');
  });

  it('normalizes legal firm suffixes and extra whitespace in business names', () => {
    expect(
      LeadNormalizer.normalizeBusinessName('  ABC   &   Associates   Chartered  Accountants  ')
    ).toBe('ABC & Associates Chartered Accountants');

    expect(LeadNormalizer.normalizeBusinessName('Tax Solutions pvt.  ltd.')).toBe(
      'Tax Solutions Pvt. Ltd.'
    );
  });

  it('normalizes city aliases to standard names while preserving distinct cities and regions', () => {
    expect(LeadNormalizer.normalizeCity('Gurugram')).toBe('Gurgaon');
    expect(LeadNormalizer.normalizeCity('gurgaon')).toBe('Gurgaon');
    expect(LeadNormalizer.normalizeCity('New Delhi')).toBe('New Delhi');
    expect(LeadNormalizer.getRegionForCity('New Delhi')).toBe('Delhi NCR');
    expect(LeadNormalizer.getRegionForCity('Gurgaon')).toBe('Delhi NCR');
    expect(LeadNormalizer.normalizeCity('Mumbai')).toBe('Mumbai');
    expect(LeadNormalizer.getRegionForCity('Mumbai')).toBe('Maharashtra');
  });

  it('preserves rawValue alongside normalizedValue and source provenance in full entity', () => {
    const record: DiscoveredBusinessRecord = {
      sourceRecordId: 'test-rec-1',
      businessName: 'ABC & Co. Chartered Accountants',
      profession: 'Chartered Accountant',
      city: 'Gurugram',
      address: 'Suite 10, DLF Phase 2, Gurugram',
      website: 'HTTP://WWW.ABC-CA.EXAMPLE/',
      publicEmail: 'CONTACT@ABC-CA.EXAMPLE',
      publicPhone: '01245550199',
      source: 'Verified Directory',
      sourceUrl: 'https://directory.example/abc',
      sourceQuality: 'PUBLIC_BUSINESS_DIRECTORY',
      isDemoData: false,
    };

    const normalized = LeadNormalizer.normalize(record);

    // Business Name provenance
    expect(normalized.businessName.rawValue).toBe('ABC & Co. Chartered Accountants');
    expect(normalized.businessName.normalizedValue).toBe('ABC & Co. Chartered Accountants');
    expect(normalized.businessName.source).toBe('Verified Directory');

    // City provenance
    expect(normalized.city.rawValue).toBe('Gurugram');
    expect(normalized.city.normalizedValue).toBe('Gurgaon');

    // Website provenance
    expect(normalized.website?.rawValue).toBe('HTTP://WWW.ABC-CA.EXAMPLE/');
    expect(normalized.website?.normalizedValue).toBe('http://www.abc-ca.example');
    expect(normalized.website?.canonicalDomain).toBe('abc-ca.example');

    // Email provenance
    expect(normalized.publicEmail?.rawValue).toBe('CONTACT@ABC-CA.EXAMPLE');
    expect(normalized.publicEmail?.normalizedValue).toBe('contact@abc-ca.example');

    // Phone provenance
    expect(normalized.publicPhone?.rawValue).toBe('01245550199');
    expect(normalized.publicPhone?.normalizedValue).toBe('+91-124-5550199');
  });
});
