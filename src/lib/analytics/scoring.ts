import { LeadData, OperationalLeadScore, OperationalScoreRule } from '@/types';

/**
 * Deterministically evaluates operational quality rules to score a lead's conversion readiness.
 * Pure function safe for both client and server bundles.
 */
export function calculateOperationalLeadScore(lead: LeadData): OperationalLeadScore {
  const rules: OperationalScoreRule[] = [
    {
      id: 'no_website',
      label: 'Verified No Website',
      points: 25,
      satisfied: lead.websiteStatus === 'NO_WEBSITE',
      explanation:
        lead.websiteStatus === 'NO_WEBSITE'
          ? 'Target practice has no digital website presence, presenting prime opportunity.'
          : 'Business already possesses a website or status is unverified.',
    },
    {
      id: 'phone_available',
      label: 'Direct Phone Available',
      points: 20,
      satisfied: Boolean(lead.publicPhone && lead.publicPhone.trim().length > 0),
      explanation: lead.publicPhone
        ? `Direct telephone (${lead.publicPhone}) verified for rapid contact.`
        : 'Missing verified telephone number.',
    },
    {
      id: 'email_available',
      label: 'Public Email Available',
      points: 15,
      satisfied: Boolean(lead.publicEmail && lead.publicEmail.trim().length > 0),
      explanation: lead.publicEmail
        ? `Official email (${lead.publicEmail}) available for formal written outreach.`
        : 'Missing business email contact.',
    },
    {
      id: 'target_metro',
      label: 'High-Growth Metro Location',
      points: 10,
      satisfied: Boolean(
        lead.city &&
          ['gurgaon', 'delhi', 'noida', 'mumbai', 'bengaluru', 'bangalore', 'pune', 'hyderabad', 'chennai'].some((c) =>
            lead.city.toLowerCase().includes(c)
          )
      ),
      explanation: lead.city
        ? `Located in tier-1 financial hub (${lead.city}).`
        : 'Unspecified geographic territory.',
    },
    {
      id: 'demo_generated',
      label: 'Concept Demo Generated',
      points: 15,
      satisfied:
        Boolean(lead.websiteDemos && lead.websiteDemos.length > 0) ||
        ['DEMO_GENERATED', 'UNDER_REVIEW', 'APPROVED', 'OUTREACH_PENDING', 'CONTACTED', 'RESPONDED', 'REPLIED', 'INTERESTED', 'CONVERTED', 'CUSTOMER'].includes(
          lead.leadStatus
        ),
      explanation:
        Boolean(lead.websiteDemos && lead.websiteDemos.length > 0) || lead.leadStatus !== 'NEW'
          ? 'Personalized modern concept demo generated and available for preview.'
          : 'No concept demo generated yet.',
    },
    {
      id: 'demo_approved',
      label: 'Concept Demo Approved',
      points: 15,
      satisfied:
        Boolean(lead.websiteDemos && lead.websiteDemos.some((d) => d.approvalStatus === 'APPROVED')) ||
        ['APPROVED', 'OUTREACH_PENDING', 'CONTACTED', 'RESPONDED', 'REPLIED', 'INTERESTED', 'CONVERTED', 'CUSTOMER'].includes(lead.leadStatus),
      explanation:
        Boolean(lead.websiteDemos && lead.websiteDemos.some((d) => d.approvalStatus === 'APPROVED')) ||
        ['APPROVED', 'CONTACTED', 'RESPONDED', 'INTERESTED', 'CONVERTED'].includes(lead.leadStatus)
          ? 'Concept demo reviewed and approved by human specialist.'
          : 'Demo pending review or rejected.',
    },
  ];

  const totalScore = rules.reduce((acc, rule) => (rule.satisfied ? acc + rule.points : acc), 0);
  const maxScore = rules.reduce((acc, rule) => acc + rule.points, 0);

  let summary = 'Low Priority — Missing critical contact details or not qualified.';
  if (totalScore >= 80) {
    summary = 'High Opportunity — Complete contact info and approved concept demo.';
  } else if (totalScore >= 50) {
    summary = 'Medium Opportunity — Good target profile, pending verification or demo review.';
  }

  return {
    score: totalScore,
    maxScore,
    rules,
    summary,
  };
}
