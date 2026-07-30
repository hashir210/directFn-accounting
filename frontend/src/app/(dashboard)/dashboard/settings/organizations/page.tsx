'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch, ApiError } from '@/lib/api';
import { Building2, Loader2, Plus, Mail, Users, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const orgSchema = z.object({
  orgName: z.string().min(1, 'Organization Name is required'),
  contactEmail: z.string().email('Invalid email').or(z.literal('')),
  ownerName: z.string().min(1, 'Owner Name is required'),
  ownerEmail: z.string().min(1, 'Owner Email is required').email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  maxUsers: z.coerce.number().min(1, 'Minimum 1 user'),
  planId: z.string().optional(),
});
type OrgFormValues = z.infer<typeof orgSchema>;

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
  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      orgName: '',
      contactEmail: '',
      ownerName: '',
      ownerEmail: '',
      password: '',
      maxUsers: 5,
      planId: '',
    }
  });

  const [availablePlans, setAvailablePlans] = useState<{ id: string; name: string; description: string }[]>([]);

  const fetchOrgs = async () => {
    try {
      setIsLoading(true);
      const [orgsData, plansData] = await Promise.all([
        apiFetch<OrgSummary[]>('/api/v1/platform/organizations'),
        apiFetch<{ id: string; name: string; description: string }[]>('/api/v1/platform/plans'),
      ]);
      setOrgs(orgsData.filter(o => !o.isPlatform));
      setAvailablePlans(plansData);
      if (!form.getValues('planId') && plansData.length > 0) {
        form.setValue('planId', plansData[0].id);
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

  const onSubmit = async (data: OrgFormValues) => {
    setIsCreating(true);
    setError('');
    setSuccess('');

    try {
      await apiFetch('/api/v1/platform/organizations', {
        method: 'POST',
        body: JSON.stringify({
          orgName: data.orgName,
          ownerEmail: data.ownerEmail,
          ownerName: data.ownerName,
          password: data.password,
          contactEmail: data.contactEmail,
          maxUsers: data.maxUsers,
          planId: data.planId || undefined,
        }),
      });
      setSuccess('Organization created successfully!');
      setShowCreateForm(false);
      form.reset();
      if (availablePlans.length > 0) {
        form.setValue('planId', availablePlans[0].id);
      }
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
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">Organizations</h1>
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
        <Alert variant="destructive" className="p-3"><AlertDescription className="font-semibold">{ error }</AlertDescription></Alert>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Organization Name</label>
                  <Input placeholder="Acme Corp" {...form.register('orgName')} />
                  {form.formState.errors.orgName && <p className="text-xs text-destructive">{form.formState.errors.orgName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Contact Email (Billing/Admin)</label>
                  <Input type="email" placeholder="billing@acme.com" {...form.register('contactEmail')} />
                  {form.formState.errors.contactEmail && <p className="text-xs text-destructive">{form.formState.errors.contactEmail.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Owner Name</label>
                  <Input placeholder="Jane Doe" {...form.register('ownerName')} />
                  {form.formState.errors.ownerName && <p className="text-xs text-destructive">{form.formState.errors.ownerName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Owner Login Email</label>
                  <Input type="email" placeholder="jane@acme.com" {...form.register('ownerEmail')} />
                  {form.formState.errors.ownerEmail && <p className="text-xs text-destructive">{form.formState.errors.ownerEmail.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Initial Password</label>
                  <Input type="password" placeholder="Secure password" {...form.register('password')} />
                  {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Max Users Allowed</label>
                  <Input type="number" min="1" {...form.register('maxUsers')} />
                  {form.formState.errors.maxUsers && <p className="text-xs text-destructive">{form.formState.errors.maxUsers.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Subscription Plan</label>
                  <Controller
                    control={form.control}
                    name="planId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePlans.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
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
          <Card key={org.id} className="hover:border-primary/30 transition-colors shadow-sm">
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
