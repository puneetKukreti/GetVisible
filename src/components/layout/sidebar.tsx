'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Search,
  Globe2,
  FileCode,
  Send,
  Inbox,
  FileSpreadsheet,
  Building2,
  Laptop,
  BarChart3,
  Settings,
  ShieldCheck,
  Zap,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  phase2?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Leads', href: '/leads', icon: Users },
  { title: 'Discovery', href: '/discovery', icon: Search },
  { title: 'Demos Hub', href: '/demos', icon: FileCode },
  { title: 'CA Templates (7)', href: '/demo-preview/templates', icon: Award },
  { title: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-base shadow-sm">
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-0.5">
              Get<span className="text-primary">Visible</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">Get your business seen online</span>
          </div>
        </Link>
      </div>

      {/* Target Niche Callout */}
      <div className="mx-3 my-3 p-2.5 rounded-md bg-muted/50 border border-border/60">
        <div className="text-[11px] font-semibold text-foreground flex items-center justify-between">
          <span>Active Focus</span>
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">MVP Focus</span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 font-medium">Chartered Accountants</div>
        <div className="text-[11px] text-muted-foreground/80">Multi-Industry Enabled</div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Platform
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group select-none',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn('w-4 h-4 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                <span>{item.title}</span>
              </div>
              {item.phase2 && (
                <span className="text-[9px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground/80 border border-border/50">
                  Phase 2
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Safety & Compliance Badge Footer */}
      <div className="p-3 border-t border-border bg-muted/20">
        <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="text-[11px] leading-tight">
            <span className="font-semibold block">Zero-Spam Protected</span>
            <span className="text-[10px] text-muted-foreground">Human sign-off enforced</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
