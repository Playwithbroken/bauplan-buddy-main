import { AppointmentFormData } from '../components/AppointmentDialog';
import { NotificationService } from './notificationService';
import { AppointmentAPI, ApiAppointment, AppointmentFilters } from './appointmentAPI';
import { offlineSync } from './offlineSyncService';
import { db, Appointment } from './localDatabaseService';
import { 
  RecurrencePattern, 
  RecurrenceService, 
  RecurringAppointment, 
  AppointmentOccurrence 
} from './recurrenceService';
import { getEnvVar, isProduction } from '@/utils/env';

export interface StoredAppointment extends AppointmentFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
  recurrencePattern?: RecurrencePattern;
  recurrenceId?: string;
  isRecurring?: boolean;
  seriesId?: string;
  originalDate?: string;
}

const USE_API = getEnvVar('VITE_USE_API') === 'true' || isProduction();

/**
 * AppointmentService provides a unified interface for appointment management
 * Supports both API backend and Dexie fallback with offline capabilities
 */
export class AppointmentService {
  /**
   * Get all appointments with optional filtering
   */
  static async getAllAppointments(filters?: AppointmentFilters): Promise<StoredAppointment[]> {
    if (USE_API && navigator.onLine) {
      try {
        const response = await AppointmentAPI.getAllAppointments(filters);
        const appointments = response.appointments.map(this.mapApiToStored);
        
        // Update local Dexie cache
        for (const app of appointments) {
          await db.appointments.put(app as any);
        }
        
        return appointments;
      } catch (error) {
        console.warn('API call failed, falling back to local database:', error);
      }
    }
    
    // Fallback to Dexie
    let query = db.appointments.toCollection();
    if (filters?.projectId) {
      query = db.appointments.where('projectId').equals(filters.projectId);
    }
    
    const localAppointments = await query.toArray();
    return localAppointments as unknown as StoredAppointment[];
  }

  /**
   * Save a new appointment
   */
  static async saveAppointment(appointmentData: AppointmentFormData): Promise<StoredAppointment> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const appointment: StoredAppointment = {
      ...appointmentData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // Save to local database immediately (Offline-First)
    await db.appointments.put(appointment as any);
    
    // Schedule reminders
    NotificationService.scheduleAppointmentReminders(appointment);

    // Queue for sync
    await offlineSync.queueAction('appointments', 'create', appointment);

    return appointment;
  }

  /**
   * Update an appointment
   */
  static async updateAppointment(id: string, appointmentData: Partial<AppointmentFormData>): Promise<StoredAppointment | null> {
    const existing = await db.appointments.get(id);
    if (!existing) return null;

    const updated: StoredAppointment = {
      ...existing,
      ...appointmentData,
      updatedAt: new Date().toISOString()
    } as any;

    await db.appointments.put(updated as any);
    
    // Update reminders
    NotificationService.clearReminders(id);
    NotificationService.scheduleAppointmentReminders(updated);

    // Queue for sync
    await offlineSync.queueAction('appointments', 'update', updated);

    return updated;
  }

  /**
   * Delete an appointment
   */
  static async deleteAppointment(id: string): Promise<boolean> {
    const existing = await db.appointments.get(id);
    if (!existing) return false;

    await db.appointments.delete(id);
    NotificationService.clearReminders(id);

    // Queue for sync
    await offlineSync.queueAction('appointments', 'delete', existing, id);

    return true;
  }

  /**
   * Helper to map API appointment to stored format
   */
  private static mapApiToStored(apiApp: ApiAppointment): StoredAppointment {
    return {
      id: apiApp.id,
      title: apiApp.title,
      description: apiApp.description || '',
      date: apiApp.date,
      startTime: apiApp.startTime,
      endTime: apiApp.endTime,
      location: apiApp.location || '',
      type: (apiApp.type as any) || 'generic',
      projectId: apiApp.projectId || 'PRJ-GENERAL',
      attendees: apiApp.attendees || [],
      teamMembers: apiApp.teamMembers || [],
      equipment: apiApp.equipment || [],
      priority: (apiApp.priority as any) || 'medium',
      customerNotification: apiApp.customerNotification ?? true,
      reminderTime: apiApp.reminderTime || '15',
      createdAt: apiApp.createdAt,
      updatedAt: apiApp.updatedAt,
      emailNotifications: apiApp.emailNotifications || {
        enabled: false,
        sendInvitations: false,
        sendReminders: false,
        recipients: []
      }
    };
  }

  private static generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  // --- Recurrence Support ---

  /**
   * Generate occurrences for a recurring appointment
   */
  static async getRecurringOccurrences(masterId: string): Promise<StoredAppointment[]> {
    return db.appointments.where('recurrenceId').equals(masterId).toArray() as any;
  }

  /**
   * Save a recurring series
   */
  static async saveRecurringSeries(appointmentData: AppointmentFormData): Promise<StoredAppointment> {
    const master = await this.saveAppointment(appointmentData);
    
    // Logic for generating and saving occurrences would go here, 
    // similar to previous implementation but using this.saveAppointment for each
    
    return master;
  }

  /**
   * Edit a recurring appointment with a choice of which occurrences to update
   */
  static async editRecurringAppointment(
    appointment: StoredAppointment,
    data: AppointmentFormData,
    choice: 'single' | 'series' | 'future'
  ): Promise<void> {
    if (choice === 'single') {
      // Create an exception for this specific date
      RecurrenceService.addException({
        id: this.generateId(),
        seriesId: appointment.seriesId || appointment.id,
        originalDate: appointment.date,
        type: 'modified',
        modifiedAppointment: data,
        createdAt: new Date().toISOString()
      });
    } else {
      // Update the master or future ones (simplified here to update the master)
      await this.updateAppointment(appointment.seriesId || appointment.id, data);
    }
  }

  /**
   * Delete a recurring appointment with a choice of which occurrences to remove
   */
  static async deleteRecurringAppointmentWithChoice(
    appointment: StoredAppointment,
    choice: 'single' | 'series' | 'future'
  ): Promise<void> {
    if (choice === 'single') {
      // Create a cancellation exception
      RecurrenceService.addException({
        id: this.generateId(),
        seriesId: appointment.seriesId || appointment.id,
        originalDate: appointment.date,
        type: 'cancelled',
        createdAt: new Date().toISOString()
      });
    } else {
      // Delete the entire series
      await this.deleteAppointment(appointment.seriesId || appointment.id);
    }
  }

  /**
   * Get all appointments for a date range, including generated recurring occurrences
   */
  static async getAllAppointmentsWithRecurrence(startDate: Date, endDate: Date): Promise<StoredAppointment[]> {
    // 1. Get all basic appointments from DB
    const allBaseAppointments = await this.getAllAppointments();
    
    const result: StoredAppointment[] = [];
    const exceptions = RecurrenceService.getRecurrenceExceptions();
    
    for (const app of allBaseAppointments) {
      if (app.isRecurring && app.recurrencePattern) {
        // 2. Generate occurrences for recurring appointments
        const occurrences = RecurrenceService.generateOccurrences(app as any, {
          startDate,
          endDate,
          includeExceptions: true
        });
        
        // 3. Apply exceptions
        for (const occurrence of occurrences) {
          const exception = exceptions.find(ex => 
            ex.seriesId === occurrence.seriesId && 
            ex.originalDate === occurrence.occurrenceDate
          );
          
          if (exception) {
            if (exception.type === 'cancelled') {
              continue; // Skip cancelled
            } else if (exception.type === 'modified' && exception.modifiedAppointment) {
              result.push({ ...occurrence, ...exception.modifiedAppointment });
            }
          } else {
            result.push(occurrence);
          }
        }
      } else {
        // 4. Check if regular appointment is in range
        const appDate = new Date(app.date);
        // Compare dates without time for simpler range check
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        if (appDate >= start && appDate <= end) {
          result.push(app);
        }
      }
    }
    
    return result;
  }
}