import DeliveryNoteService from '../deliveryNoteService';

describe('DeliveryNoteService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should create a delivery note', () => {
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
    expect(deliveryNote.customerName).toBe('Test Customer');
    expect(deliveryNote.items).toHaveLength(1);
    expect(deliveryNote.status).toBe('draft');
  });

  it('should retrieve all delivery notes', () => {
    const formData = {
      date: '2024-03-15',
      customerId: 'cust-123',
      customerName: 'Test Customer',
      customerAddress: 'Test Address',
      items: []
    };

    DeliveryNoteService.createDeliveryNote(formData);
    const deliveryNotes = DeliveryNoteService.getAllDeliveryNotes();
    
    expect(deliveryNotes).toHaveLength(1);
    expect(deliveryNotes[0].customerName).toBe('Test Customer');
  });
});