import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Filter,
  Search,
  Settings,
  X,
  ChevronDown,
  SlidersHorizontal,
  Bookmark,
  RotateCcw
} from 'lucide-react';
import SearchWithSuggestions from './SearchWithSuggestions';
import AdvancedFilterDialog from './AdvancedFilterDialog';
import FilterPresetManager from './FilterPresetManager';
import { useSearch } from '@/hooks/useSearch';
import { useFilterPresets } from '@/hooks/useFilterPresets';
import {
  FilterDefinition,
  FilterPreset,
  QuickFilter,
  SearchConfig,
  SortDefinition,
  GroupDefinition
} from '@/types/filtering';
import { StoredAppointment } from '@/services/appointmentService';

interface CalendarFilterBarProps {
  appointments: StoredAppointment[];
  onFilteredAppointmentsChange: (appointments: StoredAppointment[]) => void;
  onStatsChange?: (stats: { total: number; filtered: number; hasFilters: boolean }) => void;
  className?: string;
}

const CalendarFilterBar: React.FC<CalendarFilterBarProps> = ({
  appointments,
  onFilteredAppointmentsChange,
  onStatsChange,
  className = ""
}) => {
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Initialize search and filter hooks
  const search = useSearch(appointments, {
    initialFields: ['title', 'description', 'location'],
    enableHistory: true
  });

  const presets = useFilterPresets({
    enableQuickFilters: true,
    enableAutoSave: true
  });

  // Handle search execution
  const handleSearch = useCallback((config: SearchConfig) => {
    search.quickSearch(config.query);
  }, [search]);

  // Handle filter clearing
  const handleClearSearch = useCallback(() => {
    search.clearAll();
  }, [search]);

  // Handle advanced filter save
  const handleSaveAdvancedFilter = useCallback(async (filter: FilterDefinition) => {
    search.addFilter(filter);
    await search.executeSearch();
    setShowAdvancedFilter(false);
  }, [search]);

  // Handle preset application
  const handleApplyPreset = useCallback(async (preset: FilterPreset) => {
    // Clear current filters
    search.clearFilters();
    
    // Apply preset filters
    preset.filters.forEach(filter => {
      search.addFilter(filter);
    });
    
    // Apply preset search if available
    if (preset.search) {
      search.updateSearchConfig(preset.search);
    }
    
    // Apply sorting and grouping
    if (preset.sort) {
      search.setSorting(preset.sort);
    }
    
    if (preset.group) {
      search.setGrouping(preset.group);
    }
    
    // Execute the search with all preset configurations
    await search.executeSearch();
    
    // Mark preset as used
    await presets.applyPreset(preset.id);
    
    setShowFilterPanel(false);
  }, [search, presets]);

  // Handle quick filter application
  const handleApplyQuickFilter = useCallback(async (quickFilter: QuickFilter) => {
    // Clear current filters and apply quick filter
    search.clearFilters();
    search.addFilter(quickFilter.filter);
    await search.executeSearch();
  }, [search]);

  // Update filtered appointments when search results change
  React.useEffect(() => {
    const filtered = search.filteredAppointments;
    onFilteredAppointmentsChange(filtered);
    
    if (onStatsChange) {
      onStatsChange({
        total: appointments.length,
        filtered: filtered.length,
        hasFilters: search.isSearchActive
      });
    }
  }, [search.filteredAppointments, search.isSearchActive, appointments.length, onFilteredAppointmentsChange, onStatsChange]);

  // Remove individual filter
  const removeFilter = useCallback(async (filterId: string) => {
    search.removeFilter(filterId);
    await search.executeSearch();
  }, [search]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchWithSuggestions
            onSearch={handleSearch}
            onClear={handleClearSearch}
            appointments={appointments}
            placeholder="Termine durchsuchen..."
          />
        </div>

        {/* Advanced Filter Button */}
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilter(true)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Erweitert
        </Button>

        {/* Filter Presets Button */}
        <Popover open={showFilterPanel} onOpenChange={setShowFilterPanel}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Filter
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <FilterPresetManager
              currentFilters={search.activeFilters}
              currentSearch={search.searchConfig.query ? search.searchConfig : undefined}
              currentSort={search.sortBy}
              currentGroup={search.groupBy}
              onApplyPreset={handleApplyPreset}
              onApplyQuickFilter={handleApplyQuickFilter}
            />
          </PopoverContent>
        </Popover>

        {/* Clear All Button */}
        {search.isSearchActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={search.clearAll}
            className="flex items-center gap-2 text-gray-600"
          >
            <RotateCcw className="h-3 w-3" />
            Zurücksetzen
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(search.activeFilters.length > 0 || search.searchConfig.query) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-blue-800">Aktive Filter:</span>
              
              {/* Search Query Badge */}
              {search.searchConfig.query && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                  <Search className="h-3 w-3 mr-1" />
                  "{search.searchConfig.query}"
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => search.setQuery('')}
                    className="ml-1 h-3 w-3 p-0 hover:bg-blue-200"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              
              {/* Filter Badges */}
              {search.activeFilters.map((filter) => (
                <Badge
                  key={filter.id}
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 border-blue-300"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  {filter.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(filter.id)}
                    className="ml-1 h-3 w-3 p-0 hover:bg-blue-200"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}
              
              {/* Sort Badge */}
              {search.sortBy && (
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  Sortiert: {search.sortBy.field} ({search.sortBy.direction === 'asc' ? '↑' : '↓'})
                </Badge>
              )}
              
              {/* Group Badge */}
              {search.groupBy && (
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  Gruppiert: {search.groupBy.field}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Statistics */}
      {search.isSearchActive && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {search.searchStats.filteredCount} von {search.searchStats.totalCount} Terminen
            {search.searchStats.executionTime && (
              <span className="ml-2 text-xs">
                ({Math.round(search.searchStats.executionTime)}ms)
              </span>
            )}
          </span>
          
          {search.error && (
            <span className="text-red-600 text-xs">
              Fehler: {search.error}
            </span>
          )}
        </div>
      )}

      {/* Advanced Filter Dialog */}
      <AdvancedFilterDialog
        isOpen={showAdvancedFilter}
        onClose={() => setShowAdvancedFilter(false)}
        onSave={handleSaveAdvancedFilter}
        title="Erweiterten Filter erstellen"
      />
    </div>
  );
};

export default CalendarFilterBar;