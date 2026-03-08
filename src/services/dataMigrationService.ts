import { userApiService } from './api/userApiService';
import { ProjectService } from './projectService';
import { appointmentApiService } from './api/appointmentApiService';
import { documentApiService } from './api/documentApiService';
import { configService } from './databaseService';

export interface MigrationProgress {
  stage: string;
  progress: number;
  total: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
}

export interface MigrationResult {
  success: boolean;
  errors: string[];
  migratedUsers: number;
  migratedProjects: number;
  migratedAppointments: number;
  migratedDocuments: number;
}

export class DataMigrationService {
  private onProgress?: (progress: MigrationProgress) => void;

  constructor(onProgress?: (progress: MigrationProgress) => void) {
    this.onProgress = onProgress;
  }

  async migrateToApi(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      errors: [],
      migratedUsers: 0,
      migratedProjects: 0,
      migratedAppointments: 0,
      migratedDocuments: 0
    };

    try {
      // Check if API is available
      if (!configService.shouldUseApi()) {
        throw new Error('API configuration not available');
      }

      // Stage 1: Migrate Users
      this.reportProgress('Migrating users...', 0, 4, 'running');
      result.migratedUsers = await this.migrateUsers();
      
      // Stage 2: Migrate Projects
      this.reportProgress('Migrating projects...', 1, 4, 'running');
      result.migratedProjects = await this.migrateProjects();
      
      // Stage 3: Migrate Appointments
      this.reportProgress('Migrating appointments...', 2, 4, 'running');
      result.migratedAppointments = await this.migrateAppointments();
      
      // Stage 4: Migrate Documents
      this.reportProgress('Migrating documents...', 3, 4, 'running');
      result.migratedDocuments = await this.migrateDocuments();
      
      this.reportProgress('Migration completed', 4, 4, 'completed');
      
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      this.reportProgress('Migration failed', 0, 4, 'error', error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  async migrateFromApi(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      errors: [],
      migratedUsers: 0,
      migratedProjects: 0,
      migratedAppointments: 0,
      migratedDocuments: 0
    };

    try {
      // Stage 1: Backup API data to localStorage
      this.reportProgress('Backing up users...', 0, 4, 'running');
      result.migratedUsers = await this.backupUsers();
      
      this.reportProgress('Backing up projects...', 1, 4, 'running');
      result.migratedProjects = await this.backupProjects();
      
      this.reportProgress('Backing up appointments...', 2, 4, 'running');
      result.migratedAppointments = await this.backupAppointments();
      
      this.reportProgress('Backing up documents...', 3, 4, 'running');
      result.migratedDocuments = await this.backupDocuments();
      
      this.reportProgress('Backup completed', 4, 4, 'completed');
      
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      this.reportProgress('Backup failed', 0, 4, 'error', error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  async clearLocalStorage(): Promise<void> {
    try {
      localStorage.removeItem('users');
      localStorage.removeItem('projects');
      localStorage.removeItem('appointments');
      localStorage.removeItem('documents');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      throw new Error('Failed to clear local storage');
    }
  }

  async getLocalStorageStats(): Promise<{
    users: number;
    projects: number;
    appointments: number;
    documents: number;
    totalSizeKB: number;
  }> {
    try {
      const stats = {
        users: 0,
        projects: 0,
        appointments: 0,
        documents: 0,
        totalSizeKB: 0
      };

      // Count items and calculate size
      const items = ['users', 'projects', 'appointments', 'documents'];
      for (const item of items) {
        const data = localStorage.getItem(item);
        if (data) {
          const parsed = JSON.parse(data);
          stats[item as keyof typeof stats] = Array.isArray(parsed) ? parsed.length : 0;
          stats.totalSizeKB += new Blob([data]).size / 1024;
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get localStorage stats:', error);
      return {
        users: 0,
        projects: 0,
        appointments: 0,
        documents: 0,
        totalSizeKB: 0
      };
    }
  }

  private async migrateUsers(): Promise<number> {
    try {
      const localUsers = this.getLocalStorageData('users');
      if (!localUsers || localUsers.length === 0) return 0;

      let migratedCount = 0;
      for (const user of localUsers) {
        try {
          await userApiService.createUser({
            email: (user as any).email,
            name: (user as any).name,
            role: (user as any).role,
            password: 'temp-password-needs-reset'
          });
          migratedCount++;
        } catch (error) {
          console.warn(`Failed to migrate user ${(user as any).email}:`, error);
        }
      }

      return migratedCount;
    } catch (error) {
      console.error('Failed to migrate users:', error);
      return 0;
    }
  }

  private async migrateProjects(): Promise<number> {
    try {
      const localProjects = this.getLocalStorageData('projects');
      if (!localProjects || localProjects.length === 0) return 0;

      let migratedCount = 0;
      for (const project of localProjects) {
        try {
          await ProjectService.create({
            name: (project as any).name,
            description: (project as any).description,
            startDate: (project as any).startDate ? new Date((project as any).startDate).toISOString() : undefined,
            endDate: (project as any).endDate ? new Date((project as any).endDate).toISOString() : undefined,
            budget: (project as any).budget,
            clientId: (project as any).clientId,
            address: (project as any).address,
            notes: (project as any).notes,
            customerId: (project as any).customerId || 'CUST-GEN-001',
            customerName: (project as any).customerName || 'General Customer',
          } as any);
          migratedCount++;
        } catch (error) {
          console.warn(`Failed to migrate project ${(project as any).name}:`, error);
        }
      }

      return migratedCount;
    } catch (error) {
      console.error('Failed to migrate projects:', error);
      return 0;
    }
  }

  private async migrateAppointments(): Promise<number> {
    try {
      const localAppointments = this.getLocalStorageData('appointments');
      if (!localAppointments || localAppointments.length === 0) return 0;

      let migratedCount = 0;
      for (const appointment of localAppointments) {
        try {
          await appointmentApiService.createAppointment({
            title: (appointment as any).title,
            description: (appointment as any).description,
            type: (appointment as any).type,
            date: (appointment as any).date,
            startTime: (appointment as any).startTime,
            endTime: (appointment as any).endTime,
            location: (appointment as any).location,
            projectId: (appointment as any).projectId,
            attendees: (appointment as any).attendees || [],
            teamMembers: (appointment as any).teamMembers || [],
            equipment: (appointment as any).equipment || [],
            priority: (appointment as any).priority || 'medium',
            customerNotification: (appointment as any).customerNotification || false,
            reminderMinutes: (appointment as any).reminderMinutes || 30
          });
          migratedCount++;
        } catch (error) {
          console.warn(`Failed to migrate appointment ${(appointment as any).title}:`, error);
        }
      }

      return migratedCount;
    } catch (error) {
      console.error('Failed to migrate appointments:', error);
      return 0;
    }
  }

  private async migrateDocuments(): Promise<number> {
    try {
      const localDocuments = this.getLocalStorageData('documents');
      if (!localDocuments || localDocuments.length === 0) return 0;
      console.warn('Document migration not fully implemented - only metadata can be migrated');
      return 0;
    } catch (error) {
      console.error('Failed to migrate documents:', error);
      return 0;
    }
  }

  private async backupUsers(): Promise<number> {
    try {
      const apiUsers = await userApiService.getUsers();
      localStorage.setItem('users_backup', JSON.stringify(apiUsers));
      return apiUsers.length;
    } catch (error) {
      console.error('Failed to backup users:', error);
      return 0;
    }
  }

  private async backupProjects(): Promise<number> {
    try {
      const apiProjects = await ProjectService.getAll();
      localStorage.setItem('projects_backup', JSON.stringify(apiProjects));
      return apiProjects.length;
    } catch (error) {
      console.error('Failed to backup projects:', error);
      return 0;
    }
  }

  private async backupAppointments(): Promise<number> {
    try {
      const apiAppointments = await appointmentApiService.getAppointments();
      localStorage.setItem('appointments_backup', JSON.stringify(apiAppointments));
      return apiAppointments.length;
    } catch (error) {
      console.error('Failed to backup appointments:', error);
      return 0;
    }
  }

  private async backupDocuments(): Promise<number> {
    try {
      const apiDocuments = await documentApiService.getDocuments();
      localStorage.setItem('documents_backup', JSON.stringify(apiDocuments));
      return apiDocuments.length;
    } catch (error) {
      console.error('Failed to backup documents:', error);
      return 0;
    }
  }

  private getLocalStorageData(key: string): unknown[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Failed to get localStorage data for ${key}:`, error);
      return [];
    }
  }

  private reportProgress(stage: string, progress: number, total: number, status: MigrationProgress['status'], error?: string): void {
    if (this.onProgress) {
      this.onProgress({
        stage,
        progress,
        total,
        status,
        error
      });
    }
  }
}

export const dataMigrationService = new DataMigrationService();
