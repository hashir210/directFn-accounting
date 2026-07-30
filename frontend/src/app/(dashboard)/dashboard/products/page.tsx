'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Barcode,
  AlertTriangle,
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProductSchema, type UpdateProductForm } from '@/lib/schemas/product';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  category: string | null;
  unit: string;
  purchasePrice: string;
  sellingPrice: string;
  taxRate: string;
  imageUrl: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export default function ProductManagementPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('products.edit');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const editForm = useForm<UpdateProductForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(updateProductSchema) as any,
    defaultValues: { name: '', sku: '', barcode: '', category: 'Hardware', unit: '', purchasePrice: 0, sellingPrice: 0, stockQuantity: 0 },
  });
  // Delete state
  const [deleteProdId, setDeleteProdId] = useState<string | null>(null);
  const [deleteProdName, setDeleteProdName] = useState('');
  const [openDelete, setOpenDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch<{ items: Product[] }>(`/api/v1/products?search=${encodeURIComponent(search)}`);
      setProducts(res.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchProducts();
    window.addEventListener('refresh-products', fetchProducts);
    return () => window.removeEventListener('refresh-products', fetchProducts);
  }, [fetchProducts]);


  const openEditDialog = (p: Product) => {
    setEditId(p.id);
    editForm.reset({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      category: p.category || 'Hardware',
      unit: p.unit,
      purchasePrice: parseFloat(p.purchasePrice) || 0,
      sellingPrice: parseFloat(p.sellingPrice) || 0,
      stockQuantity: p.stockQuantity,
    });
    setOpenEdit(true);
  };

  const onEditSubmit = async (data: UpdateProductForm) => {
    if (!editId) return;
    setError('');
    try {
      await apiFetch(`/api/v1/products/${editId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: data.name,
          sku: data.sku,
          barcode: data.barcode || undefined,
          category: data.category || undefined,
          unit: data.unit,
          purchasePrice: Number(data.purchasePrice) || 0,
          sellingPrice: Number(data.sellingPrice) || 0,
          stockQuantity: Number(data.stockQuantity) || 0,
        }),
      });
      setOpenEdit(false);
      setEditId(null);
      editForm.reset();
      fetchProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update product');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProdId) return;
    setIsDeleting(true);
    setError('');
    try {
      await apiFetch(`/api/v1/products/${deleteProdId}`, { method: 'DELETE' });
      setOpenDelete(false);
      setDeleteProdId(null);
      setDeleteProdName('');
      fetchProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (products.length === 0) return;
    const headers = ['Product Name', 'SKU', 'Unit', 'Category', 'Barcode', 'Status', 'Stock Quantity', 'Purchase Price', 'Selling Price'];
    const rows = products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku.replace(/"/g, '""')}"`,
      `"${p.unit.replace(/"/g, '""')}"`,
      `"${(p.category || 'Hardware').replace(/"/g, '""')}"`,
      `"${(p.barcode || 'N/A').replace(/"/g, '""')}"`,
      p.status,
      p.stockQuantity,
      p.purchasePrice,
      p.sellingPrice,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalog_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const lowStockCount = products.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <Package className="h-4 w-4" />
            <span>Catalog & Inventory</span>
          </div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">Product Catalog</h1>
          <p className="text-sm text-muted-foreground">
            Manage product categories, SKUs, barcodes, cost prices, selling margins, tax profiles, and product images.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="cursor-pointer">
            Export Catalog
          </Button>
          {canEdit && (
            <Button size="sm" className="cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-product-modal'))}>
              <Plus className="h-4 w-4 mr-2" /> Add Product
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Products</CardDescription>
            <CardTitle className="text-2xl font-bold">{products.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-emerald-600 font-medium">Catalog Items</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Low / Out of Stock</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">{lowStockCount} SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Reorder Threshold Indicators
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Table */}
      <Card className="shadow-none border-border">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Product Catalog & Pricing Matrix</CardTitle>
              <CardDescription>List of all SKUs, categories, costs, and selling prices.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search SKU or name..."
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
                  <TableHead>Product / SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  {canEdit && <TableHead className="text-right w-20">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 7 : 6} className="text-center py-6 text-muted-foreground">
                      No products found. Click &quot;Add Product&quot; to create your first catalog item.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="h-9 w-9 rounded-md object-cover border bg-muted shrink-0"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0 border">
                              <Package className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{p.sku} • {p.unit}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{p.category || 'Hardware'}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Barcode className="h-3.5 w-3.5" /> {p.barcode || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {p.status === 'In Stock' && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            In Stock ({p.stockQuantity})
                          </Badge>
                        )}
                        {p.status === 'Low Stock' && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                            Low Stock ({p.stockQuantity})
                          </Badge>
                        )}
                        {p.status === 'Out of Stock' && (
                          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20">
                            Out of Stock (0)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">Rs. {Number(p.purchasePrice).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-sm">Rs. {Number(p.sellingPrice).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {canEdit && (
                          <div className="flex items-center justify-end gap-1">
                            <Button onClick={() => openEditDialog(p)} variant="ghost" size="icon-sm" className="h-8 w-8 cursor-pointer" title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              onClick={() => { setDeleteProdId(p.id); setDeleteProdName(p.name); setOpenDelete(true); }}
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
      {/* Edit Product Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-md">
          <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>Update product details and pricing.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input {...editForm.register('name')} />
                {editForm.formState.errors.name && <p className="text-xs text-destructive">{editForm.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input {...editForm.register('sku')} />
                </div>
                <div className="space-y-2">
                  <Label>Barcode</Label>
                  <Input {...editForm.register('barcode')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Purchase Cost ($)</Label>
                  <Input type="number" {...editForm.register('purchasePrice')} />
                </div>
                <div className="space-y-2">
                  <Label>Selling Price ($)</Label>
                  <Input type="number" {...editForm.register('sellingPrice')} />
                  {editForm.formState.errors.sellingPrice && <p className="text-xs text-destructive">{editForm.formState.errors.sellingPrice.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stock Quantity</Label>
                <Input type="number" {...editForm.register('stockQuantity')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>Cancel</Button>
              <Button type="submit" disabled={editForm.formState.isSubmitting}>
                {editForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteProdName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}