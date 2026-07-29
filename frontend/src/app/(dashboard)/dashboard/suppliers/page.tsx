'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Plus,
  Search,
  Clock,
  FileText,
  Pencil,
  Trash2,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Controller } from 'react-hook-form';
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
import { useAuth } from '@/features/auth/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateSupplierSchema, type UpdateSupplierForm } from '@/lib/schemas/supplier';


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
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('products.edit');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openBillModal, setOpenBillModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Delete state
  const [deleteSupId, setDeleteSupId] = useState<string | null>(null);
  const [deleteSupName, setDeleteSupName] = useState('');
  const [openDelete, setOpenDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [openEdit, setOpenEdit] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editForm = useForm<UpdateSupplierForm>({ resolver: zodResolver(updateSupplierSchema) as any, defaultValues: { name: '', category: '', contactEmail: '', phone: '', paymentTerms: '' } });
  const billForm = useForm({ defaultValues: { supplierId: '', billNo: '', amount: '' } });

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
    window.addEventListener('refresh-suppliers', fetchSuppliers);
    return () => window.removeEventListener('refresh-suppliers', fetchSuppliers);
  }, [fetchSuppliers]);



  const handleCreateBill = billForm.handleSubmit(async (data) => {
    if (!data.supplierId) return;
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/suppliers/bills', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: data.supplierId,
          billNo: data.billNo || `BILL-${Date.now().toString().slice(-4)}`,
          amount: parseFloat(data.amount) || 0,
        }),
      });
      setOpenBillModal(false);
      billForm.reset();
      fetchSuppliers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create purchase bill');
    } finally {
      setIsSubmitting(false);
    }
  });

  const openEditDialog = (s: Supplier) => {
    editForm.reset({ name: s.name, category: s.category || '', contactEmail: s.contactEmail || '', phone: s.phone || '', paymentTerms: s.paymentTerms });
    setEditingSupplierId(s.id);
    setOpenEdit(true);
  };

  const handleEditSupplier = editForm.handleSubmit(async (data) => {
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch(`/api/v1/suppliers/${editingSupplierId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: data.name,
          category: data.category || undefined,
          contactEmail: data.contactEmail || undefined,
          phone: data.phone || undefined,
          paymentTerms: data.paymentTerms,
        }),
      });
      setOpenEdit(false);
      editForm.reset();
      fetchSuppliers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update supplier');
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleDeleteSupplier = async () => {
    if (!deleteSupId) return;
    setIsDeleting(true);
    setError('');
    try {
      await apiFetch(`/api/v1/suppliers/${deleteSupId}`, { method: 'DELETE' });
      setOpenDelete(false);
      setDeleteSupId(null);
      setDeleteSupName('');
      fetchSuppliers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete supplier');
    } finally {
      setIsDeleting(false);
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
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">Supplier Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage vendor profiles, purchase order histories, payment terms, and pending accounts payable.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="cursor-pointer">
            Export Ledger
          </Button>
          {canEdit && suppliers.length > 0 && (
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
                      <Controller
                        control={billForm.control}
                        name="supplierId"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="-- Choose Supplier --" />
                            </SelectTrigger>
                            <SelectContent>
                              {suppliers.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bill Number</Label>
                        <Input
                          placeholder="e.g. BILL-9921"
                          {...billForm.register('billNo')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bill Amount ($)</Label>
                        <Input
                          type="number"
                          required
                          placeholder="1200.00"
                          {...billForm.register('amount')}
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

          {canEdit && (
            <Button size="sm" className="cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-supplier-modal'))}>
              <Plus className="h-4 w-4 mr-2" /> Add Supplier
            </Button>
          )}
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
      <Card className="shadow-none border-border">
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
                className="pl-9 bg-background"
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
                  {canEdit && <TableHead className="text-right w-20">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 6 : 5} className="text-center py-6 text-muted-foreground">
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
                      <TableCell className="text-right">
                        {canEdit && (
                          <div className="flex items-center justify-end gap-1">
                            <Button onClick={() => openEditDialog(s)} variant="ghost" size="icon-sm" className="h-8 w-8 cursor-pointer" title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              onClick={() => { setDeleteSupId(s.id); setDeleteSupName(s.name); setOpenDelete(true); }}
                              variant="ghost" size="icon-sm" className="h-8 w-8 text-destructive cursor-pointer" title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {/* Edit Supplier Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <form onSubmit={handleEditSupplier}>
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
              <DialogDescription>Update vendor profile details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Supplier Name</Label>
                <Input required {...editForm.register('name')} />
                {editForm.formState.errors.name && (
                  <span className="text-xs text-destructive">{editForm.formState.errors.name.message}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input {...editForm.register('category')} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...editForm.register('contactEmail')} />
                  {editForm.formState.errors.contactEmail && (
                    <span className="text-xs text-destructive">{editForm.formState.errors.contactEmail.message}</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...editForm.register('phone')} />
              </div>
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Input {...editForm.register('paymentTerms')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Supplier Confirmation */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteSupName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSupplier} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}