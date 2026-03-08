import type { Invoice, InvoiceFilters, InvoiceFormData } from '@/types/invoice';
import { featureFlags } from '@/lib/featureFlags';
import type { CreateInvoiceRequest, InvoiceRecord } from '../api/invoiceWorkflowApi';
import { localInvoices, type LocalInvoiceListParams } from './local/invoices';
import {
  cloudInvoices,
  type CloudInvoiceCreateParams,
  type CloudInvoiceListParams,
} from './cloud/invoices';
import { useAppConfig } from '../../contexts/AppConfigContext';

type Entity = 'invoices';
type StorageMode = 'local' | 'cloud';

type InvoiceListParams = (Partial<InvoiceFilters> & CloudInvoiceListParams) | undefined;
type InvoiceListResult = Invoice[] | InvoiceRecord[];
type InvoiceSingleResult = Invoice | InvoiceRecord | null;
type InvoiceCreateInput = InvoiceFormData | CloudInvoiceCreateParams;
type InvoiceUpdateInput = Partial<InvoiceFormData> | Partial<CreateInvoiceRequest>;

type Router = {
  list: (entity: Entity, params?: InvoiceListParams) => Promise<InvoiceListResult>;
  get: (entity: Entity, id: string) => Promise<InvoiceSingleResult>;
  create: (entity: Entity, data: InvoiceCreateInput) => Promise<Invoice | InvoiceRecord>;
  update: (
    entity: Entity,
    id: string,
    data: InvoiceUpdateInput
  ) => Promise<Invoice | InvoiceRecord | null>;
  remove: (entity: Entity, id: string) => Promise<void>;
};

type LocalInvoiceAdapter = typeof localInvoices;
type CloudInvoiceAdapter = typeof cloudInvoices;

function getImpl(mode: 'local', entity: Entity): LocalInvoiceAdapter;
function getImpl(mode: 'cloud', entity: Entity): CloudInvoiceAdapter;
function getImpl(mode: StorageMode, entity: Entity): LocalInvoiceAdapter | CloudInvoiceAdapter {
  if (entity === 'invoices') {
    return mode === 'local' ? localInvoices : cloudInvoices;
  }
  throw new Error(`Unknown entity: ${entity}`);
}

export function useStorageRouter(): Router {
  const { config } = useAppConfig();
  const configuredMode = (config.storageMode as StorageMode) ?? 'local';
  const mode = featureFlags.isEnabled('ENABLE_API_INVOICES') ? 'cloud' : configuredMode;

  return {
    async list(entity, params) {
      if (mode === 'local') {
        return getImpl('local', entity).list(params as LocalInvoiceListParams);
      }
      return getImpl('cloud', entity).list(params as CloudInvoiceListParams | undefined);
    },
    async get(entity, id) {
      if (mode === 'local') {
        return getImpl('local', entity).get(id);
      }
      return getImpl('cloud', entity).get(id);
    },
    async create(entity, data) {
      if (mode === 'local') {
        return getImpl('local', entity).create(data as InvoiceFormData);
      }
      return getImpl('cloud', entity).create(data as CloudInvoiceCreateParams);
    },
    async update(entity, id, data) {
      if (mode === 'local') {
        return getImpl('local', entity).update(id, data as Partial<InvoiceFormData>);
      }
      return getImpl('cloud', entity).update(id, data as Partial<CreateInvoiceRequest>);
    },
    async remove(entity, id) {
      if (mode === 'local') {
        return getImpl('local', entity).remove(id);
      }
      return getImpl('cloud', entity).remove(id);
    },
  };
}
