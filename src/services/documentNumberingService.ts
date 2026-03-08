/**
 * Document Numbering Service
 * 
 * Handles automatic number generation for all document types:
 * - Rechnungsnummer (Outgoing Invoice Numbers): AR-YYYY-NNNNNN
 * - Angebotsnummer (Quote Numbers): ANG-YYYY-NNNNNN
 * - Auftragsbestätigungsnummer (Order Confirmation Numbers): AB-YYYY-NNNNNN
 * - Eingangsrechnungsnummer (Incoming Invoice Numbers): ER-YYYY-NNNNNN
 * - Projektnummer (Project Numbers): PRJ-YYYY-NNNNNN
 * - Kundennummer (Customer Numbers): CUST-NNNNNN
 */

export type DocumentType = 
  | 'invoice' // Ausgangsrechnung
  | 'quote' // Angebot
  | 'order_confirmation' // Auftragsbestätigung
  | 'incoming_invoice' // Eingangsrechnung
  | 'project' // Projekt
  | 'customer' // Kunde
  | 'delivery_note'; // Lieferschein

export interface DocumentNumberConfig {
  prefix: string;
  includeYear: boolean;
  sequenceLength: number;
  description: string;
}

export interface NumberingCounters {
  [key: string]: number; // Format: "type_year" -> counter
}

export interface GeneratedNumber {
  number: string;
  type: DocumentType;
  year?: number;
  sequence: number;
  prefix: string;
}

export class DocumentNumberingService {
  private static instance: DocumentNumberingService;
  
  private readonly configs: Record<DocumentType, DocumentNumberConfig> = {
    invoice: {
      prefix: 'AR',
      includeYear: true,
      sequenceLength: 6,
      description: 'Ausgangsrechnung (Outgoing Invoice)'
    },
    quote: {
      prefix: 'ANG',
      includeYear: true,
      sequenceLength: 3,
      description: 'Angebot (Quote)'
    },
    order_confirmation: {
      prefix: 'AB',
      includeYear: true,
      sequenceLength: 6,
      description: 'Auftragsbestätigung (Order Confirmation)'
    },
    incoming_invoice: {
      prefix: 'ER',
      includeYear: true,
      sequenceLength: 6,
      description: 'Eingangsrechnung (Incoming Invoice)'
    },
    project: {
      prefix: 'PRJ',
      includeYear: true,
      sequenceLength: 3,
      description: 'Projekt (Project)'
    },
    customer: {
      prefix: 'CUST',
      includeYear: false,
      sequenceLength: 3,
      description: 'Kunde (Customer)'
    },
    delivery_note: {
      prefix: 'LS',
      includeYear: true,
      sequenceLength: 6,
      description: 'Lieferschein (Delivery Note)'
    }
  };

  // In a real application, this would be stored in a database
  private counters: NumberingCounters = {};

  public static getInstance(): DocumentNumberingService {
    if (!DocumentNumberingService.instance) {
      DocumentNumberingService.instance = new DocumentNumberingService();
    }
    return DocumentNumberingService.instance;
  }

  constructor() {
    this.initializeCounters();
  }

  /**
   * Initialize counters with demo data
   */
  private initializeCounters(): void {
    const currentYear = new Date().getFullYear();
    
    // Set realistic starting counters for demo
    this.counters = {
      [`invoice_${currentYear}`]: 152, // AR-2024-000152
      [`quote_${currentYear}`]: 78,    // ANG-2024-078
      [`order_confirmation_${currentYear}`]: 34, // AB-2024-000034
      [`incoming_invoice_${currentYear}`]: 89, // ER-2024-000089
      [`project_${currentYear}`]: 42,  // PRJ-2024-042
      'customer': 156, // CUST-156
      [`delivery_note_${currentYear}`]: 12 // LS-2024-000012
    };
  }

  /**
   * Generate next number for a document type
   */
  public generateNumber(type: DocumentType, customYear?: number): GeneratedNumber {
    const config = this.configs[type];
    if (!config) {
      throw new Error(`Unknown document type: ${type}`);
    }

    const year = customYear || new Date().getFullYear();
    const counterKey = config.includeYear ? `${type}_${year}` : type;
    
    // Get current counter and increment
    const currentCounter = this.counters[counterKey] || 0;
    const nextSequence = currentCounter + 1;
    this.counters[counterKey] = nextSequence;

    // Format the number
    const paddedSequence = nextSequence.toString().padStart(config.sequenceLength, '0');
    const number = config.includeYear 
      ? `${config.prefix}-${year}-${paddedSequence}`
      : `${config.prefix}-${paddedSequence}`;

    return {
      number,
      type,
      year: config.includeYear ? year : undefined,
      sequence: nextSequence,
      prefix: config.prefix
    };
  }

  /**
   * Get next number without incrementing counter (preview)
   */
  public previewNextNumber(type: DocumentType, customYear?: number): GeneratedNumber {
    const config = this.configs[type];
    if (!config) {
      throw new Error(`Unknown document type: ${type}`);
    }

    const year = customYear || new Date().getFullYear();
    const counterKey = config.includeYear ? `${type}_${year}` : type;
    
    const currentCounter = this.counters[counterKey] || 0;
    const nextSequence = currentCounter + 1;

    const paddedSequence = nextSequence.toString().padStart(config.sequenceLength, '0');
    const number = config.includeYear 
      ? `${config.prefix}-${year}-${paddedSequence}`
      : `${config.prefix}-${paddedSequence}`;

    return {
      number,
      type,
      year: config.includeYear ? year : undefined,
      sequence: nextSequence,
      prefix: config.prefix
    };
  }

  /**
   * Parse a document number to extract components
   */
  public parseNumber(documentNumber: string): {
    type: DocumentType | null;
    prefix: string;
    year?: number;
    sequence: number;
    isValid: boolean;
  } {
    // Try to match pattern: PREFIX-YYYY-NNNNNN or PREFIX-NNNNNN
    const withYearMatch = documentNumber.match(/^([A-Z]+)-(\d{4})-(\d+)$/);
    const withoutYearMatch = documentNumber.match(/^([A-Z]+)-(\d+)$/);

    if (withYearMatch) {
      const [, prefix, yearStr, sequenceStr] = withYearMatch;
      const year = parseInt(yearStr);
      const sequence = parseInt(sequenceStr);
      
      const type = this.getTypeByPrefix(prefix);
      return {
        type,
        prefix,
        year,
        sequence,
        isValid: type !== null
      };
    }

    if (withoutYearMatch) {
      const [, prefix, sequenceStr] = withoutYearMatch;
      const sequence = parseInt(sequenceStr);
      
      const type = this.getTypeByPrefix(prefix);
      return {
        type,
        prefix,
        sequence,
        isValid: type !== null
      };
    }

    return {
      type: null,
      prefix: '',
      sequence: 0,
      isValid: false
    };
  }

  /**
   * Get document type by prefix
   */
  private getTypeByPrefix(prefix: string): DocumentType | null {
    for (const [type, config] of Object.entries(this.configs)) {
      if (config.prefix === prefix) {
        return type as DocumentType;
      }
    }
    return null;
  }

  /**
   * Set counter for a specific type and year
   */
  public setCounter(type: DocumentType, counter: number, year?: number): void {
    const config = this.configs[type];
    const counterKey = config.includeYear && year ? `${type}_${year}` : type;
    this.counters[counterKey] = counter;
  }

  /**
   * Get current counter for a type
   */
  public getCurrentCounter(type: DocumentType, year?: number): number {
    const config = this.configs[type];
    const counterKey = config.includeYear && year ? `${type}_${year}` : type;
    return this.counters[counterKey] || 0;
  }

  /**
   * Get all available document types with descriptions
   */
  public getDocumentTypes(): Array<{
    type: DocumentType;
    config: DocumentNumberConfig;
    currentCounter: number;
    nextNumber: string;
  }> {
    const currentYear = new Date().getFullYear();
    
    return Object.entries(this.configs).map(([type, config]) => {
      const docType = type as DocumentType;
      const currentCounter = this.getCurrentCounter(docType, currentYear);
      const nextNumber = this.previewNextNumber(docType).number;
      
      return {
        type: docType,
        config,
        currentCounter,
        nextNumber
      };
    });
  }

  /**
   * Generate multiple numbers at once
   */
  public generateBatch(requests: Array<{
    type: DocumentType;
    count: number;
    year?: number;
  }>): GeneratedNumber[] {
    const results: GeneratedNumber[] = [];
    
    for (const request of requests) {
      for (let i = 0; i < request.count; i++) {
        const generated = this.generateNumber(request.type, request.year);
        results.push(generated);
      }
    }
    
    return results;
  }

  /**
   * Validate if a number follows the correct format for its type
   */
  public validateNumberFormat(documentNumber: string, expectedType: DocumentType): boolean {
    const parsed = this.parseNumber(documentNumber);
    return parsed.isValid && parsed.type === expectedType;
  }

  /**
   * Get statistics for document numbering
   */
  public getNumberingStatistics(): {
    totalDocuments: number;
    byType: Record<DocumentType, number>;
    byYear: Record<number, number>;
  } {
    const stats = {
      totalDocuments: 0,
      byType: {} as Record<DocumentType, number>,
      byYear: {} as Record<number, number>
    };

    // Initialize type counters
    Object.keys(this.configs).forEach(type => {
      stats.byType[type as DocumentType] = 0;
    });

    // Count from all counters
    Object.entries(this.counters).forEach(([key, count]) => {
      stats.totalDocuments += count;
      
      if (key.includes('_')) {
        const [type, yearStr] = key.split('_');
        const year = parseInt(yearStr);
        
        if (stats.byType[type as DocumentType] !== undefined) {
          stats.byType[type as DocumentType] += count;
        }
        
        if (!isNaN(year)) {
          stats.byYear[year] = (stats.byYear[year] || 0) + count;
        }
      } else {
        // Type without year (like customer)
        if (stats.byType[key as DocumentType] !== undefined) {
          stats.byType[key as DocumentType] += count;
        }
      }
    });

    return stats;
  }

  /**
   * Reset counter for a type (use with caution)
   */
  public resetCounter(type: DocumentType, year?: number): void {
    const config = this.configs[type];
    const counterKey = config.includeYear && year ? `${type}_${year}` : type;
    this.counters[counterKey] = 0;
  }

  /**
   * Get recommended starting numbers for new year
   */
  public getNewYearRecommendations(year: number): Array<{
    type: DocumentType;
    recommendedStart: number;
    reason: string;
  }> {
    return Object.entries(this.configs).map(([type, config]) => {
      const docType = type as DocumentType;
      
      if (!config.includeYear) {
        return {
          type: docType,
          recommendedStart: this.getCurrentCounter(docType) + 1,
          reason: 'Continuing sequence (no year reset)'
        };
      }

      // For year-based numbering, recommend starting at 1
      return {
        type: docType,
        recommendedStart: 1,
        reason: 'New year sequence start'
      };
    });
  }
}

export default DocumentNumberingService.getInstance();