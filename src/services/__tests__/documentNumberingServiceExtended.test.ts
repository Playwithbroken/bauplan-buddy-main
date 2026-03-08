import { DocumentNumberingService, DocumentType } from '../documentNumberingService';

describe('DocumentNumberingService - Extended Tests', () => {
  let service: DocumentNumberingService;

  beforeEach(() => {
    service = DocumentNumberingService.getInstance();
  });

  afterEach(() => {
    // Reset service state between tests
    (service as any).counters = {};
    (service as any).initializeCounters();
  });

  describe('Advanced Number Generation', () => {
    it('should handle multiple document types with different formats', () => {
      // Generate numbers for all document types
      const documentTypes: DocumentType[] = ['invoice', 'quote', 'customer', 'project', 'order', 'contract'];
      
      const generatedNumbers = documentTypes.map(type => {
        return service.generateNumber(type);
      });

      // Verify each type has correct format
      const invoice = generatedNumbers.find(n => n.type === 'invoice');
      const quote = generatedNumbers.find(n => n.type === 'quote');
      const customer = generatedNumbers.find(n => n.type === 'customer');
      const project = generatedNumbers.find(n => n.type === 'project');
      const order = generatedNumbers.find(n => n.type === 'order');
      const contract = generatedNumbers.find(n => n.type === 'contract');

      // Verify formats
      expect(invoice?.number).toMatch(/^AR-\d{4}-\d{6}$/);
      expect(quote?.number).toMatch(/^ANG-\d{4}-\d{3}$/);
      expect(customer?.number).toMatch(/^CUST-\d{3}$/);
      expect(project?.number).toMatch(/^PROJ-\d{4}-\d{3}$/);
      expect(order?.number).toMatch(/^BEST-\d{4}-\d{4}$/);
      expect(contract?.number).toMatch(/^VER-\d{4}-\d{4}$/);

      // Verify prefixes
      expect(invoice?.prefix).toBe('AR');
      expect(quote?.prefix).toBe('ANG');
      expect(customer?.prefix).toBe('CUST');
      expect(project?.prefix).toBe('PROJ');
      expect(order?.prefix).toBe('BEST');
      expect(contract?.prefix).toBe('VER');
    });

    it('should maintain separate counters for different years', () => {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;

      // Generate numbers for current year
      const currentYearNumbers = [];
      for (let i = 0; i < 3; i++) {
        const result = service.generateNumber('invoice', currentYear);
        currentYearNumbers.push(result);
      }

      // Generate numbers for next year
      const nextYearNumbers = [];
      for (let i = 0; i < 3; i++) {
        const result = service.generateNumber('invoice', nextYear);
        nextYearNumbers.push(result);
      }

      // Verify year is reflected in numbers
      currentYearNumbers.forEach(num => {
        expect(num.number).toContain(`-${currentYear}-`);
        expect(num.year).toBe(currentYear);
      });

      nextYearNumbers.forEach(num => {
        expect(num.number).toContain(`-${nextYear}-`);
        expect(num.year).toBe(nextYear);
      });

      // Verify sequences are independent
      const currentYearSequences = currentYearNumbers.map(n => n.sequence);
      const nextYearSequences = nextYearNumbers.map(n => n.sequence);
      
      // Both should start from low numbers (1, 2, 3) since it's a new year
      expect(currentYearSequences).toEqual([1, 2, 3]);
      expect(nextYearSequences).toEqual([1, 2, 3]);
    });

    it('should handle custom sequence starting points', () => {
      // Set custom counter values
      service.setCounter('invoice', 1000, 2024);
      service.setCounter('quote', 50, 2024);
      service.setCounter('customer', 200, 2024);

      // Generate numbers
      const invoiceResult = service.generateNumber('invoice', 2024);
      const quoteResult = service.generateNumber('quote', 2024);
      const customerResult = service.generateNumber('customer', 2024);

      // Verify sequences start from set values
      expect(invoiceResult.sequence).toBe(1001);
      expect(quoteResult.sequence).toBe(51);
      expect(customerResult.sequence).toBe(201);

      // Verify number formats
      expect(invoiceResult.number).toMatch(/^AR-2024-\d{6}$/);
      expect(quoteResult.number).toMatch(/^ANG-2024-\d{3}$/);
      expect(customerResult.number).toMatch(/^CUST-\d{3}$/);
    });
  });

  describe('Batch Number Generation', () => {
    it('should generate multiple numbers efficiently in batch', () => {
      const batchRequests = [
        { type: 'invoice' as DocumentType, count: 5 },
        { type: 'quote' as DocumentType, count: 3 },
        { type: 'customer' as DocumentType, count: 2 }
      ];

      const startTime = Date.now();
      const results = service.generateBatch(batchRequests);
      const endTime = Date.now();

      // Verify correct count
      expect(results).toHaveLength(10); // 5 + 3 + 2

      // Verify types
      const invoices = results.filter(r => r.type === 'invoice');
      const quotes = results.filter(r => r.type === 'quote');
      const customers = results.filter(r => r.type === 'customer');

      expect(invoices).toHaveLength(5);
      expect(quotes).toHaveLength(3);
      expect(customers).toHaveLength(2);

      // Verify sequential numbering
      for (let i = 1; i < invoices.length; i++) {
        expect(invoices[i].sequence).toBe(invoices[i-1].sequence + 1);
      }

      for (let i = 1; i < quotes.length; i++) {
        expect(quotes[i].sequence).toBe(quotes[i-1].sequence + 1);
      }

      for (let i = 1; i < customers.length; i++) {
        expect(customers[i].sequence).toBe(customers[i-1].sequence + 1);
      }

      // Should be fast (less than 50ms for 10 numbers)
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle large batch requests', () => {
      const largeBatchRequests = [
        { type: 'invoice' as DocumentType, count: 100 },
        { type: 'quote' as DocumentType, count: 50 }
      ];

      const results = service.generateBatch(largeBatchRequests);

      expect(results).toHaveLength(150);

      // Verify no duplicates
      const uniqueNumbers = new Set(results.map(r => r.number));
      expect(uniqueNumbers.size).toBe(150);

      // Verify sequences are continuous
      const invoices = results.filter(r => r.type === 'invoice');
      const quotes = results.filter(r => r.type === 'quote');

      expect(invoices).toHaveLength(100);
      expect(quotes).toHaveLength(50);

      // Check first and last sequences
      expect(invoices[0].sequence).toBe(1);
      expect(invoices[99].sequence).toBe(100);
      expect(quotes[0].sequence).toBe(1);
      expect(quotes[49].sequence).toBe(50);
    });
  });

  describe('Number Validation and Parsing', () => {
    it('should validate all supported number formats correctly', () => {
      const validNumbers = [
        { number: 'AR-2024-000123', type: 'invoice' },
        { number: 'ANG-2024-456', type: 'quote' },
        { number: 'CUST-789', type: 'customer' },
        { number: 'PROJ-2024-123', type: 'project' },
        { number: 'BEST-2024-4567', type: 'order' },
        { number: 'VER-2024-7890', type: 'contract' }
      ];

      validNumbers.forEach(({ number, type }) => {
        const isValid = service.validateNumberFormat(number, type as DocumentType);
        expect(isValid).toBe(true);
      });
    });

    it('should reject invalid number formats', () => {
      const invalidNumbers = [
        'INVALID-FORMAT',
        'AR-24-000123', // Wrong year format
        'ANG-2024-12345', // Too many digits
        'CUST-ABC', // Non-numeric sequence
        'PROJ-2024-', // Missing sequence
        'BEST-2024-123', // Too few digits
        'VER-2024-12345' // Too many digits
      ];

      invalidNumbers.forEach(number => {
        // Try with each document type
        const documentTypes: DocumentType[] = ['invoice', 'quote', 'customer', 'project', 'order', 'contract'];
        documentTypes.forEach(type => {
          const isValid = service.validateNumberFormat(number, type);
          expect(isValid).toBe(false);
        });
      });
    });

    it('should parse numbers and extract all components', () => {
      const testNumbers = [
        {
          number: 'AR-2024-000123',
          expected: {
            isValid: true,
            type: 'invoice',
            prefix: 'AR',
            year: 2024,
            sequence: 123
          }
        },
        {
          number: 'ANG-2023-456',
          expected: {
            isValid: true,
            type: 'quote',
            prefix: 'ANG',
            year: 2023,
            sequence: 456
          }
        },
        {
          number: 'CUST-789',
          expected: {
            isValid: true,
            type: 'customer',
            prefix: 'CUST',
            year: undefined,
            sequence: 789
          }
        }
      ];

      testNumbers.forEach(({ number, expected }) => {
        const parsed = service.parseNumber(number);
        
        expect(parsed.isValid).toBe(expected.isValid);
        expect(parsed.type).toBe(expected.type);
        expect(parsed.prefix).toBe(expected.prefix);
        expect(parsed.year).toBe(expected.year);
        expect(parsed.sequence).toBe(expected.sequence);
      });
    });

    it('should handle malformed number parsing gracefully', () => {
      const malformedNumbers = [
        '',
        null,
        undefined,
        'COMPLETELY-WRONG',
        'AR--123',
        'ANG-2024-',
        'CUST-ABC'
      ];

      malformedNumbers.forEach(number => {
        const parsed = service.parseNumber(number as any);
        
        expect(parsed.isValid).toBe(false);
        expect(parsed.type).toBeNull();
        expect(parsed.prefix).toBeNull();
        expect(parsed.year).toBeUndefined();
        expect(parsed.sequence).toBeNaN();
      });
    });
  });

  describe('Counter Management and Statistics', () => {
    it('should provide detailed numbering statistics', () => {
      // Generate some documents
      for (let i = 0; i < 5; i++) {
        service.generateNumber('invoice');
        if (i < 3) service.generateNumber('quote');
        if (i < 2) service.generateNumber('customer');
      }

      const stats = service.getNumberingStatistics();
      
      expect(stats.totalDocuments).toBe(10); // 5 + 3 + 2
      expect(stats.byType.invoice).toBe(5);
      expect(stats.byType.quote).toBe(3);
      expect(stats.byType.customer).toBe(2);
      expect(stats.byType.project).toBe(0);

      // Verify current counters
      expect(stats.currentCounters.invoice).toBe(5);
      expect(stats.currentCounters.quote).toBe(3);
      expect(stats.currentCounters.customer).toBe(2);
    });

    it('should reset counters correctly', () => {
      // Generate some numbers first
      service.generateNumber('invoice');
      service.generateNumber('quote');
      service.generateNumber('customer');

      // Verify counters are not zero
      expect(service.getCurrentCounter('invoice')).toBe(1);
      expect(service.getCurrentCounter('quote')).toBe(1);
      expect(service.getCurrentCounter('customer')).toBe(1);

      // Reset counters
      service.resetCounter('invoice');
      service.resetCounter('quote');
      service.resetCounter('customer');

      // Verify counters are reset
      expect(service.getCurrentCounter('invoice')).toBe(0);
      expect(service.getCurrentCounter('quote')).toBe(0);
      expect(service.getCurrentCounter('customer')).toBe(0);
    });

    it('should handle counter persistence recommendations', () => {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;

      const recommendations = service.getNewYearRecommendations(nextYear);
      
      expect(recommendations).toHaveLength(6); // All document types
      
      recommendations.forEach(rec => {
        expect(rec.year).toBe(nextYear);
        expect(rec.recommendedStart).toBe(1);
        expect(rec.reason).toBe('New year sequence start');
      });

      // Verify all document types are included
      const types = recommendations.map(r => r.type);
      expect(types).toContain('invoice');
      expect(types).toContain('quote');
      expect(types).toContain('customer');
      expect(types).toContain('project');
      expect(types).toContain('order');
      expect(types).toContain('contract');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle high-frequency number generation', () => {
      const startTime = Date.now();
      
      // Generate 1000 invoice numbers rapidly
      const numbers = [];
      for (let i = 0; i < 1000; i++) {
        const result = service.generateNumber('invoice');
        numbers.push(result);
      }
      
      const endTime = Date.now();
      
      // Verify all numbers are generated
      expect(numbers).toHaveLength(1000);
      
      // Verify no duplicates
      const uniqueNumbers = new Set(numbers.map(n => n.number));
      expect(uniqueNumbers.size).toBe(1000);
      
      // Verify sequential ordering
      for (let i = 1; i < numbers.length; i++) {
        expect(numbers[i].sequence).toBe(numbers[i-1].sequence + 1);
      }
      
      // Should complete within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle concurrent access gracefully', () => {
      // Simulate concurrent access by generating numbers in quick succession
      const results1 = [];
      const results2 = [];
      
      // Interleaved generation to test thread safety
      for (let i = 0; i < 50; i++) {
        const result1 = service.generateNumber('invoice');
        results1.push(result1);
        
        const result2 = service.generateNumber('quote');
        results2.push(result2);
      }
      
      // Verify no sequence conflicts
      const invoiceSequences = results1.map(r => r.sequence);
      const quoteSequences = results2.map(r => r.sequence);
      
      // Should have continuous sequences
      expect(invoiceSequences).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]);
      expect(quoteSequences).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]);
    });

    it('should handle edge case document types', () => {
      // Test with all document types to ensure none are missed
      const allTypes: DocumentType[] = ['invoice', 'quote', 'customer', 'project', 'order', 'contract'];
      
      allTypes.forEach(type => {
        expect(() => {
          const result = service.generateNumber(type);
          expect(result.type).toBe(type);
          expect(result.number).toBeDefined();
        }).not.toThrow();
      });
    });
  });
});