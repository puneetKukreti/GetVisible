import { describe, it, expect } from 'vitest';
import { WebsiteVerifier } from '@/lib/discovery/website-verifier';
import { LeadNormalizer } from '@/lib/discovery/normalizer';

describe('WebsiteVerifier (Factual Evidence Corroboration)', () => {
  it('verifies website ownership when email domain factually matches website domain', () => {
    const entity = LeadNormalizer.normalize({
      sourceRecordId: 'web-1',
      businessName: 'Deloitte Gurgaon Associates',
      profession: 'Chartered Accountant',
      city: 'Gurgaon',
      address: 'Cyber City Building 10',
      website: 'https://deloitte-gurgaon.example',
      publicEmail: 'partner@deloitte-gurgaon.example',
      source: 'Directory',
      sourceUrl: 'https://test.example',
      sourceQuality: 'PUBLIC_BUSINESS_DIRECTORY',
      isDemoData: false,
    });

    const result = WebsiteVerifier.verify(entity);
    expect(result.status).toBe('VERIFIED');
    expect(result.domainMatch).toBe(true);
    expect(result.details).toContain('directly matches website domain');
  });

  it('marks REQUIRES_REVIEW when domain is similar but lacks corroborated email or contact evidence', () => {
    const entity = LeadNormalizer.normalize({
      sourceRecordId: 'web-2',
      businessName: 'Unverified Audit Advisory',
      profession: 'Chartered Accountant',
      city: 'Gurgaon',
      address: 'Sector 14',
      website: 'https://unverified-audit.example',
      publicEmail: 'audit@gmail.com', // consumer email, does not match domain
      publicPhone: null,
      source: 'Directory',
      sourceUrl: 'https://test.example',
      sourceQuality: 'PUBLIC_BUSINESS_DIRECTORY',
      isDemoData: false,
    });

    const result = WebsiteVerifier.verify(entity);
    expect(result.status).toBe('REQUIRES_REVIEW');
    expect(result.details).toContain('requires manual confirmation');
  });

  it('marks FAILED when no website URL exists', () => {
    const entity = LeadNormalizer.normalize({
      sourceRecordId: 'web-3',
      businessName: 'No Web Firm',
      profession: 'Chartered Accountant',
      city: 'Gurgaon',
      address: 'Sector 31',
      website: null,
      source: 'Directory',
      sourceUrl: 'https://test.example',
      sourceQuality: 'PUBLIC_BUSINESS_DIRECTORY',
      isDemoData: false,
    });

    const result = WebsiteVerifier.verify(entity);
    expect(result.status).toBe('FAILED');
    expect(result.details).toContain('No website URL');
  });
});
