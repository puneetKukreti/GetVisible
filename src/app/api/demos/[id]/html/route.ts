import { NextRequest, NextResponse } from 'next/server';
import { requireOwnerSession } from '@/lib/owner-guard';
import { isStitchLayout } from '@/lib/demos/stitch-personalizer';
import { resolveDemoSiteHtml } from '@/lib/demos/demo-html.server';

export const dynamic = 'force-dynamic';
// May generate a demo on the fly when a lead has none yet.
export const maxDuration = 60;

interface RouteProps {
  params: { id: string } | Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id ? decodeURIComponent(resolvedParams.id).trim() : '';

    if (!id) {
      return new NextResponse('Demo or Lead ID parameter required', { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const rawLayoutOverride = searchParams.get('layout') || undefined;

    // A layout override lets a caller render any bundled design. It is only used
    // by the authenticated template gallery, so it requires an owner session and
    // must name a known Stitch layout (never an arbitrary string/path).
    let layoutOverride: string | undefined;
    if (rawLayoutOverride) {
      const unauthorized = await requireOwnerSession(request);
      if (unauthorized) return unauthorized;
      if (isStitchLayout(rawLayoutOverride)) {
        layoutOverride = rawLayoutOverride;
      }
    }

    // Shared resolver (in-process): token/lead lookup, staleness repair and
    // personalization. The /demo/[leadId] page renders this same document
    // server-side so prospects never see a loading screen.
    const personalizedHtml = await resolveDemoSiteHtml({
      id,
      request,
      layoutOverride,
    });

    return new NextResponse(personalizedHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error rendering demo HTML';
    const safeMessage = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return new NextResponse(`<html><body><h1>Error Rendering Demo</h1><p>${safeMessage}</p></body></html>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
