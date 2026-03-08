import { useState, useCallback } from 'react';
import { ApiError } from '@/services/apiClient';
import { toast } from './use-toast';

interface UseApiOptions<TData> {
  onSuccess?: (data: TData) => void;
  onError?: (error: ApiError) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

/**
 * Universal hook for API calls with loading and error states
 */
export function useApi<TData = unknown, TArgs extends unknown[] = unknown[]>(
  apiFunction: (...args: TArgs) => Promise<TData>,
  options: UseApiOptions<TData> = {}
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const {
    onSuccess,
    onError,
    showSuccessToast = false,
    showErrorToast = true,
    successMessage,
  } = options;

  const execute = useCallback(
    async (...args: TArgs) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);
        setData(result);

        if (showSuccessToast && successMessage) {
          toast({
            title: 'Erfolgreich',
            description: successMessage,
          });
        }

        onSuccess?.(result);
        return result;
      } catch (err) {
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError(
                err instanceof Error ? err.message : 'Unbekannter Fehler',
                500,
                'UNKNOWN_ERROR'
              );

        setError(apiError);

        if (showErrorToast) {
          toast({
            variant: 'destructive',
            title: 'Fehler',
            description: apiError.message || 'Ein Fehler ist aufgetreten',
          });
        }

        onError?.(apiError);
        throw apiError;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, onSuccess, onError, showSuccessToast, showErrorToast, successMessage]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
