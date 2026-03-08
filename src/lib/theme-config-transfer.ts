export const THEME_CONFIG_FILENAME = 'bauplan-theme-config.json';

const isBrowserContext = () =>
  typeof window !== 'undefined' && typeof document !== 'undefined';

const isClipboardAvailable = (action: 'read' | 'write') =>
  typeof navigator !== 'undefined' &&
  typeof navigator.clipboard !== 'undefined' &&
  typeof navigator.clipboard[action === 'write' ? 'writeText' : 'readText'] === 'function' &&
  window.isSecureContext;

export const canWriteThemeConfigToClipboard = () =>
  isBrowserContext() && isClipboardAvailable('write');

export const canReadThemeConfigFromClipboard = () =>
  isBrowserContext() && isClipboardAvailable('read');

export const downloadThemeConfig = (content: string, filename = THEME_CONFIG_FILENAME) => {
  if (!isBrowserContext() || typeof URL === 'undefined' || typeof Blob === 'undefined') {
    return false;
  }

  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
};

export const writeThemeConfigToClipboard = async (content: string) => {
  if (!canWriteThemeConfigToClipboard()) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    console.error('Error writing theme configuration to clipboard:', error);
    return false;
  }
};

export const readThemeConfigFromClipboard = async () => {
  if (!canReadThemeConfigFromClipboard()) {
    return null;
  }

  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    console.error('Error reading theme configuration from clipboard:', error);
    return null;
  }
};
