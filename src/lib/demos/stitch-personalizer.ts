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

  // 5. Inject CSS for smooth, natural scrolling and elegant visible scrollbar
  const injectedStyle = `
<style>
  html {
    scroll-behavior: smooth !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
  }
  body {
    margin: 0 !important;
    padding: 0 !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    min-height: 100vh !important;
  }
  /* Modern clean scrollbar */
  ::-webkit-scrollbar {
    width: 6px !important;
    height: 6px !important;
    display: block !important;
  }
  ::-webkit-scrollbar-track {
    background: transparent !important;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(100, 116, 139, 0.45) !important;
    border-radius: 9999px !important;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(100, 116, 139, 0.8) !important;
  }
</style>
`;

  if (html.includes('</head>')) {
    html = html.replace('</head>', `${injectedStyle}</head>`);
  } else {
    html = injectedStyle + html;
  }

  // 6. Inject client script for smooth scrolling, simulated form submission, and responsive iframe height
  const injectedScript = `
<script>
  (function() {
    var lastSentHeight = 0;
    // Measure exact bottom of website content to prevent runaway empty space
    function notifyHeight() {
      try {
        var footer = document.querySelector('footer');
        var h = 0;
        if (footer) {
          var rect = footer.getBoundingClientRect();
          var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
          h = Math.ceil(rect.bottom + scrollY);
        } else {
          var body = document.body;
          h = Math.ceil(Math.max(body.offsetHeight, body.clientHeight));
        }
        if (h > 300 && Math.abs(h - lastSentHeight) > 2) {
          lastSentHeight = h;
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'GETVISIBLE_IFRAME_HEIGHT', height: h }, '*');
          }
        }
      } catch (e) {}
    }

    window.addEventListener('load', notifyHeight);
    window.addEventListener('resize', notifyHeight);
    window.addEventListener('message', function(ev) {
      if (ev.data && ev.data.type === 'GETVISIBLE_REQUEST_HEIGHT') {
        notifyHeight();
      }
    });
    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(notifyHeight).observe(document.body, { childList: true, subtree: true });
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
