import { describe, it, expect } from 'vitest';
import { LeadQualityValidator } from '@/lib/discovery/validator';
import { LeadNormalizer } from '@/lib/discovery/normalizer';

describe('LeadQualityValidator & Contact Classification', () => {
  it('validates legitimate CA lead records with meaningful identifiers', () => {
    const entity = LeadNormalizer.normalize({
      sourceRecordId: 'valid-1',
      businessName: 'Chartered Associates & Co.',
      profession: 'Chartered Accountant',
      city: 'Gurgaon',
      address: 'Sector 44 Institutional Area, Gurgaon',
      website: 'https://chartered-assoc.example',
      publicEmail: 'contact@chartered-assoc.example',
      publicPhone: '+91-124-5550300',
      source: 'Verified Directory',
      sourceUrl: 'https://directory.example/record',
      sourceQuality: 'PUBLIC_BUSINESS_DIRECTORY',
      isDemoData: false,
    });

    const result = LeadQualityValidator.validate(entity);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects garbage records with missing business name or location', () => {
    const missingName = LeadNormalizer.normalize({
      sourceRecordId: 'invalid-1',
      businessName: '',
      profession: 'Chartered Accountant',
      city: 'Gurgaon',
      address: 'Sector 29',
      source: 'Directory',
      sourceUrl: 'https://test.example',
      sourceQuality: 'USER_IMPORTED',
      isDemoData: false,
    });

    const result1 = LeadQualityValidator.validate(missingName);
    expect(result1.valid).toBe(false);
    expect(result1.errors).toContain('Missing or invalid business name.');

    const missingCity = LeadNormalizer.normalize({
      sourceRecordId: 'invalid-2',
      businessName: 'Test Firm',
      profession: 'Chartered Accountant',
      city: '',
      address: '',
      source: 'Directory',
      sourceUrl: 'https://test.example',
      sourceQuality: 'USER_IMPORTED',
      isDemoData: false,
    });

    // city defaults to Gurgaon in normalizer if completely empty, but if address and identifiers are empty:
    missingCity.city.normalizedValue = '';
    const result2 = LeadQualityValidator.validate(missingCity);
    expect(result2.valid).toBe(false);
    expect(result2.errors.some((e) => e.includes('location'))).toBe(true);
  });

  it('rejects garbage records that lack any meaningful business identifier', () => {
    const entity = LeadNormalizer.normalize({
      sourceRecordId: 'no-identifiers',
      businessName: 'Phantom Accounting',
      profession: 'Chartered Accountant',
      city: 'Gurgaon',
      address: 'Unknown',
      website: null,
      publicEmail: null,
      publicPhone: null,
      source: 'Directory',
      sourceUrl: 'https://test.example',
      sourceQuality: 'USER_IMPORTED',
      isDemoData: false,
    });

    const result = LeadQualityValidator.validate(entity);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('No meaningful business identifier found'))).toBe(true);
  });

  it('classifies public business email vs personal contact without implying marketing consent', () => {
    // Official public firm email
    expect(LeadQualityValidator.classifyEmail('contact@firm-ca.example')).toBe('PUBLIC_BUSINESS_EMAIL');
    expect(LeadQualityValidator.classifyEmail('info@firm-ca.example')).toBe('PUBLIC_BUSINESS_EMAIL');
    expect(LeadQualityValidator.classifyEmail('tax@firm-ca.example')).toBe('PUBLIC_BUSINESS_EMAIL');

    // Personal mailbox on consumer domain
    expect(LeadQualityValidator.classifyEmail('partner.personal@gmail.com')).toBe('PUBLIC_PERSONAL_CONTACT');
    expect(LeadQualityValidator.classifyEmail('accountant.ca@yahoo.com')).toBe('PUBLIC_PERSONAL_CONTACT');
  });

  it('classifies business telephone numbers', () => {
    expect(LeadQualityValidator.classifyPhone('+91-124-5550100')).toBe('PUBLIC_BUSINESS_PHONE');
  });
});
