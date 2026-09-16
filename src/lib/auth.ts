import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { DEMO_ORGANIZATION_ID } from './db/demo-data';

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
        email: { label: 'Email', type: 'email', placeholder: 'admin@leadforge.example' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Explicit demo login or credential validation
        if (
          credentials?.email === 'admin@leadforge.example' &&
          credentials?.password === 'demo123'
        ) {
          return {
            id: 'demo-user-admin',
            name: 'Demo Admin',
            email: 'admin@leadforge.example',
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
