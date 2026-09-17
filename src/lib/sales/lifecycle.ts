import { LeadData, LeadStatus, WebsiteDemoData } from '@/types';

/**
 * Simplified, clear sales lifecycle transition table.
 * Strictly human-controlled, with DO_NOT_CONTACT available from any state for compliance.
 */
export const ALLOWED_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['QUALIFIED', 'DEMO_GENERATED', 'REJECTED', 'NOT_INTERESTED', 'DO_NOT_CONTACT', 'RESEARCHING'],
  RESEARCHING: ['QUALIFIED', 'NOT_INTERESTED', 'DO_NOT_CONTACT'],
  QUALIFIED: ['DEMO_GENERATED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NOT_INTERESTED', 'DO_NOT_CONTACT', 'NEW'],
  DEMO_GENERATED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'QUALIFIED', 'DO_NOT_CONTACT'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'DEMO_GENERATED', 'QUALIFIED', 'DO_NOT_CONTACT'],
  APPROVED: ['CONTACTED', 'UNDER_REVIEW', 'REJECTED', 'DO_NOT_CONTACT'],
  REJECTED: ['QUALIFIED', 'UNDER_REVIEW', 'DEMO_GENERATED', 'APPROVED', 'NOT_INTERESTED', 'DO_NOT_CONTACT'],
  OUTREACH_PENDING: ['APPROVED', 'CONTACTED', 'REJECTED', 'DO_NOT_CONTACT'],
  CONTACTED: ['RESPONDED', 'REPLIED', 'NOT_INTERESTED', 'DO_NOT_CONTACT', 'INTERESTED', 'CONVERTED'],
  RESPONDED: ['INTERESTED', 'NOT_INTERESTED', 'CONVERTED', 'CUSTOMER', 'DO_NOT_CONTACT'],
  REPLIED: ['INTERESTED', 'NOT_INTERESTED', 'CONVERTED', 'CUSTOMER', 'DO_NOT_CONTACT'],
  INTERESTED: ['CONVERTED', 'CUSTOMER', 'NOT_INTERESTED', 'DO_NOT_CONTACT', 'PROPOSAL'],
  PROPOSAL: ['CONVERTED', 'CUSTOMER', 'LOST', 'NOT_INTERESTED', 'DO_NOT_CONTACT'],
  CONVERTED: ['CUSTOMER', 'DO_NOT_CONTACT'],
  CUSTOMER: ['DO_NOT_CONTACT'],
  NOT_INTERESTED: ['QUALIFIED', 'NEW', 'DO_NOT_CONTACT'],
  LOST: ['QUALIFIED', 'NEW', 'DO_NOT_CONTACT'],
  DO_NOT_CONTACT: ['NEW', 'QUALIFIED'], // Requires deliberate compliance override
};

/**
 * Validate whether transitioning from one status to another is permitted.
 */
export function validateStatusTransition(
  from: LeadStatus,
  to: LeadStatus
): { allowed: boolean; valid: boolean; reason?: string } {
  if (from === to) {
    return { allowed: true, valid: true };
  }

  // DO_NOT_CONTACT is universally allowed as an anti-spam compliance override
  if (to === 'DO_NOT_CONTACT') {
    return { allowed: true, valid: true };
  }

  const validTargets = ALLOWED_TRANSITIONS[from] || [];
  if (validTargets.includes(to)) {
    return { allowed: true, valid: true };
  }

  return {
    allowed: false,
    valid: false,
    reason: `Invalid status transition from "${from}" to "${to}". Allowed transitions from "${from}" are: ${validTargets.join(', ')}.`,
  };
}

/**
 * Approval gate: outreach preparation is strictly blocked unless:
 * 1. Lead qualification is NO_WEBSITE
 * 2. Demo exists
 * 3. Demo is approved
 */
export function canPrepareOutreach(
  lead: LeadData,
  demo?: WebsiteDemoData | null
): { allowed: boolean; reason?: string } {
  if (lead.websiteStatus !== 'NO_WEBSITE') {
    return {
      allowed: false,
      reason: `Outreach requires verified NO_WEBSITE status (current status: ${lead.websiteStatus}). No Website qualification is required.`,
    };
  }

  let activeDemo =
    demo || (lead.websiteDemos && lead.websiteDemos.length > 0 ? lead.websiteDemos[0] : null);

  if (activeDemo && lead.websiteDemos) {
    const fromLead = lead.websiteDemos.find((d) => d.id === activeDemo!.id);
    if (fromLead && fromLead.approvalStatus === 'APPROVED') {
      activeDemo = fromLead;
    }
  }

  if (!activeDemo) {
    return {
      allowed: false,
      reason: 'No website concept demo has been generated. A demo must be generated before outreach can be prepared.',
    };
  }

  if (activeDemo.approvalStatus === 'REJECTED') {
    return {
      allowed: false,
      reason: `Website demo concept was rejected: ${activeDemo.rejectionReason || 'Requires revision'}.`,
    };
  }

  if (activeDemo.approvalStatus === 'PENDING_REVIEW') {
    return {
      allowed: false,
      reason: 'Website demo concept is currently pending review and must be approved before outreach.',
    };
  }

  const isApproved =
    activeDemo.approvalStatus === 'APPROVED' || lead.leadStatus === 'APPROVED';

  if (!isApproved) {
    return {
      allowed: false,
      reason: 'A reviewed and approved website demo is required before outreach can be prepared.',
    };
  }

  return { allowed: true };
}

/**
 * Provides clear contextual next-action recommendations for the sales rep.
 */
export function getNextActionRecommendation(
  lead: LeadData,
  demo?: WebsiteDemoData | null
): {
  stepNumber: number;
  stageTitle: string;
  actionPrompt: string;
  recommendedButton?: { label: string; action: string };
} {
  const activeDemo = demo || (lead.websiteDemos && lead.websiteDemos.length > 0 ? lead.websiteDemos[0] : null);

  if (lead.leadStatus === 'DO_NOT_CONTACT') {
    return {
      stepNumber: 0,
      stageTitle: 'Suppressed (Do Not Contact)',
      actionPrompt: 'This lead is marked DO NOT CONTACT. Outbound communication is suppressed across all channels.',
    };
  }

  if (lead.websiteStatus !== 'NO_WEBSITE') {
    return {
      stepNumber: 1,
      stageTitle: 'Ineligible for Website Demo',
      actionPrompt: `This business has ${lead.websiteStatus}. Demo generation and outreach are restricted to verified businesses without a website.`,
    };
  }

  if (!activeDemo) {
    return {
      stepNumber: 1,
      stageTitle: 'Qualification & Concept Generation',
      actionPrompt: 'This lead is verified with NO WEBSITE. Generate a personalized website demo concept.',
      recommendedButton: { label: 'Generate Website Concept', action: 'GENERATE_DEMO' },
    };
  }

  const approvalStatus = activeDemo.approvalStatus || (lead.leadStatus === 'APPROVED' ? 'APPROVED' : 'PENDING_REVIEW');

  if (approvalStatus === 'PENDING_REVIEW' || lead.leadStatus === 'DEMO_GENERATED' || lead.leadStatus === 'UNDER_REVIEW') {
    return {
      stepNumber: 2,
      stageTitle: 'Human Demo Review',
      actionPrompt: `Website concept v${activeDemo.version} is ready. Review the concept and approve it for outreach, or reject with feedback.`,
      recommendedButton: { label: 'Review & Approve Concept', action: 'REVIEW_DEMO' },
    };
  }

  if (approvalStatus === 'REJECTED' || lead.leadStatus === 'REJECTED') {
    return {
      stepNumber: 2,
      stageTitle: 'Concept Rejected (Improvement Needed)',
      actionPrompt: `Website concept was rejected: "${activeDemo.rejectionReason || 'Requires revision'}". Improve the layout, theme, or practice focus and generate a new version.`,
      recommendedButton: { label: 'Improve Concept', action: 'GENERATE_DEMO' },
    };
  }

  if (approvalStatus === 'APPROVED') {
    return {
      stepNumber: 3,
      stageTitle: 'Outreach Preparation',
      actionPrompt: 'Website demo is approved! Generate personalized outreach copy and copy it to your external email/channel.',
      recommendedButton: { label: 'Prepare Outreach Message', action: 'PREPARE_OUTREACH' },
    };
  }

  if (lead.leadStatus === 'CONTACTED') {
    return {
      stepNumber: 4,
      stageTitle: 'Awaiting Response',
      actionPrompt: 'Outreach sent manually. Awaiting response from business owner. Track their reply when received.',
      recommendedButton: { label: 'Record Response', action: 'RECORD_RESPONSE' },
    };
  }

  if (lead.leadStatus === 'RESPONDED' || lead.leadStatus === 'REPLIED') {
    return {
      stepNumber: 5,
      stageTitle: 'Lead Responded',
      actionPrompt: 'The business owner responded. Qualify their interest level to proceed with consultation.',
      recommendedButton: { label: 'Mark as Interested', action: 'MARK_INTERESTED' },
    };
  }

  if (lead.leadStatus === 'INTERESTED') {
    return {
      stepNumber: 6,
      stageTitle: 'Sales Opportunity / Consultation',
      actionPrompt: 'Business is interested in website design engagement. Prepare commercial proposal or finalize agreement.',
      recommendedButton: { label: 'Mark as Converted', action: 'MARK_CONVERTED' },
    };
  }

  if (lead.leadStatus === 'CONVERTED' || lead.leadStatus === 'CUSTOMER') {
    return {
      stepNumber: 7,
      stageTitle: 'Converted Customer',
      actionPrompt: 'Successfully converted! Client is onboarded for custom website design project.',
    };
  }

  return {
    stepNumber: 1,
    stageTitle: 'Lead Assessment',
    actionPrompt: 'Review lead information and decide next action.',
  };
}
