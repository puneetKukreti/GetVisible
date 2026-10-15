/**
 * Gemini AI Website Content Generator (gemini-2.5-flash)
 *
 * Dynamically synthesizes 100% authentic, profession-specific website copy
 * (Headlines, 4 Services, 4 Why-Choose-Us trust points, 4 Process steps, 3 FAQs)
 * tailored to ANY Indian business name, profession, and city.
 */

export interface AiBusinessContent {
  heroBadge: string;
  heroHeadline: string;
  heroSubheadline: string;
  primaryCtaLabel: string;
  aboutLead: string;
  aboutBody: string;
  highlights: { title: string; description: string }[];
  servicesSectionTitle: string;
  servicesSectionSubtitle: string;
  services: { title: string; description: string }[];
  whyChooseUs: { title: string; description: string }[];
  processSteps: { number: string; title: string; description: string }[];
  faqs: { question: string; answer: string }[];
}

export interface GenerateAiContentFacts {
  businessName: string;
  profession: string;
  city: string;
  address?: string | null;
}

/**
 * Calls Gemini 2.5 Flash via REST API with a structured JSON schema prompt.
 * Gracefully returns null if no API key is configured or upon network/timeout error,
 * allowing the caller to seamlessly fall back to deterministic baseline content.
 */
export async function generateAiBusinessContent(
  facts: GenerateAiContentFacts
): Promise<AiBusinessContent | null> {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }

  const businessName = facts.businessName?.trim() || 'Local Enterprise';
  const profession = facts.profession?.trim() || 'Professional Practice';
  const city = facts.city?.trim() || 'Delhi NCR';
  const address = facts.address?.trim() || `${city}, India`;

  const isLegalOrCa = /chartered accountant|ca firm|lawyer|advocate|legal practice|solicitor/i.test(
    `${profession} ${businessName}`
  );

  const prompt = `You are an elite Indian B2B & SMB conversion copywriter for local businesses.
Generate authentic, high-converting, realistic website content for:
- Business / Practice Name: "${businessName}"
- Profession / Industry: "${profession}"
- City / Region: "${city}", India
- Address: "${address}"

${
  isLegalOrCa
    ? 'COMPLIANCE MANDATE: This profession is governed by strict regulatory ethical rules in India (ICAI / Bar Council of India). Strictly follow an informational pull-model. Do NOT use superlatives (e.g. "Best", "Top", "No. 1") and do NOT claim fee discounts.'
    : 'CONVERSION MANDATE: Create compelling, customer-centric, professional copy that inspires local trust, highlights craftsmanship or expertise, and drives direct inquiries via call or appointment.'
}

Return ONLY a valid JSON object matching this exact schema:
{
  "heroBadge": "Short 3-5 word category badge (e.g. 'Modern Dental & Implant Center', 'Trusted Chartered Accountants', 'Boutique Modular Kitchen Studio')",
  "heroHeadline": "Compelling 6-10 word headline tailored to their exact profession and local standing",
  "heroSubheadline": "1-sentence value proposition mentioning their core offerings, client commitment, and ${city}",
  "primaryCtaLabel": "Action-oriented CTA button text (e.g. 'Schedule Consultation', 'Book Appointment', 'Get Free Quote', 'Request Estimate')",
  "aboutLead": "1-sentence overview of ${businessName} in ${city}",
  "aboutBody": "2-sentence description of their quality standards, customer focus, and local reputation",
  "highlights": [
    { "title": "Highlight 1 (2-4 words)", "description": "1 short sentence" },
    { "title": "Highlight 2 (2-4 words)", "description": "1 short sentence" },
    { "title": "Highlight 3 (2-4 words)", "description": "1 short sentence" },
    { "title": "Highlight 4 (2-4 words)", "description": "1 short sentence" }
  ],
  "servicesSectionTitle": "Category section title (e.g. 'Our Core Services', 'Specialized Treatments & Care', 'Design & Execution Services')",
  "servicesSectionSubtitle": "1-sentence subtitle describing their service offerings",
  "services": [
    { "title": "Specific Service 1 for this profession", "description": "Clear 1-2 sentence explanation of this service" },
    { "title": "Specific Service 2 for this profession", "description": "Clear 1-2 sentence explanation of this service" },
    { "title": "Specific Service 3 for this profession", "description": "Clear 1-2 sentence explanation of this service" },
    { "title": "Specific Service 4 for this profession", "description": "Clear 1-2 sentence explanation of this service" }
  ],
  "whyChooseUs": [
    { "title": "Trust Factor 1 (2-4 words)", "description": "1 clear sentence explaining this trust factor" },
    { "title": "Trust Factor 2 (2-4 words)", "description": "1 clear sentence explaining this trust factor" },
    { "title": "Trust Factor 3 (2-4 words)", "description": "1 clear sentence explaining this trust factor" },
    { "title": "Trust Factor 4 (2-4 words)", "description": "1 clear sentence explaining this trust factor" }
  ],
  "processSteps": [
    { "number": "01", "title": "Step 1 Title", "description": "1 sentence describing initial inquiry or assessment" },
    { "number": "02", "title": "Step 2 Title", "description": "1 sentence describing analysis, planning, or diagnosis" },
    { "number": "03", "title": "Step 3 Title", "description": "1 sentence describing execution, treatment, or delivery" },
    { "number": "04", "title": "Step 4 Title", "description": "1 sentence describing ongoing support, review, or warranty" }
  ],
  "faqs": [
    { "question": "Realistic question clients ask for this profession?", "answer": "Helpful 1-2 sentence answer" },
    { "question": "Second common client question?", "answer": "Helpful 1-2 sentence answer" },
    { "question": "Third common client question regarding location or process?", "answer": "Helpful 1-2 sentence answer" }
  ]
}`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(`Gemini API error (${res.status}): ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate essential properties
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.heroHeadline ||
      !Array.isArray(parsed.services) ||
      parsed.services.length === 0
    ) {
      return null;
    }

    // Sanitize lengths to fit UI schemas cleanly
    const sanitized: AiBusinessContent = {
      heroBadge: String(parsed.heroBadge || `${profession} • ${city}`).slice(0, 60),
      heroHeadline: String(parsed.heroHeadline || `${profession} Services in ${city}`).slice(0, 140),
      heroSubheadline: String(
        parsed.heroSubheadline || `Dedicated professional solutions for clients in ${city} and surrounding areas.`
      ).slice(0, 320),
      primaryCtaLabel: String(parsed.primaryCtaLabel || 'Schedule Consultation').slice(0, 40),
      aboutLead: String(
        parsed.aboutLead || `${businessName} is a leading ${profession.toLowerCase()} practice based in ${city}.`
      ).slice(0, 380),
      aboutBody: String(
        parsed.aboutBody ||
          `We deliver reliable, standards-driven solutions tailored to our clients' unique requirements. Our team brings deep practical experience and local dedication to every engagement.`
      ).slice(0, 1100),
      highlights: Array.isArray(parsed.highlights)
        ? parsed.highlights.slice(0, 4).map((h: any, i: number) => ({
            title: String(h?.title || `Excellence Standard ${i + 1}`).slice(0, 75),
            description: String(h?.description || `High-caliber dedication and proven track record in ${city}.`).slice(
              0,
              280
            ),
          }))
        : [],
      servicesSectionTitle: String(parsed.servicesSectionTitle || 'Our Core Services').slice(0, 75),
      servicesSectionSubtitle: String(
        parsed.servicesSectionSubtitle || `Comprehensive ${profession.toLowerCase()} solutions tailored to your needs.`
      ).slice(0, 190),
      services: (parsed.services || []).slice(0, 4).map((s: any, i: number) => ({
        title: String(s?.title || `Specialized Service ${i + 1}`).slice(0, 95),
        description: String(
          s?.description || `Professional execution and dedicated advisory in ${city}.`
        ).slice(0, 380),
      })),
      whyChooseUs: Array.isArray(parsed.whyChooseUs)
        ? parsed.whyChooseUs.slice(0, 4).map((w: any, i: number) => ({
            title: String(w?.title || `Trusted Partner ${i + 1}`).slice(0, 75),
            description: String(
              w?.description || `Transparent communication, verified standards, and focused attention.`
            ).slice(0, 320),
          }))
        : [],
      processSteps: Array.isArray(parsed.processSteps)
        ? parsed.processSteps.slice(0, 4).map((p: any, i: number) => ({
            number: String(p?.number || `0${i + 1}`).slice(0, 5),
            title: String(p?.title || `Step ${i + 1}`).slice(0, 75),
            description: String(p?.description || `Clear guidance and transparent process execution.`).slice(0, 280),
          }))
        : [],
      faqs: Array.isArray(parsed.faqs)
        ? parsed.faqs.slice(0, 3).map((f: any, i: number) => ({
            question: String(f?.question || `How do I engage your services in ${city}?`).slice(0, 140),
            answer: String(
              f?.answer || `You can get in touch directly via phone or our online consultation request form.`
            ).slice(0, 550),
          }))
        : [],
    };

    return sanitized;
  } catch (err) {
    console.warn('generateAiBusinessContent failed or timed out:', err);
    return null;
  }
}
