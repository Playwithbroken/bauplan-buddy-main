import { isDevelopment, isProduction } from '@/utils/env';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  category: string;
  userId?: string;
  sessionId: string;
  userAgent: string;
  url: string;
  metadata?: Record<string, unknown>;
  stack?: string;
  component?: string;
  action?: string;
}

export interface ErrorReport {
  id: string;
  timestamp: string;
  errorType: string;
  message: string;
  stack: string;
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  reproductionSteps?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  tags: string[];
}

export interface PerformanceMetric {
  id: string;
  timestamp: string;
  metricName: string;
  value: number;
  unit: string;
  category: string;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
}

export class ErrorHandlingService {
  private static readonly LOG_STORAGE_KEY = 'bauplan-buddy-logs';
  private static readonly ERROR_STORAGE_KEY = 'bauplan-buddy-errors';
  private static readonly PERFORMANCE_STORAGE_KEY = 'bauplan-buddy-performance';
  private static readonly MAX_LOG_ENTRIES = 1000;
  private static readonly MAX_ERROR_ENTRIES = 500;
  private static readonly MAX_PERFORMANCE_ENTRIES = 1000;

  private static sessionId: string;
  private static initialized = false;
  private static initializationInProgress = false;

  /**
   * Initialize error handling service
   */
  static initialize(): void {
    if (this.initialized || this.initializationInProgress) return;
    
    this.initializationInProgress = true;

    try {
      this.sessionId = this.generateSessionId();
      this.setupGlobalErrorHandlers();
      this.setupPerformanceMonitoring();
      this.initialized = true;

      // Use native console.log to avoid triggering our own error handling
      if (typeof console !== 'undefined' && console.log) {
        console.log('ErrorHandlingService: Initialized successfully');
      }
    } catch (error) {
      // Initialization failed, reset flags and use native console
      this.initializationInProgress = false;
      this.initialized = false;
      
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('ErrorHandlingService: Initialization failed, error handling disabled', error);
      }
    } finally {
      this.initializationInProgress = false;
    }
  }

  /**
   * Log a message with specified level
   */
  static log(level: LogLevel, message: string, category: string, metadata?: Record<string, unknown>): void {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      category,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      metadata,
      component: this.getCurrentComponent(),
    };

    this.saveLogEntry(entry);

    // Console output for development
    if (isDevelopment()) {
      const consoleMethod = this.getConsoleMethod(level);
      consoleMethod(`[${LogLevel[level]}] ${category}: ${message}`, metadata);
    }

    // Send to external logging service in production
    if (isProduction() && level >= LogLevel.ERROR) {
      this.sendToExternalService(entry);
    }
  }

  /**
   * Log debug message
   */
  static debug(message: string, category: string = 'debug', metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, category, metadata);
  }

  /**
   * Log info message
   */
  static info(message: string, category: string = 'info', metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, category, metadata);
  }

  /**
   * Log warning message
   */
  static warn(message: string, category: string = 'warning', metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, category, metadata);
  }

  /**
   * Log error message
   */
  static error(message: string, error?: Error, category: string = 'error', metadata?: Record<string, unknown>): void {
    const errorMetadata = {
      ...metadata,
      ...(error && {
        stack: error.stack,
        name: error.name,
        cause: (error as unknown as { cause?: unknown }).cause,
      }),
    };

    this.log(LogLevel.ERROR, message, category, errorMetadata);
    
    // Create error report for tracking
    this.createErrorReport(message, error, category, metadata);
  }

  /**
   * Log fatal error
   */
  static fatal(message: string, error?: Error, category: string = 'fatal', metadata?: Record<string, unknown>): void {
    this.log(LogLevel.FATAL, message, category, metadata);
    this.createErrorReport(message, error, category, metadata, 'critical');
  }

  /**
   * Create detailed error report
   */
  static createErrorReport(
    message: string,
    error?: Error,
    component?: string,
    metadata?: Record<string, unknown>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): ErrorReport {
    const report: ErrorReport = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      errorType: error?.name || 'ApplicationError',
      message,
      stack: error?.stack || new Error().stack || '',
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      component,
      metadata,
      severity,
      resolved: false,
      tags: this.generateErrorTags(error, component, metadata),
    };

    this.saveErrorReport(report);
    return report;
  }

  /**
   * Record performance metric
   */
  static recordPerformance(
    metricName: string,
    value: number,
    unit: string = 'ms',
    category: string = 'performance',
    metadata?: Record<string, unknown>
  ): void {
    const metric: PerformanceMetric = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      metricName,
      value,
      unit,
      category,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      metadata,
    };

    this.savePerformanceMetric(metric);
  }

  /**
   * Measure execution time of a function
   */
  static async measureExecutionTime<T>(
    fn: () => Promise<T> | T,
    metricName: string,
    category: string = 'function_execution'
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const executionTime = performance.now() - startTime;
      this.recordPerformance(metricName, executionTime, 'ms', category);
      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.recordPerformance(`${metricName}_error`, executionTime, 'ms', category);
      this.error(`Error in ${metricName}`, error as Error, category);
      throw error;
    }
  }

  /**
   * Wrap component with error boundary logging
   */
  static wrapComponent<P, T extends React.ComponentType<P>>(
    Component: T,
    componentName?: string
  ): T {
    const wrappedComponent = (props: P) => {
      try {
        return React.createElement(Component, props);
      } catch (error) {
        this.error(
          `Component error in ${componentName || Component.name}`,
          error as Error,
          'component',
          { props, componentName: componentName || Component.name }
        );
        throw error;
      }
    };

    wrappedComponent.displayName = `ErrorTracked(${componentName || Component.name})`;
    return wrappedComponent as T;
  }

  /**
   * Get all log entries with optional filtering
   */
  static getLogs(filters?: {
    level?: LogLevel;
    category?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): LogEntry[] {
    const logs = this.getStoredLogs();
    let filtered = logs;

    if (filters) {
      if (filters.level !== undefined) {
        filtered = filtered.filter(log => log.level >= filters.level!);
      }
      if (filters.category) {
        filtered = filtered.filter(log => log.category === filters.category);
      }
      if (filters.startDate) {
        filtered = filtered.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter(log => log.timestamp <= filters.endDate!);
      }
      if (filters.limit) {
        filtered = filtered.slice(0, filters.limit);
      }
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get error reports with optional filtering
   */
  static getErrorReports(filters?: {
    resolved?: boolean;
    severity?: string;
    component?: string;
    limit?: number;
  }): ErrorReport[] {
    const errors = this.getStoredErrors();
    let filtered = errors;

    if (filters) {
      if (filters.resolved !== undefined) {
        filtered = filtered.filter(error => error.resolved === filters.resolved);
      }
      if (filters.severity) {
        filtered = filtered.filter(error => error.severity === filters.severity);
      }
      if (filters.component) {
        filtered = filtered.filter(error => error.component === filters.component);
      }
      if (filters.limit) {
        filtered = filtered.slice(0, filters.limit);
      }
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get performance metrics
   */
  static getPerformanceMetrics(filters?: {
    metricName?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): PerformanceMetric[] {
    const metrics = this.getStoredPerformanceMetrics();
    let filtered = metrics;

    if (filters) {
      if (filters.metricName) {
        filtered = filtered.filter(metric => metric.metricName === filters.metricName);
      }
      if (filters.category) {
        filtered = filtered.filter(metric => metric.category === filters.category);
      }
      if (filters.startDate) {
        filtered = filtered.filter(metric => metric.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter(metric => metric.timestamp <= filters.endDate!);
      }
      if (filters.limit) {
        filtered = filtered.slice(0, filters.limit);
      }
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Mark error report as resolved
   */
  static resolveError(errorId: string): void {
    const errors = this.getStoredErrors();
    const errorIndex = errors.findIndex(error => error.id === errorId);
    
    if (errorIndex !== -1) {
      errors[errorIndex].resolved = true;
      this.saveErrors(errors);
    }
  }

  /**
   * Clear old logs to prevent storage bloat
   */
  static clearOldLogs(olderThanDays: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffString = cutoffDate.toISOString();

    const logs = this.getStoredLogs();
    const filteredLogs = logs.filter(log => log.timestamp >= cutoffString);
    this.saveLogs(filteredLogs);

    const errors = this.getStoredErrors();
    const filteredErrors = errors.filter(error => error.timestamp >= cutoffString);
    this.saveErrors(filteredErrors);

    const metrics = this.getStoredPerformanceMetrics();
    const filteredMetrics = metrics.filter(metric => metric.timestamp >= cutoffString);
    this.savePerformanceMetrics(filteredMetrics);

    this.info(`Cleared logs older than ${olderThanDays} days`, 'maintenance');
  }

  /**
   * Export logs for analysis
   */
  static exportLogs(format: 'json' | 'csv' = 'json'): string {
    const logs = this.getLogs();
    
    if (format === 'csv') {
      const headers = ['Timestamp', 'Level', 'Category', 'Message', 'Component', 'URL'];
      const rows = logs.map(log => [
        log.timestamp,
        LogLevel[log.level],
        log.category,
        log.message,
        log.component || '',
        log.url
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(logs, null, 2);
  }

  // Private methods

  private static setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      try {
        this.error(
          'Unhandled promise rejection',
          new Error(event.reason),
          'promise_rejection',
          { reason: event.reason }
        );
      } catch (err) {
        // Fallback to original console.error to prevent infinite loops
        console.warn('Error logging failed for unhandled rejection:', err);
      }
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      try {
        this.error(
          'JavaScript error',
          event.error,
          'javascript_error',
          {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            message: event.message,
          }
        );
      } catch (err) {
        // Fallback to original console.error to prevent infinite loops
        console.warn('Error logging failed for JavaScript error:', err);
      }
    });

    // Don't override console.error to prevent infinite loops
    // Instead, let developers manually use ErrorHandlingService.error() when needed
  }

  private static setupPerformanceMonitoring(): void {
    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        try {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          if (navigation) {
            this.recordPerformance('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
            this.recordPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
            this.recordPerformance('first_paint', navigation.loadEventStart - navigation.fetchStart);
          }
        } catch (error) {
          // Silent failure for performance monitoring
        }
      }, 0);
    });

    // Monitor long tasks with better error handling
    if ('PerformanceObserver' in window) {
      try {
        // Check if longtask is supported before setting up observer
        const testObserver = new PerformanceObserver(() => {});
        testObserver.observe({ entryTypes: ['measure'] }); // Test with supported type
        testObserver.disconnect();
        
        // Now try with longtask
        const observer = new PerformanceObserver((list) => {
          try {
            for (const entry of list.getEntries()) {
              if (entry.duration > 50) { // Tasks longer than 50ms
                this.recordPerformance('long_task', entry.duration, 'ms', 'performance', {
                  name: entry.name,
                  startTime: entry.startTime,
                });
              }
            }
          } catch (err) {
            // Silent failure for individual entries
          }
        });
        
        // Try to observe longtask, but catch any errors
        try {
          observer.observe({ entryTypes: ['longtask'] });
        } catch (entryError) {
          // longtask not supported, try other entry types
          try {
            observer.observe({ entryTypes: ['measure', 'mark'] });
          } catch (fallbackError) {
            // Performance monitoring not available
            observer.disconnect();
          }
        }
      } catch (error) {
        // PerformanceObserver not supported or failed to initialize
      }
    }
  }

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static getCurrentUserId(): string | undefined {
    // Get from auth context or localStorage
    try {
      const userData = localStorage.getItem('bauplan-buddy-user');
      return userData ? JSON.parse(userData).id : undefined;
    } catch {
      return undefined;
    }
  }

  private static getCurrentComponent(): string | undefined {
    // Try to determine current component from React stack
    try {
      const stack = new Error().stack;
      const match = stack?.match(/at (\w+)/);
      return match ? match[1] : undefined;
    } catch {
      return undefined;
    }
  }

  private static getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  private static generateErrorTags(error?: Error, component?: string, metadata?: Record<string, unknown>): string[] {
    const tags: string[] = [];
    
    if (error?.name) tags.push(error.name);
    if (component) tags.push(`component:${component}`);
    if (metadata && typeof metadata === 'object') {
      const uid = (metadata as Record<string, unknown>)['userId'];
      if (typeof uid === 'string') tags.push(`user:${uid}`);
    }
    if (window.location.pathname) tags.push(`page:${window.location.pathname}`);
    
    return tags;
  }

  private static async sendToExternalService(entry: LogEntry): Promise<void> {
    try {
      // In production, send to external logging service
      // await fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) });
    } catch (error) {
      console.warn('Failed to send log to external service:', error);
    }
  }

  private static saveLogEntry(entry: LogEntry): void {
    try {
      const logs = this.getStoredLogs();
      logs.unshift(entry);
      
      // Keep only the most recent entries
      if (logs.length > this.MAX_LOG_ENTRIES) {
        logs.splice(this.MAX_LOG_ENTRIES);
      }
      
      this.saveLogs(logs);
    } catch (error) {
      // Use native console.error to avoid infinite loops
      if (typeof console !== 'undefined' && console.error) {
        console.warn('ErrorHandlingService: Failed to save log entry, storage may be full');
      }
    }
  }

  private static saveErrorReport(report: ErrorReport): void {
    try {
      const errors = this.getStoredErrors();
      errors.unshift(report);
      
      if (errors.length > this.MAX_ERROR_ENTRIES) {
        errors.splice(this.MAX_ERROR_ENTRIES);
      }
      
      this.saveErrors(errors);
    } catch (error) {
      console.error('Failed to save error report:', error);
    }
  }

  private static savePerformanceMetric(metric: PerformanceMetric): void {
    try {
      const metrics = this.getStoredPerformanceMetrics();
      metrics.unshift(metric);
      
      if (metrics.length > this.MAX_PERFORMANCE_ENTRIES) {
        metrics.splice(this.MAX_PERFORMANCE_ENTRIES);
      }
      
      this.savePerformanceMetrics(metrics);
    } catch (error) {
      console.error('Failed to save performance metric:', error);
    }
  }

  private static getStoredLogs(): LogEntry[] {
    try {
      const data = localStorage.getItem(this.LOG_STORAGE_KEY);
      return data ? (JSON.parse(data) as LogEntry[]) : [];
    } catch {
      return [];
    }
  }

  private static getStoredErrors(): ErrorReport[] {
    try {
      const data = localStorage.getItem(this.ERROR_STORAGE_KEY);
      return data ? (JSON.parse(data) as ErrorReport[]) : [];
    } catch {
      return [];
    }
  }

  private static getStoredPerformanceMetrics(): PerformanceMetric[] {
    try {
      const data = localStorage.getItem(this.PERFORMANCE_STORAGE_KEY);
      return data ? (JSON.parse(data) as PerformanceMetric[]) : [];
    } catch {
      return [];
    }
  }

  private static saveLogs(logs: LogEntry[]): void {
    try {
      localStorage.setItem(this.LOG_STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      // Storage quota exceeded or other storage error
      // Try to clear some space and retry with fewer entries
      try {
        const reducedLogs = logs.slice(0, Math.floor(this.MAX_LOG_ENTRIES / 2));
        localStorage.setItem(this.LOG_STORAGE_KEY, JSON.stringify(reducedLogs));
      } catch (retryError) {
        // Complete storage failure, clear the key
        try {
          localStorage.removeItem(this.LOG_STORAGE_KEY);
        } catch (clearError) {
          // Cannot even clear, localStorage is completely unavailable
        }
      }
    }
  }

  private static saveErrors(errors: ErrorReport[]): void {
    localStorage.setItem(this.ERROR_STORAGE_KEY, JSON.stringify(errors));
  }

  private static savePerformanceMetrics(metrics: PerformanceMetric[]): void {
    localStorage.setItem(this.PERFORMANCE_STORAGE_KEY, JSON.stringify(metrics));
  }
}

// Auto-initialize when module loads
import React from 'react';
if (typeof window !== 'undefined') {
  ErrorHandlingService.initialize();
}
