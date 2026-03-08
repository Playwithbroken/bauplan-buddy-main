/**
 * Offline Sync Service (Consolidated)
 * Manages offline data synchronization, conflict resolution, and background sync.
 * Centrally handles all sync operations for Projects, Appointments, and other modules.
 */

import { db, SyncItem, SyncConflict, AuditLog } from './localDatabaseService';
import DeploymentConfigService from './deploymentConfigService';
import { ErrorHandlingService } from './errorHandlingService';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  queueLength: number;
  lastSync: string | null;
  pendingConflicts: number;
  pendingActions: any[];
}

export type OfflineState = SyncStatus;

export type ConflictResolutionStrategy = 'server-wins' | 'client-wins' | 'merge' | 'manual';

class OfflineSyncService {
  private static instance: OfflineSyncService;
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly LAST_SYNC_KEY = 'bauplan_last_sync';
  private listeners: Set<(state: SyncStatus) => void> = new Set();

  private constructor() {
    this.initializeNetworkListeners();
    this.migrateFromLocalStorage();
    this.startAutoSync();
  }

  public static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  /**
   * Initialize network online/offline listeners
   */
  private initializeNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('📶 Connection restored - triggering sync');
      this.syncNow();
    });

    window.addEventListener('offline', () => {
      console.log('📵 Connection lost - offline mode active');
    });
  }

  /**
   * Migrate legacy data from localStorage to Dexie
   */
  private async migrateFromLocalStorage(): Promise<void> {
    try {
      // Migrate legacy conflicts
      const legacyConflicts = localStorage.getItem('bauplan_sync_conflicts');
      if (legacyConflicts) {
        const conflicts = JSON.parse(legacyConflicts);
        for (const conflict of conflicts) {
          await db.conflicts.put(conflict);
        }
        localStorage.removeItem('bauplan_sync_conflicts');
      }

      // Migrate legacy sync queue if any (some services used 'bauplan-buddy-offline-actions')
      const legacyActions = localStorage.getItem('bauplan-buddy-offline-actions');
      if (legacyActions) {
        const actions = JSON.parse(legacyActions).pendingActions || [];
        for (const action of actions) {
          await db.syncQueue.add({
            moduleId: action.entityId || action.id,
            module: action.entity + 's', // Normalize naming
            action: action.type,
            data: action.data,
            timestamp: new Date(action.timestamp).getTime()
          });
        }
        localStorage.removeItem('bauplan-buddy-offline-actions');
      }
      
      console.log('📦 Data migration to IndexedDB completed');
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  /**
   * Add an action to the sync queue
   */
  public async queueAction(
    module: string,
    action: 'create' | 'update' | 'delete',
    data: any,
    moduleId?: string
  ): Promise<void> {
    const id = moduleId || data.id || this.generateId();
    
    const syncItem: SyncItem = {
      moduleId: id,
      module,
      action,
      data,
      timestamp: Date.now()
    };

    await db.syncQueue.add(syncItem);
    
    // Log for audit
    await this.logAudit(action, module, id, data);

    if (navigator.onLine) {
      this.syncNow();
    }
  }

  /**
   * Manual trigger for synchronization
   */
  public async syncNow(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;

    const config = DeploymentConfigService.getInstance();
    if (config.getCurrentMode() === 'local') return;

    this.isSyncing = true;
    window.dispatchEvent(new CustomEvent('syncStarted'));

    try {
      await this.processQueue();
      await this.pullChanges();
      
      localStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString());
      window.dispatchEvent(new CustomEvent('syncCompleted'));
    } catch (error) {
      console.error('Sync failed:', error);
      window.dispatchEvent(new CustomEvent('syncFailed', { detail: error }));
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process all pending items in the sync queue
   */
  private async processQueue(): Promise<void> {
    const items = await db.syncQueue.toArray();
    const config = DeploymentConfigService.getInstance();
    const apiUrl = config.getApiUrl();

    for (const item of items) {
      try {
        await this.syncItem(item, apiUrl);
        if (item.id) await db.syncQueue.delete(item.id);
      } catch (error) {
        console.error(`Failed to sync item ${item.moduleId}:`, error);
        // We stop processing the queue if a fatal error occurs, 
        // but for now we continue to next item if it's item-specific
      }
    }
  }

  /**
   * Push a single item to the server
   */
  private async syncItem(item: SyncItem, apiUrl: string): Promise<void> {
    if (!apiUrl) return;

    const url = `${apiUrl}/${item.module}/${item.action === 'create' ? '' : item.moduleId}`;
    const method = item.action === 'create' ? 'POST' : item.action === 'update' ? 'PUT' : 'DELETE';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'DELETE' ? undefined : JSON.stringify(item.data)
    });

    if (response.status === 409) {
      // Conflict!
      const serverVersion = await response.json();
      await this.handleConflict(item, serverVersion);
      return;
    }

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
  }

  /**
   * Pull latest changes from the server for all modules
   */
  private async pullChanges(): Promise<void> {
    const config = DeploymentConfigService.getInstance();
    const apiUrl = config.getApiUrl();
    if (!apiUrl) return;

    const lastSync = localStorage.getItem(this.LAST_SYNC_KEY);
    const modules = ['projects', 'appointments', 'invoices', 'quotes'];

    for (const module of modules) {
      try {
        const url = `${apiUrl}/${module}${lastSync ? `?since=${lastSync}` : ''}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          await this.mergeChanges(module, data);
        }
      } catch (error) {
        console.warn(`Failed to pull changes for ${module}:`, error);
      }
    }
  }

  /**
   * Merge server changes into local database
   */
  private async mergeChanges(module: string, serverData: any[]): Promise<void> {
    const config = DeploymentConfigService.getInstance();
    const strategy = config.getConfig().hybrid.conflictResolution as ConflictResolutionStrategy;

    for (const serverItem of serverData) {
      const localItem = await (db as any)[module].get(serverItem.id);

      if (!localItem) {
        await (db as any)[module].put(serverItem);
      } else {
        await this.resolveAutoConflict(module, localItem, serverItem, strategy);
      }
    }
  }

  /**
   * Automatically resolve conflicts based on strategy
   */
  private async resolveAutoConflict(module: string, local: any, server: any, strategy: ConflictResolutionStrategy): Promise<void> {
    if (JSON.stringify(local) === JSON.stringify(server)) return;

    switch (strategy) {
      case 'server-wins':
        await (db as any)[module].put(server);
        break;
      case 'client-wins':
        // Do nothing, local stays
        break;
      case 'merge':
        const merged = { ...server, ...local };
        await (db as any)[module].put(merged);
        break;
      case 'manual':
        const conflict: SyncConflict = {
          id: local.id,
          module,
          localVersion: local,
          serverVersion: server,
          timestamp: Date.now(),
          resolved: false
        };
        await db.conflicts.put(conflict);
        window.dispatchEvent(new CustomEvent('syncConflict', { detail: conflict }));
        break;
    }
  }

  /**
   * Handle server-side conflict (409)
   */
  private async handleConflict(item: SyncItem, serverVersion: any): Promise<void> {
    const conflict: SyncConflict = {
      id: item.moduleId,
      module: item.module,
      localVersion: item.data,
      serverVersion: serverVersion,
      timestamp: Date.now(),
      resolved: false
    };
    await db.conflicts.put(conflict);
    window.dispatchEvent(new CustomEvent('syncConflict', { detail: conflict }));
  }

  /**
   * Public conflict resolution
   */
  public async resolveConflictManual(conflictId: string, resolution: any): Promise<void> {
    const conflict = await db.conflicts.get(conflictId);
    if (!conflict) return;

    await (db as any)[conflict.module].put(resolution);
    await db.conflicts.update(conflictId, { resolved: true });
    
    // Add an update to the queue to tell the server our final decision
    await this.queueAction(conflict.module, 'update', resolution, conflict.id);
  }

  /**
   * Start periodic background sync
   */
  private startAutoSync(): void {
    if (this.syncInterval) clearInterval(this.syncInterval);
    
    const config = DeploymentConfigService.getInstance();
    const interval = config.getSyncInterval();

    if (interval > 0) {
      this.syncInterval = setInterval(() => this.syncNow(), interval);
    }
  }

  private async logAudit(action: string, module: string, moduleId: string, details: any): Promise<void> {
    const audit: AuditLog = {
      action,
      module,
      moduleId,
      userId: 'system', // Should be replaced with actual user ID
      timestamp: new Date().toISOString(),
      details
    };
    await db.auditLog.add(audit);
  }

  public async getStatus(): Promise<SyncStatus> {
    const queue = await db.syncQueue.toArray();
    return {
      isOnline: navigator.onLine,
      isSyncing: this.isSyncing,
      queueLength: queue.length,
      lastSync: localStorage.getItem(this.LAST_SYNC_KEY),
      pendingConflicts: await db.conflicts.where('resolved').equals(0).count(),
      pendingActions: queue
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  public isOnline(): boolean {
    return navigator.onLine;
  }

  public cacheData(key: string, data: any): void {
    localStorage.setItem(`bauplan_cache_${key}`, JSON.stringify(data));
  }

  public getOfflineState(): SyncStatus {
    return {
      isOnline: this.isOnline(),
      isSyncing: this.isSyncing,
      queueLength: 0,
      lastSync: localStorage.getItem(this.LAST_SYNC_KEY),
      pendingConflicts: 0,
      pendingActions: []
    };
  }

  public addStateListener(listener: (state: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public onUpdateAvailable(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener('swUpdate', handler);
    return () => window.removeEventListener('swUpdate', handler);
  }

  public applyUpdate(): void {
    window.location.reload();
  }

  public clearOfflineData(): void {
    db.syncQueue.clear();
    db.conflicts.clear();
  }
}

export const offlineSync = OfflineSyncService.getInstance();
export default OfflineSyncService;
