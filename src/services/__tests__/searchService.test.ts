import SearchService from '../searchService';

describe('SearchService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('search', () => {
    it('should return empty array for empty query', () => {
      const results = SearchService.search('');
      expect(results).toEqual([]);
    });

    it('should return empty array when no data exists', () => {
      const results = SearchService.search('test');
      expect(results).toEqual([]);
    });

    it('should search projects correctly', () => {
      // Mock project data
      const mockProjects = [
        {
          id: 'proj-1',
          name: 'Bauprojekt Alpha',
          description: 'Ein wichtiges Bauprojekt',
          status: 'active',
          category: 'steel_construction',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          budget: 100000,
          actualCost: 50000,
          progress: 50,
          clientId: 'client-1',
          projectManagerId: 'pm-1',
          teamMembers: [],
          location: {
            address: 'Musterstraße 123',
            coordinates: { lat: 52.52, lng: 13.405 }
          },
          phases: [],
          tasks: [],
          milestones: [],
          documents: [],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'user-1',
          tags: [],
          customFields: {}
        }
      ];

      localStorage.setItem('projects', JSON.stringify(mockProjects));

      const results = SearchService.search('Bauprojekt');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('project');
      expect(results[0].title).toBe('Bauprojekt Alpha');
      expect(results[0].url).toBe('/projects/proj-1');
    });

    it('should search customers correctly', () => {
      // Mock customer data
      const mockCustomers = [
        {
          id: 'cust-1',
          name: 'Mustermann GmbH',
          email: 'info@mustermann.de',
          phone: '+49 123 456789',
          address: 'Musterstraße 123, 12345 Musterstadt',
          status: 'active'
        }
      ];

      localStorage.setItem('customers', JSON.stringify(mockCustomers));

      const results = SearchService.search('Mustermann');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('customer');
      expect(results[0].title).toBe('Mustermann GmbH');
      expect(results[0].url).toBe('/customers/cust-1');
    });

    it('should search quotes correctly', () => {
      // Mock quote data
      const mockQuotes = [
        {
          id: 'quote-1',
          number: 'ANG-2024-001',
          customer: 'Mustermann GmbH',
          project: 'Bauprojekt Alpha',
          amount: 50000,
          status: 'sent',
          date: '2024-01-15',
          validUntil: '2024-02-15',
          positions: []
        }
      ];

      localStorage.setItem('quotes', JSON.stringify(mockQuotes));

      const results = SearchService.search('ANG-2024-001');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('quote');
      expect(results[0].title).toBe('ANG-2024-001 - Mustermann GmbH');
      expect(results[0].url).toBe('/quotes/quote-1');
    });

    it('should search invoices correctly', () => {
      // Mock invoice data
      const mockInvoices = [
        {
          id: 'inv-1',
          number: 'AR-2024-001',
          customer: 'Mustermann GmbH',
          project: 'Bauprojekt Alpha',
          amount: 50000,
          status: 'sent',
          date: '2024-01-15',
          dueDate: '2024-02-15',
          positions: []
        }
      ];

      localStorage.setItem('invoices', JSON.stringify(mockInvoices));

      const results = SearchService.search('AR-2024-001');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('invoice');
      expect(results[0].title).toBe('AR-2024-001 - Mustermann GmbH');
      expect(results[0].url).toBe('/invoices/inv-1');
    });

    it('should search delivery notes correctly', () => {
      // Mock delivery note data
      const mockDeliveryNotes = [
        {
          id: 'dn-1',
          number: 'LS-2024-001',
          customerName: 'Mustermann GmbH',
          projectName: 'Bauprojekt Alpha',
          date: '2024-01-15',
          status: 'sent',
          items: []
        }
      ];

      localStorage.setItem('deliveryNotes', JSON.stringify(mockDeliveryNotes));

      const results = SearchService.search('LS-2024-001');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('delivery_note');
      expect(results[0].title).toBe('LS-2024-001 - Mustermann GmbH');
      expect(results[0].url).toBe('/delivery-notes/dn-1');
    });

    it('should search appointments correctly', () => {
      // Mock appointment data
      const mockAppointments = [
        {
          id: 'apt-1',
          title: 'Baustellenbesprechung',
          description: 'Wöchentliche Besprechung auf der Baustelle',
          type: 'meeting',
          date: '2024-01-15',
          startTime: '09:00',
          endTime: '10:00',
          location: 'Baustelle Musterstraße 123',
          projectId: 'proj-1',
          attendees: [],
          teamMembers: [],
          equipment: [],
          priority: 'medium',
          customerNotification: true,
          reminderTime: '15',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        }
      ];

      localStorage.setItem('appointments', JSON.stringify(mockAppointments));

      const results = SearchService.search('Baustellenbesprechung');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('appointment');
      expect(results[0].title).toBe('Baustellenbesprechung');
      expect(results[0].url).toBe('/calendar?appointment=apt-1');
    });

    it('should sort results by relevance score', () => {
      // Mock data with different relevance scores
      const mockProjects = [
        {
          id: 'proj-1',
          name: 'Test Project Alpha',
          description: 'This is a test project',
          status: 'active',
          category: 'steel_construction',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          budget: 100000,
          actualCost: 50000,
          progress: 50,
          clientId: 'client-1',
          projectManagerId: 'pm-1',
          teamMembers: [],
          location: {
            address: 'Musterstraße 123',
            coordinates: { lat: 52.52, lng: 13.405 }
          },
          phases: [],
          tasks: [],
          milestones: [],
          documents: [],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'user-1',
          tags: [],
          customFields: {}
        },
        {
          id: 'proj-2',
          name: 'Alpha Project Beta',
          description: 'Another test project',
          status: 'active',
          category: 'steel_construction',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          budget: 100000,
          actualCost: 50000,
          progress: 50,
          clientId: 'client-1',
          projectManagerId: 'pm-1',
          teamMembers: [],
          location: {
            address: 'Musterstraße 123',
            coordinates: { lat: 52.52, lng: 13.405 }
          },
          phases: [],
          tasks: [],
          milestones: [],
          documents: [],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'user-1',
          tags: [],
          customFields: {}
        }
      ];

      localStorage.setItem('projects', JSON.stringify(mockProjects));

      const results = SearchService.search('Alpha');
      expect(results).toHaveLength(2);
      // The project with "Alpha" in the name should have a higher score
      expect(results[0].title).toBe('Alpha Project Beta');
      expect(results[1].title).toBe('Test Project Alpha');
    });

    it('should filter results by type', () => {
      // Mock project data
      const mockProjects = [
        {
          id: 'proj-1',
          name: 'Test Project',
          description: 'A test project',
          status: 'active',
          category: 'steel_construction',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          budget: 100000,
          actualCost: 50000,
          progress: 50,
          clientId: 'client-1',
          projectManagerId: 'pm-1',
          teamMembers: [],
          location: {
            address: 'Musterstraße 123',
            coordinates: { lat: 52.52, lng: 13.405 }
          },
          phases: [],
          tasks: [],
          milestones: [],
          documents: [],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'user-1',
          tags: [],
          customFields: {}
        }
      ];

      // Mock customer data
      const mockCustomers = [
        {
          id: 'cust-1',
          name: 'Test Customer',
          email: 'test@example.com',
          status: 'active'
        }
      ];

      localStorage.setItem('projects', JSON.stringify(mockProjects));
      localStorage.setItem('customers', JSON.stringify(mockCustomers));

      // Search only for projects
      const projectResults = SearchService.search('Test', { types: ['project'] });
      expect(projectResults).toHaveLength(1);
      expect(projectResults[0].type).toBe('project');

      // Search only for customers
      const customerResults = SearchService.search('Test', { types: ['customer'] });
      expect(customerResults).toHaveLength(1);
      expect(customerResults[0].type).toBe('customer');
    });
  });

  describe('calculateRelevanceScore', () => {
    it('should give higher score for exact matches', () => {
      const score1 = (SearchService as any).calculateRelevanceScore('test', ['this is a test']);
      const score2 = (SearchService as any).calculateRelevanceScore('test', ['this is testing']);
      expect(score1).toBeGreaterThan(score2);
    });

    it('should give higher score for word beginning matches', () => {
      const score1 = (SearchService as any).calculateRelevanceScore('test', ['testing']);
      const score2 = (SearchService as any).calculateRelevanceScore('test', ['besting']);
      expect(score1).toBeGreaterThan(score2);
    });
  });
});