import { quotesApi, Quote, CreateQuoteInput, UpdateQuoteInput } from './api/quotes.api';
import { offlineSync } from './offlineSyncService';
import { db } from './localDatabaseService';
import { getEnvVar, isProduction } from '@/utils/env';

const USE_API = getEnvVar('VITE_USE_API') === 'true' || isProduction();

export class QuoteService {
  /**
   * Get all quotes
   */
  static async getAll(params?: { status?: string; search?: string }): Promise<Quote[]> {
    if (USE_API && navigator.onLine) {
      try {
        const quotes = await quotesApi.getAll(params);
        
        // Update local Dexie cache
        for (const quote of quotes) {
          await db.quotes.put({
            ...quote,
            updatedAt: quote.updatedAt || new Date().toISOString()
          });
        }
        
        return quotes;
      } catch (error) {
        console.warn('API call failed, falling back to local database:', error);
      }
    }
    
    // Fallback to Dexie
    let collection = db.quotes.toCollection();
    
    if (params?.status && params.status !== 'all') {
      collection = db.quotes.where('status').equals(params.status);
    }
    
    let localQuotes = await collection.toArray();
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      localQuotes = localQuotes.filter(q => 
        q.number.toLowerCase().includes(search) || 
        q.customerName.toLowerCase().includes(search) ||
        q.projectName?.toLowerCase().includes(search)
      );
    }
    
    return localQuotes;
  }

  /**
   * Get quote by ID
   */
  static async getById(id: string): Promise<Quote | null> {
    if (USE_API && navigator.onLine) {
      try {
        const quote = await quotesApi.getById(id);
        await db.quotes.put(quote);
        return quote;
      } catch (error) {
        console.warn('API call failed, falling back to local database:', error);
      }
    }
    
    return db.quotes.get(id);
  }

  /**
   * Create new quote
   */
  static async create(data: CreateQuoteInput): Promise<Quote> {
    const id = `ANG-${Date.now()}`;
    const now = new Date().toISOString();
    
    const quote: Quote = {
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
    } as Quote;

    // Save to local database immediately
    await db.quotes.put(quote);
    
    // Queue for sync
    await offlineSync.queueAction('quotes', 'create', quote);

    return quote;
  }

  /**
   * Update quote
   */
  static async update(id: string, data: UpdateQuoteInput): Promise<Quote | null> {
    const existing = await db.quotes.get(id);
    if (!existing) return null;

    const updated: Quote = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    };

    await db.quotes.put(updated);
    
    // Queue for sync
    await offlineSync.queueAction('quotes', 'update', updated, id);

    return updated;
  }

  /**
   * Delete quote
   */
  static async delete(id: string): Promise<boolean> {
    const existing = await db.quotes.get(id);
    if (!existing) return false;

    await db.quotes.delete(id);

    // Queue for sync
    await offlineSync.queueAction('quotes', 'delete', existing, id);

    return true;
  }

  /**
   * Convert quote to project
   */
  static async convertToProject(id: string): Promise<{ projectId: string }> {
    if (navigator.onLine) {
      return quotesApi.convertToProject(id);
    }
    
    // For offline, we queue the conversion as a custom action
    // In a real app, you might create the project locally too
    await offlineSync.queueAction('quotes', 'update', { status: 'accepted' }, id);
    return { projectId: `PRJ-${id}` };
  }

  /**
   * Send quote to customer
   */
  static async send(id: string, email: string): Promise<void> {
    if (navigator.onLine) {
      return quotesApi.send(id, email);
    }
    
    // Queue the send action
    await offlineSync.queueAction('quotes', 'update', { status: 'sent', sentTo: email }, id);
  }
}
