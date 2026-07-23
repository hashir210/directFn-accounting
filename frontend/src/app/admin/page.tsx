'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/useAuth';
import { apiFetch, ApiError } from '@/lib/api';
import { Building2, Users, DollarSign, Loader2, Plus, CheckCircle2, AlertCircle, Mail, Globe, MapPin, Clock, Hash, Pencil, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface PlanOption { id: string; name: string; }

interface OrgSummary {
  id: string; name: string; planId?: string | null;
  plan: { id: string; name: string } | null;
  status: string; isPlatform: boolean;
  maxUsers?: number | null;
  contactEmail?: string | null; gstVatNumber?: string | null;
  address?: string | null; fiscalYear?: string | null;
  currency?: string | null; timeZone?: string | null; logoUrl?: string | null;
  createdAt: string;
  _count: { users: number; invoices: number; customers: number };
}

interface PlatformStats {
  totalOrganizations: number; totalUsers: number;
  totalInvoiced: number; totalPaid: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, hasPermission } = useAuth();
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    orgName: '', ownerName: '', ownerEmail: '', password: '',
    contactEmail: '', maxUsers: '5', planId: '',
    address: '', gstVatNumber: '', fiscalYear: 'jan-dec', currency: 'PKR', timeZone: 'UTC-5',
  });
  const [isRegistering, setIsRegistering] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '', contactEmail: '', gstVatNumber: '', address: '',
    fiscalYear: 'jan-dec', currency: 'PKR', timeZone: 'UTC-5', logoUrl: '',
    planId: '', maxUsers: '5',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) { router.replace('/login'); return; }
    if (!loading && (!user?.isPlatformOrg || !hasPermission('platform.view'))) { router.replace('/dashboard'); return; }
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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load platform data');
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    if (isAuthenticated && hasPermission('platform.view')) fetchData();
  }, [isAuthenticated, hasPermission, fetchData]);

  const openRegister = () => {
    setRegForm({ orgName: '', ownerName: '', ownerEmail: '', password: '', contactEmail: '', maxUsers: '5', planId: plans[0]?.id || '', address: '', gstVatNumber: '', fiscalYear: 'jan-dec', currency: 'PKR', timeZone: 'UTC-5' });
    setError('');
    setIsRegisterOpen(true);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setError('');
    try {
      await apiFetch('/api/v1/platform/organizations', {
        method: 'POST',
        body: JSON.stringify({
          orgName: regForm.orgName, planId: regForm.planId || undefined,
          ownerName: regForm.ownerName, ownerEmail: regForm.ownerEmail,
          password: regForm.password, contactEmail: regForm.contactEmail || undefined,
          maxUsers: regForm.maxUsers ? parseInt(regForm.maxUsers, 10) : undefined,
        }),
      });
      const orgsList = await apiFetch<OrgSummary[]>('/api/v1/platform/organizations');
      const created = orgsList.find(o => o.name === regForm.orgName);
      if (created) {
        await apiFetch(`/api/v1/platform/organizations/${created.id}/settings`, { method: 'PATCH', body: JSON.stringify({ address: regForm.address || undefined, gstVatNumber: regForm.gstVatNumber || undefined, fiscalYear: regForm.fiscalYear, currency: regForm.currency, timeZone: regForm.timeZone }) });
      }
      setIsRegisterOpen(false);
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to register company');
    } finally { setIsRegistering(false); }
  };

  const toggleStatus = async (orgId: string, current: string) => {
    const next = current === 'active' ? 'suspended' : 'active';
    try {
      await apiFetch(`/api/v1/platform/organizations/${orgId}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      fetchData();
    } catch (err) { alert(err instanceof ApiError ? err.message : 'Failed'); }
  };

  const openEdit = (org: OrgSummary) => {
    setEditingOrgId(org.id);
    setEditForm({
      name: org.name || '', contactEmail: org.contactEmail || '',
      gstVatNumber: org.gstVatNumber || '', address: org.address || '',
      fiscalYear: org.fiscalYear || 'jan-dec', currency: org.currency || 'PKR',
      timeZone: org.timeZone || 'UTC-5', logoUrl: org.logoUrl || '',
      planId: org.planId || org.plan?.id || (plans.length > 0 ? plans[0].id : ''),
      maxUsers: org.maxUsers?.toString() || '5',
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingOrgId) return;
    setIsSavingEdit(true);
    try {
      await Promise.all([
        apiFetch(`/api/v1/platform/organizations/${editingOrgId}/settings`, { method: 'PATCH', body: JSON.stringify({ name: editForm.name, contactEmail: editForm.contactEmail || undefined, gstVatNumber: editForm.gstVatNumber || undefined, address: editForm.address || undefined, fiscalYear: editForm.fiscalYear, currency: editForm.currency, timeZone: editForm.timeZone, logoUrl: editForm.logoUrl || undefined }) }),
        apiFetch(`/api/v1/platform/organizations/${editingOrgId}/limits`, { method: 'PATCH', body: JSON.stringify({ planId: editForm.planId || null, maxUsers: editForm.maxUsers ? parseInt(editForm.maxUsers, 10) : null }) }),
      ]);
      setIsEditOpen(false);
      fetchData();
    } catch (err) { alert(err instanceof ApiError ? err.message : 'Failed to save'); }
    finally { setIsSavingEdit(false); }
  };

  if (loading || isLoading) {
    return <div className="flex items-center justify-center min-h-svh"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
            <p className="text-sm text-muted-foreground">Manage all registered tenant companies on FinFlow.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/plans')}>Plans</Button>
            <Button size="sm" onClick={openRegister}>
              <Plus className="h-4 w-4 mr-1" /> Register Company
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => router.push('/dashboard')} title="Back"><X className="h-4 w-4" /></Button>
          </div>
        </div>

        {error && <div className="p-2 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded">{error}</div>}

        {/* Stats — two compact cards */}
        {stats && (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <Card className="p-3 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary shrink-0" />
              <div><div className="text-lg font-bold">{stats.totalOrganizations}</div><div className="text-xs text-muted-foreground">Companies</div></div>
            </Card>
            <Card className="p-3 flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground shrink-0" />
              <div><div className="text-lg font-bold">{stats.totalUsers}</div><div className="text-xs text-muted-foreground">Users</div></div>
            </Card>
            <Card className="p-3 flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground shrink-0" />
              <div><div className="text-lg font-bold">PKR {stats.totalInvoiced.toLocaleString()}</div><div className="text-xs text-muted-foreground">Invoiced</div></div>
            </Card>
            <Card className="p-3 flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-emerald-500 shrink-0" />
              <div><div className="text-lg font-bold text-emerald-600">PKR {stats.totalPaid.toLocaleString()}</div><div className="text-xs text-muted-foreground">Collected</div></div>
            </Card>
          </div>
        )}

        {/* Company Cards */}
        {orgs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl bg-muted/10">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No companies registered yet. Click &quot;Register Company&quot; to add one.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => (
              <Card key={org.id} className="relative hover:shadow-md transition-shadow cursor-pointer border-border/60" onClick={() => openEdit(org)}>
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <CardTitle className="text-sm font-semibold truncate">{org.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={org.status === 'active' ? 'secondary' : 'destructive'} className={`text-[10px] h-5 px-1.5 ${org.status === 'active' ? 'bg-emerald-50 text-emerald-600' : ''}`}>
                        {org.status === 'active' ? <CheckCircle2 className="h-2.5 w-2.5 mr-0.5 inline" /> : <AlertCircle className="h-2.5 w-2.5 mr-0.5 inline" />}
                        {org.status}
                      </Badge>
                      <Button variant="ghost" size="icon-xs" className="h-6 w-6 -mr-1" onClick={(e) => { e.stopPropagation(); openEdit(org); }} title="Edit">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">{org.plan?.name || 'Free'}</span>
                    <span>{org._count.users}/{org.maxUsers || 5} users</span>
                  </div>
                  {org.contactEmail && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{org.contactEmail}</span></div>}
                  {org.address && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{org.address}</span></div>}
                  {org.gstVatNumber && <div className="flex items-center gap-1.5"><Hash className="h-3 w-3 shrink-0" /><span>{org.gstVatNumber}</span></div>}
                  <div className="flex items-center gap-1.5"><Globe className="h-3 w-3 shrink-0" />{org.currency || 'PKR'} &middot; {org.fiscalYear || 'jan-dec'} &middot; {org.timeZone || 'UTC-5'}</div>
                  <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 shrink-0" />{new Date(org.createdAt).toLocaleDateString()}</div>
                  <div className="flex gap-1.5 pt-1.5 border-t border-border/40 mt-1.5">
                    <Button variant="outline" size="xs" className="flex-1 h-7 text-[10px]" onClick={(e) => { e.stopPropagation(); openEdit(org); }}>Edit Details</Button>
                    <Button variant={org.status === 'active' ? 'destructive' : 'secondary'} size="xs" className="h-7 text-[10px]" onClick={(e) => { e.stopPropagation(); toggleStatus(org.id, org.status); }}>
                      {org.status === 'active' ? 'Suspend' : 'Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Register Modal */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleRegister}>
            <DialogHeader>
              <DialogTitle>Register New Company</DialogTitle>
              <DialogDescription>Create a new client company with owner account and details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Company Name</Label>
                <Input required value={regForm.orgName} onChange={(e) => setRegForm({ ...regForm, orgName: e.target.value })} placeholder="Acme Corp" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Contact Email</Label>
                  <Input type="email" value={regForm.contactEmail} onChange={(e) => setRegForm({ ...regForm, contactEmail: e.target.value })} placeholder="billing@acme.com" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">GST / VAT Number</Label>
                  <Input value={regForm.gstVatNumber} onChange={(e) => setRegForm({ ...regForm, gstVatNumber: e.target.value })} placeholder="GST-98420-DFN" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Address</Label>
                <Input value={regForm.address} onChange={(e) => setRegForm({ ...regForm, address: e.target.value })} placeholder="Address, City, Country" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Fiscal Year</Label>
                  <select className="w-full h-8 px-2 bg-background border rounded text-xs cursor-pointer" value={regForm.fiscalYear} onChange={(e) => setRegForm({ ...regForm, fiscalYear: e.target.value })}>
                    <option value="jan-dec">Jan-Dec</option>
                    <option value="apr-mar">Apr-Mar</option>
                    <option value="jul-jun">Jul-Jun</option>
                    <option value="oct-sep">Oct-Sep</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Currency</Label>
                  <select className="w-full h-8 px-2 bg-background border rounded text-xs cursor-pointer" value={regForm.currency} onChange={(e) => setRegForm({ ...regForm, currency: e.target.value })}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="PKR">PKR</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Time Zone</Label>
                  <select className="w-full h-8 px-2 bg-background border rounded text-xs cursor-pointer" value={regForm.timeZone} onChange={(e) => setRegForm({ ...regForm, timeZone: e.target.value })}>
                    <option value="UTC-5">EST</option>
                    <option value="UTC+0">GMT</option>
                    <option value="UTC+5">PKT</option>
                    <option value="UTC+4">GST</option>
                  </select>
                </div>
              </div>
              <div className="border-t pt-3">
                <h4 className="text-xs font-semibold mb-2">Owner Account & Subscription</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Owner Name</Label>
                    <Input value={regForm.ownerName} onChange={(e) => setRegForm({ ...regForm, ownerName: e.target.value })} placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Owner Email</Label>
                    <Input type="email" required value={regForm.ownerEmail} onChange={(e) => setRegForm({ ...regForm, ownerEmail: e.target.value })} placeholder="jane@acme.com" />
                  </div>
                </div>
                <div className="space-y-1.5 mt-2">
                  <Label className="text-xs">Initial Password</Label>
                  <Input type="password" required value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} placeholder="••••••••" />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Plan</Label>
                    <select className="w-full h-8 px-2 bg-background border rounded text-xs cursor-pointer" value={regForm.planId} onChange={(e) => setRegForm({ ...regForm, planId: e.target.value })}>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Max Users</Label>
                    <Input type="number" value={regForm.maxUsers} onChange={(e) => setRegForm({ ...regForm, maxUsers: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" size="sm">Cancel</Button></DialogClose>
              <Button type="submit" size="sm" disabled={isRegistering}>
                {isRegistering ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null} Register Company
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Company Details</DialogTitle>
            <DialogDescription>Update company profile, plan, and limits.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Company Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Contact Email</Label>
                <Input type="email" value={editForm.contactEmail} onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">GST / VAT</Label>
                <Input value={editForm.gstVatNumber} onChange={(e) => setEditForm({ ...editForm, gstVatNumber: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Address</Label>
              <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Fiscal Year</Label>
                <select className="w-full h-8 px-2 bg-background border rounded text-xs cursor-pointer" value={editForm.fiscalYear} onChange={(e) => setEditForm({ ...editForm, fiscalYear: e.target.value })}>
                  <option value="jan-dec">Jan-Dec</option><option value="apr-mar">Apr-Mar</option><option value="jul-jun">Jul-Jun</option><option value="oct-sep">Oct-Sep</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Currency</Label>
                <select className="w-full h-8 px-2 bg-background border rounded text-xs cursor-pointer" value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}>
                  <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="PKR">PKR</option><option value="AED">AED</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Time Zone</Label>
                <select className="w-full h-8 px-2 bg-background border rounded text-xs cursor-pointer" value={editForm.timeZone} onChange={(e) => setEditForm({ ...editForm, timeZone: e.target.value })}>
                  <option value="UTC-5">EST</option><option value="UTC+0">GMT</option><option value="UTC+5">PKT</option><option value="UTC+4">GST</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Logo URL</Label>
              <Input value={editForm.logoUrl} onChange={(e) => setEditForm({ ...editForm, logoUrl: e.target.value })} />
            </div>
            <div className="border-t pt-3">
              <h4 className="text-xs font-semibold mb-2">Subscription & Limits</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Plan</Label>
                  <select className="w-full h-8 px-2 bg-background border rounded text-xs cursor-pointer" value={editForm.planId} onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })}>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Users</Label>
                  <Input type="number" value={editForm.maxUsers} onChange={(e) => setEditForm({ ...editForm, maxUsers: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button onClick={handleSaveEdit} size="sm" disabled={isSavingEdit}>
              {isSavingEdit ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
