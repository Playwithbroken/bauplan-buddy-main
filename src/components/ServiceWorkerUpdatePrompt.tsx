import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { offlineSync } from "@/services/offlineSyncService";
import { isDevelopment } from "@/utils/env";

const ServiceWorkerUpdatePrompt: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Subscribe to update notifications
    const unsubscribe = offlineSync.onUpdateAvailable(() => {
      setVisible(true);
    });

    // Also check on mount if a waiting SW already exists
    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) setVisible(true);
      } catch (e) {
        // ignore
        if (isDevelopment()) {
          console.warn("SW registration check failed", e);
        }
      }
    })();

    return unsubscribe;
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-2">
      <div className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 shadow-md">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <span className="text-sm text-blue-900">
          Eine neue Version ist verfügbar.
        </span>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => offlineSync.applyUpdate()}>
            Aktualisieren
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setVisible(false)}>
            Später
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceWorkerUpdatePrompt;
