import { describe, it, expect, beforeEach } from 'vitest';
import { CsvLeadSourceProvider } from '@/lib/discovery/providers/csv';
import { LeadRepository } from '@/lib/db/repository';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';
import { LeadNormalizer } from '@/lib/discovery/normalizer';
import { DuplicateDetector } from '@/lib/discovery/deduplicator';
import { LeadQualityValidator } from '@/lib/discovery/validator';

describe('CSV File Import Feature', () => {
  beforeEach(() => {
    process.env.DEMO_MODE = 'true';
  });

  const SAMPLE_CSV_FILE = `business_name,profession,city,address,website,business_email,business_phone,source
"Kapoor & Associates CA","Chartered Accountant","Gurgaon","Sector 29 Commercial Hub, Gurgaon 122001","https://kapoor-ca.example","contact@kapoor-ca.example","+91-124-5550301","MCA Registry Upload"
"Unique Accounting Solutions LLP","Chartered Accountant","Gurgaon","Sector 44 Institutional Area, Gurgaon 122003","","info@unique-acct.example","+91-124-5550302","Verified User CSV"
"Sharma Legal & Advisory","Lawyer","Delhi NCR","Barakhamba Road, Connaught Place, New Delhi","","counsel@sharma-legal.example","+91-11-5550303","Bar Council Directory"`;

  it('correctly parses CSV file text into normalized DiscoveredBusinessRecord objects', () => {
    const provider = new CsvLeadSourceProvider();
    const records = provider.parseCsv(SAMPLE_CSV_FILE);

    expect(records).toHaveLength(3);

    // Record 1: Has website
    expect(records[0].businessName).toBe('Kapoor & Associates CA');
    expect(records[0].profession).toBe('Chartered Accountant');
    expect(records[0].city).toBe('Gurgaon');
    expect(records[0].website).toBe('https://kapoor-ca.example');
    expect(records[0].publicEmail).toBe('contact@kapoor-ca.example');
    expect(records[0].sourceQuality).toBe('USER_IMPORTED');

    // Record 2: No website
    expect(records[1].businessName).toBe('Unique Accounting Solutions LLP');
    expect(records[1].website).toBeNull();
    expect(records[1].publicPhone).toBe('+91-124-5550302');

    // Record 3: Multi-profession (Lawyer)
    expect(records[2].profession).toBe('Lawyer');
    expect(records[2].city).toBe('Delhi NCR');
  });

  it('rejects invalid or empty CSV input with fewer than 2 lines', () => {
    const provider = new CsvLeadSourceProvider();
    expect(provider.parseCsv('')).toHaveLength(0);
    expect(provider.parseCsv('business_name,profession,city')).toHaveLength(0);
  });

  it('normalizes, validates, and imports CSV records into LeadRepository', async () => {
    const provider = new CsvLeadSourceProvider();
    const rawRecords = provider.parseCsv(SAMPLE_CSV_FILE);

    const existingLeads = (await LeadRepository.listLeads(DEMO_ORGANIZATION_ID)).leads;

    for (const raw of rawRecords) {
      const normalized = LeadNormalizer.normalize(raw);
      const validation = LeadQualityValidator.validate(normalized);
      expect(validation.valid).toBe(true);

      const dupCheck = DuplicateDetector.check(normalized, existingLeads);

      if (!dupCheck.isDuplicate) {
        const created = await LeadRepository.createLead(
          {
            businessName: normalized.businessName.normalizedValue,
            profession: normalized.profession,
            city: normalized.city.normalizedValue,
            address: normalized.address.normalizedValue,
            website: normalized.website?.normalizedValue || null,
            publicEmail: normalized.publicEmail?.normalizedValue || null,
            publicPhone: normalized.publicPhone?.normalizedValue || null,
            source: 'USER_IMPORTED',
            sourceQuality: 'USER_IMPORTED',
            websiteStatus: normalized.website ? 'WEBSITE_EXISTS' : 'NO_WEBSITE',
            opportunityScore: normalized.website ? 70 : 92,
            opportunityReason: 'Imported via verified user CSV file.',
          },
          DEMO_ORGANIZATION_ID,
          'user-csv-importer'
        );

        expect(created.id).toBeDefined();
        expect(created.organizationId).toBe(DEMO_ORGANIZATION_ID);
        expect(created.sourceQuality).toBe('USER_IMPORTED');
      }
    }

    // Verify leads are in the CRM
    const updated = await LeadRepository.listLeads(DEMO_ORGANIZATION_ID, {
      search: 'Kapoor & Associates',
    });
    expect(updated.leads.length).toBeGreaterThanOrEqual(1);
    expect(updated.leads[0].businessName).toContain('Kapoor & Associates');
  });
});
