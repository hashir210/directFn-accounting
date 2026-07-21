'use client';

import React, { useState } from 'react';
import {
  ContactRound,
  Plus,
  Search,
  ArrowUpRight,
  Download,
  AlertTriangle,
  CreditCard,
  FileText,
  DollarSign,
  MoreVertical,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  creditLimit: string;
  outstanding: string;
  status: 'Active' | 'Credit Hold' | 'Overdue';
  lastStatement: string;
}

const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Apex Global Systems',
    email: 'billing@apexglobal.com',
    phone: '+1 (555) 234-5678',
    creditLimit: '$50,000',
    outstanding: '$24,500',
    status: 'Active',
    lastStatement: 'Jul 01, 2026',
  },
  {
    id: 'cust-2',
    name: 'Horizon Tech Ventures',
    email: 'finance@horizon.vc',
    phone: '+1 (555) 876-5432',
    creditLimit: '$30,000',
    outstanding: '$32,100',
    status: 'Overdue',
    lastStatement: 'Jun 15, 2026',
  },
  {
    id: 'cust-3',
    name: 'Acme Logistics Corp',
    email: 'accounts@acme.com',
    phone: '+1 (555) 345-6789',
    creditLimit: '$20,000',
    outstanding: '$0',
    status: 'Active',
    lastStatement: 'Jul 10, 2026',
  },
  {
    id: 'cust-4',
    name: 'Starlight Retailers',
    email: 'payables@starlight.io',
    phone: '+1 (555) 901-2345',
    creditLimit: '$15,000',
    outstanding: '$18,400',
    status: 'Credit Hold',
    lastStatement: 'Jun 30, 2026',
  },
];

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [search, setSearch] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', email: '', phone: '', creditLimit: '$10,000' });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Customer = {
      id: `cust-${Date.now()}`,
      name: newCust.name || 'New Customer',
      email: newCust.email || 'customer@example.com',
      phone: newCust.phone || '+1 (555) 000-0000',
      creditLimit: newCust.creditLimit,
      outstanding: '$0',
      status: 'Active',
      lastStatement: 'Today',
    };
    setCustomers([created, ...customers]);
    setOpenAdd(false);
    setNewCust({ name: '', email: '', phone: '', creditLimit: '$10,000' });
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <ContactRound className="h-4 w-4" />
            <span>Accounts Receivable</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer profiles, set credit limits, track outstanding balances, and generate statements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="cursor-pointer">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>

          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" /> Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateCustomer}>
                <DialogHeader>
                  <DialogTitle>Add New Customer Profile</DialogTitle>
                  <DialogDescription>
                    Create a customer profile to track credit limits and invoices.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Customer / Company Name</Label>
                    <Input
                      required
                      placeholder="e.g. Apex Global"
                      value={newCust.name}
                      onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Billing Email</Label>
                      <Input
                        type="email"
                        required
                        placeholder="billing@apex.com"
                        value={newCust.email}
                        onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        placeholder="+1 (555) 000-0000"
                        value={newCust.phone}
                        onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Approved Credit Limit ($)</Label>
                    <Input
                      placeholder="$10,000"
                      value={newCust.creditLimit}
                      onChange={(e) => setNewCust({ ...newCust, creditLimit: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Customer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Active Customers</CardDescription>
            <CardTitle className="text-2xl font-bold">{customers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
              <ArrowUpRight className="h-3.5 w-3.5" /> 18 High-Volume Accounts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Outstanding Receivables</CardDescription>
            <CardTitle className="text-2xl font-bold">$75,000</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-amber-600 flex items-center gap-1 font-medium">
              Across 4 Active Clients
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Credit Hold Accounts</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600">1 Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-rose-600 flex items-center gap-1 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" /> Limit Exceeded
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Statements Ready</CardDescription>
            <CardTitle className="text-2xl font-bold">{customers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Generated Jul 2026
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Customer Accounts Directory</CardTitle>
              <CardDescription>Manage profile details, balances, and statement downloads.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers or email..."
                className="pl-8 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer / Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved Credit Limit</TableHead>
                <TableHead>Outstanding Balance</TableHead>
                <TableHead>Last Statement</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.email} • {c.phone}</div>
                  </TableCell>
                  <TableCell>
                    {c.status === 'Active' && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>
                    )}
                    {c.status === 'Overdue' && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Overdue</Badge>
                    )}
                    {c.status === 'Credit Hold' && (
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20">Credit Hold</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{c.creditLimit}</TableCell>
                  <TableCell className="font-mono font-semibold text-sm">{c.outstanding}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.lastStatement}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="cursor-pointer">
                      <FileText className="h-4 w-4 mr-1" /> Statement
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
