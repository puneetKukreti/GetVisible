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
});
