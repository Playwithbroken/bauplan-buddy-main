/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_USE_API: string
  readonly VITE_USE_MOCK_BACKEND: string
  readonly VITE_QUOTE_SERVICE_URL: string
  readonly VITE_PROJECT_SERVICE_URL: string
  readonly VITE_DELIVERY_SERVICE_URL: string
  readonly VITE_INVOICE_SERVICE_URL: string
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  desktop?: {
    isDesktop: boolean;
    ping: () => Promise<{ ok: boolean; platform: string; appVersion: string }>;
    openTearOff: (
      path: string,
      title?: string,
      width?: number,
      height?: number
    ) => Promise<{ windowId: number; url: string }>;
    notify: (title: string, body?: string) => Promise<{ ok: boolean; reason?: string }>;
    openExternal: (url: string) => Promise<{ ok: boolean; reason?: string }>;
    openFileDialog: (
      filters?: Array<{ name: string; extensions: string[] }>,
      properties?: Array<"openFile" | "openDirectory" | "multiSelections" | "showHiddenFiles" | "createDirectory" | "promptToCreate" | "noResolveAliases" | "treatPackageAsDirectory" | "dontAddToRecent">,
      title?: string
    ) => Promise<{ canceled: boolean; filePaths: string[] }>;
    readFile: (targetPath: string) => Promise<{
      ok: boolean;
      reason?: string;
      message?: string;
      path?: string;
      name?: string;
      mimeType?: string;
      size?: number;
      dataBase64?: string;
    }>;
    writeFile: (
      filename: string,
      dataBase64: string,
      directory?: string
    ) => Promise<{
      ok: boolean;
      reason?: string;
      message?: string;
      path?: string;
      name?: string;
      mimeType?: string;
    }>;
    fileExists: (targetPath: string) => Promise<{ ok: boolean; exists?: boolean; reason?: string }>;
    checkForUpdates: () => Promise<{
      ok: boolean;
      reason?: string;
      message?: string;
      updateInfo?: unknown;
      updateReadyToInstall?: boolean;
    }>;
    downloadUpdate: () => Promise<{ ok: boolean; reason?: string; message?: string }>;
    installUpdate: () => Promise<{ ok: boolean; reason?: string; message?: string }>;
    getDiagnostics: () => Promise<{
      ok: boolean;
      platform: string;
      appVersion: string;
      startupLogPath: string;
      startupLogTail: string;
      currentUrl: string | null;
      updateReadyToInstall: boolean;
      isDev: boolean;
    }>;
    onUpdaterEvent: (handler: (event: {
      type: string;
      info?: unknown;
      message?: string;
      progress?: {
        percent: number;
        bytesPerSecond: number;
        transferred: number;
        total: number;
      };
    }) => void) => () => void;
  };
  electron?: {
    openTearOffDialog: (path: string, title?: string, width?: number, height?: number) => void;
  };
}
