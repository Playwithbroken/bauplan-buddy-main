import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AsyncOperationOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useAsyncOperation<T = void>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const { toast } = useToast();

  const execute = useCallback(
    async (
      operation: () => Promise<T>,
      options: AsyncOperationOptions = {}
    ): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      setProgress(0);

      try {
        const result = await operation();
        
        setProgress(100);
        
        if (options.successMessage) {
          toast({
            title: 'Erfolg',
            description: options.successMessage,
          });
        }
        
        if (options.onSuccess) {
          options.onSuccess();
        }
        
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Ein Fehler ist aufgetreten');
        setError(error);
        
        if (options.errorMessage) {
          toast({
            title: 'Fehler',
            description: options.errorMessage,
            variant: 'destructive',
          });
        }
        
        if (options.onError) {
          options.onError(error);
        }
        
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const updateProgress = useCallback((value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  }, []);

  return {
    isLoading,
    error,
    progress,
    execute,
    updateProgress,
  };
}
