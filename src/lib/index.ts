/**
 * Bauplan Buddy - Core Library Exports
 * 
 * Central export point for all enterprise utilities:
 * - Structured logging
 * - Rate limiting
 * - Query client configuration
 * - GoBD compliance (German legal)
 * - GDPR compliance (EU data protection)
 * - IndexedDB storage
 * - Feature flags
 * - Notifications
 * - Analytics
 * - Performance monitoring
 * - Enhanced API client
 */

// Logging
export { logger, type LogLevel, type LogEntry, type LoggerConfig } from "./logger";

// React Query
export { 
  queryClient, 
  queryKeys, 
  invalidateQueries 
} from "./queryClient";

// Rate Limiting
export { 
  RateLimiter, 
  globalRateLimiter, 
  getRateLimiter, 
  rateLimitedFetch,
  rateLimit,
  type RateLimitConfig,
  type RequestOptions,
} from "./rateLimiter";

// GoBD Compliance (German legal requirements)
export {
  gobdService,
  GoBDComplianceService,
  type GoBDDocument,
  type GoBDDocumentType,
  type AuditLogEntry,
  type AuditAction,
} from "./gobdCompliance";

// GDPR Compliance (EU data protection)
export {
  gdprService,
  GDPRService,
  type DataSubject,
  type ConsentRecord,
  type ConsentType,
  type DataExportRequest,
  type DeletionRequest,
} from "./gdprCompliance";

// IndexedDB Storage
export {
  indexedDBStorage,
  IndexedDBStorage,
  STORES,
  type StoredItem,
  type SyncStatus,
  type SyncQueueItem,
} from "./indexedDBStorage";

// Feature Flags
export {
  featureFlags,
  FeatureFlagsService,
  useFeatureFlag,
  useFeatureFlags,
  type FeatureFlag,
  type FeatureFlagsConfig,
} from "./featureFlags";

// Notification Queue
export {
  notificationQueue,
  NotificationQueueService,
  useNotifications,
  type Notification,
  type NotificationType,
  type NotificationPriority,
  type NotificationCategory,
} from "./notificationQueue";

// Enhanced API Client
export {
  enhancedApiClient,
  EnhancedApiClient,
  type ApiClientConfig,
  type RequestConfig,
} from "./enhancedApiClient";

// Analytics Tracking
export {
  analytics,
  AnalyticsTrackingService,
  usePageTracking,
  type AnalyticsEvent,
  type PageView,
  type UserSession,
  type EventCategory,
} from "./analyticsTracking";

// Performance Monitoring
export {
  usePerformanceMonitor,
  useRenderPerformance,
  formatBytes,
  getPerformanceScore,
  reportPerformanceToAnalytics,
  type PerformanceMetrics,
  type ComponentRenderMetrics,
} from "./performanceMonitor";
