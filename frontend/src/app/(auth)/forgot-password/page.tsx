'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { apiFetch, ApiError } from '@/lib/api';

function ForgotPasswordInner() {
  const searchParams = useSearchParams();
  const orgIdParam = searchParams.get('orgId');

  const [email, setEmail] = useState('');
  const [organizationId, setOrganizationId] = useState(orgIdParam || '');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await apiFetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email, organizationId }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.08),transparent_50%)]" />

      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center items-center space-y-3 pb-2">
            <div className="h-11 w-11 rounded-lg bg-gradient-to-tr from-primary to-emerald-400 p-0.5 flex items-center justify-center shadow-sm">
            <div className="h-full w-full rounded-md bg-primary flex items-center justify-center">
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <CardTitle className="text-xl">Recover password</CardTitle>
            <CardDescription className="mt-1">
              Enter your email and organization to receive a recovery link
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-ping" />
              {error}
            </div>
          )}
          {success ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-md space-y-3">
              <h4 className="text-sm font-semibold">Reset link sent!</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                If the email exists in our database, you will receive reset instructions shortly.
              </p>
              <Link
                href={`/login?orgId=${organizationId}`}
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgId">Organization ID</Label>
                <Input
                  id="orgId"
                  type="text"
                  required
                  placeholder="Enter your organization ID"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  disabled={isLoading || !!orgIdParam}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Corporate Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  className="pl-9"
                />
              </div>
            </div>

              <Button type="submit" disabled={isLoading} className="w-full cursor-pointer">
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  'Send Recovery Instructions'
                )}
              </Button>

              <div className="text-center">
                <Link
                  href={`/login?orgId=${organizationId}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Return to Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center text-muted-foreground">Loading...</div>}>
      <ForgotPasswordInner />
    </Suspense>
  );
}
