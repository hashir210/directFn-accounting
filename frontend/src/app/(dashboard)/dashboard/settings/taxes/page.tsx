'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Percent,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const taxSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  rate: z.coerce.number().min(0, 'Rate must be positive'),
  isActive: z.boolean().default(true),
});

type TaxForm = z.infer<typeof taxSchema>;

interface Tax {
  id: string;
  name: string;
  rate: number | string;
  isActive: boolean;
  createdAt: string;
}

export default function TaxesPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('settings.edit');
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<TaxForm>({
    resolver: zodResolver(taxSchema),
    defaultValues: { name: '', rate: 0, isActive: true },
  });

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTaxes = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch<Tax[]>(`/api/v1/taxes`);
      setTaxes(res || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch taxes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxes();
  }, [fetchTaxes]);

  const openCreateModal = () => {
    setEditingId(null);
    form.reset({ name: '', rate: 0, isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (tax: Tax) => {
    setEditingId(tax.id);
    form.reset({
      name: tax.name,
      rate: Number(tax.rate),
      isActive: tax.isActive,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: TaxForm) => {
    setIsSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await apiFetch(`/api/v1/taxes/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        await apiFetch(`/api/v1/taxes`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
      setIsModalOpen(false);
      fetchTaxes();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save tax');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setError('');
    try {
      await apiFetch(`/api/v1/taxes/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchTaxes();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete tax');
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTaxes = taxes.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <Percent className="h-4 w-4" />
            <span>Settings</span>
          </div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">Tax Rates</h1>
          <p className="text-sm text-muted-foreground">
            Manage tax rates applied to products and invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button size="sm" onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" /> Add Tax Rate
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <Card className="shadow-none border-border">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Tax Configuration</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search taxes..."
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
                  <TableHead>Tax Name</TableHead>
                  <TableHead>Rate (%)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTaxes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No tax rates configured.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTaxes.map((tax) => (
                    <TableRow key={tax.id}>
                      <TableCell className="font-semibold">{tax.name}</TableCell>
                      <TableCell className="font-mono">{Number(tax.rate).toFixed(2)}%</TableCell>
                      <TableCell>
                        <Badge variant={tax.isActive ? 'outline' : 'secondary'} className={tax.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}>
                          {tax.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <>
                              <Button onClick={() => openEditModal(tax)} variant="ghost" size="icon-sm" className="h-8 w-8" title="Edit">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                onClick={() => setDeleteId(tax.id)}
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
              <DialogTitle>{editingId ? 'Edit Tax Rate' : 'Add Tax Rate'}</DialogTitle>
              <DialogDescription>
                Configure the tax percentage to apply to sales and purchases.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tax Name</Label>
                <Input {...form.register('name')} placeholder="e.g. VAT, GST" />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Rate (%)</Label>
                <Input type="number" step="0.01" {...form.register('rate')} />
                {form.formState.errors.rate && <p className="text-xs text-destructive">{form.formState.errors.rate.message}</p>}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isActive" {...form.register('isActive')} className="h-4 w-4" />
                <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">Tax is active</Label>
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
            <DialogTitle>Delete Tax Rate</DialogTitle>
            <DialogDescription>
              Are you sure? This action cannot be undone.
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
