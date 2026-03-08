import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeliveryNotePreview } from '@/components/delivery/DeliveryNotePreview';
import DeliveryNoteService from '@/services/deliveryNoteService';
import type { DeliveryNote } from '@/services/deliveryNoteService';

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() })
}));

const buildDeliveryNote = (): DeliveryNote => ({
  id: 'dn-001',
  number: 'LS-2025-000001',
  date: '2025-10-25',
  customerId: 'cust-1',
  customerName: 'Test Kunde GmbH',
  customerAddress: 'Teststrasse 1\n12345 Teststadt',
  projectId: 'proj-1',
  projectName: 'Rohbau',
  orderNumber: 'ORD-1',
  deliveryAddress: 'Baustelle 3\n12345 Teststadt',
  items: [
    {
      id: 'pos-1',
      description: 'Baustahl',
      quantity: 10,
      unit: 'Stk',
      deliveredQuantity: 10,
      notes: 'Keine'
    }
  ],
  notes: 'Bitte avisiert anrufen.',
  status: 'draft',
  createdBy: 'tester',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deliveredAt: undefined,
  deliveryMethod: 'delivery',
  signature: undefined
});

describe('DeliveryNotePreview fallback download', () => {
  const originalCanvasGetContext = HTMLCanvasElement.prototype.getContext;
  const originalAnchorClick = HTMLAnchorElement.prototype.click;
  const originalURL = window.URL;

  beforeAll(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      writable: true,
      value: jest.fn(() => ({}))
    });

    Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
      configurable: true,
      writable: true,
      value: jest.fn()
    });
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(window, 'URL', {
      writable: true,
      value: {
        createObjectURL: jest.fn(() => 'blob:preview'),
        revokeObjectURL: jest.fn()
      }
    });
  });

  afterAll(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      writable: true,
      value: originalCanvasGetContext
    });

    Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
      configurable: true,
      writable: true,
      value: originalAnchorClick
    });

    Object.defineProperty(window, 'URL', {
      configurable: true,
      writable: true,
      value: originalURL
    });
  });

  it('calls DeliveryNoteService when no onDownload prop is provided', async () => {
    const note = buildDeliveryNote();
    const generateSpy = jest
      .spyOn(DeliveryNoteService, 'generatePDF')
      .mockResolvedValue(new Blob());

    render(<DeliveryNotePreview deliveryNote={note} />);

    const downloadButton = screen.getByRole('button', { name: /PDF speichern/i });
    fireEvent.click(downloadButton);

    await waitFor(() => expect(generateSpy).toHaveBeenCalledTimes(1));
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });

  it('prefers custom onDownload handler when provided', async () => {
    const note = buildDeliveryNote();
    const customDownload = jest.fn();
    const generateSpy = jest.spyOn(DeliveryNoteService, 'generatePDF');

    render(<DeliveryNotePreview deliveryNote={note} onDownload={customDownload} />);

    const downloadButton = screen.getByRole('button', { name: /PDF speichern/i });
    fireEvent.click(downloadButton);

    await waitFor(() => expect(customDownload).toHaveBeenCalledTimes(1));
    expect(generateSpy).not.toHaveBeenCalled();
  });
});
