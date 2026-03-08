import { CalendarIntegrationService, CalendarEvent, CalendarProvider } from '../calendarIntegrationService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.open
Object.defineProperty(window, 'open', {
  value: jest.fn(),
  writable: true
});

describe('CalendarIntegrationService - Extended Tests', () => {
  let service: CalendarIntegrationService;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    service = CalendarIntegrationService.getInstance();
    
    // Clear any existing data
    (service as any).events.clear();
    (service as any).providers.clear();
    (service as any).conflicts.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Advanced Event Management', () => {
    it('should handle complex recurring events', () => {
      // Create a complex recurring event
      const startDate = new Date('2024-03-20T10:00:00Z');
      const endDate = new Date('2024-03-20T11:00:00Z');
      
      const recurringEvent = service.createEvent({
        title: 'Complex Recurring Meeting',
        description: 'Weekly team meeting with complex recurrence rules',
        startTime: startDate,
        endTime: endDate,
        attendees: [{
          email: 'attendee@test.com',
          name: 'Test Attendee',
          role: 'required',
          status: 'accepted'
        }],
        organizer: {
          email: 'organizer@test.com',
          name: 'Test Organizer',
          role: 'organizer',
          status: 'accepted'
        },
        eventType: 'meeting',
        priority: 'high',
        location: 'Conference Room A',
        recurrence: {
          frequency: 'weekly',
          interval: 2, // Every 2 weeks
          daysOfWeek: ['MO', 'WE'], // Monday and Wednesday
          endDate: new Date('2024-06-20T10:00:00Z')
        }
      });

      expect(recurringEvent).toBeDefined();
      expect(recurringEvent.recurrence).toBeDefined();
      expect(recurringEvent.recurrence?.frequency).toBe('weekly');
      expect(recurringEvent.recurrence?.interval).toBe(2);
      expect(recurringEvent.recurrence?.daysOfWeek).toEqual(['MO', 'WE']);
    });

    it('should handle events with extensive metadata', () => {
      const eventWithMetadata = service.createEvent({
        title: 'Metadata Rich Event',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        eventType: 'meeting',
        projectId: 'proj-123',
        customerId: 'cust-456',
        tags: ['important', 'client', 'review'],
        customFields: {
          budget: '50000',
          phase: 'planning',
          riskLevel: 'medium'
        },
        attachments: [
          {
            id: 'att-1',
            name: 'project-plan.pdf',
            url: 'https://example.com/project-plan.pdf',
            size: 1024000
          },
          {
            id: 'att-2',
            name: 'blueprints.zip',
            url: 'https://example.com/blueprints.zip',
            size: 5120000
          }
        ],
        reminders: [
          {
            type: 'email',
            minutesBefore: 60
          },
          {
            type: 'popup',
            minutesBefore: 10
          }
        ]
      } as Partial<CalendarEvent>);

      expect(eventWithMetadata.projectId).toBe('proj-123');
      expect(eventWithMetadata.customerId).toBe('cust-456');
      expect(eventWithMetadata.tags).toEqual(['important', 'client', 'review']);
      expect(eventWithMetadata.customFields?.budget).toBe('50000');
      expect(eventWithMetadata.attachments).toHaveLength(2);
      expect(eventWithMetadata.reminders).toHaveLength(2);
    });

    it('should handle timezone-aware events correctly', () => {
      // Create events in different timezones
      const utcEvent = service.createEvent({
        title: 'UTC Event',
        startTime: new Date('2024-03-20T10:00:00Z'), // UTC
        endTime: new Date('2024-03-20T11:00:00Z'),
        eventType: 'meeting',
        timezone: 'UTC'
      } as Partial<CalendarEvent>);

      const berlinEvent = service.createEvent({
        title: 'Berlin Event',
        startTime: new Date('2024-03-20T11:00:00+01:00'), // Berlin time (UTC+1)
        endTime: new Date('2024-03-20T12:00:00+01:00'),
        eventType: 'meeting',
        timezone: 'Europe/Berlin'
      } as Partial<CalendarEvent>);

      expect(utcEvent.timezone).toBe('UTC');
      expect(berlinEvent.timezone).toBe('Europe/Berlin');
      
      // Verify times are stored correctly
      expect(utcEvent.startTime.toISOString()).toBe('2024-03-20T10:00:00.000Z');
      expect(berlinEvent.startTime.toISOString()).toBe('2024-03-20T10:00:00.000Z'); // Should be converted to UTC
    });
  });

  describe('Advanced Conflict Detection', () => {
    it('should detect complex overlapping scenarios', () => {
      // Create multiple overlapping events
      const event1 = service.createEvent({
        title: 'Event 1',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T12:00:00Z'),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);

      const event2 = service.createEvent({
        title: 'Event 2',
        startTime: new Date('2024-03-20T11:00:00Z'),
        endTime: new Date('2024-03-20T13:00:00Z'),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);

      const event3 = service.createEvent({
        title: 'Event 3',
        startTime: new Date('2024-03-20T12:00:00Z'),
        endTime: new Date('2024-03-20T14:00:00Z'),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);

      // All three events overlap with each other
      const conflicts = service.getConflicts();
      expect(conflicts).toHaveLength(3); // Three conflict pairs
      
      // Verify conflict types
      conflicts.forEach(conflict => {
        expect(conflict.type).toBe('overlap');
        expect(conflict.resolved).toBe(false);
      });
    });

    it('should handle recurring event conflicts', () => {
      // Create recurring event
      const recurringEvent = service.createEvent({
        title: 'Recurring Meeting',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        eventType: 'meeting',
        recurrence: {
          frequency: 'weekly',
          interval: 1,
          endDate: new Date('2024-04-20T10:00:00Z')
        }
      } as Partial<CalendarEvent>);

      // Create conflicting single event
      const conflictingEvent = service.createEvent({
        title: 'Conflicting Event',
        startTime: new Date('2024-03-27T10:30:00Z'), // Same time next week
        endTime: new Date('2024-03-27T11:30:00Z'),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);

      const conflicts = service.getConflicts();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('overlap');
    });

    it('should resolve conflicts with different strategies', () => {
      // Create overlapping events
      const event1 = service.createEvent({
        title: 'Original Event',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);

      const event2 = service.createEvent({
        title: 'Conflicting Event',
        startTime: new Date('2024-03-20T10:30:00Z'),
        endTime: new Date('2024-03-20T11:30:00Z'),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);

      const conflicts = service.getConflicts();
      expect(conflicts).toHaveLength(1);

      // Test different resolution strategies
      const conflictId = conflicts[0].id;
      
      // Resolve by moving one event
      const movedEvent = service.updateEvent(event2.id, {
        startTime: new Date('2024-03-20T12:00:00Z'),
        endTime: new Date('2024-03-20T13:00:00Z')
      });
      
      expect(movedEvent).not.toBeNull();
      
      // Verify conflict is resolved
      const conflictsAfterMove = service.getConflicts();
      expect(conflictsAfterMove).toHaveLength(0);
    });
  });

  describe('Advanced Provider Management', () => {
    it('should handle multiple calendar providers with different capabilities', async () => {
      // Add Google provider
      (service as any).addProvider('google', 'user@google.com');
      
      // Add Outlook provider
      (service as any).addProvider('outlook', 'user@outlook.com');
      
      // Add CalDAV provider
      (service as any).addProvider('caldav', 'user@caldav.com');

      const providers = service.getProviders();
      expect(providers).toHaveLength(3);
      
      // Verify provider details
      const googleProvider = providers.find(p => p.type === 'google');
      const outlookProvider = providers.find(p => p.type === 'outlook');
      const caldavProvider = providers.find(p => p.type === 'caldav');
      
      expect(googleProvider).toBeDefined();
      expect(outlookProvider).toBeDefined();
      expect(caldavProvider).toBeDefined();
      
      expect(googleProvider?.accountEmail).toBe('user@google.com');
      expect(outlookProvider?.accountEmail).toBe('user@outlook.com');
      expect(caldavProvider?.accountEmail).toBe('user@caldav.com');
    });

    it('should handle provider authentication flows', async () => {
      const windowOpenSpy = jest.spyOn(window, 'open');
      
      // Test Google authentication
      const googleAuth = await service.authenticateProvider('google');
      expect(googleAuth).toBe(true);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('google'),
        'calendar_auth',
        expect.any(String)
      );
      
      // Test Outlook authentication
      const outlookAuth = await service.authenticateProvider('outlook');
      expect(outlookAuth).toBe(true);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('outlook'),
        'calendar_auth',
        expect.any(String)
      );
      
      windowOpenSpy.mockRestore();
    });

    it('should handle provider status changes', () => {
      // Add provider
      (service as any).addProvider('google', 'user@google.com');
      
      const providers = service.getProviders();
      expect(providers[0].status).toBe('connected');
      
      // Simulate disconnection
      (service as any).updateProviderStatus('google', 'user@google.com', 'disconnected');
      
      const updatedProviders = service.getProviders();
      expect(updatedProviders[0].status).toBe('disconnected');
    });
  });

  describe('Advanced Event Queries and Filtering', () => {
    beforeEach(() => {
      // Create test data
      service.createEvent({
        title: 'Past Meeting',
        startTime: new Date(Date.now() - 86400000), // Yesterday
        endTime: new Date(Date.now() - 82800000),
        eventType: 'meeting',
        projectId: 'proj-1',
        priority: 'normal',
        tags: ['internal']
      } as Partial<CalendarEvent>);

      service.createEvent({
        title: 'Future Meeting',
        startTime: new Date(Date.now() + 86400000), // Tomorrow
        endTime: new Date(Date.now() + 90000000),
        eventType: 'meeting',
        projectId: 'proj-1',
        priority: 'high',
        tags: ['client', 'important']
      } as Partial<CalendarEvent>);

      service.createEvent({
        title: 'Delivery',
        startTime: new Date(Date.now() + 172800000), // In 2 days
        endTime: new Date(Date.now() + 176400000),
        eventType: 'delivery',
        projectId: 'proj-2',
        priority: 'normal',
        tags: ['logistics']
      } as Partial<CalendarEvent>);

      service.createEvent({
        title: 'Site Visit',
        startTime: new Date(Date.now() + 259200000), // In 3 days
        endTime: new Date(Date.now() + 262800000),
        eventType: 'site-visit',
        projectId: 'proj-2',
        priority: 'low',
        tags: ['field']
      } as Partial<CalendarEvent>);
    });

    it('should filter events by complex criteria', () => {
      // Filter by multiple tags
      const taggedEvents = service.getEvents(undefined, undefined, {
        tags: ['client', 'important']
      });
      expect(taggedEvents).toHaveLength(1);
      expect(taggedEvents[0].title).toBe('Future Meeting');

      // Filter by priority and project
      const highPriorityProjectEvents = service.getEvents(undefined, undefined, {
        priority: 'high',
        projectId: 'proj-1'
      });
      expect(highPriorityProjectEvents).toHaveLength(1);
      expect(highPriorityProjectEvents[0].title).toBe('Future Meeting');

      // Filter by event type and date range
      const recentDeliveries = service.getEvents(
        new Date(Date.now() - 43200000), // 12 hours ago
        new Date(Date.now() + 345600000), // 4 days from now
        { eventType: 'delivery' }
      );
      expect(recentDeliveries).toHaveLength(1);
      expect(recentDeliveries[0].title).toBe('Delivery');
    });

    it('should sort events by different criteria', () => {
      // Get all events sorted by start time (default)
      const eventsByTime = service.getEvents();
      expect(eventsByTime).toHaveLength(4);
      
      // Verify chronological order
      for (let i = 1; i < eventsByTime.length; i++) {
        expect(eventsByTime[i].startTime.getTime()).toBeGreaterThan(
          eventsByTime[i-1].startTime.getTime()
        );
      }

      // Test filtering with sorting
      const project1Events = service.getEventsByProject('proj-1');
      expect(project1Events).toHaveLength(2);
      
      // Should be sorted by time
      expect(project1Events[0].startTime.getTime()).toBeLessThan(
        project1Events[1].startTime.getTime()
      );
    });

    it('should handle complex date range queries', () => {
      // Query with specific start and end times
      const specificRangeEvents = service.getEvents(
        new Date(Date.now() + 43200000), // In 12 hours
        new Date(Date.now() + 216000000) // In 2.5 days
      );
      
      // Should include Future Meeting and Delivery
      expect(specificRangeEvents.length).toBeGreaterThanOrEqual(2);
      
      specificRangeEvents.forEach(event => {
        expect(event.startTime.getTime()).toBeGreaterThanOrEqual(
          new Date(Date.now() + 43200000).getTime()
        );
        expect(event.endTime.getTime()).toBeLessThanOrEqual(
          new Date(Date.now() + 216000000).getTime()
        );
      });
    });
  });

  describe('Advanced Statistics and Reporting', () => {
    beforeEach(() => {
      // Create comprehensive test data
      const now = Date.now();
      
      // Past events
      for (let i = 0; i < 5; i++) {
        service.createEvent({
          title: `Past Event ${i + 1}`,
          startTime: new Date(now - (86400000 * (i + 1))),
          endTime: new Date(now - (86400000 * (i + 1)) + 3600000),
          eventType: i % 2 === 0 ? 'meeting' : 'site-visit',
          priority: i % 3 === 0 ? 'high' : 'normal',
          status: 'completed'
        } as Partial<CalendarEvent>);
      }

      // Future events
      for (let i = 0; i < 8; i++) {
        service.createEvent({
          title: `Future Event ${i + 1}`,
          startTime: new Date(now + (86400000 * (i + 1))),
          endTime: new Date(now + (86400000 * (i + 1)) + 3600000),
          eventType: i % 3 === 0 ? 'meeting' : i % 3 === 1 ? 'delivery' : 'site-visit',
          priority: i % 4 === 0 ? 'high' : i % 4 === 1 ? 'normal' : 'low',
          status: 'confirmed'
        } as Partial<CalendarEvent>);
      }

      // Add providers
      (service as any).addProvider('google', 'user1@google.com');
      (service as any).addProvider('outlook', 'user2@outlook.com');
    });

    it('should provide comprehensive statistics', () => {
      const stats = service.getCalendarStats();
      
      expect(stats.totalEvents).toBe(13); // 5 past + 8 future
      expect(stats.upcomingEvents).toBe(8);
      expect(stats.pastEvents).toBe(5);
      expect(stats.providersCount).toBe(2);
      
      // Check event type distribution
      expect(stats.byType.meeting).toBeGreaterThanOrEqual(3);
      expect(stats.byType['site-visit']).toBeGreaterThanOrEqual(3);
      expect(stats.byType.delivery).toBeGreaterThanOrEqual(2);
      
      // Check priority distribution
      expect(stats.byPriority.high).toBeGreaterThanOrEqual(2);
      expect(stats.byPriority.normal).toBeGreaterThanOrEqual(3);
      expect(stats.byPriority.low).toBeGreaterThanOrEqual(2);
      
      // Check status distribution
      expect(stats.byStatus.completed).toBe(5);
      expect(stats.byStatus.confirmed).toBe(8);
    });

    it('should provide detailed time-based analytics', () => {
      const stats = service.getCalendarStats();
      
      // Check date distribution
      expect(stats.byDate.today).toBe(0); // No events today in test data
      expect(stats.byDate.upcoming).toBe(8);
      expect(stats.byDate.past).toBe(5);
      
      // Check weekly distribution
      expect(stats.byWeek).toBeDefined();
      expect(Object.keys(stats.byWeek).length).toBeGreaterThan(0);
    });

    it('should handle statistics for empty calendar', () => {
      // Create new service instance with no events
      const emptyService = CalendarIntegrationService.getInstance();
      (emptyService as any).events.clear();
      (emptyService as any).providers.clear();
      
      const stats = emptyService.getCalendarStats();
      
      expect(stats.totalEvents).toBe(0);
      expect(stats.upcomingEvents).toBe(0);
      expect(stats.pastEvents).toBe(0);
      expect(stats.providersCount).toBe(0);
      expect(stats.byType).toEqual({});
      expect(stats.byPriority).toEqual({});
      expect(stats.byStatus).toEqual({});
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of events efficiently', () => {
      const startTime = Date.now();
      
      // Create 1000 events
      for (let i = 0; i < 1000; i++) {
        service.createEvent({
          title: `Performance Test Event ${i + 1}`,
          startTime: new Date(Date.now() + (i * 3600000)), // Every hour
          endTime: new Date(Date.now() + (i * 3600000) + 3600000), // 1 hour duration
          eventType: i % 3 === 0 ? 'meeting' : i % 3 === 1 ? 'delivery' : 'site-visit'
        } as Partial<CalendarEvent>);
      }
      
      const creationTime = Date.now() - startTime;
      
      // Verify all events created
      const events = service.getEvents();
      expect(events).toHaveLength(1000);
      
      // Creation should be reasonably fast
      expect(creationTime).toBeLessThan(1000); // 1 second for 1000 events
      
      // Test querying performance
      const queryStartTime = Date.now();
      const filteredEvents = service.getEvents(
        new Date(Date.now() + 3600000),
        new Date(Date.now() + 86400000) // Next 24 hours
      );
      const queryTime = Date.now() - queryStartTime;
      
      // Query should be fast
      expect(queryTime).toBeLessThan(100); // 100ms for query
      
      // Should return reasonable number of results
      expect(filteredEvents.length).toBeGreaterThan(0);
      expect(filteredEvents.length).toBeLessThan(100); // Not all events
    });

    it('should handle concurrent event operations', async () => {
      // Create multiple events concurrently
      const promises = [];
      
      for (let i = 0; i < 50; i++) {
        const promise = new Promise(resolve => {
          setTimeout(() => {
            const event = service.createEvent({
              title: `Concurrent Event ${i + 1}`,
              startTime: new Date(Date.now() + (i * 3600000)),
              endTime: new Date(Date.now() + (i * 3600000) + 3600000),
              eventType: 'meeting'
            } as Partial<CalendarEvent>);
            resolve(event);
          }, 0);
        });
        
        promises.push(promise);
      }
      
      const results = await Promise.all(promises);
      
      // Verify all operations completed
      expect(results).toHaveLength(50);
      
      // Verify no duplicate IDs
      const ids = results.map((r: any) => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(50);
    });
  });

  describe('Data Persistence and Recovery', () => {
    it('should handle complex data serialization', () => {
      // Create event with complex data
      const complexEvent = service.createEvent({
        title: 'Complex Data Event',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        eventType: 'meeting',
        recurrence: {
          frequency: 'weekly',
          interval: 1,
          endDate: new Date('2024-06-20T10:00:00Z')
        },
        attendees: [{
          email: 'attendee@test.com',
          name: 'Test Attendee',
          role: 'required',
          status: 'accepted'
        }],
        customFields: {
          key1: 'value1',
          key2: 'value2'
        },
        attachments: [
          {
            id: 'att-1',
            name: 'document.pdf',
            url: 'https://example.com/document.pdf',
            size: 1024
          }
        ]
      } as Partial<CalendarEvent>);

      // Save data
      (service as any).saveData();
      
      // Verify localStorage was called with complex data
      expect(localStorage.setItem).toHaveBeenCalled();
      
      // Get the saved data to verify structure
      const saveCalls = (localStorage.setItem as jest.Mock).mock.calls;
      const savedData = saveCalls.find(call => call[0] === 'calendar_events');
      
      expect(savedData).toBeDefined();
      expect(typeof savedData[1]).toBe('string');
      
      // Verify data can be parsed
      const parsedData = JSON.parse(savedData[1]);
      expect(parsedData).toHaveLength(1);
      expect(parsedData[0].title).toBe('Complex Data Event');
      expect(parsedData[0].recurrence).toBeDefined();
      expect(parsedData[0].customFields).toBeDefined();
    });

    it('should handle data migration scenarios', () => {
      // Simulate old data format
      const oldDataFormat = [
        {
          id: 'old-1',
          title: 'Old Format Event',
          start: '2024-03-20T10:00:00Z', // Old field name
          end: '2024-03-20T11:00:00Z', // Old field name
          type: 'meeting' // Old field name
        }
      ];
      
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'calendar_events') {
          return JSON.stringify(oldDataFormat);
        }
        return null;
      });
      
      // Create new service instance to trigger data loading
      const newService = CalendarIntegrationService.getInstance();
      (newService as any).loadData();
      
      // Should handle migration gracefully
      const events = newService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Old Format Event');
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // Create event
      const event = service.createEvent({
        title: 'Error Test Event',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);
      
      // Save should not throw
      expect(() => {
        (service as any).saveData();
      }).not.toThrow();
      
      // Should log error
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});