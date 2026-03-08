import React, { useState, useEffect } from 'react';
import {
  Dialog,
  MultiWindowDialog,
  DialogDescription,
} from '../ui/dialog';
import { DialogFrame } from '../ui/dialog-frame';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Mail,
  Download,
  FileText,
  Settings,
  ArrowRight,
  Loader2,
  Play,
  X,
  RefreshCw,
  CheckSquare,
  Users,
  FileOutput,
  Euro
} from 'lucide-react';
import QuoteBatchOperationsService, { 
  QuoteBatchOperation, 
  QuoteStatus,
  EmailTemplate 
} from '../../services/quoteBatchOperationsService';
import { useToast } from '../../hooks/use-toast';

interface QuoteBatchOperationsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedQuoteIds: string[];
  quotes: Array<{
    id: string;
    customer: string;
    project: string;
    amount: number;
    status: string;
  }>;
  onOperationComplete?: (operation: QuoteBatchOperation) => void;
}

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedQuoteIds: string[];
  onConfirm: (newStatus: QuoteStatus, reason?: string) => void;
  isLoading?: boolean;
}

interface EmailSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedQuoteIds: string[];
  templates: EmailTemplate[];
  onConfirm: (templateId: string, customSubject?: string, customBody?: string) => void;
  isLoading?: boolean;
}

const StatusChangeDialog: React.FC<StatusChangeDialogProps> = ({
  open,
  onOpenChange,
  selectedQuoteIds,
  onConfirm,
  isLoading = false
}) => {
  const [newStatus, setNewStatus] = useState<QuoteStatus>('sent');
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(newStatus, reason.trim() || undefined);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogFrame
        title={
          <span className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Status ändern
          </span>
        }
        description={
          <DialogDescription>
            Status für {selectedQuoteIds.length} ausgewählte Angebote ändern
          </DialogDescription>
        }
        width="fit-content"
        minWidth={500}
        maxWidth={800}
        resizable={true}
        footer={
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Abbrechen
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckSquare className="h-4 w-4 mr-2" />}
              Status ändern
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Neuer Status</Label>
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as QuoteStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Entwurf</SelectItem>
                <SelectItem value="sent">Versendet</SelectItem>
                <SelectItem value="accepted">Angenommen</SelectItem>
                <SelectItem value="rejected">Abgelehnt</SelectItem>
                <SelectItem value="expired">Abgelaufen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Grund (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Grund für die Statusänderung..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </DialogFrame>
    </Dialog>
  );
};

const EmailSendDialog: React.FC<EmailSendDialogProps> = ({
  open,
  onOpenChange,
  selectedQuoteIds,
  templates,
  onConfirm,
  isLoading = false
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');

  const template = templates.find(t => t.id === selectedTemplate);

  useEffect(() => {
    if (template) {
      setCustomSubject(template.subject);
      setCustomBody(template.body);
    }
  }, [template]);

  const handleConfirm = () => {
    if (!selectedTemplate) return;
    onConfirm(selectedTemplate, customSubject, customBody);
  };

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogFrame
        title={
          <span className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-Mails versenden
          </span>
        }
        description={
          <DialogDescription>
            E-Mails für {selectedQuoteIds.length} ausgewählte Angebote versenden
          </DialogDescription>
        }
        width="fit-content"
        minWidth={800}
        maxWidth={1200}
        resizable={true}
        preventOutsideClose={true}
        footer={
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Abbrechen
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading || !selectedTemplate}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              E-Mails versenden
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="template">E-Mail-Vorlage</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Vorlage auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {template && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Betreff</Label>
                <Textarea
                  id="subject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="body">Nachricht</Label>
                <Textarea
                  id="body"
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  rows={10}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm font-medium mb-2">Verfügbare Variablen:</p>
                <div className="flex flex-wrap gap-2">
                  {template.variables.map((variable) => (
                    <Badge key={variable} variant="secondary" className="text-xs">
                      {'{' + variable + '}'}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogFrame>
    </MultiWindowDialog>
  );
};

export const QuoteBatchOperations: React.FC<QuoteBatchOperationsProps> = ({
  open,
  onOpenChange,
  selectedQuoteIds,
  quotes,
  onOperationComplete
}) => {
  const { toast } = useToast();
  const batchService = QuoteBatchOperationsService.getInstance();
  
  const [activeTab, setActiveTab] = useState('operations');
  const [operations, setOperations] = useState<QuoteBatchOperation[]>([]);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [isOperationRunning, setIsOperationRunning] = useState(false);

  const emailTemplates = batchService.getEmailTemplates();
  const selectedQuotes = quotes.filter(q => selectedQuoteIds.includes(q.id));
  const totalAmount = selectedQuotes.reduce((sum, q) => sum + q.amount, 0);

  // Refresh operations periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setOperations(batchService.getAllOperations());
    }, 1000);

    return () => clearInterval(interval);
  }, [batchService]);

  const handleStatusChange = async (newStatus: QuoteStatus, reason?: string) => {
    setIsOperationRunning(true);
    try {
      const { operation } = await batchService.bulkChangeStatus(selectedQuoteIds, newStatus, reason);
      
      toast({
        title: "Statusänderung gestartet",
        description: `Status für ${selectedQuoteIds.length} Angebote wird geändert...`,
      });

      setShowStatusDialog(false);
      setActiveTab('history');
      
      if (onOperationComplete) {
        onOperationComplete(operation);
      }
    } catch (error) {
      toast({
        title: "Fehler bei Statusänderung",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    } finally {
      setIsOperationRunning(false);
    }
  };

  const handleEmailSend = async (templateId: string, customSubject?: string, customBody?: string) => {
    setIsOperationRunning(true);
    try {
      const { operation } = await batchService.bulkSendEmails(
        selectedQuoteIds, 
        templateId, 
        customSubject, 
        customBody
      );
      
      toast({
        title: "E-Mail-Versand gestartet",
        description: `E-Mails für ${selectedQuoteIds.length} Angebote werden versendet...`,
      });

      setShowEmailDialog(false);
      setActiveTab('history');
      
      if (onOperationComplete) {
        onOperationComplete(operation);
      }
    } catch (error) {
      toast({
        title: "Fehler beim E-Mail-Versand",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    } finally {
      setIsOperationRunning(false);
    }
  };

  const handlePDFGeneration = async () => {
    setIsOperationRunning(true);
    try {
      const { operation } = await batchService.bulkGeneratePDFs(selectedQuoteIds);
      
      toast({
        title: "PDF-Generierung gestartet",
        description: `PDFs für ${selectedQuoteIds.length} Angebote werden erstellt...`,
      });

      setActiveTab('history');
      
      if (onOperationComplete) {
        onOperationComplete(operation);
      }
    } catch (error) {
      toast({
        title: "Fehler bei PDF-Generierung",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    } finally {
      setIsOperationRunning(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'json') => {
    setIsOperationRunning(true);
    try {
      const { operation } = await batchService.bulkExport(selectedQuoteIds, format);
      
      toast({
        title: "Export gestartet",
        description: `${selectedQuoteIds.length} Angebote werden als ${format.toUpperCase()} exportiert...`,
      });

      setActiveTab('history');
      
      if (onOperationComplete) {
        onOperationComplete(operation);
      }
    } catch (error) {
      toast({
        title: "Fehler beim Export",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    } finally {
      setIsOperationRunning(false);
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'status_change': return <Settings className="h-4 w-4" />;
      case 'email_send': return <Mail className="h-4 w-4" />;
      case 'pdf_generate': return <FileText className="h-4 w-4" />;
      case 'export': return <FileOutput className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getOperationStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'pending': return <Clock className="h-4 w-4 text-orange-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOperationStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <>
      <MultiWindowDialog open={open} onOpenChange={onOpenChange} modal={false}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <DialogFrame
            title={
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Batch-Operationen
              </span>
            }
            description={
              <DialogDescription>
                Massenoperationen für {selectedQuoteIds.length} ausgewählte Angebote
              </DialogDescription>
            }
            width="fit-content"
            minWidth={900}
            maxWidth={1600}
            resizable={true}
            defaultFullscreen={false}
            headerActions={
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="operations">Operationen</TabsTrigger>
                <TabsTrigger value="history">Verlauf</TabsTrigger>
              </TabsList>
            }
          >
              <TabsContent value="operations" className="space-y-6 mt-4">
                {/* Selection Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Auswahl-Übersicht</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">
                          <strong>{selectedQuoteIds.length}</strong> Angebote ausgewählt
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="text-sm">
                          <strong>{new Set(selectedQuotes.map(q => q.customer)).size}</strong> Kunden
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Euro className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">
                          <strong>€{totalAmount.toLocaleString()}</strong> Gesamtwert
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Available Operations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Verfügbare Operationen</CardTitle>
                    <CardDescription>
                      Wählen Sie eine Operation aus, die auf alle ausgewählten Angebote angewendet werden soll
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="h-20 flex-col space-y-2"
                        onClick={() => setShowStatusDialog(true)}
                        disabled={isOperationRunning}
                      >
                        <Settings className="h-6 w-6" />
                        <span>Status ändern</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-20 flex-col space-y-2"
                        onClick={() => setShowEmailDialog(true)}
                        disabled={isOperationRunning}
                      >
                        <Mail className="h-6 w-6" />
                        <span>E-Mails senden</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-20 flex-col space-y-2"
                        onClick={handlePDFGeneration}
                        disabled={isOperationRunning}
                      >
                        <FileText className="h-6 w-6" />
                        <span>PDFs generieren</span>
                      </Button>

                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full h-16 flex-col space-y-1"
                          onClick={() => handleExport('excel')}
                          disabled={isOperationRunning}
                        >
                          <FileOutput className="h-5 w-5" />
                          <span>Als Excel exportieren</span>
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleExport('csv')}
                            disabled={isOperationRunning}
                          >
                            CSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleExport('json')}
                            disabled={isOperationRunning}
                          >
                            JSON
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-6 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Operationsverlauf
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOperations(batchService.getAllOperations())}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Aktualisieren
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Übersicht aller durchgeführten Batch-Operationen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {operations.length > 0 ? (
                      <div className="space-y-4">
                        {operations.map((operation) => (
                          <div key={operation.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                {getOperationIcon(operation.type)}
                                <div>
                                  <h4 className="font-medium">
                                    {operation.type === 'status_change' && 'Statusänderung'}
                                    {operation.type === 'email_send' && 'E-Mail-Versand'}
                                    {operation.type === 'pdf_generate' && 'PDF-Generierung'}
                                    {operation.type === 'export' && 'Export'}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {operation.quoteIds.length} Angebote • {new Date(operation.createdAt).toLocaleString('de-DE')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getOperationStatusIcon(operation.status)}
                                <Badge variant={getOperationStatusColor(operation.status)}>
                                  {operation.status === 'completed' && 'Abgeschlossen'}
                                  {operation.status === 'in_progress' && 'In Bearbeitung'}
                                  {operation.status === 'pending' && 'Wartend'}
                                  {operation.status === 'failed' && 'Fehlgeschlagen'}
                                </Badge>
                              </div>
                            </div>
                            
                            {operation.status === 'in_progress' && (
                              <div className="mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Fortschritt</span>
                                  <span>{operation.progress}%</span>
                                </div>
                                <Progress value={operation.progress} className="h-2" />
                              </div>
                            )}
                            
                            {operation.results && operation.results.length > 0 && (
                              <div className="text-sm">
                                <div className="flex gap-4">
                                  <span className="text-green-600">
                                    ✓ {operation.results.filter(r => r.success).length} erfolgreich
                                  </span>
                                  {operation.results.some(r => !r.success) && (
                                    <span className="text-red-600">
                                      ✗ {operation.results.filter(r => !r.success).length} fehlgeschlagen
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Noch keine Operationen durchgeführt</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </DialogFrame>
          </Tabs>
        </MultiWindowDialog>

      {/* Status Change Dialog */}
      <StatusChangeDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        selectedQuoteIds={selectedQuoteIds}
        onConfirm={handleStatusChange}
        isLoading={isOperationRunning}
      />

      {/* Email Send Dialog */}
      <EmailSendDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        selectedQuoteIds={selectedQuoteIds}
        templates={emailTemplates}
        onConfirm={handleEmailSend}
        isLoading={isOperationRunning}
      />
    </>
  );
};

export default QuoteBatchOperations;
