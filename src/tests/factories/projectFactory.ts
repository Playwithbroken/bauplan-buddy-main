import { randomUUID } from 'crypto';
import type { TestProject, TestQuote } from './types';

export interface ProjectFactoryOptions {
  quote?: TestQuote;
  number?: string;
  name?: string;
  status?: string;
  budget?: number;
}

export const buildProject = (
  overrides: ProjectFactoryOptions = {}
): TestProject => {
  const quote = overrides.quote ?? undefined;
  const budget =
    overrides.budget ??
    (quote
      ? quote.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        )
      : 100_000);

  return {
    id: randomUUID(),
    number: overrides.number ?? 'PRJ-TEST-0001',
    quoteId: quote?.id ?? randomUUID(),
    customerId: quote?.customerId ?? 'cust-test-001',
    name: overrides.name ?? 'Testprojekt Bauplan Buddy',
    status: overrides.status ?? 'ACTIVE',
    budget
  };
};
