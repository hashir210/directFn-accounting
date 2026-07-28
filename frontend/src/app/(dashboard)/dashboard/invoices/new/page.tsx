'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, ArrowLeft, Loader2 } from 'lucide-react';
import apiFetch from '@/lib/api';
import { createInvoiceSchema, type CreateInvoiceForm, type LineItem } from '@/lib/schemas/invoice';

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  taxRate: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateInvoiceForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createInvoiceSchema) as any,
    defaultValues: {
      customerId: '',
      dueAt: '',
      notes: '',
      terms: 'Net 30',
      items: [{ productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 }] as LineItem[],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');

  const calculateTotals = () => {
    let subTotal = 0;
    let taxTotal = 0;
    items?.forEach(item => {
      const lineSubTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      const lineTax = lineSubTotal * ((Number(item.taxRate) || 0) / 100);
      subTotal += lineSubTotal;
      taxTotal += lineTax;
    });
    return { subTotal, taxTotal, total: subTotal + taxTotal };
  };

  const { subTotal, taxTotal, total } = calculateTotals();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          apiFetch('/api/v1/customers?limit=100'),
          apiFetch('/api/v1/products?limit=100'),
        ]);
        setCustomers(custRes.data?.data || []);
        setProducts(prodRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const onProductSelect = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setValue(`items.${index}.description`, prod.name);
      setValue(`items.${index}.unitPrice`, prod.sellingPrice);
      setValue(`items.${index}.taxRate`, prod.taxRate);
      if (!productId) {
        setValue(`items.${index}.description`, '');
        setValue(`items.${index}.unitPrice`, 0);
        setValue(`items.${index}.taxRate`, 0);
      }
    }
  };

  const onSubmit = async (data: CreateInvoiceForm) => {
    const payload = {
      customerId: data.customerId,
      dueAt: data.dueAt || new Date(Date.now() + 14 * 86400000).toISOString(),
      notes: data.notes,
      terms: data.terms,
      status: 'pending',
      items: data.items.map(i => ({
        productId: i.productId || undefined,
        description: i.description,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        taxRate: Number(i.taxRate),
      })),
    };

    const res = await apiFetch('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res) {
      router.push(`/dashboard/invoices/${res.id}`);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/invoices')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Create Invoice</h1>
        </div>
        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="bg-primary hover:bg-primary-tint text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save & Preview
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...register('customerId')}
                  >
                    <option value="">Select Customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" {...register('dueAt')} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button size="sm" variant="outline" onClick={() => append({ productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 })}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {errors.items && <p className="text-xs text-destructive mb-2">{errors.items.message || errors.items.root?.message}</p>}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Product / Description</TableHead>
                    <TableHead className="w-[15%]">Qty</TableHead>
                    <TableHead className="w-[20%]">Price</TableHead>
                    <TableHead className="w-[15%]">Tax %</TableHead>
                    <TableHead className="w-[15%] text-right">Amount</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell className="align-top">
                        <Controller
                          control={control}
                          name={`items.${index}.productId`}
                          render={({ field: selectField }) => (
                            <select
                              className="flex mb-2 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              value={selectField.value || ''}
                              onChange={(e) => {
                                selectField.onChange(e);
                                onProductSelect(index, e.target.value);
                              }}
                            >
                              <option value="">Custom Item...</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          )}
                        />
                        <Input
                          placeholder="Description"
                          {...register(`items.${index}.description`)}
                          className="h-9"
                        />
                        {errors.items?.[index]?.description && (
                          <p className="text-xs text-destructive mt-1">{errors.items[index]?.description?.message}</p>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <Input
                          type="number"
                          min="1"
                          {...register(`items.${index}.quantity`)}
                          className="h-9"
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="text-xs text-destructive mt-1">{errors.items[index]?.quantity?.message}</p>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...register(`items.${index}.unitPrice`)}
                          className="h-9"
                        />
                        {errors.items?.[index]?.unitPrice && (
                          <p className="text-xs text-destructive mt-1">{errors.items[index]?.unitPrice?.message}</p>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          {...register(`items.${index}.taxRate`)}
                          className="h-9"
                        />
                        {errors.items?.[index]?.taxRate && (
                          <p className="text-xs text-destructive mt-1">{errors.items[index]?.taxRate?.message}</p>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-right font-medium pt-4">
                        ${((Number(items?.[index]?.quantity) || 0) * (Number(items?.[index]?.unitPrice) || 0)).toFixed(2)}
                      </TableCell>
                      <TableCell className="align-top">
                        {fields.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive/90 hover:bg-destructive/10" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notes for Customer</Label>
                <Textarea {...register('notes')} placeholder="Thank you for your business!" />
              </div>
              <div className="space-y-2">
                <Label>Terms and Conditions</Label>
                <Textarea {...register('terms')} placeholder="Please pay within 30 days." />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50 shadow-sm sticky top-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">${taxTotal.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-4 mt-4 flex justify-between items-center">
                <span className="font-semibold text-lg">Total Amount</span>
                <span className="font-bold text-2xl text-primary">${total.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full bg-primary hover:bg-primary-tint text-primary-foreground">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Invoice'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}