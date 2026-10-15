import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { WebsiteDemoRepository, LeadRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { CloudScreenshotProvider } from '@/lib/providers/screenshot.provider';
import { getAppBaseUrl, getPublicDemoUrl } from '@/lib/demos/public';
import { getTemplateScreenshotPath } from '@/lib/demos/stitch-templates';
import { selectWebsiteDesign } from '@/lib/demos/personalization';

export const dynamic = 'force-dynamic';

interface RouteProps {
  params: { id: string } | Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteProps
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id ? decodeURIComponent(resolvedParams.id).trim() : '';

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID parameter required' }, { status: 400 });
    }

    const orgId = await getResolvedOrganizationId(request);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Organization context required' }, { status: 401 });
    }

    // 1. Find the target demo (by demoId, leadId, or publicToken)
    let demo = await WebsiteDemoRepository.getDemo(orgId, id);
    let leadId = demo?.leadId;

    if (!demo) {
      demo = await WebsiteDemoRepository.getApprovedDemoByPublicToken(id);
      if (demo) {
        leadId = demo.leadId;
      }
    }

    if (!demo) {
      const lead = await LeadRepository.getLeadById(id, orgId);
      if (lead) {
        leadId = lead.id;
        const demos = await WebsiteDemoRepository.listDemos(orgId, lead.id);
        demo = demos[0] || null;
      }
    }

    const lead = leadId ? await LeadRepository.getLeadById(leadId, orgId) : null;

    if (!demo && !lead) {
      return NextResponse.json({ success: false, error: 'Demo or lead not found' }, { status: 404 });
    }

    // 2. Resolve the design layout and determine local template screenshot
    const contentObj = demo && typeof demo.content === 'object' ? (demo.content as unknown as Record<string, unknown>) : null;
    const layout =
      demo?.design?.layout ||
      (contentObj?.design as any)?.layout ||
      demo?.templateId ||
      (lead ? selectWebsiteDesign(lead, 1).layout : 'design-1-premium');

    const templateScreenshotRelPath = getTemplateScreenshotPath(layout);
    const templateDiskPath = path.join(process.cwd(), 'public', templateScreenshotRelPath.replace(/^\/+/, ''));
    const fallbackDiskPath = path.join(process.cwd(), 'public', 'demo-templates', 'design-1-premium', 'screen.png');

    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';
    const isImageFormat = request.nextUrl.searchParams.get('format') === 'image';

    // 3. Handle binary image delivery (?format=image)
    if (isImageFormat) {
      // If demo has a working remote HTTPS image URL (and not pointing to localhost / broken Microlink)
      const existingUrl = demo?.screenshotUrl;
      const isRemoteValid =
        existingUrl &&
        existingUrl.startsWith('https://') &&
        !existingUrl.includes('localhost') &&
        !existingUrl.includes('127.0.0.1') &&
        !existingUrl.includes('api.microlink.io');

      if (isRemoteValid && !forceRefresh) {
        try {
          const imgRes = await fetch(existingUrl, { signal: AbortSignal.timeout(4000) });
          if (imgRes.ok) {
            const buf = await imgRes.arrayBuffer();
            const contentType = imgRes.headers.get('content-type') || 'image/png';
            return new NextResponse(buf, {
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
                'Content-Disposition': 'inline; filename="concept_preview.png"',
              },
            });
          }
        } catch {
          // Fall through to local template screenshot file
        }
      }

      // Read local high-res template screenshot directly from disk
      const targetFilePath = fs.existsSync(templateDiskPath) ? templateDiskPath : fallbackDiskPath;
      if (fs.existsSync(targetFilePath)) {
        const fileBuf = fs.readFileSync(targetFilePath);
        return new NextResponse(fileBuf, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
            'Content-Disposition': 'inline; filename="concept_preview.png"',
          },
        });
      }
    }

    // 4. Return cached screenshot if already valid and not requested to refresh
    const existingScreenshot = demo?.screenshotUrl;
    const isBrokenMicrolink =
      existingScreenshot &&
      existingScreenshot.includes('api.microlink.io') &&
      (existingScreenshot.includes('localhost') || existingScreenshot.includes('127.0.0.1'));

    if (existingScreenshot && !isBrokenMicrolink && !forceRefresh) {
      return NextResponse.json({
        success: true,
        screenshotUrl: existingScreenshot,
        cached: true,
        source: 'cache',
      });
    }

    // 5. Try CloudScreenshotProvider if dedicated key (e.g. ScreenshotOne) is configured and URL is public
    const screenshotType = request.nextUrl.searchParams.get('type');
    const baseUrl = getAppBaseUrl(request.nextUrl.origin);

    let targetUrl: string;
    if (screenshotType === 'website' && lead?.website) {
      targetUrl = lead.website.startsWith('http') ? lead.website : `https://${lead.website}`;
    } else {
      const demoUrl = demo?.publicToken
        ? getPublicDemoUrl(demo.publicToken, baseUrl)
        : `${baseUrl}/demo/${leadId || id}`;
      const sep = demoUrl.includes('?') ? '&' : '?';
      targetUrl = `${demoUrl}${sep}screenshot=true&v=${demo?.version || 1}`;
    }

    let finalScreenshotUrl = templateScreenshotRelPath;
    let source = 'template';

    const provider = new CloudScreenshotProvider();
    if (!targetUrl.includes('localhost') && !targetUrl.includes('127.0.0.1')) {
      try {
        const result = await provider.captureWebsite(targetUrl, {
          width: 1024,
          height: 640,
          deviceScaleFactor: 2,
        });
        if (result.success && result.data?.screenshotUrl) {
          finalScreenshotUrl = result.data.screenshotUrl;
          source = result.data.source;
        }
      } catch {
        // Fall back to template
      }
    }

    // 6. Update the demo record with the screenshot URL
    if (demo) {
      demo.screenshotUrl = finalScreenshotUrl;
      demo.screenshotTakenAt = new Date().toISOString();
      await WebsiteDemoRepository.updateDemo(
        orgId,
        demo.id,
        {
          ...demo,
        } as any,
        'system'
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      screenshotUrl: finalScreenshotUrl,
      source,
      cached: false,
      targetUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Screenshot capture failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteProps
) {
  return GET(request, { params });
}
