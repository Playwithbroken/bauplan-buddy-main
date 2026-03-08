import { useState, useEffect } from 'react';

interface UsePageLoadingOptions {
  /** Initial loading delay in ms (default: 500) */
  delay?: number;
  /** Auto-load on mount (default: true) */
  autoLoad?: boolean;
}

/**
 * Universal hook for page loading states
 * 
 * @example
 * ```tsx
 * const { loading } = usePageLoading();
 * 
 * if (loading) return <PageSkeleton type="quotes" />;
 * ```
 */
export function usePageLoading(options: UsePageLoadingOptions = {}) {
  const { delay = 500, autoLoad = true } = options;
  const [loading, setLoading] = useState(autoLoad);

  useEffect(() => {
    if (!autoLoad) return;

    const timer = setTimeout(() => {
      setLoading(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, autoLoad]);

  const startLoading = () => setLoading(true);
  const stopLoading = () => setLoading(false);

  return {
    loading,
    setLoading,
    startLoading,
    stopLoading,
  };
}
