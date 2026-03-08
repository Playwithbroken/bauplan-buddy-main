import { Router, Response } from 'express';
import { organizationContext, OrganizationRequest } from '../middleware/organization';
import { getPrismaClient, InvoiceStatus, Prisma } from '@bauplan/database';

const router: Router = Router();
const db = getPrismaClient();

const generateInvoiceNumber = async (): Promise<string> => {
  const count = await db.invoice.count();
  return `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
};

// List all invoices
router.get('/', async (req: OrganizationRequest, res: Response) => {
  try {
    const { status, projectId, customerId } = req.query;
    const organizationId = req.tenantId!;
    const filters: any = { organizationId };

    if (status && Object.values(InvoiceStatus).includes(status as any)) {
      filters.status = status as InvoiceStatus;
    }
    if (projectId) filters.projectId = projectId;
    if (customerId) filters.customerId = customerId;

    const invoices = await db.invoice.findMany({
      where: filters,
      include: {
        project: { select: { id: true, name: true, number: true } },
        items: true
      },
      orderBy: { issueDate: 'desc' }
    });

    res.json({ data: invoices });
  } catch (error) {
    console.error('Failed to fetch invoices', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get single invoice
router.get('/:id', async (req: OrganizationRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.tenantId!;
    const invoice = await db.invoice.findUnique({
      where: { id, organizationId },
      include: {
        project: true,
        items: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ data: invoice });
  } catch (error) {
    console.error('Failed to fetch invoice', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Create invoice
router.post('/', async (req: OrganizationRequest, res: Response) => {
  try {
    const { projectId, customerId, issueDate, dueDate, items, currency = 'EUR' } = req.body;
    const organizationId = req.tenantId!;

    if (!projectId || !customerId || !issueDate || !dueDate || !items || items.length === 0) {
      return res.status(400).json({ error: 'ProjectId, customerId, issueDate, dueDate, and items are required' });
    }

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const number = await generateInvoiceNumber();

    let subtotal = new Prisma.Decimal(0);
    let taxAmount = new Prisma.Decimal(0);

    const invoiceItems = items.map((item: { description: string; quantity: number; unit: string; unitPrice: number; taxRate: number }) => {
      const lineAmount = new Prisma.Decimal(item.quantity).times(item.unitPrice);
      const lineTax = lineAmount.times(new Prisma.Decimal(item.taxRate).dividedBy(100));
      subtotal = subtotal.plus(lineAmount);
      taxAmount = taxAmount.plus(lineTax);

      return {
        description: item.description,
        quantity: new Prisma.Decimal(item.quantity),
        unit: item.unit,
        unitPrice: new Prisma.Decimal(item.unitPrice),
        taxRate: new Prisma.Decimal(item.taxRate)
      };
    });

    const totalAmount = subtotal.plus(taxAmount);

    const invoice = await db.invoice.create({
      data: {
        number,
        projectId,
        customerId,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        currency,
        subtotalAmount: subtotal,
        taxAmount,
        totalAmount,
        items: { create: invoiceItems },
        organizationId
      },
      include: { items: true, project: true }
    });

    res.status(201).json({ data: invoice });
  } catch (error) {
    console.error('Failed to create invoice', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Update invoice status
router.patch('/:id/status', async (req: OrganizationRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.tenantId!;
    const { status } = req.body;

    if (!Object.values(InvoiceStatus).includes(status as any)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const invoice = await db.invoice.update({
      where: { id, organizationId },
      data: { status: status as InvoiceStatus },
      include: { items: true }
    });

    res.json({ data: invoice });
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    console.error('Failed to update invoice', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// Get invoice summary
router.get('/:id/summary', async (req: OrganizationRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.tenantId!;
    const invoice = await db.invoice.findUnique({
      where: { id, organizationId },
      include: { items: true }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({
      data: {
        invoiceNumber: invoice.number,
        projectId: invoice.projectId,
        customerId: invoice.customerId,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        itemCount: invoice.items.length,
        subtotal: invoice.subtotalAmount,
        tax: invoice.taxAmount,
        total: invoice.totalAmount,
        currency: invoice.currency
      }
    });
  } catch (error) {
    console.error('Failed to fetch invoice summary', error);
    res.status(500).json({ error: 'Failed to fetch invoice summary' });
  }
});

export default router;
