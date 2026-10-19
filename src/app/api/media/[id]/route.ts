import { NextRequest, NextResponse } from 'next/server';
import { MediaRepository } from '@/lib/db/repository';

// Immutable by nature: an asset id always refers to the same bytes.
export const dynamic = 'force-dynamic';

interface RouteProps {
  params: { id: string } | Promise<{ id: string }>;
}

/**
 * Public image serving for demo sites.
 *
 * Anonymous on purpose: the public prospect demos embed these URLs, and asset
 * ids are unguessable random tokens (`media-<timestamp>-<hex>`), so there is no
 * user data to protect. Served with one-year immutable caching.
 */
export async function GET(_request: NextRequest, { params }: RouteProps) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id ? decodeURIComponent(resolvedParams.id).trim() : '';

  try {
    const asset = await MediaRepository.getDemoMediaAsset(id);
    if (!asset) {
      return NextResponse.json({ success: false, error: 'Image not found' }, { status: 404 });
    }

    const bytes = new Uint8Array(asset.bytes.byteLength);
    bytes.set(asset.bytes);

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': asset.mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Image temporarily unavailable' },
      { status: 503 }
    );
  }
}
