import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MultiWindowDialog } from '../ui/dialog';
import { Calculator, Package } from 'lucide-react';
import { InvoicePosition } from '../forms/InvoiceCreationForm';
import { DialogFrame } from '../ui/dialog-frame';

interface PositionEditDialogProps {
  position: InvoicePosition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (position: InvoicePosition) => void;
}

// Common units for construction
const commonUnits = [
  'Stk', 'm', 'm²', 'm³', 'kg', 't', 'h', 'Std', 'Tag', 'Woche', 'Monat', 'pauschal'
];

// Position categories
const positionCategories = [
  { value: 'construction', label: 'Bauarbeiten' },
  { value: 'materials', label: 'Materialien' },
  { value: 'labor', label: 'Arbeitsstunden' },
  { value: 'equipment', label: 'Geräteeinsatz' },
  { value: 'planning', label: 'Planung' },
  { value: 'other', label: 'Sonstiges' }
];

export const PositionEditDialog: React.FC<PositionEditDialogProps> = ({
  position,
  open,
  onOpenChange,
  onSave
}) => {
  const [formData, setFormData] = useState<InvoicePosition>({
    id: '',
    position: 1,
    description: '',
    quantity: 1,
    unit: 'Stk',
    unitPrice: 0,
    total: 0,
    taxRate: 19,
    category: 'construction',
    notes: ''
  });

  const [isCalculating, setIsCalculating] = useState(false);

  // Update form data when position changes
  useEffect(() => {
    if (position) {
      setFormData({ ...position });
    }
  }, [position]);

  // Auto-calculate total when quantity, unit price, or discount changes
  useEffect(() => {
    const subtotal = formData.quantity * formData.unitPrice;
    const discountAmount = formData.discount ? (subtotal * formData.discount / 100) : 0;
    const total = subtotal - discountAmount;
    
    setFormData(prev => ({ ...prev, total }));
  }, [formData.quantity, formData.unitPrice, formData.discount]);

  const handleSave = () => {
    if (!formData.description.trim()) {
      return;
    }

    setIsCalculating(true);
    
    // Small delay to show calculation state
    setTimeout(() => {
      onSave(formData);
      setIsCalculating(false);
    }, 200);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isNewPosition = !position?.id || position.id.includes('pos_');

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogFrame
        title={
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isNewPosition ? 'Position hinzufügen' : 'Position bearbeiten'}
          </span>
        }
        description={isNewPosition ? 'Fügen Sie eine neue Position zur Rechnung hinzu' : 'Bearbeiten Sie die ausgewählte Position'}
        defaultFullscreen
        showFullscreenToggle
        footer={
          <div className="flex-shrink-0">
            <Button variant="outline" onClick={handleCancel}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={!formData.description.trim() || isCalculating}>
              {isCalculating ? (
                <>
                  <Calculator className="h-4 w-4 mr-2 animate-spin" />
                  Berechne...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  {isNewPosition ? 'Hinzufügen' : 'Aktualisieren'}
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Description and Category */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung *</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Beschreibung der Leistung oder des Materials..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {positionCategories.map((category) => (<SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Menge *</Label>
              <Input id="quantity" type="number" min="0" step="0.01" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Einheit</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {commonUnits.map((unit) => (<SelectItem key={unit} value={unit}>{unit}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Einzelpreis (€) *</Label>
              <Input id="unitPrice" type="number" min="0" step="0.01" value={formData.unitPrice} onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Rabatt (%)</Label>
              <Input id="discount" type="number" min="0" max="100" step="0.1" value={formData.discount || 0} onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || undefined }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total">Gesamtpreis (€)</Label>
              <Input id="total" type="number" value={formData.total.toFixed(2)} readOnly className="bg-muted" />
            </div>
          </div>
          {/* Tax Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Steuersatz (%)</Label>
              <Select value={formData.taxRate.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, taxRate: parseFloat(value) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% (Befreit)</SelectItem>
                  <SelectItem value="7">7% (Ermäßigt)</SelectItem>
                  <SelectItem value="19">19% (Regulär)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="p-3 bg-muted rounded-lg w-full">
                <div className="text-sm text-muted-foreground">Berechnete Steuer</div>
                <div className="text-lg font-semibold">€{(formData.total * formData.taxRate / 100).toFixed(2)}</div>
              </div>
            </div>
          </div>
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Zusätzliche Anmerkungen (optional)</Label>
            <Textarea id="notes" value={formData.notes || ''} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Zusätzliche Informationen zu dieser Position..." rows={2} />
          </div>
          {/* Calculation Summary */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3"><Calculator className="h-4 w-4 text-blue-600" /><span className="font-medium text-blue-600">Positionsberechnung</span></div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Menge × Einzelpreis:</span><span>€{(formData.quantity * formData.unitPrice).toFixed(2)}</span></div>
              {formData.discount && formData.discount > 0 && (<div className="flex justify-between text-red-600"><span>Rabatt ({formData.discount}%):</span><span>-€{((formData.quantity * formData.unitPrice) * formData.discount / 100).toFixed(2)}</span></div>)}
              <div className="flex justify-between font-medium border-t pt-2"><span>Netto-Positionssumme:</span><span>€{formData.total.toFixed(2)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>+ MwSt. ({formData.taxRate}%):</span><span>€{(formData.total * formData.taxRate / 100).toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold border-t pt-2"><span>Brutto-Positionssumme:</span><span>€{(formData.total + (formData.total * formData.taxRate / 100)).toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </DialogFrame>
    </MultiWindowDialog>
  );
};

export default PositionEditDialog;