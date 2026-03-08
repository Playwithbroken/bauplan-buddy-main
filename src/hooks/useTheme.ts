import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CSSProperties } from 'react';
import ThemeService, { Theme, ThemeConfig } from '@/services/themeService';
import AccessibilityService from '@/services/accessibilityService';
import { useThemeContext, ThemeMode } from '@/contexts/ThemeContext';

// Export the context-based hook as the main hook
export { useThemeContext as useTheme } from '@/contexts/ThemeContext';
export { useThemeContext } from '@/contexts/ThemeContext';

export interface UseThemeReturn {
  theme: ThemeMode;
  baseTheme: Theme;
  effectiveTheme: 'light' | 'dark';
  isDarkMode: boolean;
  isHighContrast: boolean;
  isSystemTheme: boolean;
  systemPreference: 'light' | 'dark';
  config: ThemeConfig;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setHighContrast: (enabled: boolean) => void;
  toggleHighContrast: () => void;
  setAutoSwitch: (enabled: boolean, switchTime?: { lightStart: string; darkStart: string }) => void;
  availableThemes: Array<{ value: Theme; label: string; description: string }>;
  themeColors: Record<string, string>;
  contrastRatio: number;
  preloadThemeAssets: (theme: 'light' | 'dark') => void;
  exportConfig: () => string;
  importConfig: (config: string) => boolean;
  scheduleSwitch: (theme: Theme, time: Date) => void;
}

// Fallback hook for when ThemeProvider is not available
export function useThemeService(): UseThemeReturn {
  const [baseTheme, setBaseTheme] = useState<Theme>(ThemeService.getCurrentTheme());
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(
    ThemeService.getEffectiveCurrentTheme()
  );
  const [config, setConfig] = useState<ThemeConfig>(ThemeService.getConfig());
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    try {
      return document.documentElement.classList.contains('hc') || localStorage.getItem('highContrast') === 'true';
    } catch {
      return document.documentElement.classList.contains('hc');
    }
  });

  // Update state when theme changes
  const deriveThemeMode = useCallback(
    (themeValue: Theme, highContrast: boolean, currentEffectiveTheme: 'light' | 'dark'): ThemeMode => {
      if (!highContrast) {
        return themeValue;
      }
      return currentEffectiveTheme === 'dark' ? 'high-contrast-dark' : 'high-contrast';
    },
    []
  );

  useEffect(() => {
    const unsubscribe = ThemeService.onThemeChange((newEffectiveTheme) => {
      setBaseTheme(ThemeService.getCurrentTheme());
      setEffectiveTheme(newEffectiveTheme);
      setConfig(ThemeService.getConfig());
    });

    return unsubscribe;
  }, []);

  // Memoized setters
  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      if (newTheme === 'high-contrast' || newTheme === 'high-contrast-dark') {
        const targetBase = newTheme === 'high-contrast-dark' ? 'dark' : 'light';
        ThemeService.setTheme(targetBase);
        setBaseTheme(targetBase);
        setIsHighContrast(true);
        return;
      }

      ThemeService.setTheme(newTheme);
      setBaseTheme(newTheme);
      setIsHighContrast(false);
    },
    []
  );

  const toggleTheme = useCallback(() => {
    if (isHighContrast) {
      const nextBase = effectiveTheme === 'dark' ? 'light' : 'dark';
      ThemeService.setTheme(nextBase);
      setBaseTheme(nextBase);
      return;
    }

    ThemeService.toggleTheme();
    setBaseTheme(ThemeService.getCurrentTheme());
  }, [effectiveTheme, isHighContrast]);

  const setHighContrast = useCallback((enabled: boolean) => {
    setIsHighContrast(enabled);
  }, []);

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast((prev) => !prev);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const nextThemeAttribute = isHighContrast
      ? effectiveTheme === 'dark'
        ? 'high-contrast-dark'
        : 'high-contrast'
      : null;

    root.classList.toggle('hc', isHighContrast);

    if (nextThemeAttribute) {
      root.setAttribute('data-theme', nextThemeAttribute);
    } else if (root.getAttribute('data-theme')?.startsWith('high-contrast')) {
      root.removeAttribute('data-theme');
    }

    try {
      localStorage.setItem('highContrast', isHighContrast ? 'true' : 'false');
    } catch {
      // ignore storage failures in fallback hook
    }

    try {
      AccessibilityService.updateSettings({ highContrast: isHighContrast });
    } catch {
      // ignore accessibility sync in fallback hook
    }
  }, [isHighContrast, effectiveTheme]);

  const setAutoSwitch = useCallback((
    enabled: boolean, 
    switchTime?: { lightStart: string; darkStart: string }
  ) => {
    ThemeService.setAutoSwitch(enabled, switchTime);
  }, []);

  const preloadThemeAssets = useCallback((targetTheme: 'light' | 'dark') => {
    ThemeService.preloadThemeAssets(targetTheme);
  }, []);

  const exportConfig = useCallback(() => {
    return ThemeService.exportThemeConfig();
  }, []);

  const importConfig = useCallback((configJson: string) => {
    return ThemeService.importThemeConfig(configJson);
  }, []);

  const scheduleSwitch = useCallback((targetTheme: Theme, time: Date) => {
    ThemeService.scheduleThemeSwitch(targetTheme, time);
  }, []);

  // Computed values
  const theme = useMemo(
    () => deriveThemeMode(baseTheme, isHighContrast, effectiveTheme),
    [baseTheme, deriveThemeMode, effectiveTheme, isHighContrast]
  );
  const isDarkMode = effectiveTheme === 'dark';
  const isSystemTheme = baseTheme === 'system';
  const systemPreference = ThemeService.getSystemPreference();
  const availableThemes = ThemeService.getAvailableThemes();
  const themeColors = ThemeService.getThemeColors();
  const contrastRatio = ThemeService.getContrastRatio();

  return {
    theme,
    baseTheme,
    effectiveTheme,
    isDarkMode,
    isHighContrast,
    isSystemTheme,
    systemPreference,
    config,
    setTheme,
    toggleTheme,
    setHighContrast,
    toggleHighContrast,
    setAutoSwitch,
    availableThemes,
    themeColors,
    contrastRatio,
    preloadThemeAssets,
    exportConfig,
    importConfig,
    scheduleSwitch
  };
}

// Convenience hooks for specific use cases
export function useIsDarkMode(): boolean {
  const { isDarkMode } = useThemeContext();
  return isDarkMode;
}

export function useThemeColors(): Record<string, string> {
  const { effectiveTheme } = useThemeContext();
  return ThemeService.getThemeColors();
}

export function useEffectiveTheme(): 'light' | 'dark' {
  const { effectiveTheme } = useThemeContext();
  return effectiveTheme;
}

// Hook for theme-aware styling
export function useThemeStyles() {
  const { isDarkMode } = useThemeContext();
  const themeColors = ThemeService.getThemeColors();
  
  return {
    isDarkMode,
    colors: themeColors,
    getStyle: (lightStyle: CSSProperties, darkStyle: CSSProperties) => (isDarkMode ? darkStyle : lightStyle),
    getClassName: (lightClass: string, darkClass: string) => isDarkMode ? darkClass : lightClass,
    getConditionalStyle: (
      condition: boolean,
      trueStyle: CSSProperties,
      falseStyle: CSSProperties
    ) => (condition ? trueStyle : falseStyle)
  };
}

// Hook for theme transitions
export function useThemeTransition() {
  const { setTheme, effectiveTheme } = useThemeContext();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const transitionToTheme = useCallback(async (newTheme: Theme, duration = 300) => {
    setIsTransitioning(true);
    
    // Add transition class
    document.documentElement.style.transition = `background-color ${duration}ms ease, color ${duration}ms ease`;
    
    // Change theme
    setTheme(newTheme);
    
    // Remove transition after duration
    setTimeout(() => {
      document.documentElement.style.transition = '';
      setIsTransitioning(false);
    }, duration);
  }, [setTheme]);

  return {
    isTransitioning,
    transitionToTheme,
    currentTheme: effectiveTheme
  };
}

export default useThemeService;
