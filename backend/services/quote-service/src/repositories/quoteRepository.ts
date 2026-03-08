// @ts-nocheck
import { getPrismaClient, QuoteStatus } from '@bauplan/database';

const prisma = getPrismaClient();

export const findQuoteById = async (id: string, organizationId: string): Promise<any | null> => {
  return prisma.quote.findFirst({
    where: { 
      id,
      organizationId 
    },
    include: { items: true }
  });
};

export const markQuoteConverted = async (id: string, organizationId: string): Promise<void> => {
  await prisma.quote.updateMany({
    where: { 
      id,
      organizationId 
    },
    data: {
      status: QuoteStatus.CONVERTED
    }
  });
};
