import { StoredAppointment } from './appointmentService';

export interface ConflictDetectionOptions {
  excludeAppointmentId?: string; // For updates, exclude the current appointment
  bufferMinutes?: number; // Buffer time between appointments
  checkTeamMembers?: boolean;
  checkEquipment?: boolean;
}

export interface Conflict {
  type: 'team' | 'equipment' | 'location' | 'time_overlap';
  severity: 'warning' | 'error' | 'info';
  resource: string;
  resourceId: string;
  conflictingAppointment: StoredAppointment;
  message: string;
  suggestion?: string;
}

export interface ConflictAnalysis {
  hasConflicts: boolean;
  conflicts: Conflict[];
  warnings: Conflict[];
  suggestions: string[];
}

export class ConflictDetectionService {
  private static readonly DEFAULT_BUFFER_MINUTES = 15;

  static detectConflicts(
    appointment: Partial<StoredAppointment>,
    allAppointments: StoredAppointment[],
    options: ConflictDetectionOptions = {}
  ): ConflictAnalysis {
    const {
      excludeAppointmentId,
      bufferMinutes = this.DEFAULT_BUFFER_MINUTES,
      checkTeamMembers = true,
      checkEquipment = true
    } = options;

    const conflicts: Conflict[] = [];
    const warnings: Conflict[] = [];
    const suggestions: string[] = [];

    if (!appointment.date || !appointment.startTime || !appointment.endTime) {
      return {
        hasConflicts: false,
        conflicts: [],
        warnings: [],
        suggestions: ['Vollständige Termindetails erforderlich für Konfliktprüfung']
      };
    }

    // Filter appointments for the same date
    const sameDateAppointments = allAppointments.filter(app => 
      app.date === appointment.date && 
      (!excludeAppointmentId || app.id !== excludeAppointmentId)
    );

    const appointmentStart = this.parseTime(appointment.date, appointment.startTime);
    const appointmentEnd = this.parseTime(appointment.date, appointment.endTime);

    // Check each existing appointment for conflicts
    sameDateAppointments.forEach(existingApp => {
      const existingStart = this.parseTime(existingApp.date, existingApp.startTime);
      const existingEnd = this.parseTime(existingApp.date, existingApp.endTime);

      // Check for time overlap
      if (this.hasTimeOverlap(appointmentStart, appointmentEnd, existingStart, existingEnd, bufferMinutes)) {
        
        // Check team member conflicts
        if (checkTeamMembers && appointment.teamMembers && existingApp.teamMembers) {
          const conflictingMembers = this.findCommonElements(appointment.teamMembers, existingApp.teamMembers);
          
          conflictingMembers.forEach(memberId => {
            conflicts.push({
              type: 'team',
              severity: 'error',
              resource: `Teammitglied ${memberId}`,
              resourceId: memberId,
              conflictingAppointment: existingApp,
              message: `Teammitglied ${memberId} ist bereits für "${existingApp.title}" von ${existingApp.startTime} bis ${existingApp.endTime} eingeplant.`,
              suggestion: 'Wählen Sie ein anderes Teammitglied oder verschieben Sie den Termin.'
            });
          });
        }

        // Check equipment conflicts
        if (checkEquipment && appointment.equipment && existingApp.equipment) {
          const conflictingEquipment = this.findCommonElements(appointment.equipment, existingApp.equipment);
          
          conflictingEquipment.forEach(equipmentId => {
            conflicts.push({
              type: 'equipment',
              severity: 'error',
              resource: `Ausrüstung ${equipmentId}`,
              resourceId: equipmentId,
              conflictingAppointment: existingApp,
              message: `Ausrüstung ${equipmentId} ist bereits für "${existingApp.title}" von ${existingApp.startTime} bis ${existingApp.endTime} reserviert.`,
              suggestion: 'Wählen Sie alternative Ausrüstung oder verschieben Sie den Termin.'
            });
          });
        }

        // Check location conflicts for site visits
        if (appointment.type === 'site-visit' && existingApp.type === 'site-visit' && 
            appointment.location && existingApp.location &&
            appointment.location.toLowerCase() === existingApp.location.toLowerCase()) {
          warnings.push({
            type: 'location',
            severity: 'warning',
            resource: `Standort ${appointment.location}`,
            resourceId: appointment.location,
            conflictingAppointment: existingApp,
            message: `Potenzielle Überschneidung am gleichen Standort: "${existingApp.title}" findet zur gleichen Zeit statt.`,
            suggestion: 'Prüfen Sie, ob beide Termine am selben Ort durchführbar sind.'
          });
        }

        // General time overlap warning if no specific resource conflicts
        if (conflicts.length === 0 && appointment.projectId === existingApp.projectId) {
          warnings.push({
            type: 'time_overlap',
            severity: 'warning',
            resource: 'Zeitraum',
            resourceId: 'time',
            conflictingAppointment: existingApp,
            message: `Zeitliche Überschneidung mit "${existingApp.title}" im gleichen Projekt.`,
            suggestion: 'Prüfen Sie, ob beide Termine gleichzeitig durchführbar sind.'
          });
        }
      }
    });

    // Generate suggestions based on conflicts
    if (conflicts.length > 0) {
      suggestions.push('Beheben Sie die Konflikte, bevor Sie den Termin speichern.');
      
      if (conflicts.some(c => c.type === 'team')) {
        suggestions.push('Verfügbare Teammitglieder für diesen Zeitraum auswählen.');
      }
      
      if (conflicts.some(c => c.type === 'equipment')) {
        suggestions.push('Alternative Ausrüstung prüfen oder Ausrüstung zu einem anderen Zeitpunkt reservieren.');
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      warnings,
      suggestions: suggestions.length > 0 ? suggestions : this.generateOptimizationSuggestions(appointment, sameDateAppointments)
    };
  }

  static getTeamMemberAvailability(
    memberId: string,
    date: string,
    allAppointments: StoredAppointment[]
  ): { available: boolean; busySlots: Array<{ start: string; end: string; appointment: StoredAppointment }> } {
    const sameDateAppointments = allAppointments.filter(app => 
      app.date === date && 
      app.teamMembers.includes(memberId)
    );

    const busySlots = sameDateAppointments.map(app => ({
      start: app.startTime,
      end: app.endTime,
      appointment: app
    }));

    return {
      available: busySlots.length === 0,
      busySlots
    };
  }

  static getEquipmentAvailability(
    equipmentId: string,
    date: string,
    allAppointments: StoredAppointment[]
  ): { available: boolean; busySlots: Array<{ start: string; end: string; appointment: StoredAppointment }> } {
    const sameDateAppointments = allAppointments.filter(app => 
      app.date === date && 
      app.equipment.includes(equipmentId)
    );

    const busySlots = sameDateAppointments.map(app => ({
      start: app.startTime,
      end: app.endTime,
      appointment: app
    }));

    return {
      available: busySlots.length === 0,
      busySlots
    };
  }

  static suggestAlternativeTimeSlots(
    appointment: Partial<StoredAppointment>,
    allAppointments: StoredAppointment[],
    durationMinutes: number = 60
  ): Array<{ start: string; end: string; score: number }> {
    if (!appointment.date) return [];

    const workingHours = { start: '08:00', end: '18:00' };
    const timeSlots: Array<{ start: string; end: string; score: number }> = [];
    
    // Generate 30-minute intervals during working hours
    const startTime = this.parseTime(appointment.date, workingHours.start);
    const endTime = this.parseTime(appointment.date, workingHours.end);
    
    // Convert dates to timestamps for arithmetic operations
    const startTimestamp = startTime.getTime();
    const endTimestamp = endTime.getTime();
    const durationMs = durationMinutes * 60 * 1000;
    const intervalMs = 30 * 60 * 1000; // 30 minutes
    
    for (let timestamp = startTimestamp; timestamp <= endTimestamp - durationMs; timestamp += intervalMs) {
      const slotStart = this.formatTime(new Date(timestamp));
      const slotEnd = this.formatTime(new Date(timestamp + durationMs));
      
      const testAppointment = {
        ...appointment,
        startTime: slotStart,
        endTime: slotEnd
      };
      
      const analysis = this.detectConflicts(testAppointment, allAppointments);
      
      if (!analysis.hasConflicts) {
        const score = this.calculateTimeSlotScore(slotStart, analysis.warnings.length);
        timeSlots.push({ start: slotStart, end: slotEnd, score });
      }
    }

    return timeSlots.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  private static hasTimeOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date,
    bufferMinutes: number = 0
  ): boolean {
    const buffer = bufferMinutes * 60 * 1000;
    const start1Buffered = start1.getTime() - buffer;
    const end1Buffered = end1.getTime() + buffer;
    const start2Buffered = start2.getTime() - buffer;
    const end2Buffered = end2.getTime() + buffer;

    return start1Buffered < end2Buffered && start2Buffered < end1Buffered;
  }

  private static parseTime(date: string, time: string): Date {
    return new Date(`${date}T${time}:00`);
  }

  private static formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  private static findCommonElements<T>(array1: T[], array2: T[]): T[] {
    return array1.filter(item => array2.includes(item));
  }

  private static calculateTimeSlotScore(timeSlot: string, warningCount: number): number {
    const hour = parseInt(timeSlot.split(':')[0]);
    let score = 100;
    
    // Prefer morning slots
    if (hour >= 9 && hour <= 11) score += 20;
    else if (hour >= 14 && hour <= 16) score += 10;
    
    // Penalize very early or late slots
    if (hour < 8 || hour > 17) score -= 30;
    
    // Penalize warnings
    score -= warningCount * 10;
    
    return Math.max(0, score);
  }

  private static generateOptimizationSuggestions(
    appointment: Partial<StoredAppointment>,
    sameDateAppointments: StoredAppointment[]
  ): string[] {
    const suggestions: string[] = [];
    
    if (sameDateAppointments.length === 0) {
      suggestions.push('Keine Konflikte erkannt. Der Termin kann wie geplant erstellt werden.');
      return suggestions;
    }

    if (appointment.type === 'site-visit') {
      suggestions.push('Bei Baustellenbesuchen ausreichend Reisezeit zwischen Terminen einplanen.');
    }

    if (appointment.teamMembers && appointment.teamMembers.length > 3) {
      suggestions.push('Bei großen Teams frühzeitig die Verfügbarkeit aller Mitglieder prüfen.');
    }

    suggestions.push('Pufferzeiten zwischen Terminen für optimale Planung berücksichtigen.');
    
    return suggestions;
  }

  static getConflictSummary(analysis: ConflictAnalysis): string {
    if (!analysis.hasConflicts && analysis.warnings.length === 0) {
      return 'Keine Konflikte gefunden';
    }

    const parts: string[] = [];
    
    if (analysis.conflicts.length > 0) {
      parts.push(`${analysis.conflicts.length} Konflikt${analysis.conflicts.length === 1 ? '' : 'e'}`);
    }
    
    if (analysis.warnings.length > 0) {
      parts.push(`${analysis.warnings.length} Warnung${analysis.warnings.length === 1 ? '' : 'en'}`);
    }
    
    return parts.join(', ');
  }
}
