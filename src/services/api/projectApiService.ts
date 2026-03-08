import { apiClient, configService } from '../databaseService';
import type { Project } from '@/types/project';

// API response types
interface ProjectApiResponse {
  id: string;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  client_id: string;
  manager_id: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ApiListResponse<T> {
  data: T[];
}

interface ApiSingleResponse<T> {
  data: T;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  clientId: string;
  address?: string;
  notes?: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: string;
  status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
}

export interface ProjectFilter {
  status?: string;
  clientId?: string;
  managerId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  budgetMin?: number;
  budgetMax?: number;
}

export interface ProjectStats {
  total: number;
  byStatus: Record<string, number>;
  totalBudget: number;
  averageBudget: number;
  completionRate: number;
}

export class ProjectApiService {
  private useApi: boolean;

  constructor() {
    this.useApi = configService.shouldUseApi();
  }

  async getProjects(filter?: ProjectFilter): Promise<Project[]> {
    if (this.useApi) {
      return this.getProjectsFromApi(filter);
    } else {
      return this.getProjectsFromLocalStorage(filter);
    }
  }

  async getProject(id: string): Promise<Project | null> {
    if (this.useApi) {
      return this.getProjectFromApi(id);
    } else {
      return this.getProjectFromLocalStorage(id);
    }
  }

  async createProject(projectData: CreateProjectRequest): Promise<Project> {
    if (this.useApi) {
      return this.createProjectInApi(projectData);
    } else {
      return this.createProjectInLocalStorage(projectData);
    }
  }

  async updateProject(projectData: UpdateProjectRequest): Promise<Project> {
    if (this.useApi) {
      return this.updateProjectInApi(projectData);
    } else {
      return this.updateProjectInLocalStorage(projectData);
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    if (this.useApi) {
      return this.deleteProjectFromApi(id);
    } else {
      return this.deleteProjectFromLocalStorage(id);
    }
  }

  async getProjectsByClient(clientId: string): Promise<Project[]> {
    return this.getProjects({ clientId });
  }

  async getActiveProjects(): Promise<Project[]> {
    return this.getProjects({ status: 'active' });
  }

  async getProjectStats(): Promise<ProjectStats> {
    if (this.useApi) {
      return this.getProjectStatsFromApi();
    } else {
      return this.getProjectStatsFromLocalStorage();
    }
  }

  async searchProjects(query: string): Promise<Project[]> {
    const allProjects = await this.getProjects();
    
    const searchTerm = query.toLowerCase();
    return allProjects.filter(project => 
      project.name.toLowerCase().includes(searchTerm) ||
      project.description?.toLowerCase().includes(searchTerm) ||
      project.address?.toLowerCase().includes(searchTerm) ||
      project.notes?.toLowerCase().includes(searchTerm)
    );
  }

  // API Implementation Methods
  private async getProjectsFromApi(filter?: ProjectFilter): Promise<Project[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filter) {
        if (filter.status) queryParams.append('status', filter.status);
        if (filter.clientId) queryParams.append('client_id', filter.clientId);
        if (filter.managerId) queryParams.append('manager_id', filter.managerId);
        if (filter.startDateFrom) queryParams.append('start_date_from', filter.startDateFrom.toISOString());
        if (filter.startDateTo) queryParams.append('start_date_to', filter.startDateTo.toISOString());
        if (filter.endDateFrom) queryParams.append('end_date_from', filter.endDateFrom.toISOString());
        if (filter.endDateTo) queryParams.append('end_date_to', filter.endDateTo.toISOString());
        if (filter.budgetMin) queryParams.append('budget_min', filter.budgetMin.toString());
        if (filter.budgetMax) queryParams.append('budget_max', filter.budgetMax.toString());
      }

      const url = `/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<ApiListResponse<ProjectApiResponse>>(url);
      
      return response.data.map(this.mapApiResponseToProject);
    } catch (error) {
      console.error('Failed to fetch projects from API:', error);
      throw new Error('Failed to fetch projects');
    }
  }

  private async getProjectFromApi(id: string): Promise<Project | null> {
    try {
      const response = await apiClient.get<ApiSingleResponse<ProjectApiResponse>>(`/projects/${id}`);
      return this.mapApiResponseToProject(response.data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      console.error('Failed to fetch project from API:', error);
      throw new Error('Failed to fetch project');
    }
  }

  private async createProjectInApi(projectData: CreateProjectRequest): Promise<Project> {
    try {
      const payload = this.mapCreateRequestToApiPayload(projectData);
      const response = await apiClient.post<ApiSingleResponse<ProjectApiResponse>>('/projects', payload);
      return this.mapApiResponseToProject(response.data);
    } catch (error) {
      console.error('Failed to create project in API:', error);
      throw new Error('Failed to create project');
    }
  }

  private async updateProjectInApi(projectData: UpdateProjectRequest): Promise<Project> {
    try {
      const { id, ...updateData } = projectData;
      const payload = this.mapUpdateRequestToApiPayload(updateData);
      const response = await apiClient.put<ApiSingleResponse<ProjectApiResponse>>(`/projects/${id}`, payload);
      return this.mapApiResponseToProject(response.data);
    } catch (error) {
      console.error('Failed to update project in API:', error);
      throw new Error('Failed to update project');
    }
  }

  private async deleteProjectFromApi(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/projects/${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete project from API:', error);
      throw new Error('Failed to delete project');
    }
  }

  private async getProjectStatsFromApi(): Promise<ProjectStats> {
    try {
      const response = await apiClient.get<{ data: ProjectStats }>('/projects/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch project stats from API:', error);
      // Fallback to calculating from all projects
      const projects = await this.getProjectsFromApi();
      return this.calculateProjectStats(projects);
    }
  }

  // LocalStorage Implementation Methods (fallback)
  private getProjectsFromLocalStorage(filter?: ProjectFilter): Project[] {
    try {
      const projects = this.getAllProjectsFromLocalStorage();
      
      if (!filter) return projects;

      return projects.filter(project => {
        if (filter.status && project.status !== filter.status) return false;
        if (filter.clientId && project.clientId !== filter.clientId) return false;
        if (filter.managerId && project.managerId !== filter.managerId) return false;
        if (filter.startDateFrom && project.startDate && new Date(project.startDate) < filter.startDateFrom) return false;
        if (filter.startDateTo && project.startDate && new Date(project.startDate) > filter.startDateTo) return false;
        if (filter.endDateFrom && project.endDate && new Date(project.endDate) < filter.endDateFrom) return false;
        if (filter.endDateTo && project.endDate && new Date(project.endDate) > filter.endDateTo) return false;
        if (filter.budgetMin && project.budget && project.budget < filter.budgetMin) return false;
        if (filter.budgetMax && project.budget && project.budget > filter.budgetMax) return false;
        
        return true;
      });
    } catch (error) {
      console.error('Failed to get projects from localStorage:', error);
      return [];
    }
  }

  private getProjectFromLocalStorage(id: string): Project | null {
    const projects = this.getAllProjectsFromLocalStorage();
    return projects.find(project => project.id === id) || null;
  }

  private createProjectInLocalStorage(projectData: CreateProjectRequest): Project {
    const projects = this.getAllProjectsFromLocalStorage();
    
    const newProject: Project = {
      id: Date.now().toString(),
      name: projectData.name,
      description: projectData.description,
      status: 'planning',
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      budget: projectData.budget,
      clientId: projectData.clientId,
      managerId: 'current-user', // Would be from auth context
      address: projectData.address,
      notes: projectData.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    projects.push(newProject);
    this.saveProjectsToLocalStorage(projects);
    
    return newProject;
  }

  private updateProjectInLocalStorage(projectData: UpdateProjectRequest): Project {
    const projects = this.getAllProjectsFromLocalStorage();
    const index = projects.findIndex(project => project.id === projectData.id);
    
    if (index === -1) {
      throw new Error('Project not found');
    }

    const updatedProject: Project = {
      ...projects[index],
      ...projectData,
      updatedAt: new Date()
    };

    projects[index] = updatedProject;
    this.saveProjectsToLocalStorage(projects);
    
    return updatedProject;
  }

  private deleteProjectFromLocalStorage(id: string): boolean {
    const projects = this.getAllProjectsFromLocalStorage();
    const filteredProjects = projects.filter(project => project.id !== id);
    
    if (filteredProjects.length === projects.length) {
      return false; // Project not found
    }

    this.saveProjectsToLocalStorage(filteredProjects);
    return true;
  }

  private getProjectStatsFromLocalStorage(): ProjectStats {
    const projects = this.getAllProjectsFromLocalStorage();
    return this.calculateProjectStats(projects);
  }

  // Helper Methods
  private getAllProjectsFromLocalStorage(): Project[] {
    try {
      const stored = localStorage.getItem('projects');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading projects from localStorage:', error);
      return [];
    }
  }

  private saveProjectsToLocalStorage(projects: Project[]): void {
    try {
      localStorage.setItem('projects', JSON.stringify(projects));
    } catch (error) {
      console.error('Error saving projects to localStorage:', error);
      throw new Error('Failed to save projects');
    }
  }

  private calculateProjectStats(projects: Project[]): ProjectStats {
    const stats: ProjectStats = {
      total: projects.length,
      byStatus: {},
      totalBudget: 0,
      averageBudget: 0,
      completionRate: 0
    };

    let completedProjects = 0;
    let totalBudget = 0;
    let projectsWithBudget = 0;

    projects.forEach(project => {
      // Count by status
      stats.byStatus[project.status] = (stats.byStatus[project.status] || 0) + 1;
      
      // Calculate completion rate
      if (project.status === 'completed') {
        completedProjects++;
      }
      
      // Calculate budget stats
      if (project.budget) {
        totalBudget += project.budget;
        projectsWithBudget++;
      }
    });

    stats.totalBudget = totalBudget;
    stats.averageBudget = projectsWithBudget > 0 ? totalBudget / projectsWithBudget : 0;
    stats.completionRate = projects.length > 0 ? (completedProjects / projects.length) * 100 : 0;

    return stats;
  }

  // Mapping Methods
  private mapApiResponseToProject(apiData: ProjectApiResponse): Project {
    return {
      id: apiData.id,
      name: apiData.name,
      description: apiData.description,
      status: apiData.status,
      startDate: apiData.start_date ? new Date(apiData.start_date) : undefined,
      endDate: apiData.end_date ? new Date(apiData.end_date) : undefined,
      budget: apiData.budget,
      clientId: apiData.client_id,
      managerId: apiData.manager_id,
      address: apiData.address,
      notes: apiData.notes,
      createdAt: new Date(apiData.created_at),
      updatedAt: new Date(apiData.updated_at)
    };
  }

  private mapCreateRequestToApiPayload(data: CreateProjectRequest): Record<string, unknown> {
    return {
      name: data.name,
      description: data.description,
      start_date: data.startDate?.toISOString(),
      end_date: data.endDate?.toISOString(),
      budget: data.budget,
      client_id: data.clientId,
      address: data.address,
      notes: data.notes
    };
  }

  private mapUpdateRequestToApiPayload(data: Partial<CreateProjectRequest> & { status?: string }): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.startDate !== undefined) payload.start_date = data.startDate?.toISOString();
    if (data.endDate !== undefined) payload.end_date = data.endDate?.toISOString();
    if (data.budget !== undefined) payload.budget = data.budget;
    if (data.clientId !== undefined) payload.client_id = data.clientId;
    if (data.address !== undefined) payload.address = data.address;
    if (data.notes !== undefined) payload.notes = data.notes;
    if (data.status !== undefined) payload.status = data.status;
    
    return payload;
  }
}

// Export singleton instance
export const projectApiService = new ProjectApiService();