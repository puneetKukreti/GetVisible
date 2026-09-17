export type WorkspaceMode = 'demo' | 'pilot';

export const DEMO_ORGANIZATION_ID = 'org-demo-gurgaon';
export const PILOT_ORGANIZATION_ID = process.env.PILOT_ORGANIZATION_ID || 'org-pilot-gurgaon';

export interface WorkspaceConfig {
  mode: WorkspaceMode;
  organizationId: string;
  name: string;
  badgeLabel: string;
  badgeVariant: 'demo' | 'pilot';
  description: string;
  isFictional: boolean;
}

export const WORKSPACE_CONFIGS: Record<WorkspaceMode, WorkspaceConfig> = {
  demo: {
    mode: 'demo',
    organizationId: DEMO_ORGANIZATION_ID,
    name: 'Gurgaon CA Demo Agency',
    badgeLabel: 'DEMO DATA',
    badgeVariant: 'demo',
    description: 'Fictional sandbox environment for development, automated testing, and simulated CA prospects.',
    isFictional: true,
  },
  pilot: {
    mode: 'pilot',
    organizationId: PILOT_ORGANIZATION_ID,
    name: 'Gurgaon CA Pilot Workspace',
    badgeLabel: 'REAL/PILOT DATA',
    badgeVariant: 'pilot',
    description: 'Real-world prospect sales pilot workspace. Contains zero simulated data. Manual sending only.',
    isFictional: false,
  },
};

/**
 * Determines the active workspace mode based on headers, cookies, or environment variables.
 */
export function getActiveWorkspaceMode(override?: string | null): WorkspaceMode {
  // 1. Explicit override passed
  if (override === 'pilot' || override === 'real') return 'pilot';
  if (override === 'demo') return 'demo';

  // 2. Check if client-side cookie is set (browser context)
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)(?:getvisible_workspace_mode|leadforge_workspace_mode)=([^;]+)/);
    if (match && match[1]) {
      const cookieVal = decodeURIComponent(match[1]).toLowerCase();
      if (cookieVal === 'pilot' || cookieVal === 'real') return 'pilot';
      if (cookieVal === 'demo') return 'demo';
    }
  }

  // 3. Check environment variables
  if (process.env.WORKSPACE_MODE === 'pilot' || process.env.WORKSPACE_MODE === 'real') {
    return 'pilot';
  }
  if (process.env.NEXT_PUBLIC_WORKSPACE_MODE === 'pilot' || process.env.NEXT_PUBLIC_WORKSPACE_MODE === 'real') {
    return 'pilot';
  }
  if (process.env.PILOT_MODE === 'true' || process.env.NEXT_PUBLIC_PILOT_MODE === 'true') {
    return 'pilot';
  }

  // If DEMO_MODE is explicitly set to false, treat as pilot/real mode
  if (process.env.DEMO_MODE === 'false' || process.env.NEXT_PUBLIC_DEMO_MODE === 'false') {
    return 'pilot';
  }

  // Default to demo mode for safety and testing
  return 'demo';
}

/**
 * Gets the default organization ID for the active workspace mode.
 */
export function getDefaultOrganizationId(override?: string | null): string {
  const mode = getActiveWorkspaceMode(override);
  return mode === 'pilot' ? PILOT_ORGANIZATION_ID : DEMO_ORGANIZATION_ID;
}

/**
 * Server-side helper to determine active workspace mode from next/headers cookies/headers if available,
 * falling back to getActiveWorkspaceMode().
 */
export async function getServerWorkspaceMode(): Promise<WorkspaceMode> {
  try {
    const { cookies, headers } = await import('next/headers');
    const h = headers();
    const headerMode = h.get('x-workspace-mode');
    if (headerMode === 'pilot' || headerMode === 'real') return 'pilot';
    if (headerMode === 'demo') return 'demo';

    const headerOrgId = h.get('x-organization-id');
    if (headerOrgId === PILOT_ORGANIZATION_ID) return 'pilot';
    if (headerOrgId === DEMO_ORGANIZATION_ID) return 'demo';

    const c = cookies();
    const cookieMode =
      c.get('getvisible_workspace_mode')?.value || c.get('leadforge_workspace_mode')?.value;
    if (cookieMode === 'pilot' || cookieMode === 'real') return 'pilot';
    if (cookieMode === 'demo') return 'demo';
  } catch {
    // Outside Next.js request lifecycle
  }

  return getActiveWorkspaceMode();
}

/**
 * Convenience helper to check if active mode is pilot.
 */
export function isPilotMode(override?: string | null): boolean {
  return getActiveWorkspaceMode(override) === 'pilot';
}

/**
 * Convenience helper to check if active mode is demo.
 */
export function isDemoMode(override?: string | null): boolean {
  return getActiveWorkspaceMode(override) === 'demo';
}
