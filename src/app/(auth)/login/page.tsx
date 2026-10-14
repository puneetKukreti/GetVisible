'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your owner password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid owner password');
      }

      // Successful authentication -> navigate to solo outreach workbench
      router.push('/campaigns');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid owner password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground mx-auto flex items-center justify-center font-bold shadow-md">
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Get<span className="text-primary">Visible</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Solo Operator Sales &amp; Website Outreach Platform
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-lg font-bold flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <span>Owner Access</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your password to unlock the outreach workbench.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg text-xs bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Owner Password</span>
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password…"
                  autoFocus
                  required
                  className="text-sm h-10"
                />
              </div>

              <Button type="submit" className="w-full gap-2 text-xs h-10 font-bold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying…</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Workbench</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground">
          Protected solo workstation · Client demo links remain 100% public
        </p>
      </div>
    </div>
  );
}
