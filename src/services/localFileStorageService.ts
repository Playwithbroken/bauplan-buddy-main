import { ErrorHandlingService } from './errorHandlingService';

export interface LocalFileMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  entityType?: 'invoice' | 'document' | 'other';
  entityId?: string;
  localPath?: string; // Optional if mapped via File System Access API
}

class LocalStorageService {
  private static instance: LocalStorageService;
  private readonly DB_NAME = 'BauplanBuddyOfflineFiles';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'files';
  private db: IDBDatabase | null = null;
  private dirHandle: FileSystemDirectoryHandle | null = null;

  private constructor() {}

  public static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  /**
   * Initializes IndexedDB for large blob storage.
   */
  public async initDB(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = (event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        ErrorHandlingService.error('Failed to open IndexedDB for files', error || new Error('Unknown DB Error'), 'local_storage');
        reject(error);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          // Store raw Blobs with explicit IDs
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  /**
   * Ensure DB is ready before transactions.
   */
  private async ensureDB(): Promise<void> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database failed to initialize');
  }

  /**
   * Request native File System Access for deep integration (Desktop/Electron).
   * Prompts user for a working directory to save heavy files locally.
   */
  public async requestFileSystemAccess(): Promise<boolean> {
    if (typeof window.showDirectoryPicker !== 'function') {
      console.warn('File System Access API not supported in this browser.');
      return false;
    }

    try {
      this.dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        id: 'bauplan-offline-storage'
      });
      return true;
    } catch (error) {
      console.error('User declined or failed directory access:', error);
      return false;
    }
  }

  /**
   * Check if we have an active OS directory handle.
   */
  public hasFileSystemAccess(): boolean {
    return this.dirHandle !== null;
  }

  /**
   * Stores a file in IndexedDB (Fallback).
   */
  public async storeFileInDB(fileId: string, blob: Blob, meta: LocalFileMetadata): Promise<void> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const payload = {
        blob,
        meta
      };
      
      const request = store.put(payload, fileId);
      
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
  }

  /**
   * Retrieves a file from IndexedDB.
   */
  public async getFileFromDB(fileId: string): Promise<{ blob: Blob; meta: LocalFileMetadata } | null> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(fileId);
      request.onsuccess = () => {
        const result = request.result;
        if (!result || !result.blob) {
          resolve(null);
          return;
        }
        resolve({
          blob: result.blob as Blob,
          meta: result.meta as LocalFileMetadata
        });
      };
      request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
  }

  /**
   * Deletes a file from IndexedDB.
   */
  public async deleteFileFromDB(fileId: string): Promise<void> {
    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(fileId);
      
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
  }

  /**
   * Stores a file to the native OS filesystem if access was granted.
   */
  public async saveNativeFile(filename: string, blob: Blob): Promise<string | null> {
    if (window.desktop?.isDesktop && typeof window.desktop.writeFile === 'function') {
      try {
        const base64Data = await this.blobToBase64(blob);
        const result = await window.desktop.writeFile(filename, base64Data);
        if (result.ok && result.path) {
          return result.path;
        }
      } catch (error) {
        ErrorHandlingService.error('Failed to write desktop native file', error as Error, 'local_storage');
      }
    }

    if (!this.dirHandle) {
      console.warn('No directory handle available. Prompting user...');
      const granted = await this.requestFileSystemAccess();
      if (!granted || !this.dirHandle) return null;
    }

    try {
      const fileHandle = await this.dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return fileHandle.name;
    } catch (error) {
      ErrorHandlingService.error('Failed to write native file', error as Error, 'local_storage');
      return null;
    }
  }

  public async readNativeFile(localPath: string): Promise<Blob | null> {
    if (!localPath) return null;

    if (window.desktop?.isDesktop && typeof window.desktop.readFile === 'function') {
      const result = await window.desktop.readFile(localPath);
      if (!result.ok || !result.dataBase64) {
        return null;
      }
      return this.base64ToBlob(result.dataBase64, result.mimeType || 'application/octet-stream');
    }

    return null;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  }

  private base64ToBlob(base64Data: string, mimeType: string): Blob {
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }
}

export const localFileStorageService = LocalStorageService.getInstance();
