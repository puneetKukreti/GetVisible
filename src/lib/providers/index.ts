import {
  ILeadSourceProvider,
  ProductionLeadSourceProvider,
  MockLeadSourceProvider,
} from './lead-source.provider';
import {
  IWebsiteAnalyzerProvider,
  ProductionWebsiteAnalyzerProvider,
  MockWebsiteAnalyzerProvider,
} from './website-analyzer.provider';
import {
  IAIProvider,
  GeminiAIProvider,
  MockAIProvider,
} from './ai.provider';
import {
  IEmailProvider,
  ProductionEmailProvider,
  MockEmailProvider,
} from './email.provider';
import {
  IDeploymentProvider,
  ProductionDeploymentProvider,
  MockDeploymentProvider,
} from './deployment.provider';
import { ProviderStatus } from './provider-result';

export interface ProviderRegistry {
  leadSource: ILeadSourceProvider;
  websiteAnalyzer: IWebsiteAnalyzerProvider;
  ai: IAIProvider;
  email: IEmailProvider;
  deployment: IDeploymentProvider;
}

export function getProviders(): ProviderRegistry {
  const isDemo = process.env.DEMO_MODE === 'true';

  return {
    leadSource: isDemo ? new MockLeadSourceProvider() : new ProductionLeadSourceProvider(),
    websiteAnalyzer: isDemo ? new MockWebsiteAnalyzerProvider() : new ProductionWebsiteAnalyzerProvider(),
    ai: isDemo ? new MockAIProvider() : new GeminiAIProvider(),
    email: isDemo ? new MockEmailProvider() : new ProductionEmailProvider(),
    deployment: isDemo ? new MockDeploymentProvider() : new ProductionDeploymentProvider(),
  };
}

export function getAllProviderStatuses(): ProviderStatus[] {
  const registry = getProviders();
  return [
    registry.ai.getStatus(),
    registry.leadSource.getStatus(),
    registry.websiteAnalyzer.getStatus(),
    registry.email.getStatus(),
    registry.deployment.getStatus(),
  ];
}

export * from './provider-result';
export * from './lead-source.provider';
export * from './website-analyzer.provider';
export * from './ai.provider';
export * from './email.provider';
export * from './deployment.provider';
