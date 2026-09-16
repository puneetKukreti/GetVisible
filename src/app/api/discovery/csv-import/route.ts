import { NextRequest, NextResponse } from 'next/server';
import { CsvLeadSourceProvider } from '@/lib/discovery/providers/csv';
import { LeadNormalizer } from '@/lib/discovery/normalizer';
import { DuplicateDetector } from '@/lib/discovery/deduplicator';
import { LeadQualityValidator } from '@/lib/discovery/validator';
import { WebsiteVerifier } from '@/lib/discovery/website-verifier';
import { LeadRepository } from '@/lib/db/repository';
import { createAuditLogEntry } from '@/lib/audit';
import { getResolvedOrganizationId } from '@/lib/auth';
import { LeadData, WebsiteStatus } from '@/types';
import { DiscoveryItemResult } from '@/lib/discovery/job-runner';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: Organization context required' }, { status: 401 });
    }


    let csvContent = '';
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (file && typeof (file as Blob).text === 'function') {
        csvContent = await (file as Blob).text();
      } else {
        csvContent = (formData.get('csvContent') as string) || '';
      }
    } else {
      const json = await request.json().catch(() => ({}));
      csvContent = json.csvContent || '';
    }

    if (!csvContent || typeof csvContent !== 'string' || csvContent.trim().length === 0) {
      return NextResponse.json({ error: 'No CSV content provided. Please upload a .csv file or provide CSV rows.' }, { status: 400 });
    }

    const csvProvider = new CsvLeadSourceProvider();
    const rawRecords = csvProvider.parseCsv(csvContent);

    if (rawRecords.length === 0) {
      return NextResponse.json(
        {
          error:
            'No valid rows found. Ensure the CSV contains a header line with "business_name", "profession", "city", "address", etc.',
        },
        { status: 400 }
      );
    }

    // Pipeline: Normalize -> Deduplicate -> Validate -> Import
    const existingLeads = (await LeadRepository.listLeads(orgId, { pageSize: 500 })).leads;

    let found = rawRecords.length;
    let valid = 0;
    let duplicates = 0;
    let imported = 0;
    let errors = 0;
    const results: DiscoveryItemResult[] = [];

    const jobId = `job-csv-${Date.now()}`;

    for (const raw of rawRecords) {
      try {
        const entity = LeadNormalizer.normalize(raw);

        // Deduplicate
        const dupCheck = DuplicateDetector.check(entity, existingLeads);
        if (dupCheck.isDuplicate) {
          duplicates++;
          results.push({
            businessName: entity.businessName.normalizedValue,
            city: entity.city.normalizedValue,
            website: entity.website?.normalizedValue || null,
            publicEmail: entity.publicEmail?.normalizedValue || null,
            publicPhone: entity.publicPhone?.normalizedValue || null,
            source: entity.source,
            sourceUrl: entity.sourceUrl,
            sourceQuality: 'USER_IMPORTED',
            websiteStatus: entity.website ? 'WEBSITE_EXISTS' : 'NO_WEBSITE',
            importStatus: 'DUPLICATE_SKIPPED',
            details: dupCheck.reason,
          });
          continue;
        }

        // Validate
        const validation = LeadQualityValidator.validate(entity);
        if (!validation.valid) {
          errors++;
          results.push({
            businessName: entity.businessName.normalizedValue,
            city: entity.city.normalizedValue,
            website: entity.website?.normalizedValue || null,
            publicEmail: entity.publicEmail?.normalizedValue || null,
            publicPhone: entity.publicPhone?.normalizedValue || null,
            source: entity.source,
            sourceUrl: entity.sourceUrl,
            sourceQuality: 'USER_IMPORTED',
            websiteStatus: entity.website ? 'WEBSITE_EXISTS' : 'NO_WEBSITE',
            importStatus: 'VALIDATION_FAILED',
            details: validation.errors.join(', '),
          });
          continue;
        }

        valid++;

        // Factual Website Verification
        const verification = entity.website ? WebsiteVerifier.verify(entity) : null;
        const websiteStatus: WebsiteStatus = entity.website
          ? 'WEBSITE_EXISTS'
          : 'NO_WEBSITE';

        const newLead: Partial<LeadData> = {
          businessName: entity.businessName.normalizedValue,
          profession: entity.profession,
          city: entity.city.normalizedValue,
          address: entity.address.normalizedValue,
          website: entity.website?.normalizedValue || null,
          publicEmail: entity.publicEmail?.normalizedValue || null,
          publicPhone: entity.publicPhone?.normalizedValue || null,
          source: 'USER_IMPORTED',
          sourceUrl: entity.sourceUrl || 'user-import://csv',
          sourceQuality: 'USER_IMPORTED',
          websiteStatus,
          leadStatus: 'NEW',
          opportunityScore: websiteStatus === 'NO_WEBSITE' ? 90 : 70,
          opportunityReason: `Imported via verified user CSV upload from ${entity.source}.`,
          isDemoData: false,
          isPossibleDuplicate: dupCheck.isPossibleDuplicate,
          duplicateNotes: dupCheck.reason,
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
                  organizationId: orgId,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ]
            : [],
          contacts: entity.publicEmail || entity.publicPhone
            ? [
                {
                  id: `cnt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  name: `${entity.businessName.normalizedValue} Office`,
                  role: 'Public Business Contact',
                  email: entity.publicEmail?.normalizedValue || null,
                  phone: entity.publicPhone?.normalizedValue || null,
                  isPrimary: true,
                  classification: entity.publicEmail
                    ? LeadQualityValidator.classifyEmail(entity.publicEmail.normalizedValue)
                    : 'PUBLIC_BUSINESS_PHONE',
                  leadId: '',
                  organizationId: orgId,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ]
            : [],
        };

        const createdLead = await LeadRepository.createLead(newLead, orgId, 'Agency User (CSV Import)');
        imported++;

        // Add to existing list so subsequent rows in same CSV don't duplicate each other
        existingLeads.push(createdLead);

        // Audit Log
        const audit = createAuditLogEntry({
          action: 'LEAD_CREATED',
          entity: 'Lead',
          entityId: createdLead.id,
          actor: 'Agency User (CSV Import)',
          organizationId: orgId,
          details: {
            action: 'LEAD_IMPORTED',
            jobId,
            source: 'USER_IMPORTED',
            sourceQuality: 'USER_IMPORTED',
            isPossibleDuplicate: dupCheck.isPossibleDuplicate,
          },
        });

        results.push({
          businessName: createdLead.businessName,
          city: createdLead.city,
          website: createdLead.website || null,
          publicEmail: createdLead.publicEmail || null,
          publicPhone: createdLead.publicPhone || null,
          source: 'USER_IMPORTED',
          sourceUrl: createdLead.sourceUrl || '',
          sourceQuality: 'USER_IMPORTED',
          websiteStatus: createdLead.websiteStatus,
          importStatus: dupCheck.isPossibleDuplicate ? 'POSSIBLE_DUPLICATE_IMPORTED' : 'IMPORTED',
          leadId: createdLead.id,
          details: dupCheck.reason || 'Imported via CSV',
        });
      } catch (rowErr) {
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      jobId,
      found,
      valid,
      duplicates,
      imported,
      errors,
      results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'CSV import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
