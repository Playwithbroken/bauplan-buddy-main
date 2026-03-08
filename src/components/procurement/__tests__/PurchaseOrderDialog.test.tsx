import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PurchaseOrderDialog } from '@/components/procurement/PurchaseOrderDialog';

describe('PurchaseOrderDialog autosave + undo', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('supports Ctrl+Z undo on requestedBy changes', async () => {
    render(<PurchaseOrderDialog open={true} onOpenChange={() => {}} />);

    const requestedByInput = screen.getByLabelText('Anforderer *') as HTMLInputElement;
    expect(requestedByInput.value).toBe('Admin User');

    fireEvent.change(requestedByInput, { target: { value: 'Neuer Benutzer' } });
    expect(requestedByInput.value).toBe('Neuer Benutzer');

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    await waitFor(() => expect(requestedByInput.value).toBe('Admin User'));
  });

  it('restores from autosave draft and persists changes', async () => {
    const DRAFT_KEY = 'bauplan.draft.purchaseOrderDialog';
    const draft = {
      supplierId: 'SUP-001',
      supplierName: 'Baustoff Weber GmbH',
      requestedBy: 'Max Mustermann',
      expectedDelivery: new Date('2025-10-25'),
      priority: 'high',
      projectId: 'PRJ-001',
      projectName: 'Wohnquartier München',
      costCentre: 'CC-01',
      notes: 'Dringend',
      lines: [
        { inventoryId: 'INV-001', quantity: 2, requiredDate: new Date('2025-10-24') }
      ]
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

    render(<PurchaseOrderDialog open={true} onOpenChange={() => {}} />);

    const requestedByInput = screen.getByLabelText('Anforderer *') as HTMLInputElement;
    expect(requestedByInput.value).toBe('Max Mustermann');

    fireEvent.change(requestedByInput, { target: { value: 'Erna Beispiel' } });

    await waitFor(() => {
      const saved = localStorage.getItem(DRAFT_KEY)!;
      const parsed = JSON.parse(saved);
      expect(parsed.requestedBy).toBe('Erna Beispiel');
    });
  });
});
