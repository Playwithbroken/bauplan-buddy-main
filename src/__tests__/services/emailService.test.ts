import { EmailService } from '@/services/emailService';
import { EmailTemplateService } from '@/services/emailTemplateService';
import { CalendarInviteService } from '@/services/calendarInviteService';
import {
  EmailServiceConfig,
  EmailProvider,
  UserEmailPreferences,
  EmailTemplate,
  EmailRecipient,
  EmailValidationResult,
  EmailSendResult
} from '@/types/email';
import { StoredAppointment } from '@/services/appointmentService';

// Mock dependencies
jest.mock('@/services/emailTemplateService');
jest.mock('@/services/calendarInviteService');

describe('EmailService', () => {
  let emailService: EmailService;
  let mockAppointment: StoredAppointment;
  let mockRecipients: EmailRecipient[];
  let mockConfig: EmailServiceConfig;

  beforeEach(() => {
    emailService = new EmailService();
    
    mockAppointment = {
      id: 'test-appointment-1',
      title: 'Test Appointment',
      description: 'A test appointment for unit testing',
      type: 'meeting' as const,
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '11:00',
      location: 'Conference Room A',
      projectId: 'project-1',
      attendees: ['john@example.com', 'jane@example.com'],
      teamMembers: ['team1', 'team2'],
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
      },
      {
        email: 'jane@example.com',
        name: 'Jane Smith',
        role: 'optional'
      }
    ];

    mockConfig = {
      enabled: true,
      provider: {
        provider: 'smtp' as EmailProvider,
        host: 'smtp.example.com',
        port: 587,
        secure: true,
        username: 'test@example.com',
        password: 'password123',
        fromEmail: 'noreply@bauplan-buddy.com',
        fromName: 'Bauplan Buddy',
        replyTo: 'support@bauplan-buddy.com',
        maxRetries: 3,
        timeout: 30000
      },
      rateLimits: {
        maxPerMinute: 60,
        maxPerHour: 1000,
        maxPerDay: 10000
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
        maxDelay: 30000
      },
      monitoring: {
        trackOpens: true,
        trackClicks: true,
        logLevel: 'info',
        webhookUrl: 'https://example.com/webhook'
      }
    };
  });

  describe('Configuration Management', () => {
    test('should configure email service with valid config', async () => {
      await expect(emailService.configure(mockConfig)).resolves.toBeUndefined();
      expect(emailService.getConfig()).toEqual(mockConfig);
    });

    test('should validate required configuration fields', async () => {
      const invalidConfig = { ...mockConfig };
      invalidConfig.provider.fromEmail = '';
      
      await expect(emailService.configure(invalidConfig)).rejects.toThrow();
    });

    test('should return default config when not configured', () => {
      const defaultConfig = emailService.getConfig();
      expect(defaultConfig.enabled).toBe(false);
      expect(defaultConfig.provider.provider).toBe('smtp');
    });
  });

  describe('Email Validation', () => {
    test('should validate correct email addresses', async () => {
      const result = await emailService.validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject invalid email addresses', async () => {
      const result = await emailService.validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate multiple email addresses', async () => {
      const emails = ['valid@example.com', 'invalid-email', 'another@valid.com'];
      const results = await emailService.validateEmails(emails);
      
      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
      expect(results[2].isValid).toBe(true);
    });
  });

  describe('Template Management', () => {
    test('should retrieve available templates', async () => {
      const mockTemplates: EmailTemplate[] = [
        {
          id: 'invitation',
          name: 'Appointment Invitation',
          description: 'Template for appointment invitations',
          subject: 'Einladung: {{appointmentTitle}}',
          textContent: 'Sie sind eingeladen zu {{appointmentTitle}}',
          htmlContent: '<p>Sie sind eingeladen zu {{appointmentTitle}}</p>',
          type: 'invitation',
          variables: ['appointmentTitle', 'appointmentDate', 'recipientName'],
          isActive: true,
          language: 'de',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      (EmailTemplateService.getTemplates as jest.Mock).mockResolvedValue(mockTemplates);

      const templates = await emailService.getTemplates();
      expect(templates).toEqual(mockTemplates);
      expect(EmailTemplateService.getTemplates).toHaveBeenCalled();
    });

    test('should get specific template by ID', async () => {
      const mockTemplate: EmailTemplate = {
        id: 'invitation',
        name: 'Appointment Invitation',
        description: 'Template for appointment invitations',
        subject: 'Einladung: {{appointmentTitle}}',
        textContent: 'Sie sind eingeladen zu {{appointmentTitle}}',
        htmlContent: '<p>Sie sind eingeladen zu {{appointmentTitle}}</p>',
        type: 'invitation',
        variables: ['appointmentTitle', 'appointmentDate', 'recipientName'],
        isActive: true,
        language: 'de',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      (EmailTemplateService.getTemplate as jest.Mock).mockResolvedValue(mockTemplate);

      const template = await emailService.getTemplate('invitation');
      expect(template).toEqual(mockTemplate);
      expect(EmailTemplateService.getTemplate).toHaveBeenCalledWith('invitation');
    });
  });

  describe('User Preferences', () => {
    test('should get user email preferences', async () => {
      const mockPreferences: UserEmailPreferences = {
        userId: 'user-1',
        email: 'user@example.com',
        notifications: {
          invitations: true,
          updates: true,
          reminders: true,
          cancellations: true,
          followUps: false
        },
        reminderTiming: {
          enabled: true,
          times: [15, 60, 1440]
        },
        digestSettings: {
          enabled: true,
          frequency: 'weekly',
          time: '08:00',
          includeCompleted: false
        },
        language: 'de',
        timezone: 'Europe/Berlin'
      };

      // Mock localStorage
      const localStorageMock = {
        getItem: jest.fn().mockReturnValue(JSON.stringify(mockPreferences))
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      const preferences = await emailService.getUserPreferences('user-1');
      expect(preferences).toEqual(mockPreferences);
    });

    test('should update user email preferences', async () => {
      const mockPreferences: UserEmailPreferences = {
        userId: 'user-1',
        email: 'updated@example.com',
        notifications: {
          invitations: false,
          updates: true,
          reminders: true,
          cancellations: true,
          followUps: true
        },
        reminderTiming: {
          enabled: true,
          times: [30, 120]
        },
        digestSettings: {
          enabled: false,
          frequency: 'daily',
          time: '09:00',
          includeCompleted: true
        },
        language: 'en',
        timezone: 'UTC'
      };

      // Mock localStorage
      const localStorageMock = {
        setItem: jest.fn(),
        getItem: jest.fn().mockReturnValue(JSON.stringify(mockPreferences))
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      const updated = await emailService.updateUserPreferences('user-1', mockPreferences);
      expect(updated).toEqual(mockPreferences);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('Calendar Invite Generation', () => {
    test('should generate calendar invite for appointment', async () => {
      const mockInvite = {
        content: 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR',
        filename: 'appointment_2024-01-15.ics',
        mimeType: 'text/calendar'
      };

      (CalendarInviteService.generateCalendarInvite as jest.Mock).mockReturnValue(mockInvite);

      const organizer = { name: 'Test Organizer', email: 'organizer@example.com' };
      const invite = await emailService.generateCalendarInvite(
        mockAppointment,
        'REQUEST',
        organizer,
        mockRecipients
      );

      expect(invite).toEqual(mockInvite);
      expect(CalendarInviteService.generateCalendarInvite).toHaveBeenCalledWith(
        mockAppointment,
        'REQUEST',
        organizer,
        mockRecipients,
        expect.any(Object)
      );
    });
  });

  describe('Email Sending', () => {
    beforeEach(() => {
      // Configure email service for sending tests
      emailService.configure(mockConfig);
    });

    test('should send invitation email with template', async () => {
      const mockTemplate = {
        subject: 'Einladung: Test Appointment',
        textContent: 'Sie sind eingeladen zu Test Appointment',
        htmlContent: '<p>Sie sind eingeladen zu Test Appointment</p>'
      };

      (EmailTemplateService.renderTemplate as jest.Mock).mockReturnValue(mockTemplate);

      const result = await emailService.sendInvitationEmail(
        mockAppointment,
        mockRecipients,
        { templateId: 'invitation' }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(EmailTemplateService.renderTemplate).toHaveBeenCalled();
    });

    test('should send update notification email', async () => {
      const mockTemplate = {
        subject: 'Terminaktualisierung: Test Appointment',
        textContent: 'Ihr Termin wurde aktualisiert',
        htmlContent: '<p>Ihr Termin wurde aktualisiert</p>'
      };

      (EmailTemplateService.renderTemplate as jest.Mock).mockReturnValue(mockTemplate);

      const result = await emailService.sendUpdateNotification(
        mockAppointment,
        mockRecipients,
        { changes: ['time', 'location'] }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    test('should send cancellation email', async () => {
      const mockTemplate = {
        subject: 'Terminabsage: Test Appointment',
        textContent: 'Ihr Termin wurde abgesagt',
        htmlContent: '<p>Ihr Termin wurde abgesagt</p>'
      };

      (EmailTemplateService.renderTemplate as jest.Mock).mockReturnValue(mockTemplate);

      const result = await emailService.sendCancellationEmail(
        mockAppointment,
        mockRecipients,
        { reason: 'Scheduling conflict' }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    test('should send reminder email', async () => {
      const mockTemplate = {
        subject: 'Erinnerung: Test Appointment',
        textContent: 'Erinnerung an Ihren Termin',
        htmlContent: '<p>Erinnerung an Ihren Termin</p>'
      };

      (EmailTemplateService.renderTemplate as jest.Mock).mockReturnValue(mockTemplate);

      const result = await emailService.sendReminderEmail(
        mockAppointment,
        mockRecipients,
        { reminderTime: 60 }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    test('should handle email sending errors gracefully', async () => {
      const invalidConfig = { ...mockConfig };
      invalidConfig.provider.host = '';
      await emailService.configure(invalidConfig);

      const result = await emailService.sendInvitationEmail(
        mockAppointment,
        mockRecipients
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    test('should respect rate limits', async () => {
      const limitedConfig = { ...mockConfig };
      limitedConfig.rateLimits.maxPerMinute = 1;
      await emailService.configure(limitedConfig);

      // First email should succeed
      const result1 = await emailService.sendInvitationEmail(
        mockAppointment,
        [mockRecipients[0]]
      );
      expect(result1.success).toBe(true);

      // Second email within the same minute should be rate limited
      const result2 = await emailService.sendInvitationEmail(
        mockAppointment,
        [mockRecipients[1]]
      );
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('rate limit');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid appointment data', async () => {
      const invalidAppointment = { ...mockAppointment };
      invalidAppointment.title = '';

      await expect(
        emailService.sendInvitationEmail(invalidAppointment, mockRecipients)
      ).rejects.toThrow();
    });

    test('should handle empty recipient list', async () => {
      const result = await emailService.sendInvitationEmail(
        mockAppointment,
        []
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No recipients');
    });

    test('should handle service not configured', async () => {
      const unconfiguredService = new EmailService();
      
      const result = await unconfiguredService.sendInvitationEmail(
        mockAppointment,
        mockRecipients
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });
  });

  describe('Backward Compatibility Alias Methods', () => {
    beforeEach(() => {
      emailService.configure(mockConfig);
    });

    test('sendInvitationEmail should delegate to sendAppointmentInvitation', async () => {
      const sendAppointmentInvitationSpy = jest.spyOn(emailService, 'sendAppointmentInvitation');
      sendAppointmentInvitationSpy.mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
        timestamp: new Date().toISOString()
      });

      const result = await emailService.sendInvitationEmail(
        mockAppointment,
        mockRecipients,
        { templateId: 'custom-template' }
      );

      expect(result.success).toBe(true);
      expect(sendAppointmentInvitationSpy).toHaveBeenCalledWith(mockAppointment, mockRecipients);
      
      sendAppointmentInvitationSpy.mockRestore();
    });

    test('sendCancellationEmail should delegate to sendAppointmentCancellation', async () => {
      const sendAppointmentCancellationSpy = jest.spyOn(emailService, 'sendAppointmentCancellation');
      sendAppointmentCancellationSpy.mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
        timestamp: new Date().toISOString()
      });

      const result = await emailService.sendCancellationEmail(
        mockAppointment,
        mockRecipients,
        { reason: 'Test cancellation reason' }
      );

      expect(result.success).toBe(true);
      expect(sendAppointmentCancellationSpy).toHaveBeenCalledWith(
        mockAppointment,
        mockRecipients,
        'Test cancellation reason'
      );
      
      sendAppointmentCancellationSpy.mockRestore();
    });

    test('sendReminderEmail should delegate to sendAppointmentReminder', async () => {
      const sendAppointmentReminderSpy = jest.spyOn(emailService, 'sendAppointmentReminder');
      sendAppointmentReminderSpy.mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
        timestamp: new Date().toISOString()
      });

      const result = await emailService.sendReminderEmail(
        mockAppointment,
        mockRecipients,
        { reminderTime: 30 }
      );

      expect(result.success).toBe(true);
      expect(sendAppointmentReminderSpy).toHaveBeenCalledWith(
        mockAppointment,
        mockRecipients,
        30
      );
      
      sendAppointmentReminderSpy.mockRestore();
    });

    test('alias methods should handle validation errors correctly', async () => {
      // Test sendInvitationEmail with empty title
      const invalidAppointment = { ...mockAppointment, title: '' };
      
      await expect(
        emailService.sendInvitationEmail(invalidAppointment, mockRecipients)
      ).rejects.toThrow('Appointment title is required');

      // Test sendInvitationEmail with empty recipients
      const result = await emailService.sendInvitationEmail(mockAppointment, []);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No recipients');
    });

    test('alias methods should preserve original method signatures', () => {
      // Verify method signatures exist and are callable
      expect(typeof emailService.sendInvitationEmail).toBe('function');
      expect(typeof emailService.sendCancellationEmail).toBe('function');
      expect(typeof emailService.sendReminderEmail).toBe('function');

      // Verify they accept the expected parameters
      expect(emailService.sendInvitationEmail.length).toBe(3); // appointment, recipients, options?
      expect(emailService.sendCancellationEmail.length).toBe(3); // appointment, recipients, options?
      expect(emailService.sendReminderEmail.length).toBe(3); // appointment, recipients, options?
    });
  });
});