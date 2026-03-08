import { Prisma, DeliveryNoteStatus, getPrismaClient } from '@bauplan/database';

const prisma = getPrismaClient();

export interface CreateDeliveryNoteItem {
  description: string;
  quantity: number;
  deliveredQuantity?: number;
  unit?: string;
  quoteItemId?: string;
  metadata?: any;
}

export interface CreateDeliveryNotePayload {
  organizationId: string;
  projectId: string;
  customerId: string;
  issuedAt?: string;
  notes?: string;
  items: CreateDeliveryNoteItem[];
}

const toDecimal = (value: number | undefined): Prisma.Decimal => new Prisma.Decimal(value ?? 0);

export const generateDeliveryNoteNumber = async (): Promise<string> => {
  const count = await prisma.deliveryNote.count();
  return `LS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

export const createDeliveryNote = async (
  payload: CreateDeliveryNotePayload
): Promise<any> => {
  const number = await generateDeliveryNoteNumber();

  return prisma.deliveryNote.create({
    data: {
      number,
      organizationId: payload.organizationId,
      projectId: payload.projectId,
      customerId: payload.customerId,
      issuedAt: payload.issuedAt ? new Date(payload.issuedAt) : undefined,
      notes: payload.notes,
      items: {
        create: payload.items.map(item => ({
          description: item.description,
          quantity: toDecimal(item.quantity),
          deliveredQuantity: toDecimal(item.deliveredQuantity ?? item.quantity),
          unit: item.unit ?? 'Stk',
          quoteItemId: item.quoteItemId,
          metadata: item.metadata
        }))
      }
    },
    include: { items: true }
  });
};

export const updateDeliveryNoteStatus = async (
  id: string,
  status: DeliveryNoteStatus
): Promise<any> => {
  const now = status === DeliveryNoteStatus.DELIVERED ? new Date() : undefined;

  return prisma.deliveryNote.update({
    where: { id },
    data: {
      status,
      signedAt: now ?? undefined
    },
    include: { items: true }
  });
};

export const listDeliveryNotesByProject = async (
  projectId: string
): Promise<any[]> => {
  return prisma.deliveryNote.findMany({
    where: { projectId },
    orderBy: { issuedAt: 'desc' },
    include: { items: true }
  });
};

export const findDeliveryNoteById = async (
  id: string
): Promise<any | null> => {
  return prisma.deliveryNote.findUnique({ where: { id }, include: { items: true } });
};
