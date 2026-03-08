import { getEnvVar } from '@/utils/env';

const sanitizeBaseUrl = (value?: string) => {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const baseInvoiceUrl =
  sanitizeBaseUrl(getEnvVar('VITE_INVOICE_SERVICE_URL')) || sanitizeBaseUrl(getEnvVar('VITE_API_URL'));

const resolvePath = (base: string, path: string) => {
  if (!base) return path;
  if (path.startsWith('http')) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const message = text || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const json = await response.json().catch(() => ({ data: undefined }));
  return (json?.data ?? json) as T;
};

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceLineItemRequest {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  sectionId?: string;
  sectionTitle?: string;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateInvoiceRequest {
  customerId: string;
  issueDate: string;
  dueDate: string;
  currency?: string;
  lineItems: InvoiceLineItemRequest[];
}

export interface InvoiceLineItemRecord {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  sectionId?: string;
  sectionTitle?: string;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface InvoiceRecord {
  id: string;
  number: string;
  projectId: string;
  customerId: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
  lineItems: InvoiceLineItemRecord[];
}

export interface InvoiceSuggestions {
  deliveryNotes: unknown[];
  milestones: unknown[];
  projectId: string;
}

export const createProjectInvoice = async (
  projectId: string,
  payload: CreateInvoiceRequest
): Promise<InvoiceRecord> => {
  const url = resolvePath(baseInvoiceUrl || '', `/invoices/projects/${projectId}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customerId: payload.customerId,
      issueDate: payload.issueDate,
      dueDate: payload.dueDate,
      currency: payload.currency ?? 'EUR',
      lineItems: payload.lineItems
    })
  });

  return handleResponse<InvoiceRecord>(response);
};

export const getProjectInvoices = async (
  projectId: string
): Promise<InvoiceRecord[]> => {
  const url = resolvePath(baseInvoiceUrl || '', `/invoices/projects/${projectId}`);
  const response = await fetch(url, { method: 'GET' });
  return handleResponse<InvoiceRecord[]>(response);
};

export const getInvoiceSuggestions = async (
  projectId: string
): Promise<InvoiceSuggestions> => {
  const url = resolvePath(baseInvoiceUrl || '', `/invoices/projects/${projectId}/suggestions`);
  const response = await fetch(url, { method: 'GET' });
  return handleResponse<InvoiceSuggestions>(response);
};
