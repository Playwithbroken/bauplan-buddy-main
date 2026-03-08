import { CalendarEvent, CreateEventData, UpdateEventData, TeamMember } from '@/types/calendar';
import { offlineSync } from './offlineSyncService';
import { ErrorHandlingService } from './errorHandlingService';

// Mock database - in a real app this would be a real database
let mockEvents: CalendarEvent[] = [
  {
    id: "EVT-001",
    title: "Baustellenbesichtigung Müller",
    project: "Wohnhaus München",
    customer: "Familie Müller",
    type: "site-visit",
    date: new Date(2024, 2, 15, 10, 0),
    endDate: new Date(2024, 2, 15, 12, 0),
    location: "Musterstraße 12, München",
    attendees: ["Hans Müller", "Bauleiter Schmidt"],
    description: "Gemeinsame Begehung des Rohbaus mit dem Kunden",
    status: "confirmed",
    createdAt: new Date(2024, 1, 1),
    updatedAt: new Date(2024, 1, 1),
    createdBy: "user-1"
  },
  {
    id: "EVT-002",
    title: "Materiallieferung Beton",
    project: "Bürogebäude Berlin",
    customer: "TechCorp GmbH",
    type: "delivery",
    date: new Date(2024, 2, 18, 8, 0),
    endDate: new Date(2024, 2, 18, 12, 0),
    location: "Alexanderplatz 5, Berlin",
    attendees: ["Bauleiter Müller"],
    description: "Lieferung und Verarbeitung von 80m³ Beton",
    status: "confirmed",
    createdAt: new Date(2024, 1, 5),
    updatedAt: new Date(2024, 1, 5),
    createdBy: "user-1"
  },
  {
    id: "EVT-003",
    title: "Angebotsbesprechung",
    project: "Dachsanierung Hamburg",
    customer: "Hausverwaltung Nord",
    type: "meeting",
    date: new Date(2024, 2, 20, 14, 0),
    endDate: new Date(2024, 2, 20, 15, 30),
    location: "Büro Hamburg",
    attendees: ["Frau Weber", "Verkaufsleiter"],
    description: "Besprechung des Angebots für die Dachsanierung",
    status: "pending",
    createdAt: new Date(2024, 1, 10),
    updatedAt: new Date(2024, 1, 10),
    createdBy: "user-1"
  }
];

const mockTeamMembers: TeamMember[] = [
  { id: "TM-001", name: "Bauleiter Schmidt", role: "Bauleiter", email: "schmidt@bauplan-buddy.de", color: "#3b82f6", isActive: true },
  { id: "TM-002", name: "Bauleiter Müller", role: "Bauleiter", email: "mueller@bauplan-buddy.de", color: "#10b981", isActive: true },
  { id: "TM-003", name: "Architekt Weber", role: "Architekt", email: "weber@bauplan-buddy.de", color: "#f59e0b", isActive: true },
  { id: "TM-004", name: "Verkaufsleiter", role: "Vertrieb", email: "vertrieb@bauplan-buddy.de", color: "#ef4444", isActive: true }
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export class MockBackendService {
  static async getEvents(): Promise<CalendarEvent[]> {
    await delay(500); // Simulate network delay
    return [...mockEvents];
  }

  static async getEvent(id: string): Promise<CalendarEvent | null> {
    await delay(200);
    return mockEvents.find(event => event.id === id) || null;
  }

  static async createEvent(eventData: CreateEventData): Promise<CalendarEvent> {
    const newEvent: CalendarEvent = {
      id: `EVT-${Date.now()}`,
      ...eventData,
      status: eventData.status || 'pending',
      project: eventData.projectId ? `Project ${eventData.projectId}` : '',
      customer: eventData.customerId ? `Customer ${eventData.customerId}` : '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user'
    };

    // Check if online
    if (offlineSync.isOnline()) {
      try {
        await delay(300); // Simulate network delay
        mockEvents.push(newEvent);
        
        ErrorHandlingService.info(
          `Event created: ${newEvent.title}`,
          'calendar_event',
          { eventId: newEvent.id }
        );
        
        return newEvent;
      } catch (error) {
        // If online but failed, queue for offline sync
        offlineSync.queueAction(
          'appointment',
          'create',
          newEvent
        );
        
        throw error;
      }
    } else {
      // Offline - queue action and store locally
      offlineSync.queueAction(
        'appointment',
        'create',
        newEvent
      );
      
      // Store locally for immediate UI feedback
      mockEvents.push(newEvent);
      offlineSync.cacheData(`event-${newEvent.id}`, newEvent);
      
      ErrorHandlingService.info(
        `Event queued for offline sync: ${newEvent.title}`,
        'calendar_event_offline',
        { eventId: newEvent.id }
      );
      
      return newEvent;
    }
  }

  static async updateEvent(eventData: UpdateEventData): Promise<CalendarEvent> {
    const eventIndex = mockEvents.findIndex(event => event.id === eventData.id);
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }

    const updatedEvent = {
      ...mockEvents[eventIndex],
      ...eventData,
      updatedAt: new Date()
    };

    // Check if online
    if (offlineSync.isOnline()) {
      try {
        await delay(300); // Simulate network delay
        mockEvents[eventIndex] = updatedEvent;
        
        ErrorHandlingService.info(
          `Event updated: ${updatedEvent.title}`,
          'calendar_event',
          { eventId: updatedEvent.id }
        );
        
        return updatedEvent;
      } catch (error) {
        // If online but failed, queue for offline sync
        offlineSync.queueAction(
          'appointment',
          'update',
          updatedEvent,
          eventData.id
        );
        
        throw error;
      }
    } else {
      // Offline - queue action and store locally
      offlineSync.queueAction(
        'appointment',
        'update',
        updatedEvent,
        eventData.id
      );
      
      // Update locally for immediate UI feedback
      mockEvents[eventIndex] = updatedEvent;
      offlineSync.cacheData(`event-${updatedEvent.id}`, updatedEvent);
      
      ErrorHandlingService.info(
        `Event update queued for offline sync: ${updatedEvent.title}`,
        'calendar_event_offline',
        { eventId: updatedEvent.id }
      );
      
      return updatedEvent;
    }
  }

  static async deleteEvent(id: string): Promise<void> {
    const eventIndex = mockEvents.findIndex(event => event.id === id);
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }

    const eventToDelete = mockEvents[eventIndex];

    // Check if online
    if (offlineSync.isOnline()) {
      try {
        await delay(200); // Simulate network delay
        mockEvents.splice(eventIndex, 1);
        
        ErrorHandlingService.info(
          `Event deleted: ${eventToDelete.title}`,
          'calendar_event',
          { eventId: id }
        );
      } catch (error) {
        // If online but failed, queue for offline sync
        offlineSync.queueAction(
          'appointment',
          'delete',
          { id },
          id
        );
        
        throw error;
      }
    } else {
      // Offline - queue action and remove locally
      offlineSync.queueAction(
        'appointment',
        'delete',
        { id },
        id
      );
      
      // Remove locally for immediate UI feedback
      mockEvents.splice(eventIndex, 1);
      
      ErrorHandlingService.info(
        `Event deletion queued for offline sync: ${eventToDelete.title}`,
        'calendar_event_offline',
        { eventId: id }
      );
    }
  }

  static async getTeamMembers(): Promise<TeamMember[]> {
    await delay(300);
    return [...mockTeamMembers];
  }

  static async getEventStats() {
    await delay(400);
    
    const totalEvents = mockEvents.length;
    const eventsByType = mockEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const eventsByStatus = mockEvents.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const now = new Date();
    const upcomingEvents = mockEvents.filter(event => event.date > now).length;
    const overdueEvents = mockEvents.filter(event => 
      event.date < now && event.status !== 'cancelled'
    ).length;

    return {
      totalEvents,
      eventsByType,
      eventsByStatus,
      upcomingEvents,
      overdueEvents
    };
  }

  // For development - reset mock data
  static resetData(): void {
    mockEvents = [
      {
        id: "EVT-001",
        title: "Baustellenbesichtigung Müller",
        project: "Wohnhaus München",
        customer: "Familie Müller",
        type: "site-visit",
        date: new Date(2024, 2, 15, 10, 0),
        endDate: new Date(2024, 2, 15, 12, 0),
        location: "Musterstraße 12, München",
        attendees: ["Hans Müller", "Bauleiter Schmidt"],
        description: "Gemeinsame Begehung des Rohbaus mit dem Kunden",
        status: "confirmed",
        createdAt: new Date(2024, 1, 1),
        updatedAt: new Date(2024, 1, 1),
        createdBy: "user-1"
      }
    ];
  }
}

// Development helper - expose to window for testing
if (typeof window !== 'undefined') {
  (window as Window & { mockBackend?: typeof MockBackendService }).mockBackend = MockBackendService;
}