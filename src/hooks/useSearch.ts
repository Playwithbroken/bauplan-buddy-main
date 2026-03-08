import { useState, useCallback, useMemo } from 'react';
import {
  SearchConfig,
  AdvancedSearch,
  FilterResult,
  FilterDefinition,
  SortDefinition,
  GroupDefinition,
  SearchSuggestion,
  FilterField,
  FILTER_FIELD_METADATA
} from '@/types/filtering';
import { StoredAppointment } from '@/services/appointmentService';
import { FilterService } from '@/services/filterService';

interface UseSearchOptions {
  initialFields?: FilterField[];
  enableHistory?: boolean;
  maxHistoryItems?: number;
}

interface SearchState {
  isSearching: boolean;
  searchConfig: SearchConfig;
  activeFilters: FilterDefinition[];
  sortBy?: SortDefinition;
  groupBy?: GroupDefinition;
  results?: FilterResult;
  searchHistory: string[];
  error?: string;
}

export function useSearch(appointments: StoredAppointment[], options: UseSearchOptions = {}) {
  const {
    initialFields = ['title', 'description', 'location'],
    enableHistory = true,
    maxHistoryItems = 10
  } = options;

  const [state, setState] = useState<SearchState>({
    isSearching: false,
    searchConfig: {
      query: '',
      fields: initialFields,
      caseSensitive: false,
      exactMatch: false,
      highlightMatches: true
    },
    activeFilters: [],
    searchHistory: enableHistory ? loadSearchHistory() : []
  });

  // Load search history from localStorage
  function loadSearchHistory(): string[] {
    try {
      const saved = localStorage.getItem('bauplan-search-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  // Save search history to localStorage
  const saveSearchHistory = useCallback((history: string[]) => {
    if (enableHistory) {
      try {
        localStorage.setItem('bauplan-search-history', JSON.stringify(history));
      } catch (error) {
        console.warn('Failed to save search history:', error);
      }
    }
  }, [enableHistory]);

  // Execute search with current configuration
  const executeSearch = useCallback(async (searchConfig?: SearchConfig): Promise<FilterResult> => {
    const config = searchConfig || state.searchConfig;
    
    setState(prev => ({ ...prev, isSearching: true, error: undefined }));

    try {
      const advancedSearch: AdvancedSearch = {
        search: config,
        filters: state.activeFilters,
        sortBy: state.sortBy,
        groupBy: state.groupBy
      };

      const results = await FilterService.executeAdvancedSearch(appointments, advancedSearch);

      // Update search history
      if (config.query.trim() && enableHistory) {
        const newHistory = [
          config.query.trim(),
          ...state.searchHistory.filter(item => item !== config.query.trim())
        ].slice(0, maxHistoryItems);
        
        setState(prev => ({ ...prev, searchHistory: newHistory }));
        saveSearchHistory(newHistory);
      }

      setState(prev => ({
        ...prev,
        isSearching: false,
        searchConfig: config,
        results
      }));

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setState(prev => ({
        ...prev,
        isSearching: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [appointments, state.searchConfig, state.activeFilters, state.sortBy, state.groupBy, state.searchHistory, enableHistory, maxHistoryItems, saveSearchHistory]);

  // Update search configuration
  const updateSearchConfig = useCallback((updates: Partial<SearchConfig>) => {
    setState(prev => ({
      ...prev,
      searchConfig: { ...prev.searchConfig, ...updates }
    }));
  }, []);

  // Set search query
  const setQuery = useCallback((query: string) => {
    updateSearchConfig({ query });
  }, [updateSearchConfig]);

  // Set search fields
  const setSearchFields = useCallback((fields: FilterField[]) => {
    updateSearchConfig({ fields });
  }, [updateSearchConfig]);

  // Toggle search options
  const toggleCaseSensitive = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchConfig: {
        ...prev.searchConfig,
        caseSensitive: !prev.searchConfig.caseSensitive
      }
    }));
  }, []);

  const toggleExactMatch = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchConfig: {
        ...prev.searchConfig,
        exactMatch: !prev.searchConfig.exactMatch
      }
    }));
  }, []);

  const toggleHighlightMatches = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchConfig: {
        ...prev.searchConfig,
        highlightMatches: !prev.searchConfig.highlightMatches
      }
    }));
  }, []);

  // Add filter to search
  const addFilter = useCallback((filter: FilterDefinition) => {
    setState(prev => ({
      ...prev,
      activeFilters: [...prev.activeFilters, filter]
    }));
  }, []);

  // Remove filter from search
  const removeFilter = useCallback((filterId: string) => {
    setState(prev => ({
      ...prev,
      activeFilters: prev.activeFilters.filter(f => f.id !== filterId)
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setState(prev => ({ ...prev, activeFilters: [] }));
  }, []);

  // Set sorting
  const setSorting = useCallback((sortBy?: SortDefinition) => {
    setState(prev => ({ ...prev, sortBy }));
  }, []);

  // Set grouping
  const setGrouping = useCallback((groupBy?: GroupDefinition) => {
    setState(prev => ({ ...prev, groupBy }));
  }, []);

  // Clear search and filters
  const clearAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchConfig: {
        query: '',
        fields: initialFields,
        caseSensitive: false,
        exactMatch: false,
        highlightMatches: true
      },
      activeFilters: [],
      sortBy: undefined,
      groupBy: undefined,
      results: undefined,
      error: undefined
    }));
  }, [initialFields]);

  // Quick search (search immediately on query change)
  const quickSearch = useCallback((query: string) => {
    const config: SearchConfig = {
      ...state.searchConfig,
      query: query.trim()
    };
    
    if (config.query) {
      executeSearch(config);
    } else {
      clearAll();
    }
  }, [state.searchConfig, executeSearch, clearAll]);

  // Generate search suggestions
  const generateSuggestions = useCallback((query: string): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // Recent searches
    if (query.trim() === '') {
      state.searchHistory.slice(0, 5).forEach(term => {
        suggestions.push({
          type: 'recent',
          value: term,
          displayText: term,
          description: 'Kürzlich gesucht'
        });
      });
    }

    // Field suggestions
    Object.entries(FILTER_FIELD_METADATA).forEach(([key, metadata]) => {
      if (metadata.label.toLowerCase().includes(lowerQuery) && metadata.type === 'text') {
        suggestions.push({
          type: 'field',
          field: key as FilterField,
          value: key,
          displayText: `Suche in ${metadata.label}`,
          description: metadata.description
        });
      }
    });

    // Value suggestions from appointments
    if (query.length >= 2) {
      const valueCounts = new Map<string, number>();
      
      appointments.forEach(appointment => {
        state.searchConfig.fields.forEach(field => {
          const value = getFieldValue(appointment, field);
          if (value && value.toLowerCase().includes(lowerQuery)) {
            const existing = valueCounts.get(value) || 0;
            valueCounts.set(value, existing + 1);
          }
        });
      });

      // Sort by frequency and add top suggestions
      Array.from(valueCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .forEach(([value, count]) => {
          suggestions.push({
            type: 'value',
            value,
            displayText: value,
            description: `${count} Treffer`,
            count
          });
        });
    }

    return suggestions.slice(0, 8);
  }, [appointments, state.searchConfig.fields, state.searchHistory]);

  // Get field value helper
  const getFieldValue = (appointment: StoredAppointment, field: FilterField): string => {
    switch (field) {
      case 'title': return appointment.title;
      case 'description': return appointment.description || '';
      case 'location': return appointment.location || '';
      case 'type': return appointment.type;
      default: return '';
    }
  };

  // Check if search is active
  const isSearchActive = useMemo(() => {
    return state.searchConfig.query.trim() !== '' || state.activeFilters.length > 0;
  }, [state.searchConfig.query, state.activeFilters.length]);

  // Get filtered appointments (current results or all if no search)
  const filteredAppointments = useMemo(() => {
    return state.results?.appointments || appointments;
  }, [state.results, appointments]);

  // Search statistics
  const searchStats = useMemo(() => {
    if (!state.results) {
      return {
        totalCount: appointments.length,
        filteredCount: appointments.length,
        hasFilters: false,
        hasSearch: false
      };
    }

    return {
      totalCount: state.results.totalCount,
      filteredCount: state.results.filteredCount,
      hasFilters: state.activeFilters.length > 0,
      hasSearch: state.searchConfig.query.trim() !== '',
      executionTime: state.results.metadata.executionTime
    };
  }, [state.results, appointments.length, state.activeFilters.length, state.searchConfig.query]);

  return {
    // State
    isSearching: state.isSearching,
    searchConfig: state.searchConfig,
    activeFilters: state.activeFilters,
    sortBy: state.sortBy,
    groupBy: state.groupBy,
    results: state.results,
    error: state.error,
    searchHistory: state.searchHistory,
    
    // Computed
    isSearchActive,
    filteredAppointments,
    searchStats,
    
    // Actions
    executeSearch,
    quickSearch,
    updateSearchConfig,
    setQuery,
    setSearchFields,
    toggleCaseSensitive,
    toggleExactMatch,
    toggleHighlightMatches,
    
    // Filters
    addFilter,
    removeFilter,
    clearFilters,
    
    // Sorting & Grouping
    setSorting,
    setGrouping,
    
    // Utilities
    generateSuggestions,
    clearAll
  };
}