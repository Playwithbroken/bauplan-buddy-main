import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NotificationService, NotificationSettings, Notification } from '../notificationService';
import { StoredAppointment } from '../appointmentService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Setup global mocks
const originalLocalStorage = global.localStorage;
const originalNotification = global.Notification;
const originalAudioContext = global.AudioContext;
const originalWebkitAudioContext = global.webkitAudioContext;
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;
const originalWindow = global.window;

// Mock window.Notification
const mockNotification = jest.fn() as any;
mockNotification.permission = 'default';
mockNotification.requestPermission = jest.fn();

// Mock AudioContext
const mockAudioContext = {
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    frequency: {
      setValueAtTime: jest.fn(),
    },
    start: jest.fn(),
    stop: jest.fn()
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn()
    }
  })),
  destination: {},
  currentTime: 0
};

// Mock window methods
const mockWindow = {
  dispatchEvent: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Setup mocks before tests
beforeAll(() => {
  (global as any).localStorage = localStorageMock;
  (global as any).Notification = mockNotification;
  (global as any).AudioContext = jest.fn(() => mockAudioContext);
  (global as any).webkitAudioContext = jest.fn(() => mockAudioContext);
  (global as any).setTimeout = jest.fn((callback) => {
    // Execute immediately for testing
    callback();
    return 'mock-timeout-id';
  });
  (global as any).clearTimeout = jest.fn();
  (global as any).window = mockWindow;
});

// Restore original globals after tests
afterAll(() => {
  global.localStorage = originalLocalStorage;
  global.Notification = originalNotification;
  global.AudioContext = originalAudioContext;
  global.webkitAudioContext = originalWebkitAudioContext;
  global.setTimeout = originalSetTimeout;
  global.clearTimeout = originalClearTimeout;
  global.window = originalWindow;
});

describe('NotificationService', () => {
  let defaultSettings: NotificationSettings;


  const mockAppointment: StoredAppointment = {
    id: 'APT-001',
    title: 'Test Appointment',
    description: 'Test description',
    type: 'site-visit',
    date: '2024-03-15',
    startTime: '09:00',
    endTime: '10:00',
    location: 'Test Location',
    projectId: 'PRJ-001',
    attendees: ['John Doe'],
    teamMembers: ['TM-001'],
    equipment: ['EQ-001'],
    priority: 'high',
    customerNotification: true,
    reminderTime: '15',
    emailNotifications: {
      enabled: false,
      sendInvitations: false,
      sendReminders: false,
      recipients: [],
      customMessage: ''
    },
    createdAt: '2024-03-01T10:00:00.000Z',
    updatedAt: '2024-03-01T10:00:00.000Z'
  };

  const mockNotificationData: Notification = {
    id: 'notif-001',
    appointmentId: 'APT-001',
    type: 'reminder',
    title: 'Test Notification',
    message: 'Test message',
    timestamp: '2024-03-01T10:00:00.000Z',
    read: false,
    reminderTime: 15,
    priority: 'high'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    defaultSettings = NotificationService.getDefaultSettings();
    localStorageMock.getItem.mockReturnValue(null);
    mockNotification.permission = 'default';
  });

  describe('Settings Management', () => {
    it('should return default settings when none exist', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const settings = NotificationService.getSettings();
      
      expect(settings).toEqual(defaultSettings);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('bauplan-buddy-notification-settings');
    });

    it('should return stored settings', () => {
      const customSettings = { ...defaultSettings, soundEnabled: false };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(customSettings));
      
      const settings = NotificationService.getSettings();
      
      expect(settings).toEqual(customSettings);
    });

    it('should handle corrupted settings gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const settings = NotificationService.getSettings();
      
      expect(settings).toEqual(defaultSettings);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading notification settings:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should save settings to localStorage', () => {
      const customSettings = { ...defaultSettings, soundEnabled: false };

      NotificationService.saveSettings(customSettings);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bauplan-buddy-notification-settings',
        expect.any(String)
      );
    });

    it('should handle save errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      NotificationService.saveSettings(defaultSettings);
      
      expect(consoleSpy).toHaveBeenCalledWith('Error saving notification settings:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
    it('should normalize settings before saving', () => {
      const rawSettings: NotificationSettings = {
        ...defaultSettings,
        reminderTimes: [60, 15, 60, 5],
        quietHoursEnabled: true,
        quietHoursStart: '',
        quietHoursEnd: '',
        lastUpdatedBy: '  Alice  '
      };

      localStorageMock.setItem.mockClear();

      const normalized = NotificationService.saveSettings(rawSettings);

      expect(normalized.reminderTimes).toEqual([5, 15, 60]);
      expect(normalized.quietHoursStart).toBe(defaultSettings.quietHoursStart);
      expect(normalized.quietHoursEnd).toBe(defaultSettings.quietHoursEnd);
      expect(normalized.lastUpdatedBy).toBe('Alice');
      expect(typeof normalized.lastUpdatedAt).toBe('string');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bauplan-buddy-notification-settings',
        expect.any(String)
      );

      const stored = JSON.parse(localStorageMock.setItem.mock.calls.pop()[1]);
      expect(stored.reminderTimes).toEqual([5, 15, 60]);
      expect(stored.quietHoursStart).toBe(defaultSettings.quietHoursStart);
      expect(stored.quietHoursEnd).toBe(defaultSettings.quietHoursEnd);
      expect(stored.lastUpdatedBy).toBe('Alice');
      expect(typeof stored.lastUpdatedAt).toBe('string');
    });

  });

  describe('Notification Management', () => {
    it('should return empty array when no notifications exist', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const notifications = NotificationService.getAllNotifications();
      
      expect(notifications).toEqual([]);
    });

    it('should return stored notifications', () => {
      const notifications = [mockNotificationData];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));
      
      const result = NotificationService.getAllNotifications();
      
      expect(result).toEqual(notifications);
    });

    it('should save notification and maintain limit', () => {
      // Mock 100 existing notifications
      const existingNotifications = Array.from({ length: 100 }, (_, i) => ({
        ...mockNotificationData,
        id: `notif-${i}`,
        timestamp: new Date(2024, 0, i + 1).toISOString()
      }));
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingNotifications));
      
      const newNotification = {
        ...mockNotificationData,
        id: 'notif-new',
        timestamp: new Date(2024, 0, 101).toISOString()
      };
      
      NotificationService.saveNotification(newNotification);
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(100); // Should maintain 100 limit
      expect(savedData[0].id).toBe('notif-new'); // Newest should be first
    });

    it('should mark notification as read', () => {
      const notifications = [mockNotificationData, { ...mockNotificationData, id: 'notif-002' }];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));
      
      NotificationService.markAsRead('notif-001');
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData[0].read).toBe(true);
    });

    it('should mark all notifications as read', () => {
      const notifications = [
        mockNotificationData,
        { ...mockNotificationData, id: 'notif-002' }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));
      
      NotificationService.markAllAsRead();
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.every((n: Notification) => n.read)).toBe(true);
    });

    it('should delete notification', () => {
      const notifications = [
        mockNotificationData,
        { ...mockNotificationData, id: 'notif-002' }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));
      
      NotificationService.deleteNotification('notif-001');
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe('notif-002');
    });

    it('should return correct unread count', () => {
      const notifications = [
        mockNotificationData, // unread
        { ...mockNotificationData, id: 'notif-002', read: true },
        { ...mockNotificationData, id: 'notif-003', read: false }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));
      
      const count = NotificationService.getUnreadCount();
      
      expect(count).toBe(2);
    });
  });

  describe('Appointment Reminders', () => {
    beforeEach(() => {
      // Mock current time
      vi.setSystemTime(new Date('2024-03-15T08:00:00.000Z'));
    });

    it('should schedule reminders for future appointment', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(defaultSettings));
      
      const futureAppointment = {
        ...mockAppointment,
        date: '2024-03-15',
        startTime: '10:00'
      };
      
      NotificationService.scheduleAppointmentReminders(futureAppointment);
      
      // Should schedule 3 reminders (15min, 60min, 1440min)
      expect(setTimeout).toHaveBeenCalledTimes(3);
    });

    it('should not schedule reminders when notifications are disabled', () => {
      const disabledSettings = { ...defaultSettings, enabled: false };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(disabledSettings));
      
      NotificationService.scheduleAppointmentReminders(mockAppointment);
      
      expect(setTimeout).not.toHaveBeenCalled();
    });

    it('should clear existing reminders', () => {
      // Mock scheduled reminders
      (NotificationService as unknown as { scheduledReminders: Map<string, string> }).scheduledReminders = new Map([
        ['APT-001-15', 'timeout-1'],
        ['APT-001-60', 'timeout-2'],
        ['APT-002-15', 'timeout-3']
      ]);
      
      NotificationService.clearReminders('APT-001');
      
      expect(clearTimeout).toHaveBeenCalledWith('timeout-1');
      expect(clearTimeout).toHaveBeenCalledWith('timeout-2');
      expect(clearTimeout).not.toHaveBeenCalledWith('timeout-3');
    });

    it('should trigger reminder and save notification', () => {
      localStorageMock.getItem.mockReturnValue('[]'); // Empty notifications
      
      NotificationService.triggerReminder(mockAppointment, 15);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bauplan-buddy-notifications',
        expect.stringContaining('Test Appointment')
      );
      
      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'appointment-reminder'
        })
      );
    });
  });

  describe('Browser Notifications', () => {
    it('should show browser notification when permission is granted', () => {
      mockNotification.permission = 'granted';
      localStorageMock.getItem.mockReturnValue(JSON.stringify(defaultSettings));
      
      NotificationService.triggerReminder(mockAppointment, 15);
      
      expect(mockNotification).toHaveBeenCalledWith(
        expect.stringContaining('Test Appointment'),
        expect.objectContaining({
          body: expect.stringMatching(/.+/),
          icon: '/favicon.ico',
          requireInteraction: false
        })
      );
    });

    it('should request permission when not granted', async () => {
      mockNotification.permission = 'default';
      mockNotification.requestPermission.mockResolvedValue('granted');
      
      const permission = await NotificationService.requestNotificationPermission();
      
      expect(permission).toBe('granted');
      expect(mockNotification.requestPermission).toHaveBeenCalled();
    });

    it('should not show notification when permission is denied', () => {
      mockNotification.permission = 'denied';
      localStorageMock.getItem.mockReturnValue(JSON.stringify(defaultSettings));
      
      NotificationService.triggerReminder(mockAppointment, 15);
      
      expect(mockNotification).not.toHaveBeenCalled();
    });
  });

  describe('Sound Notifications', () => {
    it('should play sound when enabled', () => {
      const soundSettings = { ...defaultSettings, soundEnabled: true };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(soundSettings));
      
      NotificationService.triggerReminder(mockAppointment, 15);
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('should not play sound when disabled', () => {
      const soundSettings = { ...defaultSettings, soundEnabled: false };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(soundSettings));
      
      NotificationService.triggerReminder(mockAppointment, 15);
      
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });

    it('should handle audio errors gracefully', () => {
      mockAudioContext.createOscillator.mockImplementation(() => {
        throw new Error('Audio error');
      });
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const soundSettings = { ...defaultSettings, soundEnabled: true };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(soundSettings));
      
      NotificationService.triggerReminder(mockAppointment, 15);
      
      expect(consoleSpy).toHaveBeenCalledWith('Could not play notification sound:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Upcoming and Overdue Appointments', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2024-03-15T08:30:00.000Z'));
    });

    it('should detect upcoming appointments', () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const upcomingAppointment = {
        ...mockAppointment,
        date: '2024-03-15',
        startTime: '09:00' // 30 minutes from now
      };
      
      NotificationService.checkUpcomingAppointments([upcomingAppointment]);
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData[0].type).toBe('upcoming');
    });

    it('should not create duplicate upcoming notifications', () => {
      const existingNotification = {
        ...mockNotificationData,
        type: 'upcoming',
        appointmentId: 'APT-001',
        timestamp: new Date().toISOString()
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify([existingNotification]));
      
      const upcomingAppointment = {
        ...mockAppointment,
        date: '2024-03-15',
        startTime: '09:00'
      };
      
      NotificationService.checkUpcomingAppointments([upcomingAppointment]);
      
      // Should not save another notification
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should detect overdue appointments', () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const overdueAppointment = {
        ...mockAppointment,
        date: '2024-03-15',
        startTime: '07:00',
        endTime: '08:00' // Already ended
      };
      
      NotificationService.checkOverdueAppointments([overdueAppointment]);
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData[0].type).toBe('overdue');
    });
  });

  describe('Quiet hours handling', () => {
    it('should correctly detect quiet hours including overnight ranges', () => {
      const service = NotificationService as unknown as { isWithinQuietHours: (settings: NotificationSettings, ref?: Date) => boolean };
      const settings: NotificationSettings = {
        ...defaultSettings,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '06:00'
      };

      const lateNight = new Date(2024, 0, 1, 23, 30);
      const earlyMorning = new Date(2024, 0, 2, 5, 45);
      const midday = new Date(2024, 0, 2, 12, 0);

      expect(service.isWithinQuietHours(settings, lateNight)).toBe(true);
      expect(service.isWithinQuietHours(settings, earlyMorning)).toBe(true);
      expect(service.isWithinQuietHours(settings, midday)).toBe(false);
    });

    it('should silence browser and sound notifications during quiet hours', () => {
      const notification: Notification = {
        id: 'test-notif',
        appointmentId: 'APT-QUIET',
        type: 'system',
        title: 'Quiet Test',
        message: 'Should remain silent',
        timestamp: new Date().toISOString(),
        read: false,
        reminderTime: 0,
        priority: 'low'
      };

      const settings: NotificationSettings = {
        ...defaultSettings,
        quietHoursEnabled: true
      };

      const saveSpy = jest.spyOn(NotificationService, 'saveNotification').mockImplementation(() => {});
      const browserSpy = jest.spyOn(NotificationService as any, 'showBrowserNotification').mockResolvedValue(undefined);
      const soundSpy = jest.spyOn(NotificationService as any, 'playNotificationSound').mockImplementation(() => {});
      const quietSpy = jest.spyOn(NotificationService as any, 'isWithinQuietHours').mockReturnValue(true);

      (NotificationService as any).dispatchNotification(notification, settings);

      expect(saveSpy).toHaveBeenCalledWith(notification);
      expect(browserSpy).not.toHaveBeenCalled();
      expect(soundSpy).not.toHaveBeenCalled();
      expect(quietSpy).toHaveBeenCalledWith(settings);

      saveSpy.mockRestore();
      browserSpy.mockRestore();
      soundSpy.mockRestore();
      quietSpy.mockRestore();
    });

    it('should deliver notifications when forceDeliver is set even during quiet hours', () => {
      const notification: Notification = {
        id: 'test-force',
        appointmentId: 'APT-FORCE',
        type: 'system',
        title: 'Force Test',
        message: 'Should deliver',
        timestamp: new Date().toISOString(),
        read: false,
        reminderTime: 0,
        priority: 'high'
      };

      const settings: NotificationSettings = {
        ...defaultSettings,
        quietHoursEnabled: true
      };

      const saveSpy = jest.spyOn(NotificationService, 'saveNotification').mockImplementation(() => {});
      const browserSpy = jest.spyOn(NotificationService as any, 'showBrowserNotification').mockResolvedValue(undefined);
      const soundSpy = jest.spyOn(NotificationService as any, 'playNotificationSound').mockImplementation(() => {});
      const quietSpy = jest.spyOn(NotificationService as any, 'isWithinQuietHours').mockReturnValue(true);

      (NotificationService as any).dispatchNotification(notification, settings, { forceDeliver: true });

      expect(saveSpy).toHaveBeenCalledWith(notification);
      expect(browserSpy).toHaveBeenCalledWith(notification);
      expect(soundSpy).toHaveBeenCalled();
      expect(quietSpy).toHaveBeenCalledWith(settings);

      saveSpy.mockRestore();
      browserSpy.mockRestore();
      soundSpy.mockRestore();
      quietSpy.mockRestore();
    });
  });

  describe('Utility Functions', () => {
    it('should generate unique notification IDs', () => {
      const service = NotificationService as unknown as { generateId: () => string };
      const id1 = service.generateId();
      const id2 = service.generateId();
      
      expect(id1).toMatch(/^notif-\\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^notif-\\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should format reminder messages correctly', () => {
      const service = NotificationService as unknown as { formatReminderMessage: (appointment: unknown, minutes: number) => string };
      const message = service.formatReminderMessage(mockAppointment, 15);
      
      expect(message).toContain('Test Appointment');
      expect(message).toContain('15 Minuten');
      expect(message).toContain('09:00');
      expect(message).toContain('Test Location');
    });

    it('should calculate correct priority for reminders', () => {
      const service = NotificationService as unknown as { getPriorityForReminder: (minutes: number, priority: string) => string };
      expect(service.getPriorityForReminder(15, 'critical')).toBe('critical');
      expect(service.getPriorityForReminder(15, 'medium')).toBe('high');
      expect(service.getPriorityForReminder(60, 'medium')).toBe('medium');
      expect(service.getPriorityForReminder(1440, 'medium')).toBe('low');
    });
  });
});