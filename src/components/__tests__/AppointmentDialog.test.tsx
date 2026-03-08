import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppointmentDialog from '@/components/AppointmentDialog';

const queryClient = new QueryClient();
const renderWithProviders = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);

describe('AppointmentDialog autosave + undo', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('supports Ctrl+Z undo on title changes', async () => {
    renderWithProviders(<AppointmentDialog isOpen={true} onClose={() => {}} onSave={() => {}} />);

    const titleInput = screen.getByLabelText('Titel *') as HTMLInputElement;
    expect(titleInput.value).toBe('');

    fireEvent.change(titleInput, { target: { value: 'Baustellenbesichtigung' } });
    expect(titleInput.value).toBe('Baustellenbesichtigung');

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    await waitFor(() => expect(titleInput.value).toBe(''));
  });

  it('restores from autosave draft and persists changes', async () => {
    const DRAFT_KEY = 'bauplan.draft.appointmentDialog.new';
    const draft = {
      title: 'Entwurfs-Termin',
      description: 'Beschreibung Entwurf',
      type: 'meeting',
      date: '2025-10-21',
      startTime: '14:00',
      endTime: '15:00',
      location: 'Kundenbüro',
      projectId: 'no-project',
      attendees: [],
      teamMembers: [],
      equipment: [],
      priority: 'high',
      customerNotification: true,
      reminderTime: '30',
      emailNotifications: { enabled: false, sendInvitations: true, sendReminders: true, recipients: [] }
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

    renderWithProviders(<AppointmentDialog isOpen={true} onClose={() => {}} onSave={() => {}} />);

    const titleInput = screen.getByLabelText('Titel *') as HTMLInputElement;
    const locationInput = screen.getByLabelText('Ort') as HTMLInputElement;
    expect(titleInput.value).toBe('Entwurfs-Termin');
    expect(locationInput.value).toBe('Kundenbüro');

    fireEvent.change(titleInput, { target: { value: 'Geänderter Termin' } });

    await waitFor(() => {
      const saved = localStorage.getItem(DRAFT_KEY)!;
      const parsed = JSON.parse(saved);
      expect(parsed.title).toBe('Geänderter Termin');
    });
  });
});
