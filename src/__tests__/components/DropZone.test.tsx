// DropZone.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DropZone from '@/components/DropZone';
import { DropTarget, DragItem } from '@/types/dragAndDrop';

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  MapPin: () => <div data-testid="map-pin-icon" />,
  Users: () => <div data-testid="users-icon" />,
}));

describe('DropZone', () => {
  let mockTarget: DropTarget;
  let mockOnDrop: jest.Mock;
  let mockOnDragOver: jest.Mock;
  let mockOnDragLeave: jest.Mock;
  let mockDragItem: DragItem;

  beforeEach(() => {
    mockTarget = {
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '11:00'
    };

    mockOnDrop = jest.fn();
    mockOnDragOver = jest.fn();
    mockOnDragLeave = jest.fn();

    mockDragItem = {
      type: 'appointment',
      id: 'test-appointment-1',
      data: {},
      startTime: '10:00',
      endTime: '11:00',
      date: '2024-01-15'
    };
  });

  test('should render children correctly', () => {
    render(
      <DropZone
        target={mockTarget}
        onDrop={mockOnDrop}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
      >
        <div>Test Content</div>
      </DropZone>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('should apply default styling', () => {
    render(
      <DropZone
        target={mockTarget}
        onDrop={mockOnDrop}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
      >
        <div>Test Content</div>
      </DropZone>
    );

    const dropZone = screen.getByText('Test Content').parentElement!;
    expect(dropZone).toHaveClass('border-transparent');
  });

  test('should apply active styling when isActive is true', () => {
    render(
      <DropZone
        target={mockTarget}
        onDrop={mockOnDrop}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
        isActive={true}
      >
        <div>Test Content</div>
      </DropZone>
    );

    const dropZone = screen.getByText('Test Content').parentElement!;
    expect(dropZone).toHaveClass('bg-blue-50');
  });

  test('should apply drag-over styling when canDrop is true', () => {
    render(
      <DropZone
        target={mockTarget}
        onDrop={mockOnDrop}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
        canDrop={true}
      >
        <div>Test Content</div>
      </DropZone>
    );

    // Simulate drag over
    const dropZone = screen.getByText('Test Content').parentElement!;
    
    // Create a proper mock dataTransfer
    const dataTransfer = {
      getData: jest.fn(() => JSON.stringify(mockDragItem))
    };
    
    fireEvent.dragOver(dropZone, {
      dataTransfer
    });

    expect(dropZone).toHaveClass('bg-blue-100', 'border-blue-300');
  });

  test('should apply drag-over styling when canDrop is false', () => {
    render(
      <DropZone
        target={mockTarget}
        onDrop={mockOnDrop}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
        canDrop={false}
      >
        <div>Test Content</div>
      </DropZone>
    );

    // Simulate drag over
    const dropZone = screen.getByText('Test Content').parentElement!;
    
    // Create a proper mock dataTransfer
    const dataTransfer = {
      getData: jest.fn(() => JSON.stringify(mockDragItem))
    };
    
    fireEvent.dragOver(dropZone, {
      dataTransfer
    });

    expect(dropZone).toHaveClass('bg-red-100', 'border-red-300');
  });

  test('should call onDragOver when drag over event occurs', () => {
    render(
      <DropZone
        target={mockTarget}
        onDrop={mockOnDrop}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
      >
        <div>Test Content</div>
      </DropZone>
    );

    const dropZone = screen.getByText('Test Content').parentElement!;
    
    // Create a proper mock dataTransfer
    const dataTransfer = {
      getData: jest.fn(() => JSON.stringify(mockDragItem))
    };
    
    fireEvent.dragOver(dropZone, {
      dataTransfer
    });

    expect(mockOnDragOver).toHaveBeenCalledWith(mockDragItem, mockTarget);
  });

  test('should call onDrop when drop event occurs', () => {
    render(
      <DropZone
        target={mockTarget}
        onDrop={mockOnDrop}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
      >
        <div>Test Content</div>
      </DropZone>
    );

    const dropZone = screen.getByText('Test Content').parentElement!;
    
    // Create a proper mock dataTransfer
    const dataTransfer = {
      getData: jest.fn(() => JSON.stringify(mockDragItem))
    };
    
    fireEvent.drop(dropZone, {
      dataTransfer
    });

    expect(mockOnDrop).toHaveBeenCalledWith(mockDragItem, mockTarget);
  });

  test('should call onDragLeave when drag leave event occurs', () => {
    render(
      <DropZone
        target={mockTarget}
        onDrop={mockOnDrop}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
      >
        <div>Test Content</div>
      </DropZone>
    );

    const dropZone = screen.getByText('Test Content').parentElement!;
    
    // Create a proper mock dataTransfer
    const dataTransfer = {
      getData: jest.fn(() => JSON.stringify(mockDragItem))
    };
    
    // First, simulate drag over to set the drag item
    fireEvent.dragOver(dropZone, {
      dataTransfer
    });
    
    // Create a related target that's outside the drop zone
    const relatedTarget = document.createElement('div');
    document.body.appendChild(relatedTarget);
    
    // Now simulate drag leave
    fireEvent.dragLeave(dropZone, {
      relatedTarget,
      dataTransfer
    });

    expect(mockOnDragLeave).toHaveBeenCalledWith(mockDragItem, mockTarget);
    
    // Clean up
    document.body.removeChild(relatedTarget);
  });

  test('should show time indicator when showTimeIndicator is true', () => {
    render(
      <DropZone
        target={mockTarget}
        onDrop={mockOnDrop}
        onDragOver={mockOnDragOver}
        onDragLeave={mockOnDragLeave}
        showTimeIndicator={true}
        timeLabel="10:00"
      >
        <div>Test Content</div>
      </DropZone>
    );

    expect(screen.getByText('10:00')).toBeInTheDocument();
  });
});