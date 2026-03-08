import '@testing-library/jest-dom';

// Use Jest fake timers so tests that call advanceTimersByTime work reliably
// Individual tests can switch to real timers when needed via jest.useRealTimers()
// This also keeps Testing Library's waitFor in sync with timer control
const _g = globalThis as unknown as {
  jest?: { useFakeTimers?: () => void; setSystemTime?: (d: Date | number) => void };
  vi?: { setSystemTime: (d: Date | number) => void };
  window?: Window & { localStorage?: Storage };
  localStorage?: Storage;
};

_g.jest?.useFakeTimers?.();

// Provide a minimal Vitest-compatible global for tests that use `vi`
_g.vi = _g.vi || {
  setSystemTime: (date: Date | number) => {
    try {
      // modern fake timers
      _g.jest?.setSystemTime?.(date);
    } catch {
      // ignore if not available
    }
  }
};

// Bridge localStorage lookups to the test's global mock when present
try {
  Object.defineProperty(globalThis as unknown as Record<string, unknown>, 'localStorage', {
    configurable: true,
    get() {
      // Prefer test-provided mock on Node global
      const g = globalThis as unknown as { localStorage?: Storage; window?: Window & { localStorage?: Storage } };
      return g.localStorage ?? g.window?.localStorage;
    }
  });
} catch {
  // ignore
}

// Setup environment variables for Jest
process.env.VITE_USE_API = 'false';
process.env.VITE_API_URL = 'http://localhost:3001/api';
process.env.VITE_USE_MOCK_BACKEND = 'true';
process.env.MODE = 'test';
process.env.NODE_ENV = 'test';

// Mock import.meta for tests
if (typeof globalThis.import === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).import = {};
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (globalThis as any).import.meta === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).import.meta = {
    env: {
      VITE_USE_API: 'false',
      VITE_API_URL: 'http://localhost:3001/api',
      VITE_USE_MOCK_BACKEND: 'true',
      MODE: 'test'
    }
  };
}

// Mock IntersectionObserver for tests
class MockIntersectionObserver {
  root: null = null;
  rootMargin = '';
  thresholds: number[] = [];
  constructor(_callback: unknown) {}
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver for tests
class MockResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock TextEncoder/TextDecoder for jsPDF tests
if (typeof global.TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const util = require('util');
  global.TextEncoder = util.TextEncoder;
  global.TextDecoder = util.TextDecoder;
}

// Mock scrollIntoView for Radix UI components
Element.prototype.scrollIntoView = jest.fn();

// Mock jsPDF for tests
jest.mock('jspdf', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      text: jest.fn(),
      setFontSize: jest.fn(),
      setFont: jest.fn(),
      setTextColor: jest.fn(),
      setDrawColor: jest.fn(),
      setLineWidth: jest.fn(),
      line: jest.fn(),
      rect: jest.fn(),
      addPage: jest.fn(),
      save: jest.fn(),
      output: jest.fn(() => 'mock-pdf-output'),
      internal: {
        pageSize: {
          width: 210,
          height: 297
        }
      },
      getTextWidth: jest.fn(() => 50),
      splitTextToSize: jest.fn((text) => [text])
    }))
  };
});

