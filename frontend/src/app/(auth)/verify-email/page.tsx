'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle2, XCircle, ArrowLeft, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch, ApiError } from '@/lib/api';

function VerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>(
    token ? 'loading' : 'idle'
  );
  const [message, setMessage] = useState('');
  
  // Resend state
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!token) return;

    let mounted = true;
    const verifyToken = async () => {
      try {
        const data = await apiFetch(`/api/v1/auth/verify-email?token=${token}`);
        if (mounted) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          // Redirect to login after a few seconds
          setTimeout(() => {
            if (mounted) router.push('/login');
          }, 3000);
        }
      } catch (err) {
        if (mounted) {
          setStatus('error');
          setMessage(err instanceof ApiError ? err.message : 'Verification failed. The link may have expired.');
        }
      }
    };

    verifyToken();
    return () => { mounted = false; };
  }, [token, router]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResending(true);
    setResendStatus('idle');
    try {
      await apiFetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setResendStatus('success');
      setMessage('A new verification link has been sent to your email.');
    } catch (err) {
      setResendStatus('error');
      setMessage(err instanceof ApiError ? err.message : 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.08),transparent_50%)]" />

      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center items-center space-y-3 pb-2">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-primary to-emerald-400 p-0.5 flex items-center justify-center shadow-sm">
            <div className="h-full w-full rounded-[10px] bg-[#7c3aed] flex items-center justify-center">
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <CardTitle className="text-xl">Email Verification</CardTitle>
            <CardDescription className="mt-1">
              {status === 'loading' ? 'Verifying your email address...' : 
               status === 'success' ? 'Your email has been verified' :
               status === 'error' ? 'Verification failed' :
               'Check your email or request a new link'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Checking your verification token...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{message}</p>
              <p className="text-xs text-muted-foreground">Redirecting you to login...</p>
            </div>
          )}

          {(status === 'error' || status === 'idle') && (
            <div className="space-y-4">
              {status === 'error' && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex flex-col items-center text-center space-y-2">
                  <XCircle className="h-6 w-6 mb-1" />
                  <p className="text-sm font-medium">{message}</p>
                </div>
              )}
              
              {status === 'idle' && resendStatus === 'idle' && (
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg text-center space-y-2">
                  <Mail className="h-6 w-6 mx-auto text-primary opacity-80" />
                  <p className="text-sm text-muted-foreground">
                    We sent a verification link to your email address during registration. 
                    Please check your inbox.
                  </p>
                </div>
              )}

              {resendStatus === 'success' && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg space-y-1 text-center">
                  <CheckCircle2 className="h-5 w-5 mx-auto mb-2" />
                  <p className="text-sm font-medium">{message}</p>
                </div>
              )}

              {resendStatus === 'error' && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-ping" />
                  {message}
                </div>
              )}

              {resendStatus !== 'success' && (
                <form onSubmit={handleResend} className="space-y-4 pt-2 border-t mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Need a new link?
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isResending}
                        className="pl-9 h-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isResending} className="w-full h-10 cursor-pointer" variant="outline">
                    {isResending ? (
                      <div className="h-4 w-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                    ) : (
                      'Resend Verification Email'
                    )}
                  </Button>
                </form>
              )}

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
