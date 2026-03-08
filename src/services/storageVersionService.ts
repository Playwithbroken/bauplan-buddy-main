/**
 * Storage Version Service
 * Handles localStorage version migrations and cleanup of old data structures
 * Ensures smooth updates when data schemas change
 */

interface StorageVersion {
  version: string;
  migratedAt: string;
  previousVersion?: string;
}

interface MigrationRule {
  fromVersion: string;
  toVersion: string;
  description: string;
  migrate: () => void;
}

class StorageVersionService {
  private static instance: StorageVersionService;
  private readonly VERSION_KEY = 'bauplan_storage_version';
  private readonly CURRENT_VERSION = '1.2.0'; // Increment when schema changes
  
  private migrationRules: MigrationRule[] = [
    {
      fromVersion: '1.0.0',
      toVersion: '1.1.0',
      description: 'Migrate old quote format to new structure with customer details',
      migrate: () => {
        try {
          const quotes = localStorage.getItem('quotes');
          if (quotes) {
            const parsed = JSON.parse(quotes);
            // Example: Add new fields if missing
            const migrated = Array.isArray(parsed) ? parsed.map(q => ({
              ...q,
              customerDetails: q.customerDetails || {
                name: q.customer || '',
                email: q.email || '',
                phone: q.phone || '',
              },
            })) : parsed;
            localStorage.setItem('quotes', JSON.stringify(migrated));
          }
        } catch (error) {
          console.error('Failed to migrate quotes from 1.0.0 to 1.1.0:', error);
        }
      },
    },
    {
      fromVersion: '1.1.0',
      toVersion: '1.2.0',
      description: 'Add procurement templates and cleanup old draft keys',
      migrate: () => {
        try {
          // Cleanup old draft keys with outdated format
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('draft_') && !key.startsWith('bauplan_draft_')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          console.log(`Cleaned up ${keysToRemove.length} old draft keys`);
        } catch (error) {
          console.error('Failed to migrate from 1.1.0 to 1.2.0:', error);
        }
      },
    },
  ];

  private constructor() {
    this.checkAndMigrate();
  }

  public static getInstance(): StorageVersionService {
    if (!StorageVersionService.instance) {
      StorageVersionService.instance = new StorageVersionService();
    }
    return StorageVersionService.instance;
  }

  /**
   * Get current storage version
   */
  private getCurrentStorageVersion(): StorageVersion | null {
    try {
      const stored = localStorage.getItem(this.VERSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to read storage version:', error);
      return null;
    }
  }

  /**
   * Save storage version
   */
  private saveStorageVersion(version: StorageVersion): void {
    try {
      localStorage.setItem(this.VERSION_KEY, JSON.stringify(version));
    } catch (error) {
      console.error('Failed to save storage version:', error);
    }
  }

  /**
   * Compare version strings
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;
      
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    
    return 0;
  }

  /**
   * Check if migration is needed and perform it
   */
  private checkAndMigrate(): void {
    const currentStorage = this.getCurrentStorageVersion();
    
    if (!currentStorage) {
      // First time setup
      this.saveStorageVersion({
        version: this.CURRENT_VERSION,
        migratedAt: new Date().toISOString(),
      });
      console.log('Storage version initialized:', this.CURRENT_VERSION);
      return;
    }

    // Check if migration is needed
    if (this.compareVersions(currentStorage.version, this.CURRENT_VERSION) < 0) {
      console.log(`Migrating storage from ${currentStorage.version} to ${this.CURRENT_VERSION}`);
      this.performMigration(currentStorage.version, this.CURRENT_VERSION);
    }
  }

  /**
   * Perform migration from one version to another
   */
  private performMigration(fromVersion: string, toVersion: string): void {
    let currentVersion = fromVersion;
    
    // Apply migrations in sequence
    while (this.compareVersions(currentVersion, toVersion) < 0) {
      const nextMigration = this.migrationRules.find(
        rule => rule.fromVersion === currentVersion
      );
      
      if (!nextMigration) {
        console.warn(`No migration path from ${currentVersion} to ${toVersion}`);
        break;
      }
      
      try {
        console.log(`Applying migration: ${nextMigration.description}`);
        nextMigration.migrate();
        currentVersion = nextMigration.toVersion;
        
        // Save intermediate version
        this.saveStorageVersion({
          version: currentVersion,
          migratedAt: new Date().toISOString(),
          previousVersion: nextMigration.fromVersion,
        });
        
        console.log(`Successfully migrated to ${currentVersion}`);
      } catch (error) {
        console.error(`Migration failed from ${nextMigration.fromVersion} to ${nextMigration.toVersion}:`, error);
        break;
      }
    }
  }

  /**
   * Cleanup old localStorage data
   * Removes deprecated keys and old drafts
   */
  public cleanupOldData(): void {
    const keysToRemove: string[] = [];
    const now = Date.now();
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Remove deprecated keys
      const deprecatedPrefixes = [
        'legacy_',
        'old_',
        'deprecated_',
        'temp_',
      ];

      if (deprecatedPrefixes.some(prefix => key.startsWith(prefix))) {
        keysToRemove.push(key);
        continue;
      }

      // Remove very old drafts (>90 days)
      if (key.startsWith('bauplan_draft_')) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            const timestamp = new Date(parsed._timestamp || 0).getTime();
            if (timestamp < ninetyDaysAgo) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // Invalid JSON - remove it
          keysToRemove.push(key);
        }
      }

      // Remove old cache entries (>90 days)
      if (key.startsWith('bauplan_cache_')) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            const timestamp = new Date(parsed._cachedAt || 0).getTime();
            if (timestamp < ninetyDaysAgo) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // Invalid JSON - remove it
          keysToRemove.push(key);
        }
      }
    }

    // Remove identified keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove key ${key}:`, error);
      }
    });

    if (keysToRemove.length > 0) {
      console.log(`Cleaned up ${keysToRemove.length} old localStorage entries`);
    }
  }

  /**
   * Get storage statistics
   */
  public getStorageInfo(): {
    version: string;
    totalKeys: number;
    totalSize: number;
    oldDrafts: number;
    oldCache: number;
  } {
    let totalSize = 0;
    let oldDrafts = 0;
    let oldCache = 0;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        totalSize += new Blob([value]).size;

        if (key.startsWith('bauplan_draft_')) {
          try {
            const parsed = JSON.parse(value);
            const timestamp = new Date(parsed._timestamp || 0).getTime();
            if (timestamp < thirtyDaysAgo) oldDrafts++;
          } catch {
            oldDrafts++;
          }
        }

        if (key.startsWith('bauplan_cache_')) {
          try {
            const parsed = JSON.parse(value);
            const timestamp = new Date(parsed._cachedAt || 0).getTime();
            if (timestamp < thirtyDaysAgo) oldCache++;
          } catch {
            oldCache++;
          }
        }
      }
    }

    return {
      version: this.CURRENT_VERSION,
      totalKeys: localStorage.length,
      totalSize,
      oldDrafts,
      oldCache,
    };
  }

  /**
   * Force cleanup of all old data
   */
  public forceCleanup(): number {
    const initialSize = localStorage.length;
    this.cleanupOldData();
    return initialSize - localStorage.length;
  }

  /**
   * Get current version
   */
  public getCurrentVersion(): string {
    return this.CURRENT_VERSION;
  }

  /**
   * Check if storage needs migration
   */
  public needsMigration(): boolean {
    const currentStorage = this.getCurrentStorageVersion();
    if (!currentStorage) return false;
    return this.compareVersions(currentStorage.version, this.CURRENT_VERSION) < 0;
  }
}

export default StorageVersionService;
export const storageVersion = StorageVersionService.getInstance();
