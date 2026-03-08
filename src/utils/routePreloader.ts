// Route preloader utility for optimizing code splitting and user experience

interface PreloadConfig {
  enabled: boolean;
  strategy: 'hover' | 'intersection' | 'immediate';
  delay: number;
}

const defaultConfig: PreloadConfig = {
  enabled: true,
  strategy: 'hover',
  delay: 100
};

// Route import mapping for dynamic imports
const routeImports: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('../pages/Dashboard'),
  '/projects': () => import('../pages/Projects'),
  '/quotes': () => import('../pages/Quotes'),
  '/invoices': () => import('../pages/Invoices'),
  '/order-confirmations': () => import('../pages/OrderConfirmations'),
  '/customers': () => import('../pages/Customers'),
  '/suppliers': () => import('../pages/Suppliers'),
  '/documents': () => import('../pages/Documents'),
  '/teams': () => import('../pages/Teams'),
  '/analytics': () => import('../pages/Analytics'),
  '/field': () => import('../pages/FieldWorker'),
  '/calendar': () => import('../pages/CalendarSimple'),
  '/chat': () => import('../pages/Chat'),
  '/admin': () => import('../pages/Admin')
};

// Track preloaded routes to avoid duplicate requests
const preloadedRoutes = new Set<string>();

/**
 * Preload a specific route component
 */
export const preloadRoute = (path: string): Promise<unknown> | null => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  if (preloadedRoutes.has(normalizedPath)) {
    return null; // Already preloaded
  }

  const importFn = routeImports[normalizedPath];
  if (!importFn) {
    console.warn(`No preload mapping found for route: ${normalizedPath}`);
    return null;
  }

  preloadedRoutes.add(normalizedPath);
  
  return importFn().catch(error => {
    // Remove from preloaded set on error so it can be retried
    preloadedRoutes.delete(normalizedPath);
    console.warn(`Failed to preload route ${normalizedPath}:`, error);
    throw error;
  });
};

/**
 * Preload multiple routes
 */
export const preloadRoutes = (paths: string[]): Promise<PromiseSettledResult<unknown>[]> => {
  const promises = paths
    .map(preloadRoute)
    .filter(Boolean) as Promise<unknown>[];
    
  return Promise.allSettled(promises);
};

/**
 * Initialize hover-based preloading on navigation links
 */
export const initializeHoverPreloading = (config: Partial<PreloadConfig> = {}): (() => void) => {
  const finalConfig = { ...defaultConfig, ...config };
  
  if (!finalConfig.enabled) return;

  let hoverTimeout: NodeJS.Timeout;

  const handleMouseEnter = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target || typeof target.closest !== 'function') return;
    
    const link = target.closest('a[href]') as HTMLAnchorElement;
    
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || !href.startsWith('/') || href.startsWith('http')) return;

    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => {
      preloadRoute(href);
    }, finalConfig.delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout);
  };

  // Add event listeners to document
  document.addEventListener('mouseenter', handleMouseEnter, true);
  document.addEventListener('mouseleave', handleMouseLeave, true);

  // Cleanup function
  const cleanup = () => {
    document.removeEventListener('mouseenter', handleMouseEnter, true);
    document.removeEventListener('mouseleave', handleMouseLeave, true);
    clearTimeout(hoverTimeout);
  };
  
  return cleanup;
};

/**
 * Initialize intersection observer-based preloading
 */
export const initializeIntersectionPreloading = (): (() => void) | undefined => {
  if (!('IntersectionObserver' in window)) {
    console.warn('IntersectionObserver not supported, skipping intersection preloading');
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLAnchorElement;
          const href = link.getAttribute('href');
          
          if (href && href.startsWith('/') && !href.startsWith('http')) {
            preloadRoute(href);
            observer.unobserve(link); // Stop observing once preloaded
          }
        }
      });
    },
    {
      rootMargin: '50px' // Start preloading 50px before the link comes into view
    }
  );

  // Observe all navigation links
  const observeLinks = () => {
    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach(link => observer.observe(link));
  };

  // Initial observation
  observeLinks();

  // Re-observe when DOM changes (for dynamic content)
  const mutationObserver = new MutationObserver(() => {
    observeLinks();
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Cleanup function
  return () => {
    observer.disconnect();
    mutationObserver.disconnect();
  };
};

/**
 * Preload critical routes immediately
 */
export const preloadCriticalRoutes = (): Promise<PromiseSettledResult<unknown>[]> => {
  const criticalRoutes = ['/dashboard', '/projects', '/calendar'];
  return preloadRoutes(criticalRoutes);
};

/**
 * Initialize complete preloading system
 */
export const initializePreloading = (config: Partial<PreloadConfig> = {}): (() => void) => {
  const finalConfig = { ...defaultConfig, ...config };
  
  if (!finalConfig.enabled) {
    return () => {}; // No-op cleanup
  }

  const cleanupFunctions: Array<() => void> = [];

  // Initialize based on strategy
  switch (finalConfig.strategy) {
    case 'hover': {
      const hoverCleanup = initializeHoverPreloading(finalConfig);
      cleanupFunctions.push(hoverCleanup);
      break;
    }
      
    case 'intersection': {
      const intersectionCleanup = initializeIntersectionPreloading();
      if (intersectionCleanup) cleanupFunctions.push(intersectionCleanup);
      break;
    }
      
    case 'immediate':
      // Preload all routes immediately (use with caution)
      preloadRoutes(Object.keys(routeImports));
      break;
  }

  // Always preload critical routes
  preloadCriticalRoutes();

  // Return combined cleanup function
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
};

// Export utilities
export default {
  preloadRoute,
  preloadRoutes,
  initializeHoverPreloading,
  initializeIntersectionPreloading,
  preloadCriticalRoutes,
  initializePreloading
};