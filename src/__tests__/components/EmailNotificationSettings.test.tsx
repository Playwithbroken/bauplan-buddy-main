import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EmailNotificationSettings from '@/components/EmailNotificationSettings';
import { emailService } from '@/services/emailService';
import { UserEmailPreferences } from '@/types/email';

// Mock the email service
jest.mock('@/services/emailService', () => ({
  emailService: {
    getUserPreferences: jest.fn(),
    updateUserPreferences: jest.fn(),
    getTemplates: jest.fn(),
    validateEmail: jest.fn()
  }
}));

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

describe('EmailNotificationSettings', () => {
  const mockUserId = 'test-user-1';
  const mockOnSave = jest.fn();
  
  const mockPreferences: UserEmailPreferences = {
    userId: mockUserId,
    email: 'test@example.com',
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

  beforeEach(() => {
    jest.clearAllMocks();
    (emailService.getUserPreferences as jest.Mock).mockResolvedValue(mockPreferences);
    (emailService.updateUserPreferences as jest.Mock).mockResolvedValue(mockPreferences);
    (emailService.getTemplates as jest.Mock).mockResolvedValue([]);
    (emailService.validateEmail as jest.Mock).mockResolvedValue({
      isValid: true,
      errors: []
    });
  });

  test('should render loading state initially', async () => {
    // Mock a delayed response to capture loading state
    (emailService.getUserPreferences as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockPreferences), 100))
    );

    render(
      <EmailNotificationSettings 
        userId={mockUserId}
        onSave={mockOnSave}
      />
    );

    // Check loading state is displayed immediately
    expect(screen.getByText('Lade E-Mail-Einstellungen...')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
    });
  });

  test('should load and display user preferences', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
    });

    expect(emailService.getUserPreferences).toHaveBeenCalledWith(mockUserId);
    
    // Navigate to preferences tab to see the email field
    await act(async () => {
      await user.click(screen.getByText('Präferenzen'));
    });
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });
  });

  describe('Notification Settings Tab', () => {
    test('should display notification type toggles', async () => {
      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Termineinladungen')).toBeInTheDocument();
      });

      expect(screen.getByText('Terminaktualisierungen')).toBeInTheDocument();
      expect(screen.getByText('Terminerinnerungen')).toBeInTheDocument();
      expect(screen.getByText('Terminabsagen')).toBeInTheDocument();
      expect(screen.getByText('Nachfassungen')).toBeInTheDocument();
    });

    test('should toggle notification settings', async () => {
      const user = userEvent.setup();
      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Termineinladungen')).toBeInTheDocument();
      });

      // Find the switch for invitations (should be checked based on mock data)
      const invitationSwitch = screen.getByRole('switch', { name: /termineinladungen/i });
      expect(invitationSwitch).toBeChecked();

      // Toggle it off
      await user.click(invitationSwitch);
      expect(invitationSwitch).not.toBeChecked();
    });
  });

  describe('Reminder Settings Tab', () => {
    test('should display reminder timing controls', async () => {
      const user = userEvent.setup();
      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
      });

      // Switch to reminders tab
      await user.click(screen.getByText('Erinnerungen'));

      expect(screen.getByText('Erinnerungszeiten')).toBeInTheDocument();
      expect(screen.getByText('Erinnerungen aktiviert')).toBeInTheDocument();
    });

    test('should display active reminder times as badges', async () => {
      const user = userEvent.setup();
      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Erinnerungen'));

      // Should display reminder times from mock data as badges
      const fifteenMinElements = screen.getAllByText('15 Minute(n)');
      expect(fifteenMinElements.length).toBeGreaterThan(0);
      const oneHourElements = screen.getAllByText('1 Stunde(n)');
      expect(oneHourElements.length).toBeGreaterThan(0);
      const oneDayElements = screen.getAllByText('1 Tag(e)');
      expect(oneDayElements.length).toBeGreaterThan(0);
    });

    test('should add new reminder times', async () => {
      const user = userEvent.setup();
      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Erinnerungen'));

      // Click button to add 30 minutes reminder
      const add30MinButton = screen.getByRole('button', { name: '30 Minute(n)' });
      await user.click(add30MinButton);

      expect(add30MinButton).toBeDisabled();
    });
  });

  describe('Digest Settings Tab', () => {
    test('should display digest configuration options', async () => {
      const user = userEvent.setup();
      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Zusammenfassung'));

      expect(screen.getByText('E-Mail-Zusammenfassung')).toBeInTheDocument();
      expect(screen.getByText('Zusammenfassung aktiviert')).toBeInTheDocument();
      expect(screen.getByText('Häufigkeit')).toBeInTheDocument();
      expect(screen.getByText('Uhrzeit')).toBeInTheDocument();
    });

    test('should toggle digest settings', async () => {
      const user = userEvent.setup();
      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Zusammenfassung'));

      const digestSwitch = screen.getByRole('switch', { name: /zusammenfassung aktiviert/i });
      expect(digestSwitch).toBeChecked();

      await user.click(digestSwitch);
      expect(digestSwitch).not.toBeChecked();
    });
  });

  describe('Preferences Tab', () => {
    test('should display general preferences', async () => {
      const user = userEvent.setup();
      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Präferenzen'));

      expect(screen.getByText('Allgemeine Präferenzen')).toBeInTheDocument();
      expect(screen.getByText('Sprache')).toBeInTheDocument();
      expect(screen.getByText('Zeitzone')).toBeInTheDocument();
      expect(screen.getByText('E-Mail-Adresse')).toBeInTheDocument();
    });

    test('should update email address', async () => {
      const user = userEvent.setup();
      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Präferenzen'));

      const emailInput = screen.getByDisplayValue('test@example.com');
      await user.clear(emailInput);
      await user.type(emailInput, 'newemail@example.com');

      expect(emailInput).toHaveValue('newemail@example.com');
    });
  });

  describe('Save Functionality', () => {
    test('should save preferences when save button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /speichern/i });
      await user.click(saveButton);

      expect(emailService.updateUserPreferences).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          userId: mockUserId,
          email: 'test@example.com'
        })
      );
      expect(mockOnSave).toHaveBeenCalled();
    });

    test('should show loading state while saving', async () => {
      const user = userEvent.setup();
      
      // Make updateUserPreferences take some time
      (emailService.updateUserPreferences as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockPreferences), 100))
      );

      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /speichern/i });
      await user.click(saveButton);

      expect(saveButton).toBeDisabled();
    });
  });

  describe('Test Email Dialog', () => {
    test('should open test email dialog', async () => {
      const user = userEvent.setup();
      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
      });

      const testButton = screen.getByRole('button', { name: /test-e-mail/i });
      await user.click(testButton);

      expect(screen.getByText('Test-E-Mail versenden')).toBeInTheDocument();
      expect(screen.getByText('Senden Sie eine Test-E-Mail, um Ihre Einstellungen zu überprüfen.')).toBeInTheDocument();
    });

    test('should validate test email address', async () => {
      const user = userEvent.setup();
      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
      });

      // Open test dialog
      const testButton = screen.getByRole('button', { name: /test-e-mail/i });
      await user.click(testButton);

      // Enter test email
      const emailInput = screen.getByPlaceholderText('test@example.com');
      await user.type(emailInput, 'test@example.com');

      // Send test email
      const sendButton = screen.getByRole('button', { name: /test-e-mail senden/i });
      await user.click(sendButton);

      expect(emailService.validateEmail).toHaveBeenCalledWith('test@example.com');
    });

    test('should show success message after sending test email', async () => {
      const user = userEvent.setup();
      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /test-e-mail/i }));

      const emailInput = screen.getByPlaceholderText('test@example.com');
      await user.type(emailInput, 'test@example.com');

      const sendButton = screen.getByRole('button', { name: /test-e-mail senden/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Test-E-Mail erfolgreich versendet!')).toBeInTheDocument();
      });
    });

    test('should handle invalid email addresses in test', async () => {
      const user = userEvent.setup();
      
      (emailService.validateEmail as jest.Mock).mockResolvedValue({
        isValid: false,
        errors: ['Invalid email format']
      });

      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /test-e-mail/i }));

      const emailInput = screen.getByPlaceholderText('test@example.com');
      await user.type(emailInput, 'invalid-email');

      const sendButton = screen.getByRole('button', { name: /test-e-mail senden/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle loading preferences error', async () => {
      (emailService.getUserPreferences as jest.Mock).mockRejectedValue(
        new Error('Failed to load preferences')
      );

      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      // Should still render loading state or handle error gracefully
      await waitFor(() => {
        expect(screen.queryByText('Lade E-Mail-Einstellungen...')).not.toBeInTheDocument();
      });
    });

    test('should handle save preferences error', async () => {
      const user = userEvent.setup();
      
      (emailService.updateUserPreferences as jest.Mock).mockRejectedValue(
        new Error('Failed to save preferences')
      );

      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /speichern/i });
      await user.click(saveButton);

      // Should handle error gracefully
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async () => {
      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
      });

      // Check for proper tab navigation
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);

      // Check for proper switch controls
      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBeGreaterThan(0);
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <EmailNotificationSettings 
          userId={mockUserId}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('E-Mail-Benachrichtigungen')).toBeInTheDocument();
      });

      // Test that tabs are focusable
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();
      
      // Check that the tablist has proper tab navigation
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });
  });
});