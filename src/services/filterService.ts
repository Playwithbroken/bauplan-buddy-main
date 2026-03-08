import { 
  FilterDefinition, 
  FilterCondition, 
  FilterGroup, 
  FilterResult, 
  FilterField, 
  FilterOperator, 
  LogicalOperator,
  SearchConfig,
  AdvancedSearch,
  SortDefinition,
  GroupDefinition,
  FilterValidationResult,
  FilterStatistics,
  FilterPerformance,
  FILTER_FIELD_METADATA
} from '../types/filtering';
import { StoredAppointment } from './appointmentService';
import { format, isAfter, isBefore, isEqual, parseISO, startOfDay, endOfDay, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

export class FilterService {
  private static performanceStats: FilterPerformance[] = [];
  private static filterCache = new Map<string, { result: FilterResult; timestamp: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Execute a complete advanced search with filters, sorting, and grouping
   */
  static async executeAdvancedSearch(
    appointments: StoredAppointment[],
    search: AdvancedSearch
  ): Promise<FilterResult> {
    const startTime = performance.now();
    
    try {
      let filteredAppointments = [...appointments];

      // Apply text search first if specified
      if (search.search.query.trim()) {
        filteredAppointments = this.applyTextSearch(filteredAppointments, search.search);
      }

      // Apply filters
      for (const filter of search.filters) {
        filteredAppointments = this.executeFilter(filteredAppointments, filter);
      }

      // Apply sorting
      if (search.sortBy) {
        filteredAppointments = this.applySorting(filteredAppointments, search.sortBy);
      }

      // Apply grouping (for display purposes - doesn't change the array structure)
      let groupedBy: string | undefined;
      if (search.groupBy) {
        groupedBy = FILTER_FIELD_METADATA[search.groupBy.field].label;
        filteredAppointments = this.applyGrouping(filteredAppointments, search.groupBy);
      }

      const executionTime = performance.now() - startTime;
      
      // Track performance
      this.trackPerformance({
        filterId: search.filters.map(f => f.id).join(','),
        executionTime,
        resultCount: filteredAppointments.length,
        complexity: this.calculateComplexity(search),
        cacheHit: false,
        timestamp: new Date().toISOString()
      });

      return {
        appointments: filteredAppointments,
        totalCount: appointments.length,
        filteredCount: filteredAppointments.length,
        metadata: {
          searchQuery: search.search.query || undefined,
          appliedFilters: search.filters,
          executionTime,
          groupedBy,
          sortedBy: search.sortBy ? FILTER_FIELD_METADATA[search.sortBy.field].label : undefined
        }
      };
    } catch (error) {
      console.error('Error executing advanced search:', error);
      throw new Error('Failed to execute advanced search');
    }
  }

  /**
   * Execute a single filter definition
   */
  static executeFilter(appointments: StoredAppointment[], filter: FilterDefinition): StoredAppointment[] {
    if (!filter.isActive) {
      return appointments;
    }

    const cacheKey = `${filter.id}-${JSON.stringify(appointments.map(a => a.id))}`;
    const cached = this.filterCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result.appointments;
    }

    const startTime = performance.now();
    
    try {
      const result = appointments.filter(appointment => 
        this.evaluateFilterGroup(appointment, filter.group)
      );

      const executionTime = performance.now() - startTime;
      
      // Cache result
      this.filterCache.set(cacheKey, {
        result: {
          appointments: result,
          totalCount: appointments.length,
          filteredCount: result.length,
          metadata: {
            appliedFilters: [filter],
            executionTime,
          }
        },
        timestamp: Date.now()
      });

      // Track performance
      this.trackPerformance({
        filterId: filter.id,
        executionTime,
        resultCount: result.length,
        complexity: this.calculateFilterComplexity(filter),
        cacheHit: false,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      console.error('Error executing filter:', filter.name, error);
      return appointments; // Return original on error
    }
  }

  /**
   * Evaluate a filter group (conditions + nested groups)
   */
  private static evaluateFilterGroup(appointment: StoredAppointment, group: FilterGroup): boolean {
    const conditionResults = group.conditions.map(condition => 
      this.evaluateCondition(appointment, condition)
    );

    const groupResults = group.groups.map(nestedGroup => 
      this.evaluateFilterGroup(appointment, nestedGroup)
    );

    const allResults = [...conditionResults, ...groupResults];

    if (allResults.length === 0) {
      return true; // Empty group matches all
    }

    if (group.operator === 'AND') {
      return allResults.every(result => result);
    } else {
      return allResults.some(result => result);
    }
  }

  /**
   * Evaluate a single filter condition
   */
  private static evaluateCondition(appointment: StoredAppointment, condition: FilterCondition): boolean {
    const fieldValue = this.getFieldValue(appointment, condition.field);
    const conditionValue = condition.value;

    try {
      switch (condition.operator) {
        case 'equals':
          return this.compareValues(fieldValue, conditionValue, 'equals');
        
        case 'not_equals':
          return !this.compareValues(fieldValue, conditionValue, 'equals');
        
        case 'contains':
          return this.compareValues(fieldValue, conditionValue, 'contains');
        
        case 'not_contains':
          return !this.compareValues(fieldValue, conditionValue, 'contains');
        
        case 'starts_with':
          return this.compareValues(fieldValue, conditionValue, 'starts_with');
        
        case 'ends_with':
          return this.compareValues(fieldValue, conditionValue, 'ends_with');
        
        case 'greater_than':
          return this.compareValues(fieldValue, conditionValue, 'greater_than');
        
        case 'less_than':
          return this.compareValues(fieldValue, conditionValue, 'less_than');
        
        case 'greater_than_equal':
          return this.compareValues(fieldValue, conditionValue, 'greater_than_equal');
        
        case 'less_than_equal':
          return this.compareValues(fieldValue, conditionValue, 'less_than_equal');
        
        case 'between':
          return this.compareValues(fieldValue, conditionValue, 'between');
        
        case 'in':
          return this.compareValues(fieldValue, conditionValue, 'in');
        
        case 'not_in':
          return !this.compareValues(fieldValue, conditionValue, 'in');
        
        case 'is_empty':
          return this.isEmpty(fieldValue);
        
        case 'is_not_empty':
          return !this.isEmpty(fieldValue);
        
        case 'date_equals':
          return this.compareDates(fieldValue, conditionValue, 'equals');
        
        case 'date_before':
          return this.compareDates(fieldValue, conditionValue, 'before');
        
        case 'date_after':
          return this.compareDates(fieldValue, conditionValue, 'after');
        
        case 'date_between':
          return this.compareDates(fieldValue, conditionValue, 'between');
        
        case 'date_in_last':
          return this.compareDates(fieldValue, conditionValue, 'in_last');
        
        case 'date_in_next':
          return this.compareDates(fieldValue, conditionValue, 'in_next');
        
        default:
          console.warn('Unknown filter operator:', condition.operator);
          return false;
      }
    } catch (error) {
      console.error('Error evaluating condition:', condition, error);
      return false;
    }
  }

  /**
   * Get field value from appointment
   */
  private static getFieldValue(appointment: StoredAppointment, field: FilterField): string | number | boolean | string[] | Date | null | undefined {
    switch (field) {
      case 'title': return appointment.title;
      case 'description': return appointment.description || '';
      case 'type': return appointment.type;
      case 'priority': return appointment.priority || 'medium';
      case 'projectId': return appointment.projectId;
      case 'date': return appointment.date;
      case 'startTime': return appointment.startTime;
      case 'endTime': return appointment.endTime;
      case 'location': return appointment.location || '';
      case 'attendees': return appointment.attendees || [];
      case 'teamMembers': return appointment.teamMembers || [];
      case 'equipment': return appointment.equipment || [];
      case 'customerNotification': return appointment.customerNotification || false;
      case 'reminderTime': return appointment.reminderTime || '0';
      case 'isRecurring': return appointment.isRecurring || false;
      case 'createdAt': return appointment.createdAt;
      case 'updatedAt': return appointment.updatedAt;
      default:
        console.warn('Unknown filter field:', field);
        return undefined;
    }
  }

  /**
   * Compare values with different operators
   */
  private static compareValues(fieldValue: string | number | boolean | string[] | Date | null | undefined, conditionValue: unknown, operator: string): boolean {
    if (fieldValue === null || fieldValue === undefined) {
      return operator === 'is_empty';
    }

    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;
      
      case 'contains':
        if (Array.isArray(fieldValue)) {
          return fieldValue.some(item => 
            String(item).toLowerCase().includes(String(conditionValue).toLowerCase())
          );
        }
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      
      case 'starts_with':
        return String(fieldValue).toLowerCase().startsWith(String(conditionValue).toLowerCase());
      
      case 'ends_with':
        return String(fieldValue).toLowerCase().endsWith(String(conditionValue).toLowerCase());
      
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      
      case 'greater_than_equal':
        return Number(fieldValue) >= Number(conditionValue);
      
      case 'less_than_equal':
        return Number(fieldValue) <= Number(conditionValue);
      
      case 'between':
        if (Array.isArray(conditionValue) && conditionValue.length === 2) {
          const numValue = Number(fieldValue);
          return numValue >= Number(conditionValue[0]) && numValue <= Number(conditionValue[1]);
        }
        return false;
      
      case 'in':
        if (Array.isArray(conditionValue)) {
          if (Array.isArray(fieldValue)) {
            return fieldValue.some(item => conditionValue.includes(item));
          }
          return conditionValue.includes(fieldValue);
        }
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Compare dates with special operators
   */
  private static compareDates(fieldValue: string | number | boolean | string[] | Date | null | undefined, conditionValue: unknown, operator: string): boolean {
    try {
      // Only process values that can be dates
      if (fieldValue === null || fieldValue === undefined || typeof fieldValue === 'boolean' || Array.isArray(fieldValue)) {
        return false;
      }
      
      const fieldDate = typeof fieldValue === 'string' ? parseISO(fieldValue) : new Date(fieldValue);
      
      if (isNaN(fieldDate.getTime())) {
        return false;
      }

      switch (operator) {
        case 'equals': {
          if (conditionValue === 'today') {
            return isEqual(startOfDay(fieldDate), startOfDay(new Date()));
          }
          const compareDate = typeof conditionValue === 'string' ? parseISO(conditionValue) : new Date(conditionValue as string | number | Date);
          return isEqual(startOfDay(fieldDate), startOfDay(compareDate));
        }
        
        case 'before': {
          const beforeDate = typeof conditionValue === 'string' ? parseISO(conditionValue) : new Date(conditionValue as string | number | Date);
          return isBefore(fieldDate, beforeDate);
        }
        
        case 'after': {
          const afterDate = typeof conditionValue === 'string' ? parseISO(conditionValue) : new Date(conditionValue as string | number | Date);
          return isAfter(fieldDate, afterDate);
        }
        
        case 'between': {
          if (Array.isArray(conditionValue) && conditionValue.length === 2) {
            const startDate = typeof conditionValue[0] === 'string' ? parseISO(conditionValue[0]) : new Date(conditionValue[0] as string | number | Date);
            const endDate = typeof conditionValue[1] === 'string' ? parseISO(conditionValue[1]) : new Date(conditionValue[1] as string | number | Date);
            return (isAfter(fieldDate, startDate) || isEqual(fieldDate, startDate)) && 
                   (isBefore(fieldDate, endDate) || isEqual(fieldDate, endDate));
          }
          return false;
        }
        
        case 'in_last':
          return this.isInTimeRange(fieldDate, conditionValue as string, 'last');
        
        case 'in_next':
          return this.isInTimeRange(fieldDate, conditionValue as string, 'next');
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error comparing dates:', error);
      return false;
    }
  }

  /**
   * Check if date is in a time range (last/next X days/weeks/months)
   */
  private static isInTimeRange(date: Date, range: string, direction: 'last' | 'next'): boolean {
    const now = new Date();
    
    switch (range) {
      case 'day': {
        const dayStart = direction === 'last' ? subDays(now, 1) : now;
        const dayEnd = direction === 'last' ? now : addDays(now, 1);
        return (isAfter(date, dayStart) || isEqual(date, dayStart)) && 
               (isBefore(date, dayEnd) || isEqual(date, dayEnd));
      }
      
      case 'week': {
        const weekStart = direction === 'last' ? startOfWeek(subDays(now, 7)) : startOfWeek(now);
        const weekEnd = direction === 'last' ? endOfWeek(now) : endOfWeek(addDays(now, 7));
        return (isAfter(date, weekStart) || isEqual(date, weekStart)) && 
               (isBefore(date, weekEnd) || isEqual(date, weekEnd));
      }
      
      case 'month': {
        const monthStart = direction === 'last' ? startOfMonth(subDays(now, 30)) : startOfMonth(now);
        const monthEnd = direction === 'last' ? endOfMonth(now) : endOfMonth(addDays(now, 30));
        return (isAfter(date, monthStart) || isEqual(date, monthStart)) && 
               (isBefore(date, monthEnd) || isEqual(date, monthEnd));
      }
      
      default:
        return false;
    }
  }

  /**
   * Check if value is empty
   */
  private static isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Apply text search across specified fields
   */
  private static applyTextSearch(appointments: StoredAppointment[], search: SearchConfig): StoredAppointment[] {
    if (!search.query.trim()) {
      return appointments;
    }

    const query = search.caseSensitive ? search.query : search.query.toLowerCase();
    
    return appointments.filter(appointment => {
      return search.fields.some(field => {
        const fieldValue = this.getFieldValue(appointment, field);
        if (fieldValue === null || fieldValue === undefined) return false;
        
        let searchText = '';
        if (Array.isArray(fieldValue)) {
          searchText = fieldValue.join(' ');
        } else {
          searchText = String(fieldValue);
        }
        
        if (!search.caseSensitive) {
          searchText = searchText.toLowerCase();
        }
        
        if (search.exactMatch) {
          return searchText === query;
        } else {
          return searchText.includes(query);
        }
      });
    });
  }

  /**
   * Apply sorting to appointments
   */
  private static applySorting(appointments: StoredAppointment[], sort: SortDefinition): StoredAppointment[] {
    return [...appointments].sort((a, b) => {
      const aValue = this.getFieldValue(a, sort.field);
      const bValue = this.getFieldValue(b, sort.field);
      
      let result = this.compareForSort(aValue, bValue);
      
      if (sort.direction === 'desc') {
        result = -result;
      }
      
      // Apply secondary sort if values are equal and secondary sort is defined
      if (result === 0 && sort.secondary) {
        const aSecondary = this.getFieldValue(a, sort.secondary.field);
        const bSecondary = this.getFieldValue(b, sort.secondary.field);
        result = this.compareForSort(aSecondary, bSecondary);
        
        if (sort.secondary.direction === 'desc') {
          result = -result;
        }
      }
      
      return result;
    });
  }

  /**
   * Compare values for sorting
   */
  private static compareForSort(a: unknown, b: unknown): number {
    if (a === null || a === undefined) return b === null || b === undefined ? 0 : -1;
    if (b === null || b === undefined) return 1;
    
    // Handle dates
    if (typeof a === 'string' && typeof b === 'string') {
      const dateA = new Date(a);
      const dateB = new Date(b);
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return dateA.getTime() - dateB.getTime();
      }
    }
    
    // Handle numbers
    const numA = Number(a);
    const numB = Number(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    
    // Handle strings
    return String(a).localeCompare(String(b), 'de', { numeric: true });
  }

  /**
   * Apply grouping (for display - doesn't change array structure)
   */
  private static applyGrouping(appointments: StoredAppointment[], group: GroupDefinition): StoredAppointment[] {
    // For now, just sort by the grouping field
    // In a real implementation, you might want to return a grouped structure
    const sortDef: SortDefinition = {
      field: group.field,
      direction: group.sortGroups,
      secondary: group.sortWithinGroups
    };
    
    return this.applySorting(appointments, sortDef);
  }

  /**
   * Validate a filter definition
   */
  static validateFilter(filter: FilterDefinition): FilterValidationResult {
    const errors: Array<{ conditionId?: string; field: string; message: string; severity: 'error' | 'warning' }> = [];
    const warnings: string[] = [];

    // Validate filter structure
    if (!filter.name.trim()) {
      errors.push({
        field: 'name',
        message: 'Filter name is required',
        severity: 'error'
      });
    }

    // Validate conditions
    this.validateFilterGroup(filter.group, errors, warnings);

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a filter group recursively
   */
  private static validateFilterGroup(
    group: FilterGroup, 
    errors: Array<{ conditionId?: string; field: string; message: string; severity: 'error' | 'warning' }>,
    warnings: string[]
  ): void {
    // Check if group has conditions or nested groups
    if (group.conditions.length === 0 && group.groups.length === 0) {
      warnings.push('Empty filter group found');
    }

    // Validate each condition
    group.conditions.forEach(condition => {
      const fieldMetadata = FILTER_FIELD_METADATA[condition.field];
      
      if (!fieldMetadata) {
        errors.push({
          conditionId: condition.id,
          field: condition.field,
          message: `Unknown field: ${condition.field}`,
          severity: 'error'
        });
        return;
      }

      // Check if operator is valid for field type
      if (!fieldMetadata.operators.includes(condition.operator)) {
        errors.push({
          conditionId: condition.id,
          field: condition.field,
          message: `Operator '${condition.operator}' is not valid for field type '${fieldMetadata.type}'`,
          severity: 'error'
        });
      }

      // Validate condition value
      if (condition.value === null || condition.value === undefined) {
        if (!['is_empty', 'is_not_empty'].includes(condition.operator)) {
          errors.push({
            conditionId: condition.id,
            field: condition.field,
            message: 'Condition value is required',
            severity: 'error'
          });
        }
      }
    });

    // Validate nested groups
    group.groups.forEach(nestedGroup => {
      this.validateFilterGroup(nestedGroup, errors, warnings);
    });
  }

  /**
   * Calculate complexity score for performance tracking
   */
  private static calculateComplexity(search: AdvancedSearch): number {
    let complexity = 0;
    
    // Add complexity for search
    if (search.search.query.trim()) {
      complexity += search.search.fields.length;
    }
    
    // Add complexity for filters
    search.filters.forEach(filter => {
      complexity += this.calculateFilterComplexity(filter);
    });
    
    // Add complexity for sorting and grouping
    if (search.sortBy) complexity += 1;
    if (search.groupBy) complexity += 2;
    
    return complexity;
  }

  /**
   * Calculate filter complexity
   */
  private static calculateFilterComplexity(filter: FilterDefinition): number {
    return this.calculateGroupComplexity(filter.group);
  }

  /**
   * Calculate group complexity recursively
   */
  private static calculateGroupComplexity(group: FilterGroup): number {
    let complexity = group.conditions.length;
    group.groups.forEach(nestedGroup => {
      complexity += this.calculateGroupComplexity(nestedGroup);
    });
    return complexity;
  }

  /**
   * Track filter performance
   */
  private static trackPerformance(performance: FilterPerformance): void {
    this.performanceStats.push(performance);
    
    // Keep only last 100 performance records
    if (this.performanceStats.length > 100) {
      this.performanceStats = this.performanceStats.slice(-100);
    }
  }

  /**
   * Get filter statistics
   */
  static getFilterStatistics(): FilterStatistics {
    const totalExecutions = this.performanceStats.length;
    const avgExecutionTime = totalExecutions > 0 
      ? this.performanceStats.reduce((sum, stat) => sum + stat.executionTime, 0) / totalExecutions
      : 0;

    const filterUsage = new Map<string, number>();
    this.performanceStats.forEach(stat => {
      filterUsage.set(stat.filterId, (filterUsage.get(stat.filterId) || 0) + 1);
    });

    const mostUsedFilters = Array.from(filterUsage.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([filterId, usageCount]) => ({
        filterId,
        name: `Filter ${filterId}`,
        usageCount
      }));

    const slowestFilters = [...this.performanceStats]
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 5)
      .map(stat => ({
        filterId: stat.filterId,
        name: `Filter ${stat.filterId}`,
        executionTime: stat.executionTime
      }));

    return {
      totalFilters: filterUsage.size,
      activeFilters: filterUsage.size, // Simplified - would need real filter store
      mostUsedFilters,
      popularFields: [], // Would need real field usage tracking
      averageConditionsPerFilter: 0, // Would need real filter analysis
      performanceMetrics: {
        averageExecutionTime: avgExecutionTime,
        slowestFilters
      }
    };
  }

  /**
   * Clear performance cache
   */
  static clearCache(): void {
    this.filterCache.clear();
    this.performanceStats = [];
  }
}