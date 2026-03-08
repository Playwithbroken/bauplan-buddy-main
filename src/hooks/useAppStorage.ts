import { useState, useEffect, useCallback } from 'react';
import AppStorageService, { AppState } from '@/services/appStorageService';

/**
 * Hook to access and update app storage
 */
export function useAppStorage() {
  const appStorage = AppStorageService.getInstance();
  const [state, setState] = useState<AppState>(appStorage.getState());

  // Listen for state changes from other tabs
  useEffect(() => {
    const handleStateChange = (event: CustomEvent<AppState>) => {
      setState(event.detail);
    };

    window.addEventListener('appStateChanged', handleStateChange as EventListener);
    return () => {
      window.removeEventListener('appStateChanged', handleStateChange as EventListener);
    };
  }, []);

  const updateUserPreferences = useCallback(
    (preferences: Partial<AppState['user']['preferences']>) => {
      appStorage.updateUserPreferences(preferences);
      setState(appStorage.getState());
    },
    [appStorage]
  );

  const updateUser = useCallback(
    (user: Partial<AppState['user']>) => {
      appStorage.updateUser(user);
      setState(appStorage.getState());
    },
    [appStorage]
  );

  const updateSettings = useCallback(
    (settings: Partial<AppState['settings']>) => {
      appStorage.updateSettings(settings);
      setState(appStorage.getState());
    },
    [appStorage]
  );

  const toggleModule = useCallback(
    (module: keyof AppState['modules'], enabled: boolean) => {
      appStorage.toggleModule(module, enabled);
      setState(appStorage.getState());
    },
    [appStorage]
  );

  const setOfflineMode = useCallback(
    (offline: boolean) => {
      appStorage.setOfflineMode(offline);
      setState(appStorage.getState());
    },
    [appStorage]
  );

  const clearAllData = useCallback(() => {
    appStorage.clearAllData();
    setState(appStorage.getState());
  }, [appStorage]);

  const exportData = useCallback(async () => {
    return await appStorage.exportData();
  }, [appStorage]);

  const importData = useCallback(
    async (jsonData: string) => {
      const success = await appStorage.importData(jsonData);
      if (success) {
        setState(appStorage.getState());
      }
      return success;
    },
    [appStorage]
  );

  return {
    state,
    updateUserPreferences,
    updateUser,
    updateSettings,
    toggleModule,
    setOfflineMode,
    clearAllData,
    exportData,
    importData,
    isOffline: appStorage.isOffline(),
    storageStats: appStorage.getStorageStats(),
  };
}

/**
 * Hook for theme preference
 */
export function useTheme() {
  const { state, updateUserPreferences } = useAppStorage();
  
  const setTheme = useCallback(
    (theme: 'light' | 'dark' | 'system') => {
      updateUserPreferences({ theme });
      
      // Apply theme to document
      const root = document.documentElement;
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.toggle('dark', systemTheme === 'dark');
      } else {
        root.classList.toggle('dark', theme === 'dark');
      }
    },
    [updateUserPreferences]
  );

  return {
    theme: state.user.preferences.theme,
    setTheme,
  };
}

/**
 * Hook for offline mode
 */
export function useOfflineMode() {
  const { state, setOfflineMode } = useAppStorage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline || state.settings.offlineMode,
    offlineMode: state.settings.offlineMode,
    setOfflineMode,
  };
}
