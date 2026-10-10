import nodemailer from 'nodemailer';
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

/**
 * Builds the responsive HTML email template featuring the live website concept screenshot
 */
function buildOutreachHtml(payload: EmailSendPayload): string {
  const urlMatch = payload.body.match(/https?:\/\/[^\s]+/);
  const targetDemoUrl = urlMatch ? urlMatch[0] : 'https://get-visible-web.vercel.app';
  const encodedDemoUrl = encodeURIComponent(targetDemoUrl);
  const screenshotImgUrl = `https://api.microlink.io?url=${encodedDemoUrl}&screenshot=true&meta=false&embed=screenshot.url`;

  const cleanBodyText = payload.body.replace(/Preview Snapshot:[\s\S]*?(Best regards|$)/i, '$1');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 24px; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: #0f172a; padding: 24px; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
        .content { padding: 28px; }
        .screenshot-card { margin: 24px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .screenshot-card img { width: 100%; height: auto; display: block; border-bottom: 1px solid #e2e8f0; }
        .screenshot-footer { padding: 12px 16px; background: #ffffff; font-size: 13px; font-weight: 600; color: #334155; }
        .button { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 12px; }
        .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Digital Practice Concept · GetVisible</h1>
        </div>
        <div class="content">
          <div style="white-space: pre-line; margin-bottom: 20px; font-size: 14px; color: #334155;">
            ${cleanBodyText}
          </div>
          
          <div class="screenshot-card">
            <a href="${targetDemoUrl}" target="_blank">
              <img src="${screenshotImgUrl}" alt="Personalized Website Preview" />
            </a>
            <div class="screenshot-footer">
              Interactive Concept Preview (Click image or button below to view live)
            </div>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${targetDemoUrl}" target="_blank" class="button">
              Open Live Interactive Website Demo &rarr;
            </a>
          </div>
        </div>
        <div class="footer">
          This individualized concept was prepared specifically for this business practice. We adhere strictly to consent-first outreach. If you do not wish to receive further communications, please reply with &quot;UNSUBSCRIBE&quot;.
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Direct Gmail SMTP Provider (Uses Google App Passwords)
 * Delivers directly from user's authentic Gmail address to ANY customer in the world.
 */
export class GmailSmtpProvider implements IEmailProvider {
  name = 'GmailSmtpProvider';

  private user = process.env.GMAIL_USER || 'govisibleonweb@gmail.com';
  private pass = (process.env.GMAIL_APP_PASSWORD || 'wibanibxxhrbewwk').replace(/\s+/g, '');

  isConfigured(): boolean {
    return Boolean(this.user && this.pass);
  }

  getStatus(): ProviderStatus {
    const configured = this.isConfigured();
    return {
      name: this.name,
      configured,
      isMock: false,
      details: configured
        ? `Gmail SMTP connected for ${this.user}. Delivers directly to real client inboxes.`
        : 'Gmail credentials missing (GMAIL_USER / GMAIL_APP_PASSWORD).',
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
        error: 'Gmail SMTP credentials unconfigured.',
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.user,
          pass: this.pass,
        },
      });

      const htmlBody = buildOutreachHtml(payload);

      const info = await transporter.sendMail({
        from: `"GetVisible Digital" <${this.user}>`,
        to: payload.to,
        subject: payload.subject,
        text: payload.body,
        html: htmlBody,
      });

      return {
        success: true,
        configured: true,
        isMock: false,
        data: {
          messageId: info.messageId,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        configured: true,
        isMock: false,
        error: `Gmail delivery error: ${msg}`,
      };
    }
  }
}

/**
 * Resend Transactional Email Provider
 */
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
        ? 'Transactional email provider connected (Resend).'
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
        error: 'Provider not configured: RESEND_API_KEY missing.',
      };
    }

    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      const htmlBody = buildOutreachHtml(payload);

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: payload.to,
          subject: payload.subject,
          text: payload.body,
          html: htmlBody,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          configured: true,
          isMock: false,
          error: data.message || `Resend error code: ${response.status}`,
        };
      }

      return {
        success: true,
        configured: true,
        isMock: false,
        data: {
          messageId: data.id || `msg-${Date.now()}`,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        configured: true,
        isMock: false,
        error: `Failed to deliver email via Resend: ${msg}`,
      };
    }
  }
}

export class MockEmailProvider implements IEmailProvider {
  name = '[DEMO MOCK] EmailProvider';

  isConfigured(): boolean {
    return true;
  }

  getStatus(): ProviderStatus {
    return {
      name: this.name,
      configured: true,
      isMock: true,
      details: 'Mock email provider active for fallback.',
    };
  }

  async sendOutreachEmail(payload: EmailSendPayload): Promise<ProviderExecutionResult<{ messageId: string }>> {
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
