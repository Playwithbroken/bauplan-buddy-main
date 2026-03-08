import ProcurementService from '@/services/procurementService';
import { apiToLegacyInventoryItem } from './procurementTypeAdapter';

export function seedProcurementDemo() {
  // Do not override if data already exist
  if (ProcurementService.getInventory().length || ProcurementService.getPurchaseOrders().length) {
    return;
  }

  const seedSuppliers = [
    {
      supplierId: 'SUP-DEMO-001',
      supplierName: 'Meyer Baustoffe GmbH',
      onTimeDeliveryRate: 0.92,
      averageLeadTime: 5,
      qualityScore: 4.6,
      totalSpendYtd: 125000,
      openOrders: 2,
    },
    {
      supplierId: 'SUP-DEMO-002',
      supplierName: 'Schmidt Stahlhandel',
      onTimeDeliveryRate: 0.88,
      averageLeadTime: 8,
      qualityScore: 4.3,
      totalSpendYtd: 98000,
      openOrders: 1,
    },
  ];

  const seedInventory = [
    {
      id: 'INV-DEMO-001',
      sku: 'ST-1000',
      name: 'Baustahl B500',
      category: 'Stahl',
      unit: 'kg',
      onHand: 12000,
      reserved: 2500,
      incoming: 4000,
      reorderPoint: 8000,
      reorderQuantity: 5000,
      averageDailyUsage: 450,
      leadTimeDays: 7,
      supplierId: 'SUP-DEMO-002',
      supplierName: 'Schmidt Stahlhandel',
      storageLocation: 'Lager Nord / FH-12',
      lastUpdated: new Date().toISOString(),
      unitPrice: 1.25,
      currency: 'EUR',
      projectAllocations: [
        { projectId: 'PRJ-2024-001', projectName: 'Wohnhaus München', quantity: 4000 },
      ],
      status: 'warning',
    },
    {
      id: 'INV-DEMO-002',
      sku: 'BT-2001',
      name: 'Transportbeton C25/30',
      category: 'Beton',
      unit: 'm',
      onHand: 180,
      reserved: 40,
      incoming: 60,
      reorderPoint: 120,
      reorderQuantity: 80,
      averageDailyUsage: 30,
      leadTimeDays: 3,
      supplierId: 'SUP-DEMO-001',
      supplierName: 'Meyer Baustoffe GmbH',
      storageLocation: 'Mischwerk Süd',
      lastUpdated: new Date().toISOString(),
      unitPrice: 95,
      currency: 'EUR',
      projectAllocations: [
        { projectId: 'PRJ-2024-002', projectName: 'Bürogebäude Berlin', quantity: 80 },
      ],
      status: 'healthy',
    },
  ];

  const seedOrders = [
    {
      id: 'PO-DEMO-001',
      orderNumber: 'PO-2024-101',
      supplierId: 'SUP-DEMO-001',
      supplierName: 'Meyer Baustoffe GmbH',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      requestedBy: 'Einkaufsteam',
      approvedBy: 'Projektleiter',
      expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'submitted' as const,
      totalAmount: 9500,
      currency: 'EUR',
      priority: 'medium' as const,
      projectId: 'PRJ-2024-002',
      projectName: 'Bürogebäude Berlin',
      costCentre: 'CC-2001',
      notes: 'Automatischer Seed-Auftrag',
      lines: [
        {
          lineId: 'POL-DEMO-001',
          inventoryId: 'INV-DEMO-002',
          sku: 'BT-2001',
          description: 'Transportbeton C25/30',
          quantity: 100,
          unitPrice: 95,
          currency: 'EUR',
          targetProjectId: 'PRJ-2024-002',
          targetProjectName: 'Bürogebäude Berlin',
          requestedBy: 'Einkaufsteam',
          requiredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending' as const,
        },
      ],
      timeline: [
        { status: 'submitted' as const, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), actor: 'Einkaufsteam' },
      ],
      riskLevel: 'low' as const,
    },
  ];

  // Bypass private fields via runtime mutation
  const svc = ProcurementService as any;
  svc.inventory = seedInventory;
  svc.purchaseOrders = seedOrders;
  svc.supplierPerformance = seedSuppliers;
  svc.notify?.();
}
