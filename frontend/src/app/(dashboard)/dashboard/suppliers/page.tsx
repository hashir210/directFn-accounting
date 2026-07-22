'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Plus,
  Search,
  Clock,
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

interface Supplier {
  id: string;
  name: string;
  category: string | null;
  contactEmail: string | null;
  phone: string | null;
  paymentTerms: string;
  status: string;
  dueAmount: string;
}

export default function SupplierManagementPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [openBillModal, setOpenBillModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [billData, setBillData] = useState({ billNo: '', amount: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [newSup, setNewSup] = useState({ name: '', category: '', email: '', phone: '', terms: 'Net 30' });

  const fetchSuppliers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch<{ items: Supplier[] }>(`/api/v1/suppliers?search=${encodeURIComponent(search)}`);
      setSuppliers(res.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch suppliers');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          name: newSup.name,
          category: newSup.category || undefined,
          contactEmail: newSup.email || undefined,
          phone: newSup.phone || undefined,
          paymentTerms: newSup.terms,
        }),
      });
      setOpenAdd(false);
      setNewSup({ name: '', category: '', email: '', phone: '', terms: 'Net 30' });
      fetchSuppliers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) return;
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/suppliers/bills', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          billNo: billData.billNo || `BILL-${Date.now().toString().slice(-4)}`,
          amount: parseFloat(billData.amount) || 0,
        }),
      });
      setOpenBillModal(false);
      setBillData({ billNo: '', amount: '' });
      fetchSuppliers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create purchase bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (suppliers.length === 0) return;
    const headers = ['Vendor Name', 'Category', 'Contact Email', 'Payment Terms', 'Status', 'Due Amount'];
    const rows = suppliers.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${(s.category || 'General').replace(/"/g, '""')}"`,
      `"${(s.contactEmail || '').replace(/"/g, '""')}"`,
      `"${s.paymentTerms.replace(/"/g, '""')}"`,
      s.status || 'Active',
      s.dueAmount,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `suppliers_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalDueSum = suppliers.reduce((sum, s) => sum + parseFloat(s.dueAmount || '0'), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <Truck className="h-4 w-4" />
            <span>Accounts Payable</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Supplier Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage vendor profiles, purchase order histories, payment terms, and pending accounts payable.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="cursor-pointer">
            Export Ledger
          </Button>
          {suppliers.length > 0 && (
            <Dialog open={openBillModal} onOpenChange={setOpenBillModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" /> Add Purchase Bill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateBill}>
                  <DialogHeader>
                    <DialogTitle>Add Supplier Purchase Bill</DialogTitle>
                    <DialogDescription>
                      Record a bill from a vendor to increase your payable amount.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Select Supplier</Label>
                      <select
                        className="w-full h-10 px-3 border rounded-md text-sm bg-background"
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Supplier --</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bill Number</Label>
                        <Input
                          placeholder="e.g. BILL-9921"
                          value={billData.billNo}
                          onChange={(e) => setBillData({ ...billData, billNo: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bill Amount ($)</Label>
                        <Input
                          type="number"
                          required
                          placeholder="1200.00"
                          value={billData.amount}
                          onChange={(e) => setBillData({ ...billData, amount: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpenBillModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Save Purchase Bill
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" /> Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateSupplier}>
                <DialogHeader>
                  <DialogTitle>Add New Supplier / Vendor</DialogTitle>
                  <DialogDescription>
                    Register a vendor to manage purchase bills and payable amounts.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Supplier Name</Label>
                    <Input
                      required
                      placeholder="e.g. AWS Cloud"
                      value={newSup.name}
                      onChange={(e) => setNewSup({ ...newSup, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input
                        placeholder="e.g. Infrastructure"
                        value={newSup.category}
                        onChange={(e) => setNewSup({ ...newSup, category: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Billing Email</Label>
                      <Input
                        type="email"
                        placeholder="billing@vendor.com"
                        value={newSup.email}
                        onChange={(e) => setNewSup({ ...newSup, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Input
                      placeholder="Net 30"
                      value={newSup.terms}
                      onChange={(e) => setNewSup({ ...newSup, terms: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Save Vendor
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

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Vendors</CardDescription>
            <CardTitle className="text-2xl font-bold">{suppliers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-emerald-600 font-medium">Registered Partners</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Due Payments</CardDescription>
            <CardTitle className="text-2xl font-bold">${totalDueSum.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Pending Payables
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Supplier Directory & Payables</CardTitle>
              <CardDescription>View supplier records and due bills.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vendor or category..."
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
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Terms</TableHead>
                  <TableHead className="text-right">Due Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No suppliers found. Click &quot;Add Supplier&quot; to register a vendor.
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.contactEmail || 'No Email'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{s.category || 'General'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          {s.status || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{s.paymentTerms}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-sm">
                        ${Number(s.dueAmount || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

