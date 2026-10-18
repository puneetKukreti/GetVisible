/**
 * Owner WhatsApp number for prospect-facing "claim" CTAs.
 *
 * Deliberately has NO hardcoded fallback. Shipping a placeholder number means a
 * prospect taps "Claim on WhatsApp" and messages a stranger, so an unconfigured
 * deployment hides the CTA instead.
 *
 * Configure `NEXT_PUBLIC_PUNEET_WHATSAPP` with digits only, including the country
 * code (e.g. `919812345678`). `NEXT_PUBLIC_AGENCY_WHATSAPP` is accepted as a
 * backwards-compatible alias. This is a `NEXT_PUBLIC_` variable, so it must be
 * set at build time (Vercel -> Project -> Settings -> Environment Variables).
 */
export function getOwnerWhatsAppNumber(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_PUNEET_WHATSAPP ||
    process.env.NEXT_PUBLIC_AGENCY_WHATSAPP ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    '';

  const digits = raw.replace(/[^0-9]/g, '');
  // A usable international number is country code + subscriber number.
  return digits.length >= 10 ? digits : null;
}
