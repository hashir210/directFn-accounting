"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { ActivitySquare, Shield, Clock, Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { socket } = useSocket();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await apiFetch("/api/v1/audit-logs");
        if (response.success) {
          setLogs(response.data.logs);
        }
      } catch (error) {
        console.error("Failed to fetch audit logs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewLog = (newLog: AuditLog) => {
      setLogs((prev) => [newLog, ...prev]);
    };
    socket.on("new_audit_log", handleNewLog);
    return () => {
      socket.off("new_audit_log", handleNewLog);
    };
  }, [socket]);

  const filteredLogs = logs.filter((log) => {
    const search = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.entity.toLowerCase().includes(search) ||
      (log.user?.name || "").toLowerCase().includes(search)
    );
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "UPDATE": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "DELETE": return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      case "LOGIN": return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      default: return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time tracking of all critical system actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-[250px] bg-background"
            />
          </div>
        </div>
      </div>

      <div className="bg-card border shadow-sm rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <ActivitySquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p>No audit logs found matching your criteria.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-[29px] top-4 bottom-4 w-px bg-border hidden sm:block" />

            <div className="divide-y sm:divide-y-0 p-4 space-y-4">
              {filteredLogs.map((log) => {
                let parsedDetails = null;
                try {
                  if (log.details) parsedDetails = JSON.parse(log.details);
                } catch (e) {}

                return (
                  <div 
                    key={log.id} 
                    className="relative flex gap-4 p-4 rounded-xl hover:bg-muted/30 transition-all border border-transparent hover:border-border/50 animate-in fade-in slide-in-from-top-2"
                  >
                    {/* Icon Column */}
                    <div className="hidden sm:flex flex-col items-center z-10 shrink-0">
                      <div className="h-8 w-8 rounded-full bg-background border flex items-center justify-center shadow-sm">
                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-foreground">
                            {log.user?.name || "System"}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            ({log.user?.email || "N/A"})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                        <span className="text-sm font-medium text-muted-foreground">
                          {log.entity}
                        </span>
                        {log.entityId && (
                          <>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {log.entityId.slice(0, 8)}...
                            </span>
                          </>
                        )}
                      </div>

                      {parsedDetails && (
                        <div className="mt-2 bg-muted/30 border rounded-lg p-3 overflow-x-auto">
                          <pre className="text-[11px] text-muted-foreground leading-relaxed font-mono">
                            {JSON.stringify(parsedDetails, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.ipAddress && (
                        <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-2">
                          IP: {log.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
