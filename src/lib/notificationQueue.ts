/**
 * Notification Queue Service
 * 
 * Real-time notification system with:
 * - Priority-based queuing
 * - Deduplication
 * - Rate limiting
 * - Persistence
 * - Push notification support
 */

import { logger } from "./logger";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  timestamp: Date;
  read: boolean;
  dismissed: boolean;
  expiresAt?: Date;
  action?: NotificationAction;
  metadata?: Record<string, unknown>;
  groupKey?: string;
}

export interface NotificationAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export type NotificationType = 
  | "info"
  | "success"
  | "warning"
  | "error"
  | "system";

export type NotificationPriority = 
  | "low"
  | "normal"
  | "high"
  | "urgent";

export type NotificationCategory =
  | "project"
  | "invoice"
  | "quote"
  | "delivery"
  | "team"
  | "calendar"
  | "system"
  | "procurement"
  | "message";

const PRIORITY_ORDER: Record<NotificationPriority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

const STORAGE_KEY = "notification_queue";
const MAX_NOTIFICATIONS = 100;
const RATE_LIMIT_MS = 1000; // 1 notification per second max

class NotificationQueueService {
  private queue: Notification[] = [];
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private lastNotificationTime: number = 0;
  private pendingNotifications: Notification[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.loadFromStorage();
    this.startCleanupTimer();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.queue = parsed.map((n: Notification) => ({
          ...n,
          timestamp: new Date(n.timestamp),
          expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
        }));
      }
    } catch (error) {
      logger.error("Failed to load notifications", {}, error instanceof Error ? error : undefined);
    }
  }

  private saveToStorage(): void {
    try {
      // Keep only the most recent notifications
      const toSave = this.queue.slice(-MAX_NOTIFICATIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      logger.error("Failed to save notifications", {}, error instanceof Error ? error : undefined);
    }
  }

  private startCleanupTimer(): void {
    // Clean up expired notifications every minute
    setInterval(() => {
      this.cleanupExpired();
    }, 60000);
  }

  private cleanupExpired(): void {
    const now = new Date();
    const before = this.queue.length;
    
    this.queue = this.queue.filter(n => {
      if (n.expiresAt && n.expiresAt < now) return false;
      return true;
    });

    if (this.queue.length < before) {
      this.saveToStorage();
      this.notifyListeners();
      logger.debug("Cleaned up expired notifications", { 
        removed: before - this.queue.length 
      });
    }
  }

  /**
   * Add a notification to the queue
   */
  push(notification: Omit<Notification, "id" | "timestamp" | "read" | "dismissed">): Notification {
    const fullNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
      dismissed: false,
    };

    // Check for duplicates (same groupKey within last 5 seconds)
    if (notification.groupKey) {
      const duplicate = this.queue.find(n => 
        n.groupKey === notification.groupKey &&
        Date.now() - n.timestamp.getTime() < 5000
      );
      
      if (duplicate) {
        logger.debug("Duplicate notification suppressed", { groupKey: notification.groupKey });
        return duplicate;
      }
    }

    // Rate limiting
    const now = Date.now();
    if (now - this.lastNotificationTime < RATE_LIMIT_MS) {
      this.pendingNotifications.push(fullNotification);
      this.scheduleFlush();
      return fullNotification;
    }

    this.lastNotificationTime = now;
    this.addToQueue(fullNotification);
    
    return fullNotification;
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return;
    
    this.flushTimer = setTimeout(() => {
      this.flushTimer = undefined;
      if (this.pendingNotifications.length > 0) {
        const notification = this.pendingNotifications.shift()!;
        this.lastNotificationTime = Date.now();
        this.addToQueue(notification);
        
        if (this.pendingNotifications.length > 0) {
          this.scheduleFlush();
        }
      }
    }, RATE_LIMIT_MS);
  }

  private addToQueue(notification: Notification): void {
    this.queue.push(notification);
    
    // Sort by priority then timestamp
    this.queue.sort((a, b) => {
      const priorityDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Trim to max size
    if (this.queue.length > MAX_NOTIFICATIONS) {
      this.queue = this.queue.slice(0, MAX_NOTIFICATIONS);
    }

    this.saveToStorage();
    this.notifyListeners();
    
    logger.debug("Notification added", {
      id: notification.id,
      type: notification.type,
      priority: notification.priority,
    });

    // Request push notification permission if urgent
    if (notification.priority === "urgent") {
      this.sendPushNotification(notification);
    }
  }

  /**
   * Convenience methods for different notification types
   */
  info(title: string, message: string, options?: Partial<Notification>): Notification {
    return this.push({
      type: "info",
      title,
      message,
      priority: "normal",
      category: "system",
      ...options,
    });
  }

  success(title: string, message: string, options?: Partial<Notification>): Notification {
    return this.push({
      type: "success",
      title,
      message,
      priority: "normal",
      category: "system",
      ...options,
    });
  }

  warning(title: string, message: string, options?: Partial<Notification>): Notification {
    return this.push({
      type: "warning",
      title,
      message,
      priority: "high",
      category: "system",
      ...options,
    });
  }

  error(title: string, message: string, options?: Partial<Notification>): Notification {
    return this.push({
      type: "error",
      title,
      message,
      priority: "urgent",
      category: "system",
      ...options,
    });
  }

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return [...this.queue];
  }

  /**
   * Get unread notifications
   */
  getUnread(): Notification[] {
    return this.queue.filter(n => !n.read && !n.dismissed);
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.getUnread().length;
  }

  /**
   * Get notifications by category
   */
  getByCategory(category: NotificationCategory): Notification[] {
    return this.queue.filter(n => n.category === category);
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    const notification = this.queue.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead(): void {
    this.queue.forEach(n => n.read = true);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Dismiss notification
   */
  dismiss(id: string): void {
    const notification = this.queue.find(n => n.id === id);
    if (notification) {
      notification.dismissed = true;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    this.queue.forEach(n => n.dismissed = true);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Remove notification
   */
  remove(id: string): void {
    this.queue = this.queue.filter(n => n.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.queue = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Subscribe to notification changes
   */
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.getAll()));
  }

  /**
   * Send push notification (if supported and permitted)
   */
  private async sendPushNotification(notification: Notification): Promise<void> {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
          tag: notification.id,
          requireInteraction: notification.priority === "urgent",
        });
      } catch (error) {
        logger.debug("Push notification failed", { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  }

  /**
   * Request push notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      return "denied";
    }
    return Notification.requestPermission();
  }
}

// Singleton instance
export const notificationQueue = new NotificationQueueService();

// React hook
import { useState, useEffect } from "react";

export function useNotifications(): {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  clear: () => void;
} {
  const [notifications, setNotifications] = useState<Notification[]>(() => 
    notificationQueue.getAll()
  );

  useEffect(() => {
    const unsubscribe = notificationQueue.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read && !n.dismissed).length,
    markAsRead: (id: string) => notificationQueue.markAsRead(id),
    markAllAsRead: () => notificationQueue.markAllAsRead(),
    dismiss: (id: string) => notificationQueue.dismiss(id),
    dismissAll: () => notificationQueue.dismissAll(),
    clear: () => notificationQueue.clear(),
  };
}

// Export for testing
export { NotificationQueueService };
