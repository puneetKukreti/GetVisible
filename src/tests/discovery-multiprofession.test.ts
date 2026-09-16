import { describe, it, expect, beforeEach } from 'vitest';
import { DemoLeadSourceProvider } from '@/lib/discovery/providers/demo';
import { DiscoveryJobRunner } from '@/lib/discovery/job-runner';
import { LeadRepository } from '@/lib/db/repository';
import { DEMO_ORGANIZATION_ID } from '@/lib/db/demo-data';

describe('Multi-Profession Lead Discovery & Dynamic Provider Support', () => {
  const provider = new DemoLeadSourceProvider();

  beforeEach(() => {
    process.env.DEMO_MODE = 'true';
  });

  it('generates clearly fictional Chartered Accountant leads when requested', async () => {
    const result = await provider.searchBusinesses({
      profession: 'Chartered Accountant',
      location: 'Gurgaon',
      limit: 3,
      websitePreference: 'WEBSITE_EXISTS',
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);

    const first = result.data![0];
    expect(first.profession).toBe('Chartered Accountant');
    expect(first.city).toBe('Gurgaon');
    expect(first.businessName).toBe('Demo CA Firm 01');
    expect(first.website).toBe('https://demo-ca-01.example');
    expect(first.publicEmail).toBe('contact@demo-ca-01.example');
    expect(first.isDemoData).toBe(true);
  });

  it('generates clearly fictional Dentist leads with dentist-specific branding', async () => {
    const result = await provider.searchBusinesses({
      profession: 'Dentist',
      location: 'Gurgaon',
      limit: 3,
      websitePreference: 'WEBSITE_EXISTS',
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);

    const first = result.data![0];
    expect(first.profession).toBe('Dentist');
    expect(first.city).toBe('Gurgaon');
    expect(first.businessName).toBe('Demo Dental Clinic 01');
    expect(first.website).toBe('https://demo-dental-01.example');
    expect(first.publicEmail).toBe('contact@demo-dental-01.example');
    expect(first.isDemoData).toBe(true);
  });

  it('generates clearly fictional Lawyer leads with legal practice branding', async () => {
    const result = await provider.searchBusinesses({
      profession: 'Lawyer',
      location: 'Gurgaon',
      limit: 2,
      websitePreference: 'WEBSITE_EXISTS',
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);

    const first = result.data![0];
    expect(first.profession).toBe('Lawyer');
    expect(first.businessName).toBe('Demo Law Practice 01');
    expect(first.website).toBe('https://demo-legal-01.example');
    expect(first.publicEmail).toBe('contact@demo-legal-01.example');
  });

  it('generates Architect leads in custom location (Noida)', async () => {
    const result = await provider.searchBusinesses({
      profession: 'Architect',
      location: 'Noida',
      limit: 2,
      websitePreference: 'WEBSITE_EXISTS',
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);

    const first = result.data![0];
    expect(first.profession).toBe('Architect');
    expect(first.city).toBe('Noida');
    expect(first.businessName).toBe('Demo Architecture Studio 01');
    expect(first.website).toBe('https://demo-architect-01.example');
    expect(first.address).toContain('Noida');
  });

  it('generates dynamic branding for custom/Other professions', async () => {
    const result = await provider.searchBusinesses({
      profession: 'Physiotherapist',
      location: 'Mumbai',
      limit: 2,
      websitePreference: 'WEBSITE_EXISTS',
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);

    const first = result.data![0];
    expect(first.profession).toBe('Physiotherapist');
    expect(first.city).toBe('Mumbai');
    expect(first.businessName).toBe('Demo Physiotherapist Practice 01');
    expect(first.website).toBe('https://demo-physiotherapist-01.example');
    expect(first.publicEmail).toBe('contact@demo-physiotherapist-01.example');
  });

  it('runs full discovery pipeline for Dentist and allows filtering by profession in repository', async () => {
    const jobId = `job-dentist-test-${Date.now()}`;
    await DiscoveryJobRunner.runJob(
      jobId,
      {
        profession: 'Dentist',
        location: 'Gurgaon',
        limit: 2,
        websitePreference: 'WEBSITE_EXISTS',
      },
      DEMO_ORGANIZATION_ID,
      'Test Runner'
    );

    const progress = DiscoveryJobRunner.getJobProgress(jobId);
    expect(progress).not.toBeNull();
    expect(progress?.currentStage).toBe('COMPLETED');
    expect(progress?.imported).toBeGreaterThanOrEqual(1);

    // Filter leads by Dentist
    const dentistLeads = await LeadRepository.listLeads(DEMO_ORGANIZATION_ID, {
      profession: 'Dentist',
    });
    expect(dentistLeads.leads.length).toBeGreaterThanOrEqual(1);
    expect(dentistLeads.leads.every((l) => l.profession === 'Dentist')).toBe(true);

    // Filter leads by Chartered Accountant
    const caLeads = await LeadRepository.listLeads(DEMO_ORGANIZATION_ID, {
      profession: 'Chartered Accountant',
    });
    expect(caLeads.leads.every((l) => l.profession === 'Chartered Accountant')).toBe(true);
  });
});