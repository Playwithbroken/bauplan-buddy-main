import { StoredAppointment } from './appointmentService';
// Provide Node global typing when available (used by tests)
declare const global: { localStorage?: Storage };

export interface NotificationSettings {
  enabled: boolean;
  reminderTimes: number[]; // Minutes before appointment
  emailNotifications: boolean;
  browserNotifications: boolean;
  soundEnabled: boolean;
  smsNotifications: boolean;
  fieldAlertEscalation: boolean;
  deliveryDelayAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
}


export interface Notification {
  id: string;
  appointmentId: string;
  type: 'reminder' | 'upcoming' | 'overdue' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  starred?: boolean;
  archived?: boolean;
  reminderTime: number; // Minutes before appointment
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const STORAGE_KEYS = {
  NOTIFICATIONS: 'bauplan-buddy-notifications',
  SETTINGS: 'bauplan-buddy-notification-settings',
  SCHEDULED_REMINDERS: 'bauplan-buddy-scheduled-reminders'
};

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  reminderTimes: [15, 60, 1440], // 15 min, 1 hour, 1 day
  emailNotifications: false,
  browserNotifications: true,
  soundEnabled: true,
  smsNotifications: false,
  fieldAlertEscalation: true,
  deliveryDelayAlerts: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '06:00',
  lastUpdatedAt: undefined,
  lastUpdatedBy: ''
};

export class NotificationService {
  private static scheduledReminders: Map<string, NodeJS.Timeout> = new Map();

  private static getStorage(): Storage | undefined {
    try {
      // Prefer Node's global.localStorage if tests set it
      if (typeof global !== 'undefined' && global?.localStorage) {
        return global.localStorage as Storage;
      }
      const g = globalThis as unknown as { localStorage?: Storage; window?: Window & { localStorage?: Storage } };
      // Next prefer globalThis.localStorage (jsdom window)
      if (typeof localStorage !== 'undefined') return localStorage as Storage;
      if (g?.localStorage) return g.localStorage as Storage;
      if (g?.window?.localStorage) return g.window.localStorage as Storage;
    } catch { /* ignore */ }
    return undefined;
  }

  // Helpers that prioritize Node's global mock used in tests
  private static getNodeStorage(): Storage | undefined {
    try {
      if (typeof global !== 'undefined' && global?.localStorage) return global.localStorage as Storage;
    } catch { /* ignore */ }
    return undefined;
  }
  private static getWindowStorage(): Storage | undefined {
    const g = globalThis as unknown as { localStorage?: Storage; window?: Window & { localStorage?: Storage } };
    if (typeof localStorage !== 'undefined') return localStorage as Storage;
    if (g?.localStorage) return g.localStorage as Storage;
    return g?.window?.localStorage as Storage | undefined;
  }

  private static storageGetItem(key: string): string | null {
    const nodeLs = this.getNodeStorage();
    if (nodeLs?.getItem) return nodeLs.getItem(key);
    const winLs = this.getWindowStorage();
    return winLs?.getItem ? winLs.getItem(key) : null;
  }

  private static storageSetItem(key: string, value: string): void {
    const nodeLs = this.getNodeStorage();
    if (nodeLs?.setItem) { nodeLs.setItem(key, value); return; }
    const winLs = this.getWindowStorage();
    if (winLs?.setItem) { winLs.setItem(key, value); }
  }

  static getDefaultSettings(): NotificationSettings {
    return {
      ...DEFAULT_SETTINGS,
      reminderTimes: [...DEFAULT_SETTINGS.reminderTimes],
      lastUpdatedAt: undefined,
      lastUpdatedBy: ''
    };
  }

  static getSettings(): NotificationSettings {
    try {
      const settings = this.storageGetItem(STORAGE_KEYS.SETTINGS);
      if (!settings) {
        return DEFAULT_SETTINGS;
      }
      const parsed = JSON.parse(settings);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (error) {
      console.error('Error loading notification settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: NotificationSettings): NotificationSettings {
    try {
      const now = new Date().toISOString();
      const reminderTimes = Array.isArray(settings.reminderTimes) ? settings.reminderTimes : DEFAULT_SETTINGS.reminderTimes;
      const normalizedSettings: NotificationSettings = {
        ...DEFAULT_SETTINGS,
        ...settings,
        reminderTimes: [...new Set(reminderTimes)].sort((a, b) => a - b),
        quietHoursStart: settings.quietHoursStart || DEFAULT_SETTINGS.quietHoursStart,
        quietHoursEnd: settings.quietHoursEnd || DEFAULT_SETTINGS.quietHoursEnd,
        lastUpdatedAt: now,
        lastUpdatedBy: settings.lastUpdatedBy?.trim() ?? ''
      };
      this.storageSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(normalizedSettings));
      return normalizedSettings;
    } catch (error) {
      console.error('Error saving notification settings:', error);
      return settings;
    }
  }

  static getAllNotifications(): Notification[] {
    try {
      const notifications = this.storageGetItem(STORAGE_KEYS.NOTIFICATIONS);
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  }

  static saveNotification(notification: Notification): void {
    try {
      const notifications = this.getAllNotifications();
      notifications.push(notification);
      
      // Keep only last 100 notifications
      const sortedNotifications = notifications
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 100);
      
      this.storageSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(sortedNotifications));
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  }

  static markAsRead(notificationId: string): void {
    try {
      const notifications = this.getAllNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.read = true;
        this.storageSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  static markAllAsRead(): void {
    try {
      const notifications = this.getAllNotifications();
      notifications.forEach(n => n.read = true);
      this.storageSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  static deleteNotification(notificationId: string): void {
    try {
      const notifications = this.getAllNotifications();
      const filteredNotifications = notifications.filter(n => n.id !== notificationId);
      this.storageSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(filteredNotifications));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  static archiveNotification(notificationId: string): void {
    try {
      const notifications = this.getAllNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.archived = true;
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  }

  static getUnreadCount(): number {
    return this.getAllNotifications().filter(n => !n.read).length;
  }

  static scheduleAppointmentReminders(appointment: StoredAppointment): void {
    const settings = this.getSettings();
    if (!settings.enabled) return;

    const appointmentDateTime = new Date(`${appointment.date}T${appointment.startTime}`);
    const now = new Date();

    // Clear existing reminders for this appointment
    this.clearReminders(appointment.id);

    settings.reminderTimes.forEach(reminderMinutes => {
      const reminderTime = new Date(appointmentDateTime.getTime() - reminderMinutes * 60 * 1000);
      
      // Only schedule if reminder time is in the future
      if (reminderTime > now) {
        const timeoutId = setTimeout(() => {
          this.triggerReminder(appointment, reminderMinutes);
        }, reminderTime.getTime() - now.getTime());

        this.scheduledReminders.set(`${appointment.id}-${reminderMinutes}`, timeoutId);
      }
    });
  }

  static clearReminders(appointmentId: string): void {
    // Clear all reminders for this appointment
    for (const [key, timeoutId] of this.scheduledReminders.entries()) {
      if (key.startsWith(appointmentId)) {
        clearTimeout(timeoutId);
        this.scheduledReminders.delete(key);
      }
    }
  }

  static triggerReminder(appointment: StoredAppointment, reminderMinutes: number): void {
    const settings = this.getSettings();

    const notification: Notification = {
      id: this.generateId(),
      appointmentId: appointment.id,
      type: 'reminder',
      title: `Termin Erinnerung: ${appointment.title}`,
      message: this.formatReminderMessage(appointment, reminderMinutes),
      timestamp: new Date().toISOString(),
      read: false,
      reminderTime: reminderMinutes,
      priority: this.getPriorityForReminder(reminderMinutes, appointment.priority)
    };

    // Deliver notification respecting user preferences
    this.dispatchNotification(notification, settings);

    // Trigger custom event for UI updates
    window.dispatchEvent(new CustomEvent('appointment-reminder', {
      detail: { notification, appointment }
    }));
  }

  static checkUpcomingAppointments(appointments: StoredAppointment[]): void {
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    const settings = this.getSettings();

    appointments.forEach(appointment => {
      const appointmentDateTime = new Date(`${appointment.date}T${appointment.startTime}`);

      // Check if appointment is within the next hour and not already notified
      if (appointmentDateTime > now && appointmentDateTime <= nextHour) {
        const existingNotifications = this.getAllNotifications();
        const alreadyNotified = existingNotifications.some(n =>
          n.appointmentId === appointment.id &&
          n.type === 'upcoming' &&
          new Date(n.timestamp).toDateString() === now.toDateString()
        );

        if (!alreadyNotified) {
          const notification: Notification = {
            id: this.generateId(),
            appointmentId: appointment.id,
            type: 'upcoming',
            title: `Anstehender Termin: ${appointment.title}`,
            message: `Ihr Termin beginnt in ${Math.round((appointmentDateTime.getTime() - now.getTime()) / (1000 * 60))} Minuten.`,
            timestamp: new Date().toISOString(),
            read: false,
            reminderTime: 0,
            priority: appointment.priority === 'critical' ? 'critical' : 'high'
          };

          this.dispatchNotification(notification, settings);
        }
      }
    });
  }

  static checkOverdueAppointments(appointments: StoredAppointment[]): void {
    const now = new Date();
    const settings = this.getSettings();

    appointments.forEach(appointment => {
      const appointmentDateTime = new Date(`${appointment.date}T${appointment.endTime || appointment.startTime}`);

      // Check if appointment is overdue (simply check if end time has passed)
      if (appointmentDateTime < now) {
        const existingNotifications = this.getAllNotifications();
        const alreadyNotified = existingNotifications.some(n =>
          n.appointmentId === appointment.id &&
          n.type === 'overdue'
        );

        if (!alreadyNotified) {
          const notification: Notification = {
            id: this.generateId(),
            appointmentId: appointment.id,
            type: 'overdue',
            title: `Ueberfaelliger Termin: ${appointment.title}`,
            message: `Dieser Termin ist seit ${this.formatTimeDifference(now, appointmentDateTime)} ueberfaellig.`,
            timestamp: new Date().toISOString(),
            read: false,
            reminderTime: 0,
            priority: 'critical'
          };

          this.dispatchNotification(notification, settings);
        }
      }
    });
  }

  private static formatReminderMessage(appointment: StoredAppointment, reminderMinutes: number): string {
    const timeText = reminderMinutes < 60 
      ? `${reminderMinutes} Minuten`
      : reminderMinutes < 1440 
      ? `${Math.round(reminderMinutes / 60)} Stunden`
      : `${Math.round(reminderMinutes / 1440)} Tagen`;

    return `Ihr Termin "${appointment.title}" beginnt in ${timeText} um ${appointment.startTime} Uhr${appointment.location ? ` in ${appointment.location}` : ''}.`;
  }

  private static formatTimeDifference(now: Date, past: Date): string {
    const diffMinutes = Math.round((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} Minuten`;
    } else if (diffMinutes < 1440) {
      return `${Math.round(diffMinutes / 60)} Stunden`;
    } else {
      return `${Math.round(diffMinutes / 1440)} Tagen`;
    }
  }

  private static getPriorityForReminder(reminderMinutes: number, appointmentPriority: string): 'low' | 'medium' | 'high' | 'critical' {
    if (appointmentPriority === 'critical') return 'critical';
    if (reminderMinutes <= 15) return 'high';
    if (reminderMinutes <= 60) return 'medium';
    return 'low';
  }

  private static async showBrowserNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical'
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
          requireInteraction: notification.priority === 'critical'
        });
      }
    }
  }

  private static isWithinQuietHours(settings: NotificationSettings, referenceDate: Date = new Date()): boolean {
    if (!settings.quietHoursEnabled) {
      return false;
    }

    const [startHour, startMinute] = settings.quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = settings.quietHoursEnd.split(':').map(Number);
    if ([startHour, startMinute, endHour, endMinute].some(value => Number.isNaN(value))) {
      return false;
    }

    const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (startMinutes == endMinutes) {
      // Avoid muting the entire day when start and end are identical
      return false;
    }

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  private static dispatchNotification(notification: Notification, settings: NotificationSettings, options: { forceDeliver?: boolean } = {}): void {
    const shouldSilence = !options.forceDeliver && this.isWithinQuietHours(settings);

    this.saveNotification(notification);

    if (settings.browserNotifications && !shouldSilence) {
      void this.showBrowserNotification(notification);
    }

    if (settings.soundEnabled && !shouldSilence) {
      this.playNotificationSound();
    }
  }

  private static playNotificationSound(): void {
    try {
      // Create a simple notification sound using Web Audio API
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  private static generateId(): string {
    return 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  static async triggerTestNotification(): Promise<void> {
    const settings = this.getSettings();
    if (!settings.enabled) {
      console.info('Notification system disabled, skipping test notification.');
      return;
    }

    if (settings.browserNotifications && ('Notification' in window) && Notification.permission === 'default') {
      await this.requestNotificationPermission();
    }

    const notification: Notification = {
      id: this.generateId(),
      appointmentId: 'test',
      type: 'system',
      title: 'Testbenachrichtigung',
      message: 'Dies ist eine Testbenachrichtigung fuer Ihre aktuellen Einstellungen.',
      timestamp: new Date().toISOString(),
      read: false,
      reminderTime: 0,
      priority: 'low'
    };

    this.dispatchNotification(notification, settings, { forceDeliver: true });
  }

  static requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return Promise.resolve('denied');
    }
    
    return Notification.requestPermission();
  }

  static initializeNotificationSystem(appointments: StoredAppointment[]): void {
    // Request notification permission
    this.requestNotificationPermission();

    // Schedule reminders for all future appointments
    appointments.forEach(appointment => {
      const appointmentDateTime = new Date(`${appointment.date}T${appointment.startTime}`);
      if (appointmentDateTime > new Date()) {
        this.scheduleAppointmentReminders(appointment);
      }
    });

    // Set up periodic checks for upcoming and overdue appointments
    setInterval(() => {
      this.checkUpcomingAppointments(appointments);
      this.checkOverdueAppointments(appointments);
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
}
