// DraggableAppointment.test.tsx
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DraggableAppointment from '@/components/DraggableAppointment';
import { StoredAppointment } from '@/services/appointmentService';
import { DragItem } from '@/types/dragAndDrop';

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  MapPin: () => <div data-testid="map-pin-icon" />,
  Users: () => <div data-testid="users-icon" />,
  GripVertical: (props: any) => <div data-testid="grip-vertical-icon" {...props} />,
  Pencil: () => <div data-testid="pencil-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
}));

// Mock dragDropService
jest.mock('@/services/dragDropService', () => ({
  startDrag: jest.fn().mockReturnValue({ id: 'test-drag-item', data: {} })
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

// Mock lib utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('DraggableAppointment', () => {
  let mockAppointment: StoredAppointment;
  let mockOnEdit: jest.Mock;
  let mockOnDelete: jest.Mock;
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
    mockOnDragStart = jest.fn();
    mockOnDragEnd = jest.fn();
  });

  test('should render appointment information correctly', () => {
    render(
      <DraggableAppointment
        appointment={mockAppointment}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
      />
    );

    expect(screen.getByText('Test Appointment')).toBeInTheDocument();
    expect(screen.getByText('10:00 - 11:00')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
    expect(screen.getByText('1 attendee(s)')).toBeInTheDocument();
  });

  test('should show priority indicator for high priority appointments', () => {
    const highPriorityAppointment = {
      ...mockAppointment,
      priority: 'high' as const
    };

    render(
      <DraggableAppointment
        appointment={highPriorityAppointment}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
      />
    );

    // Check for high priority indicator (red dot)
    const priorityIndicator = document.querySelector('.bg-red-500');
    expect(priorityIndicator).toBeInTheDocument();
  });

  test('should not show priority indicator for medium priority appointments', () => {
    render(
      <DraggableAppointment
        appointment={mockAppointment}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
      />
    );

    const priorityIndicator = document.querySelector('.bg-red-500');
    expect(priorityIndicator).not.toBeInTheDocument();
  });

  test('should call onEdit when edit button is clicked', () => {
    render(
      <DraggableAppointment
        appointment={mockAppointment}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
      />
    );

    const editButton = screen.getByTestId('pencil-icon').closest('button')!;
    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledWith(mockAppointment);
  });

  test('should call onDelete when delete button is clicked', () => {
    render(
      <DraggableAppointment
        appointment={mockAppointment}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
      />
    );

    const deleteButton = screen.getByTestId('trash-icon').closest('button')!;
    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith('test-appointment-1');
  });

  test('should call onDragStart when drag handle is clicked', () => {
    render(
      <DraggableAppointment
        appointment={mockAppointment}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
      />
    );

    const dragHandle = screen.getByTestId('grip-vertical-icon');
    fireEvent.mouseDown(dragHandle);

    expect(mockOnDragStart).toHaveBeenCalled();
  });

  test('should apply correct styling based on appointment type', () => {
    const { container } = render(
      <DraggableAppointment
        appointment={mockAppointment}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
      />
    );

    const appointmentElement = container.firstChild as HTMLElement;
    expect(appointmentElement).toHaveClass('bg-blue-100', 'border-blue-300');
  });

  test('should apply dragging styles when isDragging is true', () => {
    const { container } = render(
      <DraggableAppointment
        appointment={mockAppointment}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onDragStart={mockOnDragStart}
        onDragEnd={mockOnDragEnd}
        isDragging={true}
      />
    );

    const appointmentElement = container.firstChild as HTMLElement;
    expect(appointmentElement).toHaveClass('opacity-50', 'scale-95');
  });

  test('should display different appointment types with correct colors', () => {
    const testCases = [
      { type: 'site-visit', expectedClasses: ['bg-green-100', 'border-green-300'] },
      { type: 'inspection', expectedClasses: ['bg-yellow-100', 'border-yellow-300'] },
      { type: 'deadline', expectedClasses: ['bg-red-100', 'border-red-300'] },
      { type: 'other', expectedClasses: ['bg-gray-100', 'border-gray-300'] }
    ];

    testCases.forEach(({ type, expectedClasses }) => {
      const { container, unmount } = render(
        <DraggableAppointment
          appointment={{ ...mockAppointment, type: type as any }}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
        />
      );

      const appointmentElement = container.firstChild as HTMLElement;
      expectedClasses.forEach(expectedClass => {
        expect(appointmentElement).toHaveClass(expectedClass);
      });

      unmount();
    });
  });
});