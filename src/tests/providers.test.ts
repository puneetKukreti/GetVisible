import { describe, it, expect } from 'vitest';
import {
  ProductionLeadSourceProvider,
  ProductionWebsiteAnalyzerProvider,
  ProductionEmailProvider,
  ProductionDeploymentProvider,
  GeminiAIProvider,
  MockAIProvider,
  MockDeploymentProvider,
} from '@/lib/providers';

describe('Provider Abstractions & No Fake Integrations Guarantee', () => {
  it('reports unconfigured state when API keys are absent in production mode', () => {
    delete process.env.PUBLIC_REGISTRY_API_KEY;
    delete process.env.PAGESPEED_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.VERCEL_TOKEN;
    delete process.env.GEMINI_API_KEY;

    const leadSource = new ProductionLeadSourceProvider();
    expect(leadSource.isConfigured()).toBe(false);
    expect(leadSource.getStatus().details).toContain('Provider not configured');

    const analyzer = new ProductionWebsiteAnalyzerProvider();
    expect(analyzer.isConfigured()).toBe(false);
    expect(analyzer.getStatus().details).toContain('Provider not configured');

    const email = new ProductionEmailProvider();
    expect(email.isConfigured()).toBe(false);
    expect(email.getStatus().details).toContain('Provider not configured');

    const deployment = new ProductionDeploymentProvider();
    expect(deployment.isConfigured()).toBe(false);
    expect(deployment.getStatus().details).toContain('Provider not configured');

    const gemini = new GeminiAIProvider();
    expect(gemini.isConfigured()).toBe(false);
    expect(gemini.getStatus().details).toContain('Provider not configured');
  });

  it('rejects execution with explicit error message when unconfigured in production', async () => {
    const email = new ProductionEmailProvider();
    const result = await email.sendOutreachEmail({
      to: 'test@example.com',
      subject: 'Test',
      body: 'Hello',
      leadId: '1',
      organizationId: 'org-1',
      approvedByHuman: true,
    });

    expect(result.success).toBe(false);
    expect(result.configured).toBe(false);
    expect(result.error).toContain('Provider not configured');
  });

  it('enforces human approval guard on deployment and outreach even in mock providers', async () => {
    process.env.DEMO_MODE = 'true';
    const deployment = new MockDeploymentProvider();

    // Without human approval
    const unapproved = await deployment.deployDemoWebsite({
      demoId: 'demo-1',
      subdomain: 'demo-preview',
      leadId: 'lead-1',
      organizationId: 'org-1',
      humanApproved: false,
    });
    expect(unapproved.success).toBe(false);
    expect(unapproved.error).toContain('explicit human approval');

    // With human approval
    const approved = await deployment.deployDemoWebsite({
      demoId: 'demo-1',
      subdomain: 'demo-preview',
      leadId: 'lead-1',
      organizationId: 'org-1',
      humanApproved: true,
    });
    expect(approved.success).toBe(true);
    expect(approved.isMock).toBe(true);
    expect(approved.data?.previewUrl).toContain('.example');
  });

  it('explicitly labels mock AI outputs with [DEMO MOCK]', async () => {
    process.env.DEMO_MODE = 'true';
    const mockAI = new MockAIProvider();
    const result = await mockAI.analyzeOpportunity({
      businessName: 'Demo CA Firm',
      profession: 'Chartered Accountant',
      city: 'Gurgaon',
      websiteStatus: 'NO_WEBSITE',
    });

    expect(result.success).toBe(true);
    expect(result.isMock).toBe(true);
    expect(result.data?.reason).toContain('[DEMO MOCK]');
  });
});
