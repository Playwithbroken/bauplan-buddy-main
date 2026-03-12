import { CloudProvider, CloudStorageAuthState } from '../types/cloudStorage';
import { supabase } from './supabaseClient';
import { getEnvVar } from '../utils/env';

class CloudStorageService {
  private static instance: CloudStorageService;

  private constructor() {}

  public static getInstance(): CloudStorageService {
    if (!CloudStorageService.instance) {
      CloudStorageService.instance = new CloudStorageService();
    }
    return CloudStorageService.instance;
  }

  // Get OAuth Configs
  private getConfigs(): Record<CloudProvider, { clientId: string, authUrl: string, scope: string }> {
    return {
      google_drive: {
        clientId: getEnvVar('VITE_GOOGLE_DRIVE_CLIENT_ID') || '',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
      },
      onedrive: {
        clientId: getEnvVar('VITE_ONEDRIVE_CLIENT_ID') || '',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        scope: 'Files.ReadWrite.AppFolder User.Read offline_access',
      },
      dropbox: {
        clientId: getEnvVar('VITE_DROPBOX_CLIENT_ID') || '',
        authUrl: 'https://www.dropbox.com/oauth2/authorize',
        scope: 'files.metadata.read files.content.read files.content.write',
      }
    };
  }

  /**
   * Generates the OAuth URL and redirects the user to the provider's login page.
   */
  public connect(provider: CloudProvider): void {
    const configs = this.getConfigs();
    const config = configs[provider];
    
    if (!config.clientId) {
      console.warn(`[CloudStorageService] Missing Client ID for ${provider}. Ensure environment variables are set.`);
      throw new Error(`${provider} integration is not fully configured yet. Missing API credentials.`);
    }

    const redirectUri = `${window.location.origin}/settings/storage/auth/callback`;
    const state = btoa(JSON.stringify({ provider, timestamp: Date.now() }));
    
    // Store state in localStorage to verify upon return
    localStorage.setItem('cloud_auth_state', state);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.scope,
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    // Navigate to OAuth consent screen
    window.location.href = `${config.authUrl}?${params.toString()}`;
  }

  /**
   * Disconnects a provider by removing tokens from local storage and user settings.
   */
  public async disconnect(provider: CloudProvider): Promise<void> {
    localStorage.removeItem(`cloud_token_${provider}`);
    const client = supabase.getClient();
    if (!client) return;
    
    const { data: { user } } = await client.auth.getUser();
    
    if (user) {
      try {
        await client.from('user_settings').upsert({
          user_id: user.id,
          [`${provider}_connected`]: false,
          [`${provider}_refresh_token`]: null,
        });
      } catch (error) {
        console.error(`Failed to update Supabase on ${provider} disconnect:`, error);
      }
    }
  }

  /**
   * Retrieves the current connection status of a provider.
   */
  public async getConnectionStatus(provider: CloudProvider): Promise<CloudStorageAuthState> {
    // 1. Check local storage first for quick response
    const localToken = localStorage.getItem(`cloud_token_${provider}`);
    if (localToken) {
      return { provider, isConnected: true };
    }
    
    // 2. Fallback to Supabase Database to check if user previously linked account
    try {
      const client = supabase.getClient();
      if (!client) return { provider, isConnected: false };

      const { data: { session } } = await client.auth.getSession();
      if (session?.user) {
        const { data, error } = await client
          .from('user_settings')
          .select(`${provider}_connected, ${provider}_email`)
          .eq('user_id', session.user.id)
          .single();
          
        if (!error && data && data[`${provider}_connected`]) {
          return { 
            provider, 
            isConnected: true,
            email: data[`${provider}_email`]
          };
        }
      }
    } catch (err) {
      console.error(`Error fetching connection status for ${provider}:`, err);
    }

    return { provider, isConnected: false };
  }
}

export const cloudStorageService = CloudStorageService.getInstance();
