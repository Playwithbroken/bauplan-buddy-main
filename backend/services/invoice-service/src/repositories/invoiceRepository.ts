// @ts-nocheck
import { Prisma, InvoiceStatus, Invoice, InvoiceItem, getPrismaClient } from '@bauplan/database';

const prisma = getPrismaClient();

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  unit?: string;
  quoteItemId?: string;
  deliveryNoteItemId?: string;
  metadata?: any;
}

export interface CreateInvoicePayload {
  organizationId: string;
  projectId: string;
  customerId: string;
  issueDate: string;
  dueDate: string;
  currency?: string;
  status?: InvoiceStatus;
  lineItems: InvoiceLineInput[];
}

const toDecimal = (value: number): Prisma.Decimal => new Prisma.Decimal(value ?? 0);

const calculateTotals = (lines: InvoiceLineInput[]) => {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const tax = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (line.taxRate / 100), 0);
  return {
    subtotal: new Prisma.Decimal(subtotal),
    tax: new Prisma.Decimal(tax),
    total: new Prisma.Decimal(subtotal + tax)
  };
};

export const generateInvoiceNumber = async (): Promise<string> => {
  const count = await prisma.invoice.count();
  return `RG-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

export const createInvoice = async (
  payload: CreateInvoicePayload
): Promise<any> => {
  const number = await generateInvoiceNumber();
  const totals = calculateTotals(payload.lineItems);

  return prisma.invoice.create({
    data: {
      number,
      organizationId: payload.organizationId,
      projectId: payload.projectId,
      customerId: payload.customerId,
      status: payload.status ?? InvoiceStatus.DRAFT,
      issueDate: new Date(payload.issueDate),
      dueDate: new Date(payload.dueDate),
      currency: payload.currency ?? 'EUR',
      subtotalAmount: totals.subtotal,
      taxAmount: totals.tax,
      totalAmount: totals.total,
      items: {
        create: payload.lineItems.map(line => ({
          description: line.description,
          quantity: toDecimal(line.quantity),
          unit: line.unit ?? 'Stk',
          unitPrice: toDecimal(line.unitPrice),
          taxRate: toDecimal(line.taxRate),
          quoteItemId: line.quoteItemId,
          deliveryNoteItemId: line.deliveryNoteItemId,
          metadata: line.metadata
        }))
      }
    } as any,
    include: { items: true }
  });
};

export const listInvoicesByProject = async (
  projectId: string
): Promise<any[]> => {
  return prisma.invoice.findMany({
    where: { projectId },
    orderBy: { issueDate: 'desc' },
    include: { items: true }
  });
};

export const findInvoiceById = async (
  id: string
): Promise<any | null> => {
  return prisma.invoice.findUnique({ where: { id }, include: { items: true } });
};
