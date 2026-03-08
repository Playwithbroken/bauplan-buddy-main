import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Dialog,
  MultiWindowDialog,
  DialogDescription,
} from '../ui/dialog';
import { DialogFrame } from '../ui/dialog-frame';
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
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
  Euro,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Building,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Plus,
  Archive
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { DocumentNumberingService } from '../../services/documentNumberingService';
import OcrInvoiceUpload from './OcrInvoiceUpload';
import { ExtractedInvoiceData } from '../../services/invoiceOcrService';
import { featureFlags } from '@/lib/featureFlags';

export type InvoiceStatus = 'pending' | 'approved' | 'paid' | 'overdue' | 'rejected' | 'archived';

export interface IncomingInvoice {
  id: string;
  number: string;
  supplierName: string;
  supplierAddress?: string;
  supplierTaxNumber?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  currency: string;
  taxAmount?: number;
  taxRate?: number;
  subtotal?: number;
  status: InvoiceStatus;
  ocrConfidence?: number;
  description?: string;
  projectReference?: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
}

export const IncomingInvoiceManager: React.FC = () => {
  const { toast } = useToast();
  const documentNumberingService = DocumentNumberingService.getInstance();

  const [isCloudInvoiceMode, setIsCloudInvoiceMode] = useState(
    featureFlags.isEnabled('ENABLE_API_INVOICES')
  );

  useEffect(() => {
    const unsubscribe = featureFlags.subscribe((key, value) => {
      if (key === 'ENABLE_API_INVOICES') {
        setIsCloudInvoiceMode(value);
      }
    });
    return unsubscribe;
  }, [toast]);

  const showCloudUnavailableToast = useCallback(() => {
    toast({
      title: 'Bald verfuegbar',
      description: 'Verarbeitung eingehender Cloud-Rechnungen ist noch nicht unterstuetzt. Diese Funktionen folgen demnaechst.',
    });
  }, [toast]);

  // State management
  const [invoices, setInvoices] = useState<IncomingInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<IncomingInvoice[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<IncomingInvoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<IncomingInvoice | null>(null);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');

  // Mock data
  const [mockInvoices] = useState<IncomingInvoice[]>([
    {
      id: 'INV-2024-001',
      number: 'ER-2024-000001',
      supplierName: 'Baustoff-Center München GmbH',
      supplierAddress: 'Industriestraße 15, 80339 München',
      supplierTaxNumber: 'DE123456789',
      invoiceNumber: 'BC-2024-001234',
      invoiceDate: '2024-01-15',
      dueDate: '2024-02-14',
      totalAmount: 2847.50,
      currency: 'EUR',
      taxAmount: 455.50,
      taxRate: 19,
      subtotal: 2392.00,
      status: 'pending',
      ocrConfidence: 0.92,
      description: 'Baumaterialien für Projekt München-Ost',
      projectReference: 'PRJ-2024-001',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'INV-2024-002',
      number: 'ER-2024-000002',
      supplierName: 'Elektro-Schmidt Berlin',
      invoiceNumber: 'ES-2024-567',
      invoiceDate: '2024-01-20',
      dueDate: '2024-02-19',
      totalAmount: 1234.56,
      currency: 'EUR',
      status: 'approved',
      ocrConfidence: 0.87,
      createdAt: '2024-01-20T14:15:00Z',
      updatedAt: '2024-01-22T09:00:00Z',
      approvedBy: 'M. Weber',
      approvedAt: '2024-01-22T09:00:00Z'
    },
    {
      id: 'INV-2024-003',
      number: 'ER-2024-000003',
      supplierName: 'Sanitär-Profi Hamburg',
      invoiceNumber: 'SP-2024-789',
      invoiceDate: '2024-01-10',
      dueDate: '2024-02-09',
      totalAmount: 567.89,
      currency: 'EUR',
      status: 'overdue',
      ocrConfidence: 0.95,
      createdAt: '2024-01-10T16:45:00Z',
      updatedAt: '2024-01-10T16:45:00Z'
    }
  ]);

  // Initialize with mock data
  useEffect(() => {
    setInvoices(mockInvoices);
    setFilteredInvoices(mockInvoices);
  }, [mockInvoices]);

  // Filter and search logic
  useEffect(() => {
    let filtered = [...invoices];

    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter]);

  // Calculate statistics
  const statistics = {
    total: invoices.length,
    pending: invoices.filter(inv => inv.status === 'pending').length,
    approved: invoices.filter(inv => inv.status === 'approved').length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  };

  // Handle OCR data extraction
  const handleOcrDataExtracted = useCallback(async (data: ExtractedInvoiceData) => {
    if (isCloudInvoiceMode) {
      showCloudUnavailableToast();
      return;
    }
    try {
      const generatedNumber = documentNumberingService.generateNumber('incoming_invoice');
      
      const newInvoice: IncomingInvoice = {
        id: `INV-${Date.now()}`,
        number: generatedNumber.number,
        supplierName: data.supplierName || 'Unbekannter Lieferant',
        supplierAddress: data.supplierAddress,
        supplierTaxNumber: data.supplierTaxNumber,
        invoiceNumber: data.invoiceNumber || 'Unbekannt',
        invoiceDate: data.invoiceDate || new Date().toISOString().split('T')[0],
        dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalAmount: data.totalAmount || 0,
        currency: data.currency || 'EUR',
        taxAmount: data.taxAmount,
        taxRate: data.taxRate,
        subtotal: data.subtotal,
        status: 'pending',
        ocrConfidence: data.confidence,
        description: data.description,
        projectReference: data.projectReference,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setInvoices(prev => [newInvoice, ...prev]);
      setShowUploadDialog(false);

      toast({
        title: "Rechnung verarbeitet",
        description: `Rechnung ${newInvoice.number} wurde erfolgreich erstellt.`,
      });

    } catch (error) {
      console.error('Error processing OCR data:', error);
      toast({
        title: "Fehler",
        description: "Die Rechnung konnte nicht verarbeitet werden.",
        variant: "destructive"
      });
    }
  }, [documentNumberingService, isCloudInvoiceMode, showCloudUnavailableToast, toast]);

  // Handle status updates
  const handleStatusUpdate = useCallback(async (invoiceId: string, newStatus: InvoiceStatus) => {
    if (isCloudInvoiceMode) {
      showCloudUnavailableToast();
      return;
    }
    setInvoices(prev => prev.map(invoice => {
      if (invoice.id === invoiceId) {
        const updates: Partial<IncomingInvoice> = {
          status: newStatus,
          updatedAt: new Date().toISOString()
        };

        if (newStatus === 'approved') {
          updates.approvedBy = 'Current User';
          updates.approvedAt = new Date().toISOString();
        } else if (newStatus === 'paid') {
          updates.paidAt = new Date().toISOString();
        }

        return { ...invoice, ...updates };
      }
      return invoice;
    }));

    toast({
      title: "Status aktualisiert",
      description: `Rechnung wurde als ${newStatus} markiert.`,
    });
  }, [isCloudInvoiceMode, showCloudUnavailableToast, toast]);

  // Get status badge variant and icon
  const getStatusBadgeVariant = (status: InvoiceStatus) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'outline';
      case 'paid': return 'default';
      case 'overdue': return 'destructive';
      case 'rejected': return 'destructive';
      case 'archived': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'paid': return <DollarSign className="h-3 w-3" />;
      case 'overdue': return <AlertTriangle className="h-3 w-3" />;
      case 'rejected': return <AlertCircle className="h-3 w-3" />;
      case 'archived': return <Archive className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Eingangsrechnungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie eingehende Lieferantenrechnungen mit OCR-Verarbeitung
          </p>
        </div>
        <Button
          onClick={() => {
            if (isCloudInvoiceMode) {
              showCloudUnavailableToast();
              return;
            }
            setShowUploadDialog(true);
          }}
          className={isCloudInvoiceMode ? 'opacity-50 cursor-not-allowed' : ''}
        >
          <Plus className="h-4 w-4 mr-2" />
          Rechnung hinzufügen
        </Button>
      </div>

      {isCloudInvoiceMode && (
        <Alert>
          <AlertDescription>
            Eingangsrechnungen lassen sich im Cloud-Modus derzeit nur anzeigen. Bearbeitung und Upload folgen demnaechst.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{statistics.total}</p>
                <p className="text-xs text-muted-foreground">Gesamt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{statistics.pending}</p>
                <p className="text-xs text-muted-foreground">Ausstehend</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{statistics.approved}</p>
                <p className="text-xs text-muted-foreground">Genehmigt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{statistics.paid}</p>
                <p className="text-xs text-muted-foreground">Bezahlt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{statistics.overdue}</p>
                <p className="text-xs text-muted-foreground">Überfällig</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suche nach Lieferant, Rechnungsnummer, Beschreibung..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={(value: InvoiceStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="approved">Genehmigt</SelectItem>
                <SelectItem value="paid">Bezahlt</SelectItem>
                <SelectItem value="overdue">Überfällig</SelectItem>
                <SelectItem value="rejected">Abgelehnt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rechnungen ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Rechnungen gefunden</p>
              <p className="text-sm">Laden Sie eine neue Rechnung hoch oder ändern Sie die Filterkriterien</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nummer</TableHead>
                  <TableHead>Lieferant</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>OCR</TableHead>
                  <TableHead className="w-32">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.number}</div>
                        <div className="text-sm text-muted-foreground">{invoice.invoiceNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.supplierName}</div>
                        {invoice.projectReference && (
                          <div className="text-sm text-muted-foreground">{invoice.projectReference}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{new Date(invoice.invoiceDate).toLocaleDateString('de-DE')}</div>
                        <div className="text-sm text-muted-foreground">
                          Fällig: {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        €{invoice.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-muted-foreground">{invoice.currency}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.status)} className="flex items-center gap-1 w-fit">
                        {getStatusIcon(invoice.status)}
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invoice.ocrConfidence && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(invoice.ocrConfidence * 100)}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setViewingInvoice(invoice);
                            setShowDetailsDialog(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Anzeigen
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={(event) => {
                              if (isCloudInvoiceMode) {
                                event.preventDefault();
                                showCloudUnavailableToast();
                                return;
                              }
                              setEditingInvoice(invoice);
                              setShowEditDialog(true);
                            }}
                            className={isCloudInvoiceMode ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {invoice.status === 'pending' && (
                            <DropdownMenuItem
                              onSelect={(event) => {
                                if (isCloudInvoiceMode) {
                                  event.preventDefault();
                                  showCloudUnavailableToast();
                                  return;
                                }
                                handleStatusUpdate(invoice.id, 'approved');
                              }}
                              className={isCloudInvoiceMode ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Genehmigen
                            </DropdownMenuItem>
                          )}
                          {invoice.status === 'approved' && (
                            <DropdownMenuItem
                              onSelect={(event) => {
                                if (isCloudInvoiceMode) {
                                  event.preventDefault();
                                  showCloudUnavailableToast();
                                  return;
                                }
                                handleStatusUpdate(invoice.id, 'paid');
                              }}
                              className={isCloudInvoiceMode ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Als bezahlt markieren
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={(event) => {
                              if (isCloudInvoiceMode) {
                                event.preventDefault();
                                showCloudUnavailableToast();
                                return;
                              }
                              setInvoices(prev => prev.filter(inv => inv.id !== invoice.id));
                            }}
                            className={isCloudInvoiceMode ? 'opacity-50 cursor-not-allowed text-red-600' : 'text-red-600'}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <MultiWindowDialog open={showUploadDialog} onOpenChange={setShowUploadDialog} modal={false}>
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Neue Rechnung hinzufügen
            </span>
          }
          description={
            <DialogDescription>
              Laden Sie eine PDF-Rechnung hoch oder geben Sie die Daten manuell ein
            </DialogDescription>
          }
          width="fit-content"
          minWidth={900}
          maxWidth={1600}
          resizable={true}
          preventOutsideClose={true}
        >
          <OcrInvoiceUpload
            onDataExtracted={handleOcrDataExtracted}
            onCancel={() => setShowUploadDialog(false)}
          />
        </DialogFrame>
      </MultiWindowDialog>

      {/* Edit Dialog */}
      <MultiWindowDialog open={showEditDialog} onOpenChange={setShowEditDialog} modal={false}>
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Rechnung bearbeiten
            </span>
          }
          width="fit-content"
          minWidth={600}
          maxWidth={1200}
          resizable={true}
          preventOutsideClose={true}
          footer={
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>Abbrechen</Button>
              <Button
                onClick={() => {
                  if (isCloudInvoiceMode) {
                    showCloudUnavailableToast();
                    return;
                  }
                  if (editingInvoice) {
                    setInvoices(prev => prev.map(inv => 
                      inv.id === editingInvoice.id ? { ...editingInvoice, updatedAt: new Date().toISOString() } : inv
                    ));
                    setShowEditDialog(false);
                    setEditingInvoice(null);
                    toast({ title: "Rechnung aktualisiert", description: "Die Aenderungen wurden gespeichert." });
                  }
                }}
                disabled={isCloudInvoiceMode}
              >
                Speichern
              </Button>
            </div>
          }
        >
          {editingInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lieferant</Label>
                  <Input
                    value={editingInvoice.supplierName}
                    onChange={(e) => setEditingInvoice(prev => prev ? {...prev, supplierName: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rechnungsnummer</Label>
                  <Input
                    value={editingInvoice.invoiceNumber}
                    onChange={(e) => setEditingInvoice(prev => prev ? {...prev, invoiceNumber: e.target.value} : null)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Gesamtbetrag</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingInvoice.totalAmount}
                  onChange={(e) => setEditingInvoice(prev => prev ? {...prev, totalAmount: parseFloat(e.target.value)} : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Textarea
                  value={editingInvoice.description || ''}
                  onChange={(e) => setEditingInvoice(prev => prev ? {...prev, description: e.target.value} : null)}
                />
              </div>
            </div>
          )}
        </DialogFrame>
      </MultiWindowDialog>

      {/* Details Dialog */}
      <MultiWindowDialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog} modal={false}>
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Rechnungsdetails
            </span>
          }
          width="fit-content"
          minWidth={800}
          maxWidth={1400}
          resizable={true}
          defaultFullscreen={false}
          footer={
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>Schließen</Button>
          }
        >
          {viewingInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Lieferant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {viewingInvoice.supplierName}</div>
                    {viewingInvoice.supplierAddress && (
                      <div><strong>Adresse:</strong> {viewingInvoice.supplierAddress}</div>
                    )}
                    {viewingInvoice.supplierTaxNumber && (
                      <div><strong>Steuernummer:</strong> {viewingInvoice.supplierTaxNumber}</div>
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
                    <div><strong>Nummer:</strong> {viewingInvoice.invoiceNumber}</div>
                    <div><strong>Datum:</strong> {new Date(viewingInvoice.invoiceDate).toLocaleDateString('de-DE')}</div>
                    <div><strong>Fällig:</strong> {new Date(viewingInvoice.dueDate).toLocaleDateString('de-DE')}</div>
                    <div><strong>Status:</strong> 
                      <Badge variant={getStatusBadgeVariant(viewingInvoice.status)} className="ml-2">
                        {viewingInvoice.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Finanzielle Zusammenfassung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {viewingInvoice.subtotal && (
                      <div>
                        <div className="text-muted-foreground">Netto</div>
                        <div className="font-semibold">€{viewingInvoice.subtotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</div>
                      </div>
                    )}
                    {viewingInvoice.taxAmount && (
                      <div>
                        <div className="text-muted-foreground">MwSt ({viewingInvoice.taxRate || 0}%)</div>
                        <div className="font-semibold">€{viewingInvoice.taxAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-muted-foreground">Gesamt</div>
                      <div className="font-bold text-lg">€{viewingInvoice.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Währung</div>
                      <div className="font-semibold">{viewingInvoice.currency}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogFrame>
      </MultiWindowDialog>
    </div>
  );
};

export default IncomingInvoiceManager;