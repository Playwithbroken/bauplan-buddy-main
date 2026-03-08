import { PrismaClient } from './generated';

let prisma: PrismaClient | null = null;

export const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

// Explicit exports to avoid invisibility in workspace
export { DeliveryNoteStatus, QuoteStatus, ProjectStatus, InvoiceStatus, Prisma } from './generated';
export type { PrismaClient } from './generated';
export * from './generated';
