export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'appointment' | 'project' | 'message' | 'invoice' | 'deadline' | 'system';
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  renotify?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface ScheduledNotification {
  id: string;
  payload: NotificationPayload;
  scheduledTime: Date;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
  conditions?: {
    beforeEvent?: number; // Minutes before event
    reminderCount?: number;
    workHoursOnly?: boolean;
  };
}

export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  userAgent: string;
  createdAt: Date;
  lastUsed: Date;
  enabled: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  categories: {
    appointments: boolean;
    projectUpdates: boolean;
    messages: boolean;
    invoices: boolean;
    deadlines: boolean;
    system: boolean;
  };
  workHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
    weekdays: boolean[];
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: {
    immediate: boolean;
    digest: boolean;
    digestTime: string; // HH:mm format
  };
  vibration: boolean;
  sound: boolean;
  badgeCount: boolean;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private settings: NotificationSettings;
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private notificationQueue: NotificationPayload[] = [];
  private isOnline: boolean = navigator.onLine;

  // VAPID public key (in production, this would come from environment)
  private readonly vapidPublicKey = 'BOzRgFGj5G4CBWbpJaVKGhsVPHj1ULJFSsRdQOzE9_jE2V8QtL9g1VQxs_TjJ0zYHd1YKQ-ZxdYRLQjD8P5XHVQ';

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  constructor() {
    this.settings = this.loadSettings();
    this.initialize();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processNotificationQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private async initialize(): Promise<void> {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        this.registration = await navigator.serviceWorker.ready;
        await this.loadSubscription();
        this.setupMessageListener();
        this.loadScheduledNotifications();
      }
    } catch (error) {
      console.error('Failed to initialize push notification service:', error);
    }
  }

  private setupMessageListener(): void {
    if (this.registration) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
          this.handleNotificationClick(event.data.notification);
        }
      });
    }
  }

  private handleNotificationClick(notification: NotificationPayload): void {
    // Handle notification click based on category
    switch (notification.category) {
      case 'appointment':
        window.open('/calendar', '_blank');
        break;
      case 'project':
        if (notification.data?.projectId) {
          window.open(`/projects/${notification.data.projectId}`, '_blank');
        } else {
          window.open('/projects', '_blank');
        }
        break;
      case 'message':
        window.open('/chat', '_blank');
        break;
      case 'invoice':
        window.open('/invoices', '_blank');
        break;
      case 'deadline':
        window.open('/dashboard', '_blank');
        break;
      default:
        window.open('/dashboard', '_blank');
    }
  }

  public async requestPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
      }

      let permission = Notification.permission;
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        await this.subscribeUser();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  private async subscribeUser(): Promise<void> {
    try {
      if (!this.registration) return;

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      this.subscription = subscription;
      await this.saveSubscription(subscription);
    } catch (error) {
      console.error('Failed to subscribe user:', error);
    }
  }

  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    const subscriptionData: NotificationSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh')!)))),
        auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('auth')!))))
      },
      userId: this.getCurrentUserId(),
      deviceType: this.getDeviceType(),
      userAgent: navigator.userAgent,
      createdAt: new Date(),
      lastUsed: new Date(),
      enabled: true
    };

    localStorage.setItem('push_subscription', JSON.stringify(subscriptionData));
    
    // In production, send to backend
    // await this.sendSubscriptionToBackend(subscriptionData);
  }

  private async loadSubscription(): Promise<void> {
    try {
      if (!this.registration) return;

      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (!this.subscription) {
        const stored = localStorage.getItem('push_subscription');
        if (stored) {
          // Subscription exists in storage but not active, re-subscribe
          await this.subscribeUser();
        }
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  }

  public async sendNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      if (!this.isNotificationAllowed(payload)) {
        return false;
      }

      if (!this.isOnline) {
        this.notificationQueue.push(payload);
        return false;
      }

      // Check if it's within work hours if applicable
      if (!this.isWithinAllowedHours(payload)) {
        return false;
      }

      if ('serviceWorker' in navigator && this.registration) {
        await this.registration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icons/icon-192.png',
          badge: payload.badge || '/icons/badge-72.png',
          image: payload.image,
          tag: payload.tag || payload.id,
          data: payload.data,
          actions: payload.actions,
          requireInteraction: payload.requireInteraction || payload.priority === 'urgent',
          silent: payload.silent || false,
          vibrate: payload.vibrate || (this.settings.vibration ? [200, 100, 200] : undefined),
          renotify: payload.renotify || false,
          timestamp: payload.timestamp
        });

        this.updateBadgeCount();
        return true;
      }

      // Fallback for browsers without service worker support
      if (Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icons/icon-192.png',
          tag: payload.tag || payload.id,
          data: payload.data,
          requireInteraction: payload.requireInteraction || payload.priority === 'urgent',
          silent: payload.silent || false,
          vibrate: payload.vibrate || (this.settings.vibration ? [200, 100, 200] : undefined),
          renotify: payload.renotify || false
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  public scheduleNotification(notification: ScheduledNotification): void {
    this.scheduledNotifications.set(notification.id, notification);
    this.saveScheduledNotifications();
    this.scheduleNext(notification);
  }

  private scheduleNext(notification: ScheduledNotification): void {
    const now = new Date();
    const scheduledTime = notification.scheduledTime;
    
    if (scheduledTime <= now) return;

    const delay = scheduledTime.getTime() - now.getTime();
    
    setTimeout(() => {
      this.sendNotification(notification.payload);
      
      // Handle recurring notifications
      if (notification.recurring) {
        const nextTime = this.calculateNextRecurrence(scheduledTime, notification.recurring);
        if (nextTime && (!notification.recurring.endDate || nextTime <= notification.recurring.endDate)) {
          const nextNotification: ScheduledNotification = {
            ...notification,
            id: `${notification.id}_${nextTime.getTime()}`,
            scheduledTime: nextTime
          };
          this.scheduleNotification(nextNotification);
        }
      }
      
      this.scheduledNotifications.delete(notification.id);
      this.saveScheduledNotifications();
    }, delay);
  }

  private calculateNextRecurrence(lastTime: Date, recurring: ScheduledNotification['recurring']): Date | null {
    if (!recurring) return null;

    const next = new Date(lastTime);
    
    switch (recurring.type) {
      case 'daily':
        next.setDate(next.getDate() + recurring.interval);
        break;
      case 'weekly':
        next.setDate(next.getDate() + (7 * recurring.interval));
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + recurring.interval);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + recurring.interval);
        break;
    }
    
    return next;
  }

  // Notification creators for different event types
  public createAppointmentReminder(
    appointment: { id: string; title: string },
    minutesBefore: number = 15
  ): NotificationPayload {
    return {
      id: `appointment_${appointment.id}_${minutesBefore}`,
      title: 'Terminerinnerung',
      body: `"${appointment.title}" beginnt in ${minutesBefore} Minuten`,
      icon: '/icons/calendar.png',
      category: 'appointment',
      priority: 'high',
      data: { appointmentId: appointment.id, type: 'reminder' },
      actions: [
        { action: 'view', title: 'Anzeigen', icon: '/icons/view.png' },
        { action: 'snooze', title: '5 Min später', icon: '/icons/snooze.png' }
      ],
      timestamp: Date.now(),
      requireInteraction: true,
      vibrate: [300, 100, 300]
    };
  }

  public createProjectUpdateNotification(project: { id: string; name: string }, update: string): NotificationPayload {
    return {
      id: `project_update_${project.id}_${Date.now()}`,
      title: `Projekt "${project.name}" aktualisiert`,
      body: update,
      icon: '/icons/project.png',
      category: 'project',
      priority: 'normal',
      data: { projectId: project.id, type: 'update' },
      actions: [
        { action: 'view', title: 'Details anzeigen', icon: '/icons/view.png' }
      ],
      timestamp: Date.now(),
      vibrate: [200, 100, 200]
    };
  }

  public createDeadlineNotification(task: { id: string; title: string; deadline?: string | number | Date }, daysUntilDeadline: number): NotificationPayload {
    const urgency = daysUntilDeadline <= 1 ? 'urgent' : daysUntilDeadline <= 3 ? 'high' : 'normal';
    
    return {
      id: `deadline_${task.id}_${daysUntilDeadline}`,
      title: 'Deadline-Erinnerung',
      body: `"${task.title}" ist in ${daysUntilDeadline} Tag(en) fällig`,
      icon: '/icons/deadline.png',
      category: 'deadline',
      priority: urgency,
      data: { taskId: task.id, deadline: task.deadline },
      actions: [
        { action: 'view', title: 'Aufgabe anzeigen', icon: '/icons/task.png' },
        { action: 'complete', title: 'Als erledigt markieren', icon: '/icons/check.png' }
      ],
      timestamp: Date.now(),
      requireInteraction: urgency === 'urgent',
      vibrate: urgency === 'urgent' ? [500, 200, 500, 200, 500] : [200, 100, 200]
    };
  }

  public createMessageNotification(message: { id: string; senderName: string; content: string; chatId?: string }): NotificationPayload {
    return {
      id: `message_${message.id}`,
      title: `Neue Nachricht von ${message.senderName}`,
      body: message.content.substring(0, 100),
      icon: '/icons/message.png',
      category: 'message',
      priority: 'normal',
      data: { messageId: message.id, chatId: message.chatId },
      actions: [
        { action: 'reply', title: 'Antworten', icon: '/icons/reply.png' },
        { action: 'view', title: 'Chat öffnen', icon: '/icons/chat.png' }
      ],
      timestamp: Date.now(),
      vibrate: [100, 50, 100]
    };
  }

  // Utility methods
  private isNotificationAllowed(payload: NotificationPayload): boolean {
    if (!this.settings.enabled) return false;
    
    switch (payload.category) {
      case 'appointment':
        return this.settings.categories.appointments;
      case 'project':
        return this.settings.categories.projectUpdates;
      case 'message':
        return this.settings.categories.messages;
      case 'invoice':
        return this.settings.categories.invoices;
      case 'deadline':
        return this.settings.categories.deadlines;
      case 'system':
        return this.settings.categories.system;
      default:
        return true;
    }
  }

  private isWithinAllowedHours(payload: NotificationPayload): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const dayOfWeek = now.getDay();

    // Check quiet hours
    if (this.settings.quietHours.enabled) {
      const [quietStartHour, quietStartMin] = this.settings.quietHours.start.split(':').map(Number);
      const [quietEndHour, quietEndMin] = this.settings.quietHours.end.split(':').map(Number);
      const quietStart = quietStartHour * 60 + quietStartMin;
      const quietEnd = quietEndHour * 60 + quietEndMin;
      
      if (quietStart <= quietEnd) {
        if (currentTime >= quietStart && currentTime <= quietEnd) {
          return payload.priority === 'urgent';
        }
      } else {
        // Quiet hours span midnight
        if (currentTime >= quietStart || currentTime <= quietEnd) {
          return payload.priority === 'urgent';
        }
      }
    }

    // Check work hours
    if (this.settings.workHours.enabled && !this.settings.workHours.weekdays[dayOfWeek]) {
      return payload.priority === 'urgent';
    }

    if (this.settings.workHours.enabled) {
      const [workStartHour, workStartMin] = this.settings.workHours.start.split(':').map(Number);
      const [workEndHour, workEndMin] = this.settings.workHours.end.split(':').map(Number);
      const workStart = workStartHour * 60 + workStartMin;
      const workEnd = workEndHour * 60 + workEndMin;
      
      if (currentTime < workStart || currentTime > workEnd) {
        return payload.priority === 'urgent';
      }
    }

    return true;
  }

  private async processNotificationQueue(): Promise<void> {
    while (this.notificationQueue.length > 0 && this.isOnline) {
      const notification = this.notificationQueue.shift();
      if (notification) {
        await this.sendNotification(notification);
      }
    }
  }

  private async updateBadgeCount(): Promise<void> {
    if (!this.settings.badgeCount || !('setAppBadge' in navigator)) return;

    try {
      // In a real app, this would be the actual unread count
      const unreadCount = this.getUnreadNotificationCount();
      const navWithBadge = navigator as Navigator & { setAppBadge?: (count?: number) => Promise<void> };
      await navWithBadge.setAppBadge?.(unreadCount);
    } catch (error) {
      console.error('Failed to update badge count:', error);
    }
  }

  private getUnreadNotificationCount(): number {
    // Mock implementation - in real app, this would query the backend
    return Math.floor(Math.random() * 10);
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  private getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getCurrentUserId(): string {
    // In a real app, this would come from the auth service
    return 'user_' + Date.now();
  }

  // Settings management
  private loadSettings(): NotificationSettings {
    try {
      const stored = localStorage.getItem('notification_settings');
      if (stored) {
        return { ...this.getDefaultSettings(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
    return this.getDefaultSettings();
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      categories: {
        appointments: true,
        projectUpdates: true,
        messages: true,
        invoices: true,
        deadlines: true,
        system: true
      },
      workHours: {
        enabled: false,
        start: '09:00',
        end: '17:00',
        weekdays: [false, true, true, true, true, true, false] // Sunday to Saturday
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00'
      },
      frequency: {
        immediate: true,
        digest: false,
        digestTime: '09:00'
      },
      vibration: true,
      sound: true,
      badgeCount: true
    };
  }

  public updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('notification_settings', JSON.stringify(this.settings));
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  private loadScheduledNotifications(): void {
    try {
      const stored = localStorage.getItem('scheduled_notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        notifications.forEach((notification: ScheduledNotification) => {
          notification.scheduledTime = new Date(notification.scheduledTime);
          if (notification.recurring?.endDate) {
            notification.recurring.endDate = new Date(notification.recurring.endDate);
          }
          this.scheduledNotifications.set(notification.id, notification);
          this.scheduleNext(notification);
        });
      }
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
    }
  }

  private saveScheduledNotifications(): void {
    try {
      const notifications = Array.from(this.scheduledNotifications.values());
      localStorage.setItem('scheduled_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save scheduled notifications:', error);
    }
  }

  public cancelScheduledNotification(id: string): void {
    this.scheduledNotifications.delete(id);
    this.saveScheduledNotifications();
  }

  public getScheduledNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values());
  }

  public async clearAllNotifications(): Promise<void> {
    if ('serviceWorker' in navigator && this.registration) {
      const notifications = await this.registration.getNotifications();
      notifications.forEach(notification => notification.close());
    }
    
    await this.updateBadgeCount();
  }

  public isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  public getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

export default PushNotificationService.getInstance();
