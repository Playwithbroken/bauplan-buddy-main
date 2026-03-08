import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useDragAndDrop } from '../useDragAndDrop';
import { dragDropService } from '@/services/dragDropService';
import { DragItem, DropTarget } from '@/types/dragAndDrop';

// Mock the dragDropService
jest.mock('@/services/dragDropService', () => ({
  dragDropService: {
    validateDragOperation: jest.fn(),
    checkConflicts: jest.fn(),
    calculateDuration: jest.fn()
  }
}));

// Mock useUpdateEvent hook
jest.mock('@/hooks/useCalendar', () => ({
  useUpdateEvent: () => ({
    mutateAsync: jest.fn()
  })
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

describe('useDragAndDrop Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Drag State Management', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useDragAndDrop());
      
      expect(result.current.state.isDragging).toBe(false);
      expect(result.current.state.dragItem).toBeNull();
      expect(result.current.state.dropTarget).toBeNull();
    });

    it('should start drag with an item', () => {
      const { result } = renderHook(() => useDragAndDrop());
      const dragItem: DragItem = {
        id: 'event-1',
        type: 'appointment',
        data: {},
        startTime: '10:00',
        endTime: '11:00',
        date: '2024-01-15'
      };
      
      act(() => {
        result.current.startDrag(dragItem);
      });
      
      expect(result.current.state.isDragging).toBe(true);
      expect(result.current.state.dragItem).toEqual(dragItem);
    });

    it('should update drag target', () => {
      const { result } = renderHook(() => useDragAndDrop());
      const dropTarget: DropTarget = {
        date: '2024-01-16',
        resourceId: 'resource-1'
      };
      
      act(() => {
        result.current.updateDrag(dropTarget);
      });
      
      expect(result.current.state.dropTarget).toEqual(dropTarget);
    });

    it('should cancel drag operation', () => {
      const { result } = renderHook(() => useDragAndDrop());
      
      // Start dragging
      act(() => {
        result.current.startDrag({
          id: 'event-1',
          type: 'appointment',
          data: {},
          startTime: '10:00',
          endTime: '11:00',
          date: '2024-01-15'
        } as DragItem);
      });
      
      // Cancel drag
      act(() => {
        result.current.cancelDrag();
      });
      
      expect(result.current.state.isDragging).toBe(false);
      expect(result.current.state.dragItem).toBeNull();
    });
  });

  describe('Drag Operation Validation', () => {
    it('should validate drag operations', () => {
      const { result } = renderHook(() => useDragAndDrop());
      const dragItem: DragItem = {
        id: 'event-1',
        type: 'appointment',
        data: {},
        startTime: '10:00',
        endTime: '11:00',
        date: '2024-01-15'
      };
      const dropTarget: DropTarget = {
        date: '2024-01-16',
        resourceId: 'resource-1'
      };
      
      const validationResponse = { isValid: true, errors: [] };
      (dragDropService.validateDragOperation as jest.MockedFunction<typeof dragDropService.validateDragOperation>).mockReturnValue(validationResponse);
      
      const resultValidation = result.current.validateDragOperation(dragItem, dropTarget);
      
      expect(dragDropService.validateDragOperation).toHaveBeenCalledWith(dragItem, dropTarget);
      expect(resultValidation).toEqual(validationResponse);
    });
  });

  describe('Conflict Checking', () => {
    it('should check for conflicts', async () => {
      const { result } = renderHook(() => useDragAndDrop());
      const dragItem: DragItem = {
        id: 'event-1',
        type: 'appointment',
        data: {},
        startTime: '10:00',
        endTime: '11:00',
        date: '2024-01-15'
      };
      const dropTarget: DropTarget = {
        date: '2024-01-16',
        resourceId: 'resource-1'
      };
      
      const conflictInfo = { hasConflict: false, message: '', conflictingAppointments: [] };
      (dragDropService.checkConflicts as jest.MockedFunction<typeof dragDropService.checkConflicts>).mockResolvedValue(conflictInfo);
      
      const resultConflict = await result.current.checkConflicts(dragItem, dropTarget);
      
      expect(dragDropService.checkConflicts).toHaveBeenCalledWith(dragItem, dropTarget);
      expect(resultConflict).toEqual(conflictInfo);
    });
  });

  describe('Drag Completion', () => {
    it('should end drag without target', async () => {
      const { result } = renderHook(() => useDragAndDrop());
      
      // Start dragging
      act(() => {
        result.current.startDrag({
          id: 'event-1',
          type: 'appointment',
          data: {},
          startTime: '10:00',
          endTime: '11:00',
          date: '2024-01-15'
        } as DragItem);
      });
      
      // End drag without target
      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.endDrag();
      });
      
      expect(success).toBe(false);
      expect(result.current.state.isDragging).toBe(false);
    });

    it('should handle validation failure during drag end', async () => {
      const { result } = renderHook(() => useDragAndDrop());
      const dragItem: DragItem = {
        id: 'event-1',
        type: 'appointment',
        data: {},
        startTime: '10:00',
        endTime: '11:00',
        date: '2024-01-15'
      };
      const dropTarget: DropTarget = {
        date: '2024-01-16',
        resourceId: 'resource-1'
      };
      
      // Mock validation to fail
      const validationResponse = { isValid: false, errors: ['Invalid operation'] };
      (dragDropService.validateDragOperation as jest.MockedFunction<typeof dragDropService.validateDragOperation>).mockReturnValue(validationResponse);
      
      // Start dragging
      act(() => {
        result.current.startDrag(dragItem);
      });
      
      // End drag
      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.endDrag(dropTarget);
      });
      
      expect(success).toBe(false);
      expect(dragDropService.validateDragOperation).toHaveBeenCalledWith(dragItem, dropTarget);
    });
  });
});