"use client";

import React, { useState } from "react";
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
  ChevronDown,
  Share2,
  SlidersHorizontal,
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: "Low Stock Warning", desc: "FinFlow POS Terminal below reorder level (5 remaining).", time: "10m ago", type: "warning" },
    { id: 2, title: "Invoice Paid", desc: "Acme Corp completed payment for Invoice #INV-2026-004.", time: "1h ago", type: "success" },
    { id: 3, title: "Expense Pending", desc: "Manager approval required for travel expense $450.00.", time: "4h ago", type: "info" },
    { id: 4, title: "System Update", desc: "Platform migrated to Core Engine v1.0.", time: "1d ago", type: "system" },
  ];

  const handleLogout = () => router.push("/login");

  const overviewItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/calendar", label: "Calendar", icon: FileBarChart2 },
  ];

  const financeItems = [
    { href: "/dashboard/invoices", label: "Invoices", icon: Receipt, badge: 3 },
    { href: "/dashboard/expenses", label: "Expenses", icon: CreditCard },
    { href: "/dashboard/payments", label: "Payments", icon: TrendingUp, badge: 7 },
  ];

  const toolItems = [
    { href: "/dashboard/notifications", label: "Notification", icon: Bell, badge: 4 },
    { href: "/dashboard/integrations", label: "Integration", icon: Zap },
    { href: "/dashboard/inbox", label: "Inbox", icon: Mail, badge: 5 },
    { href: "/dashboard/reports", label: "Reporting", icon: FileBarChart2 },
  ];

  const metricItems = [
    { href: "/dashboard/active", label: "Active", icon: TrendingUp, badge: 1 },
    { href: "/dashboard/past", label: "Past", icon: FileBarChart2 },
  ];

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        {/* Logo Header */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <SidebarMenuButton size="lg" className="cursor-pointer" />
                }>
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-tr from-primary to-emerald-400 p-0.5 flex items-center justify-center">
                      <div className="h-full w-full rounded-[6px] bg-[#1B3530] flex items-center justify-center">
                        <Activity className="h-4 w-4 text-emerald-400" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">FinFlow</span>
                      <span className="text-xs text-muted-foreground">DirectFN Finance</span>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4" />
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
              <SidebarMenuButton render={<Link href="/dashboard/settings" />} tooltip="Settings">
                <Settings />
                <span>Settings</span>
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
                <DropdownMenuTrigger render={
                  <SidebarMenuButton size="lg" className="cursor-pointer" />
                }>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-tr from-primary to-emerald-400 text-white text-xs font-bold">
                        KB
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold text-sm">Kamil Bachanek</span>
                      <span className="text-xs text-muted-foreground">kamil@directfn.com</span>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" side="top" align="start">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
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
                    <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-card border rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/50">
                    <span className="text-sm font-semibold">Notifications</span>
                    <button className="text-xs text-primary font-medium cursor-pointer hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y">
                    {notifications.map((notif) => (
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
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Primary CTA */}
            <Button id="global-invoice-btn" size="sm" className="cursor-pointer">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Transaction</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
