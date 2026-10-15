import { WebsiteContent } from '@/types';
import { LeadFacts } from './templates';

export interface StitchDesignMeta {
  id: string;
  templateFolder: string;
  name: string;
  conceptName: string;
}

export const STITCH_DESIGN_MAP: Record<string, StitchDesignMeta> = {
  'design-1-premium': {
    id: 'design-1-premium',
    templateFolder: 'template_1',
    name: 'Design 1: Premium Editorial',
    conceptName: 'Venerable Jurisprudence',
  },
  'design-2-minimalist': {
    id: 'design-2-minimalist',
    templateFolder: 'template_2',
    name: 'Design 2: Minimalist Ledger',
    conceptName: 'Architectural Ledger',
  },
  'design-3-contemporary': {
    id: 'design-3-contemporary',
    templateFolder: 'template_3',
    name: 'Design 3: Contemporary Corporate',
    conceptName: 'Executive Capital / New Delhi',
  },
  // Legacy & Archetype Aliases for Seamless Backward Compatibility
  EDITORIAL_FINANCE: {
    id: 'design-1-premium',
    templateFolder: 'template_1',
    name: 'Design 1: Premium Editorial',
    conceptName: 'Venerable Jurisprudence',
  },
  SWISS_MINIMAL: {
    id: 'design-2-minimalist',
    templateFolder: 'template_2',
    name: 'Design 2: Minimalist Ledger',
    conceptName: 'Architectural Ledger',
  },
  MODERN_FINTECH: {
    id: 'design-3-contemporary',
    templateFolder: 'template_3',
    name: 'Design 3: Contemporary Corporate',
    conceptName: 'Executive Capital / New Delhi',
  },
  MODERN_INDIAN: {
    id: 'design-1-premium',
    templateFolder: 'template_1',
    name: 'Design 1: Premium Editorial',
    conceptName: 'Venerable Jurisprudence',
  },
  LUXURY_PROFESSIONAL: {
    id: 'design-3-contemporary',
    templateFolder: 'template_3',
    name: 'Design 3: Contemporary Corporate',
    conceptName: 'Executive Capital / New Delhi',
  },
  CORPORATE_TRANSFER_PRICING: {
    id: 'design-1-premium',
    templateFolder: 'template_1',
    name: 'Design 1: Premium Editorial',
    conceptName: 'Venerable Jurisprudence',
  },
  MANUFACTURING_GST_LITIGATION: {
    id: 'design-2-minimalist',
    templateFolder: 'template_2',
    name: 'Design 2: Minimalist Ledger',
    conceptName: 'Architectural Ledger',
  },
  VIRTUAL_CFO_STARTUP: {
    id: 'design-3-contemporary',
    templateFolder: 'template_3',
    name: 'Design 3: Contemporary Corporate',
    conceptName: 'Executive Capital / New Delhi',
  },
  INSTITUTIONAL_AUDIT_ASSURANCE: {
    id: 'design-2-minimalist',
    templateFolder: 'template_2',
    name: 'Design 2: Minimalist Ledger',
    conceptName: 'Architectural Ledger',
  },
  NRI_CROSS_BORDER_TAX: {
    id: 'design-3-contemporary',
    templateFolder: 'template_3',
    name: 'Design 3: Contemporary Corporate',
    conceptName: 'Executive Capital / New Delhi',
  },
  DIRECT_TAX_LITIGATION: {
    id: 'design-1-premium',
    templateFolder: 'template_1',
    name: 'Design 1: Premium Editorial',
    conceptName: 'Venerable Jurisprudence',
  },
  FAMILY_OFFICE_ESTATE: {
    id: 'design-1-premium',
    templateFolder: 'template_1',
    name: 'Design 1: Premium Editorial',
    conceptName: 'Venerable Jurisprudence',
  },
};

/**
 * Returns true if the layout corresponds to a Google Stitch design template.
 */
export function isStitchLayout(layoutKey?: string): boolean {
  if (!layoutKey) return false;
  return Boolean(STITCH_DESIGN_MAP[layoutKey]);
}


/**
 * Dynamic personalizer that replaces placeholder business facts in the Stitch HTML
 * with real prospect details (firm name, city, address, phone, email, WhatsApp).
 */
export function personalizeStitchHtml(
  rawHtml: string,
  contentOrFacts: WebsiteContent | Partial<LeadFacts> | any
): string {
  if (!rawHtml) return '';

  // Extract fields gracefully whether passed WebsiteContent or LeadFacts
  const brandName =
    contentOrFacts?.brand?.businessName ||
    contentOrFacts?.businessName ||
    'Chartered Accountants';

  const city =
    contentOrFacts?.location?.city ||
    contentOrFacts?.city ||
    'Gurgaon';

  const rawAddress =
    contentOrFacts?.location?.address ||
    contentOrFacts?.address ||
    `${city}, India`;

  const phone =
    contentOrFacts?.contact?.publicPhone ||
    contentOrFacts?.publicPhone ||
    contentOrFacts?.location?.phone ||
    '+91 99999 99999';

  const cleanPhone = phone.replace(/[^0-9]/g, '') || '919999999999';

  const slug = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const email =
    contentOrFacts?.contact?.publicEmail ||
    contentOrFacts?.publicEmail ||
    `consultations@${slug || 'practice'}.in`;

  const profession =
    contentOrFacts?.meta?.profession ||
    contentOrFacts?.profession ||
    'Chartered Accountants';

  const isCaPractice = /chartered accountant|ca firm|tax advisory|auditor|accounting practice/i.test(
    `${profession} ${brandName}`
  );
  const isAiSynthesized =
    contentOrFacts?.hero?.provenance === 'AI_SYNTHESIZED' ||
    contentOrFacts?.brand?.provenance === 'AI_SYNTHESIZED';

  // If this is an SMB / non-CA profession OR has AI synthesized custom content, render the dedicated standalone HTML
  if (!isCaPractice || isAiSynthesized) {
    return generateStandaloneProfessionHtml(contentOrFacts);
  }

  let html = rawHtml;

  // 1. Title tag
  html = html.replace(
    /<title>.*?<\/title>/i,
    `<title>${escapeHtml(brandName)} | ${escapeHtml(profession)} — ${escapeHtml(city)}</title>`
  );

  // 2. Brand Name substitutions (exact and HTML-escaped variants)
  const escapedBrand = escapeHtml(brandName);
  html = html.replaceAll('Sharma &amp; Associates', escapedBrand);
  html = html.replaceAll('Sharma & Associates', escapedBrand);
  html = html.replaceAll('SHARMA &amp; ASSOCIATES', escapedBrand.toUpperCase());
  html = html.replaceAll('SHARMA & ASSOCIATES', escapedBrand.toUpperCase());

  // 2b. Hero Business Name & Firm Identity Injection (Huge, unmissable branding in Hero section)
  const aiBadge = contentOrFacts?.hero?.badge;
  const badgeText = aiBadge ? escapeHtml(aiBadge) : `✦ ${escapedBrand} • ${escapeHtml(city)}`;

  const heroBadgePill = `
<div style="margin-bottom: 14px; display: inline-flex; align-items: center; gap: 8px; background: rgba(212, 175, 55, 0.18); border: 1px solid rgba(212, 175, 55, 0.5); padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 700; color: #b45309; letter-spacing: 0.06em; text-transform: uppercase;">
  <span>${badgeText.startsWith('✦') ? badgeText : `✦ ${badgeText}`}</span>
</div>`;

  // Replace any existing generic eyebrow badge before the h1 with the gold firm badge pill
  if (/<div[^>]*class="[^"]*inline-flex items-center gap-2[^"]*mb-6"[^>]*>[\s\S]*?<\/div>/i.test(html)) {
    html = html.replace(/<div[^>]*class="[^"]*inline-flex items-center gap-2[^"]*mb-6"[^>]*>[\s\S]*?<\/div>/i, heroBadgePill);
  }

  const aiHeadline = contentOrFacts?.hero?.headline;
  const aiSubheadline = contentOrFacts?.hero?.subheadline;
  const headlineSubtitle = aiHeadline
    ? `${escapeHtml(aiHeadline)}${aiSubheadline ? ` — ${escapeHtml(aiSubheadline)}` : ''}`
    : `Trusted Professional Services &amp; Advisory in ${escapeHtml(city)}`;

  const heroHeadlineContent = `
<span style="display:block; color:inherit; font-size:1.12em; font-weight:800; letter-spacing:-0.02em; margin-bottom:6px; line-height:1.15;">${escapedBrand}</span>
<span style="display:block; font-size:0.70em; font-weight:500; opacity:0.9; line-height:1.25;">${headlineSubtitle}</span>`;

  // Inject the prominent business name & headline right into the primary Hero <h1>
  html = html.replace(/(<h1[^>]*>)([\s\S]*?)(<\/h1>)/i, (_match, openTag, _inner, closeTag) => {
    return `${openTag}\n${heroHeadlineContent}\n${closeTag}`;
  });

  // 2c. Dynamic CTA label replacement if custom CTA provided
  const ctaLabel = contentOrFacts?.hero?.primaryCta?.label;
  if (ctaLabel) {
    const escapedCta = escapeHtml(ctaLabel);
    html = html.replaceAll('Schedule Consultation', escapedCta);
    html = html.replaceAll('Book Consultation', escapedCta);
    html = html.replaceAll('Schedule A Consultation', escapedCta);
  }

  // 2d. Dynamic Services replacement if custom/AI services provided
  if (Array.isArray(contentOrFacts?.services?.items) && contentOrFacts.services.items.length > 0) {
    const defaultServices = [
      'Statutory Audit &amp; Assurance',
      'Corporate Tax &amp; Advisory',
      'GST &amp; Indirect Tax Litigation',
      'Transfer Pricing &amp; Cross-Border',
    ];
    contentOrFacts.services.items.slice(0, 4).forEach((srv: any, idx: number) => {
      if (srv?.title && defaultServices[idx]) {
        const escapedTitle = escapeHtml(srv.title);
        html = html.replaceAll(defaultServices[idx], escapedTitle);
        html = html.replaceAll(defaultServices[idx].replace(/&amp;/g, '&'), escapedTitle);
      }
    });

    if (contentOrFacts?.services?.sectionTitle) {
      const escapedSecTitle = escapeHtml(contentOrFacts.services.sectionTitle);
      html = html.replaceAll('Practice Areas &amp; Core Disciplines', escapedSecTitle);
      html = html.replaceAll('Practice Areas & Core Disciplines', escapedSecTitle);
      html = html.replaceAll('Areas of Practice', escapedSecTitle);
    }
  }

  // 3. City & Address substitutions
  html = html.replaceAll('Connaught Place, New Delhi', escapeHtml(rawAddress));
  html = html.replaceAll('Barakhamba Road, Connaught Place,<br/>New Delhi – 110001, India', escapeHtml(rawAddress));
  html = html.replaceAll('Barakhamba Road, Connaught Place,<br>New Delhi – 110001, India', escapeHtml(rawAddress));
  html = html.replaceAll('Kasturba Gandhi Marg, Connaught Place, New Delhi – 110001', escapeHtml(rawAddress));
  html = html.replaceAll('New Delhi Office', `${escapeHtml(city)} Office`);
  html = html.replaceAll('• New Delhi', `• ${escapeHtml(city)}`);
  html = html.replaceAll('— New Delhi', `— ${escapeHtml(city)}`);
  html = html.replaceAll('New Delhi', escapeHtml(city));

  // 4. Phone & Email substitutions
  html = html.replaceAll('+91 (011) 2345-6789 / 90', escapeHtml(phone));
  html = html.replaceAll('+91 (011) 2345-6789', escapeHtml(phone));
  html = html.replaceAll('+91 011 2345 6789', escapeHtml(phone));
  html = html.replaceAll('+9101123456789', escapeHtml(cleanPhone));
  html = html.replaceAll('tel:+9101123456789', `tel:${escapeHtml(cleanPhone)}`);
  html = html.replaceAll('consultations@sharmaassociates-ca.in', escapeHtml(email));
  html = html.replaceAll('mailto:consultations@sharmaassociates-ca.in', `mailto:${escapeHtml(email)}`);

  // 4b. Remove any embedded styles that lock scrolling or hide scrollbars
  html = html.replaceAll('overscroll-behavior:none;', 'overscroll-behavior:auto;');
  html = html.replaceAll('overscroll-behavior: none;', 'overscroll-behavior: auto;');
  html = html.replaceAll('overscroll-behavior:none', 'overscroll-behavior:auto');
  html = html.replaceAll('overscroll-behavior: none', 'overscroll-behavior: auto');
  html = html.replaceAll('::-webkit-scrollbar{display:none;}', '');
  html = html.replaceAll('::-webkit-scrollbar { display: none; }', '');

  // 5. Inject CSS for smooth, natural scrolling and visible, draggable scrollbar
  const injectedStyle = `
<style>
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    overscroll-behavior: auto !important;
    overscroll-behavior-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    touch-action: pan-y !important;
  }
  html {
    scroll-behavior: smooth !important;
    height: 100% !important;
  }
  body {
    min-height: 100% !important;
    height: auto !important;
  }
  /* Modern clean visible scrollbar */
  ::-webkit-scrollbar {
    width: 8px !important;
    height: 8px !important;
    display: block !important;
  }
  ::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.05) !important;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(100, 116, 139, 0.5) !important;
    border-radius: 9999px !important;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(100, 116, 139, 0.8) !important;
  }
  /* Hero Zoom Mode when screenshot=true */
  html.screenshot-mode, body.screenshot-mode {
    zoom: 1.22 !important;
    overflow: hidden !important;
  }
</style>
`;

  if (html.includes('</head>')) {
    html = html.replace('</head>', `${injectedStyle}</head>`);
  } else {
    html = injectedStyle + html;
  }

  // 6. Inject client script for simulated form submission and screenshot zoom mode
  const injectedScript = `
<script>
  (function() {
    // Zoom in on Hero section when capturing automated screenshot
    if (typeof window !== 'undefined' && window.location.search.includes('screenshot=true')) {
      document.documentElement.style.zoom = '1.22';
      document.body.style.overflow = 'hidden';
      document.documentElement.classList.add('screenshot-mode');
      document.body.classList.add('screenshot-mode');
    }

    // Interactive simulated form submission
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('form').forEach(function(form) {
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          var toast = document.createElement('div');
          toast.style.position = 'fixed';
          toast.style.bottom = '24px';
          toast.style.left = '50%';
          toast.style.transform = 'translateX(-50%)';
          toast.style.backgroundColor = '#0f172a';
          toast.style.color = '#f8fafc';
          toast.style.padding = '12px 20px';
          toast.style.borderRadius = '12px';
          toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
          toast.style.fontSize = '13px';
          toast.style.zIndex = '99999';
          toast.style.display = 'flex';
          toast.style.alignItems = 'center';
          toast.style.gap = '8px';
          toast.style.border = '1px solid #334155';
          toast.innerHTML = '<span>✅ Consultation request simulated for <strong>${escapeHtml(brandName)}</strong>.</span>';
          document.body.appendChild(toast);
          setTimeout(function() { toast.remove(); }, 4000);
          form.reset();
        });
      });
    });
  })();
</script>
`;

  // Inject before </body> if present, else append
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${injectedScript}</body>`);
  } else {
    html += injectedScript;
  }

  return html;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates a complete, responsive standalone HTML page for SMB and AI-synthesized concepts.
 * Never leaks CA firm branding or static CA legal text.
 */
export function generateStandaloneProfessionHtml(contentOrFacts: any): string {
  const brandName =
    contentOrFacts?.brand?.businessName ||
    contentOrFacts?.businessName ||
    'Professional Practice';

  const city =
    contentOrFacts?.location?.city ||
    contentOrFacts?.city ||
    'Delhi NCR';

  const rawAddress =
    contentOrFacts?.location?.address ||
    contentOrFacts?.address ||
    `${city}, India`;

  const phone =
    contentOrFacts?.contact?.publicPhone ||
    contentOrFacts?.publicPhone ||
    contentOrFacts?.location?.phone ||
    '+91 99999 99999';

  const cleanPhone = phone.replace(/[^0-9]/g, '') || '919999999999';

  const slug = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const email =
    contentOrFacts?.contact?.publicEmail ||
    contentOrFacts?.publicEmail ||
    `contact@${slug || 'practice'}.in`;

  const profession =
    contentOrFacts?.meta?.profession ||
    contentOrFacts?.profession ||
    'Professional Practice';

  const heroBadge = contentOrFacts?.hero?.badge || `✦ ${brandName} • ${city}`;
  const heroHeadline = contentOrFacts?.hero?.headline || `${profession} Services in ${city}`;
  const heroSubheadline =
    contentOrFacts?.hero?.subheadline ||
    `Dedicated professional solutions tailored for clients in ${city} and surrounding areas.`;
  const primaryCta = contentOrFacts?.hero?.primaryCta?.label || 'Schedule Consultation';

  const services =
    Array.isArray(contentOrFacts?.services?.items) && contentOrFacts.services.items.length > 0
      ? contentOrFacts.services.items.slice(0, 4)
      : [
          {
            title: `Specialized ${profession} Consultation`,
            description: `Tailored advisory and initial scoping for clients in ${city}.`,
          },
          {
            title: 'Project Execution & Delivery',
            description: 'Methodical delivery adhering to safety and quality benchmarks.',
          },
          {
            title: 'Maintenance & Ongoing Support',
            description: 'Scheduled follow-ups and responsive assistance.',
          },
          {
            title: 'Customer Satisfaction Guarantee',
            description: 'Verified workmanship backed by local commitment.',
          },
        ];

  const secTitle = contentOrFacts?.services?.sectionTitle || 'Core Services & Specialties';
  const secSubtitle =
    contentOrFacts?.services?.sectionSubtitle ||
    `Comprehensive ${profession.toLowerCase()} solutions tailored to your requirements in ${city}.`;

  const aboutLead =
    contentOrFacts?.about?.leadParagraph ||
    `${brandName} is a leading ${profession.toLowerCase()} provider based in ${city}.`;
  const aboutBody =
    contentOrFacts?.about?.body ||
    `We deliver reliable, standards-driven solutions tailored to our clients' unique requirements with deep practical experience and local dedication.`;

  const highlights =
    Array.isArray(contentOrFacts?.about?.highlights) && contentOrFacts.about.highlights.length > 0
      ? contentOrFacts.about.highlights.slice(0, 4)
      : [
          {
            title: 'Verified Workmanship',
            description: 'Adherence to industry benchmarks and certified quality standards.',
          },
          {
            title: 'Transparent Costing',
            description: 'Itemized estimates with zero hidden charges or surprises.',
          },
          {
            title: 'Prompt Local Support',
            description: `Fast, dependable turnaround across ${city} and NCR.`,
          },
          {
            title: 'Customer Satisfaction',
            description: 'Committed to exceeding client expectations on every engagement.',
          },
        ];

  const whyChooseUs =
    Array.isArray(contentOrFacts?.whyChooseUs?.points) && contentOrFacts.whyChooseUs.points.length > 0
      ? contentOrFacts.whyChooseUs.points.slice(0, 4)
      : [
          { title: 'Local Reliability', description: `Deep roots in ${city} with a stellar local track record.` },
          { title: 'Skilled Specialists', description: 'Experienced practitioners with extensive field expertise.' },
          { title: 'Transparent Communication', description: 'Clear project milestones and regular progress updates.' },
          { title: 'Satisfaction Guarantee', description: 'We stand firmly behind our work from start to finish.' },
        ];

  const processSteps =
    Array.isArray(contentOrFacts?.process?.steps) && contentOrFacts.process.steps.length > 0
      ? contentOrFacts.process.steps.slice(0, 4)
      : [
          {
            number: '01',
            title: 'Consultation & Scoping',
            description: `We assess your specific requirements and operational context in ${city}.`,
          },
          {
            number: '02',
            title: 'Customized Proposal',
            description: 'Transparent scope, timeline, and itemized estimation.',
          },
          {
            number: '03',
            title: 'Precision Execution',
            description: 'Careful execution using modern tools and high-grade standards.',
          },
          {
            number: '04',
            title: 'Review & Ongoing Care',
            description: 'Comprehensive quality review and post-delivery assistance.',
          },
        ];

  const faqs =
    Array.isArray(contentOrFacts?.faq?.items) && contentOrFacts.faq.items.length > 0
      ? contentOrFacts.faq.items.slice(0, 3)
      : [
          {
            question: `How do I book an appointment or service in ${city}?`,
            answer: `You can reach ${brandName} directly by phone at ${phone} or click the WhatsApp button for instant confirmation.`,
          },
          {
            question: 'What are your turnaround times?',
            answer:
              'We accommodate same-day consultations when available and provide realistic, firm timeline commitments before starting work.',
          },
          {
            question: 'Do you offer upfront estimates?',
            answer:
              'Yes, we always provide transparent, itemized quotes before beginning any engagement so you have total clarity.',
          },
        ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(brandName)} | ${escapeHtml(profession)} in ${escapeHtml(city)}</title>
  <meta name="description" content="${escapeHtml(heroSubheadline)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f293d;
      --accent-gold: #f59e0b;
      --accent-blue: #3b82f6;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background-color: var(--bg);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      overflow-x: hidden;
      overflow-y: auto;
      scroll-behavior: smooth;
    }
    a { color: inherit; text-decoration: none; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(12px);
      background: rgba(9, 13, 22, 0.85);
      border-bottom: 1px solid var(--card-border);
      padding: 16px 0;
    }
    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand-logo {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-logo span.tag {
      font-size: 11px;
      padding: 2px 8px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: var(--accent-gold);
      border-radius: 9999px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .nav-links { display: flex; align-items: center; gap: 24px; }
    .nav-link { font-size: 14px; font-weight: 500; color: var(--text-muted); transition: color 0.2s; }
    .nav-link:hover { color: #fff; }
    .btn-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 20px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .btn-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45); }
    .hero {
      padding: 90px 0 70px;
      text-align: center;
      position: relative;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: -100px;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 350px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.18) 0%, rgba(9, 13, 22, 0) 70%);
      pointer-events: none;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      border-radius: 9999px;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fbbf24;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 24px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .hero h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 52px;
      line-height: 1.15;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #fff;
      max-width: 900px;
      margin: 0 auto 16px;
    }
    .hero h1 .firm-highlight {
      display: block;
      color: #60a5fa;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.01em;
      margin-bottom: 8px;
    }
    .hero p {
      font-size: 19px;
      color: var(--text-muted);
      max-width: 720px;
      margin: 0 auto 36px;
      line-height: 1.6;
    }
    .hero-actions { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      padding: 12px 24px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); }
    .section-title-wrap {
      text-align: center;
      max-width: 700px;
      margin: 0 auto 50px;
    }
    .section-tag {
      font-size: 12px;
      font-weight: 700;
      color: var(--accent-gold);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
      display: block;
    }
    .section-h2 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 36px;
      font-weight: 700;
      color: #fff;
      line-height: 1.25;
      margin-bottom: 12px;
    }
    .section-desc {
      font-size: 16px;
      color: var(--text-muted);
    }
    .services-section { padding: 80px 0; border-top: 1px solid var(--card-border); }
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 24px;
    }
    .service-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 30px;
      position: relative;
      transition: transform 0.2s, border-color 0.2s;
    }
    .service-card:hover {
      transform: translateY(-4px);
      border-color: #3b82f6;
    }
    .service-num {
      font-size: 13px;
      font-weight: 800;
      color: var(--accent-gold);
      font-family: monospace;
      margin-bottom: 14px;
    }
    .service-card h3 {
      font-size: 19px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 12px;
      line-height: 1.35;
    }
    .service-card p {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.6;
    }
    .about-section {
      padding: 80px 0;
      border-top: 1px solid var(--card-border);
      background: rgba(17, 24, 39, 0.4);
    }
    .about-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 50px;
      align-items: center;
    }
    .about-text h3 {
      font-size: 28px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    .about-text .lead {
      font-size: 17px;
      color: #cbd5e1;
      margin-bottom: 16px;
      font-weight: 500;
    }
    .about-text .body {
      font-size: 15px;
      color: var(--text-muted);
      margin-bottom: 24px;
      line-height: 1.7;
    }
    .highlights-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .highlight-box {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 16px;
    }
    .highlight-box strong {
      display: block;
      color: #fff;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .highlight-box span {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.4;
      display: block;
    }
    .process-section { padding: 80px 0; border-top: 1px solid var(--card-border); }
    .process-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }
    .process-step {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 24px;
    }
    .process-badge {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.15);
      border: 1px solid #2563eb;
      color: #60a5fa;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      margin-bottom: 14px;
    }
    .process-step h4 { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 8px; }
    .process-step p { font-size: 13px; color: var(--text-muted); line-height: 1.5; }
    .faq-section {
      padding: 80px 0;
      border-top: 1px solid var(--card-border);
      background: rgba(17, 24, 39, 0.3);
    }
    .faq-list { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .faq-item {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 24px;
    }
    .faq-item h4 { font-size: 17px; font-weight: 600; color: #fff; margin-bottom: 8px; }
    .faq-item p { font-size: 14px; color: var(--text-muted); line-height: 1.6; }
    footer {
      padding: 60px 0 40px;
      border-top: 1px solid var(--card-border);
      background: #050811;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    .footer-brand h4 { font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 12px; }
    .footer-brand p { font-size: 14px; color: var(--text-muted); max-width: 320px; line-height: 1.6; }
    .footer-col h5 { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    .footer-col p { font-size: 14px; color: var(--text-muted); line-height: 1.8; }
    .footer-bottom {
      border-top: 1px solid var(--card-border);
      padding-top: 24px;
      text-align: center;
      font-size: 13px;
      color: #64748b;
    }
    .floating-claim {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 12px;
      background: #25d366;
      color: #000;
      padding: 12px 20px;
      border-radius: 9999px;
      font-weight: 800;
      font-size: 14px;
      box-shadow: 0 10px 25px rgba(37, 211, 102, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .floating-claim:hover {
      transform: scale(1.04);
      box-shadow: 0 14px 30px rgba(37, 211, 102, 0.6);
    }
    @media (max-width: 768px) {
      .hero h1 { font-size: 34px; }
      .about-grid, .footer-grid { grid-template-columns: 1fr; gap: 30px; }
      .highlights-grid { grid-template-columns: 1fr; }
      .nav-links { display: none; }
    }
  </style>
</head>
<body>
  <header>
    <div class="container header-inner">
      <div class="brand-logo">
        ${escapeHtml(brandName)}
        <span class="tag">${escapeHtml(profession)}</span>
      </div>
      <nav class="nav-links">
        <a href="#services" class="nav-link">Services</a>
        <a href="#about" class="nav-link">About</a>
        <a href="#process" class="nav-link">Process</a>
        <a href="#faq" class="nav-link">FAQ</a>
      </nav>
      <a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener noreferrer" class="btn-cta">
        ${escapeHtml(primaryCta)}
      </a>
    </div>
  </header>
  <section class="hero">
    <div class="container">
      <div class="hero-badge">
        <span>${escapeHtml(heroBadge)}</span>
      </div>
      <h1>
        <span class="firm-highlight">${escapeHtml(brandName)}</span>
        ${escapeHtml(heroHeadline)}
      </h1>
      <p>${escapeHtml(heroSubheadline)}</p>
      <div class="hero-actions">
        <a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener noreferrer" class="btn-cta" style="padding: 14px 28px; font-size: 16px;">
          ${escapeHtml(primaryCta)}
        </a>
        <a href="#services" class="btn-secondary">
          Explore Specialties
        </a>
      </div>
    </div>
  </section>
  <section id="services" class="services-section">
    <div class="container">
      <div class="section-title-wrap">
        <span class="section-tag">${escapeHtml(profession)}</span>
        <h2 class="section-h2">${escapeHtml(secTitle)}</h2>
        <p class="section-desc">${escapeHtml(secSubtitle)}</p>
      </div>
      <div class="services-grid">
        ${services
          .map(
            (s: any, idx: number) => `
          <div class="service-card">
            <div class="service-num">0${idx + 1} // SPECIALTY</div>
            <h3>${escapeHtml(s.title)}</h3>
            <p>${escapeHtml(s.description)}</p>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  </section>
  <section id="about" class="about-section">
    <div class="container">
      <div class="about-grid">
        <div class="about-text">
          <span class="section-tag">About Our Practice</span>
          <h3>Trusted Expertise in ${escapeHtml(city)}</h3>
          <p class="lead">${escapeHtml(aboutLead)}</p>
          <p class="body">${escapeHtml(aboutBody)}</p>
          <a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener noreferrer" class="btn-cta">
            Connect With Us
          </a>
        </div>
        <div class="highlights-grid">
          ${highlights
            .map(
              (h: any) => `
            <div class="highlight-box">
              <strong>${escapeHtml(h.title)}</strong>
              <span>${escapeHtml(h.description)}</span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  </section>
  <section class="services-section">
    <div class="container">
      <div class="section-title-wrap">
        <span class="section-tag">Quality Commitment</span>
        <h2 class="section-h2">Why Clients Choose ${escapeHtml(brandName)}</h2>
        <p class="section-desc">Delivering excellence, transparent guidance, and trusted results in ${escapeHtml(city)}.</p>
      </div>
      <div class="services-grid">
        ${whyChooseUs
          .map(
            (w: any) => `
          <div class="service-card">
            <h3 style="color: #60a5fa;">✓ ${escapeHtml(w.title)}</h3>
            <p>${escapeHtml(w.description)}</p>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  </section>
  <section id="process" class="process-section">
    <div class="container">
      <div class="section-title-wrap">
        <span class="section-tag">How We Work</span>
        <h2 class="section-h2">Our Working Methodology</h2>
        <p class="section-desc">A structured, predictable roadmap from consultation to completion.</p>
      </div>
      <div class="process-grid">
        ${processSteps
          .map(
            (p: any) => `
          <div class="process-step">
            <div class="process-badge">${escapeHtml(p.number || '01')}</div>
            <h4>${escapeHtml(p.title)}</h4>
            <p>${escapeHtml(p.description)}</p>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  </section>
  <section id="faq" class="faq-section">
    <div class="container">
      <div class="section-title-wrap">
        <span class="section-tag">Common Inquiries</span>
        <h2 class="section-h2">Frequently Asked Questions</h2>
        <p class="section-desc">Straightforward answers about our services and scheduling.</p>
      </div>
      <div class="faq-list">
        ${faqs
          .map(
            (f: any) => `
          <div class="faq-item">
            <h4>${escapeHtml(f.question)}</h4>
            <p>${escapeHtml(f.answer)}</p>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  </section>
  <footer>
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <h4>${escapeHtml(brandName)}</h4>
          <p>${escapeHtml(aboutLead)}</p>
        </div>
        <div class="footer-col">
          <h5>Contact</h5>
          <p>📞 ${escapeHtml(phone)}</p>
          <p>✉️ ${escapeHtml(email)}</p>
        </div>
        <div class="footer-col">
          <h5>Location</h5>
          <p>📍 ${escapeHtml(rawAddress)}</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© ${new Date().getFullYear()} ${escapeHtml(brandName)}. All rights reserved. Personalized concept preview.</p>
      </div>
    </div>
  </footer>
  <a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener noreferrer" class="floating-claim">
    <span>💬 Chat on WhatsApp</span>
  </a>
</body>
</html>`;
}
