import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { WebsiteDemoRepository, LeadRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { DEMO_ORGANIZATION_ID, PILOT_ORGANIZATION_ID } from '@/lib/workspace';
import {
  CloudScreenshotProvider,
  captureLocalHeroScreenshot,
  generateHeroMockupSvg,
} from '@/lib/providers/screenshot.provider';
import { getStitchRawHtml } from '@/lib/demos/stitch-loader.server';
import { personalizeStitchHtml } from '@/lib/demos/stitch-personalizer';
import { selectWebsiteDesign } from '@/lib/demos/personalization';
import { getAppBaseUrl, getPublicDemoUrl } from '@/lib/demos/public';
import { WebsiteContent } from '@/types';

export const dynamic = 'force-dynamic';

interface RouteProps {
  params: { id: string } | Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id ? decodeURIComponent(resolvedParams.id).trim() : '';

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID parameter required' }, { status: 400 });
    }

    const orgId = (await getResolvedOrganizationId(request)) || DEMO_ORGANIZATION_ID;
    const altOrgId = orgId === DEMO_ORGANIZATION_ID ? PILOT_ORGANIZATION_ID : DEMO_ORGANIZATION_ID;

    // 1. Find demo (by id, publicToken, or leadId)
    let demo = await WebsiteDemoRepository.getDemo(orgId, id);
    if (!demo) {
      demo = await WebsiteDemoRepository.getDemo(altOrgId, id);
    }
    if (!demo) {
      demo = await WebsiteDemoRepository.getApprovedDemoByPublicToken(id);
    }

    let leadId = demo?.leadId;
    if (!demo) {
      let lead = await LeadRepository.getLeadById(id, orgId);
      if (!lead) {
        lead = await LeadRepository.getLeadById(id, altOrgId);
      }
      if (lead) {
        leadId = lead.id;
        const demos = await WebsiteDemoRepository.listDemos(lead.organizationId || orgId, lead.id);
        demo = demos[0] || null;
      }
    }

    const effectiveLeadId = leadId || id;
    let lead = await LeadRepository.getLeadById(effectiveLeadId, orgId);
    if (!lead) {
      lead = await LeadRepository.getLeadById(effectiveLeadId, altOrgId);
    }

    if (!demo && !lead) {
      return NextResponse.json({ success: false, error: 'Demo or lead not found' }, { status: 404 });
    }

    const actualLeadId = lead?.id || demo?.leadId || id;

    // Prepare content for personalization
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
      content = {
        brand: { businessName: 'Chartered Accountants & Advisory' },
        location: { city: 'Gurgaon', address: 'Cyber City, Gurgaon' },
        contact: { publicPhone: '+91 99999 99999', publicEmail: 'contact@ca-practice.in' },
        meta: { profession: 'Chartered Accountant' },
      };
    }

    const brandName = content?.brand?.businessName || lead?.businessName || 'Chartered Accountants';
    const city = content?.location?.city || lead?.city || 'Gurgaon';
    const profession = content?.meta?.profession || lead?.profession || 'Chartered Accountants';

    // File destinations
    const generatedDir = path.join(process.cwd(), 'public', 'generated-screenshots');
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }

    const heroDiskPath = path.join(generatedDir, `${actualLeadId}.png`);
    const heroWebUrl = `/generated-screenshots/${actualLeadId}.png`;
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';
    const isImageFormat = request.nextUrl.searchParams.get('format') === 'image';

    // 2. Return cached local hero screenshot if already exists and not refreshing
    if (!forceRefresh && fs.existsSync(heroDiskPath)) {
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
        screenshotUrl: `${heroWebUrl}?v=${demo?.version || 1}`,
        cached: true,
        source: 'local_hero',
      });
    }

    // 3. Generate fresh Zoomed Hero Screenshot using local headless Chrome/Edge
    const layout =
      demo?.design?.layout ||
      demo?.templateId ||
      (lead ? selectWebsiteDesign(lead, 1).layout : 'design-1-premium');

    let personalizedHtml = '';
    try {
      const rawHtml = getStitchRawHtml(layout);
      personalizedHtml = personalizeStitchHtml(rawHtml, content);
    } catch (stitchErr) {
      console.warn('Error loading Stitch HTML for screenshot:', stitchErr);
    }

    let captured = false;
    if (personalizedHtml) {
      try {
        captured = await captureLocalHeroScreenshot(personalizedHtml, heroDiskPath, {
          width: 1024,
          height: 640,
        });
      } catch (captureErr) {
        console.warn('Local browser screenshot failed:', captureErr);
      }
    }

    // If local browser capture succeeded
    if (captured && fs.existsSync(heroDiskPath)) {
      if (demo) {
        demo.screenshotUrl = heroWebUrl;
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
        screenshotUrl: `${heroWebUrl}?t=${Date.now()}`,
        cached: false,
        source: 'local_browser',
      });
    }

    // 4. If local capture didn't run (e.g. running on cloud), try Cloud Provider
    const baseUrl = getAppBaseUrl(request.nextUrl.origin);
    const demoUrl = demo?.publicToken
      ? getPublicDemoUrl(demo.publicToken, baseUrl)
      : `${baseUrl}/demo/${actualLeadId}`;
    const sep = demoUrl.includes('?') ? '&' : '?';
    const targetUrl = `${demoUrl}${sep}screenshot=true&v=${demo?.version || 1}`;

    if (!targetUrl.includes('localhost') && !targetUrl.includes('127.0.0.1')) {
      const provider = new CloudScreenshotProvider();
      try {
        const result = await provider.captureWebsite(targetUrl, {
          width: 1024,
          height: 640,
          deviceScaleFactor: 2,
        });
        if (result.success && result.data?.screenshotUrl) {
          if (demo) {
            demo.screenshotUrl = result.data.screenshotUrl;
            demo.screenshotTakenAt = new Date().toISOString();
            await WebsiteDemoRepository.updateDemo(
              demo.organizationId || orgId,
              demo.id,
              { ...demo } as any,
              'system'
            ).catch(() => {});
          }

          if (isImageFormat) {
            try {
              const cloudRes = await fetch(result.data.screenshotUrl, {
                signal: AbortSignal.timeout(5000),
              });
              if (cloudRes.ok) {
                const buf = await cloudRes.arrayBuffer();
                return new NextResponse(buf, {
                  headers: {
                    'Content-Type': cloudRes.headers.get('content-type') || 'image/png',
                    'Cache-Control': 'public, max-age=86400',
                    'Access-Control-Allow-Origin': '*',
                    'Content-Disposition': 'inline; filename="hero_preview.png"',
                  },
                });
              }
            } catch {}
          }

          return NextResponse.json({
            success: true,
            screenshotUrl: result.data.screenshotUrl,
            cached: false,
            source: result.data.source,
          });
        }
      } catch {}
    }

    // 5. Zero-fail fallback: Personalized SVG Hero Mockup (Never falls back to whole-website screenshot)
    const svgContent = generateHeroMockupSvg(brandName, city, profession);
    const svgDiskPath = path.join(generatedDir, `${actualLeadId}.svg`);
    fs.writeFileSync(svgDiskPath, svgContent, 'utf-8');

    if (isImageFormat) {
      return new NextResponse(svgContent, {
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
      screenshotUrl: `/generated-screenshots/${actualLeadId}.svg?t=${Date.now()}`,
      cached: false,
      source: 'svg_mockup',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Hero screenshot capture failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  return GET(request, { params });
}
