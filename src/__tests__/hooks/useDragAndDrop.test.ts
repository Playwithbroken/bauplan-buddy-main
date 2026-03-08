// useDragAndDrop.test.ts
import { renderHook, act } from '@testing-library/react';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { DragItem, DropTarget } from '@/types/dragAndDrop';
import { dragDropService } from '@/services/dragDropService';
import * as useCalendarHook from '@/hooks/useCalendar';

// Mock the dragDropService
jest.mock('@/services/dragDropService', () => ({
  dragDropService: {
    checkConflicts: jest.fn(),
    calculateDuration: jest.fn(() => 60), // 60 minutes
    validateDragOperation: jest.fn(() => ({ isValid: true, errors: [] })),
  }
}));

// Mock the useUpdateEvent hook
jest.mock('@/hooks/useCalendar', () => ({
  useUpdateEvent: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
}));

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

describe('useDragAndDrop', () => {
  let mockDragItem: DragItem;
  let mockDropTarget: DropTarget;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDragItem = {
      type: 'appointment',
      id: 'test-appointment-1',
      data: {
        id: 'test-appointment-1',
        title: 'Test Appointment',
        date: '2024-01-15',
        startTime: '10:00',
        endTime: '11:00',
      },
      startTime: '10:00',
      endTime: '11:00',
      date: '2024-01-15',
    };

    mockDropTarget = {
      date: '2024-01-16',
      startTime: '14:00',
      endTime: '15:00',
    };
  });

  describe('Hook Initialization', () => {
    test('should initialize with default state', () => {
      const { result } = renderHook(() => useDragAndDrop());

      expect(result.current.state.isDragging).toBe(false);
      expect(result.current.state.dragItem).toBeNull();
      expect(result.current.state.dropTarget).toBeNull();
      expect(result.current.state.dragPreview).toBeNull();
    });
  });

  describe('Drag Operations', () => {
    test('should start drag with correct item', () => {
      const { result } = renderHook(() => useDragAndDrop());

      act(() => {
        result.current.startDrag(mockDragItem);
      });

      expect(result.current.state.isDragging).toBe(true);
      expect(result.current.state.dragItem).toEqual(mockDragItem);
      expect(result.current.state.dropTarget).toBeNull();
    });

    test('should update drag with new target', () => {
      const { result } = renderHook(() => useDragAndDrop());

      act(() => {
        result.current.startDrag(mockDragItem);
        result.current.updateDrag(mockDropTarget);
      });

      expect(result.current.state.isDragging).toBe(true);
      expect(result.current.state.dragItem).toEqual(mockDragItem);
      expect(result.current.state.dropTarget).toEqual(mockDropTarget);
    });

    test('should cancel drag and reset state', () => {
      const { result } = renderHook(() => useDragAndDrop());

      act(() => {
        result.current.startDrag(mockDragItem);
        result.current.updateDrag(mockDropTarget);
        result.current.cancelDrag();
      });

      expect(result.current.state.isDragging).toBe(false);
      expect(result.current.state.dragItem).toBeNull();
      expect(result.current.state.dropTarget).toBeNull();
    });
  });

  describe('Drop Operations', () => {
    test('should handle successful drop', async () => {
      const { result } = renderHook(() => useDragAndDrop());

      // Mock successful update
      const mockMutateAsync = jest.fn().mockResolvedValue({});
      (useCalendarHook.useUpdateEvent as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
      });

      // Mock no conflicts
      const mockCheckConflicts = jest.fn().mockResolvedValue({
        hasConflict: false,
        conflictingAppointments: [],
        message: '',
      });
      (dragDropService.checkConflicts as jest.Mock).mockImplementation(mockCheckConflicts);

      await act(async () => {
        result.current.startDrag(mockDragItem);
        await result.current.endDrag(mockDropTarget);
      });

      expect(mockCheckConflicts).toHaveBeenCalledWith(mockDragItem, mockDropTarget);
      expect(mockMutateAsync).toHaveBeenCalled();
      expect(result.current.state.isDragging).toBe(false);
    });

    test('should handle drop with conflicts', async () => {
      const { result } = renderHook(() => useDragAndDrop());

      // Mock conflict detection
      const mockCheckConflicts = jest.fn().mockResolvedValue({
        hasConflict: true,
        conflictingAppointments: ['conflict-1'],
        message: 'Conflict detected',
      });
      (dragDropService.checkConflicts as jest.Mock).mockImplementation(mockCheckConflicts);

      await act(async () => {
        result.current.startDrag(mockDragItem);
        await result.current.endDrag(mockDropTarget);
      });

      expect(mockCheckConflicts).toHaveBeenCalledWith(mockDragItem, mockDropTarget);
      expect(result.current.state.isDragging).toBe(false);
    });

    test('should handle drop without target', async () => {
      const { result } = renderHook(() => useDragAndDrop());

      await act(async () => {
        result.current.startDrag(mockDragItem);
        await result.current.endDrag(); // No target
      });

      expect(result.current.state.isDragging).toBe(false);
      expect(result.current.state.dragItem).toBeNull();
    });
  });

  describe('Conflict Checking', () => {
    test('should check conflicts correctly', async () => {
      const { result } = renderHook(() => useDragAndDrop());

      const mockConflictInfo = {
        hasConflict: false,
        conflictingAppointments: [],
        message: '',
      };

      const mockCheckConflicts = jest.fn().mockResolvedValue(mockConflictInfo);
      (dragDropService.checkConflicts as jest.Mock).mockImplementation(mockCheckConflicts);

      const conflictInfo = await act(async () => {
        return await result.current.checkConflicts(mockDragItem, mockDropTarget);
      });

      expect(mockCheckConflicts).toHaveBeenCalledWith(mockDragItem, mockDropTarget);
      expect(conflictInfo).toEqual(mockConflictInfo);
    });
  });
});