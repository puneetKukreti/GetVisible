import { ProviderExecutionResult, ProviderStatus } from './provider-result';
import { WebsiteStatus } from '@/types';

export interface WebsiteAuditPayload {
  url: string;
  status: WebsiteStatus;
  cms?: string;
  speedScore: number;
  mobileFriendly: boolean;
  hasSsl: boolean;
  auditNotes: string;
}

export interface IWebsiteAnalyzerProvider {
  name: string;
  isConfigured(): boolean;
  getStatus(): ProviderStatus;
  analyzeWebsite(url: string): Promise<ProviderExecutionResult<WebsiteAuditPayload>>;
}

export class ProductionWebsiteAnalyzerProvider implements IWebsiteAnalyzerProvider {
  name = 'LighthouseAnalyzerProvider';

  isConfigured(): boolean {
    return Boolean(process.env.PAGESPEED_API_KEY);
  }

  getStatus(): ProviderStatus {
    const configured = this.isConfigured();
    return {
      name: this.name,
      configured,
      isMock: false,
      details: configured
        ? 'Google PageSpeed & Lighthouse API configured.'
        : 'Provider not configured. Set PAGESPEED_API_KEY in environment variables.',
    };
  }

  async analyzeWebsite(url: string): Promise<ProviderExecutionResult<WebsiteAuditPayload>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        isMock: false,
        error: `Provider not configured: PageSpeed/Lighthouse API key missing. Cannot analyze ${url} in production.`,
      };
    }

    return {
      success: false,
      configured: true,
      isMock: false,
      error: 'Live Lighthouse analyzer pipeline scheduled for Phase 2.',
    };
  }
}

export class MockWebsiteAnalyzerProvider implements IWebsiteAnalyzerProvider {
  name = '[DEMO MOCK] WebsiteAnalyzerProvider';

  isConfigured(): boolean {
    return process.env.DEMO_MODE === 'true';
  }

  getStatus(): ProviderStatus {
    return {
      name: this.name,
      configured: this.isConfigured(),
      isMock: true,
      details: 'Mock website audit provider active only for explicit DEMO_MODE testing.',
    };
  }

  async analyzeWebsite(url: string): Promise<ProviderExecutionResult<WebsiteAuditPayload>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        isMock: true,
        error: 'Provider not configured: DEMO_MODE is disabled.',
      };
    }

    return {
      success: true,
      configured: true,
      isMock: true,
      data: {
        url,
        status: 'WEBSITE_EXISTS',
        cms: 'WordPress 4.8',
        speedScore: 42,
        mobileFriendly: false,
        hasSsl: false,
        auditNotes: 'Demo Audit: Non-responsive design, HTTP without SSL, missing modern client portal.',
      },
    };
  }
}
