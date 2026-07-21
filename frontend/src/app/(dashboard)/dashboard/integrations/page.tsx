'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Zap,
  CheckCircle2,
  Settings,
  Plug,
  ExternalLink,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  iconBg: string;
  status: 'connected' | 'available';
  lastSync?: string;
}

const INTEGRATIONS: Integration[] = [
  { id: 'stripe', name: 'Stripe Payments', category: 'Payments', description: 'Process credit cards, Apple Pay, and automated customer subscriptions.', iconBg: 'bg-indigo-600', status: 'connected', lastSync: '10 mins ago' },
  { id: 'plaid', name: 'Plaid Bank Feeds', category: 'Banking', description: 'Real-time bank account balance sync and automated transaction ingestion.', iconBg: 'bg-emerald-600', status: 'connected', lastSync: '1 hour ago' },
  { id: 'quickbooks', name: 'QuickBooks Online', category: 'Accounting', description: 'Bi-directional general ledger, invoice, and journal entry synchronization.', iconBg: 'bg-blue-600', status: 'available' },
  { id: 'xero', name: 'Xero Accounting', category: 'Accounting', description: 'Sync bank reconciliations and chart of accounts automatically.', iconBg: 'bg-sky-500', status: 'available' },
  { id: 'slack', name: 'Slack Alerts', category: 'Notifications', description: 'Receive instant notifications for unpaid invoices, large payments, and high expenses.', iconBg: 'bg-purple-600', status: 'connected', lastSync: 'Real-time' },
  { id: 'zapier', name: 'Zapier Automation', category: 'Workflows', description: 'Trigger custom Webhooks and automate 5,000+ app connections.', iconBg: 'bg-orange-500', status: 'available' },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [search, setSearch] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const filtered = integrations.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase()) ||
    i.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleConnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'connected' ? 'available' : 'connected';
          return { ...item, status: nextStatus, lastSync: nextStatus === 'connected' ? 'Just now' : undefined };
        }
        return item;
      })
    );
    setSelectedIntegration(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations & API Connections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect payment gateways, bank feeds, ERP systems, and workflow webhooks.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.id} className="flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-all">
            <CardHeader className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className={`h-11 w-11 rounded-xl ${item.iconBg} text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0`}>
                  {item.name[0]}
                </div>

                <Badge
                  variant={item.status === 'connected' ? 'secondary' : 'outline'}
                  className={`text-[10px] capitalize ${
                    item.status === 'connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 font-semibold' : ''
                  }`}
                >
                  {item.status === 'connected' ? <CheckCircle2 className="h-3 w-3 mr-1 inline" /> : <Plug className="h-3 w-3 mr-1 inline" />}
                  {item.status}
                </Badge>
              </div>

              <CardTitle className="text-base font-bold mt-3">{item.name}</CardTitle>
              <CardDescription className="text-xs leading-relaxed mt-1">{item.description}</CardDescription>
            </CardHeader>

            <CardContent className="p-5 pt-0 border-t bg-muted/20 mt-4 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {item.lastSync ? `Sync: ${item.lastSync}` : `Category: ${item.category}`}
              </span>

              <Button
                variant={item.status === 'connected' ? 'outline' : 'default'}
                size="sm"
                className="cursor-pointer text-xs h-8"
                onClick={() => setSelectedIntegration(item)}
              >
                {item.status === 'connected' ? (
                  <>
                    <Settings className="h-3.5 w-3.5 mr-1" /> Configure
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 mr-1" /> Connect
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Configuration Dialog */}
      {selectedIntegration && (
        <Dialog open={!!selectedIntegration} onOpenChange={() => setSelectedIntegration(null)}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Configure {selectedIntegration.name}
              </DialogTitle>
              <DialogDescription>
                Enter API credentials to securely sync data with {selectedIntegration.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key / Secret Token</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk_live_902148..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
              </div>

              <div className="p-3 bg-muted rounded-lg text-xs space-y-1 text-muted-foreground">
                <div className="font-semibold text-foreground">Permissions Granted:</div>
                <p>• Read account balance and transaction history</p>
                <p>• Write invoice status updates and Webhooks</p>
              </div>
            </div>

            <DialogFooter className="flex justify-between items-center sm:justify-between">
              {selectedIntegration.status === 'connected' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleToggleConnect(selectedIntegration.id)}
                  className="cursor-pointer"
                >
                  Disconnect
                </Button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedIntegration(null)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => handleToggleConnect(selectedIntegration.id)} className="cursor-pointer">
                  Save Connection
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
