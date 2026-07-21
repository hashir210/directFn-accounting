'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { ApiError } from '@/lib/api';

function LoginPageInner() {
  const router = useRouter();
  const { login, complete2fa, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId');

  useEffect(() => {
    if (!orgId) {
      router.replace('/workspace');
    }
    // Only run on initial mount to clear existing session
    logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, router]);

  // Two-factor authentication flow
  const [twoFactor, setTwoFactor] = useState(false);
  const [preAuthToken, setPreAuthToken] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (!orgId) {
        throw new Error('Organization ID is missing. Please select a workspace.');
      }
      const result = await login(email, password, orgId);
      if (result.twoFactorRequired && result.preAuthToken) {
        setPreAuthToken(result.preAuthToken);
        setTwoFactor(true);
        setIsLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handle2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await complete2fa(preAuthToken, code);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid authentication code.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              {twoFactor ? 'Enter the 6-digit code from your authenticator app' : 'Login to your workspace'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {twoFactor ? (
              <form onSubmit={handle2fa}>
                <div className="grid gap-6">
                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">
                      {error}
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="code">Authentication Code</Label>
                    <Input
                      id="code"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full cursor-pointer" disabled={isLoading || code.length !== 6}>
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">
                      {error}
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href={`/forgot-password?orgId=${orgId}`}
                        className="ml-auto underline-offset-4 hover:underline text-xs"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Want to access a different workspace?{' '}
                  <Link href="/workspace" className="underline underline-offset-4 font-semibold text-primary">
                    Change Workspace
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-svh items-center justify-center text-muted-foreground">Loading...</div>}>
      <LoginPageInner />
    </Suspense>
  );
}
