import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Type, GripVertical, Calculator } from 'lucide-react';
import { PresetService } from '@/services/presetService';
import { useToast } from '@/hooks/use-toast';

export type QuoteItemType = 'section' | 'item';

export interface QuoteSection {
  id: string;
  type: 'section';
  title: string;
  items: QuoteItem[];
  subtotal?: number;
  showSubtotal: boolean;
}

export interface QuoteItem {
  id: string;
  type: 'item';
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  presetId?: string; // Link to preset
}

export interface QuoteData {
  sections: QuoteSection[];
  grandTotal: number;
}

interface QuoteItemsEditorProps {
  data: QuoteData;
  onChange: (data: QuoteData) => void;
}

const UNITS = [
  { value: 'stk', label: 'Stück' },
  { value: 'h', label: 'Stunden' },
  { value: 'm', label: 'Meter' },
  { value: 'm2', label: 'm²' },
  { value: 'km', label: 'Kilometer' },
  { value: 'pauschal', label: 'Pauschal' },
];

export default function QuoteItemsEditor({ data, onChange }: QuoteItemsEditorProps) {
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const services = PresetService.listServicePresets();
  const travelCosts = PresetService.listTravelCostPresets();
  const wages = PresetService.listWagePresets();

  const addSection = () => {
    const newSection: QuoteSection = {
      id: `section-${Date.now()}`,
      type: 'section',
      title: 'Neuer Abschnitt',
      items: [],
      showSubtotal: true,
    };

    onChange({
      sections: [...data.sections, newSection],
      grandTotal: data.grandTotal,
    });
  };

  const updateSection = (sectionId: string, updates: Partial<QuoteSection>) => {
    const updatedSections = data.sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );

    onChange({
      sections: updatedSections,
      grandTotal: calculateGrandTotal(updatedSections),
    });
  };

  const deleteSection = (sectionId: string) => {
    const updatedSections = data.sections.filter(s => s.id !== sectionId);
    onChange({
      sections: updatedSections,
      grandTotal: calculateGrandTotal(updatedSections),
    });
  };

  const addItem = (sectionId: string) => {
    const newItem: QuoteItem = {
      id: `item-${Date.now()}`,
      type: 'item',
      description: '',
      quantity: 1,
      unit: 'stk',
      unitPrice: 0,
      total: 0,
    };

    const updatedSections = data.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: [...section.items, newItem],
        };
      }
      return section;
    });

    onChange({
      sections: updatedSections,
      grandTotal: calculateGrandTotal(updatedSections),
    });
  };

  const updateItem = (sectionId: string, itemId: string, updates: Partial<QuoteItem>) => {
    const updatedSections = data.sections.map(section => {
      if (section.id === sectionId) {
        const updatedItems = section.items.map(item => {
          if (item.id === itemId) {
            const updated = { ...item, ...updates };
            updated.total = updated.quantity * updated.unitPrice;
            return updated;
          }
          return item;
        });
        
        return {
          ...section,
          items: updatedItems,
          subtotal: calculateSectionSubtotal(updatedItems),
        };
      }
      return section;
    });

    onChange({
      sections: updatedSections,
      grandTotal: calculateGrandTotal(updatedSections),
    });
  };

  const deleteItem = (sectionId: string, itemId: string) => {
    const updatedSections = data.sections.map(section => {
      if (section.id === sectionId) {
        const updatedItems = section.items.filter(i => i.id !== itemId);
        return {
          ...section,
          items: updatedItems,
          subtotal: calculateSectionSubtotal(updatedItems),
        };
      }
      return section;
    });

    onChange({
      sections: updatedSections,
      grandTotal: calculateGrandTotal(updatedSections),
    });
  };

  const addPresetItem = (sectionId: string, presetId: string, presetType: 'service' | 'travel' | 'wage') => {
    let newItem: QuoteItem | null = null;

    if (presetType === 'service') {
      const preset = services.find(s => s.id === presetId);
      if (preset) {
        newItem = {
          id: `item-${Date.now()}`,
          type: 'item',
          description: preset.name,
          quantity: preset.estimatedDuration || 1,
          unit: preset.unit || 'stk',
          unitPrice: preset.defaultPrice || 0,
          total: (preset.estimatedDuration || 1) * (preset.defaultPrice || 0),
          presetId,
        };
      }
    } else if (presetType === 'travel') {
      const preset = travelCosts.find(t => t.id === presetId);
      if (preset) {
        newItem = {
          id: `item-${Date.now()}`,
          type: 'item',
          description: preset.name,
          quantity: preset.type === 'km' ? 1 : 1,
          unit: preset.type === 'km' ? 'km' : 'pauschal',
          unitPrice: preset.type === 'km' ? (preset.pricePerUnit || 0) : (preset.flatAmount || 0),
          total: preset.type === 'km' ? (preset.pricePerUnit || 0) : (preset.flatAmount || 0),
          presetId,
        };
      }
    } else if (presetType === 'wage') {
      const preset = wages.find(w => w.id === presetId);
      if (preset) {
        newItem = {
          id: `item-${Date.now()}`,
          type: 'item',
          description: `${preset.role}`,
          quantity: 8,
          unit: 'h',
          unitPrice: preset.hourlyRate,
          total: 8 * preset.hourlyRate,
          presetId,
        };
      }
    }

    if (newItem) {
      const updatedSections = data.sections.map(section => {
        if (section.id === sectionId) {
          const updatedItems = [...section.items, newItem!];
          return {
            ...section,
            items: updatedItems,
            subtotal: calculateSectionSubtotal(updatedItems),
          };
        }
        return section;
      });

      onChange({
        sections: updatedSections,
        grandTotal: calculateGrandTotal(updatedSections),
      });

      toast({ title: 'Vorlage hinzugefügt' });
    }
  };

  const calculateSectionSubtotal = (items: QuoteItem[]): number => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateGrandTotal = (sections: QuoteSection[]): number => {
    return sections.reduce((sum, section) => sum + (section.subtotal || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Sections */}
      {data.sections.map((section, sectionIndex) => (
        <Card key={section.id} className="border-2">
          <CardContent className="pt-6 space-y-4">
            {/* Section Header */}
            <div className="flex items-center gap-3">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
              <div className="flex-1 flex items-center gap-3">
                <Type className="h-5 w-5 text-primary" />
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                  className="font-bold text-lg"
                  placeholder="Abschnittstitel (z.B. Maurerarbeiten)"
                />
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteSection(section.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Items in this section */}
            <div className="space-y-3 pl-8">
              {section.items.map((item, itemIndex) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-5">
                    <Label className="text-xs">Beschreibung</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(section.id, item.id, { description: e.target.value })}
                      placeholder="z.B. Mauerwerk erstellen"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Menge</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(section.id, item.id, { quantity: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Einheit</Label>
                    <Select
                      value={item.unit}
                      onValueChange={(value) => updateItem(section.id, item.id, { unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map(u => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Preis (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(section.id, item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-span-1 flex items-end justify-between">
                    <div>
                      <Label className="text-xs">Summe</Label>
                      <div className="font-semibold">{item.total.toFixed(2)}€</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteItem(section.id, item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Add Item Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addItem(section.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Position hinzufügen
                </Button>
                
                {/* Preset Dropdowns */}
                <Select onValueChange={(presetId) => addPresetItem(section.id, presetId, 'service')}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Leistung wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.defaultPrice?.toFixed(2)}€/{s.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={(presetId) => addPresetItem(section.id, presetId, 'travel')}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Fahrtkosten" />
                  </SelectTrigger>
                  <SelectContent>
                    {travelCosts.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={(presetId) => addPresetItem(section.id, presetId, 'wage')}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Stundenlohn" />
                  </SelectTrigger>
                  <SelectContent>
                    {wages.map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.role} ({w.hourlyRate.toFixed(2)}€/h)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section Subtotal */}
            {section.showSubtotal && (
              <div className="pl-8 pt-3 border-t flex justify-end">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">Zwischensumme {section.title}:</span>
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {(section.subtotal || 0).toFixed(2)} €
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add Section Button */}
      <Button onClick={addSection} variant="outline" className="w-full">
        <Type className="h-4 w-4 mr-2" />
        Neuen Abschnitt hinzufügen
      </Button>

      {/* Grand Total */}
      <Card className="bg-primary/5 border-2 border-primary">
        <CardContent className="py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calculator className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Gesamtsumme (netto)</span>
            </div>
            <Badge className="text-2xl px-4 py-2">
              {data.grandTotal.toFixed(2)} €
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
