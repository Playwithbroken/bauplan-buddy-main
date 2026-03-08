import { StoredAppointment } from '../services/appointmentService';

// Basic filter operators
export type FilterOperator = 
  | 'equals' 
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_equal'
  | 'less_than_equal'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty'
  | 'date_equals'
  | 'date_before'
  | 'date_after'
  | 'date_between'
  | 'date_in_last'
  | 'date_in_next';

// Field types for different data types
export type FilterFieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'time'
  | 'select'
  | 'multi_select'
  | 'boolean'
  | 'priority'
  | 'status';

// Available filter fields
export type FilterField = 
  | 'title'
  | 'description'
  | 'type'
  | 'priority'
  | 'projectId'
  | 'date'
  | 'startTime'
  | 'endTime'
  | 'location'
  | 'attendees'
  | 'teamMembers'
  | 'equipment'
  | 'customerNotification'
  | 'reminderTime'
  | 'isRecurring'
  | 'createdAt'
  | 'updatedAt';

// Individual filter condition
export interface FilterCondition {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string | number | boolean | string[] | Date | null | undefined;
  displayValue?: string; // For UI display
}

// Logical operators for combining conditions
export type LogicalOperator = 'AND' | 'OR';

// Filter group - can contain conditions or other groups
export interface FilterGroup {
  id: string;
  operator: LogicalOperator;
  conditions: FilterCondition[];
  groups: FilterGroup[];
}

// Complete filter definition
export interface FilterDefinition {
  id: string;
  name: string;
  description?: string;
  group: FilterGroup;
  isActive: boolean;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Quick filter for common use cases
export interface QuickFilter {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  filter: FilterDefinition;
  isDefault?: boolean;
  sortOrder: number;
}

// Search configuration
export interface SearchConfig {
  query: string;
  fields: FilterField[];
  caseSensitive: boolean;
  exactMatch: boolean;
  highlightMatches: boolean;
}

// Advanced search with filters
export interface AdvancedSearch {
  search: SearchConfig;
  filters: FilterDefinition[];
  sortBy?: SortDefinition;
  groupBy?: GroupDefinition;
}

// Sort definition
export interface SortDefinition {
  field: FilterField;
  direction: 'asc' | 'desc';
  secondary?: {
    field: FilterField;
    direction: 'asc' | 'desc';
  };
}

// Group definition for organizing results
export interface GroupDefinition {
  field: FilterField;
  sortGroups: 'asc' | 'desc';
  sortWithinGroups?: SortDefinition;
}

// Filter result with metadata
export interface FilterResult {
  appointments: StoredAppointment[];
  totalCount: number;
  filteredCount: number;
  metadata: {
    searchQuery?: string;
    appliedFilters: FilterDefinition[];
    executionTime: number;
    groupedBy?: string;
    sortedBy?: string;
  };
}

// Filter preset for saving common filters
export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isDefault: boolean;
  userId?: string;
  filters: FilterDefinition[];
  search?: SearchConfig;
  sort?: SortDefinition;
  group?: GroupDefinition;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  lastUsed?: string;
}

// Suggestion for search autocomplete
export interface SearchSuggestion {
  type: 'field' | 'value' | 'recent' | 'popular';
  field?: FilterField;
  value: string;
  displayText: string;
  description?: string;
  count?: number;
  icon?: string;
}

// Filter field metadata for UI generation
export interface FilterFieldMetadata {
  field: FilterField;
  label: string;
  type: FilterFieldType;
  description?: string;
  operators: FilterOperator[];
  options?: Array<{ value: string | number | boolean; label: string; description?: string }>;
  validation?: {
    required?: boolean;
    min?: string | number;
    max?: string | number;
    pattern?: string;
  };
  placeholder?: string;
  helpText?: string;
}

// Filter statistics for analytics
export interface FilterStatistics {
  totalFilters: number;
  activeFilters: number;
  mostUsedFilters: Array<{
    filterId: string;
    name: string;
    usageCount: number;
  }>;
  popularFields: Array<{
    field: FilterField;
    usageCount: number;
  }>;
  averageConditionsPerFilter: number;
  performanceMetrics: {
    averageExecutionTime: number;
    slowestFilters: Array<{
      filterId: string;
      name: string;
      executionTime: number;
    }>;
  };
}

// Filter validation result
export interface FilterValidationResult {
  isValid: boolean;
  errors: Array<{
    conditionId?: string;
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: string[];
}

// Filter export/import formats
export interface FilterExport {
  version: string;
  exportedAt: string;
  filters: FilterDefinition[];
  presets: FilterPreset[];
  metadata: {
    totalFilters: number;
    exportedBy?: string;
    description?: string;
  };
}

// Real-time filter update
export interface FilterUpdateEvent {
  type: 'condition_added' | 'condition_removed' | 'condition_updated' | 'group_added' | 'group_removed' | 'operator_changed';
  filterId: string;
  conditionId?: string;
  groupId?: string;
  previousValue?: string | number | boolean | string[] | Date | null | undefined;
  newValue?: string | number | boolean | string[] | Date | null | undefined;
  timestamp: string;
}

// Filter performance tracking
export interface FilterPerformance {
  filterId: string;
  executionTime: number;
  resultCount: number;
  complexity: number;
  cacheHit: boolean;
  timestamp: string;
}

// Constants for filter configuration
export const FILTER_OPERATORS_BY_TYPE: Record<FilterFieldType, FilterOperator[]> = {
  text: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
  number: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_equal', 'less_than_equal', 'between'],
  date: ['date_equals', 'date_before', 'date_after', 'date_between', 'date_in_last', 'date_in_next'],
  time: ['equals', 'not_equals', 'greater_than', 'less_than', 'between'],
  select: ['equals', 'not_equals', 'in', 'not_in'],
  multi_select: ['contains', 'not_contains', 'in', 'not_in', 'is_empty', 'is_not_empty'],
  boolean: ['equals', 'not_equals'],
  priority: ['equals', 'not_equals', 'in', 'not_in', 'greater_than', 'less_than'],
  status: ['equals', 'not_equals', 'in', 'not_in']
};

export const FILTER_FIELD_METADATA: Record<FilterField, FilterFieldMetadata> = {
  title: {
    field: 'title',
    label: 'Titel',
    type: 'text',
    description: 'Titel des Termins',
    operators: FILTER_OPERATORS_BY_TYPE.text,
    placeholder: 'z.B. Baustellenbesichtigung'
  },
  description: {
    field: 'description',
    label: 'Beschreibung',
    type: 'text',
    description: 'Beschreibung des Termins',
    operators: FILTER_OPERATORS_BY_TYPE.text,
    placeholder: 'z.B. Rohbau kontrollieren'
  },
  type: {
    field: 'type',
    label: 'Typ',
    type: 'select',
    description: 'Art des Termins',
    operators: FILTER_OPERATORS_BY_TYPE.select,
    options: [
      { value: 'site-visit', label: 'Baustellenbesuch' },
      { value: 'meeting', label: 'Besprechung' },
      { value: 'delivery', label: 'Lieferung' },
      { value: 'milestone', label: 'Meilenstein' },
      { value: 'internal', label: 'Intern' }
    ]
  },
  priority: {
    field: 'priority',
    label: 'Priorität',
    type: 'priority',
    description: 'Priorität des Termins',
    operators: FILTER_OPERATORS_BY_TYPE.priority,
    options: [
      { value: 'low', label: 'Niedrig' },
      { value: 'medium', label: 'Mittel' },
      { value: 'high', label: 'Hoch' },
      { value: 'critical', label: 'Kritisch' }
    ]
  },
  projectId: {
    field: 'projectId',
    label: 'Projekt',
    type: 'select',
    description: 'Zugeordnetes Projekt',
    operators: FILTER_OPERATORS_BY_TYPE.select,
    placeholder: 'Projekt auswählen'
  },
  date: {
    field: 'date',
    label: 'Datum',
    type: 'date',
    description: 'Datum des Termins',
    operators: FILTER_OPERATORS_BY_TYPE.date,
    placeholder: 'TT.MM.JJJJ'
  },
  startTime: {
    field: 'startTime',
    label: 'Startzeit',
    type: 'time',
    description: 'Startzeit des Termins',
    operators: FILTER_OPERATORS_BY_TYPE.time,
    placeholder: 'HH:MM'
  },
  endTime: {
    field: 'endTime',
    label: 'Endzeit',
    type: 'time',
    description: 'Endzeit des Termins',
    operators: FILTER_OPERATORS_BY_TYPE.time,
    placeholder: 'HH:MM'
  },
  location: {
    field: 'location',
    label: 'Ort',
    type: 'text',
    description: 'Ort des Termins',
    operators: FILTER_OPERATORS_BY_TYPE.text,
    placeholder: 'z.B. Baustelle München'
  },
  attendees: {
    field: 'attendees',
    label: 'Teilnehmer',
    type: 'multi_select',
    description: 'Teilnehmer des Termins',
    operators: FILTER_OPERATORS_BY_TYPE.multi_select,
    placeholder: 'Teilnehmer auswählen'
  },
  teamMembers: {
    field: 'teamMembers',
    label: 'Team-Mitglieder',
    type: 'multi_select',
    description: 'Zugeordnete Team-Mitglieder',
    operators: FILTER_OPERATORS_BY_TYPE.multi_select,
    placeholder: 'Team-Mitglieder auswählen'
  },
  equipment: {
    field: 'equipment',
    label: 'Ausrüstung',
    type: 'multi_select',
    description: 'Benötigte Ausrüstung',
    operators: FILTER_OPERATORS_BY_TYPE.multi_select,
    placeholder: 'Ausrüstung auswählen'
  },
  customerNotification: {
    field: 'customerNotification',
    label: 'Kundenbenachrichtigung',
    type: 'boolean',
    description: 'Ob Kunde benachrichtigt wird',
    operators: FILTER_OPERATORS_BY_TYPE.boolean
  },
  reminderTime: {
    field: 'reminderTime',
    label: 'Erinnerungszeit',
    type: 'select',
    description: 'Zeit für Erinnerung vor dem Termin',
    operators: FILTER_OPERATORS_BY_TYPE.select,
    options: [
      { value: '0', label: 'Keine Erinnerung' },
      { value: '5', label: '5 Minuten' },
      { value: '15', label: '15 Minuten' },
      { value: '30', label: '30 Minuten' },
      { value: '60', label: '1 Stunde' },
      { value: '1440', label: '1 Tag' }
    ]
  },
  isRecurring: {
    field: 'isRecurring',
    label: 'Serientermin',
    type: 'boolean',
    description: 'Ob es sich um einen Serientermin handelt',
    operators: FILTER_OPERATORS_BY_TYPE.boolean
  },
  createdAt: {
    field: 'createdAt',
    label: 'Erstellt am',
    type: 'date',
    description: 'Erstellungsdatum des Termins',
    operators: FILTER_OPERATORS_BY_TYPE.date
  },
  updatedAt: {
    field: 'updatedAt',
    label: 'Zuletzt geändert',
    type: 'date',
    description: 'Datum der letzten Änderung',
    operators: FILTER_OPERATORS_BY_TYPE.date
  }
};

export const DEFAULT_QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'today',
    name: 'Heute',
    description: 'Termine für heute',
    icon: 'Calendar',
    color: 'blue',
    sortOrder: 1,
    isDefault: true,
    filter: {
      id: 'today-filter',
      name: 'Heute',
      group: {
        id: 'today-group',
        operator: 'AND',
        conditions: [{
          id: 'today-condition',
          field: 'date',
          operator: 'date_equals',
          value: 'today'
        }],
        groups: []
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  {
    id: 'this-week',
    name: 'Diese Woche',
    description: 'Termine dieser Woche',
    icon: 'Calendar',
    color: 'green',
    sortOrder: 2,
    filter: {
      id: 'this-week-filter',
      name: 'Diese Woche',
      group: {
        id: 'this-week-group',
        operator: 'AND',
        conditions: [{
          id: 'this-week-condition',
          field: 'date',
          operator: 'date_in_last',
          value: 'week'
        }],
        groups: []
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  {
    id: 'high-priority',
    name: 'Hohe Priorität',
    description: 'Termine mit hoher oder kritischer Priorität',
    icon: 'AlertTriangle',
    color: 'red',
    sortOrder: 3,
    filter: {
      id: 'high-priority-filter',
      name: 'Hohe Priorität',
      group: {
        id: 'high-priority-group',
        operator: 'AND',
        conditions: [{
          id: 'high-priority-condition',
          field: 'priority',
          operator: 'in',
          value: ['high', 'critical']
        }],
        groups: []
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  {
    id: 'recurring',
    name: 'Serientermine',
    description: 'Alle wiederkehrenden Termine',
    icon: 'RefreshCw',
    color: 'purple',
    sortOrder: 4,
    filter: {
      id: 'recurring-filter',
      name: 'Serientermine',
      group: {
        id: 'recurring-group',
        operator: 'AND',
        conditions: [{
          id: 'recurring-condition',
          field: 'isRecurring',
          operator: 'equals',
          value: true
        }],
        groups: []
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  {
    id: 'site-visits',
    name: 'Baustellenbesuche',
    description: 'Alle Baustellentermine',
    icon: 'HardHat',
    color: 'orange',
    sortOrder: 5,
    filter: {
      id: 'site-visits-filter',
      name: 'Baustellenbesuche',
      group: {
        id: 'site-visits-group',
        operator: 'AND',
        conditions: [{
          id: 'site-visits-condition',
          field: 'type',
          operator: 'equals',
          value: 'site-visit'
        }],
        groups: []
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
];