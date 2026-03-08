/**
 * Stripe Payment Service
 * Handles subscription billing, payments, and webhooks
 */

import { supabase } from '@/lib/supabase';

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

interface StripeConfig {
  publishableKey: string;
}

interface SubscriptionPlan {
  id: string;
  name: 'free' | 'professional' | 'enterprise';
  priceId: string; // Stripe Price ID
  amount: number;
  interval: 'month' | 'year';
  features: string[];
}

class StripeService {
  private static instance: StripeService;
  private config: StripeConfig | null = null;
  private stripe: unknown = null; // Stripe.js instance

  // Subscription Plans - use environment variables for price IDs
  public readonly plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'free',
      priceId: '',
      amount: 0,
      interval: 'month',
      features: [
        '1 Benutzer',
        '10 Projekte',
        '100 MB Speicher',
        'Email Support',
      ],
    },
    {
      id: 'professional',
      name: 'professional',
      priceId: import.meta.env.VITE_STRIPE_PRICE_PROFESSIONAL || 'price_professional_monthly',
      amount: 29.99,
      interval: 'month',
      features: [
        '10 Benutzer',
        '100 Projekte',
        '1 GB Speicher',
        'Priority Support',
        'Custom Branding',
      ],
    },
    {
      id: 'enterprise',
      name: 'enterprise',
      priceId: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE || 'price_enterprise_monthly',
      amount: 99.99,
      interval: 'month',
      features: [
        'Unlimited Benutzer',
        'Unlimited Projekte',
        '10 GB Speicher',
        '24/7 Support',
        'Dedicated Server',
        'SLA 99.9%',
      ],
    },
  ];

  private constructor() {}

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  /**
   * Initialize Stripe
   */
  public async initialize(publishableKey?: string): Promise<void> {
    const key = publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (!key) {
      console.warn('Stripe publishable key not configured');
      return;
    }

    this.config = { publishableKey: key };

    // Load Stripe.js
    if (typeof window !== 'undefined') {
      try {
        const { loadStripe } = await import('@stripe/stripe-js');
        this.stripe = await loadStripe(key);
        console.log('Stripe initialized successfully');
      } catch (error) {
        console.error('Failed to load Stripe:', error);
      }
    }
  }

  /**
   * Check if Stripe is configured
   */
  public isConfigured(): boolean {
    return !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  }

  /**
   * Create checkout session for subscription
   */
  public async createCheckoutSession(params: {
    tenantId: string;
    plan: 'professional' | 'enterprise';
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string | null; error?: string }> {
    try {
      const selectedPlan = this.plans.find((p) => p.name === params.plan);
      if (!selectedPlan) {
        return { url: null, error: 'Plan not found' };
      }

      // Get auth token for API call
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Call backend to create Stripe Checkout Session
      const response = await fetch(`${API_BASE_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          priceId: selectedPlan.priceId,
          tenantId: params.tenantId,
          successUrl: params.successUrl,
          cancelUrl: params.cancelUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { url: null, error: error.message || error.error };
      }

      const { url } = await response.json();
      return { url };
    } catch (error) {
      console.error('Checkout error:', error);
      return {
        url: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create customer portal session (for managing subscription)
   */
  public async createPortalSession(params: {
    tenantId: string;
    returnUrl: string;
  }): Promise<{ url: string | null; error?: string }> {
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${API_BASE_URL}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tenantId: params.tenantId,
          returnUrl: params.returnUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { url: null, error: error.message || error.error };
      }

      const { url } = await response.json();
      return { url };
    } catch (error) {
      console.error('Portal error:', error);
      return {
        url: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get subscription status from backend
   */
  public async getSubscriptionStatus(tenantId: string): Promise<{
    plan: string;
    status: string;
    expiresAt: string | null;
    trialEndsAt: string | null;
  } | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${API_BASE_URL}/api/stripe/subscription/${tenantId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error('Get subscription status error:', error);
      return null;
    }
  }

  /**
   * Get payment history
   */
  public async getPaymentHistory(tenantId: string): Promise<Array<{
    id: string;
    amount_cents: number;
    currency: string;
    status: string;
    created_at: string;
    invoice_url?: string;
  }>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${API_BASE_URL}/api/stripe/payments/${tenantId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!response.ok) return [];

      return await response.json();
    } catch (error) {
      console.error('Get payment history error:', error);
      return [];
    }
  }

  /**
   * Cancel subscription
   */
  public async cancelSubscription(tenantId: string): Promise<{ success: boolean; cancelAt?: string; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${API_BASE_URL}/api/stripe/cancel-subscription`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tenantId }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || error.error };
      }

      return await response.json();
    } catch (error) {
      console.error('Cancel subscription error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get plan by name
   */
  public getPlan(name: string): SubscriptionPlan | undefined {
    return this.plans.find((p) => p.name === name);
  }

  /**
   * Redirect to Stripe Checkout
   */
  public async redirectToCheckout(params: {
    tenantId: string;
    plan: 'professional' | 'enterprise';
  }): Promise<void> {
    const { url, error } = await this.createCheckoutSession({
      tenantId: params.tenantId,
      plan: params.plan,
      successUrl: `${window.location.origin}/settings/billing?success=true`,
      cancelUrl: `${window.location.origin}/settings/billing?canceled=true`,
    });

    if (error || !url) {
      throw new Error(error || 'Failed to create checkout session');
    }

    window.location.href = url;
  }

  /**
   * Open Stripe Customer Portal
   */
  public async openCustomerPortal(tenantId: string): Promise<void> {
    const { url, error } = await this.createPortalSession({
      tenantId,
      returnUrl: `${window.location.origin}/settings/billing`,
    });

    if (error || !url) {
      throw new Error(error || 'Failed to open billing portal');
    }

    window.location.href = url;
  }
}

export default StripeService;
export const stripeService = StripeService.getInstance();

// Auto-initialize if publishable key is available
if (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
  stripeService.initialize();
}
