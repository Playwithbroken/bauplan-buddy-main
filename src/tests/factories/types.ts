import type { DeliveryNote } from '@/services/deliveryNoteService';

export type TestQuote = {
  id: string;
  number: string;
  customerId: string;
  status: string;
  totalAmount: number;
  items: Array<{
    id: string;
    position: number;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    category: string;
  }>;
};

export type TestProject = {
  id: string;
  number: string;
  quoteId: string;
  customerId: string;
  name: string;
  status: string;
  budget: number;
};

export type TestDeliveryNote = DeliveryNote;

export type TestUser = {
  id: string;
  name: string;
  email: string;
  roles: string[];
};
