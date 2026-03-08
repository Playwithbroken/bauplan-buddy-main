import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Save,
  Bookmark,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  Download,
  Upload,
  Filter,
  Plus,
  Clock,
  TrendingUp
} from 'lucide-react';
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

interface FilterPresetManagerProps {
  currentFilters: FilterDefinition[];
  currentSearch?: SearchConfig;
  currentSort?: SortDefinition;
  currentGroup?: GroupDefinition;
  onApplyPreset: (preset: FilterPreset) => void;
  onApplyQuickFilter: (quickFilter: QuickFilter) => void;
  className?: string;
}

const FilterPresetManager: React.FC<FilterPresetManagerProps> = ({
  currentFilters,
  currentSearch,
  currentSort,
  currentGroup,
  onApplyPreset,
  onApplyQuickFilter,
  className = ""
}) => {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>(DEFAULT_QUICK_FILTERS);
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<FilterPreset | null>(null);
  const [presetForm, setPresetForm] = useState<Partial<FilterPreset>>({
    name: '',
    description: '',
    isPublic: false,
    isDefault: false
  });

  // Load presets from localStorage
  useEffect(() => {
    loadPresets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPresets = useCallback(() => {
    try {
      const saved = localStorage.getItem('bauplan-filter-presets');
      if (saved) {
        const parsedPresets = JSON.parse(saved);
        setPresets(parsedPresets);
      }
    } catch (error) {
      console.warn('Failed to load filter presets:', error);
    }
  }, []);

  const savePresets = useCallback((newPresets: FilterPreset[]) => {
    try {
      localStorage.setItem('bauplan-filter-presets', JSON.stringify(newPresets));
      setPresets(newPresets);
    } catch (error) {
      console.warn('Failed to save filter presets:', error);
    }
  }, []);

  // Generate unique ID
  const generateId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9);
  }, []);

  // Create new preset from current filters
  const createPresetFromCurrent = useCallback(() => {
    if (currentFilters.length === 0) {
      return;
    }

    const preset: FilterPreset = {
      id: generateId(),
      name: '',
      description: '',
      isPublic: false,
      isDefault: false,
      filters: currentFilters,
      search: currentSearch,
      sort: currentSort,
      group: currentGroup,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };

    setEditingPreset(preset);
    setPresetForm({
      name: `Filter ${presets.length + 1}`,
      description: '',
      isPublic: false,
      isDefault: false
    });
    setIsPresetDialogOpen(true);
  }, [currentFilters, currentSearch, currentSort, currentGroup, generateId, presets.length]);

  // Save preset
  const savePreset = useCallback(() => {
    if (!editingPreset || !presetForm.name?.trim()) {
      return;
    }

    const finalPreset: FilterPreset = {
      ...editingPreset,
      ...presetForm,
      name: presetForm.name.trim(),
      updatedAt: new Date().toISOString()
    };

    const existingIndex = presets.findIndex(p => p.id === finalPreset.id);
    let newPresets;

    if (existingIndex >= 0) {
      // Update existing preset
      newPresets = [...presets];
      newPresets[existingIndex] = finalPreset;
    } else {
      // Add new preset
      newPresets = [...presets, finalPreset];
    }

    savePresets(newPresets);
    setIsPresetDialogOpen(false);
    setEditingPreset(null);
    setPresetForm({});
  }, [editingPreset, presetForm, presets, savePresets]);

  // Edit preset
  const editPreset = useCallback((preset: FilterPreset) => {
    setEditingPreset(preset);
    setPresetForm({
      name: preset.name,
      description: preset.description,
      isPublic: preset.isPublic,
      isDefault: preset.isDefault
    });
    setIsPresetDialogOpen(true);
  }, []);

  // Delete preset
  const deletePreset = useCallback((presetId: string) => {
    const newPresets = presets.filter(p => p.id !== presetId);
    savePresets(newPresets);
  }, [presets, savePresets]);

  // Duplicate preset
  const duplicatePreset = useCallback((preset: FilterPreset) => {
    const newPreset: FilterPreset = {
      ...preset,
      id: generateId(),
      name: `${preset.name} (Kopie)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };

    const newPresets = [...presets, newPreset];
    savePresets(newPresets);
  }, [presets, generateId, savePresets]);

  // Apply preset
  const applyPreset = useCallback((preset: FilterPreset) => {
    // Update usage count
    const updatedPreset = {
      ...preset,
      usageCount: preset.usageCount + 1,
      lastUsed: new Date().toISOString()
    };

    const newPresets = presets.map(p => p.id === preset.id ? updatedPreset : p);
    savePresets(newPresets);

    onApplyPreset(updatedPreset);
  }, [presets, savePresets, onApplyPreset]);

  // Apply quick filter
  const applyQuickFilter = useCallback((quickFilter: QuickFilter) => {
    onApplyQuickFilter(quickFilter);
  }, [onApplyQuickFilter]);

  // Export presets
  const exportPresets = useCallback(() => {
    const exportData: FilterExport = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      filters: currentFilters,
      presets,
      metadata: {
        totalFilters: currentFilters.length,
        description: 'Bauplan Buddy Filter Export'
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bauplan-filters-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentFilters, presets]);

  // Import presets
  const importPresets = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData: FilterExport = JSON.parse(content);
        
        if (importData.presets) {
          // Assign new IDs to avoid conflicts
          const newPresets = importData.presets.map(preset => ({
            ...preset,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));

          const allPresets = [...presets, ...newPresets];
          savePresets(allPresets);
        }
      } catch (error) {
        console.error('Failed to import presets:', error);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  }, [presets, generateId, savePresets]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Filters */}
      <div>
        <h3 className="text-sm font-medium mb-2">Schnellfilter</h3>
        <div className="flex flex-wrap gap-2">
          {quickFilters
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((quickFilter) => (
              <Button
                key={quickFilter.id}
                variant="outline"
                size="sm"
                onClick={() => applyQuickFilter(quickFilter)}
                className={`text-xs ${quickFilter.color ? `border-${quickFilter.color}-200 text-${quickFilter.color}-700 hover:bg-${quickFilter.color}-50` : ''}`}
              >
                {quickFilter.icon && <span className="mr-1">{quickFilter.icon}</span>}
                {quickFilter.name}
              </Button>
            ))}
        </div>
      </div>

      <Separator />

      {/* Saved Presets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Gespeicherte Filter</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={createPresetFromCurrent}
              disabled={currentFilters.length === 0}
            >
              <Save className="h-3 w-3 mr-1" />
              Speichern
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportPresets}>
                  <Download className="h-3 w-3 mr-2" />
                  Exportieren
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => document.getElementById('import-presets')?.click()}>
                  <Upload className="h-3 w-3 mr-2" />
                  Importieren
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <input
              id="import-presets"
              type="file"
              accept=".json"
              onChange={importPresets}
              className="hidden"
            />
          </div>
        </div>

        {presets.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            Keine gespeicherten Filter vorhanden.
          </div>
        ) : (
          <div className="space-y-2">
            {presets
              .sort((a, b) => {
                if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
                return new Date(b.lastUsed || b.updatedAt).getTime() - new Date(a.lastUsed || a.updatedAt).getTime();
              })
              .map((preset) => (
                <Card key={preset.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{preset.name}</h4>
                        {preset.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            <Star className="h-2 w-2 mr-1" />
                            Standard
                          </Badge>
                        )}
                        {preset.isPublic && (
                          <Badge variant="outline" className="text-xs">
                            Öffentlich
                          </Badge>
                        )}
                      </div>
                      {preset.description && (
                        <p className="text-xs text-gray-600 mt-1">{preset.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{preset.filters.length} Filter</span>
                        {preset.usageCount > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {preset.usageCount}x verwendet
                          </span>
                        )}
                        {preset.lastUsed && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(preset.lastUsed).toLocaleDateString('de-DE')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => applyPreset(preset)}
                        className="text-xs"
                      >
                        Anwenden
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => editPreset(preset)}>
                            <Edit className="h-3 w-3 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicatePreset(preset)}>
                            <Copy className="h-3 w-3 mr-2" />
                            Duplizieren
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => deletePreset(preset.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Preset Save/Edit Dialog */}
      <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
        <DialogFrame
          width="max-w-4xl"
          title={<span>{editingPreset?.id && presets.find(p => p.id === editingPreset.id) ? 'Filter bearbeiten' : 'Filter speichern'}</span>}
          description={<DialogDescription>Speichern Sie Ihre aktuelle Filterkonfiguration für die spätere Verwendung.</DialogDescription>}
          footer={<>
            <Button variant="outline" onClick={() => setIsPresetDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={savePreset}
              disabled={!presetForm.name?.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </>}
        >
            <div className="space-y-2">
              <Label htmlFor="preset-name">Name *</Label>
              <Input
                id="preset-name"
                placeholder="z.B. Hochpriorisierte Termine diese Woche"
                value={presetForm.name || ''}
                onChange={(e) => setPresetForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preset-description">Beschreibung</Label>
              <Textarea
                id="preset-description"
                placeholder="Beschreibung des Filters (optional)"
                value={presetForm.description || ''}
                onChange={(e) => setPresetForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="preset-public">Öffentlich teilen</Label>
                <Switch
                  id="preset-public"
                  checked={presetForm.isPublic || false}
                  onCheckedChange={(checked) => setPresetForm(prev => ({ ...prev, isPublic: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="preset-default">Als Standard setzen</Label>
                <Switch
                  id="preset-default"
                  checked={presetForm.isDefault || false}
                  onCheckedChange={(checked) => setPresetForm(prev => ({ ...prev, isDefault: checked }))}
                />
              </div>
            </div>

            {/* Preview */}
            {editingPreset && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Vorschau</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>{editingPreset.filters.length} Filter-Bedingungen</div>
                  {editingPreset.search?.query && (
                    <div>Suchbegriff: "{editingPreset.search.query}"</div>
                  )}
                  {editingPreset.sort && (
                    <div>Sortierung: {editingPreset.sort.field} ({editingPreset.sort.direction})</div>
                  )}
                </div>
              </div>
            )}
        </DialogFrame>
      </Dialog>
    </div>
  );
};

export default FilterPresetManager;
