// Jest setup: polyfills and global mocks

// ResizeObserver polyfill for Radix ScrollArea
class ResizeObserverMock {
  observe() { /* no-op */ }
  unobserve() { /* no-op */ }
  disconnect() { /* no-op */ }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).ResizeObserver = ResizeObserverMock;

// scrollIntoView mock for Radix Select / Floating UI
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Element.prototype as any).scrollIntoView = function() { /* no-op */ };

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = () =>
    ({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => { /* deprecated no-op */ },
      removeListener: () => { /* deprecated no-op */ },
      addEventListener: () => { /* no-op */ },
      removeEventListener: () => { /* no-op */ },
      dispatchEvent: () => false
    } as MediaQueryList);
}
