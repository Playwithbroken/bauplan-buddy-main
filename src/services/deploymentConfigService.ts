/**
 * Deployment Configuration Service
 * Allows customers to choose between different deployment modes:
 * - Local (Browser localStorage only)
 * - Self-Hosted (Own server/infrastructure)
 * - Cloud (SaaS/Managed hosting)
 */

export type DeploymentMode = 'local' | 'self-hosted' | 'cloud';

export interface DeploymentConfig {
  mode: DeploymentMode;
  
  // Local mode settings
  local: {
    enabled: boolean;
    maxStorageMB: number;
    autoBackup: boolean;
  };
  
  // Self-hosted mode settings
  selfHosted: {
    enabled: boolean;
    apiUrl: string;
    authToken?: string;
    syncInterval: number; // minutes
    offlineFallback: boolean;
  };
  
  // Cloud mode settings
  cloud: {
    enabled: boolean;
    provider: 'aws' | 'azure' | 'gcp' | 'custom';
    region: string;
    apiUrl: string;
    tenantId?: string;
    syncInterval: number;
  };
  
  // Hybrid settings
  hybrid: {
    primaryMode: DeploymentMode;
    fallbackMode: DeploymentMode;
    autoSync: boolean;
    conflictResolution: 'local-wins' | 'server-wins' | 'manual';
  };
}

const DEFAULT_DEPLOYMENT_CONFIG: DeploymentConfig = {
  mode: 'local',
  
  local: {
    enabled: true,
    maxStorageMB: 50,
    autoBackup: true,
  },
  
  selfHosted: {
    enabled: false,
    apiUrl: '',
    syncInterval: 5,
    offlineFallback: true,
  },
  
  cloud: {
    enabled: false,
    provider: 'custom',
    region: 'eu-central-1',
    apiUrl: '',
    syncInterval: 5,
  },
  
  hybrid: {
    primaryMode: 'local',
    fallbackMode: 'local',
    autoSync: false,
    conflictResolution: 'manual',
  },
};

class DeploymentConfigService {
  private static instance: DeploymentConfigService;
  private readonly CONFIG_KEY = 'bauplan_deployment_config';
  private config: DeploymentConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): DeploymentConfigService {
    if (!DeploymentConfigService.instance) {
      DeploymentConfigService.instance = new DeploymentConfigService();
    }
    return DeploymentConfigService.instance;
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): DeploymentConfig {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        return { ...DEFAULT_DEPLOYMENT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load deployment config:', error);
    }
    return { ...DEFAULT_DEPLOYMENT_CONFIG };
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
      // Notify app about config change
      window.dispatchEvent(new CustomEvent('deploymentConfigChanged', { detail: this.config }));
    } catch (error) {
      console.error('Failed to save deployment config:', error);
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): DeploymentConfig {
    return { ...this.config };
  }

  /**
   * Get current deployment mode
   */
  public getCurrentMode(): DeploymentMode {
    return this.config.mode;
  }

  /**
   * Switch deployment mode
   */
  public setDeploymentMode(mode: DeploymentMode): void {
    this.config.mode = mode;
    this.saveConfig();
  }

  /**
   * Configure local mode
   */
  public configureLocal(settings: Partial<DeploymentConfig['local']>): void {
    this.config.local = { ...this.config.local, ...settings };
    this.saveConfig();
  }

  /**
   * Configure self-hosted mode
   */
  public configureSelfHosted(settings: Partial<DeploymentConfig['selfHosted']>): void {
    this.config.selfHosted = { ...this.config.selfHosted, ...settings };
    this.saveConfig();
  }

  /**
   * Configure cloud mode
   */
  public configureCloud(settings: Partial<DeploymentConfig['cloud']>): void {
    this.config.cloud = { ...this.config.cloud, ...settings };
    this.saveConfig();
  }

  /**
   * Configure hybrid mode
   */
  public configureHybrid(settings: Partial<DeploymentConfig['hybrid']>): void {
    this.config.hybrid = { ...this.config.hybrid, ...settings };
    this.saveConfig();
  }

  /**
   * Test connection to server
   */
  public async testConnection(mode: DeploymentMode): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      let apiUrl = '';
      
      if (mode === 'self-hosted') {
        apiUrl = this.config.selfHosted.apiUrl;
      } else if (mode === 'cloud') {
        apiUrl = this.config.cloud.apiUrl;
      } else {
        return { success: true, latency: 0 }; // Local mode always works
      }

      if (!apiUrl) {
        return { success: false, error: 'API URL not configured' };
      }

      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': mode === 'self-hosted' && this.config.selfHosted.authToken 
            ? `Bearer ${this.config.selfHosted.authToken}` 
            : '',
        },
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return { success: true, latency };
      } else {
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  /**
   * Get API URL based on current mode
   */
  public getApiUrl(): string {
    switch (this.config.mode) {
      case 'self-hosted':
        return this.config.selfHosted.apiUrl;
      case 'cloud':
        return this.config.cloud.apiUrl;
      case 'local':
      default:
        return ''; // No API for local mode
    }
  }

  /**
   * Check if offline mode is supported
   */
  public isOfflineSupported(): boolean {
    switch (this.config.mode) {
      case 'local':
        return true; // Always offline-capable
      case 'self-hosted':
        return this.config.selfHosted.offlineFallback;
      case 'cloud':
        return false; // Cloud mode requires connection
      default:
        return true;
    }
  }

  /**
   * Get sync interval in milliseconds
   */
  public getSyncInterval(): number {
    switch (this.config.mode) {
      case 'self-hosted':
        return this.config.selfHosted.syncInterval * 60 * 1000;
      case 'cloud':
        return this.config.cloud.syncInterval * 60 * 1000;
      case 'local':
      default:
        return 0; // No sync for local mode
    }
  }

  /**
   * Export configuration for backup/migration
   */
  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from backup
   */
  public importConfig(jsonConfig: string): boolean {
    try {
      const imported = JSON.parse(jsonConfig);
      this.config = { ...DEFAULT_DEPLOYMENT_CONFIG, ...imported };
      this.saveConfig();
      return true;
    } catch (error) {
      console.error('Failed to import config:', error);
      return false;
    }
  }

  /**
   * Validate configuration
   */
  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.mode === 'self-hosted') {
      if (!this.config.selfHosted.apiUrl) {
        errors.push('Self-hosted mode requires API URL');
      }
    }

    if (this.config.mode === 'cloud') {
      if (!this.config.cloud.apiUrl) {
        errors.push('Cloud mode requires API URL');
      }
      if (!this.config.cloud.region) {
        errors.push('Cloud mode requires region');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Reset to defaults
   */
  public resetToDefaults(): void {
    this.config = { ...DEFAULT_DEPLOYMENT_CONFIG };
    this.saveConfig();
  }
}

export default DeploymentConfigService;
export const deploymentConfig = DeploymentConfigService.getInstance();
