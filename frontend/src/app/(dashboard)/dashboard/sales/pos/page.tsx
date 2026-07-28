'use client';

import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number | string;
  stockQuantity: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Customer {
  id: string;
  name: string;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Load products and customers
  useEffect(() => {
    apiFetch('/api/v1/products?limit=100').then((res) => setProducts(res.items || []));
    apiFetch('/api/v1/customers').then((res) => setCustomers(res.items || []));
  }, []);

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      setCart(cart.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQty = (productId: string, val: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + val;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const getSubtotal = () => cart.reduce((acc, item) => acc + Number(item.product.sellingPrice) * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg('Cart is empty');
      return;
    }
    if (!selectedCustomerId) {
      setErrorMsg('Please select a customer (e.g. Walk-in Customer)');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      // Create Sales Order in draft
      const order = await apiFetch('/api/v1/sales-orders', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: Number(item.product.sellingPrice),
          })),
          couponCode: couponCode || undefined,
        }),
      });

      // Confirm Sales Order
      await apiFetch(`/api/v1/sales-orders/${order.id}/confirm`, { method: 'POST' });

      // Generate Sales Invoice (Quick Sale / Checkout Complete)
      await apiFetch(`/api/v1/sales-orders/${order.id}/invoice`, {
        method: 'POST',
        body: JSON.stringify({ dueDate: new Date().toISOString() }),
      });

      setSuccessMsg('Sale checked out successfully!');
      setCart([]);
      setCouponCode('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Checkout failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Products list (2 cols) */}
      <div className="lg:col-span-2 flex flex-col space-y-4 h-full overflow-hidden">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-semibold tracking-tight">
              POS Terminal
            </h1>
            <p className="text-muted-foreground text-xs">Point of sale interface for quick sales checkout.</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search product or SKU..."
              className="pl-8 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-1 flex-1">
          {filteredProducts.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer hover:border-brand-primary hover:shadow-md transition bg-card flex flex-col justify-between"
              onClick={() => addToCart(p)}
            >
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-bold leading-tight line-clamp-2">{p.name}</CardTitle>
                <CardDescription className="text-[10px] mt-0.5">{p.sku}</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-1 pb-2">
                <div className="text-lg font-extrabold text-primary">${Number(p.sellingPrice).toFixed(2)}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Stock: {p.stockQuantity}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart (1 col) */}
      <Card className="h-full flex flex-col justify-between border-l border-border bg-card shadow-soft-raised">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" /> Current Cart
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-500/15 text-emerald-600 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-destructive/15 text-destructive rounded-lg text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {cart.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Cart is empty. Tap products to add.</div>
          ) : (
            <div className="space-y-3 divide-y divide-muted/30">
              {cart.map((item) => (
                <div key={item.product.id} className="pt-3 flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold truncate">{item.product.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">${Number(item.product.sellingPrice).toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="xs" variant="outline" className="h-6 w-6 p-0" onClick={() => updateQty(item.product.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <Button size="xs" variant="outline" className="h-6 w-6 p-0" onClick={() => updateQty(item.product.id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="xs" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => removeFromCart(item.product.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 border-t flex flex-col gap-3 bg-muted/20">
          <div className="w-full space-y-2">
            <div className="space-y-1">
              <Label htmlFor="pos-customer" className="text-xs">Customer *</Label>
              <select
                id="pos-customer"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full h-8 px-2 bg-background border rounded-md text-xs outline-none"
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pos-coupon" className="text-xs">Coupon Code</Label>
              <Input
                id="pos-coupon"
                placeholder="e.g. WELCOME50"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="w-full pt-2 flex justify-between items-center text-sm font-extrabold">
            <span>Subtotal:</span>
            <span className="text-lg text-primary">${getSubtotal().toFixed(2)}</span>
          </div>

          <Button onClick={handleCheckout} className="w-full" disabled={isSubmitting || cart.length === 0}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Monitor className="h-4 w-4 mr-2" />} Checkout Sale
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
