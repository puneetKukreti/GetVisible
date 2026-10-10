import nodemailer from 'nodemailer';
import https from 'https';
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
 * Downloads image buffer safely for embedding as an inline CID attachment.
 * Inline attachments avoid Gmail third-party image blocking and spam filters.
 */
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 8000);
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          clearTimeout(timeout);
          return fetchImageBuffer(res.headers.location).then(resolve);
        }
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          clearTimeout(timeout);
          resolve(Buffer.concat(chunks));
        });
      })
      .on('error', () => {
        clearTimeout(timeout);
        resolve(null);
      });
  });
}

/**
 * Clean, human-looking HTML template that mimics personal agency communication.
 * Avoids aggressive spam triggers (NO heavy colored headers, NO "UNSUBSCRIBE" blast text).
 */
function buildInboxFriendlyHtml(payload: EmailSendPayload, hasInlineCid: boolean): string {
  const urlMatch = payload.body.match(/https?:\/\/[^\s]+/);
  const targetDemoUrl = urlMatch ? urlMatch[0] : 'https://get-visible-web.vercel.app';
  const encodedDemoUrl = encodeURIComponent(targetDemoUrl);
  const remoteImgUrl = `https://api.microlink.io?url=${encodedDemoUrl}&screenshot=true&meta=false&embed=screenshot.url`;
  const imgSrc = hasInlineCid ? 'cid:websitepreview' : remoteImgUrl;

  const cleanBodyText = payload.body.replace(/Preview Snapshot:[\s\S]*?(Best regards|$)/i, '$1');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #222222; margin: 0; padding: 16px;">
      <div style="max-width: 600px; margin: 0 auto;">
        <div style="white-space: pre-line; margin-bottom: 20px; font-size: 14px; color: #222222;">
${cleanBodyText}
        </div>

        <div style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff;">
          <a href="${targetDemoUrl}" target="_blank" style="text-decoration: none; display: block;">
            <img src="${imgSrc}" style="width: 100%; height: auto; display: block; border-bottom: 1px solid #e2e8f0;" alt="Interactive Practice Website Concept" />
          </a>
          <div style="padding: 10px 14px; background: #f8fafc; font-size: 12px; font-weight: 600; color: #475569;">
            Live Interactive Concept Preview (Click image or link below to view)
          </div>
        </div>

        <div style="margin: 20px 0;">
          <a href="${targetDemoUrl}" target="_blank" style="display: inline-block; background-color: #1a73e8; color: #ffffff !important; padding: 10px 22px; border-radius: 5px; text-decoration: none; font-weight: 600; font-size: 13px;">
            Open Live Interactive Website Demo &rarr;
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 16px;" />
        
        <p style="font-size: 11px; color: #64748b; line-height: 1.4; margin: 0;">
          Prepared by GetVisible Digital Practice Team &bull; Gurgaon, Haryana<br />
          If you prefer not to receive updates from us, simply reply with "opt out".
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Direct Gmail SMTP Provider
 * Sends authentic 1-on-1 personal emails through your verified Gmail account.
 * Uses CID inline image embedding to maximize primary inbox placement.
 */
export class GmailSmtpProvider implements IEmailProvider {
  name = 'GmailSmtpProvider';

  private getCredentials() {
    const rawUser = process.env.GMAIL_USER || 'govisibleonweb@gmail.com';
    const rawPass = process.env.GMAIL_APP_PASSWORD || 'wibanibxxhrbewwk';

    const user = rawUser.trim().replace(/^["']|["']$/g, '');
    const pass = rawPass.trim().replace(/^["']|["']$/g, '').replace(/[^a-zA-Z0-9]/g, '');

    return { user, pass };
  }

  isConfigured(): boolean {
    const { user, pass } = this.getCredentials();
    return Boolean(user && pass);
  }

  getStatus(): ProviderStatus {
    const configured = this.isConfigured();
    const { user } = this.getCredentials();
    return {
      name: this.name,
      configured,
      isMock: false,
      details: configured
        ? `Gmail SMTP connected for ${user}. Delivers directly to real client inboxes.`
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

    const { user, pass } = this.getCredentials();

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      });

      // Fetch live screenshot buffer to attach directly as inline CID
      const urlMatch = payload.body.match(/https?:\/\/[^\s]+/);
      const targetDemoUrl = urlMatch ? urlMatch[0] : 'https://get-visible-web.vercel.app';
      const encodedDemoUrl = encodeURIComponent(targetDemoUrl);
      const screenshotImgUrl = `https://api.microlink.io?url=${encodedDemoUrl}&screenshot=true&meta=false&embed=screenshot.url`;

      const imageBuffer = await fetchImageBuffer(screenshotImgUrl);
      const hasInlineCid = Boolean(imageBuffer && imageBuffer.length > 0);

      const htmlBody = buildInboxFriendlyHtml(payload, hasInlineCid);

      const mailOptions: nodemailer.SendMailOptions = {
        from: `"GetVisible Team" <${user}>`,
        to: payload.to,
        replyTo: user,
        subject: payload.subject,
        text: payload.body,
        html: htmlBody,
        headers: {
          'X-Mailer': 'GetVisible Client Platform',
          'Importance': 'Normal',
        },
      };

      if (hasInlineCid && imageBuffer) {
        mailOptions.attachments = [
          {
            filename: 'website-preview.png',
            content: imageBuffer,
            cid: 'websitepreview',
          },
        ];
      }

      const info = await transporter.sendMail(mailOptions);

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
      const htmlBody = buildInboxFriendlyHtml(payload, false);

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
