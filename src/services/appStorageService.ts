/**
 * Central App Storage Service
 * Manages all localStorage operations for the entire application
 * Provides offline-first functionality like a desktop application
 */

import { db } from './localDatabaseService';

export interface AppState {
  // User Preferences
  user: {
    id: string | null;
    name: string | null;
    email: string | null;
    preferences: {
      theme: 'light' | 'dark' | 'system';
      language: string;
      notifications: boolean;
      autoSave: boolean;
    };
  };
  
  // App Settings
  settings: {
    lastSync: string | null;
    offlineMode: boolean;
    cacheEnabled: boolean;
  };
  
  // Module States
  modules: {
    quotes: boolean;
    projects: boolean;
    appointments: boolean;
    invoices: boolean;
    deliveryNotes: boolean;
    orderConfirmations: boolean;
  };
}

const DEFAULT_APP_STATE: AppState = {
  user: {
    id: null,
    name: null,
    email: null,
    preferences: {
      theme: 'system',
      language: 'de',
      notifications: true,
      autoSave: true,
    },
  },
  settings: {
    lastSync: null,
    offlineMode: false,
    cacheEnabled: true,
  },
  modules: {
    quotes: true,
    projects: true,
    appointments: true,
    invoices: true,
    deliveryNotes: true,
    orderConfirmations: true,
  },
};

class AppStorageService {
  private static instance: AppStorageService;
  private readonly APP_STATE_KEY = 'bauplan_buddy_app_state';
  private readonly APP_VERSION = '1.0.0';
  private state: AppState;

  private constructor() {
    this.state = this.loadState();
    this.initializeStorageListener();
    this.migrateToIndexedDB();
  }

  public static getInstance(): AppStorageService {
    if (!AppStorageService.instance) {
      AppStorageService.instance = new AppStorageService();
    }
    return AppStorageService.instance;
  }

  /**
   * Load state from localStorage
   */
  private loadState(): AppState {
    try {
      const stored = localStorage.getItem(this.APP_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new properties
        return this.mergeWithDefaults(parsed);
      }
    } catch (error) {
      console.error('Failed to load app state:', error);
    }
    return { ...DEFAULT_APP_STATE };
  }

  /**
   * Merge stored state with defaults
   */
  private mergeWithDefaults(stored: Partial<AppState>): AppState {
    return {
      user: { ...DEFAULT_APP_STATE.user, ...stored.user },
      settings: { ...DEFAULT_APP_STATE.settings, ...stored.settings },
      modules: { ...DEFAULT_APP_STATE.modules, ...stored.modules },
    };
  }

  /**
   * Save state to localStorage
   */
  private saveState(): void {
    try {
      const toStore = {
        ...this.state,
        _version: this.APP_VERSION,
        _lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(this.APP_STATE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error('Failed to save app state:', error);
      // Handle quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded();
      }
    }
  }

  /**
   * Listen for storage changes from other tabs
   */
  private initializeStorageListener(): void {
    window.addEventListener('storage', (event) => {
      if (event.key === this.APP_STATE_KEY && event.newValue) {
        try {
          const newState = JSON.parse(event.newValue);
          this.state = this.mergeWithDefaults(newState);
          // Notify subscribers about state change
          window.dispatchEvent(new CustomEvent('appStateChanged', { detail: this.state }));
        } catch (error) {
          console.error('Failed to handle storage change:', error);
        }
      }
    });
  }

  /**
   * Migrate large datasets from localStorage to IndexedDB
   */
  private async migrateToIndexedDB(): Promise<void> {
    const modulesToMigrate = [
      { key: 'projects', table: db.projects },
      { key: 'quotes', table: db.quotes },
      { key: 'invoices', table: db.invoices },
    ];

    for (const { key, table } of modulesToMigrate) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const data = JSON.parse(stored);
          if (Array.isArray(data) && data.length > 0) {
            console.log(`📦 Migrating ${data.length} items from ${key} to IndexedDB...`);
            await table.bulkPut(data);
            // We keep it in localStorage for now as a backup or until full transition
            // localStorage.removeItem(key); 
          }
        }
      } catch (error) {
        console.error(`❌ Migration failed for ${key}:`, error);
      }
    }
  }

  /**
   * Handle localStorage quota exceeded
   */
  private handleQuotaExceeded(): void {
    console.warn('localStorage quota exceeded - cleaning up old data');
    // Remove old/unused data
    this.cleanupOldData();
    // Try saving again
    try {
      localStorage.setItem(this.APP_STATE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('Still failed after cleanup:', error);
    }
  }

  /**
   * Clean up old data to free space
   */
  private cleanupOldData(): void {
    const keysToCheck = Object.keys(localStorage);
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    keysToCheck.forEach(key => {
      if (key.startsWith('bauplan_draft_') || key.startsWith('bauplan_cache_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            const timestamp = new Date(parsed._timestamp || 0).getTime();
            if (timestamp < thirtyDaysAgo) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Invalid JSON or missing timestamp - remove it
          localStorage.removeItem(key);
        }
      }
    });
  }

  /**
   * Get current app state
   */
  public getState(): AppState {
    return { ...this.state };
  }

  /**
   * Update user preferences
   */
  public updateUserPreferences(preferences: Partial<AppState['user']['preferences']>): void {
    this.state.user.preferences = {
      ...this.state.user.preferences,
      ...preferences,
    };
    this.saveState();
  }

  /**
   * Update user info
   */
  public updateUser(user: Partial<AppState['user']>): void {
    this.state.user = {
      ...this.state.user,
      ...user,
    };
    this.saveState();
  }

  /**
   * Update settings
   */
  public updateSettings(settings: Partial<AppState['settings']>): void {
    this.state.settings = {
      ...this.state.settings,
      ...settings,
    };
    this.saveState();
  }

  /**
   * Toggle module enabled/disabled
   */
  public toggleModule(module: keyof AppState['modules'], enabled: boolean): void {
    this.state.modules[module] = enabled;
    this.saveState();
  }

  /**
   * Check if app is running in offline mode
   */
  public isOffline(): boolean {
    return !navigator.onLine || this.state.settings.offlineMode;
  }

  /**
   * Enable/disable offline mode
   */
  public setOfflineMode(offline: boolean): void {
    this.state.settings.offlineMode = offline;
    this.saveState();
  }

  /**
   * Record last sync time
   */
  public recordSync(): void {
    this.state.settings.lastSync = new Date().toISOString();
    this.saveState();
  }

  /**
   * Clear all app data (logout/reset)
   */
  public clearAllData(): void {
    this.state = { ...DEFAULT_APP_STATE };
    this.saveState();
    
    // Clear all bauplan-related localStorage
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('bauplan_')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Export all app data as JSON (Includes IndexedDB)
   */
  public async exportData(): Promise<string> {
    const exportData = {
      appState: this.state,
      localStorage: {
        quotes: localStorage.getItem('quotes'),
        projects: localStorage.getItem('projects'),
        appointments: localStorage.getItem('appointments'),
        invoices: localStorage.getItem('outgoingInvoices'),
        incomingInvoices: localStorage.getItem('incomingInvoices'),
        deliveryNotes: localStorage.getItem('deliveryNotes'),
        orderConfirmations: localStorage.getItem('orderConfirmations'),
      },
      indexedDB: {
        projects: await db.projects.toArray(),
        quotes: await db.quotes.toArray(),
        invoices: await db.invoices.toArray(),
        drafts: await db.drafts.toArray(),
      },
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import app data from JSON
   */
  public async importData(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      
      // Restore app state
      if (data.appState) {
        this.state = this.mergeWithDefaults(data.appState);
        this.saveState();
      }
      
      // Restore localStorage data
      if (data.localStorage) {
        Object.entries(data.localStorage).forEach(([key, value]) => {
          if (value) localStorage.setItem(key, value as string);
        });
      }
      
      // Restore IndexedDB data
      if (data.indexedDB) {
        if (data.indexedDB.projects) await db.projects.bulkPut(data.indexedDB.projects);
        if (data.indexedDB.quotes) await db.quotes.bulkPut(data.indexedDB.quotes);
        if (data.indexedDB.invoices) await db.invoices.bulkPut(data.indexedDB.invoices);
        if (data.indexedDB.drafts) await db.drafts.bulkPut(data.indexedDB.drafts);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  public getStorageStats(): {
    used: number;
    available: number;
    percentage: number;
    items: { key: string; size: number }[];
  } {
    let totalSize = 0;
    const items: { key: string; size: number }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        const size = new Blob([value]).size;
        totalSize += size;
        items.push({ key, size });
      }
    }

    // localStorage typically has 5-10MB limit
    const available = 10 * 1024 * 1024; // 10MB
    const percentage = (totalSize / available) * 100;

    return {
      used: totalSize,
      available,
      percentage,
      items: items.sort((a, b) => b.size - a.size),
    };
  }
}

export default AppStorageService;
export const appStorage = AppStorageService.getInstance();
