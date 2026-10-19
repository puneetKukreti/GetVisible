import { describe, it, expect } from 'vitest';
import { buildDemoSeoTitle } from '@/lib/demos/generator';

describe('Demo SEO title', () => {
  it('does not repeat a city the AI badge already ends with', () => {
    const title = buildDemoSeoTitle(
      'Shine Motors Detailing Studio',
      'Gurgaon',
      ['Trusted Car Detailing & Automobile Workshop • Gurgaon', 'Car Detailing & Automobile Workshop']
    );
    expect(title).toBe(
      'Shine Motors Detailing Studio | Trusted Car Detailing & Automobile Workshop in Gurgaon'
    );
    expect(title).not.toContain('Gurgaon in Gurgaon');
  });

  it('still appends the city when the badge has none', () => {
    expect(buildDemoSeoTitle('Verma Dental Care', 'Pune', ['Advanced Dental Clinic', 'Dentist'])).toBe(
      'Verma Dental Care | Advanced Dental Clinic in Pune'
    );
  });

  it('honours an explicit AI SEO title verbatim', () => {
    expect(
      buildDemoSeoTitle('Acme', 'Delhi', ['Anything'], 'Acme Detailing Studio | Ceramic Coating')
    ).toBe('Acme Detailing Studio | Ceramic Coating');
  });

  it('falls through to the profession when the badge was only the city', () => {
    const title = buildDemoSeoTitle('Acme Auto Works', 'Gurgaon', [
      'Gurgaon',
      'Car Detailing & Automobile Workshop',
    ]);
    expect(title).toBe('Acme Auto Works | Car Detailing & Automobile Workshop in Gurgaon');
  });

  it('never emits a dangling separator or an over-long title', () => {
    const title = buildDemoSeoTitle('Long Business Name Pvt Ltd', 'Bengaluru', [
      'Trusted Interiors • Bengaluru',
      'Interior Designer',
    ]);
    expect(title).toBe('Long Business Name Pvt Ltd | Trusted Interiors in Bengaluru');
    expect(title.length).toBeLessThanOrEqual(150);
  });
});
