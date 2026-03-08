import apiClient from './api';
import { MockBackendService } from './mockBackend';
import {
  CalendarEvent,
  CreateEventData,
  UpdateEventData,
  EventFilters,
  EventsResponse,
  TeamMember,
  ApiResponse,
} from '@/types/calendar';

// Check if we should use mock backend
import { getEnvVar } from '@/utils/env';

const USE_MOCK_BACKEND = getEnvVar('VITE_USE_MOCK_BACKEND') === 'true' || true; // Default to true for development

class CalendarApiService {
  private readonly basePath = '/calendar';

  // Event CRUD Operations
  async getEvents(filters?: EventFilters): Promise<CalendarEvent[]> {
    if (USE_MOCK_BACKEND) {
      return MockBackendService.getEvents();
    }

    const params: Record<string, string> = {};
    
    if (filters) {
      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.projectId) params.projectId = filters.projectId;
      if (filters.customerId) params.customerId = filters.customerId;
      if (filters.attendees?.length) params.attendees = filters.attendees.join(',');
    }

    const response = await apiClient.get<EventsResponse>(`${this.basePath}/events`, params);
    
    // Convert string dates back to Date objects
    return response.data.events.map(event => ({
      ...event,
      date: new Date(event.date),
      endDate: new Date(event.endDate),
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt),
    }));
  }

  async getEvent(id: string): Promise<CalendarEvent> {
    const response = await apiClient.get<CalendarEvent>(`${this.basePath}/events/${id}`);
    
    return {
      ...response.data,
      date: new Date(response.data.date),
      endDate: new Date(response.data.endDate),
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }

  async createEvent(eventData: CreateEventData): Promise<CalendarEvent> {
    if (USE_MOCK_BACKEND) {
      return MockBackendService.createEvent(eventData);
    }

    const response = await apiClient.post<CalendarEvent>(`${this.basePath}/events`, {
      ...eventData,
      status: eventData.status || 'pending',
    });

    return {
      ...response.data,
      date: new Date(response.data.date),
      endDate: new Date(response.data.endDate),
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }

  async updateEvent(eventData: UpdateEventData): Promise<CalendarEvent> {
    if (USE_MOCK_BACKEND) {
      return MockBackendService.updateEvent(eventData);
    }

    const { id, ...updateData } = eventData;
    const response = await apiClient.put<CalendarEvent>(`${this.basePath}/events/${id}`, updateData);

    return {
      ...response.data,
      date: new Date(response.data.date),
      endDate: new Date(response.data.endDate),
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }

  async deleteEvent(id: string): Promise<void> {
    if (USE_MOCK_BACKEND) {
      return MockBackendService.deleteEvent(id);
    }

    await apiClient.delete(`${this.basePath}/events/${id}`);
  }

  // Bulk operations
  async createMultipleEvents(eventsData: CreateEventData[]): Promise<CalendarEvent[]> {
    const response = await apiClient.post<CalendarEvent[]>(`${this.basePath}/events/bulk`, {
      events: eventsData,
    });

    return response.data.map(event => ({
      ...event,
      date: new Date(event.date),
      endDate: new Date(event.endDate),
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt),
    }));
  }

  async deleteMultipleEvents(ids: string[]): Promise<void> {
    await apiClient.delete(`${this.basePath}/events/bulk?ids=${ids.join(',')}`);
  }

  // Team members
  async getTeamMembers(): Promise<TeamMember[]> {
    if (USE_MOCK_BACKEND) {
      return MockBackendService.getTeamMembers();
    }

    const response = await apiClient.get<TeamMember[]>(`${this.basePath}/team`);
    return response.data;
  }

  async getTeamMemberEvents(memberId: string, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const response = await apiClient.get<CalendarEvent[]>(
      `${this.basePath}/team/${memberId}/events`,
      params
    );

    return response.data.map(event => ({
      ...event,
      date: new Date(event.date),
      endDate: new Date(event.endDate),
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt),
    }));
  }

  // Project integration
  async getProjectEvents(projectId: string): Promise<CalendarEvent[]> {
    const response = await apiClient.get<CalendarEvent[]>(`${this.basePath}/projects/${projectId}/events`);
    
    return response.data.map(event => ({
      ...event,
      date: new Date(event.date),
      endDate: new Date(event.endDate),
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt),
    }));
  }

  // Customer integration
  async getCustomerEvents(customerId: string): Promise<CalendarEvent[]> {
    const response = await apiClient.get<CalendarEvent[]>(`${this.basePath}/customers/${customerId}/events`);
    
    return response.data.map(event => ({
      ...event,
      date: new Date(event.date),
      endDate: new Date(event.endDate),
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt),
    }));
  }

  // Availability checking
  async checkAvailability(
    startDate: Date,
    endDate: Date,
    attendees: string[]
  ): Promise<{ available: boolean; conflicts: CalendarEvent[] }> {
    const response = await apiClient.post<{ available: boolean; conflicts: CalendarEvent[] }>(
      `${this.basePath}/availability`,
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        attendees,
      }
    );

    return {
      available: response.data.available,
      conflicts: response.data.conflicts.map(event => ({
        ...event,
        date: new Date(event.date),
        endDate: new Date(event.endDate),
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt),
      })),
    };
  }

  // Statistics
  async getEventStats(startDate?: Date, endDate?: Date): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByStatus: Record<string, number>;
    upcomingEvents: number;
    overdueEvents: number;
  }> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const response = await apiClient.get<{
      totalEvents: number;
      eventsByType: Record<string, number>;
      eventsByStatus: Record<string, number>;
      upcomingEvents: number;
      overdueEvents: number;
    }>(`${this.basePath}/stats`, params);

    return response.data;
  }
}

// Create and export the calendar API service instance
const calendarApi = new CalendarApiService();

export { calendarApi };
export default calendarApi;