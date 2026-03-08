import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { InvoiceGenerationService } from '../../services/invoiceGenerationService';
import { DocumentNumberingService } from '../../services/documentNumberingService';
import { CalendarIntegrationService } from '../../services/calendarIntegrationService';

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
    setFillColor: jest.fn(),
    rect: jest.fn(),
    setDrawColor: jest.fn(),
    line: jest.fn(),
    setLineWidth: jest.fn(),
    splitTextToSize: jest.fn().mockImplementation((text) => [text]),
    addPage: jest.fn(),
    output: jest.fn().mockReturnValue('mock-pdf-blob')
  }));
});

// Mock localStorage for calendar service
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Complete Workflow Integration', () => {
  let invoiceService: InvoiceGenerationService;
  let numberingService: DocumentNumberingService;
  let calendarService: CalendarIntegrationService;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    invoiceService = InvoiceGenerationService.getInstance();
    numberingService = DocumentNumberingService.getInstance();
    calendarService = CalendarIntegrationService.getInstance();
    
    // Clear any existing data and reset counters
    (numberingService as any).counters = {
      invoice: { year: new Date().getFullYear(), count: 0 },
      quote: { year: new Date().getFullYear(), count: 0 },
      deliveryNote: { year: new Date().getFullYear(), count: 0 },
      orderConfirmation: { year: new Date().getFullYear(), count: 0 },
      project: { year: new Date().getFullYear(), count: 0 }
    };
    
    (calendarService as any).events.clear();
    (calendarService as any).providers.clear();
    (calendarService as any).conflicts.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('End-to-End Business Workflow', () => {
    it('should complete the full workflow from project creation to invoicing', async () => {
      // Step 1: Create a project with calendar events
      const projectStartDate = new Date('2024-03-20T09:00:00Z');
      const projectEndDate = new Date('2024-06-20T17:00:00Z');
      
      // Create project kickoff meeting
      const kickoffMeeting = calendarService.createEvent({
        title: 'Bauprojekt Alpha - Kickoff Meeting',
        description: 'Initial project kickoff with all stakeholders',
        startTime: projectStartDate,
        endTime: new Date('2024-03-20T10:00:00Z'),
        attendees: [
          {
            email: 'client@construction-company.de',
            name: 'Herr Müller',
            role: 'required',
            status: 'accepted'
          },
          {
            email: 'architect@design-firm.de',
            name: 'Frau Schmidt',
            role: 'required',
            status: 'needsAction'
          }
        ],
        organizer: {
          email: 'project-manager@bauplan.de',
          name: 'Max Mustermann',
          role: 'organizer',
          status: 'accepted'
        },
        eventType: 'meeting',
        priority: 'high',
        location: 'Kundenbüro, Musterstraße 10, 80331 München',
        projectId: 'PROJ-2024-001'
      } as any);

      expect(kickoffMeeting).toBeDefined();
      expect(kickoffMeeting.projectId).toBe('PROJ-2024-001');

      // Step 2: Schedule regular project meetings
      const weeklyMeeting = calendarService.createEvent({
        title: 'Bauprojekt Alpha - Weekly Progress Meeting',
        startTime: new Date('2024-03-27T09:00:00Z'),
        endTime: new Date('2024-03-27T10:00:00Z'),
        eventType: 'meeting',
        projectId: 'PROJ-2024-001',
        recurrence: {
          frequency: 'weekly',
          interval: 1,
          endDate: projectEndDate
        }
      } as any);

      expect(weeklyMeeting.recurrence).toBeDefined();

      // Step 3: Schedule site visits
      const siteVisit = calendarService.createEvent({
        title: 'Bauprojekt Alpha - Site Visit',
        description: 'Weekly site inspection and progress review',
        startTime: new Date('2024-03-22T14:00:00Z'),
        endTime: new Date('2024-03-22T16:00:00Z'),
        eventType: 'site-visit',
        projectId: 'PROJ-2024-001',
        location: 'Baustelle, Baustellenstraße 5, 80331 München'
      } as any);

      // Step 4: Track project progress and create quote
      const quote = {
        customerId: 'CUST-2024-001',
        customer: 'Bauherren GmbH',
        address: 'Musterstraße 10, 80331 München',
        email: 'kontakt@bauherren-gmbh.de',
        projectId: 'PROJ-2024-001',
        project: 'Bauprojekt Alpha',
        positions: [
          {
            id: 'pos-1',
            description: 'Architektenleistungen - Planung und Baubegleitung',
            quantity: 1,
            unit: 'Pauschal',
            unitPrice: 15000,
            total: 15000,
            taxRate: 19
          },
          {
            id: 'pos-2',
            description: 'Bauleistungen - Fundamentarbeiten',
            quantity: 1,
            unit: 'Pauschal',
            unitPrice: 25000,
            total: 25000,
            taxRate: 19
          },
          {
            id: 'pos-3',
            description: 'Material - Beton C25/30',
            quantity: 20,
            unit: 'm³',
            unitPrice: 85,
            total: 1700,
            taxRate: 7
          },
          {
            id: 'pos-4',
            description: 'Gerätemiete - Bagger CAT 320',
            quantity: 5,
            unit: 'Tage',
            unitPrice: 450,
            total: 2250,
            taxRate: 19
          }
        ]
      };

      // Step 5: Convert quote to invoice
      const invoiceData = invoiceService.createInvoiceFromQuote(quote) as any;
      
      expect(invoiceData.number).toMatch(/^AR-\d{4}-\d{6}$/);
      expect(invoiceData.projectId).toBe('PROJ-2024-001');
      expect(invoiceData.customerId).toBe('CUST-2024-001');
      expect(invoiceData.positions).toHaveLength(4);

      // Step 6: Calculate invoice totals
      const totals = invoiceService.calculateInvoiceTotals(invoiceData.positions);
      
      // Verify calculations:
      // Subtotal: 15000 + 25000 + 1700 + 2250 = 43950
      // Tax: (15000 + 25000 + 2250) * 0.19 + 1700 * 0.07 = 8027.5 + 119 = 8146.5
      // Total: 43950 + 8146.5 = 52096.5
      expect(totals.subtotal).toBe(43950);
      expect(totals.taxAmount).toBeCloseTo(8146.5);
      expect(totals.total).toBeCloseTo(52096.5);
      expect(totals.taxBreakdown).toHaveLength(2);

      // Step 7: Generate PDF invoice
      const pdfBlob = await invoiceService.generateInvoicePDF(invoiceData as any);
      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.size).toBeGreaterThan(0);

      // Step 8: Schedule invoice delivery as calendar event
      const invoiceEvent = calendarService.createEvent({
        title: `Rechnung ${invoiceData.number} versenden`,
        description: `Rechnung für ${invoiceData.projectName} an ${invoiceData.customerName} versenden`,
        startTime: new Date('2024-03-25T10:00:00Z'),
        endTime: new Date('2024-03-25T10:30:00Z'),
        eventType: 'task',
        projectId: invoiceData.projectId,
        customerId: invoiceData.customerId,
        priority: 'normal',
        reminders: [
          {
            type: 'email',
            minutesBefore: 60
          }
        ],
        customFields: {
          invoiceNumber: invoiceData.number,
          invoiceAmount: totals.total.toString(),
          dueDate: invoiceData.dueDate
        }
      } as any);

      expect(invoiceEvent.customFields?.invoiceNumber).toBe(invoiceData.number);
      expect(invoiceEvent.customFields?.invoiceAmount).toBe('52096.5');

      // Step 9: Send invoice email (mocked)
      const emailResult = await invoiceService.sendInvoiceEmail(invoiceData as any, pdfBlob);
      expect(emailResult).toBe(true);

      // Step 10: Update company information for this invoice
      invoiceService.updateCompanyInfo({
        name: 'Bauplan Buddy GmbH',
        address: 'Baustraße 123',
        city: '80331 München',
        phone: '+49 89 12345678',
        email: 'info@bauplan-buddy.de',
        vatId: 'DE123456789'
      } as any);

      const companyInfo = invoiceService.getCompanyInfo();
      expect(companyInfo.name).toBe('Bauplan Buddy GmbH');

      // Step 11: Verify all services are working together
      const calendarEvents = calendarService.getEventsByProject('PROJ-2024-001');
      expect(calendarEvents).toHaveLength(4); // kickoff, weekly, site visit, invoice task

      const invoiceNumberStats = numberingService.getNumberingStatistics();
      expect(invoiceNumberStats.byType.invoice).toBe(1);

      // Step 12: Check for any conflicts in the calendar
      const conflicts = calendarService.getConflicts();
      expect(conflicts).toHaveLength(0); // Should be no conflicts
    });

    it('should handle error scenarios gracefully in the complete workflow', async () => {
      // Test with minimal/invalid data to ensure error handling
      const minimalQuote = {
        customerId: '',
        customer: '',
        positions: []
      };

      // Should not throw errors
      const invoiceData = invoiceService.createInvoiceFromQuote(minimalQuote);
      expect(invoiceData).toBeDefined();
      expect(invoiceData.number).toMatch(/^AR-\d{4}-\d{6}$/);

      const totals = invoiceService.calculateInvoiceTotals(invoiceData.positions);
      expect(totals.subtotal).toBe(0);
      expect(totals.taxAmount).toBe(0);
      expect(totals.total).toBe(0);

      const pdfBlob = await invoiceService.generateInvoicePDF(invoiceData as any);
      expect(pdfBlob).toBeInstanceOf(Blob);

      const emailResult = await invoiceService.sendInvoiceEmail(invoiceData as any, pdfBlob);
      expect(emailResult).toBe(true); // Even with minimal data, should succeed
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple projects and invoices efficiently', async () => {
      const startTime = Date.now();
      
      // Create 10 projects with associated events and invoices
      for (let i = 0; i < 10; i++) {
        // Create project events
        calendarService.createEvent({
          title: `Project ${i + 1} Kickoff`,
          startTime: new Date(`2024-03-${20 + i}T09:00:00Z`),
          endTime: new Date(`2024-03-${20 + i}T10:00:00Z`),
          eventType: 'meeting',
          projectId: `PROJ-2024-${String(i + 1).padStart(3, '0')}`
        } as any);

        // Create quote and invoice
        const quote = {
          customerId: `CUST-2024-${String(i + 1).padStart(3, '0')}`,
          customer: `Customer ${i + 1}`,
          positions: [
            {
              id: 'pos-1',
              description: `Service for Project ${i + 1}`,
              quantity: 1,
              unit: 'Pauschal',
              unitPrice: 1000 * (i + 1),
              total: 1000 * (i + 1),
              taxRate: 19
            }
          ]
        };

        const invoiceData = invoiceService.createInvoiceFromQuote(quote);
        const totals = invoiceService.calculateInvoiceTotals(invoiceData.positions);
        const pdfBlob = await invoiceService.generateInvoicePDF(invoiceData as any);
        await invoiceService.sendInvoiceEmail(invoiceData as any, pdfBlob);
      }
      
      const endTime = Date.now();
      
      // Verify all data was created
      const allEvents = calendarService.getEvents();
      expect(allEvents.length).toBeGreaterThanOrEqual(10);
      
      const numberingStats = numberingService.getNumberingStatistics();
      expect(numberingStats.byType.invoice).toBe(10);
      
      // Should complete within reasonable time (less than 2 seconds for 10 projects)
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('Data Consistency Across Services', () => {
    it('should maintain consistent data across all integrated services', () => {
      // Create a project with consistent IDs across services
      const projectId = 'PROJ-CONS-001';
      const customerId = 'CUST-CONS-001';
      
      // Create calendar events
      const projectEvent = calendarService.createEvent({
        title: 'Consistency Test Project',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        eventType: 'meeting',
        projectId: projectId,
        customerId: customerId
      } as any);
      
      // Create quote with same IDs
      const quote = {
        customerId: customerId,
        customer: 'Consistency Test Customer',
        projectId: projectId,
        project: 'Consistency Test Project',
        positions: [
          {
            id: 'pos-1',
            description: 'Test Service',
            quantity: 1,
            unit: 'Pauschal',
            unitPrice: 1000,
            total: 1000,
            taxRate: 19
          }
        ]
      };
      
      // Create invoice
      const invoiceData = invoiceService.createInvoiceFromQuote(quote);
      
      // Verify consistency
      expect(projectEvent.projectId).toBe(projectId);
      expect(projectEvent.customerId).toBe(customerId);
      expect(invoiceData.projectId).toBe(projectId);
      expect(invoiceData.customerId).toBe(customerId);
      
      // Verify numbering service is tracking invoices
      const stats = numberingService.getNumberingStatistics();
      expect(stats.byType.invoice).toBe(1);
    });
  });
});