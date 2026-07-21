'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  UserPlus,
  Trash2,
  Loader2,
  ShieldCheck,
  Lock,
  Users as UsersIcon,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Role {
  id: string;
  name: string;
}

interface OrgUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  roleId: string | null;
  role: { id: string; name: string } | null;
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Users State
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [userError, setUserError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Invite User Dialog State
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ email: string; tempPassword: string } | null>(null);

  // Fetch Users & Roles
  const fetchUsersData = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const [usersData, rolesData] = await Promise.all([
        apiFetch<OrgUser[]>('/api/v1/users'),
        apiFetch<Role[]>('/api/v1/roles'),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      if (usersData.length > 0 && !selectedUserId) {
        setSelectedUserId(usersData[0].id);
      }
    } catch (err) {
      setUserError(err instanceof ApiError ? err.message : 'Failed to load user data');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    fetchUsersData();
  }, [fetchUsersData]);

  // Invite User Handler
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setUserError('');
    try {
      const result = await apiFetch<{ user: Record<string, unknown>; tempPassword: string }>('/api/v1/users/invite', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, name: inviteName, roleId: inviteRoleId }),
      });
      setInviteResult({ email: inviteEmail, tempPassword: result.tempPassword });
      setInviteEmail('');
      setInviteName('');
      setInviteRoleId('');
      fetchUsersData();
    } catch (err) {
      setUserError(err instanceof ApiError ? err.message : 'Failed to invite user');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      await apiFetch(`/api/v1/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ roleId }),
      });
      fetchUsersData();
    } catch (err) {
      setUserError(err instanceof ApiError ? err.message : 'Failed to update role');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      await apiFetch(`/api/v1/users/${userId}`, { method: 'DELETE' });
      setSelectedUserId(null);
      fetchUsersData();
    } catch (err) {
      setUserError(err instanceof ApiError ? err.message : 'Failed to remove user');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.role?.name && u.role.name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your organization&apos;s team members, roles, and page access restrictions.
          </p>
        </div>

        {/* Invite Action Button */}
        <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) setInviteResult(null); }}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[440px]">
            {inviteResult ? (
              <>
                <DialogHeader>
                  <DialogTitle>User Invited Successfully</DialogTitle>
                  <DialogDescription>Share the temporary credentials below with your team member.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <Alert variant="success">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Invitation Created</AlertTitle>
                    <AlertDescription>
                      User invitation has been recorded. Provide the credentials below to the team member.
                    </AlertDescription>
                  </Alert>
                  <div className="p-4 bg-muted rounded-lg space-y-2 text-xs">
                    <div><span className="font-semibold">Email:</span> {inviteResult.email}</div>
                    <div>
                      <span className="font-semibold">Temp Password:</span>
                      <code className="ml-2 px-2 py-0.5 bg-background rounded font-mono font-bold text-primary">
                        {inviteResult.tempPassword}
                      </code>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => { setInviteOpen(false); setInviteResult(null); }} className="cursor-pointer">
                    Done
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <form onSubmit={handleInviteUser}>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>Add a user to your organization workspace.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {userError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Action Failed</AlertTitle>
                      <AlertDescription>{userError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input id="invite-email" type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-name">Full Name (Optional)</Label>
                    <Input id="invite-name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <select
                      id="invite-role"
                      required
                      value={inviteRoleId}
                      onChange={(e) => setInviteRoleId(e.target.value)}
                      className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                    >
                      <option value="" disabled>Select a role...</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isInviting} className="cursor-pointer">
                    {isInviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Send Invitation
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Card */}
      <Card className="shadow-2xs">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UsersIcon className="h-4 w-4 text-primary" />
              <span>Team Members ({users.length})</span>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingUsers ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row min-h-[500px]">
              {/* Left Panel: Users List */}
              <div className="md:w-1/2 border-b md:border-b-0 md:border-r flex flex-col">
                <div className="p-4 bg-muted/30 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                  <span>Members ({filteredUsers.length})</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[550px]">
                  {filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No team members found
                    </div>
                  ) : (
                    filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        className={`p-3.5 rounded-lg cursor-pointer transition-colors border ${
                          selectedUserId === u.id
                            ? 'bg-primary/5 border-primary/30 shadow-sm'
                            : 'bg-background hover:bg-muted/50 border-transparent'
                        } flex items-center justify-between`}
                      >
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-foreground">
                            {u.name || u.email.split('@')[0]}
                          </div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs font-medium">
                            {u.role?.name || 'No Role'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Panel: Role & Screen Restrictions for Selected User */}
              <div className="md:w-1/2 bg-muted/5 flex flex-col">
                {!selectedUserId ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <ShieldCheck className="h-12 w-12 text-muted-foreground/30" />
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold">Select a User</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose a team member from the list to assign their role and manage page access.
                      </p>
                    </div>
                  </div>
                ) : (
                  (() => {
                    const selectedUser = users.find(u => u.id === selectedUserId);
                    if (!selectedUser) return null;
                    
                    return (
                      <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                        <div className="space-y-6">
                          {/* User Banner */}
                          <div className="flex items-center justify-between pb-4 border-b">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold">{selectedUser.name || selectedUser.email}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {selectedUser.role?.name || 'No Role'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{selectedUser.email}</p>
                            </div>
                            {selectedUser.id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive cursor-pointer hover:bg-destructive/10"
                                onClick={() => handleRemoveUser(selectedUser.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          {/* Role Selection */}
                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned Role</Label>
                            <div className="space-y-2">
                              {roles.map(role => (
                                <label
                                  key={role.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    selectedUser.roleId === role.id
                                      ? 'bg-primary/5 border-primary/40'
                                      : 'bg-background hover:bg-muted border-input'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="role"
                                    value={role.id}
                                    checked={selectedUser.roleId === role.id}
                                    onChange={() => handleRoleChange(selectedUser.id, role.id)}
                                    className="h-4 w-4 text-primary focus:ring-primary cursor-pointer border-input"
                                  />
                                  <div className="space-y-0.5 flex-1">
                                    <div className="text-sm font-semibold">{role.name}</div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Manage Screen Access CTA */}
                          <div className="pt-4 border-t space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Screen & Page Restrictions</Label>
                            <p className="text-xs text-muted-foreground">
                              Block or allow specific pages and features for {selectedUser.name || selectedUser.email}.
                            </p>
                            <Button
                              variant="outline"
                              onClick={() => router.push(`/dashboard/settings/screens?userId=${selectedUser.id}`)}
                              className="w-full flex items-center justify-center gap-2 cursor-pointer border-primary/30 text-primary hover:bg-primary/5 font-semibold mt-2"
                            >
                              <Lock className="h-4 w-4" />
                              Manage Screen Restrictions for {selectedUser.name?.split(' ')[0] || 'User'}
                              <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
