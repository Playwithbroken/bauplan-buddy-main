import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Dialog,
  MultiWindowDialog,
  DialogDescription,
} from '../ui/dialog';
import { DialogFrame } from '../ui/dialog-frame';
import {
  Plus,
  Trash2,
  Calculator,
  Euro,
  AlertCircle,
  Save,
  Send,
  FileText,
  Copy,
  ArrowUp,
  ArrowDown,
  Settings,
  Percent,
  GitBranch
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import QuoteTemplatesService, { QuoteTemplate } from '../../services/quoteTemplatesService';
import { QuoteTemplatesManager } from '../templates/QuoteTemplatesManager';
import QuoteRevisionService from '../../services/quoteRevisionService';
import { QuoteRevisionManager } from '../revisions/QuoteRevisionManager';

export interface QuotePosition {
  id: string;
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: string;
  notes?: string;
  discount?: number; // Percentage discount
}

export interface Customer {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  address: string;
}

export interface QuoteFormData {
  customer: Customer | null;
  projectName: string;
  projectAddress: string;
  validUntil: string;
  positions: QuotePosition[];
  notes: string;
  terms: string;
  taxRate: number; // VAT rate as percentage
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: number;
}

export interface QuoteSummary {
  subtotal: number;
  totalDiscount: number;
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
}

export const UNITS = [
  { value: 'stk', label: 'Stück' },
  { value: 'm', label: 'Meter' },
  { value: 'm2', label: 'Quadratmeter' },
  { value: 'm3', label: 'Kubikmeter' },
  { value: 'kg', label: 'Kilogramm' },
  { value: 't', label: 'Tonne' },
  { value: 'h', label: 'Stunde' },
  { value: 'tag', label: 'Tag' },
  { value: 'pauschal', label: 'Pauschal' }
];

export const CATEGORIES = [
  { value: 'construction', label: 'Rohbau' },
  { value: 'roofing', label: 'Dacharbeiten' },
  { value: 'interior', label: 'Innenausbau' },
  { value: 'exterior', label: 'Außenarbeiten' },
  { value: 'electrical', label: 'Elektro' },
  { value: 'plumbing', label: 'Sanitär' },
  { value: 'heating', label: 'Heizung' },
  { value: 'flooring', label: 'Bodenbeläge' },
  { value: 'painting', label: 'Malerarbeiten' },
  { value: 'other', label: 'Sonstiges' }
];

interface EnhancedQuoteCreationProps {
  onQuoteCreated?: (quote: QuoteFormData & { id: string; number: string }) => void;
  initialData?: Partial<QuoteFormData>;
  editMode?: boolean;
  quoteId?: string; // For revision tracking
}

export const EnhancedQuoteCreation: React.FC<EnhancedQuoteCreationProps> = ({
  onQuoteCreated,
  initialData,
  editMode = false,
  quoteId
}) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<QuoteFormData>({
    customer: null,
    projectName: '',
    projectAddress: '',
    validUntil: '',
    positions: [],
    notes: '',
    terms: 'Zahlungsziel: 30 Tage netto\nGültigkeit: 30 Tage\nAlle Preise verstehen sich zzgl. MwSt.',
    taxRate: 19,
    discountType: 'none',
    discountValue: 0,
    ...initialData
  });

  const [newPosition, setNewPosition] = useState<Partial<QuotePosition>>({
    description: '',
    quantity: 1,
    unit: 'stk',
    unitPrice: 0,
    category: 'construction',
    discount: 0
  });

  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  
  const templatesService = QuoteTemplatesService.getInstance();
  const revisionService = QuoteRevisionService.getInstance();

  // Calculate totals in real-time
  const calculateSummary = (): QuoteSummary => {
    const subtotal = formData.positions.reduce((sum, pos) => sum + pos.total, 0);
    
    let totalDiscount = 0;
    if (formData.discountType === 'percentage') {
      totalDiscount = (subtotal * formData.discountValue) / 100;
    } else if (formData.discountType === 'fixed') {
      totalDiscount = formData.discountValue;
    }
    
    const netAmount = subtotal - totalDiscount;
    const taxAmount = (netAmount * formData.taxRate) / 100;
    const grossAmount = netAmount + taxAmount;

    return {
      subtotal,
      totalDiscount,
      netAmount,
      taxAmount,
      grossAmount
    };
  };

  const summary = calculateSummary();

  // Auto-generate valid until date (30 days from today)
  useEffect(() => {
    if (!formData.validUntil) {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        validUntil: date.toISOString().split('T')[0]
      }));
    }
  }, [formData.validUntil]);

  const handleAddPosition = () => {
    if (!newPosition.description || !newPosition.quantity || !newPosition.unitPrice) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle Pflichtfelder aus",
        variant: "destructive"
      });
      return;
    }

    const quantity = Number(newPosition.quantity) || 0;
    const unitPrice = Number(newPosition.unitPrice) || 0;
    const discount = Number(newPosition.discount) || 0;
    const baseTotal = quantity * unitPrice;
    const discountAmount = (baseTotal * discount) / 100;
    const total = baseTotal - discountAmount;

    const position: QuotePosition = {
      id: editingPositionId || `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: editingPositionId ? 
        formData.positions.find(p => p.id === editingPositionId)?.position || 0 :
        formData.positions.length + 1,
      description: newPosition.description || '',
      quantity,
      unit: newPosition.unit || 'stk',
      unitPrice,
      total,
      category: newPosition.category || 'construction',
      notes: newPosition.notes,
      discount
    };

    if (editingPositionId) {
      setFormData(prev => ({
        ...prev,
        positions: prev.positions.map(p => p.id === editingPositionId ? position : p)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        positions: [...prev.positions, position]
      }));
    }

    // Reset form
    setNewPosition({
      description: '',
      quantity: 1,
      unit: 'stk',
      unitPrice: 0,
      category: 'construction',
      discount: 0
    });
    setShowPositionDialog(false);
    setEditingPositionId(null);
  };

  const handleEditPosition = (position: QuotePosition) => {
    setNewPosition(position);
    setEditingPositionId(position.id);
    setShowPositionDialog(true);
  };

  const handleDeletePosition = (positionId: string) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.filter(p => p.id !== positionId)
        .map((p, index) => ({ ...p, position: index + 1 }))
    }));
  };

  const handleMovePosition = (positionId: string, direction: 'up' | 'down') => {
    const positions = [...formData.positions];
    const currentIndex = positions.findIndex(p => p.id === positionId);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= positions.length) return;
    
    // Swap positions
    [positions[currentIndex], positions[newIndex]] = [positions[newIndex], positions[currentIndex]];
    
    // Update position numbers
    positions.forEach((p, index) => {
      p.position = index + 1;
    });
    
    setFormData(prev => ({ ...prev, positions }));
  };

  const handleDuplicatePosition = (position: QuotePosition) => {
    const duplicated: QuotePosition = {
      ...position,
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: formData.positions.length + 1,
      description: `${position.description} (Kopie)`
    };
    
    setFormData(prev => ({
      ...prev,
      positions: [...prev.positions, duplicated]
    }));
  };

  const handleSubmit = async (action: 'draft' | 'send') => {
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!formData.customer) {
        throw new Error('Bitte wählen Sie einen Kunden aus');
      }
      
      if (!formData.projectName.trim()) {
        throw new Error('Bitte geben Sie einen Projektnamen ein');
      }
      
      if (formData.positions.length === 0) {
        throw new Error('Bitte fügen Sie mindestens eine Position hinzu');
      }

      let quote;
      const isNewQuote = !editMode || !quoteId;
      
      if (isNewQuote) {
        // Generate quote number (in real app, this would come from backend)
        const quoteNumber = `ANG-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        
        quote = {
          ...formData,
          id: quoteNumber,
          number: quoteNumber,
          status: action === 'send' ? 'sent' : 'draft',
          createdAt: new Date().toISOString(),
          summary
        };
        
        // Create initial revision
        revisionService.createInitialRevision(quote, summary);
      } else {
        // Update existing quote
        quote = {
          ...formData,
          id: quoteId,
          number: quoteId,
          status: action === 'send' ? 'sent' : 'draft',
          createdAt: new Date().toISOString(),
          summary
        };
        
        // Create new revision
        revisionService.createRevision(
          quoteId,
          quote,
          summary,
          'Quote updated',
          false // Minor change by default
        );
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: action === 'send' ? "Angebot versendet" : "Angebot gespeichert",
        description: `Angebot ${quote.number} wurde erfolgreich ${action === 'send' ? 'versendet' : 'als Entwurf gespeichert'}`,
      });

      if (onQuoteCreated) {
        onQuoteCreated(quote);
      }

    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTemplateApply = (positions: QuotePosition[], estimatedTotal: number) => {
    setFormData(prev => ({
      ...prev,
      positions: positions
    }));
    
    setShowTemplateDialog(false);
    
    toast({
      title: "Vorlage angewendet",
      description: `${positions.length} Positionen wurden hinzugefügt`,
    });
  };

  const getCategoryLabel = (categoryValue: string) => {
    return CATEGORIES.find(cat => cat.value === categoryValue)?.label || categoryValue;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {editMode ? 'Angebot bearbeiten' : 'Neues Angebot erstellen'}
              </CardTitle>
              <CardDescription>
                Erstellen Sie ein detailliertes Angebot mit automatischer Kalkulation
              </CardDescription>
            </div>
            {editMode && quoteId && (
              <Button variant="outline" onClick={() => setShowRevisionDialog(true)}>
                <GitBranch className="h-4 w-4 mr-2" />
                Revisionen
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Kundeninformationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Kunde auswählen</Label>
                  <Select onValueChange={(value) => {
                    // In real app, this would fetch customer data
                    const mockCustomer: Customer = {
                      id: value,
                      name: value === 'mueller' ? 'Familie Müller' : value === 'techcorp' ? 'TechCorp GmbH' : 'Hausverwaltung Nord',
                      email: `${value}@example.com`,
                      phone: '+49 123 456789',
                      address: 'Musterstraße 1, 12345 Musterstadt'
                    };
                    setFormData(prev => ({ ...prev, customer: mockCustomer }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kunde auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mueller">Familie Müller</SelectItem>
                      <SelectItem value="techcorp">TechCorp GmbH</SelectItem>
                      <SelectItem value="hausverwaltung">Hausverwaltung Nord</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.customer && (
                  <div className="space-y-2">
                    <Label>Kundendetails</Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                      <p className="font-medium">{formData.customer.name}</p>
                      <p>{formData.customer.email}</p>
                      <p>{formData.customer.phone}</p>
                      <p>{formData.customer.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Projektinformationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Projektname *</Label>
                  <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                    placeholder="Name des Bauprojekts"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Gültig bis *</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectAddress">Projektadresse</Label>
                <Textarea
                  id="projectAddress"
                  value={formData.projectAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectAddress: e.target.value }))}
                  placeholder="Vollständige Adresse des Projekts"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Positions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Angebotspositionen
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Aus Vorlage
                  </Button>
                  <Button onClick={() => setShowPositionDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Position hinzufügen
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formData.positions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Noch keine Positionen hinzugefügt</p>
                  <p className="text-sm">Klicken Sie auf "Position hinzufügen" um zu beginnen</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.positions.map((position, index) => (
                    <div key={position.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{position.position}</Badge>
                            <Badge variant="secondary">{getCategoryLabel(position.category)}</Badge>
                            {position.discount && position.discount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                -{position.discount}%
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium">{position.description}</h4>
                          <p className="text-sm text-muted-foreground">
                            {position.quantity} {position.unit} × €{position.unitPrice.toLocaleString()} = €{position.total.toLocaleString()}
                          </p>
                          {position.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{position.notes}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMovePosition(position.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMovePosition(position.id, 'down')}
                            disabled={index === formData.positions.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicatePosition(position)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPosition(position)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePosition(position.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Angebotssumme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary Calculations */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Zwischensumme:</span>
                  <span>€{summary.subtotal.toLocaleString()}</span>
                </div>
                
                {summary.totalDiscount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Rabatt:</span>
                    <span>-€{summary.totalDiscount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Nettobetrag:</span>
                  <span>€{summary.netAmount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>MwSt. ({formData.taxRate}%):</span>
                  <span>€{summary.taxAmount.toLocaleString()}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Gesamtbetrag:</span>
                  <span>€{summary.grossAmount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Aktionen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => handleSubmit('draft')} 
                disabled={isSubmitting}
                variant="outline"
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Speichern...' : 'Als Entwurf speichern'}
              </Button>
              
              <Button 
                onClick={() => handleSubmit('send')} 
                disabled={isSubmitting || !formData.customer}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Senden...' : 'Angebot versenden'}
              </Button>

              {!formData.customer && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Wählen Sie einen Kunden aus, um das Angebot zu versenden.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Position Dialog */}
      <MultiWindowDialog open={showPositionDialog} onOpenChange={setShowPositionDialog} modal={false}>
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {editingPositionId ? 'Position bearbeiten' : 'Neue Position hinzufügen'}
            </span>
          }
          description={
            <DialogDescription>
              Geben Sie die Details für die Angebotsposition ein
            </DialogDescription>
          }
          width="fit-content"
          minWidth={600}
          maxWidth={1200}
          resizable={true}
          preventOutsideClose={true}
          footer={
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => setShowPositionDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleAddPosition}>
                {editingPositionId ? 'Position aktualisieren' : 'Position hinzufügen'}
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung *</Label>
              <Input
                id="description"
                value={newPosition.description}
                onChange={(e) => setNewPosition(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beschreibung der Leistung"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Select
                value={newPosition.category}
                onValueChange={(value) => setNewPosition(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Menge *</Label>
              <Input
                id="quantity"
                type="number"
                value={newPosition.quantity}
                onChange={(e) => setNewPosition(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unit">Einheit</Label>
              <Select
                value={newPosition.unit}
                onValueChange={(value) => setNewPosition(prev => ({ ...prev, unit: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(unit => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Einzelpreis (€) *</Label>
              <Input
                id="unitPrice"
                type="number"
                value={newPosition.unitPrice}
                onChange={(e) => setNewPosition(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discount">Rabatt (%)</Label>
              <Input
                id="discount"
                type="number"
                value={newPosition.discount}
                onChange={(e) => setNewPosition(prev => ({ ...prev, discount: Number(e.target.value) }))}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Anmerkungen</Label>
            <Textarea
              id="notes"
              value={newPosition.notes}
              onChange={(e) => setNewPosition(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Zusätzliche Hinweise zu dieser Position..."
              rows={2}
            />
          </div>
        </DialogFrame>
      </MultiWindowDialog>

      {/* Template Selection Dialog */}
      <MultiWindowDialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog} modal={false}>
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Vorlage auswählen
            </span>
          }
          description={
            <DialogDescription>
              Wählen Sie eine vordefinierte Vorlage für Ihr Angebot
            </DialogDescription>
          }
          width="fit-content"
          minWidth={900}
          maxWidth={1600}
          resizable={true}
          defaultFullscreen={false}
          footer={
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Abbrechen
            </Button>
          }
        >
          <div className="min-h-[400px]">
            <QuoteTemplatesManager
              mode="select"
              onTemplateApply={handleTemplateApply}
            />
          </div>
        </DialogFrame>
      </MultiWindowDialog>

      {/* Revision History Dialog */}
      {editMode && quoteId && (
        <MultiWindowDialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog} modal={false}>
          <DialogFrame
            title={
              <span className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Revision History
              </span>
            }
            description={
              <DialogDescription>
                View and manage quote revisions
              </DialogDescription>
            }
            width="fit-content"
            minWidth={900}
            maxWidth={1600}
            resizable={true}
            defaultFullscreen={false}
            footer={
              <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>
                Close
              </Button>
            }
          >
            <div className="min-h-[400px]">
              <QuoteRevisionManager
                quoteId={quoteId}
                onRevisionSelect={(revision) => {
                  // Could load revision data into form
                  console.log('Selected revision:', revision);
                }}
                onRevisionRevert={(revision) => {
                  // Handle revision revert
                  toast({
                    title: "Revision reverted",
                    description: `Successfully reverted to version ${revision.version}`,
                  });
                  setShowRevisionDialog(false);
                }}
              />
            </div>
          </DialogFrame>
        </MultiWindowDialog>
      )}
    </div>
  );
};

export default EnhancedQuoteCreation;
