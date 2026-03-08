import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeliveryNoteForm } from '@/components/delivery/DeliveryNoteForm';
import DeliveryNoteService from '@/services/deliveryNoteService';

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() })
}));

describe('DeliveryNoteForm interactions', () => {
  const originalCanvasGetContext = HTMLCanvasElement.prototype.getContext;
  const originalAnchorClick = HTMLAnchorElement.prototype.click;

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
    localStorage.clear();
    jest.restoreAllMocks();
    Object.defineProperty(window, 'URL', {
      writable: true,
      value: {
        createObjectURL: jest.fn(() => 'blob:mock-url'),
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
  });

  it('supports Ctrl+Z undo on customer name changes', async () => {
    render(<DeliveryNoteForm />);

    const input = screen.getByLabelText('Kunde') as HTMLInputElement;
    expect(input.value).toBe('');

    fireEvent.change(input, { target: { value: 'Firma A' } });
    expect(input.value).toBe('Firma A');

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    await waitFor(() => expect(input.value).toBe(''));
  });

  it('restores from autosave draft on mount and persists changes', async () => {
    const DRAFT_KEY = 'bauplan.draft.deliveryNoteForm';
    const draft = {
      date: '2025-10-20',
      customerId: 'CUST-01',
      customerName: 'Draft Kunde',
      customerAddress: 'Musterstr. 1, 12345 Berlin',
      projectId: 'PRJ-1',
      projectName: 'Hausbau',
      orderNumber: 'ORD-99',
      deliveryAddress: 'Baustelle 2',
      items: [{ description: 'Zement', quantity: 10, unit: 'Stk' }],
      notes: 'Entwurf',
      deliveryMethod: 'pickup'
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

    render(<DeliveryNoteForm />);

    const nameInput = screen.getByLabelText('Kunde') as HTMLInputElement;
    const addressInput = screen.getByLabelText('Adresse') as HTMLTextAreaElement;

    expect(nameInput.value).toBe('Draft Kunde');
    expect(addressInput.value).toBe('Musterstr. 1, 12345 Berlin');

    fireEvent.change(nameInput, { target: { value: 'Geaenderter Kunde' } });

    await waitFor(() => {
      const saved = localStorage.getItem(DRAFT_KEY)!;
      const parsed = JSON.parse(saved);
      expect(parsed.customerName).toBe('Geaenderter Kunde');
    });
  });

  it('generates a draft PDF when the download button is clicked', async () => {
    const generatePdfSpy = jest
      .spyOn(DeliveryNoteService, 'generatePDF')
      .mockResolvedValue(new Blob());

    render(
      <DeliveryNoteForm
        initialData={{
          customerName: 'Test Kunde',
          customerAddress: 'Teststrasse 1\n12345 Ort',
          items: [
            {
              description: 'Test Position',
              quantity: 1,
              unit: 'Stk'
            }
          ]
        }}
      />
    );

    const downloadButton = screen.getByRole('button', { name: /PDF speichern/i });
    fireEvent.click(downloadButton);

    await waitFor(() => expect(generatePdfSpy).toHaveBeenCalledTimes(1));
    const pdfPayload = generatePdfSpy.mock.calls[0][0];
    expect(pdfPayload.number).toBe('LS-ENTWURF');
    expect(pdfPayload.customerName).toBe('Test Kunde');
    expect(pdfPayload.items).toHaveLength(1);
  });
});
