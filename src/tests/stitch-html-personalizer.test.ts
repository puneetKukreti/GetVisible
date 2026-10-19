import { describe, it, expect } from 'vitest';
import { personalizeStitchHtml, isStitchLayout, STITCH_DESIGN_MAP } from '@/lib/demos/stitch-personalizer';
import { getStitchRawHtml } from '@/lib/demos/stitch-loader.server';

describe('Google Stitch HTML Multi-Profession Personalization & DOM Hydration', () => {
  it('identifies Stitch design layouts correctly', () => {
    expect(isStitchLayout('design-1-premium')).toBe(true);
    expect(isStitchLayout('design-2-minimalist')).toBe(true);
    expect(isStitchLayout('design-3-contemporary')).toBe(true);
    expect(isStitchLayout('EDITORIAL_FINANCE')).toBe(true);
    expect(isStitchLayout('MODERN_INDIAN')).toBe(true);
    expect(isStitchLayout('UNKNOWN_CUSTOM_LAYOUT')).toBe(false);
  });

  it('personalizes Stitch HTML for a Dental Clinic without CA text leakage', () => {
    const rawHtml = getStitchRawHtml('design-1-premium');

    const dentalContent = {
      brand: { businessName: 'Dr. Mehra Dental & Implant Clinic' },
      location: { city: 'New Delhi', address: 'Green Park, New Delhi' },
      contact: { publicPhone: '+91 98111 22233', publicEmail: 'dr.mehra@dentalcare.in' },
      meta: { profession: 'Dentist & Dental Surgeon' },
      hero: {
        badge: 'Modern Dental & Implant Studio',
        headline: 'Advanced Painless Dental Care & Implants',
        subheadline: 'State-of-the-art restorative dental treatments and smile design in New Delhi.',
        primaryCta: { label: 'Book Dental Consultation' },
      },
      services: {
        sectionTitle: 'Clinical Dental Specialties',
        items: [
          { title: 'Digital Smile Makeovers', description: 'Porcelain veneers and cosmetic shaping.' },
          { title: 'Dental Implants', description: 'Titanium root replacements with lifetime guarantee.' },
          { title: 'Painless Root Canal', description: 'Single-sitting rotary endodontics.' },
          { title: 'Teeth Whitening', description: 'Laser brightening and stain removal.' },
        ],
      },
      faq: {
        items: [
          { question: 'Is root canal treatment painful?', answer: 'We use painless micro-anesthesia.' },
          { question: 'How long do dental implants last?', answer: 'With good oral hygiene, they last 20+ years.' },
        ],
      },
    };

    const personalizedHtml = personalizeStitchHtml(rawHtml, dentalContent);

    // 1. Preserves Stitch HTML structure
    expect(personalizedHtml).toContain('<!DOCTYPE html>');
    expect(personalizedHtml).toContain('<html');
    expect(personalizedHtml).toContain('<body');
    expect(personalizedHtml).toContain('id="services-grid"');

    // 2. Contains lead branding
    expect(personalizedHtml).toContain('Dr. Mehra Dental &amp; Implant Clinic');
    expect(personalizedHtml).toContain('dr.mehra@dentalcare.in');
    expect(personalizedHtml).toContain('+91 98111 22233');

    // 3. CA terms replaced
    expect(personalizedHtml).not.toContain('Chartered Accountants • New Delhi');
    expect(personalizedHtml).not.toContain('ICAI Regulated Practice');
    expect(personalizedHtml).not.toContain('Statutory Audit &amp; Assurance');

    // 4. Injects window.__GV_DEMO_CONTENT__ hydrator
    expect(personalizedHtml).toContain('window.__GV_DEMO_CONTENT__ =');
    expect(personalizedHtml).toContain('Digital Smile Makeovers');
    expect(personalizedHtml).toContain('hydrateStitchDom');
  });

  it('personalizes Stitch HTML for an Interior Design Studio', () => {
    const rawHtml = getStitchRawHtml('design-1-premium');

    const interiorContent = {
      brand: { businessName: 'Vistara Luxury Living & Interiors' },
      location: { city: 'Bengaluru', address: 'Indiranagar, Bengaluru' },
      contact: { publicPhone: '+91 98450 12345', publicEmail: 'hello@vistaraluxury.in' },
      meta: { profession: 'Interior Designer & Architect' },
      hero: {
        badge: 'Boutique Interior Architecture',
        headline: 'Turnkey Luxury Residential & Office Interiors',
        subheadline: 'Crafting bespoke architectural living spaces across Bengaluru.',
        primaryCta: { label: 'Explore Design Portfolio' },
      },
      services: {
        sectionTitle: 'Our Design Capabilities',
        items: [
          { title: 'Turnkey Residential Interiors', description: 'Full-scope villa and penthouse design.' },
          { title: 'Modular German Kitchens', description: 'Precision engineered kitchen systems.' },
        ],
      },
    };

    const personalizedHtml = personalizeStitchHtml(rawHtml, interiorContent);

    expect(personalizedHtml).toContain('Vistara Luxury Living &amp; Interiors');
    expect(personalizedHtml).toContain('Bengaluru');
    expect(personalizedHtml).toContain('Turnkey Residential Interiors');
    expect(personalizedHtml).toContain('window.__GV_DEMO_CONTENT__ =');
  });

  it('never emits short-lived Google aida image URLs (broken logo/hero)', () => {
    const rawHtml = getStitchRawHtml('design-1-premium');

    const content = {
      brand: { businessName: 'Sachin Narang & Associates' },
      location: { city: 'Gurgaon', address: 'Sector 21, Gurgaon' },
      contact: { publicPhone: '+91 98111 22233', publicEmail: 'hello@example.in' },
      meta: { profession: 'Chartered Accountant' },
      images: {
        heroImage: {
          url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        },
      },
    };

    const html = personalizeStitchHtml(rawHtml, content as any);

    // No ephemeral aida placeholder URL may survive personalization.
    expect(html).not.toContain('googleusercontent.com/aida');

    // The header brand mark is the monogram badge — never a remote image.
    const header = html.slice(0, html.indexOf('</header>'));
    expect(header).not.toContain('<img');
    expect(header).toContain('SN');

    // Hero imagery is swapped for the real content image.
    expect(html).toContain('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab');
  });

  it('falls back to a reliable hero image when the lead has no imagery', () => {
    const rawHtml = getStitchRawHtml('design-3-contemporary');

    const content = {
      brand: { businessName: 'Mehta Clinic' },
      location: { city: 'Noida', address: 'Sector 18, Noida' },
      contact: { publicPhone: '+91 98111 22233' },
      meta: { profession: 'Dentist' },
    };

    const html = personalizeStitchHtml(rawHtml, content as any);

    expect(html).not.toContain('googleusercontent.com/aida');
    expect(html).toContain('images.unsplash.com');
  });

  it('hardens the header for phone widths so the firm name and CTA never leave the screen', () => {
    const content = {
      brand: { businessName: 'Shri Radhakrishnan Venkateshwara Associates' },
      location: { city: 'Gurgaon', address: 'Sector 44, Gurgaon' },
      contact: { publicPhone: '+91 98111 22233' },
      meta: { profession: 'Chartered Accountant' },
    };

    for (const layout of ['design-1-premium', 'design-2-minimalist', 'design-3-contemporary']) {
      const html = personalizeStitchHtml(getStitchRawHtml(layout), content as any);

      // A phone-scoped media query, so wide-screen layouts are untouched.
      expect(html).toContain('@media (max-width: 1023.98px)');

      // The duplicate in-header CTA is dropped on phones…
      expect(html).toMatch(/header a\[data-path="request-a-consultation"\]/);
      expect(html).toMatch(/display: none !important/);

      // …and the brand block may compress and ellipsize instead of overflowing.
      expect(html).toMatch(/header > div > :first-child,\s*header > div > div > :first-child \{\s*min-width: 0 !important;\s*flex-shrink: 1 !important;/);
      expect(html).toMatch(/text-overflow: ellipsis !important/);
    }
  });
});
