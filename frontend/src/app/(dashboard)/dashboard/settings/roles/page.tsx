'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';
import { Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Permission {
  id: string;
  key: string;
  description: string | null;
}

interface RolePermission {
  id: string;
  permission: Permission;
}

interface Role {
  id: string;
  name: string;
  isSystemRole: boolean;
  rolePermissions: RolePermission[];
  _count: { users: number };
}

export default function RolesSettingsPage() {
  const { refreshUser } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [error, setError] = useState('');
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [rolesData, permsData] = await Promise.all([
        apiFetch<Role[]>('/api/v1/roles'),
        apiFetch<Permission[]>('/api/v1/roles/permissions'),
      ]);
      setRoles(rolesData);
      setAllPermissions(permsData);
      if (rolesData.length > 0 && !expandedRole) {
        setExpandedRole(rolesData[0].id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [expandedRole]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTogglePermission = async (roleId: string, permissionId: string, currentlyAssigned: boolean) => {
    setIsSaving(true);
    setError('');
    setSaveMsg('');
    try {
      if (currentlyAssigned) {
        await apiFetch(`/api/v1/roles/${roleId}/permissions/${permissionId}`, { method: 'DELETE' });
      } else {
        await apiFetch(`/api/v1/roles/${roleId}/permissions`, {
          method: 'POST',
          body: JSON.stringify({ permissionId }),
        });
      }
      await fetchData();
      await refreshUser();
      setSaveMsg('Role permissions updated & saved to database successfully!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update permission');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRole = async () => {
    setIsSaving(true);
    setSaveMsg('');
    setError('');
    try {
      await refreshUser();
      setSaveMsg('Role permissions configuration is saved and active in database!');
      setTimeout(() => setSaveMsg(''), 3500);
    } catch (err) {
      setError('Failed to refresh authorization context');
    } finally {
      setIsSaving(false);
    }
  };

  const getAssignedPermissionIds = (role: Role): Set<string> => {
    return new Set(role.rolePermissions.map(rp => rp.permission.id));
  };

  const groupedPermissions = (): Record<string, Permission[]> => {
    const groups: Record<string, Permission[]> = {};
    for (const p of allPermissions) {
      const group = p.key.split('.')[0];
      if (!groups[group]) groups[group] = [];
      groups[group].push(p);
    }
    return groups;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
        <p className="text-muted-foreground">Configure roles and what they can access across all modules</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-bold">Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saveMsg && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="font-bold text-emerald-700">Database Updated</AlertTitle>
          <AlertDescription className="text-emerald-600">{saveMsg}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row min-h-[500px] border rounded-lg bg-card overflow-hidden">
        {/* Left Panel: Roles List */}
        <div className="md:w-1/3 border-b md:border-b-0 md:border-r flex flex-col bg-muted/10">
          <div className="p-4 bg-muted/30 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Roles ({roles.length})
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[600px]">
            {roles.map(role => (
              <div
                key={role.id}
                onClick={() => setExpandedRole(role.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                  expandedRole === role.id
                    ? 'bg-primary/5 border-primary/30 shadow-sm'
                    : 'bg-background hover:bg-muted border-transparent'
                } flex flex-col gap-2`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Shield className="h-4 w-4 text-primary" />
                  {role.name}
                  {role.isSystemRole && (
                    <Badge variant="secondary" className="text-[10px] ml-auto">System</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {role._count.users} user{role._count.users !== 1 ? 's' : ''} · {role.rolePermissions.length} permission{role.rolePermissions.length !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Permissions Selection */}
        <div className="md:w-2/3 bg-background flex flex-col">
          {!expandedRole ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 bg-muted/5">
              <Shield className="h-12 w-12 text-muted-foreground/30" />
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Select a Role</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a role from the left panel to configure its permissions.
                </p>
              </div>
            </div>
          ) : (
            (() => {
              const role = roles.find(r => r.id === expandedRole);
              if (!role) return null;
              const assigned = getAssignedPermissionIds(role);

              return (
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b flex items-center justify-between bg-muted/5">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        {role.name} Permissions
                        {role.isSystemRole && (
                          <Badge variant="secondary" className="text-[10px]">System Role</Badge>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Toggle module permissions. Changes are persisted immediately to the database.
                      </p>
                    </div>
                    <Button onClick={handleSaveRole} disabled={isSaving} className="cursor-pointer">
                      {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Role Permissions
                    </Button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 max-h-[600px]">
                    {Object.entries(groupedPermissions()).map(([group, perms]) => (
                      <div key={group} className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
                          {group} Module
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {perms.map(p => (
                            <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/10 hover:bg-muted/30 transition-colors">
                              <Switch
                                id={`${role.id}-${p.id}`}
                                checked={assigned.has(p.id)}
                                onCheckedChange={() => handleTogglePermission(role.id, p.id, assigned.has(p.id))}
                                disabled={isSaving}
                              />
                              <div className="space-y-1">
                                <Label htmlFor={`${role.id}-${p.id}`} className="text-sm font-semibold cursor-pointer">
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
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}

