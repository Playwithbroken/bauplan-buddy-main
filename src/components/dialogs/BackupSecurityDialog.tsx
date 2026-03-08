import React, { useState } from 'react';
import { MultiWindowDialog } from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  Download,
  Upload,
  Database,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileArchive,
  Lock,
  History
} from 'lucide-react';

interface BackupSecurityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BackupEntry {
  id: string;
  date: string;
  size: string;
  type: 'manual' | 'automatic';
  status: 'success' | 'failed';
}

export const BackupSecurityDialog: React.FC<BackupSecurityDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('backup');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backups] = useState<BackupEntry[]>([
    {
      id: '1',
      date: '2025-10-31 14:00',
      size: '45 MB',
      type: 'automatic',
      status: 'success'
    },
    {
      id: '2',
      date: '2025-10-30 14:00',
      size: '43 MB',
      type: 'automatic',
      status: 'success'
    },
    {
      id: '3',
      date: '2025-10-29 10:30',
      size: '42 MB',
      type: 'manual',
      status: 'success'
    }
  ]);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    
    try {
      // Simulate backup creation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Export all data from localStorage
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {
          quotes: localStorage.getItem('quotes'),
          projects: localStorage.getItem('projects'),
          invoices: localStorage.getItem('invoices'),
          customers: localStorage.getItem('customers'),
          settings: localStorage.getItem('settings'),
          // Add more data as needed
        }
      };

      // Create downloadable file
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bauplan-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Backup erstellt',
        description: 'Ihre Daten wurden erfolgreich gesichert.'
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Backup konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleExportData = () => {
    const data = {
      quotes: JSON.parse(localStorage.getItem('quotes') || '[]'),
      projects: JSON.parse(localStorage.getItem('projects') || '[]'),
      invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
      customers: JSON.parse(localStorage.getItem('customers') || '[]')
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bauplan-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Daten exportiert',
      description: 'Ihre Daten wurden als JSON exportiert.'
    });
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          
          // Restore data to localStorage
          if (data.data) {
            // It's a backup file
            Object.entries(data.data).forEach(([key, value]) => {
              if (value) localStorage.setItem(key, value as string);
            });
          } else {
            // It's an export file
            Object.entries(data).forEach(([key, value]) => {
              localStorage.setItem(key, JSON.stringify(value));
            });
          }

          toast({
            title: 'Daten importiert',
            description: 'Ihre Daten wurden erfolgreich wiederhergestellt.'
          });
          
          // Reload page to reflect changes
          setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
          toast({
            title: 'Fehler',
            description: 'Daten konnten nicht importiert werden.',
            variant: 'destructive'
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Backup & Sicherheit
            </span>
          }
          headerActions={
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="backup">Backup</TabsTrigger>
              <TabsTrigger value="export">Datenexport</TabsTrigger>
              <TabsTrigger value="security">Sicherheit</TabsTrigger>
            </TabsList>
          }
          width="fit-content"
          minWidth={640}
          maxWidth={1024}
          resizable={true}
        >

          {/* Backup Tab */}
          <TabsContent value="backup" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    Manuelles Backup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Erstellen Sie jetzt eine Sicherungskopie Ihrer Daten.
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={handleCreateBackup}
                    disabled={isCreatingBackup}
                  >
                    {isCreatingBackup ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Backup wird erstellt...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Backup jetzt erstellen
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Enthält alle Angebote, Rechnungen, Projekte und Einstellungen
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    Automatisches Backup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Tägliche automatische Sicherung aktivieren.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Automatisches Backup</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Backup-Zeit</Label>
                      <input type="time" defaultValue="14:00" className="px-3 py-2 border rounded-md" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Aufbewahrung (Tage)</Label>
                      <input type="number" defaultValue="30" className="w-24 px-3 py-2 border rounded-md" />
                    </div>
                  </div>
                  <Button className="w-full">
                    Einstellungen speichern
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Backup History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Backup-Verlauf
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {backups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileArchive className="h-8 w-8 text-blue-600" />
                        <div>
                          <div className="font-medium">{backup.date}</div>
                          <div className="text-sm text-muted-foreground">
                            {backup.size} • {backup.type === 'automatic' ? 'Automatisch' : 'Manuell'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {backup.status === 'success' ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Erfolgreich
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Fehlgeschlagen
                          </Badge>
                        )}
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-purple-600" />
                    Daten exportieren
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Exportieren Sie Ihre Daten in verschiedenen Formaten.
                  </p>
                  <div className="space-y-2">
                    <Button className="w-full" variant="outline" onClick={handleExportData}>
                      <FileArchive className="h-4 w-4 mr-2" />
                      JSON Export
                    </Button>
                    <Button className="w-full" variant="outline">
                      <FileArchive className="h-4 w-4 mr-2" />
                      CSV Export
                    </Button>
                    <Button className="w-full" variant="outline">
                      <FileArchive className="h-4 w-4 mr-2" />
                      Excel Export
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    DSGVO-konform: Alle personenbezogenen Daten werden eingeschlossen
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-orange-600" />
                    Daten importieren
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Importieren Sie Daten aus einem Backup oder Export.
                  </p>
                  <Button className="w-full" onClick={handleImportData}>
                    <Upload className="h-4 w-4 mr-2" />
                    Backup wiederherstellen
                  </Button>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">Achtung</p>
                        <p className="text-yellow-700 dark:text-yellow-300">
                          Der Import überschreibt alle vorhandenen Daten. Bitte erstellen Sie vorher ein Backup.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle>Export-Optionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch id="quotes" defaultChecked />
                    <Label htmlFor="quotes">Angebote</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="invoices" defaultChecked />
                    <Label htmlFor="invoices">Rechnungen</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="projects" defaultChecked />
                    <Label htmlFor="projects">Projekte</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="customers" defaultChecked />
                    <Label htmlFor="customers">Kunden</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="suppliers" />
                    <Label htmlFor="suppliers">Lieferanten</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="inventory" />
                    <Label htmlFor="inventory">Lagerbestand</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-red-600" />
                    Datenverschlüsselung
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Schützen Sie Ihre Backups mit Verschlüsselung.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Backups verschlüsseln</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Ende-zu-Ende Verschlüsselung</Label>
                      <Switch />
                    </div>
                    <div className="space-y-2">
                      <Label>Verschlüsselungs-Passwort</Label>
                      <input type="password" className="w-full px-3 py-2 border rounded-md" placeholder="••••••••" />
                    </div>
                  </div>
                  <Button className="w-full">
                    Verschlüsselung aktivieren
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-blue-600" />
                    Audit-Protokolle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Protokollieren Sie alle wichtigen Systemereignisse.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Audit-Logging aktiviert</Label>
                      <Badge variant="default" className="bg-green-600">Aktiv</Badge>
                    </div>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Letzte Login-Versuche:</span>
                        <span className="font-medium">248</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Datenänderungen:</span>
                        <span className="font-medium">1,542</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">System-Events:</span>
                        <span className="font-medium">89</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    Protokolle anzeigen
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Security Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Sicherheitsempfehlungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-green-800 dark:text-green-200">Automatische Backups aktiv</p>
                      <p className="text-green-700 dark:text-green-300">Tägliche Sicherung um 14:00 Uhr</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Verschlüsselung deaktiviert</p>
                      <p className="text-yellow-700 dark:text-yellow-300">Aktivieren Sie die Backup-Verschlüsselung für mehr Sicherheit</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800 dark:text-blue-200">DSGVO-konform</p>
                      <p className="text-blue-700 dark:text-blue-300">Alle Daten werden lokal in Ihrem Browser gespeichert</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </DialogFrame>
      </Tabs>
    </MultiWindowDialog>
  );
};

export default BackupSecurityDialog;
