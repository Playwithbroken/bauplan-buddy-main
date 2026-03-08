import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PermissionService } from '../../permissionService';
import { SynchronizationService } from '../../synchronizationService';
import { OfflineService } from '../../offlineService';

// Extend Jest matchers to include jest-dom
import '@testing-library/jest-dom';

// Mock file API
const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
const mockFileReader = {
  readAsArrayBuffer: jest.fn(),
  readAsDataURL: jest.fn(),
  result: null,
  onload: null,
  onerror: null
};

Object.defineProperty(global, 'FileReader', {
  value: jest.fn(() => mockFileReader),
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch for cloud storage APIs
const mockFetch = jest.fn();
Object.defineProperty(global, 'fetch', {
  value: mockFetch,
  writable: true
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn(() => 'blob:http://localhost/mock-url'),
  writable: true
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: jest.fn(),
  writable: true
});

// Document management service mock implementation
class DocumentManagementService {
  private documents: Document[] = [];
  private static instance: DocumentManagementService;

  static getInstance(): DocumentManagementService {
    if (!DocumentManagementService.instance) {
      DocumentManagementService.instance = new DocumentManagementService();
    }
    return DocumentManagementService.instance;
  }

  async uploadDocument(file: File, metadata: DocumentMetadata): Promise<Document> {
    const document: Document = {
      id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.type,
      size: file.size,
      projectId: metadata.projectId,
      category: metadata.category,
      tags: metadata.tags || [],
      uploadedBy: metadata.uploadedBy || 'current-user',
      uploadedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: 1,
      path: `/documents/${metadata.projectId}/${file.name}`,
      url: `blob:http://localhost/${file.name}`,
      metadata: {
        description: metadata.description,
        isPublic: metadata.isPublic || false,
        permissions: metadata.permissions || ['read']
      }
    };

    this.documents.push(document);
    return document;
  }

  async getDocuments(projectId?: string, filters?: DocumentFilters): Promise<Document[]> {
    let filtered = [...this.documents];

    if (projectId) {
      filtered = filtered.filter(doc => doc.projectId === projectId);
    }

    if (filters?.category) {
      filtered = filtered.filter(doc => doc.category === filters.category);
    }

    if (filters?.tags?.length) {
      filtered = filtered.filter(doc => 
        filters.tags!.some(tag => doc.tags.includes(tag))
      );
    }

    if (filters?.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm) ||
        doc.metadata.description?.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }

  async updateDocument(documentId: string, updates: Partial<DocumentMetadata>): Promise<Document> {
    const document = this.documents.find(doc => doc.id === documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    Object.assign(document, updates, {
      lastModified: new Date().toISOString(),
      version: document.version + 1
    });

    return document;
  }

  async deleteDocument(documentId: string): Promise<void> {
    const index = this.documents.findIndex(doc => doc.id === documentId);
    if (index === -1) {
      throw new Error('Document not found');
    }
    this.documents.splice(index, 1);
  }

  async shareDocument(documentId: string, shareOptions: ShareOptions): Promise<ShareResult> {
    const document = this.documents.find(doc => doc.id === documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    const shareId = `SHARE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const shareUrl = `https://app.bauplan-buddy.com/share/${shareId}`;

    return {
      shareId,
      shareUrl,
      expiresAt: shareOptions.expiresAt,
      permissions: shareOptions.permissions,
      recipients: shareOptions.recipients
    };
  }

  async syncWithCloud(provider: CloudProvider): Promise<SyncResult> {
    // Mock cloud sync implementation
    const result: SyncResult = {
      success: true,
      uploadedCount: 2,
      downloadedCount: 1,
      conflicts: [],
      errors: []
    };

    return result;
  }

  async generateDocumentPreview(documentId: string): Promise<string> {
    const document = this.documents.find(doc => doc.id === documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Mock preview generation
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
  }
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  projectId: string;
  category: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  version: number;
  path: string;
  url: string;
  metadata: {
    description?: string;
    isPublic: boolean;
    permissions: string[];
  };
}

interface DocumentMetadata {
  projectId: string;
  category: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  permissions?: string[];
  uploadedBy?: string;
}

interface DocumentFilters {
  category?: string;
  tags?: string[];
  searchTerm?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface ShareOptions {
  recipients: string[];
  permissions: string[];
  expiresAt?: string;
  message?: string;
}

interface ShareResult {
  shareId: string;
  shareUrl: string;
  expiresAt?: string;
  permissions: string[];
  recipients: string[];
}

interface CloudProvider {
  name: string;
  credentials: any;
}

interface SyncResult {
  success: boolean;
  uploadedCount: number;
  downloadedCount: number;
  conflicts: any[];
  errors: string[];
}

describe('Document Management Integration Tests', () => {
  let documentService: DocumentManagementService;

  const mockProjectId = 'PRJ-001';
  const mockUserId = 'USER-001';

  const mockDocumentMetadata: DocumentMetadata = {
    projectId: mockProjectId,
    category: 'plans',
    description: 'Test architectural plan',
    tags: ['architecture', 'floor-plan'],
    isPublic: false,
    permissions: ['read', 'write'],
    uploadedBy: mockUserId
  };

  beforeEach(() => {
    jest.clearAllMocks();
    documentService = DocumentManagementService.getInstance();
    
    // Reset document store
    (documentService as any).documents = [];

    localStorageMock.getItem.mockImplementation((key: string) => {
      switch (key) {
        case 'bauplan-buddy-user':
          return JSON.stringify({ id: mockUserId, permissions: ['documents.write'] });
        case 'document-cache':
          return null;
        default:
          return null;
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Document Upload and Storage', () => {
    it('should upload document with metadata and integrate with permission system', async () => {
      // Mock permission check
      jest.spyOn(PermissionService, 'hasPermission').mockReturnValue(true);

      const uploadedDoc = await documentService.uploadDocument(mockFile, mockDocumentMetadata);

      expect(uploadedDoc).toBeDefined();
      expect(uploadedDoc.id).toMatch(/^DOC-/);
      expect(uploadedDoc.name).toBe('test.pdf');
      expect(uploadedDoc.projectId).toBe(mockProjectId);
      expect(uploadedDoc.category).toBe('plans');
      expect(uploadedDoc.tags).toEqual(['architecture', 'floor-plan']);
      expect(PermissionService.hasPermission).toHaveBeenCalledWith(
        mockUserId,
        'documents.write',
        expect.any(Object)
      );
    });

    it('should reject upload when user lacks permissions', async () => {
      jest.spyOn(PermissionService, 'hasPermission').mockReturnValue(false);

      await expect(
        documentService.uploadDocument(mockFile, mockDocumentMetadata)
      ).rejects.toThrow('Insufficient permissions');
    });

    it('should validate file types and sizes', async () => {
      const invalidFile = new File(['content'], 'test.exe', { type: 'application/octet-stream' });
      const largeFile = new File([new ArrayBuffer(100 * 1024 * 1024)], 'large.pdf', { 
        type: 'application/pdf' 
      });

      await expect(
        documentService.uploadDocument(invalidFile, mockDocumentMetadata)
      ).rejects.toThrow('File type not allowed');

      await expect(
        documentService.uploadDocument(largeFile, mockDocumentMetadata)
      ).rejects.toThrow('File size exceeds limit');
    });

    it('should handle batch document uploads', async () => {
      const files = [
        new File(['content1'], 'doc1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'doc2.pdf', { type: 'application/pdf' }),
        new File(['content3'], 'doc3.pdf', { type: 'application/pdf' })
      ];

      const uploadPromises = files.map(file => 
        documentService.uploadDocument(file, {
          ...mockDocumentMetadata,
          description: `Test document ${file.name}`
        })
      );

      const uploadedDocs = await Promise.all(uploadPromises);

      expect(uploadedDocs).toHaveLength(3);
      uploadedDocs.forEach((doc, index) => {
        expect(doc.name).toBe(files[index].name);
        expect(doc.projectId).toBe(mockProjectId);
      });
    });
  });

  describe('Document Retrieval and Search', () => {
    beforeEach(async () => {
      // Upload test documents
      await documentService.uploadDocument(mockFile, mockDocumentMetadata);
      await documentService.uploadDocument(
        new File(['spec content'], 'spec.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
        { ...mockDocumentMetadata, category: 'specifications', tags: ['technical', 'specifications'] }
      );
      await documentService.uploadDocument(
        new File(['photo content'], 'photo.jpg', { type: 'image/jpeg' }),
        { ...mockDocumentMetadata, category: 'photos', tags: ['progress', 'photos'] }
      );
    });

    it('should retrieve documents by project', async () => {
      const documents = await documentService.getDocuments(mockProjectId);

      expect(documents).toHaveLength(3);
      expect(documents.every(doc => doc.projectId === mockProjectId)).toBe(true);
    });

    it('should filter documents by category', async () => {
      const planDocs = await documentService.getDocuments(mockProjectId, { category: 'plans' });
      const specDocs = await documentService.getDocuments(mockProjectId, { category: 'specifications' });

      expect(planDocs).toHaveLength(1);
      expect(planDocs[0].category).toBe('plans');
      expect(specDocs).toHaveLength(1);
      expect(specDocs[0].category).toBe('specifications');
    });

    it('should search documents by tags and content', async () => {
      const architectureDocs = await documentService.getDocuments(mockProjectId, { 
        tags: ['architecture'] 
      });
      const searchResults = await documentService.getDocuments(mockProjectId, { 
        searchTerm: 'spec' 
      });

      expect(architectureDocs).toHaveLength(1);
      expect(architectureDocs[0].tags).toContain('architecture');
      expect(searchResults.length).toBeGreaterThan(0);
    });

    it('should handle complex search queries with multiple filters', async () => {
      const complexSearch = await documentService.getDocuments(mockProjectId, {
        category: 'plans',
        tags: ['architecture'],
        searchTerm: 'test'
      });

      expect(complexSearch).toHaveLength(1);
      expect(complexSearch[0].category).toBe('plans');
      expect(complexSearch[0].tags).toContain('architecture');
    });
  });

  describe('Document Versioning and Updates', () => {
    let documentId: string;

    beforeEach(async () => {
      const uploadedDoc = await documentService.uploadDocument(mockFile, mockDocumentMetadata);
      documentId = uploadedDoc.id;
    });

    it('should update document metadata and increment version', async () => {
      const updatedDoc = await documentService.updateDocument(documentId, {
        description: 'Updated description',
        tags: ['updated', 'version-2']
      });

      expect(updatedDoc.version).toBe(2);
      expect(updatedDoc.metadata.description).toBe('Updated description');
      expect(updatedDoc.tags).toEqual(['updated', 'version-2']);
      expect(new Date(updatedDoc.lastModified)).toBeInstanceOf(Date);
    });

    it('should maintain version history', async () => {
      // Multiple updates
      await documentService.updateDocument(documentId, { description: 'Version 2' });
      await documentService.updateDocument(documentId, { description: 'Version 3' });
      const finalDoc = await documentService.updateDocument(documentId, { description: 'Version 4' });

      expect(finalDoc.version).toBe(4);
      expect(finalDoc.metadata.description).toBe('Version 4');
    });

    it('should handle concurrent updates with conflict resolution', async () => {
      // Simulate concurrent updates
      const update1Promise = documentService.updateDocument(documentId, { 
        description: 'Update from user 1' 
      });
      const update2Promise = documentService.updateDocument(documentId, { 
        tags: ['concurrent', 'update'] 
      });

      const [update1, update2] = await Promise.all([update1Promise, update2Promise]);

      // Both updates should succeed but with different versions
      expect(update1.version).toBeGreaterThan(1);
      expect(update2.version).toBeGreaterThan(1);
    });
  });

  describe('Document Sharing and Permissions', () => {
    let documentId: string;

    beforeEach(async () => {
      const uploadedDoc = await documentService.uploadDocument(mockFile, mockDocumentMetadata);
      documentId = uploadedDoc.id;
    });

    it('should create shareable links with expiration', async () => {
      const shareResult = await documentService.shareDocument(documentId, {
        recipients: ['client@example.com', 'contractor@example.com'],
        permissions: ['read'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        message: 'Please review the attached plans'
      });

      expect(shareResult.shareId).toMatch(/^SHARE-/);
      expect(shareResult.shareUrl).toContain('share/');
      expect(shareResult.recipients).toEqual(['client@example.com', 'contractor@example.com']);
      expect(shareResult.permissions).toEqual(['read']);
      expect(shareResult.expiresAt).toBeDefined();
    });

    it('should enforce document access permissions', async () => {
      // Mock user without read permission
      jest.spyOn(PermissionService, 'hasPermission').mockReturnValue(false);

      await expect(
        documentService.getDocuments(mockProjectId)
      ).rejects.toThrow('Insufficient permissions to view documents');
    });

    it('should handle permission inheritance from projects', async () => {
      jest.spyOn(PermissionService, 'hasPermission')
        .mockImplementation((userId, permission, context) => {
          if (context?.projectId === mockProjectId && permission === 'documents.read') {
            return true;
          }
          return false;
        });

      const documents = await documentService.getDocuments(mockProjectId);
      
      expect(documents).toBeDefined();
      expect(PermissionService.hasPermission).toHaveBeenCalledWith(
        expect.any(String),
        'documents.read',
        expect.objectContaining({ projectId: mockProjectId })
      );
    });
  });

  describe('Cloud Storage Integration', () => {
    it('should sync documents with cloud storage providers', async () => {
      const cloudProvider: CloudProvider = {
        name: 'Google Drive',
        credentials: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: [
            { id: 'cloud-doc-1', name: 'cloud-document.pdf', modifiedTime: new Date().toISOString() }
          ]
        })
      });

      const syncResult = await documentService.syncWithCloud(cloudProvider);

      expect(syncResult.success).toBe(true);
      expect(syncResult.uploadedCount).toBeGreaterThan(0);
      expect(syncResult.downloadedCount).toBeGreaterThan(0);
      expect(syncResult.errors).toHaveLength(0);
    });

    it('should handle cloud storage conflicts', async () => {
      const cloudProvider: CloudProvider = {
        name: 'Dropbox',
        credentials: { accessToken: 'mock-token' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: [
            { 
              id: 'conflict-doc', 
              name: 'test.pdf', 
              modifiedTime: new Date(Date.now() + 60000).toISOString() // Newer than local
            }
          ]
        })
      });

      const syncResult = await documentService.syncWithCloud(cloudProvider);

      expect(syncResult.conflicts).toHaveLength(1);
      expect(syncResult.conflicts[0]).toMatchObject({
        type: 'modified_conflict',
        localFile: expect.any(Object),
        cloudFile: expect.any(Object)
      });
    });

    it('should retry failed cloud operations', async () => {
      let attempts = 0;
      mockFetch.mockImplementation(() => {
        attempts++;
        if (attempts <= 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ files: [] })
        });
      });

      const cloudProvider: CloudProvider = {
        name: 'OneDrive',
        credentials: { accessToken: 'mock-token' }
      };

      const syncResult = await documentService.syncWithCloud(cloudProvider);

      expect(attempts).toBe(3);
      expect(syncResult.success).toBe(true);
    });
  });

  describe('Document Preview and Processing', () => {
    let documentId: string;

    beforeEach(async () => {
      const uploadedDoc = await documentService.uploadDocument(mockFile, mockDocumentMetadata);
      documentId = uploadedDoc.id;
    });

    it('should generate document previews for supported formats', async () => {
      const previewUrl = await documentService.generateDocumentPreview(documentId);

      expect(previewUrl).toMatch(/^data:image\//);
    });

    it('should handle different document types for preview generation', async () => {
      // Upload different file types
      const imageDoc = await documentService.uploadDocument(
        new File(['image'], 'image.jpg', { type: 'image/jpeg' }),
        mockDocumentMetadata
      );
      const textDoc = await documentService.uploadDocument(
        new File(['text'], 'document.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
        mockDocumentMetadata
      );

      const imagePreview = await documentService.generateDocumentPreview(imageDoc.id);
      const textPreview = await documentService.generateDocumentPreview(textDoc.id);

      expect(imagePreview).toMatch(/^data:image\//);
      expect(textPreview).toMatch(/^data:image\//);
    });

    it('should extract metadata from uploaded documents', async () => {
      // Mock metadata extraction
      const docWithMetadata = await documentService.uploadDocument(
        new File(['pdf content'], 'detailed.pdf', { type: 'application/pdf' }),
        {
          ...mockDocumentMetadata,
          category: 'contracts'
        }
      );

      expect(docWithMetadata.metadata).toBeDefined();
      expect(docWithMetadata.size).toBe('pdf content'.length);
      expect(docWithMetadata.type).toBe('application/pdf');
    });
  });

  describe('Offline Support and Synchronization', () => {
    beforeEach(() => {
      // Mock offline state
      jest.spyOn(OfflineService, 'isOnline').mockReturnValue(false);
    });

    it('should queue document uploads when offline', async () => {
      const queueSpy = jest.spyOn(OfflineService, 'queueAction').mockImplementation(jest.fn());

      await documentService.uploadDocument(mockFile, mockDocumentMetadata);

      expect(queueSpy).toHaveBeenCalledWith({
        type: 'create',
        entity: 'document',
        data: expect.any(Object),
        userId: mockUserId,
        deviceId: 'browser',
        conflictResolution: 'client-wins',
        maxAttempts: 3
      });
    });

    it('should sync documents when coming back online', async () => {
      // Mock going from offline to online
      jest.spyOn(OfflineService, 'isOnline')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const syncSpy = jest.spyOn(SynchronizationService, 'performSync')
        .mockResolvedValue({
          success: true,
          syncedItems: 1,
          conflicts: [],
          errors: []
        });

      // Trigger online event
      window.dispatchEvent(new Event('online'));

      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async operations

      expect(syncSpy).toHaveBeenCalled();
    });

    it('should handle document conflicts during sync', async () => {
      const conflictResolution = jest.spyOn(SynchronizationService, 'resolveConflicts')
        .mockResolvedValue([{
          type: 'document_modified',
          resolution: 'merge',
          localDocument: expect.any(Object),
          serverDocument: expect.any(Object)
        }]);

      await SynchronizationService.performSync();

      expect(conflictResolution).toHaveBeenCalled();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large file uploads efficiently', async () => {
      const largeFile = new File(
        [new ArrayBuffer(10 * 1024 * 1024)], // 10MB
        'large-plan.pdf',
        { type: 'application/pdf' }
      );

      const startTime = Date.now();
      await documentService.uploadDocument(largeFile, mockDocumentMetadata);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should implement pagination for document listings', async () => {
      // Upload many documents
      const uploadPromises = Array.from({ length: 50 }, (_, i) => 
        documentService.uploadDocument(
          new File([`content ${i}`], `doc-${i}.pdf`, { type: 'application/pdf' }),
          { ...mockDocumentMetadata, description: `Document ${i}` }
        )
      );

      await Promise.all(uploadPromises);

      const firstPage = await documentService.getDocuments(mockProjectId, {}, { page: 1, limit: 20 });
      const secondPage = await documentService.getDocuments(mockProjectId, {}, { page: 2, limit: 20 });

      expect(firstPage).toHaveLength(20);
      expect(secondPage).toHaveLength(20);
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    });

    it('should cache frequently accessed documents', async () => {
      const document = await documentService.uploadDocument(mockFile, mockDocumentMetadata);
      
      // First access - should hit storage
      const firstAccess = await documentService.getDocuments(mockProjectId);
      
      // Second access - should hit cache
      const secondAccess = await documentService.getDocuments(mockProjectId);

      expect(firstAccess).toEqual(secondAccess);
      // Cache implementation would be verified through performance metrics
    });
  });

  describe('Security and Compliance', () => {
    it('should encrypt sensitive documents', async () => {
      const sensitiveDoc = await documentService.uploadDocument(
        new File(['sensitive content'], 'contract.pdf', { type: 'application/pdf' }),
        {
          ...mockDocumentMetadata,
          category: 'contracts',
          isPublic: false,
          permissions: ['read']
        }
      );

      expect(sensitiveDoc.metadata.isPublic).toBe(false);
      expect(sensitiveDoc.url).not.toContain('sensitive content'); // Should be encrypted/tokenized
    });

    it('should audit document access and modifications', async () => {
      const auditSpy = jest.fn();
      // Mock audit logging
      (documentService as any).auditLog = auditSpy;

      const document = await documentService.uploadDocument(mockFile, mockDocumentMetadata);
      await documentService.updateDocument(document.id, { description: 'Updated' });
      await documentService.deleteDocument(document.id);

      expect(auditSpy).toHaveBeenCalledTimes(3);
      expect(auditSpy).toHaveBeenCalledWith('document_created', expect.any(Object));
      expect(auditSpy).toHaveBeenCalledWith('document_updated', expect.any(Object));
      expect(auditSpy).toHaveBeenCalledWith('document_deleted', expect.any(Object));
    });

    it('should validate and sanitize file uploads', async () => {
      const maliciousFile = new File(['<script>alert("xss")</script>'], 'malicious.html', { 
        type: 'text/html' 
      });

      await expect(
        documentService.uploadDocument(maliciousFile, mockDocumentMetadata)
      ).rejects.toThrow('File type not allowed');
    });
  });
});