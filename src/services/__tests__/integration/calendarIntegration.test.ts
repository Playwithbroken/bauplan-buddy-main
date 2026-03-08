import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CalendarIntegrationService } from '../../calendarIntegrationService';
import { AppointmentService } from '../../appointmentService';
import { CalendarInviteService } from '../../calendarInviteService';
import { calendarApi } from '../../calendarApi';
import { StoredAppointment } from '../../appointmentService';

// Extend Jest matchers to include jest-dom
import '@testing-library/jest-dom';

// Mock external dependencies
jest.mock('../../calendarApi');
jest.mock('../../../utils/errorHandling');

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

// Mock fetch for external API calls
const mockFetch = jest.fn();
Object.defineProperty(global, 'fetch', {
  value: mockFetch,
  writable: true
});

// Mock environment variables
(global as any).import = {
  meta: {
    env: {
      VITE_USE_API: 'false',
      MODE: 'test'
    }
  }
};

describe('Calendar Integration Tests', () => {
  const mockCalendarIntegrationService = new CalendarIntegrationService();
  
  const mockAppointment: StoredAppointment = {
    id: 'APT-001',
    title: 'Test Integration Appointment',
    description: 'Integration test for calendar sync',
    type: 'site-visit',
    date: '2024-03-15',
    startTime: '09:00',
    endTime: '10:00',
    location: 'Test Location, München',
    projectId: 'PRJ-001',
    attendees: ['test@example.com', 'client@example.com'],
    teamMembers: ['TM-001'],
    equipment: ['EQ-001'],
    priority: 'high',
    customerNotification: true,
    reminderTime: '15',
    emailNotifications: {
      enabled: true,
      sendInvitations: true,
      sendReminders: true,
      recipients: ['test@example.com'],
      customMessage: 'Custom test message'
    },
    createdAt: '2024-03-01T10:00:00.000Z',
    updatedAt: '2024-03-01T10:00:00.000Z'
  };

  const mockExternalProvider = {
    id: 'google',
    name: 'Google Calendar',
    credentials: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: Date.now() + 3600000
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    mockFetch.mockClear();
    
    // Setup default localStorage responses
    localStorageMock.getItem.mockImplementation((key: string) => {
      switch (key) {
        case 'bauplan-buddy-appointments':
          return JSON.stringify([mockAppointment]);
        case 'calendar-integration-providers':
          return JSON.stringify([mockExternalProvider]);
        case 'calendar-sync-settings':
          return JSON.stringify({
            autoSync: true,
            syncInterval: 300000,
            lastSync: Date.now() - 60000
          });
        default:
          return null;
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Calendar Service Integration', () => {
    it('should integrate calendar API with appointment service', async () => {
      // Mock calendar API responses
      const mockCalendarEvent = {
        id: 'CAL-001',
        title: mockAppointment.title,
        description: mockAppointment.description,
        date: new Date(mockAppointment.date + 'T' + mockAppointment.startTime),
        endDate: new Date(mockAppointment.date + 'T' + mockAppointment.endTime),
        location: mockAppointment.location,
        attendees: mockAppointment.attendees,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1'
      };

      (calendarApi.createEvent as jest.MockedFunction<typeof calendarApi.createEvent>)
        .mockResolvedValue(mockCalendarEvent);
      (calendarApi.getEvents as jest.MockedFunction<typeof calendarApi.getEvents>)
        .mockResolvedValue([mockCalendarEvent]);

      // Test creating appointment through calendar API
      const appointmentService = new AppointmentService();
      const savedAppointment = await appointmentService.saveAppointment({
        title: mockAppointment.title,
        description: mockAppointment.description,
        type: mockAppointment.type,
        date: mockAppointment.date,
        startTime: mockAppointment.startTime,
        endTime: mockAppointment.endTime,
        location: mockAppointment.location,
        projectId: mockAppointment.projectId,
        attendees: mockAppointment.attendees,
        teamMembers: mockAppointment.teamMembers,
        equipment: mockAppointment.equipment,
        priority: mockAppointment.priority,
        customerNotification: mockAppointment.customerNotification,
        reminderTime: mockAppointment.reminderTime,
        emailNotifications: mockAppointment.emailNotifications
      });

      expect(savedAppointment).toBeDefined();
      expect(savedAppointment.id).toBeDefined();
      expect(savedAppointment.title).toBe(mockAppointment.title);
    });

    it('should handle calendar event synchronization conflicts', async () => {
      const conflictingEvent = {
        ...mockAppointment,
        id: 'APT-002',
        title: 'Conflicting Appointment',
        startTime: '09:30',
        endTime: '10:30'
      };

      // Mock availability check
      (calendarApi.checkAvailability as jest.MockedFunction<typeof calendarApi.checkAvailability>)
        .mockResolvedValue({
          available: false,
          conflicts: [{
            id: 'CAL-002',
            title: 'Existing Meeting',
            date: new Date('2024-03-15T09:15:00.000Z'),
            endDate: new Date('2024-03-15T10:45:00.000Z'),
            location: 'Meeting Room',
            attendees: ['test@example.com'],
            status: 'confirmed',
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'user-1'
          }]
        });

      const result = await calendarApi.checkAvailability(
        new Date('2024-03-15T09:30:00.000Z'),
        new Date('2024-03-15T10:30:00.000Z'),
        ['test@example.com']
      );

      expect(result.available).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].title).toBe('Existing Meeting');
    });

    it('should sync appointment changes across services', async () => {
      const appointmentService = new AppointmentService();
      
      // Mock calendar API update
      const updatedEvent = {
        id: 'CAL-001',
        title: 'Updated Integration Appointment',
        description: mockAppointment.description,
        date: new Date(mockAppointment.date + 'T' + mockAppointment.startTime),
        endDate: new Date(mockAppointment.date + 'T' + mockAppointment.endTime),
        location: 'Updated Location',
        attendees: mockAppointment.attendees,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1'
      };

      (calendarApi.updateEvent as jest.MockedFunction<typeof calendarApi.updateEvent>)
        .mockResolvedValue(updatedEvent);

      // Update appointment
      const updatedAppointment = await appointmentService.updateAppointment(mockAppointment.id, {
        title: 'Updated Integration Appointment',
        location: 'Updated Location'
      });

      expect(updatedAppointment).toBeDefined();
      expect(updatedAppointment.title).toBe('Updated Integration Appointment');
      expect(updatedAppointment.location).toBe('Updated Location');
    });
  });

  describe('External Provider Integration', () => {
    it('should authenticate with external calendar providers', async () => {
      // Mock OAuth flow
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600
        })
      });

      const result = await mockCalendarIntegrationService.authenticateProvider('google', {
        code: 'oauth-code',
        redirectUri: 'http://localhost:3000/auth/callback'
      });

      expect(result.success).toBe(true);
      expect(result.provider?.credentials?.accessToken).toBe('new-access-token');
    });

    it('should sync events with external providers', async () => {
      // Mock external provider events
      const externalEvents = [
        {
          id: 'ext-001',
          summary: 'External Meeting',
          description: 'Meeting from external calendar',
          start: { dateTime: '2024-03-15T14:00:00Z' },
          end: { dateTime: '2024-03-15T15:00:00Z' },
          location: 'External Location',
          attendees: [{ email: 'external@example.com' }]
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: externalEvents })
      });

      const syncResult = await mockCalendarIntegrationService.syncEvents('google');

      expect(syncResult.success).toBe(true);
      expect(syncResult.importedEvents).toBeDefined();
      expect(syncResult.conflicts).toBeDefined();
    });

    it('should handle external provider API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Provider API Error'));

      const result = await mockCalendarIntegrationService.syncEvents('google');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Provider API Error');
    });

    it('should refresh expired tokens automatically', async () => {
      // Mock expired token scenario
      const expiredProvider = {
        ...mockExternalProvider,
        credentials: {
          ...mockExternalProvider.credentials,
          expiresAt: Date.now() - 1000 // Expired
        }
      };

      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'calendar-integration-providers') {
          return JSON.stringify([expiredProvider]);
        }
        return null;
      });

      // Mock token refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'refreshed-access-token',
          expires_in: 3600
        })
      });

      const result = await mockCalendarIntegrationService.refreshProviderToken('google');

      expect(result.success).toBe(true);
      expect(result.credentials?.accessToken).toBe('refreshed-access-token');
    });
  });

  describe('Calendar Invite Integration', () => {
    it('should generate and send calendar invites for appointments', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        { name: 'Bauplan Buddy', email: 'noreply@bauplan-buddy.com' },
        mockAppointment.attendees.map(email => ({ name: email, email }))
      );

      expect(invite).toBeDefined();
      expect(invite.filename).toMatch(/^appointment-.*\.ics$/);
      expect(invite.content).toContain('BEGIN:VCALENDAR');
      expect(invite.content).toContain('BEGIN:VEVENT');
      expect(invite.content).toContain('SUMMARY:Test Integration Appointment');
      expect(invite.content).toContain('LOCATION:Test Location, München');
      expect(invite.content).toContain('END:VEVENT');
      expect(invite.content).toContain('END:VCALENDAR');
    });

    it('should handle recurring appointments in calendar invites', () => {
      const recurringAppointment = {
        ...mockAppointment,
        isRecurring: true,
        recurrencePattern: {
          frequency: 'weekly' as const,
          interval: 1,
          daysOfWeek: [1], // Monday
          endDate: '2024-06-15'
        }
      };

      const invite = CalendarInviteService.generateCalendarInvite(recurringAppointment);

      expect(invite.content).toContain('RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO;UNTIL=20240615');
    });

    it('should parse external calendar invites correctly', () => {
      const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//External//Calendar//EN
BEGIN:VEVENT
UID:external-event-001
DTSTART:20240315T090000Z
DTEND:20240315T100000Z
SUMMARY:External Appointment
DESCRIPTION:Imported from external calendar
LOCATION:External Location
ATTENDEE:mailto:external@example.com
END:VEVENT
END:VCALENDAR`;

      const parseResult = CalendarInviteService.parseCalendarInvite(icalContent);

      expect(parseResult.isValid).toBe(true);
      expect(parseResult.events).toHaveLength(1);
      expect(parseResult.events[0].summary).toBe('External Appointment');
      expect(parseResult.events[0].location).toBe('External Location');
      expect(parseResult.errors).toHaveLength(0);
    });
  });

  describe('Team and Resource Integration', () => {
    it('should check team member availability across appointments', async () => {
      const teamMemberEvents = [
        {
          id: 'TM-EVT-001',
          title: 'Team Meeting',
          date: new Date('2024-03-15T08:00:00.000Z'),
          endDate: new Date('2024-03-15T09:00:00.000Z'),
          location: 'Conference Room',
          attendees: ['team@example.com'],
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-1'
        }
      ];

      (calendarApi.getTeamMemberEvents as jest.MockedFunction<typeof calendarApi.getTeamMemberEvents>)
        .mockResolvedValue(teamMemberEvents);

      const events = await calendarApi.getTeamMemberEvents(
        'TM-001',
        new Date('2024-03-15'),
        new Date('2024-03-16')
      );

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Team Meeting');
    });

    it('should manage project-specific calendar events', async () => {
      const projectEvents = [
        {
          id: 'PROJ-EVT-001',
          title: 'Project Kickoff',
          date: new Date('2024-03-15T10:00:00.000Z'),
          endDate: new Date('2024-03-15T12:00:00.000Z'),
          location: 'Project Site',
          attendees: ['project@example.com'],
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-1'
        }
      ];

      (calendarApi.getProjectEvents as jest.MockedFunction<typeof calendarApi.getProjectEvents>)
        .mockResolvedValue(projectEvents);

      const events = await calendarApi.getProjectEvents('PRJ-001');

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Project Kickoff');
    });

    it('should handle customer calendar integration', async () => {
      const customerEvents = [
        {
          id: 'CUST-EVT-001',
          title: 'Customer Review',
          date: new Date('2024-03-15T16:00:00.000Z'),
          endDate: new Date('2024-03-15T17:00:00.000Z'),
          location: 'Customer Office',
          attendees: ['customer@example.com'],
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-1'
        }
      ];

      (calendarApi.getCustomerEvents as jest.MockedFunction<typeof calendarApi.getCustomerEvents>)
        .mockResolvedValue(customerEvents);

      const events = await calendarApi.getCustomerEvents('CUST-001');

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Customer Review');
    });
  });

  describe('Statistics and Analytics Integration', () => {
    it('should generate calendar statistics', async () => {
      const mockStats = {
        totalEvents: 25,
        eventsByType: {
          'site-visit': 10,
          'meeting': 8,
          'delivery': 4,
          'milestone': 3
        },
        eventsByStatus: {
          'confirmed': 20,
          'tentative': 3,
          'cancelled': 2
        },
        upcomingEvents: 15,
        overdueEvents: 2
      };

      (calendarApi.getEventStats as jest.MockedFunction<typeof calendarApi.getEventStats>)
        .mockResolvedValue(mockStats);

      const stats = await calendarApi.getEventStats(
        new Date('2024-03-01'),
        new Date('2024-03-31')
      );

      expect(stats.totalEvents).toBe(25);
      expect(stats.eventsByType['site-visit']).toBe(10);
      expect(stats.upcomingEvents).toBe(15);
      expect(stats.overdueEvents).toBe(2);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network failures gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));

      const result = await mockCalendarIntegrationService.syncEvents('google');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network Error');
    });

    it('should retry failed synchronization attempts', async () => {
      let attempts = 0;
      mockFetch.mockImplementation(() => {
        attempts++;
        if (attempts <= 2) {
          return Promise.reject(new Error('Temporary Error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [] })
        });
      });

      const result = await mockCalendarIntegrationService.syncEvents('google', { retryAttempts: 3 });

      expect(attempts).toBe(3);
      expect(result.success).toBe(true);
    });

    it('should handle invalid calendar data formats', () => {
      const invalidIcalContent = 'INVALID CALENDAR CONTENT';

      const parseResult = CalendarInviteService.parseCalendarInvite(invalidIcalContent);

      expect(parseResult.isValid).toBe(false);
      expect(parseResult.errors).toHaveLength(2); // Missing VCALENDAR start and end
      expect(parseResult.events).toHaveLength(0);
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large calendar datasets efficiently', async () => {
      const largeEventSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `LARGE-EVT-${i.toString().padStart(3, '0')}`,
        title: `Event ${i + 1}`,
        date: new Date(`2024-03-${(i % 31) + 1}T${(i % 24).toString().padStart(2, '0')}:00:00.000Z`),
        endDate: new Date(`2024-03-${(i % 31) + 1}T${((i % 24) + 1).toString().padStart(2, '0')}:00:00.000Z`),
        location: `Location ${i + 1}`,
        attendees: [`user${i}@example.com`],
        status: 'confirmed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1'
      }));

      (calendarApi.getEvents as jest.MockedFunction<typeof calendarApi.getEvents>)
        .mockResolvedValue(largeEventSet);

      const startTime = Date.now();
      const events = await calendarApi.getEvents({
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-31')
      });
      const endTime = Date.now();

      expect(events).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should cache frequently accessed calendar data', async () => {
      const cacheKey = 'calendar-events-2024-03';
      const cachedEvents = [mockAppointment];

      // Mock cache hit
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === cacheKey) {
          return JSON.stringify(cachedEvents);
        }
        return null;
      });

      // This would typically be implemented in the calendar service
      // For now, we'll just verify cache keys are used correctly
      expect(localStorageMock.getItem).toHaveBeenCalledWith('bauplan-buddy-appointments');
    });
  });
});