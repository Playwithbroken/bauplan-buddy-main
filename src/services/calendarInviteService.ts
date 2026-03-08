import { StoredAppointment } from './appointmentService';
import { CalendarInvite, EmailRecipient } from '@/types/email';
import { RecurrencePattern } from './recurrenceService';
import { format, addMinutes } from 'date-fns';

export interface ICalendarEvent {
  uid: string;
  dtstart: string;
  dtend: string;
  summary: string;
  description?: string;
  location?: string;
  organizer: {
    name: string;
    email: string;
  };
  attendees: Array<{
    name?: string;
    email: string;
    role: 'REQ-PARTICIPANT' | 'OPT-PARTICIPANT' | 'NON-PARTICIPANT';
    status: 'NEEDS-ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
    rsvp: boolean;
  }>;
  rrule?: string;
  categories?: string[];
  priority: number;
  status: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
  transparency: 'OPAQUE' | 'TRANSPARENT';
  class: 'PUBLIC' | 'PRIVATE' | 'CONFIDENTIAL';
  method: 'REQUEST' | 'REPLY' | 'CANCEL';
  sequence: number;
  created: string;
  lastModified: string;
  url?: string;
  alarms?: Array<{
    action: 'DISPLAY' | 'EMAIL' | 'AUDIO';
    trigger: string;
    description?: string;
    summary?: string;
    attendees?: string[];
  }>;
}

/**
 * Enhanced Calendar Invite Service
 * Generates RFC 5545 compliant iCalendar (.ics) files with full feature support
 */
export class CalendarInviteService {
  private static readonly PRODID = '-//Bauplan Buddy//Appointment Calendar//DE';
  private static readonly VERSION = '2.0';
  private static readonly CALSCALE = 'GREGORIAN';

  /**
   * Generate a complete calendar invite for an appointment
   */
  static generateCalendarInvite(
    appointment: StoredAppointment,
    method: ICalendarEvent['method'] = 'REQUEST',
    organizer: { name: string; email: string } = { name: 'Bauplan Buddy', email: 'noreply@bauplan-buddy.com' },
    attendees: EmailRecipient[] = [],
    options: {
      includeAlarms?: boolean;
      includeRecurrence?: boolean;
      includeTimezone?: boolean;
      timezone?: string;
      url?: string;
    } = {}
  ): CalendarInvite {
    const {
      includeAlarms = true,
      includeRecurrence = true,
      includeTimezone = true,
      timezone = 'Europe/Berlin',
      url
    } = options;

    // Create base event
    const event: ICalendarEvent = {
      uid: this.generateUID(appointment.id),
      dtstart: this.formatDateTime(appointment.date, appointment.startTime, timezone),
      dtend: this.formatDateTime(appointment.date, appointment.endTime, timezone),
      summary: appointment.title,
      description: this.escapeText(appointment.description || ''),
      location: this.escapeText(appointment.location || ''),
      organizer,
      attendees: this.mapAttendeesToICalFormat(attendees),
      categories: [this.getAppointmentCategory(appointment.type)],
      priority: this.mapPriorityToICalPriority(appointment.priority || 'medium'),
      status: method === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED',
      transparency: 'OPAQUE',
      class: 'PUBLIC',
      method,
      sequence: 0,
      created: this.formatDateTime(new Date().toISOString()),
      lastModified: this.formatDateTime(new Date().toISOString()),
      url
    };

    // Add recurrence rule if applicable
    if (includeRecurrence && appointment.isRecurring && appointment.recurrencePattern) {
      event.rrule = this.generateRRule(appointment.recurrencePattern);
    }

    // Add alarms for reminders
    if (includeAlarms) {
      event.alarms = this.generateAlarms(appointment);
    }

    // Generate the full iCalendar content
    const content = this.generateICalContent(event, {
      includeTimezone,
      timezone
    });

    return {
      filename: this.generateFilename(appointment, method),
      content,
      method,
      sequence: event.sequence
    };
  }

  /**
   * Generate calendar invite for recurring appointment series
   */
  static generateSeriesCalendarInvite(
    appointment: StoredAppointment,
    method: ICalendarEvent['method'] = 'REQUEST',
    organizer: { name: string; email: string },
    attendees: EmailRecipient[] = [],
    options: {
      includeExDates?: Date[];
      includeRDates?: Date[];
    } = {}
  ): CalendarInvite {
    const invite = this.generateCalendarInvite(appointment, method, organizer, attendees, {
      includeRecurrence: true
    });

    // Add exception dates if provided
    if (options.includeExDates && options.includeExDates.length > 0) {
      const exDates = options.includeExDates
        .map(date => this.formatDateTime(date.toISOString()))
        .join(',');
      
      // Insert EXDATE before END:VEVENT
      invite.content = invite.content.replace(
        'END:VEVENT',
        `EXDATE:${exDates}\nEND:VEVENT`
      );
    }

    // Add additional dates if provided
    if (options.includeRDates && options.includeRDates.length > 0) {
      const rDates = options.includeRDates
        .map(date => this.formatDateTime(date.toISOString()))
        .join(',');
      
      invite.content = invite.content.replace(
        'END:VEVENT',
        `RDATE:${rDates}\nEND:VEVENT`
      );
    }

    return invite;
  }

  /**
   * Generate calendar invite for appointment cancellation
   */
  static generateCancellationInvite(
    appointment: StoredAppointment,
    organizer: { name: string; email: string },
    attendees: EmailRecipient[] = [],
    reason?: string
  ): CalendarInvite {
    const invite = this.generateCalendarInvite(appointment, 'CANCEL', organizer, attendees, {
      includeAlarms: false
    });

    // Add cancellation reason to description
    if (reason) {
      const reasonText = this.escapeText(`ABGESAGT: ${reason}`);
      invite.content = invite.content.replace(
        /DESCRIPTION:(.*)/, 
        `DESCRIPTION:${reasonText}\\n\\n$1`
      );
    }

    return invite;
  }

  /**
   * Generate multiple calendar invites for bulk operations
   */
  static generateBulkCalendarInvites(
    appointments: StoredAppointment[],
    method: ICalendarEvent['method'] = 'REQUEST',
    organizer: { name: string; email: string },
    attendeesMap: Map<string, EmailRecipient[]> = new Map()
  ): { filename: string; content: string } {
    const events: string[] = [];

    appointments.forEach(appointment => {
      const attendees = attendeesMap.get(appointment.id) || [];
      const invite = this.generateCalendarInvite(appointment, method, organizer, attendees);
      
      // Extract just the VEVENT part
      const eventMatch = invite.content.match(/BEGIN:VEVENT(.*?)END:VEVENT/s);
      if (eventMatch) {
        events.push(`BEGIN:VEVENT${eventMatch[1]}END:VEVENT`);
      }
    });

    const content = [
      'BEGIN:VCALENDAR',
      `VERSION:${this.VERSION}`,
      `PRODID:${this.PRODID}`,
      `CALSCALE:${this.CALSCALE}`,
      `METHOD:${method}`,
      ...events,
      'END:VCALENDAR'
    ].join('\r\n');

    return {
      filename: `bauplan-termine-${format(new Date(), 'yyyy-MM-dd')}.ics`,
      content
    };
  }

  /**
   * Parse and validate existing calendar invite
   */
  static parseCalendarInvite(content: string): {
    isValid: boolean;
    events: Partial<ICalendarEvent>[];
    errors: string[];
  } {
    const errors: string[] = [];
    const events: Partial<ICalendarEvent>[] = [];

    try {
      // Basic validation
      if (!content.includes('BEGIN:VCALENDAR')) {
        errors.push('Missing VCALENDAR start');
      }
      if (!content.includes('END:VCALENDAR')) {
        errors.push('Missing VCALENDAR end');
      }

      // Parse events
      const eventMatches = content.match(/BEGIN:VEVENT(.*?)END:VEVENT/gs);
      if (eventMatches) {
        eventMatches.forEach((eventContent, index) => {
          try {
            const event = this.parseVEvent(eventContent);
            events.push(event);
          } catch (error) {
            errors.push(`Error parsing event ${index + 1}: ${error}`);
          }
        });
      }

      return {
        isValid: errors.length === 0,
        events,
        errors
      };
    } catch (error) {
      errors.push(`Parse error: ${error}`);
      return { isValid: false, events: [], errors };
    }
  }

  /**
   * Generate unique identifier for calendar events
   */
  private static generateUID(appointmentId: string): string {
    const timestamp = Date.now();
    return `${appointmentId}-${timestamp}@bauplan-buddy.com`;
  }

  /**
   * Format date and time for iCalendar format
   */
  private static formatDateTime(
    date: string | Date, 
    time?: string, 
    timezone: string = 'Europe/Berlin'
  ): string {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      if (time) {
        dateObj = new Date(`${date}T${time}`);
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }

    // Format as UTC for simplicity (YYYYMMDDTHHMMSSZ)
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hour = String(dateObj.getHours()).padStart(2, '0');
    const minute = String(dateObj.getMinutes()).padStart(2, '0');
    const second = String(dateObj.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hour}${minute}${second}Z`;
  }

  /**
   * Escape text for iCalendar format
   */
  private static escapeText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  /**
   * Map attendees to iCalendar format
   */
  private static mapAttendeesToICalFormat(attendees: EmailRecipient[]): ICalendarEvent['attendees'] {
    return attendees.map(attendee => ({
      name: attendee.name,
      email: attendee.email,
      role: attendee.role === 'optional' ? 'OPT-PARTICIPANT' : 'REQ-PARTICIPANT',
      status: 'NEEDS-ACTION',
      rsvp: true
    }));
  }

  /**
   * Get appointment category for iCalendar
   */
  private static getAppointmentCategory(type: string): string {
    const categories: Record<string, string> = {
      'site-visit': 'BUSINESS',
      'meeting': 'MEETING',
      'delivery': 'BUSINESS',
      'milestone': 'BUSINESS',
      'inspection': 'BUSINESS',
      'internal': 'PERSONAL'
    };
    return categories[type] || 'BUSINESS';
  }

  /**
   * Map priority to iCalendar priority (1-9)
   */
  private static mapPriorityToICalPriority(priority: string): number {
    const priorities: Record<string, number> = {
      'low': 9,
      'medium': 5,
      'high': 3,
      'critical': 1
    };
    return priorities[priority] || 5;
  }

  /**
   * Generate RRULE string from recurrence pattern
   */
  private static generateRRule(pattern: RecurrencePattern): string {
    const parts: string[] = [`FREQ=${pattern.type.toUpperCase()}`];

    if (pattern.interval && pattern.interval > 1) {
      parts.push(`INTERVAL=${pattern.interval}`);
    }

    if (pattern.endDate) {
      const until = this.formatDateTime(pattern.endDate);
      parts.push(`UNTIL=${until}`);
    } else if (pattern.occurrences) {
      parts.push(`COUNT=${pattern.occurrences}`);
    }

    if (pattern.weekDay !== undefined && pattern.type === 'weekly') {
      const dayMap: Record<string, string> = {
        'monday': 'MO', 'tuesday': 'TU', 'wednesday': 'WE', 'thursday': 'TH', 
        'friday': 'FR', 'saturday': 'SA', 'sunday': 'SU'
      };
      parts.push(`BYDAY=${dayMap[pattern.weekDay]}`);
    }

    if (pattern.dayOfMonth && pattern.type === 'monthly') {
      parts.push(`BYMONTHDAY=${pattern.dayOfMonth}`);
    }

    return parts.join(';');
  }

  /**
   * Generate alarm components for reminders
   */
  private static generateAlarms(appointment: StoredAppointment): ICalendarEvent['alarms'] {
    const alarms: ICalendarEvent['alarms'] = [];
    
    // Default reminder based on reminderTime
    if (appointment.reminderTime) {
      const minutes = parseInt(appointment.reminderTime);
      alarms.push({
        action: 'DISPLAY',
        trigger: `-PT${minutes}M`,
        description: `Erinnerung: ${appointment.title}`,
        summary: appointment.title
      });
    }

    // Add email reminder for important appointments
    if (appointment.priority === 'high' || appointment.priority === 'critical') {
      alarms.push({
        action: 'EMAIL',
        trigger: '-PT1H',
        description: `Wichtiger Termin in 1 Stunde: ${appointment.title}`,
        summary: `Erinnerung: ${appointment.title}`,
        attendees: ['organizer@bauplan-buddy.com']
      });
    }

    return alarms;
  }

  /**
   * Generate full iCalendar content
   */
  private static generateICalContent(
    event: ICalendarEvent,
    options: { includeTimezone?: boolean; timezone?: string } = {}
  ): string {
    const lines: string[] = [];

    // Calendar header
    lines.push('BEGIN:VCALENDAR');
    lines.push(`VERSION:${this.VERSION}`);
    lines.push(`PRODID:${this.PRODID}`);
    lines.push(`CALSCALE:${this.CALSCALE}`);
    lines.push(`METHOD:${event.method}`);

    // Timezone information
    if (options.includeTimezone && options.timezone) {
      lines.push(...this.generateTimezoneComponent(options.timezone));
    }

    // Event component
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.uid}`);
    lines.push(`DTSTART:${event.dtstart}`);
    lines.push(`DTEND:${event.dtend}`);
    lines.push(`SUMMARY:${event.summary}`);
    
    if (event.description) {
      lines.push(`DESCRIPTION:${event.description}`);
    }
    
    if (event.location) {
      lines.push(`LOCATION:${event.location}`);
    }

    lines.push(`ORGANIZER;CN="${event.organizer.name}":MAILTO:${event.organizer.email}`);

    // Attendees
    event.attendees.forEach(attendee => {
      const cn = attendee.name ? `;CN="${attendee.name}"` : '';
      const role = `;ROLE=${attendee.role}`;
      const rsvp = attendee.rsvp ? ';RSVP=TRUE' : ';RSVP=FALSE';
      const partstat = `;PARTSTAT=${attendee.status}`;
      lines.push(`ATTENDEE${cn}${role}${rsvp}${partstat}:MAILTO:${attendee.email}`);
    });

    if (event.rrule) {
      lines.push(`RRULE:${event.rrule}`);
    }

    if (event.categories && event.categories.length > 0) {
      lines.push(`CATEGORIES:${event.categories.join(',')}`);
    }

    lines.push(`PRIORITY:${event.priority}`);
    lines.push(`STATUS:${event.status}`);
    lines.push(`TRANSP:${event.transparency}`);
    lines.push(`CLASS:${event.class}`);
    lines.push(`SEQUENCE:${event.sequence}`);
    lines.push(`CREATED:${event.created}`);
    lines.push(`LAST-MODIFIED:${event.lastModified}`);

    if (event.url) {
      lines.push(`URL:${event.url}`);
    }

    // Alarms
    if (event.alarms && event.alarms.length > 0) {
      event.alarms.forEach(alarm => {
        lines.push('BEGIN:VALARM');
        lines.push(`ACTION:${alarm.action}`);
        lines.push(`TRIGGER:${alarm.trigger}`);
        
        if (alarm.description) {
          lines.push(`DESCRIPTION:${alarm.description}`);
        }
        
        if (alarm.summary) {
          lines.push(`SUMMARY:${alarm.summary}`);
        }
        
        if (alarm.attendees && alarm.attendees.length > 0) {
          alarm.attendees.forEach(attendeeEmail => {
            lines.push(`ATTENDEE:MAILTO:${attendeeEmail}`);
          });
        }
        
        lines.push('END:VALARM');
      });
    }

    lines.push('END:VEVENT');
    lines.push('END:VCALENDAR');

    return lines.join('\r\n');
  }

  /**
   * Generate timezone component for iCalendar
   */
  private static generateTimezoneComponent(timezone: string): string[] {
    // Simplified timezone component for Europe/Berlin
    if (timezone === 'Europe/Berlin') {
      return [
        'BEGIN:VTIMEZONE',
        'TZID:Europe/Berlin',
        'BEGIN:DAYLIGHT',
        'TZOFFSETFROM:+0100',
        'TZOFFSETTO:+0200',
        'TZNAME:CEST',
        'DTSTART:20070325T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
        'END:DAYLIGHT',
        'BEGIN:STANDARD',
        'TZOFFSETFROM:+0200',
        'TZOFFSETTO:+0100',
        'TZNAME:CET',
        'DTSTART:20071028T030000',
        'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
        'END:STANDARD',
        'END:VTIMEZONE'
      ];
    }
    return [];
  }

  /**
   * Generate appropriate filename for calendar invite
   */
  private static generateFilename(appointment: StoredAppointment, method: string): string {
    const safeTitle = appointment.title.replace(/[^a-zA-Z0-9\-_]/g, '-');
    const date = appointment.date.replace(/-/g, '');
    const methodSuffix = method === 'CANCEL' ? '-cancelled' : '';
    
    return `${safeTitle}-${date}${methodSuffix}.ics`;
  }

  /**
   * Parse individual VEVENT component
   */
  private static parseVEvent(eventContent: string): Partial<ICalendarEvent> {
    const event: Partial<ICalendarEvent> = {};
    const lines = eventContent.split('\n');

    lines.forEach(line => {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      switch (key.split(';')[0]) {
        case 'UID':
          event.uid = value;
          break;
        case 'SUMMARY':
          event.summary = value;
          break;
        case 'DESCRIPTION':
          event.description = value;
          break;
        case 'LOCATION':
          event.location = value;
          break;
        case 'DTSTART':
          event.dtstart = value;
          break;
        case 'DTEND':
          event.dtend = value;
          break;
        case 'RRULE':
          event.rrule = value;
          break;
        // Add more parsing as needed
      }
    });

    return event;
  }
}

export default CalendarInviteService;