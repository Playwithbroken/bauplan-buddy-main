import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Dialog,
  MultiWindowDialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Plus,
  Edit,
  Copy,
  Trash2,
  Calendar,
  MoreHorizontal,
  Clock,
  Repeat,
  Building,
  Wrench,
  CheckCircle
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { DocumentNumberingService } from '../../services/documentNumberingService';

export type RecurrenceFrequency = 'monthly' | 'quarterly' | 'yearly';
export type TemplateCategory = 'construction' | 'maintenance' | 'consultation' | 'materials';

export interface InvoicePosition {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  positions: InvoicePosition[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentTerms: number;
  isActive: boolean;
  createdAt: string;
  usageCount: number;
}

export interface RecurringInvoice {
  id: string;
  templateId: string;
  templateName: string;
  customerName: string;
  customerEmail: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  nextInvoiceDate: string;
  isActive: boolean;
  invoicesGenerated: number;
  totalAmount: number;
}

export const InvoiceTemplateManager: React.FC = () => {
  const { toast } = useToast();
  const documentNumberingService = DocumentNumberingService.getInstance();

  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [currentView, setCurrentView] = useState<'templates' | 'recurring'>('templates');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);

  const [mockTemplates] = useState<InvoiceTemplate[]>([
    {
      id: 'tpl-construction-001',
      name: 'Neubau Einfamilienhaus - Grundpaket',
      description: 'Standardvorlage für Neubau-Projekte',
      category: 'construction',
      positions: [
        {
          id: 'pos-1',
          description: 'Planung und Projektmanagement',
          quantity: 1,
          unit: 'Pauschal',
          unitPrice: 5000.00,
          totalPrice: 5000.00,
          taxRate: 19
        },
        {
          id: 'pos-2',
          description: 'Rohbauarbeiten',
          quantity: 120,
          unit: 'm²',
          unitPrice: 85.00,
          totalPrice: 10200.00,
          taxRate: 19
        }
      ],
      subtotal: 15200.00,
      taxAmount: 2888.00,
      totalAmount: 18088.00,
      paymentTerms: 30,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      usageCount: 15
    },
    {
      id: 'tpl-maintenance-001',
      name: 'Wartung Heizungsanlage',
      description: 'Regelmäßige Wartung von Heizungsanlagen',
      category: 'maintenance',
      positions: [
        {
          id: 'pos-1',
          description: 'Inspektion Heizungsanlage',
          quantity: 1,
          unit: 'Std',
          unitPrice: 95.00,
          totalPrice: 95.00,
          taxRate: 19
        },
        {
          id: 'pos-2',
          description: 'Reinigung Brenner',
          quantity: 1,
          unit: 'Pauschal',
          unitPrice: 150.00,
          totalPrice: 150.00,
          taxRate: 19
        }
      ],
      subtotal: 245.00,
      taxAmount: 46.55,
      totalAmount: 291.55,
      paymentTerms: 14,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      usageCount: 28
    }
  ]);

  useEffect(() => {
    setTemplates(mockTemplates);
    setRecurringInvoices([
      {
        id: 'rec-001',
        templateId: 'tpl-maintenance-001',
        templateName: 'Wartung Heizungsanlage',
        customerName: 'Müller Immobilien GmbH',
        customerEmail: 'service@mueller-immo.de',
        frequency: 'quarterly',
        startDate: '2024-01-01',
        nextInvoiceDate: '2024-04-01',
        isActive: true,
        invoicesGenerated: 1,
        totalAmount: 291.55
      }
    ]);
  }, [mockTemplates]);

  const generateInvoiceFromTemplate = useCallback(async (template: InvoiceTemplate) => {
    try {
      const generatedNumber = documentNumberingService.generateNumber('invoice');
      toast({
        title: "Rechnung erstellt",
        description: `Rechnung ${generatedNumber.number} wurde aus Vorlage "${template.name}" erstellt.`,
      });
      setTemplates(prev => prev.map(t => 
        t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
      ));
    } catch (error) {
      toast({ title: "Fehler", description: "Rechnung konnte nicht erstellt werden.", variant: "destructive" });
    }
  }, [documentNumberingService, toast]);

  const getCategoryIcon = (category: TemplateCategory) => {
    switch (category) {
      case 'construction': return <Building className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFrequencyBadge = (frequency: RecurrenceFrequency) => {
    const labels = { monthly: 'Monatlich', quarterly: 'Quartalsweise', yearly: 'Jährlich' };
    return labels[frequency];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rechnungsvorlagen</h1>
          <p className="text-muted-foreground">Verwalten Sie Vorlagen und wiederkehrende Rechnungen</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={currentView} onValueChange={(value: 'templates' | 'recurring') => setCurrentView(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="templates">Vorlagen</SelectItem>
              <SelectItem value="recurring">Wiederkehrend</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => {
            if (currentView === 'templates') {
              setShowTemplateDialog(true);
            } else {
              setShowRecurringDialog(true);
            }
          }}>
            <Plus className="h-4 w-4 mr-2" />
            {currentView === 'templates' ? 'Vorlage erstellen' : 'Wiederkehrende Rechnung'}
          </Button>
        </div>
      </div>

      {currentView === 'templates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Gesamt</p>
                    <p className="text-2xl font-bold">{templates.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Aktiv</p>
                    <p className="text-2xl font-bold">{templates.filter(t => t.isActive).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Bauprojekte</p>
                    <p className="text-2xl font-bold">{templates.filter(t => t.category === 'construction').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Wartung</p>
                    <p className="text-2xl font-bold">{templates.filter(t => t.category === 'maintenance').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Vorlagen ({templates.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                    <TableHead>Verwendungen</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          {template.description && (
                            <div className="text-sm text-muted-foreground">{template.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {getCategoryIcon(template.category)}
                          {template.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          €{template.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-muted-foreground">{template.positions.length} Positionen</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{template.usageCount}x</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? 'default' : 'secondary'}>
                          {template.isActive ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => generateInvoiceFromTemplate(template)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Rechnung erstellen
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const duplicate = {
                                ...template,
                                id: `tpl-${Date.now()}`,
                                name: `${template.name} (Kopie)`,
                                createdAt: new Date().toISOString(),
                                usageCount: 0
                              };
                              setTemplates(prev => [...prev, duplicate]);
                              toast({ title: "Vorlage dupliziert" });
                            }}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplizieren
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setTemplates(prev => prev.filter(t => t.id !== template.id));
                                toast({ title: "Vorlage gelöscht" });
                              }}
                              className="text-red-600"
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
            </CardContent>
          </Card>
        </div>
      )}

      {currentView === 'recurring' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Repeat className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Gesamt</p>
                    <p className="text-2xl font-bold">{recurringInvoices.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Aktiv</p>
                    <p className="text-2xl font-bold">{recurringInvoices.filter(r => r.isActive).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Nächste Woche</p>
                    <p className="text-2xl font-bold">
                      {recurringInvoices.filter(r => {
                        const nextWeek = new Date();
                        nextWeek.setDate(nextWeek.getDate() + 7);
                        return new Date(r.nextInvoiceDate) <= nextWeek;
                      }).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Erstellt</p>
                    <p className="text-2xl font-bold">{recurringInvoices.reduce((sum, r) => sum + r.invoicesGenerated, 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Wiederkehrende Rechnungen ({recurringInvoices.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Vorlage</TableHead>
                    <TableHead>Häufigkeit</TableHead>
                    <TableHead>Nächste Rechnung</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurringInvoices.map((recurring) => (
                    <TableRow key={recurring.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{recurring.customerName}</div>
                          <div className="text-sm text-muted-foreground">{recurring.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{recurring.templateName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getFrequencyBadge(recurring.frequency)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(recurring.nextInvoiceDate).toLocaleDateString('de-DE')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          €{recurring.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-muted-foreground">{recurring.invoicesGenerated} erstellt</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={recurring.isActive ? 'default' : 'secondary'}>
                          {recurring.isActive ? 'Aktiv' : 'Pausiert'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <FileText className="h-4 w-4 mr-2" />
                              Jetzt erstellen
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Clock className="h-4 w-4 mr-2" />
                              {recurring.isActive ? 'Pausieren' : 'Aktivieren'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Simple Template Creation Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Neue Vorlage erstellen</DialogTitle>
            <DialogDescription>Erstellen Sie eine Vorlage für wiederkehrende Rechnungen</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name der Vorlage</Label>
              <Input placeholder="z.B. Wartung Heizungsanlage" />
            </div>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="construction">Bauprojekt</SelectItem>
                  <SelectItem value="maintenance">Wartung</SelectItem>
                  <SelectItem value="consultation">Beratung</SelectItem>
                  <SelectItem value="materials">Materialien</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Abbrechen</Button>
            <Button onClick={() => {
              setShowTemplateDialog(false);
              toast({ title: "Vorlage erstellt", description: "Die Vorlage wurde erfolgreich erstellt." });
            }}>Erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simple Recurring Invoice Dialog */}
      <MultiWindowDialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog} modal={false}>
        <DialogFrame
          title="Wiederkehrende Rechnung erstellen"
          description="Richten Sie automatische Rechnungserstellung ein"
          width="fit-content"
          minWidth={640}
          maxWidth={1024}
          resizable={true}
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setShowRecurringDialog(false)}>Abbrechen</Button>
              <Button onClick={() => {
                setShowRecurringDialog(false);
                toast({ title: "Wiederkehrende Rechnung erstellt", description: "Die wiederkehrende Rechnung wurde eingerichtet." });
              }}>Erstellen</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vorlage auswählen</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie eine Vorlage" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.isActive).map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - €{template.totalAmount.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kunde</Label>
                <Input placeholder="Firmenname" />
              </div>
              <div className="space-y-2">
                <Label>E-Mail</Label>
                <Input type="email" placeholder="kunde@firma.de" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Häufigkeit</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Häufigkeit wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                    <SelectItem value="quarterly">Quartalsweise</SelectItem>
                    <SelectItem value="yearly">Jährlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Startdatum</Label>
                <Input type="date" />
              </div>
            </div>
          </div>
        </DialogFrame>
      </MultiWindowDialog>
    </div>
  );
};

export default InvoiceTemplateManager;