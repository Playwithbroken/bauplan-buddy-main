import apiClient, { ApiError } from './api';
import { ApiResponse } from '@/types/calendar';
import { AppointmentFormData } from '../components/AppointmentDialog';

// API-specific types for appointments
export interface ApiAppointment extends AppointmentFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateAppointmentRequest = AppointmentFormData;

export interface UpdateAppointmentRequest extends Partial<AppointmentFormData> {
  id: string;
}

export interface AppointmentFilters {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  type?: string;
  priority?: string;
  teamMembers?: string[];
  equipment?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'title' | 'priority' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface AppointmentsListResponse {
  appointments: ApiAppointment[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ConflictCheckRequest {
  date: string;
  startTime: string;
  endTime: string;
  teamMembers: string[];
  equipment: string[];
  excludeAppointmentId?: string;
}

export interface ConflictCheckResponse {
  hasConflicts: boolean;
  conflicts: Array<{
    type: 'team' | 'equipment' | 'location';
    resourceId: string;
    conflictingAppointmentId: string;
    conflictingAppointment: ApiAppointment;
  }>;
  suggestions?: Array<{
    date: string;
    startTime: string;
    endTime: string;
    score: number;
  }>;
}

/**
 * AppointmentAPI service for managing appointments via REST API
 * This service provides CRUD operations and additional features like conflict detection
 */
export class AppointmentAPI {
  private static readonly ENDPOINTS = {
    APPOINTMENTS: '/appointments',
    APPOINTMENT_BY_ID: (id: string) => `/appointments/${id}`,
    APPOINTMENTS_BY_PROJECT: (projectId: string) => `/appointments/project/${projectId}`,
    APPOINTMENTS_BY_DATE: (date: string) => `/appointments/date/${date}`,
    APPOINTMENTS_BY_DATE_RANGE: '/appointments/date-range',
    CONFLICT_CHECK: '/appointments/conflict-check',
    BULK_OPERATIONS: '/appointments/bulk',
    EXPORT: '/appointments/export',
    STATISTICS: '/appointments/statistics'
  };

  /**
   * Get all appointments with optional filtering and pagination
   */
  static async getAllAppointments(filters?: AppointmentFilters): Promise<AppointmentsListResponse> {
    try {
      const params: Record<string, string> = {};
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params[key] = value.join(',');
            } else {
              params[key] = value.toString();
            }
          }
        });
      }

      const response = await apiClient.get<AppointmentsListResponse>(
        this.ENDPOINTS.APPOINTMENTS,
        params
      );

      if (!response.success) {
        throw new ApiError({
          message: 'Failed to fetch appointments',
          code: 'FETCH_ERROR',
          details: response
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  /**
   * Get a single appointment by ID
   */
  static async getAppointmentById(id: string): Promise<ApiAppointment> {
    try {
      const response = await apiClient.get<ApiAppointment>(
        this.ENDPOINTS.APPOINTMENT_BY_ID(id)
      );

      if (!response.success) {
        throw new ApiError({
          message: `Failed to fetch appointment ${id}`,
          code: 'FETCH_ERROR',
          details: response
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }
  }

  /**
   * Create a new appointment
   */
  static async createAppointment(appointmentData: CreateAppointmentRequest): Promise<ApiAppointment> {
    try {
      const response = await apiClient.post<ApiAppointment>(
        this.ENDPOINTS.APPOINTMENTS,
        appointmentData
      );

      if (!response.success) {
        throw new ApiError({
          message: 'Failed to create appointment',
          code: 'CREATE_ERROR',
          details: response
        });
      }

      console.log('Appointment created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  /**
   * Update an existing appointment
   */
  static async updateAppointment(id: string, appointmentData: Partial<AppointmentFormData>): Promise<ApiAppointment> {
    try {
      const response = await apiClient.put<ApiAppointment>(
        this.ENDPOINTS.APPOINTMENT_BY_ID(id),
        appointmentData
      );

      if (!response.success) {
        throw new ApiError({
          message: `Failed to update appointment ${id}`,
          code: 'UPDATE_ERROR',
          details: response
        });
      }

      console.log('Appointment updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  /**
   * Delete an appointment
   */
  static async deleteAppointment(id: string): Promise<void> {
    try {
      const response = await apiClient.delete<void>(
        this.ENDPOINTS.APPOINTMENT_BY_ID(id)
      );

      if (!response.success) {
        throw new ApiError({
          message: `Failed to delete appointment ${id}`,
          code: 'DELETE_ERROR',
          details: response
        });
      }

      console.log('Appointment deleted:', id);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  /**
   * Get appointments by project ID
   */
  static async getAppointmentsByProject(projectId: string): Promise<ApiAppointment[]> {
    try {
      const response = await apiClient.get<ApiAppointment[]>(
        this.ENDPOINTS.APPOINTMENTS_BY_PROJECT(projectId)
      );

      if (!response.success) {
        throw new ApiError({
          message: `Failed to fetch appointments for project ${projectId}`,
          code: 'FETCH_ERROR',
          details: response
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching appointments by project:', error);
      throw error;
    }
  }

  /**
   * Get appointments by specific date
   */
  static async getAppointmentsByDate(date: string): Promise<ApiAppointment[]> {
    try {
      const response = await apiClient.get<ApiAppointment[]>(
        this.ENDPOINTS.APPOINTMENTS_BY_DATE(date)
      );

      if (!response.success) {
        throw new ApiError({
          message: `Failed to fetch appointments for date ${date}`,
          code: 'FETCH_ERROR',
          details: response
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching appointments by date:', error);
      throw error;
    }
  }

  /**
   * Get appointments within a date range
   */
  static async getAppointmentsByDateRange(startDate: string, endDate: string): Promise<ApiAppointment[]> {
    try {
      const params = { startDate, endDate };
      const response = await apiClient.get<ApiAppointment[]>(
        this.ENDPOINTS.APPOINTMENTS_BY_DATE_RANGE,
        params
      );

      if (!response.success) {
        throw new ApiError({
          message: `Failed to fetch appointments for date range ${startDate} - ${endDate}`,
          code: 'FETCH_ERROR',
          details: response
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching appointments by date range:', error);
      throw error;
    }
  }

  /**
   * Check for conflicts before creating/updating appointment
   */
  static async checkConflicts(conflictData: ConflictCheckRequest): Promise<ConflictCheckResponse> {
    try {
      const response = await apiClient.post<ConflictCheckResponse>(
        this.ENDPOINTS.CONFLICT_CHECK,
        conflictData
      );

      if (!response.success) {
        throw new ApiError({
          message: 'Failed to check conflicts',
          code: 'CONFLICT_CHECK_ERROR',
          details: response
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      throw error;
    }
  }

  /**
   * Bulk create appointments
   */
  static async createBulkAppointments(appointments: CreateAppointmentRequest[]): Promise<ApiAppointment[]> {
    try {
      const response = await apiClient.post<ApiAppointment[]>(
        this.ENDPOINTS.BULK_OPERATIONS,
        { appointments, operation: 'create' }
      );

      if (!response.success) {
        throw new ApiError({
          message: 'Failed to create bulk appointments',
          code: 'BULK_CREATE_ERROR',
          details: response
        });
      }

      console.log('Bulk appointments created:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error creating bulk appointments:', error);
      throw error;
    }
  }

  /**
   * Bulk update appointments
   */
  static async updateBulkAppointments(updates: UpdateAppointmentRequest[]): Promise<ApiAppointment[]> {
    try {
      const response = await apiClient.put<ApiAppointment[]>(
        this.ENDPOINTS.BULK_OPERATIONS,
        { updates, operation: 'update' }
      );

      if (!response.success) {
        throw new ApiError({
          message: 'Failed to update bulk appointments',
          code: 'BULK_UPDATE_ERROR',
          details: response
        });
      }

      console.log('Bulk appointments updated:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error updating bulk appointments:', error);
      throw error;
    }
  }

  /**
   * Bulk delete appointments
   */
  static async deleteBulkAppointments(ids: string[]): Promise<void> {
    try {
      const response = await apiClient.delete<void>(
        `${this.ENDPOINTS.BULK_OPERATIONS}?ids=${ids.join(',')}`
      );

      if (!response.success) {
        throw new ApiError({
          message: 'Failed to delete bulk appointments',
          code: 'BULK_DELETE_ERROR',
          details: response
        });
      }

      console.log('Bulk appointments deleted:', ids.length);
    } catch (error) {
      console.error('Error deleting bulk appointments:', error);
      throw error;
    }
  }

  /**
   * Export appointments in various formats
   */
  static async exportAppointments(
    format: 'csv' | 'pdf' | 'ical',
    filters?: AppointmentFilters
  ): Promise<Blob> {
    try {
      const params: Record<string, string> = { format };
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params[key] = value.join(',');
            } else {
              params[key] = value.toString();
            }
          }
        });
      }

      // This would need to be handled differently for file downloads
      // Using fetch directly for blob response
      const url = `${apiClient.baseURL}${this.ENDPOINTS.EXPORT}?${new URLSearchParams(params)}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new ApiError({
          message: 'Failed to export appointments',
          code: 'EXPORT_ERROR',
          details: response
        });
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting appointments:', error);
      throw error;
    }
  }

  /**
   * Get appointment statistics
   */
  static async getStatistics(filters?: AppointmentFilters): Promise<{
    total: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
    upcomingCount: number;
    overdueCount: number;
    thisWeek: number;
    thisMonth: number;
  }> {
    try {
      const params: Record<string, string> = {};
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params[key] = value.join(',');
            } else {
              params[key] = value.toString();
            }
          }
        });
      }

      const response = await apiClient.get<{
        total: number;
        byType: Record<string, number>;
        byPriority: Record<string, number>;
        byStatus: Record<string, number>;
        upcomingCount: number;
        overdueCount: number;
        thisWeek: number;
        thisMonth: number;
      }>(this.ENDPOINTS.STATISTICS, params);

      if (!response.success) {
        throw new ApiError({
          message: 'Failed to fetch appointment statistics',
          code: 'STATISTICS_ERROR',
          details: response
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching appointment statistics:', error);
      throw error;
    }
  }

  /**
   * Sync appointments with server (for offline capability)
   */
  static async syncAppointments(lastSyncTimestamp?: string): Promise<{
    appointments: ApiAppointment[];
    deletedAppointmentIds: string[];
    lastSyncTimestamp: string;
  }> {
    try {
      const params = lastSyncTimestamp ? { since: lastSyncTimestamp } : {};
      const response = await apiClient.get<{
        appointments: ApiAppointment[];
        deletedAppointmentIds: string[];
        lastSyncTimestamp: string;
      }>('/appointments/sync', params);

      if (!response.success) {
        throw new ApiError({
          message: 'Failed to sync appointments',
          code: 'SYNC_ERROR',
          details: response
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error syncing appointments:', error);
      throw error;
    }
  }
}

export default AppointmentAPI;