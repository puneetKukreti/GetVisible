import { describe, expect, it } from 'vitest';
import { DEFAULT_ARCHETYPE_ID, getProfessionStitchDesign } from '@/lib/demos/profession-stitch';
import { renderProfessionStitchPage } from '@/lib/demos/profession-stitch-renderer';
import { getIndustryLogoUrl } from '@/lib/demos/industry-logos';

const design = getProfessionStitchDesign(DEFAULT_ARCHETYPE_ID)!;

const headerBrand = (html: string): string =>
  /<a href="#hero" class="gv-brand">([\s\S]*?)<\/a>/.exec(html)?.[1] ?? '';

describe('Industry logo marks', () => {
  it('maps shipped logos by industry key and undefined everywhere else', () => {
    expect(getIndustryLogoUrl('car-detailing')).toBe('/logos/car-detailing-logo.png');
    expect(getIndustryLogoUrl('automobile-workshop')).toBeUndefined();
    expect(getIndustryLogoUrl(undefined)).toBeUndefined();
  });

  it('renders the trade logo in the header instead of the text name', () => {
    const html = renderProfessionStitchPage(
      design,
      {
        brand: { businessName: 'Shine Motors Detailing Studio' },
        meta: { profession: 'Car Detailing & Automobile Workshop' },
        location: { city: 'Gurgaon' },
        images: { logoUrl: '/logos/car-detailing-logo.png' },
      }
    );

    const header = headerBrand(html).replace(/alt="[^"]*"/g, '');
    expect(header).toContain('gv-brand__logo');
    expect(header).toContain('/logos/car-detailing-logo.png');
    expect(headerBrand(html)).toContain('alt="Shine Motors Detailing Studio logo"');
    // The name is not duplicated next to a mark that already carries it.
    expect(header).not.toContain('Shine Motors Detailing Studio');
  });

  it('keeps the text brand and profession tag when no logo ships', () => {
    const html = renderProfessionStitchPage(
      design,
      {
        brand: { businessName: 'Shine Motors Detailing Studio' },
        meta: { profession: 'Car Detailing & Automobile Workshop' },
        location: { city: 'Gurgaon' },
      }
    );

    const header = headerBrand(html);
    expect(header).toContain('Shine Motors Detailing Studio');
    expect(header).toContain('gv-brand__tag');
    expect(header).not.toContain('gv-brand__logo');
  });
});
