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
 * 2. Checks explicit 'x-workspace-mode' header or 'leadforge_workspace_mode' cookie.
 * 3. Checks active authenticated NextAuth session (session.user.organizationId).
 * 4. Fallback to active workspace mode (PILOT_ORGANIZATION_ID in pilot mode, DEMO_ORGANIZATION_ID in demo mode).
 */
export async function getResolvedOrganizationId(
  requestOrHeaders?: Request | Headers | { headers: Headers | { get(name: string): string | null } } | null
): Promise<string | null> {
  // 1. Check explicit header if passed
  let headerOrgId: string | null = null;
  let workspaceModeHeader: string | null = null;

  if (requestOrHeaders) {
    if ('headers' in requestOrHeaders && requestOrHeaders.headers && typeof requestOrHeaders.headers.get === 'function') {
      headerOrgId = requestOrHeaders.headers.get('x-organization-id');
      workspaceModeHeader = requestOrHeaders.headers.get('x-workspace-mode');
    } else if (typeof (requestOrHeaders as Headers).get === 'function') {
      headerOrgId = (requestOrHeaders as Headers).get('x-organization-id');
      workspaceModeHeader = (requestOrHeaders as Headers).get('x-workspace-mode');
    }
  }

  // 1b. If not passed, check next/headers in Server Component / RSC contexts
  if (!headerOrgId) {
    try {
      const { headers, cookies } = await import('next/headers');
      const h = headers();
      headerOrgId = h.get('x-organization-id');
      if (!workspaceModeHeader) {
        workspaceModeHeader = h.get('x-workspace-mode');
      }
      if (!headerOrgId && !workspaceModeHeader) {
        const c = cookies();
        const cookieMode =
          c.get('getvisible_workspace_mode')?.value || c.get('leadforge_workspace_mode')?.value;
        if (cookieMode === 'pilot' || cookieMode === 'real') return PILOT_ORGANIZATION_ID;
        if (cookieMode === 'demo') return DEMO_ORGANIZATION_ID;
      }
    } catch {
      // Outside Next.js request lifecycle / in tests
    }
  }

  if (headerOrgId && headerOrgId.trim().length > 0) {
    return headerOrgId.trim();
  }

  if (workspaceModeHeader === 'pilot' || workspaceModeHeader === 'real') {
    return PILOT_ORGANIZATION_ID;
  }
  if (workspaceModeHeader === 'demo') {
    return DEMO_ORGANIZATION_ID;
  }

  // 2. Check NextAuth session
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

  // 3. Dynamic workspace fallback (resolves to PILOT_ORGANIZATION_ID or DEMO_ORGANIZATION_ID)
  return getDefaultOrganizationId();
}

