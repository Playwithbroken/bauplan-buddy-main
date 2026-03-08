/**
 * GoBD Compliance Service
 * 
 * Implements German GoBD (Grundsätze zur ordnungsmäßigen Führung und 
 * Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer 
 * Form sowie zum Datenzugriff) requirements for:
 * 
 * - Immutable document storage
 * - Audit trail (Verfahrensdokumentation)
 * - Document versioning with timestamps
 * - Digital archiving requirements
 * - Access logging
 */

import { logger } from "./logger";

export interface GoBDDocument {
  id: string;
  type: GoBDDocumentType;
  number: string;
  date: Date;
  hash: string;
  version: number;
  createdAt: Date;
  createdBy: string;
  archivedAt?: Date;
  retentionPeriodYears: number;
  metadata: Record<string, unknown>;
}

export interface AuditLogEntry {
  id: string;
  documentId: string;
  action: AuditAction;
  userId: string;
  userName: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  previousHash?: string;
  newHash?: string;
}

export type GoBDDocumentType = 
  | "INVOICE"           // Rechnung
  | "CREDIT_NOTE"       // Gutschrift
  | "QUOTE"             // Angebot
  | "ORDER_CONFIRMATION" // Auftragsbestätigung
  | "DELIVERY_NOTE"     // Lieferschein
  | "CONTRACT"          // Vertrag
  | "RECEIPT"           // Beleg
  | "CORRESPONDENCE";   // Geschäftskorrespondenz

export type AuditAction =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "ARCHIVE"
  | "EXPORT"
  | "PRINT"
  | "EMAIL"
  | "ACCESS_DENIED";

// Retention periods according to German law (in years)
const RETENTION_PERIODS: Record<GoBDDocumentType, number> = {
  INVOICE: 10,
  CREDIT_NOTE: 10,
  QUOTE: 6,
  ORDER_CONFIRMATION: 6,
  DELIVERY_NOTE: 6,
  CONTRACT: 10,
  RECEIPT: 10,
  CORRESPONDENCE: 6,
};

class GoBDComplianceService {
  private auditLog: AuditLogEntry[] = [];
  private readonly AUDIT_LOG_KEY = "gobd_audit_log";
  private readonly DOCUMENTS_KEY = "gobd_documents";

  constructor() {
    this.loadAuditLog();
  }

  private loadAuditLog(): void {
    try {
      const stored = localStorage.getItem(this.AUDIT_LOG_KEY);
      if (stored) {
        this.auditLog = JSON.parse(stored).map((entry: AuditLogEntry) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
      }
    } catch (error) {
      logger.error("Failed to load GoBD audit log", {}, error instanceof Error ? error : undefined);
    }
  }

  private saveAuditLog(): void {
    try {
      localStorage.setItem(this.AUDIT_LOG_KEY, JSON.stringify(this.auditLog));
    } catch (error) {
      logger.error("Failed to save GoBD audit log", {}, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Generate a SHA-256 hash for document content
   */
  async generateHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Create an audit log entry
   */
  async createAuditEntry(
    documentId: string,
    action: AuditAction,
    userId: string,
    userName: string,
    details?: Record<string, unknown>,
    previousHash?: string,
    newHash?: string
  ): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      documentId,
      action,
      userId,
      userName,
      timestamp: new Date(),
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      details,
      previousHash,
      newHash,
    };

    this.auditLog.push(entry);
    this.saveAuditLog();

    logger.info("GoBD audit entry created", {
      documentId,
      action,
      userId,
    });

    return entry;
  }

  /**
   * Get client IP (best effort - may need server-side implementation)
   */
  private async getClientIP(): Promise<string | undefined> {
    try {
      // In production, this should be provided by the server
      // For now, return undefined
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Register a document for GoBD compliance
   */
  async registerDocument(
    id: string,
    type: GoBDDocumentType,
    number: string,
    content: string,
    userId: string,
    userName: string,
    metadata: Record<string, unknown> = {}
  ): Promise<GoBDDocument> {
    const hash = await this.generateHash(content);
    const now = new Date();

    const document: GoBDDocument = {
      id,
      type,
      number,
      date: now,
      hash,
      version: 1,
      createdAt: now,
      createdBy: userId,
      retentionPeriodYears: RETENTION_PERIODS[type],
      metadata: {
        ...metadata,
        contentLength: content.length,
      },
    };

    // Store document metadata
    const documents = this.getStoredDocuments();
    documents[id] = document;
    localStorage.setItem(this.DOCUMENTS_KEY, JSON.stringify(documents));

    // Create audit entry
    await this.createAuditEntry(
      id,
      "CREATE",
      userId,
      userName,
      { type, number },
      undefined,
      hash
    );

    logger.info("GoBD document registered", {
      documentId: id,
      type,
      number,
      retentionYears: RETENTION_PERIODS[type],
    });

    return document;
  }

  /**
   * Get stored documents
   */
  private getStoredDocuments(): Record<string, GoBDDocument> {
    try {
      const stored = localStorage.getItem(this.DOCUMENTS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Verify document integrity
   */
  async verifyDocument(id: string, content: string): Promise<{
    valid: boolean;
    document?: GoBDDocument;
    error?: string;
  }> {
    const documents = this.getStoredDocuments();
    const document = documents[id];

    if (!document) {
      return { valid: false, error: "Document not found in GoBD registry" };
    }

    const currentHash = await this.generateHash(content);

    if (currentHash !== document.hash) {
      logger.warn("GoBD document integrity check failed", {
        documentId: id,
        expectedHash: document.hash,
        actualHash: currentHash,
      });
      return { 
        valid: false, 
        document,
        error: "Document content has been modified (hash mismatch)" 
      };
    }

    return { valid: true, document };
  }

  /**
   * Get audit trail for a document
   */
  getDocumentAuditTrail(documentId: string): AuditLogEntry[] {
    return this.auditLog
      .filter(entry => entry.documentId === documentId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get documents approaching retention expiry
   */
  getExpiringDocuments(withinMonths: number = 6): GoBDDocument[] {
    const documents = this.getStoredDocuments();
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() + withinMonths);

    return Object.values(documents).filter(doc => {
      const expiryDate = new Date(doc.createdAt);
      expiryDate.setFullYear(expiryDate.getFullYear() + doc.retentionPeriodYears);
      return expiryDate <= thresholdDate && expiryDate > now;
    });
  }

  /**
   * Export audit log for a date range (Verfahrensdokumentation)
   */
  exportAuditLog(startDate: Date, endDate: Date): AuditLogEntry[] {
    return this.auditLog.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  /**
   * Generate GoBD compliance report
   */
  generateComplianceReport(): {
    totalDocuments: number;
    documentsByType: Record<GoBDDocumentType, number>;
    auditEntries: number;
    expiringWithin6Months: number;
    lastAuditEntry?: Date;
  } {
    const documents = this.getStoredDocuments();
    const docArray = Object.values(documents);

    const documentsByType = {} as Record<GoBDDocumentType, number>;
    for (const type of Object.keys(RETENTION_PERIODS) as GoBDDocumentType[]) {
      documentsByType[type] = docArray.filter(d => d.type === type).length;
    }

    const lastEntry = this.auditLog.length > 0 
      ? new Date(Math.max(...this.auditLog.map(e => new Date(e.timestamp).getTime())))
      : undefined;

    return {
      totalDocuments: docArray.length,
      documentsByType,
      auditEntries: this.auditLog.length,
      expiringWithin6Months: this.getExpiringDocuments(6).length,
      lastAuditEntry: lastEntry,
    };
  }

  /**
   * Check if a document type requires archival
   */
  requiresArchival(type: GoBDDocumentType): boolean {
    return RETENTION_PERIODS[type] === 10;
  }

  /**
   * Get retention period for a document type
   */
  getRetentionPeriod(type: GoBDDocumentType): number {
    return RETENTION_PERIODS[type];
  }

  /**
   * Format date according to German standards
   */
  formatGermanDate(date: Date): string {
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  /**
   * Format currency according to German standards
   */
  formatGermanCurrency(amount: number, currency: string = "EUR"): string {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
    }).format(amount);
  }
}

// Singleton instance
export const gobdService = new GoBDComplianceService();

// Export for testing
export { GoBDComplianceService };
