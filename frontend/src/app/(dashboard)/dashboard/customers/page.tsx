'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ContactRound,
  Plus,
  Search,
  ArrowUpRight,
  Download,
  AlertTriangle,
  FileText,
  Loader2,
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
import { apiFetch, ApiError } from '@/lib/api';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  creditLimit: string | number;
  outstanding: string;
  status: string;
  createdAt: string;
}

interface CustomerStatement {
  customer: Customer;
  statementDate: string;
  invoices: Array<{
    id: string;
    invoiceNo: string;
    amount: string | number;
    status: string;
    issuedAt: string;
  }>;
  totalInvoiced: number;
  totalOutstanding: string;
}

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [newCust, setNewCust] = useState({ name: '', email: '', phone: '', address: '', creditLimit: '10000' });
  const [selectedStatement, setSelectedStatement] = useState<CustomerStatement | null>(null);
  const [openStatement, setOpenStatement] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch<{ items: Customer[] }>(`/api/v1/customers?search=${encodeURIComponent(search)}`);
      setCustomers(res.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: newCust.name,
          email: newCust.email || undefined,
          phone: newCust.phone || undefined,
          address: newCust.address || undefined,
          creditLimit: parseFloat(newCust.creditLimit) || 0,
        }),
      });
      setOpenAdd(false);
      setNewCust({ name: '', email: '', phone: '', address: '', creditLimit: '10000' });
      fetchCustomers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewStatement = async (id: string) => {
    try {
      const data = await apiFetch<CustomerStatement>(`/api/v1/customers/${id}/statement`);
      setSelectedStatement(data);
      setOpenStatement(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load customer statement');
    }
  };

  const totalOutstandingSum = customers.reduce((sum, c) => sum + parseFloat(c.outstanding || '0'), 0);

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
                      type="number"
                      placeholder="10000"
                      value={newCust.creditLimit}
                      onChange={(e) => setNewCust({ ...newCust, creditLimit: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Save Customer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Active Customers</CardDescription>
            <CardTitle className="text-2xl font-bold">{customers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
              <ArrowUpRight className="h-3.5 w-3.5" /> Registered Accounts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Outstanding Receivables</CardDescription>
            <CardTitle className="text-2xl font-bold">${totalOutstandingSum.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-amber-600 flex items-center gap-1 font-medium">
              Active Unpaid Balances
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
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer / Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved Credit Limit</TableHead>
                  <TableHead>Outstanding Balance</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No customers found. Click &quot;Add Customer&quot; to create your first client.
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.email || 'No Email'} • {c.phone || 'No Phone'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          {c.status || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">${Number(c.creditLimit || 0).toLocaleString()}</TableCell>
                      <TableCell className="font-mono font-semibold text-sm">${Number(c.outstanding || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button onClick={() => handleViewStatement(c.id)} variant="ghost" size="sm" className="cursor-pointer">
                          <FileText className="h-4 w-4 mr-1" /> Statement
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Statement Modal Dialog */}
      <Dialog open={openStatement} onOpenChange={setOpenStatement}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Account Statement</DialogTitle>
            <DialogDescription>
              Ledger summary for {selectedStatement?.customer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-3 rounded-lg">
              <div>
                <span className="text-muted-foreground">Total Invoiced:</span>{' '}
                <span className="font-bold">${selectedStatement?.totalInvoiced?.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Outstanding:</span>{' '}
                <span className="font-bold text-rose-600">${selectedStatement?.totalOutstanding}</span>
              </div>
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoices Breakdown</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedStatement?.invoices?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">No invoices recorded yet.</TableCell>
                  </TableRow>
                ) : (
                  selectedStatement?.invoices?.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-semibold">{inv.invoiceNo}</TableCell>
                      <TableCell className="text-xs">{new Date(inv.issuedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono">${Number(inv.amount).toFixed(2)}</TableCell>
                      <TableCell><Badge variant="secondary">{inv.status}</Badge></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenStatement(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


