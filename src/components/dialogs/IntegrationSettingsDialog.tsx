import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiWindowDialog } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar,
  CloudOff,
  Database,
  Plug,
  Power,
  RefreshCcw,
  RefreshCw,
  ShieldCheck,
  Signal,
  WifiOff
} from 'lucide-react';
import CalendarIntegrationService, { CalendarProvider } from '@/services/calendarIntegrationService';
import AccountingIntegrationService, { AccountingProvider } from '@/services/accountingIntegrationService';
import { useToast } from '@/hooks/use-toast';
import { DialogFrame } from '@/components/ui/dialog-frame';

export type IntegrationSection = 'calendar' | 'accounting';

interface IntegrationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSection?: IntegrationSection;
}

type CalendarSyncDirection = CalendarProvider['syncSettings']['syncDirection'];
type AccountingSyncDirection = AccountingProvider['syncSettings']['syncDirection'];

const calendarService = CalendarIntegrationService;
const accountingService = AccountingIntegrationService;

const CALENDAR_SYNC_OPTIONS: Array<{ label: string; value: CalendarSyncDirection }> = [
  { label: 'Bidirektional', value: 'bidirectional' },
  { label: 'Nur Import', value: 'import_only' },
  { label: 'Nur Export', value: 'export_only' }
];

const ACCOUNTING_SYNC_OPTIONS: Array<{ label: string; value: AccountingSyncDirection }> = [
  { label: 'Bidirektional', value: 'bidirectional' },
  { label: 'Nur Import', value: 'import_only' },
  { label: 'Nur Export', value: 'export_only' }
];

const SYNC_INTERVALS = [5, 15, 30, 60, 120];

const formatDateTime = (value?: Date | string | null): string => {
  if (!value) {
    return 'Noch nie';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unbekannt';
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const IntegrationSettingsDialog: React.FC<IntegrationSettingsDialogProps> = ({
  open,
  onOpenChange,
  initialSection = 'calendar'
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<IntegrationSection>(initialSection);
  const [calendarProviders, setCalendarProviders] = useState<CalendarProvider[]>([]);
  const [accountingProviders, setAccountingProviders] = useState<AccountingProvider[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncingProviderId, setSyncingProviderId] = useState<string | null>(null);

  const refreshData = useCallback(() => {
    setCalendarProviders(calendarService.getProviders());
    setAccountingProviders(accountingService.getProviders());
  }, []);

  useEffect(() => {
    if (open) {
      setActiveTab(initialSection);
      refreshData();
    }
  }, [open, initialSection, refreshData]);

  const calendarStats = useMemo(() => {
    if (!calendarProviders.length) {
      return { connected: 0, autoSync: 0 };
    }

    const connected = calendarProviders.filter((provider) => provider.authenticated).length;
    const autoSync = calendarProviders.filter((provider) => provider.syncSettings.autoSync).length;

    return { connected, autoSync };
  }, [calendarProviders]);

  const accountingStats = useMemo(() => {
    if (!accountingProviders.length) {
      return { enabled: 0, autoSync: 0 };
    }

    const enabled = accountingProviders.filter((provider) => provider.enabled).length;
    const autoSync = accountingProviders.filter((provider) => provider.syncSettings.autoSync).length;

    return { enabled, autoSync };
  }, [accountingProviders]);

  const handleCalendarConnect = async (type: 'google' | 'outlook') => {
    try {
      setIsConnecting(true);
      const success = await calendarService.authenticateProvider(type);
      if (success) {
        toast({
          title: `${type === 'google' ? 'Google' : 'Outlook'} Kalender verbunden`,
          description: 'Die Verbindung wurde eingerichtet. Synchronisation wird vorbereitet.'
        });
        refreshData();
      } else {
        toast({
          title: 'Verbindung fehlgeschlagen',
          description: 'Bitte versuchen Sie es erneut.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCalendarToggle = (
    provider: CalendarProvider,
    field: 'enabled' | 'syncSettings.autoSync',
    value: boolean
  ) => {
    const updates = field === 'enabled'
      ? { enabled: value }
      : { syncSettings: { autoSync: value } };

    calendarService.updateProvider(provider.id, updates);
    refreshData();
  };

  const handleCalendarSyncDirectionChange = (
    provider: CalendarProvider,
    direction: CalendarSyncDirection
  ) => {
    calendarService.updateProvider(provider.id, { syncSettings: { syncDirection: direction } });
    refreshData();
  };

  const handleCalendarFrequencyChange = (provider: CalendarProvider, frequency: number) => {
    calendarService.updateProvider(provider.id, { syncSettings: { syncFrequency: frequency } });
    refreshData();
  };

  const handleCalendarSync = async (providerId: string) => {
    try {
      setSyncingProviderId(providerId);
      const result = await calendarService.syncProvider(providerId);
      toast({
        title: result ? 'Synchronisation erfolgreich' : 'Synchronisation fehlgeschlagen',
        description: result
          ? 'Kalenderdaten wurden aktualisiert.'
          : 'Bitte pruefen Sie die Verbindungseinstellungen.',
        variant: result ? 'default' : 'destructive'
      });
      refreshData();
    } finally {
      setSyncingProviderId(null);
    }
  };

  const handleCalendarDisconnect = (providerId: string) => {
    const removed = calendarService.removeProvider(providerId);
    toast({
      title: removed ? 'Integration entfernt' : 'Aktion nicht moeglich',
      description: removed
        ? 'Die Kalenderverbindung wurde deaktiviert.'
        : 'Die Integration konnte nicht entfernt werden.',
      variant: removed ? 'default' : 'destructive'
    });
    refreshData();
  };

  const handleAccountingConnect = async (provider: AccountingProvider) => {
    try {
      setIsConnecting(true);
      const success = await accountingService.authenticateProvider(provider.id, {});
      toast({
        title: success ? `${provider.name} verbunden` : 'Authentifizierung fehlgeschlagen',
        description: success
          ? 'Die Verbindung wurde erfolgreich hergestellt.'
          : 'Bitte pruefen Sie Ihre Zugangsdaten.',
        variant: success ? 'default' : 'destructive'
      });
      refreshData();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAccountingToggle = (
    provider: AccountingProvider,
    field: 'enabled' | 'syncSettings.autoSync',
    value: boolean
  ) => {
    const updates = field === 'enabled'
      ? { enabled: value }
      : { syncSettings: { autoSync: value } };

    accountingService.updateProvider(provider.id, updates);
    refreshData();
  };

  const handleAccountingSyncDirectionChange = (
    provider: AccountingProvider,
    direction: AccountingSyncDirection
  ) => {
    accountingService.updateProvider(provider.id, { syncSettings: { syncDirection: direction } });
    refreshData();
  };

  const handleAccountingIntervalChange = (provider: AccountingProvider, interval: number) => {
    accountingService.updateProvider(provider.id, { syncSettings: { syncInterval: interval } });
    refreshData();
  };

  const handleAccountingSync = async (providerId: string) => {
    try {
      setSyncingProviderId(providerId);
      const result = await accountingService.syncProvider(providerId);
      toast({
        title: result.success ? 'Synchronisation ausgefuehrt' : 'Synchronisation fehlgeschlagen',
        description: result.success
          ? `Verarbeitete Datensaetze: ${result.recordsProcessed}`
          : 'Bitte pruefen Sie die Integrationsdetails.',
        variant: result.success ? 'default' : 'destructive'
      });
      refreshData();
    } finally {
      setSyncingProviderId(null);
    }
  };

  const handleAccountingReset = (providerId: string) => {
    const reset = accountingService.resetProvider(providerId);
    toast({
      title: reset ? 'Integration zurueckgesetzt' : 'Zuruecksetzen fehlgeschlagen',
      description: reset
        ? 'Die Verbindung wurde deaktiviert. Bitte richten Sie die Integration erneut ein.'
        : 'Die Integration konnte nicht zurueckgesetzt werden.',
      variant: reset ? 'default' : 'destructive'
    });
    refreshData();
  };

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange} modal={false}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as IntegrationSection)}>
        <DialogFrame
          title="Integrationen verwalten"
          description="Verbinden Sie Bauplan Buddy mit externen Systemen und steuern Sie Synchronisationseinstellungen."
          defaultFullscreen
          showFullscreenToggle
          headerActions={
            <TabsList className="grid grid-cols-2 gap-2">
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Kalender
                <Badge variant="secondary" className="ml-2">{calendarStats.connected}</Badge>
              </TabsTrigger>
              <TabsTrigger value="accounting" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Buchhaltung
                <Badge variant="secondary" className="ml-2">{accountingStats.enabled}</Badge>
              </TabsTrigger>
            </TabsList>
          }

        >
          <TabsContent value="calendar" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Status</CardTitle>
                  <CardDescription>{calendarStats.connected > 0 ? `${calendarStats.connected} verbundene Kalender` : 'Keine aktiven Kalenderverbindungen'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span>Automatische Synchronisation</span><Badge variant="outline">{calendarStats.autoSync}</Badge></div>
                  <div className="flex items-center justify-between"><span>Verbindungen</span><Badge variant="secondary">{calendarProviders.length}</Badge></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Neue Verbindung</CardTitle>
                  <CardDescription>Integrieren Sie Google oder Outlook Kalender.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Button variant="outline" disabled={isConnecting} onClick={() => handleCalendarConnect('google')} className="flex items-center gap-2"><Plug className="h-4 w-4" />Google Kalender verbinden</Button>
                  <Button variant="outline" disabled={isConnecting} onClick={() => handleCalendarConnect('outlook')} className="flex items-center gap-2"><Plug className="h-4 w-4" />Outlook Kalender verbinden</Button>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              {calendarProviders.length === 0 ? (
                <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted-foreground"><WifiOff className="h-6 w-6" /><p>Es sind derzeit keine Kalender integriert. Verbinden Sie einen Anbieter, um Termine zu synchronisieren.</p></CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {calendarProviders.map((provider) => (
                    <Card key={provider.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span>{provider.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={provider.enabled ? 'default' : 'outline'}>{provider.enabled ? 'Aktiv' : 'Inaktiv'}</Badge>
                            <Badge variant={provider.authenticated ? 'secondary' : 'outline'}>{provider.authenticated ? 'Verbunden' : 'Nicht verbunden'}</Badge>
                          </div>
                        </CardTitle>
                        <CardDescription>Konto: {provider.accountEmail || 'Noch nicht authentifiziert'}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-3 rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">Automatische Synchronisation</p>
                                <p className="text-xs text-muted-foreground">Synchronisation im Hintergrund aktivieren oder deaktivieren.</p>
                              </div>
                              <Switch checked={provider.syncSettings.autoSync} disabled={!provider.authenticated} onCheckedChange={(checked) => handleCalendarToggle(provider, 'syncSettings.autoSync', checked)} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Synchronisationsrichtung</Label>
                              <Select value={provider.syncSettings.syncDirection} onValueChange={(value) => handleCalendarSyncDirectionChange(provider, value as CalendarSyncDirection)}>
                                <SelectTrigger><SelectValue placeholder="Modus waehlen" /></SelectTrigger>
                                <SelectContent>
                                  {CALENDAR_SYNC_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Intervall (Minuten)</Label>
                              <Select value={String(provider.syncSettings.syncFrequency)} onValueChange={(value) => handleCalendarFrequencyChange(provider, Number(value))}>
                                <SelectTrigger><SelectValue placeholder="Intervall waehlen" /></SelectTrigger>
                                <SelectContent>
                                  {SYNC_INTERVALS.map((interval) => (<SelectItem key={interval} value={String(interval)}>{interval}</SelectItem>))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-3 rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">Kalender aktivieren</p>
                                <p className="text-xs text-muted-foreground">Steuert, ob Termine synchronisiert werden duerfen.</p>
                              </div>
                              <Switch checked={provider.enabled} disabled={!provider.authenticated} onCheckedChange={(checked) => handleCalendarToggle(provider, 'enabled', checked)} />
                            </div>
                            <div className="rounded-md bg-muted p-3 text-sm">
                              <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Letzte Synchronisation: {formatDateTime(provider.lastSync)}</p>
                              <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><Signal className="h-4 w-4" /> Status: {provider.syncSettings.autoSync ? 'Automatisch' : 'Manuell'}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button size="sm" onClick={() => handleCalendarSync(provider.id)} disabled={!provider.authenticated || syncingProviderId === provider.id} className="flex items-center gap-2"><RefreshCw className="h-4 w-4" />Jetzt synchronisieren</Button>
                              <Button size="sm" variant="outline" onClick={() => handleCalendarDisconnect(provider.id)} disabled={syncingProviderId === provider.id} className="flex items-center gap-2"><CloudOff className="h-4 w-4" />Verbindung loesen</Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="accounting" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Status</CardTitle><CardDescription>{accountingStats.enabled > 0 ? `${accountingStats.enabled} aktive Integrationen` : 'Keine Buchhaltungsintegration aktiv'}</CardDescription></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span>Automatische Synchronisation</span><Badge variant="outline">{accountingStats.autoSync}</Badge></div>
                  <div className="flex items-center justify-between"><span>Verfuegbare Anbieter</span><Badge variant="secondary">{accountingProviders.length}</Badge></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Hinweis</CardTitle><CardDescription>Authentifizieren Sie einen Anbieter, um Debitoren, Kreditoren und Belege zu synchronisieren.</CardDescription></CardHeader>
                <CardContent className="text-sm text-muted-foreground">Sie koennen mehrere Systeme parallel betreiben und die Synchronisation je Mandant steuern.</CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {accountingProviders.map((provider) => (
                <Card key={provider.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base"><span>{provider.name}</span><div className="flex items-center gap-2"><Badge variant={provider.enabled ? 'default' : 'outline'}>{provider.enabled ? 'Aktiv' : 'Deaktiviert'}</Badge><Badge variant={provider.authenticated ? 'secondary' : 'outline'}>{provider.authenticated ? 'Verbunden' : 'Nicht verbunden'}</Badge></div></CardTitle>
                    <CardDescription>API-Endpunkt: {provider.apiEndpoint}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <div><p className="text-sm font-medium">Integration aktivieren</p><p className="text-xs text-muted-foreground">Steuert den Datenabgleich mit {provider.name}.</p></div>
                          <Switch checked={provider.enabled} onCheckedChange={(checked) => handleAccountingToggle(provider, 'enabled', checked)} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div><p className="text-sm font-medium">Automatische Synchronisation</p><p className="text-xs text-muted-foreground">Periodischer Sync ueber Hintergrundprozesse.</p></div>
                          <Switch checked={provider.syncSettings.autoSync} disabled={!provider.authenticated} onCheckedChange={(checked) => handleAccountingToggle(provider, 'syncSettings.autoSync', checked)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Synchronisationsrichtung</Label>
                          <Select value={provider.syncSettings.syncDirection} onValueChange={(value) => handleAccountingSyncDirectionChange(provider, value as AccountingSyncDirection)}>
                            <SelectTrigger><SelectValue placeholder="Modus waehlen" /></SelectTrigger>
                            <SelectContent>
                              {ACCOUNTING_SYNC_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Intervall (Minuten)</Label>
                          <Select value={String(provider.syncSettings.syncInterval)} onValueChange={(value) => handleAccountingIntervalChange(provider, Number(value))}>
                            <SelectTrigger><SelectValue placeholder="Intervall waehlen" /></SelectTrigger>
                            <SelectContent>
                              {SYNC_INTERVALS.map((interval) => (<SelectItem key={interval} value={String(interval)}>{interval}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-3 rounded-lg border p-3">
                        <div className="rounded-md bg-muted p-3 text-sm"><p className="flex items-center gap-2"><RefreshCcw className="h-4 w-4" /> Zuletzt synchronisiert: {formatDateTime(provider.lastSync)}</p><p className="mt-1 text-xs text-muted-foreground">Datenabgleich: {provider.syncSettings.syncEntities.invoices ? 'Rechnungen' : '-'},{' '}Kunden: {provider.syncSettings.syncEntities.customers ? 'Ja' : 'Nein'},{' '}Zahlungen: {provider.syncSettings.syncEntities.payments ? 'Ja' : 'Nein'}</p></div>
                        <div className="flex flex-wrap items-center gap-2">
                          {!provider.authenticated ? (
                            <Button size="sm" disabled={isConnecting} onClick={() => handleAccountingConnect(provider)} className="flex items-center gap-2"><Plug className="h-4 w-4" />Verbindung herstellen</Button>
                          ) : (
                            <Button size="sm" onClick={() => handleAccountingSync(provider.id)} disabled={syncingProviderId === provider.id} className="flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Jetzt synchronisieren</Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleAccountingReset(provider.id)} className="flex items-center gap-2"><Power className="h-4 w-4" />Integration zuruecksetzen</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </DialogFrame>
      </Tabs>
    </MultiWindowDialog>
  );
};

export default IntegrationSettingsDialog;