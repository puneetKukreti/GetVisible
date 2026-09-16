import { ProviderExecutionResult, ProviderStatus } from './provider-result';

export interface DeploymentRequest {
  demoId: string;
  subdomain: string;
  leadId: string;
  organizationId: string;
  humanApproved: boolean;
}

export interface IDeploymentProvider {
  name: string;
  isConfigured(): boolean;
  getStatus(): ProviderStatus;
  deployDemoWebsite(request: DeploymentRequest): Promise<ProviderExecutionResult<{ previewUrl: string }>>;
}

export class ProductionDeploymentProvider implements IDeploymentProvider {
  name = 'VercelDeploymentProvider';

  isConfigured(): boolean {
    return Boolean(process.env.VERCEL_TOKEN);
  }

  getStatus(): ProviderStatus {
    const configured = this.isConfigured();
    return {
      name: this.name,
      configured,
      isMock: false,
      details: configured
        ? 'Vercel deployment engine configured.'
        : 'Provider not configured. Set VERCEL_TOKEN in environment variables.',
    };
  }

  async deployDemoWebsite(request: DeploymentRequest): Promise<ProviderExecutionResult<{ previewUrl: string }>> {
    if (!request.humanApproved) {
      return {
        success: false,
        configured: this.isConfigured(),
        isMock: false,
        error: 'Safety Guard: Live website deployment requires explicit human approval before provisioning.',
      };
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        isMock: false,
        error: 'Provider not configured: VERCEL_TOKEN is missing. Cannot deploy demo website.',
      };
    }

    return {
      success: false,
      configured: true,
      isMock: false,
      error: 'Vercel preview deployment pipeline is scheduled for Phase 2.',
    };
  }
}

export class MockDeploymentProvider implements IDeploymentProvider {
  name = '[DEMO MOCK] DeploymentProvider';

  isConfigured(): boolean {
    return process.env.DEMO_MODE === 'true';
  }

  getStatus(): ProviderStatus {
    return {
      name: this.name,
      configured: this.isConfigured(),
      isMock: true,
      details: 'Mock deployment provider active only in explicit DEMO_MODE.',
    };
  }

  async deployDemoWebsite(request: DeploymentRequest): Promise<ProviderExecutionResult<{ previewUrl: string }>> {
    if (!request.humanApproved) {
      return {
        success: false,
        configured: this.isConfigured(),
        isMock: true,
        error: 'Safety Guard: Live website deployment requires explicit human approval before provisioning.',
      };
    }

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
        previewUrl: `https://${request.subdomain}.demo-preview.example`,
      },
    };
  }
}
