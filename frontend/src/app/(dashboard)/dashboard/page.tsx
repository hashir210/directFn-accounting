"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Plus,
  Calendar,
  Sparkles,
  DollarSign,
  MoreHorizontal,
  Maximize2,
  Pencil,
  SlidersHorizontal,
  LayoutGrid,
  Building2,
  Users,
  Globe,
  Loader2,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  Warehouse,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/features/auth/useAuth";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface PendingInvoice {
  id: string;
  invoiceNo: string;
  customer: { id: string; name: string; email: string };
  amount: number;
  status: "pending" | "paid" | "overdue";
  dueAt: string;
  issuedAt: string;
}

function normalizeStatus(s: string): "Paid" | "Pending" | "Overdue" {
  if (s === "paid") return "Paid";
  if (s === "overdue") return "Overdue";
  return "Pending";
}

interface Transaction {
  id: string;
  invoiceNo: string;
  customer: string;
  type: "Invoice" | "Expense";
  date: string;
  dueDate: string;
  status: "Paid" | "Pending" | "Overdue";
  amount: number;
}

type DashboardTransactionResponse =
  | { type: "Invoice"; data: { id: string; invoiceNo: string } }
  | { type: "Expense"; data: { id: string } };

interface StockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minLevel: number;
  status: "Critically Low" | "Low" | "In Stock";
}

interface TopCustomer {
  id: string;
  name: string;
  email: string;
  billing: number;
  salesCount: number;
  avatarColor: string;
}

// --- Platform admin dashboard ---
interface PlatformStats {
  totalOrganizations: number;
  totalUsers: number;
  totalInvoiced: number;
  totalPaid: number;
}

interface OrgSummary {
  id: string; name: string; planId?: string | null;
  plan: { id: string; name: string } | null;
  status: string; isPlatform: boolean;
  maxUsers?: number | null;
  contactEmail?: string | null;
  createdAt: string;
  _count: { users: number; invoices: number; customers: number };
}

function PlatformDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsData, orgsData] = await Promise.all([
          apiFetch<PlatformStats>('/api/v1/platform/stats'),
          apiFetch<OrgSummary[]>('/api/v1/platform/organizations'),
        ]);
        setStats(statsData);
        setOrgs(orgsData);
      } catch (err) {
        console.error('Failed to load platform dashboard', err);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const activeOrgs = orgs.filter(o => o.status === 'active').length;
  const suspendedOrgs = orgs.filter(o => o.status !== 'active').length;
  const totalUsers = orgs.reduce((s, o) => s + o._count.users, 0);
  const recentOrgs = [...orgs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">Monitor and manage all companies on FinFlow.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Companies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrganizations || 0}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="text-emerald-600 font-medium">{activeOrgs} active</span>
              {suspendedOrgs > 0 && <span className="text-rose-600 font-medium">{suspendedOrgs} suspended</span>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="text-xs text-muted-foreground mt-1">Across all companies</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Invoiced</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {stats?.totalInvoiced.toLocaleString() || '0'}</div>
            <div className="text-xs text-muted-foreground mt-1">Platform-wide revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Collected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">PKR {stats?.totalPaid.toLocaleString() || '0'}</div>
            <div className="text-xs text-muted-foreground mt-1">Successfully collected</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Registered Companies</CardTitle>
            <CardDescription>{orgs.length} total companies on FinFlow</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No companies registered.</TableCell>
                  </TableRow>
                ) : (
                  orgs.map(org => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>{org.plan?.name || 'Free'}</TableCell>
                      <TableCell>{org._count.users}/{org.maxUsers || 5}</TableCell>
                      <TableCell>
                        <Badge variant={org.status === 'active' ? 'secondary' : 'destructive'} className={org.status === 'active' ? 'bg-emerald-50 text-emerald-600' : ''}>
                          {org.status === 'active' ? <CheckCircle2 className="h-3 w-3 mr-1 inline" /> : <XCircle className="h-3 w-3 mr-1 inline" />}
                          {org.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{new Date(org.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recently Registered</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentOrgs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No companies yet.</p>
              ) : (
                recentOrgs.map(org => (
                  <div key={org.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30">
                    <div>
                      <p className="text-xs font-semibold">{org.name}</p>
                      <span className="text-[10px] text-muted-foreground">{org.plan?.name || 'Free'} &middot; {org._count.users} users</span>
                    </div>
                    <Badge variant={org.status === 'active' ? 'secondary' : 'destructive'} className="text-[9px] h-5">
                      {org.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <Badge variant="secondary" className="text-[10px]">
                <Sparkles className="h-3 w-3 mr-1" /> Quick Action
              </Badge>
              <h4 className="text-sm font-semibold mt-3">Register New Company</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Onboard a new client company with an owner account and subscription plan.
              </p>
              <Button className="w-full mt-4 cursor-pointer" size="sm" onClick={() => window.location.href = '/admin'}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Register Company
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- Tenant dashboard ---
function TenantDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dateFilter, setDateFilter] = useState("30");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showWidgetPanel, setShowWidgetPanel] = useState(false);

  const { user, hasPermission } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [revenueTarget, setRevenueTarget] = useState(0);
  const [expenseBudget, setExpenseBudget] = useState(0);
  const [profitGoal, setProfitGoal] = useState(0);
  const [bankAccounts, setBankAccounts] = useState<{ id: string; name: string; bankName: string; balance: number; currency: string }[]>([]);
  const [cashFlowData, setCashFlowData] = useState<{ name: string; Inflow: number; Outflow: number }[]>([]);
  const [salesExpensesData, setSalesExpensesData] = useState<{ name: string; Sales: number; Expenses: number }[]>([]);

  useEffect(() => {
    setMounted(true);
    const handleRefresh = () => setRefreshKey(k => k + 1);
    window.addEventListener('refresh-transactions', handleRefresh);
    return () => window.removeEventListener('refresh-transactions', handleRefresh);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const year = new Date().getFullYear();
      try {
        const summary = await apiFetch<{
          totalRevenue: number;
          totalExpenses: number;
          netProfit: number;
          cashFlow: { month: number; revenue: number; expenses: number; net: number }[];
          targets?: { revenueTarget: number; expenseBudget: number; profitGoal: number; };
        }>(`/api/v1/dashboard/summary?year=${year}`);
        const bank = await apiFetch<{ totalBalance: number; accounts: { id: string; name: string; bankName: string; balance: number; currency: string }[] }>(`/api/v1/dashboard/bank-balance`);
        const pending = await apiFetch<{ data: PendingInvoice[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/v1/dashboard/pending-payments?page=1&limit=10`);
        const sales = await apiFetch<{ year: number; data: { month: number; revenue: number; invoiceCount: number }[] }>(`/api/v1/dashboard/monthly-sales?year=${year}`);
        const expenses = await apiFetch<{ year: number; data: { month: number; expenses: number; expenseCount: number }[] }>(`/api/v1/dashboard/monthly-expenses?year=${year}`);
        const lowStock = await apiFetch<{
          count: number;
          products: { id: string; name: string; sku: string; category: string; stockQuantity: number; lowStockThreshold: number; unitPrice: number }[];
        }>(`/api/v1/dashboard/low-stock`);

        if (cancelled) return;

        setTotalRevenue(summary.totalRevenue);
        setTotalExpenses(summary.totalExpenses);
        setNetProfit(summary.netProfit);
        if (summary.targets) {
          setRevenueTarget(summary.targets.revenueTarget || 0);
          setExpenseBudget(summary.targets.expenseBudget || 0);
          setProfitGoal(summary.targets.profitGoal || 0);
        }
        setTotalBalance(bank.totalBalance);
        setBankAccounts(bank.accounts);
        setCashFlowData(
          summary.cashFlow.map((m) => ({ name: MONTH_SHORT[m.month - 1], Inflow: m.revenue, Outflow: m.expenses })),
        );
        const salesMap = new Map(sales.data.map((s) => [s.month, s.revenue]));
        const expMap = new Map(expenses.data.map((e) => [e.month, e.expenses]));
        setSalesExpensesData(
          Array.from({ length: 12 }, (_, i) => {
            const m = i + 1;
            return { name: MONTH_SHORT[i], Sales: salesMap.get(m) || 0, Expenses: expMap.get(m) || 0 };
          }),
        );
        setTransactions(
          pending.data.map((inv) => ({
            id: inv.id,
            invoiceNo: inv.invoiceNo,
            customer: inv.customer.name,
            type: "Invoice",
            date: (inv.issuedAt || "").slice(0, 10),
            dueDate: (inv.dueAt || "").slice(0, 10),
            status: normalizeStatus(inv.status),
            amount: inv.amount,
          })),
        );
        setStockItems(
          lowStock.products.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            stock: p.stockQuantity,
            minLevel: p.lowStockThreshold,
            status:
              p.stockQuantity <= 0
                ? "Critically Low"
                : p.stockQuantity <= p.lowStockThreshold
                  ? "Low"
                  : "In Stock",
          })),
        );

        if (user && hasPermission('customers.view')) {
          try {
            const top = await apiFetch<{ customer: { id: string; name: string; email: string }; totalRevenue: number; invoiceCount: number }[]>(
              `/api/v1/dashboard/top-customers?limit=5`,
            );
            if (!cancelled) {
              const colors = ["bg-purple-500", "bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-rose-500"];
              setTopCustomers(
                top.map((c, i) => ({
                  id: c.customer.id,
                  name: c.customer.name,
                  email: c.customer.email,
                  billing: c.totalRevenue,
                  salesCount: c.invoiceCount,
                  avatarColor: colors[i % colors.length],
                })),
              );
            }
          } catch (err) {
            console.error("Failed to load top customers", err);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, refreshKey]);

  const pendingRevenue = transactions.filter(t => t.type === "Invoice" && t.status !== "Paid").reduce((s, t) => s + t.amount, 0);
  const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const bankBalance = totalBalance;

  const ActionIcons = ({ onEdit, onMaximize, onMore }: { onEdit?: () => void; onMaximize?: () => void; onMore?: () => void }) => (
    <CardAction>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground" onClick={onEdit}><Pencil /></Button>
        <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground" onClick={onMaximize}><Maximize2 /></Button>
        <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground" onClick={onMore}><MoreHorizontal /></Button>
      </div>
    </CardAction>
  );

  const handleUpdateTarget = async (field: string, promptText: string, currentValue: number) => {
    const val = prompt(promptText, currentValue.toString());
    if (!val) return;
    const num = parseFloat(val);
    if (isNaN(num)) return;
    try {
      await apiFetch('/api/v1/organizations/current', {
        method: 'PATCH',
        body: JSON.stringify({ [field]: num }),
      });
      if (field === 'revenueTarget') setRevenueTarget(num);
      if (field === 'expenseBudget') setExpenseBudget(num);
      if (field === 'profitGoal') setProfitGoal(num);
    } catch (err) {
      console.error('Failed to update target', err);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold">Financial Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Stay on top of your finances, monitor progress, and track status.
          </p>
        </div>

        {/* Avatar Stack + Filter */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {["KB", "AP", "HV"].map((initials, i) => (
              <Avatar key={i} className="h-8 w-8 border-2 border-background">
                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            ))}
            <Avatar className="h-8 w-8 border-2 border-background">
              <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">+</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex items-center bg-muted p-0.5 rounded-lg">
            {[
              { id: "30", label: "30d" },
              { id: "90", label: "90d" },
              { id: "365", label: "1y" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setDateFilter(btn.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  dateFilter === btn.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card>
          <CardHeader>
            <CardDescription>Corporate Revenue</CardDescription>
            <ActionIcons
              onEdit={() => handleUpdateTarget('revenueTarget', 'Set annual revenue target:', revenueTarget)}
              onMaximize={() => setShowFilterPanel(!showFilterPanel)}
              onMore={() => router.push('/dashboard/reports/revenue')}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-semibold">
              PKR {totalRevenue.toLocaleString("en-US")}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <Badge variant="secondary" className="gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400">
                <ArrowUpRight className="h-3 w-3" /> Target: PKR {revenueTarget.toLocaleString()}
              </Badge>
            </div>
            <Progress value={revenueTarget > 0 ? (totalRevenue / revenueTarget) * 100 : 0} className="mt-3 h-1" />
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader>
            <CardDescription>Business Expenses</CardDescription>
            <ActionIcons
              onEdit={() => handleUpdateTarget('expenseBudget', 'Set annual expense budget:', expenseBudget)}
              onMaximize={() => setShowFilterPanel(!showFilterPanel)}
              onMore={() => router.push('/dashboard/expenses')}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-semibold">
              PKR {totalExpenses.toLocaleString("en-US")}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <Badge variant="secondary" className="gap-1 text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400">
                Budget: PKR {expenseBudget.toLocaleString()}
              </Badge>
            </div>
            <Progress value={expenseBudget > 0 ? (totalExpenses / expenseBudget) * 100 : 0} className="mt-3 h-1" />
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card>
          <CardHeader>
            <CardDescription>Net Profit</CardDescription>
            <ActionIcons
              onEdit={() => handleUpdateTarget('profitGoal', 'Set annual net profit goal:', profitGoal)}
              onMaximize={() => setShowFilterPanel(!showFilterPanel)}
              onMore={() => router.push('/dashboard/reports/profit-loss')}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-semibold">
              PKR {netProfit.toLocaleString("en-US")}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <Progress value={profitGoal > 0 ? (netProfit / profitGoal) * 100 : 0} className="h-1.5 flex-1" />
              <span className="font-semibold text-primary">{profitGoal > 0 ? ((netProfit / profitGoal) * 100).toFixed(0) : 0}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Bank Balance */}
        <Card>
          <CardHeader>
            <CardDescription>Bank Liquidity</CardDescription>
            <ActionIcons
              onEdit={() => router.push('/dashboard/company')}
              onMaximize={() => setShowFilterPanel(!showFilterPanel)}
              onMore={() => router.push('/dashboard/payments')}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-semibold">
              PKR {bankBalance.toLocaleString("en-US")}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{bankAccounts.length} account{bankAccounts.length === 1 ? "" : "s"}</span>
              <span>{bankAccounts[0]?.currency || "PKR"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cash Flow Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Cash Flow Liquidity</CardTitle>
              <CardDescription>Inflows vs. Outflows calculated weekly</CardDescription>
            </div>
            <CardAction>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Inflow</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Outflow</span>
                </div>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
          <div className="h-64 w-full">
            {mounted && !loading ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <ReTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="Inflow" stroke="var(--chart-2)" strokeWidth={2} fillOpacity={1} fill="url(#inflowGrad)" />
                    <Area type="monotone" dataKey="Outflow" stroke="var(--chart-1)" strokeWidth={2} fillOpacity={1} fill="url(#outflowGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full bg-muted animate-pulse rounded-lg flex items-center justify-center text-xs text-muted-foreground">Loading...</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Comparison */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Monthly Comparison</CardTitle>
              <CardDescription>Sales vs Expenses</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
          <div className="h-64 w-full">
            {mounted && !loading ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesExpensesData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <ReTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }} />
                    <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="Sales" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenses" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full bg-muted animate-pulse rounded-lg flex items-center justify-center text-xs text-muted-foreground">Loading...</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview" className="cursor-pointer">Overview</TabsTrigger>
            <TabsTrigger value="payments" className="cursor-pointer">Pending</TabsTrigger>
            <TabsTrigger value="stock" className="cursor-pointer">Stock Alerts</TabsTrigger>
            <TabsTrigger value="customers" className="cursor-pointer">Customers</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setShowWidgetPanel(!showWidgetPanel)}>
              <LayoutGrid className="h-3.5 w-3.5 mr-1" /> Widgets
            </Button>
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setShowFilterPanel(!showFilterPanel)}>
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-customer-modal'))}>
              <Users className="h-3.5 w-3.5 mr-1" /> Customer
            </Button>
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-supplier-modal'))}>
              <Truck className="h-3.5 w-3.5 mr-1" /> Supplier
            </Button>
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-product-modal'))}>
              <Package className="h-3.5 w-3.5 mr-1" /> Product
            </Button>
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-inventory-modal'))}>
              <Warehouse className="h-3.5 w-3.5 mr-1" /> Stock
            </Button>
            <Button size="sm" className="cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-transaction-modal'))}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Entry
            </Button>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardAction>
                  <span className="text-xs text-muted-foreground">{transactions.length} items</span>
                </CardAction>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Counterparty</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">{tx.invoiceNo}</TableCell>
                        <TableCell>{tx.customer}</TableCell>
                        <TableCell>
                          <Badge variant={tx.type === "Invoice" ? "secondary" : "destructive"}>
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                        <TableCell>
                          <Badge variant={
                            tx.status === "Paid" ? "secondary" :
                            tx.status === "Pending" ? "outline" : "destructive"
                          } className={
                            tx.status === "Paid" ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" :
                            tx.status === "Pending" ? "text-amber-600" : ""
                          }>
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">PKR {tx.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Sidebar widgets */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Inventory Shortfalls</CardTitle>
                  <CardAction><AlertTriangle className="h-4 w-4 text-destructive" /></CardAction>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stockItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30">
                      <div>
                        <p className="text-xs font-semibold">{item.name}</p>
                        <span className="text-[10px] text-muted-foreground">SKU: {item.sku}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold block">{item.stock} left</span>
                        <Badge variant="destructive" className="text-[9px] mt-0.5">Min: {item.minLevel}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5">
                  <Badge variant="secondary" className="text-[10px]">
                    <Sparkles className="h-3 w-3 mr-1" /> Pro Feature
                  </Badge>
                  <h4 className="text-sm font-semibold mt-3">DirectFN Ledger Engine</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    Simulate ledger changes. Click Add Entry to create mock invoices or expenses and watch stats recalculate.
                  </p>
                  <Button className="w-full mt-4 cursor-pointer" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('open-transaction-modal'))}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Simulate Activity
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Pending Receivables</CardTitle>
              <CardAction>
                <Badge variant="outline" className="text-amber-600">
                  Unpaid: PKR {pendingRevenue.toLocaleString()}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.filter(t => t.type === "Invoice" && t.status !== "Paid").map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.invoiceNo}</TableCell>
                      <TableCell>{tx.customer}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant={tx.status === "Pending" ? "outline" : "destructive"} className={tx.status === "Pending" ? "text-amber-600" : ""}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">PKR {tx.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Tab */}
        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Critical Stock Items</CardTitle>
              <CardAction>
                <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Low levels</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Minimum</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-muted-foreground">{item.sku}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.stock} units</TableCell>
                      <TableCell className="text-muted-foreground">{item.minLevel} units</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={
                          item.status === "Critically Low" ? "destructive" :
                          item.status === "Low" ? "outline" : "secondary"
                        } className={item.status === "Low" ? "text-amber-600" : ""}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardAction><span className="text-xs text-muted-foreground">By billing volume</span></CardAction>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead className="text-right">Total Billing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.map((cust) => (
                    <TableRow key={cust.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className={`${cust.avatarColor} text-white text-[10px] font-bold`}>
                              {cust.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{cust.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{cust.email}</TableCell>
                      <TableCell>{cust.salesCount} files</TableCell>
                      <TableCell className="text-right font-semibold">PKR {cust.billing.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}

// --- Root: choose dashboard based on role ---
export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.isPlatformOrg) {
    return <PlatformDashboard />;
  }

  return <TenantDashboard />;
}
