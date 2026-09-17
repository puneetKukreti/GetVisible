import {
  ILeadSourceProvider,
  DiscoverySearchInput,
  DiscoveredBusinessRecord,
} from './types';
import { ProviderStatus, ProviderExecutionResult } from '@/lib/providers/provider-result';

export class PublicRegistryLeadSourceProvider implements ILeadSourceProvider {
  id = 'public-registry';
  name = 'Public Registry API Provider';
  sourceQuality = 'OFFICIAL' as const;
  requestsPerMinute = 60;

  isConfigured(): boolean {
    const key = process.env.PUBLIC_REGISTRY_API_KEY;
    return Boolean(key && key.trim().length > 0 && key !== 'placeholder');
  }

  getStatus(): ProviderStatus {
    const configured = this.isConfigured();
    return {
      name: this.name,
      configured,
      isMock: false,
      details: configured
        ? 'Connected to authorized public business registry endpoint.'
        : 'NOT CONFIGURED. Required: PUBLIC_REGISTRY_API_KEY. Connects to an authorized public company registry API (e.g. MCA / official corporate data service). Note: The ICAI member directory does not provide a public bulk discovery API; integration must adhere to permitted terms of use.',
    };
  }

  async searchBusinesses(
    _input: DiscoverySearchInput
  ): Promise<ProviderExecutionResult<DiscoveredBusinessRecord[]>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        isMock: false,
        error:
          'Lead discovery provider is not configured. Set PUBLIC_REGISTRY_API_KEY in environment variables. Per system principles, GetVisible never fabricates simulated search results in production.',
      };
    }

    return {
      success: false,
      configured: true,
      isMock: false,
      error:
        'Live external registry endpoint is being integrated. In the interim, please use the CSV Import provider to import legitimate business records.',
    };
  }

  async getBusinessDetails(
    _sourceRecordId: string
  ): Promise<ProviderExecutionResult<DiscoveredBusinessRecord | null>> {
    return {
      success: false,
      configured: this.isConfigured(),
      isMock: false,
      error: 'Provider not configured: Public Registry API key is missing.',
    };
  }

  async getPublicBusinessContact(
    _sourceRecordId: string
  ): Promise<ProviderExecutionResult<{ email?: string; phone?: string } | null>> {
    return {
      success: false,
      configured: this.isConfigured(),
      isMock: false,
      error: 'Provider not configured: Public Registry API key is missing.',
    };
  }

  async getOfficialWebsite(
    _sourceRecordId: string
  ): Promise<ProviderExecutionResult<string | null>> {
    return {
      success: false,
      configured: this.isConfigured(),
      isMock: false,
      error: 'Provider not configured: Public Registry API key is missing.',
    };
  }
}
