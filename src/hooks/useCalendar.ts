import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import calendarApi from '@/services/calendarApi';
import {
  CalendarEvent,
  CreateEventData,
  UpdateEventData,
  EventFilters,
  TeamMember,
  CalendarViewType,
} from '@/types/calendar';

// Query Keys
export const CALENDAR_QUERY_KEYS = {
  events: ['calendar', 'events'] as const,
  event: (id: string) => ['calendar', 'events', id] as const,
  teamMembers: ['calendar', 'team'] as const,
  teamMemberEvents: (id: string) => ['calendar', 'team', id, 'events'] as const,
  projectEvents: (id: string) => ['calendar', 'projects', id, 'events'] as const,
  customerEvents: (id: string) => ['calendar', 'customers', id, 'events'] as const,
  eventStats: ['calendar', 'stats'] as const,
} as const;

// Main calendar hook
export function useCalendar(initialFilters?: EventFilters) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<EventFilters>(initialFilters || {});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeView, setActiveView] = useState<CalendarViewType>('month');

  // Fetch events with filters
  const {
    data: events = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...CALENDAR_QUERY_KEYS.events, filters],
    queryFn: () => calendarApi.getEvents(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<EventFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Calendar navigation helpers
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    const amount = activeView === 'month' ? 30 : activeView === 'week' ? 7 : 1;
    const multiplier = direction === 'next' ? 1 : -1;
    
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + (amount * multiplier));
      return newDate;
    });
  }, [activeView]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  }, []);

  return {
    // Data
    events,
    isLoading,
    error,
    
    // State
    filters,
    currentDate,
    selectedDate,
    activeView,
    
    // Actions
    updateFilters,
    clearFilters,
    refetch,
    setCurrentDate,
    setSelectedDate,
    setActiveView,
    navigateDate,
    goToToday,
  };
}

// Hook for creating events
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventData: CreateEventData) => calendarApi.createEvent(eventData),
    onSuccess: (newEvent) => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEYS.events });
      
      // Update cache with new event
      queryClient.setQueryData(CALENDAR_QUERY_KEYS.event(newEvent.id), newEvent);
      
      toast({
        title: 'Termin erstellt',
        description: `"${newEvent.title}" wurde erfolgreich erstellt.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Fehler beim Erstellen',
        description: error.message || 'Der Termin konnte nicht erstellt werden.',
      });
    },
  });
}

// Hook for updating events
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventData: UpdateEventData) => calendarApi.updateEvent(eventData),
    onSuccess: (updatedEvent) => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEYS.events });
      
      // Update specific event cache
      queryClient.setQueryData(CALENDAR_QUERY_KEYS.event(updatedEvent.id), updatedEvent);
      
      toast({
        title: 'Termin aktualisiert',
        description: `"${updatedEvent.title}" wurde erfolgreich aktualisiert.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Fehler beim Aktualisieren',
        description: error.message || 'Der Termin konnte nicht aktualisiert werden.',
      });
    },
  });
}

// Hook for deleting events
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => calendarApi.deleteEvent(eventId),
    onSuccess: (_, eventId) => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEYS.events });
      
      // Remove from specific event cache
      queryClient.removeQueries({ queryKey: CALENDAR_QUERY_KEYS.event(eventId) });
      
      toast({
        title: 'Termin gelöscht',
        description: 'Der Termin wurde erfolgreich gelöscht.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Fehler beim Löschen',
        description: error.message || 'Der Termin konnte nicht gelöscht werden.',
      });
    },
  });
}

// Hook for fetching a single event
export function useEvent(eventId: string | undefined, enabled = true) {
  const shouldFetch = Boolean(eventId) && enabled;

  return useQuery({
    queryKey: eventId ? CALENDAR_QUERY_KEYS.event(eventId) : ['calendar', 'events', 'empty'],
    queryFn: () => {
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      return calendarApi.getEvent(eventId);
    },
    enabled: shouldFetch,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for team members
export function useTeamMembers() {
  return useQuery({
    queryKey: CALENDAR_QUERY_KEYS.teamMembers,
    queryFn: () => calendarApi.getTeamMembers(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for team member events
export function useTeamMemberEvents(memberId: string, startDate?: Date, endDate?: Date) {
  const shouldFetch = Boolean(memberId);

  const queryResult = useQuery({
    queryKey: [
      ...(shouldFetch ? CALENDAR_QUERY_KEYS.teamMemberEvents(memberId) : ['calendar', 'team', 'empty', 'events']),
      startDate,
      endDate
    ],
    queryFn: () => {
      if (!memberId) {
        return [];
      }
      return calendarApi.getTeamMemberEvents(memberId, startDate, endDate);
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    ...queryResult,
    data: shouldFetch ? queryResult.data : [],
  };
}

// Hook for project events
export function useProjectEvents(projectId: string) {
  return useQuery({
    queryKey: CALENDAR_QUERY_KEYS.projectEvents(projectId),
    queryFn: () => calendarApi.getProjectEvents(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for customer events
export function useCustomerEvents(customerId: string) {
  return useQuery({
    queryKey: CALENDAR_QUERY_KEYS.customerEvents(customerId),
    queryFn: () => calendarApi.getCustomerEvents(customerId),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for availability checking
export function useAvailabilityCheck() {
  return useMutation({
    mutationFn: ({ startDate, endDate, attendees }: {
      startDate: Date;
      endDate: Date;
      attendees: string[];
    }) => calendarApi.checkAvailability(startDate, endDate, attendees),
  });
}

// Hook for event statistics
export function useEventStats(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: [...CALENDAR_QUERY_KEYS.eventStats, startDate, endDate],
    queryFn: () => calendarApi.getEventStats(startDate, endDate),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Hook for optimistic updates
export function useOptimisticEvents() {
  const queryClient = useQueryClient();

  const addOptimisticEvent = useCallback((tempEvent: CalendarEvent) => {
    queryClient.setQueryData<CalendarEvent[]>(
      CALENDAR_QUERY_KEYS.events,
      (oldEvents = []) => [...oldEvents, tempEvent]
    );
  }, [queryClient]);

  const updateOptimisticEvent = useCallback((eventId: string, updates: Partial<CalendarEvent>) => {
    queryClient.setQueryData<CalendarEvent[]>(
      CALENDAR_QUERY_KEYS.events,
      (oldEvents = []) => 
        oldEvents.map(event => 
          event.id === eventId ? { ...event, ...updates } : event
        )
    );
  }, [queryClient]);

  const removeOptimisticEvent = useCallback((eventId: string) => {
    queryClient.setQueryData<CalendarEvent[]>(
      CALENDAR_QUERY_KEYS.events,
      (oldEvents = []) => oldEvents.filter(event => event.id !== eventId)
    );
  }, [queryClient]);

  return {
    addOptimisticEvent,
    updateOptimisticEvent,
    removeOptimisticEvent,
  };
}
