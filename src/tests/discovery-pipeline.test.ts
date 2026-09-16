import { describe, it, expect, beforeEach } from 'vitest';
import { providerRegistry } from '@/lib/discovery/providers/registry';
import { CsvLeadSourceProvider } from '@/lib/discovery/providers/csv';
import { RateLimiter } from '@/lib/discovery/rate-limiter';
import { DiscoveryJobRunner } from '@/lib/discovery/job-runner';
import { LeadRepository } from '@/lib/db/repository';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';

describe('Discovery Pipeline, Providers & Rate Limiting', () => {
  beforeEach(() => {
    process.env.DEMO_MODE = 'true';
  });

  it('manages provider registry and returns correct provider statuses', () => {
    const providers = providerRegistry.getAllProviders();
    expect(providers.length).toBeGreaterThanOrEqual(3);

    const demoProvider = providerRegistry.getProvider('demo-provider');
    expect(demoProvider).toBeDefined();
    expect(demoProvider?.sourceQuality).toBe('DEMO');

    const csvProvider = providerRegistry.getProvider('csv-provider');
    expect(csvProvider).toBeDefined();
    expect(csvProvider?.isConfigured()).toBe(true);

    const publicRegistry = providerRegistry.getProvider('public-registry');
    expect(publicRegistry).toBeDefined();
  });

  it('enforces rate limiting per provider', async () => {
    const limiter = new RateLimiter();
    const providerId = 'test-provider';
    const limit = 3;

    expect(await limiter.acquire(providerId, limit)).toBe(true);
    expect(await limiter.acquire(providerId, limit)).toBe(true);
    expect(await limiter.acquire(providerId, limit)).toBe(true);
    // 4th request in the same minute should be rejected
    expect(await limiter.acquire(providerId, limit)).toBe(false);
  });

  it('parses manual CSV records cleanly with CsvLeadSourceProvider', () => {
    const csvContent = `business_name,profession,city,address,website,business_email,business_phone,source,source_url
"Test CA Firm One",Chartered Accountant,Gurgaon,"DLF Cyber City",https://test1.example,contact@test1.example,+91-124-5550991,User Upload,https://mca.example/1
"Test CA Firm Two",Chartered Accountant,Gurgaon,"Sector 44",,info@test2.example,+91-124-5550992,User Upload,https://mca.example/2`;

    const provider = new CsvLeadSourceProvider();
    const records = provider.parseCsv(csvContent);

    expect(records).toHaveLength(2);
    expect(records[0].businessName).toBe('Test CA Firm One');
    expect(records[0].sourceQuality).toBe('USER_IMPORTED');
    expect(records[0].isDemoData).toBe(false);
    expect(records[1].website).toBeNull();
  });

  it('executes full automated discovery pipeline in DEMO_MODE=true', async () => {
    const jobId = `job-test-${Date.now()}`;
    const initialLeads = await LeadRepository.listLeads(DEMO_ORGANIZATION_ID);
    const initialCount = initialLeads.total;

    await DiscoveryJobRunner.runJob(
      jobId,
      {
        profession: 'Chartered Accountant',
        location: 'Gurgaon',
        locality: 'Cyber City',
        limit: 5,
        websitePreference: 'ANY',
        contactPreference: 'EITHER',
      },
      DEMO_ORGANIZATION_ID,
      'Test Suite Agent'
    );

    const progress = DiscoveryJobRunner.getJobProgress(jobId);
    expect(progress).not.toBeNull();
    expect(progress?.currentStage).toBe('COMPLETED');
    expect(progress?.found).toBe(5);
    expect(progress?.imported).toBeGreaterThan(0);

    // Verify imported leads are stored in CRM and scoped to DEMO_ORGANIZATION_ID
    const updatedLeads = await LeadRepository.listLeads(DEMO_ORGANIZATION_ID);
    expect(updatedLeads.total).toBe(initialCount + progress!.imported);

    // Verify multi-tenant isolation: another organization cannot see these leads
    const otherOrgLeads = await LeadRepository.listLeads('org-different-tenant');
    expect(otherOrgLeads.total).toBe(0);
  });

  it('refuses to fabricate data in production when provider is not configured', async () => {
    delete process.env.PUBLIC_REGISTRY_API_KEY;
    process.env.DEMO_MODE = 'false';

    const jobId = `job-prod-fail-${Date.now()}`;
    await DiscoveryJobRunner.runJob(
      jobId,
      {
        profession: 'Chartered Accountant',
        location: 'Gurgaon',
        limit: 10,
      },
      DEMO_ORGANIZATION_ID,
      'Production Test'
    );

    const progress = DiscoveryJobRunner.getJobProgress(jobId);
    expect(progress?.currentStage).toBe('FAILED');
    expect(progress?.error).toContain('Lead discovery provider is not configured');
  });
});
