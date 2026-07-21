'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/features/auth/useAuth';
import { apiFetch, ApiError } from '@/lib/api';
import { Shield, Building2, Users, DollarSign, Loader2, ArrowLeft, Pencil, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PlanOption {
  id: string;
  name: string;
}

interface OrgSummary {
  id: string;
  name: string;
  planId?: string | null;
  plan: { id: string; name: string } | null;
  status: string;
  isPlatform: boolean;
  maxUsers?: number | null;
  contactEmail?: string | null;
  createdAt: string;
  _count: { users: number; invoices: number; customers: number };
}

interface PlatformStats {
  totalOrganizations: number;
  totalUsers: number;
  totalInvoiced: number;
  totalPaid: number;
  totalExpenses: number;
  invoiceCount: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, hasPermission } = useAuth();
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Provision Tenant Modal State
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgPlanId, setNewOrgPlanId] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newMaxUsers, setNewMaxUsers] = useState('5');
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Edit Limits & Plan Modal State
  const [isLimitsModalOpen, setIsLimitsModalOpen] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editPlanId, setEditPlanId] = useState<string>('');
  const [editMaxUsers, setEditMaxUsers] = useState<string>('');
  const [editContactEmail, setEditContactEmail] = useState<string>('');
  const [isSavingLimits, setIsSavingLimits] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!loading && (!user?.isPlatformOrg || !hasPermission('platform.view'))) {
      router.replace('/dashboard');
      return;
    }
  }, [loading, isAuthenticated, user, hasPermission, router]);

  const fetchData = useCallback(async () => {
    try {
      const [orgsData, statsData, plansData] = await Promise.all([
        apiFetch<OrgSummary[]>('/api/v1/platform/organizations'),
        apiFetch<PlatformStats>('/api/v1/platform/stats'),
        apiFetch<PlanOption[]>('/api/v1/platform/plans'),
      ]);
      setOrgs(orgsData);
      setStats(statsData);
      setPlans(plansData);
      if (plansData.length > 0 && !newOrgPlanId) {
        setNewOrgPlanId(plansData[0].id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load platform data');
    } finally {
      setIsLoading(false);
    }
  }, [newOrgPlanId]);

  useEffect(() => { 
    if (isAuthenticated && hasPermission('platform.view')) fetchData(); 
  }, [isAuthenticated, hasPermission, fetchData]);

  // Handle Provisioning B2B Tenant
  const handleProvisionTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProvisioning(true);
    setError('');
    try {
      await apiFetch('/api/v1/platform/organizations', {
        method: 'POST',
        body: JSON.stringify({
          orgName: newOrgName,
          planId: newOrgPlanId || undefined,
          ownerName: newOwnerName,
          ownerEmail: newOwnerEmail,
          password: newOwnerPassword,
          contactEmail: newContactEmail || undefined,
          maxUsers: newMaxUsers ? parseInt(newMaxUsers, 10) : undefined,
        }),
      });
      setIsProvisionOpen(false);
      setNewOrgName('');
      setNewOwnerName('');
      setNewOwnerEmail('');
      setNewOwnerPassword('');
      setNewContactEmail('');
      setNewMaxUsers('5');
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to provision tenant organization');
    } finally {
      setIsProvisioning(false);
    }
  };

  // Toggle Org Active/Suspended Status
  const handleToggleOrgStatus = async (orgId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await apiFetch(`/api/v1/platform/organizations/${orgId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to update status');
    }
  };

  // Open Edit Limits & Plan Modal
  const openEditLimitsModal = (org: OrgSummary) => {
    setEditingOrgId(org.id);
    setEditPlanId(org.planId || org.plan?.id || (plans.length > 0 ? plans[0].id : ''));
    setEditMaxUsers(org.maxUsers?.toString() || '');
    setEditContactEmail(org.contactEmail || '');
    setIsLimitsModalOpen(true);
  };

  const handleSaveLimits = async () => {
    if (!editingOrgId) return;
    setIsSavingLimits(true);
    try {
      await apiFetch(`/api/v1/platform/organizations/${editingOrgId}/limits`, {
        method: 'PATCH',
        body: JSON.stringify({
          planId: editPlanId || null,
          maxUsers: editMaxUsers ? parseInt(editMaxUsers, 10) : null,
          contactEmail: editContactEmail || null,
        }),
      });
      setIsLimitsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to save organization details');
    } finally {
      setIsSavingLimits(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Shield className="h-4 w-4 text-primary" />
              <span>FinFlow Platform Administration</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Platform Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push('/admin/plans')} className="cursor-pointer">
              Configure Subscription Tiers
            </Button>

            {/* Provision New B2B Tenant Modal */}
            <Dialog open={isProvisionOpen} onOpenChange={setIsProvisionOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Provision B2B Tenant
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleProvisionTenant}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" /> Provision B2B Client Organization
                    </DialogTitle>
                    <DialogDescription>
                      Create a new client organization on FinFlow and set up their owner account.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {error && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="org-name">Organization Name</Label>
                      <Input id="org-name" required value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} placeholder="Acme Global Financial" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="org-plan">Subscription Plan Tier</Label>
                      <select
                        id="org-plan"
                        className="w-full h-9 px-3 py-1 bg-background border rounded-md text-xs font-medium focus:ring-2 focus:ring-primary cursor-pointer"
                        value={newOrgPlanId}
                        onChange={(e) => setNewOrgPlanId(e.target.value)}
                      >
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="owner-name">Owner Name</Label>
                        <Input id="owner-name" placeholder="Sarah Jenkins" value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="owner-email">Owner Email</Label>
                        <Input id="owner-email" type="email" required placeholder="sarah@acme.com" value={newOwnerEmail} onChange={(e) => setNewOwnerEmail(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="owner-pass">Initial Password</Label>
                      <Input id="owner-pass" type="password" required placeholder="••••••••" value={newOwnerPassword} onChange={(e) => setNewOwnerPassword(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact-email">Billing Email</Label>
                        <Input id="contact-email" type="email" placeholder="billing@acme.com" value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-users">Max Users Allowed</Label>
                        <Input id="max-users" type="number" value={newMaxUsers} onChange={(e) => setNewMaxUsers(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isProvisioning} className="cursor-pointer">
                      {isProvisioning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Provision B2B Tenant
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={() => router.push('/dashboard')} className="cursor-pointer">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalInvoiced.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Collected</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">${stats.totalPaid.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Organizations Management Table */}
        <Card>
          <CardHeader>
            <CardTitle>B2B Client Organizations ({orgs.length})</CardTitle>
            <CardDescription>
              Manage tenant client organizations, change subscription tiers (revoke/grant screen access), and control account statuses.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization Name</TableHead>
                  <TableHead>Subscription Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active Users</TableHead>
                  <TableHead>Max Limit</TableHead>
                  <TableHead>Billing Email</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Controls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No client organizations found
                    </TableCell>
                  </TableRow>
                ) : (
                  orgs.map((org) => {
                    return (
                      <TableRow key={org.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-bold text-xs">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary shrink-0" />
                            {org.name}
                            {org.isPlatform && (
                              <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">
                                Platform HQ
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-semibold">
                            {org.plan?.name || 'Free'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={org.status === 'active' ? 'secondary' : 'destructive'}
                            className={`text-[10px] capitalize cursor-pointer ${
                              org.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''
                            }`}
                            onClick={() => !org.isPlatform && handleToggleOrgStatus(org.id, org.status)}
                          >
                            {org.status === 'active' ? <CheckCircle2 className="h-3 w-3 mr-1 inline" /> : <AlertCircle className="h-3 w-3 mr-1 inline" />}
                            {org.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{org._count.users} members</TableCell>
                        <TableCell className="text-xs font-medium">{org.maxUsers || '∞'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{org.contactEmail || 'N/A'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openEditLimitsModal(org)}
                            className="text-xs h-8 cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1 text-primary" /> Edit Plan & Limits
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Plan & Limits Modal */}
      <Dialog open={isLimitsModalOpen} onOpenChange={setIsLimitsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Subscription Tier & Limits</DialogTitle>
            <DialogDescription>
              Changing the subscription plan tier will instantly update allowed features and revoke/grant screen access for this organization.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Subscription Plan Tier</Label>
              <select
                className="w-full h-9 px-3 py-1 bg-background border rounded-md text-xs font-medium focus:ring-2 focus:ring-primary cursor-pointer"
                value={editPlanId}
                onChange={(e) => setEditPlanId(e.target.value)}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Max User Limit</Label>
              <Input
                type="number"
                placeholder="e.g. 10 (leave blank for unlimited)"
                value={editMaxUsers}
                onChange={(e) => setEditMaxUsers(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Contact / Billing Email</Label>
              <Input
                type="email"
                placeholder="billing@company.com"
                value={editContactEmail}
                onChange={(e) => setEditContactEmail(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveLimits} disabled={isSavingLimits} className="cursor-pointer">
              {isSavingLimits ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
