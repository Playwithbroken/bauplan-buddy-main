// DragDropService for handling appointment drag operations

import { 
  DragItem, 
  DropTarget, 
  CalendarDragEvent, 
  CalendarDropEvent,
  ConflictInfo,
  DragAndDropOptions
} from '@/types/dragAndDrop';
import { StoredAppointment } from '@/services/appointmentService';
import { appointmentService } from '@/services/appointmentService';

class DragDropService {
  private options: DragAndDropOptions;
  private conflictCache: Map<string, ConflictInfo> = new Map();

  constructor(options: DragAndDropOptions = {}) {
    this.options = {
      enableDrag: true,
      enableDrop: true,
      snapToGrid: true,
      gridSize: 15, // 15 minutes
      conflictDetection: true,
      showPreview: true,
      ...options
    };
  }

  // Start dragging an appointment
  startDrag(appointment: StoredAppointment): DragItem {
    return {
      type: 'appointment',
      id: appointment.id,
      data: appointment,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      date: appointment.date
    };
  }

  // Update drag position
  updateDrag(dragItem: DragItem, target: DropTarget): CalendarDragEvent {
    return {
      appointmentId: dragItem.id,
      originalDate: dragItem.date,
      originalStartTime: dragItem.startTime,
      originalEndTime: dragItem.endTime,
      newDate: target.date,
      newStartTime: target.startTime,
      newEndTime: target.endTime,
      resourceId: target.resourceId
    };
  }

  // End drag operation
  async endDrag(dragItem: DragItem, target: DropTarget): Promise<boolean> {
    try {
      // Check for conflicts if enabled
      if (this.options.conflictDetection) {
        const conflictInfo = await this.checkConflicts(dragItem, target);
        if (conflictInfo.hasConflict) {
          // Handle conflict - for now we'll just return false
          // In a real implementation, we might show a dialog to the user
          return false;
        }
      }

      // Update the appointment with new date/time
      const updatedAppointment: StoredAppointment = {
        ...dragItem.data,
        date: target.date,
        startTime: target.startTime || dragItem.startTime,
        endTime: target.endTime || dragItem.endTime
      };

      // Save the updated appointment
      await appointmentService.updateAppointment(dragItem.id, updatedAppointment);
      
      // Clear conflict cache for this appointment
      this.conflictCache.delete(dragItem.id);
      
      return true;
    } catch (error) {
      console.error('Error ending drag operation:', error);
      return false;
    }
  }

  // Check for scheduling conflicts
  async checkConflicts(dragItem: DragItem, target: DropTarget): Promise<ConflictInfo> {
    // Create a cache key
    const cacheKey = `${dragItem.id}-${target.date}-${target.startTime}-${target.endTime}`;
    
    // Check if we have a cached result
    if (this.conflictCache.has(cacheKey)) {
      return this.conflictCache.get(cacheKey)!;
    }

    try {
      // Get all appointments for the target date
      const appointments = await appointmentService.getAppointmentsByDate(target.date);
      
      // Filter out the appointment being dragged
      const otherAppointments = appointments.filter(
        appt => appt.id !== dragItem.id
      );

      // Check for time overlaps
      const conflictingAppointments: string[] = [];
      
      const newStart = this.parseTime(target.startTime || dragItem.startTime);
      const newEnd = this.parseTime(target.endTime || dragItem.endTime);
      
      otherAppointments.forEach(appt => {
        const apptStart = this.parseTime(appt.startTime);
        const apptEnd = this.parseTime(appt.endTime);
        
        // Check if there's a time overlap
        if (
          (newStart >= apptStart && newStart < apptEnd) ||
          (newEnd > apptStart && newEnd <= apptEnd) ||
          (newStart <= apptStart && newEnd >= apptEnd)
        ) {
          conflictingAppointments.push(appt.id);
        }
      });

      const hasConflict = conflictingAppointments.length > 0;
      const conflictInfo: ConflictInfo = {
        hasConflict,
        conflictingAppointments,
        message: hasConflict 
          ? `Conflicts with ${conflictingAppointments.length} other appointment(s)` 
          : ''
      };

      // Cache the result
      this.conflictCache.set(cacheKey, conflictInfo);
      
      return conflictInfo;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return {
        hasConflict: false,
        conflictingAppointments: [],
        message: ''
      };
    }
  }

  // Validate drag operation
  validateDragOperation(dragItem: DragItem, target: DropTarget): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate target date
    if (!target.date) {
      errors.push('Target date is required');
    }
    
    // Validate time format if provided
    if (target.startTime && !this.isValidTimeFormat(target.startTime)) {
      errors.push('Invalid start time format');
    }
    
    if (target.endTime && !this.isValidTimeFormat(target.endTime)) {
      errors.push('Invalid end time format');
    }
    
    // Validate that end time is after start time
    if (target.startTime && target.endTime) {
      const start = this.parseTime(target.startTime);
      const end = this.parseTime(target.endTime);
      
      if (end <= start) {
        errors.push('End time must be after start time');
      }
    }
    
    // Validate date format
    if (target.date && !this.isValidDateFormat(target.date)) {
      errors.push('Invalid date format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper function to parse time strings (HH:MM) into minutes
  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Helper function to validate time format (HH:MM)
  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  // Helper function to validate date format (YYYY-MM-DD)
  private isValidDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date);
  }

  // Snap time to grid based on grid size
  snapToGrid(time: string): string {
    if (!this.options.snapToGrid || !this.options.gridSize) {
      return time;
    }

    const totalMinutes = this.parseTime(time);
    const gridMinutes = this.options.gridSize;
    const snappedMinutes = Math.round(totalMinutes / gridMinutes) * gridMinutes;
    
    const hours = Math.floor(snappedMinutes / 60);
    const minutes = snappedMinutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Calculate duration of an appointment in minutes
  calculateDuration(startTime: string, endTime: string): number {
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);
    return end - start;
  }

  // Update appointment duration while maintaining start time
  updateEndTime(startTime: string, duration: number): string {
    const startMinutes = this.parseTime(startTime);
    const endMinutes = startMinutes + duration;
    
    const hours = Math.floor(endMinutes / 60);
    const minutes = endMinutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Clear conflict cache
  clearConflictCache(): void {
    this.conflictCache.clear();
  }

  // Update options
  updateOptions(newOptions: Partial<DragAndDropOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}

// Export singleton instance
export const dragDropService = new DragDropService();

// Export class for potential custom instances
export default DragDropService;