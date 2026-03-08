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

describe('CalendarIntegrationService', () => {
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

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CalendarIntegrationService.getInstance();
      const instance2 = CalendarIntegrationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Event Management', () => {
    let mockEvent: CalendarEvent;

    beforeEach(() => {
      mockEvent = {
        id: 'event-1',
        title: 'Test Meeting',
        description: 'Test description',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
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
        status: 'confirmed',
        eventType: 'meeting',
        priority: 'normal',
        source: 'bauplan',
        syncStatus: 'pending',
        created: new Date('2024-01-15T09:00:00Z'),
        updated: new Date('2024-01-15T09:00:00Z')
      };
    });

    it('should create events', () => {
      const createdEvent = service.createEvent(mockEvent);
      
      expect(createdEvent.id).toBeDefined();
      expect(createdEvent.title).toBe('Test Meeting');
      expect(createdEvent.syncStatus).toBe('pending');
    });

    it('should update events', () => {
      // First create an event
      const createdEvent = service.createEvent(mockEvent);
      
      // Then update it
      const updatedEvent = service.updateEvent(createdEvent.id, {
        title: 'Updated Meeting',
        description: 'Updated description'
      });
      
      expect(updatedEvent).not.toBeNull();
      expect(updatedEvent?.title).toBe('Updated Meeting');
      expect(updatedEvent?.description).toBe('Updated description');
      expect(updatedEvent?.syncStatus).toBe('pending');
    });

    it('should delete events', () => {
      // First create an event
      const createdEvent = service.createEvent(mockEvent);
      const eventId = createdEvent.id;
      
      // Verify event exists
      const eventsBefore = service.getEvents();
      expect(eventsBefore).toHaveLength(1);
      
      // Delete the event
      const deleted = service.deleteEvent(eventId);
      
      // Verify deletion
      expect(deleted).toBe(true);
      const eventsAfter = service.getEvents();
      expect(eventsAfter).toHaveLength(0);
    });

    it('should return null when updating non-existent event', () => {
      const updatedEvent = service.updateEvent('non-existent-id', {
        title: 'Updated Title'
      });
      
      expect(updatedEvent).toBeNull();
    });

    it('should return false when deleting non-existent event', () => {
      const deleted = service.deleteEvent('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('Event Queries', () => {
    let event1: CalendarEvent;
    let event2: CalendarEvent;

    beforeEach(() => {
      // Create test events
      event1 = service.createEvent({
        title: 'Past Event',
        startTime: new Date('2024-01-10T10:00:00Z'),
        endTime: new Date('2024-01-10T11:00:00Z'),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);
      
      event2 = service.createEvent({
        title: 'Future Event',
        startTime: new Date('2024-02-10T10:00:00Z'),
        endTime: new Date('2024-02-10T11:00:00Z'),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);
    });

    it('should get all events', () => {
      const events = service.getEvents();
      expect(events).toHaveLength(2);
    });

    it('should filter events by date range', () => {
      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-30T23:59:59Z');
      
      const events = service.getEvents(startDate, endDate);
      expect(events).toHaveLength(0); // No events in this range
      
      // Test with a range that includes event2
      const startDate2 = new Date('2024-02-01T00:00:00Z');
      const endDate2 = new Date('2024-02-28T23:59:59Z');
      
      const events2 = service.getEvents(startDate2, endDate2);
      expect(events2).toHaveLength(1);
      expect(events2[0].id).toBe(event2.id);
    });

    it('should get events by project', () => {
      // Create event with project
      const projectEvent = service.createEvent({
        title: 'Project Meeting',
        projectId: 'project-123',
        startTime: new Date('2024-01-20T10:00:00Z'),
        endTime: new Date('2024-01-20T11:00:00Z'),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);
      
      const projectEvents = service.getEventsByProject('project-123');
      expect(projectEvents).toHaveLength(1);
      expect(projectEvents[0].id).toBe(projectEvent.id);
    });
  });

  describe('Provider Management', () => {
    it('should authenticate Google provider', async () => {
      const windowOpenSpy = jest.spyOn(window, 'open');
      
      const result = await service.authenticateProvider('google');
      
      expect(result).toBe(true);
      expect(windowOpenSpy).toHaveBeenCalled();
    });

    it('should authenticate Outlook provider', async () => {
      const windowOpenSpy = jest.spyOn(window, 'open');
      
      const result = await service.authenticateProvider('outlook');
      
      expect(result).toBe(true);
      expect(windowOpenSpy).toHaveBeenCalled();
    });

    it('should add providers', () => {
      // This is a private method, but we can test the effect by checking providers list
      (service as any).addProvider('google', 'user@google.com');
      
      const providers = service.getProviders();
      expect(providers).toHaveLength(1);
      expect(providers[0].type).toBe('google');
      expect(providers[0].accountEmail).toBe('user@google.com');
    });
  });

  describe('Conflict Detection', () => {
    it('should detect overlapping events', () => {
      // Create first event: 10:00-11:00
      const event1 = service.createEvent({
        title: 'Event 1',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);
      
      // Create overlapping event: 10:30-11:30
      const event2 = service.createEvent({
        title: 'Event 2',
        startTime: new Date('2024-01-15T10:30:00Z'),
        endTime: new Date('2024-01-15T11:30:00Z'),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);
      
      const conflicts = service.getConflicts();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('overlap');
      expect(conflicts[0].resolved).toBe(false);
    });

    it('should resolve conflicts', () => {
      // Create overlapping events to generate conflict
      service.createEvent({
        title: 'Event 1',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);
      
      service.createEvent({
        title: 'Event 2',
        startTime: new Date('2024-01-15T10:30:00Z'),
        endTime: new Date('2024-01-15T11:30:00Z'),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);
      
      const conflicts = service.getConflicts();
      expect(conflicts).toHaveLength(1);
      
      const resolved = service.resolveConflict(conflicts[0].id);
      expect(resolved).toBe(true);
      
      const conflictsAfter = service.getConflicts();
      expect(conflictsAfter).toHaveLength(0);
    });
  });

  describe('Calendar Statistics', () => {
    it('should provide calendar statistics', () => {
      // Create some events
      service.createEvent({
        title: 'Past Event',
        startTime: new Date(Date.now() - 86400000), // Yesterday
        endTime: new Date(Date.now() - 82800000),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);
      
      service.createEvent({
        title: 'Future Event',
        startTime: new Date(Date.now() + 86400000), // Tomorrow
        endTime: new Date(Date.now() + 90000000),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);
      
      // Add a provider
      (service as any).addProvider('google', 'user@google.com');
      
      const stats = service.getCalendarStats();
      expect(stats.totalEvents).toBe(2);
      expect(stats.upcomingEvents).toBe(1);
      expect(stats.providersCount).toBe(1);
    });
  });

  describe('Data Persistence', () => {
    it('should save and load data from localStorage', () => {
      // Create some data
      const event = service.createEvent({
        title: 'Test Event',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        eventType: 'meeting'
      } as Partial<CalendarEvent>);
      
      (service as any).addProvider('google', 'user@google.com');
      
      // Save data
      (service as any).saveData();
      
      expect(localStorage.setItem).toHaveBeenCalled();
      
      // Check that data was saved in correct format
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'calendar_events',
        expect.stringContaining(event.id)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage failed');
      });
      
      // This should not throw
      (service as any).saveData();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});