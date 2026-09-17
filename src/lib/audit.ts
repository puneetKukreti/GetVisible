import { AuditLogData } from '@/types';

export interface CreateAuditLogParams {
  action:
    | 'LEAD_CREATED'
    | 'LEAD_UPDATED'
    | 'LEAD_STATUS_CHANGED'
    | 'LEAD_MARKED_DO_NOT_CONTACT'
    | 'CONTACT_UPDATED'
    | 'AI_ANALYSIS_REQUESTED'
    | 'DEMO_GENERATED'
    | 'DEMO_APPROVED'
    | 'DEMO_REJECTED'
    | 'OUTREACH_APPROVED'
    | 'OUTREACH_REJECTED'
    | 'CONSENT_UPDATED'
    | 'SUPPRESSION_ADDED';
  entity: 'Lead' | 'Contact' | 'Website' | 'Job' | 'ConsentRecord' | 'SuppressionRecord' | 'WebsiteDemo';
  entityId: string;
  actor: string;
  actorId?: string;
  organizationId: string;
  details?: Record<string, unknown>;
}

export function createAuditLogEntry(params: CreateAuditLogParams): AuditLogData {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    actor: params.actor,
    actorId: params.actorId || null,
    organizationId: params.organizationId,
    details: params.details || null,
    createdAt: new Date().toISOString(),
  };
}
