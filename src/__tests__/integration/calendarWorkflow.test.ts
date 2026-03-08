import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CalendarIntegrationService } from '../../services/calendarIntegrationService';
import { dragDropService } from '../../services/dragDropService';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

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

describe('Calendar Workflow Integration', () => {
  let calendarService: CalendarIntegrationService;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    calendarService = CalendarIntegrationService.getInstance();
    
    // Clear any existing data
    (calendarService as any).events.clear();
    (calendarService as any).providers.clear();
    (calendarService as any).conflicts.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Complete Appointment Scheduling Workflow', () => {
    it('should create, schedule, and manage appointments through complete workflow', () => {
      // Step 1: Create initial appointment
      const initialAppointment = calendarService.createEvent({
        title: 'Baustellenbesprechung',
        description: 'Wöchentliche Besprechung mit dem Bauherren',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        attendees: [{
          email: 'bauherr@firma.de',
          name: 'Max Mustermann',
          role: 'required',
          status: 'needs-action'
        }],
        organizer: {
          email: 'admin@bauplan.de',
          name: 'Bauplan Administrator',
          role: 'organizer',
          status: 'accepted'
        },
        eventType: 'meeting',
        priority: 'normal',
        location: 'Baustelle Musterstraße 10'
      });

      expect(initialAppointment).toBeDefined();
      expect(initialAppointment.id).toBeDefined();
      expect(initialAppointment.title).toBe('Baustellenbesprechung');
      expect(initialAppointment.status).toBe('confirmed');
      expect(initialAppointment.attendees).toHaveLength(1);

      // Step 2: Retrieve and verify appointment
      const retrievedEvents = calendarService.getEvents();
      expect(retrievedEvents).toHaveLength(1);
      expect(retrievedEvents[0].id).toBe(initialAppointment.id);

      // Step 3: Update appointment details
      const updatedAppointment = calendarService.updateEvent(initialAppointment.id, {
        title: 'Wöchentliche Baustellenbesprechung',
        description: 'Wöchentliche Besprechung mit dem Bauherren - Projektupdate',
        location: 'Baustelle Musterstraße 10, Konferenzraum'
      });

      expect(updatedAppointment).not.toBeNull();
      expect(updatedAppointment?.title).toBe('Wöchentliche Baustellenbesprechung');
      expect(updatedAppointment?.description).toContain('Projektupdate');
      expect(updatedAppointment?.location).toBe('Baustelle Musterstraße 10, Konferenzraum');

      // Step 4: Add additional attendees
      const appointmentWithMoreAttendees = calendarService.updateEvent(initialAppointment.id, {
        attendees: [
          ...updatedAppointment!.attendees,
          {
            email: 'architekt@firma.de',
            name: 'Erika Beispiel',
            role: 'optional',
            status: 'needs-action'
          }
        ]
      });

      expect(appointmentWithMoreAttendees?.attendees).toHaveLength(2);

      // Step 5: Check for conflicts with new appointment
      const conflictCheck = calendarService.getConflicts();
      expect(conflictCheck).toHaveLength(0); // No conflicts yet

      // Step 6: Create overlapping appointment to test conflict detection
      const overlappingAppointment = calendarService.createEvent({
        title: 'Materiallieferung',
        startTime: new Date('2024-03-20T10:30:00Z'), // Overlaps with first appointment
        endTime: new Date('2024-03-20T11:30:00Z'),
        eventType: 'delivery',
        location: 'Baustelle Musterstraße 10'
      });

      // Check for conflicts
      const conflicts = calendarService.getConflicts();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('overlap');
      expect(conflicts[0].resolved).toBe(false);

      // Step 7: Resolve conflict
      const resolved = calendarService.resolveConflict(conflicts[0].id);
      expect(resolved).toBe(true);

      // Verify conflict is resolved
      const conflictsAfterResolution = calendarService.getConflicts();
      expect(conflictsAfterResolution).toHaveLength(0);
    });

    it('should handle recurring appointments workflow', () => {
      // Create recurring appointment
      const startDate = new Date('2024-03-20T09:00:00Z');
      const endDate = new Date('2024-03-20T10:00:00Z');
      
      const recurringAppointment = calendarService.createEvent({
        title: 'Wöchentliche Planungssitzung',
        description: 'Planung der kommenden Bauaktivitäten',
        startTime: startDate,
        endTime: endDate,
        eventType: 'meeting',
        priority: 'high',
        recurrence: {
          frequency: 'weekly',
          interval: 1,
          endDate: new Date('2024-06-20T09:00:00Z')
        }
      });

      expect(recurringAppointment).toBeDefined();
      expect(recurringAppointment.recurrence).toBeDefined();
      expect(recurringAppointment.recurrence?.frequency).toBe('weekly');

      // Verify recurring events are generated
      const allEvents = calendarService.getEvents(
        new Date('2024-03-20T00:00:00Z'),
        new Date('2024-04-20T23:59:59Z')
      );
      
      // Should have multiple instances (original + recurring)
      expect(allEvents.length).toBeGreaterThan(1);
      
      // Check that all instances have the same title
      allEvents.forEach(event => {
        expect(event.title).toBe('Wöchentliche Planungssitzung');
      });
    });

    it('should manage calendar providers integration', async () => {
      // Step 1: Authenticate with Google Calendar
      const googleAuthResult = await calendarService.authenticateProvider('google');
      expect(googleAuthResult).toBe(true);
      
      // Verify provider was added
      const providers = calendarService.getProviders();
      expect(providers).toHaveLength(1);
      expect(providers[0].type).toBe('google');
      expect(providers[0].status).toBe('connected');

      // Step 2: Authenticate with Outlook Calendar
      const outlookAuthResult = await calendarService.authenticateProvider('outlook');
      expect(outlookAuthResult).toBe(true);
      
      // Verify both providers are present
      const updatedProviders = calendarService.getProviders();
      expect(updatedProviders).toHaveLength(2);
      const providerTypes = updatedProviders.map(p => p.type);
      expect(providerTypes).toContain('google');
      expect(providerTypes).toContain('outlook');

      // Step 3: Check calendar statistics
      const stats = calendarService.getCalendarStats();
      expect(stats.providersCount).toBe(2);
      expect(stats.totalEvents).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Calendar Data Persistence Workflow', () => {
    it('should save and restore calendar data correctly', () => {
      // Create some events
      const event1 = calendarService.createEvent({
        title: 'Saved Event 1',
        startTime: new Date('2024-03-25T10:00:00Z'),
        endTime: new Date('2024-03-25T11:00:00Z'),
        eventType: 'meeting'
      });

      const event2 = calendarService.createEvent({
        title: 'Saved Event 2',
        startTime: new Date('2024-03-26T14:00:00Z'),
        endTime: new Date('2024-03-26T15:00:00Z'),
        eventType: 'site-visit'
      });

      // Add a provider
      (calendarService as any).addProvider('google', 'user@example.com');

      // Save data (this is usually called internally)
      (calendarService as any).saveData();

      // Verify localStorage was called
      expect(localStorage.setItem).toHaveBeenCalled();

      // Create new service instance to simulate app restart
      const newCalendarService = CalendarIntegrationService.getInstance();
      
      // Load data (this is usually called internally)
      (newCalendarService as any).loadData();

      // Verify events are restored
      const restoredEvents = newCalendarService.getEvents();
      expect(restoredEvents).toHaveLength(2);
      
      const restoredEvent1 = restoredEvents.find(e => e.title === 'Saved Event 1');
      const restoredEvent2 = restoredEvents.find(e => e.title === 'Saved Event 2');
      
      expect(restoredEvent1).toBeDefined();
      expect(restoredEvent2).toBeDefined();
      expect(restoredEvent1?.eventType).toBe('meeting');
      expect(restoredEvent2?.eventType).toBe('site-visit');

      // Verify providers are restored
      const restoredProviders = newCalendarService.getProviders();
      expect(restoredProviders).toHaveLength(1);
      expect(restoredProviders[0].type).toBe('google');
      expect(restoredProviders[0].accountEmail).toBe('user@example.com');
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage failed');
      });
      
      // Create an event
      const event = calendarService.createEvent({
        title: 'Test Event',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        eventType: 'meeting'
      });

      // This should not throw
      (calendarService as any).saveData();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Calendar Filtering and Search Workflow', () => {
    beforeEach(() => {
      // Create test data
      calendarService.createEvent({
        title: 'Baustellenbesprechung',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        eventType: 'meeting',
        projectId: 'proj-123'
      });

      calendarService.createEvent({
        title: 'Materiallieferung',
        startTime: new Date('2024-03-21T08:00:00Z'),
        endTime: new Date('2024-03-21T09:00:00Z'),
        eventType: 'delivery',
        projectId: 'proj-123'
      });

      calendarService.createEvent({
        title: 'Architektenbesprechung',
        startTime: new Date('2024-03-22T14:00:00Z'),
        endTime: new Date('2024-03-22T15:00:00Z'),
        eventType: 'meeting',
        projectId: 'proj-456'
      });
    });

    it('should filter events by date range', () => {
      const marchEvents = calendarService.getEvents(
        new Date('2024-03-01T00:00:00Z'),
        new Date('2024-03-31T23:59:59Z')
      );
      
      expect(marchEvents).toHaveLength(3);

      const specificDateEvents = calendarService.getEvents(
        new Date('2024-03-20T00:00:00Z'),
        new Date('2024-03-20T23:59:59Z')
      );
      
      expect(specificDateEvents).toHaveLength(1);
      expect(specificDateEvents[0].title).toBe('Baustellenbesprechung');
    });

    it('should filter events by project', () => {
      const project123Events = calendarService.getEventsByProject('proj-123');
      expect(project123Events).toHaveLength(2);
      
      const project123Titles = project123Events.map(e => e.title);
      expect(project123Titles).toContain('Baustellenbesprechung');
      expect(project123Titles).toContain('Materiallieferung');

      const project456Events = calendarService.getEventsByProject('proj-456');
      expect(project456Events).toHaveLength(1);
      expect(project456Events[0].title).toBe('Architektenbesprechung');
    });

    it('should filter events by type', () => {
      const allEvents = calendarService.getEvents();
      const meetings = allEvents.filter(e => e.eventType === 'meeting');
      const deliveries = allEvents.filter(e => e.eventType === 'delivery');
      
      expect(meetings).toHaveLength(2);
      expect(deliveries).toHaveLength(1);
    });
  });

  describe('Calendar Statistics Workflow', () => {
    beforeEach(() => {
      // Create test data with different dates and types
      const now = Date.now();
      
      // Past event
      calendarService.createEvent({
        title: 'Past Meeting',
        startTime: new Date(now - 86400000), // Yesterday
        endTime: new Date(now - 82800000),
        eventType: 'meeting'
      });

      // Future event
      calendarService.createEvent({
        title: 'Future Meeting',
        startTime: new Date(now + 86400000), // Tomorrow
        endTime: new Date(now + 90000000),
        eventType: 'meeting'
      });

      // Today event
      calendarService.createEvent({
        title: 'Today Meeting',
        startTime: new Date(now + 3600000), // In 1 hour
        endTime: new Date(now + 7200000), // In 2 hours
        eventType: 'site-visit'
      });

      // Add providers
      (calendarService as any).addProvider('google', 'user1@google.com');
      (calendarService as any).addProvider('outlook', 'user2@outlook.com');
    });

    it('should provide accurate calendar statistics', () => {
      const stats = calendarService.getCalendarStats();
      
      expect(stats.totalEvents).toBe(3);
      expect(stats.upcomingEvents).toBe(2); // Today and future events
      expect(stats.pastEvents).toBe(1);
      expect(stats.providersCount).toBe(2);
      
      // Check event type breakdown
      expect(stats.byType.meeting).toBe(2);
      expect(stats.byType['site-visit']).toBe(1);
      
      // Check date distribution
      expect(stats.byDate.today).toBe(1);
      expect(stats.byDate.upcoming).toBe(1);
      expect(stats.byDate.past).toBe(1);
    });
  });
});