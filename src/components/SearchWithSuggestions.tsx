import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  X,
  Clock,
  Star,
  Filter,
  TrendingUp,
  ChevronDown,
  Settings
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  SearchConfig,
  SearchSuggestion,
  FilterField,
  FILTER_FIELD_METADATA
} from '@/types/filtering';
import { StoredAppointment } from '@/services/appointmentService';

interface SearchWithSuggestionsProps {
  onSearch: (config: SearchConfig) => void;
  onClear: () => void;
  appointments: StoredAppointment[];
  placeholder?: string;
  className?: string;
  showAdvancedOptions?: boolean;
}

const SearchWithSuggestions: React.FC<SearchWithSuggestionsProps> = ({
  onSearch,
  onClear,
  appointments,
  placeholder = "Termine durchsuchen...",
  className = "",
  showAdvancedOptions = true
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [searchConfig, setSearchConfig] = useState<SearchConfig>({
    query: '',
    fields: ['title', 'description', 'location'] as FilterField[],
    caseSensitive: false,
    exactMatch: false,
    highlightMatches: true
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bauplan-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to load recent searches:', error);
      }
    }

    const popular = localStorage.getItem('bauplan-popular-searches');
    if (popular) {
      try {
        setPopularSearches(JSON.parse(popular));
      } catch (error) {
        console.warn('Failed to load popular searches:', error);
      }
    }
  }, []);

  // Generate suggestions based on query and appointments
  const generateSuggestions = useCallback((searchQuery: string): SearchSuggestion[] => {
    if (!searchQuery.trim()) {
      return [
        ...recentSearches.map(term => ({
          type: 'recent' as const,
          value: term,
          displayText: term,
          description: 'Kürzlich gesucht'
        })),
        ...popularSearches.map(term => ({
          type: 'popular' as const,
          value: term,
          displayText: term,
          description: 'Beliebte Suche'
        }))
      ];
    }

    const query = searchQuery.toLowerCase();
    const suggestions: SearchSuggestion[] = [];

    // Field suggestions (suggest field names if query matches)
    Object.entries(FILTER_FIELD_METADATA).forEach(([key, metadata]) => {
      if (metadata.label.toLowerCase().includes(query)) {
        suggestions.push({
          type: 'field',
          field: key as FilterField,
          value: `${metadata.label}:`,
          displayText: `Suche in ${metadata.label}`,
          description: metadata.description,
          icon: 'Filter'
        });
      }
    });

    // Value suggestions from existing appointments
    const valueCounts = new Map<string, number>();
    
    appointments.forEach(appointment => {
      searchConfig.fields.forEach(field => {
        const value = getFieldValue(appointment, field);
        if (value && typeof value === 'string') {
          const words = value.toLowerCase().split(/\s+/);
          words.forEach(word => {
            if (word.includes(query) && word.length > 2) {
              valueCounts.set(word, (valueCounts.get(word) || 0) + 1);
            }
          });
        }
      });
    });

    // Sort by frequency and add as value suggestions
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

    // Exact matches from appointments
    appointments.forEach(appointment => {
      const titleMatch = appointment.title.toLowerCase().includes(query);
      const locationMatch = appointment.location?.toLowerCase().includes(query);
      
      if (titleMatch || locationMatch) {
        suggestions.push({
          type: 'value',
          value: titleMatch ? appointment.title : appointment.location || '',
          displayText: titleMatch ? appointment.title : appointment.location || '',
          description: titleMatch ? 'Titel' : 'Ort'
        });
      }
    });

    // Remove duplicates and limit
    const uniqueSuggestions = suggestions.filter((suggestion, index) => 
      suggestions.findIndex(s => s.value === suggestion.value) === index
    );

    return uniqueSuggestions.slice(0, 8);
  }, [searchConfig.fields, appointments, recentSearches, popularSearches]);

  // Get field value from appointment
  const getFieldValue = (appointment: StoredAppointment, field: FilterField): string | undefined => {
    switch (field) {
      case 'title': return appointment.title;
      case 'description': return appointment.description;
      case 'location': return appointment.location;
      case 'type': return appointment.type;
      default: return undefined;
    }
  };

  // Handle input change with debouncing
  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const newSuggestions = generateSuggestions(value);
      setSuggestions(newSuggestions);
      setIsOpen(true);
    }, 300);
  }, [generateSuggestions]);

  // Handle search execution
  const executeSearch = useCallback((searchQuery: string = query) => {
    if (!searchQuery.trim()) {
      onClear();
      return;
    }

    const config: SearchConfig = {
      ...searchConfig,
      query: searchQuery.trim()
    };

    onSearch(config);

    // Save to recent searches
    const updatedRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('bauplan-recent-searches', JSON.stringify(updatedRecent));

    setIsOpen(false);
  }, [query, searchConfig, onSearch, onClear, recentSearches]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    let newQuery = suggestion.value;
    
    // Handle field suggestions
    if (suggestion.type === 'field' && suggestion.field) {
      newQuery = `${FILTER_FIELD_METADATA[suggestion.field].label}:`;
      setQuery(newQuery);
      inputRef.current?.focus();
      setIsOpen(true);
      return;
    }

    setQuery(newQuery);
    executeSearch(newQuery);
  }, [executeSearch]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, [executeSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    onClear();
  }, [onClear]);

  // Update search fields
  const updateSearchFields = useCallback((fields: FilterField[]) => {
    setSearchConfig(prev => ({ ...prev, fields }));
  }, []);

  // Toggle search option
  const toggleSearchOption = useCallback((option: keyof SearchConfig, value: boolean) => {
    setSearchConfig(prev => ({ ...prev, [option]: value }));
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        {/* Main Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={() => {
              const newSuggestions = generateSuggestions(query);
              setSuggestions(newSuggestions);
              setIsOpen(true);
            }}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Search Button */}
        <Button onClick={() => executeSearch()} disabled={!query.trim()}>
          <Search className="h-4 w-4" />
        </Button>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Suchfelder</h4>
                  <div className="space-y-2">
                    {Object.entries(FILTER_FIELD_METADATA)
                      .filter(([, metadata]) => metadata.type === 'text')
                      .map(([key, metadata]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`field-${key}`}
                            checked={searchConfig.fields.includes(key as FilterField)}
                            onChange={(e) => {
                              const field = key as FilterField;
                              if (e.target.checked) {
                                updateSearchFields([...searchConfig.fields, field]);
                              } else {
                                updateSearchFields(searchConfig.fields.filter(f => f !== field));
                              }
                            }}
                            className="rounded"
                          />
                          <Label htmlFor={`field-${key}`} className="text-sm">
                            {metadata.label}
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Suchoptionen</h4>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="case-sensitive" className="text-sm">
                      Groß-/Kleinschreibung beachten
                    </Label>
                    <Switch
                      id="case-sensitive"
                      checked={searchConfig.caseSensitive}
                      onCheckedChange={(checked) => toggleSearchOption('caseSensitive', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="exact-match" className="text-sm">
                      Exakte Übereinstimmung
                    </Label>
                    <Switch
                      id="exact-match"
                      checked={searchConfig.exactMatch}
                      onCheckedChange={(checked) => toggleSearchOption('exactMatch', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="highlight-matches" className="text-sm">
                      Treffer hervorheben
                    </Label>
                    <Switch
                      id="highlight-matches"
                      checked={searchConfig.highlightMatches}
                      onCheckedChange={(checked) => toggleSearchOption('highlightMatches', checked)}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Search Fields Display */}
      {searchConfig.fields.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="text-xs text-gray-500">Suche in:</span>
          {searchConfig.fields.map(field => (
            <Badge key={field} variant="secondary" className="text-xs">
              {FILTER_FIELD_METADATA[field]?.label || field}
            </Badge>
          ))}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.type}-${suggestion.value}-${index}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {suggestion.type === 'recent' && <Clock className="h-4 w-4 text-gray-400" />}
                      {suggestion.type === 'popular' && <TrendingUp className="h-4 w-4 text-blue-500" />}
                      {suggestion.type === 'field' && <Filter className="h-4 w-4 text-green-500" />}
                      {suggestion.type === 'value' && <Search className="h-4 w-4 text-purple-500" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{suggestion.displayText}</div>
                      {suggestion.description && (
                        <div className="text-xs text-gray-500">{suggestion.description}</div>
                      )}
                    </div>
                  </div>
                  {suggestion.count && (
                    <Badge variant="outline" className="text-xs">
                      {suggestion.count}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SearchWithSuggestions;