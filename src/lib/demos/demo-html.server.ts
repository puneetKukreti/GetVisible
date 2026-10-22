import {
  WebsiteDemoRepository,
  LeadRepository,
} from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { DEMO_ORGANIZATION_ID, PILOT_ORGANIZATION_ID } from '@/lib/workspace';
import { WebsiteDemoGeneratorService } from '@/lib/demos/generator';
import {
  getStitchRawHtml,
} from '@/lib/demos/stitch-loader.server';
import {
  personalizeStitchHtml,
  isStitchLayout,
} from '@/lib/demos/stitch-personalizer';
import {
  isCaPracticeProfession,
  contentHasCaLeakageForProfession,
} from '@/lib/demos/profession-sections';
import { getProfessionPreset } from '@/lib/demos/profession-config';
import {
  getProfessionStitchLayout,
  isProfessionStitchLayout,
} from '@/lib/demos/profession-stitch';
import { WebsiteContent } from '@/types';
import { highlightBrandNameInHtml } from './brand-highlight';

export interface DemoSiteHtmlOptions {
  /** Public token, demo id or lead id (used when no demo/lead is pre-resolved). */
  id: string;
  /** Pre-resolved demo saves the lookup (the public page already did it). */
  demo?: any | null;
  /** Request used to resolve organization context during lookups (API route). */
  request?: Request | null;
  /**
   * Owner-only layout override. Callers are responsible for gating this with an
   * owner session and validating it against the known Stitch layouts.
   */
  layoutOverride?: string;
  /**
   * Auto-regenerate stale/archetyped demos in place. Keep on for the API route;
   * the page render reuses it so prospect HTML matches the route exactly.
   */
  allowRegenerate?: boolean;
  /**
   * Screenshot-only: ring the business name in the rendered page so a prospect
   * instantly recognises their own business in a chat thumbnail. Never enabled
   * for the prospect-facing page itself.
   */
  highlightBrand?: boolean;
}

function neutralFallbackContent(): WebsiteContent {
  return {
    brand: { businessName: 'Your Business' },
    location: { city: 'Your City', address: 'Your City, India' },
    contact: { publicPhone: '+91 00000 00000', publicEmail: 'hello@example.com' },
    meta: { profession: 'Business' },
  } as WebsiteContent;
}

/**
 * Resolve a demo (and its lead), personalize the Stitch template and return the
 * standalone site HTML. Shared by the public /api/demos/[id]/html endpoint and
 * the /demo/[leadId] page render — the page builds the same document in-process
 * so the prospect's iframe can paint the site instantly via srcDoc with no
 * loading screen and no self-fetch roundtrip.
 *
 * Throws on infrastructure failures; callers render their own error surfaces.
 */
export async function resolveDemoSiteHtml({
  id,
  demo = null,
  request = null,
  layoutOverride,
  allowRegenerate = true,
  highlightBrand = false,
}: DemoSiteHtmlOptions): Promise<string> {
  let lead: any = null;

  // 1. Without a pre-resolved demo: public token first, then org/lead lookups.
  if (!demo) {
    demo = await WebsiteDemoRepository.getApprovedDemoByPublicToken(id);
  }

  if (!demo) {
    const orgId = (await getResolvedOrganizationId(request)) || DEMO_ORGANIZATION_ID;
    const altOrgId = orgId === DEMO_ORGANIZATION_ID ? PILOT_ORGANIZATION_ID : DEMO_ORGANIZATION_ID;

    // Check if id is a demo ID
    demo = await WebsiteDemoRepository.getDemo(orgId, id);
    if (!demo) {
      demo = await WebsiteDemoRepository.getDemo(altOrgId, id);
    }

    // Check if id is a lead ID
    if (!demo) {
      lead = await LeadRepository.getLeadById(id, orgId);
      if (!lead) {
        lead = await LeadRepository.getLeadById(id, altOrgId);
      }

      if (lead) {
        const demos = await WebsiteDemoRepository.listDemos(lead.organizationId || orgId, lead.id);
        demo = demos[0] || null;
      }
    } else {
      lead = await LeadRepository.getLeadById(demo.leadId, demo.organizationId || orgId);
      if (!lead) {
        lead = await LeadRepository.getLeadById(demo.leadId, altOrgId);
      }
    }
  } else if (demo?.leadId) {
    lead = await LeadRepository.getLeadById(demo.leadId, demo.organizationId || DEMO_ORGANIZATION_ID);
    if (!lead) {
      lead = await LeadRepository.getLeadById(demo.leadId, PILOT_ORGANIZATION_ID);
    }
  }

  // 2. Auto-regenerate if a non-CA lead has stale CA content or a missing demo
  const effectiveOrgId = lead?.organizationId || demo?.organizationId || DEMO_ORGANIZATION_ID;
  const isCaPractice = isCaPracticeProfession(lead?.profession, lead?.businessName);

  if (allowRegenerate && lead && !isCaPractice) {
    const hasStaleCaContent =
      !demo ||
      contentHasCaLeakageForProfession(demo.content, lead.profession, lead.businessName);

    // A demo created before profession Stitch templates existed still points at
    // its legacy archetype layout. Regenerate it so the rendered document uses
    // the profession-specific Stitch template instead of the older React theme.
    const expectedStitchLayout = lead.profession
      ? getProfessionStitchLayout(getProfessionPreset(lead.profession, lead.businessName).category)
      : undefined;
    const hasStaleLayout =
      Boolean(expectedStitchLayout) &&
      Boolean(demo) &&
      !isProfessionStitchLayout(demo!.design?.layout);

    if (hasStaleCaContent || hasStaleLayout) {
      try {
        const freshDemo = await WebsiteDemoGeneratorService.generateDemo(lead, {
          useAiEnrichment: true,
          organizationId: effectiveOrgId,
        });
        demo = await WebsiteDemoRepository.saveDemo(effectiveOrgId, freshDemo, 'system');
      } catch (genErr) {
        console.warn('Auto-regeneration of non-CA demo failed:', genErr);
      }
    }
  }

  // 3. Prepare content for personalization
  let content: WebsiteContent | any = null;
  if (demo?.content) {
    content = typeof demo.content === 'string' ? JSON.parse(demo.content) : demo.content;
  } else if (lead) {
    content = {
      brand: { businessName: lead.businessName },
      location: { city: lead.city, address: lead.address },
      contact: { publicPhone: lead.publicPhone, publicEmail: lead.publicEmail },
      meta: { profession: lead.profession },
    };
  } else {
    // Neutral fallback preview (only when neither a demo nor a lead resolves)
    content = neutralFallbackContent();
  }

  // 4. Determine layout key and personalize the Stitch document
  const chosenLayout =
    layoutOverride ||
    demo?.design?.layout ||
    content?.design?.layout ||
    demo?.templateId ||
    'design-1-premium';

  const rawHtml = getStitchRawHtml(chosenLayout);
  const personalized = personalizeStitchHtml(rawHtml, content);

  if (!highlightBrand) return personalized;

  const resolvedBrand =
    content?.brand?.businessName || lead?.businessName || demo?.content?.brand?.businessName || '';
  return highlightBrandNameInHtml(personalized, resolvedBrand);
}
