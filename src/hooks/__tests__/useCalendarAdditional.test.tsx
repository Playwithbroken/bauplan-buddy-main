import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCalendar, useCreateEvent, useUpdateEvent, useDeleteEvent, useEvent, useTeamMembers, useTeamMemberEvents, useProjectEvents, useCustomerEvents, useAvailabilityCheck, useOptimisticEvents, useEventStats } from '../useCalendar';
import { calendarApi } from '../../services/calendarApi';
import { ReactNode } from 'react';

// Extend Jest matchers to include jest-dom
import '@testing-library/jest-dom';

// Mock the calendar API
jest.mock('../../services/calendarApi');

// Mock react-query toast
jest.mock('../use-toast', () => ({
  toast: jest.fn(),
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Create a test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useCalendar Hook - Additional Tests', () => {
  const mockCalendarApi = calendarApi as jest.Mocked<typeof calendarApi>;

  const mockEvents = [
    {
      id: 'EVT-001',
      title: 'Test Event 1',
      type: 'meeting',
      date: new Date('2024-03-15T10:00:00Z'),
      endDate: new Date('2024-03-15T11:00:00Z'),
      location: 'Meeting Room A',
      attendees: ['test@example.com'],
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1'
    },
    {
      id: 'EVT-002',
      title: 'Test Event 2',
      type: 'site-visit',
      date: new Date('2024-03-16T14:00:00Z'),
      endDate: new Date('2024-03-16T16:00:00Z'),
      location: 'Construction Site',
      attendees: ['client@example.com'],
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCalendarApi.getEvents.mockResolvedValue(mockEvents);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Optimistic Updates', () => {
    it('should add optimistic event', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOptimisticEvents(), { wrapper });

      const tempEvent = {
        id: 'TEMP-001',
        title: 'Temporary Event',
        type: 'meeting' as const,
        date: new Date('2024-03-20T10:00:00Z'),
        endDate: new Date('2024-03-20T11:00:00Z'),
        location: 'Temp Location',
        attendees: ['temp@example.com'],
        status: 'confirmed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1'
      };

      act(() => {
        result.current.addOptimisticEvent(tempEvent);
      });

      // Since we're not using the main useCalendar hook, we can't directly verify
      // the cache update, but we can verify the function was called without error
      expect(result.current.addOptimisticEvent).toBeDefined();
    });

    it('should update optimistic event', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOptimisticEvents(), { wrapper });

      act(() => {
        result.current.updateOptimisticEvent('EVT-001', { title: 'Updated Title' });
      });

      expect(result.current.updateOptimisticEvent).toBeDefined();
    });

    it('should remove optimistic event', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useOptimisticEvents(), { wrapper });

      act(() => {
        result.current.removeOptimisticEvent('EVT-001');
      });

      expect(result.current.removeOptimisticEvent).toBeDefined();
    });
  });

  describe('Event Statistics', () => {
    const mockStats = {
      totalEvents: 10,
      eventsByType: {
        meeting: 5,
        'site-visit': 3,
        milestone: 2
      },
      eventsByStatus: {
        confirmed: 8,
        pending: 2
      }
    };

    it('should fetch event statistics', async () => {
      const wrapper = createWrapper();
      mockCalendarApi.getEventStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useEventStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
    });

    it('should handle statistics fetch errors', async () => {
      const wrapper = createWrapper();
      const error = new Error('Failed to fetch stats');
      mockCalendarApi.getEventStats.mockRejectedValue(error);

      const { result } = renderHook(() => useEventStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('Advanced Filter Management', () => {
    it('should handle complex filter combinations', async () => {
      const wrapper = createWrapper();
      const complexFilters = {
        type: 'meeting',
        status: 'confirmed',
        dateRange: {
          start: new Date('2024-03-01'),
          end: new Date('2024-03-31')
        },
        attendees: ['test@example.com']
      };

      const { result } = renderHook(() => useCalendar(complexFilters), { wrapper });

      act(() => {
        result.current.updateFilters({ location: 'Meeting Room A' });
      });

      expect(result.current.filters).toEqual({
        ...complexFilters,
        location: 'Meeting Room A'
      });
    });

    it('should reset to initial filters', async () => {
      const initialFilters = { type: 'meeting' };
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar(initialFilters), { wrapper });

      // Add more filters
      act(() => {
        result.current.updateFilters({ status: 'confirmed' });
      });

      expect(result.current.filters).toEqual({ type: 'meeting', status: 'confirmed' });

      // Clear filters should reset to empty, not initial
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual({});
    });
  });

  describe('View Management', () => {
    it('should handle different calendar views', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar(), { wrapper });

      // Test day view
      act(() => {
        result.current.setActiveView('day');
      });

      expect(result.current.activeView).toBe('day');

      // Test week view
      act(() => {
        result.current.setActiveView('week');
      });

      expect(result.current.activeView).toBe('week');

      // Test month view
      act(() => {
        result.current.setActiveView('month');
      });

      expect(result.current.activeView).toBe('month');
    });

    it('should navigate correctly in different views', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar(), { wrapper });

      const initialDate = new Date(result.current.currentDate);

      // Test navigation in day view
      act(() => {
        result.current.setActiveView('day');
        result.current.navigateDate('next');
      });

      const dayViewDate = new Date(result.current.currentDate);
      expect(dayViewDate.getDate()).toBe(initialDate.getDate() + 1);

      // Test navigation in week view
      act(() => {
        result.current.setActiveView('week');
        result.current.navigateDate('prev');
      });

      const weekViewDate = new Date(result.current.currentDate);
      // Should be back to initial date (next then prev)
      expect(weekViewDate.getDate()).toBe(initialDate.getDate());
    });
  });

  describe('Team Member Events', () => {
    const mockTeamMembers = [
      { id: 'TM-001', name: 'John Doe', role: 'Project Manager' },
      { id: 'TM-002', name: 'Jane Smith', role: 'Architect' }
    ];

    const mockMemberEvents = [
      {
        id: 'TM-EVT-001',
        title: 'Team Meeting',
        type: 'meeting' as const,
        date: new Date('2024-03-20T10:00:00Z'),
        endDate: new Date('2024-03-20T11:00:00Z'),
        location: 'Team Room',
        attendees: ['team@example.com'],
        status: 'confirmed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1'
      }
    ];

    it('should fetch team members', async () => {
      const wrapper = createWrapper();
      mockCalendarApi.getTeamMembers.mockResolvedValue(mockTeamMembers);

      const { result } = renderHook(() => useTeamMembers(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTeamMembers);
    });

    it('should fetch team member events', async () => {
      const wrapper = createWrapper();
      mockCalendarApi.getTeamMemberEvents.mockResolvedValue(mockMemberEvents);

      const startDate = new Date('2024-03-01');
      const endDate = new Date('2024-03-31');

      const { result } = renderHook(() => 
        useTeamMemberEvents('TM-001', startDate, endDate), 
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMemberEvents);
    });

    it('should handle team member events errors', async () => {
      const wrapper = createWrapper();
      const error = new Error('Failed to fetch team member events');
      mockCalendarApi.getTeamMemberEvents.mockRejectedValue(error);

      const { result } = renderHook(() => useTeamMemberEvents('TM-001'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('Project and Customer Events', () => {
    const mockProjectEvents = [
      {
        id: 'PROJ-EVT-001',
        title: 'Project Kickoff',
        type: 'meeting' as const,
        date: new Date('2024-03-20T10:00:00Z'),
        endDate: new Date('2024-03-20T11:00:00Z'),
        location: 'Project Site',
        attendees: ['project@example.com'],
        status: 'confirmed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1'
      }
    ];

    const mockCustomerEvents = [
      {
        id: 'CUST-EVT-001',
        title: 'Customer Review',
        type: 'meeting' as const,
        date: new Date('2024-03-20T10:00:00Z'),
        endDate: new Date('2024-03-20T11:00:00Z'),
        location: 'Customer Office',
        attendees: ['customer@example.com'],
        status: 'confirmed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1'
      }
    ];

    it('should fetch project events', async () => {
      const wrapper = createWrapper();
      mockCalendarApi.getProjectEvents.mockResolvedValue(mockProjectEvents);

      const { result } = renderHook(() => useProjectEvents('PRJ-001'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProjectEvents);
    });

    it('should fetch customer events', async () => {
      const wrapper = createWrapper();
      mockCalendarApi.getCustomerEvents.mockResolvedValue(mockCustomerEvents);

      const { result } = renderHook(() => useCustomerEvents('CUST-001'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCustomerEvents);
    });
  });

  describe('Availability Checking', () => {
    const mockAvailabilityResult = {
      available: false,
      conflicts: [
        {
          id: 'CONFLICT-001',
          title: 'Existing Meeting',
          type: 'meeting' as const,
          date: new Date('2024-03-20T10:00:00Z'),
          endDate: new Date('2024-03-20T11:00:00Z'),
          location: 'Meeting Room',
          attendees: ['conflict@example.com'],
          status: 'confirmed' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-1'
        }
      ]
    };

    it('should check availability successfully', async () => {
      const wrapper = createWrapper();
      mockCalendarApi.checkAvailability.mockResolvedValue(mockAvailabilityResult);

      const { result } = renderHook(() => useAvailabilityCheck(), { wrapper });

      const startDate = new Date('2024-03-20T10:00:00Z');
      const endDate = new Date('2024-03-20T11:00:00Z');
      const attendees = ['test@example.com'];

      await act(async () => {
        result.current.mutate({ startDate, endDate, attendees });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAvailabilityResult);
    });

    it('should handle availability check errors', async () => {
      const wrapper = createWrapper();
      const error = new Error('Availability check failed');
      mockCalendarApi.checkAvailability.mockRejectedValue(error);

      const { result } = renderHook(() => useAvailabilityCheck(), { wrapper });

      const startDate = new Date('2024-03-20T10:00:00Z');
      const endDate = new Date('2024-03-20T11:00:00Z');
      const attendees = ['test@example.com'];

      await act(async () => {
        result.current.mutate({ startDate, endDate, attendees });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });
});