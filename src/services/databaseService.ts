import { getEnvVar } from '@/utils/env';

// Database configuration
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  connectionTimeout?: number;
  idleTimeout?: number;
  maxConnections?: number;
}

// API configuration
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

// Environment-based configuration
export class ConfigService {
  private static instance: ConfigService;
  
  private apiConfig: ApiConfig;
  private dbConfig: DatabaseConfig | null = null;
  private useApi: boolean;

  private constructor() {
    this.useApi = getEnvVar('VITE_USE_API', 'false') === 'true';
    
    this.apiConfig = {
      baseUrl: getEnvVar('VITE_API_URL', 'http://localhost:3001/api') || 'http://localhost:3001/api',
      timeout: parseInt(getEnvVar('VITE_API_TIMEOUT', '10000') || '10000'),
      retries: parseInt(getEnvVar('VITE_API_RETRIES', '3') || '3'),
      retryDelay: parseInt(getEnvVar('VITE_API_RETRY_DELAY', '1000') || '1000')
    };

    // Database config (only used if running backend server)
    if (this.useApi) {
      this.dbConfig = {
        host: getEnvVar('DB_HOST', 'localhost') || 'localhost',
        port: parseInt(getEnvVar('DB_PORT', '5432') || '5432'),
        database: getEnvVar('DB_NAME', 'bauplan_buddy') || 'bauplan_buddy',
        username: getEnvVar('DB_USER', 'postgres') || 'postgres',
        password: getEnvVar('DB_PASSWORD', '') || '',
        ssl: getEnvVar('DB_SSL', 'false') === 'true',
        connectionTimeout: parseInt(getEnvVar('DB_CONNECTION_TIMEOUT', '10000') || '10000'),
        idleTimeout: parseInt(getEnvVar('DB_IDLE_TIMEOUT', '30000') || '30000'),
        maxConnections: parseInt(getEnvVar('DB_MAX_CONNECTIONS', '10') || '10')
      };
    }
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  getApiConfig(): ApiConfig {
    return this.apiConfig;
  }

  getDatabaseConfig(): DatabaseConfig | null {
    return this.dbConfig;
  }

  shouldUseApi(): boolean {
    return this.useApi;
  }

  isProduction(): boolean {
    return getEnvVar('NODE_ENV') === 'production';
  }

  isDevelopment(): boolean {
    return getEnvVar('NODE_ENV') === 'development';
  }
}

// HTTP Client for API calls
export class ApiClient {
  private config: ApiConfig;
  private baseURL: string;

  constructor(config?: ApiConfig) {
    this.config = config || ConfigService.getInstance().getApiConfig();
    this.baseURL = this.config.baseUrl;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('auth_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      ...options
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    let lastError: Error;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...config,
          signal: AbortSignal.timeout(this.config.timeout)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          return await response.text() as T;
        }
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.retries) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (attempt + 1)));
        }
      }
    }

    throw lastError!;
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
}

// Database models
export interface BaseModel {
  id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface UserModel extends BaseModel {
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'manager' | 'user' | 'client';
  avatar_url?: string;
  last_login?: Date;
  email_verified: boolean;
  phone?: string;
  address?: string;
  company?: string;
}

export interface ProjectModel extends BaseModel {
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  start_date?: Date;
  end_date?: Date;
  budget?: number;
  client_id: string;
  manager_id: string;
  address?: string;
  notes?: string;
}

export interface AppointmentModel extends BaseModel {
  title: string;
  description?: string;
  type: 'site-visit' | 'meeting' | 'delivery' | 'milestone' | 'inspection' | 'internal';
  start_time: Date;
  end_time: Date;
  location?: string;
  project_id?: string;
  creator_id: string;
  attendees: string[]; // User IDs
  team_members: string[]; // User IDs
  equipment: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  customer_notification: boolean;
  reminder_minutes: number;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
}

export interface DocumentModel extends BaseModel {
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  project_id?: string;
  uploaded_by: string;
  version: number;
  parent_document_id?: string; // For versioning
  tags: string[];
  is_public: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: Date;
}

export interface InvoiceModel extends BaseModel {
  invoice_number: string;
  project_id: string;
  client_id: string;
  issue_date: Date;
  due_date: Date;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paid_date?: Date;
  notes?: string;
  payment_terms?: string;
}

export interface InvoiceItemModel extends BaseModel {
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
}

// Migration and backup functionality
export class DatabaseMigrationService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  // Migrate data from localStorage to database
  async migrateFromLocalStorage(): Promise<{
    success: boolean;
    message: string;
    migrated: {
      users: number;
      projects: number;
      appointments: number;
      documents: number;
    };
  }> {
    try {
      const migrationData = this.extractLocalStorageData();
      
      if (!ConfigService.getInstance().shouldUseApi()) {
        return {
          success: false,
          message: 'API backend not configured. Enable API mode to migrate data.',
          migrated: { users: 0, projects: 0, appointments: 0, documents: 0 }
        };
      }

      // Migrate users
      const userCount = await this.migrateUsers(migrationData.users);
      
      // Migrate projects
      const projectCount = await this.migrateProjects(migrationData.projects);
      
      // Migrate appointments
      const appointmentCount = await this.migrateAppointments(migrationData.appointments);
      
      // Migrate documents metadata
      const documentCount = await this.migrateDocuments(migrationData.documents);

      return {
        success: true,
        message: 'Data migration completed successfully',
        migrated: {
          users: userCount,
          projects: projectCount,
          appointments: appointmentCount,
          documents: documentCount
        }
      };
    } catch (error) {
      console.error('Migration failed:', error);
      return {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        migrated: { users: 0, projects: 0, appointments: 0, documents: 0 }
      };
    }
  }

  // Extract data from localStorage
  private extractLocalStorageData() {
    return {
      users: this.getLocalStorageData('users', []),
      projects: this.getLocalStorageData('projects', []),
      appointments: this.getLocalStorageData('appointments', []),
      documents: this.getLocalStorageData('documents', [])
    };
  }

  private getLocalStorageData(key: string, defaultValue: unknown[]) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private async migrateUsers(users: UserModel[]): Promise<number> {
    let count = 0;
    for (const user of users) {
      try {
        await this.apiClient.post('/users', user);
        count++;
      } catch (error) {
        console.warn('Failed to migrate user:', user, error);
      }
    }
    return count;
  }

  private async migrateProjects(projects: ProjectModel[]): Promise<number> {
    let count = 0;
    for (const project of projects) {
      try {
        await this.apiClient.post('/projects', project);
        count++;
      } catch (error) {
        console.warn('Failed to migrate project:', project, error);
      }
    }
    return count;
  }

  private async migrateAppointments(appointments: AppointmentModel[]): Promise<number> {
    let count = 0;
    for (const appointment of appointments) {
      try {
        await this.apiClient.post('/appointments', appointment);
        count++;
      } catch (error) {
        console.warn('Failed to migrate appointment:', appointment, error);
      }
    }
    return count;
  }

  private async migrateDocuments(documents: DocumentModel[]): Promise<number> {
    let count = 0;
    for (const document of documents) {
      try {
        await this.apiClient.post('/documents', document);
        count++;
      } catch (error) {
        console.warn('Failed to migrate document:', document, error);
      }
    }
    return count;
  }

  // Backup data to file
  async createBackup(): Promise<{
    success: boolean;
    message: string;
    backupData?: {
      timestamp: string;
      version: string;
      data: {
        users: UserModel[];
        projects: ProjectModel[];
        appointments: AppointmentModel[];
        documents: DocumentModel[];
      };
    };
  }> {
    try {
      let data;
      
      if (ConfigService.getInstance().shouldUseApi()) {
        // Get data from API
        data = await this.getDataFromAPI();
      } else {
        // Get data from localStorage
        data = this.extractLocalStorageData();
      }

      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data
      };

      // In a real implementation, this would save to a file or cloud storage
      const backupString = JSON.stringify(backup, null, 2);
      
      // For now, trigger download
      this.downloadBackup(backupString, `bauplan-backup-${new Date().toISOString().split('T')[0]}.json`);

      return {
        success: true,
        message: 'Backup created successfully',
        backupData: backup
      };
    } catch (error) {
      return {
        success: false,
        message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async getDataFromAPI() {
    const [users, projects, appointments, documents] = await Promise.all([
      this.apiClient.get('/users').catch(() => []),
      this.apiClient.get('/projects').catch(() => []),
      this.apiClient.get('/appointments').catch(() => []),
      this.apiClient.get('/documents').catch(() => [])
    ]);

    return { users, projects, appointments, documents };
  }

  private downloadBackup(content: string, filename: string) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Restore data from backup
  async restoreFromBackup(backupData: {
    timestamp: string;
    version: string;
    data: {
      users?: UserModel[];
      projects?: ProjectModel[];
      appointments?: AppointmentModel[];
      documents?: DocumentModel[];
    };
  }): Promise<{
    success: boolean;
    message: string;
    restored?: {
      users: number;
      projects: number;
      appointments: number;
      documents: number;
    };
  }> {
    try {
      if (!backupData.data) {
        throw new Error('Invalid backup format');
      }

      if (ConfigService.getInstance().shouldUseApi()) {
        // Restore to API
        return await this.restoreToAPI(backupData.data);
      } else {
        // Restore to localStorage
        return this.restoreToLocalStorage(backupData.data);
      }
    } catch (error) {
      return {
        success: false,
        message: `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async restoreToAPI(data: {
    users?: UserModel[];
    projects?: ProjectModel[];
    appointments?: AppointmentModel[];
    documents?: DocumentModel[];
  }) {
    const results = await Promise.all([
      this.restoreUsersToAPI(data.users || []),
      this.restoreProjectsToAPI(data.projects || []),
      this.restoreAppointmentsToAPI(data.appointments || []),
      this.restoreDocumentsToAPI(data.documents || [])
    ]);

    return {
      success: true,
      message: 'Data restored successfully',
      restored: {
        users: results[0],
        projects: results[1],
        appointments: results[2],
        documents: results[3]
      }
    };
  }

  private restoreToLocalStorage(data: {
    users?: UserModel[];
    projects?: ProjectModel[];
    appointments?: AppointmentModel[];
    documents?: DocumentModel[];
  }) {
    const counts = { users: 0, projects: 0, appointments: 0, documents: 0 };

    try {
      if (data.users) {
        localStorage.setItem('users', JSON.stringify(data.users));
        counts.users = data.users.length;
      }
      if (data.projects) {
        localStorage.setItem('projects', JSON.stringify(data.projects));
        counts.projects = data.projects.length;
      }
      if (data.appointments) {
        localStorage.setItem('appointments', JSON.stringify(data.appointments));
        counts.appointments = data.appointments.length;
      }
      if (data.documents) {
        localStorage.setItem('documents', JSON.stringify(data.documents));
        counts.documents = data.documents.length;
      }

      return {
        success: true,
        message: 'Data restored to localStorage successfully',
        restored: counts
      };
    } catch (error) {
      return {
        success: false,
        message: `LocalStorage restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async restoreUsersToAPI(users: UserModel[]): Promise<number> {
    let count = 0;
    for (const user of users) {
      try {
        await this.apiClient.post('/users', user);
        count++;
      } catch (error) {
        console.warn('Failed to restore user:', user, error);
      }
    }
    return count;
  }

  private async restoreProjectsToAPI(projects: ProjectModel[]): Promise<number> {
    let count = 0;
    for (const project of projects) {
      try {
        await this.apiClient.post('/projects', project);
        count++;
      } catch (error) {
        console.warn('Failed to restore project:', project, error);
      }
    }
    return count;
  }

  private async restoreAppointmentsToAPI(appointments: AppointmentModel[]): Promise<number> {
    let count = 0;
    for (const appointment of appointments) {
      try {
        await this.apiClient.post('/appointments', appointment);
        count++;
      } catch (error) {
        console.warn('Failed to restore appointment:', appointment, error);
      }
    }
    return count;
  }

  private async restoreDocumentsToAPI(documents: DocumentModel[]): Promise<number> {
    let count = 0;
    for (const document of documents) {
      try {
        await this.apiClient.post('/documents', document);
        count++;
      } catch (error) {
        console.warn('Failed to restore document:', document, error);
      }
    }
    return count;
  }
}

// Singleton instances
export const configService = ConfigService.getInstance();
export const apiClient = new ApiClient();
export const migrationService = new DatabaseMigrationService();