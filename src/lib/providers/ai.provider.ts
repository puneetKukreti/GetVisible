import { ProviderExecutionResult, ProviderStatus } from './provider-result';
import { z } from 'zod';
import { OutreachInput, OutreachMessage } from '@/types';

export const AIPersonalizationResultSchema = z.object({
  heroHeadline: z.string().min(5).max(150),
  heroSubheadline: z.string().min(10).max(350),
  tagline: z.string().min(3).max(200),
  aboutLead: z.string().min(10).max(400),
  aboutBody: z.string().min(20).max(1200),
  ctaText: z.string().min(2).max(40),
});

export type AIPersonalizationResult = z.infer<typeof AIPersonalizationResultSchema>;

export interface AIPersonalizationInput {
  businessName: string;
  profession: string;
  city: string;
  address?: string;
  layout?: string;
}

export interface AIOpportunityAnalysisInput {
  businessName: string;
  profession: string;
  city: string;
  websiteUrl?: string | null;
  websiteStatus: string;
  scrapedNotes?: string | null;
}

export interface AIOpportunityAnalysisResult {
  score: number;
  reason: string;
  suggestedPitches: string[];
}

export interface IAIProvider {
  name: string;
  isConfigured(): boolean;
  getStatus(): ProviderStatus;
  analyzeOpportunity(input: AIOpportunityAnalysisInput): Promise<ProviderExecutionResult<AIOpportunityAnalysisResult>>;
  generatePersonalizedPitch(input: {
    businessName: string;
    contactName?: string;
    opportunityReason: string;
  }): Promise<ProviderExecutionResult<string>>;
  generatePersonalizedContent(
    input: AIPersonalizationInput
  ): Promise<ProviderExecutionResult<AIPersonalizationResult>>;
  generatePersonalizedOutreach(
    input: OutreachInput
  ): Promise<ProviderExecutionResult<OutreachMessage>>;
}

export class GeminiAIProvider implements IAIProvider {
  name = 'GoogleGeminiProvider';
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  getStatus(): ProviderStatus {
    const configured = this.isConfigured();
    return {
      name: this.name,
      configured,
      isMock: false,
      details: configured
        ? 'Google Gemini API key configured and ready for reasoning tasks.'
        : 'Provider not configured. Set GEMINI_API_KEY in environment variables.',
    };
  }

  async analyzeOpportunity(input: AIOpportunityAnalysisInput): Promise<ProviderExecutionResult<AIOpportunityAnalysisResult>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        isMock: false,
        error: 'Provider not configured: GEMINI_API_KEY is missing. Real AI opportunity reasoning requires an active Gemini key.',
      };
    }

    try {
      // Direct call to Gemini REST API (gemini-1.5-flash) with structured JSON expectation
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const prompt = `You are a senior website agency consultant analyzing an accounting firm lead.
Business: ${input.businessName}
Profession: ${input.profession}
Location: ${input.city}
Website Status: ${input.websiteStatus}
Notes: ${input.scrapedNotes || 'None'}

Evaluate the opportunity for building them a modern website with client portal.
Return a valid JSON object matching:
{
  "score": number (0-100),
  "reason": "concise explanation of why this business needs a new website",
  "suggestedPitches": ["pitch 1", "pitch 2"]
}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          configured: true,
          isMock: false,
          error: `Gemini API error: ${response.statusText} (${response.status})`,
        };
      }

      const raw = await response.json();
      const contentText = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!contentText) {
        return {
          success: false,
          configured: true,
          isMock: false,
          error: 'Empty response received from Gemini API.',
        };
      }

      const parsed: AIOpportunityAnalysisResult = JSON.parse(contentText);
      return {
        success: true,
        configured: true,
        isMock: false,
        data: parsed,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        configured: true,
        isMock: false,
        error: `Gemini execution failed: ${message}`,
      };
    }
  }

  async generatePersonalizedPitch(input: {
    businessName: string;
    contactName?: string;
    opportunityReason: string;
  }): Promise<ProviderExecutionResult<string>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        isMock: false,
        error: 'Provider not configured: GEMINI_API_KEY is missing.',
      };
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const prompt = `Generate a professional, non-spammy, 2-sentence value proposition for ${input.businessName} (contact: ${input.contactName || 'Managing Partner'}).
Reasoning: ${input.opportunityReason}
Emphasize secure client document exchange and compliance-friendly presentation.`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (!response.ok) {
        return {
          success: false,
          configured: true,
          isMock: false,
          error: `Gemini API error: ${response.statusText}`,
        };
      }

      const raw = await response.json();
      const pitch = raw?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      return {
        success: true,
        configured: true,
        isMock: false,
        data: pitch,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        configured: true,
        isMock: false,
        error: `Gemini execution failed: ${message}`,
      };
    }
  }

  async generatePersonalizedContent(
    input: AIPersonalizationInput
  ): Promise<ProviderExecutionResult<AIPersonalizationResult>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        isMock: false,
        error: 'Provider not configured: GEMINI_API_KEY is missing.',
      };
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const prompt = `You are a professional website copywriter creating structured copy for a Chartered Accountancy firm.
Business Name: ${input.businessName}
Profession: ${input.profession}
City: ${input.city}
Address: ${input.address || 'Not specified'}
Layout Theme: ${input.layout || 'MODERN_CORPORATE'}

STRICT CLAIM SAFETY MANDATES:
1. Do NOT invent years of experience (do not claim "20+ years", "3 decades", etc.).
2. Do NOT invent number of clients, audit counts, awards, or rankings.
3. Do NOT invent testimonials or client names.
4. Keep the copy focused on genuine local professional practice in ${input.city}.

Respond ONLY with a JSON object matching this schema:
{
  "heroHeadline": "concise, powerful headline for hero section",
  "heroSubheadline": "clear 2-sentence value proposition mentioning ${input.city}",
  "tagline": "short brand tagline",
  "aboutLead": "engaging introductory paragraph about the firm's focus",
  "aboutBody": "narrative describing adherence to statutory compliance, audit excellence, and client advisory",
  "ctaText": "short action-oriented CTA button text like 'Schedule Consultation' or 'Inquire Now'"
}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          configured: true,
          isMock: false,
          error: `Gemini API error: ${response.statusText} (${response.status})`,
        };
      }

      const raw = await response.json();
      const contentText = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!contentText) {
        return {
          success: false,
          configured: true,
          isMock: false,
          error: 'Empty response received from Gemini API.',
        };
      }

      const parsedJson = JSON.parse(contentText);
      const validated = AIPersonalizationResultSchema.parse(parsedJson);

      return {
        success: true,
        configured: true,
        isMock: false,
        data: validated,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        configured: true,
        isMock: false,
        error: `Gemini personalized content generation failed: ${message}`,
      };
    }
  }

  async generatePersonalizedOutreach(
    input: OutreachInput
  ): Promise<ProviderExecutionResult<OutreachMessage>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        isMock: false,
        error: 'Provider not configured: GEMINI_API_KEY is missing.',
      };
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const prompt = `You are a professional, courteous digital consultant drafting a personalized, non-spammy outreach message to an accounting firm.
Business: ${input.businessName}
Profession: ${input.profession}
City: ${input.city}
Contact: ${input.contactName || 'Managing Partner'}
Demo Website Link: ${input.demoUrl}
Template: ${input.templateName || 'Modern Fintech'}

STRICT CLAIM SAFETY MANDATES:
1. Explain politely that a personalized website concept was prepared specifically for their practice.
2. Do NOT say their website is bad, broken, or outdated.
3. Do NOT make competitor claims (never say competitors are taking their clients).
4. Do NOT make guarantees or promises of revenue or rankings.
5. Do NOT invent fake client testimonials or years in business.
6. Tone must be professional, concise, courteous, and personalized.

Respond ONLY with a JSON object:
{
  "subject": "Clear, professional subject line",
  "message": "Polite outreach message referencing the concept link at ${input.demoUrl}",
  "personalizationReason": "Brief explanation of how the copy was tailored to ${input.businessName}"
}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          configured: true,
          isMock: false,
          error: `Gemini API error: ${response.statusText} (${response.status})`,
        };
      }

      const raw = await response.json();
      const contentText = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!contentText) {
        return {
          success: false,
          configured: true,
          isMock: false,
          error: 'Empty response received from Gemini API.',
        };
      }

      const parsedJson = JSON.parse(contentText);
      return {
        success: true,
        configured: true,
        isMock: false,
        data: parsedJson,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        configured: true,
        isMock: false,
        error: `Gemini outreach generation failed: ${message}`,
      };
    }
  }
}

export class MockAIProvider implements IAIProvider {
  name = '[DEMO MOCK] GeminiAIProvider';

  isConfigured(): boolean {
    return process.env.DEMO_MODE === 'true';
  }

  getStatus(): ProviderStatus {
    return {
      name: this.name,
      configured: this.isConfigured(),
      isMock: true,
      details: 'Mock AI provider returning deterministic test reasoning in DEMO_MODE.',
    };
  }

  async analyzeOpportunity(input: AIOpportunityAnalysisInput): Promise<ProviderExecutionResult<AIOpportunityAnalysisResult>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        isMock: true,
        error: 'Provider not configured: DEMO_MODE is disabled.',
      };
    }

    return {
      success: true,
      configured: true,
      isMock: true,
      data: {
        score: 84,
        reason: `[DEMO MOCK] Evaluated ${input.businessName} in ${input.city}. Identified missing SSL certificate, non-mobile friendly interface, and lack of client portal for tax document exchange.`,
        suggestedPitches: [
          'Modernize CA practice with secure SSL and client document drop box',
          'Mobile-responsive tax calculator to increase corporate inquiries in Gurgaon',
        ],
      },
    };
  }

  async generatePersonalizedPitch(input: {
    businessName: string;
    contactName?: string;
    opportunityReason: string;
  }): Promise<ProviderExecutionResult<string>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        isMock: true,
        error: 'Provider not configured: DEMO_MODE is disabled.',
      };
    }

    return {
      success: true,
      configured: true,
      isMock: true,
      data: `[DEMO MOCK PITCH] Dear ${input.contactName || 'Managing Partner'} at ${input.businessName}, we noticed your online presence could benefit from secure client portals and modern mobile responsiveness.`,
    };
  }

  async generatePersonalizedContent(
    input: AIPersonalizationInput
  ): Promise<ProviderExecutionResult<AIPersonalizationResult>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        isMock: true,
        error: 'Provider not configured: DEMO_MODE is disabled.',
      };
    }

    const city = input.city || 'Gurgaon';
    return {
      success: true,
      configured: true,
      isMock: true,
      data: {
        heroHeadline: `Chartered Financial Governance & Compliance in ${city}`,
        heroSubheadline: `Authoritative statutory audit, corporate taxation, and regulatory accounting advisory tailored for growing enterprises in ${city}.`,
        tagline: `Chartered Accountancy & Strategic Compliance in ${city}`,
        aboutLead: `${input.businessName} is a chartered accountancy practice dedicated to statutory rigor, audit transparency, and corporate governance in ${city}.`,
        aboutBody: `We advise emerging enterprises, corporate entities, and family businesses on navigating complex regulatory compliance and evolving direct/indirect tax frameworks with uncompromising integrity.`,
        ctaText: 'Schedule Consultation',
      },
    };
  }

  async generatePersonalizedOutreach(
    input: OutreachInput
  ): Promise<ProviderExecutionResult<OutreachMessage>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        configured: false,
        isMock: true,
        error: 'Provider not configured: DEMO_MODE is disabled.',
      };
    }

    return {
      success: true,
      configured: true,
      isMock: true,
      data: {
        subject: `Website Concept Prepared for ${input.businessName}`,
        message: `Hello ${input.contactName || 'Managing Partner'},\n\nWe put together a website concept tailored specifically for ${input.businessName} in ${input.city}.\n\nYou can preview it here: ${input.demoUrl}\n\nBest regards,\nGetVisible Team`,
        personalizationReason: `Tailored for ${input.businessName} in ${input.city}`,
      },
    };
  }
}
