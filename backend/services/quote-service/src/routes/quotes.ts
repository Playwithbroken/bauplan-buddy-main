import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { ConversionJob } from '@bauplan/common';
import { getPrismaClient, Prisma, Project, ProjectStatus, QuoteStatus } from '@bauplan/database';
import { enqueueEvent } from '../messaging/outbox';
import { findQuoteById, markQuoteConverted } from '../repositories/quoteRepository';

type QuoteWithItems = any;
import { OrganizationRequest } from '../middleware/organization';

interface ConversionJobRecord extends ConversionJob {
  quoteId: string;
  options: Record<string, unknown>;
}

const router: Router = Router();
const conversionJobs = new Map<string, ConversionJobRecord>();
const db = getPrismaClient();

const toDecimal = (value?: number) => {
  if (value === undefined || Number.isNaN(value)) {
    return undefined;
  }
  return new Prisma.Decimal(value);
};

const parseStartDate = (options: Record<string, unknown>): Date | undefined => {
  const candidate = options.requestedStartDate ?? options.startDate;
  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return undefined;
};

const deriveProjectName = (quote: QuoteWithItems): string => {
  if (quote.items.length > 0) {
    const headline = quote.items[0]?.description?.trim();
    if (headline) {
      return headline.slice(0, 120);
    }
  }
  return `Projekt ${quote.number}`;
};

const generateProjectNumber = async (): Promise<string> => {
  const count = await db.project.count();
  const sequence = String(count + 1).padStart(4, '0');
  return `PRJ-${new Date().getFullYear()}-${sequence}`;
};

const ensureProjectForQuote = async (
  quote: QuoteWithItems,
  job: ConversionJobRecord,
  organizationId: string
): Promise<Project | null> => {
  const existing = await db.project.findFirst({ where: { quoteId: quote.id } });
  if (existing) {
    return existing;
  }

  const number = await generateProjectNumber();
  const startDate = parseStartDate(job.options);
  const budget = Number(quote.totalAmount ?? 0);

  const status = quote.status === QuoteStatus.APPROVED ? ProjectStatus.ACTIVE : ProjectStatus.PLANNING;

  return db.project.create({
    data: {
      number,
      quoteId: quote.id,
      customerId: quote.customerId,
      name: deriveProjectName(quote),
      budget: toDecimal(budget),
      startDate: startDate ?? undefined,
      status,
      organizationId
    } as any
  });
};

const buildJob = (quoteId: string, options: Record<string, unknown>): ConversionJobRecord => {
  const now = new Date().toISOString();
  return {
    jobId: crypto.randomUUID(),
    status: 'queued',
    projectId: undefined,
    createdAt: now,
    updatedAt: now,
    quoteId,
    options
  };
};

const scheduleCompletion = (job: ConversionJobRecord, quote: QuoteWithItems, tenantId: string) => {
  const queuedJob = conversionJobs.get(job.jobId);
  if (queuedJob) {
    queuedJob.status = 'running';
    queuedJob.updatedAt = new Date().toISOString();
    conversionJobs.set(queuedJob.jobId, queuedJob);
  }

  setTimeout(async () => {
    const record = conversionJobs.get(job.jobId);
    if (!record || record.status === 'failed') {
      return;
    }

    try {
      const project = await ensureProjectForQuote(quote, record, tenantId);
      if (project) {
        record.projectId = project.id;
      }
      record.status = 'completed';
      record.updatedAt = new Date().toISOString();
      conversionJobs.set(record.jobId, record);

      await markQuoteConverted(record.quoteId, tenantId).catch(error => {
        console.error('Failed to mark quote converted', error);
      });

      await enqueueEvent('quotes.conversion.completed', {
        jobId: record.jobId,
        quoteId: record.quoteId,
        projectId: record.projectId,
        occurredAt: record.updatedAt
      }).catch(error => {
        console.error('Failed to enqueue conversion completed event', error);
      });
    } catch (error) {
      console.error('Conversion job failed', error);
      record.status = 'failed';
      record.updatedAt = new Date().toISOString();
      conversionJobs.set(record.jobId, record);
    }
  }, 500);
};

router.post('/:quoteId/convert', async (req: OrganizationRequest, res: Response) => {
  const { quoteId } = req.params;
  const { requestedStartDate, templateId, options } = req.body ?? {};

  if (!quoteId) {
    return res.status(400).json({ error: 'quoteId is required' });
  }

  const tenantId = req.tenantId!;
  const quote = await findQuoteById(quoteId, tenantId);
  if (!quote) {
    return res.status(404).json({ error: 'Quote not found' });
  }

  const jobOptions: Record<string, unknown> = {
    requestedStartDate,
    templateId,
    ...(options ?? {})
  };

  const job = buildJob(quoteId, jobOptions);
  conversionJobs.set(job.jobId, job);
  scheduleCompletion(job, quote, tenantId);

  await enqueueEvent('quotes.conversion.requested', {
    jobId: job.jobId,
    quoteId,
    requestedStartDate,
    templateId,
    quoteStatus: (quote as any).status
  }).catch(error => {
    console.error('Failed to enqueue conversion requested event', error);
  });

  return res.status(202).json({
    data: {
      jobId: job.jobId,
      status: job.status,
      createdAt: job.createdAt
    }
  });
});

router.get('/conversion-jobs/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = conversionJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Conversion job not found' });
  }

  const { quoteId, options, ...publicJob } = job;
  return res.status(200).json({ data: publicJob });
});

export default router;
