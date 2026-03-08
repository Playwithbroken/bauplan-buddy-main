// ==================== Enums ====================
export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ORDERED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export type PurchaseOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type GoodsReceiptStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';

export type QualityCheckStatus = 'PENDING' | 'PASSED' | 'FAILED';

export type BudgetTransactionType =
  | 'ALLOCATION'
  | 'COMMITMENT'
  | 'EXPENSE'
  | 'ADJUSTMENT'
  | 'RELEASE';

// ==================== Models ====================
export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  status: SupplierStatus;
  onTimeDeliveryRate?: number;
  qualityScore?: number;
  totalSpendYtd?: number;
  certifications?: string[];
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  unitPrice: number;
  supplierId?: string;
  onHand: number;
  reserved: number;
  incoming: number;
  available?: number; // Calculated field: onHand - reserved
  reorderPoint: number;
  reorderQuantity: number;
  storageLocation?: string;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
}

export interface PurchaseOrderLine {
  id: string;
  purchaseOrderId: string;
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  requiredDate?: string;
  receivedQuantity: number;
  notes?: string;
  inventoryItem?: InventoryItem;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  projectId?: string;
  status: PurchaseOrderStatus;
  priority: PurchaseOrderPriority;
  costCenter?: string;
  orderDate: string;
  expectedDate?: string;
  totalAmount: number;
  currency: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  lines?: PurchaseOrderLine[];
  approvals?: PurchaseOrderApproval[];
}

export interface PurchaseOrderApproval {
  id: string;
  purchaseOrderId: string;
  approver: string;
  approverRole: string;
  status: ApprovalStatus;
  comment?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptLine {
  id: string;
  goodsReceiptId: string;
  purchaseOrderLineId: string;
  inventoryItemId: string;
  receivedQuantity: number;
  qualityCheck: QualityCheckStatus;
  notes?: string;
  inventoryItem?: InventoryItem;
}

export interface GoodsReceipt {
  id: string;
  number: string;
  purchaseOrderId: string;
  receiptDate: string;
  receivedBy: string;
  status: GoodsReceiptStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  purchaseOrder?: PurchaseOrder;
  lines?: GoodsReceiptLine[];
}

export interface BudgetTransaction {
  id: string;
  budgetAllocationId: string;
  transactionType: BudgetTransactionType;
  amount: number;
  description: string;
  referenceNumber?: string;
  transactionDate: string;
  createdAt: string;
}

export interface BudgetAllocation {
  id: string;
  projectId: string;
  projectName: string;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  committedAmount: number;
  availableAmount?: number; // Calculated field
  fiscalYear: number;
  costCenter?: string;
  createdAt: string;
  updatedAt: string;
  transactions?: BudgetTransaction[];
}

// ==================== Payloads ====================
export interface CreatePurchaseOrderPayload {
  supplierId: string;
  projectId?: string;
  priority?: PurchaseOrderPriority;
  costCenter?: string;
  expectedDate?: string;
  notes?: string;
  lines: Array<{
    inventoryItemId: string;
    quantity: number;
    unitPrice: number;
    requiredDate?: string;
    notes?: string;
  }>;
}

export interface CreateGoodsReceiptPayload {
  purchaseOrderId: string;
  receivedBy: string;
  notes?: string;
  lines: Array<{
    purchaseOrderLineId: string;
    inventoryItemId: string;
    receivedQuantity: number;
    qualityCheck: QualityCheckStatus;
    notes?: string;
  }>;
}
