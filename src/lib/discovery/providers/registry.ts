import { ILeadSourceProvider, DiscoverySearchInput } from './types';
import { DemoLeadSourceProvider } from './demo';
import { CsvLeadSourceProvider } from './csv';
import { PublicRegistryLeadSourceProvider } from './public-registry';
import { LiveWebSearchProvider } from './live-search';
import { ProviderStatus } from '@/lib/providers/provider-result';

export class LeadSourceProviderRegistry {
  private static instance: LeadSourceProviderRegistry;
  private providers: Map<string, ILeadSourceProvider> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  static getInstance(): LeadSourceProviderRegistry {
    if (!LeadSourceProviderRegistry.instance) {
      LeadSourceProviderRegistry.instance = new LeadSourceProviderRegistry();
    }
    return LeadSourceProviderRegistry.instance;
  }

  private registerDefaults() {
    this.register(new LiveWebSearchProvider());
    this.register(new DemoLeadSourceProvider());
    this.register(new CsvLeadSourceProvider());
    this.register(new PublicRegistryLeadSourceProvider());
  }

  register(provider: ILeadSourceProvider) {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): ILeadSourceProvider | undefined {
    return this.providers.get(id);
  }

  getActiveDiscoveryProvider(input?: Partial<DiscoverySearchInput>): ILeadSourceProvider {
    // If a specific provider ID is requested (e.g. CSV provider or explicit test harness)
    if (input?.providerId && this.providers.has(input.providerId)) {
      return this.providers.get(input.providerId)!;
    }

    // Explicit demo sandbox testing requested by test harness
    if (input?.useDemoProvider === true) {
      return this.providers.get('demo-provider')!;
    }

    // Default to Live Web Search & Verified Professional Discovery
    const liveProvider = this.providers.get('live-search');
    if (liveProvider) {
      return liveProvider;
    }

    return this.providers.get('public-registry')!;
  }

  getAllProviders(): ILeadSourceProvider[] {
    return Array.from(this.providers.values());
  }

  getAllStatuses(): (ProviderStatus & { id: string; sourceQuality: string })[] {
    return this.getAllProviders().map((p) => {
      const status = p.getStatus();
      return {
        ...status,
        id: p.id,
        sourceQuality: p.sourceQuality,
      };
    });
  }
}

export const providerRegistry = LeadSourceProviderRegistry.getInstance();
