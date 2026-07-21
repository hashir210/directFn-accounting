"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  Receipt,
  CreditCard,
  TrendingUp,
  FileBarChart2,
  Bell,
  Search,
  Settings,
  HelpCircle,
  Users,
  LogOut,
  Plus,
  ChevronsUpDown,
  Mail,
  Zap,
  Share2,
  SlidersHorizontal,
  Shield,
  Lock,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/features/auth/useAuth";
import { apiFetch } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  desc: string;
  type: "warning" | "success" | "info" | "error" | "system";
  time: string;
}

interface NotificationApiData {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAuthenticated, hasPermission, isScreenAllowed, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Auth guard: redirect unauthenticated users to /login
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Load notifications for the current user
  useEffect(() => {
    if (!isAuthenticated) return;
    apiFetch<{ data: NotificationApiData[] }>("/api/v1/dashboard/notifications?limit=10")
      .then((d) => {
        setNotifications(
          d.data.map((n: NotificationApiData) => ({
            id: n.id,
            title: n.title,
            desc: n.message,
            type: (n.type === "system" ? "system" : n.type) as Notification["type"],
            time: new Date(n.createdAt).toLocaleDateString(),
          }))
        );
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleMarkAllRead = async () => {
    await Promise.allSettled(
      notifications.map((n) =>
        apiFetch(`/api/v1/dashboard/notifications/${n.id}/read`, { method: "PATCH" })
      )
    );
    apiFetch<{ data: NotificationApiData[] }>("/api/v1/dashboard/notifications?limit=10")
      .then((d) =>
        setNotifications(
          d.data.map((n: NotificationApiData) => ({
            id: n.id,
            title: n.title,
            desc: n.message,
            type: (n.type === "system" ? "system" : n.type) as Notification["type"],
            time: new Date(n.createdAt).toLocaleDateString(),
          }))
        )
      )
      .catch(() => {});
  };

  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const getRouteScreenKey = (path: string): string | null => {
    if (path === "/dashboard") return "dashboard";
    if (path.startsWith("/dashboard/calendar")) return "calendar";
    if (path.startsWith("/dashboard/invoices")) return "invoices";
    if (path.startsWith("/dashboard/expenses")) return "expenses";
    if (path.startsWith("/dashboard/payments")) return "payments";
    if (path.startsWith("/dashboard/notifications")) return "notifications";
    if (path.startsWith("/dashboard/integrations")) return "integrations";
    if (path.startsWith("/dashboard/inbox")) return "inbox";
    if (path.startsWith("/dashboard/reports")) return "reports";
    if (path.startsWith("/dashboard/active")) return "active";
    if (path.startsWith("/dashboard/past")) return "past";
    return null;
  };

  const currentScreenKey = getRouteScreenKey(pathname);
  const isCurrentScreenBlocked = currentScreenKey ? !isScreenAllowed(currentScreenKey) : false;

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const overviewItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: 'dashboard.view', key: 'dashboard' },
    { href: "/dashboard/calendar", label: "Calendar", icon: FileBarChart2, perm: 'dashboard.view', key: 'calendar' },
  ].filter(i => hasPermission(i.perm) && isScreenAllowed(i.key));

  const financeItems = [
    { href: "/dashboard/invoices", label: "Invoices", icon: Receipt, badge: 3, perm: 'invoices.view', key: 'invoices' },
    { href: "/dashboard/expenses", label: "Expenses", icon: CreditCard, perm: 'expenses.view', key: 'expenses' },
    { href: "/dashboard/payments", label: "Payments", icon: TrendingUp, badge: 7, perm: 'invoices.view', key: 'payments' },
  ].filter(i => hasPermission(i.perm) && isScreenAllowed(i.key));

  const toolItems = [
    { href: "/dashboard/notifications", label: "Notification", icon: Bell, badge: 4, perm: 'notifications.view', key: 'notifications' },
    { href: "/dashboard/integrations", label: "Integration", icon: Zap, perm: 'settings.view', key: 'integrations' },
    { href: "/dashboard/inbox", label: "Inbox", icon: Mail, badge: 5, perm: 'notifications.view', key: 'inbox' },
    { href: "/dashboard/reports", label: "Reporting", icon: FileBarChart2, perm: 'reports.view', key: 'reports' },
  ].filter(i => hasPermission(i.perm) && isScreenAllowed(i.key));

  const metricItems = [
    { href: "/dashboard/active", label: "Active", icon: TrendingUp, badge: 1, perm: 'dashboard.view', key: 'active' },
    { href: "/dashboard/past", label: "Past", icon: FileBarChart2, perm: 'dashboard.view', key: 'past' },
  ].filter(i => hasPermission(i.perm) && isScreenAllowed(i.key));

  // Settings and admin items - visible to admins and managers
  const settingsItems: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [];
  if (hasPermission('settings.view')) {
    settingsItems.push({ href: "/dashboard/settings", label: "Settings", icon: Settings });
  }
  if (hasPermission('users.manage')) {
    settingsItems.push({ href: "/dashboard/settings/users", label: "Users", icon: Users });
  }
  if (hasPermission('roles.manage')) {
    settingsItems.push({ href: "/dashboard/settings/roles", label: "Roles", icon: Shield });
  }
  if (hasPermission('settings.view')) {
    settingsItems.push({ href: "/dashboard/settings/plan", label: "Subscription", icon: CreditCard });
  }
  if (hasPermission('users.manage')) {
    settingsItems.push({ href: "/dashboard/settings/screens", label: "Screen Access", icon: Lock });
  }
  if (user?.isPlatformOrg) {
    settingsItems.push({ href: "/admin", label: "Platform Admin", icon: Shield });
  }

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        {/* Logo Header */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="cursor-pointer">
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-tr from-primary to-emerald-400 p-0.5 flex items-center justify-center">
                      <div className="h-full w-full rounded-md bg-primary flex items-center justify-center">
                        <Activity className="h-4 w-4 text-emerald-400" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">FinFlow</span>
                      <span className="text-xs text-muted-foreground">DirectFN Finance</span>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <Activity className="h-4 w-4 mr-2 text-primary" />
                    DirectFN Finance (HQ)
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                    DirectFN Dev Services
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {/* Overview Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Overview</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {overviewItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive} tooltip={item.label}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Finance Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Finance</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {financeItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive} tooltip={item.label}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {item.badge && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Tools Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {toolItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive} tooltip={item.label}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {item.badge && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Metrics Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Metrics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {metricItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive} tooltip={item.label}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {item.badge && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Settings Section */}
          {settingsItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive} tooltip={item.label}>
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter>
          <SidebarSeparator />
          <SidebarMenu>
             <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="#" />} tooltip="Help Center">
                <HelpCircle />
                <span>Help Center</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton className="text-destructive cursor-pointer" onClick={handleLogout} tooltip="Logout">
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="#" />} tooltip="Invite teams">
                <Users />
                <span>Invite teams</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarSeparator />
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="cursor-pointer">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-tr from-primary to-emerald-400 text-white text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold text-sm">{user?.name || "User"}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" side="top" align="start">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/settings")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-destructive" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Main Content Inset */}
      <SidebarInset>
        {/* Top Navbar */}
        <header className="h-14 sticky top-0 z-30 flex items-center justify-between gap-4 px-4 bg-background/80 backdrop-blur-md border-b">
          {/* Left side */}
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <nav className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Finance</span>
              <span className="text-xs">&gt;</span>
              <span className="font-semibold text-foreground">Dashboard</span>
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                className="w-48 pl-8 h-8"
              />
            </div>

            {/* Manage */}
            <Tooltip>
              <TooltipTrigger render={
                <Button variant="ghost" size="icon-sm" className="cursor-pointer" />
              }>
                  <SlidersHorizontal className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>Manage</TooltipContent>
            </Tooltip>

            {/* Share */}
            <Tooltip>
              <TooltipTrigger render={
                <Button variant="ghost" size="icon-sm" className="cursor-pointer" />
              }>
                  <Share2 className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>Share</TooltipContent>
            </Tooltip>

            {/* Notifications */}
            <div className="relative">
              <Tooltip>
                <TooltipTrigger render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="relative cursor-pointer"
                    onClick={() => setShowNotifications(!showNotifications)}
                  />
                }>
                    <Bell className="h-4 w-4" />
                    {notifications.length > 0 && (
                      <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                    )}
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-card border rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/50">
                    <span className="text-sm font-semibold">Notifications</span>
                    <button onClick={handleMarkAllRead} className="text-xs text-primary font-medium cursor-pointer hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-xs text-muted-foreground text-center">No notifications</div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <Badge variant={
                              notif.type === "warning" ? "destructive" :
                              notif.type === "success" ? "secondary" :
                              "outline"
                            } className="text-[10px] h-5">
                              {notif.type}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{notif.time}</span>
                          </div>
                          <h4 className="text-xs font-semibold mt-1">{notif.title}</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{notif.desc}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Primary CTA */}
            <Button size="sm" className="cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-transaction-modal'))}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Transaction</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            {isCurrentScreenBlocked ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center border rounded-2xl bg-card shadow-sm">
                <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4 border border-destructive/20">
                  <Shield className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">Screen Access Restricted</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  Access to this feature or screen has been restricted for your organization by your administrator.
                </p>
                <Button variant="default" className="mt-6 cursor-pointer" onClick={() => router.push('/dashboard')}>
                  Return to Overview
                </Button>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
