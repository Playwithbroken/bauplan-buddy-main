import { apiClient } from '@/services/apiClient';

export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  projectId?: string;
  projectName?: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  date: string;
  dueDate: string;
  paidDate?: string;
  positions: InvoicePosition[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoicePosition {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  taxRate?: number;
}

export interface CreateInvoiceInput {
  customerId: string;
  customerName: string;
  projectId?: string;
  dueDate: string;
  positions: Omit<InvoicePosition, 'id'>[];
}

export interface UpdateInvoiceInput extends Partial<CreateInvoiceInput> {
  status?: Invoice['status'];
  paidDate?: string;
}

export const invoicesApi = {
  /**
   * Get all invoices
   */
  getAll: async (params?: { status?: string; search?: string }) => {
    return apiClient.get<Invoice[]>('/invoices', { params });
  },

  /**
   * Get invoice by ID
   */
  getById: async (id: string) => {
    return apiClient.get<Invoice>(`/invoices/${id}`);
  },

  /**
   * Create new invoice
   */
  create: async (data: CreateInvoiceInput) => {
    return apiClient.post<Invoice>('/invoices', data);
  },

  /**
   * Update invoice
   */
  update: async (id: string, data: UpdateInvoiceInput) => {
    return apiClient.put<Invoice>(`/invoices/${id}`, data);
  },

  /**
   * Delete invoice
   */
  delete: async (id: string) => {
    return apiClient.delete<void>(`/invoices/${id}`);
  },

  /**
   * Mark invoice as paid
   */
  markPaid: async (id: string, paidDate: string) => {
    return apiClient.post<Invoice>(`/invoices/${id}/mark-paid`, { paidDate });
  },

  /**
   * Send invoice to customer
   */
  send: async (id: string, email: string) => {
    return apiClient.post<void>(`/invoices/${id}/send`, { email });
  },

  /**
   * Generate PDF
   */
  generatePdf: async (id: string) => {
    return apiClient.get<Blob>(`/invoices/${id}/pdf`, {
      headers: { 'Accept': 'application/pdf' },
    });
  },
};
