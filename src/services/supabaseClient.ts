/**
 * Supabase Client for Multi-Tenant SaaS
 * Handles authentication, data sync, and tenant isolation
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

interface TenantInfo {
  id: string;
  companyName: string;
  companyLogo: string | null;
  subscriptionPlan: 'free' | 'professional' | 'enterprise';
  subscriptionStatus: 'active' | 'canceled' | 'suspended';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  maxUsers: number;
  maxProjects: number;
  maxStorageMb: number;
}

interface UserProfile {
  id: string;
  tenantId: string;
  email: string;
  fullName: string | null;
  role: 'admin' | 'user' | 'viewer';
  isActive: boolean;
}

class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient | null = null;
  private currentUser: User | null = null;
  private currentTenant: TenantInfo | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  /**
   * Initialize Supabase client
   */
  public initialize(supabaseUrl: string, supabaseAnonKey: string): void {
    if (this.client) {
      console.warn('Supabase client already initialized - skipping duplicate initialization');
      return;
    }

    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

    // Listen for auth changes
    this.client.auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user ?? null;
      
      if (event === 'SIGNED_IN') {
        this.loadTenantInfo();
      } else if (event === 'SIGNED_OUT') {
        this.currentTenant = null;
      }
    });

    console.log('Supabase client initialized');
  }

  /**
   * Check if client is initialized
   */
  private ensureInitialized(): void {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Call initialize() first.');
    }
  }

  /**
   * Sign up new tenant (customer registration)
   */
  public async signUpTenant(params: {
    email: string;
    password: string;
    companyName: string;
    fullName: string;
    subscriptionPlan?: 'free' | 'professional' | 'enterprise';
  }): Promise<{ success: boolean; error?: string }> {
    this.ensureInitialized();

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await this.client!.auth.signUp({
        email: params.email,
        password: params.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // 2. Create tenant
      const { data: tenant, error: tenantError } = await this.client!
        .from('tenants')
        .insert({
          company_name: params.companyName,
          subscription_plan: params.subscriptionPlan || 'free',
          subscription_status: 'active',
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 3. Create user profile
      const { error: userError } = await this.client!
        .from('users')
        .insert({
          tenant_id: tenant.id,
          auth_user_id: authData.user.id,
          email: params.email,
          full_name: params.fullName,
          role: 'admin', // First user is always admin
        });

      if (userError) throw userError;

      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sign in
   */
  public async signIn(email: string, password: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    this.ensureInitialized();

    try {
      const { error } = await this.client!.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      await this.loadTenantInfo();

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sign out
   */
  public async signOut(): Promise<void> {
    this.ensureInitialized();
    await this.client!.auth.signOut();
    this.currentTenant = null;
  }

  /**
   * Load tenant info for current user
   */
  private async loadTenantInfo(): Promise<void> {
    this.ensureInitialized();

    try {
      // Get user profile to find tenant_id
      const { data: profile, error: profileError } = await this.client!
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', this.currentUser?.id)
        .single();

      if (profileError) throw profileError;

      // Get tenant info
      const { data: tenant, error: tenantError } = await this.client!
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single();

      if (tenantError) throw tenantError;

      this.currentTenant = {
        id: tenant.id,
        companyName: tenant.company_name,
        companyLogo: tenant.company_logo,
        subscriptionPlan: tenant.subscription_plan,
        subscriptionStatus: tenant.subscription_status,
        primaryColor: tenant.primary_color,
        secondaryColor: tenant.secondary_color,
        accentColor: tenant.accent_color,
        maxUsers: tenant.max_users,
        maxProjects: tenant.max_projects,
        maxStorageMb: tenant.max_storage_mb,
      };

      // Apply branding
      this.applyBranding();
    } catch (error) {
      console.error('Failed to load tenant info:', error);
    }
  }

  /**
   * Apply tenant branding to UI
   */
  private applyBranding(): void {
    if (!this.currentTenant) return;

    document.documentElement.style.setProperty(
      '--color-primary',
      this.currentTenant.primaryColor
    );
    document.documentElement.style.setProperty(
      '--color-secondary',
      this.currentTenant.secondaryColor
    );
    document.documentElement.style.setProperty(
      '--color-accent',
      this.currentTenant.accentColor
    );

    // Save to localStorage for offline mode
    localStorage.setItem('bauplan_company_name', this.currentTenant.companyName);
    if (this.currentTenant.companyLogo) {
      localStorage.setItem('bauplan_company_logo', this.currentTenant.companyLogo);
    }
    localStorage.setItem('bauplan_primary_color', this.currentTenant.primaryColor);
    localStorage.setItem('bauplan_secondary_color', this.currentTenant.secondaryColor);
    localStorage.setItem('bauplan_accent_color', this.currentTenant.accentColor);
  }

  /**
   * Get current tenant
   */
  public getCurrentTenant(): TenantInfo | null {
    return this.currentTenant;
  }

  /**
   * Get current user
   */
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if subscription is active
   */
  public isSubscriptionActive(): boolean {
    return this.currentTenant?.subscriptionStatus === 'active';
  }

  /**
   * Get Supabase client (for direct queries)
   */
  public getClient(): SupabaseClient {
    this.ensureInitialized();
    return this.client!;
  }

  /**
   * Sync local data to Supabase
   */
  public async syncLocalData(data: {
    quotes?: unknown[];
    projects?: unknown[];
    invoices?: unknown[];
    deliveryNotes?: unknown[];
    orderConfirmations?: unknown[];
  }): Promise<{ success: boolean; error?: string }> {
    this.ensureInitialized();

    if (!this.currentTenant) {
      return { success: false, error: 'No tenant loaded' };
    }

    try {
      const tenantId = this.currentTenant.id;

      // Sync quotes
      if (data.quotes) {
        const quotesWithTenant = data.quotes.map((q: Record<string, unknown>) => ({
          ...q,
          tenant_id: tenantId,
        }));
        await this.client!.from('quotes').upsert(quotesWithTenant);
      }

      // Sync projects
      if (data.projects) {
        const projectsWithTenant = data.projects.map((p: Record<string, unknown>) => ({
          ...p,
          tenant_id: tenantId,
        }));
        await this.client!.from('projects').upsert(projectsWithTenant);
      }

      // Sync invoices
      if (data.invoices) {
        const invoicesWithTenant = data.invoices.map((i: Record<string, unknown>) => ({
          ...i,
          tenant_id: tenantId,
        }));
        await this.client!.from('invoices').upsert(invoicesWithTenant);
      }

      // Sync delivery notes
      if (data.deliveryNotes) {
        const deliveryNotesWithTenant = data.deliveryNotes.map((d: Record<string, unknown>) => ({
          ...d,
          tenant_id: tenantId,
        }));
        await this.client!.from('delivery_notes').upsert(deliveryNotesWithTenant);
      }

      // Sync order confirmations
      if (data.orderConfirmations) {
        const orderConfirmationsWithTenant = data.orderConfirmations.map((o: Record<string, unknown>) => ({
          ...o,
          tenant_id: tenantId,
        }));
        await this.client!.from('order_confirmations').upsert(orderConfirmationsWithTenant);
      }

      return { success: true };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Real-time subscription for quotes
   */
  public subscribeToQuotes(callback: (payload: unknown) => void) {
    this.ensureInitialized();

    return this.client!
      .channel('quotes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes',
        },
        callback
      )
      .subscribe();
  }
}

export default SupabaseService;
export const supabase = SupabaseService.getInstance();
