import performanceOptimizationService, { 
  PerformanceMetrics, 
  ComponentMetrics, 
  BundleMetrics 
} from '../performanceOptimizationService';

// Mock DOM APIs
global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  callback
}));

Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn().mockReturnValue(100),
    memory: {
      usedJSHeapSize: 5000000
    },
    timing: {
      domInteractive: 2000,
      navigationStart: 0
    }
  },
  writable: true
});

// Mock document APIs
const mockQuerySelectorAll = jest.fn();
const mockCreateElement = jest.fn().mockReturnValue({
  rel: '',
  href: '',
  crossOrigin: '',
  appendChild: jest.fn()
});
const mockAppendChild = jest.fn();

Object.defineProperty(document, 'querySelectorAll', {
  value: mockQuerySelectorAll,
  writable: true
});

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true
});

Object.defineProperty(document.head, 'appendChild', {
  value: mockAppendChild,
  writable: true
});

// Mock window APIs
Object.defineProperty(window, 'innerHeight', {
  value: 800,
  writable: true
});

describe('PerformanceOptimizationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Performance Tracking', () => {
    test('should track component render start', () => {
      performanceOptimizationService.startComponentRender('TestComponent');
      
      const metrics = performanceOptimizationService.getComponentMetrics();
      const testComponentMetrics = metrics.find(m => m.name === 'TestComponent');
      
      expect(testComponentMetrics).toBeDefined();
      expect(testComponentMetrics?.renderCount).toBe(1);
    });

    test('should track component render end and calculate render time', () => {
      (performance.now as jest.Mock)
        .mockReturnValueOnce(0)   // Start time
        .mockReturnValueOnce(50); // End time
      
      performanceOptimizationService.startComponentRender('TestComponent');
      performanceOptimizationService.endComponentRender('TestComponent');
      
      const metrics = performanceOptimizationService.getComponentMetrics();
      const testComponentMetrics = metrics.find(m => m.name === 'TestComponent');
      
      expect(testComponentMetrics?.renderTime).toBe(50);
    });

    test('should warn about slow components', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      (performance.now as jest.Mock)
        .mockReturnValueOnce(0)   // Start time
        .mockReturnValueOnce(20); // End time (> 16ms threshold)
      
      performanceOptimizationService.startComponentRender('SlowComponent');
      performanceOptimizationService.endComponentRender('SlowComponent');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow component detected: SlowComponent')
      );
      
      consoleSpy.mockRestore();
    });

    test('should track multiple renders for same component', () => {
      performanceOptimizationService.startComponentRender('TestComponent');
      performanceOptimizationService.startComponentRender('TestComponent');
      
      const metrics = performanceOptimizationService.getComponentMetrics();
      const testComponentMetrics = metrics.find(m => m.name === 'TestComponent');
      
      expect(testComponentMetrics?.renderCount).toBe(2);
    });
  });

  describe('Bundle Analysis', () => {
    test('should analyze bundle size and return metrics', async () => {
      const bundleMetrics = await performanceOptimizationService.analyzeBundleSize();
      
      expect(bundleMetrics).toBeDefined();
      expect(bundleMetrics.totalSize).toBeGreaterThan(0);
      expect(bundleMetrics.gzippedSize).toBeGreaterThan(0);
      expect(bundleMetrics.chunks).toHaveLength(4);
      expect(bundleMetrics.chunks[0].name).toBe('vendor-react');
    });

    test('should return cached bundle metrics', () => {
      const bundleMetrics = performanceOptimizationService.getBundleMetrics();
      
      expect(bundleMetrics).toBeDefined();
      expect(bundleMetrics.totalSize).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics', () => {
    test('should return current performance metrics', () => {
      const metrics = performanceOptimizationService.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.memoryUsage).toBe(5000000);
      expect(metrics.timeToInteractive).toBe(2000);
    });
  });

  describe('Optimization Suggestions', () => {
    test('should provide suggestions based on performance metrics', () => {
      const suggestions = performanceOptimizationService.getOptimizationSuggestions();
      
      expect(Array.isArray(suggestions)).toBe(true);
      
      // Should not suggest bundle size optimization for mock data (1MB < 2MB threshold)
      const bundleSuggestion = suggestions.find(s => s.includes('Bundle size is large'));
      expect(bundleSuggestion).toBeUndefined();
    });

    test('should suggest optimizations for slow components', () => {
      // Create a component with slow render time
      (performanceOptimizationService as any).componentMetrics.set('VerySlowComponent', {
        name: 'VerySlowComponent',
        renderTime: 100, // > 50ms threshold
        renderCount: 1,
        updateTime: 0,
        memoryLeaks: false
      });
      
      const suggestions = performanceOptimizationService.getOptimizationSuggestions();
      
      const slowComponentSuggestion = suggestions.find(s => 
        s.includes('VerySlowComponent') && s.includes('slow')
      );
      expect(slowComponentSuggestion).toBeDefined();
    });

    test('should suggest optimizations for frequently re-rendering components', () => {
      // Create a component with many re-renders
      (performanceOptimizationService as any).componentMetrics.set('FrequentComponent', {
        name: 'FrequentComponent',
        renderTime: 10,
        renderCount: 150, // > 100 threshold
        updateTime: 0,
        memoryLeaks: false
      });
      
      const suggestions = performanceOptimizationService.getOptimizationSuggestions();
      
      const frequentRenderSuggestion = suggestions.find(s => 
        s.includes('FrequentComponent') && s.includes('re-renders frequently')
      );
      expect(frequentRenderSuggestion).toBeDefined();
    });
  });

  describe('Image Optimization', () => {
    test('should optimize images below the fold', () => {
      const mockImages = [
        {
          getBoundingClientRect: () => ({ top: 1000 }), // Below the fold
          loading: '',
          decoding: ''
        },
        {
          getBoundingClientRect: () => ({ top: 400 }), // Above the fold
          loading: '',
          decoding: ''
        }
      ];
      
      mockQuerySelectorAll.mockReturnValue(mockImages);
      
      performanceOptimizationService.optimizeImages();
      
      expect(mockImages[0].loading).toBe('lazy');
      expect(mockImages[0].decoding).toBe('async');
      expect(mockImages[1].loading).toBe('');
      expect(mockImages[1].decoding).toBe('async');
    });
  });

  describe('Memory Leak Detection', () => {
    test('should detect potential memory leaks', () => {
      // Create a component with many renders (potential memory leak)
      (performanceOptimizationService as any).componentMetrics.set('LeakyComponent', {
        name: 'LeakyComponent',
        renderTime: 10,
        renderCount: 1500, // > 1000 threshold
        updateTime: 0,
        memoryLeaks: false
      });
      
      const leakyComponents = performanceOptimizationService.detectMemoryLeaks();
      
      expect(leakyComponents).toHaveLength(1);
      expect(leakyComponents[0].name).toBe('LeakyComponent');
      expect(leakyComponents[0].memoryLeaks).toBe(true);
    });

    test('should return empty array when no memory leaks detected', () => {
      const leakyComponents = performanceOptimizationService.detectMemoryLeaks();
      
      expect(leakyComponents).toEqual([]);
    });
  });

  describe('Resource Hints', () => {
    test('should add DNS prefetch hints', () => {
      const mockLink = {
        rel: '',
        href: ''
      };
      (document.createElement as jest.Mock).mockReturnValue(mockLink);
      
      performanceOptimizationService.addResourceHints();
      
      expect(mockCreateElement).toHaveBeenCalledWith('link');
      expect(mockAppendChild).toHaveBeenCalled();
    });
  });

  describe('Route Preloading', () => {
    test('should preload known routes', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      performanceOptimizationService.preloadRoute('/projects');
      
      // Should not throw error for known routes
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should handle unknown routes gracefully', () => {
      performanceOptimizationService.preloadRoute('/unknown-route');
      
      // Should handle gracefully without throwing
      expect(true).toBe(true);
    });
  });

  describe('Performance Report Generation', () => {
    test('should generate comprehensive performance report', () => {
      const report = performanceOptimizationService.generateReport();
      
      expect(report).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.components).toBeDefined();
      expect(report.bundle).toBeDefined();
      expect(report.suggestions).toBeDefined();
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
    });

    test('should calculate performance score correctly', () => {
      // Set metrics that should result in high score
      (performanceOptimizationService as any).metrics = {
        firstContentfulPaint: 1000,    // Good (< 2000)
        largestContentfulPaint: 2000,  // Good (< 4000)
        cumulativeLayoutShift: 0.05,   // Good (< 0.1)
        firstInputDelay: 50,           // Good (< 100)
        timeToInteractive: 1500,
        loadTime: 2000,
        memoryUsage: 5000000
      };
      
      const report = performanceOptimizationService.generateReport();
      
      expect(report.score).toBeGreaterThan(80); // Should be high score
    });
  });

  describe('Cleanup', () => {
    test('should cleanup performance observer', () => {
      const disconnectSpy = jest.fn();
      (performanceOptimizationService as any).performanceObserver = {
        disconnect: disconnectSpy
      };
      
      performanceOptimizationService.cleanup();
      
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });
});