import { createWorker, Worker } from 'tesseract.js';
import { ErrorHandlingService } from './errorHandlingService';

export interface OCRResult {
  id: string;
  documentId: string;
  text: string;
  confidence: number;
  language: string;
  processingTime: number;
  words: OCRWord[];
  lines: OCRLine[];
  paragraphs: OCRParagraph[];
  extractedData: ExtractedData;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OCRWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  baseline: number;
  fontName?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
}

export interface OCRLine {
  text: string;
  confidence: number;
  words: OCRWord[];
  bbox: BoundingBox;
}

export interface OCRParagraph {
  text: string;
  confidence: number;
  lines: OCRLine[];
  bbox: BoundingBox;
}

// Internal shapes for OCR engine outputs
interface RawBBox { x0: number; y0: number; x1: number; y1: number }
interface RawWord { text: string; confidence: number; bbox: RawBBox; baseline: number }
interface RawLine { text: string; confidence: number; words: RawWord[]; bbox: RawBBox }
interface RawParagraph { text: string; confidence: number; lines: RawLine[]; bbox: RawBBox }

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface ExtractedData {
  invoices?: InvoiceData[];
  contracts?: ContractData[];
  reports?: ReportData[];
  receipts?: ReceiptData[];
  certificates?: CertificateData[];
  general?: GeneralData;
}

export interface InvoiceData {
  invoiceNumber?: string;
  date?: string;
  dueDate?: string;
  totalAmount?: number;
  currency?: string;
  vendorName?: string;
  vendorAddress?: string;
  customerName?: string;
  customerAddress?: string;
  items?: InvoiceItem[];
  taxAmount?: number;
  taxRate?: number;
}

export interface InvoiceItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface ContractData {
  contractNumber?: string;
  parties?: string[];
  startDate?: string;
  endDate?: string;
  value?: number;
  scope?: string;
  terms?: string[];
}

export interface ReportData {
  title?: string;
  date?: string;
  author?: string;
  project?: string;
  summary?: string;
  findings?: string[];
  recommendations?: string[];
}

export interface ReceiptData {
  vendor?: string;
  date?: string;
  totalAmount?: number;
  items?: string[];
  paymentMethod?: string;
}

export interface CertificateData {
  type?: string;
  issuer?: string;
  recipient?: string;
  issueDate?: string;
  expiryDate?: string;
  certificateNumber?: string;
}

export interface GeneralData {
  documentType?: string;
  title?: string;
  author?: string;
  date?: string;
  keywords?: string[];
  summary?: string;
}

export interface OCRConfig {
  language: string;
  outputFormat: 'text' | 'hocr' | 'tsv' | 'pdf';
  psm: number; // Page Segmentation Mode
  oem: number; // OCR Engine Mode
  tesseditCharWhitelist?: string;
  preserveInterwordSpaces: boolean;
  rotateAuto: boolean;
  rectangle?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export interface OCRProgress {
  status: string;
  progress: number;
  userJobId: string;
}

export class OCRService {
  private static workers: Map<string, Worker> = new Map();
  private static readonly RESULTS_KEY = 'bauplan-buddy-ocr-results';
  private static readonly MAX_CONCURRENT_WORKERS = 3;
  private static readonly SUPPORTED_LANGUAGES = ['deu', 'eng', 'fra', 'spa', 'ita'];

  /**
   * Initialize OCR service with default configurations
   */
  static async initialize(): Promise<void> {
    try {
      // Pre-warm one worker for faster initial processing
      await this.createWorker('deu');
      
      ErrorHandlingService.info(
        'OCR service initialized successfully',
        'ocr_service'
      );
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to initialize OCR service',
        error as Error,
        'ocr_service'
      );
    }
  }

  /**
   * Process document with OCR
   */
  static async processDocument(
    file: File,
    config: Partial<OCRConfig> = {},
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult> {
    const startTime = Date.now();
    const resultId = this.generateId();
    
    try {
      // Validate file
      if (!this.isValidImageFile(file)) {
        throw new Error('Unsupported file format. Please upload PNG, JPG, JPEG, PDF, or TIFF files.');
      }

      const defaultConfig: OCRConfig = {
        language: 'deu',
        outputFormat: 'text',
        psm: 3, // Fully automatic page segmentation
        oem: 3, // Default OCR Engine Mode
        preserveInterwordSpaces: true,
        rotateAuto: true,
        ...config
      };

      // Create initial result entry
      const result: OCRResult = {
        id: resultId,
        documentId: this.generateDocumentId(file),
        text: '',
        confidence: 0,
        language: defaultConfig.language,
        processingTime: 0,
        words: [],
        lines: [],
        paragraphs: [],
        extractedData: {},
        status: 'processing',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.saveResult(result);

      // Get or create worker
      const worker = await this.getWorker(defaultConfig.language);

      // Set up progress tracking
      if (onProgress) {
        worker.setLogger(({ status, progress, userJobId }) => {
          onProgress({ status, progress: progress * 100, userJobId });
        });
      }

      // Configure worker
      await worker.setParameters({
        tessedit_pageseg_mode: defaultConfig.psm.toString(),
        tessedit_ocr_engine_mode: defaultConfig.oem.toString(),
        preserve_interword_spaces: defaultConfig.preserveInterwordSpaces ? '1' : '0',
        ...(defaultConfig.tesseditCharWhitelist && {
          tessedit_char_whitelist: defaultConfig.tesseditCharWhitelist
        })
      });

      // Process image
      const { data } = await worker.recognize(file, {
        rectangle: config.rectangle
      });

      const processingTime = Date.now() - startTime;

      // Extract structured data
      const extractedData = await this.extractStructuredData(data.text, file.name);

      // Update result
      const finalResult: OCRResult = {
        ...result,
        text: data.text,
        confidence: data.confidence,
        processingTime,
        words: this.convertWords(data.words),
        lines: this.convertLines(data.lines),
        paragraphs: this.convertParagraphs(data.paragraphs),
        extractedData,
        status: 'completed',
        updatedAt: new Date().toISOString()
      };

      this.saveResult(finalResult);

      ErrorHandlingService.info(
        `OCR processing completed: ${file.name}`,
        'ocr_processing',
        {
          documentId: finalResult.documentId,
          confidence: finalResult.confidence,
          processingTime: finalResult.processingTime,
          textLength: finalResult.text.length
        }
      );

      return finalResult;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      const failedResult: OCRResult = {
        id: resultId,
        documentId: this.generateDocumentId(file),
        text: '',
        confidence: 0,
        language: config.language || 'deu',
        processingTime,
        words: [],
        lines: [],
        paragraphs: [],
        extractedData: {},
        status: 'failed',
        error: (error as Error).message,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.saveResult(failedResult);

      ErrorHandlingService.error(
        'OCR processing failed',
        error as Error,
        'ocr_processing',
        { fileName: file.name }
      );

      throw error;
    }
  }

  /**
   * Process multiple documents in batch
   */
  static async processBatch(
    files: File[],
    config: Partial<OCRConfig> = {},
    onProgress?: (fileIndex: number, progress: OCRProgress) => void
  ): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    const concurrentLimit = Math.min(this.MAX_CONCURRENT_WORKERS, files.length);
    
    try {
      // Process files in batches to avoid overwhelming the system
      for (let i = 0; i < files.length; i += concurrentLimit) {
        const batch = files.slice(i, i + concurrentLimit);
        
        const batchPromises = batch.map((file, batchIndex) => 
          this.processDocument(file, config, (progress) => {
            onProgress?.(i + batchIndex, progress);
          })
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            ErrorHandlingService.warn(
              'Batch OCR processing failed for file',
              'ocr_batch',
              { error: result.reason }
            );
          }
        });
      }

      return results;
    } catch (error) {
      ErrorHandlingService.error(
        'Batch OCR processing failed',
        error as Error,
        'ocr_batch'
      );
      throw error;
    }
  }

  /**
   * Extract specific data types from text
   */
  static async extractStructuredData(text: string, fileName: string): Promise<ExtractedData> {
    try {
      const extractedData: ExtractedData = {};

      // Determine document type based on content and filename
      const documentType = this.detectDocumentType(text, fileName);

      switch (documentType) {
        case 'invoice':
          extractedData.invoices = [this.extractInvoiceData(text)];
          break;
        case 'contract':
          extractedData.contracts = [this.extractContractData(text)];
          break;
        case 'report':
          extractedData.reports = [this.extractReportData(text)];
          break;
        case 'receipt':
          extractedData.receipts = [this.extractReceiptData(text)];
          break;
        case 'certificate':
          extractedData.certificates = [this.extractCertificateData(text)];
          break;
        default:
          extractedData.general = this.extractGeneralData(text);
      }

      return extractedData;
    } catch (error) {
      ErrorHandlingService.warn(
        'Failed to extract structured data',
        'ocr_extraction',
        { error: (error as Error).message }
      );
      return { general: this.extractGeneralData(text) };
    }
  }

  /**
   * Search OCR results by text content
   */
  static searchResults(query: string, language?: string): OCRResult[] {
    const results = this.getAllResults();
    const searchTerm = query.toLowerCase();

    return results.filter(result => {
      if (language && result.language !== language) {
        return false;
      }

      return result.text.toLowerCase().includes(searchTerm) ||
             result.words.some(word => word.text.toLowerCase().includes(searchTerm));
    });
  }

  /**
   * Get OCR result by ID
   */
  static getResult(resultId: string): OCRResult | null {
    const results = this.getAllResults();
    return results.find(result => result.id === resultId) || null;
  }

  /**
   * Get all OCR results
   */
  static getAllResults(): OCRResult[] {
    try {
      const data = localStorage.getItem(this.RESULTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Delete OCR result
   */
  static deleteResult(resultId: string): boolean {
    try {
      const results = this.getAllResults();
      const filteredResults = results.filter(result => result.id !== resultId);
      localStorage.setItem(this.RESULTS_KEY, JSON.stringify(filteredResults));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all OCR results
   */
  static clearAllResults(): void {
    localStorage.removeItem(this.RESULTS_KEY);
  }

  /**
   * Get supported languages
   */
  static getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'deu', name: 'Deutsch' },
      { code: 'eng', name: 'English' },
      { code: 'fra', name: 'Français' },
      { code: 'spa', name: 'Español' },
      { code: 'ita', name: 'Italiano' }
    ];
  }

  /**
   * Cleanup workers
   */
  static async cleanup(): Promise<void> {
    try {
      for (const [lang, worker] of this.workers) {
        await worker.terminate();
      }
      this.workers.clear();
      
      ErrorHandlingService.info(
        'OCR workers cleaned up successfully',
        'ocr_service'
      );
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to cleanup OCR workers',
        error as Error,
        'ocr_service'
      );
    }
  }

  // Private helper methods

  private static async createWorker(language: string): Promise<Worker> {
    const worker = await createWorker(language, 1, {
      logger: m => console.log(m)
    });
    
    await worker.loadLanguage(language);
    await worker.initialize(language);
    
    return worker;
  }

  private static async getWorker(language: string): Promise<Worker> {
    if (!this.SUPPORTED_LANGUAGES.includes(language)) {
      language = 'deu'; // Fallback to German
    }

    if (!this.workers.has(language)) {
      if (this.workers.size >= this.MAX_CONCURRENT_WORKERS) {
        // Remove oldest worker
        const [oldestLang] = this.workers.keys();
        const oldWorker = this.workers.get(oldestLang)!;
        await oldWorker.terminate();
        this.workers.delete(oldestLang);
      }

      const worker = await this.createWorker(language);
      this.workers.set(language, worker);
    }

    return this.workers.get(language)!;
  }

  private static isValidImageFile(file: File): boolean {
    const validTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/tiff',
      'image/bmp',
      'application/pdf'
    ];
    
    return validTypes.includes(file.type) && file.size <= 50 * 1024 * 1024; // 50MB limit
  }

  private static generateId(): string {
    return `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateDocumentId(file: File): string {
    return `doc-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
  }

  private static saveResult(result: OCRResult): void {
    try {
      const results = this.getAllResults();
      const existingIndex = results.findIndex(r => r.id === result.id);
      
      if (existingIndex >= 0) {
        results[existingIndex] = result;
      } else {
        results.push(result);
      }
      
      localStorage.setItem(this.RESULTS_KEY, JSON.stringify(results));
    } catch (error) {
      ErrorHandlingService.error(
        'Failed to save OCR result',
        error as Error,
        'ocr_service'
      );
    }
  }

  private static convertWords(words: RawWord[]): OCRWord[] {
    return words.map(word => ({
      text: word.text,
      confidence: word.confidence,
      bbox: {
        x0: word.bbox.x0,
        y0: word.bbox.y0,
        x1: word.bbox.x1,
        y1: word.bbox.y1
      },
      baseline: word.baseline
    }));
  }

  private static convertLines(lines: RawLine[]): OCRLine[] {
    return lines.map(line => ({
      text: line.text,
      confidence: line.confidence,
      words: this.convertWords(line.words),
      bbox: {
        x0: line.bbox.x0,
        y0: line.bbox.y0,
        x1: line.bbox.x1,
        y1: line.bbox.y1
      }
    }));
  }

  private static convertParagraphs(paragraphs: RawParagraph[]): OCRParagraph[] {
    return paragraphs.map(paragraph => ({
      text: paragraph.text,
      confidence: paragraph.confidence,
      lines: this.convertLines(paragraph.lines),
      bbox: {
        x0: paragraph.bbox.x0,
        y0: paragraph.bbox.y0,
        x1: paragraph.bbox.x1,
        y1: paragraph.bbox.y1
      }
    }));
  }

  private static detectDocumentType(text: string, fileName: string): string {
    const lowerText = text.toLowerCase();
    const lowerFileName = fileName.toLowerCase();

    // Invoice detection
    if (lowerText.includes('rechnung') || lowerText.includes('invoice') || 
        lowerText.includes('faktura') || lowerFileName.includes('rechnung') ||
        lowerFileName.includes('invoice')) {
      return 'invoice';
    }

    // Contract detection
    if (lowerText.includes('vertrag') || lowerText.includes('contract') ||
        lowerText.includes('vereinbarung') || lowerFileName.includes('vertrag')) {
      return 'contract';
    }

    // Report detection
    if (lowerText.includes('bericht') || lowerText.includes('report') ||
        lowerText.includes('protokoll') || lowerFileName.includes('bericht')) {
      return 'report';
    }

    // Receipt detection
    if (lowerText.includes('beleg') || lowerText.includes('receipt') ||
        lowerText.includes('quittung') || lowerFileName.includes('beleg')) {
      return 'receipt';
    }

    // Certificate detection
    if (lowerText.includes('zertifikat') || lowerText.includes('certificate') ||
        lowerText.includes('bescheinigung') || lowerFileName.includes('zertifikat')) {
      return 'certificate';
    }

    return 'general';
  }

  private static extractInvoiceData(text: string): InvoiceData {
    const invoiceData: InvoiceData = {};

    // Extract invoice number
    const invoiceNumberMatch = text.match(/(?:rechnung|invoice)[\s#-]*(\w+)/i);
    if (invoiceNumberMatch) {
      invoiceData.invoiceNumber = invoiceNumberMatch[1];
    }

    // Extract amounts (simple regex for German/European format)
    const amountMatches = text.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)[\s]*€/g);
    if (amountMatches && amountMatches.length > 0) {
      const lastAmount = amountMatches[amountMatches.length - 1];
      const numericAmount = parseFloat(lastAmount.replace(/\./g, '').replace(',', '.').replace('€', ''));
      invoiceData.totalAmount = numericAmount;
      invoiceData.currency = 'EUR';
    }

    // Extract dates
    const dateMatches = text.match(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})/g);
    if (dateMatches && dateMatches.length > 0) {
      invoiceData.date = dateMatches[0];
    }

    return invoiceData;
  }

  private static extractContractData(text: string): ContractData {
    const contractData: ContractData = {};

    // Extract contract number
    const contractNumberMatch = text.match(/(?:vertrag|contract)[\s#-]*(\w+)/i);
    if (contractNumberMatch) {
      contractData.contractNumber = contractNumberMatch[1];
    }

    // Extract dates
    const dateMatches = text.match(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})/g);
    if (dateMatches && dateMatches.length >= 2) {
      contractData.startDate = dateMatches[0];
      contractData.endDate = dateMatches[1];
    }

    return contractData;
  }

  private static extractReportData(text: string): ReportData {
    const reportData: ReportData = {};

    // Extract title (usually first line)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      reportData.title = lines[0].trim();
    }

    // Extract dates
    const dateMatches = text.match(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})/g);
    if (dateMatches && dateMatches.length > 0) {
      reportData.date = dateMatches[0];
    }

    return reportData;
  }

  private static extractReceiptData(text: string): ReceiptData {
    const receiptData: ReceiptData = {};

    // Extract total amount
    const amountMatches = text.match(/(?:total|summe|gesamt)[\s:]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)[\s]*€/i);
    if (amountMatches) {
      const numericAmount = parseFloat(amountMatches[1].replace(/\./g, '').replace(',', '.'));
      receiptData.totalAmount = numericAmount;
    }

    // Extract date
    const dateMatches = text.match(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})/g);
    if (dateMatches && dateMatches.length > 0) {
      receiptData.date = dateMatches[0];
    }

    return receiptData;
  }

  private static extractCertificateData(text: string): CertificateData {
    const certificateData: CertificateData = {};

    // Extract certificate number
    const certNumberMatch = text.match(/(?:zertifikat|certificate)[\s#-]*(\w+)/i);
    if (certNumberMatch) {
      certificateData.certificateNumber = certNumberMatch[1];
    }

    // Extract dates
    const dateMatches = text.match(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})/g);
    if (dateMatches && dateMatches.length >= 2) {
      certificateData.issueDate = dateMatches[0];
      certificateData.expiryDate = dateMatches[1];
    }

    return certificateData;
  }

  private static extractGeneralData(text: string): GeneralData {
    const generalData: GeneralData = {};

    // Extract first line as potential title
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      generalData.title = lines[0].trim();
    }

    // Extract dates
    const dateMatches = text.match(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})/g);
    if (dateMatches && dateMatches.length > 0) {
      generalData.date = dateMatches[0];
    }

    // Generate simple summary (first 200 characters)
    generalData.summary = text.substring(0, 200).trim() + (text.length > 200 ? '...' : '');

    // Extract potential keywords (words longer than 4 characters, appearing multiple times)
    const words = text.toLowerCase().match(/\b\w{5,}\b/g) || [];
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    generalData.keywords = Object.entries(wordCount)
      .filter(([_, count]) => count > 1)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 10)
      .map(([word, _]) => word);

    return generalData;
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  OCRService.initialize();
}
