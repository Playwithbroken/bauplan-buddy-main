/**
 * Performance Monitoring Hook
 * 
 * Real-time performance monitoring with:
 * - Core Web Vitals
 * - Custom metrics
 * - Memory usage tracking
 * - Network performance
 * - Component render times
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { logger } from "./logger";
import { analytics } from "./analyticsTracking";

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null;         // Largest Contentful Paint
  fid: number | null;         // First Input Delay
  cls: number | null;         // Cumulative Layout Shift
  fcp: number | null;         // First Contentful Paint
  ttfb: number | null;        // Time to First Byte
  
  // Custom metrics
  pageLoadTime: number | null;
  domContentLoaded: number | null;
  resourceLoadTime: number | null;
  
  // Memory
  usedJSHeapSize: number | null;
  totalJSHeapSize: number | null;
  jsHeapSizeLimit: number | null;
  
  // Network
  downlink: number | null;
  effectiveType: string | null;
  rtt: number | null;
  saveData: boolean;
}

export interface ComponentRenderMetrics {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
}

const initialMetrics: PerformanceMetrics = {
  lcp: null,
  fid: null,
  cls: null,
  fcp: null,
  ttfb: null,
  pageLoadTime: null,
  domContentLoaded: null,
  resourceLoadTime: null,
  usedJSHeapSize: null,
  totalJSHeapSize: null,
  jsHeapSizeLimit: null,
  downlink: null,
  effectiveType: null,
  rtt: null,
  saveData: false,
};

/**
 * Hook for monitoring application performance
 */
export function usePerformanceMonitor(): {
  metrics: PerformanceMetrics;
  isSupported: boolean;
  refresh: () => void;
} {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(initialMetrics);
  const [isSupported, setIsSupported] = useState(true);

  const collectMetrics = useCallback(() => {
    if (typeof window === "undefined" || !window.performance) {
      setIsSupported(false);
      return;
    }

    const newMetrics: PerformanceMetrics = { ...initialMetrics };

    try {
      // Navigation timing
      const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      if (navEntry) {
        newMetrics.pageLoadTime = navEntry.loadEventEnd - navEntry.startTime;
        newMetrics.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.startTime;
        newMetrics.ttfb = navEntry.responseStart - navEntry.requestStart;
      }

      // Resource timing
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      if (resources.length > 0) {
        const totalResourceTime = resources.reduce((sum, r) => sum + r.duration, 0);
        newMetrics.resourceLoadTime = totalResourceTime;
      }

      // Paint timing
      const paintEntries = performance.getEntriesByType("paint");
      paintEntries.forEach(entry => {
        if (entry.name === "first-contentful-paint") {
          newMetrics.fcp = entry.startTime;
        }
      });

      // Memory (Chrome only)
      const memory = (performance as Performance & { memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      } }).memory;
      
      if (memory) {
        newMetrics.usedJSHeapSize = memory.usedJSHeapSize;
        newMetrics.totalJSHeapSize = memory.totalJSHeapSize;
        newMetrics.jsHeapSizeLimit = memory.jsHeapSizeLimit;
      }

      // Network information
      const connection = (navigator as Navigator & { connection?: {
        downlink: number;
        effectiveType: string;
        rtt: number;
        saveData: boolean;
      } }).connection;
      
      if (connection) {
        newMetrics.downlink = connection.downlink;
        newMetrics.effectiveType = connection.effectiveType;
        newMetrics.rtt = connection.rtt;
        newMetrics.saveData = connection.saveData;
      }

      setMetrics(newMetrics);
    } catch (error) {
      logger.warn("Failed to collect performance metrics", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

  // Collect Core Web Vitals using PerformanceObserver
  useEffect(() => {
    if (typeof window === "undefined") return;

    const observers: PerformanceObserver[] = [];

    try {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      observers.push(lcpObserver);

      // FID Observer
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];
        entries.forEach(entry => {
          setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
        });
      });
      fidObserver.observe({ type: "first-input", buffered: true });
      observers.push(fidObserver);

      // CLS Observer
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as (PerformanceEntry & { hadRecentInput?: boolean; value?: number })[];
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value || 0;
            setMetrics(prev => ({ ...prev, cls: clsValue }));
          }
        });
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
      observers.push(clsObserver);

    } catch (error) {
      logger.debug("PerformanceObserver not fully supported", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Initial collection
    collectMetrics();

    // Refresh periodically
    const interval = setInterval(collectMetrics, 10000);

    return () => {
      observers.forEach(o => o.disconnect());
      clearInterval(interval);
    };
  }, [collectMetrics]);

  return { metrics, isSupported, refresh: collectMetrics };
}

/**
 * Hook for tracking component render performance
 */
export function useRenderPerformance(componentName: string): {
  metrics: ComponentRenderMetrics;
  markRenderStart: () => void;
  markRenderEnd: () => void;
} {
  const renderStartRef = useRef<number>(0);
  const [metrics, setMetrics] = useState<ComponentRenderMetrics>({
    componentName,
    renderCount: 0,
    totalRenderTime: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
  });

  const markRenderStart = useCallback(() => {
    renderStartRef.current = performance.now();
  }, []);

  const markRenderEnd = useCallback(() => {
    if (renderStartRef.current === 0) return;

    const renderTime = performance.now() - renderStartRef.current;
    
    setMetrics(prev => {
      const newCount = prev.renderCount + 1;
      const newTotal = prev.totalRenderTime + renderTime;
      
      return {
        ...prev,
        renderCount: newCount,
        totalRenderTime: newTotal,
        averageRenderTime: newTotal / newCount,
        lastRenderTime: renderTime,
      };
    });

    // Track slow renders
    if (renderTime > 16.67) { // More than one frame at 60fps
      logger.debug("Slow render detected", {
        componentName,
        renderTime: Math.round(renderTime * 100) / 100,
      });
      
      analytics.trackPerformance(`slow_render_${componentName}`, renderTime);
    }

    renderStartRef.current = 0;
  }, [componentName]);

  return { metrics, markRenderStart, markRenderEnd };
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number | null): string {
  if (bytes === null) return "N/A";
  
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Get performance score based on Core Web Vitals
 */
export function getPerformanceScore(metrics: PerformanceMetrics): {
  score: number;
  grade: "good" | "needs-improvement" | "poor";
} {
  let score = 100;

  // LCP (should be < 2.5s for good, < 4s for needs improvement)
  if (metrics.lcp !== null) {
    if (metrics.lcp > 4000) score -= 30;
    else if (metrics.lcp > 2500) score -= 15;
  }

  // FID (should be < 100ms for good, < 300ms for needs improvement)
  if (metrics.fid !== null) {
    if (metrics.fid > 300) score -= 30;
    else if (metrics.fid > 100) score -= 15;
  }

  // CLS (should be < 0.1 for good, < 0.25 for needs improvement)
  if (metrics.cls !== null) {
    if (metrics.cls > 0.25) score -= 30;
    else if (metrics.cls > 0.1) score -= 15;
  }

  let grade: "good" | "needs-improvement" | "poor";
  if (score >= 80) grade = "good";
  else if (score >= 50) grade = "needs-improvement";
  else grade = "poor";

  return { score: Math.max(0, score), grade };
}

/**
 * Report performance to analytics
 */
export function reportPerformanceToAnalytics(metrics: PerformanceMetrics): void {
  if (metrics.lcp !== null) {
    analytics.trackPerformance("lcp", metrics.lcp);
  }
  if (metrics.fid !== null) {
    analytics.trackPerformance("fid", metrics.fid);
  }
  if (metrics.cls !== null) {
    analytics.trackPerformance("cls", metrics.cls * 1000); // Convert to milliseconds-like scale
  }
  if (metrics.fcp !== null) {
    analytics.trackPerformance("fcp", metrics.fcp);
  }
  if (metrics.ttfb !== null) {
    analytics.trackPerformance("ttfb", metrics.ttfb);
  }
  if (metrics.pageLoadTime !== null) {
    analytics.trackPerformance("page_load", metrics.pageLoadTime);
  }
}
