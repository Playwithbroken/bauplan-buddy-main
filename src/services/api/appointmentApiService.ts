import { apiClient, configService } from '../databaseService';
import type { Appointment } from '@/types/appointment';

// API response types
interface AppointmentApiResponse {
  id: string;
  title: string;
  description?: string;
  type: string;
  start_time: string;
  end_time: string;
  location?: string;
  project_id?: string;
  creator_id: string;
  attendees: string[];
  team_members: string[];
  equipment: string[];
  priority: string;
  customer_notification: boolean;
  reminder_minutes: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ApiListResponse<T> {
  data: T[];
}

interface ApiSingleResponse<T> {
  data: T;
}

export interface CreateAppointmentRequest {
  title: string;
  description?: string;
  type: 'site-visit' | 'meeting' | 'delivery' | 'milestone' | 'inspection' | 'internal';
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  projectId?: string;
  attendees: string[];
  teamMembers: string[];
  equipment: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  customerNotification: boolean;
  reminderMinutes: number;
}

export interface UpdateAppointmentRequest extends Partial<CreateAppointmentRequest> {
  id: string;
  status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
}

export interface AppointmentFilter {
  startDate?: Date;
  endDate?: Date;
  projectId?: string;
  type?: string;
  status?: string;
  assignedTo?: string;
  priority?: string;
}

export class AppointmentApiService {
  private useApi: boolean;

  constructor() {
    this.useApi = configService.shouldUseApi();
  }

  async getAppointments(filter?: AppointmentFilter): Promise<Appointment[]> {
    if (this.useApi) {
      return this.getAppointmentsFromApi(filter);
    } else {
      return this.getAppointmentsFromLocalStorage(filter);
    }
  }

  async getAppointment(id: string): Promise<Appointment | null> {
    if (this.useApi) {
      return this.getAppointmentFromApi(id);
    } else {
      return this.getAppointmentFromLocalStorage(id);
    }
  }

  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<Appointment> {
    if (this.useApi) {
      return this.createAppointmentInApi(appointmentData);
    } else {
      return this.createAppointmentInLocalStorage(appointmentData);
    }
  }

  async updateAppointment(appointmentData: UpdateAppointmentRequest): Promise<Appointment> {
    if (this.useApi) {
      return this.updateAppointmentInApi(appointmentData);
    } else {
      return this.updateAppointmentInLocalStorage(appointmentData);
    }
  }

  async deleteAppointment(id: string): Promise<boolean> {
    if (this.useApi) {
      return this.deleteAppointmentFromApi(id);
    } else {
      return this.deleteAppointmentFromLocalStorage(id);
    }
  }

  async getAppointmentsByProject(projectId: string): Promise<Appointment[]> {
    return this.getAppointments({ projectId });
  }

  async getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    return this.getAppointments({ startDate, endDate });
  }

  async getUpcomingAppointments(days: number = 7): Promise<Appointment[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    return this.getAppointments({ startDate, endDate });
  }

  // API Implementation Methods
  private async getAppointmentsFromApi(filter?: AppointmentFilter): Promise<Appointment[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filter) {
        if (filter.startDate) queryParams.append('start_date', filter.startDate.toISOString());
        if (filter.endDate) queryParams.append('end_date', filter.endDate.toISOString());
        if (filter.projectId) queryParams.append('project_id', filter.projectId);
        if (filter.type) queryParams.append('type', filter.type);
        if (filter.status) queryParams.append('status', filter.status);
        if (filter.assignedTo) queryParams.append('assigned_to', filter.assignedTo);
        if (filter.priority) queryParams.append('priority', filter.priority);
      }

      const url = `/appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<ApiListResponse<AppointmentApiResponse>>(url);
      
      return response.data.map(this.mapApiResponseToAppointment);
    } catch (error) {
      console.error('Failed to fetch appointments from API:', error);
      throw new Error('Failed to fetch appointments');
    }
  }

  private async getAppointmentFromApi(id: string): Promise<Appointment | null> {
    try {
      const response = await apiClient.get<ApiSingleResponse<AppointmentApiResponse>>(`/appointments/${id}`);
      return this.mapApiResponseToAppointment(response.data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      console.error('Failed to fetch appointment from API:', error);
      throw new Error('Failed to fetch appointment');
    }
  }

  private async createAppointmentInApi(appointmentData: CreateAppointmentRequest): Promise<Appointment> {
    try {
      const payload = this.mapCreateRequestToApiPayload(appointmentData);
      const response = await apiClient.post<ApiSingleResponse<AppointmentApiResponse>>('/appointments', payload);
      return this.mapApiResponseToAppointment(response.data);
    } catch (error) {
      console.error('Failed to create appointment in API:', error);
      throw new Error('Failed to create appointment');
    }
  }

  private async updateAppointmentInApi(appointmentData: UpdateAppointmentRequest): Promise<Appointment> {
    try {
      const { id, ...updateData } = appointmentData;
      const payload = this.mapUpdateRequestToApiPayload(updateData);
      const response = await apiClient.put<ApiSingleResponse<AppointmentApiResponse>>(`/appointments/${id}`, payload);
      return this.mapApiResponseToAppointment(response.data);
    } catch (error) {
      console.error('Failed to update appointment in API:', error);
      throw new Error('Failed to update appointment');
    }
  }

  private async deleteAppointmentFromApi(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/appointments/${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete appointment from API:', error);
      throw new Error('Failed to delete appointment');
    }
  }

  // LocalStorage Implementation Methods (fallback)
  private getAppointmentsFromLocalStorage(filter?: AppointmentFilter): Appointment[] {
    try {
      const appointments = this.getAllAppointmentsFromLocalStorage();
      
      if (!filter) return appointments;

      return appointments.filter(appointment => {
        if (filter.startDate && new Date(appointment.date) < filter.startDate) return false;
        if (filter.endDate && new Date(appointment.date) > filter.endDate) return false;
        if (filter.projectId && appointment.projectId !== filter.projectId) return false;
        if (filter.type && appointment.type !== filter.type) return false;
        // Note: StoredAppointment doesn't have status property in current implementation
        // if (filter.status && appointment.status !== filter.status) return false;
        if (filter.priority && appointment.priority !== filter.priority) return false;
        if (filter.assignedTo && !appointment.teamMembers.includes(filter.assignedTo)) return false;
        
        return true;
      });
    } catch (error) {
      console.error('Failed to get appointments from localStorage:', error);
      return [];
    }
  }

  private getAppointmentFromLocalStorage(id: string): Appointment | null {
    const appointments = this.getAllAppointmentsFromLocalStorage();
    return appointments.find(appointment => appointment.id === id) || null;
  }

  private createAppointmentInLocalStorage(appointmentData: CreateAppointmentRequest): Appointment {
    const appointments = this.getAllAppointmentsFromLocalStorage();
    
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      title: appointmentData.title,
      description: appointmentData.description,
      type: appointmentData.type,
      date: appointmentData.date,
      startTime: appointmentData.startTime,
      endTime: appointmentData.endTime,
      location: appointmentData.location,
      projectId: appointmentData.projectId,
      creatorId: 'current-user', // Would be from auth context
      attendees: appointmentData.attendees,
      teamMembers: appointmentData.teamMembers,
      equipment: appointmentData.equipment,
      priority: appointmentData.priority,
      customerNotification: appointmentData.customerNotification,
      reminderMinutes: appointmentData.reminderMinutes,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    appointments.push(newAppointment);
    this.saveAppointmentsToLocalStorage(appointments);
    
    return newAppointment;
  }

  private updateAppointmentInLocalStorage(appointmentData: UpdateAppointmentRequest): Appointment {
    const appointments = this.getAllAppointmentsFromLocalStorage();
    const index = appointments.findIndex(appointment => appointment.id === appointmentData.id);
    
    if (index === -1) {
      throw new Error('Appointment not found');
    }

    const updatedAppointment: Appointment = {
      ...appointments[index],
      ...appointmentData,
      updatedAt: new Date().toISOString()
    };

    appointments[index] = updatedAppointment;
    this.saveAppointmentsToLocalStorage(appointments);
    
    return updatedAppointment;
  }

  private deleteAppointmentFromLocalStorage(id: string): boolean {
    const appointments = this.getAllAppointmentsFromLocalStorage();
    const filteredAppointments = appointments.filter(appointment => appointment.id !== id);
    
    if (filteredAppointments.length === appointments.length) {
      return false; // Appointment not found
    }

    this.saveAppointmentsToLocalStorage(filteredAppointments);
    return true;
  }

  // Helper Methods
  private getAllAppointmentsFromLocalStorage(): Appointment[] {
    try {
      const stored = localStorage.getItem('appointments');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading appointments from localStorage:', error);
      return [];
    }
  }

  private saveAppointmentsToLocalStorage(appointments: Appointment[]): void {
    try {
      localStorage.setItem('appointments', JSON.stringify(appointments));
    } catch (error) {
      console.error('Error saving appointments to localStorage:', error);
      throw new Error('Failed to save appointments');
    }
  }

  // Mapping Methods
  private mapApiResponseToAppointment(apiData: AppointmentApiResponse): Appointment {
    return {
      id: apiData.id,
      title: apiData.title,
      description: apiData.description,
      type: apiData.type,
      date: apiData.start_time.split('T')[0], // Extract date from ISO string
      startTime: new Date(apiData.start_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      endTime: new Date(apiData.end_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      location: apiData.location,
      projectId: apiData.project_id,
      creatorId: apiData.creator_id,
      attendees: apiData.attendees || [],
      teamMembers: apiData.team_members || [],
      equipment: apiData.equipment || [],
      priority: apiData.priority,
      customerNotification: apiData.customer_notification,
      reminderMinutes: apiData.reminder_minutes,
      status: apiData.status,
      createdAt: apiData.created_at,
      updatedAt: apiData.updated_at
    };
  }

  private mapCreateRequestToApiPayload(data: CreateAppointmentRequest): Record<string, unknown> {
    return {
      title: data.title,
      description: data.description,
      type: data.type,
      start_time: `${data.date}T${data.startTime}:00`,
      end_time: `${data.date}T${data.endTime}:00`,
      location: data.location,
      project_id: data.projectId,
      attendees: data.attendees,
      team_members: data.teamMembers,
      equipment: data.equipment,
      priority: data.priority,
      customer_notification: data.customerNotification,
      reminder_minutes: data.reminderMinutes
    };
  }

  private mapUpdateRequestToApiPayload(data: Partial<CreateAppointmentRequest> & { status?: string }): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    
    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.type !== undefined) payload.type = data.type;
    if (data.date !== undefined) payload.date = data.date;
    if (data.startTime !== undefined) payload.start_time = `${data.date || ''}T${data.startTime}:00`;
    if (data.endTime !== undefined) payload.end_time = `${data.date || ''}T${data.endTime}:00`;
    if (data.location !== undefined) payload.location = data.location;
    if (data.projectId !== undefined) payload.project_id = data.projectId;
    if (data.attendees !== undefined) payload.attendees = data.attendees;
    if (data.teamMembers !== undefined) payload.team_members = data.teamMembers;
    if (data.equipment !== undefined) payload.equipment = data.equipment;
    if (data.priority !== undefined) payload.priority = data.priority;
    if (data.customerNotification !== undefined) payload.customer_notification = data.customerNotification;
    if (data.reminderMinutes !== undefined) payload.reminder_minutes = data.reminderMinutes;
    if (data.status !== undefined) payload.status = data.status;
    
    return payload;
  }
}

// Export singleton instance
export const appointmentApiService = new AppointmentApiService();