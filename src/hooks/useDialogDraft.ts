import { useState, useEffect, useCallback } from 'react';
import { DraftService } from '@/services/draftService';
import { toast } from 'sonner';

/**
 * useDialogDraft Hook
 * Automatically handles loading and saving of form drafts.
 * 
 * @param key Unique key for the draft (e.g., 'new-project-dialog')
 * @param initialData The default state if no draft exists
 */
export function useDialogDraft<T>(key: string, initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [isRestored, setIsRestored] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      const saved = await DraftService.load<T>(key);
      if (saved) {
        setData(saved);
        setIsRestored(true);
        toast.info("Entwurf wurde wiederhergestellt", {
          description: "Du kannst dort weitermachen, wo du aufgehört hast.",
          action: {
            label: "Verwerfen",
            onClick: () => {
              setData(initialData);
              DraftService.clear(key);
            }
          }
        });
      }
    };
    loadDraft();
  }, [key]);

  // Save draft whenever data changes
  const updateData = useCallback((newData: Partial<T> | ((prev: T) => T)) => {
    setData(prev => {
      const updated = typeof newData === 'function' ? newData(prev) : { ...prev, ...newData };
      DraftService.save(key, updated);
      return updated;
    });
  }, [key]);

  const clearDraft = useCallback(() => {
    setData(initialData);
    DraftService.clear(key);
  }, [key, initialData]);

  return {
    data,
    updateData,
    clearDraft,
    isRestored
  };
}
