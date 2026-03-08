export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: 'navigation' | 'loading' | 'interaction' | 'memory' | 'network' | 'custom';
  tags: Record<string, string>;
  threshold?: {
    warning: number;
    critical: number;
  };
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: PageView[];
  interactions: UserInteraction[];
  errors: ErrorEvent[];
  deviceInfo: DeviceInfo;
  networkInfo: NetworkInfo;
}

export interface PageView {
  id: string;
  path: string;
  title: string;
  loadTime: number;
  renderTime: number;
  timestamp: Date;
  referrer?: string;
  timeOnPage?: number;
}

export interface UserInteraction {
  id: string;
  type: 'click' | 'scroll' | 'form_submit' | 'search' | 'navigation' | 'file_upload';
  element: string;
  timestamp: Date;
  duration?: number;
  successful: boolean;
  metadata: Record<string, unknown>;
}

export interface ErrorEvent {
  id: string;
  type: 'javascript' | 'network' | 'resource' | 'security' | 'custom';
  message: string;
  stack?: string;
  filename?: string;
  lineNumber?: number;
  columnNumber?: number;
  timestamp: Date;
  url: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  screenResolution: string;
  colorDepth: number;
  language: string;
  timezone: string;
  cookieEnabled: boolean;
  onlineStatus: boolean;
}

export interface NetworkInfo {
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface PerformanceReport {
  id: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    coreWebVitals: CoreWebVitals;
    loadingPerformance: LoadingMetrics;
    interactionMetrics: InteractionMetrics;
    memoryUsage: MemoryMetrics;
    errorRates: ErrorMetrics;
  };
  recommendations: PerformanceRecommendation[];
  trends: PerformanceTrend[];
  generatedAt: Date;
}

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

export interface LoadingMetrics {
  averageLoadTime: number;
  medianLoadTime: number;
  p95LoadTime: number;
  slowestPages: { path: string; loadTime: number }[];
  resourceLoadTimes: { type: string; average: number }[];
}

export interface InteractionMetrics {
  averageResponseTime: number;
  totalInteractions: number;
  successRate: number;
  mostUsedFeatures: { feature: string; count: number }[];
  abandonmentRate: number;
}

export interface MemoryMetrics {
  averageUsage: number;
  peakUsage: number;
  memoryLeaks: MemoryLeak[];
}

export interface MemoryLeak {
  component: string;
  growthRate: number;
  timestamp: Date;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  errorsByType: Record<string, number>;
  topErrors: { message: string; count: number; lastSeen: Date }[];
}

export interface PerformanceRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  actionItems: string[];
}

export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'degrading' | 'stable';
  changePercentage: number;
  period: string;
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetric[] = [];
  private currentSession: UserSession;
  private observers: PerformanceObserver[] = [];
  private isMonitoring: boolean = false;
  private reportingInterval: number = 60000; // 1 minute
  private maxMetricsInMemory: number = 1000;

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  constructor() {
    this.currentSession = this.initializeSession();
    this.initialize();
  }

  private initialize(): void {
    this.setupPerformanceObservers();
    this.setupErrorTracking();
    this.setupUserInteractionTracking();
    this.setupNetworkMonitoring();
    this.setupMemoryMonitoring();
    this.startMonitoring();
  }

  private initializeSession(): UserSession {
    return {
      sessionId: this.generateSessionId(),
      startTime: new Date(),
      pageViews: [],
      interactions: [],
      errors: [],
      deviceInfo: this.getDeviceInfo(),
      networkInfo: this.getNetworkInfo()
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      deviceType: this.getDeviceType(),
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookieEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine
    };
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getNetworkInfo(): NetworkInfo {
    const navAny = navigator as unknown as {
      connection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean };
      mozConnection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean };
      webkitConnection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean };
    };
    const connection = navAny.connection || navAny.mozConnection || navAny.webkitConnection;
    
    return {
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false
    };
  }

  private setupPerformanceObservers(): void {
    // Navigation timing
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.recordResourceMetrics(entry as PerformanceResourceTiming);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Paint timing
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'paint') {
            this.recordPaintMetrics(entry as PerformancePaintTiming);
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // Layout shift
      const layoutObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'layout-shift' && !(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
            this.recordLayoutShift(entry as unknown as { value: number });
          }
        });
      });
      layoutObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(layoutObserver);
    }
  }

  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.recordError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        stack: event.error?.stack,
        severity: 'high'
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        type: 'javascript',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        severity: 'medium'
      });
    });
  }

  private setupUserInteractionTracking(): void {
    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.recordInteraction({
        type: 'click',
        element: this.getElementSelector(target),
        successful: true,
        metadata: {
          x: event.clientX,
          y: event.clientY,
          button: event.button
        }
      });
    });

    // Form submission tracking
    document.addEventListener('submit', (event) => {
      const target = event.target as HTMLFormElement;
      this.recordInteraction({
        type: 'form_submit',
        element: this.getElementSelector(target),
        successful: true,
        metadata: {
          formId: target.id,
          action: target.action
        }
      });
    });

    // Page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.endCurrentPageView();
      } else {
        this.startNewPageView();
      }
    });
  }

  private setupNetworkMonitoring(): void {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        
        this.recordMetric({
          name: 'network_request',
          value: duration,
          unit: 'ms',
          category: 'network',
          tags: {
            url: args[0].toString(),
            status: response.status.toString(),
            method: args[1]?.method || 'GET'
          }
        });

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.recordError({
          type: 'network',
          message: `Network request failed: ${error}`,
          severity: 'medium'
        });
        throw error;
      }
    };
  }

  private setupMemoryMonitoring(): void {
    if ((performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory) {
      setInterval(() => {
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        this.recordMetric({
          name: 'memory_usage',
          value: memory.usedJSHeapSize,
          unit: 'bytes',
          category: 'memory',
          tags: {
            total: memory.totalJSHeapSize.toString(),
            limit: memory.jsHeapSizeLimit.toString()
          }
        });
      }, 30000); // Check every 30 seconds
    }
  }

  private recordNavigationMetrics(entry: PerformanceNavigationTiming): void {
    // Record core web vitals and navigation timing
    this.recordMetric({
      name: 'ttfb',
      value: entry.responseStart - entry.requestStart,
      unit: 'ms',
      category: 'navigation',
      tags: { page: window.location.pathname },
      threshold: { warning: 200, critical: 500 }
    });

    this.recordMetric({
      name: 'dom_content_loaded',
      value: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      unit: 'ms',
      category: 'navigation',
      tags: { page: window.location.pathname },
      threshold: { warning: 1000, critical: 2000 }
    });

    this.recordMetric({
      name: 'load_complete',
      value: entry.loadEventEnd - entry.loadEventStart,
      unit: 'ms',
      category: 'navigation',
      tags: { page: window.location.pathname },
      threshold: { warning: 2000, critical: 4000 }
    });
  }

  private recordResourceMetrics(entry: PerformanceResourceTiming): void {
    const resourceType = this.getResourceType(entry.name);
    
    this.recordMetric({
      name: 'resource_load_time',
      value: entry.responseEnd - entry.requestStart,
      unit: 'ms',
      category: 'loading',
      tags: {
        resource: entry.name,
        type: resourceType,
        size: entry.transferSize?.toString() || '0'
      }
    });
  }

  private recordPaintMetrics(entry: PerformancePaintTiming): void {
    this.recordMetric({
      name: entry.name.replace('-', '_'),
      value: entry.startTime,
      unit: 'ms',
      category: 'navigation',
      tags: { page: window.location.pathname },
      threshold: entry.name === 'first-contentful-paint' 
        ? { warning: 1800, critical: 3000 }
        : { warning: 2500, critical: 4000 }
    });
  }

  private recordLayoutShift(entry: { value: number }): void {
    this.recordMetric({
      name: 'cumulative_layout_shift',
      value: entry.value,
      unit: 'score',
      category: 'interaction',
      tags: { page: window.location.pathname },
      threshold: { warning: 0.1, critical: 0.25 }
    });
  }

  private recordError(errorData: Partial<ErrorEvent>): void {
    const error: ErrorEvent = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: errorData.type || 'javascript',
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      filename: errorData.filename,
      lineNumber: errorData.lineNumber,
      columnNumber: errorData.columnNumber,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      severity: errorData.severity || 'medium',
      resolved: false
    };

    this.currentSession.errors.push(error);
    
    // Also record as metric
    this.recordMetric({
      name: 'error_count',
      value: 1,
      unit: 'count',
      category: 'custom',
      tags: {
        type: error.type,
        severity: error.severity,
        page: window.location.pathname
      }
    });
  }

  private recordInteraction(interactionData: Partial<UserInteraction>): void {
    const interaction: UserInteraction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: interactionData.type || 'click',
      element: interactionData.element || 'unknown',
      timestamp: new Date(),
      duration: interactionData.duration,
      successful: interactionData.successful ?? true,
      metadata: interactionData.metadata || {}
    };

    this.currentSession.interactions.push(interaction);
  }

  private recordMetric(metricData: Partial<PerformanceMetric>): void {
    const metric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: metricData.name || 'unknown',
      value: metricData.value || 0,
      unit: metricData.unit || 'ms',
      timestamp: new Date(),
      category: metricData.category || 'custom',
      tags: metricData.tags || {},
      threshold: metricData.threshold
    };

    this.metrics.push(metric);

    // Keep metrics array size manageable
    if (this.metrics.length > this.maxMetricsInMemory) {
      this.metrics = this.metrics.slice(-this.maxMetricsInMemory);
    }

    // Check thresholds and alert if needed
    this.checkThresholds(metric);
  }

  private checkThresholds(metric: PerformanceMetric): void {
    if (!metric.threshold) return;

    if (metric.value >= metric.threshold.critical) {
      console.warn(`Critical performance threshold exceeded: ${metric.name} = ${metric.value}${metric.unit}`);
    } else if (metric.value >= metric.threshold.warning) {
      console.warn(`Warning performance threshold exceeded: ${metric.name} = ${metric.value}${metric.unit}`);
    }
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['js', 'mjs'].includes(extension || '')) return 'script';
    if (['css'].includes(extension || '')) return 'stylesheet';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) return 'image';
    if (['woff', 'woff2', 'ttf', 'otf'].includes(extension || '')) return 'font';
    return 'other';
  }

  private startNewPageView(): void {
    const pageView: PageView = {
      id: `pageview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      path: window.location.pathname,
      title: document.title,
      loadTime: 0, // Will be updated when load completes
      renderTime: 0, // Will be updated when render completes
      timestamp: new Date(),
      referrer: document.referrer
    };

    this.currentSession.pageViews.push(pageView);
  }

  private endCurrentPageView(): void {
    const currentPageView = this.currentSession.pageViews[this.currentSession.pageViews.length - 1];
    if (currentPageView) {
      currentPageView.timeOnPage = Date.now() - currentPageView.timestamp.getTime();
    }
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startNewPageView();
    
    // Periodic reporting
    setInterval(() => {
      this.generatePerformanceReport();
    }, this.reportingInterval);
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
    this.endCurrentPageView();
    this.currentSession.endTime = new Date();
    this.currentSession.duration = this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();
    
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  public generatePerformanceReport(): PerformanceReport {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentMetrics = this.metrics.filter(m => m.timestamp >= oneHourAgo);
    
    return {
      id: `report_${Date.now()}`,
      period: { start: oneHourAgo, end: now },
      metrics: {
        coreWebVitals: this.calculateCoreWebVitals(recentMetrics),
        loadingPerformance: this.calculateLoadingMetrics(recentMetrics),
        interactionMetrics: this.calculateInteractionMetrics(),
        memoryUsage: this.calculateMemoryMetrics(recentMetrics),
        errorRates: this.calculateErrorMetrics()
      },
      recommendations: this.generateRecommendations(recentMetrics),
      trends: this.calculateTrends(recentMetrics),
      generatedAt: now
    };
  }

  private calculateCoreWebVitals(metrics: PerformanceMetric[]): CoreWebVitals {
    const getAverage = (name: string) => {
      const relevant = metrics.filter(m => m.name === name);
      return relevant.length > 0 ? relevant.reduce((sum, m) => sum + m.value, 0) / relevant.length : 0;
    };

    return {
      lcp: getAverage('largest_contentful_paint'),
      fid: getAverage('first_input_delay'),
      cls: getAverage('cumulative_layout_shift'),
      fcp: getAverage('first_contentful_paint'),
      ttfb: getAverage('ttfb')
    };
  }

  private calculateLoadingMetrics(metrics: PerformanceMetric[]): LoadingMetrics {
    const loadTimes = metrics.filter(m => m.name === 'load_complete').map(m => m.value);
    const resourceTimes = metrics.filter(m => m.name === 'resource_load_time');
    
    return {
      averageLoadTime: loadTimes.length > 0 ? loadTimes.reduce((sum, t) => sum + t, 0) / loadTimes.length : 0,
      medianLoadTime: this.calculateMedian(loadTimes),
      p95LoadTime: this.calculatePercentile(loadTimes, 95),
      slowestPages: [],
      resourceLoadTimes: this.groupResourcesByType(resourceTimes)
    };
  }

  private calculateInteractionMetrics(): InteractionMetrics {
    const interactions = this.currentSession.interactions;
    const successfulInteractions = interactions.filter(i => i.successful);
    
    return {
      averageResponseTime: 0, // Would calculate from interaction durations
      totalInteractions: interactions.length,
      successRate: interactions.length > 0 ? successfulInteractions.length / interactions.length : 0,
      mostUsedFeatures: this.getMostUsedFeatures(interactions),
      abandonmentRate: 0 // Would calculate based on incomplete workflows
    };
  }

  private calculateMemoryMetrics(metrics: PerformanceMetric[]): MemoryMetrics {
    const memoryMetrics = metrics.filter(m => m.name === 'memory_usage');
    const usageValues = memoryMetrics.map(m => m.value);
    
    return {
      averageUsage: usageValues.length > 0 ? usageValues.reduce((sum, v) => sum + v, 0) / usageValues.length : 0,
      peakUsage: Math.max(...usageValues, 0),
      memoryLeaks: [] // Would analyze memory growth patterns
    };
  }

  private calculateErrorMetrics(): ErrorMetrics {
    const errors = this.currentSession.errors;
    const errorsByType = errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalErrors: errors.length,
      errorRate: errors.length / Math.max(this.currentSession.interactions.length, 1),
      errorsByType,
      topErrors: this.getTopErrors(errors)
    };
  }

  private generateRecommendations(metrics: PerformanceMetric[]): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];
    
    // Check for slow loading
    const avgLoadTime = metrics.filter(m => m.name === 'load_complete')
      .reduce((sum, m) => sum + m.value, 0) / Math.max(metrics.filter(m => m.name === 'load_complete').length, 1);
    
    if (avgLoadTime > 3000) {
      recommendations.push({
        id: 'slow_loading',
        priority: 'high',
        category: 'Performance',
        title: 'Slow Page Loading Detected',
        description: `Average page load time is ${avgLoadTime.toFixed(0)}ms, which exceeds the recommended 3 seconds.`,
        impact: 'Users may experience frustration and increased bounce rates',
        effort: 'medium',
        actionItems: [
          'Optimize images and use next-gen formats',
          'Implement code splitting',
          'Use a CDN for static assets',
          'Minimize and compress JavaScript and CSS'
        ]
      });
    }
    
    return recommendations;
  }

  private calculateTrends(metrics: PerformanceMetric[]): PerformanceTrend[] {
    // Simple trend calculation - in real implementation, this would compare with historical data
    return [
      {
        metric: 'load_time',
        direction: 'stable',
        changePercentage: 0,
        period: 'last_hour'
      }
    ];
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private groupResourcesByType(resourceMetrics: PerformanceMetric[]): { type: string; average: number }[] {
    const groups = resourceMetrics.reduce((acc, metric) => {
      const type = metric.tags.type || 'other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(groups).map(([type, values]) => ({
      type,
      average: values.reduce((sum, v) => sum + v, 0) / values.length
    }));
  }

  private getMostUsedFeatures(interactions: UserInteraction[]): { feature: string; count: number }[] {
    const features = interactions.reduce((acc, interaction) => {
      const feature = interaction.element;
      acc[feature] = (acc[feature] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(features)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopErrors(errors: ErrorEvent[]): { message: string; count: number; lastSeen: Date }[] {
    const errorGroups = errors.reduce((acc, error) => {
      const key = error.message;
      if (!acc[key]) {
        acc[key] = { count: 0, lastSeen: error.timestamp };
      }
      acc[key].count++;
      if (error.timestamp > acc[key].lastSeen) {
        acc[key].lastSeen = error.timestamp;
      }
      return acc;
    }, {} as Record<string, { count: number; lastSeen: Date }>);

    return Object.entries(errorGroups)
      .map(([message, data]) => ({ message, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // Public API methods
  public getMetrics(category?: string): PerformanceMetric[] {
    if (category) {
      return this.metrics.filter(m => m.category === category);
    }
    return [...this.metrics];
  }

  public getCurrentSession(): UserSession {
    return { ...this.currentSession };
  }

  public clearMetrics(): void {
    this.metrics = [];
  }

  public trackCustomMetric(name: string, value: number, unit: string = 'count', tags: Record<string, string> = {}): void {
    this.recordMetric({
      name,
      value,
      unit,
      category: 'custom',
      tags
    });
  }

  public getPerformanceScore(): number {
    const coreVitals = this.calculateCoreWebVitals(this.metrics);
    let score = 100;

    // Deduct points based on Core Web Vitals thresholds
    if (coreVitals.lcp > 4000) score -= 30;
    else if (coreVitals.lcp > 2500) score -= 15;

    if (coreVitals.fid > 300) score -= 25;
    else if (coreVitals.fid > 100) score -= 10;

    if (coreVitals.cls > 0.25) score -= 25;
    else if (coreVitals.cls > 0.1) score -= 10;

    // Deduct points for errors
    const errorRate = this.currentSession.errors.length / Math.max(this.currentSession.interactions.length, 1);
    if (errorRate > 0.05) score -= 20;
    else if (errorRate > 0.01) score -= 10;

    return Math.max(0, score);
  }
}

export default PerformanceMonitoringService.getInstance();
