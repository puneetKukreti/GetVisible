import { DiscoveredBusinessRecord } from './providers/types';
import { FieldProvenance, SourceQuality } from '@/types';

export interface NormalizedLeadEntity {
  sourceRecordId: string;
  businessName: FieldProvenance;
  profession: string;
  city: FieldProvenance & { region?: string };
  address: FieldProvenance;
  website: (FieldProvenance & { canonicalDomain: string }) | null;
  publicEmail: FieldProvenance | null;
  publicPhone: FieldProvenance | null;
  source: string;
  sourceUrl: string;
  sourceQuality: SourceQuality;
  isDemoData: boolean;
  metadata?: Record<string, unknown>;
}

export class LeadNormalizer {
  /**
   * Normalize full discovered business record while preserving raw values.
   */
  static normalize(record: DiscoveredBusinessRecord): NormalizedLeadEntity {
    const timestamp = new Date().toISOString();
    const source = record.source;
    const sourceQuality = record.sourceQuality;

    // 1. Business Name
    const normName = LeadNormalizer.normalizeBusinessName(record.businessName);
    const businessName: FieldProvenance = {
      rawValue: record.businessName,
      normalizedValue: normName,
      source,
      sourceQuality,
      timestamp,
    };

    // 2. City
    const normCity = LeadNormalizer.normalizeCity(record.city);
    const region = LeadNormalizer.getRegionForCity(normCity);
    const city: FieldProvenance & { region?: string } = {
      rawValue: record.city,
      normalizedValue: normCity,
      region,
      source,
      sourceQuality,
      timestamp,
    };

    // 3. Address
    const normAddress = LeadNormalizer.normalizeAddress(record.address, normCity);
    const address: FieldProvenance = {
      rawValue: record.address,
      normalizedValue: normAddress,
      source,
      sourceQuality,
      timestamp,
    };

    // 4. Website
    let website: (FieldProvenance & { canonicalDomain: string }) | null = null;
    if (record.website && record.website.trim().length > 0) {
      const parsedWeb = LeadNormalizer.normalizeWebsite(record.website);
      if (parsedWeb) {
        website = {
          rawValue: record.website,
          normalizedValue: parsedWeb.normalizedUrl,
          canonicalDomain: parsedWeb.canonicalDomain,
          source,
          sourceQuality,
          timestamp,
        };
      }
    }

    // 5. Public Email
    let publicEmail: FieldProvenance | null = null;
    if (record.publicEmail && record.publicEmail.trim().length > 0) {
      const normEmail = LeadNormalizer.normalizeEmail(record.publicEmail);
      if (normEmail) {
        publicEmail = {
          rawValue: record.publicEmail,
          normalizedValue: normEmail,
          source,
          sourceQuality,
          timestamp,
        };
      }
    }

    // 6. Public Phone
    let publicPhone: FieldProvenance | null = null;
    if (record.publicPhone && record.publicPhone.trim().length > 0) {
      const normPhone = LeadNormalizer.normalizePhone(record.publicPhone);
      if (normPhone) {
        publicPhone = {
          rawValue: record.publicPhone,
          normalizedValue: normPhone,
          source,
          sourceQuality,
          timestamp,
        };
      }
    }

    return {
      sourceRecordId: record.sourceRecordId,
      businessName,
      profession: record.profession || 'Chartered Accountant',
      city,
      address,
      website,
      publicEmail,
      publicPhone,
      source: record.source,
      sourceUrl: record.sourceUrl,
      sourceQuality: record.sourceQuality,
      isDemoData: record.isDemoData,
      metadata: record.metadata,
    };
  }

  /**
   * Normalizes business name: cleans extraneous commas/spaces, normalizes legal suffixes
   */
  static normalizeBusinessName(name: string): string {
    if (!name) return '';
    let cleaned = name.trim().replace(/\s+/g, ' ');

    // Normalize legal abbreviations
    cleaned = cleaned
      .replace(/\bpvt\.?\s*ltd\.?(?!\w)/gi, 'Pvt. Ltd.')
      .replace(/(?<!pvt\.\s*)\bltd\.?(?!\w)/gi, 'Ltd.')
      .replace(/\b&\s*associates\b/gi, '& Associates')
      .replace(/\b&\s*assoc\.?(?!\w)/gi, '& Associates')
      .replace(/\b&\s*co\.?(?!\w)/gi, '& Co.');

    return cleaned;
  }

  /**
   * Normalizes city names to standard forms (e.g. Gurugram -> Gurgaon).
   * Preserves specific cities (e.g. New Delhi stays New Delhi, not overwritten with region).
   */
  static normalizeCity(city: string): string {
    if (!city) return 'Gurgaon';
    const trimmed = city.trim();
    if (/gurugram|gurgaon/i.test(trimmed)) {
      return 'Gurgaon';
    }
    if (/^new\s+delhi$/i.test(trimmed)) {
      return 'New Delhi';
    }
    if (/^delhi$/i.test(trimmed)) {
      return 'Delhi';
    }
    if (/delhi\s*ncr/i.test(trimmed)) {
      return 'Delhi NCR';
    }
    if (/bengaluru|bangalore/i.test(trimmed)) {
      return 'Bengaluru';
    }
    if (/mumbai|bombay/i.test(trimmed)) {
      return 'Mumbai';
    }
    if (/kolkata|calcutta/i.test(trimmed)) {
      return 'Kolkata';
    }
    if (/chennai|madras/i.test(trimmed)) {
      return 'Chennai';
    }
    if (/noida/i.test(trimmed)) {
      return 'Noida';
    }
    // Clean whitespace and capitalize words
    return trimmed
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Derives broader administrative region / state for known metro areas
   */
  static getRegionForCity(city: string): string | undefined {
    if (!city) return 'Delhi NCR';
    const trimmed = city.trim().toLowerCase();
    if (['gurgaon', 'gurugram', 'new delhi', 'delhi', 'noida', 'greater noida', 'faridabad', 'ghaziabad'].includes(trimmed)) {
      return 'Delhi NCR';
    }
    if (['mumbai', 'pune', 'thane', 'navi mumbai', 'nagpur'].includes(trimmed)) {
      return 'Maharashtra';
    }
    if (['bengaluru', 'bangalore', 'mysore'].includes(trimmed)) {
      return 'Karnataka';
    }
    if (['hyderabad', 'secunderabad'].includes(trimmed)) {
      return 'Telangana';
    }
    if (['chennai', 'coimbatore'].includes(trimmed)) {
      return 'Tamil Nadu';
    }
    if (['kolkata'].includes(trimmed)) {
      return 'West Bengal';
    }
    return undefined;
  }

  /**
   * Normalizes address
   */
  static normalizeAddress(address: string, city: string): string {
    if (!address) {
      const region = LeadNormalizer.getRegionForCity(city);
      return region ? `${city}, ${region}` : city;
    }
    let cleaned = address.trim().replace(/\s+/g, ' ');
    // Remove repeated commas
    cleaned = cleaned.replace(/,\s*,+/g, ',');
    return cleaned;
  }

  /**
   * Normalizes website URL:
   * - HTTP -> HTTPS where applicable
   * - Removes www. for canonical domain comparison
   * - Strips trailing slashes
   * - Lowercases hostname
   */
  static normalizeWebsite(url: string): { normalizedUrl: string; canonicalDomain: string } | null {
    if (!url) return null;
    let trimmed = url.trim();

    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }

    try {
      const parsed = new URL(trimmed);
      let hostname = parsed.hostname.toLowerCase();
      let pathname = parsed.pathname.replace(/\/+$/, ''); // Strip trailing slash

      // Canonical domain (strip leading www.)
      const canonicalDomain = hostname.replace(/^www\./, '');

      // Normalized URL: preserve https protocol, canonicalize path
      const protocol = parsed.protocol.toLowerCase();
      const normalizedUrl = `${protocol}//${hostname}${pathname}${parsed.search}`;

      return {
        normalizedUrl,
        canonicalDomain,
      };
    } catch {
      return null;
    }
  }

  /**
   * Normalizes email: lowercases, trims, validates syntax
   */
  static normalizeEmail(email: string): string | null {
    if (!email) return null;
    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(trimmed)) {
      return trimmed;
    }
    return null;
  }

  /**
   * Normalizes phone number: strips non-digits, formats Indian numbers (+91)
   * Does NOT guess missing digits.
   */
  static normalizePhone(phone: string): string | null {
    if (!phone) return null;
    const trimmed = phone.trim();

    // Remove common formatting characters
    const digitsOnly = trimmed.replace(/\D/g, '');

    // India standard: 10 digits mobile/landline, or 11 digits with leading 0, or 12 digits with 91
    if (digitsOnly.length === 10) {
      if (digitsOnly.startsWith('124')) {
        // Gurgaon landline (STD 0124)
        return `+91-124-${digitsOnly.substring(3)}`;
      }
      return `+91-${digitsOnly.substring(0, 5)}-${digitsOnly.substring(5)}`;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      const core = digitsOnly.substring(1);
      if (core.startsWith('124')) {
        return `+91-124-${core.substring(3)}`;
      }
      return `+91-${core.substring(0, 5)}-${core.substring(5)}`;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      const core = digitsOnly.substring(2);
      if (core.startsWith('124')) {
        return `+91-124-${core.substring(3)}`;
      }
      return `+91-${core.substring(0, 5)}-${core.substring(5)}`;
    }

    // If non-standard length, return clean trimmed value without inventing digits
    return trimmed;
  }
}
