import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
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
  Plus,
  Trash2,
  Edit3,
  Copy,
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Calculator,
  Euro,
  Calendar,
  Save,
  Send,
  FileText,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { DocumentNumberingService } from '../../services/documentNumberingService';
import { useToast } from '../../hooks/use-toast';
import PositionEditDialog from '../dialogs/PositionEditDialog';

export interface Customer {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  address: string;
  taxNumber?: string;
}

export interface Project {
  id: string;
  name: string;
  address: string;
  description?: string;
  customerId: string;
}

export interface InvoicePosition {
  id: string;
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  taxRate: number;
  discount?: number;
  category: string;
  notes?: string;
}

export interface InvoiceFormData {
  id?: string;
  number: string;
  customer: Customer | null;
  project: Project | null;
  invoiceDate: string;
  dueDate: string;
  serviceDate?: string;
  positions: InvoicePosition[];
  taxRate: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  terms: string;
  notes?: string;
  paymentTerms: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
}

export interface InvoiceSummary {
  subtotal: number;
  discountAmount: number;
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
}

interface InvoiceCreationFormProps {
  initialData?: Partial<InvoiceFormData>;
  onSave: (data: InvoiceFormData, summary: InvoiceSummary) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

// Mock customers data
const mockCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Familie Müller',
    email: 'mueller@email.com',
    phone: '+49 89 123456',
    address: 'Musterstraße 12, 80331 München',
    taxNumber: 'DE123456789'
  },
  {
    id: 'CUST-002',
    name: 'TechCorp GmbH',
    company: 'TechCorp GmbH',
    email: 'schmidt@techcorp.de',
    phone: '+49 30 987654',
    address: 'Alexanderplatz 5, 10178 Berlin',
    taxNumber: 'DE987654321'
  },
  {
    id: 'CUST-003',
    name: 'Hausverwaltung Nord',
    company: 'Hausverwaltung Nord GmbH',
    email: 'weber@hausverwaltung-nord.de',
    phone: '+49 40 555123',
    address: 'Hafenstraße 88, 20359 Hamburg',
    taxNumber: 'DE555666777'
  }
];

// Mock projects data
const mockProjects: Project[] = [
  {
    id: 'PRJ-2024-001',
    name: 'Wohnhaus München',
    address: 'Musterstraße 12, 80331 München',
    customerId: 'CUST-001',
    description: 'Neubau Einfamilienhaus'
  },
  {
    id: 'PRJ-2024-002',
    name: 'Bürogebäude Berlin',
    address: 'Alexanderplatz 5, 10178 Berlin',
    customerId: 'CUST-002',
    description: '3-stöckiges Bürogebäude'
  },
  {
    id: 'PRJ-2024-003',
    name: 'Dachsanierung Hamburg',
    address: 'Hafenstraße 88, 20359 Hamburg',
    customerId: 'CUST-003',
    description: 'Komplette Dachsanierung'
  }
];

// Position categories
const positionCategories = [
  'construction', 'materials', 'labor', 'equipment', 'planning', 'other'
];

// Payment terms
const paymentTermsOptions = [
  { value: '14', label: '14 Tage netto' },
  { value: '30', label: '30 Tage netto' },
  { value: '60', label: '60 Tage netto' },
  { value: 'immediate', label: 'Sofort fällig' },
  { value: 'custom', label: 'Benutzerdefiniert' }
];

export const InvoiceCreationForm: React.FC<InvoiceCreationFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const { toast } = useToast();
  const documentNumberingService = DocumentNumberingService.getInstance();

  // Form state
  const [formData, setFormData] = useState<InvoiceFormData>(() => {
    const defaultDate = new Date().toISOString().split('T')[0];
    const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return {
      id: initialData?.id,
      number: initialData?.number || documentNumberingService.previewNextNumber('invoice').number,
      customer: initialData?.customer || null,
      project: initialData?.project || null,
      invoiceDate: initialData?.invoiceDate || defaultDate,
      dueDate: initialData?.dueDate || defaultDueDate,
      serviceDate: initialData?.serviceDate,
      positions: initialData?.positions || [],
      taxRate: initialData?.taxRate || 19,
      discountType: initialData?.discountType || 'percentage',
      discountValue: initialData?.discountValue || 0,
      terms: initialData?.terms || 'Zahlbar innerhalb von 30 Tagen nach Rechnungsdatum ohne Abzug.',
      notes: initialData?.notes || '',
      paymentTerms: initialData?.paymentTerms || '30',
      status: initialData?.status || 'draft'
    };
  });

  const [editingPosition, setEditingPosition] = useState<InvoicePosition | null>(null);
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Auto-update due date when payment terms change
  useEffect(() => {
    if (formData.paymentTerms && formData.paymentTerms !== 'custom' && formData.paymentTerms !== 'immediate') {
      const days = parseInt(formData.paymentTerms);
      const dueDate = new Date(formData.invoiceDate);
      dueDate.setDate(dueDate.getDate() + days);
      setFormData(prev => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0]
      }));
    } else if (formData.paymentTerms === 'immediate') {
      setFormData(prev => ({
        ...prev,
        dueDate: prev.invoiceDate
      }));
    }
  }, [formData.paymentTerms, formData.invoiceDate]);

  // Calculate invoice summary
  const calculateSummary = (): InvoiceSummary => {
    const subtotal = formData.positions.reduce((sum, pos) => {
      const positionTotal = pos.quantity * pos.unitPrice;
      const discountAmount = pos.discount ? (positionTotal * pos.discount / 100) : 0;
      return sum + (positionTotal - discountAmount);
    }, 0);

    let discountAmount = 0;
    if (formData.discountValue > 0) {
      discountAmount = formData.discountType === 'percentage' 
        ? subtotal * formData.discountValue / 100
        : formData.discountValue;
    }

    const netAmount = subtotal - discountAmount;
    const taxAmount = netAmount * formData.taxRate / 100;
    const grossAmount = netAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      netAmount,
      taxAmount,
      grossAmount
    };
  };

  const summary = calculateSummary();

  // Get available projects for selected customer
  const availableProjects = formData.customer 
    ? mockProjects.filter(project => project.customerId === formData.customer!.id)
    : [];

  // Handle customer selection
  const handleCustomerChange = (customerId: string) => {
    const customer = mockCustomers.find(c => c.id === customerId) || null;
    setFormData(prev => ({
      ...prev,
      customer,
      project: null // Reset project when customer changes
    }));
  };

  // Handle project selection
  const handleProjectChange = (projectId: string) => {
    const project = availableProjects.find(p => p.id === projectId) || null;
    setFormData(prev => ({
      ...prev,
      project
    }));
  };

  // Position management
  const handleAddPosition = () => {
    const newPosition: InvoicePosition = {
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: formData.positions.length + 1,
      description: '',
      quantity: 1,
      unit: 'Stk',
      unitPrice: 0,
      total: 0,
      taxRate: formData.taxRate,
      category: 'construction',
      notes: ''
    };
    setEditingPosition(newPosition);
    setShowPositionDialog(true);
  };

  const handleEditPosition = (position: InvoicePosition) => {
    setEditingPosition({ ...position });
    setShowPositionDialog(true);
  };

  const handleDeletePosition = (positionId: string) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions
        .filter(p => p.id !== positionId)
        .map((p, index) => ({ ...p, position: index + 1 }))
    }));
  };

  const handleDuplicatePosition = (position: InvoicePosition) => {
    const newPosition: InvoicePosition = {
      ...position,
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: formData.positions.length + 1
    };
    setFormData(prev => ({
      ...prev,
      positions: [...prev.positions, newPosition]
    }));
  };

  const handleMovePosition = (positionId: string, direction: 'up' | 'down') => {
    const positions = [...formData.positions];
    const index = positions.findIndex(p => p.id === positionId);
    
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= positions.length) return;
    
    // Swap positions
    [positions[index], positions[newIndex]] = [positions[newIndex], positions[index]];
    
    // Update position numbers
    positions.forEach((pos, idx) => {
      pos.position = idx + 1;
    });
    
    setFormData(prev => ({ ...prev, positions }));
  };

  const handleSavePosition = (position: InvoicePosition) => {
    // Calculate total
    const total = position.quantity * position.unitPrice;
    const discountAmount = position.discount ? (total * position.discount / 100) : 0;
    position.total = total - discountAmount;

    if (formData.positions.find(p => p.id === position.id)) {
      // Update existing position
      setFormData(prev => ({
        ...prev,
        positions: prev.positions.map(p => p.id === position.id ? position : p)
      }));
    } else {
      // Add new position
      setFormData(prev => ({
        ...prev,
        positions: [...prev.positions, position]
      }));
    }
    
    setShowPositionDialog(false);
    setEditingPosition(null);
  };

  // Handle form submission
  const handleSave = async () => {
    // Validation
    if (!formData.customer) {
      toast({
        title: "Validierungsfehler",
        description: "Bitte wählen Sie einen Kunden aus.",
        variant: "destructive"
      });
      return;
    }

    if (formData.positions.length === 0) {
      toast({
        title: "Validierungsfehler", 
        description: "Bitte fügen Sie mindestens eine Position hinzu.",
        variant: "destructive"
      });
      return;
    }

    if (!isEditing) {
      // Generate new invoice number for new invoices
      const generatedNumber = documentNumberingService.generateNumber('invoice');
      formData.number = generatedNumber.number;
    }

    setIsCalculating(true);
    try {
      await onSave(formData, summary);
      toast({
        title: "Rechnung gespeichert",
        description: `Rechnung ${formData.number} wurde erfolgreich ${isEditing ? 'aktualisiert' : 'erstellt'}.`,
      });
    } catch (error) {
      console.error('Failed to save invoice:', error);
      toast({
        title: "Fehler",
        description: "Die Rechnung konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Rechnung bearbeiten' : 'Neue Rechnung erstellen'}
          </h2>
          <p className="text-muted-foreground">
            {formData.number} • {isEditing ? 'Änderungen werden gespeichert' : 'Neue Ausgangsrechnung'}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Status: {formData.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer and Project */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Kunde und Projekt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Kunde *</Label>
                  <Select 
                    value={formData.customer?.id || ''} 
                    onValueChange={handleCustomerChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kunde auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{customer.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Projekt</Label>
                  <Select 
                    value={formData.project?.id || ''} 
                    onValueChange={handleProjectChange}
                    disabled={!formData.customer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Projekt auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4" />
                            <span>{project.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.customer && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formData.customer.name}</span>
                      </div>
                      {formData.customer.company && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{formData.customer.company}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{formData.customer.email}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{formData.customer.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{formData.customer.address}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Rechnungsdetails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Rechnungsdatum *</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceDate">Leistungsdatum</Label>
                  <Input
                    id="serviceDate"
                    type="date"
                    value={formData.serviceDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Zahlungsbedingungen</Label>
                  <Select 
                    value={formData.paymentTerms} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTermsOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Fälligkeitsdatum *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    disabled={formData.paymentTerms !== 'custom'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRate">Steuersatz (%)</Label>
                  <Select 
                    value={formData.taxRate.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, taxRate: parseFloat(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (Befreit)</SelectItem>
                      <SelectItem value="7">7% (Ermäßigt)</SelectItem>
                      <SelectItem value="19">19% (Regulär)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Positions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Positionen ({formData.positions.length})
                </div>
                <Button onClick={handleAddPosition} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Position hinzufügen
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formData.positions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Noch keine Positionen hinzugefügt</p>
                  <p className="text-sm">Klicken Sie auf "Position hinzufügen", um zu beginnen</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Pos.</TableHead>
                        <TableHead>Beschreibung</TableHead>
                        <TableHead className="text-right w-20">Menge</TableHead>
                        <TableHead className="text-center w-16">Einheit</TableHead>
                        <TableHead className="text-right w-24">EP €</TableHead>
                        <TableHead className="text-right w-24">GP €</TableHead>
                        <TableHead className="w-32">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.positions.map((position, index) => (
                        <TableRow key={position.id}>
                          <TableCell className="font-medium">{position.position}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{position.description}</div>
                              {position.notes && (
                                <div className="text-sm text-muted-foreground">{position.notes}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {position.quantity.toLocaleString('de-DE')}
                          </TableCell>
                          <TableCell className="text-center">{position.unit}</TableCell>
                          <TableCell className="text-right">
                            {position.unitPrice.toLocaleString('de-DE', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {position.total.toLocaleString('de-DE', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMovePosition(position.id, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMovePosition(position.id, 'down')}
                                disabled={index === formData.positions.length - 1}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPosition(position)}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDuplicatePosition(position)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePosition(position.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Terms and Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Zahlungsbedingungen und Anmerkungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terms">Zahlungsbedingungen</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Anmerkungen (optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Zusätzliche Anmerkungen zur Rechnung..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onCancel}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={isCalculating}>
              {isCalculating ? (
                <>
                  <Calculator className="h-4 w-4 mr-2 animate-spin" />
                  Berechne...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Aktualisieren' : 'Speichern'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Rechnungssumme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Zwischensumme:</span>
                  <span>€{summary.subtotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span>
                </div>
                
                {formData.discountValue > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Rabatt ({formData.discountType === 'percentage' ? `${formData.discountValue}%` : 'Festbetrag'}):</span>
                    <span>-€{summary.discountAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Nettobetrag:</span>
                  <span>€{summary.netAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>MwSt. ({formData.taxRate}%):</span>
                  <span>€{summary.taxAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Gesamtbetrag:</span>
                  <span>€{summary.grossAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Position Edit Dialog */}
      <PositionEditDialog
        position={editingPosition}
        open={showPositionDialog}
        onOpenChange={setShowPositionDialog}
        onSave={handleSavePosition}
      />
    </div>
  );
};

export default InvoiceCreationForm;