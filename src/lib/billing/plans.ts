/**
 * Product plans & pricing (single source of truth).
 *
 * Prices are in INR and reflect the India-first wedge (CA / SMB practices).
 * They are intentionally the ONLY place plan metadata lives so a future
 * billing integration (Razorpay / Stripe) can import the same identifiers.
 *
 * NOTE: No live payment gateway is wired up. `PRICING_PLANS` drives the
 * marketing page and is ready to be referenced by an entitlement service once
 * a gateway account + keys are configured.
 */

export type PlanId = 'pay-per-site' | 'starter' | 'growth' | 'agency';

export interface PlanLimits {
  demosPerMonth: number | 'unlimited';
  outreachSeats: number;
  csvImport: boolean;
  whatsappOutreach: boolean;
  proposalsAndPdf: boolean;
}

export interface PricingPlan {
  id: PlanId;
  name: string;
  /** Price in whole rupees. */
  priceInr: number;
  /** Billing period label, e.g. '/site' or '/month'. */
  unit: string;
  tagline: string;
  limits: PlanLimits;
  highlights: string[];
  recommended?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'pay-per-site',
    name: 'Pay Per Site',
    priceInr: 3500,
    unit: '/site',
    tagline: 'One-off personalised website concept for a single prospect.',
    limits: {
      demosPerMonth: 1,
      outreachSeats: 1,
      csvImport: false,
      whatsappOutreach: true,
      proposalsAndPdf: false,
    },
    highlights: [
      '1 AI-generated, profession-aware website concept',
      'Shareable public demo link with change requests',
      '1-click WhatsApp hand-off',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    priceInr: 999,
    unit: '/month',
    tagline: 'For solo operators running a steady local pipeline.',
    limits: {
      demosPerMonth: 30,
      outreachSeats: 1,
      csvImport: true,
      whatsappOutreach: true,
      proposalsAndPdf: true,
    },
    highlights: [
      'Up to 30 personalised website concepts / month',
      'CSV import + quick-add lead capture',
      'Human-approved email & WhatsApp outreach',
      'Suppression & opt-out enforcement',
      'Proposals and PDF export',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    priceInr: 2499,
    unit: '/month',
    tagline: 'For practices scaling outbound without spam.',
    limits: {
      demosPerMonth: 150,
      outreachSeats: 3,
      csvImport: true,
      whatsappOutreach: true,
      proposalsAndPdf: true,
    },
    highlights: [
      'Up to 150 concepts / month',
      '3 operator seats',
      'Full audit trail & compliance records',
      'Priority demo generation',
    ],
    recommended: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    priceInr: 5999,
    unit: '/month',
    tagline: 'For agencies managing multiple brands and verticals.',
    limits: {
      demosPerMonth: 'unlimited',
      outreachSeats: 10,
      csvImport: true,
      whatsappOutreach: true,
      proposalsAndPdf: true,
    },
    highlights: [
      'Unlimited concepts',
      '10 operator seats',
      'Multi-vertical profession templates',
      'Dedicated onboarding',
    ],
  },
];

export function getPlan(id: PlanId): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === id);
}

/** Formats whole rupees the Indian way (e.g. 2499 -> ₹2,499). */
export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
