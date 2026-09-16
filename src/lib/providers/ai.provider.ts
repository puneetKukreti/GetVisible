import { ProviderExecutionResult, ProviderStatus } from './provider-result';

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
}
