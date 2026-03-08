import DocumentNumberingService from './documentNumberingService';

type JsPDFConstructor = typeof import('jspdf');
type AutoTableModule = typeof import('jspdf-autotable');

export interface DeliveryNoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  deliveredQuantity: number;
  notes?: string;
  sectionId?: string;
  sectionTitle?: string;
  sortOrder?: number;
}

export interface DeliveryNote {
  id: string;
  number: string;
  date: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  projectId?: string;
  projectName?: string;
  orderNumber?: string;
  deliveryAddress?: string;
  items: DeliveryNoteItem[];
  notes?: string;
  status: 'draft' | 'sent' | 'delivered' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  deliveryMethod?: string;
  signature?: string;
}

export interface DeliveryNoteFormData {
  date: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  projectId?: string;
  projectName?: string;
  orderNumber?: string;
  deliveryAddress?: string;
  items: Partial<DeliveryNoteItem>[];
  notes?: string;
  deliveryMethod?: string;
}

export interface DeliveryNoteFilters {
  status?: string;
  customerId?: string;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
}

const DELIVERY_NOTE_STATUSES: DeliveryNote['status'][] = ['draft', 'sent', 'delivered', 'cancelled'];

const normalizeOptionalString = (value?: string | null): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeDateInput = (value?: string): string => {
  if (!value) {
    return new Date().toISOString().split('T')[0];
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return parsed.toISOString().split('T')[0];
};

export class DeliveryNoteService {
  private static readonly STORAGE_KEY = 'bauplan-buddy-delivery-notes';

  /**
   * Get all delivery notes with optional filtering
   */
  static getAllDeliveryNotes(filters?: DeliveryNoteFilters): DeliveryNote[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      let deliveryNotes: DeliveryNote[] = data ? JSON.parse(data) : [];

      if (filters) {
        deliveryNotes = this.applyFilters(deliveryNotes, filters);
      }

      return deliveryNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error loading delivery notes:', error);
      return [];
    }
  }

  /**
   * Get delivery note by ID
   */
  static getDeliveryNoteById(id: string): DeliveryNote | null {
    const deliveryNotes = this.getAllDeliveryNotes();
    return deliveryNotes.find(deliveryNote => deliveryNote.id === id) || null;
  }

  /**
   * Create a new delivery note
   */
  static createDeliveryNote(formData: DeliveryNoteFormData): DeliveryNote {
    const now = new Date().toISOString();
    const customerName = formData.customerName?.trim();
    const customerAddress = formData.customerAddress?.trim();

    if (!customerName || !customerAddress) {
      throw new Error('Delivery note requires customer name and address.');
    }

    const items = this.processDeliveryNoteItems(formData.items);
    if (items.length === 0) {
      throw new Error('Delivery note requires at least one valid item.');
    }

    const deliveryNote: DeliveryNote = {
      id: this.generateId(),
      number: DocumentNumberingService.generateNumber('delivery_note').number,
      date: normalizeDateInput(formData.date),
      customerId: formData.customerId?.trim() ?? '',
      customerName,
      customerAddress,
      projectId: normalizeOptionalString(formData.projectId),
      projectName: normalizeOptionalString(formData.projectName),
      orderNumber: normalizeOptionalString(formData.orderNumber),
      deliveryAddress: normalizeOptionalString(formData.deliveryAddress),
      items,
      notes: normalizeOptionalString(formData.notes),
      deliveryMethod: normalizeOptionalString(formData.deliveryMethod) ?? 'pickup',
      status: 'draft',
      createdBy: 'current-user', // In production, get from auth context
      createdAt: now,
      updatedAt: now
    };

    const deliveryNotes = this.getAllDeliveryNotes();
    deliveryNotes.push(deliveryNote);
    this.saveDeliveryNotes(deliveryNotes);

    return deliveryNote;
  }

  /**
   * Update an existing delivery note
   */
  static updateDeliveryNote(id: string, updates: Partial<DeliveryNoteFormData>): DeliveryNote | null {
    const deliveryNotes = this.getAllDeliveryNotes();
    const index = deliveryNotes.findIndex(dn => dn.id === id);
    
    if (index === -1) return null;

    const deliveryNote = { ...deliveryNotes[index] };

    if (updates.items) {
      const items = this.processDeliveryNoteItems(updates.items);
      if (items.length === 0) {
        throw new Error('Delivery note requires at least one valid item.');
      }
      deliveryNote.items = items;
    }
    
    if (updates.date !== undefined) {
      deliveryNote.date = normalizeDateInput(updates.date);
    }
    if (updates.customerId !== undefined) {
      deliveryNote.customerId = updates.customerId?.trim() ?? '';
    }
    if (updates.customerName !== undefined) {
      const customerName = updates.customerName?.trim();
      if (!customerName) {
        throw new Error('Delivery note requires customer name.');
      }
      deliveryNote.customerName = customerName;
    }
    if (updates.customerAddress !== undefined) {
      const customerAddress = updates.customerAddress?.trim();
      if (!customerAddress) {
        throw new Error('Delivery note requires customer address.');
      }
      deliveryNote.customerAddress = customerAddress;
    }
    if (updates.projectId !== undefined) deliveryNote.projectId = normalizeOptionalString(updates.projectId);
    if (updates.projectName !== undefined) deliveryNote.projectName = normalizeOptionalString(updates.projectName);
    if (updates.orderNumber !== undefined) deliveryNote.orderNumber = normalizeOptionalString(updates.orderNumber);
    if (updates.deliveryAddress !== undefined) deliveryNote.deliveryAddress = normalizeOptionalString(updates.deliveryAddress);
    if (updates.notes !== undefined) deliveryNote.notes = normalizeOptionalString(updates.notes);
    if (updates.deliveryMethod !== undefined) {
      deliveryNote.deliveryMethod = normalizeOptionalString(updates.deliveryMethod) ?? deliveryNote.deliveryMethod;
    }
    
    deliveryNote.updatedAt = new Date().toISOString();

    deliveryNotes[index] = deliveryNote;
    this.saveDeliveryNotes(deliveryNotes);

    return deliveryNote;
  }

  /**
   * Delete delivery note
   */
  static deleteDeliveryNote(id: string): boolean {
    const deliveryNotes = this.getAllDeliveryNotes();
    const filteredDeliveryNotes = deliveryNotes.filter(dn => dn.id !== id);
    
    if (filteredDeliveryNotes.length === deliveryNotes.length) return false;
    
    this.saveDeliveryNotes(filteredDeliveryNotes);
    return true;
  }

  /**
   * Update delivery note status
   */
  static updateDeliveryNoteStatus(id: string, newStatus: DeliveryNote['status']): DeliveryNote | null {
    if (!DELIVERY_NOTE_STATUSES.includes(newStatus)) {
      throw new Error(`Unsupported delivery note status: ${newStatus}`);
    }

    const deliveryNotes = this.getAllDeliveryNotes();
    const index = deliveryNotes.findIndex(dn => dn.id === id);

    if (index === -1) {
      return null;
    }

    const current = { ...deliveryNotes[index] };
    const from = current.status;
    const to = newStatus;

    // Allowed transitions:
    // draft -> sent, draft -> cancelled
    // sent -> delivered, sent -> cancelled
    // delivered -> (terminal, no changes)
    // cancelled -> (terminal, no changes)
    const isAllowed = (
      (from === 'draft' && (to === 'sent' || to === 'cancelled')) ||
      (from === 'sent' && (to === 'delivered' || to === 'cancelled')) ||
      (from === to) // idempotent update allowed
    );

    if (!isAllowed) {
      throw new Error(`Invalid status transition: ${from} → ${to}`);
    }

    current.status = to;
    current.updatedAt = new Date().toISOString();
    current.deliveredAt = to === 'delivered' ? new Date().toISOString() : undefined;

    deliveryNotes[index] = current;
    this.saveDeliveryNotes(deliveryNotes);
    return current;
  }

  /**
   * Process delivery note items
   */
  private static processDeliveryNoteItems(items: Partial<DeliveryNoteItem>[]): DeliveryNoteItem[] {
    if (!Array.isArray(items)) {
      return [];
    }

    let currentSectionId: string | undefined;
    let currentSectionTitle: string | undefined;

    return items.map((item, index) => {
      const sectionId =
        (item.sectionId && item.sectionId.trim()) ||
        currentSectionId ||
        `section-${index + 1}`;
      const sectionTitle =
        (item.sectionTitle ?? currentSectionTitle)?.trim() || currentSectionTitle || 'Allgemeine Positionen';

      currentSectionId = sectionId;
      currentSectionTitle = sectionTitle;

      const description = item.description?.trim() ?? '';
      const quantityValue = Number(item.quantity ?? 0);
      const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 0;

      if (!description) {
        throw new Error(`Delivery note item ${index + 1} requires a description.`);
      }

      if (quantity <= 0) {
        throw new Error(`Delivery note item ${index + 1} requires a quantity greater than 0.`);
      }

      const deliveredValue =
        item.deliveredQuantity !== undefined ? Number(item.deliveredQuantity) : quantity;
      const deliveredQuantity =
        Number.isFinite(deliveredValue) && deliveredValue >= 0
          ? Math.min(deliveredValue, quantity)
          : quantity;

      return {
        id: item.id ?? this.generateId(),
        description,
        quantity,
        unit: (item.unit ?? '').trim() || 'Stk',
        deliveredQuantity,
        notes: item.notes?.trim(),
        sectionId,
        sectionTitle,
        sortOrder: index
      };
    });
  }

  /**
   * Apply filters to delivery notes
   */
  private static applyFilters(deliveryNotes: DeliveryNote[], filters: DeliveryNoteFilters): DeliveryNote[] {
    return deliveryNotes.filter(deliveryNote => {
      if (filters.status && deliveryNote.status !== filters.status) return false;
      if (filters.customerId && deliveryNote.customerId !== filters.customerId) return false;
      if (filters.projectId && deliveryNote.projectId !== filters.projectId) return false;
      
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        const deliveryNoteDate = new Date(deliveryNote.date);
        if (deliveryNoteDate < fromDate) return false;
      }
      
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        const deliveryNoteDate = new Date(deliveryNote.date);
        if (deliveryNoteDate > toDate) return false;
      }
      
      return true;
    });
  }

  /**
   * Save delivery notes to localStorage
   */
  private static saveDeliveryNotes(deliveryNotes: DeliveryNote[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(deliveryNotes));
    } catch (error) {
      console.error('Error saving delivery notes:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `dn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Lazy-load jsPDF and autoTable to avoid bloating the initial bundle.
   */
  private static async loadPdfLibraries(): Promise<{
    jsPDF: JsPDFConstructor['default'];
    autoTable: AutoTableModule['default'];
  }> {
    if (!this.pdfLibrariesPromise) {
      this.pdfLibrariesPromise = Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]).then(([jsPdfModule, autoTableModule]) => {
        const jsPDF = (jsPdfModule.default ?? (jsPdfModule as unknown)) as JsPDFConstructor['default'];
        const autoTable = (autoTableModule.default ?? (autoTableModule as unknown)) as AutoTableModule['default'];
        return { jsPDF, autoTable };
      });
    }
    return this.pdfLibrariesPromise;
  }

  private static pdfLibrariesPromise: Promise<{
    jsPDF: JsPDFConstructor['default'];
    autoTable: AutoTableModule['default'];
  }> | null = null;

  /**
   * Generate PDF for delivery note
   */
  static async generatePDF(deliveryNote: DeliveryNote): Promise<Blob> {
    const { jsPDF, autoTable } = await this.loadPdfLibraries();
    const doc = new jsPDF();
    
    // Add company header
    doc.setFontSize(20);
    doc.text('LIEFERSCHEIN', 105, 20, { align: 'center' });
    
    // Add company information
    doc.setFontSize(10);
    doc.text('Bauplan Buddy GmbH', 15, 35);
    doc.text('Musterstrasse 123', 15, 40);
    doc.text('12345 Musterstadt', 15, 45);
    doc.text('Telefon: +49 123 456789', 15, 50);
    doc.text('E-Mail: info@bauplan-buddy.de', 15, 55);
    
    // Add delivery note information
    doc.text(`Nr.: ${deliveryNote.number}`, 150, 35);
    doc.text(`Datum: ${new Date(deliveryNote.date).toLocaleDateString('de-DE')}`, 150, 40);
    
    // Add customer information
    doc.setFontSize(12);
    doc.text('Empfaenger:', 15, 70);
    doc.setFontSize(10);
    doc.text(deliveryNote.customerName, 15, 75);
    doc.text(deliveryNote.customerAddress, 15, 80);
    
    if (deliveryNote.projectName) {
      doc.text(`Projekt: ${deliveryNote.projectName}`, 15, 90);
    }
    
    if (deliveryNote.orderNumber) {
      doc.text(`Bestellnummer: ${deliveryNote.orderNumber}`, 15, 95);
    }
    
    // Add items table with grouped sections
    const sortedItems = [...deliveryNote.items].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );

    const tableBody: Array<Array<Record<string, unknown> | string>> = [];
    let currentSectionId: string | undefined;

    sortedItems.forEach(item => {
      const isNewSection = item.sectionId && item.sectionId !== currentSectionId;
      if (isNewSection && item.sectionTitle) {
        tableBody.push([
          {
            content: item.sectionTitle,
            colSpan: 5,
            styles: {
              halign: 'left',
              fontStyle: 'bold',
              fillColor: [234, 242, 245]
            }
          }
        ]);
        currentSectionId = item.sectionId;
      } else if (!currentSectionId && item.sectionTitle) {
        currentSectionId = item.sectionId;
        tableBody.push([
          {
            content: item.sectionTitle,
            colSpan: 5,
            styles: {
              halign: 'left',
              fontStyle: 'bold',
              fillColor: [234, 242, 245]
            }
          }
        ]);
      }

      tableBody.push([
        item.description,
        item.quantity.toString(),
        item.unit,
        item.deliveredQuantity.toString(),
        item.notes || ''
      ]);
    });
    
    // Use autoTable with proper typing
    autoTable(doc, {
      startY: 105,
      head: [['Beschreibung', 'Menge', 'Einheit', 'Geliefert', 'Anmerkungen']],
      body: tableBody,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] },
      margin: { top: 105 }
    });
    
    // Get the final Y position after the table
    // We need to use type assertion here as lastAutoTable is not in the official types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable?.finalY || 150;

    if (deliveryNote.notes) {
      doc.text('Anmerkungen:', 15, finalY + 10);
      doc.text(deliveryNote.notes, 15, finalY + 15);
    }

    const deliveryMethodLabel: Record<string, string> = {
      pickup: 'Abholung',
      delivery: 'Lieferung',
      express: 'Express-Lieferung',
      special: 'Sondertransport'
    };

    if (deliveryNote.deliveryMethod) {
      const methodLabel =
        deliveryMethodLabel[deliveryNote.deliveryMethod] || deliveryNote.deliveryMethod;
      doc.text(`Versandart: ${methodLabel}`, 15, finalY + 25);
    }

    const signatureY = finalY + 40;
    doc.text('Lieferdatum: ________________', 15, signatureY);
    doc.text('Unterschrift Empfaenger: ________________', 15, signatureY + 10);
    doc.text('Unterschrift Spedition: ________________', 100, signatureY + 10);
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Seite ${i} von ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    const output = doc.output('blob');

    if (output instanceof Blob) {
      return output;
    }

    return new Blob([output], { type: 'application/pdf' });
  }
}

export default DeliveryNoteService;
