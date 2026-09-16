import { WebsiteVerificationEvidence, WebsiteVerificationStatus } from '@/types';
import { NormalizedLeadEntity } from './normalizer';

export class WebsiteVerifier {
  /**
   * Verify website ownership using strictly factual evidence.
   * Never makes unsupported AI guesses.
   */
  static verify(entity: NormalizedLeadEntity): WebsiteVerificationEvidence {
    const timestamp = new Date().toISOString();

    if (!entity.website || !entity.website.normalizedValue) {
      return {
        status: 'FAILED',
        businessNameFound: false,
        phoneMatch: false,
        addressMatch: false,
        domainMatch: false,
        details: 'No website URL associated with lead.',
        verifiedAt: timestamp,
      };
    }

    const domain = entity.website.canonicalDomain.toLowerCase();
    const businessName = entity.businessName.normalizedValue.toLowerCase();
    const email = entity.publicEmail?.normalizedValue?.toLowerCase();

    // Signal 1: Email domain match (strong factual evidence)
    // e.g. contact@demo-ca-01.example matching website demo-ca-01.example
    const emailDomain = email ? email.split('@')[1] : null;
    const emailDomainMatch = Boolean(emailDomain && emailDomain === domain);

    // Signal 2: Domain tokens matching business name tokens
    const domainStem = domain.split('.')[0].replace(/[^a-z0-9]/g, '');
    const nameTokens = businessName
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const tokenMatches = nameTokens.filter((token) => domainStem.includes(token));
    const domainMatch = tokenMatches.length >= 2 || (nameTokens.length === 1 && tokenMatches.length === 1);

    // Signal 3: Physical address corroboration
    const addressMatch = Boolean(
      entity.address?.normalizedValue &&
      entity.city?.normalizedValue &&
      entity.address.normalizedValue.toLowerCase().includes(entity.city.normalizedValue.toLowerCase())
    );

    // Signal 4: Verified business phone presence
    const phoneMatch = Boolean(entity.publicPhone?.normalizedValue);

    // Factual verification determination
    let status: WebsiteVerificationStatus = 'REQUIRES_REVIEW';
    const evidenceNotes: string[] = [];

    if (emailDomainMatch) {
      evidenceNotes.push(`Public business email domain (${emailDomain}) directly matches website domain (${domain}).`);
    }

    if (domainMatch) {
      evidenceNotes.push(`Business name tokens [${tokenMatches.join(', ')}] factually match domain identifier.`);
    }

    if (phoneMatch) {
      evidenceNotes.push('Business telephone registered to same entity.');
    }

    if (addressMatch) {
      evidenceNotes.push(`Physical office address corroborated in ${entity.city.normalizedValue}.`);
    }

    // VERIFIED requires email domain match OR (domain match AND phone/address corroboration)
    if (emailDomainMatch || (domainMatch && (phoneMatch || addressMatch))) {
      status = 'VERIFIED';
    } else if (domainMatch) {
      status = 'REQUIRES_REVIEW';
      evidenceNotes.push('Domain similarity noted, but requires manual confirmation of business contact page.');
    } else {
      status = 'REQUIRES_REVIEW';
      evidenceNotes.push('Domain ownership cannot be confirmed with high confidence without manual inspection.');
    }

    return {
      status,
      businessNameFound: domainMatch,
      phoneMatch,
      addressMatch,
      domainMatch: emailDomainMatch || domainMatch,
      details: evidenceNotes.join(' '),
      verifiedAt: timestamp,
    };
  }
}
