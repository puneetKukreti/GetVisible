export interface StitchTemplateMeta {
  id: string;
  name: string;
  conceptName: string;
  badge: string;
  shortDescription: string;
  fullDescription: string;
  bestFor: string;
  typography: string;
  palette: { name: string; hex: string; role: string }[];
  thumbnail: string;
  htmlUrl: string;
  keyFeatures: string[];
}

export const STITCH_TEMPLATES: StitchTemplateMeta[] = [
  {
    id: 'design-1-premium',
    name: 'Design 1: Premium Editorial',
    conceptName: 'Venerable Jurisprudence',
    badge: 'Institutional & Statutory',
    shortDescription:
      'Authoritative editorial design with deep corporate navy and antique gold, engineered for institutional statutory audit, transfer pricing, and corporate tax advisory.',
    fullDescription:
      'Built around classical editorial proportions, EB Garamond serif headlines, and institutional navy tones. Features dedicated corporate compliance matrices, transparent fee inquiry flows, and authoritative advisory positioning.',
    bestFor: 'Corporate MNC Subsidiaries, Listed Entities, Statutory Audit & TP Practices',
    typography: 'EB Garamond (Editorial Serif) & Inter',
    palette: [
      { name: 'Midnight Navy', hex: '#00152a', role: 'Primary' },
      { name: 'Deep Container', hex: '#102a43', role: 'Surface' },
      { name: 'Antique Gold', hex: '#755a25', role: 'Accent' },
      { name: 'Crisp Porcelain', hex: '#f7f9ff', role: 'Background' },
    ],
    thumbnail: '/demo-templates/design-1-premium/screen.png',
    htmlUrl: '/demo-templates/design-1-premium/index.html',
    keyFeatures: [
      'OECD & Section 92E Transfer Pricing Advisory focus',
      'Statutory Companies Act Section 143 assurance structure',
      'Interactive service consultation request flow',
      'Smooth anchor navigation with FAQ accordions',
    ],
  },
  {
    id: 'design-2-minimalist',
    name: 'Design 2: Minimalist Ledger',
    conceptName: 'Architectural Ledger',
    badge: 'Precision & Technical',
    shortDescription:
      'High-density architectural ledger layout engineered with JetBrains Mono data tags, burnished brass, and fine-line borders for GST litigation and industrial corridors.',
    fullDescription:
      'Inspired by architectural drafting and Swiss grid typography. Employs warm parchment backgrounds, obsidian text, and monospace classification tags for high technical authority.',
    bestFor: 'Manufacturing Corridors, GST Defense, Industrial Audit & Litigation',
    typography: 'JetBrains Mono (Monospace) + EB Garamond + Inter',
    palette: [
      { name: 'Obsidian Slate', hex: '#0C1523', role: 'Primary' },
      { name: 'Burnished Brass', hex: '#BFA15F', role: 'Accent' },
      { name: 'Architectural Sand', hex: '#F8F7F4', role: 'Background' },
      { name: 'Grid Border', hex: '#E2DCD1', role: 'Outline' },
    ],
    thumbnail: '/demo-templates/design-2-minimalist/screen.png',
    htmlUrl: '/demo-templates/design-2-minimalist/index.html',
    keyFeatures: [
      'GST litigation & Section 16(4) defense specialization',
      'Architectural ledger grid for high data-density auditing',
      'Simulated formal inquiry dispatch with instant toast feedback',
      'Mobile-optimized technical drawer navigation',
    ],
  },
  {
    id: 'design-3-contemporary',
    name: 'Design 3: Contemporary Corporate',
    conceptName: 'Executive Capital / New Delhi',
    badge: 'Growth & Virtual CFO',
    shortDescription:
      'Modern executive advisory layout featuring split cards, refined Playfair Display typography, warm gradient lighting, and investor-ready financial positioning.',
    fullDescription:
      'Engineered for forward-looking enterprises, venture-funded startups, and cross-border NRI remittances. Blends high-contrast corporate navy with warm sand gradients and modern elevation.',
    bestFor: 'Tech Startups, Virtual CFO, High-Net-Worth & NRI Remittance Practices',
    typography: 'Playfair Display + Inter (Corporate Sans)',
    palette: [
      { name: 'Corporate Navy', hex: '#0A192F', role: 'Primary' },
      { name: 'Warm Sand Gold', hex: '#B39366', role: 'Accent' },
      { name: 'Executive White', hex: '#FAF8F5', role: 'Background' },
      { name: 'Card Surface', hex: '#FFFFFF', role: 'Surface' },
    ],
    thumbnail: '/demo-templates/design-3-contemporary/screen.png',
    htmlUrl: '/demo-templates/design-3-contemporary/index.html',
    keyFeatures: [
      'Virtual CFO & investor-ready MIS reporting sections',
      'Cross-border Form 15CA/15CB & NRI wealth advisory layout',
      'Pre-configured WhatsApp consultation direct link',
      'Interactive client inquiry simulation with zero spam exposure',
    ],
  },
];

export function getStitchTemplate(id: string): StitchTemplateMeta | undefined {
  return STITCH_TEMPLATES.find((t) => t.id === id);
}

/**
 * Resolves the relative public web URL of the template screenshot image.
 * Guarantees a valid, high-resolution preview image is always available.
 */
export function getTemplateScreenshotPath(layoutOrTemplate?: string | null): string {
  const l = (layoutOrTemplate || '').toLowerCase();
  if (
    l.includes('minimal') ||
    l.includes('swiss') ||
    l.includes('gst') ||
    l.includes('audit_assurance') ||
    l.includes('direct_tax') ||
    l === 'design-2-minimalist'
  ) {
    return '/demo-templates/design-2-minimalist/screen.png';
  }
  if (
    l.includes('fintech') ||
    l.includes('contemporary') ||
    l.includes('virtual_cfo') ||
    l.includes('clinic') ||
    l.includes('modern_indian') ||
    l === 'design-3-contemporary'
  ) {
    return '/demo-templates/design-3-contemporary/screen.png';
  }
  // Default to design-1-premium (Editorial Finance / Corporate Tax / Transfer Pricing / Luxury)
  return '/demo-templates/design-1-premium/screen.png';
}
