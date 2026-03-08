import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Upload, FileText, Image, Eye, Download, Search, Filter,
  CheckCircle, AlertCircle, Clock, Trash2, Copy, Edit3,
  FileImage, FileCheck, Loader2, Zap, Languages, Settings,
  RotateCcw, Crop, ZoomIn, RefreshCw
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { OCRService, OCRResult, OCRConfig, OCRProgress } from '@/services/ocrService';
import {
  Dialog,
  MultiWindowDialog,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface OCRProcessorProps {
  onResultUpdate?: (results: OCRResult[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

export function OCRProcessor({ onResultUpdate, maxFiles = 10, acceptedFileTypes }: OCRProcessorProps) {
  const [results, setResults] = useState<OCRResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [selectedResult, setSelectedResult] = useState<OCRResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [config, setConfig] = useState<Partial<OCRConfig>>({
    language: 'deu',
    psm: 3,
    oem: 3,
    preserveInterwordSpaces: true,
    rotateAuto: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  // Load existing results on component mount
  React.useEffect(() => {
    const existingResults = OCRService.getAllResults();
    setResults(existingResults);
    onResultUpdate?.(existingResults);
  }, [onResultUpdate]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    if (acceptedFiles.length > maxFiles) {
      toast({
        title: "Zu viele Dateien",
        description: `Sie können maximal ${maxFiles} Dateien gleichzeitig verarbeiten.`,
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    
    try {
      // Process files individually for better progress tracking
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const fileKey = `${file.name}-${i}`;
        
        setProgress(prev => ({ ...prev, [fileKey]: 0 }));

        try {
          const result = await OCRService.processDocument(
            file,
            config,
            (progressData: OCRProgress) => {
              setProgress(prev => ({ ...prev, [fileKey]: progressData.progress }));
            }
          );

          setResults(prev => {
            const updated = [...prev, result];
            onResultUpdate?.(updated);
            return updated;
          });

          setProgress(prev => ({ ...prev, [fileKey]: 100 }));

          toast({
            title: "OCR abgeschlossen",
            description: `${file.name} wurde erfolgreich verarbeitet.`,
          });

        } catch (error) {
          toast({
            title: "OCR fehlgeschlagen",
            description: `Fehler bei der Verarbeitung von ${file.name}: ${(error as Error).message}`,
            variant: "destructive"
          });
        }
      }
    } finally {
      setProcessing(false);
      // Clear progress after a delay
      setTimeout(() => setProgress({}), 2000);
    }
  }, [config, maxFiles, onResultUpdate, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes ? acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>) : {
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp'],
      'application/pdf': ['.pdf']
    },
    multiple: true,
    maxFiles
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      const allResults = OCRService.getAllResults();
      setResults(allResults);
      return;
    }

    const searchResults = OCRService.searchResults(
      searchQuery,
      languageFilter === 'all' ? undefined : languageFilter
    );
    setResults(searchResults);
  };

  const handleDeleteResult = (resultId: string) => {
    OCRService.deleteResult(resultId);
    setResults(prev => {
      const updated = prev.filter(r => r.id !== resultId);
      onResultUpdate?.(updated);
      return updated;
    });
    
    if (selectedResult?.id === resultId) {
      setSelectedResult(null);
    }

    toast({
      title: "Ergebnis gelöscht",
      description: "Das OCR-Ergebnis wurde erfolgreich gelöscht.",
    });
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Text kopiert",
      description: "Der Text wurde in die Zwischenablage kopiert.",
    });
  };

  const getStatusIcon = (status: OCRResult['status']) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: OCRResult['status']) => {
    switch (status) {
      case 'processing':
        return 'warning';
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const filteredResults = results.filter(result => {
    const matchesLanguage = languageFilter === 'all' || result.language === languageFilter;
    const matchesSearch = !searchQuery.trim() || 
      result.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.documentId.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesLanguage && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">OCR Dokumenten-Processor</h2>
          <p className="text-muted-foreground">
            Automatische Texterkennung für Dokumente, Rechnungen und Verträge
          </p>
        </div>
        
        <div className="flex gap-2">
          <MultiWindowDialog open={showSettings} onOpenChange={setShowSettings} modal={false}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Einstellungen
              </Button>
            </DialogTrigger>
            <DialogFrame
              title={
                <span className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  OCR-Einstellungen
                </span>
              }
              width="fit-content"
              minWidth={640}
              maxWidth={1024}
              resizable={true}
            >
              <DialogDescription>
                Konfigurieren Sie die OCR-Parameter für bessere Ergebnisse
              </DialogDescription>
              <OCRSettings config={config} onConfigChange={setConfig} />
            </DialogFrame>
          </MultiWindowDialog>
          
          <Button
            variant="outline"
            onClick={() => {
              const allResults = OCRService.getAllResults();
              setResults(allResults);
              onResultUpdate?.(allResults);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Dokumente hochladen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                {processing ? (
                  <div className="space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Verarbeitung läuft...</p>
                      {Object.entries(progress).map(([fileKey, prog]) => (
                        <div key={fileKey} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{fileKey.split('-')[0]}</span>
                            <span>{Math.round(prog)}%</span>
                          </div>
                          <Progress value={prog} className="h-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FileImage className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {isDragActive 
                          ? 'Dateien hier ablegen...' 
                          : 'Dateien hierher ziehen oder klicken zum Auswählen'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, PDF, TIFF (max. {maxFiles} Dateien)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Language Selection */}
              <div className="mt-4 space-y-2">
                <Label>OCR-Sprache</Label>
                <Select
                  value={config.language}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger>
                    <Languages className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OCRService.getSupportedLanguages().map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiken</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Verarbeitete Dokumente</span>
                <span className="font-medium">{results.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Erfolgreich</span>
                <span className="font-medium text-green-600">
                  {results.filter(r => r.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Fehlgeschlagen</span>
                <span className="font-medium text-red-600">
                  {results.filter(r => r.status === 'failed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Durchschn. Vertrauen</span>
                <span className="font-medium">
                  {results.length > 0 
                    ? Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length)
                    : 0
                  }%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Dokumente durchsuchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Sprachen</SelectItem>
                    {OCRService.getSupportedLanguages().map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {filteredResults.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <div className="text-lg font-medium mb-2">Keine Ergebnisse</div>
                  <div className="text-muted-foreground">
                    {results.length === 0 
                      ? 'Laden Sie Dokumente hoch, um mit der OCR-Verarbeitung zu beginnen.'
                      : 'Keine Dokumente entsprechen Ihren Suchkriterien.'
                    }
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredResults.map((result) => (
                <Card key={result.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <div>
                          <CardTitle className="text-lg">{result.documentId}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{result.language}</Badge>
                            <span>{result.confidence.toFixed(1)}% Vertrauen</span>
                            <span>{result.processingTime}ms</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedResult(result)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyText(result.text)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteResult(result.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Erkannter Text:</span>
                        <div className="mt-1 p-2 bg-muted rounded text-xs font-mono max-h-20 overflow-y-auto">
                          {result.text.substring(0, 200)}
                          {result.text.length > 200 && '...'}
                        </div>
                      </div>

                      {/* Extracted Data Preview */}
                      {Object.keys(result.extractedData).length > 0 && (
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full">
                              <Zap className="h-4 w-4 mr-2" />
                              Extrahierte Daten anzeigen
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="space-y-2 text-sm">
                              {result.extractedData.invoices && (
                                <div>
                                  <span className="font-medium">Rechnung:</span>
                                  <div className="ml-2 text-muted-foreground">
                                    {result.extractedData.invoices[0].invoiceNumber && 
                                      `Nr: ${result.extractedData.invoices[0].invoiceNumber}`}
                                    {result.extractedData.invoices[0].totalAmount && 
                                      ` | Betrag: €${result.extractedData.invoices[0].totalAmount}`}
                                  </div>
                                </div>
                              )}
                              {result.extractedData.general && (
                                <div>
                                  <span className="font-medium">Titel:</span>
                                  <div className="ml-2 text-muted-foreground">
                                    {result.extractedData.general.title}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Result Detail Dialog */}
      <MultiWindowDialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)} modal={false}>
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              OCR-Ergebnis: {selectedResult?.documentId}
            </span>
          }
          width="fit-content"
          minWidth={900}
          maxWidth={1600}
          resizable={true}
        >
          {selectedResult && (
            <OCRResultDetail 
              result={selectedResult} 
              onClose={() => setSelectedResult(null)}
              onCopyText={handleCopyText}
            />
          )}
        </DialogFrame>
      </MultiWindowDialog>
    </div>
  );
}

interface OCRSettingsProps {
  config: Partial<OCRConfig>;
  onConfigChange: (config: Partial<OCRConfig>) => void;
}

function OCRSettings({ config, onConfigChange }: OCRSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Sprache</Label>
        <Select
          value={config.language}
          onValueChange={(value) => onConfigChange({ ...config, language: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OCRService.getSupportedLanguages().map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Seitensegmentierung</Label>
        <Select
          value={config.psm?.toString()}
          onValueChange={(value) => onConfigChange({ ...config, psm: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Vollautomatisch</SelectItem>
            <SelectItem value="6">Einzelner Text-Block</SelectItem>
            <SelectItem value="7">Einzelne Text-Zeile</SelectItem>
            <SelectItem value="8">Einzelnes Wort</SelectItem>
            <SelectItem value="13">Roher Text</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="preserveSpaces"
          checked={config.preserveInterwordSpaces}
          onChange={(e) => onConfigChange({ ...config, preserveInterwordSpaces: e.target.checked })}
        />
        <Label htmlFor="preserveSpaces">Wortabstände beibehalten</Label>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="rotateAuto"
          checked={config.rotateAuto}
          onChange={(e) => onConfigChange({ ...config, rotateAuto: e.target.checked })}
        />
        <Label htmlFor="rotateAuto">Automatische Drehung</Label>
      </div>
    </div>
  );
}

interface OCRResultDetailProps {
  result: OCRResult;
  onClose: () => void;
  onCopyText: (text: string) => void;
}

function OCRResultDetail({ result, onClose, onCopyText }: OCRResultDetailProps) {
  return (
    <>
      <DialogDescription>
        Verarbeitet am {new Date(result.createdAt).toLocaleString('de-DE')}
      </DialogDescription>

      <Tabs defaultValue="text" className="mt-4">
        <TabsList>
          <TabsTrigger value="text">Erkannter Text</TabsTrigger>
          <TabsTrigger value="data">Extrahierte Daten</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Vollständiger Text ({result.text.length} Zeichen)</Label>
            <Button size="sm" onClick={() => onCopyText(result.text)}>
              <Copy className="h-4 w-4 mr-2" />
              Kopieren
            </Button>
          </div>
          <Textarea
            value={result.text}
            readOnly
            className="min-h-[300px] font-mono text-sm"
          />
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <div className="space-y-4">
            {Object.entries(result.extractedData).map(([type, data]) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">{type}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vertrauen</Label>
              <div className="text-2xl font-bold">{result.confidence.toFixed(1)}%</div>
            </div>
            <div>
              <Label>Verarbeitungszeit</Label>
              <div className="text-2xl font-bold">{result.processingTime}ms</div>
            </div>
            <div>
              <Label>Sprache</Label>
              <div className="text-lg">{result.language}</div>
            </div>
            <div>
              <Label>Status</Label>
              <Badge variant={result.status === 'completed' ? 'default' : 'destructive'}>
                {result.status}
              </Badge>
            </div>
            <div>
              <Label>Erkannte Wörter</Label>
              <div className="text-lg">{result.words.length}</div>
            </div>
            <div>
              <Label>Zeilen</Label>
              <div className="text-lg">{result.lines.length}</div>
            </div>
          </div>

          {result.error && (
            <div className="mt-4">
              <Label>Fehler</Label>
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {result.error}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

export default OCRProcessor;