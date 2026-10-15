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
  const heroBadgePill = `
<div style="margin-bottom: 12px; display: inline-flex; align-items: center; gap: 8px; background: rgba(212, 175, 55, 0.18); border: 1px solid rgba(212, 175, 55, 0.5); padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 700; color: #b45309; letter-spacing: 0.06em; text-transform: uppercase;">
  <span>✦ ${escapedBrand} • ${escapeHtml(city)}</span>
</div>`;

  const heroHeadlineContent = `
${heroBadgePill}
<span style="display:block; color:inherit; font-size:1.15em; font-weight:800; letter-spacing:-0.02em; margin-bottom:6px; line-height:1.15;">${escapedBrand}</span>
<span style="display:block; font-size:0.75em; font-weight:500; opacity:0.9; line-height:1.25;">Trusted Financial Clarity &amp; Strategic Tax Advisory in ${escapeHtml(city)}</span>`;

  // Inject the prominent business name & badge right into the primary Hero <h1>
  html = html.replace(/(<h1[^>]*>)([\s\S]*?)(<\/h1>)/i, (_match, openTag, _inner, closeTag) => {
    return `${openTag}\n${heroHeadlineContent}\n${closeTag}`;
  });

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
