import React, { ComponentType, lazy, LazyExoticComponent } from 'react';

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
}

/**
 * Lazy load component with retry logic
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  options: RetryOptions = {}
): LazyExoticComponent<T> {
  const { maxRetries = 3, delay = 1000 } = options;

  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      let retries = 0;

      const attemptLoad = () => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (retries < maxRetries) {
              retries++;
              console.warn(
                `Failed to load component, retrying (${retries}/${maxRetries})...`,
                error
              );
              setTimeout(attemptLoad, delay * retries);
            } else {
              console.error('Failed to load component after max retries', error);
              reject(error);
            }
          });
      };

      attemptLoad();
    });
  });
}

/**
 * Preload a lazy component
 */
export function preloadComponent<T extends ComponentType<any>>(
  lazyComponent: LazyExoticComponent<T>
): void {
  // @ts-ignore - accessing internal _ctor
  const componentImport = lazyComponent._ctor;
  if (typeof componentImport === 'function') {
    componentImport();
  }
}

/**
 * Create a preloadable lazy component
 */
export function createPreloadableLazy<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(componentImport);
  
  return {
    Component: LazyComponent,
    preload: () => componentImport(),
  };
}
