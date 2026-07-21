'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';
import { Shield, Loader2, CheckCircle2, Users, ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';

interface OrgUser {
  id: string;
  email: string;
  name: string | null;
  role: { id: string; name: string } | null;
}

interface OrganizationItem {
  id: string;
  name: string;
  isPlatform: boolean;
  status: string;
  plan?: { id: string; name: string } | null;
  _count?: { users: number };
}

const AVAILABLE_SCREENS = [
  { key: 'dashboard', label: 'Dashboard', category: 'Overview', description: 'Main financial performance dashboard and KPIs' },
  { key: 'calendar', label: 'Calendar', category: 'Overview', description: 'Financial events, due dates, and schedule' },
  { key: 'invoices', label: 'Invoices', category: 'Finance', description: 'Customer invoices, creation, and tracking' },
  { key: 'expenses', label: 'Expenses', category: 'Finance', description: 'Organization outflow and expense records' },
  { key: 'payments', label: 'Payments', category: 'Finance', description: 'Payment processing and transactions' },
  { key: 'notifications', label: 'Notifications', category: 'Tools', description: 'User alert and notification center' },
  { key: 'integrations', label: 'Integrations', category: 'Tools', description: 'External service & API connections' },
  { key: 'inbox', label: 'Inbox', category: 'Tools', description: 'Organization message and query inbox' },
  { key: 'reports', label: 'Reporting', category: 'Tools', description: 'Advanced financial reports and analytics' },
  { key: 'active', label: 'Active Metrics', category: 'Metrics', description: 'Real-time active account metrics' },
  { key: 'past', label: 'Past Metrics', category: 'Metrics', description: 'Historical performance archives' },
];

function ScreenAccessContent() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('userId');

  const { user } = useAuth();
  const isPlatform = !!user?.isPlatformOrg;

  const [activeTab, setActiveTab] = useState<'users' | 'tenants'>(isPlatform && !initialUserId ? 'tenants' : 'users');

  // Users Tab State
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userBlockedScreens, setUserBlockedScreens] = useState<Set<string>>(new Set());
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingUserScreens, setIsLoadingUserScreens] = useState(false);

  // Tenants Tab State (for FinFlow Platform Admins)
  const [orgs, setOrgs] = useState<OrganizationItem[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgDisabledScreens, setOrgDisabledScreens] = useState<Set<string>>(new Set());
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [isLoadingOrgScreens, setIsLoadingOrgScreens] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [error, setError] = useState('');

  // Fetch Team Users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const data = await apiFetch<OrgUser[]>('/api/v1/users');
      setUsers(data);
      
      // Auto-select user if passed in URL
      if (initialUserId && data.some(u => u.id === initialUserId)) {
        setActiveTab('users');
        handleSelectUser(initialUserId);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load team users');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [initialUserId]);

  // Fetch B2B Organizations (Platform Admins only)
  const fetchOrgs = useCallback(async () => {
    if (!isPlatform) return;
    try {
      setIsLoadingOrgs(true);
      const data = await apiFetch<OrganizationItem[]>('/api/v1/platform/organizations');
      setOrgs(data);
      if (data.length > 0 && !selectedOrgId) {
        handleSelectOrg(data[0].id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load tenant organizations');
    } finally {
      setIsLoadingOrgs(false);
    }
  }, [isPlatform, selectedOrgId]);

  useEffect(() => { 
    fetchUsers(); 
    if (isPlatform) fetchOrgs();
  }, [fetchUsers, fetchOrgs, isPlatform]);

  // Select User Handler
  const handleSelectUser = async (userId: string) => {
    setSelectedUserId(userId);
    setIsLoadingUserScreens(true);
    setSaveMsg('');
    setError('');
    try {
      const data = await apiFetch<string[]>(`/api/v1/users/${userId}/screens`);
      setUserBlockedScreens(new Set(data));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load screen blocks for user');
    } finally {
      setIsLoadingUserScreens(false);
    }
  };

  // Select Org Handler (Platform Admin)
  const handleSelectOrg = async (orgId: string) => {
    setSelectedOrgId(orgId);
    setIsLoadingOrgScreens(true);
    setSaveMsg('');
    setError('');
    try {
      const data = await apiFetch<{ id: string; name: string; disabledScreens: string[] }>(`/api/v1/platform/organizations/${orgId}/screens`);
      setOrgDisabledScreens(new Set(data.disabledScreens || []));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load screen blocks for organization');
    } finally {
      setIsLoadingOrgScreens(false);
    }
  };

  // Toggle Screen Handler
  const handleToggleScreen = (screenKey: string) => {
    if (activeTab === 'users') {
      setUserBlockedScreens(prev => {
        const next = new Set(prev);
        if (next.has(screenKey)) next.delete(screenKey);
        else next.add(screenKey);
        return next;
      });
    } else {
      setOrgDisabledScreens(prev => {
        const next = new Set(prev);
        if (next.has(screenKey)) next.delete(screenKey);
        else next.add(screenKey);
        return next;
      });
    }
  };

  // Save Restrictions Handler
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMsg('');
    setError('');
    try {
      if (activeTab === 'users') {
        if (!selectedUserId) return;
        await apiFetch(`/api/v1/users/${selectedUserId}/screens`, {
          method: 'PUT',
          body: JSON.stringify({ screenKeys: Array.from(userBlockedScreens) }),
        });
        setSaveMsg('User screen restrictions saved successfully!');
      } else {
        if (!selectedOrgId) return;
        await apiFetch(`/api/v1/platform/organizations/${selectedOrgId}/screens`, {
          method: 'PUT',
          body: JSON.stringify({ disabledScreens: Array.from(orgDisabledScreens) }),
        });
        setSaveMsg('Organization screen restrictions saved successfully!');
      }
      setTimeout(() => setSaveMsg(''), 3500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save screen restrictions');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);
  const selectedOrg = orgs.find(o => o.id === selectedOrgId);
  const categories = Array.from(new Set(AVAILABLE_SCREENS.map(s => s.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Screen Access Control</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Restrict or allow specific pages and screens manually.
          </p>
        </div>
        <Link href="/dashboard/settings/users">
          <Button variant="outline" size="sm" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Team Users
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">{error}</div>
      )}

      {saveMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs rounded-lg font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveMsg}</span>
        </div>
      )}

      {/* Main Card with Tab Switcher for Platform Admins */}
      <div className="flex flex-col border rounded-lg bg-card overflow-hidden">
        {/* Tab Switcher (Visible to Platform Admins) */}
        {isPlatform && (
          <div className="p-3 bg-muted/30 border-b flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveTab('tenants')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'tenants' ? 'bg-background text-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Building2 className="h-3.5 w-3.5 text-primary" /> B2B Client Tenants ({orgs.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'users' ? 'bg-background text-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-3.5 w-3.5" /> Team Members ({users.length})
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row min-h-[600px]">
          {/* Left Panel: List (Tenants or Users) */}
          <div className="md:w-1/3 border-b md:border-b-0 md:border-r flex flex-col bg-muted/10">
            <div className="p-4 bg-muted/30 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              {activeTab === 'tenants' ? (
                <span className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  B2B Tenants ({orgs.length})
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Team Members ({users.length})
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[600px]">
              {activeTab === 'tenants' ? (
                isLoadingOrgs ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : orgs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No tenant organizations found
                  </div>
                ) : (
                  orgs.map(o => (
                    <div
                      key={o.id}
                      onClick={() => handleSelectOrg(o.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                        selectedOrgId === o.id
                          ? 'bg-primary/5 border-primary/30 shadow-sm'
                          : 'bg-background hover:bg-muted border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          {o.name}
                        </div>
                        {o.isPlatform ? (
                          <Badge variant="secondary" className="text-[10px]">Platform</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {o.plan?.name || 'Free'}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Status: {o.status}</div>
                    </div>
                  ))
                )
              ) : (
                isLoadingUsers ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No team members found
                  </div>
                ) : (
                  users
                    .filter(u => u.id !== user?.id) // can't block yourself
                    .map(u => (
                      <div
                        key={u.id}
                        onClick={() => handleSelectUser(u.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                          selectedUserId === u.id
                            ? 'bg-primary/5 border-primary/30 shadow-sm'
                            : 'bg-background hover:bg-muted border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-foreground">
                            {u.name || u.email.split('@')[0]}
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {u.role?.name || 'No Role'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{u.email}</div>
                      </div>
                    ))
                )
              )}
            </div>
          </div>

          {/* Right Panel: Toggles for Selected Tenant or User */}
          <div className="md:w-2/3 bg-background flex flex-col">
            {activeTab === 'tenants' ? (
              !selectedOrg ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 bg-muted/5">
                  <Building2 className="h-12 w-12 text-muted-foreground/30" />
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">Select a Tenant Organization</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a B2B tenant from the left panel to manually restrict screen access.
                    </p>
                  </div>
                </div>
              ) : isLoadingOrgScreens ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b flex items-center justify-between bg-muted/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">{selectedOrg.name}</h3>
                        <Badge variant="outline" className="text-[10px]">
                          {selectedOrg.plan?.name || 'Free'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Toggle screens OFF to manually block this tenant from accessing pages. ({orgDisabledScreens.size} screen(s) currently blocked)
                      </p>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="cursor-pointer">
                      {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Tenant Restrictions
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-8 max-h-[600px]">
                    {categories.map(cat => {
                      const screens = AVAILABLE_SCREENS.filter(s => s.category === cat);
                      return (
                        <div key={cat} className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
                            {cat} Module
                          </h4>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {screens.map(screen => {
                              const isBlocked = orgDisabledScreens.has(screen.key);
                              return (
                                <div
                                  key={screen.key}
                                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                    isBlocked
                                      ? 'bg-destructive/5 border-destructive/20'
                                      : 'bg-muted/10 hover:bg-muted/30'
                                  }`}
                                >
                                  <Switch
                                    id={`org-screen-${screen.key}`}
                                    checked={!isBlocked}
                                    onCheckedChange={() => handleToggleScreen(screen.key)}
                                  />
                                  <div className="space-y-1">
                                    <Label htmlFor={`org-screen-${screen.key}`} className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                                      {screen.label}
                                      {isBlocked && (
                                        <Badge variant="destructive" className="text-[10px] h-4">Blocked for Tenant</Badge>
                                      )}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">{screen.description}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              !selectedUser ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 bg-muted/5">
                  <Shield className="h-12 w-12 text-muted-foreground/30" />
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold">Select a Team Member</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a user from the left panel to configure page and screen restrictions.
                    </p>
                  </div>
                </div>
              ) : isLoadingUserScreens ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b flex items-center justify-between bg-muted/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">{selectedUser.name || selectedUser.email}</h3>
                        <Badge variant="secondary" className="text-[10px]">
                          {selectedUser.role?.name || 'No Role'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Toggle screens OFF to block access for this user. ({userBlockedScreens.size} screen(s) currently blocked)
                      </p>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="cursor-pointer">
                      {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Restrictions
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-8 max-h-[600px]">
                    {categories.map(cat => {
                      const screens = AVAILABLE_SCREENS.filter(s => s.category === cat);
                      return (
                        <div key={cat} className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
                            {cat} Module
                          </h4>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {screens.map(screen => {
                              const isBlocked = userBlockedScreens.has(screen.key);
                              return (
                                <div
                                  key={screen.key}
                                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                    isBlocked
                                      ? 'bg-destructive/5 border-destructive/20'
                                      : 'bg-muted/10 hover:bg-muted/30'
                                  }`}
                                >
                                  <Switch
                                    id={`user-screen-${screen.key}`}
                                    checked={!isBlocked}
                                    onCheckedChange={() => handleToggleScreen(screen.key)}
                                  />
                                  <div className="space-y-1">
                                    <Label htmlFor={`user-screen-${screen.key}`} className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                                      {screen.label}
                                      {isBlocked && (
                                        <Badge variant="destructive" className="text-[10px] h-4">Blocked</Badge>
                                      )}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">{screen.description}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScreenAccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ScreenAccessContent />
    </Suspense>
  );
}
