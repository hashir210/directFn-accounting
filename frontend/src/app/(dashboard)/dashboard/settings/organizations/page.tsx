'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/useAuth';
import { apiFetch, ApiError } from '@/lib/api';
import { Building2, Loader2, Plus, Mail, Users, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OrgSummary {
  id: string;
  name: string;
  plan: string | null;
  status: string;
  isPlatform: boolean;
  contactEmail?: string;
  maxUsers?: number;
  _count: { users: number };
}

export default function OrganizationsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [orgName, setOrgName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [maxUsers, setMaxUsers] = useState(5);
  const [password, setPassword] = useState('');
  const [planId, setPlanId] = useState('');
  const [availablePlans, setAvailablePlans] = useState<{ id: string; name: string; description: string }[]>([]);

  const fetchOrgs = async () => {
    try {
      setIsLoading(true);
      const [orgsData, plansData] = await Promise.all([
        apiFetch<OrgSummary[]>('/api/v1/platform/organizations'),
        apiFetch<{ id: string; name: string; description: string }[]>('/api/v1/platform/plans'),
      ]);
      setOrgs(orgsData);
      setAvailablePlans(plansData);
      if (!planId && plansData.length > 0) {
        setPlanId(plansData[0].id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchOrgs();
  }, [isAuthenticated]);

  // Tenant provisioning is platform-only (FinFlow). Redirect tenants away.
  useEffect(() => {
    if (!loading && isAuthenticated && !user?.isPlatformOrg) {
      router.replace('/dashboard');
    }
  }, [loading, isAuthenticated, user, router]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    setSuccess('');

    try {
      await apiFetch('/api/v1/platform/organizations', {
        method: 'POST',
        body: JSON.stringify({
          orgName,
          ownerEmail,
          ownerName,
          password,
          contactEmail,
          maxUsers: parseInt(maxUsers.toString()),
          planId: planId || undefined,
        }),
      });
      setSuccess('Organization created successfully!');
      setShowCreateForm(false);
      setOrgName('');
      setOwnerEmail('');
      setOwnerName('');
      setContactEmail('');
      setMaxUsers(5);
      setPassword('');
      setPlanId(availablePlans.length > 0 ? availablePlans[0].id : '');
      fetchOrgs();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create organization');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading organizations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Building2 className="h-4 w-4" />
            <span>Administration</span>
            <span className="text-xs">&gt;</span>
            <span className="font-semibold text-foreground">B2B Clients</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Provision and manage tenant organizations and set limits.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          {showCreateForm ? 'Cancel' : 'New Organization'}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm rounded-lg font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {showCreateForm && (
        <Card className="border-primary/20 shadow-sm bg-muted/20">
          <CardHeader>
            <CardTitle className="text-lg">Provision New Tenant</CardTitle>
            <CardDescription>Create a new organization and default owner account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Organization Name</label>
                  <Input required value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Corp" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Contact Email (Billing/Admin)</label>
                  <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="billing@acme.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Owner Name</label>
                  <Input required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Owner Login Email</label>
                  <Input required type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="jane@acme.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Initial Password</label>
                  <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Secure password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Max Users Allowed</label>
                  <Input required type="number" min="1" value={maxUsers} onChange={(e) => setMaxUsers(parseInt(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Subscription Plan</label>
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {availablePlans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={isCreating} className="w-full md:w-auto">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Provision Organization
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orgs.map((org) => (
          <Card key={org.id} className="hover:border-primary/30 transition-colors shadow-2xs">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  {org.name}
                </CardTitle>
                <Badge variant={org.status === 'active' ? 'secondary' : 'outline'} className={org.status === 'active' ? 'bg-emerald-50 text-emerald-600' : ''}>
                  {org.status}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                <Mail className="h-3 w-3" /> {org.contactEmail || 'No contact email'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium uppercase flex items-center gap-1">
                    <Users className="h-3 w-3" /> Users
                  </span>
                  <div className="text-xl font-bold">
                    {org._count.users} <span className="text-sm text-muted-foreground font-normal">/ {org.maxUsers || 5}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium uppercase">Type</span>
                  <div className="text-sm font-semibold mt-1">
                    {org.isPlatform ? 'Platform HQ' : 'Tenant Client'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {orgs.length === 0 && !showCreateForm && (
          <div className="col-span-full py-12 text-center text-muted-foreground border rounded-xl bg-muted/10">
            No organizations found.
          </div>
        )}
      </div>
    </div>
  );
}
