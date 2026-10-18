import { describe, it, expect } from 'vitest';
import {
  buildInboxFriendlyHtml,
  decodeInlineImageDataUrl,
  extractDemoUrl,
  EmailSendPayload,
} from '@/lib/providers/email.provider';

const basePayload: EmailSendPayload = {
  to: 'owner@example.com',
  subject: 'Website Concept Prepared for Acme',
  body: 'Hello,\n\nPreview the concept: https://app.example/demo/acme-123',
  leadId: 'lead-1',
  organizationId: 'org-1',
  approvedByHuman: true,
  screenshotUrl: 'https://app.example/api/demos/lead-1/screenshot?format=image',
};

describe('Email provider — outreach HTML building', () => {
  it('embeds the demo link and the captured screenshot image', () => {
    const html = buildInboxFriendlyHtml(
      basePayload,
      basePayload.screenshotUrl!,
      'https://app.example/demo/acme-123'
    );

    expect(html).toContain('https://app.example/demo/acme-123');
    expect(html).toContain('src="https://app.example/api/demos/lead-1/screenshot?format=image"');
    expect(html).toContain('Open Live Interactive Website Demo');
  });

  it('renders an inline CID image source when a screenshot buffer is attached', () => {
    const html = buildInboxFriendlyHtml(
      basePayload,
      'cid:websitepreview',
      'https://app.example/demo/acme-123'
    );

    expect(html).toContain('src="cid:websitepreview"');
  });

  it('never invents a placeholder demo link or image when none is available', () => {
    const html = buildInboxFriendlyHtml(
      { ...basePayload, body: 'Hello there, no link here.' },
      null,
      null
    );

    expect(html).not.toContain('get-visible-web.vercel.app');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('Open Live Interactive Website Demo');
    expect(html).toContain('Hello there, no link here.');
  });
});

describe('Email provider — demo URL extraction', () => {
  it('extracts the first http(s) URL and strips trailing punctuation', () => {
    expect(extractDemoUrl('See the concept at https://app.example/demo/acme-123.')).toBe(
      'https://app.example/demo/acme-123'
    );
  });

  it('returns null when the body has no link', () => {
    expect(extractDemoUrl('No links in this message')).toBeNull();
  });
});

// The dashboard rasterizes the personalized preview card and posts it as a data
// URL, so this parser is the trust boundary for operator/client-supplied image
// bytes that get attached to an outbound email.
describe('Email provider — inline preview data URL parsing', () => {
  const ONE_PIXEL_PNG =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  it('decodes a PNG data URL into a real image buffer', () => {
    const buffer = decodeInlineImageDataUrl(`data:image/png;base64,${ONE_PIXEL_PNG}`);
    expect(buffer).not.toBeNull();
    expect(buffer!.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  });

  it('accepts jpeg and webp rasters', () => {
    expect(decodeInlineImageDataUrl(`data:image/jpeg;base64,${ONE_PIXEL_PNG}`)).not.toBeNull();
    expect(decodeInlineImageDataUrl(`data:image/webp;base64,${ONE_PIXEL_PNG}`)).not.toBeNull();
  });

  it('rejects SVG and non-image payloads', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>').toString('base64');
    expect(decodeInlineImageDataUrl(`data:image/svg+xml;base64,${svg}`)).toBeNull();
    expect(decodeInlineImageDataUrl(`data:text/html;base64,${svg}`)).toBeNull();
    expect(decodeInlineImageDataUrl(`data:application/pdf;base64,${ONE_PIXEL_PNG}`)).toBeNull();
  });

  it('rejects plain URLs, empty values and malformed base64', () => {
    expect(decodeInlineImageDataUrl('https://app.example/hero.png')).toBeNull();
    expect(decodeInlineImageDataUrl('data:image/png;base64,')).toBeNull();
    expect(decodeInlineImageDataUrl(`data:image/png;base64,${ONE_PIXEL_PNG}!!`)).toBeNull();
    expect(decodeInlineImageDataUrl(undefined)).toBeNull();
    expect(decodeInlineImageDataUrl('')).toBeNull();
  });

  it('rejects payloads above the inline attachment cap', () => {
    const oversized = 'A'.repeat(6 * 1024 * 1024);
    expect(decodeInlineImageDataUrl(`data:image/png;base64,${oversized}`)).toBeNull();
  });
});
