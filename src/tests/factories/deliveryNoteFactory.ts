import { randomUUID } from 'crypto';
import type { DeliveryNote } from '@/services/deliveryNoteService';
import { buildProject } from './projectFactory';
import { buildQuote } from './quoteFactory';

export const buildDeliveryNote = (
  overrides: Partial<DeliveryNote> = {}
): DeliveryNote => {
  const quote = buildQuote();
  const project = buildProject({ quote });

  const baseItems = quote.items.map(item => ({
    id: randomUUID(),
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    deliveredQuantity: item.quantity
  }));

  if (!overrides.id) {
    // Ensure deterministic id if not provided
    overrides.id = randomUUID();
  }

  if (!overrides.number) {
    overrides.number = `LS-TEST-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(4, '0')}`;
  }

  return {
    id: overrides.id,
    number: overrides.number,
    date: overrides.date ?? '2025-11-10',
    customerId: overrides.customerId ?? quote.customerId,
    customerName: overrides.customerName ?? 'Test GmbH',
    customerAddress: overrides.customerAddress ?? 'Teststraße 1\n12345 Teststadt',
    projectId: overrides.projectId ?? project.id,
    projectName: overrides.projectName ?? project.name,
    orderNumber: overrides.orderNumber ?? 'ORD-TEST-0001',
    deliveryAddress: overrides.deliveryAddress ?? 'Test-Baustelle 1',
    notes: overrides.notes ?? 'Testhinweis',
    status: overrides.status ?? 'delivered',
    createdBy: overrides.createdBy ?? 'tester',
    createdAt: overrides.createdAt ?? '2025-11-10T09:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2025-11-10T10:00:00.000Z',
    items: overrides.items ?? baseItems
  };
};
