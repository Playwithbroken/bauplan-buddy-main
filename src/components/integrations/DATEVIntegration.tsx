import React, { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Check, X, Settings, Upload, Download } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { useToast } from "@/hooks/use-toast";

interface DATEVStatus {
  connected: boolean;
  lastSync?: Date;
  accountingYear?: number;
}

export const DATEVIntegration: React.FC = () => {
  const [status, setStatus] = useState<DATEVStatus>({ connected: false });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const { toast } = useToast();

  // Configuration form
  const [config, setConfig] = useState({
    clientId: "",
    clientSecret: "",
    consultantNumber: "",
    clientNumber: "",
  });

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/datev/status");
      setStatus(response.data);
    } catch (error) {
      console.error("Failed to load DATEV status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = async () => {
    try {
      setLoading(true);
      await apiClient.post("/datev/configure", config);

      toast({
        title: "Success",
        description: "DATEV configured successfully",
      });

      setShowConfig(false);
      await loadStatus();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to configure DATEV",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (
    type: "all" | "invoices" | "transactions" | "contacts"
  ) => {
    try {
      setSyncing(true);

      let endpoint = "/datev/sync";
      if (type !== "all") {
        endpoint = `/datev/sync/${type}`;
      }

      const response = await apiClient.post(endpoint);

      toast({
        title: "Sync Complete",
        description: `Successfully synced ${type}`,
      });

      await loadStatus();
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync with DATEV",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect DATEV?")) return;

    try {
      await apiClient.delete("/datev/configure");

      toast({
        title: "Disconnected",
        description: "DATEV integration disabled",
      });

      setStatus({ connected: false });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect DATEV",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                DATEV Integration
                {status.connected ? (
                  <Badge variant="default" className="bg-green-500">
                    <Check className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <X className="h-3 w-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Automatic accounting integration with DATEV
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadStatus}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.connected && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Last Sync
                  </Label>
                  <p className="text-sm font-medium">
                    {status.lastSync
                      ? new Date(status.lastSync).toLocaleString()
                      : "Never"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Accounting Year
                  </Label>
                  <p className="text-sm font-medium">
                    {status.accountingYear || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={autoSync} onCheckedChange={setAutoSync} />
                  <Label>Auto-Sync (Daily)</Label>
                </div>
              </div>
            </>
          )}

          {!status.connected && (
            <Alert>
              <AlertDescription>
                Connect your DATEV account to automatically sync invoices,
                transactions, and contacts.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configuration Card */}
      {(!status.connected || showConfig) && (
        <Card>
          <CardHeader>
            <CardTitle>DATEV Configuration</CardTitle>
            <CardDescription>Enter your DATEV API credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={config.clientId}
                  onChange={(e) =>
                    setConfig({ ...config, clientId: e.target.value })
                  }
                  placeholder="Enter DATEV Client ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  value={config.clientSecret}
                  onChange={(e) =>
                    setConfig({ ...config, clientSecret: e.target.value })
                  }
                  placeholder="Enter DATEV Client Secret"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consultantNumber">Consultant Number</Label>
                <Input
                  id="consultantNumber"
                  value={config.consultantNumber}
                  onChange={(e) =>
                    setConfig({ ...config, consultantNumber: e.target.value })
                  }
                  placeholder="Enter Consultant Number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientNumber">Client Number</Label>
                <Input
                  id="clientNumber"
                  value={config.clientNumber}
                  onChange={(e) =>
                    setConfig({ ...config, clientNumber: e.target.value })
                  }
                  placeholder="Enter Client Number"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConfigure} disabled={loading}>
                <Settings className="h-4 w-4 mr-2" />
                {status.connected ? "Update Configuration" : "Connect DATEV"}
              </Button>
              {showConfig && (
                <Button variant="outline" onClick={() => setShowConfig(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Actions */}
      {status.connected && !showConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Actions</CardTitle>
            <CardDescription>Manually trigger sync operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleSync("all")}
                disabled={syncing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
                />
                Sync All
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSync("invoices")}
                disabled={syncing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Export Invoices
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSync("transactions")}
                disabled={syncing}
              >
                <Download className="h-4 w-4 mr-2" />
                Import Transactions
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSync("contacts")}
                disabled={syncing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Sync Contacts
              </Button>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfig(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Configuration
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className="text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
