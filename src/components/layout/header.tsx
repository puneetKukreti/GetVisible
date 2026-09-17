'use client';

import React, { useState, useEffect } from 'react';
import { Building, Moon, Sun, LogOut, User, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { DemoBadge } from '@/components/ui/demo-badge';
import { Button } from '@/components/ui/button';
import { getActiveWorkspaceMode, WORKSPACE_CONFIGS, WorkspaceMode } from '@/lib/workspace';

export function Header() {
  const [isDark, setIsDark] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('demo');

  useEffect(() => {
    // Determine active workspace mode
    setWorkspaceMode(getActiveWorkspaceMode());

    // Check initial dark mode preference
    if (
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const switchWorkspaceMode = (targetMode: WorkspaceMode) => {
    document.cookie = `getvisible_workspace_mode=${targetMode}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `leadforge_workspace_mode=${targetMode}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  const config = WORKSPACE_CONFIGS[workspaceMode] || WORKSPACE_CONFIGS.demo;

  return (
    <header className="h-14 border-b border-border bg-card/60 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-xs font-medium text-foreground">
          <Building className="w-3.5 h-3.5 text-primary" />
          <span>{config.name}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{config.organizationId}</span>
        </div>
        <DemoBadge variant={workspaceMode} />

        {/* Workspace Switcher */}
        <div className="flex items-center border-l border-border pl-3 ml-1">
          {workspaceMode === 'demo' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => switchWorkspaceMode('pilot')}
              className="h-7 px-2 text-xs border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 gap-1.5"
              title="Switch to Real Sales Pilot workspace (zero fake data)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Switch to Pilot Workspace</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => switchWorkspaceMode('demo')}
              className="h-7 px-2 text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 gap-1.5"
              title="Switch to Demo Sandbox workspace (with simulated CA leads)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Switch to Demo Mode</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="text-muted-foreground hover:text-foreground"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* User profile capsule */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-medium text-foreground leading-none">
              {workspaceMode === 'pilot' ? 'Sales Pilot Specialist' : 'Demo Admin'}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {workspaceMode === 'pilot' ? 'specialist@pilot.getvisible.ai' : 'admin@getvisible.example'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-destructive gap-1 ml-1"
            onClick={() => {
              window.location.href = '/login';
            }}
            title="Sign out of current session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
