/**
 * Analytics Tracking Service
 * 
 * Privacy-first analytics with:
 * - Event tracking
 * - User journey mapping
 * - Performance metrics
 * - Feature usage analytics
 * - Conversion tracking
 * - GDPR-compliant consent checks
 */

import { logger } from "./logger";
import { gdprService } from "./gdprCompliance";

export interface AnalyticsEvent {
  name: string;
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface PageView {
  path: string;
  title: string;
  referrer: string;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  duration?: number;
}

export interface UserSession {
  id: string;
  startTime: Date;
  lastActivity: Date;
  pageViews: number;
  events: number;
  userId?: string;
  device: DeviceInfo;
}

export interface DeviceInfo {
  type: "desktop" | "tablet" | "mobile";
  os: string;
  browser: string;
  screenSize: string;
  language: string;
}

export type EventCategory =
  | "navigation"
  | "interaction"
  | "conversion"
  | "feature"
  | "error"
  | "performance"
  | "engagement";

const STORAGE_KEY = "analytics_events";
const SESSION_KEY = "analytics_session";
const MAX_EVENTS = 500;
const FLUSH_INTERVAL = 30000; // 30 seconds

class AnalyticsTrackingService {
  private events: AnalyticsEvent[] = [];
  private pageViews: PageView[] = [];
  private session: UserSession | null = null;
  private userId?: string;
  private flushTimer?: NodeJS.Timeout;
  private pageLoadTime: number = Date.now();
  private isEnabled: boolean = true;
  private remoteEndpoint?: string;

  constructor() {
    this.initSession();
    this.loadEvents();
    this.startFlushTimer();
    this.setupPageTracking();
  }

  private initSession(): void {
    const stored = sessionStorage.getItem(SESSION_KEY);
    
    if (stored) {
      this.session = JSON.parse(stored);
      if (this.session) {
        this.session.lastActivity = new Date();
        this.session.startTime = new Date(this.session.startTime);
      }
    } else {
      this.session = {
        id: this.generateSessionId(),
        startTime: new Date(),
        lastActivity: new Date(),
        pageViews: 0,
        events: 0,
        device: this.getDeviceInfo(),
      };
    }

    this.saveSession();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    
    let type: "desktop" | "tablet" | "mobile" = "desktop";
    if (/Mobi|Android/i.test(ua)) {
      type = /Tablet|iPad/i.test(ua) ? "tablet" : "mobile";
    }

    let os = "Unknown";
    if (/Windows/i.test(ua)) os = "Windows";
    else if (/Mac/i.test(ua)) os = "macOS";
    else if (/Linux/i.test(ua)) os = "Linux";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/iOS|iPhone|iPad/i.test(ua)) os = "iOS";

    let browser = "Unknown";
    if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) browser = "Chrome";
    else if (/Firefox/i.test(ua)) browser = "Firefox";
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
    else if (/Edge/i.test(ua)) browser = "Edge";

    return {
      type,
      os,
      browser,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
    };
  }

  private saveSession(): void {
    if (this.session) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(this.session));
    }
  }

  private loadEvents(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      logger.error("Failed to load analytics events", {}, error instanceof Error ? error : undefined);
    }
  }

  private saveEvents(): void {
    try {
      // Keep only the most recent events
      const toSave = this.events.slice(-MAX_EVENTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      logger.error("Failed to save analytics events", {}, error instanceof Error ? error : undefined);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, FLUSH_INTERVAL);
  }

  private setupPageTracking(): void {
    // Track page visibility
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.trackPageDuration();
      } else {
        this.pageLoadTime = Date.now();
      }
    });

    // Track before unload
    window.addEventListener("beforeunload", () => {
      this.trackPageDuration();
      this.flush();
    });
  }

  /**
   * Configure the analytics service
   */
  configure(options: {
    userId?: string;
    enabled?: boolean;
    remoteEndpoint?: string;
  }): void {
    if (options.userId) {
      this.userId = options.userId;
      if (this.session) {
        this.session.userId = options.userId;
        this.saveSession();
      }
    }
    if (options.enabled !== undefined) {
      this.isEnabled = options.enabled;
    }
    if (options.remoteEndpoint) {
      this.remoteEndpoint = options.remoteEndpoint;
    }
  }

  /**
   * Check if tracking is allowed
   */
  private canTrack(): boolean {
    if (!this.isEnabled) return false;
    
    // Check GDPR consent
    if (this.userId) {
      return gdprService.hasConsent(this.userId, "analytics_tracking");
    }
    
    return true;
  }

  /**
   * Track an event
   */
  track(
    name: string,
    category: EventCategory,
    action: string,
    options?: {
      label?: string;
      value?: number;
      metadata?: Record<string, unknown>;
    }
  ): void {
    if (!this.canTrack()) return;

    const event: AnalyticsEvent = {
      name,
      category,
      action,
      label: options?.label,
      value: options?.value,
      timestamp: new Date(),
      sessionId: this.session?.id || "unknown",
      userId: this.userId,
      metadata: options?.metadata,
    };

    this.events.push(event);
    
    if (this.session) {
      this.session.events++;
      this.session.lastActivity = new Date();
      this.saveSession();
    }

    logger.debug("Analytics event tracked", { name, category, action });
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title: string): void {
    if (!this.canTrack()) return;

    // Track duration of previous page
    this.trackPageDuration();

    const pageView: PageView = {
      path,
      title,
      referrer: document.referrer,
      timestamp: new Date(),
      sessionId: this.session?.id || "unknown",
      userId: this.userId,
    };

    this.pageViews.push(pageView);
    this.pageLoadTime = Date.now();

    if (this.session) {
      this.session.pageViews++;
      this.session.lastActivity = new Date();
      this.saveSession();
    }

    this.track("page_view", "navigation", "view", {
      label: path,
      metadata: { title },
    });
  }

  private trackPageDuration(): void {
    if (this.pageViews.length > 0) {
      const lastPageView = this.pageViews[this.pageViews.length - 1];
      lastPageView.duration = Date.now() - this.pageLoadTime;
    }
  }

  /**
   * Track feature usage
   */
  trackFeature(featureName: string, action: "enabled" | "used" | "disabled"): void {
    this.track(featureName, "feature", action);
  }

  /**
   * Track conversion
   */
  trackConversion(name: string, value?: number, metadata?: Record<string, unknown>): void {
    this.track(name, "conversion", "complete", { value, metadata });
  }

  /**
   * Track error
   */
  trackError(errorName: string, errorMessage: string, metadata?: Record<string, unknown>): void {
    this.track(errorName, "error", "occurred", {
      label: errorMessage,
      metadata,
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metricName: string, value: number, unit: string = "ms"): void {
    this.track(metricName, "performance", "measure", {
      value,
      metadata: { unit },
    });
  }

  /**
   * Get session info
   */
  getSession(): UserSession | null {
    return this.session;
  }

  /**
   * Get recent events
   */
  getRecentEvents(count: number = 50): AnalyticsEvent[] {
    return this.events.slice(-count);
  }

  /**
   * Get page views
   */
  getPageViews(): PageView[] {
    return [...this.pageViews];
  }

  /**
   * Get analytics summary
   */
  getSummary(): {
    sessionDuration: number;
    pageViews: number;
    events: number;
    topPages: { path: string; views: number }[];
    topEvents: { name: string; count: number }[];
  } {
    const sessionDuration = this.session
      ? Date.now() - new Date(this.session.startTime).getTime()
      : 0;

    // Count page views
    const pageCounts = new Map<string, number>();
    this.pageViews.forEach(pv => {
      pageCounts.set(pv.path, (pageCounts.get(pv.path) || 0) + 1);
    });

    const topPages = Array.from(pageCounts.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Count events
    const eventCounts = new Map<string, number>();
    this.events.forEach(e => {
      eventCounts.set(e.name, (eventCounts.get(e.name) || 0) + 1);
    });

    const topEvents = Array.from(eventCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      sessionDuration,
      pageViews: this.pageViews.length,
      events: this.events.length,
      topPages,
      topEvents,
    };
  }

  /**
   * Flush events to remote server
   */
  async flush(): Promise<void> {
    if (!this.remoteEndpoint || this.events.length === 0) {
      this.saveEvents();
      return;
    }

    const eventsToSend = [...this.events];
    
    try {
      await fetch(this.remoteEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: this.session,
          events: eventsToSend,
          pageViews: this.pageViews,
        }),
      });

      // Clear sent events
      this.events = [];
      this.pageViews = [];
      this.saveEvents();
      
      logger.debug("Analytics flushed", { eventCount: eventsToSend.length });
    } catch (error) {
      logger.warn("Failed to flush analytics", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      this.saveEvents();
    }
  }

  /**
   * Clear all analytics data
   */
  clear(): void {
    this.events = [];
    this.pageViews = [];
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    this.initSession();
  }

  /**
   * Stop analytics
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
    this.isEnabled = false;
  }
}

// Singleton instance
export const analytics = new AnalyticsTrackingService();

// React hook for page tracking
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    analytics.trackPageView(location.pathname, document.title);
  }, [location.pathname]);
}

// Export for testing
export { AnalyticsTrackingService };
