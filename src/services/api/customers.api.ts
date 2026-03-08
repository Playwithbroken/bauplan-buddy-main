import { apiClient } from '@/services/apiClient';
import type { Project } from './projects.api';
import type { Invoice } from './invoices.api';

export interface Customer {
  id: string;
  name: string;
  type: 'private' | 'business';
  status: 'active' | 'inactive' | 'prospect';
  email: string;
  phone: string;
  address: string;
  contactPerson?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  type: 'private' | 'business';
  email: string;
  phone: string;
  address: string;
  contactPerson?: string;
  notes?: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  status?: Customer['status'];
}

export const customersApi = {
  /**
   * Get all customers
   */
  getAll: async (params?: { status?: string; type?: string; search?: string }) => {
    return apiClient.get<Customer[]>('/customers', { params });
  },

  /**
   * Get customer by ID
   */
  getById: async (id: string) => {
    return apiClient.get<Customer>(`/customers/${id}`);
  },

  /**
   * Create new customer
   */
  create: async (data: CreateCustomerInput) => {
    return apiClient.post<Customer>('/customers', data);
  },

  /**
   * Update customer
   */
  update: async (id: string, data: UpdateCustomerInput) => {
    return apiClient.put<Customer>(`/customers/${id}`, data);
  },

  /**
   * Delete customer
   */
  delete: async (id: string) => {
    return apiClient.delete<void>(`/customers/${id}`);
  },

  /**
   * Get customer projects
   */
  getProjects: async (id: string) => {
    return apiClient.get<Project[]>(`/customers/${id}/projects`);
  },

  /**
   * Get customer invoices
   */
  getInvoices: async (id: string) => {
    return apiClient.get<Invoice[]>(`/customers/${id}/invoices`);
  },

  /**
   * Get customer statistics
   */
  getStats: async (id: string) => {
    return apiClient.get<{
      totalRevenue: number;
      totalProjects: number;
      activeProjects: number;
      outstandingInvoices: number;
    }>(`/customers/${id}/stats`);
  },
};
