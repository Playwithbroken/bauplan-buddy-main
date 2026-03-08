import React, { useEffect, useState } from "react";
import { Wrench, AlertTriangle } from "lucide-react";
import { resourceService } from "@/services/ResourceService";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const MaintenanceAlertBadge: React.FC = () => {
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    const checkMaintenance = () => {
      const upcoming = resourceService.getUpcomingMaintenance(30);
      setUpcomingCount(upcoming.length);

      const now = new Date();
      const overdue = upcoming.filter(
        (eq) => eq.nextMaintenanceDate && new Date(eq.nextMaintenanceDate) < now
      );
      setOverdueCount(overdue.length);
    };

    checkMaintenance();
    // Refresh periodically
    const interval = setInterval(checkMaintenance, 60000 * 30); // 30 mins
    return () => clearInterval(interval);
  }, []);

  if (upcomingCount === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative cursor-help">
            <Wrench
              className={cn(
                "h-5 w-5 transition-colors",
                overdueCount > 0
                  ? "text-red-500 animate-pulse"
                  : "text-amber-500"
              )}
            />
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] border-2 border-white"
            >
              {upcomingCount}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p className="font-bold">Wartungs-Hinweis</p>
            {overdueCount > 0 && (
              <p className="text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {overdueCount} Geräte
                überfällig!
              </p>
            )}
            <p>{upcomingCount} Geräte in den nächsten 30 Tagen fällig.</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
