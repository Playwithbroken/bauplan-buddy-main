import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Upload,
  FileText,
  Eye,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2,
  Download,
  Edit,
  Trash2,
  Search,
  Zap,
  Calendar,
  Euro,
  Building,
  Phone,
  Mail
} from 'lucide-react';
import InvoiceOcrService, { 
  ExtractedInvoiceData, 
  OcrProcessingResult, 
  ValidationResult,
  ValidationIssue 
} from '../../services/invoiceOcrService';
import { useToast } from '../../hooks/use-toast';

interface OcrInvoiceUploadProps {
  onDataExtracted: (data: ExtractedInvoiceData) => void;
  onCancel: () => void;
}

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
}

export const OcrInvoiceUpload: React.FC<OcrInvoiceUploadProps> = ({
  onDataExtracted,
  onCancel
}) => {
  const { toast } = useToast();
  const ocrService = InvoiceOcrService.getInstance();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: 'upload', name: 'Datei hochladen', status: 'pending' },
    { id: 'ocr', name: 'Text erkennen (OCR)', status: 'pending' },
    { id: 'extract', name: 'Daten extrahieren', status: 'pending' },
    { id: 'validate', name: 'Daten validieren', status: 'pending' }
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ExtractedInvoiceData | null>(null);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file);
        resetProcessing();
      } else {
        toast({
          title: "Ungültiger Dateityp",
          description: "Bitte wählen Sie eine PDF-Datei aus.",
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  // Handle drag and drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      setSelectedFile(file);
      resetProcessing();
    } else {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte wählen Sie eine PDF-Datei aus.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  // Reset processing state
  const resetProcessing = () => {
    setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
    setCurrentStep(0);
    setExtractedData(null);
    setValidationResult(null);
    setIsProcessing(false);
  };

  // Update step status
  const updateStep = (stepIndex: number, status: ProcessingStep['status'], duration?: number) => {
    setProcessingSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, status, duration } : step
    ));
  };

  // Process the uploaded PDF
  const processFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      // Step 1: Upload
      setCurrentStep(0);
      updateStep(0, 'processing');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate upload time
      updateStep(0, 'completed', Date.now() - startTime);

      // Step 2: OCR Processing
      setCurrentStep(1);
      updateStep(1, 'processing');
      const stepStartTime = Date.now();
      
      const result: OcrProcessingResult = await ocrService.processInvoicePdf(selectedFile);
      updateStep(1, result.success ? 'completed' : 'error', Date.now() - stepStartTime);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'OCR processing failed');
      }

      // Step 3: Data Extraction
      setCurrentStep(2);
      updateStep(2, 'processing');
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate processing time
      updateStep(2, 'completed', 300);
      setExtractedData(result.data);

      // Step 4: Validation
      setCurrentStep(3);
      updateStep(3, 'processing');
      const validation = ocrService.validateExtractedData(result.data);
      updateStep(3, validation.isValid ? 'completed' : 'error', 200);
      setValidationResult(validation);

      toast({
        title: "OCR erfolgreich",
        description: `Rechnung verarbeitet. Konfidenz: ${Math.round(validation.confidence * 100)}%`,
      });

    } catch (error) {
      console.error('Processing failed:', error);
      updateStep(currentStep, 'error');
      
      toast({
        title: "Verarbeitung fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle data acceptance
  const handleAcceptData = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
    }
  };

  // Show data preview
  const handlePreviewData = (data: ExtractedInvoiceData) => {
    setPreviewData(data);
    setShowPreview(true);
  };

  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getIssueIcon = (severity: ValidationIssue['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const progressValue = ((currentStep + 1) / processingSteps.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">OCR Rechnungsverarbeitung</h2>
          <p className="text-muted-foreground">
            Laden Sie eine PDF-Rechnung hoch und lassen Sie die Daten automatisch extrahieren
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Zap className="h-3 w-3 mr-1" />
          Automatische Erkennung
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Datei hochladen
              </CardTitle>
              <CardDescription>
                Unterstützte Formate: PDF (max. 10MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                {selectedFile ? (
                  <div className="space-y-4">
                    <FileText className="h-16 w-16 mx-auto text-blue-600" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        resetProcessing();
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Entfernen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-16 w-16 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium">PDF hier ablegen</p>
                      <p className="text-muted-foreground">oder klicken zum Auswählen</p>
                    </div>
                  </div>
                )}
              </div>
              
              <input
                id="file-input"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile && !isProcessing && !extractedData && (
                <div className="mt-4">
                  <Button onClick={processFile} className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    OCR Verarbeitung starten
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processing Steps */}
          {(isProcessing || extractedData) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className={`h-5 w-5 ${isProcessing ? 'animate-spin' : ''}`} />
                  Verarbeitungsstatus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {processingSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center space-x-3">
                      {getStepIcon(step)}
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          step.status === 'completed' ? 'text-green-600' :
                          step.status === 'error' ? 'text-red-600' :
                          step.status === 'processing' ? 'text-blue-600' :
                          'text-muted-foreground'
                        }`}>
                          {step.name}
                        </p>
                        {step.duration && (
                          <p className="text-xs text-muted-foreground">
                            {step.duration}ms
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Fortschritt</span>
                      <span>{Math.round(progressValue)}%</span>
                    </div>
                    <Progress value={progressValue} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {extractedData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Extrahierte Daten
                </CardTitle>
                <CardDescription>
                  Konfidenz: {validationResult ? Math.round(validationResult.confidence * 100) : 0}%
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="overview">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Übersicht</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Lieferant:</span>
                        <span className="text-sm font-medium">{extractedData.supplierName || 'Nicht erkannt'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Rechnungsnummer:</span>
                        <span className="text-sm font-medium">{extractedData.invoiceNumber || 'Nicht erkannt'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Datum:</span>
                        <span className="text-sm font-medium">
                          {extractedData.invoiceDate 
                            ? new Date(extractedData.invoiceDate).toLocaleDateString('de-DE')
                            : 'Nicht erkannt'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Gesamtbetrag:</span>
                        <span className="text-sm font-bold">
                          {extractedData.totalAmount 
                            ? `€${extractedData.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`
                            : 'Nicht erkannt'
                          }
                        </span>
                      </div>
                      {extractedData.positions && extractedData.positions.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Positionen:</span>
                          <span className="text-sm font-medium">{extractedData.positions.length}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePreviewData(extractedData)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Vorschau
                      </Button>
                      <Button 
                        onClick={handleAcceptData}
                        className="flex-1"
                        disabled={validationResult && !validationResult.isValid}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Übernehmen
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-3">
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-medium">Verarbeitungszeit:</span>
                        <span className="ml-2">{extractedData.processingDate}</span>
                      </div>
                      <div>
                        <span className="font-medium">OCR Konfidenz:</span>
                        <span className="ml-2">{Math.round(extractedData.confidence * 100)}%</span>
                      </div>
                      {extractedData.errors && extractedData.errors.length > 0 && (
                        <div>
                          <span className="font-medium">Fehler:</span>
                          <ul className="ml-4 mt-1 space-y-1">
                            {extractedData.errors.map((error, index) => (
                              <li key={index} className="text-red-600">• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Validation Issues */}
          {validationResult && validationResult.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Validierungshinweise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {validationResult.issues.map((issue, index) => (
                    <Alert key={index} variant={issue.severity === 'error' ? 'destructive' : 'default'}>
                      {getIssueIcon(issue.severity)}
                      <AlertTitle>{issue.field}</AlertTitle>
                      <AlertDescription>
                        {issue.issue}
                        {issue.suggestion && (
                          <div className="mt-1 text-sm text-muted-foreground">
                            Vorschlag: {issue.suggestion}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        {extractedData && (
          <Button onClick={handleAcceptData}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Daten übernehmen
          </Button>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Datenvorschau</DialogTitle>
            <DialogDescription>
              Überprüfen Sie die extrahierten Daten vor der Übernahme
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-6">
              {/* Supplier Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Lieferant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {previewData.supplierName || 'Nicht erkannt'}</div>
                    <div><strong>Adresse:</strong> {previewData.supplierAddress || 'Nicht erkannt'}</div>
                    <div><strong>Steuernummer:</strong> {previewData.supplierTaxNumber || 'Nicht erkannt'}</div>
                    {previewData.supplierPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {previewData.supplierPhone}
                      </div>
                    )}
                    {previewData.supplierEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {previewData.supplierEmail}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Rechnungsdetails
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>Nummer:</strong> {previewData.invoiceNumber || 'Nicht erkannt'}</div>
                    <div><strong>Datum:</strong> {
                      previewData.invoiceDate 
                        ? new Date(previewData.invoiceDate).toLocaleDateString('de-DE')
                        : 'Nicht erkannt'
                    }</div>
                    <div><strong>Fällig:</strong> {
                      previewData.dueDate 
                        ? new Date(previewData.dueDate).toLocaleDateString('de-DE')
                        : 'Nicht erkannt'
                    }</div>
                    <div><strong>Zahlungsbedingungen:</strong> {previewData.paymentTerms || 'Nicht erkannt'}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Finanzielle Zusammenfassung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Netto</div>
                      <div className="font-semibold">
                        €{previewData.subtotal?.toLocaleString('de-DE', { minimumFractionDigits: 2 }) || '0,00'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">MwSt ({previewData.taxRate || 0}%)</div>
                      <div className="font-semibold">
                        €{previewData.taxAmount?.toLocaleString('de-DE', { minimumFractionDigits: 2 }) || '0,00'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Gesamt</div>
                      <div className="font-bold text-lg">
                        €{previewData.totalAmount?.toLocaleString('de-DE', { minimumFractionDigits: 2 }) || '0,00'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Währung</div>
                      <div className="font-semibold">{previewData.currency || 'EUR'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Positions */}
              {previewData.positions && previewData.positions.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Positionen ({previewData.positions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {previewData.positions.map((position, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                          <div className="flex-1">
                            <div className="font-medium">{position.description}</div>
                            {position.quantity && position.unit && (
                              <div className="text-muted-foreground">
                                {position.quantity} {position.unit}
                                {position.unitPrice && ` × €${position.unitPrice.toFixed(2)}`}
                              </div>
                            )}
                          </div>
                          <div className="font-semibold">
                            €{position.total.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OcrInvoiceUpload;