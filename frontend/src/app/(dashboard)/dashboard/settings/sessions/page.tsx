"use client";

import { useEffect, useMemo, useState } from "react";
import { Monitor, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const otherSessionCount = useMemo(
    () => sessions.filter((session) => !session.isCurrent).length,
    [sessions],
  );

  const loadSessions = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ sessions: Session[] }>("/api/v1/auth/sessions");
      setSessions(data.sessions);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const revokeSession = async (sessionId: string) => {
    setBusyId(sessionId);
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/api/v1/auth/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      setMessage("Session revoked.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to revoke session");
    } finally {
      setBusyId(null);
    }
  };

  const revokeOthers = async () => {
    setBusyId("others");
    setError(null);
    setMessage(null);
    try {
      const data = await apiFetch<{ revokedCount: number }>("/api/v1/auth/sessions/others", { method: "DELETE" });
      setSessions((current) => current.filter((session) => session.isCurrent));
      setMessage(`${data.revokedCount} other session${data.revokedCount === 1 ? "" : "s"} revoked.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to revoke other sessions");
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Active Sessions</h1>
          <p className="text-muted-foreground">Review signed-in browser sessions and revoke access when needed.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadSessions} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="destructive" onClick={revokeOthers} disabled={otherSessionCount === 0 || busyId === "others"}>
            <ShieldCheck className="h-4 w-4" />
            Revoke Others
          </Button>
        </div>
      </div>

      {(message || error) && (
        <div className={`rounded-md border px-3 py-2 text-sm ${error ? "border-destructive/40 text-destructive" : "border-emerald-500/40 text-emerald-700"}`}>
          {error || message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Monitor className="h-5 w-5" />
            Signed-in Sessions
          </CardTitle>
          <CardDescription>
            Refresh tokens are stored server-side and can be revoked without changing your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Loading sessions...
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No active sessions found.
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Browser session</span>
                        {session.isCurrent && <Badge variant="secondary">Current</Badge>}
                      </div>
                      <div className="mt-1 max-w-[12rem] truncate text-xs text-muted-foreground sm:max-w-none">
                        {session.id}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(session.createdAt)}</TableCell>
                    <TableCell>{formatDate(session.expiresAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeSession(session.id)}
                        disabled={session.isCurrent || busyId === session.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
