'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Send,
  UserPlus,
  FileCode,
  FileSpreadsheet,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Zap,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CORE_NAV_ITEMS: NavItem[] = [
  {
    title: 'Outreach Workbench',
    href: '/campaigns',
    icon: Send,
  },
  {
    title: 'Add / Import Leads',
    href: '/discovery',
    icon: UserPlus,
  },
  {
    title: 'Demos & Templates',
    href: '/demos',
    icon: FileCode,
  },
  {
    title: 'Proposals & PDF',
    href: '/proposals',
    icon: FileSpreadsheet,
  },
  {
    title: 'Pipeline Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Fallback
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-sm flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Link href="/campaigns" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-base shadow-sm">
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-0.5">
              Get<span className="text-primary">Visible</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">Solo Operator Platform</span>
          </div>
        </Link>
      </div>

      {/* Target Focus Chip */}
      <div className="mx-3 my-3 p-2.5 rounded-lg bg-muted/40 border border-border/60">
        <div className="text-[11px] font-semibold text-foreground flex items-center justify-between">
          <span>Active Pipeline</span>
          <span className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded font-mono">
            LIVE
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 font-medium">Local SMBs &amp; CA Practices</div>
      </div>

      {/* 4 Core Navigation Items */}
      <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Core Operations
        </div>
        <div className="space-y-1">
          {CORE_NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === '/demos' && pathname.startsWith('/demo-preview')) ||
              (item.href !== '/campaigns' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Secondary Bottom Links (CRM Table, Settings, Lock / Logout) */}
      <div className="p-3 border-t border-border bg-muted/20 space-y-1">
        <div className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          System
        </div>

        <Link
          href="/leads"
          className={cn(
            'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors',
            pathname === '/leads' || pathname.startsWith('/leads/')
              ? 'bg-muted text-foreground font-semibold'
              : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          )}
        >
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span>CRM Table (/leads)</span>
        </Link>

        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors',
            pathname === '/settings'
              ? 'bg-muted text-foreground font-semibold'
              : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          )}
        >
          <Settings className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Settings</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-medium mt-1"
        >
          {loggingOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          )}
          <span>{loggingOut ? 'Locking…' : 'Lock / Logout'}</span>
        </button>
      </div>
    </aside>
  );
}
