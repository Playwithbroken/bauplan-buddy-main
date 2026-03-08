import {
  createProjectInvoice,
  getProjectInvoices,
  type CreateInvoiceRequest,
  type InvoiceRecord,
} from '../../api/invoiceWorkflowApi';

export type CloudInvoiceListParams = {
  projectId?: string;
};

export type CloudInvoiceCreateParams = {
  projectId: string;
  payload: CreateInvoiceRequest;
};

// Minimal cloud adapter. Invoices are project-scoped in the API stubs.
class InvoiceCloudFeatureUnavailableError extends Error {
  action: 'update' | 'remove';

  constructor(action: 'update' | 'remove') {
    super(
      action === 'update'
        ? 'Invoice editing in cloud mode ist noch nicht verfügbar.'
        : 'Invoice-Löschen in der Cloud ist noch nicht verfügbar.'
    );
    this.name = 'InvoiceCloudFeatureUnavailableError';
    this.action = action;
  }
}

export const cloudInvoices = {
  async list(params?: CloudInvoiceListParams): Promise<InvoiceRecord[]> {
    const projectId = params?.projectId;
    if (!projectId) {
      // Fallback: no project filter implemented yet
      return [];
    }
    return getProjectInvoices(projectId);
  },
  async get(_id: string): Promise<InvoiceRecord | null> {
    // Not defined in current api stub; return empty for now
    return null;
  },
  async create({ projectId, payload }: CloudInvoiceCreateParams): Promise<InvoiceRecord> {
    if (!projectId) {
      throw new Error('projectId is required for cloud invoice creation');
    }
    return createProjectInvoice(projectId, payload);
  },
  async update(_id: string, _data: Partial<CreateInvoiceRequest>): Promise<never> {
    throw new InvoiceCloudFeatureUnavailableError('update');
  },
  async remove(_id: string): Promise<never> {
    throw new InvoiceCloudFeatureUnavailableError('remove');
  },
};

export { InvoiceCloudFeatureUnavailableError };
