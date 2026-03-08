/**
 * Presence Indicator Component
 * Shows who's currently viewing a specific page/project with real-time updates
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Eye, Users } from "lucide-react";

export interface PresenceUser {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
  status: "viewing" | "editing" | "idle";
  lastActivity: Date;
  cursor?: { x: number; y: number };
}

interface PresenceIndicatorProps {
  /** Unique context identifier (e.g., project ID, document ID) */
  contextId: string;
  /** Type of context */
  contextType: "project" | "document" | "calendar" | "chat";
  /** Current user ID (excluded from display) */
  currentUserId?: string;
  /** Maximum avatars to show before +N */
  maxVisible?: number;
  /** Show detailed tooltip */
  showTooltip?: boolean;
  /** Variant style */
  variant?: "compact" | "full" | "minimal";
  /** Custom class name */
  className?: string;
}

// Generate consistent colors for users
const getUserColor = (userId: string): string => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

// Status indicator component
const StatusDot = ({ status }: { status: PresenceUser["status"] }) => {
  const statusStyles = {
    viewing: "bg-green-500",
    editing: "bg-blue-500 animate-pulse",
    idle: "bg-yellow-500",
  };

  return (
    <div
      className={cn(
        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
        statusStyles[status]
      )}
    />
  );
};

// Status label for tooltip
const StatusLabel = ({ status }: { status: PresenceUser["status"] }) => {
  const labels = {
    viewing: "Aktiv",
    editing: "Bearbeitet",
    idle: "Inaktiv",
  };

  const styles = {
    viewing:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    editing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    idle: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  };

  return (
    <Badge variant="outline" className={cn("text-xs", styles[status])}>
      {labels[status]}
    </Badge>
  );
};

export function PresenceIndicator({
  contextId,
  contextType,
  currentUserId,
  maxVisible = 4,
  showTooltip = true,
  variant = "compact",
  className,
}: PresenceIndicatorProps) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Simulated presence data - in production, this would come from WebSocket
  useEffect(() => {
    // Simulate some users viewing
    const mockUsers: PresenceUser[] = [
      {
        id: "user-1",
        name: "Max Mustermann",
        status: "viewing" as const,
        lastActivity: new Date(),
        color: getUserColor("user-1"),
      },
      {
        id: "user-2",
        name: "Anna Schmidt",
        status: "editing" as const,
        lastActivity: new Date(Date.now() - 30000),
        color: getUserColor("user-2"),
      },
      {
        id: "user-3",
        name: "Peter Weber",
        status: "idle" as const,
        lastActivity: new Date(Date.now() - 120000),
        color: getUserColor("user-3"),
      },
    ].filter((u) => u.id !== currentUserId);

    setUsers(mockUsers);
    setIsConnected(true);

    // In production: Subscribe to WebSocket presence channel
    // const unsubscribe = websocketService.on('presence_update', (msg) => {
    //   if (msg.data.contextId === contextId) {
    //     setUsers(prev => updatePresenceList(prev, msg.data));
    //   }
    // });
    //
    // websocketService.send('presence_join', { contextId, contextType });
    //
    // return () => {
    //   websocketService.send('presence_leave', { contextId });
    //   unsubscribe();
    // };
  }, [contextId, contextType, currentUserId]);

  // Broadcast our presence (heartbeat)
  useEffect(() => {
    if (!isConnected) return;

    const heartbeat = setInterval(() => {
      // websocketService.send('presence_heartbeat', { contextId, status: 'viewing' });
    }, 30000);

    return () => clearInterval(heartbeat);
  }, [contextId, isConnected]);

  // Update status based on activity
  const updateStatus = useCallback(
    (status: PresenceUser["status"]) => {
      // websocketService.send('presence_update', { contextId, status });
    },
    [contextId]
  );

  // Filter out current user and sort by activity
  const visibleUsers = users
    .filter((u) => u.id !== currentUserId)
    .sort((a, b) => {
      // Active users first
      const statusOrder = { editing: 0, viewing: 1, idle: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

  if (visibleUsers.length === 0) {
    return null;
  }

  // Minimal variant - just a count badge
  if (variant === "minimal") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className={cn("gap-1 cursor-default", className)}
            >
              <Eye className="h-3 w-3" />
              {visibleUsers.length}
            </Badge>
          </TooltipTrigger>
          {showTooltip && (
            <TooltipContent side="bottom">
              <p className="font-medium">
                {visibleUsers.length}{" "}
                {visibleUsers.length === 1 ? "Person" : "Personen"} online
              </p>
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {visibleUsers.slice(0, 5).map((user) => (
                  <li key={user.id}>{user.name}</li>
                ))}
                {visibleUsers.length > 5 && (
                  <li>+{visibleUsers.length - 5} weitere</li>
                )}
              </ul>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Compact and Full variants - avatar stack
  const displayUsers = visibleUsers.slice(0, maxVisible);
  const remainingCount = Math.max(0, visibleUsers.length - maxVisible);

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        {variant === "full" && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{visibleUsers.length} online</span>
          </div>
        )}

        <div className="flex -space-x-2">
          {displayUsers.map((user, index) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <div
                  className="relative"
                  style={{ zIndex: displayUsers.length - index }}
                >
                  <Avatar
                    className={cn(
                      "h-8 w-8 border-2 border-background transition-transform hover:scale-110 hover:z-10",
                      user.status === "editing" &&
                        "ring-2 ring-blue-500 ring-offset-1"
                    )}
                  >
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback
                      className={cn(
                        "text-xs text-white",
                        user.color || getUserColor(user.id)
                      )}
                    >
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <StatusDot status={user.status} />
                </div>
              </TooltipTrigger>
              {showTooltip && (
                <TooltipContent side="bottom" className="text-center">
                  <p className="font-medium">{user.name}</p>
                  <StatusLabel status={user.status} />
                  {user.status === "idle" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Zuletzt aktiv vor{" "}
                      {Math.round(
                        (Date.now() - user.lastActivity.getTime()) / 60000
                      )}{" "}
                      Min.
                    </p>
                  )}
                </TooltipContent>
              )}
            </Tooltip>
          ))}

          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium cursor-default">
                  +{remainingCount}
                </div>
              </TooltipTrigger>
              {showTooltip && (
                <TooltipContent side="bottom">
                  <p className="font-medium">+{remainingCount} weitere</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {visibleUsers
                      .slice(maxVisible, maxVisible + 5)
                      .map((user) => (
                        <li key={user.id}>{user.name}</li>
                      ))}
                    {remainingCount > 5 && (
                      <li>und {remainingCount - 5} mehr...</li>
                    )}
                  </ul>
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export default PresenceIndicator;
