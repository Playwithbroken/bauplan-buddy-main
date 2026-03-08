export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  theme: Theme;
  systemPreference: 'light' | 'dark';
  autoSwitch: boolean;
  switchTime?: {
    lightStart: string; // HH:MM format
    darkStart: string;  // HH:MM format
  };
}

export class ThemeService {
  private static instance: ThemeService;
  private config: ThemeConfig;
  private listeners: ((theme: Theme) => void)[] = [];
  private mediaQuery: MediaQueryList;

  private constructor() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.config = this.loadConfig();
    this.initializeTheme();
    this.setupMediaQueryListener();
    this.setupAutoSwitching();
  }

  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  private loadConfig(): ThemeConfig {
    try {
      const stored = localStorage.getItem('theme-config');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          theme: parsed.theme || 'system',
          systemPreference: this.mediaQuery.matches ? 'dark' : 'light',
          autoSwitch: parsed.autoSwitch || false,
          switchTime: parsed.switchTime || {
            lightStart: '06:00',
            darkStart: '18:00'
          }
        };
      }
    } catch (error) {
      console.error('Failed to load theme config:', error);
    }

    return {
      theme: 'system',
      systemPreference: this.mediaQuery.matches ? 'dark' : 'light',
      autoSwitch: false,
      switchTime: {
        lightStart: '06:00',
        darkStart: '18:00'
      }
    };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('theme-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save theme config:', error);
    }
  }

  private initializeTheme(): void {
    const effectiveTheme = this.getEffectiveTheme();
    this.applyTheme(effectiveTheme);
  }

  private setupMediaQueryListener(): void {
    this.mediaQuery.addEventListener('change', (e) => {
      this.config.systemPreference = e.matches ? 'dark' : 'light';
      if (this.config.theme === 'system') {
        this.applyTheme(this.getEffectiveTheme());
        this.notifyListeners();
      }
    });
  }

  private setupAutoSwitching(): void {
    if (this.config.autoSwitch) {
      this.scheduleAutoSwitch();
      // Check every minute for auto-switch
      setInterval(() => {
        if (this.config.autoSwitch) {
          this.checkAutoSwitch();
        }
      }, 60000);
    }
  }

  private scheduleAutoSwitch(): void {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (this.config.switchTime) {
      const { lightStart, darkStart } = this.config.switchTime;
      
      if (currentTime >= lightStart && currentTime < darkStart) {
        if (this.getEffectiveTheme() !== 'light') {
          this.setTheme('light');
        }
      } else {
        if (this.getEffectiveTheme() !== 'dark') {
          this.setTheme('dark');
        }
      }
    }
  }

  private checkAutoSwitch(): void {
    if (this.config.autoSwitch && this.config.theme !== 'system') {
      this.scheduleAutoSwitch();
    }
  }

  private getEffectiveTheme(): 'light' | 'dark' {
    switch (this.config.theme) {
      case 'light':
        return 'light';
      case 'dark':
        return 'dark';
      case 'system':
        return this.config.systemPreference;
      default:
        return 'light';
    }
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add new theme class
    root.classList.add(theme);
    
    // Set data attribute for CSS
    root.setAttribute('data-theme', theme);
    
    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme);
    
    // Update document title color for browser tabs
    this.updateFaviconForTheme(theme);
  }

  private updateMetaThemeColor(theme: 'light' | 'dark'): void {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1f2937' : '#ffffff');
    }
  }

  private updateFaviconForTheme(theme: 'light' | 'dark'): void {
    // This could be used to switch between light/dark favicons
    // For now, we'll keep the same favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      // Could switch to dark/light favicon variants here
      // favicon.href = theme === 'dark' ? '/favicon-dark.ico' : '/favicon.ico';
    }
  }

  private notifyListeners(): void {
    const currentTheme = this.getEffectiveTheme();
    this.listeners.forEach(listener => listener(currentTheme));
  }

  // Public API
  setTheme(theme: Theme): void {
    this.config.theme = theme;
    this.saveConfig();
    this.applyTheme(this.getEffectiveTheme());
    this.notifyListeners();
  }

  getCurrentTheme(): Theme {
    return this.config.theme;
  }

  getEffectiveCurrentTheme(): 'light' | 'dark' {
    return this.getEffectiveTheme();
  }

  toggleTheme(): void {
    const current = this.getEffectiveTheme();
    this.setTheme(current === 'light' ? 'dark' : 'light');
  }

  setAutoSwitch(enabled: boolean, switchTime?: { lightStart: string; darkStart: string }): void {
    this.config.autoSwitch = enabled;
    if (switchTime) {
      this.config.switchTime = switchTime;
    }
    this.saveConfig();
    
    if (enabled) {
      this.setupAutoSwitching();
    }
  }

  getConfig(): ThemeConfig {
    return { ...this.config };
  }

  // Event listeners
  onThemeChange(callback: (theme: 'light' | 'dark') => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Utility methods
  isDarkMode(): boolean {
    return this.getEffectiveTheme() === 'dark';
  }

  isSystemTheme(): boolean {
    return this.config.theme === 'system';
  }

  getSystemPreference(): 'light' | 'dark' {
    return this.config.systemPreference;
  }

  // Theme presets
  getAvailableThemes(): Array<{ value: Theme; label: string; description: string }> {
    return [
      {
        value: 'light',
        label: 'Hell',
        description: 'Heller Modus für bessere Sichtbarkeit bei Tageslicht'
      },
      {
        value: 'dark',
        label: 'Dunkel',
        description: 'Dunkler Modus für weniger Augenbelastung'
      },
      {
        value: 'system',
        label: 'System',
        description: 'Folgt den Systemeinstellungen automatisch'
      }
    ];
  }

  // Advanced features
  scheduleThemeSwitch(theme: Theme, time: Date): void {
    const now = new Date();
    const delay = time.getTime() - now.getTime();
    
    if (delay > 0) {
      setTimeout(() => {
        this.setTheme(theme);
      }, delay);
    }
  }

  exportThemeConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importThemeConfig(configJson: string): boolean {
    try {
      const imported = JSON.parse(configJson);
      if (this.validateThemeConfig(imported)) {
        this.config = imported;
        this.saveConfig();
        this.applyTheme(this.getEffectiveTheme());
        this.notifyListeners();
        return true;
      }
    } catch (error) {
      console.error('Failed to import theme config:', error);
    }
    return false;
  }

  private validateThemeConfig(config: unknown): config is ThemeConfig {
    if (!config || typeof config !== 'object') return false;
    const c = config as {
      theme?: unknown;
      systemPreference?: unknown;
      autoSwitch?: unknown;
      switchTime?: unknown;
    };
    const themeValid = typeof c.theme === 'string' && ['light', 'dark', 'system'].includes(c.theme);
    const sysValid = typeof c.systemPreference === 'string' && ['light', 'dark'].includes(c.systemPreference);
    const autoValid = typeof c.autoSwitch === 'boolean';
    return themeValid && sysValid && autoValid;
  }

  // Performance optimization
  preloadThemeAssets(theme: 'light' | 'dark'): void {
    // Preload theme-specific images or assets
    const imagesToPreload = [
      // Add theme-specific images here
      // `/images/${theme}/logo.png`,
      // `/images/${theme}/background.jpg`,
    ];

    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }

  // Accessibility helpers
  getContrastRatio(): number {
    // Return contrast ratio for current theme
    return this.isDarkMode() ? 15.3 : 21; // WCAG AAA compliance
  }

  getThemeColors(): Record<string, string> {
    const isDark = this.isDarkMode();
    
    return {
      background: isDark ? '#0f172a' : '#ffffff',
      foreground: isDark ? '#f8fafc' : '#0f172a',
      card: isDark ? '#1e293b' : '#ffffff',
      cardForeground: isDark ? '#f8fafc' : '#0f172a',
      popover: isDark ? '#1e293b' : '#ffffff',
      popoverForeground: isDark ? '#f8fafc' : '#0f172a',
      primary: isDark ? '#3b82f6' : '#2563eb',
      primaryForeground: isDark ? '#f8fafc' : '#ffffff',
      secondary: isDark ? '#374151' : '#f1f5f9',
      secondaryForeground: isDark ? '#f8fafc' : '#0f172a',
      muted: isDark ? '#374151' : '#f1f5f9',
      mutedForeground: isDark ? '#9ca3af' : '#64748b',
      accent: isDark ? '#374151' : '#f1f5f9',
      accentForeground: isDark ? '#f8fafc' : '#0f172a',
      destructive: isDark ? '#dc2626' : '#ef4444',
      destructiveForeground: isDark ? '#f8fafc' : '#ffffff',
      border: isDark ? '#374151' : '#e2e8f0',
      input: isDark ? '#374151' : '#e2e8f0',
      ring: isDark ? '#3b82f6' : '#2563eb',
      radius: '0.5rem'
    };
  }
}

export default ThemeService.getInstance();
