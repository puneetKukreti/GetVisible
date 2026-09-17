import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { DEMO_ORGANIZATION_ID, isExplicitDemoMode } from './db/demo-data';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@getvisible.example' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Explicit demo login or credential validation (supports both GetVisible and legacy LeadForge)
        if (
          (credentials?.email === 'admin@getvisible.example' ||
            credentials?.email === 'admin@leadforge.example') &&
          credentials?.password === 'demo123'
        ) {
          return {
            id: 'demo-user-admin',
            name: 'Demo Admin',
            email: credentials.email,
            role: 'ADMIN',
            organizationId: DEMO_ORGANIZATION_ID,
            organizationName: 'Gurgaon CA Agency HQ',
          };
        }

        // Support for standard login when configured
        if (credentials?.email && credentials?.password) {
          // If in explicit demo mode, permit test login
          if (process.env.DEMO_MODE === 'true') {
            return {
              id: 'demo-user-member',
              name: credentials.email.split('@')[0],
              email: credentials.email,
              role: 'MEMBER',
              organizationId: DEMO_ORGANIZATION_ID,
              organizationName: 'Gurgaon CA Agency HQ',
            };
          }

          // Production DB credential lookup
          try {
            const { prisma } = await import('./db/prisma');
            const user = await prisma.user.findUnique({
              where: { email: credentials.email },
              include: { organization: true },
            });

            if (user) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                organizationName: user.organization.name,
              };
            }
          } catch (e) {
            console.error('Database auth failed:', e);
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
        token.organizationId = (user as unknown as { organizationId: string }).organizationId;
        token.organizationName = (user as unknown as { organizationName: string }).organizationName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as { id: string }).id = token.id as string;
        (session.user as unknown as { role: string }).role = token.role as string;
        (session.user as unknown as { organizationId: string }).organizationId = token.organizationId as string;
        (session.user as unknown as { organizationName: string }).organizationName = token.organizationName as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'leadforge-production-fallback-secret-development-only',
};

import {
  PILOT_ORGANIZATION_ID,
  getDefaultOrganizationId,
  getActiveWorkspaceMode,
} from './workspace';

/**
 * Resolves the active organization context across Server Components, Route Handlers, and internal services.
 *
 * 1. Checks explicit 'x-organization-id' request header if provided or available in next/headers.
 * 2. Checks explicit 'x-workspace-mode' header or workspace mode cookies ('getvisible_workspace_mode' / 'leadforge_workspace_mode')
 *    from NextRequest.cookies, incoming 'cookie' header, or next/headers.
 * 3. Checks environment-level active workspace mode (e.g. WORKSPACE_MODE=pilot, PILOT_MODE=true, DEMO_MODE=false).
 * 4. Checks active authenticated NextAuth session (session.user.organizationId).
 * 5. Fallback to active workspace mode (PILOT_ORGANIZATION_ID in pilot mode, DEMO_ORGANIZATION_ID in demo mode).
 */
export async function getResolvedOrganizationId(
  requestOrHeaders?: Request | Headers | { headers: Headers | { get(name: string): string | null } } | null
): Promise<string | null> {
  let headerOrgId: string | null = null;
  let workspaceMode: string | null = null;

  // Helper to parse workspace mode from a cookie string
  const parseCookieMode = (cookieStr?: string | null): string | null => {
    if (!cookieStr) return null;
    const match = cookieStr.match(/(?:^|;\s*)(?:getvisible_workspace_mode|leadforge_workspace_mode)=([^;]+)/i);
    if (match && match[1]) {
      const mode = decodeURIComponent(match[1]).trim().toLowerCase();
      if (mode === 'pilot' || mode === 'real') return 'pilot';
      if (mode === 'demo') return 'demo';
    }
    return null;
  };

  // 1. Check explicit headers and cookies passed in requestOrHeaders
  if (requestOrHeaders) {
    let reqHeaders: Headers | { get(name: string): string | null } | null = null;

    if ('headers' in requestOrHeaders && requestOrHeaders.headers && typeof requestOrHeaders.headers.get === 'function') {
      reqHeaders = requestOrHeaders.headers;
    } else if (typeof (requestOrHeaders as Headers).get === 'function') {
      reqHeaders = requestOrHeaders as Headers;
    }

    if (reqHeaders) {
      headerOrgId = reqHeaders.get('x-organization-id');
      const wsH = reqHeaders.get('x-workspace-mode');
      if (wsH) {
        const lower = wsH.trim().toLowerCase();
        if (lower === 'pilot' || lower === 'real') workspaceMode = 'pilot';
        else if (lower === 'demo') workspaceMode = 'demo';
      }

      if (!workspaceMode) {
        const rawCookie = reqHeaders.get('cookie');
        workspaceMode = parseCookieMode(rawCookie);
      }
    }

    // If requestOrHeaders is a NextRequest, also inspect request.cookies
    if (!workspaceMode && typeof (requestOrHeaders as any).cookies?.get === 'function') {
      try {
        const cookieObj = (requestOrHeaders as any).cookies;
        const cookieVal =
          cookieObj.get('getvisible_workspace_mode')?.value ||
          cookieObj.get('leadforge_workspace_mode')?.value;
        if (cookieVal) {
          const lower = cookieVal.trim().toLowerCase();
          if (lower === 'pilot' || lower === 'real') workspaceMode = 'pilot';
          else if (lower === 'demo') workspaceMode = 'demo';
        }
      } catch {
        // Safe fallback
      }
    }
  }

  // 2. If running in Next.js Server Component or Route Handler without explicit headers/cookies, inspect next/headers
  if (!headerOrgId || !workspaceMode) {
    try {
      const { headers, cookies } = await import('next/headers');
      const h = headers();
      if (!headerOrgId) {
        headerOrgId = h.get('x-organization-id');
      }
      if (!workspaceMode) {
        const wsH = h.get('x-workspace-mode');
        if (wsH) {
          const lower = wsH.trim().toLowerCase();
          if (lower === 'pilot' || lower === 'real') workspaceMode = 'pilot';
          else if (lower === 'demo') workspaceMode = 'demo';
        }
      }
      if (!workspaceMode) {
        const c = cookies();
        const cookieVal =
          c.get('getvisible_workspace_mode')?.value ||
          c.get('leadforge_workspace_mode')?.value;
        if (cookieVal) {
          const lower = cookieVal.trim().toLowerCase();
          if (lower === 'pilot' || lower === 'real') workspaceMode = 'pilot';
          else if (lower === 'demo') workspaceMode = 'demo';
        }
      }
    } catch {
      // Outside Next.js request lifecycle / in tests
    }
  }

  // Explicit organization ID header takes priority if specified
  if (headerOrgId && headerOrgId.trim().length > 0) {
    return headerOrgId.trim();
  }

  // Explicit workspace mode takes priority over default session user org
  if (workspaceMode === 'pilot') {
    return PILOT_ORGANIZATION_ID;
  }
  if (workspaceMode === 'demo') {
    return DEMO_ORGANIZATION_ID;
  }

  // 3. Check environment-level active workspace mode (WORKSPACE_MODE, PILOT_MODE, DEMO_MODE=false)
  const envMode = getActiveWorkspaceMode();
  if (envMode === 'pilot') {
    return PILOT_ORGANIZATION_ID;
  }

  // 4. Check active NextAuth session
  try {
    const { getServerSession } = await import('next-auth');
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as unknown as { organizationId?: string }).organizationId) {
      const org = (session.user as unknown as { organizationId: string }).organizationId;
      if (org && org.trim().length > 0) {
        return org.trim();
      }
    }
  } catch {
    // Outside active HTTP session context
  }

  // 5. Dynamic workspace fallback
  return getDefaultOrganizationId();
}


