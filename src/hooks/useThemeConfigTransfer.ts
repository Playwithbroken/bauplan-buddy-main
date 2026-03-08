import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  THEME_CONFIG_FILENAME,
  canReadThemeConfigFromClipboard,
  canWriteThemeConfigToClipboard,
  downloadThemeConfig,
  readThemeConfigFromClipboard,
  writeThemeConfigToClipboard,
} from '@/lib/theme-config-transfer';

interface UseThemeConfigTransferOptions {
  importConfig: (payload: string) => boolean;
  exportConfig: () => string;
  toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive'; duration?: number }) => void;
  onImportSuccess?: () => void;
}

interface UseThemeConfigTransferReturn {
  manualImportText: string;
  manualImportError: string | null;
  isManualImportModalOpen: boolean;
  setManualImportModalOpen: (open: boolean) => void;
  handleManualImportTextChange: (value: string) => void;
  handleManualImportConfirm: () => void;
  handleManualImportFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  handleManualFileButtonClick: () => void;
  handleImportConfig: () => Promise<void>;
  handleExportConfig: () => Promise<void>;
  resetManualImportState: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const clipboardSupported = () =>
  typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function';

export function useThemeConfigTransfer({
  importConfig,
  exportConfig,
  toast,
  onImportSuccess,
}: UseThemeConfigTransferOptions): UseThemeConfigTransferReturn {
  const [isManualImportModalOpen, setManualImportModalOpen] = useState(false);
  const [manualImportText, setManualImportText] = useState('');
  const [manualImportError, setManualImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetManualImportState = useCallback(() => {
    setManualImportText('');
    setManualImportError(null);
  }, []);

  const applyImportedConfig = useCallback(
    (payload: string, options?: { fromManualDialog?: boolean }) => {
      const trimmed = payload.trim();
      if (!trimmed) {
        if (options?.fromManualDialog) {
          setManualImportError('Keine Theme-Konfiguration vorhanden.');
        } else {
          toast({
            title: 'Import fehlgeschlagen',
            description: 'Keine Theme-Konfiguration gefunden.',
            variant: 'destructive',
          });
        }
        return false;
      }

      try {
        const success = importConfig(trimmed);
        if (success) {
          toast({
            title: 'Konfiguration importiert',
            description: 'Theme-Konfiguration wurde erfolgreich geladen.',
          });
          resetManualImportState();
          setManualImportModalOpen(false);
          onImportSuccess?.();
          return true;
        }

        if (options?.fromManualDialog) {
          setManualImportError('Die angegebene Konfiguration ist ungueltig.');
        } else {
          toast({
            title: 'Import fehlgeschlagen',
            description: 'Die bereitgestellte Theme-Konfiguration ist ungueltig.',
            variant: 'destructive',
          });
        }
        return false;
      } catch (error) {
        if (options?.fromManualDialog) {
          setManualImportError('Konfiguration konnte nicht verarbeitet werden.');
        } else {
          toast({
            title: 'Import fehlgeschlagen',
            description: error instanceof Error ? error.message : 'Konfiguration konnte nicht verarbeitet werden.',
            variant: 'destructive',
          });
        }
        return false;
      }
    },
    [importConfig, onImportSuccess, resetManualImportState, toast]
  );

  const handleExportConfig = useCallback(async () => {
    const content = exportConfig();
    if (!content) {
      toast({
        title: 'Export fehlgeschlagen',
        description: 'Keine Theme-Konfiguration verfuegbar.',
        variant: 'destructive',
      });
      return;
    }

    const clipboardAvailable = clipboardSupported() && canWriteThemeConfigToClipboard();
    if (clipboardAvailable) {
      const success = await writeThemeConfigToClipboard(content);
      if (success) {
        toast({
          title: 'Konfiguration kopiert',
          description: 'Theme-Konfiguration wurde in die Zwischenablage kopiert.',
        });
        return;
      }
    }

    const downloaded = downloadThemeConfig(content, THEME_CONFIG_FILENAME);
    if (downloaded) {
      toast({
        title: 'Download gestartet',
        description: 'Theme-Konfiguration wurde als Datei gespeichert.',
      });
      return;
    }

    setManualImportModalOpen(true);
    setManualImportText(content);
    setManualImportError(null);

    toast({
      title: 'Export bereitgestellt',
      description: 'Kopieren Sie die Konfiguration manuell aus dem Dialog.',
    });
  }, [exportConfig, toast]);

  const handleImportConfig = useCallback(async () => {
    const clipboardAvailable = clipboardSupported() && canReadThemeConfigFromClipboard();
    if (clipboardAvailable) {
      const clipboardContent = await readThemeConfigFromClipboard();
      if (clipboardContent && applyImportedConfig(clipboardContent)) {
        return;
      }
    }

    resetManualImportState();
    setManualImportModalOpen(true);
  }, [applyImportedConfig, resetManualImportState]);

  const handleManualImportTextChange = useCallback((value: string) => {
    setManualImportText(value);
    if (manualImportError) {
      setManualImportError(null);
    }
  }, [manualImportError]);

  const handleManualImportConfirm = useCallback(() => {
    applyImportedConfig(manualImportText, { fromManualDialog: true });
  }, [applyImportedConfig, manualImportText]);

  const handleManualFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleManualImportFileUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === 'string' ? reader.result : '';
        if (!text) {
          setManualImportError('Die Datei war leer oder konnte nicht gelesen werden.');
          return;
        }

        setManualImportText(text);
        applyImportedConfig(text, { fromManualDialog: true });
      };
      reader.onerror = () => {
        setManualImportError('Die Datei konnte nicht gelesen werden.');
      };
      reader.readAsText(file);

      // Reset input to allow re-uploading the same file if needed
      event.target.value = '';
    },
    [applyImportedConfig]
  );

  return {
    manualImportText,
    manualImportError,
    isManualImportModalOpen,
    setManualImportModalOpen,
    handleManualImportTextChange,
    handleManualImportConfirm,
    handleManualImportFileUpload,
    handleManualFileButtonClick,
    handleImportConfig,
    handleExportConfig,
    resetManualImportState,
    fileInputRef,
  };
}

export default useThemeConfigTransfer;
