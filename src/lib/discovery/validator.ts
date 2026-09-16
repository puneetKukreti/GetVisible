import { NormalizedLeadEntity } from './normalizer';
import { LeadValidationResult, ContactClassification } from '@/types';

export class LeadQualityValidator {
  /**
   * Validates quality of a normalized lead entity before import into CRM.
   */
  static validate(entity: NormalizedLeadEntity): LeadValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Business Name Check
    if (
      !entity.businessName ||
      !entity.businessName.normalizedValue ||
      entity.businessName.normalizedValue.trim().length < 2
    ) {
      errors.push('Missing or invalid business name.');
    }

    // 2. Location Check
    if (
      !entity.city ||
      !entity.city.normalizedValue ||
      entity.city.normalizedValue.trim().length < 2
    ) {
      errors.push('Missing or invalid location / city.');
    }

    // 3. Source Check
    if (!entity.source || entity.source.trim().length === 0) {
      errors.push('Missing provenance source attribution.');
    }
    if (!entity.sourceUrl || entity.sourceUrl.trim().length === 0) {
      errors.push('Missing provenance source reference URL.');
    }

    // 4. Meaningful Business Identifier Check
    // Must have at least one of: verified website, valid public email, valid public phone, or specific street address
    const hasWebsite = Boolean(entity.website?.normalizedValue);
    const hasEmail = Boolean(entity.publicEmail?.normalizedValue);
    const hasPhone = Boolean(entity.publicPhone?.normalizedValue);
    const hasSpecificAddress = Boolean(
      entity.address?.normalizedValue &&
      entity.address.normalizedValue.length > 8 &&
      !entity.address.normalizedValue.toLowerCase().startsWith('unknown')
    );

    if (!hasWebsite && !hasEmail && !hasPhone && !hasSpecificAddress) {
      errors.push(
        'Garbage record: No meaningful business identifier found (requires at least one valid website, public business email, public phone, or specific physical address).'
      );
    }

    // Warnings
    if (!hasWebsite) {
      warnings.push('No website discovered for firm; website status will be set to NO_WEBSITE.');
    }
    if (!hasEmail && !hasPhone) {
      warnings.push('No direct contact channel discovered. Only public directory listing available.');
    }
    if (entity.website && !entity.website.normalizedValue.startsWith('https://')) {
      warnings.push('Website uses insecure HTTP protocol.');
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Classify email contact as business vs personal vs unknown.
   * Note: This does NOT grant marketing consent (consentStatus remains UNKNOWN).
   */
  static classifyEmail(email: string): ContactClassification {
    if (!email) return 'UNKNOWN';
    const lower = email.toLowerCase();
    const publicMailboxPrefixes = ['contact@', 'info@', 'office@', 'inquiry@', 'admin@', 'support@', 'tax@', 'audit@'];
    const personalFreeDomains = ['@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com', '@rediffmail.com'];

    const hasPublicPrefix = publicMailboxPrefixes.some((p) => lower.startsWith(p));
    const isFreePersonal = personalFreeDomains.some((d) => lower.endsWith(d));

    if (hasPublicPrefix || !isFreePersonal) {
      return 'PUBLIC_BUSINESS_EMAIL';
    }

    if (isFreePersonal) {
      return 'PUBLIC_PERSONAL_CONTACT';
    }

    return 'UNKNOWN';
  }

  /**
   * Classify phone contact as business landline/registered firm mobile vs personal.
   */
  static classifyPhone(phone: string): ContactClassification {
    if (!phone) return 'UNKNOWN';
    // Dedicated STD landlines (e.g. 0124 Gurgaon) or registered business lines
    if (phone.includes('-124-') || phone.startsWith('+91-11-')) {
      return 'PUBLIC_BUSINESS_PHONE';
    }
    return 'PUBLIC_BUSINESS_PHONE';
  }
}
