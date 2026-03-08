import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isProduction = import.meta.env.PROD;

if (!supabaseUrl || !supabaseAnonKey) {
  if (isProduction) {
    throw new Error(
      '[Bauplan Buddy] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in production. ' +
      'Add them to your deployment environment variables.'
    );
  }
  console.warn('⚠️ Supabase credentials not found. Running in offline/dev mode.');
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'bauplan-buddy@2.0.0',
      },
    },
  }
);

// Check if Supabase is properly configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Helper to check connection
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  
  try {
    const { error } = await supabase.from('_healthcheck').select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
}
