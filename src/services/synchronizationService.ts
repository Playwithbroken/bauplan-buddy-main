import { StoredAppointment } from './appointmentService';
import { AppointmentAPI, AppointmentFilters } from './appointmentAPI';
import { ConflictDetectionService, ConflictAnalysis } from './conflictDetectionService';
import { EmailRecipient } from '../types/email';

// Server data interfaces (for incoming data that might be partial)
interface PartialServerAppointment {
  id: string;
  title: string;
  description?: string;
  type?: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  projectId?: string;
  attendees?: string[];
  teamMembers?: string[];
  equipment?: string[];
  priority?: string;
  customerNotification?: boolean;
  reminderTime?: string;
  emailNotifications?: {
    enabled: boolean;
    sendInvitations: boolean;
    sendReminders: boolean;
    recipients: EmailRecipient[];
    customMessage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Complete server appointment interface
interface ServerAppointment {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  projectId: string;
  attendees: string[];
  teamMembers: string[];
  equipment: string[];
  priority: string;
  customerNotification: boolean;
  reminderTime: string;
  emailNotifications: {
    enabled: boolean;
    sendInvitations: boolean;
    sendReminders: boolean;
    recipients: EmailRecipient[];
    customMessage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ConflictLogEntry extends DataConflict {
  resolution: ConflictResolution;
  loggedAt: string;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: string | null;
  pendingChanges: number;
  syncInProgress: boolean;
  errors: string[];
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  conflictsResolved: number;
  errors: string[];
  timestamp: string;
}

export interface ConflictResolution {
  appointmentId: string;
  strategy: 'server_wins' | 'client_wins' | 'merge' | 'manual';
  resolvedData?: Partial<StoredAppointment>;
  reason?: string;
}

export interface DataConflict {
  appointmentId: string;
  type: 'update_conflict' | 'deletion_conflict' | 'creation_conflict';
  serverVersion: StoredAppointment | null;
  localVersion: StoredAppointment | null;
  conflictFields: string[];
  timestamp: string;
}

/**
 * Advanced synchronization service with conflict resolution capabilities
 */
export class SynchronizationService {
  private static readonly SYNC_QUEUE_KEY = 'bauplan-buddy-sync-queue';
  private static readonly SYNC_STATUS_KEY = 'bauplan-buddy-sync-status';
  private static readonly CONFLICT_LOG_KEY = 'bauplan-buddy-conflict-log';
  
  /**
   * Get current synchronization status
   */
  static getSyncStatus(): SyncStatus {
    try {
      const stored = localStorage.getItem(this.SYNC_STATUS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading sync status:', error);
    }
    
    return {
      isOnline: navigator.onLine,
      lastSyncTime: null,
      pendingChanges: 0,
      syncInProgress: false,
      errors: []
    };
  }

  /**
   * Update synchronization status
   */
  static updateSyncStatus(status: Partial<SyncStatus>): void {
    try {
      const currentStatus = this.getSyncStatus();
      const newStatus = { ...currentStatus, ...status };
      localStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(newStatus));
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }

  /**
   * Perform comprehensive data synchronization with conflict resolution
   */
  static async performSync(): Promise<SyncResult> {
    const startTime = new Date().toISOString();
    this.updateSyncStatus({ syncInProgress: true, errors: [] });
    
    try {
      // Get server data
      const serverData = await AppointmentAPI.getAllAppointments();
      const localData = this.getLocalAppointments();
      
      // Convert partial server data to complete format
      const normalizedServerData = serverData.appointments.map(item => this.normalizeServerData(item));
      
      // Detect conflicts
      const conflicts = this.detectDataConflicts(localData, normalizedServerData);
      
      // Resolve conflicts
      const resolutions = await this.resolveConflicts(conflicts);
      
      // Apply resolutions
      const mergedData = this.applyConflictResolutions(localData, normalizedServerData, resolutions);
      
      // Update local storage
      this.updateLocalData(mergedData);
      
      // Update sync status
      this.updateSyncStatus({
        syncInProgress: false,
        lastSyncTime: startTime,
        pendingChanges: 0,
        isOnline: true
      });
      
      console.log('Sync completed successfully:', {
        synced: mergedData.length,
        conflicts: conflicts.length,
        resolved: resolutions.length
      });
      
      return {
        success: true,
        syncedCount: mergedData.length,
        conflictsResolved: resolutions.length,
        errors: [],
        timestamp: startTime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      
      this.updateSyncStatus({
        syncInProgress: false,
        errors: [errorMessage]
      });
      
      console.error('Sync failed:', error);
      
      return {
        success: false,
        syncedCount: 0,
        conflictsResolved: 0,
        errors: [errorMessage],
        timestamp: startTime
      };
    }
  }

  /**
   * Normalize server data to ensure all required fields are present
   */
  private static normalizeServerData(serverItem: PartialServerAppointment): ServerAppointment {
    return {
      id: serverItem.id,
      title: serverItem.title,
      description: serverItem.description || '',
      type: serverItem.type || 'meeting',
      date: serverItem.date,
      startTime: serverItem.startTime,
      endTime: serverItem.endTime,
      location: serverItem.location || '',
      projectId: serverItem.projectId || 'no-project',
      attendees: serverItem.attendees || [],
      teamMembers: serverItem.teamMembers || [],
      equipment: serverItem.equipment || [],
      priority: serverItem.priority || 'medium',
      customerNotification: serverItem.customerNotification || false,
      reminderTime: serverItem.reminderTime || '15',
      emailNotifications: serverItem.emailNotifications || {
        enabled: false,
        sendInvitations: false,
        sendReminders: false,
        recipients: [],
        customMessage: ''
      },
      createdAt: serverItem.createdAt,
      updatedAt: serverItem.updatedAt
    };
  }

  /**
   * Detect conflicts between local and server data
   */
  private static detectDataConflicts(
    localData: StoredAppointment[], 
    serverData: ServerAppointment[]
  ): DataConflict[] {
    const conflicts: DataConflict[] = [];
    const serverMap = new Map(serverData.map(item => [item.id, item]));
    const localMap = new Map(localData.map(item => [item.id, item]));
    
    // Check for update conflicts
    for (const localItem of localData) {
      const serverItem = serverMap.get(localItem.id);
      
      if (serverItem) {
        const conflictFields = this.findConflictingFields(localItem, serverItem);
        
        if (conflictFields.length > 0) {
          conflicts.push({
            appointmentId: localItem.id,
            type: 'update_conflict',
            serverVersion: serverItem,
            localVersion: localItem,
            conflictFields,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    // Check for deletion conflicts (exists locally but not on server)
    for (const localItem of localData) {
      if (!serverMap.has(localItem.id) && !localItem.id.startsWith('temp-')) {
        conflicts.push({
          appointmentId: localItem.id,
          type: 'deletion_conflict',
          serverVersion: null,
          localVersion: localItem,
          conflictFields: ['entire_object'],
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Check for creation conflicts (exists on server but not locally)
    for (const serverItem of serverData) {
      if (!localMap.has(serverItem.id)) {
        conflicts.push({
          appointmentId: serverItem.id,
          type: 'creation_conflict',
          serverVersion: this.mapServerToLocal(serverItem),
          localVersion: null,
          conflictFields: ['entire_object'],
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return conflicts;
  }

  /**
   * Find conflicting fields between two appointments
   */
  private static findConflictingFields(local: StoredAppointment, server: ServerAppointment): string[] {
    const conflicts: string[] = [];
    const fields = ['title', 'description', 'date', 'startTime', 'endTime', 'location', 'projectId', 'priority'];
    
    for (const field of fields) {
      if (local[field as keyof StoredAppointment] !== server[field]) {
        conflicts.push(field);
      }
    }
    
    // Check arrays separately
    if (JSON.stringify(local.attendees) !== JSON.stringify(server.attendees)) {
      conflicts.push('attendees');
    }
    
    if (JSON.stringify(local.teamMembers) !== JSON.stringify(server.teamMembers)) {
      conflicts.push('teamMembers');
    }
    
    if (JSON.stringify(local.equipment) !== JSON.stringify(server.equipment)) {
      conflicts.push('equipment');
    }
    
    // Check updatedAt to determine which is newer
    const localUpdated = new Date(local.updatedAt);
    const serverUpdated = new Date(server.updatedAt);
    
    if (Math.abs(localUpdated.getTime() - serverUpdated.getTime()) > 1000) { // 1 second tolerance
      conflicts.push('updatedAt');
    }
    
    return conflicts;
  }

  /**
   * Resolve conflicts using various strategies
   */
  private static async resolveConflicts(conflicts: DataConflict[]): Promise<ConflictResolution[]> {
    const resolutions: ConflictResolution[] = [];
    
    for (const conflict of conflicts) {
      const resolution = await this.resolveIndividualConflict(conflict);
      resolutions.push(resolution);
    }
    
    return resolutions;
  }

  /**
   * Resolve individual conflict using automatic strategies
   */
  private static async resolveIndividualConflict(conflict: DataConflict): Promise<ConflictResolution> {
    switch (conflict.type) {
      case 'update_conflict':
        return this.resolveUpdateConflict(conflict);
      
      case 'deletion_conflict':
        return this.resolveDeletionConflict(conflict);
      
      case 'creation_conflict':
        return this.resolveCreationConflict(conflict);
      
      default:
        return {
          appointmentId: conflict.appointmentId,
          strategy: 'server_wins',
          reason: 'Unknown conflict type, defaulting to server'
        };
    }
  }

  /**
   * Resolve update conflicts using timestamp-based strategy
   */
  private static resolveUpdateConflict(conflict: DataConflict): ConflictResolution {
    if (!conflict.localVersion || !conflict.serverVersion) {
      return {
        appointmentId: conflict.appointmentId,
        strategy: 'server_wins',
        reason: 'Missing version data'
      };
    }
    
    const localUpdated = new Date(conflict.localVersion.updatedAt);
    const serverUpdated = new Date(conflict.serverVersion.updatedAt);
    
    // Use timestamp to determine winner
    if (localUpdated > serverUpdated) {
      return {
        appointmentId: conflict.appointmentId,
        strategy: 'client_wins',
        resolvedData: conflict.localVersion,
        reason: 'Local version is newer'
      };
    } else if (serverUpdated > localUpdated) {
      return {
        appointmentId: conflict.appointmentId,
        strategy: 'server_wins',
        resolvedData: conflict.serverVersion,
        reason: 'Server version is newer'
      };
    } else {
      // If timestamps are equal, merge non-conflicting fields
      return {
        appointmentId: conflict.appointmentId,
        strategy: 'merge',
        resolvedData: this.mergeAppointments(conflict.localVersion, conflict.serverVersion),
        reason: 'Timestamps equal, merging compatible fields'
      };
    }
  }

  /**
   * Resolve deletion conflicts
   */
  private static resolveDeletionConflict(conflict: DataConflict): ConflictResolution {
    // If appointment exists locally but not on server, it might have been deleted on server
    // Check if it's a recent local creation or if it should be restored to server
    if (conflict.localVersion) {
      const createdAt = new Date(conflict.localVersion.createdAt);
      const now = new Date();
      const ageInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      if (ageInHours < 24) {
        // Recent creation, push to server
        return {
          appointmentId: conflict.appointmentId,
          strategy: 'client_wins',
          resolvedData: conflict.localVersion,
          reason: 'Recent local creation, pushing to server'
        };
      } else {
        // Older appointment, probably deleted on server
        return {
          appointmentId: conflict.appointmentId,
          strategy: 'server_wins',
          reason: 'Appointment deleted on server'
        };
      }
    }
    
    return {
      appointmentId: conflict.appointmentId,
      strategy: 'server_wins',
      reason: 'No local version available'
    };
  }

  /**
   * Resolve creation conflicts
   */
  private static resolveCreationConflict(conflict: DataConflict): ConflictResolution {
    // Server has new appointment, accept it
    return {
      appointmentId: conflict.appointmentId,
      strategy: 'server_wins',
      resolvedData: conflict.serverVersion || undefined,
      reason: 'New appointment from server'
    };
  }

  /**
   * Merge two appointments by taking the best fields from each
   */
  private static mergeAppointments(local: StoredAppointment, server: ServerAppointment): StoredAppointment {
    return {
      ...local,
      ...server,
      // Use local version for fields that are commonly user-edited
      description: local.description || server.description,
      location: local.location || server.location,
      attendees: [...new Set([...local.attendees, ...server.attendees])],
      teamMembers: [...new Set([...local.teamMembers, ...server.teamMembers])],
      equipment: [...new Set([...local.equipment, ...server.equipment])],
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Apply conflict resolutions to merge data
   */
  private static applyConflictResolutions(
    localData: StoredAppointment[],
    serverData: ServerAppointment[],
    resolutions: ConflictResolution[]
  ): StoredAppointment[] {
    const resolutionMap = new Map(resolutions.map(r => [r.appointmentId, r]));
    const result: StoredAppointment[] = [];
    const processedIds = new Set<string>();
    
    // Process local data with resolutions
    for (const localItem of localData) {
      const resolution = resolutionMap.get(localItem.id);
      
      if (resolution) {
        switch (resolution.strategy) {
          case 'client_wins':
            result.push(localItem);
            break;
          case 'server_wins':
            if (resolution.resolvedData) {
              result.push(resolution.resolvedData as StoredAppointment);
            }
            break;
          case 'merge':
            if (resolution.resolvedData) {
              result.push(resolution.resolvedData as StoredAppointment);
            }
            break;
        }
      } else {
        // No conflict, keep local version
        result.push(localItem);
      }
      
      processedIds.add(localItem.id);
    }
    
    // Add server items that weren't processed (new creations)
    for (const serverItem of serverData) {
      if (!processedIds.has(serverItem.id)) {
        const resolution = resolutionMap.get(serverItem.id);
        if (!resolution || resolution.strategy === 'server_wins') {
          result.push(this.mapServerToLocal(serverItem));
        }
      }
    }
    
    return result;
  }

  /**
   * Map server appointment format to local format
   */
  private static mapServerToLocal(serverItem: ServerAppointment): StoredAppointment {
    return {
      id: serverItem.id,
      title: serverItem.title,
      description: serverItem.description,
      type: serverItem.type,
      date: serverItem.date,
      startTime: serverItem.startTime,
      endTime: serverItem.endTime,
      location: serverItem.location,
      projectId: serverItem.projectId,
      attendees: serverItem.attendees,
      teamMembers: serverItem.teamMembers,
      equipment: serverItem.equipment,
      priority: serverItem.priority,
      customerNotification: serverItem.customerNotification,
      reminderTime: serverItem.reminderTime,
      emailNotifications: serverItem.emailNotifications,
      createdAt: serverItem.createdAt,
      updatedAt: serverItem.updatedAt
    };
  }

  /**
   * Update local data storage
   */
  private static updateLocalData(appointments: StoredAppointment[]): void {
    try {
      localStorage.setItem('bauplan-buddy-appointments', JSON.stringify(appointments));
      localStorage.setItem('bauplan-buddy-appointments-offline', JSON.stringify(appointments));
    } catch (error) {
      console.error('Error updating local data:', error);
      throw error;
    }
  }

  /**
   * Get local appointments
   */
  private static getLocalAppointments(): StoredAppointment[] {
    try {
      const data = localStorage.getItem('bauplan-buddy-appointments');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading local appointments:', error);
      return [];
    }
  }

  /**
   * Log conflict for manual review
   */
  static logConflict(conflict: DataConflict, resolution: ConflictResolution): void {
    try {
      const conflicts = this.getConflictLog();
      conflicts.push({
        ...conflict,
        resolution,
        loggedAt: new Date().toISOString()
      });
      
      // Keep only last 100 conflicts
      const trimmedConflicts = conflicts.slice(-100);
      localStorage.setItem(this.CONFLICT_LOG_KEY, JSON.stringify(trimmedConflicts));
    } catch (error) {
      console.error('Error logging conflict:', error);
    }
  }

  /**
   * Get conflict log for review
   */
  static getConflictLog(): ConflictLogEntry[] {
    try {
      const data = localStorage.getItem(this.CONFLICT_LOG_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading conflict log:', error);
      return [];
    }
  }

  /**
   * Check if sync is needed
   */
  static needsSync(): boolean {
    const status = this.getSyncStatus();
    
    if (!status.lastSyncTime) return true;
    
    const lastSync = new Date(status.lastSyncTime);
    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceSync > 1 || status.pendingChanges > 0;
  }

  /**
   * Perform background sync if needed
   */
  static async backgroundSync(): Promise<void> {
    if (!navigator.onLine || !this.needsSync()) return;
    
    try {
      await this.performSync();
    } catch (error) {
      console.warn('Background sync failed:', error);
    }
  }

  /**
   * Schedule automatic background sync
   */
  static scheduleBackgroundSync(): void {
    // Sync when online status changes
    window.addEventListener('online', () => {
      setTimeout(() => this.backgroundSync(), 1000);
    });
    
    // Periodic sync every 30 minutes
    setInterval(() => {
      this.backgroundSync();
    }, 30 * 60 * 1000);
    
    // Sync on visibility change (when user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        setTimeout(() => this.backgroundSync(), 2000);
      }
    });
  }
}