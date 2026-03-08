import DocumentNumberingService from './documentNumberingService';

export interface IncomingInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit?: string;
  netPrice: number;
}

export interface IncomingInvoice {
  id: string;
  internalNumber: string;
  supplierNumber?: string;
  supplierName: string;
  supplierAddress?: string;
  contactPerson?: string;
  amount: number;
  netAmount: number;
  taxAmount: number;
  taxRate: number;
  invoiceDate: string;
  dueDate: string;
  receivedDate: string;
  category: 'materials' | 'services' | 'subcontractor' | 'utilities' | 'office' | 'other';
  status: 'received' | 'verified' | 'approved' | 'paid' | 'disputed';
  projectId?: string;
  description: string;
  notes?: string;
  attachments: string[];
  items?: IncomingInvoiceItem[];
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  paidAt?: string;
}

export interface IncomingInvoiceFormData {
  supplierName: string;
  description: string;
  netAmount: number;
  taxRate?: number;
  supplierNumber?: string;
  supplierAddress?: string;
  contactPerson?: string;
  invoiceDate?: string;
  dueDate?: string;
  receivedDate?: string;
  category?: IncomingInvoice['category'];
  projectId?: string;
  notes?: string;
  attachments?: string[];
  items?: IncomingInvoiceItem[];
}

const INCOMING_INVOICE_STATUSES: IncomingInvoice['status'][] = [
  'received', 'verified', 'approved', 'paid', 'disputed'
];

const normalizeOptionalString = (value?: string | null): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeDateInput = (value?: string): string => {
  if (!value) return new Date().toISOString().split('T')[0];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return parsed.toISOString().split('T')[0];
};

export class IncomingInvoiceService {
  private static readonly STORAGE_KEY = 'bauplan-buddy-incoming-invoices';

  /** Load all incoming invoices */
  static getAllIncomingInvoices(): IncomingInvoice[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const invoices: IncomingInvoice[] = data ? JSON.parse(data) : [];
      return invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error loading incoming invoices:', error);
      return [];
    }
  }

  /** Get by ID */
  static getIncomingInvoiceById(id: string): IncomingInvoice | null {
    const invoices = this.getAllIncomingInvoices();
    return invoices.find(inv => inv.id === id) || null;
  }

  /** Create a new incoming invoice */
  static createIncomingInvoice(formData: IncomingInvoiceFormData): IncomingInvoice {
    const supplierName = formData.supplierName?.trim();
    const description = formData.description?.trim();
    const netAmountValue = Number(formData.netAmount ?? 0);
    const taxRateValue = Number(formData.taxRate ?? 19);

    if (!supplierName) throw new Error('Incoming invoice requires supplier name.');
    if (!description) throw new Error('Incoming invoice requires description.');
    if (!Number.isFinite(netAmountValue) || netAmountValue <= 0) {
      throw new Error('Incoming invoice requires a positive net amount.');
    }

    const taxAmount = Math.round((netAmountValue * (taxRateValue / 100)) * 100) / 100;
    const totalAmount = Math.round((netAmountValue + taxAmount) * 100) / 100;

    const now = new Date().toISOString();
    const number = DocumentNumberingService.generateNumber('incoming_invoice').number;

    const invoice: IncomingInvoice = {
      id: this.generateId(),
      internalNumber: number,
      supplierNumber: normalizeOptionalString(formData.supplierNumber),
      supplierName,
      supplierAddress: normalizeOptionalString(formData.supplierAddress),
      contactPerson: normalizeOptionalString(formData.contactPerson),
      amount: totalAmount,
      netAmount: netAmountValue,
      taxAmount,
      taxRate: taxRateValue,
      invoiceDate: normalizeDateInput(formData.invoiceDate),
      dueDate: normalizeDateInput(formData.dueDate),
      receivedDate: normalizeDateInput(formData.receivedDate),
      category: formData.category ?? 'materials',
      status: 'received',
      projectId: normalizeOptionalString(formData.projectId),
      description,
      notes: normalizeOptionalString(formData.notes),
      attachments: Array.isArray(formData.attachments) ? formData.attachments : [],
      items: Array.isArray(formData.items) ? formData.items : [],
      createdAt: now,
      updatedAt: now
    };

    const invoices = this.getAllIncomingInvoices();
    invoices.push(invoice);
    this.saveIncomingInvoices(invoices);
    return invoice;
  }

  /** Update an existing incoming invoice */
  static updateIncomingInvoice(id: string, updates: Partial<IncomingInvoiceFormData>): IncomingInvoice | null {
    const invoices = this.getAllIncomingInvoices();
    const index = invoices.findIndex(inv => inv.id === id);
    if (index === -1) return null;

    const invoice = { ...invoices[index] };

    if (updates.supplierName !== undefined) {
      const supplierName = updates.supplierName?.trim();
      if (!supplierName) throw new Error('Incoming invoice requires supplier name.');
      invoice.supplierName = supplierName;
    }
    if (updates.description !== undefined) {
      const description = updates.description?.trim();
      if (!description) throw new Error('Incoming invoice requires description.');
      invoice.description = description;
    }
    if (updates.netAmount !== undefined || updates.taxRate !== undefined) {
      const netAmount = Number(updates.netAmount ?? invoice.netAmount);
      const taxRate = Number(updates.taxRate ?? invoice.taxRate);
      if (!Number.isFinite(netAmount) || netAmount <= 0) {
        throw new Error('Incoming invoice requires a positive net amount.');
      }
      const taxAmount = Math.round((netAmount * (taxRate / 100)) * 100) / 100;
      const totalAmount = Math.round((netAmount + taxAmount) * 100) / 100;
      invoice.netAmount = netAmount;
      invoice.taxRate = taxRate;
      invoice.taxAmount = taxAmount;
      invoice.amount = totalAmount;
    }

    if (updates.supplierNumber !== undefined) invoice.supplierNumber = normalizeOptionalString(updates.supplierNumber);
    if (updates.supplierAddress !== undefined) invoice.supplierAddress = normalizeOptionalString(updates.supplierAddress);
    if (updates.contactPerson !== undefined) invoice.contactPerson = normalizeOptionalString(updates.contactPerson);
    if (updates.invoiceDate !== undefined) invoice.invoiceDate = normalizeDateInput(updates.invoiceDate);
    if (updates.dueDate !== undefined) invoice.dueDate = normalizeDateInput(updates.dueDate);
    if (updates.receivedDate !== undefined) invoice.receivedDate = normalizeDateInput(updates.receivedDate);
    if (updates.category !== undefined) invoice.category = updates.category ?? invoice.category;
    if (updates.projectId !== undefined) invoice.projectId = normalizeOptionalString(updates.projectId);
    if (updates.notes !== undefined) invoice.notes = normalizeOptionalString(updates.notes);
    if (updates.attachments !== undefined) invoice.attachments = Array.isArray(updates.attachments) ? updates.attachments : invoice.attachments;
    if (updates.items !== undefined) invoice.items = Array.isArray(updates.items) ? updates.items : invoice.items;

    invoice.updatedAt = new Date().toISOString();
    invoices[index] = invoice;
    this.saveIncomingInvoices(invoices);
    return invoice;
  }

  /** Delete an incoming invoice */
  static deleteIncomingInvoice(id: string): boolean {
    const invoices = this.getAllIncomingInvoices();
    const filtered = invoices.filter(inv => inv.id !== id);
    if (filtered.length === invoices.length) return false;
    this.saveIncomingInvoices(filtered);
    return true;
  }

  /** Update status with guardrails */
  static updateIncomingInvoiceStatus(id: string, newStatus: IncomingInvoice['status']): IncomingInvoice | null {
    if (!INCOMING_INVOICE_STATUSES.includes(newStatus)) {
      throw new Error(`Unsupported incoming invoice status: ${newStatus}`);
    }

    const invoices = this.getAllIncomingInvoices();
    const index = invoices.findIndex(inv => inv.id === id);
    if (index === -1) return null;

    const current = { ...invoices[index] };
    const from = current.status;
    const to = newStatus;

    // Allowed transitions:
    // received -> verified, received -> disputed
    // verified -> approved, verified -> disputed
    // approved -> paid, approved -> disputed
    // disputed -> verified, disputed -> approved (but NOT disputed -> paid)
    // paid -> (terminal)
    // idempotent updates allowed
    const isAllowed = (
      (from === 'received' && (to === 'verified' || to === 'disputed')) ||
      (from === 'verified' && (to === 'approved' || to === 'disputed')) ||
      (from === 'approved' && (to === 'paid' || to === 'disputed')) ||
      (from === 'disputed' && (to === 'verified' || to === 'approved')) ||
      (from === to)
    );

    // Explicitly block disputed -> paid
    if (from === 'disputed' && to === 'paid') {
      throw new Error(`Invalid status transition: ${from} → ${to}`);
    }

    if (!isAllowed) {
      throw new Error(`Invalid status transition: ${from} → ${to}`);
    }

    current.status = to;
    current.updatedAt = new Date().toISOString();
    current.approvedAt = to === 'approved' ? new Date().toISOString() : current.approvedAt;
    current.paidAt = to === 'paid' ? new Date().toISOString() : undefined;

    invoices[index] = current;
    this.saveIncomingInvoices(invoices);
    return current;
  }

  /** Persist to localStorage */
  private static saveIncomingInvoices(invoices: IncomingInvoice[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(invoices));
    } catch (error) {
      console.error('Error saving incoming invoices:', error);
    }
  }

  /** Generate unique ID */
  private static generateId(): string {
    return `er-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default IncomingInvoiceService;
