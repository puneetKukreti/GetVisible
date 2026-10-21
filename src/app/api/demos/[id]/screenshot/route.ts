import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { WebsiteDemoRepository, LeadRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { requireOwnerSession } from '@/lib/owner-guard';
import { DEMO_ORGANIZATION_ID, PILOT_ORGANIZATION_ID } from '@/lib/workspace';
import {
  findSystemBrowser,
  captureLocalHeroScreenshot,
  captureCloudHeroScreenshot,
  generateHeroMockupSvg,
} from '@/lib/providers/screenshot.provider';
import { getAppBaseUrl } from '@/lib/demos/public';
import { getStitchRawHtml } from '@/lib/demos/stitch-loader.server';
import { personalizeStitchHtml } from '@/lib/demos/stitch-personalizer';
import { selectWebsiteDesign } from '@/lib/demos/personalization';
import { getTemplateScreenshotPath } from '@/lib/demos/stitch-templates';
import { WebsiteContent } from '@/types';

export const dynamic = 'force-dynamic';
// Where a local Chrome is available the capture path is slow; give it room.
export const maxDuration = 60;

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
  // Presentation-only switch: the portrait card is what reads well in a phone
  // chat bubble. It cannot carry caller-supplied content, so it needs no session.
  const isMobileViewport = searchParams.get('viewport') === 'mobile';

  let actualLeadId = 'preview';
  let brandName = queryName || 'Chartered Accountants';
  let city = queryCity || 'Delhi NCR';
  let profession = queryProf || 'Chartered Accountants';

  try {
    // Personalization overrides (name/city/profession) let a caller render an
    // arbitrary business identity through our renderer. They are only used by the
    // authenticated template gallery, so they require an owner session. The plain
    // prospect-facing screenshot (no overrides) stays public.
    if (queryName || queryCity || queryProf) {
      const unauthorized = await requireOwnerSession(request);
      if (unauthorized) return unauthorized;
    }

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

    const variantSuffix = isMobileViewport ? '-mobile' : '';
    // A headless `--window-size=390` capture is laid out at Chrome's ~500px
    // minimum window width and then cropped back to 390, so it comes back with
    // the hero copy sliced mid-word. The portrait variant is therefore always the
    // designed 1080x1350 concept card (see generateMobileHeroMockupSvg); only the
    // wide variant uses a real pixel capture.
    const heroDiskPath = path.join(cacheDir, `${actualLeadId}${variantSuffix}.png`);
    const heroSvgPath = path.join(cacheDir, `${actualLeadId}${variantSuffix}.svg`);
    const dynamicImageUrl = `/api/demos/${encodeURIComponent(actualLeadId)}/screenshot?format=image&name=${encodeURIComponent(brandName)}&city=${encodeURIComponent(city)}&profession=${encodeURIComponent(profession)}${isMobileViewport ? '&viewport=mobile' : ''}`;

    // 2. Return the cached real capture if one exists; paths already carry the
    // `-mobile` suffix so the two variants never collide. The SVG card cache
    // stays desktop-only: a failed mobile capture must be able to succeed on a
    // later attempt rather than keep serving the designed card.
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
                'Content-Disposition': `inline; filename="hero_preview${isMobileViewport ? '_mobile' : ''}.png"`,
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
        if (fs.existsSync(heroSvgPath) && fs.statSync(heroSvgPath).size > 200 && !isMobileViewport) {
          if (isImageFormat) {
            const svgBuf = fs.readFileSync(heroSvgPath, 'utf-8');
            return new NextResponse(svgBuf, {
              headers: {
                'Content-Type': 'image/svg+xml; charset=utf-8',
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
                'Content-Disposition': `inline; filename="hero_preview${isMobileViewport ? '_mobile' : ''}.svg"`,
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

    // 3. Resolve the demo's Stitch template and its pre-rendered preview art.
    // These are real 1024x640 screenshots that ship with the app, so they work
    // on serverless hosts (e.g. Vercel) where no headless Chrome is available.
    const layout =
      demo?.design?.layout ||
      demo?.templateId ||
      (lead ? selectWebsiteDesign(lead, 1).layout : 'design-1-premium');
    const templatePreviewPath = getTemplateScreenshotPath(layout);

    const hasLocalBrowser = Boolean(findSystemBrowser());

    // 3a. A real capture of the prospect's own demo page, so the WhatsApp
    // portrait bubble shows the actual website rather than the designed card.
    // The phone-viewport capture is attempted on every host (the cloud
    // renderer bypasses the ~500px local-crop problem entirely); the wide
    // variant only tries it when no local Chrome exists, since that host can
    // capture deterministically for free. If the cloud renderer is unreachable
    // the SVG card below remains the zero-fail fallback, and non-public pages
    // (http/localhost) are skipped by the capture helper itself.
    if (!hasLocalBrowser || isMobileViewport) {
      const publicAccessToken = demo?.publicToken || actualLeadId;
      const livePageUrl = `${getAppBaseUrl(request.nextUrl.origin)}/api/demos/${encodeURIComponent(
        publicAccessToken
      )}/html`;
      const cloudBytes = await captureCloudHeroScreenshot(
        livePageUrl,
        isMobileViewport ? 390 : 1280,
        isMobileViewport ? 844 : 800
      );

      if (cloudBytes) {
        // DOM BodyInit needs a snapshot BufferSource; hand over a plain copy.
        const cloudBody = new Uint8Array(cloudBytes.byteLength);
        cloudBody.set(cloudBytes);
        try {
          fs.writeFileSync(heroDiskPath, cloudBytes);
        } catch {}
        if (demo) {
          demo.screenshotUrl = dynamicImageUrl;
          await WebsiteDemoRepository.updateDemo(
            demo.organizationId || orgId,
            demo.id,
            { ...demo } as any,
            'system'
          ).catch(() => {});
        }
        if (isImageFormat) {
          return new NextResponse(cloudBody, {
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=86400',
              'Access-Control-Allow-Origin': '*',
              'Content-Disposition': `inline; filename="hero_preview${isMobileViewport ? '_mobile' : ''}.png"`,
            },
          });
        }
        return NextResponse.json({
          success: true,
          screenshotUrl: dynamicImageUrl,
          cached: false,
          source: 'microlink',
        });
      }
    }

    if (!hasLocalBrowser && isImageFormat) {
      // No headless browser on this host (e.g. Vercel serverless), so the static
      // template art cannot be personalized per prospect. Return a self-contained
      // SVG that leads with the prospect's name instead — the client rasterizes it
      // to PNG for WhatsApp/email attachment.
      const svg = generateHeroMockupSvg(
        brandName,
        city,
        profession,
        content?.hero?.headline,
        content?.hero?.subheadline,
        { viewport: isMobileViewport ? 'mobile' : 'desktop' }
      );

      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
          'Content-Disposition': `inline; filename="website_concept${isMobileViewport ? '_mobile' : ''}.svg"`,
        },
      });
    }

    if (!hasLocalBrowser && templatePreviewPath.endsWith('.png')) {
      // The bundled template art is a neutral placeholder, so point clients at the
      // personalized preview route (which renders the prospect's own name) rather
      // than a static image that shows someone else's business.
      return NextResponse.json({
        success: true,
        screenshotUrl: dynamicImageUrl,
        cached: false,
        source: 'personalized_preview',
      });
    }

    // 3b. If a local headless browser is available (local dev / VPS with Chrome),
    // capture a fresh, pixel-perfect PNG of the personalized Stitch template.
    // Skipped for the portrait variant, which is always the designed concept card.
    if (hasLocalBrowser && !isMobileViewport) {
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
            // The Stitch shells use a 1280px (max-w-7xl) desktop grid; a 1024px
            // window squeezes the nav into the header CTA and clips it, so the
            // live capture renders at the design's intended desktop width.
            width: 1280,
            height: 800,
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
                'Content-Disposition': `inline; filename="hero_preview${isMobileViewport ? '_mobile' : ''}.png"`,
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

    // 4. (wide-only local-browser capture lives above in 3b; the cloud capture
    // now runs for both viewports in step 3a before this point.)

    // 5. Zero-fail instant SVG Hero Mockup (Works 100% on Vercel Serverless / Cloud without Chrome)
    const heroHeadline = content?.hero?.headline;
    const heroSubheadline = content?.hero?.subheadline;
    const svgContent = generateHeroMockupSvg(brandName, city, profession, heroHeadline, heroSubheadline, {
      viewport: isMobileViewport ? 'mobile' : 'desktop',
    });
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
          'Content-Disposition': `inline; filename="hero_preview${isMobileViewport ? '_mobile' : ''}.svg"`,
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
    const svgFallback = generateHeroMockupSvg(brandName, city, profession, undefined, undefined, {
      viewport: isMobileViewport ? 'mobile' : 'desktop',
    });

    if (isImageFormat) {
      return new NextResponse(svgFallback, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
          'Content-Disposition': `inline; filename="hero_preview${isMobileViewport ? '_mobile' : ''}.svg"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      screenshotUrl: `/api/demos/${encodeURIComponent(actualLeadId)}/screenshot?format=image&name=${encodeURIComponent(brandName)}&city=${encodeURIComponent(city)}${isMobileViewport ? '&viewport=mobile' : ''}`,
      cached: false,
      source: 'svg_mockup',
    });
  }
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  return GET(request, { params });
}
