import jsPDF from 'jspdf';
import DocumentNumberingService from './documentNumberingService';

const DEFAULT_SECTION_TITLE = 'Leistungen';

const generateSectionId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `section-${crypto.randomUUID()}`;
  }
  return `section-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export interface InvoicePosition {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  taxRate: number;
  category?: string;
  sectionId?: string;
  sectionTitle?: string;
  sortOrder?: number;
}

export interface InvoiceData {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerEmail?: string;
  projectId?: string;
  projectName?: string;
  positions: InvoicePosition[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentTerms: string;
  notes?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdBy: string;
  createdAt: string;
  sentAt?: string;
  paidAt?: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  taxNumber?: string;
  vatNumber?: string;
  bankName?: string;
  iban?: string;
  bic?: string;
}

export class InvoiceGenerationService {
  private static instance: InvoiceGenerationService;
  
  private companyInfo: CompanyInfo = {
    name: "Bauplan Buddy GmbH",
    address: "Musterstrasse 123",
    city: "80331 Muenchen",
    postalCode: "80331",
    country: "Deutschland",
    phone: "+49 89 123456789",
    email: "info@bauplan-buddy.de",
    website: "www.bauplan-buddy.de",
    taxNumber: "123/456/78901",
    vatNumber: "DE123456789",
    bankName: "Muster Bank",
    iban: "DE89 3704 0044 0532 0130 00",
    bic: "COBADEFFXXX"
  };

  public static getInstance(): InvoiceGenerationService {
    if (!InvoiceGenerationService.instance) {
      InvoiceGenerationService.instance = new InvoiceGenerationService();
    }
    return InvoiceGenerationService.instance;
  }

  /**
   * Generate automatic invoice number
   */
  public generateInvoiceNumber(): string {
    return DocumentNumberingService.generateNumber('invoice').number;
  }

  private generateInvoiceId(): string {
    const random = Math.random().toString(36).slice(2, 8);
    return `invoice_${Date.now()}_${random}`;
  }

  /**
   * Calculate invoice totals
   */
  public calculateInvoiceTotals(positions: InvoicePosition[]): {
    subtotal: number;
    taxAmount: number;
    total: number;
    taxBreakdown: { rate: number; amount: number }[];
  } {
    const normalizedPositions = positions
      .filter((pos): pos is InvoicePosition => pos !== null && pos !== undefined)
      .map(pos => {
        const total = Number(pos.total);
        const parsedTax = Number(pos.taxRate);

        return {
          total: Number.isFinite(total) ? total : 0,
          taxRate: Number.isFinite(parsedTax) ? parsedTax : 0
        };
      });

    const subtotal = normalizedPositions.reduce((sum, pos) => sum + pos.total, 0);
    
    // Group by tax rates
    const taxGroups = normalizedPositions.reduce((groups, pos) => {
      const rate = pos.taxRate;
      if (!groups[rate]) {
        groups[rate] = 0;
      }
      groups[rate] += pos.total;
      return groups;
    }, {} as Record<number, number>);

    // Calculate tax amounts
    const taxBreakdown = Object.entries(taxGroups).map(([rate, amount]) => ({
      rate: Number(rate),
      amount: (amount * Number(rate)) / 100
    }));

    const taxAmount = taxBreakdown.reduce((sum, tax) => sum + tax.amount, 0);
    const total = subtotal + taxAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      taxBreakdown
    };
  }

  /**
   * Generate PDF invoice
   */
  public async generateInvoicePDF(invoice: InvoiceData): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = 20;

    // Helper function to add text with line breaks
    const addText = (text: string, x: number, y: number, options?: Record<string, unknown>) => {
      doc.text(text, x, y, options);
      return y + (Number(options?.lineHeight) || 6);
    };

    // Company Logo/Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    currentY = addText(this.companyInfo.name, margin, currentY, { lineHeight: 8 });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    currentY = addText(this.companyInfo.address, margin, currentY);
    currentY = addText(`${this.companyInfo.postalCode} ${this.companyInfo.city}`, margin, currentY);
    currentY = addText(`Tel: ${this.companyInfo.phone}`, margin, currentY);
    currentY = addText(`Email: ${this.companyInfo.email}`, margin, currentY);
    
    if (this.companyInfo.website) {
      currentY = addText(`Web: ${this.companyInfo.website}`, margin, currentY);
    }

    currentY += 10;

    // Invoice Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    currentY = addText('RECHNUNG', pageWidth - margin, currentY, { 
      align: 'right',
      lineHeight: 10 
    });

    // Invoice Details (right side)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const detailsX = pageWidth - 80;
    let detailsY = currentY;
    
    detailsY = addText(`Rechnungsnummer: ${invoice.number}`, detailsX, detailsY);
    detailsY = addText(`Rechnungsdatum: ${new Date(invoice.date).toLocaleDateString('de-DE')}`, detailsX, detailsY);
    detailsY = addText(`Faelligkeitsdatum: ${new Date(invoice.dueDate).toLocaleDateString('de-DE')}`, detailsX, detailsY);
    
    if (invoice.projectName) {
      detailsY = addText(`Projekt: ${invoice.projectName}`, detailsX, detailsY);
    }

    // Customer Address (left side)
    currentY += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    currentY = addText('Rechnung an:', margin, currentY, { lineHeight: 8 });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    currentY = addText(invoice.customerName, margin, currentY);
    
    // Split address into lines
    const addressLines = invoice.customerAddress.split(',').map(line => line.trim());
    addressLines.forEach(line => {
      currentY = addText(line, margin, currentY);
    });

    currentY = Math.max(currentY, detailsY) + 20;

// Positions Table
    const tableHeaders = ['Pos.', 'Beschreibung', 'Menge', 'Einheit', 'Einzelpreis', 'Gesamtpreis'];
    const columnWidths = [15, 80, 20, 20, 25, 30];

    const drawTableHeader = () => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      currentY = addText('Leistungsverzeichnis', margin, currentY, { lineHeight: 10 });

      const headerTop = currentY;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, currentY, pageWidth - 2 * margin, 8, 'F');

      currentY += 6;
      let headerX = margin;
      tableHeaders.forEach((header, index) => {
        doc.text(header, headerX + 2, currentY);
        headerX += columnWidths[index];
      });

      currentY += 3;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, headerTop, pageWidth - margin, headerTop);
      doc.line(margin, currentY, pageWidth - margin, currentY);
    };

    const sortedPositions = [...invoice.positions].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );

    if (sortedPositions.length === 0) {
      currentY = addText('Keine Positionen erfasst.', margin, currentY + 8);
    } else {
      drawTableHeader();

      doc.setFont('helvetica', 'normal');
      let tableX = margin;
      let currentSectionKey: string | undefined;
      let lineNumber = 1;

      sortedPositions.forEach(position => {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
          drawTableHeader();
        }

        const normalizedSectionTitle = position.sectionTitle?.trim();
        const sectionKey = position.sectionId ?? normalizedSectionTitle;

        if (normalizedSectionTitle && sectionKey !== currentSectionKey) {
          currentSectionKey = sectionKey;
          currentY += 8;
          doc.setFont('helvetica', 'bold');
          doc.setFillColor(234, 242, 245);
          doc.rect(margin, currentY - 6, pageWidth - 2 * margin, 6, 'F');
          doc.text(normalizedSectionTitle, margin + 2, currentY - 2);
          doc.setDrawColor(220, 220, 220);
          doc.line(margin, currentY, pageWidth - margin, currentY);
          doc.setFont('helvetica', 'normal');
          currentY += 4;
        }

        currentY += 8;
        tableX = margin;

        const rowData = [
          lineNumber.toString(),
          position.description,
          position.quantity.toString(),
          position.unit,
          'EUR ' + position.unitPrice.toFixed(2),
          'EUR ' + position.total.toFixed(2)
        ];

        rowData.forEach((data, colIndex) => {
          const maxWidth = columnWidths[colIndex] - 4;
          if (colIndex === 1) {
            const linesToDraw = doc.splitTextToSize(data, maxWidth);
            doc.text(linesToDraw, tableX + 2, currentY);
            if (linesToDraw.length > 1) {
              currentY += (linesToDraw.length - 1) * 5;
            }
          } else {
            doc.text(data, tableX + 2, currentY, {
              maxWidth,
              align: colIndex > 1 ? 'right' : 'left'
            });
          }
          tableX += columnWidths[colIndex];
        });

        doc.setDrawColor(200, 200, 200);
        doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2);

        lineNumber += 1;
      });
    }
    // Totals Section
    const totalsX = pageWidth - 80;
    doc.setFont('helvetica', 'normal');

    const totalsForPdf = this.calculateInvoiceTotals(invoice.positions);
    const subtotalValue = typeof invoice.subtotal === 'number' ? invoice.subtotal : totalsForPdf.subtotal;
    const totalValue = typeof invoice.total === 'number' ? invoice.total : totalsForPdf.total;
    const taxBreakdown = totalsForPdf.taxBreakdown;

    currentY = addText(`Zwischensumme: EUR ${subtotalValue.toFixed(2)}`, totalsX, currentY);

    // Tax breakdown
    taxBreakdown.forEach(tax => {
      if (tax.amount > 0) {
        currentY = addText(`MwSt. ${tax.rate}%: EUR ${tax.amount.toFixed(2)}`, totalsX, currentY);
      }
    });

    // Draw line above total
    doc.setLineWidth(0.5);
    doc.line(totalsX, currentY + 2, pageWidth - margin, currentY + 2);
    currentY += 8;

    // Total
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    currentY = addText(`Gesamtbetrag: EUR ${totalValue.toFixed(2)}`, totalsX, currentY);

    currentY += 15;

    // Payment Terms
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    currentY = addText('Zahlungsbedingungen:', margin, currentY, { lineHeight: 8 });
    
    doc.setFont('helvetica', 'normal');
    currentY = addText(invoice.paymentTerms, margin, currentY);

    // Notes
    if (invoice.notes) {
      currentY += 8;
      doc.setFont('helvetica', 'bold');
      currentY = addText('Anmerkungen:', margin, currentY, { lineHeight: 8 });
      
      doc.setFont('helvetica', 'normal');
      const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
      noteLines.forEach((line: string) => {
        currentY = addText(line, margin, currentY);
      });
    }

    // Footer with company details
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    } else {
      currentY = 250;
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    
    let footerY = currentY;
    if (this.companyInfo.taxNumber) {
      footerY = addText(`Steuernummer: ${this.companyInfo.taxNumber}`, margin, footerY);
    }
    if (this.companyInfo.vatNumber) {
      footerY = addText(`USt-IdNr.: ${this.companyInfo.vatNumber}`, margin, footerY);
    }

    if (this.companyInfo.bankName && this.companyInfo.iban) {
      footerY += 5;
      footerY = addText('Bankverbindung:', margin, footerY);
      footerY = addText(`${this.companyInfo.bankName}`, margin, footerY);
      footerY = addText(`IBAN: ${this.companyInfo.iban}`, margin, footerY);
      if (this.companyInfo.bic) {
        footerY = addText(`BIC: ${this.companyInfo.bic}`, margin, footerY);
      }
    }

    return doc.output('blob') as Blob;
  }

  /**
   * Send invoice via email
   */
  public async sendInvoiceEmail(invoice: InvoiceData, pdfBlob: Blob): Promise<boolean> {
    try {
      // In a real implementation, this would integrate with an email service
      // For now, we'll simulate the email sending
      
      const emailData = {
        to: invoice.customerEmail,
        subject: `Rechnung ${invoice.number} - ${this.companyInfo.name}`,
        body: this.generateEmailBody(invoice),
        attachments: [
          {
            filename: `Rechnung_${invoice.number}.pdf`,
            content: pdfBlob
          }
        ]
      };

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Email would be sent:', emailData);
      return true;
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      return false;
    }
  }

  /**
   * Generate email body for invoice
   */
  private generateEmailBody(invoice: InvoiceData): string {
    return `
Sehr geehrte Damen und Herren,

anbei erhalten Sie unsere Rechnung ${invoice.number}${invoice.projectName ? ` fuer das Projekt "${invoice.projectName}"` : ''}.

Rechnungsdatum: ${new Date(invoice.date).toLocaleDateString('de-DE')}
Faelligkeitsdatum: ${new Date(invoice.dueDate).toLocaleDateString('de-DE')}
Rechnungsbetrag: EUR ${invoice.total.toFixed(2)}

${invoice.paymentTerms}

Bei Fragen stehen wir Ihnen gerne zur Verfuegung.

Mit freundlichen Gruessen
${this.companyInfo.name}

---
${this.companyInfo.name}
${this.companyInfo.address}
${this.companyInfo.postalCode} ${this.companyInfo.city}
Tel: ${this.companyInfo.phone}
Email: ${this.companyInfo.email}
${this.companyInfo.website ? `Web: ${this.companyInfo.website}` : ''}
    `.trim();
  }

  /**
   * Create invoice from quote
   */
  public createInvoiceFromQuote(quote: Record<string, unknown>): Partial<InvoiceData> {
    const sectionMap = new Map<string, string>();

    const positions = Array.isArray(quote.positions)
      ? quote.positions.map((pos: Record<string, unknown>, index: number) => {
          const parsedTax = Number(pos.taxRate);
          const taxRate = Number.isFinite(parsedTax) ? parsedTax : 19;

          const rawSectionTitle =
            typeof pos.sectionTitle === 'string' && pos.sectionTitle.trim().length > 0
              ? pos.sectionTitle.trim()
              : typeof pos.category === 'string' && pos.category.trim().length > 0
              ? pos.category.trim()
              : DEFAULT_SECTION_TITLE;

          let sectionId =
            (typeof pos.sectionId === 'string' && pos.sectionId.trim().length > 0
              ? pos.sectionId.trim()
              : undefined) ?? sectionMap.get(rawSectionTitle);

          if (!sectionId) {
            sectionId = generateSectionId();
            sectionMap.set(rawSectionTitle, sectionId);
          } else if (!sectionMap.has(rawSectionTitle)) {
            sectionMap.set(rawSectionTitle, sectionId);
          }

          return {
            id: String(pos.id || '') || generateSectionId(),
            description: String(pos.description || ''),
            quantity: Number(pos.quantity) || 0,
            unit: String(pos.unit || ''),
            unitPrice: Number(pos.unitPrice) || 0,
            total: Number(pos.total) || 0,
            taxRate,
            category: typeof pos.category === 'string' ? pos.category : undefined,
            sectionId,
            sectionTitle: rawSectionTitle,
            sortOrder: index
          };
        })
      : [];

    const totals = this.calculateInvoiceTotals(positions);

    return {
      number: this.generateInvoiceNumber(),
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      customerId: String(quote.customerId || ''),
      customerName: String(quote.customer || ''),
      customerAddress: String(quote.address || ''),
      customerEmail: String(quote.email || ''),
      projectId: String(quote.projectId || ''),
      projectName: String(quote.project || ''),
      positions,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
      paymentTerms: 'Zahlbar innerhalb von 30 Tagen ohne Abzug.',
      status: 'draft',
      id: this.generateInvoiceId(),
      createdBy: 'current-user',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Update company information
   */
  public updateCompanyInfo(companyInfo: Partial<CompanyInfo>): void {
    this.companyInfo = { ...this.companyInfo, ...companyInfo };
  }

  /**
   * Get company information
   */
  public getCompanyInfo(): CompanyInfo {
    return { ...this.companyInfo };
  }
}

export default InvoiceGenerationService.getInstance();

