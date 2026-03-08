import { AppointmentService, StoredAppointment } from '../appointmentService';
import { AppointmentFormData } from '../../components/AppointmentDialog';
import { NotificationService } from '../notificationService';

// Mock dependencies
jest.mock('../notificationService');
jest.mock('../appointmentAPI');
jest.mock('../synchronizationService');
jest.mock('../recurrenceService');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock environment variables
(global as any).import = {
  meta: {
    env: {
      VITE_USE_API: 'false',
      MODE: 'development'
    }
  }
};

describe('AppointmentService', () => {
  let mockAppointmentData: AppointmentFormData;
  let mockStoredAppointments: StoredAppointment[];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    
    mockAppointmentData = {
      title: 'Test Appointment',
      description: 'Test description',
      type: 'meeting',
      status: 'confirmed',
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '11:00',
      location: 'Conference Room A',
      projectId: 'project-1',
      attendees: ['test@example.com'],
      teamMembers: ['team1'],
      equipment: ['projector'],
      priority: 'medium',
      customerNotification: true,
      reminderTime: '15',
      isRecurring: false,
      recurrencePattern: {
        type: 'none',
        interval: 1,
        endType: 'never'
      },
      emailNotifications: {
        enabled: true,
        sendInvitations: true,
        sendReminders: true,
        recipients: []
      }
    };

    mockStoredAppointments = [
      {
        ...mockAppointmentData,
        id: 'appointment-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        ...mockAppointmentData,
        id: 'appointment-2',
        title: 'Second Appointment',
        date: '2024-01-16',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];
  });

  describe('getAllAppointmentsSync', () => {
    test('should return appointments from localStorage when API is disabled', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredAppointments));
      
      const result = AppointmentService.getAllAppointmentsSync();
      
      expect(result).toEqual(mockStoredAppointments);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('bauplan-buddy-appointments');
    });

    test('should return empty array when no appointments exist', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = AppointmentService.getAllAppointmentsSync();
      
      expect(result).toEqual([]);
    });

    test('should handle localStorage parsing errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = AppointmentService.getAllAppointmentsSync();
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('saveAppointment', () => {
    test('should save appointment to localStorage and schedule notifications', async () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const result = await AppointmentService.saveAppointment(mockAppointmentData);
      
      expect(result.title).toBe(mockAppointmentData.title);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bauplan-buddy-appointments',
        expect.stringContaining('Test Appointment')
      );
      
      expect(NotificationService.scheduleAppointmentReminders).toHaveBeenCalledWith(result);
    });

    test('should handle recurring appointments', async () => {
      const recurringAppointmentData = {
        ...mockAppointmentData,
        isRecurring: true,
        recurrencePattern: {
          type: 'weekly' as const,
          interval: 1,
          endType: 'count' as const,
          occurrences: 5
        }
      };
      
      // Mock the saveRecurringAppointment method
      jest.spyOn(AppointmentService as any, 'saveRecurringAppointment').mockResolvedValue({
        masterAppointment: {
          ...recurringAppointmentData,
          id: 'recurring-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        occurrences: []
      });
      
      const result = await AppointmentService.saveAppointment(recurringAppointmentData);
      
      expect(result.isRecurring).toBe(true);
      expect(result.recurrencePattern?.type).toBe('weekly');
    });

    test('should handle localStorage save errors', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      await expect(AppointmentService.saveAppointment(mockAppointmentData))
        .rejects.toThrow('Failed to save appointment');
    });
  });

  describe('updateAppointment', () => {
    test('should update existing appointment', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredAppointments));
      
      const updateData = {
        title: 'Updated Appointment',
        location: 'New Location'
      };
      
      const result = await AppointmentService.updateAppointment('appointment-1', updateData);
      
      expect(result?.title).toBe('Updated Appointment');
      expect(result?.location).toBe('New Location');
      expect(result?.updatedAt).toBeDefined();
      
      expect(NotificationService.clearReminders).toHaveBeenCalledWith('appointment-1');
      expect(NotificationService.scheduleAppointmentReminders).toHaveBeenCalledWith(result);
    });

    test('should return null for non-existent appointment', async () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const result = await AppointmentService.updateAppointment('non-existent', {
        title: 'Updated Title'
      });
      
      expect(result).toBeNull();
    });
  });

  describe('deleteAppointment', () => {
    test('should delete appointment and clear notifications', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredAppointments));
      
      const result = await AppointmentService.deleteAppointment('appointment-1');
      
      expect(result).toBe(true);
      expect(NotificationService.clearReminders).toHaveBeenCalledWith('appointment-1');
      
      // Verify the appointment was removed from storage
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.length).toBe(1);
      expect(savedData[0].id).toBe('appointment-2');
    });

    test('should return false for non-existent appointment', async () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const result = await AppointmentService.deleteAppointment('non-existent');
      
      expect(result).toBe(false);
    });
  });

  describe('getAppointmentById', () => {
    test('should return appointment by ID', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredAppointments));
      
      const result = AppointmentService.getAppointmentByIdSync('appointment-1');
      
      expect(result?.id).toBe('appointment-1');
      expect(result?.title).toBe('Test Appointment');
    });

    test('should return null for non-existent appointment', () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const result = AppointmentService.getAppointmentByIdSync('non-existent');
      
      expect(result).toBeNull();
    });
  });

  describe('getAppointmentsByDate', () => {
    test('should return appointments for specific date', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredAppointments));
      
      const result = AppointmentService.getAppointmentsByDateSync('2024-01-15');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('appointment-1');
    });

    test('should return empty array for date with no appointments', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredAppointments));
      
      const result = AppointmentService.getAppointmentsByDateSync('2024-01-20');
      
      expect(result).toEqual([]);
    });
  });

  describe('getAppointmentsByDateRange', () => {
    test('should return appointments within date range', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredAppointments));
      
      const result = AppointmentService.getAppointmentsByDateRangeSync('2024-01-15', '2024-01-16');
      
      expect(result).toHaveLength(2);
    });

    test('should return empty array for date range with no appointments', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredAppointments));
      
      const result = AppointmentService.getAppointmentsByDateRangeSync('2024-02-01', '2024-02-28');
      
      expect(result).toEqual([]);
    });
  });

  describe('generateId', () => {
    test('should generate unique IDs', () => {
      const id1 = (AppointmentService as any).generateId();
      const id2 = (AppointmentService as any).generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
  });
});