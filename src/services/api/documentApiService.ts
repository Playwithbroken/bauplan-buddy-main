import { apiClient, configService } from '../databaseService';

// API response types
interface DocumentApiResponse {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  project_id?: string;
  uploaded_by: string;
  version: number;
  parent_document_id?: string;
  tags: string[];
  is_public: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

interface DocumentVersionApiResponse {
  id: string;
  document_id: string;
  version: number;
  file_path: string;
  uploaded_by: string;
  uploaded_at: string;
  change_description?: string;
}

interface ApiListResponse<T> {
  data: T[];
}

interface ApiSingleResponse<T> {
  data: T;
}

export interface Document {
  id: string;
  name: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  projectId?: string;
  uploadedBy: string;
  version: number;
  parentDocumentId?: string;
  tags: string[];
  isPublic: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentRequest {
  name: string;
  file: File;
  projectId?: string;
  tags?: string[];
  isPublic?: boolean;
  parentDocumentId?: string;
}

export interface UpdateDocumentRequest {
  id: string;
  name?: string;
  tags?: string[];
  isPublic?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface DocumentFilter {
  projectId?: string;
  uploadedBy?: string;
  approvalStatus?: string;
  mimeType?: string;
  tags?: string[];
  isPublic?: boolean;
  fromDate?: Date;
  toDate?: Date;
}

export interface DocumentStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  totalSize: number;
  averageSize: number;
  recentUploads: number;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  filePath: string;
  uploadedBy: string;
  uploadedAt: Date;
  changeDescription?: string;
}

export class DocumentApiService {
  private useApi: boolean;

  constructor() {
    this.useApi = configService.shouldUseApi();
  }

  async getDocuments(filter?: DocumentFilter): Promise<Document[]> {
    if (this.useApi) {
      return this.getDocumentsFromApi(filter);
    } else {
      return this.getDocumentsFromLocalStorage(filter);
    }
  }

  async getDocument(id: string): Promise<Document | null> {
    if (this.useApi) {
      return this.getDocumentFromApi(id);
    } else {
      return this.getDocumentFromLocalStorage(id);
    }
  }

  async uploadDocument(documentData: CreateDocumentRequest): Promise<Document> {
    if (this.useApi) {
      return this.uploadDocumentToApi(documentData);
    } else {
      return this.uploadDocumentToLocalStorage(documentData);
    }
  }

  async updateDocument(documentData: UpdateDocumentRequest): Promise<Document> {
    if (this.useApi) {
      return this.updateDocumentInApi(documentData);
    } else {
      return this.updateDocumentInLocalStorage(documentData);
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    if (this.useApi) {
      return this.deleteDocumentFromApi(id);
    } else {
      return this.deleteDocumentFromLocalStorage(id);
    }
  }

  async downloadDocument(id: string): Promise<Blob> {
    if (this.useApi) {
      return this.downloadDocumentFromApi(id);
    } else {
      return this.downloadDocumentFromLocalStorage(id);
    }
  }

  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    if (this.useApi) {
      return this.getDocumentVersionsFromApi(documentId);
    } else {
      return this.getDocumentVersionsFromLocalStorage(documentId);
    }
  }

  async approveDocument(id: string, approved: boolean): Promise<Document> {
    const status = approved ? 'approved' : 'rejected';
    return this.updateDocument({ id, approvalStatus: status });
  }

  async getDocumentsByProject(projectId: string): Promise<Document[]> {
    return this.getDocuments({ projectId });
  }

  async getPendingApprovals(): Promise<Document[]> {
    return this.getDocuments({ approvalStatus: 'pending' });
  }

  async getDocumentStats(): Promise<DocumentStats> {
    if (this.useApi) {
      return this.getDocumentStatsFromApi();
    } else {
      return this.getDocumentStatsFromLocalStorage();
    }
  }

  async searchDocuments(query: string): Promise<Document[]> {
    const allDocuments = await this.getDocuments();
    
    const searchTerm = query.toLowerCase();
    return allDocuments.filter(document => 
      document.name.toLowerCase().includes(searchTerm) ||
      document.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      document.mimeType.toLowerCase().includes(searchTerm)
    );
  }

  // API Implementation Methods
  private async getDocumentsFromApi(filter?: DocumentFilter): Promise<Document[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filter) {
        if (filter.projectId) queryParams.append('project_id', filter.projectId);
        if (filter.uploadedBy) queryParams.append('uploaded_by', filter.uploadedBy);
        if (filter.approvalStatus) queryParams.append('approval_status', filter.approvalStatus);
        if (filter.mimeType) queryParams.append('mime_type', filter.mimeType);
        if (filter.isPublic !== undefined) queryParams.append('is_public', filter.isPublic.toString());
        if (filter.fromDate) queryParams.append('from_date', filter.fromDate.toISOString());
        if (filter.toDate) queryParams.append('to_date', filter.toDate.toISOString());
        if (filter.tags) queryParams.append('tags', filter.tags.join(','));
      }

      const url = `/documents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<ApiListResponse<DocumentApiResponse>>(url);
      
      return response.data.map(this.mapApiResponseToDocument);
    } catch (error) {
      console.error('Failed to fetch documents from API:', error);
      throw new Error('Failed to fetch documents');
    }
  }

  private async getDocumentFromApi(id: string): Promise<Document | null> {
    try {
      const response = await apiClient.get<ApiSingleResponse<DocumentApiResponse>>(`/documents/${id}`);
      return this.mapApiResponseToDocument(response.data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      console.error('Failed to fetch document from API:', error);
      throw new Error('Failed to fetch document');
    }
  }

  private async uploadDocumentToApi(documentData: CreateDocumentRequest): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('file', documentData.file);
      formData.append('name', documentData.name);
      if (documentData.projectId) formData.append('project_id', documentData.projectId);
      if (documentData.tags) formData.append('tags', JSON.stringify(documentData.tags));
      if (documentData.isPublic !== undefined) formData.append('is_public', documentData.isPublic.toString());
      if (documentData.parentDocumentId) formData.append('parent_document_id', documentData.parentDocumentId);

      const response = await apiClient.post<ApiSingleResponse<DocumentApiResponse>>('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return this.mapApiResponseToDocument(response.data);
    } catch (error) {
      console.error('Failed to upload document to API:', error);
      throw new Error('Failed to upload document');
    }
  }

  private async updateDocumentInApi(documentData: UpdateDocumentRequest): Promise<Document> {
    try {
      const { id, ...updateData } = documentData;
      const payload = this.mapUpdateRequestToApiPayload(updateData);
      const response = await apiClient.put<ApiSingleResponse<DocumentApiResponse>>(`/documents/${id}`, payload);
      return this.mapApiResponseToDocument(response.data);
    } catch (error) {
      console.error('Failed to update document in API:', error);
      throw new Error('Failed to update document');
    }
  }

  private async deleteDocumentFromApi(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/documents/${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete document from API:', error);
      throw new Error('Failed to delete document');
    }
  }

  private async downloadDocumentFromApi(id: string): Promise<Blob> {
    try {
      const response = await fetch(`${configService.getApiConfig().baseUrl}/documents/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Failed to download document from API:', error);
      throw new Error('Failed to download document');
    }
  }

  private async getDocumentVersionsFromApi(documentId: string): Promise<DocumentVersion[]> {
    try {
      const response = await apiClient.get<ApiListResponse<DocumentVersionApiResponse>>(`/documents/${documentId}/versions`);
      return response.data.map(this.mapApiResponseToDocumentVersion);
    } catch (error) {
      console.error('Failed to fetch document versions from API:', error);
      throw new Error('Failed to fetch document versions');
    }
  }

  private async getDocumentStatsFromApi(): Promise<DocumentStats> {
    try {
      const response = await apiClient.get<{ data: DocumentStats }>('/documents/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch document stats from API:', error);
      // Fallback to calculating from all documents
      const documents = await this.getDocumentsFromApi();
      return this.calculateDocumentStats(documents);
    }
  }

  // LocalStorage Implementation Methods (fallback)
  private getDocumentsFromLocalStorage(filter?: DocumentFilter): Document[] {
    try {
      const documents = this.getAllDocumentsFromLocalStorage();
      
      if (!filter) return documents;

      return documents.filter(document => {
        if (filter.projectId && document.projectId !== filter.projectId) return false;
        if (filter.uploadedBy && document.uploadedBy !== filter.uploadedBy) return false;
        if (filter.approvalStatus && document.approvalStatus !== filter.approvalStatus) return false;
        if (filter.mimeType && !document.mimeType.includes(filter.mimeType)) return false;
        if (filter.isPublic !== undefined && document.isPublic !== filter.isPublic) return false;
        if (filter.fromDate && new Date(document.createdAt) < filter.fromDate) return false;
        if (filter.toDate && new Date(document.createdAt) > filter.toDate) return false;
        if (filter.tags && !filter.tags.some(tag => document.tags.includes(tag))) return false;
        
        return true;
      });
    } catch (error) {
      console.error('Failed to get documents from localStorage:', error);
      return [];
    }
  }

  private getDocumentFromLocalStorage(id: string): Document | null {
    const documents = this.getAllDocumentsFromLocalStorage();
    return documents.find(document => document.id === id) || null;
  }

  private uploadDocumentToLocalStorage(documentData: CreateDocumentRequest): Document {
    const documents = this.getAllDocumentsFromLocalStorage();
    
    // In localStorage, we can't actually store files, so we'll store metadata only
    const newDocument: Document = {
      id: Date.now().toString(),
      name: documentData.name,
      filePath: `localStorage://documents/${documentData.name}`,
      fileSize: documentData.file.size,
      mimeType: documentData.file.type,
      projectId: documentData.projectId,
      uploadedBy: 'current-user', // Would be from auth context
      version: documentData.parentDocumentId ? this.getNextVersion(documentData.parentDocumentId) : 1,
      parentDocumentId: documentData.parentDocumentId,
      tags: documentData.tags || [],
      isPublic: documentData.isPublic || false,
      approvalStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    documents.push(newDocument);
    this.saveDocumentsToLocalStorage(documents);
    
    return newDocument;
  }

  private updateDocumentInLocalStorage(documentData: UpdateDocumentRequest): Document {
    const documents = this.getAllDocumentsFromLocalStorage();
    const index = documents.findIndex(document => document.id === documentData.id);
    
    if (index === -1) {
      throw new Error('Document not found');
    }

    const updatedDocument: Document = {
      ...documents[index],
      ...documentData,
      updatedAt: new Date()
    };

    // If approval status changed, set approved by and date
    if (documentData.approvalStatus && documentData.approvalStatus !== documents[index].approvalStatus) {
      if (documentData.approvalStatus === 'approved' || documentData.approvalStatus === 'rejected') {
        updatedDocument.approvedBy = 'current-user'; // Would be from auth context
        updatedDocument.approvedAt = new Date();
      }
    }

    documents[index] = updatedDocument;
    this.saveDocumentsToLocalStorage(documents);
    
    return updatedDocument;
  }

  private deleteDocumentFromLocalStorage(id: string): boolean {
    const documents = this.getAllDocumentsFromLocalStorage();
    const filteredDocuments = documents.filter(document => document.id !== id);
    
    if (filteredDocuments.length === documents.length) {
      return false; // Document not found
    }

    this.saveDocumentsToLocalStorage(filteredDocuments);
    return true;
  }

  private downloadDocumentFromLocalStorage(id: string): Promise<Blob> {
    // In localStorage, we can't actually store file content
    // Return a mock blob for testing purposes
    const document = this.getDocumentFromLocalStorage(id);
    if (!document) {
      throw new Error('Document not found');
    }

    const mockContent = `Mock file content for ${document.name}`;
    return Promise.resolve(new Blob([mockContent], { type: document.mimeType }));
  }

  private getDocumentVersionsFromLocalStorage(documentId: string): DocumentVersion[] {
    const documents = this.getAllDocumentsFromLocalStorage();
    const document = documents.find(doc => doc.id === documentId);
    
    if (!document) return [];

    // Find all versions of this document
    const versions = documents.filter(doc => 
      doc.parentDocumentId === documentId || doc.id === documentId
    );

    return versions.map(doc => ({
      id: doc.id,
      documentId,
      version: doc.version,
      filePath: doc.filePath,
      uploadedBy: doc.uploadedBy,
      uploadedAt: doc.createdAt,
      changeDescription: `Version ${doc.version}`
    }));
  }

  private getDocumentStatsFromLocalStorage(): DocumentStats {
    const documents = this.getAllDocumentsFromLocalStorage();
    return this.calculateDocumentStats(documents);
  }

  // Helper Methods
  private getAllDocumentsFromLocalStorage(): Document[] {
    try {
      const stored = localStorage.getItem('documents');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading documents from localStorage:', error);
      return [];
    }
  }

  private saveDocumentsToLocalStorage(documents: Document[]): void {
    try {
      localStorage.setItem('documents', JSON.stringify(documents));
    } catch (error) {
      console.error('Error saving documents to localStorage:', error);
      throw new Error('Failed to save documents');
    }
  }

  private getNextVersion(parentDocumentId: string): number {
    const documents = this.getAllDocumentsFromLocalStorage();
    const versions = documents.filter(doc => 
      doc.parentDocumentId === parentDocumentId || doc.id === parentDocumentId
    );
    return Math.max(...versions.map(doc => doc.version)) + 1;
  }

  private calculateDocumentStats(documents: Document[]): DocumentStats {
    const stats: DocumentStats = {
      total: documents.length,
      byType: {},
      byStatus: {},
      totalSize: 0,
      averageSize: 0,
      recentUploads: 0
    };

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    documents.forEach(document => {
      // Count by type (simplified to main categories)
      const mainType = document.mimeType.split('/')[0];
      stats.byType[mainType] = (stats.byType[mainType] || 0) + 1;
      
      // Count by status
      stats.byStatus[document.approvalStatus] = (stats.byStatus[document.approvalStatus] || 0) + 1;
      
      // Calculate size stats
      stats.totalSize += document.fileSize;
      
      // Count recent uploads
      if (new Date(document.createdAt) > oneWeekAgo) {
        stats.recentUploads++;
      }
    });

    stats.averageSize = documents.length > 0 ? stats.totalSize / documents.length : 0;

    return stats;
  }

  // Mapping Methods
  private mapApiResponseToDocument(apiData: DocumentApiResponse): Document {
    return {
      id: apiData.id,
      name: apiData.name,
      filePath: apiData.file_path,
      fileSize: apiData.file_size,
      mimeType: apiData.mime_type,
      projectId: apiData.project_id,
      uploadedBy: apiData.uploaded_by,
      version: apiData.version,
      parentDocumentId: apiData.parent_document_id,
      tags: apiData.tags || [],
      isPublic: apiData.is_public,
      approvalStatus: apiData.approval_status,
      approvedBy: apiData.approved_by,
      approvedAt: apiData.approved_at ? new Date(apiData.approved_at) : undefined,
      createdAt: new Date(apiData.created_at),
      updatedAt: new Date(apiData.updated_at)
    };
  }

  private mapApiResponseToDocumentVersion(apiData: DocumentVersionApiResponse): DocumentVersion {
    return {
      id: apiData.id,
      documentId: apiData.document_id,
      version: apiData.version,
      filePath: apiData.file_path,
      uploadedBy: apiData.uploaded_by,
      uploadedAt: new Date(apiData.uploaded_at),
      changeDescription: apiData.change_description
    };
  }

  private mapUpdateRequestToApiPayload(data: Omit<UpdateDocumentRequest, 'id'>): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    
    if (data.name !== undefined) payload.name = data.name;
    if (data.tags !== undefined) payload.tags = data.tags;
    if (data.isPublic !== undefined) payload.is_public = data.isPublic;
    if (data.approvalStatus !== undefined) payload.approval_status = data.approvalStatus;
    
    return payload;
  }
}

// Export singleton instance
export const documentApiService = new DocumentApiService();