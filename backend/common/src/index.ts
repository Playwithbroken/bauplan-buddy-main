export interface QuoteConvertedEvent {
  eventId: string;
  eventType: 'QuoteConverted';
  eventVersion: number;
  occurredAt: string;
  correlationId: string;
  quote: {
    id: string;
    number: string;
    customerId: string;
    totalAmount: number;
    currency: string;
    requestedStartDate?: string;
  };
  conversion: {
    templateId?: string;
    options?: {
      autoAssignTeam?: boolean;
      includeRiskAssessment?: boolean;
    };
  };
}

export interface ProjectCreatedEvent {
  eventId: string;
  eventType: 'ProjectCreated';
  eventVersion: number;
  occurredAt: string;
  correlationId: string;
  project: Project;
}

export interface DeliveryNoteIssuedEvent {
  eventId: string;
  eventType: 'DeliveryNoteIssued';
  eventVersion: number;
  occurredAt: string;
  correlationId: string;
  deliveryNote: DeliveryNote;
}

export interface InvoiceIssuedEvent {
  eventId: string;
  eventType: 'InvoiceIssued';
  eventVersion: number;
  occurredAt: string;
  correlationId: string;
  invoice: Invoice;
}

export type WorkflowEvent =
  | QuoteConvertedEvent
  | ProjectCreatedEvent
  | DeliveryNoteIssuedEvent
  | InvoiceIssuedEvent;

export interface Project {
  id: string;
  number: string;
  quoteId?: string;
  customerId: string;
  name: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
}

export interface DeliveryNote {
  id: string;
  number: string;
  projectId: string;
  customerId: string;
  status: 'draft' | 'sent' | 'delivered' | 'cancelled';
  issuedAt: string;
  signedAt?: string;
  items: DeliveryNoteItem[];
}

export interface DeliveryNoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  deliveredQuantity: number;
  sectionId?: string;
  sectionTitle?: string;
  sortOrder?: number;
}

export interface Invoice {
  id: string;
  number: string;
  projectId: string;
  customerId: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
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

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface ConversionJob {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}
