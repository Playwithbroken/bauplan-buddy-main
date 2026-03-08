/**
 * AI Document Service
 * Provides intelligent document processing, OCR, and data extraction
 */

import Tesseract from 'tesseract.js';

export interface ExtractedData {
  type: 'invoice' | 'quote' | 'contract' | 'blueprint' | 'delivery_note' | 'other';
  confidence: number;
  fields: {
    amount?: number;
    currency?: string;
    date?: Date;
    dueDate?: Date;
    invoiceNumber?: string;
    quoteNumber?: string;
    parties?: {
      from?: string;
      to?: string;
    };
    lineItems?: Array<{
      description: string;
      quantity?: number;
      unitPrice?: number;
      total?: number;
    }>;
    projectReference?: string;
    taxAmount?: number;
    subtotal?: number;
    total?: number;
  };
  rawText: string;
  metadata: {
    processingTime: number;
    ocrConfidence: number;
    language: string;
  };
}

export interface DocumentAnalysisProgress {
  stage: 'uploading' | 'ocr' | 'extraction' | 'complete';
  progress: number;
  message: string;
}

class AIDocumentService {
  private worker: Tesseract.Worker | null = null;

  /**
   * Initialize Tesseract worker
   */
  async initialize(): Promise<void> {
    if (this.worker) return;

    this.worker = await Tesseract.createWorker('deu+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
  }

  /**
   * Analyze document and extract data
   */
  async analyzeDocument(
    file: File,
    onProgress?: (progress: DocumentAnalysisProgress) => void
  ): Promise<ExtractedData> {
    const startTime = Date.now();

    try {
      // Stage 1: Upload
      onProgress?.({
        stage: 'uploading',
        progress: 0,
        message: 'Preparing document...',
      });

      await this.initialize();

      // Stage 2: OCR
      onProgress?.({
        stage: 'ocr',
        progress: 0,
        message: 'Reading document text...',
      });

      const imageUrl = URL.createObjectURL(file);
      const { data } = await this.worker!.recognize(imageUrl);
      URL.revokeObjectURL(imageUrl);

      const rawText = data.text;
      const ocrConfidence = data.confidence / 100;

      onProgress?.({
        stage: 'ocr',
        progress: 100,
        message: 'Text extracted successfully',
      });

      // Stage 3: Data Extraction
      onProgress?.({
        stage: 'extraction',
        progress: 0,
        message: 'Analyzing document content...',
      });

      const documentType = this.detectDocumentType(rawText);
      const extractedFields = await this.extractFields(rawText, documentType);

      onProgress?.({
        stage: 'extraction',
        progress: 100,
        message: 'Data extracted successfully',
      });

      // Stage 4: Complete
      const processingTime = Date.now() - startTime;
      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Analysis complete',
      });

      return {
        type: documentType,
        confidence: this.calculateConfidence(extractedFields, ocrConfidence),
        fields: extractedFields,
        rawText,
        metadata: {
          processingTime,
          ocrConfidence,
          language: 'deu',
        },
      };
    } catch (error) {
      console.error('Document analysis failed:', error);
      throw new Error('Failed to analyze document: ' + (error as Error).message);
    }
  }

  /**
   * Detect document type from text content
   */
  private detectDocumentType(text: string): ExtractedData['type'] {
    const lowerText = text.toLowerCase();

    // Invoice detection
    if (
      lowerText.includes('rechnung') ||
      lowerText.includes('invoice') ||
      lowerText.includes('rechnungsnummer')
    ) {
      return 'invoice';
    }

    // Quote detection
    if (
      lowerText.includes('angebot') ||
      lowerText.includes('quote') ||
      lowerText.includes('quotation') ||
      lowerText.includes('angebotsnummer')
    ) {
      return 'quote';
    }

    // Contract detection
    if (
      lowerText.includes('vertrag') ||
      lowerText.includes('contract') ||
      lowerText.includes('vereinbarung')
    ) {
      return 'contract';
    }

    // Delivery note detection
    if (
      lowerText.includes('lieferschein') ||
      lowerText.includes('delivery note') ||
      lowerText.includes('lieferung')
    ) {
      return 'delivery_note';
    }

    // Blueprint detection
    if (
      lowerText.includes('bauplan') ||
      lowerText.includes('blueprint') ||
      lowerText.includes('grundriss') ||
      lowerText.includes('plan')
    ) {
      return 'blueprint';
    }

    return 'other';
  }

  /**
   * Extract structured data from text
   */
  private async extractFields(
    text: string,
    type: ExtractedData['type']
  ): Promise<ExtractedData['fields']> {
    const fields: ExtractedData['fields'] = {};
    const lowerText = text.toLowerCase();

    // Extract dates
    const datePatterns = [
      /(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})/,
      /(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          fields.date = new Date(match[0]);
          break;
        } catch (e) {}
      }
    }

    // Extract due date
    const dueDateTerms = ['fällig', 'zahlbar bis', 'due date', 'pay by'];
    for (const term of dueDateTerms) {
      if (lowerText.includes(term)) {
        const afterTerm = text.substring(lowerText.indexOf(term));
        const match = afterTerm.match(/(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4})/);
        if (match) {
          try {
            fields.dueDate = new Date(match[1]);
            break;
          } catch (e) {}
        }
      }
    }

    // Extract amounts (EUR)
    const amountPatterns = [
      /(?:gesamt|total|summe|betrag).*?(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€/i,
      /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€/,
      /€\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/,
    ];

    const amounts: number[] = [];
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        const amountStr = match[1].replace(/\./g, '').replace(',', '.');
        const amount = parseFloat(amountStr);
        if (!isNaN(amount)) amounts.push(amount);
      }
    }

    if (amounts.length > 0) {
      fields.total = Math.max(...amounts);
      fields.currency = 'EUR';
    }

    // Vendor detection (simplified)
    const vendors = ['obi', 'bauhaus', 'hornbach', 'hilti', 'würth', 'amazon', 'hkl', 'zeppelin'];
    for (const vendor of vendors) {
      if (lowerText.includes(vendor)) {
        fields.parties = fields.parties || {};
        fields.parties.from = vendor.toUpperCase();
        break;
      }
    }

    // Extract invoice/quote number
    const invoicePattern = /(?:rechnung|invoice|beleg)(?:\s*nr\.?|\s*#|snummer:?)\s*([A-Z0-9\-]+)/i;
    const invMatch = text.match(invoicePattern);
    if (invMatch) fields.invoiceNumber = invMatch[1];

    const quotePattern = /(?:angebot|quote|vorgang)(?:\s*nr\.?|\s*#|snummer:?)\s*([A-Z0-9\-]+)/i;
    const quoMatch = text.match(quotePattern);
    if (quoMatch) fields.quoteNumber = quoMatch[1];

    // Extract line items
    const lineItemPattern = /(\d+)\s+([A-Za-zäöüÄÖÜß\s]{3,30}?)\s+(\d+[.,]\d{2})\s*€/g;
    const lineItems: ExtractedData['fields']['lineItems'] = [];
    let match;

    while ((match = lineItemPattern.exec(text)) !== null) {
      const quantity = parseInt(match[1]);
      const description = match[2].trim();
      const price = parseFloat(match[3].replace(',', '.'));

      lineItems.push({
        description,
        quantity,
        unitPrice: price,
        total: quantity * price,
      });
    }

    if (lineItems.length > 0) {
      fields.lineItems = lineItems;
      fields.subtotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
    }

    // Extract tax amount (MwSt)
    const taxMatch = text.match(/(?:mwst|ust|vat|tax).*?(\d+[.,]\d{2})\s*€/i);
    if (taxMatch) fields.taxAmount = parseFloat(taxMatch[1].replace(',', '.'));

    return fields;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    fields: ExtractedData['fields'],
    ocrConfidence: number
  ): number {
    let score = ocrConfidence * 0.4; // OCR confidence is 40% of total

    // Add points for extracted fields
    if (fields.total) score += 0.2;
    if (fields.date) score += 0.1;
    if (fields.invoiceNumber || fields.quoteNumber) score += 0.1;
    if (fields.parties?.from) score += 0.1;
    if (fields.lineItems && fields.lineItems.length > 0) score += 0.1;

    return Math.min(score, 1);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const aiDocumentService = new AIDocumentService();
export default aiDocumentService;
