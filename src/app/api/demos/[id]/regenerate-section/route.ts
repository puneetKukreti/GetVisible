import { NextRequest, NextResponse } from 'next/server';
import { WebsiteDemoRepository, LeadRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { requireOwnerSession } from '@/lib/owner-guard';
import { DEMO_ORGANIZATION_ID, PILOT_ORGANIZATION_ID } from '@/lib/workspace';
import { WebsiteContentSchema } from '@/lib/demos/schema';
import {
  regenerateSectionContent,
  RegeneratableSectionType,
} from '@/lib/demos/ai-content-generator';

export const dynamic = 'force-dynamic';
// One AI regeneration call per request.
export const maxDuration = 60;

interface RouteProps {
  params: { id: string } | Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const unauthorized = await requireOwnerSession(request);
    if (unauthorized) return unauthorized;

    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id ? decodeURIComponent(resolvedParams.id).trim() : '';

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID parameter required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { sectionType, customPrompt } = body;

    const validSections: RegeneratableSectionType[] = [
      'HERO',
      'ABOUT',
      'SERVICES',
      'WHY_CHOOSE_US',
      'PROCESS',
      'FAQ',
      'GALLERY',
      'MENU',
    ];

    if (!sectionType || !validSections.includes(sectionType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid sectionType. Must be one of: ${validSections.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const orgId = (await getResolvedOrganizationId(request)) || DEMO_ORGANIZATION_ID;
    const altOrgId = orgId === DEMO_ORGANIZATION_ID ? PILOT_ORGANIZATION_ID : DEMO_ORGANIZATION_ID;

    // Find demo by id or leadId
    let demo = await WebsiteDemoRepository.getDemo(orgId, id);
    let demoOrg = orgId;
    if (!demo) {
      demo = await WebsiteDemoRepository.getDemo(altOrgId, id);
      if (demo) demoOrg = altOrgId;
    }
    if (!demo) {
      const demos = await WebsiteDemoRepository.listDemos(orgId, id);
      if (demos && demos.length > 0) {
        demo = demos[0];
        demoOrg = orgId;
      } else {
        const altDemos = await WebsiteDemoRepository.listDemos(altOrgId, id);
        if (altDemos && altDemos.length > 0) {
          demo = altDemos[0];
          demoOrg = altOrgId;
        }
      }
    }

    if (!demo) {
      return NextResponse.json({ success: false, error: 'Demo not found' }, { status: 404 });
    }

    // Retrieve lead information for facts
    let lead = await LeadRepository.getLeadById(demoOrg, demo.leadId);
    if (!lead) {
      lead = await LeadRepository.getLeadById(altOrgId, demo.leadId);
    }

    const facts = {
      businessName: demo.content.brand?.businessName || lead?.businessName || 'Business Practice',
      profession: demo.content.meta?.profession || lead?.profession || 'Professional Practice',
      city: demo.content.location?.city || lead?.city || 'Delhi NCR',
      address: demo.content.location?.address || lead?.address || undefined,
    };

    const newSectionData = await regenerateSectionContent({
      sectionType,
      facts,
      customPrompt,
    });

    if (!newSectionData) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate section content' },
        { status: 500 }
      );
    }

    const updatedContent = { ...demo.content };

    if (sectionType === 'HERO') {
      updatedContent.hero = {
        ...updatedContent.hero,
        ...newSectionData,
        provenance: 'AI_SYNTHESIZED',
      };
      if (newSectionData.headline) {
        updatedContent.brand = {
          ...updatedContent.brand,
          tagline: newSectionData.headline,
        };
      }
    } else if (sectionType === 'ABOUT') {
      updatedContent.about = {
        ...updatedContent.about,
        ...newSectionData,
        provenance: 'AI_SYNTHESIZED',
      };
    } else if (sectionType === 'SERVICES') {
      updatedContent.services = {
        ...updatedContent.services,
        sectionTitle: newSectionData.sectionTitle || updatedContent.services.sectionTitle,
        sectionSubtitle: newSectionData.sectionSubtitle || updatedContent.services.sectionSubtitle,
        items: Array.isArray(newSectionData.items) ? newSectionData.items : updatedContent.services.items,
      };
    } else if (sectionType === 'WHY_CHOOSE_US') {
      updatedContent.whyChooseUs = {
        ...updatedContent.whyChooseUs,
        sectionTitle: newSectionData.sectionTitle || updatedContent.whyChooseUs.sectionTitle,
        sectionSubtitle: newSectionData.sectionSubtitle || updatedContent.whyChooseUs.sectionSubtitle,
        points: Array.isArray(newSectionData.points)
          ? newSectionData.points.map((p: any, i: number) => ({
              ...p,
              iconName: updatedContent.whyChooseUs.points[i]?.iconName || 'ShieldCheck',
            }))
          : updatedContent.whyChooseUs.points,
      };
    } else if (sectionType === 'PROCESS') {
      updatedContent.process = {
        sectionTitle: newSectionData.sectionTitle || 'Our Working Process',
        sectionSubtitle: newSectionData.sectionSubtitle || 'How we collaborate from start to finish',
        steps: Array.isArray(newSectionData.steps)
          ? newSectionData.steps
          : updatedContent.process?.steps || [],
      };
    } else if (sectionType === 'FAQ') {
      updatedContent.faq = {
        sectionTitle: newSectionData.sectionTitle || 'Frequently Asked Questions',
        items: Array.isArray(newSectionData.items) ? newSectionData.items : updatedContent.faq.items,
      };
    }

    // Validate updated content
    const parsed = WebsiteContentSchema.safeParse(updatedContent);
    if (!parsed.success) {
      console.warn('Section update validation issues:', parsed.error.issues);
    }

    const updatedDemo = {
      ...demo,
      content: (parsed.success ? parsed.data : updatedContent) as any,
      updatedAt: new Date().toISOString(),
    };

    await WebsiteDemoRepository.saveDemo(demoOrg, updatedDemo);

    return NextResponse.json({
      success: true,
      sectionType,
      section: newSectionData,
      demo: updatedDemo,
    });
  } catch (error: any) {
    console.error('Section regeneration error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
