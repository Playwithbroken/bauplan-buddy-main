import { invoicesApi, Invoice, CreateInvoiceInput, UpdateInvoiceInput } from './api/invoices.api';
import { offlineSync } from './offlineSyncService';
import { db } from './localDatabaseService';
import { getEnvVar, isProduction } from '@/utils/env';

const USE_API = getEnvVar('VITE_USE_API') === 'true' || isProduction();

export class InvoiceService {
  /**
   * Get all invoices
   */
  static async getAll(params?: { status?: string; search?: string }): Promise<Invoice[]> {
    if (USE_API && navigator.onLine) {
      try {
        const invoices = await invoicesApi.getAll(params);
        
        // Update local Dexie cache
        for (const inv of invoices) {
          await db.invoices.put({
            ...inv,
            updatedAt: inv.updatedAt || new Date().toISOString()
          });
        }
        
        return invoices;
      } catch (error) {
        console.warn('API call failed, falling back to local database:', error);
      }
    }
    
    // Fallback to Dexie
    let collection = db.invoices.toCollection();
    
    if (params?.status && params.status !== 'all') {
      collection = db.invoices.where('status').equals(params.status);
    }
    
    let localInvoices = await collection.toArray();
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      localInvoices = localInvoices.filter(i => 
        i.number.toLowerCase().includes(search) || 
        i.customerName.toLowerCase().includes(search) ||
        i.projectName?.toLowerCase().includes(search)
      );
    }
    
    return localInvoices;
  }

  /**
   * Get invoice by ID
   */
  static async getById(id: string): Promise<Invoice | null> {
    if (USE_API && navigator.onLine) {
      try {
        const invoice = await invoicesApi.getById(id);
        await db.invoices.put(invoice);
        return invoice;
      } catch (error) {
        console.warn('API call failed, falling back to local database:', error);
      }
    }
    
    return db.invoices.get(id);
  }

  /**
   * Create new invoice
   */
  static async create(data: CreateInvoiceInput): Promise<Invoice> {
    const id = `RE-${Date.now()}`;
    const now = new Date().toISOString();
    
    const invoice: Invoice = {
      ...data,
      id,
      number: id,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      positions: data.positions.map((p, index) => ({
        ...p,
        id: `${index + 1}`,
      }))
    } as Invoice;

    // Save to local database immediately
    await db.invoices.put(invoice);
    
    // Queue for sync
    await offlineSync.queueAction('invoices', 'create', invoice);

    return invoice;
  }

  /**
   * Update invoice
   */
  static async update(id: string, data: UpdateInvoiceInput): Promise<Invoice | null> {
    const existing = await db.invoices.get(id);
    if (!existing) return null;

    const updated: Invoice = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    };

    await db.invoices.put(updated);
    
    // Queue for sync
    await offlineSync.queueAction('invoices', 'update', updated, id);

    return updated;
  }

  /**
   * Delete invoice
   */
  static async delete(id: string): Promise<boolean> {
    const existing = await db.invoices.get(id);
    if (!existing) return false;

    await db.invoices.delete(id);

    // Queue for sync
    await offlineSync.queueAction('invoices', 'delete', existing, id);

    return true;
  }

  /**
   * Mark invoice as paid
   */
  static async markPaid(id: string, paidDate: string): Promise<Invoice | null> {
    const existing = await db.invoices.get(id);
    if (!existing) return null;

    const updated: Invoice = {
      ...existing,
      status: 'paid',
      paidDate,
      updatedAt: new Date().toISOString()
    };

    await db.invoices.put(updated);
    
    if (navigator.onLine) {
      try {
        return await invoicesApi.markPaid(id, paidDate);
      } catch (error) {
        console.warn('API markPaid failed, queued for sync');
      }
    }

    await offlineSync.queueAction('invoices', 'update', updated, id);
    return updated;
  }

  /**
   * Send invoice to customer
   */
  static async send(id: string, email: string): Promise<void> {
    if (navigator.onLine) {
      return invoicesApi.send(id, email);
    }
    
    await offlineSync.queueAction('invoices', 'update', { status: 'sent', sentTo: email }, id);
  }

  /**
   * Generate PDF
   */
  static async generatePdf(id: string): Promise<Blob | null> {
    if (navigator.onLine) {
      return invoicesApi.generatePdf(id);
    }
    
    // PDF generation typically requires backend or heavy client-side lib
    // For offline, we might show a placeholder or alert
    throw new Error('PDF Generation requires online connection');
  }
}
