import { NextRequest, NextResponse } from 'next/server';
import { WebsiteDemoRepository, LeadRepository } from '@/lib/db/repository';
import { getResolvedOrganizationId } from '@/lib/auth';
import { CloudScreenshotProvider, MockScreenshotProvider } from '@/lib/providers/screenshot.provider';
import { getAppBaseUrl, getPublicDemoUrl } from '@/lib/demos/public';

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

    // 1. Find the target demo (by demoId or leadId)
    let demo = await WebsiteDemoRepository.getDemo(orgId, id);
    let leadId = demo?.leadId;

    if (!demo) {
      const lead = await LeadRepository.getLeadById(id, orgId);
      if (lead) {
        leadId = lead.id;
        const demos = await WebsiteDemoRepository.listDemos(orgId, lead.id);
        demo = demos[0] || null;
      }
    }

    if (!demo && !leadId) {
      return NextResponse.json({ success: false, error: 'Demo or lead not found' }, { status: 404 });
    }

    // Return cached screenshot if already taken and not requested to refresh
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';
    if (demo?.screenshotUrl && !forceRefresh) {
      return NextResponse.json({
        success: true,
        screenshotUrl: demo.screenshotUrl,
        cached: true,
        source: 'cache',
      });
    }

    // 2. Build target URL
    const baseUrl = getAppBaseUrl(request.nextUrl.origin);
    const targetUrl = demo?.publicToken
      ? getPublicDemoUrl(demo.publicToken, baseUrl)
      : `${baseUrl}/demo/${leadId}`;

    // 3. Capture screenshot
    const isDemoMode = process.env.DEMO_MODE === 'true';
    const provider = isDemoMode ? new MockScreenshotProvider() : new CloudScreenshotProvider();

    const result = await provider.captureWebsite(targetUrl, {
      width: 1280,
      height: 800,
    });

    if (!result.success || !result.data) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to capture screenshot',
      }, { status: 500 });
    }

    const screenshotUrl = result.data.screenshotUrl;

    // 4. Update the demo record with the screenshot URL if demo exists
    if (demo) {
      demo.screenshotUrl = screenshotUrl;
      demo.screenshotTakenAt = new Date().toISOString();
      await WebsiteDemoRepository.updateDemo(orgId, demo.id, {
        ...demo,
      } as any, 'system');
    }

    return NextResponse.json({
      success: true,
      screenshotUrl,
      source: result.data.source,
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
  // Re-use GET handler for POST requests
  return GET(request, { params });
}
