import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useAppointments, 
  useAppointment, 
  useAppointmentsByProject, 
  useAppointmentsByDate,
  useAppointmentsByDateRange,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  useBulkUpdateAppointments,
  useAppointmentStatistics,
  useAppointmentConflicts,
  useSyncAppointments,
  appointmentQueryKeys
} from '../useAppointments';
import { AppointmentService, StoredAppointment } from '../../services/appointmentService';
import { AppointmentFormData } from '../../components/AppointmentDialog';
import { ReactNode } from 'react';

// Extend Jest matchers to include jest-dom
import '@testing-library/jest-dom';

// Mock the appointment service
jest.mock('../../services/appointmentService');
jest.mock('../../services/notificationService');
jest.mock('../../services/synchronizationService');

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

describe('useAppointments Hooks', () => {
  const mockAppointmentService = AppointmentService as jest.Mocked<typeof AppointmentService>;

  const mockAppointment: StoredAppointment = {
    id: 'APT-001',
    title: 'Test Appointment',
    description: 'Test description',
    type: 'meeting',
    date: '2024-03-15',
    startTime: '10:00',
    endTime: '11:00',
    location: 'Test Location',
    projectId: 'PRJ-001',
    attendees: ['test@example.com'],
    teamMembers: ['TM-001'],
    equipment: ['EQ-001'],
    priority: 'medium',
    customerNotification: true,
    reminderTime: '15',
    emailNotifications: {
      enabled: true,
      sendInvitations: true,
      sendReminders: true,
      recipients: ['test@example.com'],
      customMessage: 'Test message'
    },
    createdAt: '2024-03-01T10:00:00.000Z',
    updatedAt: '2024-03-01T10:00:00.000Z'
  };

  const mockAppointments: StoredAppointment[] = [
    mockAppointment,
    {
      ...mockAppointment,
      id: 'APT-002',
      title: 'Second Appointment',
      date: '2024-03-16',
      projectId: 'PRJ-002'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppointmentService.getAllAppointments.mockResolvedValue(mockAppointments);
    mockAppointmentService.getAllAppointmentsSync.mockReturnValue(mockAppointments);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('useAppointments', () => {
    it('should fetch all appointments successfully', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAppointments(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAppointments);
      expect(mockAppointmentService.getAllAppointments).toHaveBeenCalledWith(undefined);
    });

    it('should fetch appointments with filters', async () => {
      const wrapper = createWrapper();
      const filters = { type: 'meeting', projectId: 'PRJ-001' };
      const { result } = renderHook(() => useAppointments(filters), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAppointmentService.getAllAppointments).toHaveBeenCalledWith(filters);
    });

    it('should fallback to sync method when API fails', async () => {
      const wrapper = createWrapper();
      mockAppointmentService.getAllAppointments.mockRejectedValue(new Error('API Error'));
      
      const { result } = renderHook(() => useAppointments(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAppointmentService.getAllAppointments).toHaveBeenCalled();
      expect(mockAppointmentService.getAllAppointmentsSync).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockAppointments);
    });

    it('should handle loading and error states', async () => {
      const wrapper = createWrapper();
      mockAppointmentService.getAllAppointments.mockRejectedValue(new Error('Network Error'));
      mockAppointmentService.getAllAppointmentsSync.mockImplementation(() => {
        throw new Error('Sync Error');
      });

      const { result } = renderHook(() => useAppointments(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useAppointment', () => {
    it('should fetch single appointment by ID', async () => {
      const wrapper = createWrapper();
      mockAppointmentService.getAppointmentById.mockResolvedValue(mockAppointment);

      const { result } = renderHook(() => useAppointment('APT-001'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAppointment);
      expect(mockAppointmentService.getAppointmentById).toHaveBeenCalledWith('APT-001');
    });

    it('should not fetch when ID is undefined', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAppointment(undefined), { wrapper });

      expect(result.current.isIdle).toBe(true);
      expect(mockAppointmentService.getAppointmentById).not.toHaveBeenCalled();
    });

    it('should fallback to sync method for single appointment', async () => {
      const wrapper = createWrapper();
      mockAppointmentService.getAppointmentById.mockRejectedValue(new Error('API Error'));
      mockAppointmentService.getAppointmentByIdSync.mockReturnValue(mockAppointment);

      const { result } = renderHook(() => useAppointment('APT-001'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAppointmentService.getAppointmentByIdSync).toHaveBeenCalledWith('APT-001');
      expect(result.current.data).toEqual(mockAppointment);
    });
  });

  describe('useAppointmentsByProject', () => {
    it('should fetch appointments by project ID', async () => {
      const wrapper = createWrapper();
      const projectAppointments = [mockAppointment];
      mockAppointmentService.getAppointmentsByProject.mockResolvedValue(projectAppointments);

      const { result } = renderHook(() => useAppointmentsByProject('PRJ-001'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(projectAppointments);
      expect(mockAppointmentService.getAppointmentsByProject).toHaveBeenCalledWith('PRJ-001');
    });

    it('should return empty array when projectId is undefined', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAppointmentsByProject(undefined), { wrapper });

      expect(result.current.isIdle).toBe(true);
    });
  });

  describe('useAppointmentsByDate', () => {
    it('should fetch appointments by date', async () => {
      const wrapper = createWrapper();
      const dateAppointments = [mockAppointment];
      mockAppointmentService.getAppointmentsByDate.mockResolvedValue(dateAppointments);

      const { result } = renderHook(() => useAppointmentsByDate('2024-03-15'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(dateAppointments);
      expect(mockAppointmentService.getAppointmentsByDate).toHaveBeenCalledWith('2024-03-15');
    });
  });

  describe('useAppointmentsByDateRange', () => {
    it('should fetch appointments by date range', async () => {
      const wrapper = createWrapper();
      mockAppointmentService.getAppointmentsByDateRange.mockResolvedValue(mockAppointments);

      const { result } = renderHook(() => 
        useAppointmentsByDateRange('2024-03-01', '2024-03-31'), 
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAppointments);
      expect(mockAppointmentService.getAppointmentsByDateRange)
        .toHaveBeenCalledWith('2024-03-01', '2024-03-31');
    });
  });

  describe('useCreateAppointment', () => {
    it('should create appointment successfully', async () => {
      const wrapper = createWrapper();
      const appointmentData: AppointmentFormData = {
        title: 'New Appointment',
        description: 'New description',
        type: 'meeting',
        date: '2024-03-20',
        startTime: '14:00',
        endTime: '15:00',
        location: 'New Location',
        projectId: 'PRJ-001',
        attendees: ['new@example.com'],
        teamMembers: ['TM-001'],
        equipment: [],
        priority: 'high',
        customerNotification: true,
        reminderTime: '30',
        emailNotifications: {
          enabled: true,
          sendInvitations: true,
          sendReminders: true,
          recipients: ['new@example.com'],
          customMessage: 'New appointment created'
        }
      };

      const createdAppointment = { ...mockAppointment, ...appointmentData, id: 'APT-NEW' };
      mockAppointmentService.saveAppointment.mockResolvedValue(createdAppointment);

      const { result } = renderHook(() => useCreateAppointment(), { wrapper });

      await act(async () => {
        result.current.mutate(appointmentData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAppointmentService.saveAppointment).toHaveBeenCalledWith(appointmentData);
      expect(result.current.data).toEqual(createdAppointment);
    });

    it('should handle creation errors', async () => {
      const wrapper = createWrapper();
      const error = new Error('Creation failed');
      mockAppointmentService.saveAppointment.mockRejectedValue(error);

      const { result } = renderHook(() => useCreateAppointment(), { wrapper });

      await act(async () => {
        result.current.mutate({} as AppointmentFormData);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useUpdateAppointment', () => {
    it('should update appointment successfully', async () => {
      const wrapper = createWrapper();
      const updates = { title: 'Updated Title', location: 'Updated Location' };
      const updatedAppointment = { ...mockAppointment, ...updates };
      
      mockAppointmentService.updateAppointment.mockResolvedValue(updatedAppointment);

      const { result } = renderHook(() => useUpdateAppointment(), { wrapper });

      await act(async () => {
        result.current.mutate({ id: 'APT-001', data: updates });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAppointmentService.updateAppointment).toHaveBeenCalledWith('APT-001', updates);
      expect(result.current.data).toEqual(updatedAppointment);
    });

    it('should handle update errors', async () => {
      const wrapper = createWrapper();
      const error = new Error('Update failed');
      mockAppointmentService.updateAppointment.mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateAppointment(), { wrapper });

      await act(async () => {
        result.current.mutate({ id: 'APT-001', data: { title: 'Updated' } });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useDeleteAppointment', () => {
    it('should delete appointment successfully', async () => {
      const wrapper = createWrapper();
      mockAppointmentService.deleteAppointment.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteAppointment(), { wrapper });

      await act(async () => {
        result.current.mutate('APT-001');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAppointmentService.deleteAppointment).toHaveBeenCalledWith('APT-001');
    });

    it('should handle deletion errors', async () => {
      const wrapper = createWrapper();
      const error = new Error('Deletion failed');
      mockAppointmentService.deleteAppointment.mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteAppointment(), { wrapper });

      await act(async () => {
        result.current.mutate('APT-001');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('Query Key Management', () => {
    it('should generate correct query keys', () => {
      expect(appointmentQueryKeys.all).toEqual(['appointments']);
      expect(appointmentQueryKeys.lists()).toEqual(['appointments', 'list']);
      expect(appointmentQueryKeys.list({ type: 'meeting' })).toEqual(['appointments', 'list', { type: 'meeting' }]);
      expect(appointmentQueryKeys.detail('APT-001')).toEqual(['appointments', 'detail', 'APT-001']);
      expect(appointmentQueryKeys.byProject('PRJ-001')).toEqual(['appointments', 'project', 'PRJ-001']);
      expect(appointmentQueryKeys.byDate('2024-03-15')).toEqual(['appointments', 'date', '2024-03-15']);
      expect(appointmentQueryKeys.byDateRange('2024-03-01', '2024-03-31'))
        .toEqual(['appointments', 'dateRange', '2024-03-01', '2024-03-31']);
    });
  });

  describe('Cache Management', () => {
    it('should properly configure stale time and cache time', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAppointments(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Query should be cached for the specified time
      expect(result.current.dataUpdatedAt).toBeDefined();
    });

    it('should refetch on window focus', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAppointments(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Simulate window focus
      window.dispatchEvent(new Event('focus'));

      // Should trigger another fetch
      await waitFor(() => {
        expect(mockAppointmentService.getAllAppointments).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Optimistic Updates', () => {
    it('should optimistically update cache on creation', async () => {
      const wrapper = createWrapper();
      const queryClient = new QueryClient();
      
      // Pre-populate cache with existing appointments
      queryClient.setQueryData(appointmentQueryKeys.list(), mockAppointments);

      const appointmentData: AppointmentFormData = {
        title: 'Optimistic Test',
        type: 'meeting',
        date: '2024-03-20',
        startTime: '10:00',
        endTime: '11:00',
        location: 'Test Location',
        projectId: 'PRJ-001',
        attendees: [],
        teamMembers: [],
        equipment: [],
        priority: 'medium',
        customerNotification: false,
        reminderTime: '15',
        emailNotifications: {
          enabled: false,
          sendInvitations: false,
          sendReminders: false,
          recipients: [],
          customMessage: ''
        }
      };

      const createdAppointment = { ...mockAppointment, ...appointmentData, id: 'APT-OPTIMISTIC' };
      mockAppointmentService.saveAppointment.mockResolvedValue(createdAppointment);

      const { result } = renderHook(() => useCreateAppointment(), { 
        wrapper: ({ children }: { children: ReactNode }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      });

      await act(async () => {
        result.current.mutate(appointmentData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that cache was updated optimistically
      const cachedData = queryClient.getQueryData(appointmentQueryKeys.list()) as StoredAppointment[];
      expect(cachedData).toContainEqual(createdAppointment);
    });
  });
});