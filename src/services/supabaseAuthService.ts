import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface SupabaseAuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'GUEST';
  avatar?: string;
  user_metadata?: {
    organizationId?: string;
    [key: string]: any;
  };
}

class SupabaseAuthService {
  private static instance: SupabaseAuthService;

  static getInstance(): SupabaseAuthService {
    if (!SupabaseAuthService.instance) {
      SupabaseAuthService.instance = new SupabaseAuthService();
    }
    return SupabaseAuthService.instance;
  }

  /**
   * Check if Supabase is available
   */
  isAvailable(): boolean {
    return isSupabaseConfigured;
  }

  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string, metadata?: { name?: string }): Promise<{ user: SupabaseAuthUser | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { user: null, error: new Error('Supabase not configured') };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: metadata?.name || email.split('@')[0],
            role: 'USER',
          },
        },
      });

      if (error) {
        return { user: null, error };
      }

      if (!data.user) {
        return { user: null, error: new Error('No user returned') };
      }

      const user: SupabaseAuthUser = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata.name || email.split('@')[0],
        role: data.user.user_metadata.role || 'USER',
        avatar: data.user.user_metadata.avatar_url,
      };

      return { user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ user: SupabaseAuthUser | null; session: Session | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { user: null, session: null, error: new Error('Supabase not configured') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, session: null, error };
      }

      if (!data.user) {
        return { user: null, session: null, error: new Error('No user returned') };
      }

      const user: SupabaseAuthUser = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata.name || email.split('@')[0],
        role: data.user.user_metadata.role || 'USER',
        avatar: data.user.user_metadata.avatar_url,
      };

      return { user, session: data.session, error: null };
    } catch (error) {
      return { user: null, session: null, error: error as Error };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{ session: Session | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { session: null, error: new Error('Supabase not configured') };
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      return { session: data.session, error };
    } catch (error) {
      return { session: null, error: error as Error };
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<{ user: SupabaseAuthUser | null; error: Error | null }> {
    const { session, error } = await this.getSession();

    if (error || !session) {
      return { user: null, error };
    }

    const user: SupabaseAuthUser = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.user_metadata.name || session.user.email!.split('@')[0],
      role: session.user.user_metadata.role || 'USER',
      avatar: session.user.user_metadata.avatar_url,
    };

    return { user, error: null };
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: { name?: string; avatar?: string }): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: updates,
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase not configured') };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (!isSupabaseConfigured) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return supabase.auth.onAuthStateChange(callback);
  }
}

export default SupabaseAuthService;
