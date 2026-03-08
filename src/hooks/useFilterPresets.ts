import { useState, useEffect, useCallback } from 'react';
import {
  FilterDefinition,
  FilterPreset,
  QuickFilter,
  SearchConfig,
  SortDefinition,
  GroupDefinition,
  FilterExport,
  DEFAULT_QUICK_FILTERS
} from '@/types/filtering';

interface UseFilterPresetsOptions {
  enableQuickFilters?: boolean;
  enableAutoSave?: boolean;
  maxPresets?: number;
}

interface FilterPresetsState {
  presets: FilterPreset[];
  quickFilters: QuickFilter[];
  isLoading: boolean;
  error?: string;
}

export function useFilterPresets(options: UseFilterPresetsOptions = {}) {
  const {
    enableQuickFilters = true,
    enableAutoSave = true,
    maxPresets = 50
  } = options;

  const [state, setState] = useState<FilterPresetsState>({
    presets: [],
    quickFilters: enableQuickFilters ? DEFAULT_QUICK_FILTERS : [],
    isLoading: true,
    error: undefined
  });

  // Load presets from localStorage on mount
  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  // Generate unique ID
  const generateId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9);
  }, []);

  // Load presets from localStorage
  const loadPresets = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const saved = localStorage.getItem('bauplan-filter-presets');
      let presets: FilterPreset[] = [];
      
      if (saved) {
        presets = JSON.parse(saved);
        // Validate and migrate old presets if needed
        presets = presets.filter(preset => preset.id && preset.name);
      }

      setState(prev => ({
        ...prev,
        presets,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to load filter presets:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load filter presets'
      }));
    }
  }, []);

  // Save presets to localStorage
  const savePresets = useCallback(async (presets: FilterPreset[]) => {
    if (!enableAutoSave) return;

    try {
      const presetsToSave = presets.slice(0, maxPresets); // Limit number of presets
      localStorage.setItem('bauplan-filter-presets', JSON.stringify(presetsToSave));
      
      setState(prev => ({
        ...prev,
        presets: presetsToSave,
        error: undefined
      }));
    } catch (error) {
      console.error('Failed to save filter presets:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to save filter presets'
      }));
    }
  }, [enableAutoSave, maxPresets]);

  // Create a new preset
  const createPreset = useCallback(async (
    name: string,
    filters: FilterDefinition[],
    options?: {
      description?: string;
      isPublic?: boolean;
      isDefault?: boolean;
      search?: SearchConfig;
      sort?: SortDefinition;
      group?: GroupDefinition;
    }
  ): Promise<FilterPreset> => {
    const newPreset: FilterPreset = {
      id: generateId(),
      name: name.trim(),
      description: options?.description || '',
      isPublic: options?.isPublic || false,
      isDefault: options?.isDefault || false,
      filters,
      search: options?.search,
      sort: options?.sort,
      group: options?.group,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };

    // If this is set as default, remove default from others
    let updatedPresets = [...state.presets];
    if (newPreset.isDefault) {
      updatedPresets = updatedPresets.map(preset => ({
        ...preset,
        isDefault: false
      }));
    }

    updatedPresets.push(newPreset);
    await savePresets(updatedPresets);

    return newPreset;
  }, [state.presets, generateId, savePresets]);

  // Update an existing preset
  const updatePreset = useCallback(async (
    presetId: string,
    updates: Partial<Omit<FilterPreset, 'id' | 'createdAt'>>
  ): Promise<FilterPreset | null> => {
    const presetIndex = state.presets.findIndex(p => p.id === presetId);
    if (presetIndex === -1) return null;

    const updatedPreset: FilterPreset = {
      ...state.presets[presetIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    let updatedPresets = [...state.presets];
    updatedPresets[presetIndex] = updatedPreset;

    // If this is set as default, remove default from others
    if (updatedPreset.isDefault) {
      updatedPresets = updatedPresets.map((preset, index) => ({
        ...preset,
        isDefault: index === presetIndex
      }));
    }

    await savePresets(updatedPresets);
    return updatedPreset;
  }, [state.presets, savePresets]);

  // Delete a preset
  const deletePreset = useCallback(async (presetId: string): Promise<boolean> => {
    const updatedPresets = state.presets.filter(p => p.id !== presetId);
    await savePresets(updatedPresets);
    return true;
  }, [state.presets, savePresets]);

  // Duplicate a preset
  const duplicatePreset = useCallback(async (presetId: string, newName?: string): Promise<FilterPreset | null> => {
    const originalPreset = state.presets.find(p => p.id === presetId);
    if (!originalPreset) return null;

    const duplicatedPreset: FilterPreset = {
      ...originalPreset,
      id: generateId(),
      name: newName || `${originalPreset.name} (Kopie)`,
      isDefault: false, // Copies are never default
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      lastUsed: undefined
    };

    const updatedPresets = [...state.presets, duplicatedPreset];
    await savePresets(updatedPresets);

    return duplicatedPreset;
  }, [state.presets, generateId, savePresets]);

  // Apply a preset (increments usage count)
  const applyPreset = useCallback(async (presetId: string): Promise<FilterPreset | null> => {
    const preset = state.presets.find(p => p.id === presetId);
    if (!preset) return null;

    const updatedPreset: FilterPreset = {
      ...preset,
      usageCount: preset.usageCount + 1,
      lastUsed: new Date().toISOString()
    };

    const updatedPresets = state.presets.map(p => 
      p.id === presetId ? updatedPreset : p
    );

    await savePresets(updatedPresets);
    return updatedPreset;
  }, [state.presets, savePresets]);

  // Get preset by ID
  const getPreset = useCallback((presetId: string): FilterPreset | null => {
    return state.presets.find(p => p.id === presetId) || null;
  }, [state.presets]);

  // Get default preset
  const getDefaultPreset = useCallback((): FilterPreset | null => {
    return state.presets.find(p => p.isDefault) || null;
  }, [state.presets]);

  // Search presets
  const searchPresets = useCallback((query: string): FilterPreset[] => {
    if (!query.trim()) return state.presets;

    const lowerQuery = query.toLowerCase();
    return state.presets.filter(preset => 
      preset.name.toLowerCase().includes(lowerQuery) ||
      (preset.description && preset.description.toLowerCase().includes(lowerQuery))
    );
  }, [state.presets]);

  // Get most used presets
  const getMostUsedPresets = useCallback((limit = 5): FilterPreset[] => {
    return [...state.presets]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }, [state.presets]);

  // Get recently used presets
  const getRecentlyUsedPresets = useCallback((limit = 5): FilterPreset[] => {
    return [...state.presets]
      .filter(p => p.lastUsed)
      .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
      .slice(0, limit);
  }, [state.presets]);

  // Export presets
  const exportPresets = useCallback((presetIds?: string[]): FilterExport => {
    const presetsToExport = presetIds 
      ? state.presets.filter(p => presetIds.includes(p.id))
      : state.presets;

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      filters: [], // No individual filters in this export
      presets: presetsToExport,
      metadata: {
        totalFilters: presetsToExport.reduce((sum, p) => sum + p.filters.length, 0),
        description: 'Bauplan Buddy Filter Presets Export'
      }
    };
  }, [state.presets]);

  // Import presets
  const importPresets = useCallback(async (exportData: FilterExport, options?: {
    overwrite?: boolean;
    prefix?: string;
  }): Promise<FilterPreset[]> => {
    const { overwrite = false, prefix = '' } = options || {};
    
    if (!exportData.presets) {
      throw new Error('No presets found in import data');
    }

    const importedPresets: FilterPreset[] = exportData.presets.map(preset => ({
      ...preset,
      id: generateId(),
      name: prefix ? `${prefix} ${preset.name}` : preset.name,
      isDefault: false, // Imported presets are never default
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      lastUsed: undefined
    }));

    let updatedPresets;
    if (overwrite) {
      updatedPresets = importedPresets;
    } else {
      updatedPresets = [...state.presets, ...importedPresets];
    }

    await savePresets(updatedPresets);
    return importedPresets;
  }, [state.presets, generateId, savePresets]);

  // Quick filter operations
  const getQuickFilter = useCallback((filterId: string): QuickFilter | null => {
    return state.quickFilters.find(f => f.id === filterId) || null;
  }, [state.quickFilters]);

  const getActiveQuickFilters = useCallback((): QuickFilter[] => {
    return state.quickFilters.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [state.quickFilters]);

  // Clear all presets
  const clearAllPresets = useCallback(async (): Promise<void> => {
    await savePresets([]);
  }, [savePresets]);

  // Validate preset
  const validatePreset = useCallback((preset: FilterPreset): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!preset.name.trim()) {
      errors.push('Preset name is required');
    }

    if (preset.filters.length === 0) {
      errors.push('At least one filter is required');
    }

    // Check for duplicate names
    const existingPreset = state.presets.find(p => p.id !== preset.id && p.name === preset.name);
    if (existingPreset) {
      errors.push('A preset with this name already exists');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [state.presets]);

  return {
    // State
    presets: state.presets,
    quickFilters: state.quickFilters,
    isLoading: state.isLoading,
    error: state.error,

    // CRUD operations
    createPreset,
    updatePreset,
    deletePreset,
    duplicatePreset,
    
    // Usage operations
    applyPreset,
    getPreset,
    getDefaultPreset,
    
    // Search and filtering
    searchPresets,
    getMostUsedPresets,
    getRecentlyUsedPresets,
    
    // Import/Export
    exportPresets,
    importPresets,
    
    // Quick filters
    getQuickFilter,
    getActiveQuickFilters,
    
    // Utilities
    clearAllPresets,
    validatePreset,
    reload: loadPresets
  };
}
