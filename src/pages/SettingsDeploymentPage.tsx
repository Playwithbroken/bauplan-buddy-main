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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import DeploymentConfigService, {
  DeploymentMode,
  DeploymentConfig,
} from "@/services/deploymentConfigService";
import {
  HardDrive,
  Server,
  Cloud,
  CheckCircle,
  XCircle,
  Zap,
  Shield,
  Globe,
  AlertCircle,
  RefreshCw,
  Settings,
} from "lucide-react";

const SettingsDeploymentPage: React.FC = () => {
  const { toast } = useToast();
  const deploymentService = DeploymentConfigService.getInstance();

  const [config, setConfig] = useState<DeploymentConfig>(
    deploymentService.getConfig()
  );
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    mode: DeploymentMode;
    success: boolean;
    latency?: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const handleConfigChange = (event: CustomEvent<DeploymentConfig>) => {
      setConfig(event.detail);
    };

    window.addEventListener(
      "deploymentConfigChanged",
      handleConfigChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "deploymentConfigChanged",
        handleConfigChange as EventListener
      );
    };
  }, []);

  const handleModeChange = (mode: DeploymentMode) => {
    deploymentService.setDeploymentMode(mode);
    setConfig(deploymentService.getConfig());

    toast({
      title: "Deployment-Modus geändert",
      description: `Umstellung auf ${getModeLabel(mode)} erfolgreich.`,
    });
  };

  const handleTestConnection = async (mode: DeploymentMode) => {
    setIsTesting(true);
    setConnectionStatus(null);

    try {
      const result = await deploymentService.testConnection(mode);
      setConnectionStatus({ mode, ...result });

      if (result.success) {
        toast({
          title: "Verbindung erfolgreich",
          description: result.latency
            ? `Latenz: ${result.latency}ms`
            : "Lokaler Modus funktioniert",
        });
      } else {
        toast({
          title: "Verbindung fehlgeschlagen",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test fehlgeschlagen",
        description:
          error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveLocal = () => {
    deploymentService.configureLocal(config.local);
    toast({
      title: "Einstellungen gespeichert",
      description: "Lokale Einstellungen wurden aktualisiert.",
    });
  };

  const handleSaveSelfHosted = () => {
    deploymentService.configureSelfHosted(config.selfHosted);
    toast({
      title: "Einstellungen gespeichert",
      description: "Self-Hosted Einstellungen wurden aktualisiert.",
    });
  };

  const handleSaveCloud = () => {
    deploymentService.configureCloud(config.cloud);
    toast({
      title: "Einstellungen gespeichert",
      description: "Cloud Einstellungen wurden aktualisiert.",
    });
  };

  const getModeLabel = (mode: DeploymentMode): string => {
    switch (mode) {
      case "local":
        return "Lokal (Browser)";
      case "self-hosted":
        return "Eigener Server";
      case "cloud":
        return "Cloud (SaaS)";
    }
  };

  const getModeIcon = (mode: DeploymentMode) => {
    switch (mode) {
      case "local":
        return HardDrive;
      case "self-hosted":
        return Server;
      case "cloud":
        return Cloud;
    }
  };

  const CurrentModeIcon = getModeIcon(config.mode);

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Einstellungen" },
        { label: "Deployment" },
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-muted-foreground">
            Wählen Sie, wo Ihre Daten gespeichert werden sollen
          </p>
        </div>

        {/* Current Mode */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CurrentModeIcon className="h-6 w-6 text-blue-600" />
                <div>
                  <CardTitle>Aktueller Modus</CardTitle>
                  <CardDescription>{getModeLabel(config.mode)}</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2">
                {getModeLabel(config.mode)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["local", "self-hosted", "cloud"] as DeploymentMode[]).map(
                (mode) => {
                  const Icon = getModeIcon(mode);
                  const isActive = config.mode === mode;

                  return (
                    <Card
                      key={mode}
                      className={`cursor-pointer transition-all ${
                        isActive
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                          : "hover:border-blue-400"
                      }`}
                      onClick={() => handleModeChange(mode)}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                          <Icon
                            className={`h-12 w-12 ${
                              isActive
                                ? "text-blue-600"
                                : "text-muted-foreground"
                            }`}
                          />
                          <h3 className="font-semibold">
                            {getModeLabel(mode)}
                          </h3>
                          {isActive && (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aktiv
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>

        {/* Local Mode Settings */}
        {config.mode === "local" && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <HardDrive className="h-5 w-5" />
                <CardTitle>Lokale Einstellungen</CardTitle>
              </div>
              <CardDescription>
                Daten werden ausschließlich im Browser gespeichert
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatische Backups</Label>
                  <p className="text-sm text-muted-foreground">
                    Erstellt automatisch Backups beim Schließen
                  </p>
                </div>
                <Switch
                  checked={config.local.autoBackup}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      local: { ...config.local, autoBackup: checked },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Maximaler Speicher (MB)</Label>
                <Input
                  type="number"
                  value={config.local.maxStorageMB}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      local: {
                        ...config.local,
                        maxStorageMB: parseInt(e.target.value),
                      },
                    })
                  }
                  min={10}
                  max={500}
                />
                <p className="text-sm text-muted-foreground">
                  Empfohlen: 50-100 MB für normale Nutzung
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Vorteile</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Keine Serverkosten</li>
                      <li>Maximale Privatsphäre</li>
                      <li>Sofortiger Zugriff</li>
                      <li>Offline-fähig</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveLocal}>
                <Settings className="h-4 w-4 mr-2" />
                Einstellungen speichern
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Self-Hosted Settings */}
        {config.mode === "self-hosted" && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <CardTitle>Self-Hosted Einstellungen</CardTitle>
              </div>
              <CardDescription>
                Verbindung zu Ihrem eigenen Server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API URL *</Label>
                <Input
                  type="url"
                  placeholder="https://api.ihre-domain.de"
                  value={config.selfHosted.apiUrl}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      selfHosted: {
                        ...config.selfHosted,
                        apiUrl: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Auth Token (optional)</Label>
                <Input
                  type="password"
                  placeholder="Bearer Token für Authentifizierung"
                  value={config.selfHosted.authToken || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      selfHosted: {
                        ...config.selfHosted,
                        authToken: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Sync-Intervall (Minuten)</Label>
                <Input
                  type="number"
                  value={config.selfHosted.syncInterval}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      selfHosted: {
                        ...config.selfHosted,
                        syncInterval: parseInt(e.target.value),
                      },
                    })
                  }
                  min={1}
                  max={60}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Offline-Fallback</Label>
                  <p className="text-sm text-muted-foreground">
                    Bei Verbindungsverlust lokal weiterarbeiten
                  </p>
                </div>
                <Switch
                  checked={config.selfHosted.offlineFallback}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      selfHosted: {
                        ...config.selfHosted,
                        offlineFallback: checked,
                      },
                    })
                  }
                />
              </div>

              {connectionStatus?.mode === "self-hosted" && (
                <div
                  className={`p-4 rounded-lg ${
                    connectionStatus.success
                      ? "bg-green-50 dark:bg-green-950"
                      : "bg-red-50 dark:bg-red-950"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {connectionStatus.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div className="text-sm">
                      <p className="font-medium">
                        {connectionStatus.success
                          ? "Verbunden"
                          : "Verbindung fehlgeschlagen"}
                      </p>
                      {connectionStatus.latency && (
                        <p className="text-muted-foreground">
                          Latenz: {connectionStatus.latency}ms
                        </p>
                      )}
                      {connectionStatus.error && (
                        <p className="text-red-600">{connectionStatus.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button onClick={handleSaveSelfHosted}>
                  <Settings className="h-4 w-4 mr-2" />
                  Einstellungen speichern
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTestConnection("self-hosted")}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Verbindung testen
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cloud Settings */}
        {config.mode === "cloud" && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Cloud className="h-5 w-5" />
                <CardTitle>Cloud Einstellungen</CardTitle>
              </div>
              <CardDescription>SaaS-Hosting in der Cloud</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cloud Provider</Label>
                <Select
                  value={config.cloud.provider}
                  onValueChange={(value: "aws" | "azure" | "gcp" | "custom") =>
                    setConfig({
                      ...config,
                      cloud: { ...config.cloud, provider: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aws">
                      Amazon Web Services (AWS)
                    </SelectItem>
                    <SelectItem value="azure">Microsoft Azure</SelectItem>
                    <SelectItem value="gcp">Google Cloud Platform</SelectItem>
                    <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Region</Label>
                <Select
                  value={config.cloud.region}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      cloud: { ...config.cloud, region: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eu-central-1">EU (Frankfurt)</SelectItem>
                    <SelectItem value="eu-west-1">EU (Irland)</SelectItem>
                    <SelectItem value="us-east-1">
                      US East (Virginia)
                    </SelectItem>
                    <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>API URL *</Label>
                <Input
                  type="url"
                  placeholder="https://api.bauplan-cloud.com"
                  value={config.cloud.apiUrl}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      cloud: { ...config.cloud, apiUrl: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Tenant ID (optional)</Label>
                <Input
                  placeholder="Ihre Tenant/Organisations-ID"
                  value={config.cloud.tenantId || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      cloud: { ...config.cloud, tenantId: e.target.value },
                    })
                  }
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Hinweis</p>
                    <p className="text-muted-foreground">
                      Cloud-Modus erfordert eine aktive Internetverbindung.
                      Offline-Arbeit ist in diesem Modus nicht möglich.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSaveCloud}>
                  <Settings className="h-4 w-4 mr-2" />
                  Einstellungen speichern
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTestConnection("cloud")}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Verbindung testen
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Feature-Vergleich</CardTitle>
            <CardDescription>
              Unterschiede zwischen den Deployment-Modi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Feature</th>
                    <th className="text-center py-2">Lokal</th>
                    <th className="text-center py-2">Self-Hosted</th>
                    <th className="text-center py-2">Cloud</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3">Offline-Fähig</td>
                    <td className="text-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center">
                      <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Multi-Device Sync</td>
                    <td className="text-center">
                      <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                    </td>
                    <td className="text-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Team-Zusammenarbeit</td>
                    <td className="text-center">
                      <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                    </td>
                    <td className="text-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Automatische Backups</td>
                    <td className="text-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Eigene Infrastruktur</td>
                    <td className="text-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    </td>
                    <td className="text-center">
                      <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3">Setup-Aufwand</td>
                    <td className="text-center">
                      <Badge variant="default">Minimal</Badge>
                    </td>
                    <td className="text-center">
                      <Badge variant="secondary">Mittel</Badge>
                    </td>
                    <td className="text-center">
                      <Badge variant="default">Minimal</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutWithSidebar>
  );
};

export default SettingsDeploymentPage;
