import { Router, Response } from 'express';
import { organizationContext, OrganizationRequest } from '../middleware/organization';
import { getPrismaClient, DeliveryNoteStatus, Prisma } from '@bauplan/database';

const router: Router = Router();
const db = getPrismaClient();

const generateDeliveryNoteNumber = async (): Promise<string> => {
  const count = await db.deliveryNote.count();
  return `DN-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
};

// List all delivery notes
router.get('/', async (req: OrganizationRequest, res: Response) => {
  try {
    const { status, projectId, customerId } = req.query;
    const organizationId = req.tenantId!;
    const filters: any = { organizationId };

    if (status && Object.values(DeliveryNoteStatus).includes(status as any)) {
      filters.status = status as DeliveryNoteStatus;
    }
    if (projectId) filters.projectId = projectId;
    if (customerId) filters.customerId = customerId;

    const notes = await db.deliveryNote.findMany({
      where: filters,
      include: {
        project: { select: { id: true, name: true, number: true } },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: notes });
  } catch (error) {
    console.error('Failed to fetch delivery notes', error);
    res.status(500).json({ error: 'Failed to fetch delivery notes' });
  }
});

// Get single delivery note
router.get('/:id', async (req: OrganizationRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.tenantId!;
    const note = await db.deliveryNote.findUnique({
      where: { id, organizationId },
      include: {
        project: true,
        items: true
      }
    });

    if (!note) {
      return res.status(404).json({ error: 'Delivery note not found' });
    }

    res.json({ data: note });
  } catch (error) {
    console.error('Failed to fetch delivery note', error);
    res.status(500).json({ error: 'Failed to fetch delivery note' });
  }
});

// Create delivery note
router.post('/', async (req: OrganizationRequest, res: Response) => {
  try {
    const { projectId, customerId, notes, items } = req.body;
    const organizationId = req.tenantId!;

    if (!projectId || !customerId || !items || items.length === 0) {
      return res.status(400).json({ error: 'ProjectId, customerId, and items are required' });
    }

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const number = await generateDeliveryNoteNumber();

    const note = await db.deliveryNote.create({
      data: {
        number,
        projectId,
        customerId,
        notes: notes || null,
        organizationId,
        items: {
          create: items.map((item: { quoteItemId?: string; description: string; quantity: number; unit: string }) => ({
            quoteItemId: item.quoteItemId || null,
            description: item.description,
            quantity: new Prisma.Decimal(item.quantity),
            deliveredQuantity: new Prisma.Decimal(item.quantity),
            unit: item.unit
          }))
        }
      },
      include: { items: true, project: true }
    });

    res.status(201).json({ data: note });
  } catch (error) {
    console.error('Failed to create delivery note', error);
    res.status(500).json({ error: 'Failed to create delivery note' });
  }
});

// Update delivery note status
router.patch('/:id/status', async (req: OrganizationRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.tenantId!;
    const { status } = req.body;

    if (!Object.values(DeliveryNoteStatus).includes(status as any)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const note = await db.deliveryNote.update({
      where: { id, organizationId },
      data: {
        status: status as DeliveryNoteStatus,
        signedAt: (status as any) === DeliveryNoteStatus.DELIVERED ? new Date() : null
      },
      include: { items: true }
    });

    res.json({ data: note });
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Delivery note not found' });
    }
    console.error('Failed to update delivery note', error);
    res.status(500).json({ error: 'Failed to update delivery note' });
  }
});

// Update delivery note item
router.patch('/:id/items/:itemId', async (req: OrganizationRequest, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const organizationId = req.tenantId!;
    const { deliveredQuantity } = req.body;

    if (deliveredQuantity === undefined) {
      return res.status(400).json({ error: 'DeliveredQuantity is required' });
    }

    const item = await db.deliveryNoteItem.update({
      where: { id: itemId },
      data: { deliveredQuantity: new Prisma.Decimal(deliveredQuantity) }
    });

    res.json({ data: item });
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Delivery note item not found' });
    }
    console.error('Failed to update delivery note item', error);
    res.status(500).json({ error: 'Failed to update delivery note item' });
  }
});

export default router;
