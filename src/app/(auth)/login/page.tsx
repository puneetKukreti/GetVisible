'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DemoBadge } from '@/components/ui/demo-badge';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@leadforge.example');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // In explicit demo mode or test credentials:
    if (email === 'admin@leadforge.example' && password === 'demo123') {
      setTimeout(() => {
        router.push('/dashboard');
      }, 300);
      return;
    }

    // Default simulation/redirect
    setTimeout(() => {
      router.push('/dashboard');
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground mx-auto flex items-center justify-center font-bold shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            LeadForge <span className="text-primary">AI</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Website Agency Lead Discovery & Pipeline Operating System
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Sign in to your agency</CardTitle>
              <DemoBadge size="sm" />
            </div>
            <CardDescription className="text-xs">
              Access your scoped organization leads, audits, and pipeline.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-2.5 rounded text-xs bg-destructive/10 text-destructive border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Work Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@leadforge.example"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full gap-1.5" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-3 rounded-md bg-muted/50 border border-border text-xs space-y-1">
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>Pre-filled Sandbox Credentials</span>
                  <span className="text-[10px] text-primary">ADMIN</span>
                </div>
                <div className="text-muted-foreground text-[11px]">
                  Email: <code className="text-foreground">admin@leadforge.example</code>
                </div>
                <div className="text-muted-foreground text-[11px]">
                  Password: <code className="text-foreground">demo123</code>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                  Scoped to: <span className="font-medium text-foreground">Gurgaon CA Agency HQ (org-demo-gurgaon)</span>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Anti-spam & Compliance Notice */}
        <div className="p-3 rounded-lg border border-border/80 bg-card/40 flex items-start gap-2.5 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-semibold text-foreground">Ethical Discovery & Zero Spam: </span>
            LeadForge strictly relies on legitimate public business registries. Automated bulk outreach without human approval is strictly disabled by system architecture.
          </div>
        </div>
      </div>
    </div>
  );
}
