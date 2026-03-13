import { createClient } from '@supabase/supabase-js';

type DesktopWindow = Window & {
  desktop?: {
    isDesktop?: boolean;
  };
};

const runtimeWindow =
  typeof window !== 'undefined' ? (window as DesktopWindow) : undefined;
const isDesktopRuntime =
  Boolean(runtimeWindow?.desktop?.isDesktop) ||
  runtimeWindow?.location?.protocol === 'file:' ||
  Boolean(runtimeWindow?.navigator?.userAgent?.includes('Electron'));

const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const configuredSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isProduction = import.meta.env.PROD;
const hasRealSupabaseConfig = Boolean(
  configuredSupabaseUrl && configuredSupabaseAnonKey
);

const supabaseUrl =
  configuredSupabaseUrl ||
  (isDesktopRuntime ? 'https://offline-placeholder.supabase.co' : undefined);
const supabaseAnonKey =
  configuredSupabaseAnonKey ||
  (isDesktopRuntime ? 'offline-placeholder-anon-key' : undefined);

if (!hasRealSupabaseConfig) {
  if (isProduction && !isDesktopRuntime) {
    throw new Error(
      '[Bauplan Buddy] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in production. ' +
        'Add them to your deployment environment variables.'
    );
  }

  console.warn(
    'Supabase credentials not found. Running in offline/desktop-safe mode.'
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'https://offline-placeholder.supabase.co',
  supabaseAnonKey ?? 'offline-placeholder-anon-key',
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

export const isSupabaseConfigured = hasRealSupabaseConfig;

export async function checkSupabaseConnection(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const { error } = await supabase.from('_healthcheck').select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
}
