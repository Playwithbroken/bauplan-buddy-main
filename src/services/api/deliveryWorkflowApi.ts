import { getEnvVar } from '@/utils/env';

const sanitizeBaseUrl = (value?: string) => {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const baseDeliveryUrl =
  sanitizeBaseUrl(getEnvVar('VITE_DELIVERY_SERVICE_URL')) || sanitizeBaseUrl(getEnvVar('VITE_API_URL'));

const resolvePath = (base: string, path: string) => {
  if (!base) return path;
  if (path.startsWith('http')) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const reason = text || response.statusText || 'Request failed';
    throw new Error(`${reason} (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    const json = await response.json();
    return (json?.data ?? json) as T;
  } catch {
    return undefined as T;
  }
};

export type DeliveryNoteStatus = 'draft' | 'sent' | 'delivered' | 'cancelled';

const DELIVERY_NOTE_STATUS_VALUES: DeliveryNoteStatus[] = ['draft', 'sent', 'delivered', 'cancelled'];

const request = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  try {
    const response = await fetch(input, init);
    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Delivery workflow request failed: ${error.message}`);
    }
    throw new Error('Delivery workflow request failed.');
  }
};

export interface DeliveryNoteItemInput {
  description: string;
  quantity: number;
  unit?: string;
  deliveredQuantity?: number;
  quoteItemId?: string;
  metadata?: Record<string, unknown>;
  sectionId?: string;
  sectionTitle?: string;
  sortOrder?: number;
}

export interface CreateDeliveryNoteRequest {
  customerId: string;
  issueDate?: string;
  notes?: string;
  items: DeliveryNoteItemInput[];
}

export interface DeliveryNoteItemRecord {
  id: string;
  description: string;
  quantity: number;
  deliveredQuantity: number;
  unit: string;
  quoteItemId?: string;
  metadata?: Record<string, unknown>;
  sectionId?: string;
  sectionTitle?: string;
  sortOrder?: number;
}

export interface DeliveryNoteRecord {
  id: string;
  number: string;
  projectId: string;
  customerId: string;
  status: DeliveryNoteStatus;
  issuedAt: string;
  signedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: DeliveryNoteItemRecord[];
}

export const createDeliveryNote = async (
  projectId: string,
  payload: CreateDeliveryNoteRequest
): Promise<DeliveryNoteRecord> => {
  const trimmedProjectId = projectId?.trim();
  if (!trimmedProjectId) {
    throw new Error('projectId is required to create a delivery note.');
  }

  const customerId = payload.customerId?.trim();
  if (!customerId) {
    throw new Error('customerId is required to create a delivery note.');
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error('At least one delivery note item is required.');
  }

  const normalizedItems = payload.items.map((item, index) => {
    const description = item.description?.trim();
    if (!description) {
      throw new Error(`Item ${index + 1} requires a description.`);
    }
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Item ${index + 1} requires a quantity greater than 0.`);
    }
    const deliveredQuantity =
      item.deliveredQuantity !== undefined ? Number(item.deliveredQuantity) : undefined;
    if (deliveredQuantity !== undefined && (!Number.isFinite(deliveredQuantity) || deliveredQuantity < 0)) {
      throw new Error(`Item ${index + 1} has an invalid delivered quantity.`);
    }

    let metadata: Record<string, unknown> | undefined = item.metadata
      ? { ...item.metadata }
      : undefined;
    if (item.sectionId || item.sectionTitle || item.sortOrder !== undefined) {
      const sectionMeta: Record<string, unknown> = {
        id: item.sectionId,
        title: item.sectionTitle,
        sortOrder: item.sortOrder
      };
      metadata = metadata ? { ...metadata, section: sectionMeta } : { section: sectionMeta };
    }

    return {
      description,
      quantity,
      unit: item.unit?.trim(),
      deliveredQuantity,
      quoteItemId: item.quoteItemId,
      metadata
    };
  });

  const url = resolvePath(baseDeliveryUrl || '', `/delivery-notes/projects/${trimmedProjectId}`);
  return request<DeliveryNoteRecord>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customerId,
      notes: payload.notes?.trim(),
      issueDate: payload.issueDate,
      items: normalizedItems
    })
  });
};

export const updateDeliveryNoteStatus = async (
  deliveryNoteId: string,
  status: DeliveryNoteStatus
): Promise<DeliveryNoteRecord> => {
  const trimmedId = deliveryNoteId?.trim();
  if (!trimmedId) {
    throw new Error('deliveryNoteId is required to update the status.');
  }

  if (!DELIVERY_NOTE_STATUS_VALUES.includes(status)) {
    throw new Error(`Unsupported delivery note status: ${status}`);
  }

  const url = resolvePath(baseDeliveryUrl || '', `/delivery-notes/${trimmedId}/status`);
  return request<DeliveryNoteRecord>(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });
};

export const getProjectDeliveryNotes = async (
  projectId: string
): Promise<DeliveryNoteRecord[]> => {
  const trimmedProjectId = projectId?.trim();
  if (!trimmedProjectId) {
    throw new Error('projectId is required to load delivery notes.');
  }

  const url = resolvePath(baseDeliveryUrl || '', `/delivery-notes/projects/${trimmedProjectId}`);
  return request<DeliveryNoteRecord[]>(url, { method: 'GET' });
};
