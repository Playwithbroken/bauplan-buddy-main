import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePerformanceMonitor, useRoutePreloading, useImageOptimization, usePerformanceReport } from '../usePerformance';

// Extend Jest matchers to include jest-dom
import '@testing-library/jest-dom';

// Mock the PerformanceOptimizationService
jest.mock('../../services/performanceOptimizationService', () => {
  const mockService = {
    startComponentRender: jest.fn(),
    endComponentRender: jest.fn(),
    preloadRoute: jest.fn(),
    optimizeImages: jest.fn(),
    addResourceHints: jest.fn(),
    generateReport: jest.fn(),
    getOptimizationSuggestions: jest.fn(),
    detectMemoryLeaks: jest.fn(),
  };

  return {
    __esModule: true,
    default: mockService,
    getPerformanceOptimizationService: jest.fn(() => mockService),
    isPerformanceMonitoringEnabled: jest.fn(() => true),
  };
});

type PerformanceServiceMock = {
  startComponentRender: jest.Mock;
  endComponentRender: jest.Mock;
  preloadRoute: jest.Mock;
  optimizeImages: jest.Mock;
  addResourceHints: jest.Mock;
  generateReport: jest.Mock;
  getOptimizationSuggestions: jest.Mock;
  detectMemoryLeaks: jest.Mock;
};

const performanceModule = jest.requireMock('../../services/performanceOptimizationService') as {
  default: PerformanceServiceMock;
  getPerformanceOptimizationService: jest.Mock;
  isPerformanceMonitoringEnabled: jest.Mock;
};

const mockPerformanceService = performanceModule.default;

const getServiceMock = performanceModule.getPerformanceOptimizationService;
const isEnabledMock = performanceModule.isPerformanceMonitoringEnabled;
// Mock performance.now()
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  },
  writable: true
});

describe('usePerformance Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (performance.now as jest.Mock).mockReturnValue(1000);
    getServiceMock.mockReturnValue(mockPerformanceService);
    isEnabledMock.mockReturnValue(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('usePerformanceMonitor', () => {
    const componentName = 'TestComponent';

    it('should start tracking on mount', () => {
      renderHook(() => usePerformanceMonitor(componentName));

      expect(mockPerformanceService.startComponentRender).toHaveBeenCalledWith(componentName);
    });

    it('should end tracking on unmount', () => {
      const { unmount } = renderHook(() => usePerformanceMonitor(componentName));

      expect(mockPerformanceService.startComponentRender).toHaveBeenCalledWith(componentName);

      unmount();

      expect(mockPerformanceService.endComponentRender).toHaveBeenCalledWith(componentName);
    });

    it('should restart tracking on component update', () => {
      const { rerender } = renderHook(() => usePerformanceMonitor(componentName));

      // Clear initial calls
      mockPerformanceService.startComponentRender.mockClear();
      mockPerformanceService.endComponentRender.mockClear();

      // Trigger a re-render
      rerender();

      expect(mockPerformanceService.endComponentRender).toHaveBeenCalledWith(componentName);
      expect(mockPerformanceService.startComponentRender).toHaveBeenCalledWith(componentName);
    });

    it('should return tracking functions', () => {
      const { result } = renderHook(() => usePerformanceMonitor(componentName));

      expect(result.current.startTracking).toBeInstanceOf(Function);
      expect(result.current.endTracking).toBeInstanceOf(Function);
    });

    it('should call service methods when using returned functions', () => {
      const { result } = renderHook(() => usePerformanceMonitor(componentName));

      act(() => {
        result.current.startTracking();
      });

      expect(mockPerformanceService.startComponentRender).toHaveBeenCalledWith(componentName);

      act(() => {
        result.current.endTracking();
      });

      expect(mockPerformanceService.endComponentRender).toHaveBeenCalledWith(componentName);
    });

    it('should handle different component names', () => {
      const componentName1 = 'Component1';
      const componentName2 = 'Component2';

      renderHook(() => usePerformanceMonitor(componentName1));
      renderHook(() => usePerformanceMonitor(componentName2));

      expect(mockPerformanceService.startComponentRender).toHaveBeenCalledWith(componentName1);
      expect(mockPerformanceService.startComponentRender).toHaveBeenCalledWith(componentName2);
    });

    it('should not crash if performance.now is unavailable', () => {
      // Mock missing performance.now
      (performance.now as jest.Mock).mockImplementation(() => {
        throw new Error('Performance API not available');
      });

      expect(() => {
        renderHook(() => usePerformanceMonitor(componentName));
      }).not.toThrow();
    });

    it('should skip tracking when monitoring is disabled', () => {
      isEnabledMock.mockReturnValue(false);

      const { result, rerender } = renderHook(() => usePerformanceMonitor(componentName));

      expect(mockPerformanceService.startComponentRender).not.toHaveBeenCalled();
      expect(mockPerformanceService.endComponentRender).not.toHaveBeenCalled();

      act(() => {
        result.current.startTracking();
        result.current.endTracking();
      });

      expect(mockPerformanceService.startComponentRender).not.toHaveBeenCalled();
      expect(mockPerformanceService.endComponentRender).not.toHaveBeenCalled();

      mockPerformanceService.startComponentRender.mockClear();
      mockPerformanceService.endComponentRender.mockClear();

      isEnabledMock.mockReturnValue(true);
      rerender();

      expect(mockPerformanceService.startComponentRender).toHaveBeenCalledWith(componentName);
    });
  });

  describe('useRoutePreloading', () => {
    it('should return preloadRoute function', () => {
      const { result } = renderHook(() => useRoutePreloading());

      expect(result.current.preloadRoute).toBeInstanceOf(Function);
    });

    it('should call service preloadRoute method', () => {
      const { result } = renderHook(() => useRoutePreloading());
      const routePath = '/dashboard';

      act(() => {
        result.current.preloadRoute(routePath);
      });

      expect(mockPerformanceService.preloadRoute).toHaveBeenCalledWith(routePath);
    });

    it('should handle multiple route preloading calls', () => {
      const { result } = renderHook(() => useRoutePreloading());
      const routes = ['/dashboard', '/calendar', '/projects'];

      act(() => {
        routes.forEach(route => result.current.preloadRoute(route));
      });

      expect(mockPerformanceService.preloadRoute).toHaveBeenCalledTimes(3);
      routes.forEach(route => {
        expect(mockPerformanceService.preloadRoute).toHaveBeenCalledWith(route);
      });
    });

    it('should handle empty route path gracefully', () => {
      const { result } = renderHook(() => useRoutePreloading());

      expect(() => {
        act(() => {
          result.current.preloadRoute('');
        });
      }).not.toThrow();

      expect(mockPerformanceService.preloadRoute).toHaveBeenCalledWith('');
    });
  });

  describe('useImageOptimization', () => {
    it('should optimize images on mount', () => {
      renderHook(() => useImageOptimization());

      expect(mockPerformanceService.optimizeImages).toHaveBeenCalledTimes(1);
    });

    it('should add resource hints on mount', () => {
      renderHook(() => useImageOptimization());

      expect(mockPerformanceService.addResourceHints).toHaveBeenCalledTimes(1);
    });

    it('should call optimization methods only once per mount', () => {
      const { rerender } = renderHook(() => useImageOptimization());

      // Clear initial calls
      mockPerformanceService.optimizeImages.mockClear();
      mockPerformanceService.addResourceHints.mockClear();

      // Re-render shouldn't trigger optimization again due to empty dependency array
      rerender();

      expect(mockPerformanceService.optimizeImages).not.toHaveBeenCalled();
      expect(mockPerformanceService.addResourceHints).not.toHaveBeenCalled();
    });

    it('should handle optimization service errors gracefully', () => {
      mockPerformanceService.optimizeImages.mockImplementation(() => {
        throw new Error('Optimization failed');
      });

      expect(() => {
        renderHook(() => useImageOptimization());
      }).not.toThrow();
    });

    it('should call cleanup on unmount if cleanup function exists', () => {
      const { unmount } = renderHook(() => useImageOptimization());

      // This test verifies the hook doesn't crash on unmount
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('usePerformanceReport', () => {
    const mockReport = {
      componentRenderTimes: { TestComponent: 50 },
      routeLoadTimes: { '/dashboard': 200 },
      memoryUsage: { used: 1024, total: 2048 },
      recommendations: ['Use React.memo for heavy components']
    };

    const mockSuggestions = [
      { type: 'component', message: 'Consider memoizing TestComponent' },
      { type: 'route', message: 'Preload critical routes' }
    ];

    const mockMemoryLeaks = [
      { component: 'TestComponent', severity: 'high', description: 'Memory not released' }
    ];

    beforeEach(() => {
      mockPerformanceService.generateReport.mockReturnValue(mockReport);
      mockPerformanceService.getOptimizationSuggestions.mockReturnValue(mockSuggestions);
      mockPerformanceService.detectMemoryLeaks.mockReturnValue(mockMemoryLeaks);
    });

    it('should return performance report functions', () => {
      const { result } = renderHook(() => usePerformanceReport());

      expect(result.current.generateReport).toBeInstanceOf(Function);
      expect(result.current.getOptimizationSuggestions).toBeInstanceOf(Function);
      expect(result.current.detectMemoryLeaks).toBeInstanceOf(Function);
    });

    it('should generate performance report', () => {
      const { result } = renderHook(() => usePerformanceReport());

      const report = result.current.generateReport();

      expect(mockPerformanceService.generateReport).toHaveBeenCalledTimes(1);
      expect(report).toEqual(mockReport);
    });

    it('should get optimization suggestions', () => {
      const { result } = renderHook(() => usePerformanceReport());

      const suggestions = result.current.getOptimizationSuggestions();

      expect(mockPerformanceService.getOptimizationSuggestions).toHaveBeenCalledTimes(1);
      expect(suggestions).toEqual(mockSuggestions);
    });

    it('should detect memory leaks', () => {
      const { result } = renderHook(() => usePerformanceReport());

      const memoryLeaks = result.current.detectMemoryLeaks();

      expect(mockPerformanceService.detectMemoryLeaks).toHaveBeenCalledTimes(1);
      expect(memoryLeaks).toEqual(mockMemoryLeaks);
    });

    it('should handle service errors gracefully', () => {
      mockPerformanceService.generateReport.mockImplementation(() => {
        throw new Error('Report generation failed');
      });

      const { result } = renderHook(() => usePerformanceReport());

      expect(() => {
        const value = result.current.generateReport();
        expect(value).toBeUndefined();
      }).not.toThrow();
    });

    it('should return empty arrays when service methods return undefined', () => {
      mockPerformanceService.generateReport.mockReturnValue(undefined as any);
      mockPerformanceService.getOptimizationSuggestions.mockReturnValue(undefined as any);
      mockPerformanceService.detectMemoryLeaks.mockReturnValue(undefined as any);

      const { result } = renderHook(() => usePerformanceReport());

      expect(result.current.generateReport()).toBeUndefined();
      expect(result.current.getOptimizationSuggestions()).toEqual([]);
      expect(result.current.detectMemoryLeaks()).toEqual([]);
    });

    it('should work with multiple concurrent calls', () => {
      const { result } = renderHook(() => usePerformanceReport());

      // Make multiple calls
      result.current.generateReport();
      result.current.getOptimizationSuggestions();
      result.current.detectMemoryLeaks();

      expect(mockPerformanceService.generateReport).toHaveBeenCalledTimes(1);
      expect(mockPerformanceService.getOptimizationSuggestions).toHaveBeenCalledTimes(1);
      expect(mockPerformanceService.detectMemoryLeaks).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Tests', () => {
    it('should work together for comprehensive performance monitoring', async () => {
      const componentName = 'IntegrationTestComponent';

      // Use all hooks together
      const { result: monitorResult } = renderHook(() => usePerformanceMonitor(componentName));
      const { result: preloadResult } = renderHook(() => useRoutePreloading());
      renderHook(() => useImageOptimization());
      const { result: reportResult } = renderHook(() => usePerformanceReport());

      // Verify all services are called
      expect(mockPerformanceService.startComponentRender).toHaveBeenCalledWith(componentName);
      await waitFor(() => {
        expect(mockPerformanceService.optimizeImages).toHaveBeenCalled();
        expect(mockPerformanceService.addResourceHints).toHaveBeenCalled();
      });

      // Use the returned functions
      act(() => {
        monitorResult.current.endTracking();
        preloadResult.current.preloadRoute('/test');
        reportResult.current.generateReport();
      });

      expect(mockPerformanceService.endComponentRender).toHaveBeenCalledWith(componentName);
      expect(mockPerformanceService.preloadRoute).toHaveBeenCalledWith('/test');
      expect(mockPerformanceService.generateReport).toHaveBeenCalled();
    });

    it('should handle rapid successive calls efficiently', () => {
      const { result } = renderHook(() => usePerformanceMonitor('RapidComponent'));

      // Simulate rapid calls
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.startTracking();
          result.current.endTracking();
        }
      });

      expect(mockPerformanceService.startComponentRender).toHaveBeenCalledTimes(11); // 1 from mount + 10 from loop
      expect(mockPerformanceService.endComponentRender).toHaveBeenCalledTimes(10);
    });

    it('should maintain performance under stress conditions', () => {
      const componentCount = 50;
      const hooks: Array<{ current: any }> = [];

      // Create many performance monitors simultaneously
      for (let i = 0; i < componentCount; i++) {
        const { result } = renderHook(() => usePerformanceMonitor(`Component${i}`));
        hooks.push(result);
      }

      expect(mockPerformanceService.startComponentRender).toHaveBeenCalledTimes(componentCount);

      // Use all tracking functions
      act(() => {
        hooks.forEach(hook => {
          hook.current.endTracking();
        });
      });

      expect(mockPerformanceService.endComponentRender).toHaveBeenCalledTimes(componentCount);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null or undefined component names', () => {
      expect(() => {
        renderHook(() => usePerformanceMonitor(null as any));
      }).not.toThrow();

      expect(() => {
        renderHook(() => usePerformanceMonitor(undefined as any));
      }).not.toThrow();
    });

    it('should handle service method failures gracefully', () => {
      mockPerformanceService.startComponentRender.mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      expect(() => {
        renderHook(() => usePerformanceMonitor('FailingComponent'));
      }).not.toThrow();
    });

    it('should work when performance API is not available', () => {
      // Mock missing performance API
      const originalPerformance = window.performance;
      delete (window as any).performance;

      expect(() => {
        renderHook(() => usePerformanceMonitor('NoPerformanceAPI'));
      }).not.toThrow();

      // Restore performance API
      window.performance = originalPerformance;
    });
  });
});
