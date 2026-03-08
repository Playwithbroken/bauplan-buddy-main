import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface AuthConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export class AuthService {
  private supabase: SupabaseClient;

  constructor(config: AuthConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  public getClient(): SupabaseClient {
    return this.supabase;
  }

  // Placeholder for future RBAC and token validation logic
  public async validateToken(token: string): Promise<any> {
    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    if (error) throw error;
    return user;
  }
}
