import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Server, 
  Download, 
  Upload, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Cloud
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { configService, migrationService, apiClient } from '@/services/databaseService';
import apiServiceProvider from '@/services/api';

interface MigrationStatus {
  inProgress: boolean;
  progress: number;
  stage: string;
  completed: boolean;
  error?: string;
  results?: {
    users: number;
    projects: number;
    appointments: number;
    documents: number;
  };
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, boolean>;
  timestamp: Date;
}

const DatabaseConfigPage: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [useApi, setUseApi] = useState(configService.shouldUseApi());
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
    inProgress: false,
    progress: 0,
    stage: '',
    completed: false
  });

  // API Configuration
  const [apiConfig, setApiConfig] = useState({
    baseUrl: configService.getApiConfig().baseUrl,
    timeout: configService.getApiConfig().timeout.toString(),
    retries: configService.getApiConfig().retries.toString()
  });

  // Database Configuration (for display purposes)
  const [dbConfig, setDbConfig] = useState({
    host: 'localhost',
    port: '5432',
    database: 'bauplan_buddy',
    username: 'postgres'
  });

  useEffect(() => {
    checkHealthStatus();
  }, [useApi]);

  const checkHealthStatus = async () => {
    try {
      setIsLoading(true);
      const status = await apiServiceProvider.healthCheck();
      setHealthStatus(status);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus({
        status: 'unhealthy',
        services: {
          appointments: false,
          projects: false,
          users: false,
          documents: false
        },
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleApiMode = () => {
    const newValue = !useApi;
    setUseApi(newValue);
    
    // In a real implementation, this would update environment variables
    // For now, we'll show a warning that app restart is required
    toast({
      title: newValue ? 'API-Modus aktiviert' : 'localStorage-Modus aktiviert',
      description: 'Starten Sie die Anwendung neu, damit die Änderungen wirksam werden.',
      variant: 'default'
    });
  };

  const handleMigrateData = async () => {
    try {
      setMigrationStatus({
        inProgress: true,
        progress: 0,
        stage: 'Vorbereitung der Migration...',
        completed: false
      });

      // Simulate migration progress
      const stages = [
        'Daten aus localStorage extrahieren...',
        'Benutzer migrieren...',
        'Projekte migrieren...',
        'Termine migrieren...',
        'Dokumente migrieren...',
        'Migration abschließen...'
      ];

      for (let i = 0; i < stages.length; i++) {
        setMigrationStatus(prev => ({
          ...prev,
          progress: ((i + 1) / stages.length) * 100,
          stage: stages[i]
        }));
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Perform actual migration
      const result = await migrationService.migrateFromLocalStorage();

      if (result.success) {
        setMigrationStatus({
          inProgress: false,
          progress: 100,
          stage: 'Migration abgeschlossen',
          completed: true,
          results: result.migrated
        });

        toast({
          title: 'Migration erfolgreich',
          description: `${result.migrated.users} Benutzer, ${result.migrated.projects} Projekte, ${result.migrated.appointments} Termine und ${result.migrated.documents} Dokumente wurden migriert.`,
          variant: 'default'
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setMigrationStatus({
        inProgress: false,
        progress: 0,
        stage: '',
        completed: false,
        error: error instanceof Error ? error.message : 'Migration fehlgeschlagen'
      });

      toast({
        title: 'Migration fehlgeschlagen',
        description: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.',
        variant: 'destructive'
      });
    }
  };

  const handleCreateBackup = async () => {
    try {
      setIsLoading(true);
      const result = await migrationService.createBackup();
      
      if (result.success) {
        toast({
          title: 'Backup erstellt',
          description: 'Das Backup wurde erfolgreich heruntergeladen.',
          variant: 'default'
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: 'Backup fehlgeschlagen',
        description: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Sind Sie sicher, dass Sie alle Daten löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    try {
      setIsLoading(true);
      await apiServiceProvider.clearAllData();
      
      toast({
        title: 'Daten gelöscht',
        description: 'Alle Daten wurden erfolgreich gelöscht.',
        variant: 'default'
      });
      
      // Refresh health status
      await checkHealthStatus();
    } catch (error) {
      toast({
        title: 'Fehler beim Löschen',
        description: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (isHealthy: boolean) => {
    return (
      <Badge variant={isHealthy ? 'default' : 'destructive'}>
        {isHealthy ? 'Aktiv' : 'Inaktiv'}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Datenbank-Konfiguration</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Backend-Einstellungen und Datenmigration
          </p>
        </div>
        <Button onClick={checkHealthStatus} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Status aktualisieren
        </Button>
      </div>

      {/* Storage Mode Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Speicher-Modus
          </CardTitle>
          <CardDescription>
            Wählen Sie zwischen lokalem Speicher und API-Backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">API-Backend verwenden</Label>
              <p className="text-sm text-muted-foreground">
                Aktivieren Sie diese Option, um das API-Backend anstelle von localStorage zu verwenden
              </p>
            </div>
            <Switch
              checked={useApi}
              onCheckedChange={handleToggleApiMode}
            />
          </div>

          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            {useApi ? (
              <>
                <Cloud className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="font-medium">API-Backend-Modus</p>
                  <p className="text-sm text-muted-foreground">
                    Daten werden über API-Endpunkte verwaltet
                  </p>
                </div>
              </>
            ) : (
              <>
                <HardDrive className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium">localStorage-Modus</p>
                  <p className="text-sm text-muted-foreground">
                    Daten werden lokal im Browser gespeichert
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System-Status
          </CardTitle>
          <CardDescription>
            Überprüfen Sie den Status aller Systemdienste
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(healthStatus.status)}
                  <span className="font-medium">Gesamtstatus</span>
                </div>
                <Badge 
                  variant={
                    healthStatus.status === 'healthy' ? 'default' :
                    healthStatus.status === 'degraded' ? 'secondary' : 'destructive'
                  }
                >
                  {healthStatus.status === 'healthy' ? 'Gesund' :
                   healthStatus.status === 'degraded' ? 'Eingeschränkt' : 'Fehlerhaft'}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Termine</span>
                  {getStatusBadge(healthStatus.services.appointments)}
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Projekte</span>
                  {getStatusBadge(healthStatus.services.projects)}
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Benutzer</span>
                  {getStatusBadge(healthStatus.services.users)}
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Dokumente</span>
                  {getStatusBadge(healthStatus.services.documents)}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Letzter Check: {healthStatus.timestamp.toLocaleString('de-DE')}
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Status wird geladen...
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Configuration */}
      {useApi && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              API-Konfiguration
            </CardTitle>
            <CardDescription>
              Konfigurieren Sie die API-Verbindungseinstellungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api-url">Basis-URL</Label>
                <Input
                  id="api-url"
                  value={apiConfig.baseUrl}
                  onChange={(e) => setApiConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="http://localhost:3001/api"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-timeout">Timeout (ms)</Label>
                <Input
                  id="api-timeout"
                  type="number"
                  value={apiConfig.timeout}
                  onChange={(e) => setApiConfig(prev => ({ ...prev, timeout: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-retries">Wiederholungen</Label>
                <Input
                  id="api-retries"
                  type="number"
                  value={apiConfig.retries}
                  onChange={(e) => setApiConfig(prev => ({ ...prev, retries: e.target.value }))}
                />
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Hinweis</AlertTitle>
              <AlertDescription>
                API-Konfigurationsänderungen erfordern einen Neustart der Anwendung.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Database Configuration Display */}
      {useApi && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Datenbank-Konfiguration
            </CardTitle>
            <CardDescription>
              Aktuelle Datenbankverbindungseinstellungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Host</Label>
                <Input value={dbConfig.host} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input value={dbConfig.port} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Datenbank</Label>
                <Input value={dbConfig.database} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Benutzername</Label>
                <Input value={dbConfig.username} readOnly />
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Sicherheit</AlertTitle>
              <AlertDescription>
                Datenbankeinstellungen werden über Umgebungsvariablen konfiguriert.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Data Migration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Datenmigration
          </CardTitle>
          <CardDescription>
            Migrieren Sie Daten von localStorage zur Datenbank
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {migrationStatus.inProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{migrationStatus.stage}</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(migrationStatus.progress)}%
                </span>
              </div>
              <Progress value={migrationStatus.progress} />
            </div>
          )}

          {migrationStatus.error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Migration fehlgeschlagen</AlertTitle>
              <AlertDescription>{migrationStatus.error}</AlertDescription>
            </Alert>
          )}

          {migrationStatus.completed && migrationStatus.results && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Migration erfolgreich abgeschlossen</AlertTitle>
              <AlertDescription>
                {migrationStatus.results.users} Benutzer, {migrationStatus.results.projects} Projekte, {migrationStatus.results.appointments} Termine und {migrationStatus.results.documents} Dokumente wurden erfolgreich migriert.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleMigrateData}
              disabled={migrationStatus.inProgress || !useApi}
            >
              <Upload className="h-4 w-4 mr-2" />
              Daten migrieren
            </Button>
            
            <Button variant="outline" onClick={handleCreateBackup} disabled={isLoading}>
              <Download className="h-4 w-4 mr-2" />
              Backup erstellen
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={handleClearData} 
              disabled={isLoading}
            >
              Daten löschen
            </Button>
          </div>

          {!useApi && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>API-Modus erforderlich</AlertTitle>
              <AlertDescription>
                Aktivieren Sie den API-Modus, um Daten zur Datenbank zu migrieren.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseConfigPage;