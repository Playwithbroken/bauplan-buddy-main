import { db } from './localDatabaseService';

/* DraftService: Optimized IndexedDB-backed draft persistence. */

export const DraftService = {
  async save<T>(key: string, value: T): Promise<void> {
    try {
      await db.drafts.put({
        key,
        data: value,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('DraftService: Failed to save draft', error);
    }
  },

  async load<T>(key: string): Promise<T | null> {
    try {
      const draft = await db.drafts.get(key);
      return draft ? (draft.data as T) : null;
    } catch (error) {
      console.error('DraftService: Failed to load draft', error);
      return null;
    }
  },

  async clear(key: string): Promise<void> {
    try {
      await db.drafts.delete(key);
    } catch (error) {
      console.error('DraftService: Failed to clear draft', error);
    }
  },

  async getAllDrafts(): Promise<any[]> {
    return await db.drafts.toArray();
  }
};
