import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Plus, Trash2 } from 'lucide-react';
import type { DeliveryNoteItem } from '@/services/deliveryNoteService';

export interface ItemsSectionProps {
  items: Partial<DeliveryNoteItem>[];
  onItemChange: (
    index: number,
    field: keyof DeliveryNoteItem,
    value: string | number | undefined
  ) => void;
  onAddItem: () => void;
  onAddItemToSection: (sectionId: string) => void;
  onAddSection: () => void;
  onRemoveItem: (index: number) => void;
  onRemoveSection: (sectionId: string) => void;
  onSectionTitleChange: (sectionId: string, title: string) => void;
}

export const DeliveryNoteItemsSection: React.FC<ItemsSectionProps> = ({
  items,
  onItemChange,
  onAddItem,
  onAddItemToSection,
  onAddSection,
  onRemoveItem,
  onRemoveSection,
  onSectionTitleChange
}) => {
  const groups = useMemo(() => {
    const map = new Map<
      string,
      { sectionId: string; title: string; items: Array<{ item: Partial<DeliveryNoteItem>; index: number }> }
    >();
    const order: string[] = [];

    items.forEach((item, index) => {
      const sectionId = item.sectionId ?? `section-${index}`;
      if (!map.has(sectionId)) {
        map.set(sectionId, {
          sectionId,
          title: item.sectionTitle ?? '',
          items: []
        });
        order.push(sectionId);
      }
      const entry = map.get(sectionId)!;
      if (item.sectionTitle && item.sectionTitle !== entry.title) {
        entry.title = item.sectionTitle;
      }
      entry.items.push({ item, index });
    });

    return order.map(id => map.get(id)!);
  }, [items]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span>Positionen</span>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onAddSection}>
              <Plus className="h-4 w-4 mr-2" />
              Abschnitt hinzufuegen
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Position hinzufuegen
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {groups.map(group => (
            <div
              key={group.sectionId}
              className="space-y-4 rounded-lg border border-border/60 p-4 shadow-layered-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="md:basis-2/3 space-y-2">
                  <Label htmlFor={`delivery-section-${group.sectionId}`}>Abschnittstitel</Label>
                  <Input
                    id={`delivery-section-${group.sectionId}`}
                    value={group.title ?? ''}
                    onChange={event => onSectionTitleChange(group.sectionId, event.target.value)}
                    placeholder="z.B. Rohbau, Innenausbau …"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onAddItemToSection(group.sectionId)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Position
                  </Button>
                  {groups.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveSection(group.sectionId)}
                      aria-label="Abschnitt entfernen"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Abschnitt entfernen
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {group.items.map(({ item, index }) => {
                  const descriptionId = `delivery-item-${index}-description`;
                  const quantityId = `delivery-item-${index}-quantity`;
                  const unitId = `delivery-item-${index}-unit`;
                  const deliveredId = `delivery-item-${index}-delivered`;

                  return (
                    <div
                      key={item.id ?? `${group.sectionId}-${index}`}
                      className="grid grid-cols-12 gap-4 rounded-lg border border-dashed border-border/50 bg-card/60 p-4"
                    >
                      <div className="col-span-12 md:col-span-5 space-y-2">
                        <Label htmlFor={descriptionId}>Beschreibung der Position</Label>
                        <Textarea
                          id={descriptionId}
                          value={item.description ?? ''}
                          onChange={event => onItemChange(index, 'description', event.target.value)}
                          placeholder="Beschreibung der Position"
                          rows={2}
                        />
                      </div>

                      <div className="col-span-6 md:col-span-2 space-y-2">
                        <Label htmlFor={quantityId}>Menge</Label>
                        <Input
                          id={quantityId}
                          type="number"
                          value={item.quantity ?? 0}
                          onChange={event =>
                            onItemChange(index, 'quantity', parseFloat(event.target.value) || 0)
                          }
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="col-span-6 md:col-span-2 space-y-2">
                        <Label htmlFor={unitId}>Einheit</Label>
                        <Select
                          value={item.unit ?? ''}
                          onValueChange={value => onItemChange(index, 'unit', value)}
                        >
                          <SelectTrigger id={unitId}>
                            <SelectValue placeholder="Einheit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Stk">Stueck</SelectItem>
                            <SelectItem value="m">Meter</SelectItem>
                            <SelectItem value="m2">Quadratmeter</SelectItem>
                            <SelectItem value="m3">Kubikmeter</SelectItem>
                            <SelectItem value="kg">Kilogramm</SelectItem>
                            <SelectItem value="t">Tonne</SelectItem>
                            <SelectItem value="lfm">Laufmeter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-6 md:col-span-2 space-y-2">
                        <Label htmlFor={deliveredId}>Geliefert</Label>
                        <Input
                          id={deliveredId}
                          type="number"
                          value={
                            item.deliveredQuantity !== undefined
                              ? item.deliveredQuantity
                              : item.quantity ?? 0
                          }
                          onChange={event => {
                            const { value } = event.target;
                            const parsedValue = parseFloat(value);
                            onItemChange(
                              index,
                              'deliveredQuantity',
                              value === '' || Number.isNaN(parsedValue) ? undefined : parsedValue
                            );
                          }}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="col-span-6 md:col-span-1 flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => onRemoveItem(index)}
                          disabled={items.length <= 1}
                          aria-label="Position entfernen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
