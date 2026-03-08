/**
 * Invoice OCR Service
 * 
 * Handles OCR processing and data extraction from invoice PDFs
 */

import { DocumentMetadata, AdvancedDocumentService } from './advancedDocumentService';

export interface ExtractedInvoiceData {
  // Invoice metadata
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  serviceDate?: string;
  
  // Supplier information
  supplierName?: string;
  supplierAddress?: string;
  supplierTaxNumber?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  
  // Financial data
  subtotal?: number;
  taxAmount?: number;
  taxRate?: number;
  totalAmount?: number;
  currency?: string;
  
  // Positions
  positions?: ExtractedPosition[];
  
  // Additional info
  paymentTerms?: string;
  description?: string;
  projectReference?: string;
  
  // OCR metadata
  confidence: number;
  extractedText: string;
  processingDate: string;
  errors?: string[];
}

export interface ExtractedPosition {
  description: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  total: number;
  taxRate?: number;
  lineNumber?: number;
}

export interface OcrProcessingResult {
  success: boolean;
  data?: ExtractedInvoiceData;
  error?: string;
  processingTime: number;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  confidence: number;
}

export interface ValidationIssue {
  field: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export class InvoiceOcrService {
  private static instance: InvoiceOcrService;
  private documentService: AdvancedDocumentService;

  public static getInstance(): InvoiceOcrService {
    if (!InvoiceOcrService.instance) {
      InvoiceOcrService.instance = new InvoiceOcrService();
    }
    return InvoiceOcrService.instance;
  }

  constructor() {
    this.documentService = AdvancedDocumentService.getInstance();
  }

  /**
   * Process invoice PDF with OCR and extract structured data
   */
  public async processInvoicePdf(file: File): Promise<OcrProcessingResult> {
    const startTime = Date.now();

    try {
      // Upload document with OCR processing
      const document = await this.documentService.uploadDocument(
        file,
        { 
          uploadedBy: 'current-user',
          category: 'invoices'
        },
        {
          performOCR: true,
          autoDetectCategory: true
        }
      );

      if (!document.extractedText) {
        return {
          success: false,
          error: 'OCR processing failed - no text extracted',
          processingTime: Date.now() - startTime
        };
      }

      // Extract structured data from OCR text
      const extractedData = await this.extractInvoiceDataFromText(
        document.extractedText,
        document.ocrConfidence || 0
      );

      return {
        success: true,
        data: extractedData,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('OCR processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown OCR processing error',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Extract structured invoice data from OCR text
   */
  private async extractInvoiceDataFromText(
    text: string, 
    ocrConfidence: number
  ): Promise<ExtractedInvoiceData> {
    const extractedData: ExtractedInvoiceData = {
      confidence: ocrConfidence,
      extractedText: text,
      processingDate: new Date().toISOString(),
      errors: []
    };

    try {
      // Extract invoice number
      extractedData.invoiceNumber = this.extractInvoiceNumber(text);
      
      // Extract dates
      const dates = this.extractDates(text);
      extractedData.invoiceDate = dates.invoiceDate;
      extractedData.dueDate = dates.dueDate;
      extractedData.serviceDate = dates.serviceDate;
      
      // Extract supplier information
      const supplierInfo = this.extractSupplierInfo(text);
      Object.assign(extractedData, supplierInfo);
      
      // Extract financial data
      const financialData = this.extractFinancialData(text);
      Object.assign(extractedData, financialData);
      
      // Extract positions
      extractedData.positions = this.extractPositions(text);
      
      // Extract additional information
      extractedData.paymentTerms = this.extractPaymentTerms(text);
      extractedData.description = this.extractDescription(text);
      extractedData.projectReference = this.extractProjectReference(text);

    } catch (error) {
      extractedData.errors?.push(`Data extraction error: ${error}`);
      extractedData.confidence *= 0.7; // Reduce confidence on errors
    }

    return extractedData;
  }

  /**
   * Extract invoice number from text
   */
  private extractInvoiceNumber(text: string): string | undefined {
    const patterns = [
      /(?:rechnung(?:s)?(?:nummer)?|invoice(?:\s+number)?|rg\.?\s*nr\.?)[:\s]+([A-Z0-9-/]+)/i,
      /(?:nr\.?|no\.?|number)[:\s]+([A-Z0-9-/]+)/i,
      /(?:RE|RG|INV)[-\s]?(\d{4})[-\s]?(\d{3,6})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1] || (match[1] && match[2] ? `${match[1]}-${match[2]}` : undefined);
      }
    }

    return undefined;
  }

  /**
   * Extract dates from text
   */
  private extractDates(text: string): {
    invoiceDate?: string;
    dueDate?: string;
    serviceDate?: string;
  } {
    const dates: Record<string, string> = {};

    // German date patterns
    const datePatterns = [
      /(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/g,
      /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/g
    ];

    // Invoice date patterns
    const invoiceDateKeywords = [
      /(?:rechnung(?:s)?datum|invoice\s+date|datum)[:\s]+(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/i,
      /(?:vom|dated)[:\s]+(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/i
    ];

    // Due date patterns
    const dueDateKeywords = [
      /(?:f[äa]llig(?:keits)?datum|due\s+date|zahlbar\s+bis)[:\s]+(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/i,
      /(?:bis|until)[:\s]+(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/i
    ];

    // Service date patterns
    const serviceDateKeywords = [
      /(?:leistung(?:s)?datum|service\s+date|erbracht\s+am)[:\s]+(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/i
    ];

    // Extract specific dates
    for (const pattern of invoiceDateKeywords) {
      const match = text.match(pattern);
      if (match && match[1]) {
        dates.invoiceDate = this.normalizeDate(match[1]);
        break;
      }
    }

    for (const pattern of dueDateKeywords) {
      const match = text.match(pattern);
      if (match && match[1]) {
        dates.dueDate = this.normalizeDate(match[1]);
        break;
      }
    }

    for (const pattern of serviceDateKeywords) {
      const match = text.match(pattern);
      if (match && match[1]) {
        dates.serviceDate = this.normalizeDate(match[1]);
        break;
      }
    }

    return dates;
  }

  /**
   * Normalize date format to ISO
   */
  private normalizeDate(dateStr: string): string {
    // Handle German date format DD.MM.YYYY or DD/MM/YYYY
    const parts = dateStr.split(/[.\-/]/);
    
    if (parts.length === 3) {
      let day, month, year;
      
      if (parts[0].length === 4) {
        // YYYY-MM-DD format
        [year, month, day] = parts;
      } else {
        // DD.MM.YYYY format
        [day, month, year] = parts;
      }
      
      // Ensure 4-digit year
      if (year.length === 2) {
        year = `20${year}`;
      }
      
      // Pad month and day
      month = month.padStart(2, '0');
      day = day.padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    }
    
    return dateStr;
  }

  /**
   * Extract supplier information
   */
  private extractSupplierInfo(text: string): Partial<ExtractedInvoiceData> {
    const info: Partial<ExtractedInvoiceData> = {};

    // Extract supplier name (usually at the top)
    const namePatterns = [
      /^([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)*(?:\s+(?:GmbH|AG|KG|e\.K\.|UG))?)$/m,
      /(?:firma|company)[:\s]+([^\n\r]+)/i
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        info.supplierName = match[1].trim();
        break;
      }
    }

    // Extract tax number
    const taxPatterns = [
      /(?:ust[.-]?id[.-]?nr\.?|vat\s+number)[:\s]+(DE\d{9})/i,
      /(?:steuernummer|tax\s+number)[:\s]+([0-9/-\s]+)/i
    ];

    for (const pattern of taxPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        info.supplierTaxNumber = match[1].trim();
        break;
      }
    }

    // Extract phone
    const phonePattern = /(?:tel\.?|phone)[:\s]+([+]?[\d\s-()/]+)/i;
    const phoneMatch = text.match(phonePattern);
    if (phoneMatch && phoneMatch[1]) {
      info.supplierPhone = phoneMatch[1].trim();
    }

    // Extract email
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const emailMatch = text.match(emailPattern);
    if (emailMatch && emailMatch[1]) {
      info.supplierEmail = emailMatch[1].trim();
    }

    // Extract address (more complex, try to find address-like patterns)
    const addressPatterns = [
      /(\d+\s+[A-ZÄÖÜ][a-zäöüß\s]+\d+[a-z]?\s*,?\s*\d{5}\s+[A-ZÄÖÜ][a-zäöüß\s]+)/,
      /([A-ZÄÖÜ][a-zäöüß\s]+ \d+[a-z]?\s*\d{5}\s+[A-ZÄÖÜ][a-zäöüß\s]+)/
    ];

    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        info.supplierAddress = match[1].trim();
        break;
      }
    }

    return info;
  }

  /**
   * Extract financial data
   */
  private extractFinancialData(text: string): Partial<ExtractedInvoiceData> {
    const financial: Partial<ExtractedInvoiceData> = {
      currency: 'EUR' // Default assumption
    };

    // Extract amounts
    const amountPatterns = [
      /(?:gesamt(?:betrag)?|total|summe)[:\s]*€?\s*([0-9,.]+)\s*€?/i,
      /(?:endbetrag|final\s+amount)[:\s]*€?\s*([0-9,.]+)\s*€?/i,
      /(?:brutto|gross)[:\s]*€?\s*([0-9,.]+)\s*€?/i
    ];

    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        financial.totalAmount = this.parseGermanAmount(match[1]);
        break;
      }
    }

    // Extract subtotal
    const subtotalPatterns = [
      /(?:netto|subtotal|zwischensumme)[:\s]*€?\s*([0-9,.]+)\s*€?/i,
      /(?:net\s+amount)[:\s]*€?\s*([0-9,.]+)\s*€?/i
    ];

    for (const pattern of subtotalPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        financial.subtotal = this.parseGermanAmount(match[1]);
        break;
      }
    }

    // Extract tax amount and rate
    const taxPatterns = [
      /(?:mwst\.?|vat|steuer)[:\s]*(\d+)%[:\s]*€?\s*([0-9,.]+)\s*€?/i,
      /(\d+)%[:\s]*mwst\.?[:\s]*€?\s*([0-9,.]+)\s*€?/i
    ];

    for (const pattern of taxPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[2]) {
        financial.taxRate = parseFloat(match[1]);
        financial.taxAmount = this.parseGermanAmount(match[2]);
        break;
      }
    }

    return financial;
  }

  /**
   * Parse German number format (1.234,56)
   */
  private parseGermanAmount(amountStr: string): number {
    // Remove spaces and handle German decimal format
    const cleaned = amountStr.replace(/\s+/g, '');
    
    // Check if it contains both comma and dot
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // Assume dot is thousands separator, comma is decimal
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
    } else if (cleaned.includes(',')) {
      // Only comma - treat as decimal separator
      return parseFloat(cleaned.replace(',', '.'));
    } else {
      // Only dots or no separators
      return parseFloat(cleaned);
    }
  }

  /**
   * Extract line items/positions
   */
  private extractPositions(text: string): ExtractedPosition[] {
    const positions: ExtractedPosition[] = [];

    // Look for table-like structures
    const lines = text.split('\n');
    let inPositionTable = false;
    let lineNumber = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;

      // Detect table headers
      if (line.match(/(?:pos\.?|position|description|menge|anzahl|preis|betrag)/i)) {
        inPositionTable = true;
        continue;
      }

      // Try to extract position data
      if (inPositionTable) {
        const position = this.parsePositionLine(line, lineNumber);
        if (position) {
          positions.push(position);
          lineNumber++;
        }
        
        // Stop at totals
        if (line.match(/(?:gesamt|total|summe|zwischensumme)/i)) {
          break;
        }
      }
    }

    return positions;
  }

  /**
   * Parse a single position line
   */
  private parsePositionLine(line: string, lineNumber: number): ExtractedPosition | null {
    // Try different patterns for position lines
    const patterns = [
      // Pattern: Position Description Quantity Unit UnitPrice Total
      /^(\d+)\s+(.+?)\s+([0-9,.]+)\s+(\w+)\s+([0-9,.]+)\s+([0-9,.]+)$/,
      // Pattern: Description Quantity Price Total
      /^(.+?)\s+([0-9,.]+)\s+([0-9,.]+)\s+([0-9,.]+)$/,
      // Pattern: Description Total
      /^(.+?)\s+([0-9,.]+)$/
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const position: ExtractedPosition = {
          description: '',
          total: 0,
          lineNumber
        };

        if (pattern.source.includes('(\\d+)\\s+(.+?)')) {
          // Full pattern with position number
          position.description = match[2];
          position.quantity = this.parseGermanAmount(match[3]);
          position.unit = match[4];
          position.unitPrice = this.parseGermanAmount(match[5]);
          position.total = this.parseGermanAmount(match[6]);
        } else if (match.length === 5) {
          // Description Quantity Price Total
          position.description = match[1];
          position.quantity = this.parseGermanAmount(match[2]);
          position.unitPrice = this.parseGermanAmount(match[3]);
          position.total = this.parseGermanAmount(match[4]);
        } else if (match.length === 3) {
          // Description Total
          position.description = match[1];
          position.total = this.parseGermanAmount(match[2]);
        }

        // Validate that we have at least description and total
        if (position.description && position.total > 0) {
          return position;
        }
      }
    }

    return null;
  }

  /**
   * Extract payment terms
   */
  private extractPaymentTerms(text: string): string | undefined {
    const patterns = [
      /(?:zahlungsbedingungen?|payment\s+terms)[:\s]+([^\n\r.]+)/i,
      /(?:zahlbar\s+(?:bis|within)|payment\s+due)[:\s]+([^\n\r.]+)/i,
      /(\d+\s+tage\s+netto)/i,
      /(\d+\s+days?\s+net)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract description/project reference
   */
  private extractDescription(text: string): string | undefined {
    const patterns = [
      /(?:beschreibung|description|projekt|project)[:\s]+([^\n\r]+)/i,
      /(?:betreff|subject|re)[:\s]+([^\n\r]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract project reference
   */
  private extractProjectReference(text: string): string | undefined {
    const patterns = [
      /(?:projekt[:\-\s]?(?:nr\.?|nummer)?|project\s+(?:no\.?|number)?)[:\s]+([A-Z0-9-/]+)/i,
      /(?:PRJ|PROJ)[-\s]?(\d{4})[-\s]?(\d{3,6})/i,
      /(?:auftrag[:\-\s]?(?:nr\.?|nummer)?|order\s+(?:no\.?|number)?)[:\s]+([A-Z0-9-/]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1] || (match[1] && match[2] ? `${match[1]}-${match[2]}` : undefined);
      }
    }

    return undefined;
  }

  /**
   * Validate extracted invoice data
   */
  public validateExtractedData(data: ExtractedInvoiceData): ValidationResult {
    const issues: ValidationIssue[] = [];
    let confidence = data.confidence;

    // Check required fields
    if (!data.supplierName) {
      issues.push({
        field: 'supplierName',
        issue: 'Supplier name not found',
        severity: 'error',
        suggestion: 'Please enter the supplier name manually'
      });
      confidence *= 0.8;
    }

    if (!data.invoiceNumber) {
      issues.push({
        field: 'invoiceNumber',
        issue: 'Invoice number not found',
        severity: 'error',
        suggestion: 'Please enter the invoice number manually'
      });
      confidence *= 0.8;
    }

    if (!data.totalAmount || data.totalAmount <= 0) {
      issues.push({
        field: 'totalAmount',
        issue: 'Total amount not found or invalid',
        severity: 'error',
        suggestion: 'Please verify and enter the total amount'
      });
      confidence *= 0.7;
    }

    if (!data.invoiceDate) {
      issues.push({
        field: 'invoiceDate',
        issue: 'Invoice date not found',
        severity: 'warning',
        suggestion: 'Please enter the invoice date'
      });
      confidence *= 0.9;
    }

    // Validate calculations if we have positions
    if (data.positions && data.positions.length > 0) {
      const calculatedTotal = data.positions.reduce((sum, pos) => sum + pos.total, 0);
      
      if (data.subtotal && Math.abs(calculatedTotal - data.subtotal) > 0.01) {
        issues.push({
          field: 'subtotal',
          issue: 'Calculated subtotal does not match extracted subtotal',
          severity: 'warning',
          suggestion: 'Please verify position amounts'
        });
        confidence *= 0.9;
      }
    }

    // Check tax calculation
    if (data.subtotal && data.taxRate && data.taxAmount) {
      const calculatedTax = data.subtotal * data.taxRate / 100;
      if (Math.abs(calculatedTax - data.taxAmount) > 0.01) {
        issues.push({
          field: 'taxAmount',
          issue: 'Tax calculation does not match',
          severity: 'warning',
          suggestion: 'Please verify tax calculation'
        });
        confidence *= 0.95;
      }
    }

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      confidence: Math.max(0, Math.min(1, confidence))
    };
  }

  /**
   * Get processing statistics
   */
  public getProcessingStats(): {
    totalProcessed: number;
    averageConfidence: number;
    averageProcessingTime: number;
    successRate: number;
  } {
    // This would be tracked in a real implementation
    return {
      totalProcessed: 0,
      averageConfidence: 0.85,
      averageProcessingTime: 2500, // ms
      successRate: 0.92
    };
  }
}

export default InvoiceOcrService;