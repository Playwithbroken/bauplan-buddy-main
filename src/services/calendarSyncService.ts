/**
 * Calendar Sync Service
 * External calendar synchronization (Google, Outlook, iCal)
 */

export type CalendarProvider = 'google' | 'outlook' | 'apple' | 'caldav';

export interface CalendarEvent {
  id: string;
  externalId?: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    until?: Date;
    count?: number;
    byDay?: string[]; // ['MO', 'TU', 'WE', 'TH', 'FR']
  };
  reminders?: Array<{
    method: 'popup' | 'email';
    minutes: number;
  }>;
  attendees?: Array<{
    email: string;
    name?: string;
    status?: 'accepted' | 'declined' | 'tentative' | 'pending';
  }>;
  color?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  projectId?: string;
  type?: 'appointment' | 'deadline' | 'milestone' | 'meeting' | 'other';
  synced?: boolean;
  lastSyncAt?: Date;
}

export interface CalendarConnection {
  id: string;
  provider: CalendarProvider;
  name: string;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  calendarId?: string;
  syncEnabled: boolean;
  lastSyncAt?: Date;
  syncDirection: 'import' | 'export' | 'bidirectional';
  autoSync: boolean;
  syncIntervalMinutes?: number;
}

export interface SyncResult {
  success: boolean;
  imported: number;
  exported: number;
  updated: number;
  deleted: number;
  errors: Array<{ eventId: string; error: string }>;
  syncedAt: Date;
}

export interface CalendarSyncSettings {
  defaultReminders: Array<{ method: 'popup' | 'email'; minutes: number }>;
  syncProjectEvents: boolean;
  syncDeadlines: boolean;
  syncMeetings: boolean;
  conflictResolution: 'local' | 'remote' | 'newest';
  colorMapping: Record<string, string>; // projectId -> color
}

// Default settings
const DEFAULT_SETTINGS: CalendarSyncSettings = {
  defaultReminders: [
    { method: 'popup', minutes: 30 },
    { method: 'email', minutes: 1440 }, // 1 day
  ],
  syncProjectEvents: true,
  syncDeadlines: true,
  syncMeetings: true,
  conflictResolution: 'newest',
  colorMapping: {},
};

// iCalendar format helpers
export const formatICalDate = (date: Date, allDay?: boolean): string => {
  if (allDay) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

const generateUID = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@bauplan-buddy`;
};

class CalendarSyncService {
  private connections: Map<string, CalendarConnection> = new Map();
  private events: Map<string, CalendarEvent> = new Map();
  private settings: CalendarSyncSettings = DEFAULT_SETTINGS;
  private syncTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Initialize service
   */
  initialize(): void {
    this.loadConnections();
    this.loadSettings();
    this.startAutoSync();
  }

  /**
   * Add calendar connection
   */
  async addConnection(connection: Omit<CalendarConnection, 'id'>): Promise<CalendarConnection> {
    const newConnection: CalendarConnection = {
      ...connection,
      id: `conn-${Date.now()}`,
    };

    this.connections.set(newConnection.id, newConnection);
    this.saveConnections();

    if (newConnection.autoSync) {
      this.scheduleAutoSync(newConnection);
    }

    return newConnection;
  }

  /**
   * Remove calendar connection
   */
  removeConnection(id: string): void {
    const timer = this.syncTimers.get(id);
    if (timer) {
      clearInterval(timer);
      this.syncTimers.delete(id);
    }

    this.connections.delete(id);
    this.saveConnections();
  }

  /**
   * Get all connections
   */
  getConnections(): CalendarConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Update connection settings
   */
  updateConnection(id: string, updates: Partial<CalendarConnection>): void {
    const connection = this.connections.get(id);
    if (!connection) return;

    const updated = { ...connection, ...updates };
    this.connections.set(id, updated);
    this.saveConnections();

    // Update auto-sync timer
    if (updates.autoSync !== undefined || updates.syncIntervalMinutes !== undefined) {
      const timer = this.syncTimers.get(id);
      if (timer) clearInterval(timer);
      
      if (updated.autoSync) {
        this.scheduleAutoSync(updated);
      }
    }
  }

  /**
   * Sync calendar
   */
  async syncCalendar(connectionId: string): Promise<SyncResult> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return {
        success: false,
        imported: 0,
        exported: 0,
        updated: 0,
        deleted: 0,
        errors: [{ eventId: '', error: 'Connection not found' }],
        syncedAt: new Date(),
      };
    }

    // Simulate sync - in production, this would call the provider's API
    const result: SyncResult = {
      success: true,
      imported: 0,
      exported: 0,
      updated: 0,
      deleted: 0,
      errors: [],
      syncedAt: new Date(),
    };

    try {
      switch (connection.syncDirection) {
        case 'import':
          result.imported = await this.importEvents(connection);
          break;
        case 'export':
          result.exported = await this.exportEvents(connection);
          break;
        case 'bidirectional':
          result.imported = await this.importEvents(connection);
          result.exported = await this.exportEvents(connection);
          break;
      }

      // Update last sync time
      connection.lastSyncAt = new Date();
      this.saveConnections();
    } catch (error) {
      result.success = false;
      result.errors.push({
        eventId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return result;
  }

  /**
   * Export events to iCalendar format
   */
  exportToICS(events: CalendarEvent[]): string {
    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Bauplan Buddy//Calendar Export//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Bauplan Buddy Termine`;

    for (const event of events) {
      ics += `
BEGIN:VEVENT
UID:${event.externalId || generateUID()}
DTSTART:${formatICalDate(event.start, event.allDay)}
DTEND:${formatICalDate(event.end, event.allDay)}
SUMMARY:${this.escapeICS(event.title)}
${event.description ? `DESCRIPTION:${this.escapeICS(event.description)}` : ''}
${event.location ? `LOCATION:${this.escapeICS(event.location)}` : ''}
STATUS:${(event.status || 'CONFIRMED').toUpperCase()}
CREATED:${formatICalDate(new Date())}
LAST-MODIFIED:${formatICalDate(event.lastSyncAt || new Date())}`;

      // Add attendees
      if (event.attendees) {
        for (const attendee of event.attendees) {
          ics += `
ATTENDEE;CN=${attendee.name || attendee.email};PARTSTAT=${(attendee.status || 'NEEDS-ACTION').toUpperCase().replace('PENDING', 'NEEDS-ACTION')}:mailto:${attendee.email}`;
        }
      }

      // Add reminders
      if (event.reminders) {
        for (const reminder of event.reminders) {
          ics += `
BEGIN:VALARM
ACTION:${reminder.method === 'email' ? 'EMAIL' : 'DISPLAY'}
TRIGGER:-PT${reminder.minutes}M
DESCRIPTION:Reminder
END:VALARM`;
        }
      }

      ics += `
END:VEVENT`;
    }

    ics += `
END:VCALENDAR`;

    return ics;
  }

  /**
   * Parse iCalendar data
   */
  parseICS(icsData: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const eventBlocks = icsData.split('BEGIN:VEVENT');

    for (let i = 1; i < eventBlocks.length; i++) {
      const block = eventBlocks[i].split('END:VEVENT')[0];
      const event = this.parseEventBlock(block);
      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  /**
   * Get sync settings
   */
  getSettings(): CalendarSyncSettings {
    return { ...this.settings };
  }

  /**
   * Update sync settings
   */
  updateSettings(updates: Partial<CalendarSyncSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
  }

  /**
   * Create calendar subscription URL
   */
  getSubscriptionUrl(connectionId: string): string {
    // In production, this would return an authenticated URL
    return `webcal://app.bauplan-buddy.de/calendar/${connectionId}/subscribe.ics`;
  }

  /**
   * Download events as ICS file
   */
  downloadICS(events: CalendarEvent[], filename = 'calendar-export'): void {
    const ics = this.exportToICS(events);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Private methods

  private escapeICS(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  private parseEventBlock(block: string): CalendarEvent | null {
    const getValue = (key: string): string | undefined => {
      const regex = new RegExp(`^${key}[;:](.*)$`, 'm');
      const match = block.match(regex);
      return match ? match[1].trim() : undefined;
    };

    const parseDate = (value: string | undefined): Date | undefined => {
      if (!value) return undefined;
      // Handle both DATE and DATE-TIME formats
      const dateStr = value.replace('VALUE=DATE:', '').replace('VALUE=DATE-TIME:', '');
      if (dateStr.length === 8) {
        // Date only: YYYYMMDD
        return new Date(
          parseInt(dateStr.substr(0, 4)),
          parseInt(dateStr.substr(4, 2)) - 1,
          parseInt(dateStr.substr(6, 2))
        );
      }
      // Date-time: YYYYMMDDTHHMMSSZ
      return new Date(dateStr.replace(
        /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/,
        '$1-$2-$3T$4:$5:$6Z'
      ));
    };

    const uid = getValue('UID');
    const summary = getValue('SUMMARY');
    const dtstart = getValue('DTSTART');
    const dtend = getValue('DTEND');

    if (!summary || !dtstart) return null;

    const start = parseDate(dtstart);
    const end = parseDate(dtend) || start;

    if (!start || !end) return null;

    return {
      id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      externalId: uid,
      title: summary.replace(/\\n/g, '\n').replace(/\\,/g, ','),
      description: getValue('DESCRIPTION')?.replace(/\\n/g, '\n').replace(/\\,/g, ','),
      location: getValue('LOCATION')?.replace(/\\n/g, '\n').replace(/\\,/g, ','),
      start,
      end,
      allDay: dtstart?.includes('VALUE=DATE'),
      synced: true,
      lastSyncAt: new Date(),
    };
  }

  private async importEvents(connection: CalendarConnection): Promise<number> {
    // Simulate import - in production, fetch from provider API
    console.log(`Importing events from ${connection.provider}...`);
    return Math.floor(Math.random() * 10);
  }

  private async exportEvents(connection: CalendarConnection): Promise<number> {
    // Simulate export - in production, push to provider API
    console.log(`Exporting events to ${connection.provider}...`);
    return Math.floor(Math.random() * 5);
  }

  private scheduleAutoSync(connection: CalendarConnection): void {
    const interval = (connection.syncIntervalMinutes || 30) * 60 * 1000;
    
    const timer = setInterval(() => {
      this.syncCalendar(connection.id);
    }, interval);

    this.syncTimers.set(connection.id, timer);
  }

  private startAutoSync(): void {
    this.connections.forEach((connection) => {
      if (connection.autoSync) {
        this.scheduleAutoSync(connection);
      }
    });
  }

  private saveConnections(): void {
    try {
      const data = Array.from(this.connections.values()).map((c) => ({
        ...c,
        accessToken: undefined, // Don't store tokens in localStorage
        refreshToken: undefined,
      }));
      localStorage.setItem('calendar_connections', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save calendar connections:', e);
    }
  }

  private loadConnections(): void {
    try {
      const data = localStorage.getItem('calendar_connections');
      if (data) {
        const connections: CalendarConnection[] = JSON.parse(data);
        connections.forEach((c) => this.connections.set(c.id, c));
      }
    } catch (e) {
      console.error('Failed to load calendar connections:', e);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('calendar_sync_settings', JSON.stringify(this.settings));
    } catch (e) {
      console.error('Failed to save calendar sync settings:', e);
    }
  }

  private loadSettings(): void {
    try {
      const data = localStorage.getItem('calendar_sync_settings');
      if (data) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.error('Failed to load calendar sync settings:', e);
    }
  }
}

// Export singleton
export const calendarSyncService = new CalendarSyncService();
export default calendarSyncService;
