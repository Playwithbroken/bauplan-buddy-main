import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DeliveryNoteManager from '@/components/delivery/DeliveryNoteManager';
import type { DeliveryNote } from '@/services/deliveryNoteService';
import { buildDeliveryNote } from '@/tests/factories';

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() })
}));

describe.skip('DeliveryNoteManager', () => {
  beforeAll(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const baseNotes: DeliveryNote[] = [
    buildDeliveryNote({
      id: 'dn-1',
      number: 'LS-TEST-0001',
      status: 'draft',
      customerName: 'Kunde A',
      projectName: 'Projekt Alpha',
      updatedAt: '2025-11-10T10:00:00.000Z'
    }),
    buildDeliveryNote({
      id: 'dn-2',
      number: 'LS-TEST-0002',
      status: 'delivered',
      customerName: 'Kunde B',
      projectName: 'Projekt Beta',
      deliveredAt: '2025-11-11T12:00:00.000Z',
      updatedAt: '2025-11-11T12:30:00.000Z'
    })
  ];

  it('renders delivery note overview and list data', () => {
    render(<DeliveryNoteManager deliveryNotes={baseNotes} />);

    expect(screen.getByText('Lieferschein-Management')).toBeInTheDocument();
    expect(screen.getByText('LS-TEST-0001')).toBeInTheDocument();
    expect(screen.getByText('Projekt Beta')).toBeInTheDocument();
    expect(screen.getByText('Offene Lieferungen')).toBeInTheDocument();
  });

  it('filters delivery notes by status', async () => {
    render(<DeliveryNoteManager deliveryNotes={baseNotes} />);

    const filter = screen.getByRole('combobox', { name: /status/i }) as HTMLSelectElement;
    fireEvent.change(filter, { target: { value: 'delivered' } });

    await waitFor(() => expect(screen.queryByText('LS-TEST-0001')).not.toBeInTheDocument());
    expect(screen.getByText('LS-TEST-0002')).toBeInTheDocument();
  });

  it('invokes creation callback when action button is clicked', async () => {
    const handleCreate = jest.fn();
    render(
      <DeliveryNoteManager
        deliveryNotes={baseNotes}
        onCreateDeliveryNote={handleCreate}
      />
    );

    const createButtons = screen.getAllByRole('button', { name: /neuer lieferschein/i });
    fireEvent.click(createButtons[0]);
    expect(handleCreate).toHaveBeenCalledTimes(1);
  });

  it('invokes selection callback when a row is clicked', async () => {
    const handleSelect = jest.fn();
    render(
      <DeliveryNoteManager
        deliveryNotes={baseNotes}
        onSelectDeliveryNote={handleSelect}
      />
    );

    const row = screen.getByText('LS-TEST-0001').closest('tr');
    expect(row).not.toBeNull();
    if (row) {
      fireEvent.click(row);
    }
    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'dn-1' }));
  });

  it('shows loading indicator when data is fetching', () => {
    render(<DeliveryNoteManager deliveryNotes={[]} isLoading />);

    expect(screen.getByText(/daten werden geladen/i)).toBeInTheDocument();
  });
});
