import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFilterPresets } from '../useFilterPresets';
import { FilterDefinition, FilterPreset } from '../../types/filtering';

// Extend Jest matchers to include jest-dom
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useFilterPresets Hook', () => {
  const mockFilter: FilterDefinition = {
    id: 'filter-1',
    field: 'status',
    operator: 'equals',
    value: 'confirmed',
    label: 'Status equals Confirmed'
  };

  const mockPreset: FilterPreset = {
    id: 'preset-1',
    name: 'Confirmed Events',
    description: 'Events with confirmed status',
    isPublic: false,
    isDefault: false,
    filters: [mockFilter],
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
    usageCount: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', async () => {
      const { result } = renderHook(() => useFilterPresets());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.presets).toEqual([]);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should load existing presets from localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockPreset]));

      const { result } = renderHook(() => useFilterPresets());

      await waitFor(() => {
        expect(result.current.presets).toEqual([mockPreset]);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle invalid JSON gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const { result } = renderHook(() => useFilterPresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Failed to load filter presets');
      });
    });
  });

  describe('CRUD Operations', () => {
    it('should create a new preset', async () => {
      const { result } = renderHook(() => useFilterPresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let createdPreset: FilterPreset;
      await act(async () => {
        createdPreset = await result.current.createPreset('New Preset', [mockFilter]);
      });

      expect(createdPreset!.name).toBe('New Preset');
      expect(createdPreset!.filters).toEqual([mockFilter]);
      expect(result.current.presets).toContain(createdPreset!);
    });

    it('should update an existing preset', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockPreset]));
      const { result } = renderHook(() => useFilterPresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let updatedPreset: FilterPreset | null;
      await act(async () => {
        updatedPreset = await result.current.updatePreset(mockPreset.id, {
          name: 'Updated Name'
        });
      });

      expect(updatedPreset!.name).toBe('Updated Name');
    });

    it('should delete a preset', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockPreset]));
      const { result } = renderHook(() => useFilterPresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deletePreset(mockPreset.id);
      });

      expect(result.current.presets).toHaveLength(0);
    });

    it('should duplicate a preset', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockPreset]));
      const { result } = renderHook(() => useFilterPresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let duplicated: FilterPreset | null;
      await act(async () => {
        duplicated = await result.current.duplicatePreset(mockPreset.id, 'Copy');
      });

      expect(duplicated!.name).toBe('Copy');
      expect(duplicated!.id).not.toBe(mockPreset.id);
      expect(result.current.presets).toHaveLength(2);
    });
  });

  describe('Usage Operations', () => {
    it('should apply preset and increment usage count', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockPreset]));
      const { result } = renderHook(() => useFilterPresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let applied: FilterPreset | null;
      await act(async () => {
        applied = await result.current.applyPreset(mockPreset.id);
      });

      expect(applied!.usageCount).toBe(1);
      expect(applied!.lastUsed).toBeDefined();
    });

    it('should get preset by ID', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockPreset]));
      const { result } = renderHook(() => useFilterPresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const found = result.current.getPreset(mockPreset.id);
      expect(found).toEqual(mockPreset);
    });

    it('should get default preset', async () => {
      const defaultPreset = { ...mockPreset, isDefault: true };
      localStorageMock.getItem.mockReturnValue(JSON.stringify([defaultPreset]));
      const { result } = renderHook(() => useFilterPresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const found = result.current.getDefaultPreset();
      expect(found?.isDefault).toBe(true);
    });
  });

  describe('Search Operations', () => {
    it('should search presets by name', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockPreset]));
      const { result } = renderHook(() => useFilterPresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const searchResults = result.current.searchPresets('confirmed');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toContain('Confirmed');
    });

    it('should get most used presets', async () => {
      const presets = [
        { ...mockPreset, usageCount: 5 },
        { ...mockPreset, id: 'preset-2', usageCount: 10 }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(presets));
      const { result } = renderHook(() => useFilterPresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const mostUsed = result.current.getMostUsedPresets(1);
      expect(mostUsed[0].usageCount).toBe(10);
    });
  });

  describe('Import/Export', () => {
    it('should export presets', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockPreset]));
      const { result } = renderHook(() => useFilterPresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const exported = result.current.exportPresets();
      expect(exported.version).toBe('1.0');
      expect(exported.presets).toEqual([mockPreset]);
    });

    it('should import presets', async () => {
      const { result } = renderHook(() => useFilterPresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const importData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        filters: [],
        presets: [mockPreset],
        metadata: { totalFilters: 1, description: 'Test' }
      };

      let imported: FilterPreset[];
      await act(async () => {
        imported = await result.current.importPresets(importData);
      });

      expect(imported!).toHaveLength(1);
      expect(result.current.presets).toHaveLength(1);
    });
  });

  describe('Validation', () => {
    it('should validate preset correctly', async () => {
      const { result } = renderHook(() => useFilterPresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const validation = result.current.validatePreset(mockPreset);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect validation errors', async () => {
      const { result } = renderHook(() => useFilterPresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const invalidPreset = { ...mockPreset, name: '', filters: [] };
      const validation = result.current.validatePreset(invalidPreset);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Quick Filters', () => {
    it('should handle quick filters when enabled', async () => {
      const { result } = renderHook(() => useFilterPresets({ enableQuickFilters: true }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const activeFilters = result.current.getActiveQuickFilters();
      expect(Array.isArray(activeFilters)).toBe(true);
    });
  });
});