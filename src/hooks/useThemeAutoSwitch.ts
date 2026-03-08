import { useState, useEffect, useCallback } from 'react';

export interface UseThemeAutoSwitchOptions {
  sunriseHour?: number;
  sunsetHour?: number;
  enabled?: boolean;
}

export interface UseThemeAutoSwitchReturn {
  isAutoEnabled: boolean;
  toggleAuto: () => void;
  currentAutoTheme: 'light' | 'dark' | null;
}

export function useThemeAutoSwitch(options: UseThemeAutoSwitchOptions = {}): UseThemeAutoSwitchReturn {
  const { sunriseHour = 6, sunsetHour = 18, enabled = false } = options;
  const [isAutoEnabled, setIsAutoEnabled] = useState(enabled);
  const [currentAutoTheme, setCurrentAutoTheme] = useState<'light' | 'dark' | null>(null);

  const determineTheme = useCallback(() => {
    const hour = new Date().getHours();
    return hour >= sunriseHour && hour < sunsetHour ? 'light' : 'dark';
  }, [sunriseHour, sunsetHour]);

  useEffect(() => {
    if (isAutoEnabled) {
      const theme = determineTheme();
      setCurrentAutoTheme(theme);
      
      // Check every minute for theme changes
      const interval = setInterval(() => {
        const newTheme = determineTheme();
        if (newTheme !== currentAutoTheme) {
          setCurrentAutoTheme(newTheme);
        }
      }, 60000);

      return () => clearInterval(interval);
    } else {
      setCurrentAutoTheme(null);
    }
  }, [isAutoEnabled, determineTheme, currentAutoTheme]);

  const toggleAuto = useCallback(() => {
    setIsAutoEnabled((prev) => !prev);
  }, []);

  return {
    isAutoEnabled,
    toggleAuto,
    currentAutoTheme,
  };
}
