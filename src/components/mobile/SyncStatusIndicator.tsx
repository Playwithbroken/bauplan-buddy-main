/**
 * Sync Status Indicator Component
 * Shows offline/online status and pending sync items
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

export interface SyncStats {
  pending: number;
  syncing: number;
  errors: number;
  conflicts: number;
  lastSyncAt?: Date;
}

interface SyncStatusIndicatorProps {
  isOnline?: boolean;
  stats?: SyncStats;
  onSync?: () => void;
  onRetry?: () => void;
  variant?: "minimal" | "compact" | "detailed";
  className?: string;
}

export function SyncStatusIndicator({
  isOnline = navigator.onLine,
  stats = { pending: 0, syncing: 0, errors: 0, conflicts: 0 },
  onSync,
  onRetry,
  variant = "compact",
  className,
}: SyncStatusIndicatorProps) {
  const [online, setOnline] = useState(isOnline);
  const [isSyncing, setIsSyncing] = useState(false);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Handle sync button click
  const handleSync = async () => {
    if (!onSync || isSyncing || !online) return;

    setIsSyncing(true);
    try {
      await onSync();
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculate overall status
  const hasPending = stats.pending > 0 || stats.syncing > 0;
  const hasErrors = stats.errors > 0 || stats.conflicts > 0;
  const isSynced = !hasPending && !hasErrors;

  // Format last sync time
  const formatLastSync = (date?: Date): string => {
    if (!date) return "Nie";

    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Gerade eben";
    if (minutes < 60) return `vor ${minutes} Min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `vor ${hours} Std`;

    return new Date(date).toLocaleDateString("de-DE");
  };

  // Minimal variant - just an icon
  if (variant === "minimal") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full",
                className,
              )}
            >
              {!online ? (
                <WifiOff className="h-4 w-4 text-muted-foreground" />
              ) : hasErrors ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : hasPending ? (
                <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {!online
              ? "Offline"
              : hasErrors
                ? `${stats.errors + stats.conflicts} Fehler`
                : hasPending
                  ? `${stats.pending + stats.syncing} ausstehend`
                  : "Synchronisiert"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Compact variant - icon + badge
  if (variant === "compact") {
    return (
      <TooltipProvider>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn("gap-1.5 h-8 px-2", className)}
            >
              {online ? (
                <Cloud className="h-4 w-4" />
              ) : (
                <CloudOff className="h-4 w-4 text-muted-foreground" />
              )}

              {(stats.syncing > 0 || isSyncing) && (
                <RefreshCw className="h-3 w-3 animate-spin" />
              )}

              {hasPending && !isSyncing && stats.syncing === 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {stats.pending}
                </Badge>
              )}

              {hasErrors && (
                <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                  {stats.errors + stats.conflicts}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <div className="space-y-3">
              {/* Connection status */}
              <div className="flex items-center gap-2">
                {online ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm">Online</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                    <span className="text-sm text-muted-foreground">
                      Offline - Änderungen werden gespeichert
                    </span>
                  </>
                )}
              </div>

              {/* Sync stats */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Ausstehend:</span>
                  <span className="font-medium">{stats.pending}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Fehler:</span>
                  <span
                    className={cn(
                      "font-medium",
                      stats.errors > 0 && "text-red-500",
                    )}
                  >
                    {stats.errors}
                  </span>
                </div>
              </div>

              {/* Last sync */}
              <div className="text-xs text-muted-foreground">
                Letzte Synchronisierung: {formatLastSync(stats.lastSyncAt)}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {online && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={handleSync}
                    disabled={isSyncing || stats.syncing > 0}
                  >
                    <RefreshCw
                      className={cn(
                        "h-3.5 w-3.5 mr-1.5",
                        (isSyncing || stats.syncing > 0) && "animate-spin",
                      )}
                    />
                    Jetzt sync
                  </Button>
                )}

                {stats.errors > 0 && onRetry && (
                  <Button size="sm" variant="outline" onClick={onRetry}>
                    Wiederholen
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </TooltipProvider>
    );
  }

  // Detailed variant styles
  const variants = {
    offline: "bg-muted/50 border-muted",
    error:
      "bg-destructive/10 dark:bg-destructive/20 border-destructive/20 dark:border-destructive/50",
    success:
      "bg-success/10 dark:bg-success/20 border-success/20 dark:border-success/50",
    default: "bg-background border-border",
  };

  const currentVariant = !online
    ? "offline"
    : hasErrors
      ? "error"
      : isSynced
        ? "success"
        : "default";

  // Detailed variant - full status bar
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg border",
        variants[currentVariant],
        className,
      )}
    >
      {/* Status icon */}
      <div className="flex items-center gap-2">
        {online ? (
          <Wifi className="h-4 w-4 text-green-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">
          {online ? "Verbunden" : "Offline"}
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border" />

      {/* Sync status */}
      <div className="flex items-center gap-4 flex-1">
        {stats.syncing > 0 || isSyncing ? (
          <div className="flex items-center gap-1.5 text-sm">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Synchronisiere...</span>
          </div>
        ) : isSynced ? (
          <div className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Synchronisiert</span>
          </div>
        ) : hasPending ? (
          <div className="flex items-center gap-1.5 text-sm text-yellow-600">
            <Clock className="h-3.5 w-3.5" />
            <span>{stats.pending} ausstehend</span>
          </div>
        ) : hasErrors ? (
          <div className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{stats.errors + stats.conflicts} Fehler</span>
          </div>
        ) : null}
      </div>

      {/* Last sync time */}
      <span className="text-xs text-muted-foreground">
        {formatLastSync(stats.lastSyncAt)}
      </span>

      {/* Sync button */}
      {online && onSync && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7"
          onClick={handleSync}
          disabled={isSyncing || stats.syncing > 0}
        >
          <RefreshCw
            className={cn(
              "h-3.5 w-3.5",
              (isSyncing || stats.syncing > 0) && "animate-spin",
            )}
          />
        </Button>
      )}
    </div>
  );
}

export default SyncStatusIndicator;
