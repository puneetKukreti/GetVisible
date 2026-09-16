import { JobData, LeadData, WebsiteStatus } from '@/types';
import { DiscoverySearchInput, DiscoveredBusinessRecord } from './providers/types';
import { providerRegistry } from './providers/registry';
import { LeadNormalizer, NormalizedLeadEntity } from './normalizer';
import { DuplicateDetector } from './deduplicator';
import { LeadQualityValidator } from './validator';
import { WebsiteVerifier } from './website-verifier';
import { LeadRepository } from '../db/repository';
import { createAuditLogEntry } from '../audit';
import { DEMO_ORGANIZATION_ID } from '../db/demo-data';

export interface DiscoveryItemResult {
  businessName: string;
  city: string;
  website: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  source: string;
  sourceUrl: string;
  sourceQuality: string;
  websiteStatus: WebsiteStatus;
  importStatus: 'IMPORTED' | 'DUPLICATE_SKIPPED' | 'VALIDATION_FAILED' | 'POSSIBLE_DUPLICATE_IMPORTED';
  leadId?: string;
  details?: string;
}

export interface DiscoveryJobProgress {
  currentStage: 'SEARCHING' | 'NORMALIZING' | 'DEDUPLICATING' | 'VALIDATING' | 'IMPORTING' | 'COMPLETED' | 'FAILED';
  found: number;
  valid: number;
  duplicates: number;
  imported: number;
  errors: number;
  results: DiscoveryItemResult[];
  error?: string;
}

// In-memory store for active job progress during asynchronous steps
const activeJobProgress = new Map<string, DiscoveryJobProgress>();

export class DiscoveryJobRunner {
  static getJobProgress(jobId: string): DiscoveryJobProgress | null {
    return activeJobProgress.get(jobId) || null;
  }

  /**
   * Run full discovery pipeline asynchronously.
   */
  static async runJob(
    jobId: string,
    input: DiscoverySearchInput,
    organizationId: string,
    actor: string
  ): Promise<void> {
    const progress: DiscoveryJobProgress = {
      currentStage: 'SEARCHING',
      found: 0,
      valid: 0,
      duplicates: 0,
      imported: 0,
      errors: 0,
      results: [],
    };
    activeJobProgress.set(jobId, progress);

    try {
      // 1. Resolve Provider
      const provider = providerRegistry.getActiveDiscoveryProvider();

      if (!provider.isConfigured()) {
        const status = provider.getStatus();
        throw new Error(`Lead discovery provider is not configured: ${status.details}`);
      }

      // 2. Search Provider
      progress.currentStage = 'SEARCHING';
      const searchResult = await provider.searchBusinesses(input);

      if (!searchResult.success || !searchResult.data) {
        throw new Error(searchResult.error || 'Failed to retrieve records from provider.');
      }

      const rawRecords: DiscoveredBusinessRecord[] = searchResult.data;
      progress.found = rawRecords.length;

      // 3. Normalizing
      progress.currentStage = 'NORMALIZING';
      const normalizedEntities: NormalizedLeadEntity[] = [];
      for (const raw of rawRecords) {
        try {
          const normalized = LeadNormalizer.normalize(raw);
          normalizedEntities.push(normalized);
        } catch {
          progress.errors++;
        }
      }

      // 4. Deduplicating
      progress.currentStage = 'DEDUPLICATING';
      const orgLeads = await LeadRepository.listLeads(organizationId, { pageSize: 500 });
      const existingLeads = orgLeads.leads;

      const deduplicatedEntities: { entity: NormalizedLeadEntity; isPossibleDuplicate: boolean; dupReason?: string }[] = [];

      for (const entity of normalizedEntities) {
        const dupCheck = DuplicateDetector.check(entity, existingLeads);

        if (dupCheck.isDuplicate) {
          progress.duplicates++;
          progress.results.push({
            businessName: entity.businessName.normalizedValue,
            city: entity.city.normalizedValue,
            website: entity.website?.normalizedValue || null,
            publicEmail: entity.publicEmail?.normalizedValue || null,
            publicPhone: entity.publicPhone?.normalizedValue || null,
            source: entity.source,
            sourceUrl: entity.sourceUrl,
            sourceQuality: entity.sourceQuality,
            websiteStatus: entity.website ? 'WEBSITE_EXISTS' : 'NO_WEBSITE',
            importStatus: 'DUPLICATE_SKIPPED',
            details: dupCheck.reason,
          });
        } else {
          deduplicatedEntities.push({
            entity,
            isPossibleDuplicate: dupCheck.isPossibleDuplicate,
            dupReason: dupCheck.reason,
          });
        }
      }

      // 5. Validating
      progress.currentStage = 'VALIDATING';
      const validEntities: { entity: NormalizedLeadEntity; isPossibleDuplicate: boolean; dupReason?: string }[] = [];

      for (const item of deduplicatedEntities) {
        const validation = LeadQualityValidator.validate(item.entity);
        if (!validation.valid) {
          progress.errors++;
          progress.results.push({
            businessName: item.entity.businessName.normalizedValue,
            city: item.entity.city.normalizedValue,
            website: item.entity.website?.normalizedValue || null,
            publicEmail: item.entity.publicEmail?.normalizedValue || null,
            publicPhone: item.entity.publicPhone?.normalizedValue || null,
            source: item.entity.source,
            sourceUrl: item.entity.sourceUrl,
            sourceQuality: item.entity.sourceQuality,
            websiteStatus: item.entity.website ? 'WEBSITE_EXISTS' : 'NO_WEBSITE',
            importStatus: 'VALIDATION_FAILED',
            details: validation.errors.join(', '),
          });
        } else {
          progress.valid++;
          validEntities.push(item);
        }
      }

      // 6. Importing
      progress.currentStage = 'IMPORTING';

      for (const item of validEntities) {
        const entity = item.entity;

        // Factual Website Verification
        const verification = entity.website ? WebsiteVerifier.verify(entity) : null;
        const websiteStatus: WebsiteStatus = entity.website
          ? 'WEBSITE_EXISTS'
          : 'NO_WEBSITE';

        // Calculate opportunity estimate
        let oppScore = 65;
        let oppReason = `Discovered via ${entity.source}.`;
        if (websiteStatus === 'NO_WEBSITE') {
          oppScore = 92;
          oppReason = 'Business currently has no official website online. Prime opportunity to build modern digital presence.';
        } else if (websiteStatus === 'WEBSITE_EXISTS') {
          oppScore = 70;
          oppReason = 'Business has existing website presence recorded.';
        }

        const newLead: Partial<LeadData> = {
          businessName: entity.businessName.normalizedValue,
          profession: entity.profession,
          city: entity.city.normalizedValue,
          address: entity.address.normalizedValue,
          website: entity.website?.normalizedValue || null,
          publicEmail: entity.publicEmail?.normalizedValue || null,
          publicPhone: entity.publicPhone?.normalizedValue || null,
          source: entity.source,
          sourceUrl: entity.sourceUrl,
          sourceQuality: entity.sourceQuality,
          websiteStatus,
          leadStatus: 'NEW',
          opportunityScore: oppScore,
          opportunityReason: oppReason,
          isDemoData: entity.isDemoData,
          isPossibleDuplicate: item.isPossibleDuplicate,
          duplicateNotes: item.dupReason,
          fieldProvenance: {
            businessName: entity.businessName,
            website: entity.website || undefined,
            publicEmail: entity.publicEmail || undefined,
            publicPhone: entity.publicPhone || undefined,
            address: entity.address,
          },
          websites: entity.website
            ? [
                {
                  id: `web-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  url: entity.website.normalizedValue,
                  status: websiteStatus,
                  speedScore: 50,
                  mobileFriendly: true,
                  hasSsl: entity.website.normalizedValue.startsWith('https://'),
                  verificationStatus: verification?.status || 'UNVERIFIED',
                  verificationEvidence: verification,
                  leadId: '',
                  organizationId,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ]
            : [],
          contacts: entity.publicEmail || entity.publicPhone
            ? [
                {
                  id: `cnt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  name: `${entity.businessName.normalizedValue} Primary Office`,
                  role: 'Public Business Contact',
                  email: entity.publicEmail?.normalizedValue || null,
                  phone: entity.publicPhone?.normalizedValue || null,
                  isPrimary: true,
                  classification: entity.publicEmail
                    ? LeadQualityValidator.classifyEmail(entity.publicEmail.normalizedValue)
                    : 'PUBLIC_BUSINESS_PHONE',
                  leadId: '',
                  organizationId,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ]
            : [],
        };

        const createdLead = await LeadRepository.createLead(newLead, organizationId, actor);
        progress.imported++;

        // Record LEAD_IMPORTED Audit Log
        const audit = createAuditLogEntry({
          action: 'LEAD_CREATED',
          entity: 'Lead',
          entityId: createdLead.id,
          actor,
          organizationId,
          details: {
            action: 'LEAD_IMPORTED',
            jobId,
            provider: provider.name,
            source: entity.source,
            sourceQuality: entity.sourceQuality,
            isDemoData: entity.isDemoData,
            isPossibleDuplicate: item.isPossibleDuplicate,
          },
        });
        // Attach audit
        if (process.env.DEMO_MODE === 'true') {
          // Handled inside LeadRepository createLead
        }

        const importStatus = item.isPossibleDuplicate ? 'POSSIBLE_DUPLICATE_IMPORTED' : 'IMPORTED';
        progress.results.push({
          businessName: createdLead.businessName,
          city: createdLead.city,
          website: createdLead.website || null,
          publicEmail: createdLead.publicEmail || null,
          publicPhone: createdLead.publicPhone || null,
          source: createdLead.source,
          sourceUrl: createdLead.sourceUrl || '',
          sourceQuality: createdLead.sourceQuality || entity.sourceQuality,
          websiteStatus: createdLead.websiteStatus,
          importStatus,
          leadId: createdLead.id,
          details: item.dupReason || 'Successfully validated and imported into CRM.',
        });
      }

      progress.currentStage = 'COMPLETED';
    } catch (err: unknown) {
      progress.currentStage = 'FAILED';
      progress.error = err instanceof Error ? err.message : String(err);
    }
  }
}
