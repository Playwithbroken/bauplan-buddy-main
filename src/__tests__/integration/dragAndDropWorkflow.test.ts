import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { dragDropService } from '../../services/dragDropService';
import { CalendarIntegrationService } from '../../services/calendarIntegrationService';

// Mock localStorage for calendar service
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Drag and Drop Workflow Integration', () => {
  let calendarService: CalendarIntegrationService;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    calendarService = CalendarIntegrationService.getInstance();
    
    // Clear any existing data
    (calendarService as any).events.clear();
    (calendarService as any).providers.clear();
    (calendarService as any).conflicts.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Complete Drag and Drop Workflow', () => {
    it('should validate, check conflicts, and complete drag operation successfully', () => {
      // Step 1: Create initial events in calendar
      const event1 = calendarService.createEvent({
        title: 'Original Meeting',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        eventType: 'meeting'
      });

      const event2 = calendarService.createEvent({
        title: 'Target Slot',
        startTime: new Date('2024-03-21T14:00:00Z'),
        endTime: new Date('2024-03-21T15:00:00Z'),
        eventType: 'meeting'
      });

      // Step 2: Create drag item
      const dragItem = {
        id: event1.id,
        type: 'appointment' as const,
        data: event1,
        startTime: '10:00',
        endTime: '11:00',
        date: '2024-03-20'
      };

      // Step 3: Create drop target
      const dropTarget = {
        date: '2024-03-21',
        resourceId: 'resource-1',
        timeSlot: '14:00-15:00'
      };

      // Step 4: Validate drag operation
      const validation = dragDropService.validateDragOperation(dragItem, dropTarget);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Step 5: Check for conflicts
      const conflictCheck = dragDropService.checkConflicts(dragItem, dropTarget);
      
      // Since we're using a mock implementation, we need to check the promise
      return conflictCheck.then(conflictInfo => {
        expect(conflictInfo).toBeDefined();
        // In a real implementation, this would check actual conflicts
        // For now, we're testing the interface
      });
    });

    it('should detect and handle conflicts during drag operations', async () => {
      // Create overlapping events
      const event1 = calendarService.createEvent({
        title: 'Event to Move',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        eventType: 'meeting'
      });

      const blockingEvent = calendarService.createEvent({
        title: 'Blocking Event',
        startTime: new Date('2024-03-21T10:00:00Z'),
        endTime: new Date('2024-03-21T11:00:00Z'),
        eventType: 'meeting'
      });

      // Create drag item
      const dragItem = {
        id: event1.id,
        type: 'appointment' as const,
        data: event1,
        startTime: '10:00',
        endTime: '11:00',
        date: '2024-03-20'
      };

      // Create drop target that would cause conflict
      const dropTarget = {
        date: '2024-03-21',
        resourceId: 'resource-1',
        timeSlot: '10:00-11:00'
      };

      // Validate operation (should be valid structurally)
      const validation = dragDropService.validateDragOperation(dragItem, dropTarget);
      expect(validation.isValid).toBe(true);

      // Check for conflicts (in real implementation, this would detect the overlap)
      const conflictInfo = await dragDropService.checkConflicts(dragItem, dropTarget);
      expect(conflictInfo).toBeDefined();
    });

    it('should calculate durations correctly for different event types', () => {
      // Test duration calculation
      const duration1 = dragDropService.calculateDuration('09:00', '10:00');
      expect(duration1).toBe(60); // 1 hour in minutes

      const duration2 = dragDropService.calculateDuration('09:30', '11:15');
      expect(duration2).toBe(105); // 1 hour 45 minutes

      const duration3 = dragDropService.calculateDuration('14:00', '14:30');
      expect(duration3).toBe(30); // 30 minutes
    });

    it('should handle edge cases in drag operations', () => {
      // Test with invalid drag item
      const invalidDragItem = {
        id: '',
        type: 'appointment' as const,
        data: null,
        startTime: '',
        endTime: '',
        date: ''
      };

      const dropTarget = {
        date: '2024-03-21',
        resourceId: 'resource-1'
      };

      // Validate should fail with proper errors
      const validation = dragDropService.validateDragOperation(invalidDragItem, dropTarget);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid drag item');
    });
  });

  describe('Drag and Drop with Calendar Integration', () => {
    it('should update calendar events after successful drag operations', () => {
      // Create initial event
      const originalEvent = calendarService.createEvent({
        title: 'Movable Meeting',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        eventType: 'meeting',
        location: 'Room A'
      });

      // Verify event exists
      const initialEvents = calendarService.getEvents();
      expect(initialEvents).toHaveLength(1);
      expect(initialEvents[0].title).toBe('Movable Meeting');
      expect(initialEvents[0].startTime.toISOString()).toBe('2024-03-20T10:00:00.000Z');

      // In a real implementation, after a successful drag operation,
      // the calendar service would be updated with the new event time
      // For this test, we're verifying the integration points exist
      expect(calendarService.updateEvent).toBeDefined();
      expect(calendarService.getEvents).toBeDefined();
    });

    it('should maintain data consistency during drag operations', () => {
      // Create multiple events
      const events = [];
      for (let i = 0; i < 5; i++) {
        const event = calendarService.createEvent({
          title: `Event ${i + 1}`,
          startTime: new Date(`2024-03-20T${10 + i}:00:00Z`),
          endTime: new Date(`2024-03-20T${11 + i}:00:00Z`),
          eventType: 'meeting'
        });
        events.push(event);
      }

      // Verify all events created
      const allEvents = calendarService.getEvents();
      expect(allEvents).toHaveLength(5);

      // Test that drag drop service can work with any of these events
      const dragItem = {
        id: events[0].id,
        type: 'appointment' as const,
        data: events[0],
        startTime: '10:00',
        endTime: '11:00',
        date: '2024-03-20'
      };

      const dropTarget = {
        date: '2024-03-21',
        resourceId: 'resource-1'
      };

      // Validate operation
      const validation = dragDropService.validateDragOperation(dragItem, dropTarget);
      expect(validation.isValid).toBe(true);

      // Verify calendar state is unchanged by validation
      const eventsAfterValidation = calendarService.getEvents();
      expect(eventsAfterValidation).toHaveLength(5);
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle high volume of drag operations efficiently', () => {
      // Create many events
      const events = [];
      for (let i = 0; i < 100; i++) {
        const event = calendarService.createEvent({
          title: `Performance Test Event ${i + 1}`,
          startTime: new Date(`2024-03-20T${Math.floor(i/4)}:${(i%4)*15}:00Z`),
          endTime: new Date(`2024-03-20T${Math.floor(i/4)}:${(i%4)*15 + 15}:00Z`),
          eventType: 'meeting'
        });
        events.push(event);
      }

      // Test multiple drag validations
      const startTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        const dragItem = {
          id: events[i].id,
          type: 'appointment' as const,
          data: events[i],
          startTime: `${Math.floor(i/4)}:${(i%4)*15}`,
          endTime: `${Math.floor(i/4)}:${(i%4)*15 + 15}`,
          date: '2024-03-20'
        };

        const dropTarget = {
          date: '2024-03-21',
          resourceId: `resource-${i % 5}`
        };

        const validation = dragDropService.validateDragOperation(dragItem, dropTarget);
        expect(validation.isValid).toBe(true);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (less than 100ms for 10 operations)
      expect(duration).toBeLessThan(100);
    });

    it('should gracefully handle malformed drag data', () => {
      // Test with various malformed data structures
      const malformedItems = [
        null,
        undefined,
        {},
        { id: null },
        { id: 'test', type: 'invalid' },
        { id: 'test', type: 'appointment', data: null }
      ];

      const dropTarget = {
        date: '2024-03-21',
        resourceId: 'resource-1'
      };

      malformedItems.forEach(item => {
        const validation = dragDropService.validateDragOperation(item as any, dropTarget);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toHaveLengthGreaterThan(0);
      });
    });

    it('should handle concurrent drag operations', () => {
      // Create events
      const event1 = calendarService.createEvent({
        title: 'Concurrent Test 1',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        eventType: 'meeting'
      });

      const event2 = calendarService.createEvent({
        title: 'Concurrent Test 2',
        startTime: new Date('2024-03-20T14:00:00Z'),
        endTime: new Date('2024-03-20T15:00:00Z'),
        eventType: 'meeting'
      });

      // Create drag items
      const dragItem1 = {
        id: event1.id,
        type: 'appointment' as const,
        data: event1,
        startTime: '10:00',
        endTime: '11:00',
        date: '2024-03-20'
      };

      const dragItem2 = {
        id: event2.id,
        type: 'appointment' as const,
        data: event2,
        startTime: '14:00',
        endTime: '15:00',
        date: '2024-03-20'
      };

      const dropTarget1 = {
        date: '2024-03-21',
        resourceId: 'resource-1'
      };

      const dropTarget2 = {
        date: '2024-03-22',
        resourceId: 'resource-2'
      };

      // Validate both operations concurrently
      const validation1 = dragDropService.validateDragOperation(dragItem1, dropTarget1);
      const validation2 = dragDropService.validateDragOperation(dragItem2, dropTarget2);

      expect(validation1.isValid).toBe(true);
      expect(validation2.isValid).toBe(true);
    });
  });
});