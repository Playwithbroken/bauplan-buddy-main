import React, { useState, useEffect } from "react";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppStorage } from "@/hooks/useAppStorage";
import { useToast } from "@/hooks/use-toast";
import SyncStatusWidget from "@/components/SyncStatusWidget";
import {
  Database,
  Download,
  Upload,
  Trash2,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Cloud,
  FolderOpen
} from "lucide-react";
import { cloudStorageService } from "@/services/cloudStorageService";
import { CloudStorageAuthState, CloudProvider } from "@/types/cloudStorage";
import DesktopUpdaterPanel from "@/components/settings/DesktopUpdaterPanel";

const SettingsStoragePage: React.FC = () => {
  const { toast } = useToast();
  const { storageStats, exportData, importData, clearAllData } =
    useAppStorage();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Cloud Storage States
  const [googleDriveStatus, setGoogleDriveStatus] = useState<CloudStorageAuthState | null>(null);
  const [oneDriveStatus, setOneDriveStatus] = useState<CloudStorageAuthState | null>(null);
  const [dropboxStatus, setDropboxStatus] = useState<CloudStorageAuthState | null>(null);

  useEffect(() => {
    const fetchCloudStatuses = async () => {
      setGoogleDriveStatus(await cloudStorageService.getConnectionStatus('google_drive'));
      setOneDriveStatus(await cloudStorageService.getConnectionStatus('onedrive'));
      setDropboxStatus(await cloudStorageService.getConnectionStatus('dropbox'));
    };
    fetchCloudStatuses();
  }, []);

  const handleCloudConnect = (provider: CloudProvider) => {
    try {
      cloudStorageService.connect(provider);
    } catch (error: unknown) {
      toast({
        title: "Fehlende Konfiguration",
        description:
          error instanceof Error
            ? error.message
            : "Verbindung konnte nicht vorbereitet werden.",
        variant: "destructive"
      });
    }
  };

  const handleCloudDisconnect = async (provider: CloudProvider) => {
    try {
      await cloudStorageService.disconnect(provider);
      toast({
        title: "Getrennt",
        description: "Die Cloud-Verbindung wurde erfolgreich getrennt.",
      });
      // Refresh local state immediately
      if (provider === 'google_drive') setGoogleDriveStatus({ provider, isConnected: false });
      if (provider === 'onedrive') setOneDriveStatus({ provider, isConnected: false });
      if (provider === 'dropbox') setDropboxStatus({ provider, isConnected: false });
    } catch (error) {
      toast({
        title: "Fehler beim Trennen",
        description: "Die Verbindung konnte nicht beendet werden.",
        variant: "destructive"
      });
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const jsonData = await exportData();
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bauplan-buddy-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export erfolgreich",
        description:
          "Alle Daten (inkl. Offline-Datenbank) wurden erfolgreich exportiert.",
      });
    } catch (error) {
      toast({
        title: "Export fehlgeschlagen",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setIsImporting(true);
        const text = await file.text();
        const success = await importData(text);

        if (success) {
          toast({
            title: "Import erfolgreich",
            description: "Alle Daten wurden erfolgreich importiert.",
          });
          // Reload page to apply changes
          setTimeout(() => window.location.reload(), 1000);
        } else {
          throw new Error("Import fehlgeschlagen");
        }
      } catch (error) {
        toast({
          title: "Import fehlgeschlagen",
          description:
            error instanceof Error ? error.message : "Ungültige Datei",
          variant: "destructive",
        });
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  const handleClearAll = () => {
    if (
      !window.confirm(
        "Möchten Sie wirklich ALLE Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden!"
      )
    ) {
      return;
    }

    try {
      setIsClearing(true);
      clearAllData();
      toast({
        title: "Daten gelöscht",
        description: "Alle lokalen Daten wurden erfolgreich gelöscht.",
      });
      // Reload page
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({
        title: "Fehler",
        description:
          error instanceof Error ? error.message : "Löschen fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const getStorageStatus = () => {
    if (storageStats.percentage > 80) {
      return { color: "destructive", icon: AlertTriangle, message: "Kritisch" };
    } else if (storageStats.percentage > 60) {
      return { color: "default", icon: Info, message: "Warnung" };
    } else {
      return { color: "default", icon: CheckCircle, message: "Normal" };
    }
  };

  const status = getStorageStatus();
  const StatusIcon = status.icon;

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Einstellungen" },
        { label: "Speicher" },
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-muted-foreground">
            Verwalten Sie Ihre lokalen Daten, erstellen Sie Backups und
            überwachen Sie die Synchronisation
          </p>
        </div>

        {/* Sync Status Widget */}
        <div className="mb-8">
          <SyncStatusWidget />
        </div>

        {/* Storage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Speichernutzung
              </CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBytes(storageStats.used)}
              </div>
              <p className="text-xs text-muted-foreground">
                von {formatBytes(storageStats.available)}
              </p>
              <Progress value={storageStats.percentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gespeicherte Elemente
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {storageStats.items.length}
              </div>
              <p className="text-xs text-muted-foreground">
                LocalStorage Einträge
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <StatusIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.message}</div>
              <p className="text-xs text-muted-foreground">
                {storageStats.percentage.toFixed(1)}% ausgelastet
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bring Your Own Cloud Integration */}
        <Card className="mb-8 overflow-hidden border-sidebar-border shadow-layered-md">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-primary"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-primary" />
              Bring Your Own Cloud
            </CardTitle>
            <CardDescription>
              Verbinden Sie Ihren eigenen Cloud-Speicher für Dokumente und Rechnungen. 
              Dies spart Speicherplatz in unserer Datenbank und gibt Ihnen 100% Kontrolle über Ihre Dateien.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Google Drive */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.341 12H21.5L15.341 1.33203L12.261 6.66603L18.419 17.334H21.5L15.341 12Z" fill="#4285F4"/>
                    <path d="M8.65997 12L2.49997 12L8.65997 22.668L11.74 17.334L5.58097 6.66602H2.49997L8.65997 12Z" fill="#34A853"/>
                    <path d="M11.74 17.334L14.82 22.668H21.5L18.42 17.334H11.74Z" fill="#FBBC04"/>
                    <path d="M5.58097 6.66602L8.66097 1.33203H2.49997L5.58097 6.66602Z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Google Drive</h4>
                  <p className="text-xs text-muted-foreground">
                    {googleDriveStatus?.isConnected ? `Verbunden ${googleDriveStatus.email ? `(${googleDriveStatus.email})` : ''}` : 'Nicht verbunden'}
                  </p>
                </div>
              </div>
              <Button 
                variant={googleDriveStatus?.isConnected ? "destructive" : "outline"} 
                size="sm" 
                onClick={() => googleDriveStatus?.isConnected ? handleCloudDisconnect('google_drive') : handleCloudConnect('google_drive')}
              >
                {googleDriveStatus?.isConnected ? "Trennen" : "Verbinden"}
              </Button>
            </div>

            {/* Microsoft OneDrive */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.4 10.4C11.4 9.15 12.05 8 13.05 7.45L8.4 2L2 9.15V19.9H11.4V10.4Z" fill="#0078D4"/>
                    <path d="M22 10.4C22 7.75 19.8 5.6 17.15 5.6C16.9 5.6 16.6 5.6 16.35 5.65C15.6 3.15 13.3 1.35 10.65 1.35C7.9 1.35 5.55 3.25 4.95 5.85C4.7 5.8 4.45 5.75 4.2 5.75C1.9 5.75 0 7.65 0 9.95C0 12.25 1.9 14.15 4.2 14.15H17.15C19.8 14.15 22 12.05 22 9.4V10.4Z" fill="#0078D4"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Microsoft OneDrive</h4>
                  <p className="text-xs text-muted-foreground">
                    {oneDriveStatus?.isConnected ? `Verbunden ${oneDriveStatus.email ? `(${oneDriveStatus.email})` : ''}` : 'Nicht verbunden'}
                  </p>
                </div>
              </div>
              <Button 
                variant={oneDriveStatus?.isConnected ? "destructive" : "outline"} 
                size="sm" 
                onClick={() => oneDriveStatus?.isConnected ? handleCloudDisconnect('onedrive') : handleCloudConnect('onedrive')}
              >
                {oneDriveStatus?.isConnected ? "Trennen" : "Verbinden"}
              </Button>
            </div>

            {/* Dropbox */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 1.5L0 6L7 10.5L14 6L7 1.5Z" fill="#0061FE"/>
                    <path d="M7 19.5L0 15L7 10.5L14 15L7 19.5Z" fill="#0061FE"/>
                    <path d="M24 6L17 1.5L10 6L17 10.5L24 6Z" fill="#0061FE"/>
                    <path d="M17 19.5L10 15L17 10.5L24 15L17 19.5Z" fill="#0061FE"/>
                    <path d="M17 21L12 24L7 21V16.5L12 19.5L17 16.5V21Z" fill="#0061FE"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Dropbox</h4>
                  <p className="text-xs text-muted-foreground">
                    {dropboxStatus?.isConnected ? `Verbunden ${dropboxStatus.email ? `(${dropboxStatus.email})` : ''}` : 'Nicht verbunden'}
                  </p>
                </div>
              </div>
              <Button 
                variant={dropboxStatus?.isConnected ? "destructive" : "outline"} 
                size="sm" 
                onClick={() => dropboxStatus?.isConnected ? handleCloudDisconnect('dropbox') : handleCloudConnect('dropbox')}
              >
                {dropboxStatus?.isConnected ? "Trennen" : "Verbinden"}
              </Button>
            </div>

          </CardContent>
        </Card>

        <DesktopUpdaterPanel className="mb-8" />

        {/* Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Aktionen</CardTitle>
            <CardDescription>
              Sichern, Wiederherstellen oder Löschen Ihrer Daten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full"
                variant="outline"
              >
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Daten exportieren
              </Button>

              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="w-full"
                variant="outline"
              >
                {isImporting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Daten importieren
              </Button>

              <Button
                onClick={handleClearAll}
                disabled={isClearing}
                className="w-full"
                variant="destructive"
              >
                {isClearing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Alle Daten löschen
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Hinweis</p>
                  <p className="text-muted-foreground">
                    Alle Daten werden lokal in Ihrem Browser gespeichert.
                    Erstellen Sie regelmäßig Backups, um Datenverlust zu
                    vermeiden. Die exportierte JSON-Datei enthält alle Angebote,
                    Projekte, Termine, Rechnungen und Einstellungen.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Details */}
        <Card>
          <CardHeader>
            <CardTitle>Speicherdetails</CardTitle>
            <CardDescription>
              Übersicht über die größten Speicherverbraucher
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {storageStats.items.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.key}</div>
                    <div className="flex items-center space-x-2">
                      <Progress
                        value={(item.size / storageStats.used) * 100}
                        className="w-32 h-2"
                      />
                      <span className="text-xs text-muted-foreground">
                        {((item.size / storageStats.used) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline">{formatBytes(item.size)}</Badge>
                </div>
              ))}
              {storageStats.items.length > 10 && (
                <div className="text-sm text-muted-foreground text-center pt-2">
                  + {storageStats.items.length - 10} weitere Einträge
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutWithSidebar>
  );
};

export default SettingsStoragePage;
