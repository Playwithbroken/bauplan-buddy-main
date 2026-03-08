import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import type { DeliveryNoteFormData } from '@/services/deliveryNoteService';

export interface CustomerSectionProps {
  data: DeliveryNoteFormData;
  onChange: (field: keyof DeliveryNoteFormData, value: string) => void;
}

export const DeliveryNoteCustomerSection: React.FC<CustomerSectionProps> = ({
  data,
  onChange
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Kundendaten</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customer-name">Kunde</Label>
        <Input
          id="customer-name"
          value={data.customerName}
          onChange={event => onChange('customerName', event.target.value)}
          placeholder="Firma oder Ansprechpartner"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-id">Kundennummer</Label>
        <Input
          id="customer-id"
          value={data.customerId}
          onChange={event => onChange('customerId', event.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-address">Adresse</Label>
        <Textarea
          id="customer-address"
          value={data.customerAddress}
          onChange={event => onChange('customerAddress', event.target.value)}
          placeholder="Strasse, PLZ, Ort"
          required
          rows={3}
        />
      </div>
    </CardContent>
  </Card>
);

