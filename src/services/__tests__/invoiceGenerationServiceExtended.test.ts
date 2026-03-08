import { InvoiceGenerationService, InvoiceData, InvoicePosition } from '../invoiceGenerationService';
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

describe('InvoiceGenerationService - Extended Tests', () => {
  let service: InvoiceGenerationService;

  beforeEach(() => {
    service = InvoiceGenerationService.getInstance();
    jest.clearAllMocks();
  });

  describe('Complex Invoice Calculations', () => {
    it('should handle invoices with many positions and complex tax scenarios', () => {
      const complexPositions: InvoicePosition[] = [
        // High tax rate positions
        {
          id: '1',
          description: 'Architektenleistungen',
          quantity: 1,
          unit: 'Pauschal',
          unitPrice: 5000,
          total: 5000,
          taxRate: 19
        },
        {
          id: '2',
          description: 'Ingenieurleistungen',
          quantity: 20,
          unit: 'Stunde',
          unitPrice: 120,
          total: 2400,
          taxRate: 19
        },
        // Low tax rate positions
        {
          id: '3',
          description: 'Baumaterialien',
          quantity: 5,
          unit: 'LKW',
          unitPrice: 800,
          total: 4000,
          taxRate: 7
        },
        {
          id: '4',
          description: 'Spezialzement',
          quantity: 100,
          unit: 'Sack',
          unitPrice: 15,
          total: 1500,
          taxRate: 7
        },
        // Zero tax positions
        {
          id: '5',
          description: 'Versandkosten',
          quantity: 1,
          unit: 'Pauschal',
          unitPrice: 50,
          total: 50,
          taxRate: 0
        },
        {
          id: '6',
          description: 'Umweltgebühr',
          quantity: 1,
          unit: 'Pauschal',
          unitPrice: 25,
          total: 25,
          taxRate: 0
        }
      ];

      const totals = service.calculateInvoiceTotals(complexPositions);
      
      // Verify calculations
      expect(totals.subtotal).toBe(12975); // 5000 + 2400 + 4000 + 1500 + 50 + 25
      expect(totals.taxAmount).toBeCloseTo(1791); // (7400 * 0.19) + (5500 * 0.07) + (75 * 0) = 1406 + 385 + 0 = 1791
      
      // Detailed tax breakdown verification
      expect(totals.taxBreakdown).toHaveLength(3);
      
      const highTax = totals.taxBreakdown.find(t => t.rate === 19);
      const lowTax = totals.taxBreakdown.find(t => t.rate === 7);
      const zeroTax = totals.taxBreakdown.find(t => t.rate === 0);
      
      expect(highTax).toBeDefined();
      expect(lowTax).toBeDefined();
      expect(zeroTax).toBeDefined();
      
      // Calculate expected amounts:
      // 19% on (5000 + 2400) = 7400 * 0.19 = 1406
      // 7% on (4000 + 1500) = 5500 * 0.07 = 385
      // 0% on (50 + 25) = 75 * 0 = 0
      expect(highTax?.amount).toBeCloseTo(1406);
      expect(lowTax?.amount).toBeCloseTo(385);
      expect(zeroTax?.amount).toBeCloseTo(0);
      
      expect(totals.total).toBeCloseTo(14766); // 12975 + 1791
    });

    it('should handle edge cases in tax calculations', () => {
      const edgeCasePositions: InvoicePosition[] = [
        // Very small amounts
        {
          id: '1',
          description: 'Kleine Position',
          quantity: 1,
          unit: 'Stück',
          unitPrice: 0.01,
          total: 0.01,
          taxRate: 19
        },
        // Large amounts
        {
          id: '2',
          description: 'Große Position',
          quantity: 1,
          unit: 'Pauschal',
          unitPrice: 100000,
          total: 100000,
          taxRate: 19
        },
        // Fractional tax rates
        {
          id: '3',
          description: 'Bruchteilsteuersatz',
          quantity: 1,
          unit: 'Stück',
          unitPrice: 100,
          total: 100,
          taxRate: 5.5 // 5.5%
        }
      ];

      const totals = service.calculateInvoiceTotals(edgeCasePositions);
      
      expect(totals.subtotal).toBeCloseTo(100100.01);
      
      // Verify tax calculation with fractional rates
      const tax19 = totals.taxBreakdown.find(t => t.rate === 19);
      const tax5_5 = totals.taxBreakdown.find(t => t.rate === 5.5);
      
      expect(tax19?.amount).toBeCloseTo(19000.00); // 100000.01 * 0.19
      expect(tax5_5?.amount).toBeCloseTo(5.5); // 100 * 0.055
      
      expect(totals.taxAmount).toBeCloseTo(19005.5);
      expect(totals.total).toBeCloseTo(119105.51);
    });

    it('should handle negative quantities and credits', () => {
      const creditPositions: InvoicePosition[] = [
        // Regular position
        {
          id: '1',
          description: 'Ursprüngliche Leistung',
          quantity: 1,
          unit: 'Pauschal',
          unitPrice: 1000,
          total: 1000,
          taxRate: 19
        },
        // Credit position (negative)
        {
          id: '2',
          description: 'Rückerstattung',
          quantity: -1,
          unit: 'Pauschal',
          unitPrice: 200,
          total: -200,
          taxRate: 19
        }
      ];

      const totals = service.calculateInvoiceTotals(creditPositions);
      
      expect(totals.subtotal).toBe(800); // 1000 + (-200)
      expect(totals.taxAmount).toBeCloseTo(152); // 800 * 0.19
      expect(totals.total).toBeCloseTo(952); // 800 + 152
    });
  });

  describe('PDF Generation Edge Cases', () => {
    it('should handle invoices with very long descriptions', async () => {
      const longDescriptionPosition: InvoicePosition = {
        id: '1',
        description: 'Extrem langtextige Beschreibung einer Bauleistung, die mehrere Zeilen benötigt und möglicherweise das Layout der Rechnung beeinflusst, weil sie so ausführlich ist, dass sie nicht in eine einzelne Zeile passt und daher umgebrochen werden muss, um ordnungsgemäß dargestellt zu werden',
        quantity: 1,
        unit: 'Pauschal',
        unitPrice: 1000,
        total: 1000,
        taxRate: 19
      };

      const invoiceData: InvoiceData = {
        id: 'inv-long-desc',
        number: 'AR-2024-000001',
        date: '2024-01-15',
        dueDate: '2024-02-15',
        customerId: 'cust-1',
        customerName: 'Test Kunde GmbH',
        customerAddress: 'Musterstraße 1, 80331 München',
        customerEmail: 'kunde@test.de',
        projectId: 'proj-1',
        projectName: 'Bauprojekt A',
        positions: [longDescriptionPosition],
        subtotal: 1000,
        taxAmount: 190,
        total: 1190,
        paymentTerms: 'Zahlbar innerhalb von 30 Tagen ohne Abzug.',
        status: 'draft',
        createdBy: 'user-1',
        createdAt: '2024-01-15T10:00:00Z'
      };

      // Should not throw error with long descriptions
      const blob = await service.generateInvoicePDF(invoiceData);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle invoices with many positions', async () => {
      // Create invoice with 50 positions
      const manyPositions: InvoicePosition[] = [];
      for (let i = 0; i < 50; i++) {
        manyPositions.push({
          id: `pos-${i + 1}`,
          description: `Position ${i + 1}`,
          quantity: 1,
          unit: 'Stück',
          unitPrice: 100,
          total: 100,
          taxRate: 19
        });
      }

      const invoiceData: InvoiceData = {
        id: 'inv-many-pos',
        number: 'AR-2024-000002',
        date: '2024-01-15',
        dueDate: '2024-02-15',
        customerId: 'cust-1',
        customerName: 'Test Kunde GmbH',
        customerAddress: 'Musterstraße 1, 80331 München',
        customerEmail: 'kunde@test.de',
        projectId: 'proj-1',
        projectName: 'Bauprojekt A',
        positions: manyPositions,
        subtotal: 5000,
        taxAmount: 950,
        total: 5950,
        paymentTerms: 'Zahlbar innerhalb von 30 Tagen ohne Abzug.',
        status: 'draft',
        createdBy: 'user-1',
        createdAt: '2024-01-15T10:00:00Z'
      };

      // Should handle many positions without issues
      const blob = await service.generateInvoicePDF(invoiceData);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('Quote to Invoice Conversion Edge Cases', () => {
    it('should handle quotes with missing or incomplete data', () => {
      // Quote with minimal data
      const minimalQuote = {
        customerId: '',
        customer: '',
        address: '',
        email: '',
        projectId: '',
        project: '',
        positions: []
      };

      const invoiceData = service.createInvoiceFromQuote(minimalQuote);
      
      // Should create valid invoice structure even with missing data
      expect(invoiceData).toBeDefined();
      expect(invoiceData.id).toBeDefined();
      expect(invoiceData.number).toMatch(/^AR-\d{4}-\d{6}$/);
      expect(invoiceData.positions).toHaveLength(0);
      expect(invoiceData.customerId).toBe('');
      expect(invoiceData.customerName).toBe('');
    });

    it('should handle quotes with complex nested data', () => {
      const complexQuote = {
        customerId: 'cust-complex-123',
        customer: 'Komplexer Kunde AG',
        address: 'Hauptstraße 42, 10115 Berlin',
        email: 'kontakt@komplexer-kunde.de',
        projectId: 'proj-complex-456',
        project: 'Komplexes Bauprojekt mit langem Namen',
        positions: [
          {
            id: 'pos-1',
            description: 'Bauleistung mit sehr langer Beschreibung, die mehrere Zeilen benötigt und komplexe Formatierung erfordert',
            quantity: 1.5,
            unit: 'm³',
            unitPrice: 150.75,
            total: 226.13,
            taxRate: 19
          },
          {
            id: 'pos-2',
            description: 'Materialposition',
            quantity: 10,
            unit: 'Stück',
            unitPrice: 25.99,
            total: 259.90,
            taxRate: 7
          }
        ]
      };

      const invoiceData = service.createInvoiceFromQuote(complexQuote);
      
      expect(invoiceData.customerId).toBe('cust-complex-123');
      expect(invoiceData.customerName).toBe('Komplexer Kunde AG');
      expect(invoiceData.projectId).toBe('proj-complex-456');
      expect(invoiceData.projectName).toBe('Komplexes Bauprojekt mit langem Namen');
      expect(invoiceData.positions).toHaveLength(2);
      
      // Verify position data transfer
      expect(invoiceData.positions[0].description).toBe(complexQuote.positions[0].description);
      expect(invoiceData.positions[0].quantity).toBe(1.5);
      expect(invoiceData.positions[0].unitPrice).toBe(150.75);
      expect(invoiceData.positions[0].total).toBe(226.13);
      expect(invoiceData.positions[0].taxRate).toBe(19);
    });
  });

  describe('Company Information Management', () => {
    it('should handle extensive company information updates', () => {
      const extensiveCompanyInfo = {
        name: 'Extrem Langname der Baufirma mit vielen Worten GmbH & Co. KG',
        address: 'Sehr Lange Adresse mit Hausnummer 123, Zusätzliche Adresszeile, Noch eine Adresszeile',
        city: '80331 München, Deutschland',
        phone: '+49 89 12345678',
        email: 'info@sehr-lange-firmenname-mit-vielen-worten-gmbh-und-co-kg.de',
        website: 'https://www.sehr-lange-firmenname-mit-vielen-worten-gmbh-und-co-kg.de',
        taxId: 'DE123456789',
        vatId: 'DE123456789',
        bank: 'Sehr Lange Bankname mit vielen Wörtern',
        iban: 'DE44 1234 5678 9012 3456 78',
        bic: 'COBADEFFXXX',
        commercialRegister: 'Amtsgericht München, HRB 123456',
        managingDirectors: 'Max Mustermann, Erika Beispiel'
      };

      service.updateCompanyInfo(extensiveCompanyInfo);
      
      const updatedInfo = service.getCompanyInfo();
      
      // Verify all fields are updated
      Object.keys(extensiveCompanyInfo).forEach(key => {
        expect((updatedInfo as any)[key]).toBe((extensiveCompanyInfo as any)[key]);
      });
    });

    it('should preserve default values for unspecified fields', () => {
      const partialUpdate = {
        name: 'Updated Company Name',
        email: 'new@email.com'
      };

      const originalInfo = service.getCompanyInfo();
      service.updateCompanyInfo(partialUpdate);
      const updatedInfo = service.getCompanyInfo();
      
      // Updated fields
      expect(updatedInfo.name).toBe('Updated Company Name');
      expect(updatedInfo.email).toBe('new@email.com');
      
      // Preserved fields
      expect(updatedInfo.address).toBe(originalInfo.address);
      expect(updatedInfo.city).toBe(originalInfo.city);
      expect(updatedInfo.phone).toBe(originalInfo.phone);
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle rapid invoice creation', async () => {
      const startTime = Date.now();
      
      // Create 100 invoices rapidly
      const invoices = [];
      for (let i = 0; i < 100; i++) {
        const quote = {
          customerId: `cust-${i}`,
          customer: `Customer ${i}`,
          positions: [
            {
              id: 'pos-1',
              description: `Service ${i}`,
              quantity: 1,
              unit: 'Stück',
              unitPrice: 100,
              total: 100,
              taxRate: 19
            }
          ]
        };
        
        const invoice = service.createInvoiceFromQuote(quote);
        invoices.push(invoice);
      }
      
      const endTime = Date.now();
      
      // Verify all invoices created
      expect(invoices).toHaveLength(100);
      
      // Verify unique invoice numbers
      const invoiceNumbers = invoices.map(inv => inv.number);
      const uniqueNumbers = new Set(invoiceNumbers);
      expect(uniqueNumbers.size).toBe(100);
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(500); // 500ms for 100 invoices
    });

    it('should handle concurrent invoice operations', async () => {
      // Simulate concurrent operations
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        const promise = new Promise(resolve => {
          setTimeout(() => {
            const quote = {
              customerId: `concurrent-${i}`,
              customer: `Concurrent Customer ${i}`,
              positions: [
                {
                  id: 'pos-1',
                  description: 'Concurrent Service',
                  quantity: 1,
                  unit: 'Stück',
                  unitPrice: 100 * (i + 1),
                  total: 100 * (i + 1),
                  taxRate: 19
                }
              ]
            };
            
            const invoice = service.createInvoiceFromQuote(quote);
            const totals = service.calculateInvoiceTotals(invoice.positions);
            resolve({ invoice, totals });
          }, 0);
        });
        
        promises.push(promise);
      }
      
      const results = await Promise.all(promises);
      
      // Verify all operations completed successfully
      expect(results).toHaveLength(10);
      
      results.forEach((result: any, index) => {
        expect(result.invoice.customerId).toBe(`concurrent-${index}`);
        expect(result.totals.subtotal).toBe(100 * (index + 1));
      });
    });
  });

  describe('Error Handling and Robustness', () => {
    it('should handle malformed position data gracefully', () => {
      const malformedPositions = [
        null,
        undefined,
        {},
        { id: '1' }, // Missing required fields
        { id: '2', description: 'Test', quantity: 'invalid' } // Wrong type
      ] as unknown as InvoicePosition[];

      // Should not throw errors with malformed data
      expect(() => {
        const totals = service.calculateInvoiceTotals(malformedPositions);
        // Should return safe defaults
        expect(totals.subtotal).toBe(0);
        expect(totals.taxAmount).toBe(0);
        expect(totals.total).toBe(0);
        expect(totals.taxBreakdown.filter(entry => entry.amount > 0)).toHaveLength(0);
      }).not.toThrow();
    });

    it('should handle extreme numeric values', () => {
      const extremePositions: InvoicePosition[] = [
        {
          id: '1',
          description: 'Very Large Amount',
          quantity: 1,
          unit: 'Stück',
          unitPrice: Number.MAX_SAFE_INTEGER,
          total: Number.MAX_SAFE_INTEGER,
          taxRate: 19
        },
        {
          id: '2',
          description: 'Very Small Amount',
          quantity: 1,
          unit: 'Stück',
          unitPrice: Number.MIN_VALUE,
          total: Number.MIN_VALUE,
          taxRate: 19
        }
      ];

      // Should handle extreme values without crashing
      expect(() => {
        const totals = service.calculateInvoiceTotals(extremePositions);
        expect(totals).toBeDefined();
      }).not.toThrow();
    });
  });
});
