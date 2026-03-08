import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Search,
  MoreHorizontal,
  Edit,
  Send,
  Mail,
  Bell,
  TrendingUp,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'partial';
export type ReminderType = 'due_soon' | 'overdue' | 'final_notice';

export interface Invoice {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string;
  projectName?: string;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  createdAt: string;
  sentAt?: string;
  dueDate: string;
  paidAt?: string;
  remindersSent: number;
  overdueDays?: number;
}

export const InvoiceStatusManager: React.FC = () => {
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [currentView, setCurrentView] = useState<'dashboard' | 'table'>('dashboard');

  const [mockInvoices] = useState<Invoice[]>([
    {
      id: 'INV-2024-001',
      number: 'AR-2024-000001',
      customerName: 'Mueller Bau GmbH',
      customerEmail: 'office@mueller-bau.de',
      projectName: 'Neubau Einfamilienhaus',
      totalAmount: 15750.00,
      currency: 'EUR',
      status: 'sent',
      createdAt: '2024-01-15T10:30:00Z',
      sentAt: '2024-01-15T14:00:00Z',
      dueDate: '2024-02-14',
      remindersSent: 0
    },
    {
      id: 'INV-2024-002',
      number: 'AR-2024-000002',
      customerName: 'Schmidt Immobilien',
      customerEmail: 'info@schmidt-immo.de',
      totalAmount: 8420.50,
      currency: 'EUR',
      status: 'overdue',
      createdAt: '2024-01-05T11:15:00Z',
      sentAt: '2024-01-05T16:30:00Z',
      dueDate: '2024-02-04',
      remindersSent: 2,
      overdueDays: 7
    },
    {
      id: 'INV-2024-003',
      number: 'AR-2024-000003',
      customerName: 'Becker Renovierungen',
      customerEmail: 'kontakt@becker-reno.de',
      projectName: 'Badezimmer Renovierung',
      totalAmount: 4230.00,
      currency: 'EUR',
      status: 'paid',
      createdAt: '2024-01-10T09:45:00Z',
      sentAt: '2024-01-10T10:00:00Z',
      paidAt: '2024-01-25T14:20:00Z',
      dueDate: '2024-02-09',
      remindersSent: 1
    }
  ]);

  const processAutomatedWorkflows = useCallback(() => {
    const today = new Date();
    setInvoices(prev => prev.map(invoice => {
      const updated = { ...invoice };
      const dueDate = new Date(invoice.dueDate);
      if (dueDate < today && invoice.status === 'sent') {
        updated.status = 'overdue';
        updated.overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      return updated;
    }));
  }, []);

  useEffect(() => {
    setInvoices(mockInvoices);
    setFilteredInvoices(mockInvoices);
    processAutomatedWorkflows();
  }, [mockInvoices, processAutomatedWorkflows]);

  useEffect(() => {
    let filtered = [...invoices];
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }
    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter]);


  const statistics = {
    total: invoices.length,
    sent: invoices.filter(inv => inv.status === 'sent').length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    paidAmount: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.totalAmount, 0),
    overdueAmount: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.totalAmount, 0)
  };

  const handleStatusUpdate = useCallback(async (invoiceId: string, newStatus: InvoiceStatus) => {
    setInvoices(prev => prev.map(invoice => {
      if (invoice.id === invoiceId) {
        const updates: Partial<Invoice> = { status: newStatus };
        const now = new Date().toISOString();
        if (newStatus === 'sent') updates.sentAt = now;
        if (newStatus === 'paid') updates.paidAt = now;
        return { ...invoice, ...updates };
      }
      return invoice;
    }));
    toast({ title: "Status aktualisiert", description: `Rechnung wurde als ${newStatus} markiert.` });
  }, [toast]);

  const handleSendReminder = useCallback(async (invoiceId: string, type: ReminderType) => {
    setInvoices(prev => prev.map(invoice => {
      if (invoice.id === invoiceId) {
        return { ...invoice, remindersSent: invoice.remindersSent + 1 };
      }
      return invoice;
    }));
    toast({ title: "Erinnerung gesendet", description: `${type} Erinnerung wurde versendet.` });
  }, [toast]);

  const getStatusBadgeVariant = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'sent': return 'outline';
      case 'paid': return 'default';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft': return <Edit className="h-3 w-3" />;
      case 'sent': return <Send className="h-3 w-3" />;
      case 'paid': return <CheckCircle className="h-3 w-3" />;
      case 'overdue': return <AlertTriangle className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rechnungsstatus</h1>
          <p className="text-muted-foreground">Verwalten Sie Rechnungsstatus und automatisierte Workflows</p>
        </div>
        <Select value={currentView} onValueChange={(value: 'dashboard' | 'table') => setCurrentView(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dashboard">Dashboard</SelectItem>
            <SelectItem value="table">Tabelle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {currentView === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Gesamt</p>
                    <p className="text-2xl font-bold">{statistics.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Send className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Versendet</p>
                    <p className="text-2xl font-bold">{statistics.sent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Bezahlt</p>
                    <p className="text-2xl font-bold">{statistics.paid}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">berfllig</p>
                    <p className="text-2xl font-bold">{statistics.overdue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Gesamtsumme</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{statistics.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Bezahlt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{statistics.paidAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">berfllig</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{statistics.overdueAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Schnellaktionen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" onClick={() => setShowReminderDialog(true)}>
                  <Bell className="h-6 w-6" />
                  <span>Erinnerungen verwalten</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <BarChart3 className="h-6 w-6" />
                  <span>Analysen anzeigen</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" onClick={processAutomatedWorkflows}>
                  <RefreshCw className="h-6 w-6" />
                  <span>Workflows ausfhren</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentView === 'table' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Suche nach Kunde, Rechnungsnummer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={(value: InvoiceStatus | 'all') => setStatusFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="draft">Entwurf</SelectItem>
                    <SelectItem value="sent">Versendet</SelectItem>
                    <SelectItem value="paid">Bezahlt</SelectItem>
                    <SelectItem value="overdue">berfllig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rechnungen ({filteredInvoices.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nummer</TableHead>
                    <TableHead>Kunde</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fllig</TableHead>
                    <TableHead>Erinnerungen</TableHead>
                    <TableHead className="w-32">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="font-medium">{invoice.number}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.customerName}</div>
                          <div className="text-sm text-muted-foreground">{invoice.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{invoice.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invoice.status)} className="flex items-center gap-1 w-fit">
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </Badge>
                        {invoice.overdueDays && (
                          <div className="text-xs text-red-600 mt-1">{invoice.overdueDays} Tage berfllig</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{new Date(invoice.dueDate).toLocaleDateString('de-DE')}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{invoice.remindersSent}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />Details</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {invoice.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(invoice.id, 'sent')}>
                                <Send className="h-4 w-4 mr-2" />Senden
                              </DropdownMenuItem>
                            )}
                            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                              <DropdownMenuItem onClick={() => handleStatusUpdate(invoice.id, 'paid')}>
                                <CheckCircle className="h-4 w-4 mr-2" />Als bezahlt markieren
                              </DropdownMenuItem>
                            )}
                            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                              <DropdownMenuItem onClick={() => handleSendReminder(invoice.id, 'overdue')}>
                                <Mail className="h-4 w-4 mr-2" />Erinnerung senden
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Erinnerungsmanagement</DialogTitle>
            <DialogDescription>bersicht ber Erinnerungen und automatische Workflows</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium"> Zahlungszeit</p>
                      <p className="text-2xl font-bold">12 Tage</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Erfolgsrate</p>
                      <p className="text-2xl font-bold">75%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">berfllige</p>
                      <p className="text-2xl font-bold">{statistics.overdue}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-3">Automatische Workflows</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Automatische berflligkeit</p>
                    <p className="text-sm text-muted-foreground">Markiert Rechnungen automatisch als berfllig</p>
                  </div>
                  <Badge variant="default">Aktiv</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Zahlungserinnerung</p>
                    <p className="text-sm text-muted-foreground">Sendet Erinnerung 7 Tage vor Flligkeit</p>
                  </div>
                  <Badge variant="default">Aktiv</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Mahnverfahren</p>
                    <p className="text-sm text-muted-foreground">Startet nach 14 Tagen Ueberfaelligkeit</p>
                  </div>
                  <Badge variant="default">Aktiv</Badge>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReminderDialog(false)}>Schliessen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

};

export default InvoiceStatusManager;




