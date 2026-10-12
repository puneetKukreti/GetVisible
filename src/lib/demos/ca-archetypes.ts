import { WebsiteLayout } from '@/types';
import { LeadFacts } from './templates';

export interface CAArchetypeMeta {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  defaultLayout: WebsiteLayout;
  defaultThemeId: string;
  targetAudience: string;
  keyRegulations: string[];
}

/**
 * Registry of practice archetypes.
 * Cleared out in preparation for user-supplied templates.
 */
export const INDIAN_CA_ARCHETYPES: CAArchetypeMeta[] = [];

/**
 * Intelligent archetype inference.
 * Defaults to base template when no custom archetypes are registered.
 */
export function inferCAArchetype(_facts?: Partial<LeadFacts>): string {
  return 'BASE_TEMPLATE';
}
