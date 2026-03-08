import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCalendar, useCreateEvent, useUpdateEvent, useDeleteEvent, useEvent, useTeamMembers, useTeamMemberEvents, useProjectEvents, useCustomerEvents, useAvailabilityCheck } from '../useCalendar';
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

describe('useCalendar Hook', () => {
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

  describe('Basic Functionality', () => {
    it('should initialize with default values', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar(), { wrapper });

      expect(result.current.filters).toEqual({});
      expect(result.current.currentDate).toBeInstanceOf(Date);
      expect(result.current.selectedDate).toBeInstanceOf(Date);
      expect(result.current.activeView).toBe('month');
      expect(result.current.isLoading).toBe(true);
    });

    it('should initialize with custom filters', async () => {
      const wrapper = createWrapper();
      const initialFilters = { type: 'meeting', status: 'confirmed' };
      const { result } = renderHook(() => useCalendar(initialFilters), { wrapper });

      expect(result.current.filters).toEqual(initialFilters);
    });

    it('should fetch events on mount', async () => {
      const wrapper = createWrapper();
      renderHook(() => useCalendar(), { wrapper });

      await waitFor(() => {
        expect(mockCalendarApi.getEvents).toHaveBeenCalledWith({});
      });
    });

    it('should return events from API', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar(), { wrapper });

      await waitFor(() => {
        expect(result.current.events).toEqual(mockEvents);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Filter Management', () => {
    it('should update filters correctly', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar(), { wrapper });

      act(() => {
        result.current.updateFilters({ type: 'meeting' });
      });

      expect(result.current.filters).toEqual({ type: 'meeting' });

      await waitFor(() => {
        expect(mockCalendarApi.getEvents).toHaveBeenCalledWith({ type: 'meeting' });
      });
    });

    it('should merge filters when updating', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar({ status: 'confirmed' }), { wrapper });

      act(() => {
        result.current.updateFilters({ type: 'meeting' });
      });

      expect(result.current.filters).toEqual({ status: 'confirmed', type: 'meeting' });
    });

    it('should clear filters', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar({ type: 'meeting', status: 'confirmed' }), { wrapper });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual({});

      await waitFor(() => {
        expect(mockCalendarApi.getEvents).toHaveBeenCalledWith({});
      });
    });

    it('should refetch events when filters change', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar(), { wrapper });

      // Wait for initial call
      await waitFor(() => {
        expect(mockCalendarApi.getEvents).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.updateFilters({ type: 'site-visit' });
      });

      await waitFor(() => {
        expect(mockCalendarApi.getEvents).toHaveBeenCalledTimes(2);
        expect(mockCalendarApi.getEvents).toHaveBeenLastCalledWith({ type: 'site-visit' });
      });
    });
  });

  describe('Calendar Navigation', () => {
    it('should navigate to next month', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar(), { wrapper });

      const initialDate = result.current.currentDate;
      
      act(() => {
        result.current.navigateDate('next');
      });

      const newDate = result.current.currentDate;
      expect(newDate.getTime()).toBeGreaterThan(initialDate.getTime());
    });

    it('should navigate to previous month', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar(), { wrapper });

      const initialDate = result.current.currentDate;
      
      act(() => {
        result.current.navigateDate('prev');
      });

      const newDate = result.current.currentDate;
      expect(newDate.getTime()).toBeLessThan(initialDate.getTime());
    });

    it('should navigate by different amounts based on view', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar(), { wrapper });

      // Test week view navigation
      act(() => {
        result.current.setActiveView('week');
      });

      const initialDate = result.current.currentDate;
      
      act(() => {
        result.current.navigateDate('next');
      });

      const newDate = result.current.currentDate;
      const daysDifference = Math.abs(newDate.getTime() - initialDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDifference).toBe(7);
    });

    it('should go to today', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar(), { wrapper });

      // Navigate away from today first
      act(() => {
        result.current.navigateDate('next');
      });

      // Then go to today
      act(() => {
        result.current.goToToday();
      });

      const today = new Date();
      const currentDate = result.current.currentDate;
      const selectedDate = result.current.selectedDate;

      expect(currentDate.toDateString()).toBe(today.toDateString());
      expect(selectedDate?.toDateString()).toBe(today.toDateString());
    });

    it('should set current date', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar(), { wrapper });

      const newDate = new Date('2024-06-15');
      
      act(() => {
        result.current.setCurrentDate(newDate);
      });

      expect(result.current.currentDate).toEqual(newDate);
    });

    it('should set selected date', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar(), { wrapper });

      const newDate = new Date('2024-06-15');
      
      act(() => {
        result.current.setSelectedDate(newDate);
      });

      expect(result.current.selectedDate).toEqual(newDate);
    });

    it('should set active view', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar(), { wrapper });

      act(() => {
        result.current.setActiveView('week');
      });

      expect(result.current.activeView).toBe('week');

      act(() => {
        result.current.setActiveView('day');
      });

      expect(result.current.activeView).toBe('day');
    });
  });

  describe('Data Refetching', () => {
    it('should refetch events manually', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCalendar(), { wrapper });

      // Wait for initial call
      await waitFor(() => {
        expect(mockCalendarApi.getEvents).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(mockCalendarApi.getEvents).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const wrapper = createWrapper();
      const error = new Error('API Error');
      mockCalendarApi.getEvents.mockRejectedValue(error);

      const { result } = renderHook(() => useCalendar(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.events).toEqual([]);
      });
    });
  });
});

describe('useCreateEvent Hook', () => {
  const mockCalendarApi = calendarApi as jest.Mocked<typeof calendarApi>;
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mock('../use-toast', () => ({
      toast: mockToast,
      useToast: () => ({ toast: mockToast })
    }));
  });

  const mockEventData = {
    title: 'New Event',
    type: 'meeting' as const,
    date: new Date('2024-03-20T10:00:00Z'),
    endDate: new Date('2024-03-20T11:00:00Z'),
    location: 'Conference Room',
    attendees: ['test@example.com']
  };

  const mockCreatedEvent = {
    id: 'EVT-NEW',
    ...mockEventData,
    status: 'confirmed' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1'
  };

  it('should create an event successfully', async () => {
    const wrapper = createWrapper();
    mockCalendarApi.createEvent.mockResolvedValue(mockCreatedEvent);

    const { result } = renderHook(() => useCreateEvent(), { wrapper });

    await act(async () => {
      result.current.mutate(mockEventData);
    });

    await waitFor(() => {
      expect(mockCalendarApi.createEvent).toHaveBeenCalledWith(mockEventData);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockCreatedEvent);
    });
  });

  it('should handle creation errors', async () => {
    const wrapper = createWrapper();
    const error = new Error('Creation failed');
    mockCalendarApi.createEvent.mockRejectedValue(error);

    const { result } = renderHook(() => useCreateEvent(), { wrapper });

    await act(async () => {
      result.current.mutate(mockEventData);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toEqual(error);
    });
  });
});

describe('useUpdateEvent Hook', () => {
  const mockCalendarApi = calendarApi as jest.Mocked<typeof calendarApi>;

  const mockEventData = {
    id: 'EVT-001',
    title: 'Updated Event',
    location: 'New Location'
  };

  const mockUpdatedEvent = {
    id: 'EVT-001',
    title: 'Updated Event',
    type: 'meeting' as const,
    date: new Date('2024-03-20T10:00:00Z'),
    endDate: new Date('2024-03-20T11:00:00Z'),
    location: 'New Location',
    attendees: ['test@example.com'],
    status: 'confirmed' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1'
  };

  it('should update an event successfully', async () => {
    const wrapper = createWrapper();
    mockCalendarApi.updateEvent.mockResolvedValue(mockUpdatedEvent);

    const { result } = renderHook(() => useUpdateEvent(), { wrapper });

    await act(async () => {
      result.current.mutate(mockEventData);
    });

    await waitFor(() => {
      expect(mockCalendarApi.updateEvent).toHaveBeenCalledWith(mockEventData);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockUpdatedEvent);
    });
  });
});

describe('useDeleteEvent Hook', () => {
  const mockCalendarApi = calendarApi as jest.Mocked<typeof calendarApi>;

  it('should delete an event successfully', async () => {
    const wrapper = createWrapper();
    mockCalendarApi.deleteEvent.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteEvent(), { wrapper });

    await act(async () => {
      result.current.mutate('EVT-001');
    });

    await waitFor(() => {
      expect(mockCalendarApi.deleteEvent).toHaveBeenCalledWith('EVT-001');
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe('useEvent Hook', () => {
  const mockCalendarApi = calendarApi as jest.Mocked<typeof calendarApi>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEvent = {
    id: 'EVT-001',
    title: 'Single Event',
    type: 'meeting' as const,
    date: new Date('2024-03-20T10:00:00Z'),
    endDate: new Date('2024-03-20T11:00:00Z'),
    location: 'Conference Room',
    attendees: ['test@example.com'],
    status: 'confirmed' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1'
  };

  it('should fetch a single event', async () => {
    const wrapper = createWrapper();
    mockCalendarApi.getEvent.mockResolvedValue(mockEvent);

    const { result } = renderHook(() => useEvent('EVT-001'), { wrapper });

    await waitFor(() => {
      expect(mockCalendarApi.getEvent).toHaveBeenCalledWith('EVT-001');
      expect(result.current.data).toEqual(mockEvent);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should not fetch when disabled', () => {
    const wrapper = createWrapper();
    mockCalendarApi.getEvent.mockResolvedValue(mockEvent);

    renderHook(() => useEvent('EVT-001', false), { wrapper });

    expect(mockCalendarApi.getEvent).not.toHaveBeenCalled();
  });
});

describe('useTeamMembers Hook', () => {
  const mockCalendarApi = calendarApi as jest.Mocked<typeof calendarApi>;

  const mockTeamMembers = [
    { id: 'TM-001', name: 'John Doe', role: 'Developer' },
    { id: 'TM-002', name: 'Jane Smith', role: 'Designer' }
  ];

  it('should fetch team members', async () => {
    const wrapper = createWrapper();
    mockCalendarApi.getTeamMembers.mockResolvedValue(mockTeamMembers);

    const { result } = renderHook(() => useTeamMembers(), { wrapper });

    await waitFor(() => {
      expect(mockCalendarApi.getTeamMembers).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockTeamMembers);
    });
  });
});

describe('useTeamMemberEvents Hook', () => {
  const mockCalendarApi = calendarApi as jest.Mocked<typeof calendarApi>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockMemberEvents = [
    {
      id: 'TM-EVT-001',
      title: 'Team Event',
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
      expect(mockCalendarApi.getTeamMemberEvents).toHaveBeenCalledWith('TM-001', startDate, endDate);
      expect(result.current.data).toEqual(mockMemberEvents);
    });
  });

  it('should not fetch when memberId is empty', () => {
    const wrapper = createWrapper();
    mockCalendarApi.getTeamMemberEvents.mockResolvedValue(mockMemberEvents);

    renderHook(() => useTeamMemberEvents('', new Date(), new Date()), { wrapper });

    expect(mockCalendarApi.getTeamMemberEvents).not.toHaveBeenCalled();
  });
});

describe('useProjectEvents Hook', () => {
  const mockCalendarApi = calendarApi as jest.Mocked<typeof calendarApi>;

  const mockProjectEvents = [
    {
      id: 'PROJ-EVT-001',
      title: 'Project Meeting',
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

  it('should fetch project events', async () => {
    const wrapper = createWrapper();
    mockCalendarApi.getProjectEvents.mockResolvedValue(mockProjectEvents);

    const { result } = renderHook(() => useProjectEvents('PRJ-001'), { wrapper });

    await waitFor(() => {
      expect(mockCalendarApi.getProjectEvents).toHaveBeenCalledWith('PRJ-001');
      expect(result.current.data).toEqual(mockProjectEvents);
    });
  });
});

describe('useCustomerEvents Hook', () => {
  const mockCalendarApi = calendarApi as jest.Mocked<typeof calendarApi>;

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

  it('should fetch customer events', async () => {
    const wrapper = createWrapper();
    mockCalendarApi.getCustomerEvents.mockResolvedValue(mockCustomerEvents);

    const { result } = renderHook(() => useCustomerEvents('CUST-001'), { wrapper });

    await waitFor(() => {
      expect(mockCalendarApi.getCustomerEvents).toHaveBeenCalledWith('CUST-001');
      expect(result.current.data).toEqual(mockCustomerEvents);
    });
  });
});

describe('useAvailabilityCheck Hook', () => {
  const mockCalendarApi = calendarApi as jest.Mocked<typeof calendarApi>;

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

  it('should check availability', async () => {
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
      expect(mockCalendarApi.checkAvailability).toHaveBeenCalledWith(startDate, endDate, attendees);
      expect(result.current.data).toEqual(mockAvailabilityResult);
    });
  });
});
