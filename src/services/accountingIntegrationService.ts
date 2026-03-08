export interface AccountingProvider {
  id: string;
  name: string;
  type: 'datev' | 'lexware' | 'sevdesk' | 'fastbill' | 'custom';
  enabled: boolean;
  authenticated: boolean;
  apiEndpoint: string;
  credentials: AccountingCredentials;
  syncSettings: AccountingSyncSettings;
  lastSync: Date | null;
  rateLimits: RateLimitInfo;
  features: AccountingFeatures;
  webhookUrl?: string;
  webhookActive: boolean;
  lastError?: string;
}

export interface AccountingCredentials {
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  consultantNumber?: string; // DATEV specific
  mandantNumber?: string; // DATEV specific
}

export interface AccountingSyncSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  syncDirection: 'bidirectional' | 'import_only' | 'export_only';
  syncEntities: {
    customers: boolean;
    suppliers: boolean;
    products: boolean;
    invoices: boolean;
    payments: boolean;
    expenses: boolean;
    accounts: boolean;
    projects: boolean;
  };
  mappingRules: FieldMapping[];
  conflictResolution: 'manual' | 'source_wins' | 'target_wins' | 'most_recent';
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  required: boolean;
}

export interface AccountingFeatures {
  supportsCustomers: boolean;
  supportsInvoicing: boolean;
  supportsPayments: boolean;
  supportsExpenses: boolean;
  supportsProjects: boolean;
  supportsTimeTracking: boolean;
  supportsVAT: boolean;
  supportsMultiCurrency: boolean;
  supportsDocuments: boolean;
  supportsRecurringInvoices: boolean;
}

export interface RateLimitInfo {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsRemaining: number;
  resetTime: Date;
}

export interface AccountingCustomer {
  id: string;
  externalId: string;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  address: AccountingAddress;
  taxNumber?: string;
  vatId?: string;
  paymentTerms: number; // days
  currency: string;
  creditLimit?: number;
  accountNumber?: string; // Debitor number
  created: Date;
  updated: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSync?: Date;
  providerId: string;
}

export interface AccountingSupplier {
  id: string;
  externalId: string;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  address: AccountingAddress;
  taxNumber?: string;
  vatId?: string;
  paymentTerms: number; // days
  currency: string;
  accountNumber?: string; // Kreditor number
  created: Date;
  updated: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSync?: Date;
  providerId: string;
}

export interface AccountingAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  state?: string;
}

export interface AccountingInvoice {
  id: string;
  externalId: string;
  invoiceNumber: string;
  customerId: string;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: AccountingInvoiceItem[];
  notes?: string;
  created: Date;
  updated: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSync?: Date;
  providerId: string;
}

export interface AccountingInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
  accountCode?: string;
}

export interface AccountingPayment {
  id: string;
  externalId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: 'bank_transfer' | 'cash' | 'credit_card' | 'paypal' | 'other';
  reference: string;
  notes?: string;
  created: Date;
  updated: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSync?: Date;
  providerId: string;
}

export interface AccountingExpense {
  id: string;
  externalId: string;
  supplierId?: string;
  description: string;
  amount: number;
  currency: string;
  expenseDate: Date;
  category: string;
  accountCode?: string;
  vatRate: number;
  paymentMethod: string;
  receipt?: AccountingDocument;
  created: Date;
  updated: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSync?: Date;
  providerId: string;
}

export interface AccountingDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadDate: Date;
}

export interface AccountingProject {
  id: string;
  externalId: string;
  name: string;
  customerId: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  budget?: number;
  currency: string;
  hourlyRate?: number;
  created: Date;
  updated: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSync?: Date;
  providerId: string;
}

export interface SyncResult {
  success: boolean;
  providerId: string;
  entity: string;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: SyncError[];
  duration: number;
  timestamp: Date;
}

export interface SyncError {
  recordId: string;
  errorCode: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AccountingReport {
  id: string;
  type: 'balance_sheet' | 'profit_loss' | 'cash_flow' | 'trial_balance' | 'vat_return';
  period: { start: Date; end: Date };
  currency: string;
  data: Record<string, unknown>;
  generatedAt: Date;
  providerId: string;
}

export class AccountingIntegrationService {
  private static instance: AccountingIntegrationService;
  private providers: Map<string, AccountingProvider> = new Map();
  private customers: Map<string, AccountingCustomer> = new Map();
  private suppliers: Map<string, AccountingSupplier> = new Map();
  private invoices: Map<string, AccountingInvoice> = new Map();
  private payments: Map<string, AccountingPayment> = new Map();
  private expenses: Map<string, AccountingExpense> = new Map();
  private projects: Map<string, AccountingProject> = new Map();
  private syncHistory: SyncResult[] = [];

  static getInstance(): AccountingIntegrationService {
    if (!AccountingIntegrationService.instance) {
      AccountingIntegrationService.instance = new AccountingIntegrationService();
    }
    return AccountingIntegrationService.instance;
  }

  constructor() {
    this.loadData();
    this.initializeDefaultProviders();
    this.startAutoSync();
  }

  private loadData(): void {
    try {
      // Load providers
      const storedProviders = localStorage.getItem('accounting_providers');
      if (storedProviders) {
        const providerData = JSON.parse(storedProviders);
        Object.entries(providerData).forEach(([id, provider]: [string, AccountingProvider]) => {
          this.providers.set(id, {
            ...provider,
            lastSync: provider.lastSync ? new Date(provider.lastSync) : null,
            rateLimits: {
              ...provider.rateLimits,
              resetTime: new Date(provider.rateLimits.resetTime)
            },
            credentials: {
              ...provider.credentials,
              tokenExpiry: provider.credentials.tokenExpiry ? new Date(provider.credentials.tokenExpiry) : undefined
            },
            webhookActive: provider.webhookActive ?? false
          });
        });
      }

      // Load customers
      const storedCustomers = localStorage.getItem('accounting_customers');
      if (storedCustomers) {
        const customerData = JSON.parse(storedCustomers);
        Object.entries(customerData).forEach(([id, customer]: [string, AccountingCustomer]) => {
          this.customers.set(id, {
            ...customer,
            created: new Date(customer.created),
            updated: new Date(customer.updated),
            lastSync: customer.lastSync ? new Date(customer.lastSync) : undefined
          });
        });
      }

      // Load other entities similarly...
      this.loadInvoices();
      this.loadPayments();
      this.loadExpenses();
    } catch (error) {
      console.error('Failed to load accounting data:', error);
    }
  }

  private loadInvoices(): void {
    const storedInvoices = localStorage.getItem('accounting_invoices');
    if (storedInvoices) {
      const invoiceData = JSON.parse(storedInvoices);
      Object.entries(invoiceData).forEach(([id, invoice]: [string, AccountingInvoice]) => {
        this.invoices.set(id, {
          ...invoice,
          issueDate: new Date(invoice.issueDate),
          dueDate: new Date(invoice.dueDate),
          created: new Date(invoice.created),
          updated: new Date(invoice.updated),
          lastSync: invoice.lastSync ? new Date(invoice.lastSync) : undefined
        });
      });
    }
  }

  private loadPayments(): void {
    const storedPayments = localStorage.getItem('accounting_payments');
    if (storedPayments) {
      const paymentData = JSON.parse(storedPayments);
      Object.entries(paymentData).forEach(([id, payment]: [string, AccountingPayment]) => {
        this.payments.set(id, {
          ...payment,
          paymentDate: new Date(payment.paymentDate),
          created: new Date(payment.created),
          updated: new Date(payment.updated),
          lastSync: payment.lastSync ? new Date(payment.lastSync) : undefined
        });
      });
    }
  }

  private loadExpenses(): void {
    const storedExpenses = localStorage.getItem('accounting_expenses');
    if (storedExpenses) {
      const expenseData = JSON.parse(storedExpenses);
      Object.entries(expenseData).forEach(([id, expense]: [string, AccountingExpense]) => {
        this.expenses.set(id, {
          ...expense,
          expenseDate: new Date(expense.expenseDate),
          created: new Date(expense.created),
          updated: new Date(expense.updated),
          lastSync: expense.lastSync ? new Date(expense.lastSync) : undefined,
          receipt: expense.receipt ? {
            ...expense.receipt,
            uploadDate: new Date(expense.receipt.uploadDate)
          } : undefined
        });
      });
    }
  }

  private saveData(): void {
    try {
      // Save providers
      const providerData: Record<string, AccountingProvider> = {};
      this.providers.forEach((provider, id) => {
        providerData[id] = provider;
      });
      localStorage.setItem('accounting_providers', JSON.stringify(providerData));

      // Save customers
      const customerData: Record<string, AccountingCustomer> = {};
      this.customers.forEach((customer, id) => {
        customerData[id] = customer;
      });
      localStorage.setItem('accounting_customers', JSON.stringify(customerData));

      // Save other entities
      this.saveInvoices();
      this.savePayments();
      this.saveExpenses();
    } catch (error) {
      console.error('Failed to save accounting data:', error);
    }
  }

  private saveInvoices(): void {
    const invoiceData: Record<string, AccountingInvoice> = {};
    this.invoices.forEach((invoice, id) => {
      invoiceData[id] = invoice;
    });
    localStorage.setItem('accounting_invoices', JSON.stringify(invoiceData));
  }

  private savePayments(): void {
    const paymentData: Record<string, AccountingPayment> = {};
    this.payments.forEach((payment, id) => {
      paymentData[id] = payment;
    });
    localStorage.setItem('accounting_payments', JSON.stringify(paymentData));
  }

  private saveExpenses(): void {
    const expenseData: Record<string, AccountingExpense> = {};
    this.expenses.forEach((expense, id) => {
      expenseData[id] = expense;
    });
    localStorage.setItem('accounting_expenses', JSON.stringify(expenseData));
  }

  private initializeDefaultProviders(): void {
    const defaultProviders = [
      {
        id: 'datev_default',
        name: 'DATEV',
        type: 'datev' as const,
        enabled: false,
        authenticated: false,
        apiEndpoint: 'https://api.datev.de/v1',
        features: {
          supportsCustomers: true,
          supportsInvoicing: true,
          supportsPayments: true,
          supportsExpenses: true,
          supportsProjects: true,
          supportsTimeTracking: false,
          supportsVAT: true,
          supportsMultiCurrency: false,
          supportsDocuments: true,
          supportsRecurringInvoices: false
        }
      },
      {
        id: 'lexware_default',
        name: 'Lexware',
        type: 'lexware' as const,
        enabled: false,
        authenticated: false,
        apiEndpoint: 'https://api.lexware.de/v1',
        features: {
          supportsCustomers: true,
          supportsInvoicing: true,
          supportsPayments: true,
          supportsExpenses: true,
          supportsProjects: false,
          supportsTimeTracking: false,
          supportsVAT: true,
          supportsMultiCurrency: false,
          supportsDocuments: true,
          supportsRecurringInvoices: true
        }
      }
    ];

    defaultProviders.forEach(providerData => {
      if (!this.providers.has(providerData.id)) {
        const provider: AccountingProvider = {
          ...providerData,
          credentials: {},
          syncSettings: this.getDefaultSyncSettings(),
          lastSync: null,
          rateLimits: {
            requestsPerMinute: 60,
            requestsPerHour: 1000,
            requestsRemaining: 60,
            resetTime: new Date(Date.now() + 60000)
          },
          webhookActive: false,
          webhookUrl: undefined,
          lastError: undefined
        };
        this.providers.set(providerData.id, provider);
      }
    });

    this.saveData();
  }

  private getDefaultSyncSettings(): AccountingSyncSettings {
    return {
      autoSync: false,
      syncInterval: 60,
      syncDirection: 'bidirectional',
      syncEntities: {
        customers: true,
        suppliers: true,
        products: false,
        invoices: true,
        payments: true,
        expenses: true,
        accounts: false,
        projects: true
      },
      mappingRules: [],
      conflictResolution: 'manual'
    };
  }

  private startAutoSync(): void {
    // Auto-sync every 30 minutes for enabled providers
    setInterval(() => {
      this.providers.forEach((provider, id) => {
        if (provider.enabled && provider.authenticated && provider.syncSettings.autoSync) {
          this.syncProvider(id);
        }
      });
    }, 30 * 60 * 1000);
  }

  // Provider Management
  public async authenticateProvider(providerId: string, credentials: AccountingCredentials): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    try {
      // In a real implementation, this would authenticate with the actual provider
      const mergedCredentials: AccountingCredentials = {
        ...provider.credentials,
        ...credentials
      };

      if (!mergedCredentials.accessToken) {
        mergedCredentials.accessToken = `acct_${Math.random().toString(36).slice(2)}`;
      }

      if (!mergedCredentials.refreshToken) {
        mergedCredentials.refreshToken = `acct_refresh_${Math.random().toString(36).slice(2)}`;
      }

      mergedCredentials.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);

      provider.credentials = mergedCredentials;
      provider.authenticated = true;
      provider.enabled = true;
      provider.lastError = undefined;
      provider.webhookActive = provider.webhookActive ?? false;
      
      this.providers.set(providerId, provider);
      this.saveData();
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  public updateProvider(
    providerId: string,
    updates: Partial<Omit<AccountingProvider, 'syncSettings' | 'credentials' | 'rateLimits' | 'features'>> & {
      syncSettings?: Partial<AccountingSyncSettings> & { syncEntities?: Partial<AccountingSyncSettings['syncEntities']> };
      credentials?: Partial<AccountingCredentials>;
      rateLimits?: Partial<RateLimitInfo>;
      features?: Partial<AccountingFeatures>;
    }
  ): AccountingProvider | null {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return null;
    }

    const nextProvider: AccountingProvider = {
      ...provider,
      ...updates,
      syncSettings: updates.syncSettings
        ? {
            ...provider.syncSettings,
            ...updates.syncSettings,
            syncEntities: updates.syncSettings.syncEntities
              ? {
                  ...provider.syncSettings.syncEntities,
                  ...updates.syncSettings.syncEntities
                }
              : provider.syncSettings.syncEntities
          }
        : provider.syncSettings,
      credentials: updates.credentials
        ? {
            ...provider.credentials,
            ...updates.credentials,
            tokenExpiry: updates.credentials.tokenExpiry
              ? new Date(updates.credentials.tokenExpiry)
              : provider.credentials.tokenExpiry
          }
        : provider.credentials,
      rateLimits: updates.rateLimits
        ? {
            ...provider.rateLimits,
            ...updates.rateLimits,
            resetTime: updates.rateLimits.resetTime
              ? new Date(updates.rateLimits.resetTime)
              : provider.rateLimits.resetTime
          }
        : provider.rateLimits,
      features: updates.features
        ? {
            ...provider.features,
            ...updates.features
          }
        : provider.features,
      lastSync: updates.lastSync !== undefined
        ? updates.lastSync === null
          ? null
          : new Date(updates.lastSync)
        : provider.lastSync,
      webhookActive: updates.webhookActive ?? provider.webhookActive,
      webhookUrl: updates.webhookUrl ?? provider.webhookUrl,
      lastError: updates.lastError ?? provider.lastError
    };

    this.providers.set(providerId, nextProvider);
    this.saveData();
    return nextProvider;
  }

  private isTokenExpired(provider: AccountingProvider): boolean {
    const expiry = provider.credentials.tokenExpiry;
    if (!expiry) {
      return true;
    }

    const bufferMs = 60 * 1000;
    return expiry.getTime() - bufferMs <= Date.now();
  }

  public refreshAccessToken(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return false;
    }

    const refreshedToken = `acct_${Math.random().toString(36).slice(2)}`;
    const refreshToken = provider.credentials.refreshToken ?? `acct_refresh_${Math.random().toString(36).slice(2)}`;

    provider.credentials = {
      ...provider.credentials,
      accessToken: refreshedToken,
      refreshToken,
      tokenExpiry: new Date(Date.now() + 55 * 60 * 1000)
    };
    provider.lastError = undefined;

    this.providers.set(providerId, provider);
    this.saveData();
    return true;
  }

  public updateWebhook(providerId: string, webhookUrl: string | undefined): AccountingProvider | null {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return null;
    }

    provider.webhookUrl = webhookUrl;
    this.providers.set(providerId, provider);
    this.saveData();
    return provider;
  }

  public toggleWebhook(providerId: string, active: boolean): AccountingProvider | null {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return null;
    }

    provider.webhookActive = active;
    this.providers.set(providerId, provider);
    this.saveData();
    return provider;
  }

  public getProviderStatus(providerId: string): {
    tokenExpiresAt: Date | undefined;
    tokenExpired: boolean;
    webhookActive: boolean;
    lastError?: string;
  } | null {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return null;
    }

    const tokenExpired = this.isTokenExpired(provider);
    return {
      tokenExpiresAt: provider.credentials.tokenExpiry,
      tokenExpired,
      webhookActive: provider.webhookActive,
      lastError: provider.lastError
    };
  }

  public resetProvider(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return false;
    }

    provider.enabled = false;
    provider.authenticated = false;
    provider.credentials = {};
    provider.syncSettings = {
      ...provider.syncSettings,
      autoSync: false
    };
    provider.lastSync = null;
    provider.webhookActive = false;
    provider.webhookUrl = undefined;
    provider.lastError = undefined;

    this.saveData();
    return true;
  }

  public async syncProvider(providerId: string): Promise<SyncResult> {
    let provider = this.providers.get(providerId);
    if (!provider || !provider.authenticated) {
      return {
        success: false,
        providerId,
        entity: 'all',
        recordsProcessed: 0,
        recordsSucceeded: 0,
        recordsFailed: 0,
        errors: [{ recordId: '', errorCode: 'PROVIDER_NOT_AUTHENTICATED', message: 'Provider not authenticated' }],
        duration: 0,
        timestamp: new Date()
      };
    }

    if (this.isTokenExpired(provider)) {
      const refreshed = this.refreshAccessToken(providerId);
      if (!refreshed) {
        provider.lastError = 'Access token expired';
        this.providers.set(providerId, provider);
        this.saveData();
        return {
          success: false,
          providerId,
          entity: 'all',
          recordsProcessed: 0,
          recordsSucceeded: 0,
          recordsFailed: 0,
          errors: [{ recordId: '', errorCode: 'TOKEN_EXPIRED', message: 'Access token expired' }],
          duration: 0,
          timestamp: new Date()
        };
      }
      const refreshedProvider = this.providers.get(providerId);
      if (!refreshedProvider) {
        return {
          success: false,
          providerId,
          entity: 'all',
          recordsProcessed: 0,
          recordsSucceeded: 0,
          recordsFailed: 0,
          errors: [{ recordId: '', errorCode: 'TOKEN_REFRESH_FAILED', message: 'Unable to refresh access token' }],
          duration: 0,
          timestamp: new Date()
        };
      }
      provider = refreshedProvider;
    }

    const startTime = Date.now();
    const results: SyncResult[] = [];

    try {
      // Sync customers
      if (provider.syncSettings.syncEntities.customers) {
        const customerResult = await this.syncCustomers(providerId);
        results.push(customerResult);
      }

      // Sync invoices
      if (provider.syncSettings.syncEntities.invoices) {
        const invoiceResult = await this.syncInvoices(providerId);
        results.push(invoiceResult);
      }

      // Sync payments
      if (provider.syncSettings.syncEntities.payments) {
        const paymentResult = await this.syncPayments(providerId);
        results.push(paymentResult);
      }

      // Sync expenses
      if (provider.syncSettings.syncEntities.expenses) {
        const expenseResult = await this.syncExpenses(providerId);
        results.push(expenseResult);
      }

      provider.lastSync = new Date();
      provider.lastError = undefined;
      this.providers.set(providerId, provider);
      this.saveData();

      const aggregatedResult: SyncResult = {
        success: results.every(r => r.success),
        providerId,
        entity: 'all',
        recordsProcessed: results.reduce((sum, r) => sum + r.recordsProcessed, 0),
        recordsSucceeded: results.reduce((sum, r) => sum + r.recordsSucceeded, 0),
        recordsFailed: results.reduce((sum, r) => sum + r.recordsFailed, 0),
        errors: results.flatMap(r => r.errors),
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.syncHistory.push(aggregatedResult);
      return aggregatedResult;

    } catch (error) {
      console.error('Sync failed:', error);
      provider.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.providers.set(providerId, provider);
      this.saveData();
      return {
        success: false,
        providerId,
        entity: 'all',
        recordsProcessed: 0,
        recordsSucceeded: 0,
        recordsFailed: 0,
        errors: [{ recordId: '', errorCode: 'SYNC_FAILED', message: error instanceof Error ? error.message : 'Unknown error' }],
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  private async syncCustomers(providerId: string): Promise<SyncResult> {
    // Simulate customer sync with mock data
    const mockCustomers = this.generateMockCustomers(providerId);
    
    mockCustomers.forEach(customer => {
      this.customers.set(customer.id, customer);
    });

    return {
      success: true,
      providerId,
      entity: 'customers',
      recordsProcessed: mockCustomers.length,
      recordsSucceeded: mockCustomers.length,
      recordsFailed: 0,
      errors: [],
      duration: 1000,
      timestamp: new Date()
    };
  }

  private async syncInvoices(providerId: string): Promise<SyncResult> {
    // Simulate invoice sync with mock data
    const mockInvoices = this.generateMockInvoices(providerId);
    
    mockInvoices.forEach(invoice => {
      this.invoices.set(invoice.id, invoice);
    });

    return {
      success: true,
      providerId,
      entity: 'invoices',
      recordsProcessed: mockInvoices.length,
      recordsSucceeded: mockInvoices.length,
      recordsFailed: 0,
      errors: [],
      duration: 1500,
      timestamp: new Date()
    };
  }

  private async syncPayments(providerId: string): Promise<SyncResult> {
    // Simulate payment sync
    return {
      success: true,
      providerId,
      entity: 'payments',
      recordsProcessed: 5,
      recordsSucceeded: 5,
      recordsFailed: 0,
      errors: [],
      duration: 800,
      timestamp: new Date()
    };
  }

  private async syncExpenses(providerId: string): Promise<SyncResult> {
    // Simulate expense sync
    return {
      success: true,
      providerId,
      entity: 'expenses',
      recordsProcessed: 3,
      recordsSucceeded: 3,
      recordsFailed: 0,
      errors: [],
      duration: 600,
      timestamp: new Date()
    };
  }

  private generateMockCustomers(providerId: string): AccountingCustomer[] {
    return [
      {
        id: `customer_${providerId}_1`,
        externalId: 'CUST001',
        name: 'Mustermann GmbH',
        companyName: 'Mustermann GmbH',
        email: 'info@mustermann.de',
        phone: '+49 123 456789',
        address: {
          street: 'Musterstraße 123',
          city: 'Berlin',
          postalCode: '10115',
          country: 'Germany'
        },
        taxNumber: 'DE123456789',
        vatId: 'DE987654321',
        paymentTerms: 30,
        currency: 'EUR',
        creditLimit: 50000,
        accountNumber: '10001',
        created: new Date(),
        updated: new Date(),
        syncStatus: 'synced',
        lastSync: new Date(),
        providerId
      }
    ];
  }

  private generateMockInvoices(providerId: string): AccountingInvoice[] {
    return [
      {
        id: `invoice_${providerId}_1`,
        externalId: 'INV-2024-001',
        invoiceNumber: 'RE-001',
        customerId: `customer_${providerId}_1`,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currency: 'EUR',
        subtotal: 1000,
        taxAmount: 190,
        total: 1190,
        status: 'sent',
        items: [
          {
            id: 'item_1',
            description: 'Consulting Services',
            quantity: 10,
            unitPrice: 100,
            vatRate: 19,
            total: 1000,
            accountCode: '8400'
          }
        ],
        notes: 'Payment due within 30 days',
        created: new Date(),
        updated: new Date(),
        syncStatus: 'synced',
        lastSync: new Date(),
        providerId
      }
    ];
  }

  // Query Methods
  public getProviders(): AccountingProvider[] {
    return Array.from(this.providers.values());
  }

  public getCustomers(providerId?: string): AccountingCustomer[] {
    const customers = Array.from(this.customers.values());
    return providerId ? customers.filter(c => c.providerId === providerId) : customers;
  }

  public getInvoices(providerId?: string): AccountingInvoice[] {
    const invoices = Array.from(this.invoices.values());
    return providerId ? invoices.filter(i => i.providerId === providerId) : invoices;
  }

  public getPayments(providerId?: string): AccountingPayment[] {
    const payments = Array.from(this.payments.values());
    return providerId ? payments.filter(p => p.providerId === providerId) : payments;
  }

  public getExpenses(providerId?: string): AccountingExpense[] {
    const expenses = Array.from(this.expenses.values());
    return providerId ? expenses.filter(e => e.providerId === providerId) : expenses;
  }

  public getSyncHistory(): SyncResult[] {
    return this.syncHistory.slice().reverse(); // Most recent first
  }

  public getAccountingStats(): {
    totalProviders: number;
    activeProviders: number;
    totalCustomers: number;
    totalInvoices: number;
    totalRevenue: number;
    lastSyncTime: Date | null;
  } {
    const providers = Array.from(this.providers.values());
    const invoices = Array.from(this.invoices.values());
    const lastSync = this.syncHistory.length > 0 ? this.syncHistory[this.syncHistory.length - 1].timestamp : null;

    return {
      totalProviders: providers.length,
      activeProviders: providers.filter(p => p.enabled && p.authenticated).length,
      totalCustomers: this.customers.size,
      totalInvoices: this.invoices.size,
      totalRevenue: invoices.reduce((sum, invoice) => sum + invoice.total, 0),
      lastSyncTime: lastSync
    };
  }

  // Entity Management
  public createCustomer(customer: Partial<AccountingCustomer>): AccountingCustomer {
    const newCustomer: AccountingCustomer = {
      id: `customer_${Date.now()}`,
      externalId: customer.externalId || '',
      name: customer.name || '',
      companyName: customer.companyName,
      email: customer.email || '',
      phone: customer.phone,
      address: customer.address || {
        street: '',
        city: '',
        postalCode: '',
        country: 'Germany'
      },
      taxNumber: customer.taxNumber,
      vatId: customer.vatId,
      paymentTerms: customer.paymentTerms || 30,
      currency: customer.currency || 'EUR',
      creditLimit: customer.creditLimit,
      accountNumber: customer.accountNumber,
      created: new Date(),
      updated: new Date(),
      syncStatus: 'pending',
      providerId: customer.providerId || 'local'
    };

    this.customers.set(newCustomer.id, newCustomer);
    this.saveData();
    return newCustomer;
  }

  public updateCustomer(customerId: string, updates: Partial<AccountingCustomer>): AccountingCustomer | null {
    const customer = this.customers.get(customerId);
    if (!customer) return null;

    const updatedCustomer: AccountingCustomer = {
      ...customer,
      ...updates,
      updated: new Date(),
      syncStatus: 'pending'
    };

    this.customers.set(customerId, updatedCustomer);
    this.saveData();
    return updatedCustomer;
  }

  public deleteCustomer(customerId: string): boolean {
    const deleted = this.customers.delete(customerId);
    if (deleted) {
      this.saveData();
    }
    return deleted;
  }
}

export default AccountingIntegrationService.getInstance();
