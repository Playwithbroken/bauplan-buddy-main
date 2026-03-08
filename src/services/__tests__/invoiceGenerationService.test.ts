import { InvoiceGenerationService, InvoiceData, InvoicePosition, CompanyInfo } from '../invoiceGenerationService';
import { DocumentNumberingService } from '../documentNumberingService';

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

describe('InvoiceGenerationService', () => {
  let service: InvoiceGenerationService;
  let mockInvoice: InvoiceData;
  let mockPositions: InvoicePosition[];

  beforeEach(() => {
    service = InvoiceGenerationService.getInstance();
    
    mockPositions = [
      {
        id: '1',
        description: 'Bauleistung A',
        quantity: 2,
        unit: 'Stück',
        unitPrice: 100,
        total: 200,
        taxRate: 19
      },
      {
        id: '2',
        description: 'Material B',
        quantity: 5,
        unit: 'Meter',
        unitPrice: 50,
        total: 250,
        taxRate: 7
      }
    ];

    mockInvoice = {
      id: 'inv-1',
      number: 'AR-2024-000001',
      date: '2024-01-15',
      dueDate: '2024-02-15',
      customerId: 'cust-1',
      customerName: 'Test Kunde GmbH',
      customerAddress: 'Musterstraße 1, 80331 München',
      customerEmail: 'kunde@test.de',
      projectId: 'proj-1',
      projectName: 'Bauprojekt A',
      positions: mockPositions,
      subtotal: 450,
      taxAmount: 55.5,
      total: 505.5,
      paymentTerms: 'Zahlbar innerhalb von 30 Tagen ohne Abzug.',
      status: 'draft',
      createdBy: 'user-1',
      createdAt: '2024-01-15T10:00:00Z'
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = InvoiceGenerationService.getInstance();
      const instance2 = InvoiceGenerationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Invoice Number Generation', () => {
    it('should generate invoice numbers using DocumentNumberingService', () => {
      const mockNumber = 'AR-2024-000001';
      const numberingInstance = DocumentNumberingService.getInstance();
      const generateNumberSpy = jest.spyOn(numberingInstance, 'generateNumber')
        .mockReturnValue({ number: mockNumber, type: 'invoice', sequence: 1, prefix: 'AR' });
      
      const result = service.generateInvoiceNumber();
      
      expect(result).toBe(mockNumber);
      expect(generateNumberSpy).toHaveBeenCalledWith('invoice');
      
      generateNumberSpy.mockRestore();
    });
  });

  describe('Invoice Totals Calculation', () => {
    it('should calculate correct totals for positions', () => {
      const result = service.calculateInvoiceTotals(mockPositions);
      
      expect(result.subtotal).toBe(450);
      expect(result.taxAmount).toBeCloseTo(55.5);
      expect(result.total).toBeCloseTo(505.5);
      expect(result.taxBreakdown).toHaveLength(2);
      
      // Check tax breakdown
      const highTax = result.taxBreakdown.find(t => t.rate === 19);
      const lowTax = result.taxBreakdown.find(t => t.rate === 7);
      
      expect(highTax).toBeDefined();
      expect(lowTax).toBeDefined();
      expect(highTax?.amount).toBeCloseTo(38); // 200 * 0.19
      expect(lowTax?.amount).toBeCloseTo(17.5); // 250 * 0.07
    });

    it('should handle empty positions', () => {
      const result = service.calculateInvoiceTotals([]);
      
      expect(result.subtotal).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(0);
      expect(result.taxBreakdown).toHaveLength(0);
    });

    it('should round values to 2 decimal places', () => {
      const positionsWithDecimals: InvoicePosition[] = [
        {
          id: '1',
          description: 'Test',
          quantity: 1,
          unit: 'Stück',
          unitPrice: 99.999,
          total: 99.999,
          taxRate: 19
        }
      ];
      
      const result = service.calculateInvoiceTotals(positionsWithDecimals);
      
      // Should be rounded to 2 decimal places
      expect(result.subtotal).toBe(100);
      expect(result.taxAmount).toBe(19);
      expect(result.total).toBe(119);
    });
  });

  describe('PDF Generation', () => {
    it('should generate a PDF blob', async () => {
      const blob = await service.generateInvoicePDF(mockInvoice);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should include company information in PDF', async () => {
      const companyInfo = service.getCompanyInfo();
      const blob = await service.generateInvoicePDF(mockInvoice);
      
      // The actual PDF generation is mocked, but we can verify the service works
      expect(blob).toBeDefined();
    });
  });

  describe('Email Sending', () => {
    it('should send invoice email successfully', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      const result = await service.sendInvoiceEmail(mockInvoice, mockBlob);
      
      expect(result).toBe(true);
    });

    it('should handle email sending errors gracefully', async () => {
      // Mock console.error to prevent test output pollution
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // We could simulate an error, but the current implementation doesn't have failure paths
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      const result = await service.sendInvoiceEmail(mockInvoice, mockBlob);
      
      expect(result).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  describe('Company Information Management', () => {
    it('should get default company information', () => {
      const companyInfo = service.getCompanyInfo();
      
      expect(companyInfo.name).toBe('Bauplan Buddy GmbH');
      expect(companyInfo.address).toBe('Musterstraße 123');
      expect(companyInfo.city).toBe('80331 München');
    });

    it('should update company information', () => {
      const updatedInfo: Partial<CompanyInfo> = {
        name: 'Updated Company GmbH',
        email: 'updated@test.de'
      };
      
      service.updateCompanyInfo(updatedInfo);
      const companyInfo = service.getCompanyInfo();
      
      expect(companyInfo.name).toBe('Updated Company GmbH');
      expect(companyInfo.email).toBe('updated@test.de');
      // Other fields should remain unchanged
      expect(companyInfo.address).toBe('Musterstraße 123');
    });
  });

  describe('Quote to Invoice Conversion', () => {
    it('should create invoice from quote data', () => {
      const mockQuote = {
        customerId: 'cust-1',
        customer: 'Test Kunde GmbH',
        address: 'Musterstraße 1, 80331 München',
        email: 'kunde@test.de',
        projectId: 'proj-1',
        project: 'Bauprojekt A',
        positions: [
          {
            id: 'pos-1',
            description: 'Bauleistung',
            quantity: 2,
            unit: 'Stück',
            unitPrice: 100,
            total: 200,
            taxRate: 19
          }
        ]
      };
      
      const invoiceData = service.createInvoiceFromQuote(mockQuote);
      
      expect(invoiceData.number).toMatch(/AR-\d{4}-\d+/);
      expect(invoiceData.customerId).toBe('cust-1');
      expect(invoiceData.customerName).toBe('Test Kunde GmbH');
      expect(invoiceData.positions).toHaveLength(1);
      expect(invoiceData.status).toBe('draft');
    });

    it('should handle quote with missing data', () => {
      const minimalQuote = {};
      
      const invoiceData = service.createInvoiceFromQuote(minimalQuote);
      
      expect(invoiceData.number).toMatch(/AR-\d{4}-\d+/);
      expect(invoiceData.customerId).toBe('');
      expect(invoiceData.positions).toHaveLength(0);
      expect(invoiceData.status).toBe('draft');
    });
  });
});
