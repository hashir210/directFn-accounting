'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Percent,
  Plus,
  Search,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Controller } from 'react-hook-form';
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

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDiscountSchema, type CreateDiscountForm } from '@/lib/schemas/discount';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';

interface Discount {
  id: string;
  name: string;
  type: string;
  value: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export default function DiscountsPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('sales.edit');

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<CreateDiscountForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createDiscountSchema) as any,
    defaultValues: { name: '', type: 'percentage', value: 10, minOrderAmount: undefined, maxDiscount: undefined, isActive: true },
  });

  const fetchDiscounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/api/v1/discounts?search=${search}`);
      setDiscounts(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const handleCreateDiscount = async (data: CreateDiscountForm) => {
    try {
      setError('');
      await apiFetch('/api/v1/discounts', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          value: data.value,
          minOrderAmount: data.minOrderAmount || undefined,
          maxDiscount: data.maxDiscount || undefined,
          isActive: data.isActive ?? true,
        }),
      });
      setOpenAdd(false);
      form.reset();
      fetchDiscounts();
    } catch (err: any) {
      setError(err.message || 'Failed to create discount');
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return;
    try {
      await apiFetch(`/api/v1/discounts/${id}`, { method: 'DELETE' });
      fetchDiscounts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight">
            Discounts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Configure and manage reusable organization discount rules.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setOpenAdd(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Discount Rule
          </Button>
        )}
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Discount Campaigns</CardTitle>
          <CardDescription>View current promotional discount structures.</CardDescription>
          <div className="flex mt-4 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search discount campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : discounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No discount rules configured.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Max Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-semibold">{d.name}</TableCell>
                    <TableCell className="capitalize">{d.type}</TableCell>
                    <TableCell>{d.type === 'percentage' ? `${d.value}%` : `$${d.value.toFixed(2)}`}</TableCell>
                    <TableCell>{d.minOrderAmount ? `$${d.minOrderAmount.toFixed(2)}` : '-'}</TableCell>
                    <TableCell>{d.maxDiscount ? `$${d.maxDiscount.toFixed(2)}` : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={d.isActive ? 'default' : 'outline'}>{d.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit && (
                        <Button size="xs" variant="destructive" onClick={() => handleDeleteDiscount(d.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Discount Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="max-w-md bg-card border border-muted/40 shadow-xl">
          <DialogHeader>
            <DialogTitle>Add Discount Rule</DialogTitle>
            <DialogDescription>Create a new org-wide campaign discount.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateDiscount)} className="space-y-4">
            { error && <Alert variant="destructive" className="p-3"><AlertDescription className="font-semibold">{ error }</AlertDescription></Alert> }

            <div className="space-y-1">
              <Label htmlFor="disc-name">Campaign Name *</Label>
              <Input id="disc-name" placeholder="e.g. Summer Special 10%" {...form.register('name')} />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="disc-type">Type *</Label>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="disc-type" className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="disc-value">Discount Value *</Label>
                <Input id="disc-value" type="number" {...form.register('value')} />
                {form.formState.errors.value && <p className="text-xs text-destructive">{form.formState.errors.value.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="disc-min">Min Order ($)</Label>
                <Input id="disc-min" placeholder="Optional" {...form.register('minOrderAmount')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="disc-max">Max Cap Amount ($)</Label>
                <Input id="disc-max" placeholder="Optional" {...form.register('maxDiscount')} />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Checkbox
                    id="disc-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="disc-active">Campaign Active status</Label>
            </div>

            <DialogFooter className="gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create Discount
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}