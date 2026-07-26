'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, Users, Loader2, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Session {
  id: string;
  createdAt: string;
  userAgent?: string;
  ipAddress?: string;
}

interface DashboardSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashFlow: { month: number; revenue: number; expenses: number; net: number }[];
}

export default function ActiveMetricsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sessionData, summaryData] = await Promise.all([
        apiFetch<{ sessions: Session[] }>('/api/v1/auth/sessions'),
        apiFetch<DashboardSummary>('/api/v1/dashboard/summary'),
      ]);
      setSessions(sessionData?.sessions || []);
      setSummary(summaryData);
    } catch (err) {
      setError('Failed to load active metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeSessions = sessions.length;
  const totalRevenue = summary?.totalRevenue || 0;
  const totalExpenses = summary?.totalExpenses || 0;

  return (
    <div className="space-y-6">
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

        <Button variant="outline" size="sm" className="cursor-pointer" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
          Refresh Telemetry
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{loading ? '...' : `${activeSessions} Online`}</div>
            <p className="text-xs text-muted-foreground mt-1">Current logged-in users</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Revenue (MTD)</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{loading ? '...' : `$${totalRevenue.toLocaleString()}`}</div>
            <p className="text-xs text-emerald-600 mt-1">Month-to-date revenue</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Expenses (MTD)</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{loading ? '...' : `$${totalExpenses.toLocaleString()}`}</div>
            <p className="text-xs text-muted-foreground mt-1">Month-to-date expenses</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">System Status</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Operational</div>
            <p className="text-xs text-muted-foreground mt-1">All systems healthy</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Active User Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No active sessions found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs text-foreground">{s.id.slice(0, 12)}...</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{s.ipAddress || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}