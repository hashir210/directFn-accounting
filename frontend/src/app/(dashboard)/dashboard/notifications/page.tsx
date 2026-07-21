'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  CheckCheck,
  ShieldAlert,
  Receipt,
  CreditCard,
  Zap,
  Clock,
  Filter,
  CheckCircle2,
} from 'lucide-react';

interface NotificationFeedItem {
  id: string;
  title: string;
  message: string;
  category: 'system' | 'billing' | 'payout' | 'security';
  time: string;
  read: boolean;
}

const INITIAL_NOTIFS: NotificationFeedItem[] = [
  { id: '1', title: 'Payment Received from Acme Global Corp', message: 'Invoice #INV-2026-001 ($14,500.00) has been paid via Wire Transfer.', category: 'billing', time: '10 minutes ago', read: false },
  { id: '2', title: 'Low Stock Alert: Server Hardware Modules', message: 'SKU TEST-HW-09 is below low stock threshold (3 units remaining).', category: 'system', time: '1 hour ago', read: false },
  { id: '3', title: 'New 2FA Login Detected', message: 'Successful 2FA login verified from New York, USA (IP: 192.168.1.1).', category: 'security', time: '3 hours ago', read: true },
  { id: '4', title: 'Monthly Payout Settled', message: 'Net settlement of $28,400.00 transferred to Chase Business Account (****4910).', category: 'payout', time: 'Yesterday', read: true },
  { id: '5', title: 'Invoice #INV-2026-003 Overdue Alert', message: 'Starlight Retail LLC invoice #INV-2026-003 ($3,950.00) is 15 days overdue.', category: 'billing', time: '2 days ago', read: true },
];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<NotificationFeedItem[]>(INITIAL_NOTIFS);
  const [activeTab, setActiveTab] = useState<string>('all');

  const filteredNotifs = notifs.filter((n) => {
    if (activeTab === 'all') return true;
    return n.category === activeTab;
  });

  const handleMarkAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notification Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            System alerts, invoice updates, security notifications, and settlement logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="cursor-pointer">
            <CheckCheck className="h-4 w-4 mr-1.5" /> Mark All as Read
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <Card className="shadow-2xs">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-medium">
              {[
                { id: 'all', label: 'All Alerts' },
                { id: 'billing', label: 'Billing & Invoices' },
                { id: 'payout', label: 'Payouts' },
                { id: 'security', label: 'Security' },
                { id: 'system', label: 'System' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-background text-foreground shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-muted-foreground font-medium">
              Showing {filteredNotifs.length} notification(s)
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0 divide-y">
          {filteredNotifs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No notifications found in this category.
            </div>
          ) : (
            filteredNotifs.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  !n.read ? 'bg-primary/5' : 'hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                      n.category === 'billing'
                        ? 'bg-emerald-600'
                        : n.category === 'security'
                        ? 'bg-indigo-600'
                        : n.category === 'payout'
                        ? 'bg-blue-600'
                        : 'bg-amber-500'
                    }`}
                  >
                    {n.category === 'billing' && <Receipt className="h-4 w-4" />}
                    {n.category === 'security' && <ShieldAlert className="h-4 w-4" />}
                    {n.category === 'payout' && <CreditCard className="h-4 w-4" />}
                    {n.category === 'system' && <Zap className="h-4 w-4" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{n.title}</span>
                      {!n.read && (
                        <Badge variant="default" className="text-[9px] h-4 bg-primary">
                          New
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {n.category}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                    <span className="text-[11px] text-muted-foreground/70 flex items-center gap-1 pt-1">
                      <Clock className="h-3 w-3" /> {n.time}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleRead(n.id)}
                  className="cursor-pointer text-xs text-muted-foreground hover:text-foreground shrink-0"
                >
                  {n.read ? 'Mark Unread' : 'Mark Read'}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
