export interface CrmProvider {
  id: string;
  name: string;
  type: 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho' | 'custom';
  enabled: boolean;
  authenticated: boolean;
  apiEndpoint: string;
  credentials: CrmCredentials;
  lastSync: Date;
  features: CrmFeatures;
}

export interface CrmCredentials {
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  instanceUrl?: string;
}

export interface CrmFeatures {
  supportsContacts: boolean;
  supportsAccounts: boolean;
  supportsLeads: boolean;
  supportsOpportunities: boolean;
  supportsActivities: boolean;
}

export interface CrmContact {
  id: string;
  externalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  accountId?: string;
  accountName?: string;
  status: 'active' | 'inactive';
  created: Date;
  updated: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  providerId: string;
}

export interface CrmAccount {
  id: string;
  externalId: string;
  name: string;
  type: 'prospect' | 'customer' | 'partner';
  industry?: string;
  revenue?: number;
  website?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  created: Date;
  updated: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  providerId: string;
}

export interface CrmLead {
  id: string;
  externalId: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  leadSource: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  rating: 'hot' | 'warm' | 'cold';
  created: Date;
  updated: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  providerId: string;
}

export interface CrmOpportunity {
  id: string;
  externalId: string;
  name: string;
  accountId: string;
  amount: number;
  currency: string;
  stage: string;
  probability: number;
  closeDate: Date;
  isWon: boolean;
  created: Date;
  updated: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  providerId: string;
}

export interface CrmSyncResult {
  success: boolean;
  providerId: string;
  entity: string;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: string[];
  duration: number;
  timestamp: Date;
}

export class CrmIntegrationService {
  private static instance: CrmIntegrationService;
  private providers: Map<string, CrmProvider> = new Map();
  private contacts: Map<string, CrmContact> = new Map();
  private accounts: Map<string, CrmAccount> = new Map();
  private leads: Map<string, CrmLead> = new Map();
  private opportunities: Map<string, CrmOpportunity> = new Map();
  private syncHistory: CrmSyncResult[] = [];

  static getInstance(): CrmIntegrationService {
    if (!CrmIntegrationService.instance) {
      CrmIntegrationService.instance = new CrmIntegrationService();
    }
    return CrmIntegrationService.instance;
  }

  constructor() {
    this.loadData();
    this.initializeDefaultProviders();
  }

  private loadData(): void {
    try {
      const storedProviders = localStorage.getItem('crm_providers');
      if (storedProviders) {
        const providerData = JSON.parse(storedProviders);
        Object.entries(providerData).forEach(([id, provider]: [string, CrmProvider]) => {
          this.providers.set(id, {
            ...provider,
            lastSync: new Date(provider.lastSync)
          });
        });
      }

      const storedContacts = localStorage.getItem('crm_contacts');
      if (storedContacts) {
        const contactData = JSON.parse(storedContacts);
        Object.entries(contactData).forEach(([id, contact]: [string, CrmContact]) => {
          this.contacts.set(id, {
            ...contact,
            created: new Date(contact.created),
            updated: new Date(contact.updated)
          });
        });
      }

      const storedAccounts = localStorage.getItem('crm_accounts');
      if (storedAccounts) {
        const accountData = JSON.parse(storedAccounts);
        Object.entries(accountData).forEach(([id, account]: [string, CrmAccount]) => {
          this.accounts.set(id, {
            ...account,
            created: new Date(account.created),
            updated: new Date(account.updated)
          });
        });
      }

      const storedLeads = localStorage.getItem('crm_leads');
      if (storedLeads) {
        const leadData = JSON.parse(storedLeads);
        Object.entries(leadData).forEach(([id, lead]: [string, CrmLead]) => {
          this.leads.set(id, {
            ...lead,
            created: new Date(lead.created),
            updated: new Date(lead.updated)
          });
        });
      }

      const storedOpportunities = localStorage.getItem('crm_opportunities');
      if (storedOpportunities) {
        const opportunityData = JSON.parse(storedOpportunities);
        Object.entries(opportunityData).forEach(([id, opportunity]: [string, CrmOpportunity]) => {
          this.opportunities.set(id, {
            ...opportunity,
            closeDate: new Date(opportunity.closeDate),
            created: new Date(opportunity.created),
            updated: new Date(opportunity.updated)
          });
        });
      }
    } catch (error) {
      console.error('Failed to load CRM data:', error);
    }
  }

  private saveData(): void {
    try {
      const providerData: Record<string, CrmProvider> = {};
      this.providers.forEach((provider, id) => {
        providerData[id] = provider;
      });
      localStorage.setItem('crm_providers', JSON.stringify(providerData));

      const contactData: Record<string, CrmContact> = {};
      this.contacts.forEach((contact, id) => {
        contactData[id] = contact;
      });
      localStorage.setItem('crm_contacts', JSON.stringify(contactData));

      const accountData: Record<string, CrmAccount> = {};
      this.accounts.forEach((account, id) => {
        accountData[id] = account;
      });
      localStorage.setItem('crm_accounts', JSON.stringify(accountData));

      const leadData: Record<string, CrmLead> = {};
      this.leads.forEach((lead, id) => {
        leadData[id] = lead;
      });
      localStorage.setItem('crm_leads', JSON.stringify(leadData));

      const opportunityData: Record<string, CrmOpportunity> = {};
      this.opportunities.forEach((opportunity, id) => {
        opportunityData[id] = opportunity;
      });
      localStorage.setItem('crm_opportunities', JSON.stringify(opportunityData));
    } catch (error) {
      console.error('Failed to save CRM data:', error);
    }
  }

  private initializeDefaultProviders(): void {
    const defaultProviders = [
      {
        id: 'salesforce_default',
        name: 'Salesforce',
        type: 'salesforce' as const,
        enabled: false,
        authenticated: false,
        apiEndpoint: 'https://api.salesforce.com',
        features: {
          supportsContacts: true,
          supportsAccounts: true,
          supportsLeads: true,
          supportsOpportunities: true,
          supportsActivities: true
        }
      },
      {
        id: 'hubspot_default',
        name: 'HubSpot',
        type: 'hubspot' as const,
        enabled: false,
        authenticated: false,
        apiEndpoint: 'https://api.hubapi.com',
        features: {
          supportsContacts: true,
          supportsAccounts: true,
          supportsLeads: true,
          supportsOpportunities: true,
          supportsActivities: true
        }
      },
      {
        id: 'pipedrive_default',
        name: 'Pipedrive',
        type: 'pipedrive' as const,
        enabled: false,
        authenticated: false,
        apiEndpoint: 'https://api.pipedrive.com/v1',
        features: {
          supportsContacts: true,
          supportsAccounts: true,
          supportsLeads: true,
          supportsOpportunities: true,
          supportsActivities: true
        }
      }
    ];

    defaultProviders.forEach(providerData => {
      if (!this.providers.has(providerData.id)) {
        const provider: CrmProvider = {
          ...providerData,
          credentials: {},
          lastSync: new Date()
        };
        this.providers.set(providerData.id, provider);
      }
    });

    this.saveData();
  }

  // Provider Management
  public async authenticateProvider(providerId: string, credentials: CrmCredentials): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    try {
      provider.credentials = credentials;
      provider.authenticated = true;
      provider.enabled = true;
      
      if (credentials.accessToken) {
        provider.credentials.tokenExpiry = new Date(Date.now() + 3600000);
      }
      
      this.saveData();
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  public async syncProvider(providerId: string): Promise<CrmSyncResult> {
    const provider = this.providers.get(providerId);
    if (!provider || !provider.authenticated) {
      return {
        success: false,
        providerId,
        entity: 'all',
        recordsProcessed: 0,
        recordsSucceeded: 0,
        recordsFailed: 0,
        errors: ['Provider not authenticated'],
        duration: 0,
        timestamp: new Date()
      };
    }

    const startTime = Date.now();

    try {
      // Simulate sync with mock data
      const mockContacts = this.generateMockContacts(providerId);
      const mockAccounts = this.generateMockAccounts(providerId);
      const mockLeads = this.generateMockLeads(providerId);
      const mockOpportunities = this.generateMockOpportunities(providerId);

      mockContacts.forEach(contact => this.contacts.set(contact.id, contact));
      mockAccounts.forEach(account => this.accounts.set(account.id, account));
      mockLeads.forEach(lead => this.leads.set(lead.id, lead));
      mockOpportunities.forEach(opportunity => this.opportunities.set(opportunity.id, opportunity));

      provider.lastSync = new Date();
      this.saveData();

      const totalRecords = mockContacts.length + mockAccounts.length + mockLeads.length + mockOpportunities.length;

      const result: CrmSyncResult = {
        success: true,
        providerId,
        entity: 'all',
        recordsProcessed: totalRecords,
        recordsSucceeded: totalRecords,
        recordsFailed: 0,
        errors: [],
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.syncHistory.push(result);
      return result;

    } catch (error) {
      return {
        success: false,
        providerId,
        entity: 'all',
        recordsProcessed: 0,
        recordsSucceeded: 0,
        recordsFailed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  private generateMockContacts(providerId: string): CrmContact[] {
    return [
      {
        id: `contact_${providerId}_1`,
        externalId: 'CONT001',
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max.mustermann@example.com',
        phone: '+49 123 456789',
        title: 'Geschäftsführer',
        accountId: `account_${providerId}_1`,
        accountName: 'Mustermann GmbH',
        status: 'active',
        created: new Date(),
        updated: new Date(),
        syncStatus: 'synced',
        providerId
      },
      {
        id: `contact_${providerId}_2`,
        externalId: 'CONT002',
        firstName: 'Anna',
        lastName: 'Schmidt',
        email: 'anna.schmidt@example.com',
        phone: '+49 123 456790',
        title: 'Projektleiterin',
        accountId: `account_${providerId}_2`,
        accountName: 'Schmidt Bau AG',
        status: 'active',
        created: new Date(),
        updated: new Date(),
        syncStatus: 'synced',
        providerId
      }
    ];
  }

  private generateMockAccounts(providerId: string): CrmAccount[] {
    return [
      {
        id: `account_${providerId}_1`,
        externalId: 'ACC001',
        name: 'Mustermann GmbH',
        type: 'customer',
        industry: 'Construction',
        revenue: 5000000,
        website: 'https://mustermann.de',
        phone: '+49 123 456789',
        email: 'info@mustermann.de',
        status: 'active',
        created: new Date(),
        updated: new Date(),
        syncStatus: 'synced',
        providerId
      },
      {
        id: `account_${providerId}_2`,
        externalId: 'ACC002',
        name: 'Schmidt Bau AG',
        type: 'prospect',
        industry: 'Construction',
        revenue: 8000000,
        website: 'https://schmidt-bau.de',
        phone: '+49 123 456790',
        email: 'info@schmidt-bau.de',
        status: 'active',
        created: new Date(),
        updated: new Date(),
        syncStatus: 'synced',
        providerId
      }
    ];
  }

  private generateMockLeads(providerId: string): CrmLead[] {
    return [
      {
        id: `lead_${providerId}_1`,
        externalId: 'LEAD001',
        firstName: 'Thomas',
        lastName: 'Weber',
        email: 'thomas.weber@neubau.com',
        company: 'Weber Neubau',
        leadSource: 'Website',
        status: 'new',
        rating: 'warm',
        created: new Date(),
        updated: new Date(),
        syncStatus: 'synced',
        providerId
      }
    ];
  }

  private generateMockOpportunities(providerId: string): CrmOpportunity[] {
    return [
      {
        id: `opportunity_${providerId}_1`,
        externalId: 'OPP001',
        name: 'Office Building Project',
        accountId: `account_${providerId}_1`,
        amount: 500000,
        currency: 'EUR',
        stage: 'Proposal',
        probability: 70,
        closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isWon: false,
        created: new Date(),
        updated: new Date(),
        syncStatus: 'synced',
        providerId
      }
    ];
  }

  // Query Methods
  public getProviders(): CrmProvider[] {
    return Array.from(this.providers.values());
  }

  public getContacts(providerId?: string): CrmContact[] {
    const contacts = Array.from(this.contacts.values());
    return providerId ? contacts.filter(c => c.providerId === providerId) : contacts;
  }

  public getAccounts(providerId?: string): CrmAccount[] {
    const accounts = Array.from(this.accounts.values());
    return providerId ? accounts.filter(a => a.providerId === providerId) : accounts;
  }

  public getLeads(providerId?: string): CrmLead[] {
    const leads = Array.from(this.leads.values());
    return providerId ? leads.filter(l => l.providerId === providerId) : leads;
  }

  public getOpportunities(providerId?: string): CrmOpportunity[] {
    const opportunities = Array.from(this.opportunities.values());
    return providerId ? opportunities.filter(o => o.providerId === providerId) : opportunities;
  }

  public getSyncHistory(): CrmSyncResult[] {
    return this.syncHistory.slice().reverse();
  }

  public getCrmStats(): {
    totalProviders: number;
    activeProviders: number;
    totalContacts: number;
    totalAccounts: number;
    totalLeads: number;
    totalOpportunities: number;
    totalOpportunityValue: number;
    lastSyncTime: Date | null;
  } {
    const providers = Array.from(this.providers.values());
    const opportunities = Array.from(this.opportunities.values());
    const lastSync = this.syncHistory.length > 0 ? this.syncHistory[this.syncHistory.length - 1].timestamp : null;

    return {
      totalProviders: providers.length,
      activeProviders: providers.filter(p => p.enabled && p.authenticated).length,
      totalContacts: this.contacts.size,
      totalAccounts: this.accounts.size,
      totalLeads: this.leads.size,
      totalOpportunities: this.opportunities.size,
      totalOpportunityValue: opportunities.reduce((sum, opp) => sum + opp.amount, 0),
      lastSyncTime: lastSync
    };
  }
}

export default CrmIntegrationService.getInstance();