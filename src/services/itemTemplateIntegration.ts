/**
 * Integration Helper for Item Templates
 * Provides utility functions to integrate item templates into existing forms
 */

import { ItemTemplate } from './itemTemplateService';

export interface QuotePosition {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface DeliveryNoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  articleNumber?: string;
}

export interface CostEntry {
  id: string;
  description: string;
  amount: number;
  category: string;
  unit?: string;
  quantity?: number;
}

/**
 * Convert ItemTemplate to QuotePosition
 */
export function templateToQuotePosition(template: ItemTemplate, quantity: number = 1): QuotePosition {
  return {
    id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    description: template.description || template.name,
    quantity,
    unit: template.unit,
    unitPrice: template.unitPrice,
    total: template.unitPrice * quantity,
    category: template.category,
  };
}

/**
 * Convert ItemTemplate to InvoiceLineItem
 */
export function templateToInvoiceLineItem(template: ItemTemplate, quantity: number = 1): InvoiceLineItem {
  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    description: template.description || template.name,
    quantity,
    unit: template.unit,
    unitPrice: template.unitPrice,
    taxRate: template.taxRate,
    total: template.unitPrice * quantity,
  };
}

/**
 * Convert ItemTemplate to DeliveryNoteItem
 */
export function templateToDeliveryNoteItem(template: ItemTemplate, quantity: number = 1): DeliveryNoteItem {
  return {
    id: `dn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    description: template.description || template.name,
    quantity,
    unit: template.unit,
    articleNumber: template.articleNumber,
  };
}

/**
 * Convert ItemTemplate to CostEntry
 */
export function templateToCostEntry(template: ItemTemplate, quantity: number = 1): CostEntry {
  return {
    id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    description: template.description || template.name,
    amount: template.unitPrice * quantity,
    category: template.category,
    unit: template.unit,
    quantity,
  };
}

/**
 * Batch convert multiple templates
 */
export function batchConvertTemplates<T>(
  templates: ItemTemplate[],
  converter: (template: ItemTemplate, quantity: number) => T,
  defaultQuantity: number = 1
): T[] {
  return templates.map(template => converter(template, defaultQuantity));
}
