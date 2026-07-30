'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Landmark,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';

const bankAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  balance: z.coerce.number().default(0),
  currency: z.string().default('USD'),
  isActive: z.boolean().default(true),
});

type BankAccountForm = z.infer<typeof bankAccountSchema>;

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  balance: number | string;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export default function BankAccountsPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('accounting.edit');
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<BankAccountForm>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: { name: '', bankName: '', accountNumber: '', balance: 0, currency: 'USD', isActive: true },
  });

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch<BankAccount[]>(`/api/v1/bank-accounts`);
      setAccounts(res || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch bank accounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const openCreateModal = () => {
    setEditingId(null);
    form.reset({ name: '', bankName: '', accountNumber: '', balance: 0, currency: 'USD', isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (account: BankAccount) => {
    setEditingId(account.id);
    form.reset({
      name: account.name,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      balance: Number(account.balance),
      currency: account.currency,
      isActive: account.isActive,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: BankAccountForm) => {
    setIsSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await apiFetch(`/api/v1/bank-accounts/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        await apiFetch(`/api/v1/bank-accounts`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
      setIsModalOpen(false);
      fetchAccounts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save bank account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setError('');
    try {
      await apiFetch(`/api/v1/bank-accounts/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchAccounts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete bank account');
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.bankName.toLowerCase().includes(search.toLowerCase()) ||
    a.accountNumber.includes(search)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <Landmark className="h-4 w-4" />
            <span>Accounting</span>
          </div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">Bank Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your company's bank accounts, balances, and track financial transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button size="sm" onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" /> Add Bank Account
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Main Card */}
      <Card className="shadow-none border-border">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Accounts Directory</CardTitle>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
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
                  <TableHead>Account Name</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account No</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No bank accounts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-semibold">{account.name}</TableCell>
                      <TableCell>{account.bankName}</TableCell>
                      <TableCell className="font-mono text-sm">{account.accountNumber}</TableCell>
                      <TableCell className="font-mono font-semibold">
                        {account.currency} {Number(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.isActive ? 'outline' : 'secondary'} className={account.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <>
                              <Button onClick={() => openEditModal(account)} variant="ghost" size="icon-sm" className="h-8 w-8" title="Edit">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                onClick={() => setDeleteId(account.id)}
                                variant="ghost" size="icon-sm" className="h-8 w-8 text-destructive" title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update your bank account details.' : 'Register a new bank account to the system.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input {...form.register('name')} placeholder="e.g. Main Operating Account" />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input {...form.register('bankName')} placeholder="e.g. Chase Bank" />
                  {form.formState.errors.bankName && <p className="text-xs text-destructive">{form.formState.errors.bankName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input {...form.register('accountNumber')} />
                  {form.formState.errors.accountNumber && <p className="text-xs text-destructive">{form.formState.errors.accountNumber.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Initial Balance</Label>
                  <Input type="number" step="0.01" {...form.register('balance')} />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input {...form.register('currency')} placeholder="USD" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isActive" {...form.register('isActive')} className="h-4 w-4" />
                <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">Account is active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Bank Account</DialogTitle>
            <DialogDescription>
              Are you sure? This cannot be undone. You cannot delete accounts that have linked payments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
