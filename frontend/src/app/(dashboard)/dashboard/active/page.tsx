'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, Users, Zap, ShieldCheck, RefreshCw, Cpu, Server } from 'lucide-react';

export default function ActiveMetricsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Active Metrics & Telemetry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time system health, active user sessions, and live transaction throughput.
          </p>
        </div>

        <Button variant="outline" size="sm" className="cursor-pointer">
          <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh Telemetry
        </Button>
      </div>

      {/* Real-time KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-2xs border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">42 Users Online</div>
            <p className="text-xs text-muted-foreground mt-1">Across 3 active workspaces</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">API Throughput</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1,240 req/min</div>
            <p className="text-xs text-emerald-600 mt-1">99.98% success rate</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Avg Latency</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">24 ms</div>
            <p className="text-xs text-muted-foreground mt-1">Optimal response time</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">DB Pool Load</CardTitle>
            <Server className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">14% Utilization</div>
            <p className="text-xs text-muted-foreground mt-1">MySQL 8 Pool Healthy</p>
          </CardContent>
        </Card>
      </div>

      {/* Active User Sessions Table */}
      <Card className="shadow-2xs">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" /> Live User Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Active Route</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { email: 'admin@finflow.com', org: 'DirectFN HQ', route: '/dashboard/settings/screens', ip: '192.168.1.10', time: 'Just now' },
                { email: 'sarah.j@acme.com', org: 'Acme Global Corp', route: '/dashboard/invoices', ip: '192.168.1.42', time: '1 min ago' },
                { email: 'david.m@apextech.io', org: 'Apex Technologies', route: '/dashboard/reports', ip: '192.168.1.88', time: '3 mins ago' },
                { email: 'finance@vanguard.org', org: 'Vanguard Capital', route: '/dashboard/payments', ip: '192.168.1.91', time: '5 mins ago' },
              ].map((s, idx) => (
                <TableRow key={idx} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-semibold text-xs text-foreground">{s.email}</TableCell>
                  <TableCell className="text-xs">{s.org}</TableCell>
                  <TableCell className="font-mono text-xs text-primary">{s.route}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.ip}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.time}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">
                      Active
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
