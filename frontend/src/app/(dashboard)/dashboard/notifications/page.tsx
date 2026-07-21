'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Loader2,
} from 'lucide-react';
import apiFetch from '@/lib/api';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch<{ data: NotificationItem[]; unreadCount: number }>('/api/v1/dashboard/notifications?limit=50');
      setNotifs(result.data || []);
    } catch {
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const filteredNotifs = notifs.filter((n) => {
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  const handleMarkAllRead = async () => {
    const unread = notifs.filter((n) => !n.read);
    for (const n of unread) {
      try {
        await apiFetch(`/api/v1/dashboard/notifications/${n.id}/read`, { method: 'PATCH' });
      } catch {}
    }
    fetchNotifs();
  };

  const handleToggleRead = async (id: string) => {
    try {
      await apiFetch(`/api/v1/dashboard/notifications/${id}/read`, { method: 'PATCH' });
      fetchNotifs();
    } catch {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'billing': return <Receipt className="h-4 w-4" />;
      case 'security': return <ShieldAlert className="h-4 w-4" />;
      case 'payout': return <CreditCard className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'billing': return 'bg-emerald-600';
      case 'security': return 'bg-indigo-600';
      case 'payout': return 'bg-blue-600';
      default: return 'bg-amber-500';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
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
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            </div>
          ) : filteredNotifs.length === 0 ? (
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
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${getColor(n.type)}`}
                  >
                    {getIcon(n.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{n.title}</span>
                      {!n.read && (
                        <Badge variant="default" className="text-[9px] h-4 bg-primary">New</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] capitalize">{n.type}</Badge>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                    <span className="text-[11px] text-muted-foreground/70 flex items-center gap-1 pt-1">
                      <Clock className="h-3 w-3" /> {formatTime(n.createdAt)}
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
