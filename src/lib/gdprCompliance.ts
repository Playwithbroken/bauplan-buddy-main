/**
 * GDPR Compliance Service (DSGVO)
 * 
 * Implements EU GDPR requirements:
 * - Right to data portability (Art. 20)
 * - Right to erasure / "Right to be forgotten" (Art. 17)
 * - Data export in machine-readable format
 * - Consent management
 * - Data processing records
 */

import { logger } from "./logger";
import { indexedDBStorage, STORES } from "./indexedDBStorage";

export interface DataSubject {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  version: string;
}

export interface DataExportRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  status: "pending" | "processing" | "completed" | "failed";
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
  error?: string;
}

export interface DeletionRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  status: "pending" | "processing" | "completed" | "failed";
  scheduledDeletionDate: Date;
  completedAt?: Date;
  error?: string;
  retentionExceptions?: string[];
}

export type ConsentType = 
  | "marketing_emails"
  | "analytics_tracking"
  | "third_party_sharing"
  | "cookies_essential"
  | "cookies_analytics"
  | "cookies_marketing"
  | "data_processing"
  | "terms_of_service"
  | "privacy_policy";

const CONSENT_STORAGE_KEY = "gdpr_consents";
const EXPORT_REQUESTS_KEY = "gdpr_export_requests";
const DELETION_REQUESTS_KEY = "gdpr_deletion_requests";

// Retention periods for different data types (in days)
const RETENTION_PERIODS: Record<string, number> = {
  invoices: 3650,        // 10 years (legal requirement)
  quotes: 2190,          // 6 years
  projects: 3650,        // 10 years
  customer_data: 1095,   // 3 years after last activity
  analytics: 730,        // 2 years
  logs: 365,             // 1 year
  session_data: 30,      // 30 days
};

class GDPRService {
  private consents: Map<string, ConsentRecord[]> = new Map();

  constructor() {
    this.loadConsents();
  }

  private loadConsents(): void {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const records: ConsentRecord[] = JSON.parse(stored);
        records.forEach(record => {
          const userConsents = this.consents.get(record.userId) || [];
          userConsents.push({
            ...record,
            timestamp: new Date(record.timestamp),
          });
          this.consents.set(record.userId, userConsents);
        });
      }
    } catch (error) {
      logger.error("Failed to load GDPR consents", {}, error instanceof Error ? error : undefined);
    }
  }

  private saveConsents(): void {
    try {
      const allConsents: ConsentRecord[] = [];
      this.consents.forEach(records => allConsents.push(...records));
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(allConsents));
    } catch (error) {
      logger.error("Failed to save GDPR consents", {}, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Record user consent
   */
  recordConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    version: string = "1.0"
  ): ConsentRecord {
    const record: ConsentRecord = {
      id: crypto.randomUUID(),
      userId,
      consentType,
      granted,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      version,
    };

    const userConsents = this.consents.get(userId) || [];
    userConsents.push(record);
    this.consents.set(userId, userConsents);
    this.saveConsents();

    logger.info("GDPR consent recorded", {
      userId,
      consentType,
      granted,
    });

    return record;
  }

  /**
   * Check if user has given consent
   */
  hasConsent(userId: string, consentType: ConsentType): boolean {
    const userConsents = this.consents.get(userId) || [];
    const relevantConsents = userConsents
      .filter(c => c.consentType === consentType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return relevantConsents.length > 0 && relevantConsents[0].granted;
  }

  /**
   * Get all consents for a user
   */
  getUserConsents(userId: string): Record<ConsentType, boolean> {
    const userConsents = this.consents.get(userId) || [];
    const result: Partial<Record<ConsentType, boolean>> = {};

    const consentTypes: ConsentType[] = [
      "marketing_emails",
      "analytics_tracking",
      "third_party_sharing",
      "cookies_essential",
      "cookies_analytics",
      "cookies_marketing",
      "data_processing",
      "terms_of_service",
      "privacy_policy",
    ];

    consentTypes.forEach(type => {
      result[type] = this.hasConsent(userId, type);
    });

    return result as Record<ConsentType, boolean>;
  }

  /**
   * Withdraw consent
   */
  withdrawConsent(userId: string, consentType: ConsentType): void {
    this.recordConsent(userId, consentType, false);
    logger.info("GDPR consent withdrawn", { userId, consentType });
  }

  /**
   * Request data export (Art. 20 - Right to data portability)
   */
  async requestDataExport(userId: string): Promise<DataExportRequest> {
    const request: DataExportRequest = {
      id: crypto.randomUUID(),
      userId,
      requestedAt: new Date(),
      status: "pending",
    };

    // Store request
    const requests = this.getExportRequests();
    requests.push(request);
    localStorage.setItem(EXPORT_REQUESTS_KEY, JSON.stringify(requests));

    logger.info("GDPR data export requested", { userId, requestId: request.id });

    // Process export
    await this.processDataExport(request);

    return request;
  }

  private getExportRequests(): DataExportRequest[] {
    try {
      const stored = localStorage.getItem(EXPORT_REQUESTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Process data export
   */
  private async processDataExport(request: DataExportRequest): Promise<void> {
    try {
      request.status = "processing";
      
      // Collect all user data
      const exportData = await this.collectUserData(request.userId);

      // Create downloadable JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      
      // Create download URL
      request.downloadUrl = URL.createObjectURL(blob);
      request.status = "completed";
      request.completedAt = new Date();
      request.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Update stored request
      const requests = this.getExportRequests();
      const index = requests.findIndex(r => r.id === request.id);
      if (index >= 0) {
        requests[index] = request;
        localStorage.setItem(EXPORT_REQUESTS_KEY, JSON.stringify(requests));
      }

      logger.info("GDPR data export completed", { 
        userId: request.userId, 
        requestId: request.id,
        dataSize: blob.size,
      });
    } catch (error) {
      request.status = "failed";
      request.error = error instanceof Error ? error.message : String(error);
      logger.error("GDPR data export failed", { requestId: request.id }, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Collect all user data for export
   */
  private async collectUserData(userId: string): Promise<Record<string, unknown>> {
    const exportData: Record<string, unknown> = {
      exportDate: new Date().toISOString(),
      userId,
      gdprVersion: "1.0",
      sections: {},
    };

    // Collect data from IndexedDB stores
    for (const storeName of Object.values(STORES)) {
      if (storeName === "syncQueue" || storeName === "metadata") continue;
      
      try {
        const items = await indexedDBStorage.getAll(storeName);
        // Filter items belonging to user (if applicable)
        const userItems = items.filter(item => {
          const data = item.data as Record<string, unknown>;
          return data.userId === userId || 
                 data.createdBy === userId || 
                 data.ownerId === userId;
        });
        
        if (userItems.length > 0) {
          (exportData.sections as Record<string, unknown>)[storeName] = userItems.map(i => i.data);
        }
      } catch (error) {
        logger.warn(`Failed to collect ${storeName} for export`, { userId });
      }
    }

    // Add consent history
    exportData.consents = this.consents.get(userId) || [];

    // Add local storage data
    const localStorageData: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(userId)) {
        try {
          localStorageData[key] = JSON.parse(localStorage.getItem(key) || "null");
        } catch {
          localStorageData[key] = localStorage.getItem(key);
        }
      }
    }
    exportData.localStorage = localStorageData;

    return exportData;
  }

  /**
   * Request data deletion (Art. 17 - Right to be forgotten)
   */
  async requestDeletion(
    userId: string,
    gracePeriodDays: number = 30
  ): Promise<DeletionRequest> {
    const request: DeletionRequest = {
      id: crypto.randomUUID(),
      userId,
      requestedAt: new Date(),
      status: "pending",
      scheduledDeletionDate: new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000),
      retentionExceptions: this.getRetentionExceptions(),
    };

    // Store request
    const requests = this.getDeletionRequests();
    requests.push(request);
    localStorage.setItem(DELETION_REQUESTS_KEY, JSON.stringify(requests));

    logger.info("GDPR deletion requested", {
      userId,
      requestId: request.id,
      scheduledDate: request.scheduledDeletionDate,
    });

    return request;
  }

  private getDeletionRequests(): DeletionRequest[] {
    try {
      const stored = localStorage.getItem(DELETION_REQUESTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get data types that must be retained for legal reasons
   */
  private getRetentionExceptions(): string[] {
    return [
      "invoices (10 years - GoBD/HGB requirement)",
      "tax-relevant documents (10 years - AO requirement)",
      "contracts (statute of limitations)",
    ];
  }

  /**
   * Cancel deletion request (within grace period)
   */
  cancelDeletion(requestId: string): boolean {
    const requests = this.getDeletionRequests();
    const index = requests.findIndex(r => r.id === requestId);
    
    if (index >= 0 && requests[index].status === "pending") {
      requests.splice(index, 1);
      localStorage.setItem(DELETION_REQUESTS_KEY, JSON.stringify(requests));
      logger.info("GDPR deletion cancelled", { requestId });
      return true;
    }
    
    return false;
  }

  /**
   * Execute deletion (called after grace period)
   */
  async executeDeletion(request: DeletionRequest): Promise<void> {
    try {
      request.status = "processing";
      
      const userId = request.userId;

      // Delete from IndexedDB (except retention exceptions)
      for (const storeName of Object.values(STORES)) {
        if (storeName === "syncQueue" || storeName === "metadata") continue;
        
        // Skip stores with legal retention requirements
        if (["invoices", "projects"].includes(storeName)) {
          logger.info(`Skipping ${storeName} due to legal retention`, { userId });
          continue;
        }

        try {
          const items = await indexedDBStorage.getAll(storeName);
          for (const item of items) {
            const data = item.data as Record<string, unknown>;
            if (data.userId === userId || data.createdBy === userId) {
              await indexedDBStorage.delete(storeName as typeof STORES[keyof typeof STORES], item.id);
            }
          }
        } catch (error) {
          logger.warn(`Failed to delete from ${storeName}`, { userId });
        }
      }

      // Clear consents
      this.consents.delete(userId);
      this.saveConsents();

      // Clear local storage (except critical data)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(userId) && !key.includes("retention")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      request.status = "completed";
      request.completedAt = new Date();

      // Update stored request
      const requests = this.getDeletionRequests();
      const index = requests.findIndex(r => r.id === request.id);
      if (index >= 0) {
        requests[index] = request;
        localStorage.setItem(DELETION_REQUESTS_KEY, JSON.stringify(requests));
      }

      logger.info("GDPR deletion completed", { userId, requestId: request.id });
    } catch (error) {
      request.status = "failed";
      request.error = error instanceof Error ? error.message : String(error);
      logger.error("GDPR deletion failed", { requestId: request.id }, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Get retention period for data type
   */
  getRetentionPeriod(dataType: string): number {
    return RETENTION_PERIODS[dataType] || 365;
  }

  /**
   * Generate privacy policy summary
   */
  getPrivacySummary(): Record<string, unknown> {
    return {
      dataController: "Bauplan Buddy GmbH",
      dpo: "datenschutz@bauplan-buddy.de",
      purposes: [
        "Contract fulfillment",
        "Customer support",
        "Service improvement",
        "Legal compliance",
      ],
      legalBasis: [
        "Art. 6(1)(b) GDPR - Contract performance",
        "Art. 6(1)(c) GDPR - Legal obligation",
        "Art. 6(1)(f) GDPR - Legitimate interests",
        "Art. 6(1)(a) GDPR - Consent",
      ],
      retentionPeriods: RETENTION_PERIODS,
      rights: [
        "Right of access (Art. 15)",
        "Right to rectification (Art. 16)",
        "Right to erasure (Art. 17)",
        "Right to restriction (Art. 18)",
        "Right to data portability (Art. 20)",
        "Right to object (Art. 21)",
      ],
      supervisoryAuthority: "Landesbeauftragte für Datenschutz",
    };
  }
}

// Singleton instance
export const gdprService = new GDPRService();

// Export for testing
export { GDPRService };
