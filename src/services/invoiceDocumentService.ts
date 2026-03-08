import { AdvancedDocumentService, DocumentMetadata, DocumentSearchFilters } from './advancedDocumentService';

export interface InvoiceDocument {
  // Document metadata fields
  id: string;
  name: string;
  originalName: string;
  type: DocumentMetadata['type'];
  category: DocumentMetadata['category'];
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  uploadedBy: string;
  lastModified: string;
  lastModifiedBy: string;
  projectId?: string;
  projectName?: string;
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  tags: string[];
  version: number;
  parentDocumentId?: string;
  isStarred: boolean;
  documentStatus: 'active' | 'archived' | 'deleted';
  filePath: string;
  thumbnailPath?: string;
  description?: string;
  extractedText?: string;
  ocrConfidence?: number;
  autoDetectedInfo?: DocumentMetadata['autoDetectedInfo'];
  reminders?: DocumentMetadata['reminders'];
  shareSettings?: DocumentMetadata['shareSettings'];
  accessLog?: DocumentMetadata['accessLog'];
  
  // Invoice-specific fields
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'partial';
  invoiceType: 'outgoing' | 'incoming';
  taxAmount?: number;
  taxRate?: number;
  paymentTerms?: number;
  projectReference?: string;
}

export interface InvoiceSearchFilters extends DocumentSearchFilters {
  invoiceType?: 'outgoing' | 'incoming';
  invoiceStatus?: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'partial';
  amountMin?: number;
  amountMax?: number;
  dueDateFrom?: string;
  dueDateTo?: string;
  currency?: string;
  paymentStatus?: 'pending' | 'paid' | 'overdue';
}

export interface InvoiceArchiveMetrics {
  totalInvoices: number;
  outgoingInvoices: number;
  incomingInvoices: number;
  totalRevenue: number;
  totalExpenses: number;
  avgProcessingTime: number;
  searchQueries: number;
  mostSearchedTerms: Array<{ term: string; count: number }>;
  recentlyArchived: InvoiceDocument[];
}

export class InvoiceDocumentService {
  private static instance: InvoiceDocumentService;
  private documentService: AdvancedDocumentService;
  private searchHistory: Array<{ query: string; timestamp: string; results: number }> = [];
  private invoiceCache: Map<string, InvoiceDocument> = new Map();

  public static getInstance(): InvoiceDocumentService {
    if (!InvoiceDocumentService.instance) {
      InvoiceDocumentService.instance = new InvoiceDocumentService();
    }
    return InvoiceDocumentService.instance;
  }

  constructor() {
    this.documentService = AdvancedDocumentService.getInstance();
    this.initializeMockData();
  }

  /**
   * Archive an invoice document
   */
  public async archiveInvoice(
    invoiceData: Partial<InvoiceDocument>,
    file?: File
  ): Promise<InvoiceDocument> {
    let documentMetadata: DocumentMetadata;

    if (file) {
      // Upload new invoice document
      documentMetadata = await this.documentService.uploadDocument(file, {
        name: invoiceData.invoiceNumber ? `${invoiceData.invoiceType === 'outgoing' ? 'Rechnung' : 'Eingangsrechnung'}_${invoiceData.invoiceNumber}` : undefined,
        category: 'invoices',
        description: `${invoiceData.invoiceType === 'outgoing' ? 'Ausgangs' : 'Eingangs'}rechnung ${invoiceData.customerName || invoiceData.supplierName || ''}`,
        tags: [
          'rechnung',
          invoiceData.invoiceType || 'unknown',
          invoiceData.status || 'draft',
          invoiceData.currency || 'EUR'
        ],
        customerId: invoiceData.invoiceType === 'outgoing' ? invoiceData.customerId : undefined,
        supplierId: invoiceData.invoiceType === 'incoming' ? invoiceData.supplierId : undefined,
        projectId: invoiceData.projectId
      }, {
        performOCR: true,
        autoDetectCategory: true
      });
    } else {
      // Create document entry without file (for programmatically created invoices)
      const mockFile = new File([''], `${invoiceData.invoiceNumber || 'invoice'}.pdf`, { type: 'application/pdf' });
      documentMetadata = await this.documentService.uploadDocument(mockFile, {
        name: `${invoiceData.invoiceType === 'outgoing' ? 'Rechnung' : 'Eingangsrechnung'}_${invoiceData.invoiceNumber}`,
        category: 'invoices',
        description: `${invoiceData.invoiceType === 'outgoing' ? 'Ausgangs' : 'Eingangs'}rechnung ${invoiceData.customerName || invoiceData.supplierName || ''}`,
        tags: [
          'rechnung',
          invoiceData.invoiceType || 'unknown',
          invoiceData.status || 'draft',
          invoiceData.currency || 'EUR'
        ]
      });
    }

    // Create extended invoice document
    const invoiceDocument: InvoiceDocument = {
      // Copy all document metadata fields
      id: documentMetadata.id,
      name: documentMetadata.name,
      originalName: documentMetadata.originalName,
      type: documentMetadata.type,
      category: documentMetadata.category,
      fileSize: documentMetadata.fileSize,
      mimeType: documentMetadata.mimeType,
      uploadDate: documentMetadata.uploadDate,
      uploadedBy: documentMetadata.uploadedBy,
      lastModified: documentMetadata.lastModified,
      lastModifiedBy: documentMetadata.lastModifiedBy,
      projectId: documentMetadata.projectId,
      projectName: documentMetadata.projectName,
      customerId: documentMetadata.customerId,
      customerName: documentMetadata.customerName,
      supplierId: documentMetadata.supplierId,
      supplierName: documentMetadata.supplierName,
      tags: documentMetadata.tags,
      version: documentMetadata.version,
      parentDocumentId: documentMetadata.parentDocumentId,
      isStarred: documentMetadata.isStarred,
      documentStatus: documentMetadata.status,
      filePath: documentMetadata.filePath,
      thumbnailPath: documentMetadata.thumbnailPath,
      description: documentMetadata.description,
      extractedText: documentMetadata.extractedText,
      ocrConfidence: documentMetadata.ocrConfidence,
      autoDetectedInfo: documentMetadata.autoDetectedInfo,
      reminders: documentMetadata.reminders,
      shareSettings: documentMetadata.shareSettings,
      accessLog: documentMetadata.accessLog,
      
      // Invoice-specific fields
      invoiceNumber: invoiceData.invoiceNumber || documentMetadata.name,
      invoiceDate: invoiceData.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAmount: invoiceData.totalAmount || 0,
      currency: invoiceData.currency || 'EUR',
      status: invoiceData.status || 'draft',
      invoiceType: invoiceData.invoiceType || 'outgoing',
      taxAmount: invoiceData.taxAmount,
      taxRate: invoiceData.taxRate,
      paymentTerms: invoiceData.paymentTerms,
      projectReference: invoiceData.projectReference
    };

    // Cache the invoice document
    this.invoiceCache.set(invoiceDocument.id, invoiceDocument);

    return invoiceDocument;
  }

  /**
   * Search archived invoices with invoice-specific filters
   */
  public searchInvoices(
    query: string,
    filters: InvoiceSearchFilters = {},
    limit: number = 50
  ): InvoiceDocument[] {
    // Record search query
    this.searchHistory.push({
      query: query || 'empty',
      timestamp: new Date().toISOString(),
      results: 0
    });

    // Prepare filters for document service
    const documentFilters: DocumentSearchFilters = {
      ...filters,
      category: 'invoices'
    };

    // Search documents using the existing service
    const results = this.documentService.searchDocuments(query, documentFilters, limit * 2);

    // Convert to invoice documents and apply invoice-specific filters
    const invoiceResults: InvoiceDocument[] = results
      .map(doc => this.convertToInvoiceDocument(doc))
      .filter(invoice => invoice !== null) as InvoiceDocument[];

    let filteredResults = invoiceResults;

    // Apply invoice-specific filters
    if (filters.invoiceType) {
      filteredResults = filteredResults.filter(inv => inv.invoiceType === filters.invoiceType);
    }

    if (filters.invoiceStatus) {
      filteredResults = filteredResults.filter(inv => inv.status === filters.invoiceStatus);
    }

    if (filters.amountMin !== undefined) {
      filteredResults = filteredResults.filter(inv => inv.totalAmount >= filters.amountMin!);
    }

    if (filters.amountMax !== undefined) {
      filteredResults = filteredResults.filter(inv => inv.totalAmount <= filters.amountMax!);
    }

    if (filters.dueDateFrom) {
      filteredResults = filteredResults.filter(inv => inv.dueDate >= filters.dueDateFrom!);
    }

    if (filters.dueDateTo) {
      filteredResults = filteredResults.filter(inv => inv.dueDate <= filters.dueDateTo!);
    }

    if (filters.currency) {
      filteredResults = filteredResults.filter(inv => inv.currency === filters.currency);
    }

    if (filters.paymentStatus) {
      const statusMap = {
        pending: ['draft', 'sent', 'viewed'],
        paid: ['paid', 'partial'],
        overdue: ['overdue']
      };
      filteredResults = filteredResults.filter(inv => 
        statusMap[filters.paymentStatus!].includes(inv.status)
      );
    }

    // Update search results count
    if (this.searchHistory.length > 0) {
      this.searchHistory[this.searchHistory.length - 1].results = filteredResults.length;
    }

    return filteredResults.slice(0, limit);
  }

  /**
   * Get invoice document by ID
   */
  public getInvoiceDocument(id: string): InvoiceDocument | null {
    // Check cache first
    if (this.invoiceCache.has(id)) {
      return this.invoiceCache.get(id)!;
    }

    // Get from document service
    const document = this.documentService.getDocument(id);
    if (!document || document.category !== 'invoices') {
      return null;
    }

    const invoiceDocument = this.convertToInvoiceDocument(document);
    if (invoiceDocument) {
      this.invoiceCache.set(id, invoiceDocument);
    }

    return invoiceDocument;
  }

  /**
   * Update invoice document
   */
  public updateInvoiceDocument(
    id: string, 
    updates: Partial<InvoiceDocument>
  ): InvoiceDocument | null {
    const existing = this.getInvoiceDocument(id);
    if (!existing) return null;

    // Update document metadata
    const documentUpdates: Partial<DocumentMetadata> = {
      name: updates.invoiceNumber ? `${updates.invoiceType === 'outgoing' ? 'Rechnung' : 'Eingangsrechnung'}_${updates.invoiceNumber}` : existing.name,
      description: updates.customerName || updates.supplierName ? 
        `${updates.invoiceType === 'outgoing' ? 'Ausgangs' : 'Eingangs'}rechnung ${updates.customerName || updates.supplierName}` : 
        existing.description,
      tags: [
        'rechnung',
        updates.invoiceType || existing.invoiceType,
        updates.status || existing.status,
        updates.currency || existing.currency
      ],
      customerId: updates.customerId,
      supplierId: updates.supplierId,
      projectId: updates.projectId
    };

    this.documentService.updateDocument(id, documentUpdates);

    // Update cached invoice
    const updatedInvoice: InvoiceDocument = {
      ...existing,
      ...updates
    };

    this.invoiceCache.set(id, updatedInvoice);

    return updatedInvoice;
  }

  /**
   * Delete invoice document
   */
  public deleteInvoiceDocument(id: string): boolean {
    this.invoiceCache.delete(id);
    return this.documentService.deleteDocument(id);
  }

  /**
   * Get invoice archive metrics
   */
  public getInvoiceArchiveMetrics(): InvoiceArchiveMetrics {
    const allInvoices = this.searchInvoices('', {}, 1000);
    
    const outgoingInvoices = allInvoices.filter(inv => inv.invoiceType === 'outgoing');
    const incomingInvoices = allInvoices.filter(inv => inv.invoiceType === 'incoming');
    
    const totalRevenue = outgoingInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    const totalExpenses = incomingInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Calculate average processing time (mock)
    const avgProcessingTime = 5.2; // days

    // Analyze search queries
    const searchTerms = this.searchHistory.reduce((acc, search) => {
      if (search.query && search.query !== 'empty') {
        const terms = search.query.toLowerCase().split(/\s+/);
        terms.forEach(term => {
          if (term.length > 2) {
            acc[term] = (acc[term] || 0) + 1;
          }
        });
      }
      return acc;
    }, {} as Record<string, number>);

    const mostSearchedTerms = Object.entries(searchTerms)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentlyArchived = allInvoices
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
      .slice(0, 5);

    return {
      totalInvoices: allInvoices.length,
      outgoingInvoices: outgoingInvoices.length,
      incomingInvoices: incomingInvoices.length,
      totalRevenue,
      totalExpenses,
      avgProcessingTime,
      searchQueries: this.searchHistory.length,
      mostSearchedTerms,
      recentlyArchived
    };
  }

  /**
   * Search invoices by content (full-text search)
   */
  public searchInvoiceContent(
    query: string,
    filters: InvoiceSearchFilters = {}
  ): Array<{ invoice: InvoiceDocument; relevance: number; highlights: string[] }> {
    const results = this.searchInvoices(query, filters, 100);
    
    return results.map(invoice => {
      let relevance = 0;
      const highlights: string[] = [];
      const searchTerms = query.toLowerCase().split(/\s+/);

      // Calculate relevance based on matches
      searchTerms.forEach(term => {
        // Check invoice number
        if (invoice.invoiceNumber.toLowerCase().includes(term)) {
          relevance += 10;
          highlights.push(`Rechnungsnummer: ${invoice.invoiceNumber}`);
        }
        
        // Check customer/supplier name
        if (invoice.customerName.toLowerCase().includes(term) || 
            (invoice.supplierName && invoice.supplierName.toLowerCase().includes(term))) {
          relevance += 8;
          highlights.push(`Name: ${invoice.customerName || invoice.supplierName}`);
        }
        
        // Check extracted text if available
        if (invoice.extractedText && invoice.extractedText.toLowerCase().includes(term)) {
          relevance += 5;
          const index = invoice.extractedText.toLowerCase().indexOf(term);
          const snippet = invoice.extractedText.substring(Math.max(0, index - 30), index + 50);
          highlights.push(`Text: ...${snippet}...`);
        }
        
        // Check description
        if (invoice.description && invoice.description.toLowerCase().includes(term)) {
          relevance += 3;
          highlights.push(`Beschreibung: ${invoice.description}`);
        }
        
        // Check tags
        invoice.tags.forEach(tag => {
          if (tag.toLowerCase().includes(term)) {
            relevance += 2;
            highlights.push(`Tag: ${tag}`);
          }
        });
      });

      return { invoice, relevance, highlights };
    })
    .filter(result => result.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Get related invoices (same customer/supplier, project)
   */
  public getRelatedInvoices(invoiceId: string): InvoiceDocument[] {
    const invoice = this.getInvoiceDocument(invoiceId);
    if (!invoice) return [];

    const filters: InvoiceSearchFilters = {
      invoiceType: invoice.invoiceType
    };

    if (invoice.customerId) {
      filters.customerId = invoice.customerId;
    }
    if (invoice.supplierId) {
      filters.supplierId = invoice.supplierId;
    }
    if (invoice.projectId) {
      filters.projectId = invoice.projectId;
    }

    return this.searchInvoices('', filters, 20)
      .filter(related => related.id !== invoiceId);
  }

  /**
   * Export invoice search results
   */
  public exportInvoices(
    invoices: InvoiceDocument[],
    format: 'csv' | 'json' | 'excel'
  ): string {
    switch (format) {
      case 'csv':
        return this.exportToCsv(invoices);
      case 'json':
        return JSON.stringify(invoices, null, 2);
      case 'excel':
        // In a real implementation, this would generate an actual Excel file
        return this.exportToCsv(invoices);
      default:
        return JSON.stringify(invoices, null, 2);
    }
  }

  /**
   * Convert document to invoice document
   */
  private convertToInvoiceDocument(document: DocumentMetadata): InvoiceDocument | null {
    if (document.category !== 'invoices') return null;

    // Extract invoice information from tags and metadata
    const invoiceType = document.tags.includes('outgoing') ? 'outgoing' : 
                      document.tags.includes('incoming') ? 'incoming' : 'outgoing';
    
    const status = document.tags.find(tag => 
      ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'partial'].includes(tag)
    ) as InvoiceDocument['status'] || 'draft';

    const currency = document.tags.find(tag => 
      ['EUR', 'USD', 'GBP', 'CHF'].includes(tag)
    ) || 'EUR';

    // Try to extract amounts from extracted text
    let totalAmount = 0;
    if (document.extractedText) {
      const amountMatch = document.extractedText.match(/(?:€|EUR)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/);
      if (amountMatch) {
        totalAmount = parseFloat(amountMatch[1].replace(/[.,]/g, '.'));
      }
    }

    return {
      // Copy all document metadata fields
      id: document.id,
      name: document.name,
      originalName: document.originalName,
      type: document.type,
      category: document.category,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      uploadDate: document.uploadDate,
      uploadedBy: document.uploadedBy,
      lastModified: document.lastModified,
      lastModifiedBy: document.lastModifiedBy,
      projectId: document.projectId,
      projectName: document.projectName,
      customerId: document.customerId,
      customerName: document.customerName,
      supplierId: document.supplierId,
      supplierName: document.supplierName,
      tags: document.tags,
      version: document.version,
      parentDocumentId: document.parentDocumentId,
      isStarred: document.isStarred,
      documentStatus: document.status,
      filePath: document.filePath,
      thumbnailPath: document.thumbnailPath,
      description: document.description,
      extractedText: document.extractedText,
      ocrConfidence: document.ocrConfidence,
      autoDetectedInfo: document.autoDetectedInfo,
      reminders: document.reminders,
      shareSettings: document.shareSettings,
      accessLog: document.accessLog,
      
      // Invoice-specific fields
      invoiceNumber: document.name.replace(/^(Rechnung|Eingangsrechnung)_/, ''),
      invoiceDate: document.uploadDate.split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAmount,
      currency,
      status,
      invoiceType,
      taxAmount: totalAmount * 0.19, // Assume 19% tax
      taxRate: 19,
      paymentTerms: 30,
      projectReference: document.projectId
    };
  }

  /**
   * Export to CSV format
   */
  private exportToCsv(invoices: InvoiceDocument[]): string {
    const headers = [
      'ID', 'Rechnungsnummer', 'Typ', 'Datum', 'Fälligkeitsdatum',
      'Kunde/Lieferant', 'Betrag', 'Währung', 'Status', 'Projekt'
    ];

    const rows = invoices.map(invoice => [
      invoice.id,
      invoice.invoiceNumber,
      invoice.invoiceType === 'outgoing' ? 'Ausgehend' : 'Eingehend',
      invoice.invoiceDate,
      invoice.dueDate,
      invoice.customerName || invoice.supplierName || '',
      invoice.totalAmount.toString(),
      invoice.currency,
      invoice.status,
      invoice.projectReference || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\\n');
  }

  /**
   * Initialize mock data for demonstration
   */
  private initializeMockData(): void {
    // This would be replaced with actual data loading in a real implementation
    setTimeout(() => {
      this.searchHistory.push(
        { query: 'rechnung', timestamp: '2024-01-15T10:00:00Z', results: 15 },
        { query: 'mueller', timestamp: '2024-01-16T14:30:00Z', results: 3 },
        { query: 'überfällig', timestamp: '2024-01-17T09:15:00Z', results: 7 },
        { query: 'EUR 5000', timestamp: '2024-01-18T11:45:00Z', results: 2 }
      );
    }, 1000);
  }

  /**
   * Clear search history
   */
  public clearSearchHistory(): void {
    this.searchHistory = [];
  }

  /**
   * Get search suggestions based on history
   */
  public getSearchSuggestions(partialQuery: string): string[] {
    const query = partialQuery.toLowerCase();
    const suggestions = new Set<string>();

    // Add suggestions based on search history
    this.searchHistory.forEach(search => {
      if (search.query.toLowerCase().includes(query)) {
        suggestions.add(search.query);
      }
    });

    // Add common invoice-related suggestions
    const commonTerms = [
      'rechnung', 'invoice', 'überfällig', 'bezahlt', 'offen',
      'EUR', 'USD', 'kunde', 'lieferant', 'projekt'
    ];

    commonTerms.forEach(term => {
      if (term.includes(query) && query.length > 1) {
        suggestions.add(term);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }
}

export default InvoiceDocumentService;