import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Smartphone,
  Monitor,
  Wifi,
  WifiOff,
  X,
  Check,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { offlineSync } from "@/services/offlineSyncService";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallProps {
  onDismiss?: () => void;
}

export function PWAInstallPrompt({ onDismiss }: PWAInstallProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPrompt, setShowPrompt] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);

      const showPromptIfNotDismissed = () => {
        const dismissed = localStorage.getItem("pwa-install-dismissed");
        if (!dismissed) {
          setShowPrompt(true);
        }
      };

      const g = globalThis as unknown as Partial<Record<"MODE", string>>;
      const delay =
        process.env.NODE_ENV === "test" || g.MODE === "test" ? 0 : 10000;

      if (delay === 0) {
        showPromptIfNotDismissed();
      } else {
        setTimeout(showPromptIfNotDismissed, delay);
      }
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      toast({
        title: "App installiert!",
        description:
          "Bauplan Buddy wurde erfolgreich installiert und ist jetzt offline verfuegbar.",
      });
    };

    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        toast({
          title: "Installation gestartet",
          description: "Die App wird installiert...",
        });
      } else {
        toast({
          title: "Installation abgebrochen",
          description:
            "Sie koennen die App jederzeit ueber das Browser-Menue installieren.",
          variant: "destructive",
        });
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error("Installation failed:", error);
      toast({
        title: "Installation fehlgeschlagen",
        description: "Bitte versuchen Sie es spaeter erneut.",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
    onDismiss?.();
  };

  const handleForceSync = async () => {
    try {
      await offlineSync.syncNow();
      toast({
        title: "Synchronisation abgeschlossen",
        description: "Alle ausstehenden Aenderungen wurden synchronisiert.",
      });
    } catch (error) {
      toast({
        title: "Synchronisation fehlgeschlagen",
        description: "Bitte ueberpruefen Sie Ihre Internetverbindung.",
        variant: "destructive",
      });
    }
  };

  if (isInstalled) {
    return <OfflineStatus isOnline={isOnline} onForceSync={handleForceSync} />;
  }

  if (!showPrompt || !isInstallable) {
    return <OfflineStatus isOnline={isOnline} onForceSync={handleForceSync} />;
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-sm">App installieren</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Installieren Sie Bauplan Buddy fuer bessere Performance und
          Offline-Zugriff.
        </p>

        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3 w-3 text-green-600" />
            <span>Offline-Funktionalitaet</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3 w-3 text-green-600" />
            <span>Push-Benachrichtigungen</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3 w-3 text-green-600" />
            <span>Schnellerer Start</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleInstall} size="sm" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Installieren
          </Button>
          <Button variant="outline" size="sm" onClick={handleDismiss}>
            Spaeter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface OfflineStatusProps {
  isOnline: boolean;
  onForceSync: () => void;
}

function OfflineStatus({ isOnline, onForceSync }: OfflineStatusProps) {
  const [offlineState, setOfflineState] = useState(
    offlineSync.getOfflineState()
  );
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineSync.addStateListener(setOfflineState);
    return unsubscribe;
  }, []);

  if (isOnline && offlineState.pendingActions.length === 0) {
    return null; // Don't show anything when online and no pending actions
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="font-medium text-sm">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>

          {offlineState.pendingActions.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {offlineState.pendingActions.length} ausstehend
            </Badge>
          )}
        </div>

        {!isOnline && (
          <p className="text-xs text-muted-foreground mb-3">
            Aenderungen werden synchronisiert, sobald Sie wieder online sind.
          </p>
        )}

        {offlineState.pendingActions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Ausstehende Aktionen: {offlineState.pendingActions.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="h-6 text-xs"
              >
                {showDetails ? "Ausblenden" : "Details"}
              </Button>
            </div>

            {showDetails && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {offlineState.pendingActions.slice(0, 5).map((action) => (
                  <div key={action.id} className="text-xs p-2 bg-muted rounded">
                    <div className="flex justify-between">
                      <span>
                        <span className="font-medium capitalize">
                          {action.type}
                        </span>{" "}
                        <span className="capitalize">{action.entity}</span>
                      </span>
                      <Badge
                        variant={
                          action.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {action.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {offlineState.pendingActions.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{offlineState.pendingActions.length - 5} weitere
                  </div>
                )}
              </div>
            )}

            {isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={onForceSync}
                disabled={offlineState.isSyncing}
                className="w-full text-xs"
              >
                {offlineState.isSyncing ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                    Synchronisiert...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Jetzt synchronisieren
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {offlineState.lastSync && (
          <div className="mt-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              Letzte Synchronisation:{" "}
              {new Date(offlineState.lastSync).toLocaleString("de-DE")}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PWAInstallPrompt;
