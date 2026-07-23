'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Globe, ShieldCheck, MapPin, Loader2, Mail, Clock, Hash, Pencil, Plus,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';

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

export default function CompanyManagementPage() {
  const { user } = useAuth();
  const isPlatformAdmin = user?.isPlatformOrg === true;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Tenant view: single company
  const [tenantCompany, setTenantCompany] = useState({
    name: '', contactEmail: '', gstVatNumber: '', address: '',
    fiscalYear: 'jan-dec', currency: 'PKR', timeZone: 'UTC-5', logoUrl: '',
  });

  // Admin view: all companies
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);

  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '', contactEmail: '', gstVatNumber: '', address: '',
    fiscalYear: 'jan-dec', currency: 'PKR', timeZone: 'UTC-5', logoUrl: '',
    planId: '', maxUsers: '5',
  });
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Register dialog
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    orgName: '', ownerName: '', ownerEmail: '', password: '',
    contactEmail: '', maxUsers: '5', planId: '',
    address: '', gstVatNumber: '', fiscalYear: 'jan-dec', currency: 'PKR', timeZone: 'UTC-5',
  });
  const [isRegistering, setIsRegistering] = useState(false);

  const loadTenant = useCallback(async () => {
    try {
      const data = await apiFetch<any>('/api/v1/organization/current');
      setTenantCompany({
        name: data.name || '', contactEmail: data.contactEmail || '',
        gstVatNumber: data.gstVatNumber || '', address: data.address || '',
        fiscalYear: data.fiscalYear || 'jan-dec', currency: data.currency || 'PKR',
        timeZone: data.timeZone || 'UTC-5', logoUrl: data.logoUrl || '',
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load');
    } finally { setIsLoading(false); }
  }, []);

  const loadAllOrgs = useCallback(async () => {
    try {
      const [orgsData, plansData] = await Promise.all([
        apiFetch<OrgSummary[]>('/api/v1/platform/organizations'),
        apiFetch<{ id: string; name: string }[]>('/api/v1/platform/plans'),
      ]);
      setOrgs(orgsData);
      setPlans(plansData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load');
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    if (isPlatformAdmin) loadAllOrgs(); else loadTenant();
  }, [isPlatformAdmin, loadAllOrgs, loadTenant]);

  const openRegister = () => {
    setRegForm({ orgName: '', ownerName: '', ownerEmail: '', password: '', contactEmail: '', maxUsers: '5', planId: plans[0]?.id || '', address: '', gstVatNumber: '', fiscalYear: 'jan-dec', currency: 'PKR', timeZone: 'UTC-5' });
    setIsRegisterOpen(true);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
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
      loadAllOrgs();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to register company');
    } finally { setIsRegistering(false); }
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
    setIsSaving(true);
    try {
      await Promise.all([
        apiFetch(`/api/v1/platform/organizations/${editingOrgId}/settings`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: editForm.name, contactEmail: editForm.contactEmail || undefined,
            gstVatNumber: editForm.gstVatNumber || undefined, address: editForm.address || undefined,
            fiscalYear: editForm.fiscalYear, currency: editForm.currency,
            timeZone: editForm.timeZone, logoUrl: editForm.logoUrl || undefined,
          }),
        }),
        apiFetch(`/api/v1/platform/organizations/${editingOrgId}/limits`, {
          method: 'PATCH',
          body: JSON.stringify({
            planId: editForm.planId || null,
            maxUsers: editForm.maxUsers ? parseInt(editForm.maxUsers, 10) : null,
          }),
        }),
      ]);
      setIsEditOpen(false);
      loadAllOrgs();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to save');
    } finally { setIsSaving(false); }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  // --- TENANT VIEW ---
  if (!isPlatformAdmin) {
    return (
      <div className="space-y-6 pb-12">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <Building2 className="h-4 w-4" />
            <span>Organization Profile</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{tenantCompany.name || 'My Company'}</h1>
          <p className="text-sm text-muted-foreground">Your company details as registered on FinFlow. Contact your platform administrator to make changes.</p>
        </div>

        {error && <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">{error}</div>}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Company Profile</CardTitle>
                <CardDescription>Legal registered business identity and contact details.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <div className="text-xs text-muted-foreground font-medium uppercase mb-1">Company Name</div>
                    <div className="text-sm font-semibold">{tenantCompany.name || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium uppercase mb-1 flex items-center gap-1"><Mail className="h-3 w-3" /> Contact Email</div>
                    <div className="text-sm">{tenantCompany.contactEmail || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium uppercase mb-1 flex items-center gap-1"><Hash className="h-3 w-3" /> GST / VAT Number</div>
                    <div className="text-sm font-mono">{tenantCompany.gstVatNumber || 'Not set'}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-xs text-muted-foreground font-medium uppercase mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</div>
                    <div className="text-sm">{tenantCompany.address || 'Not set'}</div>
                  </div>
                  {tenantCompany.logoUrl && <div className="sm:col-span-2"><img src={tenantCompany.logoUrl} alt="Logo" className="h-12 w-auto rounded border" /></div>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Localization & Fiscal Settings</CardTitle>
                <CardDescription>Tax year closing, currency symbols, and default timezones.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <div className="text-xs text-muted-foreground font-medium uppercase mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Fiscal Year</div>
                    <div className="text-sm font-semibold capitalize">{tenantCompany.fiscalYear?.replace('-', ' - ') || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium uppercase mb-1">Currency</div>
                    <div className="text-sm font-semibold">{tenantCompany.currency || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium uppercase mb-1">Time Zone</div>
                    <div className="text-sm font-semibold">{tenantCompany.timeZone || 'Not set'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-primary"><ShieldCheck className="h-4 w-4" /> Compliance Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">GST/VAT Status:</span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fiscal Cycle:</span>
                  <span className="font-medium uppercase">{tenantCompany.fiscalYear || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span className="font-medium">{tenantCompany.currency || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN VIEW ---
  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
          <Building2 className="h-4 w-4" />
          <span>Organization Management</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">All Companies</h1>
        <p className="text-sm text-muted-foreground">View and manage all registered companies on FinFlow.</p>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={openRegister}>
          <Plus className="h-4 w-4 mr-1" /> Register Company
        </Button>
      </div>

      {error && <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">{error}</div>}

      {orgs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl bg-muted/10">
          <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
          No companies registered yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                      {org.status}
                    </Badge>
                    <Button variant="ghost" size="icon-xs" className="h-6 w-6 -mr-1" onClick={(e) => { e.stopPropagation(); openEdit(org); }}>
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
                <div className="flex items-center gap-1.5"><Globe className="h-3 w-3 shrink-0" />{org.currency || 'PKR'} &middot; {org.fiscalYear || 'jan-dec'}</div>
                <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 shrink-0" />{new Date(org.createdAt).toLocaleDateString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Register Dialog */}
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
                    <option value="jan-dec">Jan-Dec</option><option value="apr-mar">Apr-Mar</option><option value="jul-jun">Jul-Jun</option><option value="oct-sep">Oct-Sep</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Currency</Label>
                  <select className="w-full h-8 px-2 bg-background border rounded text-xs cursor-pointer" value={regForm.currency} onChange={(e) => setRegForm({ ...regForm, currency: e.target.value })}>
                    <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="PKR">PKR</option><option value="AED">AED</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Time Zone</Label>
                  <select className="w-full h-8 px-2 bg-background border rounded text-xs cursor-pointer" value={regForm.timeZone} onChange={(e) => setRegForm({ ...regForm, timeZone: e.target.value })}>
                    <option value="UTC-5">EST</option><option value="UTC+0">GMT</option><option value="UTC+5">PKT</option><option value="UTC+4">GST</option>
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

      {/* Edit Dialog */}
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
            <Button onClick={handleSaveEdit} size="sm" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
