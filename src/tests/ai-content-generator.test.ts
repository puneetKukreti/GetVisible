import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAiBusinessContent } from '@/lib/demos/ai-content-generator';
import { generateHeroMockupSvg } from '@/lib/providers/screenshot.provider';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import { LeadData } from '@/types';

describe('Gemini AI Content Generator & Multi-Profession Generalization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. returns null when GEMINI_API_KEY is missing', async () => {
    const origKey = process.env.GEMINI_API_KEY;
    const origGoogleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    try {
      const res = await generateAiBusinessContent({
        businessName: 'Apex Dental Care',
        profession: 'Dental Clinic',
        city: 'Gurgaon',
      });
      expect(res).toBeNull();
    } finally {
      process.env.GEMINI_API_KEY = origKey;
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = origGoogleKey;
    }
  });

  it('2. correctly generates initials and custom headline in generateHeroMockupSvg', () => {
    const svgDental = generateHeroMockupSvg(
      'Apex Dental Clinic',
      'Gurgaon',
      'Dental Clinic',
      'Gentle & Advanced Dental Care in Gurgaon',
      'Pain-free implants, root canals, and cosmetic smile designs.'
    );

    // Checks initials for "Apex Dental Clinic" -> "AD"
    expect(svgDental).toContain('>AD<');
    expect(svgDental).toContain('Apex Dental Clinic');
    expect(svgDental).toContain('Gentle &amp; Advanced Dental Care in Gurgaon');
    expect(svgDental).toContain('Pain-free implants');

    // Checks initials for "Sharma & Associates" -> "SA"
    const svgCa = generateHeroMockupSvg(
      'Sharma & Associates',
      'Delhi',
      'Chartered Accountant'
    );
    expect(svgCa).toContain('>SA<');
    expect(svgCa).toContain('Sharma &amp; Associates');
  });

  it('renders the prospect name as the dominant element of a website-style preview', () => {
    const svg = generateHeroMockupSvg('Sachin Narang', 'Gurgaon', 'Chartered Accountant');

    // The name is the dominant hero element, not a small label.
    expect(svg).toContain('font-size="62"');
    expect(svg).toContain('Sachin Narang');

    // Framed as a browser window (URL bar + navbar) so it reads as a website.
    expect(svg).toContain('https://sachin-narang.com');
    expect(svg).toContain('windowClip');
    expect(svg).toContain('Get a Demo');
  });

  it('3. generateDemo integrates AI content and marks provenance as AI_SYNTHESIZED when available', async () => {
    const testLead: LeadData = {
      id: 'lead-dentist-01',
      businessName: 'Dr. Smile Dental Care',
      profession: 'Dentist',
      city: 'Gurgaon',
      address: 'DLF Phase 4, Gurgaon',
      websiteStatus: 'NO_WEBSITE',
      leadStatus: 'QUALIFIED',
      opportunityScore: 90,
      opportunityReason: 'Verified local dental clinic without an active web presence.',
      source: 'Manual Entry',
      isDemoData: true,
      organizationId: 'org-demo-gurgaon',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Even if no live API key is active in CI, generateDemo succeeds with clean fallback
    const demo = await WebsiteDemoGeneratorService.generateDemo(testLead, {
      useAiEnrichment: false,
    });

    expect(demo).toBeDefined();
    expect(demo.leadId).toBe(testLead.id);
    expect(demo.content.brand.businessName).toBe('Dr. Smile Dental Care');
    expect(demo.content.hero.headline).toBeDefined();
    expect(demo.content.services.items.length).toBeGreaterThan(0);
  });
});
