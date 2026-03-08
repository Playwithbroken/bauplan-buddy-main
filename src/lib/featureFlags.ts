/**
 * Feature Flags Service
 * 
 * Enterprise-grade feature flags for:
 * - Safe gradual rollouts
 * - A/B testing
 * - User segment targeting
 * - Environment-specific features
 * - Remote configuration
 */

import { logger } from "./logger";

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  environments: ("development" | "staging" | "production")[];
  userSegments?: string[];
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagsConfig {
  remoteUrl?: string;
  refreshIntervalMs: number;
  defaultFlags: Record<string, boolean>;
  userId?: string;
  userSegments?: string[];
  environment: "development" | "staging" | "production";
}

// Default feature flags - can be overridden by remote config
const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    key: "ai_assistant",
    name: "AI Assistant",
    description: "Enable AI-powered assistant features",
    enabled: true,
    rolloutPercentage: 100,
    environments: ["development", "staging", "production"],
  },
  {
    key: "advanced_analytics",
    name: "Advanced Analytics",
    description: "Enable advanced analytics dashboard",
    enabled: true,
    rolloutPercentage: 100,
    environments: ["development", "staging", "production"],
  },
  {
    key: "realtime_collaboration",
    name: "Realtime Collaboration",
    description: "Enable realtime multi-user collaboration",
    enabled: true,
    rolloutPercentage: 80,
    environments: ["development", "staging"],
  },
  {
    key: "dark_mode_v2",
    name: "Dark Mode V2",
    description: "New improved dark mode theme",
    enabled: true,
    rolloutPercentage: 100,
    environments: ["development", "staging", "production"],
  },
  {
    key: "export_to_datev",
    name: "DATEV Export",
    description: "Enable export to DATEV accounting software",
    enabled: true,
    rolloutPercentage: 100,
    environments: ["development", "staging", "production"],
  },
  {
    key: "mobile_app_features",
    name: "Mobile App Features",
    description: "Enable mobile-specific features",
    enabled: true,
    rolloutPercentage: 100,
    environments: ["development", "staging", "production"],
  },
  {
    key: "beta_calendar",
    name: "Beta Calendar",
    description: "New calendar with drag-and-drop",
    enabled: true,
    rolloutPercentage: 50,
    environments: ["development", "staging"],
  },
  {
    key: "gobd_compliance",
    name: "GoBD Compliance",
    description: "Enable GoBD compliance features for German market",
    enabled: true,
    rolloutPercentage: 100,
    environments: ["development", "staging", "production"],
  },
  {
    key: "multi_language",
    name: "Multi-Language Support",
    description: "Enable multiple language translations",
    enabled: true,
    rolloutPercentage: 100,
    environments: ["development", "staging", "production"],
  },
  {
    key: "video_conferencing",
    name: "Video Conferencing",
    description: "Enable integrated video calls",
    enabled: false,
    rolloutPercentage: 0,
    environments: ["development"],
  },
];

class FeatureFlagsService {
  private flags: Map<string, FeatureFlag> = new Map();
  private config: FeatureFlagsConfig;
  private userHash: number = 0;
  private refreshTimer?: NodeJS.Timeout;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.config = {
      refreshIntervalMs: 5 * 60 * 1000, // 5 minutes
      defaultFlags: {},
      environment: this.detectEnvironment(),
    };
    
    this.initializeFlags();
    this.startAutoRefresh();
  }

  private detectEnvironment(): "development" | "staging" | "production" {
    if (import.meta.env.DEV) return "development";
    if (import.meta.env.MODE === "staging") return "staging";
    return "production";
  }

  private initializeFlags(): void {
    DEFAULT_FLAGS.forEach(flag => {
      this.flags.set(flag.key, flag);
    });
    logger.info("Feature flags initialized", { count: this.flags.size });
  }

  /**
   * Configure the feature flags service
   */
  configure(config: Partial<FeatureFlagsConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.userId) {
      this.userHash = this.hashString(config.userId);
    }
    
    if (config.remoteUrl) {
      this.fetchRemoteFlags();
    }
    
    logger.info("Feature flags configured", { 
      environment: this.config.environment,
      hasRemoteUrl: !!this.config.remoteUrl,
    });
  }

  /**
   * Simple string hash for consistent user bucketing
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(flagKey: string): boolean {
    const flag = this.flags.get(flagKey);
    
    if (!flag) {
      // Check default flags
      if (this.config.defaultFlags[flagKey] !== undefined) {
        return this.config.defaultFlags[flagKey];
      }
      logger.warn("Unknown feature flag", { flagKey });
      return false;
    }

    // Check if enabled globally
    if (!flag.enabled) return false;

    // Check environment
    if (!flag.environments.includes(this.config.environment)) {
      return false;
    }

    // Check date range
    const now = new Date();
    if (flag.startDate && now < flag.startDate) return false;
    if (flag.endDate && now > flag.endDate) return false;

    // Check user segments
    if (flag.userSegments && flag.userSegments.length > 0) {
      const userSegments = this.config.userSegments || [];
      const hasSegment = flag.userSegments.some(s => userSegments.includes(s));
      if (!hasSegment) return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const bucket = this.userHash % 100;
      if (bucket >= flag.rolloutPercentage) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all flags status
   */
  getAllFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    this.flags.forEach((flag, key) => {
      result[key] = this.isEnabled(key);
    });
    return result;
  }

  /**
   * Get flag details
   */
  getFlag(flagKey: string): FeatureFlag | undefined {
    return this.flags.get(flagKey);
  }

  /**
   * Override a flag locally (for testing)
   */
  override(flagKey: string, enabled: boolean): void {
    const flag = this.flags.get(flagKey);
    if (flag) {
      flag.enabled = enabled;
      flag.rolloutPercentage = enabled ? 100 : 0;
      this.notifyListeners();
      logger.info("Feature flag overridden", { flagKey, enabled });
    }
  }

  /**
   * Reset all overrides
   */
  resetOverrides(): void {
    this.initializeFlags();
    this.notifyListeners();
    logger.info("Feature flag overrides reset");
  }

  /**
   * Subscribe to flag changes
   */
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  /**
   * Fetch flags from remote server
   */
  private async fetchRemoteFlags(): Promise<void> {
    if (!this.config.remoteUrl) return;

    try {
      const response = await fetch(this.config.remoteUrl, {
        headers: {
          "Content-Type": "application/json",
          ...(this.config.userId && { "X-User-Id": this.config.userId }),
        },
      });

      if (response.ok) {
        const remoteFlags: FeatureFlag[] = await response.json();
        remoteFlags.forEach(flag => {
          this.flags.set(flag.key, {
            ...this.flags.get(flag.key),
            ...flag,
          });
        });
        this.notifyListeners();
        logger.info("Remote feature flags loaded", { count: remoteFlags.length });
      }
    } catch (error) {
      logger.warn("Failed to fetch remote feature flags", { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  private startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(() => {
      if (this.config.remoteUrl) {
        this.fetchRemoteFlags();
      }
    }, this.config.refreshIntervalMs);
  }

  /**
   * Stop auto refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagsService();

// React hook for feature flags
import { useState, useEffect } from "react";

export function useFeatureFlag(flagKey: string): boolean {
  const [enabled, setEnabled] = useState(() => featureFlags.isEnabled(flagKey));

  useEffect(() => {
    const unsubscribe = featureFlags.subscribe(() => {
      setEnabled(featureFlags.isEnabled(flagKey));
    });
    return unsubscribe;
  }, [flagKey]);

  return enabled;
}

export function useFeatureFlags(): Record<string, boolean> {
  const [flags, setFlags] = useState(() => featureFlags.getAllFlags());

  useEffect(() => {
    const unsubscribe = featureFlags.subscribe(() => {
      setFlags(featureFlags.getAllFlags());
    });
    return unsubscribe;
  }, []);

  return flags;
}

// Export for testing
export { FeatureFlagsService };
