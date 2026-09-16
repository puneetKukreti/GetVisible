import { NormalizedLeadEntity, LeadNormalizer } from './normalizer';
import { LeadData } from '@/types';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  isPossibleDuplicate: boolean;
  confidence: 'HIGH' | 'UNCERTAIN' | 'NONE';
  reason?: string;
  matchedLeadId?: string;
  matchedBusinessName?: string;
}

export class DuplicateDetector {
  /**
   * Check whether candidate normalized entity matches any existing lead.
   * Does NOT auto-merge uncertain matches. Flags them as POSSIBLE_DUPLICATE.
   * Profession-aware: Same name in same city with different professions does not falsely match.
   */
  static check(
    candidate: NormalizedLeadEntity,
    existingLeads: LeadData[]
  ): DuplicateCheckResult {
    const candidateName = candidate.businessName.normalizedValue.toLowerCase();
    const candidateCity = candidate.city.normalizedValue;
    const candidateProfession = (candidate.profession || '').trim().toLowerCase();
    const candidateDomain = candidate.website?.canonicalDomain.toLowerCase();
    const candidateEmail = candidate.publicEmail?.normalizedValue.toLowerCase();
    const candidatePhone = candidate.publicPhone?.normalizedValue.replace(/\D/g, '');

    for (const lead of existingLeads) {
      const leadName = (lead.businessName || '').trim().toLowerCase();
      const leadCity = (lead.city || '').trim();
      const leadProfession = (lead.profession || '').trim().toLowerCase();
      const leadEmail = lead.publicEmail ? lead.publicEmail.trim().toLowerCase() : null;
      const leadPhone = lead.publicPhone ? lead.publicPhone.replace(/\D/g, '') : null;

      const isSameCity = DuplicateDetector.isCityMatch(candidateCity, leadCity);
      const professionsCompatible =
        !candidateProfession ||
        !leadProfession ||
        candidateProfession === leadProfession;

      let leadDomain: string | null = null;
      if (lead.website) {
        try {
          leadDomain = new URL(lead.website.startsWith('http') ? lead.website : `https://${lead.website}`).hostname
            .toLowerCase()
            .replace(/^www\./, '');
        } catch {
          leadDomain = null;
        }
      }

      // Signal 1: Canonical Domain Match (High confidence)
      if (candidateDomain && leadDomain && candidateDomain === leadDomain) {
        return {
          isDuplicate: true,
          isPossibleDuplicate: false,
          confidence: 'HIGH',
          reason: `Exact canonical website domain match: ${candidateDomain}`,
          matchedLeadId: lead.id,
          matchedBusinessName: lead.businessName,
        };
      }

      // Signal 2: Business Email Match (High confidence)
      if (candidateEmail && leadEmail && candidateEmail === leadEmail) {
        return {
          isDuplicate: true,
          isPossibleDuplicate: false,
          confidence: 'HIGH',
          reason: `Exact public business email match: ${candidateEmail}`,
          matchedLeadId: lead.id,
          matchedBusinessName: lead.businessName,
        };
      }

      // Signal 3: Phone Match + City Match
      if (
        candidatePhone &&
        leadPhone &&
        candidatePhone.length >= 8 &&
        candidatePhone === leadPhone &&
        isSameCity
      ) {
        if (professionsCompatible) {
          return {
            isDuplicate: true,
            isPossibleDuplicate: false,
            confidence: 'HIGH',
            reason: `Exact verified business phone and location match in ${lead.city}`,
            matchedLeadId: lead.id,
            matchedBusinessName: lead.businessName,
          };
        } else {
          return {
            isDuplicate: false,
            isPossibleDuplicate: true,
            confidence: 'UNCERTAIN',
            reason: `Phone match in ${lead.city} with existing "${lead.businessName}" of different profession (${lead.profession}). Flagged for human review.`,
            matchedLeadId: lead.id,
            matchedBusinessName: lead.businessName,
          };
        }
      }

      // Signal 4: Exact Business Name + City Match (High confidence only when professions match/compatible)
      if (candidateName === leadName && isSameCity) {
        if (professionsCompatible) {
          return {
            isDuplicate: true,
            isPossibleDuplicate: false,
            confidence: 'HIGH',
            reason: `Exact business name and city match: "${lead.businessName}" in ${lead.city}`,
            matchedLeadId: lead.id,
            matchedBusinessName: lead.businessName,
          };
        }
        // Different professions in same city with same name (e.g. "Apex" CA vs "Apex" Clinic) are NOT duplicates
      }

      // Signal 5: Uncertain / Possible Duplicate (Name token overlap in same city and compatible profession)
      // e.g. "Demo CA Firm 01" vs "Demo CA Firm 01 Associates"
      if (isSameCity && professionsCompatible) {
        const similarity = DuplicateDetector.tokenSimilarity(candidateName, leadName);
        if (similarity >= 0.7 && similarity < 1.0) {
          return {
            isDuplicate: false,
            isPossibleDuplicate: true,
            confidence: 'UNCERTAIN',
            reason: `Possible duplicate: Name similarity (${Math.round(similarity * 100)}%) with existing "${lead.businessName}" in ${lead.city}. Flagged for human review.`,
            matchedLeadId: lead.id,
            matchedBusinessName: lead.businessName,
          };
        }
      }
    }

    return {
      isDuplicate: false,
      isPossibleDuplicate: false,
      confidence: 'NONE',
    };
  }

  /**
   * Evaluates if two city names are equivalent (e.g. Gurugram and Gurgaon)
   */
  static isCityMatch(cityA: string, cityB: string): boolean {
    if (!cityA || !cityB) return false;
    const normA = LeadNormalizer.normalizeCity(cityA).toLowerCase();
    const normB = LeadNormalizer.normalizeCity(cityB).toLowerCase();
    return normA === normB;
  }

  /**
   * Computes Jaccard token similarity between two names
   */
  private static tokenSimilarity(a: string, b: string): number {
    const tokensA = new Set(a.split(/\s+/).filter((t) => t.length > 1));
    const tokensB = new Set(b.split(/\s+/).filter((t) => t.length > 1));
    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersectionCount = 0;
    tokensA.forEach((t) => {
      if (tokensB.has(t)) intersectionCount++;
    });

    const unionCount = tokensA.size + tokensB.size - intersectionCount;
    return unionCount > 0 ? intersectionCount / unionCount : 0;
  }
}
