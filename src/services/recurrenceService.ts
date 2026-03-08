import { addDays, addWeeks, addMonths, isBefore, isAfter, format, startOfDay, endOfDay } from 'date-fns';
import { StoredAppointment } from './appointmentService';

// Recurrence pattern types
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type MonthlyType = 'date' | 'weekday'; // e.g., "15th of month" vs "2nd Tuesday of month"
export type EndType = 'never' | 'after' | 'on';

// Recurrence pattern interface
export interface RecurrencePattern {
  type: RecurrenceType;
  interval: number; // Every X days/weeks/months (e.g., every 2 weeks)
  
  // Weekly recurrence options
  weekDays?: WeekDay[]; // Which days of the week to repeat
  
  // Monthly recurrence options
  monthlyType?: MonthlyType;
  dayOfMonth?: number; // For date-based monthly (e.g., 15th of every month)
  weekOfMonth?: number; // For weekday-based monthly (e.g., 2nd Tuesday)
  weekDay?: WeekDay; // For weekday-based monthly
  
  // End conditions
  endType: EndType;
  endDate?: string; // ISO date string
  occurrences?: number; // Number of occurrences
}

// Extended appointment interface with recurrence
export interface RecurringAppointment extends Omit<StoredAppointment, 'id'> {
  id: string;
  recurrencePattern?: RecurrencePattern;
  recurrenceId?: string; // ID of the original recurring appointment
  isRecurring: boolean;
  seriesId?: string; // Unique ID for the entire series
  originalDate?: string; // Original date for exceptions/modifications
}

// Generated occurrence from a recurring appointment
export interface AppointmentOccurrence extends StoredAppointment {
  recurrenceId: string; // ID of the original recurring appointment
  seriesId: string; // ID of the entire series
  occurrenceDate: string; // Date of this specific occurrence
  isRecurring: true;
  isModified?: boolean; // Whether this occurrence has been modified
}

// Recurrence exception (modified or cancelled occurrence)
export interface RecurrenceException {
  id: string;
  seriesId: string;
  originalDate: string; // ISO date string of the original occurrence
  type: 'modified' | 'cancelled';
  modifiedAppointment?: Partial<StoredAppointment>; // Modified appointment data
  createdAt: string;
}

// Recurrence generation options
export interface RecurrenceGenerationOptions {
  startDate: Date;
  endDate: Date;
  maxOccurrences?: number; // Limit number of generated occurrences
  includeExceptions?: boolean; // Whether to apply exceptions
}

// Recurrence statistics
export interface RecurrenceStats {
  totalOccurrences: number;
  upcomingOccurrences: number;
  completedOccurrences: number;
  modifiedException: number;
  cancelledExceptions: number;
  nextOccurrence?: Date;
  lastOccurrence?: Date;
}

/**
 * Service for managing appointment recurrence patterns
 */
export class RecurrenceService {
  private static readonly RECURRENCE_EXCEPTIONS_KEY = 'bauplan-buddy-recurrence-exceptions';
  
  /**
   * Generate occurrences from a recurring appointment pattern
   */
  static generateOccurrences(
    baseAppointment: RecurringAppointment,
    options: RecurrenceGenerationOptions
  ): AppointmentOccurrence[] {
    if (!baseAppointment.recurrencePattern || !baseAppointment.isRecurring) {
      return [];
    }
    
    const occurrences: AppointmentOccurrence[] = [];
    const pattern = baseAppointment.recurrencePattern;
    let currentDate = new Date(baseAppointment.date);
    let occurrenceCount = 0;
    
    // Ensure we start from the range start date
    if (isBefore(currentDate, options.startDate)) {
      currentDate = new Date(options.startDate);
    }
    
    while (
      isBefore(currentDate, options.endDate) && 
      (options.maxOccurrences === undefined || occurrenceCount < options.maxOccurrences)
    ) {
      // Check if we should generate this occurrence
      if (this.shouldGenerateOccurrence(currentDate, baseAppointment, pattern)) {
        // Check end conditions
        if (!this.isWithinEndConditions(currentDate, baseAppointment, pattern, occurrenceCount)) {
          break;
        }
        
        const occurrence = this.createOccurrence(baseAppointment, currentDate);
        occurrences.push(occurrence);
        occurrenceCount++;
      }
      
      // Move to next potential date
      currentDate = this.getNextRecurrenceDate(currentDate, pattern);
      
      // Safety check to prevent infinite loops
      if (occurrenceCount > 1000) {
        console.warn('Recurrence generation stopped: too many occurrences');
        break;
      }
    }
    
    return occurrences;
  }
  
  /**
   * Check if an occurrence should be generated for a given date
   */
  private static shouldGenerateOccurrence(
    date: Date,
    baseAppointment: RecurringAppointment,
    pattern: RecurrencePattern
  ): boolean {
    const baseDate = new Date(baseAppointment.date);
    
    switch (pattern.type) {
      case 'daily': {
        const daysDiff = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff % pattern.interval === 0;
      }
        
      case 'weekly': {
        const weeksDiff = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        if (weeksDiff < 0 || weeksDiff % pattern.interval !== 0) return false;
        
        if (pattern.weekDays && pattern.weekDays.length > 0) {
          const dayOfWeek = this.getWeekDayFromDate(date);
          return pattern.weekDays.includes(dayOfWeek);
        }
        
        return this.getWeekDayFromDate(date) === this.getWeekDayFromDate(baseDate);
      }
        
      case 'monthly': {
        const monthsDiff = (date.getFullYear() - baseDate.getFullYear()) * 12 + 
                          (date.getMonth() - baseDate.getMonth());
        if (monthsDiff < 0 || monthsDiff % pattern.interval !== 0) return false;
        
        if (pattern.monthlyType === 'date') {
          return date.getDate() === (pattern.dayOfMonth || baseDate.getDate());
        } else if (pattern.monthlyType === 'weekday') {
          // Check if it's the same weekday and week of month
          const weekOfMonth = Math.ceil(date.getDate() / 7);
          const dayOfWeek = this.getWeekDayFromDate(date);
          return weekOfMonth === (pattern.weekOfMonth || Math.ceil(baseDate.getDate() / 7)) &&
                 dayOfWeek === (pattern.weekDay || this.getWeekDayFromDate(baseDate));
        }
        
        return date.getDate() === baseDate.getDate();
      }
        
      default:
        return false;
    }
  }
  
  /**
   * Check if the date is within the end conditions of the recurrence
   */
  private static isWithinEndConditions(
    date: Date,
    baseAppointment: RecurringAppointment,
    pattern: RecurrencePattern,
    occurrenceCount: number
  ): boolean {
    switch (pattern.endType) {
      case 'never':
        return true;
        
      case 'after':
        return pattern.occurrences ? occurrenceCount < pattern.occurrences : true;
        
      case 'on':
        return pattern.endDate ? !isAfter(date, new Date(pattern.endDate)) : true;
        
      default:
        return true;
    }
  }
  
  /**
   * Get the next potential recurrence date
   */
  private static getNextRecurrenceDate(currentDate: Date, pattern: RecurrencePattern): Date {
    switch (pattern.type) {
      case 'daily':
        return addDays(currentDate, 1);
        
      case 'weekly':
        return addDays(currentDate, 1); // Check every day for weekly patterns with specific weekdays
        
      case 'monthly':
        return addDays(currentDate, 1); // Check every day for monthly patterns
        
      default:
        return addDays(currentDate, 1);
    }
  }
  
  /**
   * Create an occurrence from a base appointment and date
   */
  private static createOccurrence(
    baseAppointment: RecurringAppointment,
    occurrenceDate: Date
  ): AppointmentOccurrence {
    const baseDate = new Date(baseAppointment.date);
    const timeDiff = occurrenceDate.getTime() - startOfDay(baseDate).getTime();
    
    // Preserve the time of day from the original appointment
    const [hours, minutes] = baseAppointment.startTime.split(':').map(Number);
    const [endHours, endMinutes] = baseAppointment.endTime.split(':').map(Number);
    
    const occurrenceStart = new Date(occurrenceDate);
    occurrenceStart.setHours(hours, minutes, 0, 0);
    
    const occurrenceEnd = new Date(occurrenceDate);
    occurrenceEnd.setHours(endHours, endMinutes, 0, 0);
    
    return {
      ...baseAppointment,
      id: `${baseAppointment.seriesId || baseAppointment.id}-${format(occurrenceDate, 'yyyy-MM-dd')}`,
      date: format(occurrenceDate, 'yyyy-MM-dd'),
      recurrenceId: baseAppointment.id,
      seriesId: baseAppointment.seriesId || baseAppointment.id,
      occurrenceDate: format(occurrenceDate, 'yyyy-MM-dd'),
      isRecurring: true,
      updatedAt: new Date().toISOString()
    };
  }
  
  /**
   * Get weekday name from Date object
   */
  private static getWeekDayFromDate(date: Date): WeekDay {
    const days: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }
  
  /**
   * Create a recurrence pattern with default values
   */
  static createDefaultPattern(type: RecurrenceType = 'none'): RecurrencePattern {
    return {
      type,
      interval: 1,
      endType: 'never'
    };
  }
  
  /**
   * Validate a recurrence pattern
   */
  static validatePattern(pattern: RecurrencePattern): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (pattern.interval < 1) {
      errors.push('Interval must be at least 1');
    }
    
    if (pattern.type === 'weekly' && pattern.weekDays && pattern.weekDays.length === 0) {
      errors.push('Weekly recurrence must specify at least one weekday');
    }
    
    if (pattern.type === 'monthly' && pattern.monthlyType === 'date') {
      if (!pattern.dayOfMonth || pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31) {
        errors.push('Day of month must be between 1 and 31');
      }
    }
    
    if (pattern.type === 'monthly' && pattern.monthlyType === 'weekday') {
      if (!pattern.weekOfMonth || pattern.weekOfMonth < 1 || pattern.weekOfMonth > 5) {
        errors.push('Week of month must be between 1 and 5');
      }
      if (!pattern.weekDay) {
        errors.push('Weekday must be specified for weekday-based monthly recurrence');
      }
    }
    
    if (pattern.endType === 'after') {
      if (!pattern.occurrences || pattern.occurrences < 1) {
        errors.push('Number of occurrences must be at least 1');
      }
    }
    
    if (pattern.endType === 'on') {
      if (!pattern.endDate) {
        errors.push('End date must be specified');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get recurrence exceptions
   */
  static getRecurrenceExceptions(): RecurrenceException[] {
    try {
      const stored = localStorage.getItem(this.RECURRENCE_EXCEPTIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading recurrence exceptions:', error);
      return [];
    }
  }
  
  /**
   * Add a recurrence exception
   */
  static addException(exception: RecurrenceException): void {
    try {
      const exceptions = this.getRecurrenceExceptions();
      exceptions.push(exception);
      localStorage.setItem(this.RECURRENCE_EXCEPTIONS_KEY, JSON.stringify(exceptions));
    } catch (error) {
      console.error('Error adding recurrence exception:', error);
    }
  }
  
  /**
   * Remove a recurrence exception
   */
  static removeException(exceptionId: string): void {
    try {
      const exceptions = this.getRecurrenceExceptions().filter(ex => ex.id !== exceptionId);
      localStorage.setItem(this.RECURRENCE_EXCEPTIONS_KEY, JSON.stringify(exceptions));
    } catch (error) {
      console.error('Error removing recurrence exception:', error);
    }
  }
  
  /**
   * Get statistics for a recurring appointment series
   */
  static getRecurrenceStats(
    seriesId: string,
    appointments: AppointmentOccurrence[]
  ): RecurrenceStats {
    const seriesAppointments = appointments.filter(apt => apt.seriesId === seriesId);
    const exceptions = this.getRecurrenceExceptions().filter(ex => ex.seriesId === seriesId);
    const now = new Date();
    
    const upcoming = seriesAppointments.filter(apt => isAfter(new Date(apt.date), now));
    const completed = seriesAppointments.filter(apt => isBefore(new Date(apt.date), now));
    
    const nextOccurrence = upcoming.length > 0 ? 
      new Date(Math.min(...upcoming.map(apt => new Date(apt.date).getTime()))) : 
      undefined;
      
    const lastOccurrence = completed.length > 0 ? 
      new Date(Math.max(...completed.map(apt => new Date(apt.date).getTime()))) : 
      undefined;
    
    return {
      totalOccurrences: seriesAppointments.length,
      upcomingOccurrences: upcoming.length,
      completedOccurrences: completed.length,
      modifiedException: exceptions.filter(ex => ex.type === 'modified').length,
      cancelledExceptions: exceptions.filter(ex => ex.type === 'cancelled').length,
      nextOccurrence,
      lastOccurrence
    };
  }
  
  /**
   * Generate a human-readable description of a recurrence pattern
   */
  static getRecurrenceDescription(pattern: RecurrencePattern): string {
    if (pattern.type === 'none') {
      return 'Kein Serientermin';
    }
    
    let description = '';
    
    switch (pattern.type) {
      case 'daily':
        description = pattern.interval === 1 ? 'Täglich' : `Alle ${pattern.interval} Tage`;
        break;
        
      case 'weekly':
        if (pattern.interval === 1) {
          if (pattern.weekDays && pattern.weekDays.length > 0) {
            const dayNames = pattern.weekDays.map(day => this.getWeekDayDisplayName(day));
            description = `Wöchentlich am ${dayNames.join(', ')}`;
          } else {
            description = 'Wöchentlich';
          }
        } else {
          description = `Alle ${pattern.interval} Wochen`;
          if (pattern.weekDays && pattern.weekDays.length > 0) {
            const dayNames = pattern.weekDays.map(day => this.getWeekDayDisplayName(day));
            description += ` am ${dayNames.join(', ')}`;
          }
        }
        break;
        
      case 'monthly':
        if (pattern.interval === 1) {
          if (pattern.monthlyType === 'weekday' && pattern.weekOfMonth && pattern.weekDay) {
            const ordinal = this.getOrdinalNumber(pattern.weekOfMonth);
            const dayName = this.getWeekDayDisplayName(pattern.weekDay);
            description = `Monatlich am ${ordinal} ${dayName}`;
          } else {
            description = `Monatlich am ${pattern.dayOfMonth || 1}.`;
          }
        } else {
          description = `Alle ${pattern.interval} Monate`;
        }
        break;
        
      case 'yearly':
        description = pattern.interval === 1 ? 'Jährlich' : `Alle ${pattern.interval} Jahre`;
        break;
    }
    
    // Add end condition
    switch (pattern.endType) {
      case 'after':
        description += `, endet nach ${pattern.occurrences} Terminen`;
        break;
      case 'on':
        if (pattern.endDate) {
          description += `, endet am ${format(new Date(pattern.endDate), 'dd.MM.yyyy')}`;
        }
        break;
    }
    
    return description;
  }
  
  /**
   * Get display name for weekday
   */
  private static getWeekDayDisplayName(weekDay: WeekDay): string {
    const names: Record<WeekDay, string> = {
      monday: 'Montag',
      tuesday: 'Dienstag',
      wednesday: 'Mittwoch',
      thursday: 'Donnerstag',
      friday: 'Freitag',
      saturday: 'Samstag',
      sunday: 'Sonntag'
    };
    return names[weekDay];
  }
  
  /**
   * Get ordinal number (1st, 2nd, etc.) in German
   */
  private static getOrdinalNumber(num: number): string {
    const ordinals = ['ersten', 'zweiten', 'dritten', 'vierten', 'fünften'];
    return ordinals[num - 1] || `${num}.`;
  }
}