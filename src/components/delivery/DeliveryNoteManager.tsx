import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  FileText,
  Truck,
  BarChart3,
  Download,
  Plus,
  TrendingUp,
  Package2,
  Clock,
  RefreshCw,
  Loader2,
  Upload
} from 'lucide-react';
import type { DeliveryNote } from '@/services/deliveryNoteService';
import { useToast } from '@/hooks/use-toast';
import { useWorkflowDocumentUpload } from '@/hooks/useWorkflowDocumentUpload';
import { slugifyCounterparty } from '@/utils/documentUpload';
import { cn } from '@/lib/utils';

interface DeliveryNoteManagerProps {
  deliveryNotes: DeliveryNote[];
  isLoading?: boolean;
  onCreateDeliveryNote?: () => void;
  onRefresh?: () => void;
  onSelectDeliveryNote?: (note: DeliveryNote | null) => void;
  selectedDeliveryNoteId?: string | null;
}

type StatusFilter = 'all' | DeliveryNote['status'];

const statusLabel: Record<DeliveryNote['status'], string> = {
  draft: 'Entwurf',
  sent: 'Versendet',
  delivered: 'Geliefert',
  cancelled: 'Storniert'
};

const statusBadgeVariant: Record<DeliveryNote['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  sent: 'outline',
  delivered: 'default',
  cancelled: 'destructive'
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }
  return parsed.toLocaleDateString('de-DE');
};

const formatRelativeTime = (value?: string | null) => {
  if (!value) {
    return '-';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }
  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) {
    return 'vor Sekunden';
  }
  if (diffMinutes < 60) {
    return `vor ${diffMinutes} Min`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `vor ${diffHours} Std`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `vor ${diffDays} Tagen`;
  }
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `vor ${diffMonths} Monaten`;
  }
  const diffYears = Math.floor(diffMonths / 12);
  return `vor ${diffYears} Jahren`;
};

const DeliveryNoteManager: React.FC<DeliveryNoteManagerProps> = ({
  deliveryNotes,
  isLoading = false,
  onCreateDeliveryNote,
  onRefresh,
  onSelectDeliveryNote,
  selectedDeliveryNoteId = null
}) => {
  const { toast } = useToast();
  const {
    inputProps: uploadInputProps,
    startUpload: startWorkflowUpload,
    uploadedDocuments,
    isUploadingForKey
  } = useWorkflowDocumentUpload();
  const [activeTab, setActiveTab] = useState('overview');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const handleDeliveryNoteUpload = (note: DeliveryNote) => {
    startWorkflowUpload({
      key: note.number,
      context: {
        workflowType: 'lieferschein',
        workflowId: note.number,
        counterpartyType: 'kunde',
        counterpartyId: slugifyCounterparty(note.customerName),
        customerId: note.customerId,
        projectId: note.projectId,
      },
      metadata: {
        name: `${note.number}_${note.customerName.replace(/\s+/g, '_')}`,
        description: `Lieferschein ${note.number} fuer ${note.customerName}`,
        tags: ['lieferschein', note.number],
      },
      successMessage: `Dokument dem Lieferschein ${note.number} zugeordnet.`,
    });
  };

  const overviewStats = useMemo(() => {
    if (deliveryNotes.length === 0) {
      return {
        totalDeliveryNotes: 0,
        pendingDelivery: 0,
        deliveredThisMonth: 0,
        totalItems: 0,
        avgDeliveryTime: 0,
        onTimeDeliveryRate: 0
      };
    }

    const now = new Date();
    const deliveredNotes = deliveryNotes.filter(note => note.status === 'delivered' && note.deliveredAt);
    const deliveredDurations = deliveredNotes
      .map(note => {
        const deliveredAt = note.deliveredAt ? new Date(note.deliveredAt) : undefined;
        const createdAt = new Date(note.createdAt);
        if (!deliveredAt || Number.isNaN(deliveredAt.getTime())) {
          return null;
        }
        const durationDays = (deliveredAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return durationDays > 0 ? durationDays : null;
      })
      .filter((value): value is number => value !== null);

    const deliveredThisMonth = deliveredNotes.filter(note => {
      const deliveredAt = note.deliveredAt ? new Date(note.deliveredAt) : undefined;
      if (!deliveredAt) return false;
      return (
        deliveredAt.getMonth() === now.getMonth() &&
        deliveredAt.getFullYear() === now.getFullYear()
      );
    }).length;

    const totalItems = deliveryNotes.reduce((total, note) => total + note.items.length, 0);
    const pendingDelivery = deliveryNotes.filter(note => note.status !== 'delivered').length;
    const avgDeliveryTime =
      deliveredDurations.length > 0
        ? Number((deliveredDurations.reduce((sum, value) => sum + value, 0) / deliveredDurations.length).toFixed(1))
        : 0;

    const onTimeDeliveryRate =
      deliveryNotes.length > 0
        ? Number(((deliveredNotes.length / deliveryNotes.length) * 100).toFixed(1))
        : 0;

    return {
      totalDeliveryNotes: deliveryNotes.length,
      pendingDelivery,
      deliveredThisMonth,
      totalItems,
      avgDeliveryTime,
      onTimeDeliveryRate
    };
  }, [deliveryNotes]);

  const statusBreakdown = useMemo(() => {
    return deliveryNotes.reduce<Record<DeliveryNote['status'], number>>(
      (accumulator, note) => {
        accumulator[note.status] += 1;
        return accumulator;
      },
      { draft: 0, sent: 0, delivered: 0, cancelled: 0 }
    );
  }, [deliveryNotes]);

  const filteredNotes = useMemo(() => {
    if (statusFilter === 'all') {
      return deliveryNotes;
    }
    return deliveryNotes.filter(note => note.status === statusFilter);
  }, [deliveryNotes, statusFilter]);

  useEffect(() => {
    if (!onSelectDeliveryNote) {
      return;
    }
    if (!selectedDeliveryNoteId || isLoading) {
      return;
    }

    const exists = filteredNotes.some(note => note.id === selectedDeliveryNoteId);
    if (!exists) {
      onSelectDeliveryNote(null);
    }
  }, [filteredNotes, isLoading, onSelectDeliveryNote, selectedDeliveryNoteId]);

  const recentActivity = useMemo(() => {
    return [...deliveryNotes]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime()
      )
      .slice(0, 6)
      .map(note => ({
        id: note.id,
        title: `${note.number}`,
        subtitle: note.projectName || note.customerName,
        status: note.status,
        time: formatRelativeTime(note.updatedAt)
      }));
  }, [deliveryNotes]);

  const quickActions = useMemo(() => {
    const actions = [];
    if (onCreateDeliveryNote) {
      actions.push({
        title: 'Neuer Lieferschein',
        description: 'Erstellen Sie einen neuen Lieferschein',
        icon: <Plus className="h-5 w-5" />,
        action: onCreateDeliveryNote
      });
    }
    if (onRefresh) {
      actions.push({
        title: 'Aktualisieren',
        description: 'Aktuelle Daten neu laden',
        icon: <RefreshCw className="h-5 w-5" />,
        action: onRefresh
      });
    }
    return actions;
  }, [onCreateDeliveryNote, onRefresh]);

  const handleExport = (format: 'json' | 'csv') => {
    if (deliveryNotes.length === 0) {
      toast({
        title: 'Kein Inhalt',
        description: 'Es sind keine Lieferscheine zum Export vorhanden.'
      });
      return;
    }

    try {
      let blob: Blob;
      let filename: string;
      if (format === 'json') {
        blob = new Blob([JSON.stringify(deliveryNotes, null, 2)], { type: 'application/json' });
        filename = 'delivery-notes.json';
      } else {
        const header = ['Nummer', 'Kunde', 'Projekt', 'Datum', 'Status'];
        const rows = deliveryNotes.map(note => [
          note.number,
          `"${note.customerName.replace(/"/g, '""')}"`,
          note.projectName ? `"${note.projectName.replace(/"/g, '""')}"` : '',
          note.date,
          note.status
        ]);
        const csvContent = [header, ...rows].map(columns => columns.join(';')).join('\r\n');
        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        filename = 'delivery-notes.csv';
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast({
        title: 'Export gestartet',
        description: `Die Datei ${filename} wurde heruntergeladen.`
      });
    } catch (error) {
      console.error('Export delivery notes failed:', error);
      toast({
        title: 'Export fehlgeschlagen',
        description: 'Die Daten konnten nicht exportiert werden.',
        variant: 'destructive'
      });
    }
  };

  const renderStatusBadge = (status: DeliveryNote['status']) => (
    <Badge variant={statusBadgeVariant[status]}>
      {statusLabel[status]}
    </Badge>
  );

  return (
    <div className="space-y-6">
      <input {...uploadInputProps} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lieferschein-Management</h1>
          <p className="text-muted-foreground">
            Verwaltung und Analyse aller Lieferscheine
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Daten werden geladen...
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="delivery-notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Lieferscheine
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analyse
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gesamtanzahl</CardTitle>
                <Package2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats.totalDeliveryNotes}</div>
                <p className="text-xs text-muted-foreground">Alle erfassten Lieferscheine</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Offene Lieferungen</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats.pendingDelivery}</div>
                <p className="text-xs text-muted-foreground">Noch nicht ausgelieferte Lieferscheine</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Geliefert (Monat)</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats.deliveredThisMonth}</div>
                <p className="text-xs text-muted-foreground">Abgeschlossene Lieferungen dieses Monats</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Puenktlichkeit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewStats.onTimeDeliveryRate}%
                </div>
                <p className="text-xs text-muted-foreground">Anteil ausgelieferter Lieferscheine</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Aktuelle Aktivitaeten</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Noch keine Lieferscheine erfasst.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-semibold">{entry.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {entry.subtitle || 'Ohne Projektzuordnung'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {renderStatusBadge(entry.status)}
                          <span>{entry.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statusübersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(Object.keys(statusBreakdown) as DeliveryNote['status'][]).map(status => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderStatusBadge(status)}
                    </div>
                    <span className="font-semibold">{statusBreakdown[status]}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {quickActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Schnellaktionen</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map(action => (
                  <Card key={action.title} className="border-dashed">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{action.title}</div>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={action.action}
                        className="flex items-center gap-2"
                      >
                        {action.icon}
                      Ausführen
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="delivery-notes" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lieferscheine</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  className="rounded border border-input bg-background px-3 py-1.5 text-sm"
                  value={statusFilter}
                  onChange={event => setStatusFilter(event.target.value as StatusFilter)}
                  aria-label="Status filtern"
                >
                  <option value="all">Alle Stati</option>
                  <option value="draft">Entwurf</option>
                  <option value="sent">Versendet</option>
                  <option value="delivered">Geliefert</option>
                  <option value="cancelled">Storniert</option>
                </select>
                {onCreateDeliveryNote && (
                  <Button size="sm" onClick={onCreateDeliveryNote}>
                    <Plus className="h-4 w-4 mr-2" />
                    Neuer Lieferschein
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="min-w-full overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-medium">Nummer</th>
                      <th className="px-4 py-3 font-medium">Projekt</th>
                      <th className="px-4 py-3 font-medium">Kunde</th>
                      <th className="px-4 py-3 font-medium">Datum</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Dokument</th>
                      <th className="px-4 py-3 font-medium text-right">Positionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td className="px-4 py-6 text-center text-muted-foreground" colSpan={7}>
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Daten werden geladen...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredNotes.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-center text-muted-foreground" colSpan={7}>
                          Keine Lieferscheine vorhanden.
                        </td>
                      </tr>
                    ) : (
                      filteredNotes.map(note => {
                        const isSelected = selectedDeliveryNoteId === note.id;
                        const rowClassName = cn(
                          'border-b transition-colors',
                          onSelectDeliveryNote ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40' : undefined,
                          isSelected ? 'bg-muted/50 hover:bg-muted/50' : 'hover:bg-muted/30'
                        );

                        return (
                          <tr
                            data-testid={`delivery-note-row-${note.id}`}
                            key={note.id}
                            className={rowClassName}
                            tabIndex={onSelectDeliveryNote ? 0 : -1}
                            role={onSelectDeliveryNote ? 'button' : undefined}
                            aria-selected={isSelected}
                            onClick={() => onSelectDeliveryNote?.(note)}
                            onKeyDown={(event) => {
                              if (!onSelectDeliveryNote) return;
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onSelectDeliveryNote(note);
                              }
                            }}
                          >
                            <td className="px-4 py-3 font-medium">{note.number}</td>
                            <td className="px-4 py-3">{note.projectName || '-'}</td>
                            <td className="px-4 py-3">{note.customerName}</td>
                            <td className="px-4 py-3">{formatDate(note.date)}</td>
                            <td className="px-4 py-3">{renderStatusBadge(note.status)}</td>
                            <td className="px-4 py-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDeliveryNoteUpload(note);
                                }}
                                disabled={isUploadingForKey(note.number)}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {isUploadingForKey(note.number) ? 'Laedt...' : 'Dokument'}
                              </Button>
                              {uploadedDocuments[note.number] && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {uploadedDocuments[note.number]}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">{note.items.length}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lieferzeiten</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Durchschnittliche Dauer</div>
                <div className="text-2xl font-semibold">
                  {overviewStats.avgDeliveryTime} Tage
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Gesamtpositionen</div>
                <div className="text-2xl font-semibold">
                  {overviewStats.totalItems}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Auslieferungsquote</div>
                <div className="text-2xl font-semibold">
                  {overviewStats.onTimeDeliveryRate}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status nach Anzahl</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(statusBreakdown) as DeliveryNote['status'][]).map(status => (
                <div key={status} className="rounded border p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{statusLabel[status]}</div>
                    <Badge>{statusBreakdown[status]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Anteil: {deliveryNotes.length > 0 ? Math.round((statusBreakdown[status] / deliveryNotes.length) * 100) : 0}%
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exportoptionen</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-dashed">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">JSON Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Komplette Lieferscheindaten als JSON-Datei herunterladen.
                  </p>
                  <Button variant="outline" onClick={() => handleExport('json')}>
                    <Download className="h-4 w-4 mr-2" />
                    JSON herunterladen
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">CSV Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Uebersichtliche CSV fuer Tabellenkalkulationen.
                  </p>
                  <Button variant="outline" onClick={() => handleExport('csv')}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV herunterladen
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliveryNoteManager;



