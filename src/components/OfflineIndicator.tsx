import React from "react";
import { useOffline } from "@/contexts/OfflineContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cloud, CloudOff, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className,
}) => {
  const { isOnline, isSyncing, pendingCount, sync, lastSyncTime } =
    useOffline();

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null; // Hide when everything is synced
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-4 py-2 shadow-lg",
          "backdrop-blur-sm border",
          isOnline
            ? "bg-background/95 border-border"
            : "bg-destructive/95 border-destructive text-destructive-foreground"
        )}
      >
        {/* Status Icon */}
        {isOnline ? (
          isSyncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Cloud className="h-4 w-4" />
          )
        ) : (
          <CloudOff className="h-4 w-4" />
        )}

        {/* Status Text */}
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {isOnline ? (isSyncing ? "Syncing..." : "Online") : "Offline Mode"}
          </span>
          {lastSyncTime && isOnline && !isSyncing && (
            <span className="text-xs opacity-70">
              Last sync: {lastSyncTime.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Pending Count Badge */}
        {pendingCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {pendingCount} pending
          </Badge>
        )}

        {/* Sync Button */}
        {isOnline && !isSyncing && pendingCount > 0 && (
          <Button size="sm" variant="ghost" onClick={sync} className="ml-2">
            <RefreshCw className="h-3 w-3 mr-1" />
            Sync Now
          </Button>
        )}

        {/* Success Indicator */}
        {isOnline && !isSyncing && pendingCount === 0 && lastSyncTime && (
          <Check className="h-4 w-4 text-green-500 ml-2" />
        )}
      </div>
    </div>
  );
};
