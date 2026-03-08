import { projectsApi, Project, CreateProjectInput, UpdateProjectInput } from './api/projects.api';
import { offlineSync } from './offlineSyncService';
import { db } from './localDatabaseService';
import { getEnvVar, isProduction } from '@/utils/env';

const USE_API = getEnvVar('VITE_USE_API') === 'true' || isProduction();

export class ProjectService {
  /**
   * Get all projects
   */
  static async getAll(params?: { status?: string; search?: string }): Promise<Project[]> {
    if (USE_API && navigator.onLine) {
      try {
        const projects = await projectsApi.getAll(params);
        
        // Update local Dexie cache
        for (const project of projects) {
          await db.projects.put({
            ...project,
            updatedAt: project.updatedAt || new Date().toISOString()
          });
        }
        
        return projects;
      } catch (error) {
        console.warn('API call failed, falling back to local database:', error);
      }
    }
    
    // Fallback to Dexie
    let collection = db.projects.toCollection();
    
    if (params?.status && params.status !== 'all') {
      collection = db.projects.where('status').equals(params.status);
    }
    
    let localProjects = await collection.toArray();
    
    return localProjects.map(p => ({
      ...p,
      customer: p.customer || (p as any).customerName, // Ensure compatibility
    })) as unknown as Project[];
  }

  /**
   * Get project by ID
   */
  static async getById(id: string): Promise<Project | null> {
    if (USE_API && navigator.onLine) {
      try {
        const project = await projectsApi.getById(id);
        await db.projects.put(project);
        return project;
      } catch (error) {
        console.warn('API call failed, falling back to local database:', error);
      }
    }
    
    return db.projects.get(id) as unknown as Project | null;
  }

  /**
   * Create new project
   */
  static async create(data: CreateProjectInput): Promise<Project> {
    const id = `PRJ-${Date.now()}`;
    const now = new Date().toISOString();
    
    const project: Project = {
      ...data,
      id,
      status: 'planning',
      progress: 0,
      spent: 0,
      createdAt: now,
      updatedAt: now,
    } as Project;

    // Save to local database immediately
    await db.projects.put(project as any);
    
    // Queue for sync
    await offlineSync.queueAction('projects', 'create', project);

    return project;
  }

  /**
   * Update project
   */
  static async update(id: string, data: UpdateProjectInput): Promise<Project | null> {
    const existing = await db.projects.get(id);
    if (!existing) return null;

    const updated: Project = {
      ...existing as any,
      ...data,
      updatedAt: new Date().toISOString()
    };

    await db.projects.put(updated as any);
    
    // Queue for sync
    await offlineSync.queueAction('projects', 'update', updated, id);

    return updated;
  }

  /**
   * Delete project
   */
  static async delete(id: string): Promise<boolean> {
    const existing = await db.projects.get(id);
    if (!existing) return false;

    await db.projects.delete(id);

    // Queue for sync
    await offlineSync.queueAction('projects', 'delete', existing, id);

    return true;
  }

  /**
   * Archive project
   */
  static async archive(id: string): Promise<Project | null> {
    const existing = await db.projects.get(id);
    if (!existing) return null;

    const updated: Project = {
      ...(existing as any),
      status: "archived",
      updatedAt: new Date().toISOString(),
    };

    await db.projects.put(updated as any);
    await offlineSync.queueAction("projects", "update", updated, id);

    if (USE_API && navigator.onLine) {
      try {
        await projectsApi.update(id, { status: "archived" });
      } catch (error) {
        console.warn("API archive sync failed:", error);
      }
    }

    return updated;
  }

  /**
   * Get project statistics
   */
  static async getStats(id: string) {
    if (USE_API && navigator.onLine) {
      try {
        return await projectsApi.getStats(id);
      } catch (error) {
        console.warn("API getStats failed, fallback to local calculation");
      }
    }

    // Simple local calculation as fallback
    return {
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      teamMembers: 1,
      progress: 0,
    };
  }
}
