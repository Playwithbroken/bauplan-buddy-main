import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearch } from '../useSearch';
import { StoredAppointment } from '../../services/appointmentService';
import { FilterService } from '../../services/filterService';
import { FilterDefinition, FilterResult } from '../../types/filtering';

// Extend Jest matchers to include jest-dom
import '@testing-library/jest-dom';

// Mock FilterService
// jest.mock removed; using jest.spyOn(FilterService, 'executeAdvancedSearch') instead

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

describe('useSearch Hook', () => {
  const mockFilterService = FilterService;

  const mockAppointments: StoredAppointment[] = [
    {
      id: 'APT-001',
      title: 'Site Visit Meeting',
      description: 'Monthly site inspection with client',
      type: 'site-visit',
      date: '2024-03-15',
      startTime: '10:00',
      endTime: '11:00',
      location: 'Construction Site A, München',
      projectId: 'PRJ-001',
      attendees: ['client@example.com'],
      teamMembers: ['TM-001'],
      equipment: ['EQ-001'],
      priority: 'high',
      customerNotification: true,
      reminderTime: '30',
      emailNotifications: {
        enabled: true,
        sendInvitations: true,
        sendReminders: true,
        recipients: [{ email: 'client@example.com', type: 'to' }],
        customMessage: 'Important site visit'
      },
      createdAt: '2024-03-01T10:00:00.000Z',
      updatedAt: '2024-03-01T10:00:00.000Z'
    },
    {
      id: 'APT-002',
      title: 'Team Meeting',
      description: 'Weekly team standup meeting',
      type: 'meeting',
      date: '2024-03-16',
      startTime: '09:00',
      endTime: '10:00',
      location: 'Office Conference Room',
      projectId: 'PRJ-002',
      attendees: ['team@example.com'],
      teamMembers: ['TM-001', 'TM-002'],
      equipment: [],
      priority: 'medium',
      customerNotification: false,
      reminderTime: '15',
      emailNotifications: {
        enabled: false,
        sendInvitations: false,
        sendReminders: false,
        recipients: [],
        customMessage: ''
      },
      createdAt: '2024-03-01T11:00:00.000Z',
      updatedAt: '2024-03-01T11:00:00.000Z'
    },
    {
      id: 'APT-003',
      title: 'Material Delivery',
      description: 'Concrete delivery for foundation',
      type: 'delivery',
      date: '2024-03-17',
      startTime: '08:00',
      endTime: '12:00',
      location: 'Construction Site A, München',
      projectId: 'PRJ-001',
      attendees: ['supplier@example.com'],
      teamMembers: ['TM-003'],
      equipment: ['EQ-002', 'EQ-003'],
      priority: 'high',
      customerNotification: true,
      reminderTime: '60',
      emailNotifications: {
        enabled: true,
        sendInvitations: true,
        sendReminders: true,
        recipients: [{ email: 'supplier@example.com', type: 'to' }],
        customMessage: 'Material delivery scheduled'
      },
      createdAt: '2024-03-01T12:00:00.000Z',
      updatedAt: '2024-03-01T12:00:00.000Z'
    }
  ];

  const mockFilterResult: FilterResult = {
    appointments: mockAppointments.slice(0, 2),
    totalCount: mockAppointments.length,
    filteredCount: 2,
    metadata: {
      appliedFilters: [],
      executionTime: 15
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    jest.spyOn(FilterService, 'executeAdvancedSearch').mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return mockFilterResult;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      expect(result.current.isSearching).toBe(false);
      expect(result.current.searchConfig.query).toBe('');
      expect(result.current.searchConfig.fields).toEqual(['title', 'description', 'location']);
      expect(result.current.searchConfig.caseSensitive).toBe(false);
      expect(result.current.searchConfig.exactMatch).toBe(false);
      expect(result.current.searchConfig.highlightMatches).toBe(true);
      expect(result.current.activeFilters).toEqual([]);
      expect(result.current.searchHistory).toEqual([]);
    });

    it('should initialize with custom options', () => {
      const options = {
        initialFields: ['title', 'type'] as unknown as FilterDefinition['group']['conditions'][0]['field'][],
        enableHistory: false,
        maxHistoryItems: 5
      };

      const { result } = renderHook(() => useSearch(mockAppointments, options));

      expect(result.current.searchConfig.fields).toEqual(['title', 'type']);
      expect(result.current.searchHistory).toEqual([]);
    });

    it('should load search history from localStorage', () => {
      const savedHistory = ['previous search', 'another search'];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedHistory));

      const { result } = renderHook(() => useSearch(mockAppointments));

      expect(result.current.searchHistory).toEqual(savedHistory);
    });

    it('should handle corrupted localStorage history gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const { result } = renderHook(() => useSearch(mockAppointments));

      expect(result.current.searchHistory).toEqual([]);
    });
  });

  describe('Search Execution', () => {
    it('should execute search with current configuration', async () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      await act(async () => {
        await result.current.executeSearch();
      });

      expect(mockFilterService.executeAdvancedSearch).toHaveBeenCalledWith(
        mockAppointments,
        expect.objectContaining({
          search: result.current.searchConfig,
          filters: [],
          sortBy: undefined,
          groupBy: undefined
        })
      );

      expect(result.current.results).toEqual(mockFilterResult);
      expect(result.current.isSearching).toBe(false);
    });

    it('should execute search with custom configuration', async () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      const customConfig = {
        query: 'site visit',
        fields: ['title'] as unknown as FilterDefinition['group']['conditions'][0]['field'][] ,
        caseSensitive: true,
        exactMatch: false,
        highlightMatches: true
      };

      await act(async () => {
        await result.current.executeSearch(customConfig);
      });

      expect(mockFilterService.executeAdvancedSearch).toHaveBeenCalledWith(
        mockAppointments,
        expect.objectContaining({
          search: customConfig
        })
      );

      expect(result.current.searchConfig).toEqual(customConfig);
    });

    it('should show loading state during search', async () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      await act(async () => {
        const p = result.current.executeSearch();
        expect(result.current.isSearching).toBe(true);
        await p;
      });

      expect(result.current.isSearching).toBe(false);
    });

    it('should handle search errors', async () => {
      const { result } = renderHook(() => useSearch(mockAppointments));
      const error = new Error('Search failed');
      jest.spyOn(FilterService, 'executeAdvancedSearch').mockRejectedValue(error);

      await expect(result.current.executeSearch()).rejects.toThrow('Search failed');

      expect(result.current.isSearching).toBe(false);
      expect(result.current.error).toBe('Search failed');
    });
  });

  describe('Search Configuration', () => {
    it('should update search configuration', () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      act(() => {
        result.current.updateSearchConfig({
          query: 'meeting',
          caseSensitive: true
        });
      });

      expect(result.current.searchConfig.query).toBe('meeting');
      expect(result.current.searchConfig.caseSensitive).toBe(true);
      expect(result.current.searchConfig.fields).toEqual(['title', 'description', 'location']);
    });

    it('should set search query', () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      act(() => {
        result.current.setQuery('new search term');
      });

      expect(result.current.searchConfig.query).toBe('new search term');
    });

    it('should set search fields', () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      act(() => {
        result.current.setSearchFields(['title', 'type']);
      });

      expect(result.current.searchConfig.fields).toEqual(['title', 'type']);
    });

    it('should toggle case sensitivity', () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      expect(result.current.searchConfig.caseSensitive).toBe(false);

      act(() => {
        result.current.toggleCaseSensitive();
      });

      expect(result.current.searchConfig.caseSensitive).toBe(true);

      act(() => {
        result.current.toggleCaseSensitive();
      });

      expect(result.current.searchConfig.caseSensitive).toBe(false);
    });

    it('should toggle exact match', () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      expect(result.current.searchConfig.exactMatch).toBe(false);

      act(() => {
        result.current.toggleExactMatch();
      });

      expect(result.current.searchConfig.exactMatch).toBe(true);
    });

    it('should toggle highlight matches', () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      expect(result.current.searchConfig.highlightMatches).toBe(true);

      act(() => {
        result.current.toggleHighlightMatches();
      });

      expect(result.current.searchConfig.highlightMatches).toBe(false);
    });
  });

  describe('Filter Management', () => {
    it('should add filter to search', () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      const filter: FilterDefinition = {
        id: 'filter-1',
        name: 'Type equals Meeting',
        group: {
          id: 'group-1',
          operator: 'AND',
          conditions: [
            { id: 'cond-1', field: 'type', operator: 'equals', value: 'meeting' }
          ],
          groups: []
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      act(() => {
        result.current.addFilter(filter);
      });

      expect(result.current.activeFilters).toContain(filter);
    });

    it('should remove filter from search', () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      const filter: FilterDefinition = {
        id: 'filter-1',
        name: 'Type equals Meeting',
        group: {
          id: 'group-1',
          operator: 'AND',
          conditions: [
            { id: 'cond-1', field: 'type', operator: 'equals', value: 'meeting' }
          ],
          groups: []
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      act(() => {
        result.current.addFilter(filter);
      });

      expect(result.current.activeFilters).toContain(filter);

      act(() => {
        result.current.removeFilter('filter-1');
      });

      expect(result.current.activeFilters).not.toContain(filter);
    });

    it('should clear all filters', () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      const filters: FilterDefinition[] = [
        {
          id: 'filter-1',
          name: 'Type equals Meeting',
          group: {
            id: 'group-1',
            operator: 'AND',
            conditions: [
              { id: 'cond-1', field: 'type', operator: 'equals', value: 'meeting' }
            ],
            groups: []
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'filter-2',
          name: 'Priority equals High',
          group: {
            id: 'group-2',
            operator: 'AND',
            conditions: [
              { id: 'cond-2', field: 'priority', operator: 'equals', value: 'high' }
            ],
            groups: []
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      act(() => {
        filters.forEach(filter => result.current.addFilter(filter));
      });

      expect(result.current.activeFilters).toHaveLength(2);

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.activeFilters).toHaveLength(0);
    });
  });

  describe('Sorting and Grouping', () => {
    it('should set sorting configuration', () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      const sortBy = {
        field: 'date' as const,
        direction: 'asc' as const
      };

      act(() => {
        result.current.setSorting(sortBy);
      });

      expect(result.current.sortBy).toEqual(sortBy);
    });

    it('should clear sorting configuration', () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      const sortBy = {
        field: 'date' as const,
        direction: 'asc' as const
      };

      act(() => {
        result.current.setSorting(sortBy);
      });

      expect(result.current.sortBy).toEqual(sortBy);

      act(() => {
        result.current.setSorting(undefined);
      });

      expect(result.current.sortBy).toBeUndefined();
    });

    it('should set grouping configuration', () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      const groupBy = {
        field: 'type' as const,
        sortGroups: 'asc' as const
      };

      act(() => {
        result.current.setGrouping(groupBy);
      });

      expect(result.current.groupBy).toEqual(groupBy);
    });

    it('should clear grouping configuration', () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      const groupBy = {
        field: 'type' as const,
        sortGroups: 'asc' as const
      };

      act(() => {
        result.current.setGrouping(groupBy);
      });

      expect(result.current.groupBy).toEqual(groupBy);

      act(() => {
        result.current.setGrouping(undefined);
      });

      expect(result.current.groupBy).toBeUndefined();
    });
  });

  describe('Search History', () => {
    it('should update search history on successful search', async () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      act(() => {
        result.current.setQuery('site visit');
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      expect(result.current.searchHistory).toContain('site visit');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bauplan-search-history',
        JSON.stringify(['site visit'])
      );
    });

    it('should maintain history order and remove duplicates', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['old search']));
      const { result } = renderHook(() => useSearch(mockAppointments));

      // Search for something new
      act(() => {
        result.current.setQuery('new search');
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      // Search for the old term again
      act(() => {
        result.current.setQuery('old search');
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      expect(result.current.searchHistory).toEqual(['old search', 'new search']);
    });

    it('should limit history to maxHistoryItems', async () => {
      const { result } = renderHook(() => useSearch(mockAppointments, { maxHistoryItems: 2 }));

      const searches = ['search 1', 'search 2', 'search 3'];

      for (const search of searches) {
        act(() => {
          result.current.setQuery(search);
        });

        await act(async () => {
          await result.current.executeSearch();
        });
      }

      expect(result.current.searchHistory).toHaveLength(2);
      expect(result.current.searchHistory).toEqual(['search 3', 'search 2']);
    });

    it('should not save empty search queries to history', async () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      act(() => {
        result.current.setQuery('   '); // Whitespace only
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      expect(result.current.searchHistory).toHaveLength(0);
    });

    it('should handle history when disabled', async () => {
      const { result } = renderHook(() => useSearch(mockAppointments, { enableHistory: false }));

      act(() => {
        result.current.setQuery('test search');
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      expect(result.current.searchHistory).toHaveLength(0);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Clear Operations', () => {
    it('should clear search and filters', () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      // Setup some state
      act(() => {
        result.current.setQuery('test search');
        result.current.addFilter({
          id: 'filter-1',
          name: 'Type equals Meeting',
          group: {
            id: 'group-1',
            operator: 'AND',
            conditions: [
              { id: 'cond-1', field: 'type', operator: 'equals', value: 'meeting' }
            ],
            groups: []
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        result.current.setSorting({
          field: 'date',
          direction: 'asc'
        });
      });

      expect(result.current.searchConfig.query).toBe('test search');
      expect(result.current.activeFilters).toHaveLength(1);
      expect(result.current.sortBy).toBeDefined();

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.searchConfig.query).toBe('');
      expect(result.current.activeFilters).toHaveLength(0);
      expect(result.current.sortBy).toBeUndefined();
      expect(result.current.groupBy).toBeUndefined();
      expect(result.current.results).toBeUndefined();
    });
  });

  describe('Integration with Advanced Search', () => {
    it('should pass complete search configuration to FilterService', async () => {
      const { result } = renderHook(() => useSearch(mockAppointments));

      const filter: FilterDefinition = {
        id: 'filter-1',
        name: 'Type equals Meeting',
        group: {
          id: 'group-1',
          operator: 'AND',
          conditions: [
            { id: 'cond-1', field: 'type', operator: 'equals', value: 'meeting' }
          ],
          groups: []
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const sortBy = {
        field: 'date' as const,
        direction: 'desc' as const
      };

      const groupBy = {
        field: 'priority' as const,
        sortGroups: 'asc' as const
      };

      act(() => {
        result.current.setQuery('team meeting');
        result.current.addFilter(filter);
        result.current.setSorting(sortBy);
        result.current.setGrouping(groupBy);
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      expect(mockFilterService.executeAdvancedSearch).toHaveBeenCalledWith(
        mockAppointments,
        {
          search: expect.objectContaining({
            query: 'team meeting'
          }),
          filters: [filter],
          sortBy,
          groupBy
        }
      );
    });
  });

  describe('Error Recovery', () => {
    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const consoleWarn = console.warn;
      console.warn = jest.fn();

      const { result } = renderHook(() => useSearch(mockAppointments));

      act(() => {
        result.current.setQuery('test search');
      });

      await act(async () => {
        await result.current.executeSearch();
      });

      expect(console.warn).toHaveBeenCalledWith('Failed to save search history:', expect.any(Error));

      console.warn = consoleWarn;
    });
  });
});