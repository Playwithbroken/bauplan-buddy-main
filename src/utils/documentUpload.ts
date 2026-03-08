import { AdvancedDocumentService, type DocumentMetadata } from '@/services/advancedDocumentService';

export type WorkflowType = 'angebot' | 'bestellung' | 'lieferschein' | 'rechnung';
export type CounterpartyType = 'kunde' | 'lieferant';

export interface WorkflowDocumentContext {
  workflowType: WorkflowType;
  workflowId: string;
  counterpartyType: CounterpartyType;
  counterpartyId?: string;
  customerId?: string;
  supplierId?: string;
  projectId?: string;
}

export interface UploadDocumentOptions {
  name?: string;
  description?: string;
  tags?: string[];
}

const documentService = AdvancedDocumentService.getInstance();

const defaultTagsForWorkflow: Record<WorkflowType, string[]> = {
  angebot: ['angebot'],
  bestellung: ['bestellung'],
  lieferschein: ['lieferschein'],
  rechnung: ['rechnung'],
};

export async function uploadWorkflowDocument(
  file: File,
  context: WorkflowDocumentContext,
  options: UploadDocumentOptions = {}
): Promise<DocumentMetadata> {
  const tags = options.tags ?? defaultTagsForWorkflow[context.workflowType];

  const metadata = {
    name: options.name ?? file.name,
    description: options.description,
    tags,
    workflowType: context.workflowType,
    workflowId: context.workflowId,
    counterpartyType: context.counterpartyType,
    counterpartyId: context.counterpartyId,
    customerId: context.customerId,
    supplierId: context.supplierId,
    projectId: context.projectId,
  };

  return documentService.uploadDocument(
    file,
    metadata,
    {
      workflowType: context.workflowType,
      workflowId: context.workflowId,
      counterpartyType: context.counterpartyType,
      counterpartyId: context.counterpartyId,
      customerId: context.customerId,
      supplierId: context.supplierId,
      projectId: context.projectId,
      performOCR: true,
      autoDetectCategory: true,
    }
  );
}

export function slugifyCounterparty(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

