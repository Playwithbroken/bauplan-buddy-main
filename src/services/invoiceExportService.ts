import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export interface InvoiceExportData {
  id: string;
  number: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerAddress?: string;
  customerEmail: string;
  supplierName: string;
  supplierAddress: string;
  supplierTaxNumber: string;
  positions: InvoicePosition[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentTerms: number;
  notes?: string;
  logoUrl?: string;
}

export interface InvoicePosition {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
}

export interface EmailSettings {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  message: string;
  attachPDF: boolean;
  attachExcel: boolean;
  ccEmails?: string[];
  bccEmails?: string[];
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'both';
  includeHeader: boolean;
  includeFooter: boolean;
  language: 'de' | 'en';
  template?: 'standard' | 'modern' | 'minimal';
}

export class InvoiceExportService {
  private static instance: InvoiceExportService;

  public static getInstance(): InvoiceExportService {
    if (!InvoiceExportService.instance) {
      InvoiceExportService.instance = new InvoiceExportService();
    }
    return InvoiceExportService.instance;
  }

  constructor() {
    // Initialize any required dependencies
  }

  /**
   * Generate PDF for invoice
   */
  public generatePDF(
    invoiceData: InvoiceExportData,
    options: ExportOptions = { format: 'pdf', includeHeader: true, includeFooter: true, language: 'de' }
  ): Blob {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let currentY = margin;

    // Set font
    doc.setFont('helvetica');

    // Header with company info
    if (options.includeHeader) {
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text(invoiceData.supplierName, margin, currentY);
      currentY += 10;

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      if (invoiceData.supplierAddress) {
        const addressLines = invoiceData.supplierAddress.split('\n');
        addressLines.forEach(line => {
          doc.text(line, margin, currentY);
          currentY += 4;
        });
      }
      
      if (invoiceData.supplierTaxNumber) {
        currentY += 2;
        doc.text(`${options.language === 'de' ? 'Steuernummer' : 'Tax Number'}: ${invoiceData.supplierTaxNumber}`, margin, currentY);
        currentY += 8;
      }
    }

    // Invoice title and number
    currentY += 10;
    doc.setFontSize(24);
    doc.setTextColor(40, 40, 40);
    const invoiceTitle = options.language === 'de' ? 'Rechnung' : 'Invoice';
    doc.text(invoiceTitle, margin, currentY);
    
    doc.setFontSize(14);
    doc.text(invoiceData.number, pageWidth - margin - 40, currentY);
    currentY += 15;

    // Customer information
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    const billToLabel = options.language === 'de' ? 'Rechnungsempfänger:' : 'Bill To:';
    doc.text(billToLabel, margin, currentY);
    currentY += 8;

    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(invoiceData.customerName, margin, currentY);
    currentY += 5;

    if (invoiceData.customerAddress) {
      const customerAddressLines = invoiceData.customerAddress.split('\n');
      customerAddressLines.forEach(line => {
        doc.text(line, margin, currentY);
        currentY += 4;
      });
    }
    currentY += 8;

    // Invoice details
    const invoiceDateLabel = options.language === 'de' ? 'Rechnungsdatum:' : 'Invoice Date:';
    const dueDateLabel = options.language === 'de' ? 'Fälligkeitsdatum:' : 'Due Date:';
    const paymentTermsLabel = options.language === 'de' ? 'Zahlungsziel:' : 'Payment Terms:';

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(invoiceDateLabel, margin, currentY);
    doc.text(new Date(invoiceData.invoiceDate).toLocaleDateString('de-DE'), margin + 35, currentY);
    currentY += 5;

    doc.text(dueDateLabel, margin, currentY);
    doc.text(new Date(invoiceData.dueDate).toLocaleDateString('de-DE'), margin + 35, currentY);
    currentY += 5;

    doc.text(paymentTermsLabel, margin, currentY);
    doc.text(`${invoiceData.paymentTerms} ${options.language === 'de' ? 'Tage' : 'days'}`, margin + 35, currentY);
    currentY += 15;

    // Table header
    const tableStartY = currentY;
    const descriptionCol = margin;
    const quantityCol = pageWidth - 120;
    const priceCol = pageWidth - 80;
    const totalCol = pageWidth - 40;

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, currentY - 2, pageWidth - 2 * margin, 8, 'F');

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const descLabel = options.language === 'de' ? 'Beschreibung' : 'Description';
    const qtyLabel = options.language === 'de' ? 'Menge' : 'Qty';
    const priceLabel = options.language === 'de' ? 'Preis' : 'Price';
    const totalLabel = options.language === 'de' ? 'Gesamt' : 'Total';

    doc.text(descLabel, descriptionCol, currentY + 4);
    doc.text(qtyLabel, quantityCol, currentY + 4);
    doc.text(priceLabel, priceCol, currentY + 4);
    doc.text(totalLabel, totalCol, currentY + 4);
    currentY += 12;

    // Table rows
    doc.setTextColor(40, 40, 40);
    invoiceData.positions.forEach((position, index) => {
      // Check if we need a new page
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = margin;
      }

      doc.setFontSize(9);
      
      // Description (with text wrapping)
      const descriptionLines = doc.splitTextToSize(position.description, quantityCol - descriptionCol - 5);
      doc.text(descriptionLines, descriptionCol, currentY);
      
      // Quantity and unit
      const quantityText = `${position.quantity} ${position.unit}`;
      doc.text(quantityText, quantityCol, currentY);
      
      // Unit price
      const unitPriceText = `€${position.unitPrice.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;
      doc.text(unitPriceText, priceCol, currentY);
      
      // Total price
      const totalPriceText = `€${position.totalPrice.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;
      doc.text(totalPriceText, totalCol, currentY);

      const lineHeight = Math.max(descriptionLines.length * 4, 6);
      currentY += lineHeight;

      // Add a subtle line between items
      if (index < invoiceData.positions.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 3;
      }
    });

    // Summary section
    currentY += 10;
    const summaryStartX = pageWidth - 80;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    
    const subtotalLabel = options.language === 'de' ? 'Zwischensumme:' : 'Subtotal:';
    doc.text(subtotalLabel, summaryStartX - 40, currentY);
    doc.text(`€${invoiceData.subtotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`, summaryStartX, currentY);
    currentY += 6;

    const taxLabel = options.language === 'de' ? 'MwSt. (19%):' : 'VAT (19%):';
    doc.text(taxLabel, summaryStartX - 40, currentY);
    doc.text(`€${invoiceData.taxAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`, summaryStartX, currentY);
    currentY += 8;

    // Total with emphasis
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    const totalAmountLabel = options.language === 'de' ? 'Gesamtbetrag:' : 'Total Amount:';
    doc.text(totalAmountLabel, summaryStartX - 40, currentY);
    doc.text(`€${invoiceData.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`, summaryStartX, currentY);

    // Notes section
    if (invoiceData.notes) {
      currentY += 20;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const notesLabel = options.language === 'de' ? 'Anmerkungen:' : 'Notes:';
      doc.text(notesLabel, margin, currentY);
      currentY += 6;

      doc.setTextColor(60, 60, 60);
      const notesLines = doc.splitTextToSize(invoiceData.notes, pageWidth - 2 * margin);
      doc.text(notesLines, margin, currentY);
    }

    // Footer
    if (options.includeFooter) {
      const footerY = pageHeight - 20;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const footerText = options.language === 'de' 
        ? 'Vielen Dank für Ihr Vertrauen!'
        : 'Thank you for your business!';
      doc.text(footerText, pageWidth / 2, footerY, { align: 'center' });
    }

    return doc.output('blob');
  }

  /**
   * Generate Excel file for invoice
   */
  public generateExcel(
    invoiceData: InvoiceExportData,
    options: ExportOptions = { format: 'excel', includeHeader: true, includeFooter: true, language: 'de' }
  ): Blob {
    const workbook = XLSX.utils.book_new();
    
    // Create invoice sheet
    const invoiceSheet: (string | number)[][] = [];

    // Header information
    if (options.includeHeader) {
      invoiceSheet.push([invoiceData.supplierName]);
      if (invoiceData.supplierAddress) {
        invoiceData.supplierAddress.split('\n').forEach(line => {
          invoiceSheet.push([line]);
        });
      }
      if (invoiceData.supplierTaxNumber) {
        const taxLabel = options.language === 'de' ? 'Steuernummer' : 'Tax Number';
        invoiceSheet.push([`${taxLabel}: ${invoiceData.supplierTaxNumber}`]);
      }
      invoiceSheet.push([]); // Empty row
    }

    // Invoice details
    const invoiceTitle = options.language === 'de' ? 'Rechnung' : 'Invoice';
    invoiceSheet.push([invoiceTitle, invoiceData.number]);
    invoiceSheet.push([]);

    // Customer information
    const billToLabel = options.language === 'de' ? 'Rechnungsempfänger:' : 'Bill To:';
    invoiceSheet.push([billToLabel]);
    invoiceSheet.push([invoiceData.customerName]);
    if (invoiceData.customerAddress) {
      invoiceData.customerAddress.split('\n').forEach(line => {
        invoiceSheet.push([line]);
      });
    }
    invoiceSheet.push([]);

    // Invoice dates and terms
    const invoiceDateLabel = options.language === 'de' ? 'Rechnungsdatum:' : 'Invoice Date:';
    const dueDateLabel = options.language === 'de' ? 'Fälligkeitsdatum:' : 'Due Date:';
    const paymentTermsLabel = options.language === 'de' ? 'Zahlungsziel:' : 'Payment Terms:';

    invoiceSheet.push([invoiceDateLabel, new Date(invoiceData.invoiceDate).toLocaleDateString('de-DE')]);
    invoiceSheet.push([dueDateLabel, new Date(invoiceData.dueDate).toLocaleDateString('de-DE')]);
    invoiceSheet.push([paymentTermsLabel, `${invoiceData.paymentTerms} ${options.language === 'de' ? 'Tage' : 'days'}`]);
    invoiceSheet.push([]);

    // Table headers
    const descLabel = options.language === 'de' ? 'Beschreibung' : 'Description';
    const qtyLabel = options.language === 'de' ? 'Menge' : 'Quantity';
    const unitLabel = options.language === 'de' ? 'Einheit' : 'Unit';
    const priceLabel = options.language === 'de' ? 'Einzelpreis' : 'Unit Price';
    const totalLabel = options.language === 'de' ? 'Gesamtpreis' : 'Total Price';

    invoiceSheet.push([descLabel, qtyLabel, unitLabel, priceLabel, totalLabel]);

    // Invoice positions
    invoiceData.positions.forEach(position => {
      invoiceSheet.push([
        position.description,
        position.quantity,
        position.unit,
        position.unitPrice,
        position.totalPrice
      ]);
    });

    invoiceSheet.push([]);

    // Summary
    const subtotalLabel = options.language === 'de' ? 'Zwischensumme:' : 'Subtotal:';
    const taxLabel = options.language === 'de' ? 'MwSt. (19%):' : 'VAT (19%):';
    const totalAmountLabel = options.language === 'de' ? 'Gesamtbetrag:' : 'Total Amount:';

    invoiceSheet.push(['', '', '', subtotalLabel, invoiceData.subtotal]);
    invoiceSheet.push(['', '', '', taxLabel, invoiceData.taxAmount]);
    invoiceSheet.push(['', '', '', totalAmountLabel, invoiceData.totalAmount]);

    // Notes
    if (invoiceData.notes) {
      invoiceSheet.push([]);
      const notesLabel = options.language === 'de' ? 'Anmerkungen:' : 'Notes:';
      invoiceSheet.push([notesLabel]);
      invoiceSheet.push([invoiceData.notes]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(invoiceSheet);
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 40 }, // Description
      { width: 10 }, // Quantity
      { width: 10 }, // Unit
      { width: 15 }, // Price
      { width: 15 }  // Total
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, invoiceTitle);

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Download file with given name
   */
  public downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export invoice in specified format(s)
   */
  public async exportInvoice(
    invoiceData: InvoiceExportData,
    options: ExportOptions
  ): Promise<{ pdf?: Blob; excel?: Blob; filenames: string[] }> {
    const results: { pdf?: Blob; excel?: Blob; filenames: string[] } = { filenames: [] };
    const baseFilename = `${invoiceData.number}_${new Date().toISOString().split('T')[0]}`;

    if (options.format === 'pdf' || options.format === 'both') {
      results.pdf = this.generatePDF(invoiceData, options);
      results.filenames.push(`${baseFilename}.pdf`);
    }

    if (options.format === 'excel' || options.format === 'both') {
      results.excel = this.generateExcel(invoiceData, options);
      results.filenames.push(`${baseFilename}.xlsx`);
    }

    return results;
  }

  /**
   * Send invoice via email
   */
  public async sendInvoiceEmail(
    invoiceData: InvoiceExportData,
    emailSettings: EmailSettings,
    attachments?: { pdf?: Blob; excel?: Blob }
  ): Promise<boolean> {
    try {
      // In a real implementation, this would integrate with an email service
      // For now, we'll simulate the email sending
      
      console.log('Sending invoice email:', {
        to: emailSettings.recipientEmail,
        subject: emailSettings.subject,
        message: emailSettings.message,
        attachments: {
          pdf: !!attachments?.pdf,
          excel: !!attachments?.excel
        }
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In production, you would:
      // 1. Upload attachments to a temporary storage
      // 2. Call your email service API (SendGrid, AWS SES, etc.)
      // 3. Handle response and errors appropriately

      return true;
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      return false;
    }
  }

  /**
   * Generate email templates for different scenarios
   */
  public getEmailTemplate(
    type: 'initial' | 'reminder' | 'overdue' | 'paid',
    invoiceData: InvoiceExportData,
    language: 'de' | 'en' = 'de'
  ): { subject: string; message: string } {
    const templates = {
      de: {
        initial: {
          subject: `Rechnung ${invoiceData.number} - ${invoiceData.supplierName}`,
          message: `Sehr geehrte Damen und Herren,

anbei übersenden wir Ihnen die Rechnung ${invoiceData.number} vom ${new Date(invoiceData.invoiceDate).toLocaleDateString('de-DE')}.

Rechnungsbetrag: €${invoiceData.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
Fälligkeitsdatum: ${new Date(invoiceData.dueDate).toLocaleDateString('de-DE')}

Bitte überweisen Sie den Betrag bis zum Fälligkeitsdatum auf unser Konto.

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
${invoiceData.supplierName}`
        },
        reminder: {
          subject: `Zahlungserinnerung - Rechnung ${invoiceData.number}`,
          message: `Sehr geehrte Damen und Herren,

wir möchten Sie daran erinnern, dass die Rechnung ${invoiceData.number} vom ${new Date(invoiceData.invoiceDate).toLocaleDateString('de-DE')} noch offen ist.

Rechnungsbetrag: €${invoiceData.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
Fälligkeitsdatum: ${new Date(invoiceData.dueDate).toLocaleDateString('de-DE')}

Falls Sie die Zahlung bereits veranlasst haben, betrachten Sie diese E-Mail als gegenstandslos.

Mit freundlichen Grüßen
${invoiceData.supplierName}`
        }
      },
      en: {
        initial: {
          subject: `Invoice ${invoiceData.number} - ${invoiceData.supplierName}`,
          message: `Dear Sir/Madam,

Please find attached invoice ${invoiceData.number} dated ${new Date(invoiceData.invoiceDate).toLocaleDateString('en-US')}.

Invoice Amount: €${invoiceData.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString('en-US')}

Please transfer the amount by the due date.

If you have any questions, please don't hesitate to contact us.

Best regards,
${invoiceData.supplierName}`
        },
        reminder: {
          subject: `Payment Reminder - Invoice ${invoiceData.number}`,
          message: `Dear Sir/Madam,

This is a friendly reminder that invoice ${invoiceData.number} dated ${new Date(invoiceData.invoiceDate).toLocaleDateString('en-US')} is still outstanding.

Invoice Amount: €${invoiceData.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString('en-US')}

If you have already processed the payment, please disregard this message.

Best regards,
${invoiceData.supplierName}`
        }
      }
    };

    return templates[language][type] || templates[language].initial;
  }

  /**
   * Validate email addresses
   */
  public validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Batch export multiple invoices
   */
  public async batchExport(
    invoices: InvoiceExportData[],
    options: ExportOptions
  ): Promise<Blob[]> {
    const results: Blob[] = [];

    for (const invoice of invoices) {
      if (options.format === 'pdf' || options.format === 'both') {
        results.push(this.generatePDF(invoice, options));
      }
      if (options.format === 'excel' || options.format === 'both') {
        results.push(this.generateExcel(invoice, options));
      }
    }

    return results;
  }
}

export default InvoiceExportService;