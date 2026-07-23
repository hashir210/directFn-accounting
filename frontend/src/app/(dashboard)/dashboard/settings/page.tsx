"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Lock, Building2, CreditCard, Monitor } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";

export default function SettingsPage() {
  const { user, hasPermission, isScreenAllowed } = useAuth();
  const isPlatform = !!user?.isPlatformOrg;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings & Administration</h1>
        <p className="text-muted-foreground">Manage team members, roles, and your subscription.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {hasPermission('users.manage') && isScreenAllowed('users') && (
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Team Users</CardTitle>
                  <CardDescription>Manage team members and roles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/settings/users" className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted h-8 px-2.5 w-full text-sm font-medium whitespace-nowrap transition-colors">Manage Users</Link>
            </CardContent>
          </Card>
        )}

        {hasPermission('roles.manage') && isScreenAllowed('roles') && (
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Roles & Permissions</CardTitle>
                  <CardDescription>Configure roles and permission keys</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/settings/roles" className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted h-8 px-2.5 w-full text-sm font-medium whitespace-nowrap transition-colors">Manage Roles</Link>
            </CardContent>
          </Card>
        )}

        {hasPermission('settings.view') && isScreenAllowed('plan') && (
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Subscription</CardTitle>
                  <CardDescription>View your plan and enabled features</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/settings/plan" className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted h-8 px-2.5 w-full text-sm font-medium whitespace-nowrap transition-colors">View Subscription</Link>
            </CardContent>
          </Card>
        )}

        {hasPermission('settings.view') && (
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Monitor className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Active Sessions</CardTitle>
                  <CardDescription>Review and revoke signed-in devices</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/settings/sessions" className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted h-8 px-2.5 w-full text-sm font-medium whitespace-nowrap transition-colors">Manage Sessions</Link>
            </CardContent>
          </Card>
        )}

        {isPlatform && (
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">B2B Clients</CardTitle>
                  <CardDescription>Provision and manage tenant client orgs</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/settings/organizations" className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted h-8 px-2.5 w-full text-sm font-medium whitespace-nowrap transition-colors">Manage Organizations</Link>
            </CardContent>
          </Card>
        )}

        {hasPermission('users.manage') && isScreenAllowed('screens') && (
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Screen Access</CardTitle>
                  <CardDescription>Allow or block app screens for team members</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/settings/screens" className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted h-8 px-2.5 w-full text-sm font-medium whitespace-nowrap transition-colors">Manage Screen Access</Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
