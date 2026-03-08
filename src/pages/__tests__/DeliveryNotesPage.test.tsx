import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeliveryNotesPage from '@/pages/delivery/DeliveryNotesPage';
import DeliveryNoteService, { type DeliveryNote } from '@/services/deliveryNoteService';

jest.mock('@/services/deliveryNoteService');
jest.mock('@/components/LayoutWithSidebar', () => ({
  LayoutWithSidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));
jest.mock('@/components/delivery', () => {
  const actual = jest.requireActual('@/components/delivery');
  return {
    ...actual,
    DeliveryNoteManager: ({ deliveryNotes, onSelectDeliveryNote, selectedDeliveryNoteId }: any) => {
      if (!deliveryNotes.length) {
        return <div>Noch keine Lieferscheine vorhanden.</div>;
      }
      return (
        <div>
          {deliveryNotes.map((note: DeliveryNote) => (
            <button
              key={note.id}
              type="button"
              data-testid={`manager-row-${note.id}`}
              onClick={() => onSelectDeliveryNote?.(note)}
              aria-pressed={selectedDeliveryNoteId === note.id}
            >
              {note.number}
            </button>
          ))}
        </div>
      );
    },
    DeliveryNoteDialog: ({ open, onDeliveryNoteSaved }: any) =>
      open ? (
        <button type="button" onClick={() => onDeliveryNoteSaved(mockDeliveryNote)}>
          Save Delivery Note
        </button>
      ) : null
  };
});
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() })
}));

const mockDeliveryNote: DeliveryNote = {
  id: 'dn-1',
  number: 'LS-2024-000001',
  date: '2024-05-01',
  customerId: 'cust-1',
  customerName: 'Test Kunde',
  customerAddress: 'Musterstrasse 1',
  projectId: 'proj-1',
  projectName: 'Projekt Alpha',
  orderNumber: 'ORD-1',
  deliveryAddress: 'Baustelle Alpha',
  items: [
    {
      id: 'item-1',
      description: 'Bauteil',
      quantity: 5,
      unit: 'Stk',
      deliveredQuantity: 5
    }
  ],
  notes: 'Test Notiz',
  status: 'draft',
  createdBy: 'tester',
  createdAt: '2024-05-01T10:00:00.000Z',
  updatedAt: '2024-05-01T10:00:00.000Z'
};

const mockedService = DeliveryNoteService as jest.Mocked<typeof DeliveryNoteService>;

describe('DeliveryNotesPage', () => {
  beforeEach(() => {
    mockedService.getAllDeliveryNotes.mockReturnValue([mockDeliveryNote]);
    mockedService.generatePDF.mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders list and allows selecting a delivery note', async () => {
    render(<DeliveryNotesPage />);

    const managerRow = await screen.findByTestId('manager-row-dn-1');
    fireEvent.click(managerRow);

    await waitFor(() => {
      expect(screen.getByText('Test Kunde')).toBeInTheDocument();
    });
  });

  it('opens dialog and saves a delivery note', async () => {
    render(<DeliveryNotesPage />);

    const newButton = await screen.findByRole('button', { name: /neuer lieferschein/i });
    fireEvent.click(newButton);

    const saveButton = await screen.findByText('Save Delivery Note');
    fireEvent.click(saveButton);

    await waitFor(() => {
      const matches = screen.getAllByText('LS-2024-000001');
      expect(matches.length).toBeGreaterThan(0);
    });
  });
});

  it('renders empty state when no delivery notes exist', async () => {
    mockedService.getAllDeliveryNotes.mockReturnValueOnce([]);
    render(<DeliveryNotesPage />);

    await waitFor(() => {
      expect(screen.getByText(/noch keine lieferscheine vorhanden/i)).toBeInTheDocument();
    });
  });
