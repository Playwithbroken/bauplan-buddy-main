import { ErrorHandlingService } from './errorHandlingService';
import { v4 as uuidv4 } from 'uuid';

export type InventoryHealth = 'healthy' | 'warning' | 'critical';
export type ProcurementOrderStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'receiving'
  | 'completed'
  | 'cancelled';

export interface ProjectAllocation {
  projectId: string;
  projectName: string;
  quantity: number;
  eta?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: 'pcs' | 'm' | 'kg' | 'l' | 'set';
  onHand: number;
  reserved: number;
  incoming: number;
  reorderPoint: number;
  reorderQuantity: number;
  averageDailyUsage: number;
  leadTimeDays: number;
  supplierId: string;
  supplierName: string;
  storageLocation: string;
  lastUpdated: string;
  unitPrice: number;
  currency: string;
  projectAllocations: ProjectAllocation[];
  status: InventoryHealth;
}

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  onTimeDeliveryRate: number;
  averageLeadTime: number;
  qualityScore: number;
  totalSpendYtd: number;
  openOrders: number;
}

export interface ProcurementOrderLine {
  lineId: string;
  inventoryId: string;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  targetProjectId?: string;
  targetProjectName?: string;
  requestedBy: string;
  requiredDate: string;
  status: 'pending' | 'allocated' | 'received' | 'partially_received' | 'cancelled';
}

export interface ProcurementOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  createdAt: string;
  requestedBy: string;
  approvedBy?: string;
  expectedDelivery: string;
  status: ProcurementOrderStatus;
  totalAmount: number;
  currency: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId?: string;
  projectName?: string;
  costCentre?: string;
  notes?: string;
  lines: ProcurementOrderLine[];
  timeline: Array<{
    status: ProcurementOrderStatus;
    timestamp: string;
    actor: string;
    comment?: string;
  }>;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ReorderSuggestion {
  id: string;
  inventoryId: string;
  sku: string;
  name: string;
  supplierId: string;
  supplierName: string;
  currentStock: number;
  projectedDaysOfSupply: number;
  reorderQuantity: number;
  urgency: 'low' | 'medium' | 'high';
  reason: 'below_reorder_point' | 'upcoming_projects' | 'seasonal_demand' | 'supplier_lead_time';
  recommendedOrderDate: string;
  targetProjects: ProjectAllocation[];
}

export interface ProcurementKPIs {
  inventoryValue: number;
  inventoryTurns: number;
  stockouts: number;
  delayedOrders: number;
  openOrders: number;
  expiringReservations: number;
  topCategories: Array<{
    category: string;
    stock: number;
    value: number;
  }>;
  criticalItems: number;
}

interface CreateOrderInput {
  supplierId: string;
  supplierName: string;
  requestedBy: string;
  expectedDelivery: string;
  priority?: ProcurementOrder['priority'];
  projectId?: string;
  projectName?: string;
  costCentre?: string;
  notes?: string;
  lines: Array<{
    inventoryId: string;
    quantity: number;
    unitPrice?: number;
    requiredDate: string;
    requestedBy: string;
    targetProjectId?: string;
    targetProjectName?: string;
  }>;
}

type ProcurementListener = () => void;

export class ProcurementService {
  private static inventory: InventoryItem[] = [
    {
      id: 'INV-001',
      sku: 'STEEL-12MM',
      name: 'Bewehrungsstahl 12mm',
      category: 'Stahl & Bewehrung',
      unit: 'm',
      onHand: 1250,
      reserved: 420,
      incoming: 600,
      reorderPoint: 900,
      reorderQuantity: 1500,
      averageDailyUsage: 65,
      leadTimeDays: 7,
      supplierId: 'SUP-001',
      supplierName: 'Baustoff Weber GmbH',
      storageLocation: 'Lagerplatz A1',
      lastUpdated: new Date().toISOString(),
      unitPrice: 4.8,
      currency: 'EUR',
      projectAllocations: [
        {
          projectId: 'PRJ-001',
          projectName: 'Wohnquartier München',
          quantity: 380,
          eta: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
        },
        {
          projectId: 'PRJ-004',
          projectName: 'Logistikzentrum Leipzig',
          quantity: 240,
        },
      ],
      status: 'warning',
    },
    {
      id: 'INV-002',
      sku: 'CEM-42.5R',
      name: 'Zement CEM I 42,5R',
      category: 'Beton & Mörtel',
      unit: 'kg',
      onHand: 8600,
      reserved: 2200,
      incoming: 0,
      reorderPoint: 6000,
      reorderQuantity: 8000,
      averageDailyUsage: 520,
      leadTimeDays: 4,
      supplierId: 'SUP-004',
      supplierName: 'Zementwerke Süd AG',
      storageLocation: 'Silo 2',
      lastUpdated: new Date().toISOString(),
      unitPrice: 0.28,
      currency: 'EUR',
      projectAllocations: [
        {
          projectId: 'PRJ-002',
          projectName: 'Büropark Frankfurt',
          quantity: 1400,
        },
      ],
      status: 'healthy',
    },
    {
      id: 'INV-003',
      sku: 'HVAC-AHU-XL',
      name: 'Lüftungsgerät AHU-XL',
      category: 'Technische Gebäudeausrüstung',
      unit: 'set',
      onHand: 2,
      reserved: 1,
      incoming: 3,
      reorderPoint: 3,
      reorderQuantity: 4,
      averageDailyUsage: 0.1,
      leadTimeDays: 28,
      supplierId: 'SUP-009',
      supplierName: 'KlimaTech Solutions',
      storageLocation: 'Hochregal B7',
      lastUpdated: new Date().toISOString(),
      unitPrice: 18250,
      currency: 'EUR',
      projectAllocations: [
        {
          projectId: 'PRJ-005',
          projectName: 'Krankenhaus Stuttgart',
          quantity: 1,
          eta: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
        },
      ],
      status: 'critical',
    },
  ];

  private static purchaseOrders: ProcurementOrder[] = [
    {
      id: 'PO-2025-001',
      orderNumber: 'PO-2025-001',
      supplierId: 'SUP-001',
      supplierName: 'Baustoff Weber GmbH',
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      requestedBy: 'Lisa Berger',
      approvedBy: 'Max Schneider',
      expectedDelivery: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
      status: 'receiving',
      totalAmount: 7200,
      currency: 'EUR',
      priority: 'high',
      projectId: 'PRJ-001',
      projectName: 'Wohnquartier München',
      costCentre: 'CC-BAU-01',
      notes: 'Bitte Teillieferung nach Baustellenabschnitt priorisieren',
      riskLevel: 'medium',
      lines: [
        {
          lineId: 'LINE-001',
          inventoryId: 'INV-001',
          sku: 'STEEL-12MM',
          description: 'Bewehrungsstahl 12mm Stäbe',
          quantity: 1500,
          unitPrice: 4.5,
          currency: 'EUR',
          targetProjectId: 'PRJ-001',
          targetProjectName: 'Wohnquartier München',
          requestedBy: 'Lisa Berger',
          requiredDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
          status: 'partially_received',
        },
      ],
      timeline: [
        {
          status: 'submitted',
          timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
          actor: 'Lisa Berger',
          comment: 'Initiale Bestellung erstellt',
        },
        {
          status: 'approved',
          timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
          actor: 'Max Schneider',
          comment: 'Freigabe erteilt',
        },
        {
          status: 'receiving',
          timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
          actor: 'Lager Nord',
          comment: 'Teillieferung eingetroffen',
        },
      ],
    },
    {
      id: 'PO-2025-002',
      orderNumber: 'PO-2025-002',
      supplierId: 'SUP-004',
      supplierName: 'Zementwerke Süd AG',
      createdAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
      requestedBy: 'Jens Hoffmann',
      expectedDelivery: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      status: 'receiving',
      totalAmount: 2250,
      currency: 'EUR',
      priority: 'medium',
      riskLevel: 'high',
      lines: [
        {
          lineId: 'LINE-002',
          inventoryId: 'INV-002',
          sku: 'CEM-42.5R',
          description: 'Zement CEM I 42,5R',
          quantity: 7500,
          unitPrice: 0.3,
          currency: 'EUR',
          requestedBy: 'Jens Hoffmann',
          requiredDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
          status: 'pending',
        },
      ],
      timeline: [
        {
          status: 'submitted',
          timestamp: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
          actor: 'Jens Hoffmann',
        },
        {
          status: 'approved',
          timestamp: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
          actor: 'Beschaffungsteam',
        },
        {
          status: 'receiving',
          timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
          actor: 'Logistikzentrum Süd',
          comment: 'Spediteur meldet Verzögerung wegen Wetter',
        },
      ],
    },
  ];

  private static supplierPerformance: SupplierPerformance[] = [
    {
      supplierId: 'SUP-001',
      supplierName: 'Baustoff Weber GmbH',
      onTimeDeliveryRate: 0.93,
      averageLeadTime: 6,
      qualityScore: 4.6,
      totalSpendYtd: 184500,
      openOrders: 3,
    },
    {
      supplierId: 'SUP-004',
      supplierName: 'Zementwerke Süd AG',
      onTimeDeliveryRate: 0.81,
      averageLeadTime: 5,
      qualityScore: 4.2,
      totalSpendYtd: 96500,
      openOrders: 2,
    },
    {
      supplierId: 'SUP-009',
      supplierName: 'KlimaTech Solutions',
      onTimeDeliveryRate: 0.88,
      averageLeadTime: 28,
      qualityScore: 4.8,
      totalSpendYtd: 142300,
      openOrders: 1,
    },
  ];

  private static listeners: ProcurementListener[] = [];

  static getInventory(): InventoryItem[] {
    return [...this.inventory];
  }

  static getPurchaseOrders(): ProcurementOrder[] {
    return [...this.purchaseOrders];
  }

  static getSupplierPerformance(): SupplierPerformance[] {
    return [...this.supplierPerformance];
  }

  static getKPIs(): ProcurementKPIs {
    try {
      const inventoryValue = this.inventory.reduce((acc, item) => acc + (item.onHand + item.incoming) * item.unitPrice, 0);
      const annualUsage = this.inventory.reduce((acc, item) => acc + item.averageDailyUsage * 365 * item.unitPrice, 0);
      const averageInventory = this.inventory.reduce((acc, item) => acc + (item.onHand + item.incoming / 2) * item.unitPrice, 0);
      const inventoryTurns = averageInventory > 0 ? annualUsage / averageInventory : 0;

      const stockouts = this.inventory.filter((item) => item.onHand - item.reserved <= 0).length;
      const delayedOrders = this.purchaseOrders.filter((order) => order.status === 'receiving' && order.expectedDelivery < new Date().toISOString()).length;
      const openOrders = this.purchaseOrders.filter((order) => ['submitted', 'approved', 'receiving'].includes(order.status)).length;
      const expiringReservations = this.inventory
        .flatMap((item) => item.projectAllocations.map((allocation) => ({ item, allocation })))
        .filter(({ allocation }) => allocation.eta && new Date(allocation.eta) < new Date(Date.now() + 2 * 24 * 3600 * 1000))
        .length;

      const categoryAggregation = this.inventory.reduce<Record<string, { stock: number; value: number }>>((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = { stock: 0, value: 0 };
        }
        acc[item.category].stock += item.onHand;
        acc[item.category].value += item.onHand * item.unitPrice;
        return acc;
      }, {});

      const topCategories = Object.entries(categoryAggregation)
        .map(([category, data]) => ({ category, stock: data.stock, value: data.value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const criticalItems = this.inventory.filter((item) => item.status === 'critical').length;

      return {
        inventoryValue,
        inventoryTurns,
        stockouts,
        delayedOrders,
        openOrders,
        expiringReservations,
        topCategories,
        criticalItems,
      };
    } catch (error) {
      ErrorHandlingService.error('Failed to calculate procurement KPIs', error as Error, 'procurement_service');
      throw error;
    }
  }

  static getReorderSuggestions(): ReorderSuggestion[] {
    const today = new Date();
    return this.inventory
      .map((item) => {
        const available = item.onHand - item.reserved;
        const projectedDaysOfSupply = item.averageDailyUsage > 0 ? (available + item.incoming) / item.averageDailyUsage : Infinity;
        const projectedStock = available + item.incoming - item.averageDailyUsage * item.leadTimeDays;
        const belowReorderPoint = projectedStock <= item.reorderPoint;
        const upcomingProjectDemand = item.projectAllocations.some((allocation) => allocation.eta && new Date(allocation.eta) < new Date(today.getTime() + item.leadTimeDays * 24 * 3600 * 1000));

        if (!belowReorderPoint && !upcomingProjectDemand) {
          return null;
        }

        const urgency: ReorderSuggestion['urgency'] = projectedDaysOfSupply <= item.leadTimeDays ? 'high' : projectedDaysOfSupply <= item.leadTimeDays * 1.5 ? 'medium' : 'low';
        const reason: ReorderSuggestion['reason'] = belowReorderPoint ? 'below_reorder_point' : 'upcoming_projects';
        const recommendedOrderDate = new Date(today.getTime() + (projectedDaysOfSupply - item.leadTimeDays) * 24 * 3600 * 1000);

        return {
          id: `REO-${item.id}`,
          inventoryId: item.id,
          sku: item.sku,
          name: item.name,
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          currentStock: available,
          projectedDaysOfSupply,
          reorderQuantity: Math.max(item.reorderQuantity, Math.ceil(item.averageDailyUsage * item.leadTimeDays * 1.2)),
          urgency,
          reason,
          recommendedOrderDate: recommendedOrderDate.toISOString(),
          targetProjects: item.projectAllocations,
        } satisfies ReorderSuggestion;
      })
      .filter((suggestion): suggestion is ReorderSuggestion => Boolean(suggestion))
      .sort((a, b) => {
        const priority: Record<ReorderSuggestion['urgency'], number> = { high: 0, medium: 1, low: 2 };
        const urgencyDiff = priority[a.urgency] - priority[b.urgency];
        if (urgencyDiff !== 0) {
          return urgencyDiff;
        }
        return new Date(a.recommendedOrderDate).getTime() - new Date(b.recommendedOrderDate).getTime();
      });
  }

  static createPurchaseOrder(input: CreateOrderInput): ProcurementOrder {
    try {
      const orderId = uuidv4();
      const orderNumber = `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`;
      const currency = 'EUR';
      const lines: ProcurementOrderLine[] = input.lines.map((line) => {
        const inventoryItem = this.inventory.find((item) => item.id === line.inventoryId);
        if (!inventoryItem) {
          throw new Error(`Inventory item ${line.inventoryId} not found`);
        }

        return {
          lineId: uuidv4(),
          inventoryId: inventoryItem.id,
          sku: inventoryItem.sku,
          description: inventoryItem.name,
          quantity: line.quantity,
          unitPrice: line.unitPrice ?? inventoryItem.unitPrice,
          currency,
          targetProjectId: line.targetProjectId ?? inventoryItem.projectAllocations[0]?.projectId,
          targetProjectName: line.targetProjectName ?? inventoryItem.projectAllocations[0]?.projectName,
          requestedBy: line.requestedBy,
          requiredDate: line.requiredDate,
          status: 'pending',
        } satisfies ProcurementOrderLine;
      });

      const totalAmount = lines.reduce((acc, line) => acc + line.quantity * line.unitPrice, 0);

      const order: ProcurementOrder = {
        id: orderId,
        orderNumber,
        supplierId: input.supplierId,
        supplierName: input.supplierName,
        createdAt: new Date().toISOString(),
        requestedBy: input.requestedBy,
        expectedDelivery: input.expectedDelivery,
        status: 'submitted',
        totalAmount,
        currency,
        priority: input.priority ?? 'medium',
        projectId: input.projectId,
        projectName: input.projectName,
        costCentre: input.costCentre,
        notes: input.notes,
        riskLevel: 'medium',
        lines,
        timeline: [
          {
            status: 'submitted',
            timestamp: new Date().toISOString(),
            actor: input.requestedBy,
            comment: 'Bestellung angelegt',
          },
        ],
      } satisfies ProcurementOrder;

      this.purchaseOrders.unshift(order);
      this.notify();

      ErrorHandlingService.info('Purchase order created', 'procurement_service', {
        orderId,
        supplier: input.supplierName,
        totalAmount,
      });

      return order;
    } catch (error) {
      ErrorHandlingService.error('Failed to create purchase order', error as Error, 'procurement_service');
      throw error;
    }
  }

  static updateInventoryQuantity(inventoryId: string, delta: number, reason: string): InventoryItem {
    const item = this.inventory.find((inventoryItem) => inventoryItem.id === inventoryId);
    if (!item) {
      throw new Error(`Inventory item ${inventoryId} not found`);
    }

    item.onHand = Math.max(0, item.onHand + delta);
    item.lastUpdated = new Date().toISOString();

    if (item.onHand - item.reserved <= 0) {
      item.status = 'critical';
    } else if (item.onHand - item.reserved < item.reorderPoint) {
      item.status = 'warning';
    } else {
      item.status = 'healthy';
    }

    ErrorHandlingService.info('Inventory adjusted', 'procurement_service', {
      inventoryId,
      delta,
      reason,
    });

    this.notify();

    return { ...item };
  }

  static addListener(listener: ProcurementListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((registered) => registered !== listener);
    };
  }

  private static notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        ErrorHandlingService.error('Procurement listener failed', error as Error, 'procurement_service');
      }
    }
  }
}

export default ProcurementService;
