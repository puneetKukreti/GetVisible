import { z } from 'zod';
import { LeadData, WebsiteDemoData, OutreachMessage, OutreachInput } from '@/types';
import { canPrepareOutreach } from './lifecycle';
import { GeminiAIProvider } from '@/lib/providers/ai.provider';
import { getAppBaseUrl, getPublicDemoUrl } from '@/lib/demos/public';

export const OutreachMessageSchema = z.object({
  subject: z.string().min(5).max(120),
  message: z.string().min(30).max(1200),
  personalizationReason: z.string().min(5).max(300),
});

/**
 * List of banned spammy, aggressive, or unsupported claims.
 */
const UNSUPPORTED_CLAIM_PATTERNS = [
  /your website is (bad|terrible|broken|horrible|outdated|ugly)/i,
  /competitors are (stealing|getting more|taking) your (clients|customers)/i,
  /you are losing (money|clients|customers|revenue)/i,
  /guarantee(s|d)?/i,
  /double your (revenue|income|business)/i,
  /#1 (google|ranking|agency|firm)/i,
  /we are the #1|award-winning agency/i,
  /100(x|%) (traffic|revenue|growth|boost|clients)/i,
];

/**
 * Validates that an outreach message strictly abides by claim-safety principles.
 */
export function validateOutreachClaims(
  input: string | OutreachMessage
): { valid: boolean; violation?: string; violations: string[] } {
  const messageText =
    typeof input === 'string'
      ? input
      : `${input.subject || ''} ${input.message || ''} ${input.personalizationReason || ''}`;

  const violations: string[] = [];
  for (const pattern of UNSUPPORTED_CLAIM_PATTERNS) {
    if (pattern.test(messageText)) {
      violations.push(
        `Message violates claim-safety guidelines (matches unsupported claim pattern: ${pattern.source}).`
      );
    }
  }

  return {
    valid: violations.length === 0,
    violation: violations[0],
    violations,
  };
}

/**
 * High-quality deterministic fallback message when AI is unavailable or produces invalid copy.
 * Professional, concise, respectful, and communicating genuine value without false claims.
 */
export function generateDeterministicOutreach(input: OutreachInput): OutreachMessage {
  const professionLabel = input.profession || 'firm';
  const citySuffix = input.city ? ` in ${input.city}` : '';
  const contactSalutation = input.contactName ? `Dear ${input.contactName}` : `Hello ${input.businessName} Team`;

  const subject = `Website Concept Prepared for ${input.businessName}`;

  const message = `${contactSalutation},

I came across ${input.businessName}${citySuffix} while researching established ${professionLabel} practices.

Recognizing that your firm currently does not maintain an active website, I put together a functional, personalized website concept tailored specifically for your practice areas and client inquiries.

You can preview the live concept here:
${input.demoUrl}

The concept highlights your core advisory services, compliance credibility, and secure contact channels. If you find this helpful, I would be glad to adjust the layout and sections according to your specific preferences.

Best regards,
GetVisible Digital Team`;

  const personalizationReason = `Referenced ${input.businessName}, ${professionLabel} specialization, ${input.city} location, and direct demo link.`;

  return {
    subject,
    message,
    personalizationReason,
  };
}

export class OutreachGeneratorService {
  private aiProvider: GeminiAIProvider;

  constructor(aiProvider?: GeminiAIProvider) {
    this.aiProvider = aiProvider || new GeminiAIProvider();
  }

  /**
   * Generates a personalized outreach draft.
   * Gated strictly by approved website demo and verified NO_WEBSITE qualification.
   */
  async generateOutreach(
    lead: LeadData,
    demo?: WebsiteDemoData | null,
    options?: { baseUrl?: string; usePublicToken?: boolean }
  ): Promise<{ success: boolean; outreach: OutreachMessage; isAiGenerated: boolean; error?: string }> {
    // 1. Gate check
    const gate = canPrepareOutreach(lead, demo);
    if (!gate.allowed) {
      throw new Error(gate.reason || 'Demo approval is required before outreach can be prepared.');
    }

    let activeDemo =
      demo || (lead.websiteDemos && lead.websiteDemos.length > 0 ? lead.websiteDemos[0] : null);

    if (activeDemo && lead.websiteDemos) {
      const fromLead = lead.websiteDemos.find((d) => d.id === activeDemo!.id);
      if (fromLead && fromLead.approvalStatus === 'APPROVED') {
        activeDemo = fromLead;
      }
    }

    // 2. Strict Demo URL Construction (Prefer cryptographically secure publicToken if requested)
    const base = options?.baseUrl ? options.baseUrl.replace(/\/+$/, '') : getAppBaseUrl();
    const demoUrl =
      options?.usePublicToken && activeDemo?.publicToken
        ? getPublicDemoUrl(activeDemo.publicToken, base)
        : `${base}/demo/${lead.id}`;

    const input: OutreachInput = {
      businessName: lead.businessName,
      profession: lead.profession,
      city: lead.city,
      contactName: lead.contacts?.[0]?.name,
      publicEmail: lead.publicEmail,
      publicPhone: lead.publicPhone,
      demoUrl,
      templateName: activeDemo?.design?.layout || activeDemo?.templateId,
      themeName: activeDemo?.theme?.name || activeDemo?.theme?.id,
      opportunityReason: lead.opportunityReason,
    };

    // 3. Try AI generation if configured
    if (this.aiProvider.isConfigured()) {
      try {
        const result = await this.aiProvider.generatePersonalizedOutreach(input);
        if (result.success && result.data) {
          // Verify claim safety
          const claimCheck = validateOutreachClaims(result.data.message);
          if (claimCheck.valid) {
            // Guarantee demo URL is embedded
            let finalMessage = result.data.message;
            if (!finalMessage.includes(demoUrl)) {
              finalMessage += `\n\nPreview the concept: ${demoUrl}`;
            }

            return {
              success: true,
              outreach: {
                ...result.data,
                message: finalMessage,
              },
              isAiGenerated: true,
            };
          }
        }
      } catch {
        // Fall through to deterministic fallback
      }
    }

    // 4. Deterministic fallback
    const fallback = generateDeterministicOutreach(input);
    return {
      success: true,
      outreach: fallback,
      isAiGenerated: false,
    };
  }
}
