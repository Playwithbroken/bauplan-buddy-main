// DragAndDropContext.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DragAndDropProvider, useDragAndDropContext } from '@/contexts/DragAndDropContext';
import { DragItem, DropTarget } from '@/types/dragAndDrop';

// Test component that uses the context
const TestComponent: React.FC = () => {
  const { state, startDrag, updateDrag, endDrag, cancelDrag } = useDragAndDropContext();
  
  return (
    <div>
      <div data-testid="is-dragging">{state.isDragging.toString()}</div>
      <div data-testid="drag-item">{state.dragItem ? state.dragItem.id : 'null'}</div>
      <div data-testid="drop-target">{state.dropTarget ? state.dropTarget.date : 'null'}</div>
      <button data-testid="start-drag" onClick={() => startDrag({
        type: 'appointment',
        id: 'test-1',
        data: {},
        startTime: '10:00',
        endTime: '11:00',
        date: '2024-01-15'
      })}>
        Start Drag
      </button>
      <button data-testid="update-drag" onClick={() => updateDrag({
        date: '2024-01-16',
        startTime: '14:00',
        endTime: '15:00'
      })}>
        Update Drag
      </button>
      <button data-testid="end-drag" onClick={() => endDrag({
        date: '2024-01-16',
        startTime: '14:00',
        endTime: '15:00'
      })}>
        End Drag
      </button>
      <button data-testid="cancel-drag" onClick={cancelDrag}>
        Cancel Drag
      </button>
    </div>
  );
};

describe('DragAndDropContext', () => {
  test('should provide initial state', () => {
    render(
      <DragAndDropProvider>
        <TestComponent />
      </DragAndDropProvider>
    );

    expect(screen.getByTestId('is-dragging')).toHaveTextContent('false');
    expect(screen.getByTestId('drag-item')).toHaveTextContent('null');
    expect(screen.getByTestId('drop-target')).toHaveTextContent('null');
  });

  test('should update state when starting drag', async () => {
    const user = userEvent.setup();
    render(
      <DragAndDropProvider>
        <TestComponent />
      </DragAndDropProvider>
    );

    // Click start drag button
    await user.click(screen.getByTestId('start-drag'));

    await waitFor(() => {
      expect(screen.getByTestId('is-dragging')).toHaveTextContent('true');
      expect(screen.getByTestId('drag-item')).toHaveTextContent('test-1');
    });
  });

  test('should update state when updating drag', async () => {
    const user = userEvent.setup();
    render(
      <DragAndDropProvider>
        <TestComponent />
      </DragAndDropProvider>
    );

    // Start drag first
    await user.click(screen.getByTestId('start-drag'));
    
    // Then update drag
    await user.click(screen.getByTestId('update-drag'));

    await waitFor(() => {
      expect(screen.getByTestId('is-dragging')).toHaveTextContent('true');
      expect(screen.getByTestId('drop-target')).toHaveTextContent('2024-01-16');
    });
  });

  test('should reset state when ending drag', async () => {
    const user = userEvent.setup();
    render(
      <DragAndDropProvider>
        <TestComponent />
      </DragAndDropProvider>
    );

    // Start drag first
    await user.click(screen.getByTestId('start-drag'));
    
    // Then end drag
    await user.click(screen.getByTestId('end-drag'));

    await waitFor(() => {
      expect(screen.getByTestId('is-dragging')).toHaveTextContent('false');
      expect(screen.getByTestId('drag-item')).toHaveTextContent('null');
    });
  });

  test('should reset state when canceling drag', async () => {
    const user = userEvent.setup();
    render(
      <DragAndDropProvider>
        <TestComponent />
      </DragAndDropProvider>
    );

    // Start drag first
    await user.click(screen.getByTestId('start-drag'));
    
    // Then cancel drag
    await user.click(screen.getByTestId('cancel-drag'));

    await waitFor(() => {
      expect(screen.getByTestId('is-dragging')).toHaveTextContent('false');
      expect(screen.getByTestId('drag-item')).toHaveTextContent('null');
      expect(screen.getByTestId('drop-target')).toHaveTextContent('null');
    });
  });

  test('should throw error when used outside provider', () => {
    // Suppress console error for this test
    const consoleError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useDragAndDropContext must be used within a DragAndDropProvider');

    // Restore console error
    console.error = consoleError;
  });
});