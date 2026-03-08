// Simple UUID generator to avoid import issues
function generateUUID(): string {
  return 'xxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const uuidv4 = generateUUID;

const STORAGE_KEY = 'bp_documents_store_v1';

function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const k = '__doc_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export interface DocumentMetadata {
  id: string;
  name: string;
  originalName: string;
  type: DocumentType;
  category: DocumentCategory;
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
  // Prozess-/Workflow-Kontext
  workflowType?: 'angebot' | 'bestellung' | 'lieferschein' | 'rechnung';
  workflowId?: string; // z. B. Angebots-/Bestell-/LS-/Rechnungsnummer
  counterpartyType?: 'kunde' | 'lieferant';
  counterpartyId?: string; // Kunde oder Lieferant
  tags: string[];
  version: number;
  parentDocumentId?: string;
  isStarred: boolean;
  status: 'active' | 'archived' | 'deleted';
  filePath: string; // DataURL für Preview/Download
  thumbnailPath?: string;
  description?: string;
  extractedText?: string;
  ocrConfidence?: number;
  autoDetectedInfo?: AutoDetectedInfo;
  reminders?: DocumentReminder[];
  shareSettings?: DocumentShareSettings;
  accessLog?: DocumentAccessLog[];
}

export type DocumentType = 
  | 'pdf' | 'image' | 'excel' | 'word' | 'cad' | 'video' | 'audio' | 'text' | 'other';

export type DocumentCategory = 
  | 'contracts' | 'invoices' | 'quotes' | 'plans' | 'photos' | 'reports' 
  | 'permits' | 'certificates' | 'correspondence' | 'specifications' | 'other';

export interface AutoDetectedInfo {
  isInvoice?: boolean;
  isContract?: boolean;
  isPermit?: boolean;
  containsAmounts?: number[];
  containsDates?: string[];
  containsNames?: string[];
  containsAddresses?: string[];
  documentNumber?: string;
  confidence: number;
  language?: string;
}

export interface DocumentReminder {
  id: string;
  type: 'expiry' | 'review' | 'renewal' | 'payment' | 'custom';
  date: string;
  message: string;
  isActive: boolean;
  notificationSent?: boolean;
}

export interface DocumentShareSettings {
  isPublic: boolean;
  allowedUsers: string[];
  allowedRoles: string[];
  expiryDate?: string;
  downloadAllowed: boolean;
  editAllowed: boolean;
}

export interface DocumentAccessLog {
  userId: string;
  userName: string;
  action: 'view' | 'download' | 'edit' | 'share' | 'delete';
  timestamp: string;
  ipAddress?: string;
}

export interface DocumentSearchFilters {
  category?: DocumentCategory;
  type?: DocumentType;
  projectId?: string;
  customerId?: string;
  supplierId?: string;
  // Prozess-/Workflow-Filter
  workflowType?: 'angebot' | 'bestellung' | 'lieferschein' | 'rechnung';
  workflowId?: string;
  counterpartyType?: 'kunde' | 'lieferant';
  counterpartyId?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  hasReminders?: boolean;
  status?: 'active' | 'archived' | 'deleted';
  textSearch?: string;
}

export interface DocumentAnalytics {
  totalDocuments: number;
  totalSize: number;
  categoryCounts: { [category: string]: number };
  typeCounts: { [type: string]: number };
  uploadTrends: { month: string; count: number }[];
  topUsers: { userId: string; userName: string; count: number }[];
  expiringSoon: DocumentMetadata[];
  recentActivity: DocumentAccessLog[];
}

export class AdvancedDocumentService {
  private static instance: AdvancedDocumentService;
  private documents: Map<string, DocumentMetadata> = new Map();
  private searchIndex: Map<string, Set<string>> = new Map(); // word -> document IDs

  public static getInstance(): AdvancedDocumentService {
    if (!AdvancedDocumentService.instance) {
      AdvancedDocumentService.instance = new AdvancedDocumentService();
    }
    return AdvancedDocumentService.instance;
  }

  private constructor() {
    this.restoreFromStorage();
  }

  private restoreFromStorage(): void {
    if (!isStorageAvailable()) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const list = JSON.parse(raw) as DocumentMetadata[];
      list.forEach(doc => {
        this.documents.set(doc.id, doc);
      });
      // Rebuild search index
      Array.from(this.documents.values()).forEach(doc => this.updateSearchIndex(doc));
    } catch (e) {
      // ignore
    }
  }

  private persist(): void {
    if (!isStorageAvailable()) return;
    try {
      const list = Array.from(this.documents.values());
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      // ignore
    }
  }

  /**
   * Upload and process document
   */
  public async uploadDocument(
    file: File,
    metadata: Partial<DocumentMetadata>,
    options: {
      projectId?: string;
      customerId?: string;
      supplierId?: string;
      workflowType?: 'angebot' | 'bestellung' | 'lieferschein' | 'rechnung';
      workflowId?: string;
      counterpartyType?: 'kunde' | 'lieferant';
      counterpartyId?: string;
      performOCR?: boolean;
      autoDetectCategory?: boolean;
    } = {}
  ): Promise<DocumentMetadata> {
    const documentId = uuidv4();
    const fileType = this.detectFileType(file);
    const filePath = await this.saveFile(file); // DataURL
    
    let extractedText: string | undefined;
    let ocrConfidence: number | undefined;
    let autoDetectedInfo: AutoDetectedInfo | undefined;

    // Perform OCR for PDFs and images
    if (options.performOCR && (fileType === 'pdf' || fileType === 'image')) {
      const ocrResult = await this.performOCR(file);
      extractedText = ocrResult.text;
      ocrConfidence = ocrResult.confidence;
    }

    // Auto-detect document information
    if (options.autoDetectCategory && extractedText) {
      autoDetectedInfo = await this.autoDetectDocumentInfo(extractedText);
    }

    // Auto-categorize if not provided
    let category = metadata.category;
    if (!category && autoDetectedInfo) {
      category = this.suggestCategory(autoDetectedInfo, file.name);
    }

    const document: DocumentMetadata = {
      id: documentId,
      name: metadata.name || this.generateDocumentName(file.name, autoDetectedInfo),
      originalName: file.name,
      type: fileType,
      category: category || 'other',
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      uploadDate: new Date().toISOString(),
      uploadedBy: metadata.uploadedBy || 'current-user',
      lastModified: new Date().toISOString(),
      lastModifiedBy: metadata.uploadedBy || 'current-user',
      projectId: options.projectId,
      customerId: options.customerId,
      supplierId: options.supplierId,
      workflowType: options.workflowType ?? metadata.workflowType,
      workflowId: options.workflowId ?? metadata.workflowId,
      counterpartyType: options.counterpartyType ?? metadata.counterpartyType,
      counterpartyId: options.counterpartyId ?? metadata.counterpartyId,
      tags: metadata.tags || [],
      version: 1,
      isStarred: false,
      status: 'active',
      filePath,
      extractedText,
      ocrConfidence,
      autoDetectedInfo,
      description: metadata.description,
      reminders: [],
      accessLog: [{
        userId: 'current-user',
        userName: 'Current User',
        action: 'view',
        timestamp: new Date().toISOString()
      }],
      ...metadata
    };

    // Generate thumbnail for images and PDFs
    if (fileType === 'image' || fileType === 'pdf') {
      document.thumbnailPath = await this.generateThumbnail(file, documentId);
    }

    // Add to search index
    this.updateSearchIndex(document);

    // Save document
    this.documents.set(documentId, document);
    this.persist();

    // Set up automatic reminders for certain document types
    this.setupAutomaticReminders(document);

    return document;
  }

  /**
   * Perform OCR on document
   */
  private async performOCR(file: File): Promise<{ text: string; confidence: number }> {
    // This would integrate with an OCR service like Tesseract.js or cloud OCR
    // For now, simulate OCR processing
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate OCR results based on file type
        const mockText = this.generateMockOCRText(file.name);
        resolve({
          text: mockText,
          confidence: 0.85 + Math.random() * 0.10 // 85-95% confidence
        });
      }, 1000);
    });
  }

  /**
   * Generate mock OCR text for demo
   */
  private generateMockOCRText(fileName: string): string {
    const lowerName = fileName.toLowerCase();
    
    if (lowerName.includes('rechnung') || lowerName.includes('invoice')) {
      return `
        RECHNUNG Nr. RE-2024-001
        Datum: 15.02.2024
        Bauplan Buddy GmbH
        Musterstraße 123
        80331 München
        
        Rechnungsempfänger:
        Familie Müller
        Beispielstraße 456
        80333 München
        
        Leistungsverzeichnis:
        Pos. 1: Rohbauarbeiten Wohnhaus - €45.000,00
        Pos. 2: Dacharbeiten - €15.000,00
        
        Gesamtbetrag: €60.000,00
        MwSt. 19%: €11.400,00
        Endbetrag: €71.400,00
        
        Zahlbar bis: 15.03.2024
      `;
    }
    
    if (lowerName.includes('vertrag') || lowerName.includes('contract')) {
      return `
        BAUVERTRAG
        
        zwischen
        Bauplan Buddy GmbH, München (Auftragnehmer)
        und
        Familie Müller, München (Auftraggeber)
        
        Bauprojekt: Neubau Einfamilienhaus
        Baugrundstück: Beispielstraße 456, 80333 München
        Auftragssumme: €450.000,00
        Bauzeit: 6 Monate
        Baubeginn: 01.04.2024
        
        Vertragsunterzeichnung: 15.02.2024
      `;
    }
    
    if (lowerName.includes('genehmigung') || lowerName.includes('permit')) {
      return `
        BAUGENEHMIGUNG
        
        Aktenzeichen: BG-2024-1234
        Antragsteller: Familie Müller
        Bauvorhaben: Neubau Einfamilienhaus
        Grundstück: Flur 123, Flurstück 456
        Genehmigt am: 10.02.2024
        Gültig bis: 10.02.2027
        
        Diese Genehmigung berechtigt zur Ausführung der im Antrag beschriebenen Baumaßnahmen.
      `;
    }
    
    return `
      Dokument Text Extraktion
      Datum: ${new Date().toLocaleDateString('de-DE')}
      
      Dies ist ein extrahierter Text aus dem Dokument ${fileName}.
      Der Text wurde automatisch durch OCR-Technologie erkannt.
      
      Weitere Informationen sind im Original-Dokument verfügbar.
    `;
  }

  /**
   * Auto-detect document information
   */
  private async autoDetectDocumentInfo(text: string): Promise<AutoDetectedInfo> {
    const info: AutoDetectedInfo = {
      confidence: 0
    };

    // Detect if it's an invoice
    const invoiceKeywords = ['rechnung', 'invoice', 'rechnungsnummer', 'gesamtbetrag', 'mwst'];
    if (invoiceKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      info.isInvoice = true;
      info.confidence += 0.3;
    }

    // Detect if it's a contract
    const contractKeywords = ['vertrag', 'contract', 'vereinbarung', 'auftraggeber', 'auftragnehmer'];
    if (contractKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      info.isContract = true;
      info.confidence += 0.3;
    }

    // Detect if it's a permit
    const permitKeywords = ['genehmigung', 'permit', 'behörde', 'aktenzeichen', 'bewilligung'];
    if (permitKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      info.isPermit = true;
      info.confidence += 0.3;
    }

    // Extract amounts (Euro)
    const amountRegex = /€?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*€?/g;
    const amounts: number[] = [];
    let match;
    while ((match = amountRegex.exec(text)) !== null) {
      const amount = parseFloat(match[1].replace(/[.,]/g, match[1].includes(',') ? '.' : ''));
      if (!isNaN(amount)) {
        amounts.push(amount);
      }
    }
    if (amounts.length > 0) {
      info.containsAmounts = amounts;
      info.confidence += 0.1;
    }

    // Extract dates
    const dateRegex = /(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/g;
    const dates: string[] = [];
    while ((match = dateRegex.exec(text)) !== null) {
      dates.push(match[0]);
    }
    if (dates.length > 0) {
      info.containsDates = dates;
      info.confidence += 0.1;
    }

    // Extract document numbers
    const numberRegex = /(RE|AR|ANG|BG|PRJ)[-\s]?(\d{4})[-\s]?(\d{3,6})/gi;
    const numberMatch = numberRegex.exec(text);
    if (numberMatch) {
      info.documentNumber = numberMatch[0];
      info.confidence += 0.2;
    }

    // Detect language (simple check)
    const germanWords = ['und', 'der', 'die', 'das', 'ist', 'mit', 'von', 'für'];
    const englishWords = ['and', 'the', 'is', 'with', 'from', 'for', 'this'];
    
    const germanCount = germanWords.filter(word => text.toLowerCase().includes(word)).length;
    const englishCount = englishWords.filter(word => text.toLowerCase().includes(word)).length;
    
    info.language = germanCount > englishCount ? 'de' : 'en';

    return info;
  }

  /**
   * Suggest document category based on auto-detected info
   */
  private suggestCategory(info: AutoDetectedInfo, fileName: string): DocumentCategory {
    if (info.isInvoice) return 'invoices';
    if (info.isContract) return 'contracts';
    if (info.isPermit) return 'permits';
    
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('plan') || lowerName.includes('dwg') || lowerName.includes('cad')) return 'plans';
    if (lowerName.includes('foto') || lowerName.includes('photo') || lowerName.includes('bild')) return 'photos';
    if (lowerName.includes('angebot') || lowerName.includes('quote')) return 'quotes';
    if (lowerName.includes('bericht') || lowerName.includes('report')) return 'reports';
    if (lowerName.includes('zertifikat') || lowerName.includes('certificate')) return 'certificates';
    if (lowerName.includes('brief') || lowerName.includes('mail') || lowerName.includes('korrespondenz')) return 'correspondence';
    
    return 'other';
  }

  /**
   * Generate smart document name
   */
  private generateDocumentName(fileName: string, autoInfo?: AutoDetectedInfo): string {
    if (!autoInfo) return fileName;
    
    const baseName = fileName.split('.')[0];
    const extension = fileName.split('.').pop();
    
    let smartName = baseName;
    
    if (autoInfo.documentNumber) {
      smartName = autoInfo.documentNumber;
    }
    
    if (autoInfo.isInvoice) {
      smartName = `Rechnung_${smartName}`;
    } else if (autoInfo.isContract) {
      smartName = `Vertrag_${smartName}`;
    } else if (autoInfo.isPermit) {
      smartName = `Genehmigung_${smartName}`;
    }
    
    if (autoInfo.containsDates && autoInfo.containsDates.length > 0) {
      const date = autoInfo.containsDates[0].replace(/[.\-/]/g, '_');
      smartName += `_${date}`;
    }
    
    return `${smartName}.${extension}`;
  }

  /**
   * Set up automatic reminders
   */
  private setupAutomaticReminders(document: DocumentMetadata): void {
    if (!document.autoDetectedInfo) return;

    const reminders: DocumentReminder[] = [];

    // Contract reminders
    if (document.autoDetectedInfo.isContract) {
      reminders.push({
        id: uuidv4(),
        type: 'review',
        date: new Date(Date.now() + 11 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 11 months
        message: 'Vertragsprüfung vor Ablauf erforderlich',
        isActive: true
      });
    }

    // Permit reminders
    if (document.autoDetectedInfo.isPermit) {
      reminders.push({
        id: uuidv4(),
        type: 'expiry',
        date: new Date(Date.now() + 2.5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2.5 years
        message: 'Genehmigung läuft bald ab - Verlängerung prüfen',
        isActive: true
      });
    }

    // Invoice reminders
    if (document.autoDetectedInfo.isInvoice) {
      reminders.push({
        id: uuidv4(),
        type: 'payment',
        date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 25 days
        message: 'Zahlungseingang prüfen',
        isActive: true
      });
    }

    document.reminders = reminders;
  }

  /**
   * Search documents
   */
  public searchDocuments(
    query: string,
    filters: DocumentSearchFilters = {},
    limit: number = 50
  ): DocumentMetadata[] {
    let results = Array.from(this.documents.values());

    // Default: nur aktive anzeigen, außer explizit gesetzt
    if (!filters.status) {
      results = results.filter(doc => doc.status === 'active');
    }

    // Apply filters
    if (filters.category) {
      results = results.filter(doc => doc.category === filters.category);
    }
    
    if (filters.type) {
      results = results.filter(doc => doc.type === filters.type);
    }
    
    if (filters.projectId) {
      results = results.filter(doc => doc.projectId === filters.projectId);
    }
    
    if (filters.customerId) {
      results = results.filter(doc => doc.customerId === filters.customerId);
    }
    
    if (filters.supplierId) {
      results = results.filter(doc => doc.supplierId === filters.supplierId);
    }
    
    if (filters.workflowType) {
      results = results.filter(doc => doc.workflowType === filters.workflowType);
    }
    
    if (filters.workflowId) {
      results = results.filter(doc => doc.workflowId === filters.workflowId);
    }
    
    if (filters.counterpartyType) {
      results = results.filter(doc => doc.counterpartyType === filters.counterpartyType);
    }
    
    if (filters.counterpartyId) {
      results = results.filter(doc => doc.counterpartyId === filters.counterpartyId);
    }
    
    if (filters.status) {
      results = results.filter(doc => doc.status === filters.status);
    }
    
    if (filters.hasReminders) {
      results = results.filter(doc => doc.reminders && doc.reminders.length > 0);
    }
    
    if (filters.dateFrom) {
      results = results.filter(doc => doc.uploadDate >= filters.dateFrom!);
    }
    
    if (filters.dateTo) {
      results = results.filter(doc => doc.uploadDate <= filters.dateTo!);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(doc => 
        filters.tags!.some(tag => doc.tags.includes(tag))
      );
    }

    // Text search
    if (query && query.trim()) {
      const searchTerms = query.toLowerCase().trim().split(/\s+/);
      results = results.filter(doc => {
        const searchableText = [
          doc.name,
          doc.description || '',
          doc.extractedText || '',
          ...doc.tags
        ].join(' ').toLowerCase();
        
        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // Sort by relevance (upload date for now)
    results.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    return results.slice(0, limit);
  }

  /**
   * Get document analytics
   */
  public getDocumentAnalytics(): DocumentAnalytics {
    const docs = Array.from(this.documents.values()).filter(doc => doc.status === 'active');
    
    const totalSize = docs.reduce((sum, doc) => sum + doc.fileSize, 0);
    
    const categoryCounts = docs.reduce((counts, doc) => {
      counts[doc.category] = (counts[doc.category] || 0) + 1;
      return counts;
    }, {} as { [category: string]: number });
    
    const typeCounts = docs.reduce((counts, doc) => {
      counts[doc.type] = (counts[doc.type] || 0) + 1;
      return counts;
    }, {} as { [type: string]: number });
    
    // Upload trends (last 12 months)
    const uploadTrends = this.calculateUploadTrends(docs);
    
    // Top users by upload count
    const userCounts = docs.reduce((counts, doc) => {
      counts[doc.uploadedBy] = (counts[doc.uploadedBy] || 0) + 1;
      return counts;
    }, {} as { [userId: string]: number });
    
    const topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, userName: userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Documents expiring soon
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringSoon = docs.filter(doc => 
      doc.reminders?.some(reminder => 
        reminder.isActive && 
        new Date(reminder.date) <= thirtyDaysFromNow &&
        new Date(reminder.date) >= now
      )
    );
    
    // Recent activity
    const recentActivity = docs
      .flatMap(doc => doc.accessLog || [])
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return {
      totalDocuments: docs.length,
      totalSize,
      categoryCounts,
      typeCounts,
      uploadTrends,
      topUsers,
      expiringSoon,
      recentActivity
    };
  }

  /**
   * Calculate upload trends
   */
  private calculateUploadTrends(docs: DocumentMetadata[]): { month: string; count: number }[] {
    const trends: { [month: string]: number } = {};
    
    docs.forEach(doc => {
      const date = new Date(doc.uploadDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      trends[monthKey] = (trends[monthKey] || 0) + 1;
    });
    
    return Object.entries(trends)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Update search index
   */
  private updateSearchIndex(document: DocumentMetadata): void {
    const words = [
      document.name,
      document.description || '',
      document.extractedText || '',
      ...document.tags
    ]
      .join(' ')
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2);

    words.forEach(word => {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, new Set());
      }
      this.searchIndex.get(word)!.add(document.id);
    });
  }

  /**
   * Detect file type from file
   */
  private detectFileType(file: File): DocumentType {
    const mimeType = (file.type || '').toLowerCase();
    const fileName = file.name.toLowerCase();
    
    if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) return 'pdf';
    if (mimeType.includes('image') || /\.(jpg|jpeg|png|gif|bmp|webp)$/.test(fileName)) return 'image';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || /\.(xls|xlsx|xlsm)$/.test(fileName)) return 'excel';
    if (mimeType.includes('word') || mimeType.includes('document') || /\.(doc|docx)$/.test(fileName)) return 'word';
    if (/\.(dwg|dxf|step|iges)$/.test(fileName)) return 'cad';
    if (mimeType.includes('video') || /\.(mp4|avi|mov|wmv|flv)$/.test(fileName)) return 'video';
    if (mimeType.includes('audio') || /\.(mp3|wav|flac|aac)$/.test(fileName)) return 'audio';
    if (mimeType.includes('text') || /\.(txt|rtf)$/.test(fileName)) return 'text';
    
    return 'other';
  }

  /**
   * Save file as DataURL (persistable for preview/download)
   */
  private async saveFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result ?? '').toString());
      reader.onerror = () => reject(reader.error ?? new Error('Datei konnte nicht gelesen werden.'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate thumbnail (mock implementation)
   */
  private async generateThumbnail(file: File, documentId: string): Promise<string> {
    // In a real implementation, generate actual thumbnails
    return `thumbnails/${documentId}_thumb.jpg`;
  }

  /**
   * Get document by ID
   */
  public getDocument(id: string): DocumentMetadata | undefined {
    return this.documents.get(id);
  }

  /**
   * Update document metadata
   */
  public updateDocument(id: string, updates: Partial<DocumentMetadata>): DocumentMetadata | null {
    const document = this.documents.get(id);
    if (!document) return null;
    
    const updatedDocument = {
      ...document,
      ...updates,
      lastModified: new Date().toISOString(),
      lastModifiedBy: updates.lastModifiedBy || 'current-user'
    } as DocumentMetadata;
    
    this.documents.set(id, updatedDocument);
    this.updateSearchIndex(updatedDocument);
    this.persist();
    
    return updatedDocument;
  }

  /**
   * Delete document (soft delete)
   */
  public deleteDocument(id: string): boolean {
    const document = this.documents.get(id);
    if (!document) return false;
    
    document.status = 'deleted';
    document.lastModified = new Date().toISOString();
    this.documents.set(id, document);
    this.persist();
    
    return true;
  }

  /**
   * Star/unstar document
   */
  public toggleStar(id: string): boolean {
    const document = this.documents.get(id);
    if (!document) return false;
    
    document.isStarred = !document.isStarred;
    document.lastModified = new Date().toISOString();
    this.documents.set(id, document);
    this.persist();
    
    return true;
  }

  /**
   * Add tag to document
   */
  public addTag(id: string, tag: string): boolean {
    const document = this.documents.get(id);
    if (!document) return false;
    
    if (!document.tags.includes(tag)) {
      document.tags.push(tag);
      document.lastModified = new Date().toISOString();
      this.updateSearchIndex(document);
      this.documents.set(id, document);
      this.persist();
    }
    
    return true;
  }

  /**
   * Remove tag from document
   */
  public removeTag(id: string, tag: string): boolean {
    const document = this.documents.get(id);
    if (!document) return false;
    
    const index = document.tags.indexOf(tag);
    if (index > -1) {
      document.tags.splice(index, 1);
      document.lastModified = new Date().toISOString();
      this.updateSearchIndex(document);
      this.documents.set(id, document);
      this.persist();
    }
    
    return true;
  }

  /**
   * Get expiring documents
   */
  public getExpiringDocuments(days: number = 30): DocumentMetadata[] {
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    return Array.from(this.documents.values()).filter(doc =>
      doc.status === 'active' &&
      doc.reminders?.some(reminder =>
        reminder.isActive &&
        new Date(reminder.date) <= futureDate &&
        new Date(reminder.date) >= new Date()
      )
    );
  }
}

const advancedDocumentService = AdvancedDocumentService.getInstance();
export default advancedDocumentService;