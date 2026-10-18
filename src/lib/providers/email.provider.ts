import nodemailer from 'nodemailer';
import { ProviderExecutionResult, ProviderStatus } from './provider-result';

export interface EmailSendPayload {
  to: string;
  subject: string;
  body: string;
  leadId: string;
  organizationId: string;
  approvedByHuman: boolean;
  /** Absolute URL of the captured website-concept screenshot to embed. */
  screenshotUrl?: string;
  /**
   * Pre-rendered raster (`data:image/png;base64,...`) of the personalized
   * website-concept card, produced by the operator's browser. Preferred over
   * `screenshotUrl` because it always shows the prospect's own business name,
   * even on hosts where the screenshot route can only return SVG (which no email
   * client can render).
   */
  screenshotDataUrl?: string;
}

export interface IEmailProvider {
  name: string;
  isConfigured(): boolean;
  getStatus(): ProviderStatus;
  sendOutreachEmail(payload: EmailSendPayload): Promise<ProviderExecutionResult<{ messageId: string }>>;
}

const SCREENSHOT_TIMEOUT_MS = 9000;
const SCREENSHOT_CID = 'websitepreview';
/** Inline attachments above this size are rejected to protect mail delivery. */
const MAX_INLINE_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_INLINE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * Decodes a `data:<mime>;base64,<payload>` raster supplied by the client.
 * Returns null for anything that is not a small, safe raster image.
 */
export function decodeInlineImageDataUrl(dataUrl?: string): Buffer | null {
  if (!dataUrl || typeof dataUrl !== 'string') return null;

  const match = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i.exec(dataUrl.trim());
  if (!match) return null;

  if (!ALLOWED_INLINE_IMAGE_TYPES.includes(match[1].toLowerCase())) return null;

  try {
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0 || buffer.length > MAX_INLINE_IMAGE_BYTES) return null;
    return buffer;
  } catch {
    return null;
  }
}

/**
 * Extracts the first http(s) URL from the outreach body. This is the demo link
 * the recipient should be able to click.
 */
export function extractDemoUrl(body: string): string | null {
  const match = (body || '').match(/https?:\/\/[^\s]+/);
  return match ? match[0].replace(/[.,)\]]+$/, '') : null;
}

/**
 * Remote fallback thumbnail service (only used when no captured screenshot is
 * supplied). Requires a publicly reachable https demo URL.
 */
function microlinkUrl(demoUrl: string): string {
  return `https://api.microlink.io?url=${encodeURIComponent(demoUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
}

/**
 * Downloads an image over http/https and returns it as a Buffer.
 * Uses the global fetch so both http (local dev) and https work, with redirects.
 */
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SCREENSHOT_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    clearTimeout(timer);
    if (!res.ok) return null;
    // Email clients cannot embed SVG, so never attach it as an inline image.
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('image/svg')) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return buffer.length > 0 ? buffer : null;
  } catch {
    return null;
  }
}

/**
 * Resolves the inline/remote image source for the email body.
 * Prefers the captured screenshot; falls back to a live screenshot service.
 */
async function resolveScreenshot(
  payload: EmailSendPayload,
  demoUrl: string | null
): Promise<{ imageBuffer: Buffer | null; remoteSrc: string | null }> {
  // 1. Prefer the raster the operator's browser already rendered from the
  //    personalized preview card (guaranteed to show the prospect's own name).
  let imageBuffer: Buffer | null = decodeInlineImageDataUrl(payload.screenshotDataUrl);

  // 2. Otherwise fetch the supplied screenshot URL.
  if (!imageBuffer && payload.screenshotUrl) {
    imageBuffer = await fetchImageBuffer(payload.screenshotUrl);
  }

  const publicFallback = demoUrl && /^https:\/\//i.test(demoUrl) ? microlinkUrl(demoUrl) : null;

  if (!imageBuffer && publicFallback) {
    imageBuffer = await fetchImageBuffer(publicFallback);
  }

  const remoteSrc = payload.screenshotUrl || publicFallback || null;
  return { imageBuffer, remoteSrc };
}

/**
 * Clean, human-looking HTML template that mimics personal agency communication.
 * Avoids aggressive spam triggers (NO heavy colored headers, NO "UNSUBSCRIBE" blast text).
 * The image block and CTA are only rendered when a demo URL is available, so we
 * never invent a broken placeholder link.
 */
export function buildInboxFriendlyHtml(
  payload: EmailSendPayload,
  imageSrc: string | null,
  demoUrl: string | null
): string {
  const cleanBodyText = payload.body.replace(/Preview Snapshot:[\s\S]*?(Best regards|$)/i, '$1');

  const imageBlock =
    demoUrl && imageSrc
      ? `
        <div style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff;">
          <a href="${demoUrl}" target="_blank" style="text-decoration: none; display: block;">
            <img src="${imageSrc}" style="width: 100%; height: auto; display: block; border-bottom: 1px solid #e2e8f0;" alt="Interactive Practice Website Concept" />
          </a>
          <div style="padding: 10px 14px; background: #f8fafc; font-size: 12px; font-weight: 600; color: #475569;">
            Live Interactive Concept Preview (Click image or link below to view)
          </div>
        </div>`
      : '';

  const ctaBlock = demoUrl
    ? `
        <div style="margin: 20px 0;">
          <a href="${demoUrl}" target="_blank" style="display: inline-block; background-color: #1a73e8; color: #ffffff !important; padding: 10px 22px; border-radius: 5px; text-decoration: none; font-weight: 600; font-size: 13px;">
            Open Live Interactive Website Demo &rarr;
          </a>
        </div>`
    : '';

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
${imageBlock}
${ctaBlock}
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
    // Credentials must come from the environment. Never commit real
    // credentials or ship a working fallback that would silently send mail.
    const rawUser = process.env.GMAIL_USER || '';
    const rawPass = process.env.GMAIL_APP_PASSWORD || '';

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
        auth: { user, pass },
      });

      const demoUrl = extractDemoUrl(payload.body);
      const { imageBuffer, remoteSrc } = await resolveScreenshot(payload, demoUrl);
      const hasInlineCid = Boolean(imageBuffer);
      const imageSrc = hasInlineCid ? `cid:${SCREENSHOT_CID}` : remoteSrc;

      const htmlBody = buildInboxFriendlyHtml(payload, imageSrc, demoUrl);

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
            cid: SCREENSHOT_CID,
          },
        ];
      }

      const info = await transporter.sendMail(mailOptions);

      return {
        success: true,
        configured: true,
        isMock: false,
        data: { messageId: info.messageId },
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
      const demoUrl = extractDemoUrl(payload.body);
      const { imageBuffer, remoteSrc } = await resolveScreenshot(payload, demoUrl);
      // An inline CID attachment works with or without a public fallback URL.
      const hasInlineCid = Boolean(imageBuffer);
      const imageSrc = hasInlineCid ? `cid:${SCREENSHOT_CID}` : remoteSrc;

      const htmlBody = buildInboxFriendlyHtml(payload, imageSrc, demoUrl);

      const requestBody: Record<string, unknown> = {
        from: fromEmail,
        to: payload.to,
        subject: payload.subject,
        text: payload.body,
        html: htmlBody,
      };

      if (hasInlineCid && imageBuffer) {
        requestBody.attachments = [
          {
            filename: 'website-preview.png',
            content: imageBuffer.toString('base64'),
            content_id: SCREENSHOT_CID,
          },
        ];
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
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
        data: { messageId: data.id || `msg-${Date.now()}` },
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
