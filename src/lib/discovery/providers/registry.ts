import { ILeadSourceProvider } from './types';
import { DemoLeadSourceProvider } from './demo';
import { CsvLeadSourceProvider } from './csv';
import { PublicRegistryLeadSourceProvider } from './public-registry';
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

  getActiveDiscoveryProvider(): ILeadSourceProvider {
    // If DEMO_MODE is true, select DemoLeadSourceProvider
    if (process.env.DEMO_MODE === 'true') {
      return this.providers.get('demo-provider')!;
    }
    // In production, select Public Registry
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
