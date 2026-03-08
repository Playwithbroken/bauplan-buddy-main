// dragDropService.test.ts
import { dragDropService, DragDropService } from '@/services/dragDropService';
import { StoredAppointment } from '@/services/appointmentService';

// Mock appointmentService
jest.mock('@/services/appointmentService', () => ({
  AppointmentService: {
    getAllAppointments: jest.fn().mockReturnValue([]),
    getAllAppointmentsSync: jest.fn().mockReturnValue([]),
    getAppointmentsByDate: jest.fn().mockResolvedValue([]),
    updateAppointment: jest.fn().mockResolvedValue(null),
    getSyncStatus: jest.fn().mockReturnValue({
      isOnline: true,
      lastSyncTime: null,
      pendingChanges: 0,
      syncInProgress: false,
      errors: []
    }),
    needsSync: jest.fn().mockReturnValue(false),
    hasPendingSync: jest.fn().mockReturnValue(false)
  }
}));

describe('DragDropService', () => {
  let mockAppointment: StoredAppointment;
  let mockOptions: {
    enableDrag: boolean;
    enableDrop: boolean;
    snapToGrid: boolean;
    gridSize: number;
    conflictDetection: boolean;
    showPreview: boolean;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAppointment = {
      id: 'test-appointment-1',
      title: 'Test Appointment',
      description: 'Test description',
      type: 'meeting',
      status: 'confirmed',
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '11:00',
      location: 'Test Location',
      projectId: 'project-1',
      attendees: ['test@example.com'],
      teamMembers: ['team1'],
      equipment: ['equipment1'],
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
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    mockOptions = {
      enableDrag: true,
      enableDrop: true,
      snapToGrid: true,
      gridSize: 15,
      conflictDetection: true,
      showPreview: true
    };
  });

  describe('Singleton Instance', () => {
    test('should export singleton instance', () => {
      expect(dragDropService).toBeInstanceOf(DragDropService);
    });
  });

  describe('startDrag', () => {
    test('should create drag item from appointment', () => {
      const dragItem = dragDropService.startDrag(mockAppointment);

      expect(dragItem).toEqual({
        type: 'appointment',
        id: 'test-appointment-1',
        data: mockAppointment,
        startTime: '10:00',
        endTime: '11:00',
        date: '2024-01-15'
      });
    });
  });

  describe('updateDrag', () => {
    test('should create calendar drag event', () => {
      const dragItem = dragDropService.startDrag(mockAppointment);
      const target = {
        date: '2024-01-16',
        startTime: '14:00',
        endTime: '15:00'
      };

      const dragEvent = dragDropService.updateDrag(dragItem, target);

      expect(dragEvent).toEqual({
        appointmentId: 'test-appointment-1',
        originalDate: '2024-01-15',
        originalStartTime: '10:00',
        originalEndTime: '11:00',
        newDate: '2024-01-16',
        newStartTime: '14:00',
        newEndTime: '15:00'
      });
    });
  });

  describe('snapToGrid', () => {
    test('should snap time to grid when enabled', () => {
      const snappedTime = dragDropService.snapToGrid('10:07');
      expect(snappedTime).toBe('10:00');

      const snappedTime2 = dragDropService.snapToGrid('10:08');
      expect(snappedTime2).toBe('10:15');
    });

    test('should not snap time to grid when disabled', () => {
      const service = new DragDropService({ snapToGrid: false });
      const time = '10:07';
      const snappedTime = service.snapToGrid(time);
      expect(snappedTime).toBe(time);
    });
  });

  describe('calculateDuration', () => {
    test('should calculate duration in minutes', () => {
      const duration = dragDropService.calculateDuration('10:00', '11:30');
      expect(duration).toBe(90);
    });

    test('should handle durations that cross hour boundaries', () => {
      const duration = dragDropService.calculateDuration('09:45', '10:15');
      expect(duration).toBe(30);
    });
  });

  describe('updateEndTime', () => {
    test('should calculate new end time based on duration', () => {
      const newEndTime = dragDropService.updateEndTime('10:00', 90);
      expect(newEndTime).toBe('11:30');
    });

    test('should handle end times that cross hour boundaries', () => {
      const newEndTime = dragDropService.updateEndTime('09:45', 30);
      expect(newEndTime).toBe('10:15');
    });
  });

  describe('checkConflicts', () => {
    test('should detect conflicts with other appointments', async () => {
      const mockAppointments = [
        {
          id: 'conflicting-appointment',
          title: 'Conflicting Appointment',
          description: '',
          type: 'meeting',
          status: 'confirmed',
          date: '2024-01-15',
          startTime: '10:30',
          endTime: '11:30',
          location: '',
          projectId: '',
          attendees: [],
          teamMembers: [],
          equipment: [],
          priority: 'medium',
          customerNotification: false,
          reminderTime: '15',
          isRecurring: false,
          recurrencePattern: {
            type: 'none',
            interval: 1,
            endType: 'never'
          },
          emailNotifications: {
            enabled: false,
            sendInvitations: false,
            sendReminders: false,
            recipients: []
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      const { AppointmentService } = await import('@/services/appointmentService');
      AppointmentService.getAppointmentsByDate.mockResolvedValue(mockAppointments);

      const dragItem = dragDropService.startDrag(mockAppointment);
      const target = {
        date: '2024-01-15',
        startTime: '10:15',
        endTime: '11:00'
      };

      const conflictInfo = await dragDropService.checkConflicts(dragItem, target);

      expect(conflictInfo.hasConflict).toBe(true);
      expect(conflictInfo.conflictingAppointments).toContain('conflicting-appointment');
    });

    test('should not detect conflicts when there are none', async () => {
      const mockAppointments = [
        {
          id: 'non-conflicting-appointment',
          title: 'Non-Conflicting Appointment',
          description: '',
          type: 'meeting',
          status: 'confirmed',
          date: '2024-01-15',
          startTime: '12:00',
          endTime: '13:00',
          location: '',
          projectId: '',
          attendees: [],
          teamMembers: [],
          equipment: [],
          priority: 'medium',
          customerNotification: false,
          reminderTime: '15',
          isRecurring: false,
          recurrencePattern: {
            type: 'none',
            interval: 1,
            endType: 'never'
          },
          emailNotifications: {
            enabled: false,
            sendInvitations: false,
            sendReminders: false,
            recipients: []
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      const { AppointmentService } = await import('@/services/appointmentService');
      AppointmentService.getAppointmentsByDate.mockResolvedValue(mockAppointments);

      const dragItem = dragDropService.startDrag(mockAppointment);
      const target = {
        date: '2024-01-15',
        startTime: '10:15',
        endTime: '11:00'
      };

      const conflictInfo = await dragDropService.checkConflicts(dragItem, target);

      expect(conflictInfo.hasConflict).toBe(false);
      expect(conflictInfo.conflictingAppointments).toHaveLength(0);
    });
  });

  describe('endDrag', () => {
    test('should update appointment when no conflicts', async () => {
      const { AppointmentService } = await import('@/services/appointmentService');
      AppointmentService.getAppointmentsByDate.mockResolvedValue([]);
      AppointmentService.updateAppointment.mockResolvedValue(mockAppointment);

      const dragItem = dragDropService.startDrag(mockAppointment);
      const target = {
        date: '2024-01-16',
        startTime: '14:00',
        endTime: '15:00'
      };

      const result = await dragDropService.endDrag(dragItem, target);

      expect(result).toBe(true);
      expect(AppointmentService.updateAppointment).toHaveBeenCalledWith(
        'test-appointment-1',
        expect.objectContaining({
          date: '2024-01-16',
          startTime: '14:00',
          endTime: '15:00'
        })
      );
    });

    test('should not update appointment when conflicts exist', async () => {
      const mockAppointments = [
        {
          id: 'conflicting-appointment',
          title: 'Conflicting Appointment',
          description: '',
          type: 'meeting',
          status: 'confirmed',
          date: '2024-01-15',
          startTime: '10:30',
          endTime: '11:30',
          location: '',
          projectId: '',
          attendees: [],
          teamMembers: [],
          equipment: [],
          priority: 'medium',
          customerNotification: false,
          reminderTime: '15',
          isRecurring: false,
          recurrencePattern: {
            type: 'none',
            interval: 1,
            endType: 'never'
          },
          emailNotifications: {
            enabled: false,
            sendInvitations: false,
            sendReminders: false,
            recipients: []
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      const { AppointmentService } = await import('@/services/appointmentService');
      AppointmentService.getAppointmentsByDate.mockResolvedValue(mockAppointments);

      const dragItem = dragDropService.startDrag(mockAppointment);
      const target = {
        date: '2024-01-15',
        startTime: '10:15',
        endTime: '11:00'
      };

      const result = await dragDropService.endDrag(dragItem, target);

      expect(result).toBe(false);
      expect(AppointmentService.updateAppointment).not.toHaveBeenCalled();
    });
  });

  describe('clearConflictCache', () => {
    test('should clear conflict cache', () => {
      // Access private cache through reflection for testing
      expect(() => dragDropService.clearConflictCache()).not.toThrow();
    });
  });

  describe('updateOptions', () => {
    test('should update service options', () => {
      const service = new DragDropService();
      service.updateOptions({ gridSize: 30 });

      // Test indirectly by checking snapToGrid behavior
      const snappedTime = service.snapToGrid('10:15');
      expect(snappedTime).toBe('10:00');
    });
  });
});