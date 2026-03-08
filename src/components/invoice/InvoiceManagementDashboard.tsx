import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Download, Send, Eye, CreditCard, MoreHorizontal, FileText, AlertCircle, FileCode2, ShieldCheck, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, MultiWindowDialog } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Invoice, InvoiceFilters, InvoiceStatistics, InvoicePayment, InvoiceFormData, EInvoiceFormat, EInvoiceStatus, EInvoiceDispatchChannel } from '@/types/invoice';
import { InvoiceService } from '@/services/enhancedInvoiceService';
import PaymentTrackingDialog from '@/components/dialogs/PaymentTrackingDialog';
import EnhancedInvoiceForm from '@/components/forms/EnhancedInvoiceForm';
import { IncomingInvoiceManager } from '@/components/invoice/IncomingInvoiceManager';
import { useToast } from '@/hooks/use-toast';
import { featureFlags } from '@/lib/featureFlags';
import { EInvoicingService } from '@/services/eInvoicingService';
import { DialogFrame } from '@/components/ui/dialog-frame';

const InvoiceManagementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('outgoing');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [statistics, setStatistics] = useState<InvoiceStatistics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCloudInvoiceMode, setIsCloudInvoiceMode] = useState(
    featureFlags.isEnabled('ENABLE_API_INVOICES')
  );

  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = featureFlags.subscribe((key, value) => {
      if (key === 'ENABLE_API_INVOICES') {
        setIsCloudInvoiceMode(value);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadInvoices();
    loadStatistics();
  }, []);

  const applyFilters = React.useCallback(() => {
    let filtered = [...invoices];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.recipient.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const loadInvoices = () => {
    const loadedInvoices = InvoiceService.getAllInvoices();
    setInvoices(loadedInvoices);
  };

  const loadStatistics = () => {
    const stats = InvoiceService.getInvoiceStatistics();
    setStatistics(stats);
  };

  const showCloudUnavailableToast = useCallback(() => {
    toast({
      title: 'Bald verfügbar',
      description: 'Bearbeitung von Cloud-Rechnungen ist demnächst verfügbar. Bitte nutzen Sie bis dahin lokale Workflows.',
    });
  }, [toast]);
  

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Entwurf', variant: 'secondary' as const, className: '' },
      sent: { label: 'Versendet', variant: 'default' as const, className: '' },
      viewed: { label: 'Angesehen', variant: 'default' as const, className: '' },
      paid: { label: 'Bezahlt', variant: 'default' as const, className: 'bg-green-600' },
      overdue: { label: 'Überfällig', variant: 'destructive' as const, className: '' },
      cancelled: { label: 'Storniert', variant: 'secondary' as const, className: '' },
      partial: { label: 'Teilzahlung', variant: 'secondary' as const, className: '' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (invoice: Invoice) => {
    const paymentStatus = invoice.status.paymentStatus;
    
    if (paymentStatus === 'paid') {
      return <Badge className="bg-green-600">Bezahlt</Badge>;
    } else if (paymentStatus === 'partial') {
      return <Badge variant="secondary">Teilzahlung</Badge>;
    } else if (paymentStatus === 'overpaid') {
      return <Badge className="bg-blue-600">Überzahlt</Badge>;
    } else {
      return <Badge variant="destructive">Unbezahlt</Badge>;
    }
  };


  const getEInvoiceBadge = (invoice: Invoice) => {
    const metadata = invoice.eInvoicing;
    const status: EInvoiceStatus = metadata?.status ?? (metadata?.enabled === false ? 'disabled' : 'not_generated');

    const statusConfig: Record<EInvoiceStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = {
      disabled: { label: 'Deaktiviert', variant: 'secondary' },
      not_generated: { label: 'Nicht erstellt', variant: 'outline' },
      generated: { label: 'Erstellt', variant: 'secondary' },
      validated: { label: 'Validiert', variant: 'default', className: 'bg-blue-600 text-white' },
      dispatched: { label: 'Versendet', variant: 'default', className: 'bg-green-600 text-white' },
      failed: { label: 'Fehler', variant: 'destructive' },
    };

    const config = statusConfig[status];
    const detail = metadata?.lastError
      ? metadata.lastError
      : metadata?.lastDispatchedAt
        ? `Versendet: ${new Date(metadata.lastDispatchedAt).toLocaleString('de-DE')}`
        : metadata?.lastValidatedAt
          ? `Validiert: ${new Date(metadata.lastValidatedAt).toLocaleString('de-DE')}`
          : metadata?.lastGeneratedAt
            ? `Generiert: ${new Date(metadata.lastGeneratedAt).toLocaleString('de-DE')}`
            : undefined;

    return (
      <div className="flex flex-col gap-1 max-w-[160px]">
        <Badge variant={config.variant} className={config.className} title={metadata?.lastError}>
          {config.label}
        </Badge>
        {detail && (
          <span className="text-xs text-muted-foreground truncate" title={detail}>
            {detail}
          </span>
        )}
      </div>
    );
  };

  const handleGenerateEInvoice = (invoice: Invoice, format: EInvoiceFormat) => {
    if (isCloudInvoiceMode) {
      showCloudUnavailableToast();
      return;
    }
    try {
      const { invoice: updatedInvoice } = EInvoicingService.generateDocument(invoice, format);
      InvoiceService.replaceInvoice(updatedInvoice);
      loadInvoices();
      toast({
        title: 'E-Rechnung erstellt',
        description: `${EInvoicingService.formatLabel(format)} fuer ${invoice.number} generiert.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler bei der Erstellung.';
      toast({ title: 'E-Rechnung konnte nicht erstellt werden', description: message, variant: 'destructive' });
    }
  };

  const handleValidateEInvoice = (invoice: Invoice) => {
    if (isCloudInvoiceMode) {
      showCloudUnavailableToast();
      return;
    }
    try {
      const { invoice: updatedInvoice, result } = EInvoicingService.validateLatestDocument(invoice);
      InvoiceService.replaceInvoice(updatedInvoice);
      loadInvoices();
      const warningCount = result.messages.filter((msg) => msg.level === 'warning').length;
      toast({
        title: 'Validierung abgeschlossen',
        description: warningCount
          ? `Validierung mit ${warningCount} Hinweis(en) abgeschlossen.`
          : 'E-Rechnung ohne Hinweise validiert.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler bei der Validierung.';
      toast({ title: 'Validierung fehlgeschlagen', description: message, variant: 'destructive' });
    }
  };

  const handleDispatchEInvoice = (invoice: Invoice, channel: EInvoiceDispatchChannel = 'peppol') => {
    if (isCloudInvoiceMode) {
      showCloudUnavailableToast();
      return;
    }
    try {
      const { invoice: updatedInvoice, event } = EInvoicingService.dispatchLatestDocument(invoice, channel);
      InvoiceService.replaceInvoice(updatedInvoice);
      loadInvoices();
      const channelLabel = channel === 'peppol' ? 'Peppol' : channel === 'email' ? 'E-Mail' : 'Portal';
      toast({
        title: 'E-Rechnung versendet',
        description: `${channelLabel}-Versand protokolliert (Ref.: ${event.referenceId ?? 'n/a'}).`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler beim Versand.';
      toast({ title: 'Versand nicht moeglich', description: message, variant: 'destructive' });
    }
  };

  const handleCreateInvoice = (data: InvoiceFormData, action: 'save' | 'send' | 'preview') => {
    if (isCloudInvoiceMode) {
      showCloudUnavailableToast();
      return;
    }
    try {
      const newInvoice = InvoiceService.createInvoice(data);
      
      if (action === 'send') {
        InvoiceService.updateInvoiceStatus(newInvoice.id, 'sent');
      }
      
      loadInvoices();
      loadStatistics();
      setShowCreateDialog(false);
      
      if (action === 'preview') {
        handlePreviewInvoice(newInvoice);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handlePreviewInvoice = async (invoice: Invoice) => {
    if (isCloudInvoiceMode) {
      showCloudUnavailableToast();
      return;
    }
    try {
      setIsLoading(true);
      const pdfBlob = await InvoiceService.generatePDF(invoice);
      const url = URL.createObjectURL(pdfBlob);
      setPreviewUrl(url);
      setShowPreviewDialog(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    if (isCloudInvoiceMode) {
      showCloudUnavailableToast();
      return;
    }
    try {
      setIsLoading(true);
      const pdfBlob = await InvoiceService.generatePDF(invoice);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rechnung_${invoice.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvoice = (invoice: Invoice) => {
    if (isCloudInvoiceMode) {
      showCloudUnavailableToast();
      return;
    }
    InvoiceService.updateInvoiceStatus(invoice.id, 'sent');
    loadInvoices();
  };

  const handlePaymentAdded = (payment: InvoicePayment) => {
    if (isCloudInvoiceMode) {
      showCloudUnavailableToast();
      return;
    }
    loadInvoices();
    loadStatistics();
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getOverdueInvoices = () => {
    return invoices.filter(inv => {
      const dueDate = new Date(inv.dueDate);
      const today = new Date();
      return dueDate < today && inv.status.paymentStatus !== 'paid';
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rechnungsverwaltung</h1>
          <p className="text-gray-600 mt-1">
            Verwalten Sie Ihre Rechnungen, Zahlungen und Kundenbeziehungen
          </p>
        </div>
        <Button
          onClick={() => {
            if (isCloudInvoiceMode) {
              showCloudUnavailableToast();
              return;
            }
            setShowCreateDialog(true);
          }}
          className={isCloudInvoiceMode ? 'opacity-50 cursor-not-allowed' : ''}
        >
          <Plus className="h-4 w-4 mr-2" />
          Neue Rechnung
        </Button>
      </div>

      {isCloudInvoiceMode && (
        <Alert>
          <AlertDescription>
            Cloud-basierte Rechnungen lassen sich aktuell nur ansehen und versenden. Bearbeitung und Zahlungsnachverfolgung folgen bald.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Gesamtumsatz</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(statistics.totalAmount)}</div>
              <p className="text-xs text-gray-600 mt-1">{statistics.totalInvoices} Rechnungen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Bezahlt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(statistics.paidAmount)}</div>
              <p className="text-xs text-gray-600 mt-1">{invoices.filter(inv => inv.status.paymentStatus === 'paid').length} Rechnungen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Überfällig</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(statistics.overdueAmount)}</div>
              <p className="text-xs text-gray-600 mt-1">{getOverdueInvoices().length} Rechnungen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Ausstehend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(statistics.totalAmount - statistics.paidAmount)}
              </div>
              <p className="text-xs text-gray-600 mt-1">Offene Beträge</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overdue Invoices Alert */}
      {getOverdueInvoices().length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Sie haben {getOverdueInvoices().length} überfällige Rechnung(en) im Wert von{' '}
            {formatCurrency(getOverdueInvoices().reduce((sum, inv) => sum + inv.totals.totalDue, 0))}.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-14 p-2 bg-muted/50 rounded-lg">
          <TabsTrigger 
            value="outgoing" 
            className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
          >
            Ausgangsrechnungen
          </TabsTrigger>
          <TabsTrigger 
            value="incoming" 
            className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
          >
            Eingangsrechnungen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outgoing" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Ausgangsrechnungen</CardTitle>
              <CardDescription>
                Übersicht aller Ausgangsrechnungen mit Such- und Filterfunktionen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Suchen nach Rechnungsnummer, Kunde, Projekt..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Status filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="draft">Entwurf</SelectItem>
                    <SelectItem value="sent">Versendet</SelectItem>
                    <SelectItem value="viewed">Angesehen</SelectItem>
                    <SelectItem value="paid">Bezahlt</SelectItem>
                    <SelectItem value="overdue">Überfällig</SelectItem>
                    <SelectItem value="partial">Teilzahlung</SelectItem>
                    <SelectItem value="cancelled">Storniert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Invoices Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rechnung</TableHead>
                      <TableHead>Kunde</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Fällig</TableHead>
                      <TableHead>Betrag</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>E-Rechnung</TableHead>
                      <TableHead>Zahlung</TableHead>
                      <TableHead className="w-[100px]">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{invoice.number}</p>
                            {invoice.projectName && (
                              <p className="text-sm text-gray-600">{invoice.projectName}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{invoice.recipient.name}</p>
                            {invoice.recipient.company && (
                              <p className="text-sm text-gray-600">{invoice.recipient.company}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.issueDate).toLocaleDateString('de-DE')}
                        </TableCell>
                        <TableCell>
                          <div className={`${new Date(invoice.dueDate) < new Date() && invoice.status.paymentStatus !== 'paid' ? 'text-red-600 font-medium' : ''}`}>
                            {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatCurrency(invoice.totals.totalGross, invoice.currency)}</p>
                            {invoice.totals.totalPaid > 0 && (
                              <p className="text-sm text-green-600">
                                -{formatCurrency(invoice.totals.totalPaid, invoice.currency)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(invoice.status.status)}
                        </TableCell>
                        <TableCell>
                          {getEInvoiceBadge(invoice)}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(invoice)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handlePreviewInvoice(invoice)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Vorschau
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadInvoice(invoice)}>
                                <Download className="h-4 w-4 mr-2" />
                                PDF Download
                              </DropdownMenuItem>
                              {invoice.status.status === 'draft' && (
                                <DropdownMenuItem
                                  onSelect={(event) => {
                                    if (isCloudInvoiceMode) {
                                      event.preventDefault();
                                      showCloudUnavailableToast();
                                      return;
                                    }
                                    handleSendInvoice(invoice);
                                  }}
                                  className={isCloudInvoiceMode ? 'opacity-50 cursor-not-allowed' : ''}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Versenden
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>E-Rechnung</DropdownMenuLabel>
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  if (isCloudInvoiceMode) {
                                    event.preventDefault();
                                    showCloudUnavailableToast();
                                    return;
                                  }
                                  handleGenerateEInvoice(invoice, 'xrechnung');
                                }}
                                className={isCloudInvoiceMode ? 'opacity-50 cursor-not-allowed' : ''}
                              >
                                <FileCode2 className="h-4 w-4 mr-2" />
                                XRechnung generieren
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  if (isCloudInvoiceMode) {
                                    event.preventDefault();
                                    showCloudUnavailableToast();
                                    return;
                                  }
                                  handleGenerateEInvoice(invoice, 'zugferd_comfort');
                                }}
                                className={isCloudInvoiceMode ? 'opacity-50 cursor-not-allowed' : ''}
                              >
                                <FileCode2 className="h-4 w-4 mr-2" />
                                ZUGFeRD Comfort generieren
                              </DropdownMenuItem>
                              {invoice.eInvoicing?.documents?.length ? (
                                <>
                                  <DropdownMenuItem
                                    onSelect={(event) => {
                                      if (isCloudInvoiceMode) {
                                        event.preventDefault();
                                        showCloudUnavailableToast();
                                        return;
                                      }
                                      handleValidateEInvoice(invoice);
                                    }}
                                    className={isCloudInvoiceMode ? 'opacity-50 cursor-not-allowed' : ''}
                                  >
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Validierung protokollieren
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={(event) => {
                                      if (isCloudInvoiceMode) {
                                        event.preventDefault();
                                        showCloudUnavailableToast();
                                        return;
                                      }
                                      handleDispatchEInvoice(invoice, 'peppol');
                                    }}
                                    className={isCloudInvoiceMode ? 'opacity-50 cursor-not-allowed' : ''}
                                  >
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Peppol-Versand starten
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  if (isCloudInvoiceMode) {
                                    event.preventDefault();
                                    showCloudUnavailableToast();
                                    return;
                                  }
                                  setSelectedInvoice(invoice);
                                  setShowPaymentDialog(true);
                                }}
                                className={isCloudInvoiceMode ? 'opacity-50 cursor-not-allowed' : ''}
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Zahlung erfassen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredInvoices.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Keine Rechnungen gefunden</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Versuchen Sie andere Suchkriterien' 
                      : 'Erstellen Sie Ihre erste Rechnung'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incoming" className="space-y-6">
          <IncomingInvoiceManager />
        </TabsContent>
      </Tabs>

      {/* Create Invoice Dialog */}
      <MultiWindowDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} modal={false}>
        <DialogFrame
          title="Neue Rechnung erstellen"
          description="Erstellen Sie eine neue Rechnung mit allen erforderlichen Details"
          width="fit-content"
          minWidth={900}
          maxWidth={1600}
          resizable={true}
          preventOutsideClose={true}
          defaultFullscreen
          showFullscreenToggle
        >
          <EnhancedInvoiceForm
            onSubmit={handleCreateInvoice}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogFrame>
      </MultiWindowDialog>

      {/* Payment Tracking Dialog */}
      {selectedInvoice && (
        <PaymentTrackingDialog
          invoice={selectedInvoice}
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          onPaymentAdded={handlePaymentAdded}
        />
      )}

      {/* PDF Preview Dialog */}
      <MultiWindowDialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog} modal={false}>
        <DialogFrame
          title="Rechnungsvorschau"
          width="fit-content"
          minWidth={800}
          maxWidth={1400}
          resizable={true}
          defaultFullscreen
          showFullscreenToggle
          footer={
            <div className="flex-shrink-0 border-t pt-4 mt-4 flex justify-end w-full">
              {previewUrl && (
                <Button onClick={() => {
                  const link = document.createElement('a');
                  link.href = previewUrl;
                  link.download = 'rechnung.pdf';
                  link.click();
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF Download
                </Button>
              )}
            </div>
          }
        >
          <div className="h-[70vh]">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full border rounded"
                title="Invoice Preview"
              />
            )}
          </div>
        </DialogFrame>
      </MultiWindowDialog>
    </div>
  );
};

export default InvoiceManagementDashboard;

