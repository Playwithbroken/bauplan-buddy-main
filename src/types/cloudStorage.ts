export type CloudProvider = 'google_drive' | 'onedrive' | 'dropbox';

export interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  provider: CloudProvider;
}

export interface CloudStorageConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

export interface CloudStorageAuthState {
  provider: CloudProvider;
  isConnected: boolean;
  email?: string;
  expiresAt?: string;
}
