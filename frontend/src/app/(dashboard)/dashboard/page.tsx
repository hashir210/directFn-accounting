"use client";

import React, { useState, useEffect } from "react";
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

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [dateFilter, setDateFilter] = useState("30");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [txType, setTxType] = useState<"Invoice" | "Expense">("Invoice");
  const [txAmount, setTxAmount] = useState("");
  const [txStatus, setTxStatus] = useState<"Paid" | "Pending">("Pending");
  const [txDueDate, setTxDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, hasPermission } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [bankAccounts, setBankAccounts] = useState<{ id: string; name: string; bankName: string; balance: number; currency: string }[]>([]);
  const [cashFlowData, setCashFlowData] = useState<{ name: string; Inflow: number; Outflow: number }[]>([]);
  const [salesExpensesData, setSalesExpensesData] = useState<{ name: string; Sales: number; Expenses: number }[]>([]);

  useEffect(() => {
    setMounted(true);
    const handleOpen = () => openModal();
    window.addEventListener('open-transaction-modal', handleOpen);
    return () => window.removeEventListener('open-transaction-modal', handleOpen);
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
  }, [user]);

  const openModal = () => {
    setIsModalOpen(true);
    setTxDueDate(new Date().toISOString().split("T")[0]);
  };

  const pendingRevenue = transactions.filter(t => t.type === "Invoice" && t.status !== "Paid").reduce((s, t) => s + t.amount, 0);
  const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  // Bank liquidity is the actual aggregated balance from the API — do NOT add
  // netProfit on top of it (that double-counts revenue already reflected in
  // the account balances).
  const bankBalance = totalBalance;

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !txAmount) return;
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    try {
      setIsSubmitting(true);
      const today = new Date().toISOString().split("T")[0];
      const payloadDate = txDueDate || today;
      
      const response = await apiFetch<{ data: any, type: string }>('/api/v1/dashboard/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: txType,
          customerName,
          amount: amountNum,
          dueDate: payloadDate,
          status: txStatus
        })
      });

      const returnedId = response.data.id;
      const returnedInvoiceNo = response.type === 'Invoice' ? response.data.invoiceNo : `EXP-${returnedId.slice(0,6)}`;

      const newTx: Transaction = {
        id: returnedId,
        invoiceNo: returnedInvoiceNo,
        customer: customerName,
        type: txType,
        date: today,
        dueDate: payloadDate,
        status: txStatus,
        amount: amountNum,
      };

      setTransactions([newTx, ...transactions]);

      if (txType === "Invoice") {
        setTotalRevenue(prev => prev + amountNum);
        setNetProfit(prev => prev + amountNum);
        const existing = topCustomers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
        if (existing) {
          setTopCustomers(topCustomers.map(c => c.id === existing.id ? { ...c, billing: c.billing + amountNum, salesCount: c.salesCount + 1 } : c));
        } else {
          const colors = ["bg-purple-500", "bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-rose-500"];
          setTopCustomers([...topCustomers, {
            id: `c-${Date.now()}`,
            name: customerName,
            email: `${customerName.toLowerCase().replace(/\s+/g, "")}@example.com`,
            billing: amountNum,
            salesCount: 1,
            avatarColor: colors[Math.floor(Math.random() * colors.length)],
          }]);
        }
      } else if (txType === "Expense") {
        setTotalExpenses(prev => prev + amountNum);
        setNetProfit(prev => prev - amountNum);
      }

      setCustomerName("");
      setTxAmount("");
      setTxStatus("Pending");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save transaction to ledger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ActionIcons = () => (
    <CardAction>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground"><Pencil /></Button>
        <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground"><Maximize2 /></Button>
        <Button variant="ghost" size="icon-xs" className="cursor-pointer text-muted-foreground"><MoreHorizontal /></Button>
      </div>
    </CardAction>
  );

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
            <ActionIcons />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-semibold">
              ${totalRevenue.toLocaleString("en-US")}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <Badge variant="secondary" className="gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400">
                <ArrowUpRight className="h-3 w-3" /> 12.4%
              </Badge>
              <span className="text-muted-foreground">vs last {dateFilter}d</span>
            </div>
            <Progress value={75} className="mt-3 h-1" />
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader>
            <CardDescription>Business Expenses</CardDescription>
            <ActionIcons />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-semibold">
              ${totalExpenses.toLocaleString("en-US")}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <Badge variant="secondary" className="gap-1 text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400">
                <ArrowDownRight className="h-3 w-3" /> 3.2%
              </Badge>
              <span className="text-muted-foreground">vs last {dateFilter}d</span>
            </div>
            <Progress value={35} className="mt-3 h-1" />
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card>
          <CardHeader>
            <CardDescription>Net Profit / Margin</CardDescription>
            <ActionIcons />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-semibold">
              ${netProfit.toLocaleString("en-US")}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <Progress value={Math.max(0, Math.min(100, netProfitMargin))} className="h-1.5 flex-1" />
              <span className="font-semibold text-primary">{netProfitMargin.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Bank Balance */}
        <Card>
          <CardHeader>
            <CardDescription>Bank Liquidity</CardDescription>
            <ActionIcons />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-semibold">
              ${bankBalance.toLocaleString("en-US")}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{bankAccounts.length} account{bankAccounts.length === 1 ? "" : "s"}</span>
              <span>{bankAccounts[0]?.currency || "USD"}</span>
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
            <Button variant="outline" size="sm" className="cursor-pointer">
              <LayoutGrid className="h-3.5 w-3.5 mr-1" /> Widgets
            </Button>
            <Button variant="outline" size="sm" className="cursor-pointer">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1" /> Filter
            </Button>
            <Button size="sm" className="cursor-pointer" onClick={openModal}>
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
                        <TableCell className="text-right font-semibold">${tx.amount.toLocaleString()}</TableCell>
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

              <Card className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
                <CardContent className="pt-5">
                  <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-[10px]">
                    <Sparkles className="h-3 w-3 mr-1" /> Pro Feature
                  </Badge>
                  <h4 className="text-sm font-semibold mt-3">DirectFN Ledger Engine</h4>
                  <p className="text-xs text-primary-foreground/70 leading-relaxed mt-1">
                    Simulate ledger changes! Click Add Entry to create mock invoices or expenses and watch stats recalculate.
                  </p>
                  <Button variant="secondary" className="w-full mt-4 cursor-pointer" size="sm" onClick={openModal}>
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
                  Unpaid: ${pendingRevenue.toLocaleString()}
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
                      <TableCell className="text-right font-semibold">${tx.amount.toLocaleString()}</TableCell>
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
                      <TableCell className="text-right font-semibold">${cust.billing.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Modal - using shadcn Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Transaction</DialogTitle>
            <DialogDescription>
              Create a new invoice or expense entry in the ledger.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTransaction} className="space-y-4">
            <div className="space-y-2">
              <Label>Entry Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={txType === "Invoice" ? "default" : "outline"}
                  onClick={() => setTxType("Invoice")}
                  className="cursor-pointer"
                >
                  Invoice (Receivable)
                </Button>
                <Button
                  type="button"
                  variant={txType === "Expense" ? "default" : "outline"}
                  onClick={() => setTxType("Expense")}
                  className="cursor-pointer"
                >
                  Expense (Payable)
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{txType === "Invoice" ? "Client Name" : "Vendor Name"}</Label>
              <Input
                required
                placeholder="e.g. Stark Industries"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  required
                  min="1"
                  placeholder="5000"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  required
                  value={txDueDate}
                  onChange={(e) => setTxDueDate(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="status" checked={txStatus === "Paid"} onChange={() => setTxStatus("Paid")} className="accent-primary cursor-pointer h-4 w-4" />
                  Paid
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="status" checked={txStatus === "Pending"} onChange={() => setTxStatus("Pending")} className="accent-primary cursor-pointer h-4 w-4" />
                  Pending
                </label>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button" className="cursor-pointer" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Entry to Ledger'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
