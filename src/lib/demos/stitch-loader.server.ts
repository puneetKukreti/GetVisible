import fs from 'fs';
import path from 'path';
import { STITCH_DESIGN_MAP } from './stitch-personalizer';
import { getProfessionStitchDesign } from './profession-stitch';
import { buildProfessionStitchShell } from './profession-stitch-renderer';

/**
 * Server-only utility to read raw HTML templates from disk.
 * Prioritizes src/Demo_website_template, with fallback to public/demo-templates.
 * Profession-specific Stitch template sets are generated deterministically.
 */
export function getStitchRawHtml(layoutKey: string = 'design-1-premium'): string {
  // Profession-specific template sets are generated (no on-disk file).
  const professionDesign = getProfessionStitchDesign(layoutKey);
  if (professionDesign) {
    return buildProfessionStitchShell(professionDesign);
  }

  const meta = STITCH_DESIGN_MAP[layoutKey] || STITCH_DESIGN_MAP['design-1-premium'];
  const folder = meta.templateFolder;

  const candidatePaths = [
    path.join(process.cwd(), 'src', 'Demo_website_template', folder, 'code.html'),
    path.join(process.cwd(), 'public', 'demo-templates', meta.id, 'index.html'),
    path.join(process.cwd(), 'public', 'demo-templates', meta.id, 'code.html'),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      try {
        return fs.readFileSync(candidate, 'utf-8');
      } catch (err) {
        console.error(`Error reading Stitch template at ${candidate}:`, err);
      }
    }
  }

  throw new Error(`Google Stitch template HTML not found for ${layoutKey} (${folder})`);
}
