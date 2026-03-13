import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Bell,
  Download,
  FolderOpen,
  MonitorCog,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface DesktopUpdaterPanelProps {
  className?: string;
}

const DesktopUpdaterPanel: React.FC<DesktopUpdaterPanelProps> = ({ className }) => {
  const { toast } = useToast();
  const [isCheckingDesktopUpdate, setIsCheckingDesktopUpdate] = useState(false);
  const [desktopUpdateStatus, setDesktopUpdateStatus] = useState("Noch nicht geprueft");
  const [selectedDesktopPath, setSelectedDesktopPath] = useState("");
  const [desktopDownloadProgress, setDesktopDownloadProgress] = useState(0);
  const [isDownloadingDesktopUpdate, setIsDownloadingDesktopUpdate] = useState(false);
  const [isInstallingDesktopUpdate, setIsInstallingDesktopUpdate] = useState(false);
  const [desktopUpdateReady, setDesktopUpdateReady] = useState(false);
  const isDesktopApp = Boolean(window.desktop?.isDesktop);

  useEffect(() => {
    if (!window.desktop?.onUpdaterEvent) {
      return;
    }

    return window.desktop.onUpdaterEvent((event) => {
      if (event.type === "checking-for-update") {
        setDesktopUpdateStatus("Suche nach Updates...");
      } else if (event.type === "update-available") {
        setDesktopUpdateReady(false);
        setDesktopUpdateStatus("Update verfuegbar");
      } else if (event.type === "update-not-available") {
        setDesktopUpdateReady(false);
        setIsDownloadingDesktopUpdate(false);
        setDesktopUpdateStatus("Keine Updates gefunden");
      } else if (event.type === "download-progress" && event.progress) {
        setIsDownloadingDesktopUpdate(true);
        setDesktopDownloadProgress(event.progress.percent || 0);
        setDesktopUpdateStatus(
          `Download laeuft: ${Math.round(event.progress.percent || 0)}%`
        );
      } else if (event.type === "update-downloaded") {
        setIsDownloadingDesktopUpdate(false);
        setDesktopUpdateReady(true);
        setDesktopDownloadProgress(100);
        setDesktopUpdateStatus("Update heruntergeladen - bereit zur Installation");
      } else if (event.type === "error") {
        setIsDownloadingDesktopUpdate(false);
        setDesktopUpdateStatus(
          event.message ? `Update-Fehler: ${event.message}` : "Update-Fehler"
        );
      }
    });
  }, []);

  const handleDesktopFilePicker = async () => {
    if (!window.desktop?.openFileDialog) {
      toast({
        title: "Nur in Desktop-App verfuegbar",
        description: "Diese Funktion ist nur in der Electron-App aktiv.",
        variant: "destructive",
      });
      return;
    }

    const result = await window.desktop.openFileDialog(
      [{ name: "PDF Dateien", extensions: ["pdf"] }],
      ["openFile"],
      "Lokale PDF auswaehlen"
    );

    if (result.canceled || result.filePaths.length === 0) {
      return;
    }

    const selectedPath = result.filePaths[0];
    setSelectedDesktopPath(selectedPath);
    toast({
      title: "Datei ausgewaehlt",
      description: selectedPath,
    });
  };

  const handleDesktopUpdateCheck = async () => {
    if (!window.desktop?.checkForUpdates) {
      toast({
        title: "Nur in Desktop-App verfuegbar",
        description: "Update-Checks sind nur in der Electron-App aktiv.",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingDesktopUpdate(true);
    try {
      const result = await window.desktop.checkForUpdates();
      if (!result.ok) {
        if (result.reason === "dev_mode") {
          setDesktopUpdateStatus("Deaktiviert im Entwicklungsmodus");
        } else {
          setDesktopUpdateStatus(
            result.message || "Update-Check konnte nicht ausgefuehrt werden"
          );
        }
        return;
      }

      if (result.updateReadyToInstall) {
        setDesktopUpdateReady(true);
      }
      setDesktopUpdateStatus("Update-Check erfolgreich gestartet");
      toast({
        title: "Update-Check gestartet",
        description: "Desktop-Updater prueft auf neue Versionen.",
      });
    } finally {
      setIsCheckingDesktopUpdate(false);
    }
  };

  const handleDesktopNotificationTest = async () => {
    if (!window.desktop?.notify) {
      toast({
        title: "Nur in Desktop-App verfuegbar",
        description: "Desktop-Benachrichtigungen sind im Browser deaktiviert.",
        variant: "destructive",
      });
      return;
    }

    const result = await window.desktop.notify(
      "Bauplan Buddy",
      "Desktop-Benachrichtigungen sind erfolgreich verbunden."
    );

    if (!result.ok) {
      toast({
        title: "Benachrichtigung fehlgeschlagen",
        description: result.reason || "Nicht unterstuetzt auf diesem System.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Benachrichtigung gesendet",
      description: "Die Test-Benachrichtigung wurde an das Betriebssystem gesendet.",
    });
  };

  const handleDesktopUpdateDownload = async () => {
    if (!window.desktop?.downloadUpdate) {
      toast({
        title: "Nur in Desktop-App verfuegbar",
        description: "Update-Downloads sind nur in der Electron-App aktiv.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloadingDesktopUpdate(true);
    setDesktopDownloadProgress(0);
    setDesktopUpdateStatus("Download wird gestartet...");

    try {
      const result = await window.desktop.downloadUpdate();
      if (!result.ok) {
        setDesktopUpdateStatus(result.message || "Update-Download fehlgeschlagen");
        toast({
          title: "Download fehlgeschlagen",
          description: result.message || result.reason || "Unbekannter Fehler",
          variant: "destructive",
        });
      }
    } finally {
      setIsDownloadingDesktopUpdate(false);
    }
  };

  const handleDesktopUpdateInstall = async () => {
    if (!window.desktop?.installUpdate) {
      toast({
        title: "Nur in Desktop-App verfuegbar",
        description: "Update-Installation ist nur in der Electron-App aktiv.",
        variant: "destructive",
      });
      return;
    }

    setIsInstallingDesktopUpdate(true);
    try {
      const result = await window.desktop.installUpdate();
      if (!result.ok) {
        toast({
          title: "Installation nicht moeglich",
          description:
            result.reason === "no_downloaded_update"
              ? "Bitte zuerst das Update herunterladen."
              : result.message || result.reason || "Unbekannter Fehler",
          variant: "destructive",
        });
        setIsInstallingDesktopUpdate(false);
        return;
      }

      setDesktopUpdateStatus("Installation wird gestartet, App startet neu...");
    } catch (error) {
      setIsInstallingDesktopUpdate(false);
      toast({
        title: "Installation fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MonitorCog className="h-5 w-5 text-primary" />
          Desktop Einstellungen
        </CardTitle>
        <CardDescription>
          Native Electron-Funktionen fuer Dateiauswahl, Updates und OS-Benachrichtigungen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
          <div>
            <p className="font-medium">App-Modus</p>
            <p className="text-xs text-muted-foreground">
              {isDesktopApp ? "Electron Desktop erkannt" : "Browser-Modus erkannt"}
            </p>
          </div>
          <Badge variant={isDesktopApp ? "default" : "secondary"}>
            {isDesktopApp ? "Desktop aktiv" : "Web aktiv"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={handleDesktopFilePicker}
            disabled={!isDesktopApp}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            PDF lokal waehlen
          </Button>
          <Button
            variant="outline"
            onClick={handleDesktopUpdateCheck}
            disabled={!isDesktopApp || isCheckingDesktopUpdate}
          >
            {isCheckingDesktopUpdate ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Updater pruefen
          </Button>
          <Button
            variant="outline"
            onClick={handleDesktopNotificationTest}
            disabled={!isDesktopApp}
          >
            <Bell className="h-4 w-4 mr-2" />
            Test-Benachrichtigung
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={handleDesktopUpdateDownload}
            disabled={!isDesktopApp || isDownloadingDesktopUpdate}
          >
            {isDownloadingDesktopUpdate ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Update herunterladen
          </Button>
          <Button
            onClick={handleDesktopUpdateInstall}
            disabled={!isDesktopApp || !desktopUpdateReady || isInstallingDesktopUpdate}
          >
            {isInstallingDesktopUpdate ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Jetzt installieren
          </Button>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium">Updater Status</p>
          <p className="text-muted-foreground">{desktopUpdateStatus}</p>
          {isDownloadingDesktopUpdate && (
            <p className="text-xs text-muted-foreground">
              Download-Fortschritt: {Math.round(desktopDownloadProgress)}%
            </p>
          )}
          {desktopUpdateReady && (
            <Badge variant="default">Installationsbereit</Badge>
          )}
          {selectedDesktopPath && (
            <p className="text-xs text-muted-foreground break-all">
              Ausgewaehlte Datei: {selectedDesktopPath}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DesktopUpdaterPanel;
