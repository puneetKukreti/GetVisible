import { ProviderExecutionResult, ProviderStatus } from './provider-result';

export interface EmailSendPayload {
  to: string;
  subject: string;
  body: string;
  leadId: string;
  organizationId: string;
  approvedByHuman: boolean;
}

export interface IEmailProvider {
  name: string;
  isConfigured(): boolean;
  getStatus(): ProviderStatus;
  sendOutreachEmail(payload: EmailSendPayload): Promise<ProviderExecutionResult<{ messageId: string }>>;
}

export class ProductionEmailProvider implements IEmailProvider {
  name = 'ResendEmailProvider';

  isConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY);
  }

  getStatus(): ProviderStatus {
    const configured = this.isConfigured();
    return {
      name: this.name,
      configured,
      isMock: false,
      details: configured
        ? 'Transactional email provider connected.'
        : 'Provider not configured. Set RESEND_API_KEY in environment variables.',
    };
  }

  async sendOutreachEmail(payload: EmailSendPayload): Promise<ProviderExecutionResult<{ messageId: string }>> {
    if (!payload.approvedByHuman) {
      return {
        success: false,
        configured: this.isConfigured(),
        isMock: false,
        error: 'Compliance Violation: Outbound outreach requires explicit human approval before transmission.',
      };
    }

    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        isMock: false,
        error: 'Provider not configured: RESEND_API_KEY missing. Cannot transmit outbound email.',
      };
    }

    return {
      success: false,
      configured: true,
      isMock: false,
      error: 'Direct email dispatch pipeline is scheduled for Phase 2.',
    };
  }
}

export class MockEmailProvider implements IEmailProvider {
  name = '[DEMO MOCK] EmailProvider';

  isConfigured(): boolean {
    return process.env.DEMO_MODE === 'true';
  }

  getStatus(): ProviderStatus {
    return {
      name: this.name,
      configured: this.isConfigured(),
      isMock: true,
      details: 'Mock email provider active only for explicit DEMO_MODE sandbox testing.',
    };
  }

  async sendOutreachEmail(payload: EmailSendPayload): Promise<ProviderExecutionResult<{ messageId: string }>> {
    if (!payload.approvedByHuman) {
      return {
        success: false,
        configured: this.isConfigured(),
        isMock: true,
        error: 'Compliance Violation: Outbound outreach requires explicit human approval before transmission.',
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
        messageId: `demo-msg-${Date.now()}`,
      },
    };
  }
}
