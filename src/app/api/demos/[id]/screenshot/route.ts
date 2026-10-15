import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { WebsiteDemoRepository, LeadRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { DEMO_ORGANIZATION_ID, PILOT_ORGANIZATION_ID } from '@/lib/workspace';
import {
  findSystemBrowser,
  captureLocalHeroScreenshot,
  generateHeroMockupSvg,
} from '@/lib/providers/screenshot.provider';
import { getStitchRawHtml } from '@/lib/demos/stitch-loader.server';
import { personalizeStitchHtml } from '@/lib/demos/stitch-personalizer';
import { selectWebsiteDesign } from '@/lib/demos/personalization';
import { WebsiteContent } from '@/types';

export const dynamic = 'force-dynamic';

interface RouteProps {
  params: { id: string } | Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const searchParams = request.nextUrl.searchParams;
  const isImageFormat = searchParams.get('format') === 'image';
  const forceRefresh = searchParams.get('refresh') === 'true';
  const queryName = searchParams.get('name') || '';
  const queryCity = searchParams.get('city') || '';
  const queryProf = searchParams.get('profession') || '';

  let actualLeadId = 'preview';
  let brandName = queryName || 'Chartered Accountants';
  let city = queryCity || 'Delhi NCR';
  let profession = queryProf || 'Chartered Accountants';

  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id ? decodeURIComponent(resolvedParams.id).trim() : '';

    const orgId = (await getResolvedOrganizationId(request)) || DEMO_ORGANIZATION_ID;
    const altOrgId = orgId === DEMO_ORGANIZATION_ID ? PILOT_ORGANIZATION_ID : DEMO_ORGANIZATION_ID;

    // 1. Find demo (by id, publicToken, or leadId)
    let demo: any = null;
    let lead: any = null;

    if (id) {
      demo = await WebsiteDemoRepository.getDemo(orgId, id);
      if (!demo) demo = await WebsiteDemoRepository.getDemo(altOrgId, id);
      if (!demo) demo = await WebsiteDemoRepository.getApprovedDemoByPublicToken(id);

      let leadId = demo?.leadId;
      if (!demo) {
        lead = await LeadRepository.getLeadById(id, orgId);
        if (!lead) lead = await LeadRepository.getLeadById(id, altOrgId);
        if (lead) {
          leadId = lead.id;
          const demos = await WebsiteDemoRepository.listDemos(lead.organizationId || orgId, lead.id);
          demo = demos[0] || null;
        }
      }

      const effectiveLeadId = leadId || id;
      if (!lead) lead = await LeadRepository.getLeadById(effectiveLeadId, orgId);
      if (!lead) lead = await LeadRepository.getLeadById(effectiveLeadId, altOrgId);

      // Search across candidate orgs if still not found
      if (!demo && !lead) {
        for (const candidateOrg of [DEMO_ORGANIZATION_ID, PILOT_ORGANIZATION_ID]) {
          try {
            if (!lead) lead = await LeadRepository.getLeadById(effectiveLeadId, candidateOrg);
            if (!demo) demo = await WebsiteDemoRepository.getDemo(candidateOrg, id);
          } catch {}
        }
      }
    }

    actualLeadId = lead?.id || demo?.leadId || id || 'preview';

    // Prepare content facts
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
    }

    brandName = queryName || content?.brand?.businessName || lead?.businessName || 'Chartered Accountants';
    city = queryCity || content?.location?.city || lead?.city || 'Delhi NCR';
    profession = queryProf || content?.meta?.profession || lead?.profession || 'Chartered Accountants';

    // Cloud-safe cache directory (always writable in Vercel /tmp)
    const cacheDir = path.join(os.tmpdir(), 'getvisible-screenshots');
    try {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
    } catch {}

    const heroDiskPath = path.join(cacheDir, `${actualLeadId}.png`);
    const heroSvgPath = path.join(cacheDir, `${actualLeadId}.svg`);
    const dynamicImageUrl = `/api/demos/${encodeURIComponent(actualLeadId)}/screenshot?format=image&name=${encodeURIComponent(brandName)}&city=${encodeURIComponent(city)}&profession=${encodeURIComponent(profession)}`;

    // 2. Return cached local hero screenshot if already exists and not refreshing
    if (!forceRefresh) {
      try {
        if (fs.existsSync(heroDiskPath) && fs.statSync(heroDiskPath).size > 1000) {
          if (isImageFormat) {
            const fileBuf = fs.readFileSync(heroDiskPath);
            return new NextResponse(fileBuf, {
              headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
                'Content-Disposition': 'inline; filename="hero_preview.png"',
              },
            });
          }

          return NextResponse.json({
            success: true,
            screenshotUrl: `${dynamicImageUrl}&v=${demo?.version || 1}`,
            cached: true,
            source: 'local_hero',
          });
        }
      } catch {}

      try {
        if (fs.existsSync(heroSvgPath) && fs.statSync(heroSvgPath).size > 200) {
          if (isImageFormat) {
            const svgBuf = fs.readFileSync(heroSvgPath, 'utf-8');
            return new NextResponse(svgBuf, {
              headers: {
                'Content-Type': 'image/svg+xml; charset=utf-8',
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
                'Content-Disposition': 'inline; filename="hero_preview.svg"',
              },
            });
          }

          return NextResponse.json({
            success: true,
            screenshotUrl: `${dynamicImageUrl}&v=${demo?.version || 1}`,
            cached: true,
            source: 'svg_mockup',
          });
        }
      } catch {}
    }

    // 3. If local headless browser is available (Local dev / VPS with Chrome), capture high-fidelity PNG
    const hasLocalBrowser = Boolean(findSystemBrowser());
    if (hasLocalBrowser) {
      const layout =
        demo?.design?.layout ||
        demo?.templateId ||
        (lead ? selectWebsiteDesign(lead, 1).layout : 'design-1-premium');

      let personalizedHtml = '';
      try {
        const rawHtml = getStitchRawHtml(layout);
        personalizedHtml = personalizeStitchHtml(rawHtml, content || {
          brand: { businessName: brandName },
          location: { city },
          meta: { profession },
        });
      } catch (stitchErr) {
        console.warn('Error loading Stitch HTML for screenshot:', stitchErr);
      }

      if (personalizedHtml) {
        let captured = false;
        try {
          captured = await captureLocalHeroScreenshot(personalizedHtml, heroDiskPath, {
            width: 1024,
            height: 640,
          });
        } catch (captureErr) {
          console.warn('Local browser screenshot capture failed:', captureErr);
        }

        if (captured && fs.existsSync(heroDiskPath)) {
          if (demo) {
            demo.screenshotUrl = dynamicImageUrl;
            demo.screenshotTakenAt = new Date().toISOString();
            await WebsiteDemoRepository.updateDemo(
              demo.organizationId || orgId,
              demo.id,
              { ...demo } as any,
              'system'
            ).catch(() => {});
          }

          if (isImageFormat) {
            const fileBuf = fs.readFileSync(heroDiskPath);
            return new NextResponse(fileBuf, {
              headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
                'Content-Disposition': 'inline; filename="hero_preview.png"',
              },
            });
          }

          return NextResponse.json({
            success: true,
            screenshotUrl: `${dynamicImageUrl}&t=${Date.now()}`,
            cached: false,
            source: 'local_browser',
          });
        }
      }
    }

    // 4. Zero-fail instant SVG Hero Mockup (Works 100% on Vercel Serverless / Cloud without Chrome)
    const svgContent = generateHeroMockupSvg(brandName, city, profession);
    try {
      fs.writeFileSync(heroSvgPath, svgContent, 'utf-8');
    } catch {}

    if (isImageFormat) {
      return new NextResponse(svgContent, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
          'Content-Disposition': 'inline; filename="hero_preview.svg"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      screenshotUrl: `${dynamicImageUrl}&t=${Date.now()}`,
      cached: false,
      source: 'svg_mockup',
    });
  } catch (error: unknown) {
    console.error('Hero screenshot capture error, delivering instant SVG fallback:', error);
    const svgFallback = generateHeroMockupSvg(brandName, city, profession);

    if (isImageFormat) {
      return new NextResponse(svgFallback, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
          'Content-Disposition': 'inline; filename="hero_preview.svg"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      screenshotUrl: `/api/demos/${encodeURIComponent(actualLeadId)}/screenshot?format=image&name=${encodeURIComponent(brandName)}&city=${encodeURIComponent(city)}`,
      cached: false,
      source: 'svg_mockup',
    });
  }
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  return GET(request, { params });
}
