'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  Plus,
  Search,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCouponSchema, type CreateCouponForm } from '@/lib/schemas/coupon';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export default function CouponsPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('sales.edit');

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<CreateCouponForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createCouponSchema) as any,
    defaultValues: { code: '', discountType: 'percentage', discountValue: 10, minOrderAmount: undefined, maxDiscount: undefined, usageLimit: undefined, isActive: true, startDate: '', endDate: '' },
  });

  const fetchCoupons = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/api/v1/coupons?search=${search}`);
      setCoupons(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreateCoupon = async (data: CreateCouponForm) => {
    try {
      setError('');
      await apiFetch('/api/v1/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minOrderAmount: data.minOrderAmount || undefined,
          maxDiscount: data.maxDiscount || undefined,
          usageLimit: data.usageLimit || undefined,
          isActive: data.isActive ?? true,
          startDate: data.startDate,
          endDate: data.endDate,
        }),
      });
      setOpenAdd(false);
      form.reset();
      fetchCoupons();
    } catch (err: any) {
      setError(err.message || 'Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await apiFetch(`/api/v1/coupons/${id}`, { method: 'DELETE' });
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight">
            Coupons
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Generate and distribute promo codes.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setOpenAdd(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Coupon
          </Button>
        )}
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Discount Coupons</CardTitle>
          <CardDescription>View all promo codes, active periods, and usage stats.</CardDescription>
          <div className="flex mt-4 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search promo codes..."
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
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No coupons configured.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Active Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold text-primary">{c.code}</TableCell>
                    <TableCell>{c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue.toFixed(2)}`}</TableCell>
                    <TableCell>{c.usedCount} / {c.usageLimit || '∞'}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.isActive ? 'default' : 'outline'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit && (
                        <Button size="xs" variant="destructive" onClick={() => handleDeleteCoupon(c.id)}>
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

      {/* Add Coupon Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="max-w-md bg-card border border-muted/40 shadow-xl">
          <DialogHeader>
            <DialogTitle>Create Coupon Code</DialogTitle>
            <DialogDescription>Add a custom validation-based promotional code.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateCoupon)} className="space-y-4">
            {error && <div className="p-3 bg-destructive/15 text-destructive rounded-lg text-xs font-semibold">{error}</div>}

            <div className="space-y-1">
              <Label htmlFor="coup-code">Promo Code *</Label>
              <Input
                id="coup-code"
                placeholder="e.g. WELCOME50"
                {...form.register('code')}
                onChange={(e) => {
                  const upper = e.target.value.toUpperCase();
                  form.setValue('code', upper, { shouldValidate: true });
                }}
              />
              {form.formState.errors.code && <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="coup-type">Discount Type *</Label>
                <select
                  id="coup-type"
                  {...form.register('discountType')}
                  className="w-full h-10 px-3 bg-background border rounded-md text-sm outline-none"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="coup-val">Discount Value *</Label>
                <Input id="coup-val" type="number" {...form.register('discountValue')} />
                {form.formState.errors.discountValue && <p className="text-xs text-destructive">{form.formState.errors.discountValue.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="coup-min">Min Order ($)</Label>
                <Input id="coup-min" placeholder="Optional" {...form.register('minOrderAmount')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="coup-limit">Usage Limit (count)</Label>
                <Input id="coup-limit" placeholder="Optional" {...form.register('usageLimit')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="coup-start">Start Date *</Label>
                <Input id="coup-start" type="date" {...form.register('startDate')} />
                {form.formState.errors.startDate && <p className="text-xs text-destructive">{form.formState.errors.startDate.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="coup-end">End Date *</Label>
                <Input id="coup-end" type="date" {...form.register('endDate')} />
                {form.formState.errors.endDate && <p className="text-xs text-destructive">{form.formState.errors.endDate.message}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="coup-active"
                type="checkbox"
                {...form.register('isActive')}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="coup-active">Coupon Active status</Label>
            </div>

            <DialogFooter className="gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create Coupon
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}