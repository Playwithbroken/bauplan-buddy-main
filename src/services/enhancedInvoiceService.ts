import jsPDF from 'jspdf';
import { 
  Invoice, 
  InvoiceFormData, 
  InvoiceItem, 
  InvoiceTotals, 
  InvoiceStatus,
  InvoiceFilters,
  InvoicePayment,
  InvoiceSettings,
  InvoiceStatistics,
  InvoiceTemplate
} from '@/types/invoice';
import { EInvoicingService } from '@/services/eInvoicingService';

export class InvoiceService {
  private static readonly STORAGE_KEY = 'bauplan-buddy-invoices';
  private static readonly PAYMENTS_KEY = 'bauplan-buddy-invoice-payments';
  private static readonly SETTINGS_KEY = 'bauplan-buddy-invoice-settings';
  private static readonly TEMPLATES_KEY = 'bauplan-buddy-invoice-templates';

  /**
   * Get all invoices with optional filtering
   */
  static getAllInvoices(filters?: InvoiceFilters): Invoice[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      let invoices: Invoice[] = data ? JSON.parse(data) : [];
      invoices = invoices.map((invoice) => EInvoicingService.ensureMetadata(invoice));

      if (filters) {
        invoices = this.applyFilters(invoices, filters);
      }

      return invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error loading invoices:', error);
      return [];
    }
  }

  /**
   * Get invoice by ID
   */
  static getInvoiceById(id: string): Invoice | null {
    const invoices = this.getAllInvoices();
    return invoices.find(invoice => invoice.id === id) || null;
  }

  /**
   * Create a new invoice
   */
  static createInvoice(formData: InvoiceFormData): Invoice {
    const settings = this.getInvoiceSettings();
    const invoice: Invoice = {
      id: this.generateId(),
      number: this.generateInvoiceNumber(),
      type: formData.type,
      
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      serviceDate: formData.serviceDate,
      
      issuer: settings.companyInfo,
      recipient: formData.recipient,
      
      projectId: formData.projectId,
      projectName: formData.projectId ? `Project ${formData.projectId}` : undefined,
      customerRef: formData.customerRef,
      orderNumber: formData.orderNumber,
      quoteNumber: formData.quoteNumber,
      
      items: this.processInvoiceItems(formData.items),
      totals: this.calculateTotals([]),
      paymentTerms: {
        ...formData.paymentTerms,
        paymentDueDate: formData.dueDate,
      },
      
      status: this.createInitialStatus(),
      
      currency: formData.currency,
      language: formData.language,
      template: formData.template,
      
      notes: formData.notes,
      internalNotes: formData.internalNotes,
      
      recurring: formData.recurring ? {
        ...formData.recurring,
        issuedCount: 0,
      } : undefined,
      eInvoicing: EInvoicingService.createDefaultMetadata(formData.eInvoicing),
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user', // In production, get from auth context
      lastModifiedBy: 'current-user',
    };

    // Calculate totals after items are processed
    invoice.totals = this.calculateTotals(invoice.items);

    // Save invoice
    const invoices = this.getAllInvoices();
    invoices.push(invoice);
    this.saveInvoices(invoices);

    return invoice;
  }

  /**
   * Update an existing invoice
   */
  static updateInvoice(id: string, updates: Partial<InvoiceFormData>): Invoice | null {
    const invoices = this.getAllInvoices();
    const index = invoices.findIndex(inv => inv.id === id);
    
    if (index === -1) return null;

    const invoice = invoices[index];
    
    // Update fields
    if (updates.items) {
      invoice.items = this.processInvoiceItems(updates.items);
      invoice.totals = this.calculateTotals(invoice.items);
    }
    
    if (updates.recipient) invoice.recipient = updates.recipient;
    if (updates.notes !== undefined) invoice.notes = updates.notes;
    if (updates.internalNotes !== undefined) invoice.internalNotes = updates.internalNotes;
    
    invoice.updatedAt = new Date().toISOString();
    invoice.lastModifiedBy = 'current-user';

    invoices[index] = EInvoicingService.ensureMetadata(invoice);
    this.saveInvoices(invoices);

    return invoice;
  }

  /**
   * Replace invoice record with provided invoice data
   */
  static replaceInvoice(updatedInvoice: Invoice): Invoice {
    const invoices = this.getAllInvoices();
    const index = invoices.findIndex(inv => inv.id === updatedInvoice.id);

    const ensured = EInvoicingService.ensureMetadata(updatedInvoice);

    if (index === -1) {
      invoices.push(ensured);
    } else {
      invoices[index] = ensured;
    }

    this.saveInvoices(invoices);
    return ensured;
  }

  /**
   * Delete invoice
   */
  static deleteInvoice(id: string): boolean {
    const invoices = this.getAllInvoices();
    const filteredInvoices = invoices.filter(inv => inv.id !== id);
    
    if (filteredInvoices.length === invoices.length) return false;
    
    this.saveInvoices(filteredInvoices);
    return true;
  }

  /**
   * Update invoice status
   */
  static updateInvoiceStatus(id: string, newStatus: string, note?: string): boolean {
    const invoices = this.getAllInvoices();
    const invoice = invoices.find(inv => inv.id === id);
    
    if (!invoice) return false;

    const statusUpdate = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      note,
      user: 'current-user',
    };

    invoice.status.statusHistory.push(statusUpdate);
    invoice.status.status = newStatus as Invoice['status']['status'];
    invoice.updatedAt = new Date().toISOString();

    // Update specific date fields based on status
    switch (newStatus) {
      case 'sent':
        if (!invoice.status.sentDate) {
          invoice.status.sentDate = new Date().toISOString();
        }
        break;
      case 'viewed':
        if (!invoice.status.viewedDate) {
          invoice.status.viewedDate = new Date().toISOString();
        }
        break;
      case 'paid':
        if (!invoice.status.paidDate) {
          invoice.status.paidDate = new Date().toISOString();
        }
        invoice.status.paymentStatus = 'paid';
        break;
    }

    this.saveInvoices(invoices);
    return true;
  }

  /**
   * Add payment to invoice
   */
  static addPayment(payment: Omit<InvoicePayment, 'id' | 'createdAt' | 'createdBy'>): InvoicePayment {
    const newPayment: InvoicePayment = {
      ...payment,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      createdBy: 'current-user',
    };

    // Save payment
    const payments = this.getAllPayments();
    payments.push(newPayment);
    this.savePayments(payments);

    // Update invoice payment status
    this.updateInvoicePaymentStatus(payment.invoiceId);

    return newPayment;
  }

  /**
   * Generate PDF for invoice
   */
  static async generatePDF(invoice: Invoice, template?: string): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;

    // Colors
    const primaryColor = '#2563eb';
    const textColor = '#374151';

    // Company Header
    pdf.setFontSize(24);
    pdf.setTextColor(primaryColor);
    pdf.text('Bauplan Buddy', margin, 30);
    
    pdf.setFontSize(10);
    pdf.setTextColor(textColor);
    pdf.text('Construction Management', margin, 38);

    // Company Address
    let yPos = 50;
    pdf.setFontSize(9);
    const companyLines = [
      invoice.issuer.company || invoice.issuer.name,
      invoice.issuer.street,
      `${invoice.issuer.postalCode} ${invoice.issuer.city}`,
      invoice.issuer.country,
      invoice.issuer.email,
      invoice.issuer.phone,
    ].filter(Boolean);

    companyLines.forEach(line => {
      pdf.text(line, margin, yPos);
      yPos += 5;
    });

    // Invoice Title and Number
    pdf.setFontSize(20);
    pdf.setTextColor(primaryColor);
    const invoiceTitle = invoice.type === 'credit_note' ? 'Gutschrift' : 
                        invoice.type === 'proforma' ? 'Proforma-Rechnung' : 'Rechnung';
    pdf.text(invoiceTitle, pageWidth - margin - 70, 30, { align: 'right' });

    pdf.setFontSize(12);
    pdf.setTextColor(textColor);
    pdf.text(`Nr. ${invoice.number}`, pageWidth - margin - 70, 40, { align: 'right' });

    // Customer Address
    yPos = 80;
    pdf.setFontSize(11);
    pdf.text('Rechnungsadresse:', margin, yPos);
    yPos += 8;

    const customerLines = [
      invoice.recipient.company,
      invoice.recipient.name,
      invoice.recipient.street,
      `${invoice.recipient.postalCode} ${invoice.recipient.city}`,
      invoice.recipient.country,
    ].filter(Boolean);

    customerLines.forEach(line => {
      pdf.text(line, margin, yPos);
      yPos += 5;
    });

    // Invoice Details
    const detailsX = pageWidth - margin - 80;
    yPos = 80;
    
    const details = [
      ['Rechnungsdatum:', new Date(invoice.issueDate).toLocaleDateString('de-DE')],
      ['Fälligkeitsdatum:', new Date(invoice.dueDate).toLocaleDateString('de-DE')],
      ['Leistungsdatum:', invoice.serviceDate ? new Date(invoice.serviceDate).toLocaleDateString('de-DE') : '-'],
      ['Währung:', invoice.currency],
    ];

    details.forEach(([label, value]) => {
      pdf.setFontSize(9);
      pdf.text(label, detailsX, yPos);
      pdf.text(value, detailsX + 30, yPos);
      yPos += 6;
    });

    // Items Table
    yPos = 140;
    const tableHeaders = ['Pos.', 'Beschreibung', 'Menge', 'Einheit', 'Einzelpreis', 'Gesamt'];
    const colWidths = [15, 80, 20, 20, 25, 25];
    let xPos = margin;

    // Table Header
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');
    
    pdf.setFontSize(9);
    pdf.setTextColor(textColor);
    tableHeaders.forEach((header, i) => {
      pdf.text(header, xPos + 2, yPos, { align: 'left' });
      xPos += colWidths[i];
    });

    yPos += 15;

    // Table Rows
    invoice.items.forEach((item, index) => {
      xPos = margin;
      const rowData = [
        (index + 1).toString(),
        item.description,
        item.quantity.toString(),
        item.unit,
        `${item.unitPrice.toFixed(2)} €`,
        `${item.totalGross.toFixed(2)} €`
      ];

      pdf.setFontSize(8);
      rowData.forEach((data, i) => {
        if (i === 1) { // Description column - allow text wrapping
          const lines = pdf.splitTextToSize(data, colWidths[i] - 4);
          pdf.text(lines, xPos + 2, yPos);
        } else {
          pdf.text(data, xPos + 2, yPos, { align: i === 0 ? 'left' : 'left' });
        }
        xPos += colWidths[i];
      });

      yPos += 12;
    });

    // Totals
    yPos += 10;
    const totalsX = pageWidth - margin - 60;
    
    const totalsData = [
      ['Zwischensumme (netto):', `${invoice.totals.subtotalNet.toFixed(2)} €`],
      ['MwSt.:', `${invoice.totals.totalTax.toFixed(2)} €`],
      ['Gesamt (brutto):', `${invoice.totals.totalGross.toFixed(2)} €`],
    ];

    totalsData.forEach(([label, value], index) => {
      pdf.setFontSize(index === totalsData.length - 1 ? 12 : 10);
      pdf.setFont(undefined, index === totalsData.length - 1 ? 'bold' : 'normal');
      pdf.text(label, totalsX - 50, yPos);
      pdf.text(value, totalsX, yPos, { align: 'right' });
      yPos += 8;
    });

    // Payment Terms
    if (invoice.paymentTerms.bankDetails) {
      yPos += 20;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text('Zahlungsinformationen:', margin, yPos);
      yPos += 8;

      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      const bankDetails = [
        `Kontoinhaber: ${invoice.paymentTerms.bankDetails.accountHolder}`,
        `IBAN: ${invoice.paymentTerms.bankDetails.iban}`,
        `BIC: ${invoice.paymentTerms.bankDetails.bic}`,
        `Bank: ${invoice.paymentTerms.bankDetails.bankName}`,
      ];

      bankDetails.forEach(detail => {
        pdf.text(detail, margin, yPos);
        yPos += 5;
      });
    }

    // Notes
    if (invoice.notes) {
      yPos += 15;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text('Anmerkungen:', margin, yPos);
      yPos += 8;

      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      const noteLines = pdf.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
      pdf.text(noteLines, margin, yPos);
    }

    // Footer
    const footerY = pageHeight - 20;
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Erstellt am ${new Date().toLocaleDateString('de-DE')} | Bauplan Buddy Construction Management`, 
              pageWidth / 2, footerY, { align: 'center' });

    return pdf.output('blob');
  }

  /**
   * Get invoice statistics
   */
  static getInvoiceStatistics(): InvoiceStatistics {
    const invoices = this.getAllInvoices();
    const payments = this.getAllPayments();

    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totals.totalGross, 0);
    const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const overdueAmount = invoices
      .filter(inv => inv.status.status === 'overdue')
      .reduce((sum, inv) => sum + inv.totals.totalDue, 0);

    const byStatus = invoices.reduce((acc, inv) => {
      const status = inv.status.status;
      if (!acc[status]) {
        acc[status] = { count: 0, amount: 0 };
      }
      acc[status].count++;
      acc[status].amount += inv.totals.totalGross;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    return {
      totalInvoices,
      totalAmount,
      paidAmount,
      overdueAmount,
      averagePaymentTime: 0, // Would need payment history analysis
      byStatus,
      byMonth: [], // Would need date-based grouping
      topCustomers: [], // Would need customer aggregation
    };
  }

  // Private helper methods

  private static processInvoiceItems(items: Partial<InvoiceItem>[]): InvoiceItem[] {
    return items.map((item, index) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const discount = Number(item.discount) || 0;
      const taxRate = Number(item.taxRate) || 0;

      let netAmount = quantity * unitPrice;
      
      // Apply discount
      if (discount > 0) {
        if (item.discountType === 'percentage') {
          netAmount = netAmount * (1 - discount / 100);
        } else {
          netAmount = Math.max(0, netAmount - discount);
        }
      }

      const taxAmount = netAmount * (taxRate / 100);
      const grossAmount = netAmount + taxAmount;

      return {
        id: item.id || this.generateId(),
        description: item.description || '',
        quantity,
        unit: item.unit || 'Stk',
        unitPrice,
        discount,
        discountType: item.discountType || 'percentage',
        taxRate,
        totalNet: netAmount,
        totalGross: grossAmount,
        category: item.category,
        projectPhase: item.projectPhase,
      };
    });
  }

  private static calculateTotals(items: InvoiceItem[]): InvoiceTotals {
    const subtotalNet = items.reduce((sum, item) => sum + item.totalNet, 0);
    const totalTax = items.reduce((sum, item) => sum + (item.totalGross - item.totalNet), 0);
    const totalGross = items.reduce((sum, item) => sum + item.totalGross, 0);
    
    // Calculate tax breakdown
    const taxBreakdown = items.reduce((acc, item) => {
      const rate = item.taxRate.toString();
      if (!acc[rate]) {
        acc[rate] = { net: 0, tax: 0, gross: 0 };
      }
      acc[rate].net += item.totalNet;
      acc[rate].tax += (item.totalGross - item.totalNet);
      acc[rate].gross += item.totalGross;
      return acc;
    }, {} as Record<string, { net: number; tax: number; gross: number }>);

    return {
      subtotalNet,
      totalDiscount: 0, // Would need to track item-level discounts
      totalTax,
      totalGross,
      totalPaid: 0, // Calculated from payments
      totalDue: totalGross,
      taxBreakdown,
    };
  }

  private static createInitialStatus(): InvoiceStatus {
    return {
      status: 'draft',
      statusHistory: [{
        status: 'draft',
        timestamp: new Date().toISOString(),
        user: 'current-user',
      }],
      paymentStatus: 'unpaid',
      remindersSent: 0,
    };
  }

  private static applyFilters(invoices: Invoice[], filters: InvoiceFilters): Invoice[] {
    return invoices.filter(invoice => {
      if (filters.status && !filters.status.includes(invoice.status.status)) return false;
      if (filters.type && !filters.type.includes(invoice.type)) return false;
      if (filters.projectId && invoice.projectId !== filters.projectId) return false;
      if (filters.dateFrom && invoice.issueDate < filters.dateFrom) return false;
      if (filters.dateTo && invoice.issueDate > filters.dateTo) return false;
      if (filters.amountMin && invoice.totals.totalGross < filters.amountMin) return false;
      if (filters.amountMax && invoice.totals.totalGross > filters.amountMax) return false;
      if (filters.overdue && invoice.status.status !== 'overdue') return false;
      
      return true;
    });
  }

  private static updateInvoicePaymentStatus(invoiceId: string): void {
    const invoice = this.getInvoiceById(invoiceId);
    if (!invoice) return;

    const payments = this.getAllPayments().filter(p => p.invoiceId === invoiceId);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    invoice.totals.totalPaid = totalPaid;
    invoice.totals.totalDue = invoice.totals.totalGross - totalPaid;

    if (totalPaid === 0) {
      invoice.status.paymentStatus = 'unpaid';
    } else if (totalPaid >= invoice.totals.totalGross) {
      invoice.status.paymentStatus = 'paid';
      this.updateInvoiceStatus(invoiceId, 'paid');
    } else {
      invoice.status.paymentStatus = 'partial';
      this.updateInvoiceStatus(invoiceId, 'partial');
    }

    const invoices = this.getAllInvoices();
    const index = invoices.findIndex(inv => inv.id === invoiceId);
    if (index !== -1) {
      invoices[index] = EInvoicingService.ensureMetadata(invoice);
      this.saveInvoices(invoices);
    }
  }

  private static generateId(): string {
    return `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateInvoiceNumber(): string {
    const settings = this.getInvoiceSettings();
    const year = new Date().getFullYear();
    const nextNumber = settings.numberingScheme.nextNumber;
    
    // Update next number
    settings.numberingScheme.nextNumber = nextNumber + 1;
    this.saveInvoiceSettings(settings);
    
    return settings.numberingScheme.format
      .replace('{YYYY}', year.toString())
      .replace('{NNNNNN}', nextNumber.toString().padStart(6, '0'));
  }

  private static getAllPayments(): InvoicePayment[] {
    try {
      const data = localStorage.getItem(this.PAYMENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static savePayments(payments: InvoicePayment[]): void {
    localStorage.setItem(this.PAYMENTS_KEY, JSON.stringify(payments));
  }

  private static saveInvoices(invoices: Invoice[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(invoices));
  }

  private static getInvoiceSettings(): InvoiceSettings {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? JSON.parse(data) : this.getDefaultSettings();
    } catch {
      return this.getDefaultSettings();
    }
  }

  private static saveInvoiceSettings(settings: InvoiceSettings): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  private static getDefaultSettings(): InvoiceSettings {
    return {
      companyInfo: {
        company: 'Bauplan Buddy GmbH',
        name: 'Bauplan Buddy',
        street: 'Musterstraße 123',
        postalCode: '12345',
        city: 'Musterstadt',
        country: 'Deutschland',
        vatNumber: 'DE123456789',
        email: 'info@bauplan-buddy.de',
        phone: '+49 123 456789',
      },
      defaultPaymentTerms: {
        paymentDueDate: '',
        paymentMethod: 'bank_transfer',
        bankDetails: {
          accountHolder: 'Bauplan Buddy GmbH',
          iban: 'DE12 1234 1234 1234 1234 12',
          bic: 'DEUTDEFF',
          bankName: 'Deutsche Bank',
        },
      },
      taxSettings: {
        defaultTaxRate: 19,
        taxRates: [
          { name: 'Standard', rate: 19, description: 'Standardsatz' },
          { name: 'Ermäßigt', rate: 7, description: 'Ermäßigter Satz' },
          { name: 'Befreit', rate: 0, description: 'Steuerbefreit' },
        ],
      },
      numberingScheme: {
        prefix: 'RG',
        nextNumber: 1,
        resetYearly: true,
        format: 'RG-{YYYY}-{NNNNNN}',
      },
      defaultTemplate: 'standard',
      defaultCurrency: 'EUR',
      defaultLanguage: 'de',
      reminderSettings: {
        enabled: true,
        firstReminderDays: 7,
        secondReminderDays: 14,
        finalReminderDays: 21,
        autoSend: false,
      },
    };
  }
}
