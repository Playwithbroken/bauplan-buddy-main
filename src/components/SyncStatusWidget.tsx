import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import OfflineSyncService, {
  SyncStatus,
  SyncConflict,
} from "@/services/offlineSyncService";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Database,
  AlertCircle,
} from "lucide-react";

const SyncStatusWidget: React.FC = () => {
  const { toast } = useToast();
  const syncService = OfflineSyncService.getInstance();
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateStatus = async () => {
      const currentStatus = await syncService.getStatus();
      setStatus(currentStatus);
      setConflicts(syncService.getConflicts());
      setIsLoading(false);
    };

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    // Listen for sync events
    const handleSyncCompleted = () => {
      updateStatus();
      toast({
        title: "Synchronisation abgeschlossen",
        description: "Alle Änderungen wurden erfolgreich synchronisiert.",
      });
    };

    const handleSyncFailed = (event: CustomEvent) => {
      updateStatus();
      toast({
        title: "Synchronisation fehlgeschlagen",
        description: event.detail?.message || "Unbekannter Fehler",
        variant: "destructive",
      });
    };

    const handleSyncConflict = (event: CustomEvent<SyncConflict>) => {
      updateStatus();
      toast({
        title: "Konflikt erkannt",
        description: `Konflikt in Modul: ${event.detail.module}`,
        variant: "destructive",
      });
    };

    window.addEventListener(
      "syncCompleted",
      handleSyncCompleted as EventListener
    );
    window.addEventListener("syncFailed", handleSyncFailed as EventListener);
    window.addEventListener(
      "syncConflict",
      handleSyncConflict as EventListener
    );

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "syncCompleted",
        handleSyncCompleted as EventListener
      );
      window.removeEventListener(
        "syncFailed",
        handleSyncFailed as EventListener
      );
      window.removeEventListener(
        "syncConflict",
        handleSyncConflict as EventListener
      );
    };
  }, [syncService, toast]);

  const handleManualSync = async () => {
    try {
      await syncService.syncNow();
    } catch (error) {
      toast({
        title: "Sync fehlgeschlagen",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    }
  };

  const handleResolveConflict = (
    conflictId: string,
    resolution: "use-local" | "use-server"
  ) => {
    syncService.resolveConflict(conflictId, resolution);
    setConflicts(syncService.getConflicts());
    toast({
      title: "Konflikt gelöst",
      description: `${
        resolution === "use-local" ? "Lokale" : "Server"
      } Version wurde verwendet.`,
    });
  };

  const formatDate = (timestamp: string | null) => {
    if (!timestamp) return "Nie";
    const date = new Date(timestamp);
    return date.toLocaleString("de-DE");
  };

  const getStatusIcon = () => {
    if (!status.isOnline) {
      return <WifiOff className="h-5 w-5 text-red-600" />;
    }
    if (status.isSyncing) {
      return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
    }
    if (status.pendingConflicts > 0) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
    if (status.queueLength > 0) {
      return <Clock className="h-5 w-5 text-orange-600" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  };

  const getStatusText = () => {
    if (!status.isOnline) return "Offline";
    if (status.isSyncing) return "Synchronisiert...";
    if (status.pendingConflicts > 0) return "Konflikte";
    if (status.queueLength > 0) return "Warteschlange aktiv";
    return "Synchronisiert";
  };

  const getStatusColor = () => {
    if (!status.isOnline) return "destructive";
    if (status.pendingConflicts > 0) return "destructive";
    if (status.queueLength > 0) return "secondary";
    return "default";
  };

  if (isLoading || !status) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <CardTitle className="text-lg">Sync-Status</CardTitle>
            </div>
            <Badge variant={getStatusColor()}>{getStatusText()}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {status.isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {status.isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          {/* Last Sync */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Letzte Synchronisation
            </span>
            <span className="font-medium">{formatDate(status.lastSync)}</span>
          </div>

          {/* Queue Length */}
          {status.queueLength > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Warteschlange</span>
              <Badge variant="secondary">{status.queueLength} Elemente</Badge>
            </div>
          )}

          {/* Failed Items */}
          {status.failedItems > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {status.failedItems} Element(e) konnten nicht synchronisiert
                werden
              </AlertDescription>
            </Alert>
          )}

          {/* Manual Sync Button */}
          <Button
            onClick={handleManualSync}
            disabled={status.isSyncing || !status.isOnline}
            className="w-full"
            variant="outline"
          >
            {status.isSyncing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Jetzt synchronisieren
          </Button>
        </CardContent>
      </Card>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">
                Konflikte ({conflicts.length})
              </CardTitle>
            </div>
            <CardDescription>
              Änderungen, die sowohl lokal als auch auf dem Server vorgenommen
              wurden
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{conflict.module}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(conflict.timestamp).toLocaleString("de-DE")}
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="font-medium">Lokale Version</p>
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                      {JSON.stringify(conflict.localVersion, null, 2)}
                    </pre>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Server Version</p>
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                      {JSON.stringify(conflict.serverVersion, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() =>
                      handleResolveConflict(conflict.id, "use-local")
                    }
                    variant="outline"
                    size="sm"
                  >
                    Lokal verwenden
                  </Button>
                  <Button
                    onClick={() =>
                      handleResolveConflict(conflict.id, "use-server")
                    }
                    variant="outline"
                    size="sm"
                  >
                    Server verwenden
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SyncStatusWidget;
