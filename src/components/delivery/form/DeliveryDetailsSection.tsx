import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Label } from '../../ui/label';
import { Truck } from 'lucide-react';
import type { DeliveryNoteFormData } from '@/services/deliveryNoteService';

export interface DeliveryDetailsSectionProps {
  data: DeliveryNoteFormData;
  onChange: (field: keyof DeliveryNoteFormData, value: string) => void;
}

export const DeliveryNoteDetailsSection: React.FC<DeliveryDetailsSectionProps> = ({
  data,
  onChange
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Lieferdetails</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Lieferdatum</Label>
        <Input
          id="date"
          type="date"
          value={data.date}
          onChange={event => onChange('date', event.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="project-name">Projekt</Label>
          <Input
            id="project-name"
            value={data.projectName ?? ''}
            onChange={event => onChange('projectName', event.target.value)}
            placeholder="Projektname"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-id">Projekt-ID</Label>
          <Input
            id="project-id"
            value={data.projectId ?? ''}
            onChange={event => onChange('projectId', event.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="delivery-address">Lieferadresse</Label>
        <Textarea
          id="delivery-address"
          value={data.deliveryAddress ?? ''}
          onChange={event => onChange('deliveryAddress', event.target.value)}
          placeholder="Abweichende Lieferadresse"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="order-number">Bestellnummer</Label>
          <Input
            id="order-number"
            value={data.orderNumber ?? ''}
            onChange={event => onChange('orderNumber', event.target.value)}
            placeholder="Referenz zur Bestellung"
          />
        </div>

        <div className="space-y-2">
          <Label>Versandart</Label>
          <Select
            value={data.deliveryMethod ?? ''}
            onValueChange={value => onChange('deliveryMethod', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Auswaehlen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pickup">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Abholung
                </div>
              </SelectItem>
              <SelectItem value="delivery">Lieferung</SelectItem>
              <SelectItem value="express">Express-Lieferung</SelectItem>
              <SelectItem value="special">Sondertransport</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardContent>
  </Card>
);

