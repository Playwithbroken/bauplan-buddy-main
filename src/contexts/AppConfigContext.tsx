import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type StorageMode = 'local' | 'cloud';

type AppConfig = {
  storageMode: StorageMode;
};

type AppConfigContextType = {
  config: AppConfig;
  setStorageMode: (mode: StorageMode) => void;
};

const DEFAULT_CONFIG: AppConfig = {
  storageMode: 'local',
};

const CONFIG_KEY = 'bb_config';

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export const AppConfigProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) } as AppConfig;
    } catch (error) {
      console.warn('Failed to parse app config from localStorage', error);
    }
    return DEFAULT_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to persist app config to localStorage', error);
    }
  }, [config]);

  const setStorageMode = (mode: StorageMode) => setConfig((c) => ({ ...c, storageMode: mode }));

  const value = useMemo(() => ({ config, setStorageMode }), [config]);

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
};

export const useAppConfig = () => {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error('useAppConfig must be used within AppConfigProvider');
  return ctx;
};

