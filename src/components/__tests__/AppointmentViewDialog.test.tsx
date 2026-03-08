import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppointmentViewDialog from '../AppointmentViewDialog';
import { StoredAppointment } from '../../services/appointmentService';
import { AppointmentExportService } from '../../services/appointmentExportService';
import { ToastProvider } from '../ErrorToast';

// Extend Jest matchers to include jest-dom
import '@testing-library/jest-dom';

// Mock the AppointmentExportService
jest.mock('../../services/appointmentExportService', () => ({
  AppointmentExportService: {
    exportSingleAppointment: jest.fn()
  }
}));

// Create a test utility for rendering with QueryClient
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

const renderWithQueryClient = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <ToastProvider>
        {ui}
      </ToastProvider>
    </QueryClientProvider>
  );
};

describe('AppointmentViewDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const mockAppointment: StoredAppointment = {
    id: 'APT-001',
    title: 'Test Appointment',
    description: 'Test description for the appointment',
    type: 'site-visit',
    date: '2024-03-15',
    startTime: '09:00',
    endTime: '10:00',
    location: 'Test Location, München',
    projectId: 'PRJ-001',
    attendees: ['John Doe', 'Jane Smith'],
    teamMembers: ['TM-001', 'TM-002'],
    equipment: ['EQ-001', 'EQ-002'],
    priority: 'high',
    customerNotification: true,
    reminderTime: '15',
    emailNotifications: {
      enabled: false,
      sendInvitations: false,
      sendReminders: false,
      recipients: [],
      customMessage: ''
    },
    createdAt: '2024-03-01T10:00:00.000Z',
    updatedAt: '2024-03-01T10:00:00.000Z'
  };

  const minimalAppointment: StoredAppointment = {
    id: 'APT-002',
    title: 'Minimal Appointment',
    description: '',
    type: 'meeting',
    date: '2024-03-16',
    startTime: '14:00',
    endTime: '15:00',
    location: '',
    projectId: 'no-project',
    attendees: [],
    teamMembers: [],
    equipment: [],
    priority: 'low',
    customerNotification: false,
    reminderTime: '0',
    emailNotifications: {
      enabled: false,
      sendInvitations: false,
      sendReminders: false,
      recipients: [],
      customMessage: ''
    },
    createdAt: '2024-03-02T09:00:00.000Z',
    updatedAt: '2024-03-02T09:00:00.000Z'
  };

  const defaultProps = {
    appointment: mockAppointment,
    isOpen: true,
    onClose: mockOnClose,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog when open with appointment', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      expect(screen.getByText('Test Appointment')).toBeInTheDocument();
      expect(screen.getByText('Termindetails ansehen und bearbeiten')).toBeInTheDocument();
    });

    it('should not render when appointment is null', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={null} />);
      
      expect(screen.queryByText('Test Appointment')).not.toBeInTheDocument();
    });

    it('should not render when dialog is closed', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Test Appointment')).not.toBeInTheDocument();
    });

    it('should render appointment type icon in title', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      // Building icon should be rendered for site-visit type
      const titleElement = screen.getByText('Test Appointment').closest('.flex');
      expect(titleElement).toBeInTheDocument();
    });
  });

  describe('Basic Information Display', () => {
    it('should display appointment type correctly', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      expect(screen.getByText('Baustellenbesichtigung')).toBeInTheDocument();
    });

    it('should display appointment date in German format', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      expect(screen.getByText('15.03.2024')).toBeInTheDocument();
    });

    it('should display appointment time range', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      expect(screen.getByText('09:00 - 10:00')).toBeInTheDocument();
    });

    it('should display appointment location', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      expect(screen.getByText('Test Location, München')).toBeInTheDocument();
    });

    it('should display "Nicht angegeben" for empty location', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={minimalAppointment} />);
      
      expect(screen.getByText('Nicht angegeben')).toBeInTheDocument();
    });

    it('should display appointment description', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      expect(screen.getByText('Test description for the appointment')).toBeInTheDocument();
    });

    it('should not render description section when empty', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={minimalAppointment} />);
      
      expect(screen.queryByText('Beschreibung')).not.toBeInTheDocument();
    });
  });

  describe('Priority Display', () => {
    it('should display high priority badge correctly', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      expect(screen.getByText('Hoch')).toBeInTheDocument();
    });

    it('should display low priority badge correctly', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={minimalAppointment} />);
      
      expect(screen.getByText('Niedrig')).toBeInTheDocument();
    });

    it('should apply correct CSS classes for priority', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      const priorityBadge = screen.getByText('Hoch');
      expect(priorityBadge).toHaveClass('bg-orange-100', 'text-orange-800', 'border-orange-300');
    });

    it('should handle critical priority', () => {
      const criticalAppointment = { ...mockAppointment, priority: 'critical' };
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={criticalAppointment} />);
      
      const priorityBadge = screen.getByText('Kritisch');
      expect(priorityBadge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-300');
    });
  });

  describe('Project Information', () => {
    it('should display project information when project is set', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      expect(screen.getByText('Projektinformationen')).toBeInTheDocument();
      expect(screen.getByText('PRJ-001')).toBeInTheDocument();
    });

    it('should not display project section when no project is set', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={minimalAppointment} />);
      
      expect(screen.queryByText('Projektinformationen')).not.toBeInTheDocument();
    });
  });

  describe('Attendees Display', () => {
    it('should display attendees section when attendees exist', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      expect(screen.getByText('Teilnehmer')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should not display attendees section when no attendees', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={minimalAppointment} />);
      
      expect(screen.queryByText('Teilnehmer')).not.toBeInTheDocument();
    });
  });

  describe('Team and Resources Display', () => {
    it('should display team and resources section when assigned', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      expect(screen.getByText('Team & Ressourcen')).toBeInTheDocument();
      expect(screen.getByText('Zugewiesenes Team')).toBeInTheDocument();
      expect(screen.getByText('Benötigte Ausrüstung')).toBeInTheDocument();
      expect(screen.getByText('TM-001')).toBeInTheDocument();
      expect(screen.getByText('TM-002')).toBeInTheDocument();
      expect(screen.getByText('EQ-001')).toBeInTheDocument();
      expect(screen.getByText('EQ-002')).toBeInTheDocument();
    });

    it('should not display team and resources section when none assigned', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={minimalAppointment} />);
      
      expect(screen.queryByText('Team & Ressourcen')).not.toBeInTheDocument();
    });

    it('should display only team when equipment is empty', () => {
      const appointmentWithOnlyTeam = {
        ...mockAppointment,
        equipment: []
      };
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={appointmentWithOnlyTeam} />);
      
      expect(screen.getByText('Zugewiesenes Team')).toBeInTheDocument();
      expect(screen.queryByText('Benötigte Ausrüstung')).not.toBeInTheDocument();
    });

    it('should display only equipment when team is empty', () => {
      const appointmentWithOnlyEquipment = {
        ...mockAppointment,
        teamMembers: []
      };
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={appointmentWithOnlyEquipment} />);
      
      expect(screen.queryByText('Zugewiesenes Team')).not.toBeInTheDocument();
      expect(screen.getByText('Benötigte Ausrüstung')).toBeInTheDocument();
    });
  });

  describe('Settings Display', () => {
    it('should display reminder settings', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      expect(screen.getByText('Einstellungen')).toBeInTheDocument();
      expect(screen.getByText('15 Minuten vorher')).toBeInTheDocument();
    });

    it('should display "Keine Erinnerung" when reminder is disabled', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={minimalAppointment} />);
      
      expect(screen.getByText('Keine Erinnerung')).toBeInTheDocument();
    });

    it('should display customer notification status', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      expect(screen.getByText('Ja')).toBeInTheDocument(); // Customer notification enabled
    });

    it('should display "Nein" when customer notification is disabled', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={minimalAppointment} />);
      
      expect(screen.getByText('Nein')).toBeInTheDocument(); // Customer notification disabled
    });

    it('should handle different reminder time formats', () => {
      const appointmentWithDayReminder = { ...mockAppointment, reminderTime: '1440' };
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={appointmentWithDayReminder} />);
      
      expect(screen.getByText('1 Tag vorher')).toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('should display metadata section', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      expect(screen.getByText('Metadaten')).toBeInTheDocument();
      expect(screen.getByText(/Erstellt:/)).toBeInTheDocument();
      expect(screen.getByText(/Zuletzt geändert:/)).toBeInTheDocument();
      expect(screen.getByText(/Termin-ID:/)).toBeInTheDocument();
      expect(screen.getByText('APT-001')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render all action buttons', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      expect(screen.getByText('Bearbeiten')).toBeInTheDocument();
      expect(screen.getByText('Exportieren')).toBeInTheDocument();
      expect(screen.getByText('Löschen')).toBeInTheDocument();
      expect(screen.getByText('Schließen')).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      const editButton = screen.getByText('Bearbeiten');
      await user.click(editButton);
      
      expect(mockOnEdit).toHaveBeenCalledWith(mockAppointment);
    });

    it('should call onDelete when delete button is clicked', async () => {
      // Mock window.confirm to return true
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);
      
      const user = userEvent.setup();
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      const deleteButton = screen.getByText('Löschen');
      await user.click(deleteButton);
      
      expect(mockOnDelete).toHaveBeenCalledWith('APT-001');
      
      // Restore original confirm
      window.confirm = originalConfirm;
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      const closeButton = screen.getByText('Schließen');
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Export Functionality', () => {
    it('should show export dropdown menu when export button is clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      const exportButton = screen.getByText('Exportieren');
      await user.click(exportButton);
      
      expect(screen.getByText('Als PDF exportieren')).toBeInTheDocument();
      expect(screen.getByText('Als Excel/CSV exportieren')).toBeInTheDocument();
      expect(screen.getByText('Als iCal exportieren')).toBeInTheDocument();
    });

    it('should call export service for PDF export', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      const exportButton = screen.getByText('Exportieren');
      await user.click(exportButton);
      
      const pdfOption = screen.getByText('Als PDF exportieren');
      await user.click(pdfOption);
      
      await waitFor(() => {
        expect(AppointmentExportService.exportSingleAppointment).toHaveBeenCalledWith(
          mockAppointment,
          'pdf'
        );
      });
    });

    it('should call export service for Excel export', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      const exportButton = screen.getByText('Exportieren');
      await user.click(exportButton);
      
      const excelOption = screen.getByText('Als Excel/CSV exportieren');
      await user.click(excelOption);
      
      await waitFor(() => {
        expect(AppointmentExportService.exportSingleAppointment).toHaveBeenCalledWith(
          mockAppointment,
          'excel'
        );
      });
    });

    it('should call export service for iCal export', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      const exportButton = screen.getByText('Exportieren');
      await user.click(exportButton);
      
      const icalOption = screen.getByText('Als iCal exportieren');
      await user.click(icalOption);
      
      await waitFor(() => {
        expect(AppointmentExportService.exportSingleAppointment).toHaveBeenCalledWith(
          mockAppointment,
          'ical'
        );
      });
    });

    it('should show loading state during export', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      const exportButton = screen.getByText('Exportieren');
      await user.click(exportButton);
      
      const pdfOption = screen.getByText('Als PDF exportieren');
      await user.click(pdfOption);
      
      // Should show loading spinner
      expect(screen.getByRole('button', { name: /Exportieren/ })).toBeDisabled();
    });

    it('should handle export errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock the export service to throw an error
      (AppointmentExportService.exportSingleAppointment as jest.MockedFunction<typeof AppointmentExportService.exportSingleAppointment>).mockImplementation(() => {
        throw new Error('Export failed');
      });
      
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      const exportButton = screen.getByText('Exportieren');
      await user.click(exportButton);
      
      const pdfOption = screen.getByText('Als PDF exportieren');
      await user.click(pdfOption);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Export failed:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Type Icon and Text Mapping', () => {
    it('should render correct icon and text for meeting type', () => {
      const meetingAppointment = { ...mockAppointment, type: 'meeting' };
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={meetingAppointment} />);
      
      expect(screen.getByText('Besprechung')).toBeInTheDocument();
    });

    it('should render correct icon and text for delivery type', () => {
      const deliveryAppointment = { ...mockAppointment, type: 'delivery' };
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={deliveryAppointment} />);
      
      expect(screen.getByText('Lieferung')).toBeInTheDocument();
    });

    it('should render correct icon and text for milestone type', () => {
      const milestoneAppointment = { ...mockAppointment, type: 'milestone' };
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={milestoneAppointment} />);
      
      expect(screen.getByText('Meilenstein')).toBeInTheDocument();
    });

    it('should render correct icon and text for inspection type', () => {
      const inspectionAppointment = { ...mockAppointment, type: 'inspection' };
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={inspectionAppointment} />);
      
      expect(screen.getByText('Inspektion')).toBeInTheDocument();
    });

    it('should render correct icon and text for internal type', () => {
      const internalAppointment = { ...mockAppointment, type: 'internal' };
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={internalAppointment} />);
      
      expect(screen.getByText('Intern')).toBeInTheDocument();
    });

    it('should render default text for unknown type', () => {
      const unknownAppointment = { ...mockAppointment, type: 'unknown' };
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} appointment={unknownAppointment} />);
      
      expect(screen.getByText('Sonstiges')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels for buttons', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      const editButton = screen.getByRole('button', { name: /Bearbeiten/ });
      const deleteButton = screen.getByRole('button', { name: /Löschen/ });
      const closeButton = screen.getByRole('button', { name: /Schließen/ });
      
      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
      expect(closeButton).toBeInTheDocument();
    });

    it('should have proper dialog structure', () => {
      renderWithQueryClient(<AppointmentViewDialog {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});