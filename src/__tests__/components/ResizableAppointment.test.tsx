// ResizableAppointment.test.tsx
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ResizableAppointment from '@/components/ResizableAppointment';
import { StoredAppointment } from '@/services/appointmentService';
import { DragItem } from '@/types/dragAndDrop';

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  MapPin: () => <div data-testid="map-pin-icon" />,
  Users: () => <div data-testid="users-icon" />,
  GripVertical: () => <div data-testid="grip-vertical-icon" />,
  Pencil: () => <div data-testid="pencil-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
}));

// Mock DraggableAppointment since it's used internally
jest.mock('@/components/DraggableAppointment', () => {
  return function MockDraggableAppointment(props: {
    appointment: StoredAppointment;
    onEdit: (appointment: StoredAppointment) => void;
    onDelete: (id: string) => void;
  }) {
    return (
      <div data-testid="draggable-appointment">
        <div>{props.appointment.title}</div>
        <button onClick={() => props.onEdit(props.appointment)}>Edit</button>
        <button onClick={() => props.onDelete(props.appointment.id)}>Delete</button>
      </div>
    );
  };
});

describe('ResizableAppointment', () => {
  let mockAppointment: StoredAppointment;
  let mockOnEdit: jest.Mock;
  let mockOnDelete: jest.Mock;
  let mockOnResizeStart: jest.Mock;
  let mockOnResizeEnd: jest.Mock;
  let mockOnDragStart: jest.Mock;
  let mockOnDragEnd: jest.Mock;

  beforeEach(() => {
    mockAppointment = {
      id: 'test-appointment-1',
      title: 'Test Appointment',
      description: 'Test description',
      type: 'meeting',
      status: 'confirmed',
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '11:00',
      location: 'Test Location',
      projectId: 'project-1',
      attendees: ['test@example.com'],
      teamMembers: ['team1'],
      equipment: ['equipment1'],
      priority: 'medium',
      customerNotification: true,
      reminderTime: '15',
      isRecurring: false,
      recurrencePattern: {
        type: 'none',
        interval: 1,
        endType: 'never'
      },
      emailNotifications: {
        enabled: true,
        sendInvitations: true,
        sendReminders: true,
        recipients: []
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    mockOnEdit = jest.fn();
    mockOnDelete = jest.fn();
    mockOnResizeStart = jest.fn();
    mockOnResizeEnd = jest.fn();
    mockOnDragStart = jest.fn();
    mockOnDragEnd = jest.fn();
  });

  test('should render draggable appointment correctly', () => {
    render(
      <ResizableAppointment
        appointment={mockAppointment}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onResizeStart={mockOnResizeStart}
        onResizeEnd={mockOnResizeEnd}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
      />
    );

    expect(screen.getByTestId('draggable-appointment')).toBeInTheDocument();
    expect(screen.getByText('Test Appointment')).toBeInTheDocument();
  });

  test('should show resize handle', () => {
    render(
      <ResizableAppointment
        appointment={mockAppointment}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onResizeStart={mockOnResizeStart}
        onResizeEnd={mockOnResizeEnd}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
      />
    );

    expect(screen.getByTestId('minus-icon')).toBeInTheDocument();
  });

  test('should call onResizeStart when resize handle is clicked', () => {
    render(
      <ResizableAppointment
        appointment={mockAppointment}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onResizeStart={mockOnResizeStart}
        onResizeEnd={mockOnResizeEnd}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
      />
    );

    const resizeHandle = screen.getByTestId('minus-icon').closest('div')!;
    fireEvent.mouseDown(resizeHandle);

    expect(mockOnResizeStart).toHaveBeenCalled();
  });

  test('should apply resizing styles when isResizing is true', () => {
    render(
      <ResizableAppointment
        appointment={mockAppointment}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onResizeStart={mockOnResizeStart}
        onResizeEnd={mockOnResizeEnd}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
        isResizing={true}
      />
    );

    const resizableElement = screen.getByTestId('draggable-appointment').closest('div')!;
    expect(resizableElement).toHaveClass('opacity-75');
  });

  test('should apply dragging styles when isDragging is true', () => {
    render(
      <ResizableAppointment
        appointment={mockAppointment}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onResizeStart={mockOnResizeStart}
        onResizeEnd={mockOnResizeEnd}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
        isDragging={true}
      />
    );

    const resizableElement = screen.getByTestId('draggable-appointment').closest('div')!;
    expect(resizableElement).toHaveClass('opacity-50', 'scale-95');
  });
});