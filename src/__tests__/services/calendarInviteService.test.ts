import { CalendarInviteService } from '@/services/calendarInviteService';
import { StoredAppointment } from '@/services/appointmentService';
import { EmailRecipient, CalendarInvite } from '@/types/email';

describe('CalendarInviteService', () => {
  let mockAppointment: StoredAppointment;
  let mockOrganizer: { name: string; email: string };
  let mockAttendees: EmailRecipient[];

  beforeEach(() => {
    mockAppointment = {
      id: 'test-appointment-1',
      title: 'Test Meeting',
      description: 'A test meeting for calendar invite generation',
      type: 'meeting' as const,
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '11:00',
      location: 'Conference Room A',
      projectId: 'project-1',
      attendees: ['john@example.com', 'jane@example.com'],
      teamMembers: ['team1', 'team2'],
      equipment: ['projector'],
      priority: 'medium' as const,
      customerNotification: true,
      reminderTime: '15',
      isRecurring: false,
      recurrencePattern: {
        type: 'none' as const,
        interval: 1,
        endDate: undefined,
        occurrences: undefined,
        dayOfWeek: undefined,
        dayOfMonth: undefined,
        weekDay: undefined
      },
      emailNotifications: {
        enabled: true,
        sendInvitations: true,
        sendReminders: true,
        recipients: [],
        customMessage: ''
      }
    };

    mockOrganizer = {
      name: 'Test Organizer',
      email: 'organizer@example.com'
    };

    mockAttendees = [
      {
        email: 'john@example.com',
        name: 'John Doe',
        role: 'required'
      },
      {
        email: 'jane@example.com',
        name: 'Jane Smith',
        role: 'optional'
      }
    ];
  });

  describe('Calendar Invite Generation', () => {
    test('should generate basic calendar invite', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      expect(invite).toBeDefined();
      expect(invite.content).toContain('BEGIN:VCALENDAR');
      expect(invite.content).toContain('END:VCALENDAR');
      expect(invite.content).toContain('VERSION:2.0');
      expect(invite.content).toContain('PRODID:-//Bauplan Buddy//Calendar Invite//EN');
      expect(invite.mimeType).toBe('text/calendar');
      expect(invite.filename).toMatch(/appointment_\d{4}-\d{2}-\d{2}\.ics/);
    });

    test('should include appointment details in invite', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      expect(invite.content).toContain(`SUMMARY:${mockAppointment.title}`);
      expect(invite.content).toContain(`DESCRIPTION:${mockAppointment.description}`);
      expect(invite.content).toContain(`LOCATION:${mockAppointment.location}`);
      expect(invite.content).toContain(`UID:${mockAppointment.id}`);
    });

    test('should format date and time correctly', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      // Check for proper iCalendar date format (YYYYMMDDTHHMMSS)
      expect(invite.content).toContain('DTSTART:20240115T100000');
      expect(invite.content).toContain('DTEND:20240115T110000');
    });

    test('should include organizer information', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      expect(invite.content).toContain(`ORGANIZER;CN=${mockOrganizer.name}:mailto:${mockOrganizer.email}`);
    });

    test('should include attendees with proper roles', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      expect(invite.content).toContain(`ATTENDEE;CN=John Doe;ROLE=REQ-PARTICIPANT:mailto:john@example.com`);
      expect(invite.content).toContain(`ATTENDEE;CN=Jane Smith;ROLE=OPT-PARTICIPANT:mailto:jane@example.com`);
    });
  });

  describe('Different Invite Methods', () => {
    test('should generate REQUEST invite correctly', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      expect(invite.content).toContain('METHOD:REQUEST');
      expect(invite.content).toContain('STATUS:CONFIRMED');
    });

    test('should generate CANCEL invite correctly', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'CANCEL',
        mockOrganizer,
        mockAttendees
      );

      expect(invite.content).toContain('METHOD:CANCEL');
      expect(invite.content).toContain('STATUS:CANCELLED');
    });

    test('should generate REPLY invite correctly', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REPLY',
        mockOrganizer,
        mockAttendees
      );

      expect(invite.content).toContain('METHOD:REPLY');
    });
  });

  describe('Recurring Appointments', () => {
    test('should handle weekly recurring appointments', () => {
      const recurringAppointment = {
        ...mockAppointment,
        isRecurring: true,
        recurrencePattern: {
          type: 'weekly' as const,
          interval: 1,
          endDate: '2024-03-15',
          occurrences: undefined,
          dayOfWeek: 1, // Monday
          dayOfMonth: undefined,
          weekDay: undefined
        }
      };

      const invite = CalendarInviteService.generateCalendarInvite(
        recurringAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees,
        { includeRecurrence: true }
      );

      expect(invite.content).toContain('RRULE:FREQ=WEEKLY;INTERVAL=1;UNTIL=20240315T235959Z');
    });

    test('should handle monthly recurring appointments', () => {
      const recurringAppointment = {
        ...mockAppointment,
        isRecurring: true,
        recurrencePattern: {
          type: 'monthly' as const,
          interval: 1,
          endDate: undefined,
          occurrences: 12,
          dayOfWeek: undefined,
          dayOfMonth: 15,
          weekDay: undefined
        }
      };

      const invite = CalendarInviteService.generateCalendarInvite(
        recurringAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees,
        { includeRecurrence: true }
      );

      expect(invite.content).toContain('RRULE:FREQ=MONTHLY;INTERVAL=1;COUNT=12;BYMONTHDAY=15');
    });

    test('should handle daily recurring appointments', () => {
      const recurringAppointment = {
        ...mockAppointment,
        isRecurring: true,
        recurrencePattern: {
          type: 'daily' as const,
          interval: 2, // Every 2 days
          endDate: '2024-02-15',
          occurrences: undefined,
          dayOfWeek: undefined,
          dayOfMonth: undefined,
          weekDay: undefined
        }
      };

      const invite = CalendarInviteService.generateCalendarInvite(
        recurringAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees,
        { includeRecurrence: true }
      );

      expect(invite.content).toContain('RRULE:FREQ=DAILY;INTERVAL=2;UNTIL=20240215T235959Z');
    });
  });

  describe('Alarms and Reminders', () => {
    test('should include alarms when specified', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees,
        { includeAlarms: true }
      );

      expect(invite.content).toContain('BEGIN:VALARM');
      expect(invite.content).toContain('END:VALARM');
      expect(invite.content).toContain('ACTION:DISPLAY');
      expect(invite.content).toContain('TRIGGER:-PT15M'); // 15 minutes before
    });

    test('should include multiple alarms for different reminder times', () => {
      const appointmentWithMultipleReminders = {
        ...mockAppointment,
        emailNotifications: {
          ...mockAppointment.emailNotifications,
          reminderTimes: [15, 60, 1440] // 15 min, 1 hour, 1 day
        }
      };

      const invite = CalendarInviteService.generateCalendarInvite(
        appointmentWithMultipleReminders,
        'REQUEST',
        mockOrganizer,
        mockAttendees,
        { includeAlarms: true }
      );

      expect(invite.content).toContain('TRIGGER:-PT15M');
      expect(invite.content).toContain('TRIGGER:-PT1H');
      expect(invite.content).toContain('TRIGGER:-P1D');
    });

    test('should not include alarms when disabled', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees,
        { includeAlarms: false }
      );

      expect(invite.content).not.toContain('BEGIN:VALARM');
      expect(invite.content).not.toContain('END:VALARM');
    });
  });

  describe('Timezone Support', () => {
    test('should include timezone information when specified', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees,
        { 
          includeTimezone: true,
          timezone: 'Europe/Berlin'
        }
      );

      expect(invite.content).toContain('BEGIN:VTIMEZONE');
      expect(invite.content).toContain('END:VTIMEZONE');
      expect(invite.content).toContain('TZID:Europe/Berlin');
      expect(invite.content).toContain('DTSTART;TZID=Europe/Berlin:20240115T100000');
    });

    test('should handle different timezones correctly', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees,
        { 
          includeTimezone: true,
          timezone: 'America/New_York'
        }
      );

      expect(invite.content).toContain('TZID:America/New_York');
    });

    test('should use UTC when timezone not specified', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees,
        { includeTimezone: false }
      );

      expect(invite.content).toContain('DTSTART:20240115T100000Z');
      expect(invite.content).toContain('DTEND:20240115T110000Z');
    });
  });

  describe('Additional Properties', () => {
    test('should include URL when provided', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees,
        { url: 'https://bauplan-buddy.com/appointments/test-appointment-1' }
      );

      expect(invite.content).toContain('URL:https://bauplan-buddy.com/appointments/test-appointment-1');
    });

    test('should include categories for appointment type', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      expect(invite.content).toContain('CATEGORIES:meeting');
    });

    test('should include priority information', () => {
      const highPriorityAppointment = {
        ...mockAppointment,
        priority: 'high' as const
      };

      const invite = CalendarInviteService.generateCalendarInvite(
        highPriorityAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      expect(invite.content).toContain('PRIORITY:3'); // High priority in iCalendar format
    });
  });

  describe('Validation and Error Handling', () => {
    test('should handle missing appointment title', () => {
      const appointmentWithoutTitle = {
        ...mockAppointment,
        title: ''
      };

      const invite = CalendarInviteService.generateCalendarInvite(
        appointmentWithoutTitle,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      expect(invite.content).toContain('SUMMARY:Untitled Appointment');
    });

    test('should handle missing location gracefully', () => {
      const appointmentWithoutLocation = {
        ...mockAppointment,
        location: ''
      };

      const invite = CalendarInviteService.generateCalendarInvite(
        appointmentWithoutLocation,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      expect(invite.content).not.toContain('LOCATION:');
    });

    test('should handle empty attendees list', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        []
      );

      expect(invite.content).toContain('BEGIN:VCALENDAR');
      expect(invite.content).not.toContain('ATTENDEE;');
    });

    test('should generate unique UIDs for different appointments', () => {
      const appointment2 = { ...mockAppointment, id: 'test-appointment-2' };
      
      const invite1 = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );
      
      const invite2 = CalendarInviteService.generateCalendarInvite(
        appointment2,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      expect(invite1.content).toContain('UID:test-appointment-1');
      expect(invite2.content).toContain('UID:test-appointment-2');
    });
  });

  describe('RFC 5545 Compliance', () => {
    test('should generate RFC 5545 compliant iCalendar content', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      // Check required properties
      expect(invite.content).toContain('BEGIN:VCALENDAR');
      expect(invite.content).toContain('END:VCALENDAR');
      expect(invite.content).toContain('VERSION:2.0');
      expect(invite.content).toContain('PRODID:');
      expect(invite.content).toContain('BEGIN:VEVENT');
      expect(invite.content).toContain('END:VEVENT');
      expect(invite.content).toContain('UID:');
      expect(invite.content).toContain('DTSTART:');
      expect(invite.content).toContain('DTEND:');
      expect(invite.content).toContain('SUMMARY:');
    });

    test('should properly escape special characters', () => {
      const appointmentWithSpecialChars = {
        ...mockAppointment,
        title: 'Meeting with; special, characters: and "quotes"',
        description: 'Description with\nnewlines and\ttabs'
      };

      const invite = CalendarInviteService.generateCalendarInvite(
        appointmentWithSpecialChars,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      expect(invite.content).toContain('SUMMARY:Meeting with\\; special\\, characters: and "quotes"');
      expect(invite.content).toContain('DESCRIPTION:Description with\\nnewlines and\\ttabs');
    });

    test('should handle line folding for long lines', () => {
      const appointmentWithLongDescription = {
        ...mockAppointment,
        description: 'This is a very long description that should exceed the 75 character limit per line as specified in RFC 5545 and therefore should be folded across multiple lines with proper indentation.'
      };

      const invite = CalendarInviteService.generateCalendarInvite(
        appointmentWithLongDescription,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      // Check that long lines are properly folded
      const lines = invite.content.split('\n');
      const longLines = lines.filter(line => line.length > 75);
      expect(longLines.length).toBe(0); // No line should exceed 75 characters
    });
  });

  describe('File Operations', () => {
    test('should generate appropriate filename', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      expect(invite.filename).toBe('appointment_2024-01-15.ics');
    });

    test('should handle special characters in appointment title for filename', () => {
      const appointmentWithSpecialTitle = {
        ...mockAppointment,
        title: 'Meeting/with\\special:characters?'
      };

      const invite = CalendarInviteService.generateCalendarInvite(
        appointmentWithSpecialTitle,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      // Filename should not contain special characters that are invalid in filenames
      expect(invite.filename).not.toContain('/');
      expect(invite.filename).not.toContain('\\');
      expect(invite.filename).not.toContain(':');
      expect(invite.filename).not.toContain('?');
    });

    test('should set correct MIME type', () => {
      const invite = CalendarInviteService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockAttendees
      );

      expect(invite.mimeType).toBe('text/calendar');
    });
  });
});