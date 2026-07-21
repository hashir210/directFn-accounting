'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { apiFetch, ApiError } from '@/lib/api';
import { CreditCard, Loader2, Users, Shield, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface OrgPlan {
  id: string;
  name: string;
  status: string;
  maxUsers: number | null;
  contactEmail: string | null;
  plan: { id: string; name: string; description: string } | null;
  planFeatures: string[];
  userCount: number;
}

export default function SubscriptionPlanPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [orgPlan, setOrgPlan] = useState<OrgPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    setIsLoading(true);
    setError('');
    apiFetch<OrgPlan>('/api/v1/organizations/current/plan')
      .then(setOrgPlan)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load subscription info'))
      .finally(() => setIsLoading(false));
  }, [loading, isAuthenticated, router]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!orgPlan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {error || 'Unable to load subscription information.'}
          </CardContent>
        </Card>
      </div>
    );
  }

  const planName = orgPlan.plan?.name || 'Free';
  const planDesc = orgPlan.plan?.description || 'Basic access with limited features.';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <CreditCard className="h-4 w-4" />
            <span>Subscription</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Your Subscription Plan</h1>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/settings')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">{error}</div>
      )}

      {/* Plan Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {planName}
              <Badge variant={orgPlan.status === 'active' ? 'default' : 'destructive'}>{orgPlan.status}</Badge>
            </CardTitle>
            <CardDescription>{planDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Organization</div>
                <div className="font-semibold">{orgPlan.name}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Contact Email</div>
                <div className="font-semibold">{orgPlan.contactEmail || 'Not set'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgPlan.userCount}</div>
            <div className="text-xs text-muted-foreground">
              of {orgPlan.maxUsers ?? '∞'} max
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allowed Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Plan Features
          </CardTitle>
          <CardDescription>Features included in your subscription plan.</CardDescription>
        </CardHeader>
        <CardContent>
          {orgPlan.planFeatures.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              No plan features configured yet. Contact your platform admin.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {orgPlan.planFeatures.map((feature) => (
                <Badge key={feature} variant="secondary" className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  {feature}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
