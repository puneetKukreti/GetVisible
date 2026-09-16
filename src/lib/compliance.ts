import { Channel, ConsentRecordData, SuppressionRecordData, LeadData } from '@/types';

export interface OutreachEligibilityCheck {
  allowed: boolean;
  channel: Channel;
  reason?: string;
  humanApproved: boolean;
  requiresHumanApproval: boolean;
}

/**
 * Compliance check:
 * 1. Outbound communication requires explicit human approval.
 * 2. If the lead is marked DO_NOT_CONTACT, all channels are immediately blocked.
 * 3. If there is an applicable suppression record for that channel, contact is strictly prohibited.
 * 4. Checks consent record status (must not be OPTED_OUT or EXPIRED).
 */
export function checkOutreachEligibility(
  lead: LeadData,
  channel: Channel,
  humanApproved: boolean,
  suppressionRecords: SuppressionRecordData[] = [],
  consentRecords: ConsentRecordData[] = []
): OutreachEligibilityCheck {
  // 1. Check human approval requirement
  if (!humanApproved) {
    return {
      allowed: false,
      channel,
      requiresHumanApproval: true,
      humanApproved: false,
      reason: 'Safety Safeguard: Human approval is mandatory before any outbound commercial communication is initiated.',
    };
  }

  // 2. Global Lead status check
  if (lead.leadStatus === 'DO_NOT_CONTACT') {
    return {
      allowed: false,
      channel,
      requiresHumanApproval: true,
      humanApproved,
      reason: 'Compliance Violation: Lead has explicit DO_NOT_CONTACT status. All communication channels are blocked.',
    };
  }

  // 3. Suppression check for channel
  const suppression = suppressionRecords.find((s) => s.leadId === lead.id && s.channel === channel);
  if (suppression) {
    return {
      allowed: false,
      channel,
      requiresHumanApproval: true,
      humanApproved,
      reason: `Compliance Violation: Lead is in the suppression list for channel ${channel}. Reason: ${suppression.reason}`,
    };
  }

  // 4. Consent check
  const consent = consentRecords.find((c) => c.leadId === lead.id && c.channel === channel);
  if (consent) {
    if (consent.status === 'OPTED_OUT') {
      return {
        allowed: false,
        channel,
        requiresHumanApproval: true,
        humanApproved,
        reason: `Compliance Violation: Lead has explicitly OPTED_OUT of ${channel} communications.`,
      };
    }
    if (consent.status === 'EXPIRED') {
      return {
        allowed: false,
        channel,
        requiresHumanApproval: true,
        humanApproved,
        reason: `Consent has expired for ${channel}. Re-consent or public inquiry validation required.`,
      };
    }
  }

  return {
    allowed: true,
    channel,
    requiresHumanApproval: true,
    humanApproved: true,
  };
}

export const COMPLIANCE_PRINCIPLES = [
  {
    title: 'Zero-Spam Architecture',
    description: 'We strictly disallow high-volume automated blasting. Every interaction is individual and research-backed.',
  },
  {
    title: 'Legitimate Public Sources Only',
    description: 'Only public business registry and directory information is permitted. No credential bypass or scraping of protected data.',
  },
  {
    title: 'Strict Suppression Enforcement',
    description: 'Channels flagged with suppression or opt-outs are blocked at the database engine level before any request can be dispatched.',
  },
  {
    title: 'Mandatory Human Approval',
    description: 'Autonomous outbound actions are architecturally impossible without an explicit human sign-off.',
  },
];
