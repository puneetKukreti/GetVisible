import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwnerSession } from '@/lib/owner-guard';
import {
  getIndustryDesignBlueprint,
  reauthorIndustryDesignBlueprint,
} from '@/lib/demos/industry-blueprint';
import { getIndustryPalette } from '@/lib/demos/industry-palettes';

// Owner-only maintenance for per-industry design blueprints.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BlueprintQuerySchema = z.object({
  profession: z.string().min(2).max(160),
  businessName: z.string().max(160).optional(),
  city: z.string().max(80).optional(),
});

function present(blueprint: Awaited<ReturnType<typeof getIndustryDesignBlueprint>>) {
  const palette = getIndustryPalette(blueprint.paletteId);
  return {
    key: blueprint.key,
    industry: blueprint.industry,
    archetype: blueprint.archetype,
    paletteId: blueprint.paletteId,
    paletteName: palette?.name || blueprint.paletteId,
    paletteDescription: palette?.description || '',
    accentColor: blueprint.accentColor || null,
    heroStyle: blueprint.heroStyle,
    sectionOrder: blueprint.sectionOrder,
    copy: blueprint.copy,
    imagery: blueprint.imagery,
    source: blueprint.source,
    referenceBasis: blueprint.referenceBasis,
    version: blueprint.version,
    createdAt: blueprint.createdAt,
  };
}

/**
 * Shows the design a trade will get (authoring it once if this industry has
 * never been seen). Useful for checking what the demo will look like.
 */
export async function GET(request: NextRequest) {
  const unauthorized = await requireOwnerSession(request);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const parsed = BlueprintQuerySchema.safeParse({
    profession: searchParams.get('profession') || '',
    businessName: searchParams.get('businessName') || undefined,
    city: searchParams.get('city') || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'A profession (2-160 characters) is required' },
      { status: 400 }
    );
  }

  try {
    const blueprint = await getIndustryDesignBlueprint(parsed.data);
    return NextResponse.json({ success: true, blueprint: present(blueprint) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not resolve the industry design';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * Re-authors an industry's design: forgets the cached blueprint and resolves a
 * fresh one (so a trade can pick up the AI-authored design after the AI provider
 * is configured, or an improved curated design).
 */
export async function POST(request: NextRequest) {
  const unauthorized = await requireOwnerSession(request);
  if (unauthorized) return unauthorized;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = BlueprintQuerySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'A profession (2-160 characters) is required' },
      { status: 400 }
    );
  }

  try {
    const blueprint = await reauthorIndustryDesignBlueprint(parsed.data);
    return NextResponse.json({ success: true, refreshed: true, blueprint: present(blueprint) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not re-author the industry design';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
