import { renderHook, act } from '@testing-library/react';
import { useCalendarInvites } from '@/hooks/useCalendarInvites';
import { CalendarInviteService } from '@/services/calendarInviteService';
import { emailService } from '@/services/emailService';
import { StoredAppointment } from '@/services/appointmentService';
import { EmailRecipient } from '@/types/email';

// Mock dependencies
jest.mock('@/services/calendarInviteService');
jest.mock('@/services/emailService');
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

// Mock URL.createObjectURL and related functions
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document methods
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    href: '',
    download: '',
    click: jest.fn(),
    style: { display: '' }
  }))
});

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn()
});

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn()
});

describe('useCalendarInvites', () => {
  let mockAppointment: StoredAppointment;
  let mockRecipients: EmailRecipient[];
  let mockOrganizer: { name: string; email: string };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAppointment = {
      id: 'test-appointment-1',
      title: 'Test Meeting',
      description: 'A test meeting',
      type: 'meeting' as const,
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '11:00',
      location: 'Conference Room A',
      projectId: 'project-1',
      attendees: ['john@example.com'],
      teamMembers: ['team1'],
      equipment: ['projector'],
      priority: 'medium' as const,
      customerNotification: true,
      reminderTime: '15',
      isRecurring: false,
      recurrencePattern: {
        type: 'none' as const,
        interval: 1,
        endDate: undefined,
        occurrences: undefined,
        dayOfWeek: undefined,
        dayOfMonth: undefined,
        weekDay: undefined
      },
      emailNotifications: {
        enabled: true,
        sendInvitations: true,
        sendReminders: true,
        recipients: [],
        customMessage: ''
      }
    };

    mockRecipients = [
      {
        email: 'john@example.com',
        name: 'John Doe',
        role: 'required'
      }
    ];

    mockOrganizer = {
      name: 'Test Organizer',
      email: 'organizer@example.com'
    };

    // Mock CalendarInviteService
    (CalendarInviteService.generateCalendarInvite as jest.Mock).mockReturnValue({
      content: 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR',
      filename: 'test-appointment.ics',
      mimeType: 'text/calendar'
    });

    // Mock emailService
    (emailService.sendInvitationEmail as jest.Mock).mockResolvedValue({
      success: true,
      messageId: 'mock-message-id'
    });
  });

  describe('Hook Initialization', () => {
    test('should initialize with default state', () => {
      const { result } = renderHook(() => useCalendarInvites());

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.isSending).toBe(false);
      expect(result.current.lastGeneratedInvite).toBeNull();
      expect(typeof result.current.generateInvite).toBe('function');
      expect(typeof result.current.generateAndSendInvite).toBe('function');
      expect(typeof result.current.downloadInvite).toBe('function');
      expect(typeof result.current.validateInviteData).toBe('function');
    });
  });

  describe('Generate Invite', () => {
    test('should generate calendar invite successfully', async () => {
      const { result } = renderHook(() => useCalendarInvites());

      await act(async () => {
        const invite = await result.current.generateInvite(
          mockAppointment,
          mockOrganizer,
          mockRecipients
        );

        expect(invite).toBeDefined();
        expect(invite.content).toContain('BEGIN:VCALENDAR');
        expect(invite.filename).toBe('test-appointment.ics');
      });

      expect(CalendarInviteService.generateCalendarInvite).toHaveBeenCalledWith(
        mockAppointment,
        'REQUEST',
        mockOrganizer,
        mockRecipients,
        expect.any(Object)
      );

      expect(result.current.lastGeneratedInvite).toBeDefined();
      expect(result.current.isGenerating).toBe(false);
    });

    test('should handle different invite methods', async () => {
      const { result } = renderHook(() => useCalendarInvites());

      await act(async () => {
        await result.current.generateInvite(
          mockAppointment,
          mockOrganizer,
          mockRecipients,
          { method: 'CANCEL' }
        );
      });

      expect(CalendarInviteService.generateCalendarInvite).toHaveBeenCalledWith(
        mockAppointment,
        'CANCEL',
        mockOrganizer,
        mockRecipients,
        expect.any(Object)
      );
    });

    test('should set generating state during generation', async () => {
      const { result } = renderHook(() => useCalendarInvites());

      let generatingState: boolean;

      await act(async () => {
        const promise = result.current.generateInvite(
          mockAppointment,
          mockOrganizer,
          mockRecipients
        );

        generatingState = result.current.isGenerating;
        await promise;
      });

      expect(generatingState).toBe(true);
      expect(result.current.isGenerating).toBe(false);
    });

    test('should handle generation errors', async () => {
      const { result } = renderHook(() => useCalendarInvites());

      (CalendarInviteService.generateCalendarInvite as jest.Mock).mockImplementation(() => {
        throw new Error('Generation failed');
      });

      await act(async () => {
        const invite = await result.current.generateInvite(
          mockAppointment,
          mockOrganizer,
          mockRecipients
        );

        expect(invite).toBeNull();
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.lastGeneratedInvite).toBeNull();
    });
  });

  describe('Generate and Send Invite', () => {
    test('should generate and send invite successfully', async () => {
      const { result } = renderHook(() => useCalendarInvites());

      await act(async () => {
        const success = await result.current.generateAndSendInvite(
          mockAppointment,
          mockRecipients,
          {
            organizer: mockOrganizer,
            method: 'REQUEST'
          }
        );

        expect(success).toBe(true);
      });

      expect(CalendarInviteService.generateCalendarInvite).toHaveBeenCalled();
      expect(emailService.sendInvitationEmail).toHaveBeenCalledWith(
        mockAppointment,
        mockRecipients,
        expect.objectContaining({
          calendarInvite: expect.any(Object)
        })
      );
    });

    test('should handle send errors', async () => {
      const { result } = renderHook(() => useCalendarInvites());

      (emailService.sendInvitationEmail as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Send failed'
      });

      await act(async () => {
        const success = await result.current.generateAndSendInvite(
          mockAppointment,
          mockRecipients,
          { organizer: mockOrganizer }
        );

        expect(success).toBe(false);
      });
    });

    test('should set sending state during send operation', async () => {
      const { result } = renderHook(() => useCalendarInvites());

      let sendingState: boolean;

      await act(async () => {
        const promise = result.current.generateAndSendInvite(
          mockAppointment,
          mockRecipients,
          { organizer: mockOrganizer }
        );

        sendingState = result.current.isSending;
        await promise;
      });

      expect(sendingState).toBe(true);
      expect(result.current.isSending).toBe(false);
    });
  });

  describe('Download Invite', () => {
    test('should download generated invite', async () => {
      const { result } = renderHook(() => useCalendarInvites());

      // First generate an invite
      await act(async () => {
        await result.current.generateInvite(
          mockAppointment,
          mockOrganizer,
          mockRecipients
        );
      });

      // Then download it
      act(() => {
        result.current.downloadInvite();
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    test('should handle download when no invite is generated', () => {
      const { result } = renderHook(() => useCalendarInvites());

      act(() => {
        result.current.downloadInvite();
      });

      expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    });

    test('should download with custom filename', async () => {
      const { result } = renderHook(() => useCalendarInvites());

      await act(async () => {
        await result.current.generateInvite(
          mockAppointment,
          mockOrganizer,
          mockRecipients
        );
      });

      act(() => {
        result.current.downloadInvite('custom-filename.ics');
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Validate Invite Data', () => {
    test('should validate complete appointment data', () => {
      const { result } = renderHook(() => useCalendarInvites());

      const validation = result.current.validateInviteData(
        mockAppointment,
        mockOrganizer,
        mockRecipients
      );

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    test('should detect missing required fields', () => {
      const { result } = renderHook(() => useCalendarInvites());

      const incompleteAppointment = {
        ...mockAppointment,
        title: '',
        date: ''
      };

      const validation = result.current.validateInviteData(
        incompleteAppointment,
        mockOrganizer,
        mockRecipients
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('Appointment title is required');
      expect(validation.errors).toContain('Appointment date is required');
    });

    test('should validate organizer information', () => {
      const { result } = renderHook(() => useCalendarInvites());

      const invalidOrganizer = {
        name: '',
        email: 'invalid-email'
      };

      const validation = result.current.validateInviteData(
        mockAppointment,
        invalidOrganizer,
        mockRecipients
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Organizer name is required');
      expect(validation.errors).toContain('Valid organizer email is required');
    });

    test('should validate recipient emails', () => {
      const { result } = renderHook(() => useCalendarInvites());

      const invalidRecipients = [
        {
          email: 'invalid-email',
          name: 'Test User',
          role: 'required' as const
        }
      ];

      const validation = result.current.validateInviteData(
        mockAppointment,
        mockOrganizer,
        invalidRecipients
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid recipient email: invalid-email');
    });

    test('should validate time format', () => {
      const { result } = renderHook(() => useCalendarInvites());

      const invalidTimeAppointment = {
        ...mockAppointment,
        startTime: '25:00',
        endTime: '26:00'
      };

      const validation = result.current.validateInviteData(
        invalidTimeAppointment,
        mockOrganizer,
        mockRecipients
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid start time format');
      expect(validation.errors).toContain('Invalid end time format');
    });

    test('should validate date format', () => {
      const { result } = renderHook(() => useCalendarInvites());

      const invalidDateAppointment = {
        ...mockAppointment,
        date: 'invalid-date'
      };

      const validation = result.current.validateInviteData(
        invalidDateAppointment,
        mockOrganizer,
        mockRecipients
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid date format');
    });

    test('should validate that end time is after start time', () => {
      const { result } = renderHook(() => useCalendarInvites());

      const invalidTimeOrderAppointment = {
        ...mockAppointment,
        startTime: '15:00',
        endTime: '14:00'
      };

      const validation = result.current.validateInviteData(
        invalidTimeOrderAppointment,
        mockOrganizer,
        mockRecipients
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('End time must be after start time');
    });
  });

  describe('Hook State Management', () => {
    test('should maintain separate state for multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useCalendarInvites());
      const { result: result2 } = renderHook(() => useCalendarInvites());

      expect(result1.current.isGenerating).toBe(false);
      expect(result2.current.isGenerating).toBe(false);

      act(() => {
        result1.current.generateInvite(mockAppointment, mockOrganizer, mockRecipients);
      });

      expect(result1.current.isGenerating).toBe(true);
      expect(result2.current.isGenerating).toBe(false);
    });

    test('should reset state properly', async () => {
      const { result } = renderHook(() => useCalendarInvites());

      await act(async () => {
        await result.current.generateInvite(
          mockAppointment,
          mockOrganizer,
          mockRecipients
        );
      });

      expect(result.current.lastGeneratedInvite).toBeDefined();

      // Generate new invite should replace the previous one
      await act(async () => {
        await result.current.generateInvite(
          { ...mockAppointment, id: 'different-id' },
          mockOrganizer,
          mockRecipients
        );
      });

      expect(result.current.lastGeneratedInvite?.content).toContain('BEGIN:VCALENDAR');
    });
  });

  describe('Error Recovery', () => {
    test('should recover from generation errors', async () => {
      const { result } = renderHook(() => useCalendarInvites());

      // First call fails
      (CalendarInviteService.generateCalendarInvite as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Generation failed');
      });

      await act(async () => {
        const invite = await result.current.generateInvite(
          mockAppointment,
          mockOrganizer,
          mockRecipients
        );
        expect(invite).toBeNull();
      });

      // Reset mock to succeed
      (CalendarInviteService.generateCalendarInvite as jest.Mock).mockReturnValue({
        content: 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR',
        filename: 'test-appointment.ics',
        mimeType: 'text/calendar'
      });

      // Second call should succeed
      await act(async () => {
        const invite = await result.current.generateInvite(
          mockAppointment,
          mockOrganizer,
          mockRecipients
        );
        expect(invite).toBeDefined();
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.lastGeneratedInvite).toBeDefined();
    });

    test('should recover from send errors', async () => {
      const { result } = renderHook(() => useCalendarInvites());

      // First send fails
      (emailService.sendInvitationEmail as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Send failed'
      });

      await act(async () => {
        const success = await result.current.generateAndSendInvite(
          mockAppointment,
          mockRecipients,
          { organizer: mockOrganizer }
        );
        expect(success).toBe(false);
      });

      // Reset mock to succeed
      (emailService.sendInvitationEmail as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'mock-message-id'
      });

      // Second send should succeed
      await act(async () => {
        const success = await result.current.generateAndSendInvite(
          mockAppointment,
          mockRecipients,
          { organizer: mockOrganizer }
        );
        expect(success).toBe(true);
      });

      expect(result.current.isSending).toBe(false);
    });
  });
});