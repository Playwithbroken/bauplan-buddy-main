/**
 * Type adapters to convert between API types and legacy ProcurementService types
 * This is a temporary bridge during the migration to React Query
 */

import type { InventoryItem as ApiInventoryItem } from '@/types/procurement';
import type { InventoryItem as LegacyInventoryItem } from '@/services/procurementService';

/**
 * Convert API InventoryItem to legacy InventoryItem format
 * Used for dialogs that haven't been migrated to React Query yet
 */
export function apiToLegacyInventoryItem(item: ApiInventoryItem): LegacyInventoryItem {
  const available = item.available ?? (item.onHand - item.reserved);
  const status: LegacyInventoryItem['status'] = 
    available <= 0 ? 'critical' :
    available < item.reorderPoint ? 'warning' : 'healthy';

  return {
    id: item.id,
    sku: item.sku,
    name: item.name,
    category: item.category,
    unit: item.unit as LegacyInventoryItem['unit'],
    unitPrice: item.unitPrice,
    currency: 'EUR',
    supplierId: item.supplierId || '',
    supplierName: item.supplier?.name || 'Unknown',
    onHand: item.onHand,
    reserved: item.reserved,
    incoming: item.incoming,
    reorderPoint: item.reorderPoint,
    reorderQuantity: item.reorderQuantity,
    storageLocation: item.storageLocation || '',
    status,
    lastUpdated: item.updatedAt,
    projectAllocations: [],
    // Default values for fields not available in API yet
    averageDailyUsage: 0, // TODO: Calculate from historical data
    leadTimeDays: 0, // TODO: Get from supplier data
  };
}

/**
 * Convert legacy InventoryItem to API InventoryItem format
 * Used when submitting form data to the API
 */
export function legacyToApiInventoryItem(item: Partial<LegacyInventoryItem>): Partial<ApiInventoryItem> {
  return {
    id: item.id,
    sku: item.sku,
    name: item.name,
    description: '', // Legacy type doesn't have description
    category: item.category,
    unit: item.unit,
    unitPrice: item.unitPrice,
    supplierId: item.supplierId || undefined,
    onHand: item.onHand,
    reserved: item.reserved,
    incoming: item.incoming,
    reorderPoint: item.reorderPoint,
    reorderQuantity: item.reorderQuantity,
    storageLocation: item.storageLocation,
  };
}
