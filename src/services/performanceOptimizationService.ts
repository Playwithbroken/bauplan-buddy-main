// Performance optimization interfaces
export interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  loadTime: number;
  memoryUsage: number;
}

export interface ComponentMetrics {
  name: string;
  renderTime: number;
  renderCount: number;
  updateTime: number;
  memoryLeaks: boolean;
}

export interface BundleMetrics {
  totalSize: number;
  gzippedSize: number;
  chunks: BundleChunk[];
  duplicateModules: string[];
  unusedCode: number;
}

export interface BundleChunk {
  name: string;
  size: number;
  modules: string[];
}

import { isDevelopment, isTest } from '@/utils/env';

class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService;
  private performanceObserver: PerformanceObserver | null = null;
  private metrics: PerformanceMetrics = {
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    firstInputDelay: 0,
    timeToInteractive: 0,
    loadTime: 0,
    memoryUsage: 0
  };
  private componentMetrics = new Map<string, ComponentMetrics>();
  private bundleMetrics: BundleMetrics = {
    totalSize: 0,
    gzippedSize: 0,
    chunks: [],
    duplicateModules: [],
    unusedCode: 0
  };

  static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService();
    }
    return PerformanceOptimizationService.instance;
  }

  constructor() {
    this.initializePerformanceMonitoring();
    this.collectInitialMetrics();
  }

  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Monitor Core Web Vitals
    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = entry.startTime;
            }
            break;
          case 'largest-contentful-paint':
            this.metrics.largestContentfulPaint = entry.startTime;
            break;
          case 'layout-shift': {
            const layoutShiftEntry = entry as PerformanceEntry & {
              hadRecentInput: boolean;
              value: number;
            };
            if (!layoutShiftEntry.hadRecentInput) {
              this.metrics.cumulativeLayoutShift += layoutShiftEntry.value;
            }
            break;
          }
          case 'first-input': {
            const firstInputEntry = entry as PerformanceEntry & {
              processingStart: number;
            };
            this.metrics.firstInputDelay = firstInputEntry.processingStart - entry.startTime;
            break;
          }
          case 'navigation': {
            const navigationEntry = entry as PerformanceEntry & {
              loadEventEnd: number;
              fetchStart: number;
            };
            this.metrics.loadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
            break;
          }
        }
      }
    });

    try {
      this.performanceObserver.observe({ 
        entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input', 'navigation'] 
      });
    } catch (error) {
      console.warn('Some performance entry types are not supported:', error);
    }
  }

  private collectInitialMetrics(): void {
    if (typeof window === 'undefined') return;

    // Memory usage
    if ('memory' in performance) {
      const perfWithMemory = performance as Performance & {
        memory: {
          usedJSHeapSize: number;
        };
      };
      this.metrics.memoryUsage = perfWithMemory.memory.usedJSHeapSize;
    }

    // Time to Interactive (TTI) approximation
    if ('timing' in performance) {
      const timing = performance.timing;
      this.metrics.timeToInteractive = timing.domInteractive - timing.navigationStart;
    }
  }

  // Component Performance Tracking
  public startComponentRender(componentName: string): void {
    const startTime = performance.now();
    const existing = this.componentMetrics.get(componentName) || {
      name: componentName,
      renderTime: 0,
      renderCount: 0,
      updateTime: 0,
      memoryLeaks: false
    };

    existing.renderCount++;
    this.componentMetrics.set(componentName, { ...existing, renderTime: startTime });
  }

  public endComponentRender(componentName: string): void {
    const endTime = performance.now();
    const component = this.componentMetrics.get(componentName);
    if (component) {
      component.renderTime = endTime - component.renderTime;
      this.componentMetrics.set(componentName, component);

      // Warn about slow components
      if (component.renderTime > 16) { // 60fps threshold
        console.warn(`Slow component detected: ${componentName} took ${component.renderTime.toFixed(2)}ms to render`);
      }
    }
  }

  // Bundle Analysis
  public analyzeBundleSize(): Promise<BundleMetrics> {
    return new Promise((resolve) => {
      // In a real implementation, this would analyze the actual bundle
      // For now, we'll simulate bundle analysis
      const mockAnalysis: BundleMetrics = {
        totalSize: 1024000, // 1MB
        gzippedSize: 256000, // 256KB
        chunks: [
          {
            name: 'vendor-react',
            size: 200000,
            modules: ['react', 'react-dom']
          },
          {
            name: 'vendor-ui',
            size: 150000,
            modules: ['@radix-ui/*', 'lucide-react']
          },
          {
            name: 'features-core',
            size: 300000,
            modules: ['./src/components/projects/*', './src/components/calendar/*']
          },
          {
            name: 'features-integrations',
            size: 200000,
            modules: ['./src/components/integrations/*']
          }
        ],
        duplicateModules: [],
        unusedCode: 50000 // 50KB unused
      };

      this.bundleMetrics = mockAnalysis;
      resolve(mockAnalysis);
    });
  }

  // Performance Optimizations
  public getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];

    // Bundle size suggestions
    if (this.bundleMetrics.totalSize > 2000000) { // 2MB
      suggestions.push('Bundle size is large. Consider implementing more aggressive code splitting.');
    }

    if (this.bundleMetrics.unusedCode > 100000) { // 100KB
      suggestions.push('Significant unused code detected. Review imports and remove dead code.');
    }

    // Performance metrics suggestions
    if (this.metrics.firstContentfulPaint > 2000) {
      suggestions.push('First Contentful Paint is slow. Optimize critical rendering path.');
    }

    if (this.metrics.largestContentfulPaint > 4000) {
      suggestions.push('Largest Contentful Paint is slow. Optimize largest elements and images.');
    }

    if (this.metrics.cumulativeLayoutShift > 0.1) {
      suggestions.push('Layout shifts detected. Ensure elements have defined dimensions.');
    }

    if (this.metrics.firstInputDelay > 100) {
      suggestions.push('Input delay is high. Reduce main thread blocking time.');
    }

    // Component performance suggestions
    this.componentMetrics.forEach((metrics, name) => {
      if (metrics.renderTime > 50) {
        suggestions.push(`Component '${name}' is slow. Consider optimization or memoization.`);
      }
      if (metrics.renderCount > 100) {
        suggestions.push(`Component '${name}' re-renders frequently. Check for unnecessary updates.`);
      }
    });

    return suggestions;
  }

  // Image Optimization
  public optimizeImages(): void {
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      // Add loading="lazy" for images below the fold
      const rect = img.getBoundingClientRect();
      if (rect.top > window.innerHeight) {
        img.loading = 'lazy';
      }

      // Add decoding="async" for better performance
      img.decoding = 'async';
    });
  }

  // Code Splitting Helpers
  public preloadRoute(routePath: string): void {
    // Preload route chunks when user hovers over navigation
    const routeMap: Record<string, () => Promise<unknown>> = {
      '/projects': () => import('../pages/ProjectsWithSidebar'),
      '/invoices': () => import('../pages/InvoicesWithSidebar'),
      '/documents': () => import('../pages/DocumentsWithSidebar'),
      '/analytics': () => import('../pages/AnalyticsWithSidebar'),
      '/calendar': () => import('../pages/CalendarWithSidebar')
    };

    const preloader = routeMap[routePath];
    if (preloader) {
      preloader().catch(() => {
        // Silently fail preloading
      });
    }
  }

  // Memory Management
  public detectMemoryLeaks(): ComponentMetrics[] {
    const leakyComponents: ComponentMetrics[] = [];
    
    this.componentMetrics.forEach((metrics) => {
      // Simple heuristic: components that render very frequently might have memory leaks
      if (metrics.renderCount > 1000) {
        metrics.memoryLeaks = true;
        leakyComponents.push(metrics);
      }
    });

    return leakyComponents;
  }

  // Resource Hints
  public addResourceHints(): void {
    // Add DNS prefetch for external domains
    const domains = ['fonts.googleapis.com', 'api.example.com'];
    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });

    // Preconnect to critical third-party origins
    const criticalDomains = ['fonts.gstatic.com'];
    criticalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = `https://${domain}`;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  // Getters
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getComponentMetrics(): ComponentMetrics[] {
    return Array.from(this.componentMetrics.values());
  }

  public getBundleMetrics(): BundleMetrics {
    return { ...this.bundleMetrics };
  }

  // Performance Report
  public generateReport(): {
    metrics: PerformanceMetrics;
    components: ComponentMetrics[];
    bundle: BundleMetrics;
    suggestions: string[];
    score: number;
  } {
    const suggestions = this.getOptimizationSuggestions();
    
    // Calculate performance score (0-100)
    let score = 100;
    if (this.metrics.firstContentfulPaint > 2000) score -= 20;
    if (this.metrics.largestContentfulPaint > 4000) score -= 20;
    if (this.metrics.cumulativeLayoutShift > 0.1) score -= 15;
    if (this.metrics.firstInputDelay > 100) score -= 15;
    if (this.bundleMetrics.totalSize > 2000000) score -= 15;
    if (suggestions.length > 3) score -= 15;

    return {
      metrics: this.getMetrics(),
      components: this.getComponentMetrics(),
      bundle: this.getBundleMetrics(),
      suggestions,
      score: Math.max(0, score)
    };
  }

  // Cleanup
  public cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

const enableMonitoring = isDevelopment() || isTest();

let sharedInstance: PerformanceOptimizationService | null = null;

export const getPerformanceOptimizationService = (): PerformanceOptimizationService | null => {
  if (!enableMonitoring) {
    return null;
  }

  if (!sharedInstance) {
    sharedInstance = PerformanceOptimizationService.getInstance();
  }

  return sharedInstance;
};

export const isPerformanceMonitoringEnabled = () => enableMonitoring;

const noop = () => undefined;

const performanceOptimizationService = new Proxy(
  {} as PerformanceOptimizationService,
  {
    get(_target, property) {
      const instance = getPerformanceOptimizationService();
      if (!instance) {
        return noop;
      }
      const value = (instance as unknown as Record<PropertyKey, unknown>)[property];
      if (typeof value === 'function') {
        return (value as (...args: unknown[]) => unknown).bind(instance);
      }
      return value;
    }
  }
) as PerformanceOptimizationService;

export default performanceOptimizationService;
