import { describe, it, expect } from 'vitest';
import {
  categorizeFirmName,
  splitFirmName,
  generateMonogram,
  getHeroTypographyConfig,
  getHeaderTypographyConfig,
  getAboutHeading,
  getCtaTitle,
} from '@/lib/demos/brand-typography';
import { getTemplate } from '@/lib/demos/templates';
import { WebsiteTemplate } from '@/types';
import { THEMES } from '@/lib/demos/themes';

describe('Brand Identity & Typography Adaptation Engine for CA Firms', () => {
  describe('categorizeFirmName', () => {
    it('accurately classifies short Indian CA firm names (<= 16 chars)', () => {
      expect(categorizeFirmName('Singhi & Co.')).toBe('SHORT');
      expect(categorizeFirmName('K.S. Rao & Co.')).toBe('SHORT');
      expect(categorizeFirmName('Apex Advisors')).toBe('SHORT');
      expect(categorizeFirmName('Verma & Co.')).toBe('SHORT');
      expect(categorizeFirmName('Chhajed & Doshi')).toBe('SHORT');
    });

    it('accurately classifies medium Indian CA firm names (17 - 30 chars)', () => {
      expect(categorizeFirmName('Batra Singhal & Associates')).toBe('MEDIUM');
      expect(categorizeFirmName('S.R. Batliboi & Co. LLP')).toBe('MEDIUM');
      expect(categorizeFirmName('Desai Haribhakti & Co.')).toBe('MEDIUM');
      expect(categorizeFirmName('V. K. Surana & Co.')).toBe('MEDIUM');
    });

    it('accurately classifies long Indian CA firm names (31 - 48 chars)', () => {
      expect(categorizeFirmName('Luthra & Luthra Chartered Accountants')).toBe('LONG');
      expect(categorizeFirmName('G.K. Choksi & Company Chartered Accountants')).toBe('LONG');
      expect(categorizeFirmName('Kalyaniwalla & Mistry LLP Chartered Accountants')).toBe('LONG');
    });

    it('accurately classifies very long Indian CA firm names (> 48 chars)', () => {
      expect(categorizeFirmName('Singhal Batra & Associates Chartered Accountants LLP')).toBe('VERY_LONG');
      expect(categorizeFirmName('Manubhai & Shah LLP Chartered Accountants & Tax Consultants')).toBe('VERY_LONG');
      expect(categorizeFirmName('M/s R. Subramanian & Company LLP Chartered Accountants')).toBe('VERY_LONG');
    });
  });

  describe('splitFirmName', () => {
    it('identifies and separates Chartered Accountants suffixes', () => {
      const res = splitFirmName('Singhal & Associates, Chartered Accountants');
      expect(res.hasSuffix).toBe(true);
      expect(res.baseName).toBe('Singhal & Associates');
      expect(res.suffix).toBe('Chartered Accountants');
    });

    it('identifies and separates Chartered Accountants LLP suffixes', () => {
      const res = splitFirmName('Batra & Co. Chartered Accountants LLP');
      expect(res.hasSuffix).toBe(true);
      expect(res.baseName).toBe('Batra & Co.');
      expect(res.suffix).toBe('Chartered Accountants LLP');
    });

    it('identifies and separates standalone LLP suffixes', () => {
      const res = splitFirmName('S.R. Batliboi & Co. LLP');
      expect(res.hasSuffix).toBe(true);
      expect(res.baseName).toBe('S.R. Batliboi & Co.');
      expect(res.suffix).toBe('LLP');
    });

    it('gracefully leaves pure partnership names without statutory suffixes intact', () => {
      const res = splitFirmName('Singhi & Co.');
      expect(res.hasSuffix).toBe(false);
      expect(res.baseName).toBe('Singhi & Co.');
    });
  });

  describe('generateMonogram', () => {
    it('produces dignified 2-letter monograms from practice names', () => {
      expect(generateMonogram('Batra Singhal & Associates')).toBe('BS');
      expect(generateMonogram('Singhi & Co.')).toBe('SI');
      expect(generateMonogram('K.S. Rao & Co.')).toBe('KS');
      expect(generateMonogram('Luthra & Luthra Chartered Accountants')).toBe('LL');
      expect(generateMonogram('M/s Sharma & Singhal')).toBe('SS');
    });
  });

  describe('getHeroTypographyConfig across all 5 templates', () => {
    const templates: WebsiteTemplate[] = [
      'EDITORIAL_FINANCE',
      'MODERN_FINTECH',
      'LUXURY_PROFESSIONAL',
      'SWISS_MINIMAL',
      'MODERN_INDIAN',
    ];

    it('scales typography larger for short names and gracefully compacts for very long names', () => {
      const shortName = 'Singhi & Co.';
      const veryLongName = 'Singhal Batra & Associates Chartered Accountants LLP';

      templates.forEach((tmpl) => {
        const shortConfig = getHeroTypographyConfig(shortName, tmpl);
        const longConfig = getHeroTypographyConfig(veryLongName, tmpl);

        expect(shortConfig.category).toBe('SHORT');
        expect(longConfig.category).toBe('VERY_LONG');

        // Short names must feature larger display scale
        if (tmpl === 'EDITORIAL_FINANCE') {
          expect(shortConfig.titleClass).toContain('text-5xl sm:text-7xl lg:text-8xl');
          expect(longConfig.titleClass).toContain('text-2xl sm:text-4xl lg:text-5xl');
        } else if (tmpl === 'SWISS_MINIMAL') {
          expect(shortConfig.titleClass).toContain('text-5xl sm:text-7xl lg:text-8xl');
          expect(longConfig.titleClass).toContain('text-2xl sm:text-4xl lg:text-5xl');
        } else if (tmpl === 'MODERN_FINTECH') {
          expect(shortConfig.titleClass).toContain('text-4xl sm:text-6xl lg:text-7xl');
          expect(longConfig.titleClass).toContain('text-xl sm:text-3xl lg:text-4xl');
        } else if (tmpl === 'LUXURY_PROFESSIONAL') {
          expect(shortConfig.titleClass).toContain('text-4xl sm:text-6xl lg:text-7xl');
          expect(longConfig.titleClass).toContain('text-xl sm:text-3xl lg:text-4xl');
        } else if (tmpl === 'MODERN_INDIAN') {
          expect(shortConfig.titleClass).toContain('text-4xl sm:text-5xl lg:text-6xl');
          expect(longConfig.titleClass).toContain('text-xl sm:text-3xl lg:text-3xl');
        }

        // All configurations must ensure line wrapping safety
        expect(shortConfig.titleClass).toContain('break-words');
        expect(longConfig.titleClass).toContain('break-words');
      });
    });
  });

  describe('getHeaderTypographyConfig', () => {
    it('constrains container max-width to avoid collisions with navigation or CTA', () => {
      const shortHeader = getHeaderTypographyConfig('Singhi & Co.');
      const longHeader = getHeaderTypographyConfig('Singhal Batra & Associates Chartered Accountants LLP');

      expect(shortHeader.titleClass).toContain('text-sm');
      expect(longHeader.titleClass).toContain('text-[11px]');
      expect(longHeader.containerClass).toContain('max-w-');
      expect(longHeader.monogram).toBe('SB');
    });
  });

  describe('getAboutHeading', () => {
    it('customizes About heading by template with the firm name', () => {
      const firm = 'K.S. Rao & Co.';

      expect(getAboutHeading(firm, 'EDITORIAL_FINANCE')).toBe('The K.S. Rao & Co. Practice');
      expect(getAboutHeading(firm, 'LUXURY_PROFESSIONAL')).toBe('The Heritage & Stewardship of K.S. Rao & Co.');
      expect(getAboutHeading(firm, 'SWISS_MINIMAL')).toBe('ABOUT / K.S. RAO & CO.');
      expect(getAboutHeading(firm, 'MODERN_INDIAN')).toBe('About K.S. Rao & Co.');
      expect(getAboutHeading(firm, 'MODERN_FINTECH')).toBe('Why Growing Enterprises Partner with K.S. Rao & Co.');
    });
  });

  describe('getCtaTitle', () => {
    it('weaves firm name into final CTA title across templates', () => {
      const firm = 'Batra Singhal & Associates';

      expect(getCtaTitle(firm, 'EDITORIAL_FINANCE')).toContain('Batra Singhal & Associates');
      expect(getCtaTitle(firm, 'LUXURY_PROFESSIONAL')).toBe('Private Engagement with Batra Singhal & Associates');
      expect(getCtaTitle(firm, 'SWISS_MINIMAL')).toBe('[ENGAGE / BATRA SINGHAL & ASSOCIATES]');
      expect(getCtaTitle(firm, 'MODERN_INDIAN')).toContain('Batra Singhal & Associates');
      expect(getCtaTitle(firm, 'MODERN_FINTECH')).toContain('Batra Singhal & Associates');
    });
  });

  describe('Template Content Integration', () => {
    it('template builders populate brand.businessName and metadata accurately for short and long firm names', () => {
      const longFirm = 'Singhal Batra & Associates Chartered Accountants LLP';
      const template = getTemplate('CORPORATE_TRANSFER_PRICING');
      const content = template.buildContent({
        businessName: longFirm,
        profession: 'Chartered Accountant',
        city: 'Gurugram',
        address: 'Cyber City, Gurugram',
      }, THEMES.executiveNavy);

      expect(content.brand.businessName).toBe(longFirm);
      expect(content.meta.title).toContain(longFirm);
      expect(content.about.leadParagraph).toContain(longFirm);
      expect(content.footer.copyright).toContain(longFirm);
    });
  });
});
