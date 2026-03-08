import { randomUUID } from 'crypto';
import type { TestQuote } from './types';

export interface QuoteFactoryOptions {
  number?: string;
  customerId?: string;
  status?: string;
  totalAmount?: number;
}

export const defaultQuoteItems = () => [
  {
    id: randomUUID(),
    position: 1,
    description: 'Testposition A',
    quantity: 5,
    unit: 'Stk',
    unitPrice: 500,
    category: 'material'
  },
  {
    id: randomUUID(),
    position: 2,
    description: 'Montage-Team',
    quantity: 20,
    unit: 'Std',
    unitPrice: 80,
    category: 'labor'
  }
];

export const buildQuote = (overrides: QuoteFactoryOptions = {}): TestQuote => {
  const items = defaultQuoteItems();
  const totalAmount =
    overrides.totalAmount ??
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return {
    id: randomUUID(),
    number: overrides.number ?? 'ANG-TEST-0001',
    customerId: overrides.customerId ?? 'cust-test-001',
    status: overrides.status ?? 'APPROVED',
    totalAmount,
    items
  };
};
