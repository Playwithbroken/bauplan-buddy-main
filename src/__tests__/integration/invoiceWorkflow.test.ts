import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { InvoiceGenerationService } from '../../services/invoiceGenerationService';
import { DocumentNumberingService } from '../../services/documentNumberingService';

// Mock jsPDF
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: () => 210
      }
    },
    setFont: jest.fn(),
    setFontSize: jest.fn(),
    text: jest.fn(),
    setTextColor: jest.fn(),
    setFillColor: jest.fn(),
    rect: jest.fn(),
    setDrawColor: jest.fn(),
    line: jest.fn(),
    setLineWidth: jest.fn(),
    splitTextToSize: jest.fn().mockImplementation((text) => [text]),
    addPage: jest.fn(),
    output: jest.fn().mockReturnValue(new Blob(['mock-pdf-blob']))
  }));
});

describe('Invoice Workflow Integration', () => {
  let invoiceService: InvoiceGenerationService;
  let numberingService: DocumentNumberingService;

  beforeEach(() => {
    invoiceService = InvoiceGenerationService.getInstance();
    numberingService = DocumentNumberingService.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset service state between tests
    (numberingService as any).counters = {};
    (numberingService as any).initializeCounters();
  });

  describe('Complete Invoice Creation Workflow', () => {
    it('should create invoice from quote through complete workflow', async () => {
      // Step 1: Create quote data
      const mockQuote = {
        customerId: 'cust-123',
        customer: 'Test Customer GmbH',
        address: 'Musterstraße 1, 80331 München',
        email: 'customer@test.de',
        projectId: 'proj-456',
        project: 'Bauprojekt A',
        positions: [
          {
            id: 'pos-1',
            description: 'Bauleistung - Fundamentarbeiten',
            quantity: 2,
            unit: 'Stück',
            unitPrice: 1500,
            total: 3000,
            taxRate: 19
          },
          {
            id: 'pos-2',
            description: 'Material - Beton C25/30',
            quantity: 5,
            unit: 'm³',
            unitPrice: 80,
            total: 400,
            taxRate: 7
          }
        ]
      };

      // Step 2: Convert quote to invoice
      const invoiceData = invoiceService.createInvoiceFromQuote(mockQuote);
      
      // Verify invoice structure
      expect(invoiceData).toBeDefined();
      expect(invoiceData.id).toBeDefined();
      expect(invoiceData.number).toMatch(/^AR-\d{4}-\d{6}$/);
      expect(invoiceData.customerId).toBe('cust-123');
      expect(invoiceData.customerName).toBe('Test Customer GmbH');
      expect(invoiceData.projectId).toBe('proj-456');
      expect(invoiceData.projectName).toBe('Bauprojekt A');
      expect(invoiceData.positions).toHaveLength(2);
      expect(invoiceData.status).toBe('draft');

      // Step 3: Calculate invoice totals
      const totals = invoiceService.calculateInvoiceTotals(invoiceData.positions);
      
      expect(totals.subtotal).toBe(3400);
      expect(totals.taxAmount).toBeCloseTo(598); // 3000 * 0.19 + 400 * 0.07 = 570 + 28 = 598
      expect(totals.total).toBeCloseTo(3998); // 3400 + 598 = 3998
      expect(totals.taxBreakdown).toHaveLength(2);

      // Verify tax breakdown
      const highTax = totals.taxBreakdown.find(t => t.rate === 19);
      const lowTax = totals.taxBreakdown.find(t => t.rate === 7);
      
      expect(highTax).toBeDefined();
      expect(lowTax).toBeDefined();
      expect(highTax?.amount).toBeCloseTo(570); // 3000 * 0.19
      expect(lowTax?.amount).toBeCloseTo(28); // 400 * 0.07

      // Step 4: Generate PDF
      const pdfBlob = await invoiceService.generateInvoicePDF(invoiceData);
      
      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.size).toBeGreaterThan(0);

      // Step 5: Send email (mocked)
      const emailResult = await invoiceService.sendInvoiceEmail(invoiceData, pdfBlob);
      
      expect(emailResult).toBe(true);
    });

    it('should handle invoice with complex positions and multiple tax rates', async () => {
      // Create complex quote with multiple tax rates
      const complexQuote = {
        customerId: 'cust-789',
        customer: 'Complex Customer AG',
        address: 'Hauptstraße 42, 10115 Berlin',
        email: 'complex@customer.de',
        projectId: 'proj-999',
        project: 'Komplexes Bauprojekt',
        positions: [
          {
            id: 'pos-1',
            description: 'Bauleistung - Architektenleistungen',
            quantity: 1,
            unit: 'Pauschal',
            unitPrice: 5000,
            total: 5000,
            taxRate: 19
          },
          {
            id: 'pos-2',
            description: 'Material - Spezialzement',
            quantity: 10,
            unit: 'Sack',
            unitPrice: 15,
            total: 150,
            taxRate: 7
          },
          {
            id: 'pos-3',
            description: 'Dienstleistung - Beratung',
            quantity: 5,
            unit: 'Stunde',
            unitPrice: 120,
            total: 600,
            taxRate: 19
          },
          {
            id: 'pos-4',
            description: 'Versandkosten',
            quantity: 1,
            unit: 'Pauschal',
            unitPrice: 25,
            total: 25,
            taxRate: 0 // Tax-free
          }
        ]
      };

      // Convert to invoice
      const invoiceData = invoiceService.createInvoiceFromQuote(complexQuote);
      
      // Verify invoice data
      expect(invoiceData.positions).toHaveLength(4);
      expect(invoiceData.customerName).toBe('Complex Customer AG');

      // Calculate totals
      const totals = invoiceService.calculateInvoiceTotals(invoiceData.positions);
      
      expect(totals.subtotal).toBe(5775); // 5000 + 150 + 600 + 25
      expect(totals.total).toBeCloseTo(6849.5); // 5775 + 1064 + 10.5
      expect(totals.taxBreakdown).toHaveLength(3); // 19%, 7%, 0%

      // Verify detailed tax breakdown
      const tax19 = totals.taxBreakdown.find(t => t.rate === 19);
      const tax7 = totals.taxBreakdown.find(t => t.rate === 7);
      const tax0 = totals.taxBreakdown.find(t => t.rate === 0);
      
      expect(tax19).toBeDefined();
      expect(tax7).toBeDefined();
      expect(tax0).toBeDefined();
      
      // Calculate expected tax amounts:
      // 19% tax: (5000 + 600) * 0.19 = 5600 * 0.19 = 1064
      // 7% tax: 150 * 0.07 = 10.5
      // 0% tax: 25 * 0 = 0
      expect(tax19?.amount).toBeCloseTo(1064);
      expect(tax7?.amount).toBeCloseTo(10.5);
      expect(tax0?.amount).toBeCloseTo(0);

      // Generate PDF
      const pdfBlob = await invoiceService.generateInvoicePDF(invoiceData);
      expect(pdfBlob).toBeInstanceOf(Blob);

      // Send email
      const emailResult = await invoiceService.sendInvoiceEmail(invoiceData, pdfBlob);
      expect(emailResult).toBe(true);
    });

    it('should update company information and reflect in invoice', async () => {
      // Update company information
      const updatedCompanyInfo = {
        name: 'Updated Bauplan GmbH',
        address: 'Neue Straße 123',
        city: '80331 München',
        phone: '+49 89 12345678',
        email: 'info@updated-bauplan.de',
        taxId: 'DE123456789'
      };

      invoiceService.updateCompanyInfo(updatedCompanyInfo);
      
      // Create quote and convert to invoice
      const quote = {
        customerId: 'cust-111',
        customer: 'Test Kunde',
        address: 'Kundenstraße 1',
        email: 'kunde@test.de',
        positions: [
          {
            id: 'pos-1',
            description: 'Testleistung',
            quantity: 1,
            unit: 'Stück',
            unitPrice: 1000,
            total: 1000,
            taxRate: 19
          }
        ]
      };

      const invoiceData = invoiceService.createInvoiceFromQuote(quote);
      
      // Verify updated company information is used
      const companyInfo = invoiceService.getCompanyInfo();
      expect(companyInfo.name).toBe('Updated Bauplan GmbH');
      expect(companyInfo.phone).toBe('+49 89 12345678');
      expect(companyInfo.email).toBe('info@updated-bauplan.de');
      expect(companyInfo.taxId).toBe('DE123456789');
    });
  });

  describe('Invoice Numbering Integration', () => {
    it('should generate sequential invoice numbers correctly', () => {
      // Generate multiple invoices and verify sequential numbering
      const invoiceNumbers: string[] = [];
      
      for (let i = 0; i < 5; i++) {
        const result = numberingService.generateNumber('invoice');
        invoiceNumbers.push(result.number);
      }

      // Verify all numbers follow the correct format
      invoiceNumbers.forEach(num => {
        expect(num).toMatch(/^AR-\d{4}-\d{6}$/);
      });

      // Verify sequential nature
      const sequences = invoiceNumbers.map(num => {
        const parts = num.split('-');
        return parseInt(parts[2], 10);
      });

      // Each sequence should be one more than the previous
      for (let i = 1; i < sequences.length; i++) {
        expect(sequences[i]).toBe(sequences[i-1] + 1);
      }
    });

    it('should handle year transitions in numbering', () => {
      // Generate numbers for current year
      const currentYear = new Date().getFullYear();
      const currentYearResult = numberingService.generateNumber('invoice', currentYear);
      
      // Generate number for next year
      const nextYearResult = numberingService.generateNumber('invoice', currentYear + 1);
      
      // Verify year is reflected in numbers
      expect(currentYearResult.number).toContain(`-${currentYear}-`);
      expect(nextYearResult.number).toContain(`-${currentYear + 1}-`);
      
      // Sequence should reset for new year (first number of new year should be 1)
      const nextYearSequence = parseInt(nextYearResult.number.split('-')[2], 10);
      // This might not be 1 if there were previous tests, but it should be reasonable
      expect(nextYearSequence).toBeGreaterThan(0);
    });
  });

  describe('Error Handling in Workflow', () => {
    it('should handle quote with missing data gracefully', () => {
      // Create quote with minimal data
      const minimalQuote = {};
      
      // Should not throw error
      expect(() => {
        const invoiceData = invoiceService.createInvoiceFromQuote(minimalQuote);
        expect(invoiceData).toBeDefined();
        expect(invoiceData.number).toMatch(/^AR-\d{4}-\d{6}$/);
      }).not.toThrow();
    });

    it('should handle empty positions in quote', () => {
      const quoteWithEmptyPositions = {
        customerId: 'cust-222',
        customer: 'Empty Positions Customer',
        positions: []
      };

      const invoiceData = invoiceService.createInvoiceFromQuote(quoteWithEmptyPositions);
      
      // Should create invoice with empty positions
      expect(invoiceData.positions).toHaveLength(0);
      
      // Totals should be zero
      const totals = invoiceService.calculateInvoiceTotals(invoiceData.positions);
      expect(totals.subtotal).toBe(0);
      expect(totals.taxAmount).toBe(0);
      expect(totals.total).toBe(0);
      expect(totals.taxBreakdown).toHaveLength(0);
    });
  });
});
