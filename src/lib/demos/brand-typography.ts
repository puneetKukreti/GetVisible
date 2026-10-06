import { WebsiteTemplate } from '@/types';

export type FirmNameCategory = 'SHORT' | 'MEDIUM' | 'LONG' | 'VERY_LONG';

export interface SplitFirmName {
  baseName: string;
  suffix?: string;
  hasSuffix: boolean;
}

export interface HeroTypographyConfig {
  category: FirmNameCategory;
  charCount: number;
  wordCount: number;
  titleClass: string;
  subheadlineClass: string;
  containerClass: string;
  wrapStyle?: React.CSSProperties;
}

export interface HeaderTypographyConfig {
  category: FirmNameCategory;
  containerClass: string;
  titleClass: string;
  monogram: string;
  badgeLabel?: string;
}

/**
 * Categorize firm name length into 4 distinct ergonomic buckets:
 * - SHORT: <= 16 characters (e.g., "Singhi & Co.", "K.S. Rao & Co.", "Apex Advisors")
 * - MEDIUM: 17 to 30 characters (e.g., "Batra Singhal & Associates", "S.R. Batliboi & Co. LLP")
 * - LONG: 31 to 48 characters (e.g., "Luthra & Luthra Chartered Accountants")
 * - VERY_LONG: > 48 characters (e.g., "Singhal Batra & Associates Chartered Accountants LLP")
 */
export function categorizeFirmName(name: string): FirmNameCategory {
  const clean = (name || '').trim();
  const len = clean.length;

  if (len <= 16) return 'SHORT';
  if (len <= 30) return 'MEDIUM';
  if (len <= 48) return 'LONG';
  return 'VERY_LONG';
}

/**
 * Intelligently separates formal statutory suffixes (e.g. Chartered Accountants, LLP)
 * from the distinctive primary firm title.
 */
export function splitFirmName(name: string): SplitFirmName {
  const clean = (name || '').trim();

  // Pattern matching common Indian statutory practice suffixes
  const suffixRegex = /([,\s]+(?:Chartered\s+Accountants(?:\s+LLP)?|Chartered\s+Accountant|LLP|&?\s*Associates\s+LLP|Tax\s+Consultants|Corporate\s+Advisors))$/i;
  const match = clean.match(suffixRegex);

  if (match && match.index && match.index > 3) {
    const baseName = clean.substring(0, match.index).replace(/[,]+$/, '').trim();
    const rawSuffix = match[0].replace(/^[,\s]+/, '').trim();
    return {
      baseName,
      suffix: rawSuffix,
      hasSuffix: true,
    };
  }

  return {
    baseName: clean,
    hasSuffix: false,
  };
}

/**
 * Generates an authentic 1-2 character monogram for branded badges/shields
 * e.g. "Batra Singhal & Associates" -> "BS"
 *      "K.S. Rao & Co." -> "KR"
 *      "Singhi & Co." -> "SC"
 */
export function generateMonogram(name: string): string {
  if (!name) return 'CA';
  const clean = name.replace(/^(M\/s|M\/S)\s*/i, '').trim();
  const words = clean
    .split(/[\s,.-]+/)
    .filter((w) => w.length > 0 && !['and', '&', 'co', 'the', 'of', 'llp'].includes(w.toLowerCase()));

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1 && words[0].length >= 2) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0]?.[0] || 'CA').toUpperCase();
}

/**
 * Returns dynamic, template-specific responsive typography, sizing, tracking,
 * and layout wrappers for the Hero Section.
 */
export function getHeroTypographyConfig(
  name: string,
  template: WebsiteTemplate = 'MODERN_FINTECH'
): HeroTypographyConfig {
  const cleanName = (name || 'Chartered Accountants').trim();
  const category = categorizeFirmName(cleanName);
  const words = cleanName.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = cleanName.length;

  let titleClass = '';
  let subheadlineClass = '';
  let containerClass = '';

  switch (template) {
    case 'EDITORIAL_FINANCE': {
      // Large serif editorial masthead typography
      subheadlineClass = 'text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-serif leading-relaxed max-w-2xl';
      containerClass = 'max-w-3xl';

      if (category === 'SHORT') {
        titleClass =
          'text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 dark:text-white font-serif leading-[0.96] break-words';
      } else if (category === 'MEDIUM') {
        titleClass =
          'text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white font-serif leading-[1.05] break-words';
      } else if (category === 'LONG') {
        titleClass =
          'text-3xl sm:text-5xl lg:text-6xl font-bold tracking-normal text-slate-900 dark:text-white font-serif leading-[1.12] break-words';
      } else {
        // VERY_LONG
        titleClass =
          'text-2xl sm:text-4xl lg:text-5xl font-bold tracking-normal text-slate-900 dark:text-white font-serif leading-[1.18] break-words';
      }
      break;
    }

    case 'MODERN_FINTECH': {
      // Modern corporate high-tech sans-serif focal point
      subheadlineClass = 'text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl';
      containerClass = 'max-w-2xl';

      if (category === 'SHORT') {
        titleClass =
          'text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.05] break-words';
      } else if (category === 'MEDIUM') {
        titleClass =
          'text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.1] break-words';
      } else if (category === 'LONG') {
        titleClass =
          'text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.15] break-words';
      } else {
        titleClass =
          'text-xl sm:text-3xl lg:text-4xl font-bold tracking-normal text-slate-900 dark:text-slate-100 leading-[1.2] break-words';
      }
      break;
    }

    case 'LUXURY_PROFESSIONAL': {
      // High-prestige private advisory serif typography with refined tracking
      subheadlineClass = 'text-base sm:text-lg text-slate-300 font-serif leading-relaxed max-w-2xl mx-auto';
      containerClass = 'max-w-4xl mx-auto text-center';

      if (category === 'SHORT') {
        titleClass =
          'text-4xl sm:text-6xl lg:text-7xl font-light tracking-wide text-white font-serif leading-[1.08] break-words';
      } else if (category === 'MEDIUM') {
        titleClass =
          'text-3xl sm:text-5xl lg:text-6xl font-light tracking-normal text-white font-serif leading-[1.12] break-words';
      } else if (category === 'LONG') {
        titleClass =
          'text-2xl sm:text-4xl lg:text-5xl font-normal tracking-normal text-white font-serif leading-[1.18] break-words';
      } else {
        titleClass =
          'text-xl sm:text-3xl lg:text-4xl font-normal tracking-normal text-white font-serif leading-[1.24] break-words';
      }
      break;
    }

    case 'SWISS_MINIMAL': {
      // Brutalist heavy uppercase architectural typography
      subheadlineClass = 'text-base sm:text-lg font-mono text-slate-600 dark:text-slate-400 max-w-2xl';
      containerClass = 'max-w-3xl';

      if (category === 'SHORT') {
        titleClass =
          'text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter uppercase text-slate-900 dark:text-slate-100 leading-none break-words';
      } else if (category === 'MEDIUM') {
        titleClass =
          'text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase text-slate-900 dark:text-slate-100 leading-[0.98] break-words';
      } else if (category === 'LONG') {
        titleClass =
          'text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase text-slate-900 dark:text-slate-100 leading-[1.04] break-words';
      } else {
        titleClass =
          'text-2xl sm:text-4xl lg:text-5xl font-black tracking-normal uppercase text-slate-900 dark:text-slate-100 leading-[1.12] break-words';
      }
      break;
    }

    case 'MODERN_INDIAN':
    default: {
      // Authoritative Indian corporate practice masthead
      subheadlineClass = 'text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl';
      containerClass = 'max-w-2xl';

      if (category === 'SHORT') {
        titleClass =
          'text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight break-words';
      } else if (category === 'MEDIUM') {
        titleClass =
          'text-3xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight break-words';
      } else if (category === 'LONG') {
        titleClass =
          'text-2xl sm:text-4xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-snug break-words';
      } else {
        titleClass =
          'text-xl sm:text-3xl lg:text-3xl font-bold tracking-normal text-slate-900 dark:text-slate-100 leading-snug break-words';
      }
      break;
    }
  }

  return {
    category,
    charCount,
    wordCount,
    titleClass,
    subheadlineClass,
    containerClass,
  };
}

/**
 * Returns dynamic navbar typography configuration ensuring long firm names
 * adapt gracefully without collision with navigation or CTA elements on mobile & desktop.
 */
export function getHeaderTypographyConfig(
  name: string,
  template: WebsiteTemplate = 'MODERN_FINTECH'
): HeaderTypographyConfig {
  const clean = (name || 'Chartered Accountants').trim();
  const category = categorizeFirmName(clean);
  const monogram = generateMonogram(clean);

  let containerClass = 'max-w-[200px] sm:max-w-[320px] md:max-w-[420px] lg:max-w-[500px]';
  let titleClass = 'text-sm sm:text-base font-bold tracking-tight truncate';

  if (category === 'SHORT') {
    titleClass = 'text-sm sm:text-base font-bold tracking-tight';
  } else if (category === 'MEDIUM') {
    titleClass = 'text-xs sm:text-sm font-bold tracking-tight leading-snug line-clamp-1 sm:line-clamp-none';
  } else if (category === 'LONG') {
    titleClass = 'text-xs sm:text-xs md:text-sm font-semibold tracking-tight leading-tight line-clamp-1 sm:line-clamp-2';
    containerClass = 'max-w-[180px] sm:max-w-[260px] md:max-w-[380px] lg:max-w-[460px]';
  } else {
    // VERY_LONG
    titleClass = 'text-[11px] sm:text-xs md:text-xs font-semibold tracking-normal leading-tight line-clamp-1 sm:line-clamp-2';
    containerClass = 'max-w-[170px] sm:max-w-[240px] md:max-w-[340px] lg:max-w-[420px]';
  }

  // Template specific header nuance
  if (template === 'SWISS_MINIMAL') {
    titleClass += ' uppercase font-mono';
  } else if (template === 'LUXURY_PROFESSIONAL') {
    titleClass += ' uppercase font-serif tracking-wider';
  } else if (template === 'EDITORIAL_FINANCE') {
    titleClass += ' font-serif';
  }

  return {
    category,
    containerClass,
    titleClass,
    monogram,
  };
}

/**
 * Dynamically constructs a tailored About section heading that integrates
 * the firm name authentically based on template identity.
 */
export function getAboutHeading(
  firmName: string,
  template: WebsiteTemplate = 'MODERN_FINTECH',
  originalTitle?: string
): string {
  const cleanName = (firmName || '').trim();
  if (!cleanName) return originalTitle || 'About Our Practice';

  // If the original title already explicitly contains the firm name, keep it
  if (originalTitle && originalTitle.toLowerCase().includes(cleanName.toLowerCase())) {
    return originalTitle;
  }

  switch (template) {
    case 'EDITORIAL_FINANCE':
      return `The ${cleanName} Practice`;
    case 'LUXURY_PROFESSIONAL':
      return `The Heritage & Stewardship of ${cleanName}`;
    case 'SWISS_MINIMAL':
      return `ABOUT / ${cleanName.toUpperCase()}`;
    case 'MODERN_INDIAN':
      return `About ${cleanName}`;
    case 'MODERN_FINTECH':
    default:
      return `Why Growing Enterprises Partner with ${cleanName}`;
  }
}

/**
 * Dynamically constructs a tailored CTA section headline that incorporates
 * the prospect firm name intentionally.
 */
export function getCtaTitle(
  firmName: string,
  template: WebsiteTemplate = 'MODERN_FINTECH',
  originalTitle?: string
): string {
  const cleanName = (firmName || '').trim();
  if (!cleanName) return originalTitle || 'Schedule a Confidential Consultation';

  if (originalTitle && originalTitle.toLowerCase().includes(cleanName.toLowerCase())) {
    return originalTitle;
  }

  switch (template) {
    case 'EDITORIAL_FINANCE':
      return `Engage ${cleanName} for Authoritative Tax & Statutory Governance`;
    case 'LUXURY_PROFESSIONAL':
      return `Private Engagement with ${cleanName}`;
    case 'SWISS_MINIMAL':
      return `[ENGAGE / ${cleanName.toUpperCase()}]`;
    case 'MODERN_INDIAN':
      return `Partner with ${cleanName} for Regulatory Assurance`;
    case 'MODERN_FINTECH':
    default:
      return `Ready to Elevate Your Financial Compliance with ${cleanName}?`;
  }
}
