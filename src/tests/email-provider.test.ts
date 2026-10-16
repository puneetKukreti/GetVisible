import { describe, it, expect } from 'vitest';
import { buildInboxFriendlyHtml, extractDemoUrl, EmailSendPayload } from '@/lib/providers/email.provider';

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
