import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { DemoModeBanner } from '@/components/ui/demo-badge';
import { getServerWorkspaceMode } from '@/lib/workspace';
import { OWNER_AUTH_COOKIE, verifyOwnerSessionToken } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defence in depth: the edge middleware also gates these pages, but the
  // dashboard must never render operator data if the middleware is bypassed,
  // misconfigured or skipped. Fails closed when no valid session is present.
  const sessionToken = cookies().get(OWNER_AUTH_COOKIE)?.value;
  if (!(await verifyOwnerSessionToken(sessionToken))) {
    redirect('/login');
  }

  const mode = await getServerWorkspaceMode();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DemoModeBanner mode={mode} />
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
