import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { offlineSync } from "@/services/offlineSyncService";

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  sync: () => Promise<void>;
  lastSyncTime: Date | null;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      console.log("🌐 Back online - syncing...");
      sync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log("📴 Gone offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load initial pending count
    loadPendingCount();

    // Update pending count every 5 seconds
    const interval = setInterval(loadPendingCount, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const loadPendingCount = async () => {
    const status = await offlineSync.getStatus();
    setPendingCount(status.queueLength);
  };

  const sync = async () => {
    if (!isOnline || isSyncing) return;

    try {
      setIsSyncing(true);
      await offlineSync.syncNow();
      setLastSyncTime(new Date());
      await loadPendingCount();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingCount,
        sync,
        lastSyncTime,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline must be used within OfflineProvider");
  }
  return context;
};
