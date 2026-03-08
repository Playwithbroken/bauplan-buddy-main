/**
 * Utility to safely access environment variables in both Vite and Jest/Node environments.
 * Uses direct import.meta.env access (no eval) for Vite, and process.env for Node/tests.
 */
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  // Vite environment — import.meta.env is statically replaced at build time
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = import.meta.env[key] as string | undefined;
    if (value !== undefined) return value;
  }

  // Node.js / Jest environment fallback
  if (typeof process !== 'undefined' && process?.env) {
    return process.env[key] ?? defaultValue;
  }

  return defaultValue;
}

export function isDevelopment(): boolean {
  return getEnvVar('MODE') !== 'production';
}

export function isProduction(): boolean {
  return getEnvVar('MODE') === 'production';
}

export function isTest(): boolean {
  return getEnvVar('NODE_ENV') === 'test' || getEnvVar('MODE') === 'test';
}
