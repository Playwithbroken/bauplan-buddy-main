import { apiClient } from '@/services/apiClient';

export interface Quote {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  projectName: string;
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  date: string;
  validUntil: string;
  positions: QuotePosition[];
  createdAt: string;
  updatedAt: string;
}

export interface QuotePosition {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category?: string;
}

export interface CreateQuoteInput {
  customerId: string;
  customerName: string;
  projectName: string;
  validUntil: string;
  positions: Omit<QuotePosition, 'id'>[];
}

export interface UpdateQuoteInput extends Partial<CreateQuoteInput> {
  status?: Quote['status'];
}

export const quotesApi = {
  /**
   * Get all quotes
   */
  getAll: async (params?: { status?: string; search?: string }) => {
    return apiClient.get<Quote[]>('/quotes', { params });
  },

  /**
   * Get quote by ID
   */
  getById: async (id: string) => {
    return apiClient.get<Quote>(`/quotes/${id}`);
  },

  /**
   * Create new quote
   */
  create: async (data: CreateQuoteInput) => {
    return apiClient.post<Quote>('/quotes', data);
  },

  /**
   * Update quote
   */
  update: async (id: string, data: UpdateQuoteInput) => {
    return apiClient.put<Quote>(`/quotes/${id}`, data);
  },

  /**
   * Delete quote
   */
  delete: async (id: string) => {
    return apiClient.delete<void>(`/quotes/${id}`);
  },

  /**
   * Convert quote to project
   */
  convertToProject: async (id: string) => {
    return apiClient.post<{ projectId: string }>(`/quotes/${id}/convert`);
  },

  /**
   * Send quote to customer
   */
  send: async (id: string, email: string) => {
    return apiClient.post<void>(`/quotes/${id}/send`, { email });
  },
};
