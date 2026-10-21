import { z } from 'zod';
import { LeadData, WebsiteDemoData, OutreachMessage, OutreachInput } from '@/types';
import { canPrepareOutreach } from './lifecycle';
import { GeminiAIProvider } from '@/lib/providers/ai.provider';
import { getAppBaseUrl, getPublicDemoUrl, generatePublicDemoToken } from '@/lib/demos/public';

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
 * Returns structured business improvement value propositions and low-friction response hook
 * tailored specifically to the profession and website status.
 */
export function getBusinessImprovementDetails(
  profession: string,
  businessName: string,
  city: string,
  hasWebsite: boolean
): {
  bullets: string[];
  summary: string;
  hookQuestion: string;
} {
  const normProf = (profession || '').toLowerCase();
  const loc = city || 'your city';

  if (normProf.includes('accountant') || normProf === 'ca') {
    if (!hasWebsite) {
      return {
        bullets: [
          'Immediate Statutory Credibility: High-net-worth business clients and corporate directors conduct online due diligence before retaining an auditor or tax consultant; a verified portal solidifies institutional authority.',
          '24/7 Client Consultation Capture: A dedicated portal with inquiry forms and consultation scheduling captures leads around the clock, without relying on third-party directories where competitor ads appear.',
          `Google Search & Maps Authority: Positions your firm prominently in ${loc} when local businesses search for Chartered Accountants, corporate tax, or GST advisory.`
        ],
        summary: `Having an official digital presence for ${businessName} builds immediate trust with corporate clients, captures high-fee consultation inquiries 24/7, and prevents losing prospective clients to competitors ranking on Google in ${loc}.`,
        hookQuestion: `Would you be open to a 1-minute live preview on your phone, or are you not currently taking on new advisory clients in ${loc}?`,
      };
    } else {
      return {
        bullets: [
          'Lightning-Fast Mobile Architecture: Over 70% of clients look up practices on smartphones; an updated concept loads in under 1 second with clear advisory pathways.',
          'Integrated Client Onboarding: Modern statutory consultation scheduler and direct WhatsApp inquiry integration.',
          'Elevated Corporate Aesthetic: A polished design hierarchy that matches the caliber of your advisory services.'
        ],
        summary: `Modernizing ${businessName}'s digital presence gives corporate clients a friction-free mobile experience and captures direct consultation inquiries.`,
        hookQuestion: `Would you like me to send a 2-minute walkthrough of this concept, or are you satisfied with your current website performance?`,
      };
    }
  }

  if (
    normProf.includes('lawyer') ||
    normProf.includes('advocate') ||
    normProf.includes('legal') ||
    normProf.includes('law firm')
  ) {
    if (!hasWebsite) {
      return {
        bullets: [
          'Direct Institutional Trust: Corporate clients and individuals looking for dispute resolution or compliance verify credentials and court admissions online before calling.',
          'Confidential Inquiry Channel: Provides a secure, dedicated intake form for clients seeking legal counsel.',
          'Core Practice Highlighting: Clearly delineates corporate advisory, litigation, arbitration, and statutory compliance.'
        ],
        summary: `A dedicated digital presence for ${businessName} builds instant legal credibility and captures confidential client inquiries in ${loc}.`,
        hookQuestion: `Would you be open to reviewing the live concept on your phone, or are you not currently taking on new legal matters?`,
      };
    } else {
      return {
        bullets: [
          'Mobile Optimization: Fast-loading practice overview for clients searching in court corridors or office desks.',
          'Confidential Intake Integration: Streamlined contact channels that respect client privacy.',
          'Modern Firm Prestige: Contemporary typography and clear practice area presentation.'
        ],
        summary: `Upgrading ${businessName}'s digital presence ensures prospective clients can review your practice areas and reach out seamlessly on mobile.`,
        hookQuestion: `Would you like to review this upgraded layout together, or are you happy with your current web presence?`,
      };
    }
  }

  if (normProf.includes('dentist') || normProf.includes('doctor') || normProf.includes('clinic')) {
    if (!hasWebsite) {
      return {
        bullets: [
          'Direct Patient Bookings: Over 78% of local patients search Google Maps and search engines before booking; an official site allows patients to book directly without third-party commission cuts.',
          'Treatment & Doctor Transparency: Highlights doctor qualifications, specialized treatments, and clinical hygiene standards.',
          `Neighborhood Healthcare Authority: Ranks your clinic prominently in ${loc} for local dental and healthcare searches.`
        ],
        summary: `An official website for ${businessName} allows patients in ${loc} to discover treatments, check credentials, and book appointments directly with your clinic.`,
        hookQuestion: `Would you like to test the 1-minute live demo on your phone, or is increasing direct clinic appointments not a priority right now?`,
      };
    } else {
      return {
        bullets: [
          'Instant 1-Tap Booking: Patients can book consultations or chat via WhatsApp in under 10 seconds on their phone.',
          'High-Speed Treatment Showcase: Clear explanations of treatments, smile makeovers, and patient FAQs.',
          'Modern Clinic Branding: Fresh, welcoming design that alleviates patient anxiety and builds confidence.'
        ],
        summary: `Modernizing your clinic's web presence makes appointment booking effortless for mobile patients in ${loc}.`,
        hookQuestion: `Would you like me to send over the live preview link, or are you satisfied with your current patient booking flow?`,
      };
    }
  }

  if (normProf.includes('architect') || normProf.includes('interior')) {
    if (!hasWebsite) {
      return {
        bullets: [
          'High-Ticket Visual Portfolio: Prospective residential and commercial clients require visual proof of completed spaces before requesting a design proposal.',
          'Consultation Engine: Converts casual social or search traffic into booked design discovery meetings.',
          `Brand Prestige: Positions your design studio as a premier firm in ${loc}.`
        ],
        summary: `An official portfolio website for ${businessName} showcases your design projects and converts high-ticket residential and commercial inquiries in ${loc}.`,
        hookQuestion: `Would you be open to a 1-minute live preview on your phone, or are you not looking to take on new design projects right now?`,
      };
    } else {
      return {
        bullets: [
          'High-Resolution Mobile Gallery: Flawlessly displays project photography and renders on mobile screens.',
          'Project Discovery Questionnaire: Captures project scope, budget, and location upfront.',
          'Contemporary Studio Aesthetic: Minimalist layout that highlights your design aesthetic.'
        ],
        summary: `A modern portfolio overhaul for ${businessName} turns visual visitors into qualified project leads.`,
        hookQuestion: `Would you like to take a look at the interactive concept on your phone?`,
      };
    }
  }

  // Universal Fallback for any business / custom category
  if (!hasWebsite) {
    return {
      bullets: [
        'First-Impression Credibility: Modern clients search online to verify legitimate businesses before calling; a verified website immediately establishes authority.',
        '24/7 Inbound Inquiry Capture: A dedicated portal captures customer inquiries and quote requests around the clock, without paying aggregator listing fees.',
        `Local Google Dominance: Positions your business directly in front of customers searching in ${loc}.`
      ],
      summary: `An official website for ${businessName} establishes immediate trust, captures customer inquiries 24/7, and ensures prospective clients in ${loc} find your direct contact details instead of competitors.`,
      hookQuestion: `Would you like to preview the 1-minute live concept on your phone, or are you not looking to expand new customer inquiries right now?`,
    };
  } else {
    return {
      bullets: [
        'Mobile Conversion Layout: Loads in under 1 second with clean service navigation and one-tap contact.',
        'Integrated Lead Capture: Direct inquiry forms and WhatsApp chat to convert visitors into inquiries.',
        'Refined Professional Design: Modern styling that differentiates your brand from local competitors.'
      ],
      summary: `An upgraded digital presence for ${businessName} improves mobile conversion and makes it effortless for clients in ${loc} to contact you.`,
      hookQuestion: `Would you like me to send you the live concept link to test on your phone?`,
    };
  }
}

/**
 * High-quality deterministic message when AI is unavailable or produces invalid copy.
 * Professional, concise, respectful, and communicating genuine value without false claims.
 */
export function generateDeterministicOutreach(input: OutreachInput): OutreachMessage {
  const professionLabel = input.profession || 'practice';
  const citySuffix = input.city ? ` in ${input.city}` : '';
  const contactSalutation = input.contactName ? `Dear ${input.contactName}` : `Hello ${input.businessName} Team`;
  const hasWebsite = input.websiteStatus === 'WEBSITE_EXISTS' || (Boolean(input.website) && input.websiteStatus !== 'NO_WEBSITE');

  const { bullets, summary, hookQuestion } = getBusinessImprovementDetails(
    input.profession,
    input.businessName,
    input.city,
    hasWebsite
  );

  const subject = hasWebsite
    ? `Modernized Website Concept Prepared for ${input.businessName}`
    : `Official Website Concept & Client Intake for ${input.businessName}`;

  let message = `${contactSalutation},

I came across ${input.businessName}${citySuffix} while researching established ${professionLabel} practices.

${
  hasWebsite
    ? `While reviewing your online presence, we noticed opportunities to modernize your digital intake, mobile experience, and client inquiry flow.`
    : `Recognizing that your firm currently does not maintain an active official website, our team put together a functional, personalized digital concept tailored specifically for your practice areas.`
}

How this improves your business:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

We already prepared a complete, mobile-responsive live concept preview:
${input.demoUrl}

${hookQuestion}

Best regards,
GetVisible Digital Team`;

  // WhatsApp optimized message:
  // - Formatted with WhatsApp bolding (*text*)
  // - Clean demo link (NO raw screenshot URL links!)
  // - Benefit checklist + soft, low-friction call to action
  const cleanPhone = (input.publicPhone || '').replace(/[^0-9]/g, '');
  const waRecipient = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const businessSlug = generatePublicDemoToken(input.businessName);
  const baseOrigin = getAppBaseUrl();
  const demoUrl =
    input.demoUrl && !input.demoUrl.includes('localhost')
      ? input.demoUrl
      : `${baseOrigin}/demo/${businessSlug}`;

  const whatsappMessage = `👋 *Want to Attract More Clients to Your Business?*

Did you know that having a professional website can help potential clients find you online and build trust in your services?

🌐 *Get Your Own FREE Website!* 🎉

✅ Showcase your services professionally
✅ Make it easier for potential clients to contact you
✅ Build trust and stand out from competitors
✅ Help more people discover your business online

👀 *See what your website could look like!*
🖼️ *(preview image attached above 👆)*

👉 *View Your Website Demo:*
${demoUrl}

🎁 Get started with your free website today!

📩 Interested? Click the link above to explore your demo and learn more.

— Puneet | GetVisible`;

  // Touch 2: Follow-up Link Reply (Sent after prospect replies "PREVIEW" or "YES")
  const whatsappFollowUpWithLink = `Thanks for replying! 🙌 Here is the official live preview link we prepared for *${input.businessName}*:

👉 ${demoUrl}

You can scroll through it right on your phone. Let me know if you'd like any color or text changes — we can make this live on your own domain within 48 hours!`;

  const encodedWaText = encodeURIComponent(whatsappMessage);
  const whatsappShareUrl = waRecipient
    ? `https://api.whatsapp.com/send?phone=${waRecipient}&text=${encodedWaText}`
    : `https://api.whatsapp.com/send?text=${encodedWaText}`;

  const encodedFollowUpText = encodeURIComponent(whatsappFollowUpWithLink);
  const whatsappFollowUpShareUrl = waRecipient
    ? `https://api.whatsapp.com/send?phone=${waRecipient}&text=${encodedFollowUpText}`
    : `https://api.whatsapp.com/send?text=${encodedFollowUpText}`;

  const personalizationReason = `Referenced ${input.businessName}, ${professionLabel} specialization, ${input.city} location, website status (${hasWebsite ? 'has website' : 'no website'}), and direct demo link.`;

  return {
    subject,
    message,
    personalizationReason,
    screenshotUrl: input.screenshotUrl,
    whatsappMessage,
    whatsappShareUrl,
    whatsappFollowUpWithLink,
    whatsappFollowUpShareUrl,
    businessImprovementPitch: summary,
    interestDetectionHook: hookQuestion,
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
    options?: { baseUrl?: string; usePublicToken?: boolean; channel?: string; intent?: string }
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

    // 2. Strict Demo URL Construction (Prefer readable business slug or publicToken if requested)
    const base = options?.baseUrl ? options.baseUrl.replace(/\/+$/, '') : getAppBaseUrl();
    const token = activeDemo?.publicToken || generatePublicDemoToken(lead.businessName);
    const demoUrl =
      options?.usePublicToken
        ? `${base}/demo/${token}`
        : `${base}/demo/${lead.id}`;

    let screenshotUrl = activeDemo?.screenshotUrl || null;
    const isPlaceholderShot =
      !screenshotUrl ||
      /\/demo-templates\//.test(screenshotUrl) ||
      (screenshotUrl.includes('api.microlink.io') &&
        (screenshotUrl.includes('localhost') || screenshotUrl.includes('127.0.0.1')));
    if (isPlaceholderShot && activeDemo) {
      // Bundled template art shows someone else's business; the prospect must
      // see their own site. Point at the live screenshot route instead — on a
      // cloud host it returns a genuine capture of this very demo page, and its
      // designed card only if the capture itself fails. The wide variant suits
      // the email attachment; the WhatsApp Blitz client requests its own
      // portrait variant directly.
      screenshotUrl = `${base}/api/demos/${encodeURIComponent(
        activeDemo.id || lead.id
      )}/screenshot?format=image&name=${encodeURIComponent(
        lead.businessName || ''
      )}&city=${encodeURIComponent(lead.city || 'Delhi NCR')}&profession=${encodeURIComponent(
        lead.profession || 'Local Business'
      )}`;
    }

    const fallback = generateDeterministicOutreach({
      businessName: lead.businessName,
      profession: lead.profession,
      city: lead.city,
      contactName: lead.contacts?.[0]?.name,
      publicEmail: lead.publicEmail,
      publicPhone: lead.publicPhone,
      demoUrl,
      screenshotUrl,
      templateName: activeDemo?.design?.layout || activeDemo?.templateId,
      themeName: activeDemo?.theme?.name || activeDemo?.theme?.id,
      opportunityReason: lead.opportunityReason,
      websiteStatus: lead.websiteStatus,
      website: lead.website,
    });

    const input: OutreachInput = {
      businessName: lead.businessName,
      profession: lead.profession,
      city: lead.city,
      contactName: lead.contacts?.[0]?.name,
      publicEmail: lead.publicEmail,
      publicPhone: lead.publicPhone,
      demoUrl,
      screenshotUrl,
      templateName: activeDemo?.design?.layout || activeDemo?.templateId,
      themeName: activeDemo?.theme?.name || activeDemo?.theme?.id,
      opportunityReason: lead.opportunityReason,
      websiteStatus: lead.websiteStatus,
      website: lead.website,
    };

    // 3. Try AI generation if configured
    if (this.aiProvider.isConfigured()) {
      try {
        const result = await this.aiProvider.generatePersonalizedOutreach(input);
        if (result.success && result.data) {
          // Verify claim safety
          const claimCheck = validateOutreachClaims(result.data.message);
          if (claimCheck.valid) {
            // Guarantee demo URL is embedded in email
            let finalMessage = result.data.message;
            if (!finalMessage.includes(demoUrl)) {
              finalMessage += `\n\nPreview the concept: ${demoUrl}`;
            }

            return {
              success: true,
              outreach: {
                ...result.data,
                message: finalMessage,
                screenshotUrl,
                whatsappMessage: result.data.whatsappMessage || fallback.whatsappMessage,
                whatsappShareUrl: fallback.whatsappShareUrl,
                whatsappFollowUpWithLink: fallback.whatsappFollowUpWithLink,
                whatsappFollowUpShareUrl: fallback.whatsappFollowUpShareUrl,
                businessImprovementPitch: fallback.businessImprovementPitch,
                interestDetectionHook: fallback.interestDetectionHook,
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
    return {
      success: true,
      outreach: fallback,
      isAiGenerated: false,
    };
  }
}
