'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/features/auth/useAuth';
import { apiFetch, ApiError } from '@/lib/api';
import { Shield, Plus, Loader2, ArrowLeft, Trash2, Edit2 } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  features: { featureKey: string }[];
  _count: { organizations: number };
}

interface Permission {
  id: string;
  key: string;
  description: string | null;
}

export default function PlansAdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, hasPermission } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected plan for feature management
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activePlanFeatures, setActivePlanFeatures] = useState<Set<string>>(new Set());
  const [isSavingFeatures, setIsSavingFeatures] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [isSavingPlan, setIsSavingPlan] = useState(false);

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
      const [plansData, permsData] = await Promise.all([
        apiFetch<Plan[]>('/api/v1/platform/plans'),
        apiFetch<Permission[]>('/api/v1/roles/permissions'),
      ]);
      setPlans(plansData);
      setPermissions(permsData);
      if (plansData.length > 0 && !selectedPlanId) {
        setSelectedPlanId(plansData[0].id);
        setActivePlanFeatures(new Set(plansData[0].features.map(f => f.featureKey)));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load plans data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlanId]);

  useEffect(() => {
    if (isAuthenticated && user?.isPlatformOrg) {
      fetchData();
    }
  }, [isAuthenticated, user, fetchData]);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlanId(plan.id);
    setActivePlanFeatures(new Set(plan.features.map(f => f.featureKey)));
  };

  const handleToggleFeature = (featureKey: string) => {
    setActivePlanFeatures(prev => {
      const next = new Set(prev);
      if (next.has(featureKey)) next.delete(featureKey);
      else next.add(featureKey);
      return next;
    });
  };

  const handleSaveFeatures = async () => {
    if (!selectedPlanId) return;
    setIsSavingFeatures(true);
    try {
      const updatedFeatures = await apiFetch<string[]>(`/api/v1/platform/plans/${selectedPlanId}/features`, {
        method: 'PUT',
        body: JSON.stringify({ features: Array.from(activePlanFeatures) }),
      });
      // Update local state
      setPlans(prev => prev.map(p => 
        p.id === selectedPlanId ? { ...p, features: updatedFeatures.map(f => ({ featureKey: f })) } : p
      ));
      alert('Plan features updated successfully!');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to save features');
    } finally {
      setIsSavingFeatures(false);
    }
  };

  const handleSavePlan = async () => {
    setIsSavingPlan(true);
    try {
      if (editingPlan) {
        await apiFetch(`/api/v1/platform/plans/${editingPlan.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: planName, description: planDesc }),
        });
      } else {
        await apiFetch('/api/v1/platform/plans', {
          method: 'POST',
          body: JSON.stringify({ name: planName, description: planDesc }),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to save plan');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleDeletePlan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await apiFetch(`/api/v1/platform/plans/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete plan');
    }
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setPlanName('');
    setPlanDesc('');
    setIsModalOpen(true);
  };

  const openEditModal = (plan: Plan, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanDesc(plan.description || '');
    setIsModalOpen(true);
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group permissions by prefix for better UX
  const groupedPermissions = permissions.reduce((acc, p) => {
    const group = p.key.split('.')[0];
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <div className="min-h-svh bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Shield className="h-4 w-4" />
              <span>Platform Administration</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Subscription Plans</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="default" onClick={openCreateModal} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              New Plan
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin')} className="cursor-pointer">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row min-h-[600px] border rounded-lg bg-card overflow-hidden">
          {/* Left Panel: Plans List */}
          <div className="md:w-1/3 border-b md:border-b-0 md:border-r flex flex-col bg-muted/10">
            <div className="p-4 bg-muted/30 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available Plans ({plans.length})
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border group ${
                    selectedPlanId === plan.id
                      ? 'bg-primary/5 border-primary/30 shadow-sm'
                      : 'bg-background hover:bg-muted border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm text-foreground">
                      {plan.name}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer" onClick={(e) => openEditModal(plan, e)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive cursor-pointer hover:bg-destructive/10" onClick={(e) => handleDeletePlan(plan.id, e)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {plan.description || 'No description'}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-2 font-medium">
                    {plan._count.organizations} tenant(s) · {plan.features.length} feature(s)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Feature Toggles */}
          <div className="md:w-2/3 bg-background flex flex-col">
            {!selectedPlan ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 bg-muted/5">
                <Shield className="h-12 w-12 text-muted-foreground/30" />
                <div className="space-y-1">
                  <h3 className="text-base font-semibold">Select a Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a subscription plan to manage its allowed features.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="p-6 border-b flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{selectedPlan.name} Features</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Toggle which modules and screens are allowed for this plan.
                    </p>
                  </div>
                  <Button onClick={handleSaveFeatures} disabled={isSavingFeatures} className="cursor-pointer">
                    {isSavingFeatures && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Features
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {Object.entries(groupedPermissions).map(([group, perms]) => (
                    <div key={group} className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
                        {group} Features
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {perms.map(p => (
                          <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/10 hover:bg-muted/30 transition-colors">
                            <Switch
                              id={`feature-${p.id}`}
                              checked={activePlanFeatures.has(p.key)}
                              onCheckedChange={() => handleToggleFeature(p.key)}
                            />
                            <div className="space-y-1">
                              <Label htmlFor={`feature-${p.id}`} className="text-sm font-semibold cursor-pointer">
                                {p.key.split('.').slice(1).join('.') || p.key}
                              </Label>
                              {p.description && (
                                <p className="text-xs text-muted-foreground">{p.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Plan Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}</DialogTitle>
            <DialogDescription>
              Plans group features together to enforce limits across tenants.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input
                placeholder="e.g. Premium Tier"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Optional description"
                value={planDesc}
                onChange={(e) => setPlanDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="cursor-pointer">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSavePlan} disabled={isSavingPlan || !planName.trim()} className="cursor-pointer">
              {isSavingPlan && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
