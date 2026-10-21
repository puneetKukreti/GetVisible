import { describe, expect, it } from 'vitest';
import { getIndustryImages, pickIndustryImage } from '../lib/demos/industry-images';

describe('Industry imagery', () => {
  it('matches an automotive trade and returns only live stock URLs', () => {
    const set = getIndustryImages(
      'Car Detailing & Automobile Workshop',
      'Shine Motors Detailing Studio'
    );

    expect(set.categoryTag).toBe('Expert Technical & Field Services');
    for (const url of [set.heroImage, set.secondaryImage, set.aboutImage]) {
      expect(url).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
    }
    // Unsplash answers 404 for this photo, so it must not creep back in.
    expect(JSON.stringify(set)).not.toContain('photo-1486006920555-c77dce18193b');
  });

  it('uses neutral professional imagery for an unknown trade', () => {
    expect(getIndustryImages('Something Unmapped')).toMatchObject({
      categoryTag: 'Professional Services',
    });
  });

  it('still matches a real photography business despite its studio name', () => {
    expect(getIndustryImages('Wedding Photography', 'Frame Studio')).toMatchObject({
      categoryTag: 'Wedding & Portrait Photography Studio',
    });
  });

  it('always prefers a live-sourced photo of the actual trade', () => {
    for (const industryFirst of [true, false]) {
      expect(
        pickIndustryImage({
          sourced: 'sourced',
          industryMatched: 'industry',
          preset: 'preset',
          industryFirst,
        })
      ).toBe('sourced');
    }
  });

  it('lets the trade photo outrank the neutral preset for a general trade', () => {
    expect(
      pickIndustryImage({ industryMatched: 'industry', preset: 'preset', industryFirst: true })
    ).toBe('industry');
  });

  it('keeps a curated category preset first', () => {
    expect(
      pickIndustryImage({ industryMatched: 'industry', preset: 'preset', industryFirst: false })
    ).toBe('preset');
  });

  it('uses the last resort only when nothing better is available', () => {
    expect(pickIndustryImage({ fallback: 'fallback', industryFirst: true })).toBe('fallback');
    expect(pickIndustryImage({ preset: '', industryMatched: '', industryFirst: true })).toBeUndefined();
  });
});
