import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Filter,
  Search,
  Building,
  Calendar,
  Users,
  X,
  ChevronDown,
  SlidersHorizontal,
  Bookmark,
  RotateCcw,
  Target
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
  DEFAULT_QUICK_FILTERS
} from '@/types/filtering';
import { StoredAppointment } from '@/services/appointmentService';

interface ProjectFilterBarProps {
  appointments: StoredAppointment[];
  projects: Array<{ id: string; name: string; customer: string; status: string }>;
  selectedProject?: string;
  onProjectChange?: (projectId: string) => void;
  onFilteredAppointmentsChange: (appointments: StoredAppointment[]) => void;
  onStatsChange?: (stats: { total: number; filtered: number; hasFilters: boolean }) => void;
  className?: string;
}

// Project-specific quick filters
const PROJECT_QUICK_FILTERS: QuickFilter[] = [
  ...DEFAULT_QUICK_FILTERS,
  {
    id: 'project-active',
    name: 'Aktive Projekte',
    description: 'Termine von aktiven Projekten',
    icon: 'Building',
    color: 'blue',
    sortOrder: 6,
    filter: {
      id: 'project-active-filter',
      name: 'Aktive Projekte',
      group: {
        id: 'project-active-group',
        operator: 'AND',
        conditions: [{
          id: 'project-active-condition',
          field: 'projectId',
          operator: 'not_equals',
          value: 'no-project'
        }],
        groups: []
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  {
    id: 'project-milestones',
    name: 'Meilensteine',
    description: 'Alle Projekt-Meilensteine',
    icon: 'Target',
    color: 'purple',
    sortOrder: 7,
    filter: {
      id: 'project-milestones-filter',
      name: 'Meilensteine',
      group: {
        id: 'project-milestones-group',
        operator: 'AND',
        conditions: [{
          id: 'project-milestones-condition',
          field: 'type',
          operator: 'equals',
          value: 'milestone'
        }],
        groups: []
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  {
    id: 'project-team-meetings',
    name: 'Team-Besprechungen',
    description: 'Alle Team-Besprechungen',
    icon: 'Users',
    color: 'green',
    sortOrder: 8,
    filter: {
      id: 'project-team-meetings-filter',
      name: 'Team-Besprechungen',
      group: {
        id: 'project-team-meetings-group',
        operator: 'AND',
        conditions: [{
          id: 'project-team-meetings-condition',
          field: 'type',
          operator: 'equals',
          value: 'meeting'
        }],
        groups: []
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
];

const ProjectFilterBar: React.FC<ProjectFilterBarProps> = ({
  appointments,
  projects,
  selectedProject,
  onProjectChange,
  onFilteredAppointmentsChange,
  onStatsChange,
  className = ""
}) => {
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Initialize search and filter hooks with project-specific configuration
  const search = useSearch(appointments, {
    initialFields: ['title', 'description', 'location', 'type'],
    enableHistory: true
  });

  const presets = useFilterPresets({
    enableQuickFilters: true,
    enableAutoSave: true
  });

  // Filter appointments by selected project
  const projectFilteredAppointments = React.useMemo(() => {
    if (!selectedProject || selectedProject === 'all') {
      return appointments;
    }
    return appointments.filter(appointment => appointment.projectId === selectedProject);
  }, [appointments, selectedProject]);

  // Update search hook when project-filtered appointments change
  const { isSearchActive, executeSearch } = search;
  React.useEffect(() => {
    // Force re-execution of search with new appointment set
    if (isSearchActive) {
      executeSearch();
    }
  }, [projectFilteredAppointments, isSearchActive, executeSearch]);

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
        total: projectFilteredAppointments.length,
        filtered: filtered.length,
        hasFilters: search.isSearchActive || (selectedProject && selectedProject !== 'all')
      });
    }
  }, [search.filteredAppointments, search.isSearchActive, projectFilteredAppointments.length, selectedProject, onFilteredAppointmentsChange, onStatsChange]);

  // Remove individual filter
  const removeFilter = useCallback(async (filterId: string) => {
    search.removeFilter(filterId);
    await search.executeSearch();
  }, [search]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Project Selection and Search Bar */}
      <div className="flex items-center gap-2">
        {/* Project Selection */}
        <div className="min-w-[200px]">
          <Select value={selectedProject || 'all'} onValueChange={onProjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Projekt auswählen">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {selectedProject && selectedProject !== 'all' 
                    ? projects.find(p => p.id === selectedProject)?.name || 'Unbekanntes Projekt'
                    : 'Alle Projekte'
                  }
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Alle Projekte
                </div>
              </SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{project.name}</span>
                    <span className="text-xs text-gray-500">{project.customer}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Bar */}
        <div className="flex-1">
          <SearchWithSuggestions
            onSearch={handleSearch}
            onClear={handleClearSearch}
            appointments={projectFilteredAppointments}
            placeholder="Projekt-Termine durchsuchen..."
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
            
            {/* Project-specific quick filters */}
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Projekt-Filter</h4>
              <div className="flex flex-wrap gap-2">
                {PROJECT_QUICK_FILTERS.map((quickFilter) => (
                  <Button
                    key={quickFilter.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyQuickFilter(quickFilter)}
                    className={`text-xs ${quickFilter.color ? `border-${quickFilter.color}-200 text-${quickFilter.color}-700 hover:bg-${quickFilter.color}-50` : ''}`}
                  >
                    {quickFilter.icon && <span className="mr-1">{quickFilter.icon}</span>}
                    {quickFilter.name}
                  </Button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear All Button */}
        {(search.isSearchActive || (selectedProject && selectedProject !== 'all')) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              search.clearAll();
              if (onProjectChange) onProjectChange('all');
            }}
            className="flex items-center gap-2 text-gray-600"
          >
            <RotateCcw className="h-3 w-3" />
            Zurücksetzen
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(search.activeFilters.length > 0 || search.searchConfig.query || (selectedProject && selectedProject !== 'all')) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-blue-800">Aktive Filter:</span>
              
              {/* Project Filter Badge */}
              {selectedProject && selectedProject !== 'all' && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                  <Building className="h-3 w-3 mr-1" />
                  {projects.find(p => p.id === selectedProject)?.name || 'Projekt'}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onProjectChange && onProjectChange('all')}
                    className="ml-1 h-3 w-3 p-0 hover:bg-blue-200"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Statistics */}
      {(search.isSearchActive || (selectedProject && selectedProject !== 'all')) && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {search.searchStats.filteredCount} von {search.searchStats.totalCount} Terminen
            {selectedProject && selectedProject !== 'all' && (
              <span className="ml-2">
                (aus {projects.find(p => p.id === selectedProject)?.name})
              </span>
            )}
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
        title="Erweiterten Projekt-Filter erstellen"
      />
    </div>
  );
};

export default ProjectFilterBar;
