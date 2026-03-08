import { DocumentNumberingService, DocumentType } from '../documentNumberingService';

describe('DocumentNumberingService', () => {
  let service: DocumentNumberingService;

  beforeEach(() => {
    service = DocumentNumberingService.getInstance();
  });

  afterEach(() => {
    // Reset service state between tests
    (service as any).counters = {};
    (service as any).initializeCounters();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DocumentNumberingService.getInstance();
      const instance2 = DocumentNumberingService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Number Generation', () => {
    it('should generate invoice numbers with correct format', () => {
      const result = service.generateNumber('invoice');
      
      expect(result.type).toBe('invoice');
      expect(result.prefix).toBe('AR');
      expect(result.number).toMatch(/^AR-\d{4}-\d{6}$/);
      expect(result.sequence).toBeGreaterThan(0);
    });

    it('should generate quote numbers with correct format', () => {
      const result = service.generateNumber('quote');
      
      expect(result.type).toBe('quote');
      expect(result.prefix).toBe('ANG');
      expect(result.number).toMatch(/^ANG-\d{4}-\d{3}$/);
      expect(result.sequence).toBeGreaterThan(0);
    });

    it('should generate customer numbers without year', () => {
      const result = service.generateNumber('customer');
      
      expect(result.type).toBe('customer');
      expect(result.prefix).toBe('CUST');
      expect(result.number).toMatch(/^CUST-\d{3}$/);
      expect(result.sequence).toBeGreaterThan(0);
    });

    it('should increment counters for same type', () => {
      const first = service.generateNumber('invoice');
      const second = service.generateNumber('invoice');
      
      expect(second.sequence).toBe(first.sequence + 1);
      expect(second.number).not.toBe(first.number);
    });

    it('should handle custom years', () => {
      const result = service.generateNumber('invoice', 2025);
      
      expect(result.number).toMatch(/^AR-2025-\d{6}$/);
      expect(result.year).toBe(2025);
    });

    it('should throw error for unknown document type', () => {
      expect(() => {
        service.generateNumber('unknown' as DocumentType);
      }).toThrow('Unknown document type: unknown');
    });
  });

  describe('Number Preview', () => {
    it('should preview next number without incrementing counter', () => {
      const currentCounter = service.getCurrentCounter('invoice');
      const preview = service.previewNextNumber('invoice');
      const afterPreviewCounter = service.getCurrentCounter('invoice');
      
      expect(preview.sequence).toBe(currentCounter + 1);
      expect(afterPreviewCounter).toBe(currentCounter);
    });
  });

  describe('Number Parsing', () => {
    it('should parse invoice numbers correctly', () => {
      const parsed = service.parseNumber('AR-2024-000123');
      
      expect(parsed.isValid).toBe(true);
      expect(parsed.type).toBe('invoice');
      expect(parsed.prefix).toBe('AR');
      expect(parsed.year).toBe(2024);
      expect(parsed.sequence).toBe(123);
    });

    it('should parse customer numbers correctly', () => {
      const parsed = service.parseNumber('CUST-456');
      
      expect(parsed.isValid).toBe(true);
      expect(parsed.type).toBe('customer');
      expect(parsed.prefix).toBe('CUST');
      expect(parsed.sequence).toBe(456);
      expect(parsed.year).toBeUndefined();
    });

    it('should handle invalid number formats', () => {
      const parsed = service.parseNumber('INVALID-FORMAT');
      
      expect(parsed.isValid).toBe(false);
      expect(parsed.type).toBeNull();
    });
  });

  describe('Counter Management', () => {
    it('should set and get counters', () => {
      service.setCounter('invoice', 100, 2024);
      const counter = service.getCurrentCounter('invoice', 2024);
      
      expect(counter).toBe(100);
    });

    it('should reset counters', () => {
      const initial = service.getCurrentCounter('invoice', 2024);
      service.resetCounter('invoice', 2024);
      const afterReset = service.getCurrentCounter('invoice', 2024);
      
      expect(initial).toBeGreaterThan(0); // Demo data initialized
      expect(afterReset).toBe(0);
    });
  });

  describe('Document Types', () => {
    it('should return all document types with descriptions', () => {
      const types = service.getDocumentTypes();
      
      expect(types).toHaveLength(6);
      const invoiceType = types.find(t => t.type === 'invoice');
      expect(invoiceType).toBeDefined();
      expect(invoiceType?.config.description).toBe('Ausgangsrechnung (Outgoing Invoice)');
    });
  });

  describe('Batch Generation', () => {
    it('should generate multiple numbers at once', () => {
      const requests = [
        { type: 'invoice' as DocumentType, count: 3 },
        { type: 'quote' as DocumentType, count: 2 }
      ];
      
      const results = service.generateBatch(requests);
      
      expect(results).toHaveLength(5);
      expect(results[0].type).toBe('invoice');
      expect(results[3].type).toBe('quote');
    });
  });

  describe('Number Validation', () => {
    it('should validate correct number formats', () => {
      const isValid = service.validateNumberFormat('AR-2024-000123', 'invoice');
      expect(isValid).toBe(true);
    });

    it('should reject incorrect number formats', () => {
      const isValid = service.validateNumberFormat('WRONG-FORMAT', 'invoice');
      expect(isValid).toBe(false);
    });

    it('should reject correct format but wrong type', () => {
      const isValid = service.validateNumberFormat('AR-2024-000123', 'quote');
      expect(isValid).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should provide numbering statistics', () => {
      // Generate a few documents first
      service.generateNumber('invoice');
      service.generateNumber('invoice');
      service.generateNumber('quote');
      
      const stats = service.getNumberingStatistics();
      
      expect(stats.totalDocuments).toBeGreaterThan(0);
      expect(stats.byType.invoice).toBeGreaterThan(0);
      expect(stats.byType.quote).toBeGreaterThan(0);
    });
  });

  describe('New Year Recommendations', () => {
    it('should provide recommendations for new year', () => {
      const recommendations = service.getNewYearRecommendations(2025);
      
      expect(recommendations).toHaveLength(6);
      const invoiceRec = recommendations.find(r => r.type === 'invoice');
      expect(invoiceRec).toBeDefined();
      expect(invoiceRec?.recommendedStart).toBe(1);
      expect(invoiceRec?.reason).toBe('New year sequence start');
    });
  });
});