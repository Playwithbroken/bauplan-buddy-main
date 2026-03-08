// Recurrence Functionality Validation Script
// This script tests core recurrence patterns programmatically

import { RecurrenceService, RecurrencePattern } from '../src/services/recurrenceService';
import { AppointmentService } from '../src/services/appointmentService';

// Test 1: Daily Recurrence Pattern Validation
function testDailyRecurrence() {
  console.log('Testing Daily Recurrence...');
  
  const pattern = {
    type: 'daily',
    interval: 2, // Every 2 days
    endType: 'after',
    occurrences: 5
  };
  
  const validation = RecurrenceService.validatePattern(pattern);
  console.log('Daily pattern validation:', validation);
  
  if (validation.isValid) {
    const description = RecurrenceService.getRecurrenceDescription(pattern);
    console.log('Daily pattern description:', description);
    console.log('✅ Daily recurrence test passed');
  } else {
    console.log('❌ Daily recurrence test failed:', validation.errors);
  }
}

// Test 2: Weekly Recurrence Pattern Validation
function testWeeklyRecurrence() {
  console.log('\nTesting Weekly Recurrence...');
  
  const pattern = {
    type: 'weekly',
    interval: 1,
    weekDays: ['monday', 'wednesday', 'friday'],
    endType: 'never'
  };
  
  const validation = RecurrenceService.validatePattern(pattern);
  console.log('Weekly pattern validation:', validation);
  
  if (validation.isValid) {
    const description = RecurrenceService.getRecurrenceDescription(pattern);
    console.log('Weekly pattern description:', description);
    console.log('✅ Weekly recurrence test passed');
  } else {
    console.log('❌ Weekly recurrence test failed:', validation.errors);
  }
}

// Test 3: Monthly Recurrence Pattern Validation
function testMonthlyRecurrence() {
  console.log('\nTesting Monthly Recurrence...');
  
  const pattern = {
    type: 'monthly',
    interval: 1,
    monthlyType: 'weekday',
    weekOfMonth: 2,
    weekDay: 'tuesday',
    endType: 'on',
    endDate: '2024-12-31'
  };
  
  const validation = RecurrenceService.validatePattern(pattern);
  console.log('Monthly pattern validation:', validation);
  
  if (validation.isValid) {
    const description = RecurrenceService.getRecurrenceDescription(pattern);
    console.log('Monthly pattern description:', description);
    console.log('✅ Monthly recurrence test passed');
  } else {
    console.log('❌ Monthly recurrence test failed:', validation.errors);
  }
}

// Test 4: Invalid Pattern Validation
function testInvalidPatterns() {
  console.log('\nTesting Invalid Patterns...');
  
  const invalidPatterns = [
    // Weekly with no weekdays
    {
      type: 'weekly',
      interval: 1,
      weekDays: [],
      endType: 'never'
    },
    // Zero interval
    {
      type: 'daily',
      interval: 0,
      endType: 'never'
    },
    // Invalid day of month
    {
      type: 'monthly',
      interval: 1,
      monthlyType: 'date',
      dayOfMonth: 32,
      endType: 'never'
    }
  ];
  
  let allValidationsPassed = true;
  
  invalidPatterns.forEach((pattern, index) => {
    const validation = RecurrenceService.validatePattern(pattern);
    console.log(`Invalid pattern ${index + 1} validation:`, validation);
    
    if (validation.isValid) {
      console.log(`❌ Invalid pattern ${index + 1} should have failed but passed`);
      allValidationsPassed = false;
    }
  });
  
  if (allValidationsPassed) {
    console.log('✅ Invalid pattern validation tests passed');
  }
}

// Test 5: Occurrence Generation Test
function testOccurrenceGeneration() {
  console.log('\nTesting Occurrence Generation...');
  
  const baseAppointment = {
    id: 'test-appointment',
    date: '2024-01-15',
    startTime: '10:00',
    endTime: '11:00',
    title: 'Test Meeting',
    description: 'Test recurring meeting',
    type: 'meeting',
    location: '',
    projectId: 'test-project',
    attendees: [],
    teamMembers: [],
    equipment: [],
    priority: 'medium',
    customerNotification: false,
    reminderTime: '15',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isRecurring: true,
    seriesId: 'test-series',
    recurrencePattern: {
      type: 'weekly',
      interval: 1,
      weekDays: ['monday'],
      endType: 'after',
      occurrences: 3
    }
  };
  
  try {
    const occurrences = RecurrenceService.generateOccurrences(baseAppointment, {
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-02-15'),
      maxOccurrences: 10
    });
    
    console.log(`Generated ${occurrences.length} occurrences`);
    occurrences.forEach((occ, index) => {
      console.log(`Occurrence ${index + 1}: ${occ.date} ${occ.startTime}`);
    });
    
    if (occurrences.length === 3) {
      console.log('✅ Occurrence generation test passed');
    } else {
      console.log(`❌ Expected 3 occurrences, got ${occurrences.length}`);
    }
  } catch (error) {
    console.log('❌ Occurrence generation test failed:', error);
  }
}

// Run all tests
function runValidationTests() {
  console.log('🚀 Starting Recurrence Functionality Validation Tests...\n');
  
  try {
    testDailyRecurrence();
    testWeeklyRecurrence();
    testMonthlyRecurrence();
    testInvalidPatterns();
    testOccurrenceGeneration();
    
    console.log('\n🎉 All validation tests completed!');
    console.log('\n📝 Manual Testing:');
    console.log('1. Open the preview browser');
    console.log('2. Navigate to Calendar page');
    console.log('3. Click "Neuer Termin"');
    console.log('4. Test recurring appointment creation');
    console.log('5. Test editing/deleting recurring appointments');
    console.log('6. Verify visual indicators work correctly');
    
  } catch (error) {
    console.log('❌ Validation tests failed with error:', error);
  }
}

// Export for use in browser console or test runner
if (typeof window !== 'undefined') {
  window.runValidationTests = runValidationTests;
  console.log('✨ Validation tests loaded! Run runValidationTests() to start testing.');
} else {
  runValidationTests();
}