'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Search,
  ArrowRightLeft,
  AlertTriangle,
  Building,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';


interface StockMovement {
  id: string;
  type: 'Stock In' | 'Stock Out' | 'Transfer' | 'Damaged' | 'Adjustment';
  sku: string;
  itemName: string;
  quantity: number;
  warehouse: string;
  status: string;
  createdAt: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string | null;
}

export default function InventoryManagementPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('products.edit');
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [newMov, setNewMov] = useState({
    type: 'Stock In' as StockMovement['type'],
    sku: '',
    itemName: '',
    quantity: 1,
    warehouse: 'Main HQ Warehouse',
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [movRes, whRes] = await Promise.all([
        apiFetch<{ items: StockMovement[] }>(`/api/v1/inventory?search=${encodeURIComponent(search)}`),
        apiFetch<Warehouse[]>('/api/v1/inventory/warehouses'),
      ]);
      setMovements(movRes.items);
      setWarehouses(whRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiFetch('/api/v1/inventory', {
        method: 'POST',
        body: JSON.stringify({
          type: newMov.type,
          sku: newMov.sku || 'SKU-GENERIC',
          itemName: newMov.itemName || 'Stock Item',
          quantity: Number(newMov.quantity),
          warehouse: newMov.warehouse,
        }),
      });
      setOpenAdd(false);
      setNewMov({ type: 'Stock In', sku: '', itemName: '', quantity: 1, warehouse: warehouses[0]?.name || 'Main HQ Warehouse' });
      fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to record stock movement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (movements.length === 0) return;
    const headers = ['Type', 'Item Name', 'SKU', 'Quantity', 'Warehouse', 'Status', 'Date'];
    const rows = movements.map((m) => [
      m.type,
      `"${m.itemName.replace(/"/g, '""')}"`,
      `"${m.sku.replace(/"/g, '""')}"`,
      m.quantity,
      `"${m.warehouse.replace(/"/g, '""')}"`,
      m.status || 'Completed',
      new Date(m.createdAt).toLocaleDateString(),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const transfersCount = movements.filter(m => m.type === 'Transfer').length;
  const damagedCount = movements.filter(m => m.type === 'Damaged').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <WarehouseIcon className="h-4 w-4" />
            <span>Stock Operations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-sm text-muted-foreground">
            Track stock in/out, inter-warehouse transfers, damaged inventory, stock adjustments, and low stock alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="cursor-pointer">
            Stock Audit Log
          </Button>
          {canEdit && (
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" /> Record Movement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={handleRecordMovement}>
                <DialogHeader>
                  <DialogTitle>Record Stock Movement</DialogTitle>
                  <DialogDescription>Add stock in, stock out, transfers, or damaged stock write-offs.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Movement Type</Label>
                    <Select
                      value={newMov.type}
                      onValueChange={(val) => setNewMov({ ...newMov, type: val as StockMovement['type'] })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stock In">Stock In (Purchase/Return)</SelectItem>
                        <SelectItem value="Stock Out">Stock Out (Sale/Dispatch)</SelectItem>
                        <SelectItem value="Transfer">Inter-Warehouse Transfer</SelectItem>
                        <SelectItem value="Damaged">Damaged / Write-Off</SelectItem>
                        <SelectItem value="Adjustment">Stock Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Item Name</Label>
                    <Input
                      required
                      placeholder="e.g. Thermal Receipt Paper"
                      value={newMov.itemName}
                      onChange={(e) => setNewMov({ ...newMov, itemName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input
                        required
                        placeholder="FF-TRP-80"
                        value={newMov.sku}
                        onChange={(e) => setNewMov({ ...newMov, sku: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newMov.quantity}
                        onChange={(e) => setNewMov({ ...newMov, quantity: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Warehouse</Label>
                    {warehouses.length > 0 ? (
                      <Select
                        value={newMov.warehouse}
                        onValueChange={(val) => setNewMov({ ...newMov, warehouse: val })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((wh) => (
                            <SelectItem key={wh.id} value={wh.name}>
                              {wh.name} {wh.code ? `(${wh.code})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={newMov.warehouse}
                        onChange={(e) => setNewMov({ ...newMov, warehouse: e.target.value })}
                      />
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Submit Record
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
            <CardDescription>Stock Transfers Recorded</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">{transfersCount} Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
              <ArrowRightLeft className="h-3.5 w-3.5" /> Inter-branch Movement
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Damaged Stock Write-offs</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600">{damagedCount} Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-rose-600 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Audit Logged
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Warehouses</CardDescription>
            <CardTitle className="text-2xl font-bold">{warehouses.length || 1} Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Building className="h-3.5 w-3.5" /> Storage & HQ Warehouses
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Stock Movement Register</CardTitle>
              <CardDescription>Audit history of stock ins, outs, transfers, and adjustments.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter by type, item, or SKU..."
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
                  <TableHead>Movement Type</TableHead>
                  <TableHead>Item & SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Warehouse Location</TableHead>
                  <TableHead>Date Recorded</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No stock movements recorded yet. Click &quot;Record Movement&quot; to log stock ins/outs.
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        {m.type === 'Stock In' && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Stock In</Badge>
                        )}
                        {m.type === 'Transfer' && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Transfer</Badge>
                        )}
                        {m.type === 'Damaged' && (
                          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20">Damaged</Badge>
                        )}
                        {m.type === 'Adjustment' && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Adjustment</Badge>
                        )}
                        {m.type === 'Stock Out' && (
                          <Badge variant="outline">Stock Out</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{m.itemName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{m.sku}</div>
                      </TableCell>
                      <TableCell className="font-mono font-bold">{m.quantity}</TableCell>
                      <TableCell className="text-sm">{m.warehouse}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="text-xs">{m.status || 'Completed'}</Badge>
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

