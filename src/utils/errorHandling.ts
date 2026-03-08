import { ApiError } from '../services/api';
import { StoredAppointment } from '../services/appointmentService';
import { AppointmentFormData } from '../components/AppointmentDialog';

// Error types for appointment operations
export enum AppointmentErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  SYNC_ERROR = 'SYNC_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppointmentError {
  type: AppointmentErrorType;
  message: string;
  code?: string;
  details?: unknown;
  retryable: boolean;
  timestamp: string;
}

/**
 * Enhanced error handling for appointment operations
 */
export class AppointmentErrorHandler {
  private static errorLog: AppointmentError[] = [];
  private static readonly MAX_ERROR_LOG = 100;

  /**
   * Convert any error to a standardized AppointmentError
   */
  static handleError(error: unknown, context?: string): AppointmentError {
    const timestamp = new Date().toISOString();
    let appointmentError: AppointmentError;

    if (error instanceof ApiError) {
      appointmentError = {
        type: this.getErrorTypeFromApiError(error),
        message: error.message,
        code: error.code,
        details: error.details,
        retryable: this.isRetryableApiError(error),
        timestamp,
      };
    } else if (error instanceof Error) {
      appointmentError = {
        type: this.getErrorTypeFromMessage(error.message),
        message: error.message,
        details: { stack: error.stack, context },
        retryable: this.isRetryableError(error),
        timestamp,
      };
    } else {
      appointmentError = {
        type: AppointmentErrorType.UNKNOWN_ERROR,
        message: 'An unknown error occurred',
        details: { error, context },
        retryable: false,
        timestamp,
      };
    }

    this.logError(appointmentError);
    return appointmentError;
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: AppointmentError): string {
    switch (error.type) {
      case AppointmentErrorType.NETWORK_ERROR:
        return 'Keine Internetverbindung. Die Änderungen werden synchronisiert, sobald die Verbindung wiederhergestellt ist.';
      case AppointmentErrorType.API_ERROR:
        return 'Server-Problem. Bitte versuchen Sie es später erneut.';
      case AppointmentErrorType.VALIDATION_ERROR:
        return 'Eingabefehler. Bitte überprüfen Sie Ihre Daten.';
      case AppointmentErrorType.CONFLICT_ERROR:
        return 'Terminkonflikt erkannt. Bitte wählen Sie eine andere Zeit.';
      case AppointmentErrorType.PERMISSION_ERROR:
        return 'Keine Berechtigung für diese Aktion.';
      case AppointmentErrorType.SYNC_ERROR:
        return 'Synchronisationsfehler. Die Daten werden im Hintergrund synchronisiert.';
      case AppointmentErrorType.STORAGE_ERROR:
        return 'Speicherfehler. Bitte überprüfen Sie den verfügbaren Speicherplatz.';
      default:
        return 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
    }
  }

  /**
   * Get suggested actions for error recovery
   */
  static getSuggestedActions(error: AppointmentError): string[] {
    switch (error.type) {
      case AppointmentErrorType.NETWORK_ERROR:
        return [
          'Internetverbindung prüfen',
          'WLAN/Mobile Daten aktivieren',
          'Später automatisch synchronisieren',
        ];
      case AppointmentErrorType.API_ERROR:
        return [
          'Seite neu laden',
          'In wenigen Minuten erneut versuchen',
          'Support kontaktieren, falls das Problem weiterhin besteht',
        ];
      case AppointmentErrorType.VALIDATION_ERROR:
        return [
          'Pflichtfelder ausfüllen',
          'Datumformat überprüfen',
          'Zeitangaben korrigieren',
        ];
      case AppointmentErrorType.CONFLICT_ERROR:
        return [
          'Alternative Zeit wählen',
          'Ressourcen freigeben',
          'Terminvorschläge anzeigen',
        ];
      case AppointmentErrorType.SYNC_ERROR:
        return [
          'Manuell synchronisieren',
          'Offline weiterarbeiten',
          'Bei nächster Verbindung automatisch synchronisieren',
        ];
      default:
        return [
          'Seite neu laden',
          'Browser-Cache leeren',
          'Support kontaktieren',
        ];
    }
  }

  /**
   * Check if error should trigger a retry
   */
  static shouldRetry(error: AppointmentError, attemptCount: number = 0): boolean {
    const maxRetries = 3;
    return error.retryable && attemptCount < maxRetries;
  }

  /**
   * Get retry delay based on attempt count (exponential backoff)
   */
  static getRetryDelay(attemptCount: number): number {
    return Math.min(1000 * Math.pow(2, attemptCount), 10000); // Max 10 seconds
  }

  /**
   * Log error for analytics and debugging
   */
  private static logError(error: AppointmentError): void {
    this.errorLog.unshift(error);
    if (this.errorLog.length > this.MAX_ERROR_LOG) {
      this.errorLog = this.errorLog.slice(0, this.MAX_ERROR_LOG);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Appointment Error:', error);
    }

    // TODO: Send to analytics service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(error);
    }
  }

  /**
   * Get error statistics for monitoring
   */
  static getErrorStatistics(): {
    total: number;
    byType: Record<AppointmentErrorType, number>;
    recentErrors: AppointmentError[];
    errorRate: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentErrors = this.errorLog.filter(
      error => new Date(error.timestamp).getTime() > oneHourAgo
    );

    const byType = this.errorLog.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<AppointmentErrorType, number>);

    return {
      total: this.errorLog.length,
      byType,
      recentErrors: recentErrors.slice(0, 10),
      errorRate: recentErrors.length, // errors per hour
    };
  }

  private static getErrorTypeFromApiError(error: ApiError): AppointmentErrorType {
    if (error.code === 'NETWORK_ERROR') return AppointmentErrorType.NETWORK_ERROR;
    if (error.code === 'VALIDATION_ERROR') return AppointmentErrorType.VALIDATION_ERROR;
    if (error.code === 'CONFLICT_ERROR') return AppointmentErrorType.CONFLICT_ERROR;
    if (error.code === 'PERMISSION_ERROR') return AppointmentErrorType.PERMISSION_ERROR;
    if (error.code === 'SYNC_ERROR') return AppointmentErrorType.SYNC_ERROR;
    return AppointmentErrorType.API_ERROR;
  }

  private static getErrorTypeFromMessage(message: string): AppointmentErrorType {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return AppointmentErrorType.NETWORK_ERROR;
    }
    if (lowerMessage.includes('validation') || lowerMessage.includes('required')) {
      return AppointmentErrorType.VALIDATION_ERROR;
    }
    if (lowerMessage.includes('conflict')) {
      return AppointmentErrorType.CONFLICT_ERROR;
    }
    if (lowerMessage.includes('storage') || lowerMessage.includes('quota')) {
      return AppointmentErrorType.STORAGE_ERROR;
    }
    return AppointmentErrorType.UNKNOWN_ERROR;
  }

  private static isRetryableApiError(error: ApiError): boolean {
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'SERVER_ERROR'];
    return retryableCodes.includes(error.code);
  }

  private static isRetryableError(error: Error): boolean {
    const retryableMessages = ['network', 'timeout', 'fetch', 'server'];
    return retryableMessages.some(msg => error.message.toLowerCase().includes(msg));
  }

  private static sendToAnalytics(error: AppointmentError): void {
    try {
      // Extract context from error details if available
      const context = typeof error.details === 'object' && error.details !== null 
        ? (error.details as Record<string, unknown>).context as string
        : undefined;
      
      // Extract stack from error details if available
      const stack = typeof error.details === 'object' && error.details !== null
        ? (error.details as Record<string, unknown>).stack as string
        : undefined;

      // Create analytics event payload
      const analyticsPayload: AnalyticsPayload = {
        event: 'appointment_error',
        timestamp: error.timestamp,
        properties: {
          errorType: error.type,
          errorCode: error.code,
          errorMessage: error.message,
          context,
          retryable: error.retryable,
          userAgent: navigator.userAgent,
          url: window.location.href,
          sessionId: this.getSessionId(),
          userId: this.getUserId(),
          environmentInfo: {
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            timestamp: new Date().toISOString()
          }
        },
        metadata: {
          stack,
          details: error.details
        }
      };

      // Send to multiple analytics providers
      this.sendToConsoleAnalytics(analyticsPayload);
      this.sendToLocalStorage(analyticsPayload);
      this.sendToWebVitals(analyticsPayload);
      
      // In a real application, you would also send to external services:
      // this.sendToSentry(analyticsPayload);
      // this.sendToLogRocket(analyticsPayload);
      // this.sendToGoogleAnalytics(analyticsPayload);
      // this.sendToCustomEndpoint(analyticsPayload);
      
    } catch (analyticsError) {
      // Silently fail - don't let analytics errors break the app
      console.warn('Failed to send error to analytics:', analyticsError);
    }
  }

  /**
   * Get or generate a session ID for analytics
   */
  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('bauplan-buddy-session-id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('bauplan-buddy-session-id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get user ID if available (for production use)
   */
  private static getUserId(): string | undefined {
    // In a real application, this would get the actual user ID
    // from your authentication system
    return localStorage.getItem('user-id') || 'anonymous';
  }

  /**
   * Log to console with structured format (development)
   */
  private static sendToConsoleAnalytics(payload: AnalyticsPayload): void {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Analytics Event: ' + payload.event);
      console.log('📊 Properties:', payload.properties);
      console.log('🏷️ Metadata:', payload.metadata);
      console.log('⏰ Timestamp:', payload.timestamp);
      console.groupEnd();
    }
  }

  /**
   * Store analytics data locally for debugging and offline scenarios
   */
  private static sendToLocalStorage(payload: AnalyticsPayload): void {
    try {
      const storageKey = 'bauplan-buddy-analytics';
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existing.unshift(payload);
      
      // Keep only last 100 events
      const trimmed = existing.slice(0, 100);
      localStorage.setItem(storageKey, JSON.stringify(trimmed));
    } catch (error) {
      console.warn('Failed to store analytics locally:', error);
    }
  }

  /**
   * Send performance and web vitals data
   */
  private static sendToWebVitals(payload: AnalyticsPayload): void {
    try {
      // Type definitions for browser APIs
      interface NavigatorConnection {
        effectiveType?: string;
      }
      
      interface PerformanceMemory {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
      }
      
      interface ExtendedNavigator extends Navigator {
        connection?: NavigatorConnection;
      }
      
      interface ExtendedPerformance extends Performance {
        memory?: PerformanceMemory;
      }
      
      // Collect performance metrics
      const performanceData = {
        ...payload,
        performance: {
          connectionType: (navigator as ExtendedNavigator).connection?.effectiveType || 'unknown',
          memory: (performance as ExtendedPerformance).memory ? {
            usedJSHeapSize: (performance as ExtendedPerformance).memory!.usedJSHeapSize,
            totalJSHeapSize: (performance as ExtendedPerformance).memory!.totalJSHeapSize
          } : null,
          timing: performance.timing ? {
            loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
            domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
          } : null
        }
      };
      
      // In development, just log the enhanced data
      if (process.env.NODE_ENV === 'development') {
        console.log('📈 Performance Analytics:', performanceData.performance);
      }
    } catch (error) {
      console.warn('Failed to collect performance data:', error);
    }
  }

  /**
   * Placeholder for Sentry integration
   */
  private static sendToSentry(payload: AnalyticsPayload): void {
    // Example Sentry integration (would require @sentry/browser)
    // if (typeof Sentry !== 'undefined') {
    //   Sentry.addBreadcrumb({
    //     message: payload.properties.errorMessage,
    //     category: 'appointment.error',
    //     level: this.mapPriorityToSentryLevel(payload.properties.priority),
    //     data: payload.properties
    //   });
    //   
    //   Sentry.captureException(new Error(payload.properties.errorMessage), {
    //     tags: {
    //       errorType: payload.properties.errorType,
    //       context: payload.properties.context
    //     },
    //     extra: payload.metadata
    //   });
    // }
    console.log('Would send to Sentry:', payload);
  }

  /**
   * Placeholder for LogRocket integration
   */
  private static sendToLogRocket(payload: AnalyticsPayload): void {
    // Example LogRocket integration (would require logrocket)
    // if (typeof LogRocket !== 'undefined') {
    //   LogRocket.captureException(new Error(payload.properties.errorMessage));
    //   LogRocket.track('Appointment Error', payload.properties);
    // }
    console.log('Would send to LogRocket:', payload);
  }

  /**
   * Placeholder for Google Analytics integration
   */
  private static sendToGoogleAnalytics(payload: AnalyticsPayload): void {
    // Example GA4 integration (would require gtag)
    // if (typeof gtag !== 'undefined') {
    //   gtag('event', 'exception', {
    //     description: payload.properties.errorMessage,
    //     fatal: payload.properties.priority === 'critical',
    //     custom_map: {
    //       error_type: payload.properties.errorType,
    //       error_context: payload.properties.context
    //     }
    //   });
    // }
    console.log('Would send to Google Analytics:', payload);
  }

  /**
   * Placeholder for custom analytics endpoint
   */
  private static sendToCustomEndpoint(payload: AnalyticsPayload): void {
    // Example custom endpoint integration
    // fetch('/api/analytics/errors', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(payload)
    // }).catch(error => {
    //   console.warn('Failed to send to custom analytics endpoint:', error);
    // });
    console.log('Would send to custom endpoint:', payload);
  }

  /**
   * Get stored analytics data for debugging
   */
  static getAnalyticsData(): AnalyticsPayload[] {
    try {
      return JSON.parse(localStorage.getItem('bauplan-buddy-analytics') || '[]');
    } catch (error) {
      console.warn('Failed to retrieve analytics data:', error);
      return [];
    }
  }

  /**
   * Clear stored analytics data
   */
  static clearAnalyticsData(): void {
    try {
      localStorage.removeItem('bauplan-buddy-analytics');
      sessionStorage.removeItem('bauplan-buddy-session-id');
      console.log('Analytics data cleared');
    } catch (error) {
      console.warn('Failed to clear analytics data:', error);
    }
  }
}

// Analytics payload interface
interface AnalyticsPayload {
  event: string;
  timestamp: string;
  properties: {
    errorType: AppointmentErrorType;
    errorCode?: string;
    errorMessage: string;
    context?: string;
    retryable: boolean;
    userAgent: string;
    url: string;
    sessionId: string;
    userId?: string;
    environmentInfo: {
      platform: string;
      language: string;
      cookieEnabled: boolean;
      onLine: boolean;
      timestamp: string;
    };
  };
  metadata: {
    stack?: string;
    details?: unknown;
  };
}

interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: string;
  retryCount: number;
  lastError?: AppointmentError;
}

/**
 * Offline capability manager for appointments
 */
export class OfflineManager {
  private static readonly OFFLINE_QUEUE_KEY = 'bauplan-buddy-offline-queue';
  private static readonly OFFLINE_STATUS_KEY = 'bauplan-buddy-offline-status';
  private static isOnline = navigator.onLine;
  private static listeners: Array<(isOnline: boolean) => void> = [];

  /**
   * Initialize offline manager
   */
  static initialize(): void {
    // Set up network status listeners
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Process queued operations when going online
    if (this.isOnline) {
      this.processOfflineQueue();
    }

    // Periodic queue processing (every 30 seconds)
    setInterval(() => {
      if (this.isOnline) {
        this.processOfflineQueue();
      }
    }, 30000);
  }

  /**
   * Add operation to offline queue
   */
  static queueOperation(
    type: 'create' | 'update' | 'delete',
    data: unknown
  ): void {
    const operation: QueuedOperation = {
      id: this.generateId(),
      type,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    const queue = this.getOfflineQueue();
    queue.push(operation);
    this.saveOfflineQueue(queue);

    console.log('Operation queued for offline sync:', operation);
  }

  /**
   * Process offline queue when back online
   */
  static async processOfflineQueue(): Promise<void> {
    if (!this.isOnline) return;

    const queue = this.getOfflineQueue();
    if (queue.length === 0) return;

    console.log('Processing offline queue:', queue.length, 'operations');

    const processed: string[] = [];
    const failed: QueuedOperation[] = [];

    for (const operation of queue) {
      try {
        await this.executeOperation(operation);
        processed.push(operation.id);
        console.log('Successfully processed offline operation:', operation.id);
      } catch (error) {
        const appointmentError = AppointmentErrorHandler.handleError(error, 'offline-queue');
        operation.lastError = appointmentError;
        operation.retryCount++;

        if (operation.retryCount < 3) {
          failed.push(operation);
          console.warn('Offline operation failed, will retry:', operation.id);
        } else {
          console.error('Offline operation permanently failed:', operation.id);
          // TODO: Store in a separate failed operations list for manual review
        }
      }
    }

    // Update queue with failed operations
    this.saveOfflineQueue(failed);

    // Notify about processing results
    if (processed.length > 0) {
      this.notifyProcessingComplete(processed, failed);
    }
  }

  /**
   * Get current network status
   */
  static getNetworkStatus(): {
    isOnline: boolean;
    lastOnlineTime?: string;
    queuedOperations: number;
  } {
    const queue = this.getOfflineQueue();
    const status = localStorage.getItem(this.OFFLINE_STATUS_KEY);
    const statusData = status ? JSON.parse(status) : {};

    return {
      isOnline: this.isOnline,
      lastOnlineTime: statusData.lastOnlineTime,
      queuedOperations: queue.length,
    };
  }

  /**
   * Add network status listener
   */
  static addNetworkListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Manually sync queued operations
   */
  static async manualSync(): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    errors: AppointmentError[];
  }> {
    const initialQueue = this.getOfflineQueue();
    const initialCount = initialQueue.length;

    if (initialCount === 0) {
      return { success: true, processed: 0, failed: 0, errors: [] };
    }

    await this.processOfflineQueue();

    const remainingQueue = this.getOfflineQueue();
    const remainingCount = remainingQueue.length;
    const processed = initialCount - remainingCount;

    const errors = remainingQueue
      .filter(op => op.lastError)
      .map(op => op.lastError!);

    return {
      success: remainingCount === 0,
      processed,
      failed: remainingCount,
      errors,
    };
  }

  private static handleOnline(): void {
    this.isOnline = true;
    const statusData = { lastOnlineTime: new Date().toISOString() };
    localStorage.setItem(this.OFFLINE_STATUS_KEY, JSON.stringify(statusData));

    this.listeners.forEach(listener => listener(true));
    
    // Process queued operations
    setTimeout(() => this.processOfflineQueue(), 1000);
  }

  private static handleOffline(): void {
    this.isOnline = false;
    this.listeners.forEach(listener => listener(false));
  }

  private static getOfflineQueue(): QueuedOperation[] {
    try {
      const data = localStorage.getItem(this.OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading offline queue:', error);
      return [];
    }
  }

  private static saveOfflineQueue(queue: QueuedOperation[]): void {
    try {
      localStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  private static async executeOperation(operation: QueuedOperation): Promise<void> {
    const { AppointmentService } = await import('../services/appointmentService');

    switch (operation.type) {
      case 'create':
        await AppointmentService.saveAppointment(operation.data as AppointmentFormData);
        break;
      case 'update': {
        const updateData = operation.data as { id: string } & AppointmentFormData;
        await AppointmentService.updateAppointment(updateData.id, updateData);
        break;
      }
      case 'delete': {
        const deleteData = operation.data as { id: string };
        await AppointmentService.deleteAppointment(deleteData.id);
        break;
      }
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private static generateId(): string {
    return 'offline-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  private static notifyProcessingComplete(processed: string[], failed: QueuedOperation[]): void {
    // Create a custom event for UI notification
    const event = new CustomEvent('offline-sync-complete', {
      detail: {
        processed: processed.length,
        failed: failed.length,
        timestamp: new Date().toISOString(),
      },
    });
    window.dispatchEvent(event);
  }
}

/**
 * Retry mechanism for failed operations
 */
export class RetryManager {
  private static retrySchedule = new Map<string, number>();

  /**
   * Execute operation with automatic retry
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    context?: string
  ): Promise<T> {
    let lastError: AppointmentError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = AppointmentErrorHandler.getRetryDelay(attempt - 1);
          await this.delay(delay);
        }
        
        return await operation();
      } catch (error) {
        lastError = AppointmentErrorHandler.handleError(error, context);
        
        if (attempt === maxRetries || !AppointmentErrorHandler.shouldRetry(lastError, attempt)) {
          throw lastError;
        }
        
        console.warn(`Operation failed, retrying (${attempt + 1}/${maxRetries}):`, lastError.message);
      }
    }
    
    throw lastError!;
  }

  /**
   * Schedule a retry for later execution
   */
  static scheduleRetry(
    operationId: string,
    operation: () => Promise<void>,
    delayMs: number
  ): void {
    const timeoutId = window.setTimeout(async () => {
      try {
        await operation();
        this.retrySchedule.delete(operationId);
      } catch (error) {
        console.error('Scheduled retry failed:', error);
        this.retrySchedule.delete(operationId);
      }
    }, delayMs);

    this.retrySchedule.set(operationId, timeoutId);
  }

  /**
   * Cancel a scheduled retry
   */
  static cancelRetry(operationId: string): void {
    const timeoutId = this.retrySchedule.get(operationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.retrySchedule.delete(operationId);
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize offline manager when this module is imported
if (typeof window !== 'undefined') {
  OfflineManager.initialize();
}