import { apiClient } from '@/services/apiClient';

export interface Project {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled' | 'archived';
  progress: number;
  budget: number;
  spent: number;
  invoicedAmount?: number;
  builtAmount?: number;
  startDate: string;
  endDate: string;
  description?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  customerId: string;
  customerName: string;
  budget: number;
  startDate: string;
  endDate: string;
  description?: string;
  address?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  status?: Project['status'];
  progress?: number;
  spent?: number;
  invoicedAmount?: number;
  builtAmount?: number;
}

export const projectsApi = {
  /**
   * Get all projects
   */
  getAll: async (params?: { status?: string; search?: string }) => {
    return apiClient.get<Project[]>('/projects', { params });
  },

  /**
   * Get project by ID
   */
  getById: async (id: string) => {
    return apiClient.get<Project>(`/projects/${id}`);
  },

  /**
   * Create new project
   */
  create: async (data: CreateProjectInput) => {
    return apiClient.post<Project>('/projects', data);
  },

  /**
   * Update project
   */
  update: async (id: string, data: UpdateProjectInput) => {
    return apiClient.put<Project>(`/projects/${id}`, data);
  },

  /**
   * Delete project
   */
  delete: async (id: string) => {
    return apiClient.delete<void>(`/projects/${id}`);
  },

  /**
   * Get project statistics
   */
  getStats: async (id: string) => {
    return apiClient.get<{
      totalTasks: number;
      completedTasks: number;
      overdueTasks: number;
      teamMembers: number;
      progress: number;
    }>(`/projects/${id}/stats`);
  },
};
