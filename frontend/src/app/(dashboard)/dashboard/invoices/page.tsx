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
  Receipt,
  Plus,
  Search,
  Download,
  Send,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  FileText,
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  issuedAt: string;
  dueAt: string;
}

const INITIAL_INVOICES: InvoiceItem[] = [
  { id: '1', invoiceNo: 'INV-2026-001', customerName: 'Acme Global Corp', customerEmail: 'billing@acme.com', amount: 14500.00, status: 'paid', issuedAt: '2026-07-01', dueAt: '2026-07-15' },
  { id: '2', invoiceNo: 'INV-2026-002', customerName: 'Apex Technologies', customerEmail: 'ap@apextech.io', amount: 8200.50, status: 'pending', issuedAt: '2026-07-10', dueAt: '2026-07-24' },
  { id: '3', invoiceNo: 'INV-2026-003', customerName: 'Starlight Retail LLC', customerEmail: 'finance@starlight.com', amount: 3950.00, status: 'overdue', issuedAt: '2026-06-15', dueAt: '2026-06-30' },
  { id: '4', invoiceNo: 'INV-2026-004', customerName: 'Nexus Digital Solutions', customerEmail: 'invoices@nexus.net', amount: 22400.00, status: 'paid', issuedAt: '2026-07-05', dueAt: '2026-07-19' },
  { id: '5', invoiceNo: 'INV-2026-005', customerName: 'Vanguard Capital', customerEmail: 'accounts@vanguard.org', amount: 12100.00, status: 'pending', issuedAt: '2026-07-12', dueAt: '2026-07-26' },
  { id: '6', invoiceNo: 'INV-2026-006', customerName: 'Horizon Media Group', customerEmail: 'payables@horizon.com', amount: 4350.00, status: 'overdue', issuedAt: '2026-06-20', dueAt: '2026-07-05' },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>(INITIAL_INVOICES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state for new invoice
  const [newCustomer, setNewCustomer] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerEmail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.amount, 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((acc, inv) => acc + inv.amount, 0);
  const totalPending = invoices.filter((i) => i.status === 'pending').reduce((acc, inv) => acc + inv.amount, 0);
  const totalOverdue = invoices.filter((i) => i.status === 'overdue').reduce((acc, inv) => acc + inv.amount, 0);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer || !newAmount) return;

    const newInv: InvoiceItem = {
      id: String(Date.now()),
      invoiceNo: `INV-2026-00${invoices.length + 1}`,
      customerName: newCustomer,
      customerEmail: newEmail || 'billing@customer.com',
      amount: parseFloat(newAmount),
      status: 'pending',
      issuedAt: new Date().toISOString().split('T')[0],
      dueAt: newDueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    };

    setInvoices([newInv, ...invoices]);
    setNewCustomer('');
    setNewEmail('');
    setNewAmount('');
    setNewDueDate('');
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, issue, and manage customer invoices and accounts receivable.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <form onSubmit={handleCreateInvoice}>
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>Fill out invoice details to generate a new customer bill.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer / Business Name</Label>
                  <Input
                    id="customer"
                    required
                    placeholder="Acme Global Inc."
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Customer Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="billing@acme.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      required
                      placeholder="2500.00"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="cursor-pointer">
                  Generate Invoice
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
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Invoiced</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{invoices.length} invoices generated</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Collected</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-primary/80 mt-1">Paid in full</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-destructive/80 mt-1">Requires follow-up</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar & Filters */}
      <Card className="shadow-2xs">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice # or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-medium">
                {(['all', 'paid', 'pending', 'overdue'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                      statusFilter === st ? 'bg-background text-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {st}
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
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issued Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    No invoices found matching criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-primary-tint transition-colors">
                    <TableCell className="font-semibold text-xs flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      {inv.invoiceNo}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-xs text-foreground">{inv.customerName}</span>
                        <span className="text-[11px] text-muted-foreground">{inv.customerEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{inv.issuedAt}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{inv.dueAt}</TableCell>
                    <TableCell className="font-bold text-xs">
                      ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inv.status === 'paid' ? 'secondary' : inv.status === 'pending' ? 'outline' : 'destructive'
                        }
                        className={`text-[10px] capitalize ${
                          inv.status === 'paid' ? 'bg-primary-muted text-primary-muted-foreground border-primary-muted' : ''
                        }`}
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer">
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
