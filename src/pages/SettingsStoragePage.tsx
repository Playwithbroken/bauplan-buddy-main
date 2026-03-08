import React, { useState } from "react";
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
} from "lucide-react";

const SettingsStoragePage: React.FC = () => {
  const { toast } = useToast();
  const { storageStats, exportData, importData, clearAllData } =
    useAppStorage();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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
