import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, MultiWindowDialog, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Wifi, 
  WifiOff,
  History,
  GitMerge,
  AlertCircle,
  Info
} from 'lucide-react';
import { useAdvancedSync, useOfflineAppointments } from '@/hooks/useAppointments';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface SyncStatusIndicatorProps {
  showDetailed?: boolean;
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  showDetailed = false,
  className = ""
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const {
    backgroundSync,
    isBackgroundSyncing,
    performFullSync,
    isFullSyncing,
    conflictLog,
    syncStatus,
    needsSync
  } = useAdvancedSync();
  
  const { isOnline, isOffline, hasPendingSync } = useOfflineAppointments();

  const getSyncStatusBadge = () => {
    if (isOffline) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <WifiOff className="h-3 w-3" data-testid="wifi-off-icon" />
          Offline
        </Badge>
      );
    }

    if (syncStatus.syncInProgress || isBackgroundSyncing || isFullSyncing) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Synchronisiert...
        </Badge>
      );
    }

    if (syncStatus.errors.length > 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Sync-Fehler
        </Badge>
      );
    }

    if (needsSync || syncStatus.pendingChanges > 0) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Sync ausstehend ({syncStatus.pendingChanges})
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Synchronisiert
      </Badge>
    );
  };

  const getLastSyncText = () => {
    if (!syncStatus.lastSyncTime) return 'Noch nie synchronisiert';
    
    const lastSync = new Date(syncStatus.lastSyncTime);
    return `Zuletzt: ${format(lastSync, 'dd.MM.yyyy HH:mm', { locale: de })}`;
  };

  const getConflictSummary = () => {
    const recentConflicts = conflictLog.filter(conflict => {
      const conflictTime = new Date(conflict.timestamp);
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      return conflictTime > dayAgo;
    });

    return {
      total: conflictLog.length,
      recent: recentConflicts.length,
      resolved: conflictLog.filter(c => c.resolution).length
    };
  };

  if (!showDetailed) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              {isOnline ? (
                <Cloud className="h-4 w-4 mr-1" />
              ) : (
                <CloudOff className="h-4 w-4 mr-1" />
              )}
              {getSyncStatusBadge()}
            </Button>
          </DialogTrigger>
          <SyncDialog 
            syncStatus={syncStatus}
            conflictLog={conflictLog}
            isOnline={isOnline}
            needsSync={needsSync}
            performFullSync={performFullSync}
            isFullSyncing={isFullSyncing}
            backgroundSync={backgroundSync}
            isBackgroundSyncing={isBackgroundSyncing}
          />
        </Dialog>
      </div>
    );
  }

  const conflictSummary = getConflictSummary();

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            Synchronisationsstatus
          </span>
          {getSyncStatusBadge()}
        </CardTitle>
        <CardDescription>
          {getLastSyncText()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync Progress */}
        {(syncStatus.syncInProgress || isBackgroundSyncing || isFullSyncing) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Synchronisierung läuft...</span>
              <RefreshCw className="h-4 w-4 animate-spin" />
            </div>
            <Progress value={75} className="h-2" />
          </div>
        )}

        {/* Pending Changes */}
        {syncStatus.pendingChanges > 0 && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">
                {syncStatus.pendingChanges} ausstehende Änderungen
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => performFullSync()}
              disabled={isFullSyncing || isOffline}
            >
              Jetzt synchronisieren
            </Button>
          </div>
        )}

        {/* Errors */}
        {syncStatus.errors.length > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                Synchronisationsfehler
              </span>
            </div>
            <div className="space-y-1">
              {syncStatus.errors.map((error, index) => (
                <p key={index} className="text-xs text-red-700 dark:text-red-300">
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Conflicts Summary */}
        {conflictSummary.total > 0 && (
          <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <GitMerge className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-sm font-medium">
                  {conflictSummary.total} Konflikte erkannt
                </div>
                <div className="text-xs text-muted-foreground">
                  {conflictSummary.resolved} aufgelöst, {conflictSummary.recent} in den letzten 24h
                </div>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Details anzeigen
                </Button>
              </DialogTrigger>
              <SyncDialog 
                syncStatus={syncStatus}
                conflictLog={conflictLog}
                isOnline={isOnline}
                needsSync={needsSync}
                performFullSync={performFullSync}
                isFullSyncing={isFullSyncing}
                backgroundSync={backgroundSync}
                isBackgroundSyncing={isBackgroundSyncing}
              />
            </Dialog>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => backgroundSync()}
            disabled={isBackgroundSyncing || isOffline}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isBackgroundSyncing ? 'animate-spin' : ''}`} />
            Sync prüfen
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                Details
              </Button>
            </DialogTrigger>
            <SyncDialog 
              syncStatus={syncStatus}
              conflictLog={conflictLog}
              isOnline={isOnline}
              needsSync={needsSync}
              performFullSync={performFullSync}
              isFullSyncing={isFullSyncing}
              backgroundSync={backgroundSync}
              isBackgroundSyncing={isBackgroundSyncing}
            />
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

interface SyncDialogProps {
  syncStatus: {
    pendingChanges: number;
    lastSyncTime?: string;
    errors: string[];
  };
  conflictLog: Array<{
    type: 'update_conflict' | 'deletion_conflict' | 'creation_conflict';
    timestamp: string;
    appointmentId: string;
    conflictFields?: string[];
    resolution?: {
      strategy: 'server_wins' | 'client_wins' | 'merge' | 'manual';
      reason?: string;
    };
  }>;
  isOnline: boolean;
  needsSync: boolean;
  performFullSync: () => void;
  isFullSyncing: boolean;
  backgroundSync: () => void;
  isBackgroundSyncing: boolean;
}

const SyncDialog: React.FC<SyncDialogProps> = ({
  syncStatus,
  conflictLog,
  isOnline,
  needsSync,
  performFullSync,
  isFullSyncing,
  backgroundSync,
  isBackgroundSyncing
}) => {
  return (
    <DialogFrame
      title={
        <span className="flex items-center gap-2">
          <GitMerge className="h-5 w-5" />
          Synchronisation & Konfliktauflösung
        </span>
      }
      width="fit-content"
      minWidth={900}
      maxWidth={1600}
      resizable={true}
    >
      <DialogDescription>
        Verwalten Sie die Datensynchronisation und lösen Sie Konflikte zwischen lokalen und Server-Daten.
      </DialogDescription>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="conflicts">Konflikte</TabsTrigger>
          <TabsTrigger value="actions">Aktionen</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aktueller Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {isOnline ? (
                      <Wifi className="h-4 w-4 text-green-600" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Netzwerkverbindung: {isOnline ? 'Verfügbar' : 'Nicht verfügbar'}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">
                      {syncStatus.pendingChanges} ausstehende Änderungen
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Lokale Änderungen, die synchronisiert werden müssen
                  </div>
                </div>
              </div>

              {syncStatus.lastSyncTime && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">Letzte Synchronisation:</span>
                    <br />
                    {format(new Date(syncStatus.lastSyncTime), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                  </div>
                </div>
              )}

              {syncStatus.errors.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-800 dark:text-red-200">
                      Fehler bei der Synchronisation
                    </span>
                  </div>
                  <div className="space-y-1">
                    {syncStatus.errors.map((error: string, index: number) => (
                      <p key={index} className="text-sm text-red-700 dark:text-red-300">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Konfliktprotokoll</CardTitle>
              <CardDescription>
                Historie der erkannten und aufgelösten Datenkonflikte
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conflictLog.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Keine Konflikte
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Alle Daten sind erfolgreich synchronisiert.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {conflictLog.slice().reverse().map((conflict, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {conflict.type === 'update_conflict' && (
                            <GitMerge className="h-4 w-4 text-orange-600" />
                          )}
                          {conflict.type === 'deletion_conflict' && (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          {conflict.type === 'creation_conflict' && (
                            <Info className="h-4 w-4 text-blue-600" />
                          )}
                          <span className="font-medium">
                            {conflict.type === 'update_conflict' && 'Aktualisierungskonflikt'}
                            {conflict.type === 'deletion_conflict' && 'Löschkonflikt'}
                            {conflict.type === 'creation_conflict' && 'Erstellungskonflikt'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(conflict.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        <span className="font-medium">Termin-ID:</span>{' '}
                        <span>{conflict.appointmentId}</span>
                      </div>
                      
                      {conflict.conflictFields && (
                        <div className="text-sm mb-2">
                          <span className="font-medium">Betroffene Felder:</span> {conflict.conflictFields.join(', ')}
                        </div>
                      )}
                      
                      {conflict.resolution && (
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <div className="text-sm">
                            <span className="font-medium text-green-800 dark:text-green-200">
                              Auflösung:
                            </span>
                            <span className="ml-2">
                              {conflict.resolution.strategy === 'server_wins' && 'Server-Version übernommen'}
                              {conflict.resolution.strategy === 'client_wins' && 'Lokale Version übernommen'}
                              {conflict.resolution.strategy === 'merge' && 'Daten zusammengeführt'}
                              {conflict.resolution.strategy === 'manual' && 'Manuell aufgelöst'}
                            </span>
                          </div>
                          {conflict.resolution.reason && (
                            <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                              <span className="font-medium">Grund:</span>{' '}
                              <span>{conflict.resolution.reason}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Synchronisationsaktionen</CardTitle>
              <CardDescription>
                Manuelle Kontrolle über die Datensynchronisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => backgroundSync()}
                  disabled={isBackgroundSyncing || !isOnline}
                  className="w-full"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isBackgroundSyncing ? 'animate-spin' : ''}`} />
                  Hintergrund-Sync
                </Button>
                
                <Button 
                  onClick={() => performFullSync()}
                  disabled={isFullSyncing || !isOnline}
                  variant="outline"
                  className="w-full"
                >
                  <Cloud className={`h-4 w-4 mr-2 ${isFullSyncing ? 'animate-spin' : ''}`} />
                  Vollständige Synchronisation
                </Button>
              </div>
              
              {!isOnline && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <WifiOff className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">
                      Offline-Modus
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Synchronisation nicht verfügbar. Änderungen werden lokal gespeichert und 
                    synchronisiert, sobald eine Internetverbindung besteht.
                  </p>
                </div>
              )}
              
              {needsSync && isOnline && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">
                      Synchronisation empfohlen
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Es sind lokale Änderungen vorhanden oder die letzte Synchronisation ist länger her. 
                    Eine Synchronisation wird empfohlen.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DialogFrame>
  );
};

export default SyncStatusIndicator;
