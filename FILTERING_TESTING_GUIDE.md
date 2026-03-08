# Advanced Filtering and Search System Testing Guide

This document provides comprehensive testing scenarios for the advanced filtering and 
search functionality in Bauplan Buddy.

## Components Tested

### Core Components

- **FilterService** - Backend filtering logic and performance
- **AdvancedFilterDialog** - Complex filter creation UI
- **SearchWithSuggestions** - Intelligent search with autocomplete
- **FilterPresetManager** - Filter saving and management
- **CalendarFilterBar** - Calendar-integrated filtering
- **ProjectFilterBar** - Project-specific filtering

### Hooks

- **useSearch** - Search state management
- **useFilterPresets** - Preset management

## Test Environment Setup

1. **Prerequisites**:

   - Development server running on [`localhost:8080`](http://localhost:8080)
   - Calendar page accessible with test appointments
   - Projects page with sample projects
   - Multiple appointment types (site-visit, meeting, delivery, milestone)

2. **Test Data Requirements**:

   - At least 20 appointments with varied:
     - Types (site-visit, meeting, delivery, milestone, internal)
     - Priorities (low, medium, high, critical)
     - Dates (past, present, future)
     - Projects (some with projectId, some without)
     - Locations and descriptions

## Test Scenarios

### TC1: Basic Search Functionality

**Objective**: Verify basic text search works across multiple fields

**Steps**:

1. Navigate to Calendar page
2. Enter search term in the search bar: "Baustelle"
3. Verify suggestions appear with relevant matches
4. Select a suggestion and verify results are filtered
5. Clear search and verify all appointments return

**Expected Results**:

- Search suggestions appear while typing
- Results are filtered to match search term
- Search highlights matches if enabled
- Clear button removes all filters

### TC2: Advanced Filter Creation

**Objective**: Test complex filter creation with multiple conditions

**Steps**:

1. Click "Erweitert" filter button
2. Create a filter with multiple conditions:
   - Condition 1: Type equals "site-visit"
   - Condition 2: Priority in ["high", "critical"]
   - Condition 3: Date is in next week
3. Set logical operator to "AND"
4. Save filter with name "Hochpriorisierte Baustellenbesuche"
5. Apply filter and verify results

**Expected Results**:

- Advanced filter dialog opens correctly
- All condition types and operators work
- Complex logical combinations function properly
- Filter can be saved and applied successfully

### TC3: Filter Presets Management

**Objective**: Test saving, loading, and managing filter presets

**Steps**:

1. Create a complex filter (from TC2)
2. Save as preset with description
3. Create another different filter
4. Load the saved preset
5. Edit the preset (rename, modify description)
6. Delete a preset
7. Export presets to file
8. Import presets from file

**Expected Results**:

- Presets save and load correctly
- Preset metadata (usage count, last used) updates
- Export/import maintains all preset data
- Edit operations work without data loss

### TC4: Quick Filters

**Objective**: Verify predefined quick filters work correctly

**Steps**:

1. Test each quick filter:
   - "Heute"
   - "Diese Woche"
   - "Hohe Priorität"
   - "Serientermine"
   - "Baustellenbesuche"
2. Verify filtering results match filter criteria
3. Test quick filter combinations

**Expected Results**:

- All quick filters produce correct results
- Filter badges display active filters
- Statistics show correct counts

### TC5: Search Suggestions and Autocomplete

**Objective**: Test intelligent search suggestions

**Steps**:

1. Start typing appointment titles
2. Verify value suggestions appear
3. Test field-specific searches (e.g., "Location:")
4. Check recent search history
5. Test popular search suggestions

**Expected Results**:

- Suggestions appear with correct categorization
- Field searches work properly
- History is preserved across sessions
- Suggestions improve search efficiency

### TC6: Project-Specific Filtering

**Objective**: Test project filtering on Projects page

**Steps**:

1. Navigate to Projects page
2. Select a specific project from dropdown
3. Apply additional filters within project scope
4. Test project-specific quick filters:
   - "Aktive Projekte"
   - "Meilensteine"
   - "Team-Besprechungen"
5. Switch between projects and verify filters

**Expected Results**:

- Project selection filters appointments correctly
- Additional filters work within project scope
- Project-specific quick filters function properly
- Filter statistics reflect project context

### TC7: Performance Testing

**Objective**: Verify filtering performance with large datasets

**Steps**:

1. Create a dataset with 100+ appointments
2. Apply complex filters with multiple conditions
3. Monitor execution time in filter statistics
4. Test search responsiveness while typing
5. Verify cache effectiveness with repeated searches

**Expected Results**:

- Filters execute in under 100ms for typical datasets
- Search suggestions appear promptly
- No UI lag during filter operations
- Cache improves repeated search performance

### TC8: Filter Validation

**Objective**: Test filter validation and error handling

**Steps**:

1. Create invalid filter conditions:
   - Empty required fields
   - Invalid date ranges
   - Incompatible operator/field combinations
2. Attempt to save filter without name
3. Test with malformed search queries
4. Verify error messages are clear and helpful

**Expected Results**:

- Validation prevents invalid filter creation
- Clear error messages guide users
- No crashes or unhandled exceptions
- Graceful degradation for edge cases

### TC9: Integration Testing

**Objective**: Test filtering integration with existing features

**Steps**:

1. Create appointments with recurrence patterns
2. Apply filters to recurring appointments
3. Test filtering with appointment editing/deletion
4. Verify filters work with different appointment types
5. Test integration with calendar date navigation

**Expected Results**:

- Recurring appointments filter correctly
- Operations don't break active filters
- All appointment types support filtering
- Calendar navigation preserves filters

### TC10: User Experience Testing

**Objective**: Verify filtering enhances user workflow

**Steps**:

1. Test common user workflows:
   - Finding today's appointments
   - Reviewing high-priority items
   - Searching for project-specific meetings
2. Measure time to complete common tasks
3. Test mobile responsiveness
4. Verify accessibility features

**Expected Results**:

- Common tasks complete efficiently
- Filtering improves workflow speed
- Mobile interface remains usable
- Accessibility standards met

## Edge Cases and Error Scenarios

### EC1: Empty Datasets

- No appointments available
- Empty search results
- No matching filter criteria

### EC2: Data Integrity

- Malformed appointment data
- Missing required fields
- Type mismatches

### EC3: Performance Limits

- Very large datasets (1000+ appointments)
- Complex nested filter groups
- Rapid filter changes

### EC4: Browser Compatibility

- Different browser engines
- Older browser versions
- Mobile browsers

## Validation Checklist

After completing all test scenarios, verify:

- [ ] All search functionality works correctly
- [ ] Advanced filters create and apply properly
- [ ] Filter presets save and load without errors
- [ ] Quick filters produce expected results
- [ ] Search suggestions are relevant and helpful
- [ ] Project filtering functions correctly
- [ ] Performance meets requirements
- [ ] Error handling is robust
- [ ] Integration with existing features is seamless
- [ ] User experience is smooth and intuitive
- [ ] No compilation or runtime errors
- [ ] Mobile compatibility is maintained
- [ ] Accessibility requirements are met

## Performance Benchmarks

- **Search execution**: < 50ms for typical queries
- **Filter application**: < 100ms for complex filters
- **Suggestion generation**: < 200ms while typing
- **Preset loading**: < 50ms
- **UI responsiveness**: No perceptible lag

## Bug Reporting

If any test fails, document:

1. Test case that failed
2. Expected vs actual behavior
3. Steps to reproduce
4. Browser and environment details
5. Console errors (if any)
6. Screenshots for UI issues

## Test Completion

✅ **All tests passed**: Advanced filtering system is ready for production  
❌ **Tests failed**: Fix issues before marking task complete

---

**Test Status**: Ready for execution  
**Last Updated**: Created during advanced filtering implementation  
**Components Version**: All filtering components v1.0