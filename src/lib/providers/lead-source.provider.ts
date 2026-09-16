import { ProviderExecutionResult, ProviderStatus } from './provider-result';

export interface DiscoveredLeadPayload {
  businessName: string;
  profession: string;
  city: string;
  address: string;
  source: string;
  sourceUrl?: string;
  website?: string;
  publicPhone?: string;
  publicEmail?: string;
}

export interface ILeadSourceProvider {
  name: string;
  isConfigured(): boolean;
  getStatus(): ProviderStatus;
  discoverLeads(query: { profession: string; location: string }): Promise<ProviderExecutionResult<DiscoveredLeadPayload[]>>;
}

export class ProductionLeadSourceProvider implements ILeadSourceProvider {
  name = 'PublicRegistryProvider';

  isConfigured(): boolean {
    return Boolean(process.env.PUBLIC_REGISTRY_API_KEY);
  }

  getStatus(): ProviderStatus {
    const configured = this.isConfigured();
    return {
      name: this.name,
      configured,
      isMock: false,
      details: configured
        ? 'Public Registry API connected and active.'
        : 'Provider not configured. Set PUBLIC_REGISTRY_API_KEY in environment variables.',
    };
  }

  async discoverLeads(_query: { profession: string; location: string }): Promise<ProviderExecutionResult<DiscoveredLeadPayload[]>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        isMock: false,
        error: 'Provider not configured: Public Registry API key is missing. Automatic lead discovery requires an authorized data provider.',
      };
    }

    return {
      success: false,
      configured: true,
      isMock: false,
      error: 'External live source integration scheduled for Phase 2.',
    };
  }
}

export class MockLeadSourceProvider implements ILeadSourceProvider {
  name = '[DEMO MOCK] LeadSourceProvider';

  isConfigured(): boolean {
    return process.env.DEMO_MODE === 'true';
  }

  getStatus(): ProviderStatus {
    return {
      name: this.name,
      configured: this.isConfigured(),
      isMock: true,
      details: 'Mock provider active only for explicit DEMO_MODE exploration.',
    };
  }

  async discoverLeads(query: { profession: string; location: string }): Promise<ProviderExecutionResult<DiscoveredLeadPayload[]>> {
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
      data: [
        {
          businessName: `Demo ${query.profession} Firm Alpha`,
          profession: query.profession,
          city: query.location,
          address: 'Demo Tower B, Cyber City, Gurgaon',
          source: 'Public CA Registry (Demo Data)',
          sourceUrl: 'https://registry.example/demo-ca-alpha',
          website: 'https://demo-alpha.example',
          publicPhone: '+91-124-5550191',
          publicEmail: 'contact@demo-alpha.example',
        },
      ],
    };
  }
}
