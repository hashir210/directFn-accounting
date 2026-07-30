'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Building2,
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

const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().default(''),
  address: z.string().default(''),
  isDefault: z.boolean().default(false),
});

type WarehouseForm = z.infer<typeof warehouseSchema>;

interface Warehouse {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  isDefault: boolean;
  createdAt: string;
}

export default function WarehousesPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('products.edit');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<WarehouseForm>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: { name: '', code: '', address: '', isDefault: false },
  });

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchWarehouses = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch<Warehouse[]>(`/api/v1/inventory/warehouses`);
      setWarehouses(res || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch warehouses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const openCreateModal = () => {
    setEditingId(null);
    form.reset({ name: '', code: '', address: '', isDefault: false });
    setIsModalOpen(true);
  };

  const openEditModal = (warehouse: Warehouse) => {
    setEditingId(warehouse.id);
    form.reset({
      name: warehouse.name,
      code: warehouse.code || '',
      address: warehouse.address || '',
      isDefault: warehouse.isDefault,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: WarehouseForm) => {
    setIsSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await apiFetch(`/api/v1/inventory/warehouses/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        await apiFetch(`/api/v1/inventory/warehouses`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
      setIsModalOpen(false);
      fetchWarehouses();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setError('');
    try {
      await apiFetch(`/api/v1/inventory/warehouses/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchWarehouses();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete warehouse');
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredWarehouses = warehouses.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) || 
    (w.code && w.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <Building2 className="h-4 w-4" />
            <span>Inventory</span>
          </div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">Warehouses</h1>
          <p className="text-sm text-muted-foreground">
            Manage your company's storage locations and warehouses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button size="sm" onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" /> Add Warehouse
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
            <CardTitle className="text-base">Storage Locations</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
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
                  <TableHead>Location Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No warehouses found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWarehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-semibold">{warehouse.name}</TableCell>
                      <TableCell className="font-mono text-xs">{warehouse.code || '-'}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate" title={warehouse.address || ''}>
                        {warehouse.address || '—'}
                      </TableCell>
                      <TableCell>
                        {warehouse.isDefault && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            Default HQ
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <>
                              <Button onClick={() => openEditModal(warehouse)} variant="ghost" size="icon-sm" className="h-8 w-8" title="Edit">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                onClick={() => setDeleteId(warehouse.id)}
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
              <DialogTitle>{editingId ? 'Edit Warehouse' : 'Add Warehouse'}</DialogTitle>
              <DialogDescription>
                Manage details for your storage location.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Warehouse Name</Label>
                  <Input {...form.register('name')} placeholder="e.g. Main HQ" />
                  {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Location Code</Label>
                  <Input {...form.register('code')} placeholder="e.g. WH-01" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input {...form.register('address')} placeholder="123 Storage Rd, City" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isDefault" {...form.register('isDefault')} className="h-4 w-4" />
                <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">Set as default headquarters</Label>
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
            <DialogTitle>Delete Warehouse</DialogTitle>
            <DialogDescription>
              Are you sure? You cannot delete a warehouse that has linked stock movements.
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
