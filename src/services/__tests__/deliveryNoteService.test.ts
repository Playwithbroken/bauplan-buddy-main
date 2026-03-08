import DeliveryNoteService, { DeliveryNoteFormData, DeliveryNote } from '@/services/deliveryNoteService';

// Mock localStorage for tests
class LocalStorageMock {
  private store: Record<string, string> = {};
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
}

describe('DeliveryNoteService.updateDeliveryNoteStatus guardrails', () => {
  const ls = new LocalStorageMock() as unknown as Storage;
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {

    (globalThis as any).localStorage = ls;
    ls.clear();
  });

  afterAll(() => {
    // Restore original localStorage

    (globalThis as any).localStorage = originalLocalStorage;
  });

  const makeNote = (overrides: Partial<DeliveryNoteFormData> = {}): DeliveryNote => {
    const formData: DeliveryNoteFormData = {
      date: new Date().toISOString().split('T')[0],
      customerId: 'CUST-001',
      customerName: 'Test Kunde GmbH',
      customerAddress: 'Musterstraße 1, 10115 Berlin',
      items: [
        { description: 'Test Artikel', quantity: 1, unit: 'Stk' }
      ],
      notes: 'Test',
      deliveryMethod: 'pickup',
      ...overrides,
    };
    return DeliveryNoteService.createDeliveryNote(formData);
  };

  it('allows draft -> sent -> delivered', () => {
    const note = makeNote();
    expect(note.status).toBe('draft');

    const sent = DeliveryNoteService.updateDeliveryNoteStatus(note.id, 'sent');
    expect(sent).not.toBeNull();
    expect(sent!.status).toBe('sent');

    const delivered = DeliveryNoteService.updateDeliveryNoteStatus(note.id, 'delivered');
    expect(delivered).not.toBeNull();
    expect(delivered!.status).toBe('delivered');
    expect(delivered!.deliveredAt).toBeTruthy();
  });

  it('allows cancellations from draft and sent', () => {
    const note1 = makeNote();
    const cancelled1 = DeliveryNoteService.updateDeliveryNoteStatus(note1.id, 'cancelled');
    expect(cancelled1).not.toBeNull();
    expect(cancelled1!.status).toBe('cancelled');

    const note2 = makeNote();
    DeliveryNoteService.updateDeliveryNoteStatus(note2.id, 'sent');
    const cancelled2 = DeliveryNoteService.updateDeliveryNoteStatus(note2.id, 'cancelled');
    expect(cancelled2).not.toBeNull();
    expect(cancelled2!.status).toBe('cancelled');
  });

  it('blocks invalid transitions (draft -> delivered)', () => {
    const note = makeNote();
    expect(() => DeliveryNoteService.updateDeliveryNoteStatus(note.id, 'delivered')).toThrow(
      /Invalid status transition: draft/i
    );
  });

  it('blocks invalid transitions (delivered -> cancelled)', () => {
    const note = makeNote();
    DeliveryNoteService.updateDeliveryNoteStatus(note.id, 'sent');
    DeliveryNoteService.updateDeliveryNoteStatus(note.id, 'delivered');
    expect(() => DeliveryNoteService.updateDeliveryNoteStatus(note.id, 'cancelled')).toThrow(
      /Invalid status transition: delivered/i
    );
  });

  it('treats idempotent updates as no-op (sent -> sent)', () => {
    const note = makeNote();
    const sent1 = DeliveryNoteService.updateDeliveryNoteStatus(note.id, 'sent');
    expect(sent1!.status).toBe('sent');
    const sent2 = DeliveryNoteService.updateDeliveryNoteStatus(note.id, 'sent');
    expect(sent2!.status).toBe('sent');
  });

  it('returns null for unknown id', () => {
    const result = DeliveryNoteService.updateDeliveryNoteStatus('unknown-id', 'sent');
    expect(result).toBeNull();
  });
});

// Mock jsPDF and autoTable
jest.mock('jspdf', () => {
  const instance = {
    internal: {
      pageSize: {
        getWidth: () => 210
      }
    },
    setFont: jest.fn(),
    setFontSize: jest.fn(),
    text: jest.fn(),
    setFillColor: jest.fn(),
    rect: jest.fn(),
    setDrawColor: jest.fn(),
    line: jest.fn(),
    setLineWidth: jest.fn(),
    splitTextToSize: jest.fn().mockImplementation((text) => [text]),
    addPage: jest.fn(),
    output: jest.fn().mockReturnValue(new Blob(['mock'], { type: 'application/pdf' })),
    getNumberOfPages: jest.fn().mockReturnValue(1),
    setPage: jest.fn()
  };

  const ctor = jest.fn(() => instance);
  return {
    __esModule: true,
    default: ctor
  };
});

jest.mock('jspdf-autotable', () => {
  const autoTableMock = jest.fn();
  return {
    __esModule: true,
    default: autoTableMock
  };
});

describe('DeliveryNoteService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('createDeliveryNote', () => {
    it('should create a new delivery note with correct number', () => {
      const formData = {
        date: '2024-03-15',
        customerId: 'cust-123',
        customerName: 'Test Customer',
        customerAddress: 'Test Address 123',
        items: [
          {
            description: 'Test Item',
            quantity: 5,
            unit: 'Stk',
            deliveredQuantity: 5
          }
        ]
      };

      const deliveryNote = DeliveryNoteService.createDeliveryNote(formData);
      
      expect(deliveryNote).toBeDefined();
      expect(deliveryNote.number).toMatch(/^LS-2024-\d{6}$/);
      expect(deliveryNote.customerName).toBe('Test Customer');
      expect(deliveryNote.items).toHaveLength(1);
      expect(deliveryNote.status).toBe('draft');
    });
  });

  describe('getAllDeliveryNotes', () => {
    it('should return all delivery notes', () => {
      const formData1 = {
        date: '2024-03-15',
        customerId: 'cust-123',
        customerName: 'Customer 1',
        customerAddress: 'Address 1',
        items: [
          {
            description: 'Item A',
            quantity: 1,
            unit: 'Stk',
            deliveredQuantity: 1
          }
        ]
      };

      const formData2 = {
        date: '2024-03-16',
        customerId: 'cust-456',
        customerName: 'Customer 2',
        customerAddress: 'Address 2',
        items: [
          {
            description: 'Item B',
            quantity: 2,
            unit: 'Stk',
            deliveredQuantity: 2
          }
        ]
      };

      DeliveryNoteService.createDeliveryNote(formData1);
      DeliveryNoteService.createDeliveryNote(formData2);

      const deliveryNotes = DeliveryNoteService.getAllDeliveryNotes();
      
      expect(deliveryNotes).toHaveLength(2);
      expect(deliveryNotes[0].customerName).toBe('Customer 2'); // Most recent first
      expect(deliveryNotes[1].customerName).toBe('Customer 1');
    });
  });

  describe('getDeliveryNoteById', () => {
    it('should return delivery note by ID', () => {
      const formData = {
        date: '2024-03-15',
        customerId: 'cust-123',
        customerName: 'Test Customer',
        customerAddress: 'Test Address',
        items: [
          {
            description: 'Item',
            quantity: 1,
            unit: 'Stk',
            deliveredQuantity: 1
          }
        ]
      };

      const createdDeliveryNote = DeliveryNoteService.createDeliveryNote(formData);
      const foundDeliveryNote = DeliveryNoteService.getDeliveryNoteById(createdDeliveryNote.id);
      
      expect(foundDeliveryNote).toBeDefined();
      expect(foundDeliveryNote?.id).toBe(createdDeliveryNote.id);
      expect(foundDeliveryNote?.customerName).toBe('Test Customer');
    });

    it('should return null for non-existent delivery note', () => {
      const deliveryNote = DeliveryNoteService.getDeliveryNoteById('non-existent-id');
      expect(deliveryNote).toBeNull();
    });
  });

  describe('updateDeliveryNote', () => {
    it('should update an existing delivery note', () => {
      const formData = {
        date: '2024-03-15',
        customerId: 'cust-123',
        customerName: 'Test Customer',
        customerAddress: 'Test Address',
        items: [
          {
            description: 'Item 1',
            quantity: 2,
            unit: 'Stk',
            deliveredQuantity: 2
          }
        ]
      };

      const createdDeliveryNote = DeliveryNoteService.createDeliveryNote(formData);
      
      const updates = {
        customerName: 'Updated Customer',
        items: [
          {
            description: 'Updated Item',
            quantity: 5,
            unit: 'Stk',
            deliveredQuantity: 5
          }
        ]
      };

      const updatedDeliveryNote = DeliveryNoteService.updateDeliveryNote(
        createdDeliveryNote.id,
        updates
      );
      
      expect(updatedDeliveryNote).toBeDefined();
      expect(updatedDeliveryNote?.customerName).toBe('Updated Customer');
      expect(updatedDeliveryNote?.items[0].description).toBe('Updated Item');
      expect(updatedDeliveryNote?.items[0].quantity).toBe(5);
    });
  });

  describe('deleteDeliveryNote', () => {
    it('should delete a delivery note', () => {
      const formData = {
        date: '2024-03-15',
        customerId: 'cust-123',
        customerName: 'Test Customer',
        customerAddress: 'Test Address',
        items: [
          {
            description: 'Item',
            quantity: 1,
            unit: 'Stk',
            deliveredQuantity: 1
          }
        ]
      };

      const createdDeliveryNote = DeliveryNoteService.createDeliveryNote(formData);
      
      const result = DeliveryNoteService.deleteDeliveryNote(createdDeliveryNote.id);
      const deliveryNotes = DeliveryNoteService.getAllDeliveryNotes();
      
      expect(result).toBe(true);
      expect(deliveryNotes).toHaveLength(0);
    });

    it('should return false when trying to delete non-existent delivery note', () => {
      const result = DeliveryNoteService.deleteDeliveryNote('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('updateDeliveryNoteStatus', () => {
    it('should update delivery note status', () => {
      const formData = {
        date: '2024-03-15',
        customerId: 'cust-123',
        customerName: 'Test Customer',
        customerAddress: 'Test Address',
        items: [
          {
            description: 'Status Item',
            quantity: 1,
            unit: 'Stk',
            deliveredQuantity: 1
          }
        ]
      };

      const createdDeliveryNote = DeliveryNoteService.createDeliveryNote(formData);
      
      const updatedResult = DeliveryNoteService.updateDeliveryNoteStatus(
        createdDeliveryNote.id,
        'delivered'
      );
      
      const updatedDeliveryNote = DeliveryNoteService.getDeliveryNoteById(createdDeliveryNote.id);
      
      expect(updatedResult).toBeDefined();
      expect(updatedResult?.status).toBe('delivered');
      expect(updatedResult?.deliveredAt).toBeDefined();
      expect(updatedDeliveryNote?.status).toBe('delivered');
      expect(updatedDeliveryNote?.deliveredAt).toBeDefined();
    });
  });

  describe('generatePDF', () => {
    it('should generate a PDF blob', async () => {
      const formData = {
        date: '2024-03-15',
        customerId: 'cust-123',
        customerName: 'Test Customer',
        customerAddress: 'Test Address',
        items: [
          {
            description: 'Test Item',
            quantity: 5,
            unit: 'Stk',
            deliveredQuantity: 5
          }
        ]
      };

      const deliveryNote = DeliveryNoteService.createDeliveryNote(formData);
      const pdfBlob = await DeliveryNoteService.generatePDF(deliveryNote);
      
      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.type).toBe('application/pdf');
    });
  });
});
