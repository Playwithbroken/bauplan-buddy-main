import React, { useState, useEffect } from 'react';
import { MultiWindowDialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Hash,
  FileText,
  ArrowRight,
  Settings,
  BarChart3,
  Calendar,
  AlertCircle,
  Check,
  Copy,
  RefreshCw
} from 'lucide-react';
import DocumentNumberingService, { DocumentType } from '../../services/documentNumberingService';
import { useToast } from '../../hooks/use-toast';
import { DialogFrame } from '../ui/dialog-frame';

interface DocumentNumberingManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentNumberingManager({
  open,
  onOpenChange
}: DocumentNumberingManagerProps) {
  const { toast } = useToast();
  const numberingService = DocumentNumberingService;

  const [activeTab, setActiveTab] = useState('overview');
  const [documentTypes, setDocumentTypes] = useState(numberingService.getDocumentTypes());
  const [statistics, setStatistics] = useState(numberingService.getNumberingStatistics());
  const [customCounters, setCustomCounters] = useState<Record<string, number>>({});

  const refreshData = React.useCallback(() => {
    const types = numberingService.getDocumentTypes();
    setDocumentTypes(types);
    setStatistics(numberingService.getNumberingStatistics());
    
    // Initialize custom counters with current values
    const currentYear = new Date().getFullYear();
    const counters: Record<string, number> = {};
    
    types.forEach(({ type }) => {
      const key = `${type}_${currentYear}`;
      counters[key] = numberingService.getCurrentCounter(type, currentYear);
    });
    
    setCustomCounters(counters);
  }, [numberingService]);

  // Refresh data when dialog opens
  useEffect(() => {
    if (open) {
      refreshData();
    }
  }, [open, refreshData]);

  const handleUpdateCounter = (type: DocumentType, newCounter: number) => {
    const currentYear = new Date().getFullYear();
    try {
      numberingService.setCounter(type, newCounter, currentYear);
      refreshData();
      
      toast({
        title: "Zähler aktualisiert",
        description: `Der Zähler für ${getTypeDisplayName(type)} wurde auf ${newCounter} gesetzt.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Der Zähler konnte nicht aktualisiert werden.",
        variant: "destructive"
      });
    }
  };

  const handleCopyNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    toast({
      title: "Kopiert",
      description: `Nummer ${number} wurde in die Zwischenablage kopiert.`,
    });
  };

  const handleGeneratePreview = (type: DocumentType) => {
    const preview = numberingService.previewNextNumber(type);
    return preview.number;
  };

  const getTypeDisplayName = (type: DocumentType): string => {
    const names: Record<DocumentType, string> = {
      invoice: 'Ausgangsrechnungen',
      quote: 'Angebote', 
      order_confirmation: 'Auftragsbestätigungen',
      incoming_invoice: 'Eingangsrechnungen',
      project: 'Projekte',
      customer: 'Kunden',
      delivery_note: 'Lieferscheine'
    };
    return names[type] || type;
  };

  const getTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'invoice': return <FileText className="h-5 w-5 text-blue-600" />;
      case 'quote': return <FileText className="h-5 w-5 text-yellow-600" />;
      case 'order_confirmation': return <Check className="h-5 w-5 text-green-600" />;
      case 'incoming_invoice': return <ArrowRight className="h-5 w-5 text-purple-600" />;
      case 'project': return <BarChart3 className="h-5 w-5 text-indigo-600" />;
      case 'customer': return <Hash className="h-5 w-5 text-gray-600" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeDescription = (type: DocumentType): string => {
    const descriptions: Record<DocumentType, string> = {
      invoice: 'Nummern für ausgehende Rechnungen an Kunden',
      quote: 'Nummern für Angebote und Kostenvoranschläge',
      order_confirmation: 'Nummern für Auftragsbestätigungen nach Angebotszusage',
      incoming_invoice: 'Nummern für eingehende Rechnungen von Lieferanten',
      project: 'Nummern für Bauprojekte und Aufträge',
      customer: 'Nummern für Kundenstammdaten',
      delivery_note: 'Nummern für Lieferscheine zu Lieferungen'
    };
    return descriptions[type] || '';
  };

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange} modal={false}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Nummernkreise verwalten
            </span>
          }
          defaultFullscreen
          showFullscreenToggle
          headerActions={
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Übersicht</TabsTrigger>
              <TabsTrigger value="management">Verwaltung</TabsTrigger>
              <TabsTrigger value="statistics">Statistiken</TabsTrigger>
            </TabsList>
          }
          footer={
            <div className="flex justify-end w-full">
              <Button onClick={refreshData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
            </div>
          }
        >
          <TabsContent value="overview" className="space-y-6 mt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Hier können Sie alle Nummernkreise für Ihre Dokumente verwalten. 
                Jeder Dokumenttyp hat einen eigenen Zähler, der automatisch hochgezählt wird.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentTypes.map(({ type, config, currentCounter, nextNumber }) => (
                <Card key={type} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(type)}
                        <CardTitle className="text-base">{getTypeDisplayName(type)}</CardTitle>
                      </div>
                      <Badge variant="outline">{config.prefix}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{getTypeDescription(type)}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span>Aktueller Zähler:</span><span className="font-mono font-medium">{currentCounter}</span></div>
                      <div className="flex justify-between text-sm">
                        <span>Nächste Nummer:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-blue-600">{nextNumber}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleCopyNumber(nextNumber)} className="h-6 w-6 p-0">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">Format: {config.includeYear ? `${config.prefix}-YYYY-${'N'.repeat(config.sequenceLength)}` : `${config.prefix}-${'N'.repeat(config.sequenceLength)}`}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="management" className="space-y-6 mt-4">
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                <strong>Vorsicht:</strong> Das Ändern von Zählern kann zu doppelten Nummern führen. 
                Stellen Sie sicher, dass die neuen Nummern nicht bereits verwendet werden.
              </AlertDescription>
            </Alert>
            <div className="space-y-6">
              {documentTypes.map(({ type, config, currentCounter }) => {
                const currentYear = new Date().getFullYear();
                const key = `${type}_${currentYear}`;
                const customValue = customCounters[key] ?? currentCounter;
                return (
                  <Card key={type}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(type)}
                          <div>
                            <CardTitle className="text-lg">{getTypeDisplayName(type)}</CardTitle>
                            <p className="text-sm text-muted-foreground">{config.description}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{config.prefix}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`counter-${type}`}>Aktueller Zähler</Label>
                          <Input id={`counter-${type}`} type="number" value={customValue} onChange={(e) => setCustomCounters(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))} min="0" />
                        </div>
                        <div>
                          <Label>Nächste Nummer (Vorschau)</Label>
                          <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
                            <span className="font-mono text-sm">
                              {numberingService.previewNextNumber(type).number.replace(/\d+$/, (customValue + 1).toString().padStart(config.sequenceLength, '0'))}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-end">
                          <Button onClick={() => handleUpdateCounter(type, customValue)} disabled={customValue === currentCounter} className="w-full">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Zähler setzen
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        <strong>Formatierung:</strong> {config.includeYear ? 'Mit Jahr' : 'Ohne Jahr'} • Präfix: {config.prefix} • Sequenzlänge: {config.sequenceLength} Stellen
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
          <TabsContent value="statistics" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Gesamt Dokumente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{statistics.totalDocuments}</div>
                  <p className="text-sm text-muted-foreground">Alle Dokumenttypen</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Aktives Jahr</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{new Date().getFullYear()}</div>
                  <p className="text-sm text-muted-foreground">{statistics.byYear[new Date().getFullYear()] || 0} Dokumente</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Dokumenttypen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{Object.keys(statistics.byType).length}</div>
                  <p className="text-sm text-muted-foreground">Verschiedene Typen</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dokumente nach Typ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(statistics.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">{getTypeIcon(type as DocumentType)}<span className="text-sm">{getTypeDisplayName(type as DocumentType)}</span></div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Dokumente nach Jahr</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(statistics.byYear).sort(([a],[b]) => parseInt(b) - parseInt(a)).slice(0,5).map(([year, count]) => (
                      <div key={year} className="flex items-center justify-between">
                        <span className="text-sm">{year}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </DialogFrame>
      </Tabs>
    </MultiWindowDialog>
  );
}
