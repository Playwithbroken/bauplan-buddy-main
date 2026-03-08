import { InvoiceService } from '../../enhancedInvoiceService';
import type { Invoice, InvoiceFilters, InvoiceFormData } from '@/types/invoice';

export type LocalInvoiceListParams = Partial<InvoiceFilters>;

export const localInvoices = {
  async list(params?: LocalInvoiceListParams): Promise<Invoice[]> {
    return InvoiceService.getAllInvoices(params);
  },
  async get(id: string): Promise<Invoice | null> {
    return InvoiceService.getInvoiceById(id);
  },
  async create(data: InvoiceFormData): Promise<Invoice> {
    return InvoiceService.createInvoice(data);
  },
  async update(id: string, data: Partial<InvoiceFormData>): Promise<Invoice | null> {
    return InvoiceService.updateInvoice(id, data);
  },
  async remove(id: string): Promise<void> {
    InvoiceService.deleteInvoice(id);
  },
};
