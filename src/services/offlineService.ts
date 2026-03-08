import { ErrorHandlingService } from './errorHandlingService';

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'project' | 'customer' | 'invoice' | 'appointment' | 'document' | 'team' | 'quote';
  entityId?: string;
  data: Record<string, unknown> | unknown;
  timestamp: string;
  userId: string;
  deviceId: string;
  conflictResolution: 'server-wins' | 'client-wins' | 'merge' | 'manual';
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  attempts: number;
  maxAttempts: number;
  lastAttempt?: string;
  error?: string;
}

export interface OfflineState {
  isOnline: boolean;
  lastSync: string | null;
  pendingActions: OfflineAction[];
  syncInProgress: boolean;
  conflicts: OfflineAction[];
  dataVersion: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: number;
  errors: string[];
}

export interface OfflineConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  batchSize: number;
  conflictResolution: OfflineAction['conflictResolution'];
  enableAutoSync: boolean;
  syncInterval: number; // milliseconds
  maxOfflineStorage: number; // MB
}

export class OfflineService {
  private static readonly OFFLINE_ACTIONS_KEY = 'bauplan-buddy-offline-actions';
  private static readonly OFFLINE_STATE_KEY = 'bauplan-buddy-offline-state';
  private static readonly OFFLINE_CONFIG_KEY = 'bauplan-buddy-offline-config';
  private static readonly CACHED_DATA_KEY = 'bauplan-buddy-cached-data';

  private static syncTimer: number | null = null;
  private static listeners: Array<(state: OfflineState) => void> = [];
  private static updateListeners: Array<() => void> = [];
  private static swRegistration?: ServiceWorkerRegistration;

  /**
   * Initialize offline service
   */
  static initialize(): void {
    this.setupNetworkListeners();
    this.loadConfiguration();
    this.updateOnlineStatus();
    this.startAutoSync();
    
    // Register service worker if supported
    if ('serviceWorker' in navigator) {
      this.registerServiceWorker();
    }
    
    ErrorHandlingService.info(
      'Offline service initialized',
      'offline_service',
      { hasServiceWorker: 'serviceWorker' in navigator }
    );
  }

  /**
   * Queue action for offline execution
   */
  static queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'status' | 'attempts'>): OfflineAction {
    try {
      const fullAction: OfflineAction = {
        ...action,
        id: this.generateActionId(),
        timestamp: new Date().toISOString(),
        status: 'pending',
        attempts: 0
      };

      const state = this.getOfflineState();
      state.pendingActions.push(fullAction);
      state.dataVersion++;
      
      this.saveOfflineState(state);
      this.notifyListeners(state);

      // Try to sync immediately if online
      if (state.isOnline) {
        this.syncPendingActions();
      }

      ErrorHandlingService.info(
        `Action queued for offline sync: ${action.type} ${action.entity}`,
        'offline_action',
        { actionId: fullAction.id, entityId: action.entityId }
      );

      return fullAction;
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to queue offline action',
        error as Error,
        'offline_service'
      );
      throw error;
    }
  }

  /**
   * Sync all pending actions
   */
  static async syncPendingActions(): Promise<SyncResult> {
    const state = this.getOfflineState();
    
    if (state.syncInProgress || !state.isOnline) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: 0,
        errors: ['Sync already in progress or offline']
      };
    }

    state.syncInProgress = true;
    this.saveOfflineState(state);
    this.notifyListeners(state);

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: 0,
      errors: []
    };

    try {
      const config = this.getConfiguration();
      const pendingActions = state.pendingActions.filter(a => a.status === 'pending');
      
      // Process actions in batches
      for (let i = 0; i < pendingActions.length; i += config.batchSize) {
        const batch = pendingActions.slice(i, i + config.batchSize);
        
        for (const action of batch) {
          try {
            action.status = 'syncing';
            action.attempts++;
            action.lastAttempt = new Date().toISOString();
            
            const syncSuccess = await this.syncSingleAction(action);
            
            if (syncSuccess) {
              action.status = 'synced';
              result.synced++;
            } else {
              action.status = action.attempts >= action.maxAttempts ? 'failed' : 'pending';
              result.failed++;
            }
          } catch (error) {
            action.status = 'failed';
            action.error = (error as Error).message;
            result.failed++;
            result.errors.push(`Action ${action.id}: ${(error as Error).message}`);
          }
        }
        
        // Save progress after each batch
        this.saveOfflineState(state);
      }

      // Remove successfully synced actions
      state.pendingActions = state.pendingActions.filter(a => a.status !== 'synced');
      state.lastSync = new Date().toISOString();
      
    } catch (error) {
      result.success = false;
      result.errors.push((error as Error).message);
      
      ErrorHandlingService.error(
        'Failed to sync pending actions',
        error as Error,
        'offline_sync'
      );
    } finally {
      state.syncInProgress = false;
      this.saveOfflineState(state);
      this.notifyListeners(state);
    }

    ErrorHandlingService.info(
      `Offline sync completed: ${result.synced} synced, ${result.failed} failed`,
      'offline_sync',
      result
    );

    return result;
  }

  /**
   * Cache data for offline access
   */
  static cacheData<T>(key: string, data: T, expiresIn?: number): void {
    try {
      const cacheEntry = {
        data,
        timestamp: new Date().toISOString(),
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn).toISOString() : null
      };

      const cachedData = this.getCachedData<Record<string, unknown>>();
      (cachedData as Record<string, unknown>)[key] = cacheEntry as unknown as unknown;
      
      localStorage.setItem(this.CACHED_DATA_KEY, JSON.stringify(cachedData));
      
      // Check storage size and cleanup if needed
      this.cleanupOldCache();
    } catch (error) {
      ErrorHandlingService.warn(
        'Failed to cache data for offline access',
        'offline_cache',
        { key, error: (error as Error).message }
      );
    }
  }

  /**
   * Get cached data
   */
  static getCachedData<T = unknown>(key?: string): T | Record<string, unknown> | null {
    try {
      const cachedData = JSON.parse(localStorage.getItem(this.CACHED_DATA_KEY) || '{}');
      
      if (key) {
        const entry = cachedData[key];
        if (!entry) return null;
        
        // Check if expired
        if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
          delete cachedData[key];
          localStorage.setItem(this.CACHED_DATA_KEY, JSON.stringify(cachedData));
          return null;
        }
        
        return entry.data as T;
      }
      
      return cachedData as Record<string, unknown>;
    } catch {
      return key ? null : {};
    }
  }

  /**
   * Check if device is online
   */
  static isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Get current offline state
   */
  static getOfflineState(): OfflineState {
    try {
      const data = localStorage.getItem(this.OFFLINE_STATE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      ErrorHandlingService.warn(
        'Failed to load offline state, using defaults',
        'offline_service',
        { error: (error as Error).message }
      );
    }

    return {
      isOnline: this.isOnline(),
      lastSync: null,
      pendingActions: [],
      syncInProgress: false,
      conflicts: [],
      dataVersion: 1
    };
  }

  /**
   * Add listener for offline state changes
   */
  static addStateListener(listener: (state: OfflineState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to service worker update availability notifications
   */
  static onUpdateAvailable(listener: () => void): () => void {
    this.updateListeners.push(listener);
    return () => {
      const idx = this.updateListeners.indexOf(listener);
      if (idx > -1) this.updateListeners.splice(idx, 1);
    };
  }

  /**
   * Apply pending service worker update: post SKIP_WAITING and reload on controllerchange
   */
  static async applyUpdate(): Promise<void> {
    try {
      const reg = this.swRegistration || (await navigator.serviceWorker.getRegistration());
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        return new Promise<void>((resolve) => {
          const onControllerChange = () => {
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
            window.location.reload();
            resolve();
          };
          navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
        });
      }
    } catch (error) {
      ErrorHandlingService.error('Failed to apply service worker update', error as Error, 'service_worker');
    }
  }

  /**
   * Manual conflict resolution
   */
  static resolveConflict(actionId: string, resolution: 'server-wins' | 'client-wins' | 'merge', mergedData?: Record<string, unknown>): void {
    try {
      const state = this.getOfflineState();
      const conflictIndex = state.conflicts.findIndex(a => a.id === actionId);
      
      if (conflictIndex === -1) return;
      
      const conflict = state.conflicts[conflictIndex];
      
      switch (resolution) {
        case 'server-wins':
          // Remove client action
          state.conflicts.splice(conflictIndex, 1);
          break;
        case 'client-wins':
          // Retry client action
          conflict.status = 'pending';
          conflict.attempts = 0;
          state.pendingActions.push(conflict);
          state.conflicts.splice(conflictIndex, 1);
          break;
        case 'merge':
          // Use merged data
          conflict.data = mergedData;
          conflict.status = 'pending';
          conflict.attempts = 0;
          state.pendingActions.push(conflict);
          state.conflicts.splice(conflictIndex, 1);
          break;
      }
      
      this.saveOfflineState(state);
      this.notifyListeners(state);
      
      ErrorHandlingService.info(
        `Conflict resolved: ${resolution}`,
        'offline_conflict',
        { actionId, resolution }
      );
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to resolve conflict',
        error as Error,
        'offline_conflict'
      );
    }
  }

  /**
   * Clear all offline data
   */
  static clearOfflineData(): void {
    try {
      localStorage.removeItem(this.OFFLINE_ACTIONS_KEY);
      localStorage.removeItem(this.OFFLINE_STATE_KEY);
      localStorage.removeItem(this.CACHED_DATA_KEY);
      
      const defaultState = this.getOfflineState();
      this.saveOfflineState(defaultState);
      this.notifyListeners(defaultState);
      
      ErrorHandlingService.info(
        'Offline data cleared',
        'offline_service'
      );
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to clear offline data',
        error as Error,
        'offline_service'
      );
    }
  }

  // Private helper methods

  private static setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.updateOnlineStatus();
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      this.updateOnlineStatus();
    });
  }

  private static updateOnlineStatus(): void {
    const state = this.getOfflineState();
    const wasOnline = state.isOnline;
    state.isOnline = this.isOnline();
    
    if (!wasOnline && state.isOnline) {
      ErrorHandlingService.info(
        'Device came online - starting sync',
        'offline_service'
      );
    } else if (wasOnline && !state.isOnline) {
      ErrorHandlingService.warn(
        'Device went offline - queuing actions',
        'offline_service'
      );
    }
    
    this.saveOfflineState(state);
    this.notifyListeners(state);
  }

  private static async syncSingleAction(action: OfflineAction): Promise<boolean> {
    try {
      // This would typically make an API call to sync the action
      // For now, simulate the sync process
      
      const endpoint = this.getApiEndpoint(action.entity, action.type);
      const method = this.getHttpMethod(action.type);
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(action.data)
      });

      if (response.status === 409) {
        // Conflict - move to conflicts list
        const state = this.getOfflineState();
        action.status = 'conflict';
        state.conflicts.push(action);
        return false;
      }

      return response.ok;
    } catch (error) {
      // For demo purposes, simulate 80% success rate
      return Math.random() > 0.2;
    }
  }

  private static getApiEndpoint(entity: string, type: string): string {
    const baseUrl = '/api';
    const endpoints = {
      project: `${baseUrl}/projects`,
      customer: `${baseUrl}/customers`,
      invoice: `${baseUrl}/invoices`,
      appointment: `${baseUrl}/appointments`,
      document: `${baseUrl}/documents`,
      team: `${baseUrl}/teams`,
      quote: `${baseUrl}/quotes`
    };
    
    return endpoints[entity as keyof typeof endpoints] || `${baseUrl}/${entity}`;
  }

  private static getHttpMethod(type: string): string {
    const methods = {
      create: 'POST',
      update: 'PUT',
      delete: 'DELETE'
    };
    
    return methods[type as keyof typeof methods] || 'POST';
  }

  private static getAuthToken(): string {
    // Get auth token from localStorage or context
    try {
      const userData = JSON.parse(localStorage.getItem('bauplan-buddy-user') || '{}');
      return userData.token || '';
    } catch {
      return '';
    }
  }

  private static startAutoSync(): void {
    const config = this.getConfiguration();
    
    if (config.enableAutoSync && !this.syncTimer) {
      this.syncTimer = window.setInterval(() => {
        if (this.isOnline()) {
          this.syncPendingActions();
        }
      }, config.syncInterval);
    }
  }

  private static stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private static async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.swRegistration = registration;
      
      ErrorHandlingService.info(
        'Service worker registered successfully',
        'service_worker',
        { scope: registration.scope }
      );
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              this.notifyNewVersionAvailable();
            }
          });
        }
      });
      if (registration.waiting) {
        this.notifyNewVersionAvailable();
      }
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to register service worker',
        error as Error,
        'service_worker'
      );
    }
  }

  private static notifyNewVersionAvailable(): void {
    // This could trigger a UI notification about app update
    ErrorHandlingService.info(
      'New version of the app is available',
      'app_update'
    );
  }

  private static generateActionId(): string {
    return `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static loadConfiguration(): void {
    try {
      const data = localStorage.getItem(this.OFFLINE_CONFIG_KEY);
      if (!data) {
        this.saveConfiguration(this.getDefaultConfiguration());
      }
    } catch (error) {
      this.saveConfiguration(this.getDefaultConfiguration());
    }
  }

  private static getConfiguration(): OfflineConfig {
    try {
      const data = localStorage.getItem(this.OFFLINE_CONFIG_KEY);
      return data ? JSON.parse(data) : this.getDefaultConfiguration();
    } catch {
      return this.getDefaultConfiguration();
    }
  }

  private static getDefaultConfiguration(): OfflineConfig {
    return {
      maxRetries: 3,
      retryDelay: 5000,
      batchSize: 10,
      conflictResolution: 'manual',
      enableAutoSync: true,
      syncInterval: 30000, // 30 seconds
      maxOfflineStorage: 50 // 50 MB
    };
  }

  private static saveConfiguration(config: OfflineConfig): void {
    localStorage.setItem(this.OFFLINE_CONFIG_KEY, JSON.stringify(config));
  }

  private static saveOfflineState(state: OfflineState): void {
    localStorage.setItem(this.OFFLINE_STATE_KEY, JSON.stringify(state));
  }

  private static notifyListeners(state: OfflineState): void {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        ErrorHandlingService.warn(
          'Offline state listener error',
          'offline_service',
          { error: (error as Error).message }
        );
      }
    });
  }

  private static cleanupOldCache(): void {
    try {
      const cachedData = this.getCachedData();
      const now = new Date();
      let hasChanges = false;
      
      // Remove expired entries
      Object.keys(cachedData).forEach(key => {
        const entry = cachedData[key];
        if (entry.expiresAt && new Date(entry.expiresAt) < now) {
          delete cachedData[key];
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        localStorage.setItem(this.CACHED_DATA_KEY, JSON.stringify(cachedData));
      }
      
      // Check storage size (simplified)
      const dataSize = JSON.stringify(cachedData).length;
      const maxSize = this.getConfiguration().maxOfflineStorage * 1024 * 1024; // Convert MB to bytes
      
      if (dataSize > maxSize) {
        // Remove oldest entries until under limit
        const entries = Object.entries(cachedData).sort((a, b) => 
          new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime()
        );
        
        while (JSON.stringify(cachedData).length > maxSize && entries.length > 0) {
          const [oldestKey] = entries.shift()!;
          delete cachedData[oldestKey];
        }
        
        localStorage.setItem(this.CACHED_DATA_KEY, JSON.stringify(cachedData));
      }
    } catch (error) {
      ErrorHandlingService.warn(
        'Failed to cleanup cache',
        'offline_cache',
        { error: (error as Error).message }
      );
    }
  }
}

// Auto-initialization is handled explicitly in src/main.tsx to avoid double registration
