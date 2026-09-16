'use client';

import React, { useState, useEffect } from 'react';
import { Building, Moon, Sun, ShieldAlert, LogOut, User } from 'lucide-react';
import { DemoBadge } from '@/components/ui/demo-badge';
import { Button } from '@/components/ui/button';

export function Header() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
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

  return (
    <header className="h-14 border-b border-border bg-card/60 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-xs font-medium text-foreground">
          <Building className="w-3.5 h-3.5 text-primary" />
          <span>Gurgaon CA Agency HQ</span>
          <span className="text-[10px] text-muted-foreground font-mono">org-demo-gurgaon</span>
        </div>
        <DemoBadge />
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
            <span className="text-xs font-medium text-foreground leading-none">Demo Admin</span>
            <span className="text-[10px] text-muted-foreground">admin@leadforge.example</span>
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
