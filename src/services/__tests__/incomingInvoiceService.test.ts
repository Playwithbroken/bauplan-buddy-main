import IncomingInvoiceService, { IncomingInvoiceFormData, IncomingInvoice } from '@/services/incomingInvoiceService';

// Mock localStorage for tests
class LocalStorageMock {
  private store: Record<string, string> = {};
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
}

describe('IncomingInvoiceService.updateIncomingInvoiceStatus guardrails', () => {
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

  const makeInvoice = (overrides: Partial<IncomingInvoiceFormData> = {}): IncomingInvoice => {
    const formData: IncomingInvoiceFormData = {
      supplierName: 'Lieferant GmbH',
      description: 'Zementlieferung',
      netAmount: 1000,
      taxRate: 19,
      ...overrides,
    };
    return IncomingInvoiceService.createIncomingInvoice(formData);
  };

  it('allows received -> verified -> approved -> paid', () => {
    const inv = makeInvoice();
    expect(inv.status).toBe('received');

    const verified = IncomingInvoiceService.updateIncomingInvoiceStatus(inv.id, 'verified');
    expect(verified).not.toBeNull();
    expect(verified!.status).toBe('verified');

    const approved = IncomingInvoiceService.updateIncomingInvoiceStatus(inv.id, 'approved');
    expect(approved).not.toBeNull();
    expect(approved!.status).toBe('approved');
    expect(approved!.approvedAt).toBeTruthy();

    const paid = IncomingInvoiceService.updateIncomingInvoiceStatus(inv.id, 'paid');
    expect(paid).not.toBeNull();
    expect(paid!.status).toBe('paid');
    expect(paid!.paidAt).toBeTruthy();
  });

  it('allows disputed resolution: received -> disputed -> verified -> approved', () => {
    const inv = makeInvoice();
    const disputed = IncomingInvoiceService.updateIncomingInvoiceStatus(inv.id, 'disputed');
    expect(disputed).not.toBeNull();
    expect(disputed!.status).toBe('disputed');

    const verified = IncomingInvoiceService.updateIncomingInvoiceStatus(inv.id, 'verified');
    expect(verified).not.toBeNull();
    expect(verified!.status).toBe('verified');

    const approved = IncomingInvoiceService.updateIncomingInvoiceStatus(inv.id, 'approved');
    expect(approved).not.toBeNull();
    expect(approved!.status).toBe('approved');
    expect(approved!.approvedAt).toBeTruthy();
  });

  it('blocks invalid transitions (received -> paid)', () => {
    const inv = makeInvoice();
    expect(() => IncomingInvoiceService.updateIncomingInvoiceStatus(inv.id, 'paid')).toThrow(
      /Invalid status transition: received/i
    );
  });

  it('blocks invalid transitions (disputed -> paid)', () => {
    const inv = makeInvoice();
    IncomingInvoiceService.updateIncomingInvoiceStatus(inv.id, 'disputed');
    expect(() => IncomingInvoiceService.updateIncomingInvoiceStatus(inv.id, 'paid')).toThrow(
      /Invalid status transition: disputed/i
    );
  });

  it('blocks invalid transitions (paid -> approved)', () => {
    const inv = makeInvoice();
    IncomingInvoiceService.updateIncomingInvoiceStatus(inv.id, 'verified');
    IncomingInvoiceService.updateIncomingInvoiceStatus(inv.id, 'approved');
    IncomingInvoiceService.updateIncomingInvoiceStatus(inv.id, 'paid');
    expect(() => IncomingInvoiceService.updateIncomingInvoiceStatus(inv.id, 'approved')).toThrow(
      /Invalid status transition: paid/i
    );
  });

  it('treats idempotent updates as no-op (verified -> verified)', () => {
    const inv = makeInvoice();
    const v1 = IncomingInvoiceService.updateIncomingInvoiceStatus(inv.id, 'verified');
    expect(v1!.status).toBe('verified');
    const v2 = IncomingInvoiceService.updateIncomingInvoiceStatus(inv.id, 'verified');
    expect(v2!.status).toBe('verified');
  });

  it('returns null for unknown id', () => {
    const result = IncomingInvoiceService.updateIncomingInvoiceStatus('unknown-id', 'verified');
    expect(result).toBeNull();
  });
});
