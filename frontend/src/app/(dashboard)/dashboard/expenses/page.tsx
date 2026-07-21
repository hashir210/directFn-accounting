'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  CreditCard,
  Plus,
  Search,
  Download,
  Building2,
  PieChart,
  Receipt,
  FileCheck,
  TrendingDown,
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  vendor: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  receiptAttached: boolean;
  status: 'approved' | 'pending';
}

const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: '1', vendor: 'WeWork Office Leasing', category: 'Rent', description: 'HQ Office Monthly Lease', amount: 12500.00, date: '2026-07-01', receiptAttached: true, status: 'approved' },
  { id: '2', vendor: 'Amazon Web Services', category: 'Software', description: 'Cloud Infrastructure Costs', amount: 4850.20, date: '2026-07-03', receiptAttached: true, status: 'approved' },
  { id: '3', vendor: 'Gusto Payroll Processing', category: 'Salaries', description: 'Mid-Month Payroll Run', amount: 28400.00, date: '2026-07-15', receiptAttached: true, status: 'approved' },
  { id: '4', vendor: 'ConEdison Electric', category: 'Utilities', description: 'Office Electric & HVAC', amount: 1240.00, date: '2026-07-08', receiptAttached: false, status: 'pending' },
  { id: '5', vendor: 'Slack / Salesforce', category: 'Software', description: 'Annual SaaS Licenses', amount: 3600.00, date: '2026-07-12', receiptAttached: true, status: 'approved' },
  { id: '6', vendor: 'Staples Business Logistics', category: 'Supplies', description: 'Office Equipment & Supplies', amount: 890.50, date: '2026-07-14', receiptAttached: false, status: 'pending' },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('Software');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.vendor.toLowerCase().includes(search.toLowerCase()) ||
      exp.category.toLowerCase().includes(search.toLowerCase()) ||
      exp.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || exp.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const totalMonthlyOutflow = expenses.reduce((acc, e) => acc + e.amount, 0);
  const approvedExpenses = expenses.filter((e) => e.status === 'approved').reduce((acc, e) => acc + e.amount, 0);
  const pendingExpenses = expenses.filter((e) => e.status === 'pending').reduce((acc, e) => acc + e.amount, 0);

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor || !amount) return;

    const newExp: ExpenseItem = {
      id: String(Date.now()),
      vendor,
      category,
      description: description || `${category} Expense`,
      amount: parseFloat(amount),
      date: date || new Date().toISOString().split('T')[0],
      receiptAttached: true,
      status: 'approved',
    };

    setExpenses([newExp, ...expenses]);
    setVendor('');
    setDescription('');
    setAmount('');
    setDate('');
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record, organize, and monitor operational expenses and vendor payments.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Record Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <form onSubmit={handleRecordExpense}>
              <DialogHeader>
                <DialogTitle>Record New Expense</DialogTitle>
                <DialogDescription>Enter vendor billing and categorization information.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor / Recipient</Label>
                  <Input
                    id="vendor"
                    required
                    placeholder="AWS / Slack / Landlord"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="w-full h-9 px-3 py-1 bg-background border rounded-md text-xs font-medium focus:ring-2 focus:ring-primary cursor-pointer"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Software">Software & IT</option>
                      <option value="Salaries">Payroll & Salaries</option>
                      <option value="Rent">Office Rent</option>
                      <option value="Utilities">Utilities & HVAC</option>
                      <option value="Supplies">Office Supplies</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      required
                      placeholder="1200.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Monthly cloud hosting fee"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Expense Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="cursor-pointer">
                  Save Expense
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Outflow</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMonthlyOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">This billing cycle</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Top Category</CardTitle>
            <PieChart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">Salaries & Payroll</div>
            <p className="text-xs text-muted-foreground mt-1">55.8% of total expenses</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Approved Outflow</CardTitle>
            <FileCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">${approvedExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-emerald-600/80 mt-1">Verified & processed</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Pending Approval</CardTitle>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">${pendingExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-amber-600/80 mt-1">Awaiting audit review</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar & Filter Table */}
      <Card className="shadow-2xs">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendor or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-medium">
                {['all', 'salaries', 'rent', 'software', 'utilities'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                      categoryFilter === cat ? 'bg-background text-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <Button variant="outline" size="sm" className="cursor-pointer text-xs h-9">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor / Recipient</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    No expense records found matching criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((exp) => (
                  <TableRow key={exp.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-semibold text-xs flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                      {exp.vendor}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-medium">
                        {exp.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{exp.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{exp.date}</TableCell>
                    <TableCell>
                      {exp.receiptAttached ? (
                        <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200 flex items-center gap-1 w-fit">
                          <Receipt className="h-3 w-3" /> Attached
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Missing</span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-xs">
                      ${exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={exp.status === 'approved' ? 'default' : 'outline'}
                        className={`text-[10px] capitalize ${
                          exp.status === 'approved' ? 'bg-emerald-600' : 'text-amber-600 border-amber-300'
                        }`}
                      >
                        {exp.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
