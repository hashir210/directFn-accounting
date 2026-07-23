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
  const [openAdd, setOpenAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [newProd, setNewProd] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Hardware',
    unit: 'Unit',
    purchasePrice: '0',
    sellingPrice: '0',
    imageUrl: '',
    stockQuantity: '10',
  });

  // Edit state
  const [editProd, setEditProd] = useState<{
    id: string; name: string; sku: string; barcode: string; category: string;
    unit: string; purchasePrice: string; sellingPrice: string; imageUrl: string; stockQuantity: string;
  } | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
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
  }, [fetchProducts]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/products', {
        method: 'POST',
        body: JSON.stringify({
          name: newProd.name,
          sku: newProd.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          barcode: newProd.barcode || undefined,
          category: newProd.category || undefined,
          unit: newProd.unit,
          purchasePrice: parseFloat(newProd.purchasePrice) || 0,
          sellingPrice: parseFloat(newProd.sellingPrice) || 0,
          imageUrl: newProd.imageUrl || undefined,
          stockQuantity: parseInt(newProd.stockQuantity) || 0,
        }),
      });
      setOpenAdd(false);
      setNewProd({ name: '', sku: '', barcode: '', category: 'Hardware', unit: 'Unit', purchasePrice: '0', sellingPrice: '0', imageUrl: '', stockQuantity: '10' });
      fetchProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (p: Product) => {
    setEditProd({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      category: p.category || 'Hardware',
      unit: p.unit,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      imageUrl: p.imageUrl || '',
      stockQuantity: String(p.stockQuantity),
    });
    setOpenEdit(true);
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProd) return;
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch(`/api/v1/products/${editProd.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editProd.name,
          sku: editProd.sku,
          barcode: editProd.barcode || undefined,
          category: editProd.category || undefined,
          unit: editProd.unit,
          purchasePrice: parseFloat(editProd.purchasePrice) || 0,
          sellingPrice: parseFloat(editProd.sellingPrice) || 0,
          imageUrl: editProd.imageUrl || undefined,
          stockQuantity: parseInt(editProd.stockQuantity) || 0,
        }),
      });
      setOpenEdit(false);
      setEditProd(null);
      fetchProducts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update product');
    } finally {
      setIsSubmitting(false);
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
          <h1 className="text-2xl font-bold tracking-tight">Product Catalog</h1>
          <p className="text-sm text-muted-foreground">
            Manage product categories, SKUs, barcodes, cost prices, selling margins, tax profiles, and product images.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="cursor-pointer">
            Export Catalog
          </Button>
          {canEdit && (
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={handleCreateProduct}>
                <DialogHeader>
                  <DialogTitle>Add Product to Catalog</DialogTitle>
                  <DialogDescription>Configure pricing, SKU, barcode, image URL, and stock levels.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input
                      required
                      placeholder="e.g. POS Smart Terminal V2"
                      value={newProd.name}
                      onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input
                        placeholder="FF-POS-V2"
                        value={newProd.sku}
                        onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Barcode</Label>
                      <Input
                        placeholder="890123456789"
                        value={newProd.barcode}
                        onChange={(e) => setNewProd({ ...newProd, barcode: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Purchase Cost ($)</Label>
                      <Input
                        type="number"
                        placeholder="220.00"
                        value={newProd.purchasePrice}
                        onChange={(e) => setNewProd({ ...newProd, purchasePrice: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Selling Price ($)</Label>
                      <Input
                        type="number"
                        required
                        placeholder="349.00"
                        value={newProd.sellingPrice}
                        onChange={(e) => setNewProd({ ...newProd, sellingPrice: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Product Image URL</Label>
                    <Input
                      placeholder="https://images.unsplash.com/photo-1556742049-0a6792357321"
                      value={newProd.imageUrl}
                      onChange={(e) => setNewProd({ ...newProd, imageUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Initial Stock Quantity</Label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={newProd.stockQuantity}
                      onChange={(e) => setNewProd({ ...newProd, stockQuantity: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Save Product
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
      <Card>
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
                      <TableCell className="font-mono text-sm text-muted-foreground">${Number(p.purchasePrice).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-sm">${Number(p.sellingPrice).toFixed(2)}</TableCell>
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
          <form onSubmit={handleEditProduct}>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>Update product details and pricing.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input required value={editProd?.name || ''} onChange={(e) => setEditProd(editProd ? { ...editProd, name: e.target.value } : null)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input value={editProd?.sku || ''} onChange={(e) => setEditProd(editProd ? { ...editProd, sku: e.target.value } : null)} />
                </div>
                <div className="space-y-2">
                  <Label>Barcode</Label>
                  <Input value={editProd?.barcode || ''} onChange={(e) => setEditProd(editProd ? { ...editProd, barcode: e.target.value } : null)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Purchase Cost ($)</Label>
                  <Input type="number" value={editProd?.purchasePrice || '0'} onChange={(e) => setEditProd(editProd ? { ...editProd, purchasePrice: e.target.value } : null)} />
                </div>
                <div className="space-y-2">
                  <Label>Selling Price ($)</Label>
                  <Input type="number" required value={editProd?.sellingPrice || '0'} onChange={(e) => setEditProd(editProd ? { ...editProd, sellingPrice: e.target.value } : null)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stock Quantity</Label>
                <Input type="number" value={editProd?.stockQuantity || '0'} onChange={(e) => setEditProd(editProd ? { ...editProd, stockQuantity: e.target.value } : null)} />
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


