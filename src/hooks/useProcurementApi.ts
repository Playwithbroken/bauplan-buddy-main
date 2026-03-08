import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Supplier,
  InventoryItem,
  PurchaseOrder,
  GoodsReceipt,
  BudgetAllocation,
  BudgetTransaction,
  CreatePurchaseOrderPayload,
  CreateGoodsReceiptPayload,
} from '@/types/procurement';

// ==================== Query Keys ====================
export const procurementKeys = {
  all: ['procurement'] as const,
  suppliers: () => [...procurementKeys.all, 'suppliers'] as const,
  supplier: (id: string) => [...procurementKeys.suppliers(), id] as const,
  inventory: () => [...procurementKeys.all, 'inventory'] as const,
  inventoryItem: (id: string) => [...procurementKeys.inventory(), id] as const,
  purchaseOrders: () => [...procurementKeys.all, 'purchaseOrders'] as const,
  purchaseOrder: (id: string) => [...procurementKeys.purchaseOrders(), id] as const,
  goodsReceipts: () => [...procurementKeys.all, 'goodsReceipts'] as const,
  goodsReceipt: (id: string) => [...procurementKeys.goodsReceipts(), id] as const,
  budgetAllocations: () => [...procurementKeys.all, 'budgetAllocations'] as const,
  budgetAllocation: (id: string) => [...procurementKeys.budgetAllocations(), id] as const,
};

// ==================== Suppliers ====================
export function useSuppliers() {
  return useQuery({
    queryKey: procurementKeys.suppliers(),
    queryFn: () => api.get<Supplier[]>('/suppliers'),
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: procurementKeys.supplier(id),
    queryFn: () => api.get<Supplier>(`/suppliers/${id}`),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Supplier>) => api.post<Supplier>('/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.suppliers() });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) =>
      api.put<Supplier>(`/suppliers/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.supplier(variables.id) });
      queryClient.invalidateQueries({ queryKey: procurementKeys.suppliers() });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.suppliers() });
    },
  });
}

// ==================== Inventory ====================
export function useInventoryItems() {
  return useQuery({
    queryKey: procurementKeys.inventory(),
    queryFn: () => api.get<InventoryItem[]>('/inventory'),
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: procurementKeys.inventoryItem(id),
    queryFn: () => api.get<InventoryItem>(`/inventory/${id}`),
    enabled: !!id,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<InventoryItem>) => api.post<InventoryItem>('/inventory', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.inventory() });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InventoryItem> }) =>
      api.put<InventoryItem>(`/inventory/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.inventoryItem(variables.id) });
      queryClient.invalidateQueries({ queryKey: procurementKeys.inventory() });
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      id,
      adjustment,
    }: {
      id: string;
      adjustment: {
        onHandDelta?: number;
        reservedDelta?: number;
        incomingDelta?: number;
      };
    }) => api.post<InventoryItem>(`/inventory/${id}/adjust-stock`, adjustment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.inventoryItem(variables.id) });
      queryClient.invalidateQueries({ queryKey: procurementKeys.inventory() });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.inventory() });
    },
  });
}

// ==================== Purchase Orders ====================
export function usePurchaseOrders() {
  return useQuery({
    queryKey: procurementKeys.purchaseOrders(),
    queryFn: () => api.get<PurchaseOrder[]>('/purchase-orders'),
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: procurementKeys.purchaseOrder(id),
    queryFn: () => api.get<PurchaseOrder>(`/purchase-orders/${id}`),
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePurchaseOrderPayload) =>
      api.post<PurchaseOrder>('/purchase-orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.purchaseOrders() });
      queryClient.invalidateQueries({ queryKey: procurementKeys.inventory() });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PurchaseOrder> }) =>
      api.put<PurchaseOrder>(`/purchase-orders/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.purchaseOrder(variables.id) });
      queryClient.invalidateQueries({ queryKey: procurementKeys.purchaseOrders() });
    },
  });
}

export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      id,
      approval,
    }: {
      id: string;
      approval: {
        approver: string;
        approverRole: string;
        status: 'APPROVED' | 'REJECTED';
        comment?: string;
      };
    }) => api.post<PurchaseOrder>(`/purchase-orders/${id}/approve`, approval),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.purchaseOrder(variables.id) });
      queryClient.invalidateQueries({ queryKey: procurementKeys.purchaseOrders() });
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/purchase-orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.purchaseOrders() });
    },
  });
}

// ==================== Goods Receipts ====================
export function useGoodsReceipts() {
  return useQuery({
    queryKey: procurementKeys.goodsReceipts(),
    queryFn: () => api.get<GoodsReceipt[]>('/goods-receipts'),
  });
}

export function useGoodsReceipt(id: string) {
  return useQuery({
    queryKey: procurementKeys.goodsReceipt(id),
    queryFn: () => api.get<GoodsReceipt>(`/goods-receipts/${id}`),
    enabled: !!id,
  });
}

export function useCreateGoodsReceipt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateGoodsReceiptPayload) =>
      api.post<GoodsReceipt>('/goods-receipts', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.goodsReceipts() });
      queryClient.invalidateQueries({ queryKey: procurementKeys.purchaseOrder(variables.purchaseOrderId) });
      queryClient.invalidateQueries({ queryKey: procurementKeys.purchaseOrders() });
      queryClient.invalidateQueries({ queryKey: procurementKeys.inventory() });
    },
  });
}

// ==================== Budget ====================
export function useBudgetAllocations(params?: { projectId?: string; fiscalYear?: number }) {
  return useQuery({
    queryKey: [...procurementKeys.budgetAllocations(), params],
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (params?.projectId) queryParams.append('projectId', params.projectId);
      if (params?.fiscalYear) queryParams.append('fiscalYear', params.fiscalYear.toString());
      return api.get<BudgetAllocation[]>(`/budget/allocations?${queryParams.toString()}`);
    },
  });
}

export function useBudgetAllocation(id: string) {
  return useQuery({
    queryKey: procurementKeys.budgetAllocation(id),
    queryFn: () => api.get<BudgetAllocation>(`/budget/allocations/${id}`),
    enabled: !!id,
  });
}

export function useCreateBudgetAllocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<BudgetAllocation>) =>
      api.post<BudgetAllocation>('/budget/allocations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.budgetAllocations() });
    },
  });
}

export function useCreateBudgetTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<BudgetTransaction>) =>
      api.post<BudgetTransaction>('/budget/transactions', data),
    onSuccess: (_, variables) => {
      if (variables.budgetAllocationId) {
        queryClient.invalidateQueries({
          queryKey: procurementKeys.budgetAllocation(variables.budgetAllocationId),
        });
      }
      queryClient.invalidateQueries({ queryKey: procurementKeys.budgetAllocations() });
    },
  });
}

export function useBudgetSummary(fiscalYear: number) {
  return useQuery({
    queryKey: [...procurementKeys.budgetAllocations(), 'summary', fiscalYear],
    queryFn: () =>
      api.get<{
        totalBudget: number;
        totalSpent: number;
        totalCommitted: number;
        totalAvailable: number;
      }>(`/budget/summary/${fiscalYear}`),
    enabled: !!fiscalYear,
  });
}

export function useBudgetByCategory(fiscalYear: number) {
  return useQuery({
    queryKey: [...procurementKeys.budgetAllocations(), 'by-category', fiscalYear],
    queryFn: () =>
      api.get<
        Array<{
          category: string;
          budget: number;
          spent: number;
          committed: number;
        }>
      >(`/budget/by-category/${fiscalYear}`),
    enabled: !!fiscalYear,
  });
}
