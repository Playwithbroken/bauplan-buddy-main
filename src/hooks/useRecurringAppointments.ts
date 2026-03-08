import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppointmentService, StoredAppointment } from '@/services/appointmentService';
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

interface UseRecurringAppointmentsOptions {
  currentDate: Date;
  rangeMonths?: number; // How many months before/after to generate occurrences
}

interface RecurringAppointmentsResult {
  appointments: StoredAppointment[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to manage appointments including recurring appointment occurrences
 * Generates recurring appointment instances for display on calendar
 */
export function useRecurringAppointments({
  currentDate,
  rangeMonths = 2
}: UseRecurringAppointmentsOptions): RecurringAppointmentsResult {
  
  // Calculate date range for recurring appointment generation
  const dateRange = useMemo(() => {
    const startDate = startOfMonth(subMonths(currentDate, rangeMonths));
    const endDate = endOfMonth(addMonths(currentDate, rangeMonths));
    return { startDate, endDate };
  }, [currentDate, rangeMonths]);

  // Query to fetch appointments with recurring occurrences
  const {
    data: appointments = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['appointments', 'recurring', dateRange.startDate.toISOString(), dateRange.endDate.toISOString()],
    queryFn: async () => {
      try {
        const allAppointments = await AppointmentService.getAllAppointmentsWithRecurrence(
          dateRange.startDate,
          dateRange.endDate
        );
        
        console.log(`Loaded ${allAppointments.length} appointments (including recurring) for ${dateRange.startDate.toDateString()} to ${dateRange.endDate.toDateString()}`);
        
        return allAppointments;
      } catch (error) {
        console.error('Error loading recurring appointments:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });

  return {
    appointments: appointments || [],
    isLoading,
    error: error as Error | null,
    refetch
  };
}

/**
 * Hook to get appointments for a specific date (including recurring)
 */
export function useAppointmentsForDate(date: Date): StoredAppointment[] {
  const [appointments, setAppointments] = useState<StoredAppointment[]>([]);
  
  useEffect(() => {
    const loadAppointmentsForDate = async () => {
      try {
        const dateString = date.toISOString().split('T')[0];
        
        // Get appointments for the specific date including recurring occurrences
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        const allAppointments = await AppointmentService.getAllAppointmentsWithRecurrence(
          startDate,
          endDate
        );
        
        // Filter to only appointments for this specific date
        const dayAppointments = allAppointments.filter(app => app.date === dateString);
        
        setAppointments(dayAppointments);
      } catch (error) {
        console.error('Error loading appointments for date:', error);
        setAppointments([]);
      }
    };
    
    loadAppointmentsForDate();
  }, [date]);
  
  return appointments;
}

/**
 * Utility to check if an appointment is a recurring appointment
 */
export function isRecurringAppointment(appointment: StoredAppointment | null): boolean {
  if (!appointment) return false;
  return Boolean(appointment.isRecurring || appointment.recurrenceId || appointment.seriesId);
}

/**
 * Utility to check if an appointment is part of a recurring series
 */
export function isRecurrenceOccurrence(appointment: StoredAppointment | null): boolean {
  if (!appointment) return false;
  return Boolean(appointment.recurrenceId && appointment.seriesId);
}

/**
 * Utility to get the master appointment ID for a recurring series
 */
export function getMasterAppointmentId(appointment: StoredAppointment | null): string | null {
  if (!appointment) return null;
  if (appointment.recurrenceId) {
    return appointment.recurrenceId;
  }
  if (appointment.isRecurring && !appointment.recurrenceId) {
    return appointment.id; // This is the master appointment
  }
  return null;
}

/**
 * Utility to get recurrence info for display
 */
export function getRecurrenceInfo(appointment: StoredAppointment | null): {
  isRecurring: boolean;
  isMaster: boolean;
  isOccurrence: boolean;
  seriesId: string | null;
  masterId: string | null;
} {
  if (!appointment) {
    return {
      isRecurring: false,
      isMaster: false,
      isOccurrence: false,
      seriesId: null,
      masterId: null
    };
  }
  
  const isRecurring = isRecurringAppointment(appointment);
  const isOccurrence = isRecurrenceOccurrence(appointment);
  const isMaster = isRecurring && !isOccurrence;
  
  return {
    isRecurring,
    isMaster,
    isOccurrence,
    seriesId: appointment.seriesId || null,
    masterId: getMasterAppointmentId(appointment)
  };
}