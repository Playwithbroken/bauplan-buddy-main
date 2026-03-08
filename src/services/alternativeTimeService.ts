import { addMinutes, addHours, addDays, format, parseISO, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';
import { StoredAppointment } from './appointmentService';
import { ConflictDetectionService, ConflictAnalysis } from './conflictDetectionService';

export interface AlternativeTimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  score: number; // 0-100, higher is better
  reason: string;
  conflicts: string[]; // IDs of conflicting appointments (if any)
}

export interface AlternativeTimeOptions {
  maxSuggestions?: number;
  searchDays?: number; // How many days to search forward
  preferredTimeRanges?: Array<{ start: string; end: string }>;
  minimumDuration?: number; // in minutes
  bufferMinutes?: number;
  excludeWeekends?: boolean;
  excludeHours?: Array<{ start: string; end: string }>; // e.g., lunch break, after hours
}

/**
 * Service for generating alternative time suggestions when conflicts are detected
 */
export class AlternativeTimeService {
  private static readonly DEFAULT_WORK_HOURS = { start: '08:00', end: '18:00' };
  private static readonly DEFAULT_LUNCH_BREAK = { start: '12:00', end: '13:00' };
  private static readonly TIME_SLOT_INTERVAL = 30; // minutes

  /**
   * Generate alternative time suggestions for a conflicting appointment
   */
  static generateAlternatives(
    appointment: Partial<StoredAppointment>,
    existingAppointments: StoredAppointment[],
    options: AlternativeTimeOptions = {}
  ): AlternativeTimeSlot[] {
    const {
      maxSuggestions = 5,
      searchDays = 7,
      preferredTimeRanges = [this.DEFAULT_WORK_HOURS],
      minimumDuration = 60,
      bufferMinutes = 15,
      excludeWeekends = true,
      excludeHours = [this.DEFAULT_LUNCH_BREAK]
    } = options;

    const appointmentDuration = this.calculateDuration(appointment.startTime!, appointment.endTime!);
    const suggestions: AlternativeTimeSlot[] = [];
    const baseDate = parseISO(appointment.date!);

    // Search through the next N days
    for (let dayOffset = 0; dayOffset < searchDays && suggestions.length < maxSuggestions * 2; dayOffset++) {
      const currentDate = addDays(baseDate, dayOffset);
      const dateStr = format(currentDate, 'yyyy-MM-dd');

      // Skip weekends if requested
      if (excludeWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
        continue;
      }

      // Generate time slots for this day
      const daySlots = this.generateDaySlots(
        dateStr,
        appointmentDuration,
        preferredTimeRanges,
        excludeHours,
        minimumDuration
      );

      // Score each slot
      for (const slot of daySlots) {
        const testAppointment = { ...appointment, ...slot };
        const conflicts = ConflictDetectionService.detectConflicts(
          testAppointment,
          existingAppointments,
          { bufferMinutes, checkTeamMembers: true, checkEquipment: true }
        );

        const score = this.calculateSlotScore(slot, conflicts, dayOffset, appointment);
        const conflictIds = conflicts.conflicts.map(c => c.conflictingAppointment.id);

        suggestions.push({
          ...slot,
          score,
          reason: this.generateReason(slot, conflicts, dayOffset),
          conflicts: conflictIds
        });
      }
    }

    // Sort by score (descending) and return top suggestions
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);
  }

  /**
   * Generate time slots for a specific day
   */
  private static generateDaySlots(
    date: string,
    duration: number,
    preferredTimeRanges: Array<{ start: string; end: string }>,
    excludeHours: Array<{ start: string; end: string }>,
    minimumDuration: number
  ): Omit<AlternativeTimeSlot, 'score' | 'reason' | 'conflicts'>[] {
    const slots: Omit<AlternativeTimeSlot, 'score' | 'reason' | 'conflicts'>[] = [];

    for (const timeRange of preferredTimeRanges) {
      const startTime = this.parseTime(timeRange.start);
      const endTime = this.parseTime(timeRange.end);

      // Generate slots at regular intervals
      for (let currentTime = startTime; currentTime + duration <= endTime; currentTime += this.TIME_SLOT_INTERVAL) {
        const slotStart = this.formatTime(currentTime);
        const slotEnd = this.formatTime(currentTime + duration);

        // Check if this slot overlaps with excluded hours
        if (!this.isTimeInExcludedRanges(slotStart, slotEnd, excludeHours)) {
          slots.push({
            date,
            startTime: slotStart,
            endTime: slotEnd
          });
        }
      }
    }

    return slots;
  }

  /**
   * Calculate a score for a time slot (0-100)
   */
  private static calculateSlotScore(
    slot: Omit<AlternativeTimeSlot, 'score' | 'reason' | 'conflicts'>,
    conflicts: ConflictAnalysis,
    dayOffset: number,
    originalAppointment: Partial<StoredAppointment>
  ): number {
    let score = 100;

    // Penalty for conflicts
    if (conflicts.hasConflicts) {
      score -= conflicts.conflicts.length * 30;
    }

    // Penalty for being further in the future
    score -= dayOffset * 5;

    // Bonus for being close to original time
    if (slot.date === originalAppointment.date) {
      const originalTime = this.parseTime(originalAppointment.startTime!);
      const slotTime = this.parseTime(slot.startTime);
      const timeDiff = Math.abs(originalTime - slotTime);
      score += Math.max(0, 20 - (timeDiff / 60) * 2); // Closer times get higher scores
    }

    // Bonus for preferred times (e.g., morning appointments)
    const slotHour = parseInt(slot.startTime.split(':')[0]);
    if (slotHour >= 9 && slotHour <= 11) {
      score += 10; // Morning preference
    } else if (slotHour >= 14 && slotHour <= 16) {
      score += 5; // Afternoon preference
    }

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate a human-readable reason for the suggestion
   */
  private static generateReason(
    slot: Omit<AlternativeTimeSlot, 'score' | 'reason' | 'conflicts'>,
    conflicts: ConflictAnalysis,
    dayOffset: number
  ): string {
    if (!conflicts.hasConflicts) {
      if (dayOffset === 0) {
        return 'Verfügbar am gleichen Tag';
      } else if (dayOffset === 1) {
        return 'Verfügbar am nächsten Tag';
      } else {
        return `Verfügbar in ${dayOffset} Tagen`;
      }
    } else {
      return `${conflicts.conflicts.length} Konflikt(e) - möglicherweise lösbar`;
    }
  }

  /**
   * Check if a time range overlaps with excluded hours
   */
  private static isTimeInExcludedRanges(
    startTime: string,
    endTime: string,
    excludeHours: Array<{ start: string; end: string }>
  ): boolean {
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);

    return excludeHours.some(exclude => {
      const excludeStart = this.parseTime(exclude.start);
      const excludeEnd = this.parseTime(exclude.end);

      // Check for overlap
      return (start < excludeEnd && end > excludeStart);
    });
  }

  /**
   * Calculate duration between two times in minutes
   */
  private static calculateDuration(startTime: string, endTime: string): number {
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);
    return end - start;
  }

  /**
   * Parse time string (HH:MM) to minutes since midnight
   */
  private static parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Format minutes since midnight to time string (HH:MM)
   */
  private static formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Get next available time slot starting from a specific time
   */
  static getNextAvailableSlot(
    fromDateTime: string,
    duration: number,
    existingAppointments: StoredAppointment[],
    options: Partial<AlternativeTimeOptions> = {}
  ): AlternativeTimeSlot | null {
    const alternatives = this.generateAlternatives(
      {
        date: fromDateTime.split('T')[0],
        startTime: fromDateTime.split('T')[1] || '09:00',
        endTime: this.formatTime(this.parseTime(fromDateTime.split('T')[1] || '09:00') + duration),
      },
      existingAppointments,
      { ...options, maxSuggestions: 1 }
    );

    return alternatives.length > 0 ? alternatives[0] : null;
  }

  /**
   * Find the optimal time for multiple appointments
   */
  static findOptimalTimeForGroup(
    appointments: Partial<StoredAppointment>[],
    existingAppointments: StoredAppointment[],
    options: AlternativeTimeOptions = {}
  ): AlternativeTimeSlot[] {
    // This is a more complex algorithm that could be implemented
    // for scheduling multiple related appointments optimally
    // For now, return individual suggestions for each appointment
    return appointments.map(appointment => 
      this.generateAlternatives(appointment, existingAppointments, { ...options, maxSuggestions: 1 })[0]
    ).filter(Boolean);
  }
}