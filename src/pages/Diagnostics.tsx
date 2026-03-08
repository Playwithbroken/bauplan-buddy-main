import React, { useEffect, useMemo, useState } from "react";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ErrorHandlingService,
  LogLevel,
  type ErrorReport,
  type PerformanceMetric,
} from "@/services/errorHandlingService";
import { offlineSync, type OfflineState } from "@/services/offlineSyncService";

const Diagnostics: React.FC = () => {
  const [logs, setLogs] = useState(() =>
    ErrorHandlingService.getLogs({ limit: 100 })
  );
  const [errors, setErrors] = useState<ErrorReport[]>(() =>
    ErrorHandlingService.getErrorReports({ limit: 100 })
  );
  const [metrics, setMetrics] = useState<PerformanceMetric[]>(() =>
    ErrorHandlingService.getPerformanceMetrics({ limit: 50 })
  );
  const [state, setState] = useState<OfflineState>(() =>
    offlineSync.getOfflineState()
  );
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineSync.addStateListener(setState);
    const interval = setInterval(() => {
      setLogs(ErrorHandlingService.getLogs({ limit: 100 }));
      setErrors(ErrorHandlingService.getErrorReports({ limit: 100 }));
      setMetrics(ErrorHandlingService.getPerformanceMetrics({ limit: 50 }));
    }, 2000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const pending = state.pendingActions.length;

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Diagnose" },
      ]}
    >
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Systemstatus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={state.isOnline ? "default" : "destructive"}>
                {state.isOnline ? "Online" : "Offline"}
              </Badge>
              <Badge variant="secondary">Pending Aktionen: {pending}</Badge>
              {state.lastSync && (
                <Badge>
                  Letzter Sync: {new Date(state.lastSync).toLocaleString()}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                disabled={!state.isOnline || syncing}
                onClick={async () => {
                  setSyncing(true);
                  await offlineSync.syncNow();
                  setSyncing(false);
                }}
              >
                Jetzt synchronisieren
              </Button>
              <Button
                variant="outline"
                onClick={() => offlineSync.clearOfflineData()}
              >
                Offline-Daten löschen
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-auto text-sm">
                {logs.map((l) => (
                  <div key={l.id} className="flex items-start gap-2">
                    <Badge
                      variant={
                        l.level >= LogLevel.ERROR ? "destructive" : "secondary"
                      }
                    >
                      {LogLevel[l.level]}
                    </Badge>
                    <div>
                      <div className="font-mono text-xs text-gray-500">
                        {new Date(l.timestamp).toLocaleString()} · {l.category}
                      </div>
                      <div>{l.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fehler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-auto text-sm">
                {errors.map((e) => (
                  <div key={e.id} className="border rounded p-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{e.errorType}</div>
                      <Badge variant={e.resolved ? "secondary" : "destructive"}>
                        {e.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(e.timestamp).toLocaleString()}
                    </div>
                    <div className="mt-1">{e.message}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutWithSidebar>
  );
};

export default Diagnostics;
