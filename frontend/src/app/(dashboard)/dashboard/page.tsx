"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  AlertTriangle,
  TrendingUp,
  Plus,
  Calendar,
  X,
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
import { Separator } from "@/components/ui/separator";
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
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

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

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "tx-1", invoiceNo: "INV-2026-001", customer: "Apex Global Systems", type: "Invoice", date: "2026-07-02", dueDate: "2026-08-02", status: "Paid", amount: 24500 },
    { id: "tx-2", invoiceNo: "EXP-2026-020", customer: "Direct Hosting AWS", type: "Expense", date: "2026-07-04", dueDate: "2026-07-15", status: "Paid", amount: 4800 },
    { id: "tx-3", invoiceNo: "INV-2026-002", customer: "Horizon Ventures", type: "Invoice", date: "2026-07-08", dueDate: "2026-07-28", status: "Overdue", amount: 18700 },
    { id: "tx-4", invoiceNo: "EXP-2026-021", customer: "Vercel Enterprise Billing", type: "Expense", date: "2026-07-10", dueDate: "2026-07-24", status: "Paid", amount: 1200 },
    { id: "tx-5", invoiceNo: "INV-2026-003", customer: "Acme Corporation", type: "Invoice", date: "2026-07-11", dueDate: "2026-08-11", status: "Pending", amount: 15300 },
    { id: "tx-6", invoiceNo: "INV-2026-004", customer: "Initech LLC", type: "Invoice", date: "2026-07-12", dueDate: "2026-08-12", status: "Pending", amount: 8900 },
    { id: "tx-7", invoiceNo: "EXP-2026-022", customer: "HQ Office Co-working Rent", type: "Expense", date: "2026-07-13", dueDate: "2026-07-20", status: "Pending", amount: 3500 },
    { id: "tx-8", invoiceNo: "INV-2026-005", customer: "Stark Industries", type: "Invoice", date: "2026-07-14", dueDate: "2026-08-14", status: "Paid", amount: 42000 },
  ]);

  const [stockItems] = useState<StockItem[]>([
    { id: "st-1", name: "FinFlow POS Terminal V2", sku: "FF-POS-V2", stock: 3, minLevel: 10, status: "Critically Low" },
    { id: "st-2", name: "Thermal Receipt Paper Roll", sku: "FF-TRP-80", stock: 8, minLevel: 25, status: "Low" },
    { id: "st-3", name: "FinFlow QR Stand Metallic", sku: "FF-QRS-MET", stock: 12, minLevel: 15, status: "Low" },
    { id: "st-4", name: "Backup Battery Pack Pro", sku: "FF-BBP-PRO", stock: 45, minLevel: 15, status: "In Stock" },
  ]);

  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([
    { id: "c-1", name: "Stark Industries", email: "pepper@stark.com", billing: 87500, salesCount: 5, avatarColor: "bg-red-500" },
    { id: "c-2", name: "Apex Global Systems", email: "billing@apexglobal.com", billing: 54200, salesCount: 3, avatarColor: "bg-blue-500" },
    { id: "c-3", name: "Horizon Ventures", email: "finance@horizon.vc", billing: 36800, salesCount: 2, avatarColor: "bg-amber-500" },
    { id: "c-4", name: "Acme Corporation", email: "accounting@acme.com", billing: 29500, salesCount: 2, avatarColor: "bg-emerald-500" },
  ]);

  useEffect(() => {
    setMounted(true);
    const btn = document.getElementById("global-invoice-btn");
    if (btn) {
      btn.onclick = (e) => {
        e.preventDefault();
        openModal();
      };
    }
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
    setTxDueDate(new Date().toISOString().split("T")[0]);
  };

  const totalRevenue = transactions.filter(t => t.type === "Invoice" && t.status === "Paid").reduce((s, t) => s + t.amount, 0);
  const pendingRevenue = transactions.filter(t => t.type === "Invoice" && t.status !== "Paid").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "Expense").reduce((s, t) => s + t.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const bankBalance = 248500 + netProfit;

  const multiplier = dateFilter === "90" ? 1.8 : dateFilter === "365" ? 4.5 : 1.0;
  const cashFlowData = [
    { name: "Wk 1", Inflow: Math.round(18000 * multiplier), Outflow: Math.round(11000 * multiplier) },
    { name: "Wk 2", Inflow: Math.round(24000 * multiplier), Outflow: Math.round(16000 * multiplier) },
    { name: "Wk 3", Inflow: Math.round(31000 * multiplier), Outflow: Math.round(15000 * multiplier) },
    { name: "Wk 4", Inflow: Math.round(42000 * multiplier), Outflow: Math.round(18000 * multiplier) },
  ];

  const salesExpensesData = [
    { name: "Feb", Sales: 42000, Expenses: 22000 },
    { name: "Mar", Sales: 58000, Expenses: 29000 },
    { name: "Apr", Sales: 69000, Expenses: 31000 },
    { name: "May", Sales: 52000, Expenses: 41000 },
    { name: "Jun", Sales: 88000, Expenses: 36000 },
    { name: "Jul", Sales: Math.round(totalRevenue), Expenses: Math.round(totalExpenses) },
  ];

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !txAmount) return;
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const today = new Date().toISOString().split("T")[0];
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      invoiceNo: `${txType === "Invoice" ? "INV" : "EXP"}-2026-0${transactions.length + 1}`,
      customer: customerName,
      type: txType,
      date: today,
      dueDate: txDueDate || today,
      status: txStatus,
      amount: amountNum,
    };

    setTransactions([newTx, ...transactions]);

    if (txType === "Invoice") {
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
    }

    setCustomerName("");
    setTxAmount("");
    setTxStatus("Pending");
    setIsModalOpen(false);
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
              <Progress value={Math.min(100, netProfitMargin)} className="h-1.5 flex-1" />
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
              <span>Checking: $185K</span>
              <span>Savings: $63K</span>
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
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <ReTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="Inflow" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#inflowGrad)" />
                    <Area type="monotone" dataKey="Outflow" stroke="#7c3aed" strokeWidth={2} fillOpacity={1} fill="url(#outflowGrad)" />
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
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesExpensesData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <ReTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                    <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#7c3aed" radius={[4, 4, 0, 0]} />
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
              <DialogClose render={
                <Button variant="outline" type="button" className="cursor-pointer" />
              }>
                Cancel
              </DialogClose>
              <Button type="submit" className="cursor-pointer">Post Entry to Ledger</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
