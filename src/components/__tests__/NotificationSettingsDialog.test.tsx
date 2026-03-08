import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationSettingsDialog from '@/components/NotificationSettingsDialog';
import { NotificationService } from '@/services/notificationService';

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() })
}));

const mockSettings = NotificationService.getDefaultSettings();

describe('NotificationSettingsDialog', () => {
  beforeEach(() => {
    jest.spyOn(NotificationService, 'getSettings').mockReturnValue(mockSettings);
    jest.spyOn(NotificationService, 'saveSettings').mockReturnValue(mockSettings);
    jest.spyOn(NotificationService, 'requestNotificationPermission').mockResolvedValue('denied');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows permission toast when browser notification permission is denied', async () => {
    render(<NotificationSettingsDialog isOpen onClose={jest.fn()} />);

    const browserToggle = await screen.findByLabelText(/browser-benachrichtigungen/i);
    fireEvent.click(browserToggle);

    fireEvent.click(screen.getByRole('button', { name: /einstellungen speichern/i }));

    await waitFor(() => {
      expect(NotificationService.requestNotificationPermission).toHaveBeenCalled();
    });
  });
});
