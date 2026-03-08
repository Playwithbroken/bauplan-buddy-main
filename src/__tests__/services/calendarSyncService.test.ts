import calendarSyncService, { CalendarEvent, CalendarConnection, formatICalDate } from '@/services/calendarSyncService';

describe('CalendarSyncService', () => {
    let mockEvent: CalendarEvent;
    let mockConnection: CalendarConnection;

    beforeEach(() => {
        mockEvent = {
            id: 'event-1',
            title: 'Meeting with Architect',
            description: 'Discuss floor plan changes',
            location: 'Munich Office',
            start: new Date('2024-04-10T10:00:00Z'),
            end: new Date('2024-04-10T11:00:00Z'),
            attendees: [
                { email: 'architect@example.com', name: 'Weber' }
            ],
            reminders: [
                { method: 'popup', minutes: 15 }
            ]
        };

        mockConnection = {
            id: 'conn-1',
            provider: 'google',
            name: 'Work Calendar',
            syncEnabled: true,
            syncDirection: 'bidirectional',
            autoSync: true
        };

        // Mock localStorage
        const store: Record<string, string> = {};
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: (key: string) => store[key] || null,
                setItem: (key: string, value: string) => { store[key] = value },
                removeItem: (key: string) => { delete store[key] },
                clear: () => { Object.keys(store).forEach(k => delete store[k]) }
            },
            writable: true
        });
    });

    test('should format iCal dates correctly', () => {
        const formatted = formatICalDate(new Date('2024-04-10T10:00:00Z'));
        const expected = new Date('2024-04-10T10:00:00Z').toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        expect(formatted).toBe(expected);
    });

    test('should export events to ICS string', () => {
        const ics = calendarSyncService.exportToICS([mockEvent]);
        expect(ics).toContain('BEGIN:VCALENDAR');
        expect(ics).toContain('SUMMARY:Meeting with Architect');
        expect(ics).toContain('DESCRIPTION:Discuss floor plan changes');
        expect(ics).toContain('ATTENDEE;CN=Weber;PARTSTAT=NEEDS-ACTION:mailto:architect@example.com');
        expect(ics).toContain('ACTION:DISPLAY');
        expect(ics).toContain('TRIGGER:-PT15M');
        expect(ics).toContain('END:VCALENDAR');
    });

    test('should parse ICS string back to events', () => {
        const ics = calendarSyncService.exportToICS([mockEvent]);
        const parsedEvents = calendarSyncService.parseICS(ics);
        
        expect(parsedEvents.length).toBe(1);
        expect(parsedEvents[0].title).toBe(mockEvent.title);
        expect(parsedEvents[0].description).toBe(mockEvent.description);
        expect(parsedEvents[0].location).toBe(mockEvent.location);
        // Dates might lose some precision in parsing depending on format but should be same day/time
        expect(parsedEvents[0].start.toISOString()).toBe(mockEvent.start.toISOString());
    });

    test('should manage connections correctly', async () => {
        const connection = await calendarSyncService.addConnection({
            provider: 'outlook',
            name: 'Outlook Calendar',
            syncEnabled: true,
            syncDirection: 'import',
            autoSync: false
        });

        expect(connection.id).toBeDefined();
        // Check if connection is in the connections list
        const connections = calendarSyncService.getConnections();
        expect(connections.find(c => c.id === connection.id)).toBeDefined();

        calendarSyncService.removeConnection(connection.id);
        const connectionsAfterRemoval = calendarSyncService.getConnections();
        expect(connectionsAfterRemoval.find(c => c.id === connection.id)).toBeUndefined();
    });

    test('should update settings', () => {
        calendarSyncService.updateSettings({ syncDeadlines: false });
        expect(calendarSyncService.getSettings().syncDeadlines).toBe(false);
    });
});
