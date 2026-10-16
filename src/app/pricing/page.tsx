import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Zap } from 'lucide-react';
import { PRICING_PLANS, formatInr } from '@/lib/billing/plans';

export const metadata: Metadata = {
  title: 'GetVisible — Pricing',
  description:
    'Personalised website concepts and human-approved outreach for CA practices and local SMBs. India-first pricing.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <span className="font-bold tracking-tight">
              Get<span className="text-primary">Visible</span>
            </span>
          </div>
          <Link
            href="/login"
            className="text-xs font-semibold rounded-lg bg-primary text-primary-foreground px-4 py-2"
          >
            Unlock workbench
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-14">
        <div className="text-center space-y-3 mb-12">
          <h1 className="text-3xl font-bold tracking-tight">Simple, India-first pricing</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Generate a personalised website concept for every prospect, then reach out by email or
            WhatsApp — human-approved, with suppression and opt-out enforced.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={
                'rounded-2xl border p-5 flex flex-col ' +
                (plan.recommended ? 'border-primary shadow-md' : 'border-border')
              }
            >
              {plan.recommended && (
                <span className="self-start mb-2 text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary/10 text-primary px-2 py-0.5">
                  Most popular
                </span>
              )}
              <h2 className="text-sm font-bold">{plan.name}</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold">{formatInr(plan.priceInr)}</span>
                <span className="text-xs text-muted-foreground">{plan.unit}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground min-h-8">{plan.tagline}</p>

              <ul className="mt-4 space-y-2 flex-1">
                {plan.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={
                  'mt-5 text-center text-xs font-semibold rounded-lg px-4 py-2 ' +
                  (plan.recommended
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border hover:bg-muted')
                }
              >
                Get started
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          All plans include the human-approval safety gate and compliance suppression records.
          Online payments are being onboarded; contact us for a pilot on the{' '}
          <span className="font-semibold">Agency</span> plan.
        </p>
      </main>
    </div>
  );
}
