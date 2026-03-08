import { Router, Response } from 'express';
import { organizationContext, OrganizationRequest } from '../middleware/organization';
import { getPrismaClient, ProjectStatus, Prisma } from '@bauplan/database';

const router: Router = Router();
const db = getPrismaClient();

const generateProjectNumber = async (): Promise<string> => {
  const count = await db.project.count();
  return `PRJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

// List all projects
router.get('/', async (req: OrganizationRequest, res: Response) => {
  try {
    const { status, customerId, search } = req.query;
    const organizationId = req.tenantId!;
    const filters: Record<string, any> = { organizationId };

    if (status && (Object.values(ProjectStatus) as string[]).includes(status as string)) {
      filters.status = status;
    }
    if (customerId) filters.customerId = customerId;

    if (search && typeof search === 'string') {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { number: { contains: search, mode: 'insensitive' } }
      ];
    }

    const projects = await db.project.findMany({
      where: filters as Record<string, unknown>,
      include: {
        deliveryNotes: { select: { id: true } },
        invoices: { select: { id: true, totalAmount: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: projects });
  } catch (error) {
    console.error('Failed to fetch projects', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:id', async (req: OrganizationRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.tenantId!;
    const project = await db.project.findUnique({
      where: { id, organizationId },
      include: {
        quote: { include: { items: true } },
        deliveryNotes: { include: { items: true } },
        invoices: { include: { items: true } }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ data: project });
  } catch (error) {
    console.error('Failed to fetch project', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', async (req: OrganizationRequest, res: Response) => {
  try {
    const { quoteId, customerId, name, budget, startDate, status = 'PLANNING' } = req.body;
    const organizationId = req.tenantId!;

    if (!customerId || !name) {
      return res.status(400).json({ error: 'CustomerId and name are required' });
    }

    const number = await generateProjectNumber();

    const project = await db.project.create({
      data: {
        number,
        quoteId: quoteId || null,
        customerId,
        name,
        status: status as ProjectStatus,
        budget: budget ? new Prisma.Decimal(budget) : null,
        startDate: startDate ? new Date(startDate) : null,
        organizationId
      } as any
    });

    res.status(201).json({ data: project });
  } catch (error) {
    console.error('Failed to create project', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.patch('/:id', async (req: OrganizationRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.tenantId!;
    const updateData: Record<string, unknown> = {};

    if (req.body.name) updateData.name = req.body.name;
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.budget) updateData.budget = new Prisma.Decimal(req.body.budget);
    if (req.body.startDate) updateData.startDate = new Date(req.body.startDate);
    if (req.body.endDate) updateData.endDate = new Date(req.body.endDate);

    const project = await db.project.update({
      where: { id, organizationId },
      data: updateData
    });

    res.json({ data: project });
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' });
    }
    console.error('Failed to update project', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req: OrganizationRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.tenantId!;
    await db.project.delete({ where: { id, organizationId } });
    res.status(204).send();
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' });
    }
    console.error('Failed to delete project', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
