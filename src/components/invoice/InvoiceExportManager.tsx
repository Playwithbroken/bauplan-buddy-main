import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  FileText,
  Download,
  Mail,
  Send,
  FileSpreadsheet,
  Eye,
  MoreHorizontal,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Copy,
  Users
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import InvoiceExportService, { InvoiceExportData, EmailSettings, ExportOptions } from '../../services/invoiceExportService';

export interface InvoiceExportProps {
  invoices?: InvoiceExportData[];
  onClose?: () => void;
}

export const InvoiceExportManager: React.FC<InvoiceExportProps> = ({ 
  invoices = [], 
  onClose 
}) => {
  const { toast } = useToast();
  const exportService = InvoiceExportService.getInstance();

  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceExportData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Mock invoice data for demonstration
  const [mockInvoices] = useState<InvoiceExportData[]>([
    {
      id: 'inv-001',
      number: 'AR-2024-000001',
      invoiceDate: '2024-01-15',
      dueDate: '2024-02-14',
      customerName: 'Müller Bau GmbH',
      customerAddress: 'Hauptstraße 123\n12345 Berlin\nDeutschland',
      customerEmail: 'buchhaltung@mueller-bau.de',
      supplierName: 'BauPlan Buddy GmbH',
      supplierAddress: 'Musterstraße 456\n54321 Hamburg\nDeutschland',
      supplierTaxNumber: 'DE123456789',
      positions: [
        {
          description: 'Planungsleistungen für Neubau Einfamilienhaus',
          quantity: 1,
          unit: 'Pauschal',
          unitPrice: 5000.00,
          totalPrice: 5000.00,
          taxRate: 19
        },
        {
          description: 'Baubegleitung und Überwachung',
          quantity: 20,
          unit: 'Std',
          unitPrice: 85.00,
          totalPrice: 1700.00,
          taxRate: 19
        }
      ],
      subtotal: 6700.00,
      taxAmount: 1273.00,
      totalAmount: 7973.00,
      currency: 'EUR',
      paymentTerms: 30,
      notes: 'Vielen Dank für Ihr Vertrauen. Bei Fragen stehen wir Ihnen gerne zur Verfügung.'
    },
    {
      id: 'inv-002',
      number: 'AR-2024-000002',
      invoiceDate: '2024-01-20',
      dueDate: '2024-02-19',
      customerName: 'Schmidt Immobilien AG',
      customerAddress: 'Geschäftsstraße 789\n67890 München\nDeutschland',
      customerEmail: 'rechnungen@schmidt-immo.de',
      supplierName: 'BauPlan Buddy GmbH',
      supplierAddress: 'Musterstraße 456\n54321 Hamburg\nDeutschland',
      supplierTaxNumber: 'DE123456789',
      positions: [
        {
          description: 'Wartung Heizungsanlage',
          quantity: 1,
          unit: 'Pauschal',
          unitPrice: 350.00,
          totalPrice: 350.00,
          taxRate: 19
        }
      ],
      subtotal: 350.00,
      taxAmount: 66.50,
      totalAmount: 416.50,
      currency: 'EUR',
      paymentTerms: 14
    }
  ]);

  const allInvoices = invoices.length > 0 ? invoices : mockInvoices;

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    recipientEmail: '',
    subject: '',
    message: '',
    attachPDF: true,
    attachExcel: false
  });

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeHeader: true,
    includeFooter: true,
    language: 'de',
    template: 'standard'
  });

  const handleSelectInvoice = useCallback((invoiceId: string, checked: boolean) => {
    setSelectedInvoices(prev => 
      checked 
        ? [...prev, invoiceId]
        : prev.filter(id => id !== invoiceId)
    );
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedInvoices(checked ? allInvoices.map(inv => inv.id) : []);
  }, [allInvoices]);

  const handleSingleExport = useCallback(async (
    invoice: InvoiceExportData, 
    format: 'pdf' | 'excel'
  ) => {
    setIsExporting(true);
    try {
      const options = { ...exportOptions, format };
      const result = await exportService.exportInvoice(invoice, options);
      
      if (format === 'pdf' && result.pdf) {
        exportService.downloadFile(result.pdf, `${invoice.number}.pdf`);
        toast({
          title: "PDF Export erfolgreich",
          description: `Rechnung ${invoice.number} wurde als PDF exportiert.`,
        });
      } else if (format === 'excel' && result.excel) {
        exportService.downloadFile(result.excel, `${invoice.number}.xlsx`);
        toast({
          title: "Excel Export erfolgreich",
          description: `Rechnung ${invoice.number} wurde als Excel exportiert.`,
        });
      }
    } catch (error) {
      toast({
        title: "Export fehlgeschlagen",
        description: "Beim Export ist ein Fehler aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  }, [exportOptions, exportService, toast]);

  const handleBatchExport = useCallback(async () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "Keine Auswahl",
        description: "Bitte wählen Sie mindestens eine Rechnung aus.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    try {
      const selectedInvoiceData = allInvoices.filter(inv => selectedInvoices.includes(inv.id));
      
      for (const invoice of selectedInvoiceData) {
        const result = await exportService.exportInvoice(invoice, exportOptions);
        
        if (exportOptions.format === 'pdf' && result.pdf) {
          exportService.downloadFile(result.pdf, `${invoice.number}.pdf`);
        } else if (exportOptions.format === 'excel' && result.excel) {
          exportService.downloadFile(result.excel, `${invoice.number}.xlsx`);
        } else if (exportOptions.format === 'both') {
          if (result.pdf) exportService.downloadFile(result.pdf, `${invoice.number}.pdf`);
          if (result.excel) exportService.downloadFile(result.excel, `${invoice.number}.xlsx`);
        }
        
        // Small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "Batch Export erfolgreich",
        description: `${selectedInvoices.length} Rechnungen wurden exportiert.`,
      });
      setShowExportDialog(false);
    } catch (error) {
      toast({
        title: "Export fehlgeschlagen",
        description: "Beim Batch-Export ist ein Fehler aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  }, [selectedInvoices, allInvoices, exportOptions, exportService, toast]);

  const handleSendEmail = useCallback(async () => {
    if (!currentInvoice || !emailSettings.recipientEmail) {
      toast({
        title: "Ungültige Eingaben",
        description: "Bitte überprüfen Sie Ihre Eingaben.",
        variant: "destructive"
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      // Generate attachments based on settings
      const attachments: { pdf?: Blob; excel?: Blob } = {};
      
      if (emailSettings.attachPDF) {
        const pdfResult = await exportService.exportInvoice(currentInvoice, {
          ...exportOptions,
          format: 'pdf'
        });
        attachments.pdf = pdfResult.pdf;
      }
      
      if (emailSettings.attachExcel) {
        const excelResult = await exportService.exportInvoice(currentInvoice, {
          ...exportOptions,
          format: 'excel'
        });
        attachments.excel = excelResult.excel;
      }

      const success = await exportService.sendInvoiceEmail(
        currentInvoice,
        emailSettings,
        attachments
      );

      if (success) {
        toast({
          title: "E-Mail versendet",
          description: `Rechnung ${currentInvoice.number} wurde erfolgreich per E-Mail versendet.`,
        });
        setShowEmailDialog(false);
        setCurrentInvoice(null);
      } else {
        throw new Error('Email sending failed');
      }
    } catch (error) {
      toast({
        title: "E-Mail Versand fehlgeschlagen",
        description: "Beim Versenden der E-Mail ist ein Fehler aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  }, [currentInvoice, emailSettings, exportOptions, exportService, toast]);

  const openEmailDialog = useCallback((invoice: InvoiceExportData) => {
    setCurrentInvoice(invoice);
    const template = exportService.getEmailTemplate('initial', invoice, exportOptions.language);
    setEmailSettings({
      recipientEmail: invoice.customerEmail,
      recipientName: invoice.customerName,
      subject: template.subject,
      message: template.message,
      attachPDF: true,
      attachExcel: false
    });
    setShowEmailDialog(true);
  }, [exportService, exportOptions.language]);

  const getStatusBadge = (invoice: InvoiceExportData) => {
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    
    if (today > dueDate) {
      return <Badge variant="destructive">Überfällig</Badge>;
    } else if (today.getTime() + 7 * 24 * 60 * 60 * 1000 > dueDate.getTime()) {
      return <Badge variant="secondary">Fällig bald</Badge>;
    } else {
      return <Badge variant="outline">Offen</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rechnung Export & Versand</h1>
          <p className="text-muted-foreground">
            Exportieren Sie Rechnungen als PDF/Excel oder versenden Sie diese per E-Mail
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedInvoices.length > 0 && (
            <Button onClick={() => setShowExportDialog(true)} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Batch Export ({selectedInvoices.length})
            </Button>
          )}
          {onClose && (
            <Button variant="outline" onClick={onClose}>Schließen</Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Gesamt</p>
                <p className="text-2xl font-bold">{allInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Ausgewählt</p>
                <p className="text-2xl font-bold">{selectedInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium">Überfällig</p>
                <p className="text-2xl font-bold">
                  {allInvoices.filter(inv => new Date(inv.dueDate) < new Date()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Kunden</p>
                <p className="text-2xl font-bold">
                  {new Set(allInvoices.map(inv => inv.customerName)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Rechnungen ({allInvoices.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedInvoices.length === allInvoices.length}
                onCheckedChange={handleSelectAll}
              />
              <Label className="text-sm">Alle auswählen</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nummer</TableHead>
                <TableHead>Kunde</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Fällig</TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedInvoices.includes(invoice.id)}
                      onCheckedChange={(checked) => handleSelectInvoice(invoice.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.customerName}</div>
                      <div className="text-sm text-muted-foreground">{invoice.customerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.invoiceDate).toLocaleDateString('de-DE')}
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    €{invoice.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(invoice)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSingleExport(invoice, 'pdf')}>
                          <FileText className="h-4 w-4 mr-2" />
                          PDF Export
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSingleExport(invoice, 'excel')}>
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Excel Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEmailDialog(invoice)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Per E-Mail senden
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Batch Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Batch Export Einstellungen</DialogTitle>
            <DialogDescription>
              Konfigurieren Sie die Export-Optionen für {selectedInvoices.length} ausgewählte Rechnungen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select 
                value={exportOptions.format} 
                onValueChange={(value: 'pdf' | 'excel' | 'both') => 
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="both">PDF + Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sprache</Label>
              <Select 
                value={exportOptions.language} 
                onValueChange={(value: 'de' | 'en') => 
                  setExportOptions(prev => ({ ...prev, language: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vorlage</Label>
              <Select 
                value={exportOptions.template} 
                onValueChange={(value: 'standard' | 'modern' | 'minimal') => 
                  setExportOptions(prev => ({ ...prev, template: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-header"
                checked={exportOptions.includeHeader}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, includeHeader: !!checked }))
                }
              />
              <Label htmlFor="include-header">Kopfzeile einschließen</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-footer"
                checked={exportOptions.includeFooter}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, includeFooter: !!checked }))
                }
              />
              <Label htmlFor="include-footer">Fußzeile einschließen</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleBatchExport} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exportieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rechnung per E-Mail senden</DialogTitle>
            <DialogDescription>
              Rechnung {currentInvoice?.number} an {currentInvoice?.customerName} senden
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Empfänger E-Mail</Label>
                <Input
                  type="email"
                  value={emailSettings.recipientEmail}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, recipientEmail: e.target.value }))}
                  placeholder="kunde@firma.de"
                />
              </div>
              <div className="space-y-2">
                <Label>Empfänger Name (optional)</Label>
                <Input
                  value={emailSettings.recipientName || ''}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, recipientName: e.target.value }))}
                  placeholder="Herr Müller"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Betreff</Label>
              <Input
                value={emailSettings.subject}
                onChange={(e) => setEmailSettings(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Rechnung AR-2024-000001"
              />
            </div>

            <div className="space-y-2">
              <Label>Nachricht</Label>
              <Textarea
                value={emailSettings.message}
                onChange={(e) => setEmailSettings(prev => ({ ...prev, message: e.target.value }))}
                rows={8}
                placeholder="Sehr geehrte Damen und Herren..."
              />
            </div>

            <div className="space-y-2">
              <Label>Anhänge</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attach-pdf"
                    checked={emailSettings.attachPDF}
                    onCheckedChange={(checked) => 
                      setEmailSettings(prev => ({ ...prev, attachPDF: !!checked }))
                    }
                  />
                  <Label htmlFor="attach-pdf">PDF anhängen</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attach-excel"
                    checked={emailSettings.attachExcel}
                    onCheckedChange={(checked) => 
                      setEmailSettings(prev => ({ ...prev, attachExcel: !!checked }))
                    }
                  />
                  <Label htmlFor="attach-excel">Excel anhängen</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentInvoice) {
                    const template = exportService.getEmailTemplate('reminder', currentInvoice, 'de');
                    setEmailSettings(prev => ({
                      ...prev,
                      subject: template.subject,
                      message: template.message
                    }));
                  }
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Zahlungserinnerung
              </Button>
              <span>Vorlage verwenden</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSendEmail} disabled={isSendingEmail}>
              {isSendingEmail ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              E-Mail senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceExportManager;