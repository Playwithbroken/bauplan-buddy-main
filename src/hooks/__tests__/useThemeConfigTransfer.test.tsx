import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useThemeConfigTransfer } from '../useThemeConfigTransfer';
import type { ChangeEvent } from 'react';

import '@testing-library/jest-dom';

jest.mock('@/lib/theme-config-transfer', () => ({
  canReadThemeConfigFromClipboard: jest.fn(),
  readThemeConfigFromClipboard: jest.fn(),
  writeThemeConfigToClipboard: jest.fn(),
  downloadThemeConfig: jest.fn(),
}));

import {
  canReadThemeConfigFromClipboard,
  readThemeConfigFromClipboard,
  writeThemeConfigToClipboard,
  downloadThemeConfig,
} from '@/lib/theme-config-transfer';

const mockCanRead = canReadThemeConfigFromClipboard as jest.MockedFunction<typeof canReadThemeConfigFromClipboard>;
const mockRead = readThemeConfigFromClipboard as jest.MockedFunction<typeof readThemeConfigFromClipboard>;
const mockWrite = writeThemeConfigToClipboard as jest.MockedFunction<typeof writeThemeConfigToClipboard>;
const mockDownload = downloadThemeConfig as jest.MockedFunction<typeof downloadThemeConfig>;

describe('useThemeConfigTransfer', () => {
  const toast = jest.fn();
  const onImportSuccess = jest.fn();
  const importConfig = jest.fn<boolean, [string]>();
  const exportConfig = jest.fn<string, []>(() => '{"theme":"light"}');

  beforeEach(() => {
    jest.clearAllMocks();
    mockWrite.mockResolvedValue(true);
    mockDownload.mockReturnValue(true);
    mockCanRead.mockReturnValue(true);
    mockRead.mockResolvedValue('{"theme":"dark"}');
    importConfig.mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('exports configuration to clipboard when available', async () => {
    const { result } = renderHook(() =>
      useThemeConfigTransfer({
        importConfig,
        exportConfig,
        toast,
        onImportSuccess,
      })
    );

    await act(async () => {
      await result.current.handleExportConfig();
    });

    expect(exportConfig).toHaveBeenCalledTimes(1);
    expect(mockWrite).toHaveBeenCalledWith('{"theme":"light"}');
    expect(mockDownload).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith({
      title: 'Konfiguration exportiert',
      description: 'Theme-Konfiguration wurde in die Zwischenablage kopiert',
    });
  });

  it('downloads configuration when clipboard is unavailable', async () => {
    mockWrite.mockResolvedValue(false);
    const { result } = renderHook(() =>
      useThemeConfigTransfer({
        importConfig,
        exportConfig,
        toast,
        onImportSuccess,
      })
    );

    await act(async () => {
      await result.current.handleExportConfig();
    });

    expect(mockWrite).toHaveBeenCalled();
    expect(mockDownload).toHaveBeenCalledWith('{"theme":"light"}');
    expect(toast).toHaveBeenCalledWith({
      title: 'Konfiguration exportiert',
      description: 'Clipboard nicht verfuegbar - Theme-Konfiguration als Datei heruntergeladen.',
    });
  });

  it('reports export failure when neither clipboard nor download succeed', async () => {
    mockWrite.mockResolvedValue(false);
    mockDownload.mockReturnValue(false);
    const { result } = renderHook(() =>
      useThemeConfigTransfer({
        importConfig,
        exportConfig,
        toast,
        onImportSuccess,
      })
    );

    await act(async () => {
      await result.current.handleExportConfig();
    });

    expect(toast).toHaveBeenCalledWith({
      title: 'Export fehlgeschlagen',
      description: 'Konfiguration konnte nicht exportiert werden.',
      variant: 'destructive',
    });
  });

  it('imports configuration directly from clipboard when available', async () => {
    const { result } = renderHook(() =>
      useThemeConfigTransfer({
        importConfig,
        exportConfig,
        toast,
        onImportSuccess,
      })
    );

    await act(async () => {
      await result.current.handleImportConfig();
    });

    expect(mockCanRead).toHaveBeenCalled();
    expect(mockRead).toHaveBeenCalled();
    expect(importConfig).toHaveBeenCalledWith('{"theme":"dark"}');
    expect(onImportSuccess).toHaveBeenCalled();
    expect(result.current.isManualImportModalOpen).toBe(false);
    expect(toast).toHaveBeenCalledWith({
      title: 'Konfiguration importiert',
      description: 'Theme-Konfiguration wurde erfolgreich geladen',
    });
  });

  it('opens manual import dialog when clipboard is empty', async () => {
    mockRead.mockResolvedValue('   ');
    const { result } = renderHook(() =>
      useThemeConfigTransfer({
        importConfig,
        exportConfig,
        toast,
        onImportSuccess,
      })
    );

    await act(async () => {
      await result.current.handleImportConfig();
    });

    expect(result.current.isManualImportModalOpen).toBe(true);
    expect(toast).toHaveBeenCalledWith({
      title: 'Zwischenablage leer',
      description: 'Fuegen Sie die Konfiguration manuell ein oder laden Sie eine JSON-Datei hoch.',
    });
  });

  it('validates manual import confirmation', () => {
    const { result } = renderHook(() =>
      useThemeConfigTransfer({
        importConfig,
        exportConfig,
        toast,
        onImportSuccess,
      })
    );

    act(() => {
      result.current.setManualImportModalOpen(true);
      result.current.handleManualImportTextChange('   ');
      result.current.handleManualImportConfirm();
    });

    expect(result.current.manualImportError).toBe('Bitte fuegen Sie eine Konfiguration ein.');
    expect(importConfig).not.toHaveBeenCalled();
  });

  it('imports configuration via manual dialog when text is valid', () => {
    const { result } = renderHook(() =>
      useThemeConfigTransfer({
        importConfig,
        exportConfig,
        toast,
        onImportSuccess,
      })
    );

    act(() => {
      result.current.setManualImportModalOpen(true);
      result.current.handleManualImportTextChange(' {\"theme\":\"custom\"} ');
      result.current.handleManualImportConfirm();
    });

    expect(importConfig).toHaveBeenCalledWith('{"theme":"custom"}');
    expect(result.current.manualImportError).toBeNull();
    expect(result.current.isManualImportModalOpen).toBe(false);
    expect(onImportSuccess).toHaveBeenCalled();
  });

  it('rejects empty manual file uploads', async () => {
    const emptyFile = {
      text: () => Promise.resolve('   '),
    } as unknown as File;
    const { result } = renderHook(() =>
      useThemeConfigTransfer({
        importConfig,
        exportConfig,
        toast,
        onImportSuccess,
      })
    );

    await act(async () => {
      await result.current.handleManualImportFileUpload({
        target: {
          files: [emptyFile],
          value: 'placeholder',
        },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.manualImportError).toBe('Ausgewaehlte Datei ist leer.');
    expect(importConfig).not.toHaveBeenCalled();
  });

  it('imports configuration from uploaded file when valid', async () => {
    const fileConfig = {
      text: () => Promise.resolve('{"theme":"from-file"}'),
    } as unknown as File;

    const { result } = renderHook(() =>
      useThemeConfigTransfer({
        importConfig,
        exportConfig,
        toast,
        onImportSuccess,
      })
    );

    await act(async () => {
      await result.current.handleManualImportFileUpload({
        target: {
          files: [fileConfig],
          value: 'placeholder',
        },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });

    expect(importConfig).toHaveBeenCalledWith('{"theme":"from-file"}');
    expect(result.current.manualImportError).toBeNull();
    expect(result.current.isManualImportModalOpen).toBe(false);
    expect(onImportSuccess).toHaveBeenCalled();
  });
});
