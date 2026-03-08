import { dragDropService } from '../dragDropService';

describe('DragDropService', () => {
  describe('Drag Operation Validation', () => {
    it('should validate valid drag operations', () => {
      const dragItem = {
        id: 'event-1',
        type: 'appointment' as const,
        data: {},
        startTime: '10:00',
        endTime: '11:00',
        date: '2024-01-15'
      };

      const dropTarget = {
        date: '2024-01-16',
        resourceId: 'resource-1'
      };

      const result = dragDropService.validateDragOperation(dragItem, dropTarget);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid drag items', () => {
      const invalidDragItems: any[] = [
        null,
        undefined,
        {},
        { id: null },
        { id: 'test', type: 'invalid' },
        { id: 'test', type: 'appointment', data: null }
      ];

      const dropTarget = {
        date: '2024-01-16',
        resourceId: 'resource-1'
      };

      invalidDragItems.forEach(item => {
        const result = dragDropService.validateDragOperation(item, dropTarget);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid drag item');
      });
    });

    it('should reject invalid drop targets', () => {
      const dragItem = {
        id: 'event-1',
        type: 'appointment' as const,
        data: {},
        startTime: '10:00',
        endTime: '11:00',
        date: '2024-01-15'
      };

      const invalidDropTargets: any[] = [
        null,
        undefined,
        {},
        { date: null },
        { date: 'invalid-date' }
      ];

      invalidDropTargets.forEach(target => {
        const result = dragDropService.validateDragOperation(dragItem, target);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Conflict Detection', () => {
    it('should check conflicts without throwing errors', () => {
      const dragItem = {
        id: 'event-1',
        type: 'appointment' as const,
        data: {},
        startTime: '10:00',
        endTime: '11:00',
        date: '2024-01-15'
      };

      const dropTarget = {
        date: '2024-01-16',
        resourceId: 'resource-1'
      };

      // Should return a promise that resolves
      const resultPromise = dragDropService.checkConflicts(dragItem, dropTarget);
      
      expect(resultPromise).toBeInstanceOf(Promise);
      
      return resultPromise.then(result => {
        expect(result).toBeDefined();
        expect(typeof result.hasConflict).toBe('boolean');
      });
    });

    it('should handle edge cases in conflict checking', () => {
      const edgeCaseItems = [
        {
          id: '',
          type: 'appointment' as const,
          data: {},
          startTime: '',
          endTime: '',
          date: ''
        },
        {
          id: 'test',
          type: 'appointment' as const,
          data: null,
          startTime: 'invalid',
          endTime: 'invalid',
          date: 'invalid'
        }
      ];

      const dropTarget = {
        date: '2024-01-16',
        resourceId: 'resource-1'
      };

      edgeCaseItems.forEach(item => {
        const resultPromise = dragDropService.checkConflicts(item, dropTarget);
        expect(resultPromise).toBeInstanceOf(Promise);
      });
    });
  });

  describe('Duration Calculation', () => {
    it('should calculate durations correctly', () => {
      // Test various time formats
      expect(dragDropService.calculateDuration('09:00', '10:00')).toBe(60);
      expect(dragDropService.calculateDuration('09:30', '11:15')).toBe(105);
      expect(dragDropService.calculateDuration('14:00', '14:30')).toBe(30);
      expect(dragDropService.calculateDuration('08:45', '17:15')).toBe(510);
    });

    it('should handle edge cases in duration calculation', () => {
      // Test same start and end time
      expect(dragDropService.calculateDuration('10:00', '10:00')).toBe(0);
      
      // Test invalid formats (should not throw)
      expect(() => {
        dragDropService.calculateDuration('invalid', 'invalid');
      }).not.toThrow();
    });

    it('should handle 24-hour format correctly', () => {
      expect(dragDropService.calculateDuration('00:00', '23:59')).toBe(1439);
      expect(dragDropService.calculateDuration('12:00', '12:01')).toBe(1);
      expect(dragDropService.calculateDuration('23:30', '00:30')).toBe(60); // Next day
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle high-frequency validation requests', () => {
      const dragItem = {
        id: 'event-1',
        type: 'appointment' as const,
        data: {},
        startTime: '10:00',
        endTime: '11:00',
        date: '2024-01-15'
      };

      const dropTarget = {
        date: '2024-01-16',
        resourceId: 'resource-1'
      };

      const startTime = Date.now();
      
      // Perform 100 validations rapidly
      for (let i = 0; i < 100; i++) {
        const result = dragDropService.validateDragOperation(dragItem, dropTarget);
        expect(result.isValid).toBe(true);
      }
      
      const endTime = Date.now();
      
      // Should complete quickly (less than 50ms for 100 operations)
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle malformed data gracefully', () => {
      // Test with various malformed combinations
      const malformedData = [
        [null, null],
        [undefined, undefined],
        [{}, {}],
        ['invalid', 'invalid']
      ];

      malformedData.forEach(([dragItem, dropTarget]) => {
        expect(() => {
          const result = dragDropService.validateDragOperation(dragItem as any, dropTarget as any);
          expect(result).toBeDefined();
        }).not.toThrow();
      });
    });
  });
});