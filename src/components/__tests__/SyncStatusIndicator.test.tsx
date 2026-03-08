import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SyncStatusIndicator } from '../SyncStatusIndicator';
import { useAdvancedSync, useOfflineAppointments } from '../../hooks/useAppointments';

// Extend Jest matchers to include jest-dom
import '@testing-library/jest-dom';

// Mock the hooks
jest.mock('../../hooks/useAppointments', () => ({
  useAdvancedSync: jest.fn(),
  useOfflineAppointments: jest.fn()
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr, options) => {
    if (formatStr === 'dd.MM.yyyy HH:mm') return '15.01.2024 10:30';
    if (formatStr === 'dd.MM.yyyy HH:mm:ss') return '15.01.2024 10:30:45';
    return '15.01.2024';
  })
}));

// Mock date-fns/locale
jest.mock('date-fns/locale', () => ({
  de: {}
}));

describe('SyncStatusIndicator', () => {
  const mockUseAdvancedSync = useAdvancedSync as jest.MockedFunction<typeof useAdvancedSync>;
  const mockUseOfflineAppointments = useOfflineAppointments as jest.MockedFunction<typeof useOfflineAppointments>;

  const defaultSyncData = {
    backgroundSync: jest.fn(),
    isBackgroundSyncing: false,
    performFullSync: jest.fn(),
    isFullSyncing: false,
    conflictLog: [],
    syncStatus: {
      isOnline: true,
      lastSyncTime: '2024-01-15T10:30:00Z',
      pendingChanges: 0,
      syncInProgress: false,
      errors: []
    },
    needsSync: false
  };

  const defaultOfflineData = {
    isOnline: true,
    isOffline: false,
    hasPendingSync: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAdvancedSync.mockReturnValue(defaultSyncData);
    mockUseOfflineAppointments.mockReturnValue(defaultOfflineData);
  });

  describe('Basic rendering', () => {
    it('should render simple sync indicator by default', () => {
      render(<SyncStatusIndicator />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Synchronisiert')).toBeInTheDocument();
    });

    it('should render detailed view when showDetailed is true', () => {
      render(<SyncStatusIndicator showDetailed={true} />);

      expect(screen.getByText('Synchronisationsstatus')).toBeInTheDocument();
      expect(screen.getByText('Zuletzt: 15.01.2024 10:30')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<SyncStatusIndicator className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Sync status badges', () => {
    it('should show offline badge when offline', () => {
      mockUseOfflineAppointments.mockReturnValue({
        ...defaultOfflineData,
        isOnline: false,
        isOffline: true
      });

      render(<SyncStatusIndicator />);

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
    });

    it('should show syncing badge when sync is in progress', () => {
      mockUseAdvancedSync.mockReturnValue({
        ...defaultSyncData,
        isBackgroundSyncing: true
      });

      render(<SyncStatusIndicator />);

      expect(screen.getByText('Synchronisiert...')).toBeInTheDocument();
    });

    it('should show error badge when sync errors exist', () => {
      mockUseAdvancedSync.mockReturnValue({
        ...defaultSyncData,
        syncStatus: {
          ...defaultSyncData.syncStatus,
          errors: ['Sync failed', 'Network error']
        }
      });

      render(<SyncStatusIndicator />);

      expect(screen.getByText('Sync-Fehler')).toBeInTheDocument();
    });

    it('should show pending badge when changes are pending', () => {
      mockUseAdvancedSync.mockReturnValue({
        ...defaultSyncData,
        syncStatus: {
          ...defaultSyncData.syncStatus,
          pendingChanges: 3
        },
        needsSync: true
      });

      render(<SyncStatusIndicator />);

      expect(screen.getByText('Sync ausstehend (3)')).toBeInTheDocument();
    });

    it('should show synchronized badge when everything is up to date', () => {
      render(<SyncStatusIndicator />);

      expect(screen.getByText('Synchronisiert')).toBeInTheDocument();
    });
  });

  describe('Detailed view features', () => {
    beforeEach(() => {
      mockUseAdvancedSync.mockReturnValue({
        ...defaultSyncData,
        syncStatus: {
          ...defaultSyncData.syncStatus,
          pendingChanges: 2,
          errors: ['Test error']
        }
      });
    });

    it('should display pending changes section', () => {
      render(<SyncStatusIndicator showDetailed={true} />);

      expect(screen.getByText('2 ausstehende Änderungen')).toBeInTheDocument();
      expect(screen.getByText('Jetzt synchronisieren')).toBeInTheDocument();
    });

    it('should display errors section', () => {
      render(<SyncStatusIndicator showDetailed={true} />);

      expect(screen.getByText('Synchronisationsfehler')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should call sync functions when buttons are clicked', async () => {
      const user = userEvent.setup();
      const mockPerformFullSync = jest.fn();
      const mockBackgroundSync = jest.fn();

      mockUseAdvancedSync.mockReturnValue({
        ...defaultSyncData,
        performFullSync: mockPerformFullSync,
        backgroundSync: mockBackgroundSync,
        syncStatus: {
          ...defaultSyncData.syncStatus,
          pendingChanges: 1
        }
      });

      render(<SyncStatusIndicator showDetailed={true} />);

      // Click sync button in pending changes section
      const syncButton = screen.getByText('Jetzt synchronisieren');
      await user.click(syncButton);
      expect(mockPerformFullSync).toHaveBeenCalled();

      // Click background sync button
      const backgroundSyncButton = screen.getByText('Sync prüfen');
      await user.click(backgroundSyncButton);
      expect(mockBackgroundSync).toHaveBeenCalled();
    });

    it('should disable sync buttons when offline', () => {
      mockUseOfflineAppointments.mockReturnValue({
        ...defaultOfflineData,
        isOnline: false,
        isOffline: true
      });

      render(<SyncStatusIndicator showDetailed={true} />);

      const syncButtons = screen.getAllByRole('button', { name: /sync/i });
      syncButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should disable sync buttons when syncing is in progress', () => {
      mockUseAdvancedSync.mockReturnValue({
        ...defaultSyncData,
        isFullSyncing: true,
        isBackgroundSyncing: true
      });

      render(<SyncStatusIndicator showDetailed={true} />);

      const syncButtons = screen.getAllByRole('button', { name: /sync/i });
      syncButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Conflict display', () => {
    const mockConflictLog = [
      {
        type: 'update_conflict' as const,
        timestamp: '2024-01-15T10:00:00Z',
        appointmentId: 'APT-001',
        conflictFields: ['title', 'date'],
        resolution: {
          strategy: 'server_wins' as const,
          reason: 'Server version was newer'
        }
      },
      {
        type: 'deletion_conflict' as const,
        timestamp: '2024-01-14T08:00:00Z',
        appointmentId: 'APT-002'
      }
    ];

    beforeEach(() => {
      mockUseAdvancedSync.mockReturnValue({
        ...defaultSyncData,
        conflictLog: mockConflictLog
      });
    });

    it('should display conflict summary in detailed view', () => {
      render(<SyncStatusIndicator showDetailed={true} />);

      expect(screen.getByText('2 Konflikte erkannt')).toBeInTheDocument();
      expect(screen.getByText(/1 aufgelöst/)).toBeInTheDocument();
    });

    it('should open conflict details dialog', async () => {
      const user = userEvent.setup();
      render(<SyncStatusIndicator showDetailed={true} />);

      const detailsButton = screen.getByText('Details anzeigen');
      await user.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByText('Synchronisation & Konfliktauflösung')).toBeInTheDocument();
      });
    });
  });

  describe('Dialog functionality', () => {
    it('should open sync dialog when simple indicator is clicked', async () => {
      const user = userEvent.setup();
      render(<SyncStatusIndicator />);

      const indicatorButton = screen.getByRole('button');
      await user.click(indicatorButton);

      await waitFor(() => {
        expect(screen.getByText('Synchronisation & Konfliktauflösung')).toBeInTheDocument();
      });
    });

    it('should display status tab content', async () => {
      const user = userEvent.setup();
      render(<SyncStatusIndicator />);

      const indicatorButton = screen.getByRole('button');
      await user.click(indicatorButton);

      await waitFor(() => {
        expect(screen.getByText('Aktueller Status')).toBeInTheDocument();
        expect(screen.getByText('Online')).toBeInTheDocument();
        expect(screen.getByText('0 ausstehende Änderungen')).toBeInTheDocument();
      });
    });

    it('should display conflicts tab when clicked', async () => {
      const user = userEvent.setup();
      
      mockUseAdvancedSync.mockReturnValue({
        ...defaultSyncData,
        conflictLog: [
          {
            type: 'update_conflict' as const,
            timestamp: '2024-01-15T10:00:00Z',
            appointmentId: 'APT-001',
            conflictFields: ['title'],
            resolution: {
              strategy: 'manual' as const,
              reason: 'User resolved manually'
            }
          }
        ]
      });

      render(<SyncStatusIndicator />);

      const indicatorButton = screen.getByRole('button');
      await user.click(indicatorButton);

      await waitFor(() => {
        const conflictsTab = screen.getByRole('tab', { name: /konflikte/i });
        expect(conflictsTab).toBeInTheDocument();
      });

      const conflictsTab = screen.getByRole('tab', { name: /konflikte/i });
      await user.click(conflictsTab);

      await waitFor(() => {
        expect(screen.getByText('Konfliktprotokoll')).toBeInTheDocument();
        expect(screen.getByText('Aktualisierungskonflikt')).toBeInTheDocument();
        expect(screen.getByText('APT-001')).toBeInTheDocument();
      });
    });

    it('should display actions tab when clicked', async () => {
      const user = userEvent.setup();
      render(<SyncStatusIndicator />);

      const indicatorButton = screen.getByRole('button');
      await user.click(indicatorButton);

      await waitFor(() => {
        const actionsTab = screen.getByRole('tab', { name: /aktionen/i });
        expect(actionsTab).toBeInTheDocument();
      });

      const actionsTab = screen.getByRole('tab', { name: /aktionen/i });
      await user.click(actionsTab);

      await waitFor(() => {
        expect(screen.getByText('Synchronisationsaktionen')).toBeInTheDocument();
        expect(screen.getByText('Hintergrund-Sync')).toBeInTheDocument();
        expect(screen.getByText('Vollständige Synchronisation')).toBeInTheDocument();
      });
    });

    it('should execute sync actions from dialog', async () => {
      const user = userEvent.setup();
      const mockPerformFullSync = jest.fn();
      const mockBackgroundSync = jest.fn();

      mockUseAdvancedSync.mockReturnValue({
        ...defaultSyncData,
        performFullSync: mockPerformFullSync,
        backgroundSync: mockBackgroundSync
      });

      render(<SyncStatusIndicator />);

      const indicatorButton = screen.getByRole('button');
      await user.click(indicatorButton);

      await waitFor(() => {
        const actionsTab = screen.getByRole('tab', { name: /aktionen/i });
        expect(actionsTab).toBeInTheDocument();
      });

      const actionsTab = screen.getByRole('tab', { name: /aktionen/i });
      await user.click(actionsTab);

      const backgroundSyncButton = screen.getByText('Hintergrund-Sync');
      await user.click(backgroundSyncButton);
      expect(mockBackgroundSync).toHaveBeenCalled();

      const fullSyncButton = screen.getByText('Vollständige Synchronisation');
      await user.click(fullSyncButton);
      expect(mockPerformFullSync).toHaveBeenCalled();
    });
  });

  describe('No sync time handling', () => {
    it('should show never synced message when no last sync time', () => {
      mockUseAdvancedSync.mockReturnValue({
        ...defaultSyncData,
        syncStatus: {
          ...defaultSyncData.syncStatus,
          lastSyncTime: undefined
        }
      });

      render(<SyncStatusIndicator showDetailed={true} />);

      expect(screen.getByText('Noch nie synchronisiert')).toBeInTheDocument();
    });
  });

  describe('Progress display', () => {
    it('should show progress bar when sync is in progress', () => {
      mockUseAdvancedSync.mockReturnValue({
        ...defaultSyncData,
        isBackgroundSyncing: true,
        syncStatus: {
          ...defaultSyncData.syncStatus,
          syncInProgress: true
        }
      });

      render(<SyncStatusIndicator showDetailed={true} />);

      expect(screen.getByText('Synchronisierung läuft...')).toBeInTheDocument();
    });
  });

  describe('Conflict resolution display', () => {
    const conflictWithResolution = {
      type: 'creation_conflict' as const,
      timestamp: '2024-01-15T12:00:00Z',
      appointmentId: 'APT-003',
      resolution: {
        strategy: 'merge' as const,
        reason: 'Successfully merged both versions'
      }
    };

    it('should display conflict resolution strategies correctly', async () => {
      const user = userEvent.setup();
      
      mockUseAdvancedSync.mockReturnValue({
        ...defaultSyncData,
        conflictLog: [conflictWithResolution]
      });

      render(<SyncStatusIndicator />);

      const indicatorButton = screen.getByRole('button');
      await user.click(indicatorButton);

      await waitFor(() => {
        const conflictsTab = screen.getByRole('tab', { name: /konflikte/i });
        expect(conflictsTab).toBeInTheDocument();
      });

      const conflictsTab = screen.getByRole('tab', { name: /konflikte/i });
      await user.click(conflictsTab);

      await waitFor(() => {
        expect(screen.getByText('Erstellungskonflikt')).toBeInTheDocument();
        expect(screen.getByText('Daten zusammengeführt')).toBeInTheDocument();
        expect(screen.getByText('Successfully merged both versions')).toBeInTheDocument();
      });
    });

    it('should show no conflicts message when conflict log is empty', async () => {
      const user = userEvent.setup();
      
      mockUseAdvancedSync.mockReturnValue({
        ...defaultSyncData,
        conflictLog: []
      });

      render(<SyncStatusIndicator />);

      const indicatorButton = screen.getByRole('button');
      await user.click(indicatorButton);

      await waitFor(() => {
        const conflictsTab = screen.getByRole('tab', { name: /konflikte/i });
        expect(conflictsTab).toBeInTheDocument();
      });

      const conflictsTab = screen.getByRole('tab', { name: /konflikte/i });
      await user.click(conflictsTab);

      await waitFor(() => {
        expect(screen.getByText('Keine Konflikte')).toBeInTheDocument();
        expect(screen.getByText('Alle Daten sind erfolgreich synchronisiert.')).toBeInTheDocument();
      });
    });
  });

  describe('Offline mode warnings', () => {
    it('should show offline warning in actions tab', async () => {
      const user = userEvent.setup();
      
      mockUseOfflineAppointments.mockReturnValue({
        ...defaultOfflineData,
        isOnline: false,
        isOffline: true
      });

      render(<SyncStatusIndicator />);

      const indicatorButton = screen.getByRole('button');
      await user.click(indicatorButton);

      await waitFor(() => {
        const actionsTab = screen.getByRole('tab', { name: /aktionen/i });
        expect(actionsTab).toBeInTheDocument();
      });

      const actionsTab = screen.getByRole('tab', { name: /aktionen/i });
      await user.click(actionsTab);

      await waitFor(() => {
        expect(screen.getByText('Offline-Modus')).toBeInTheDocument();
        expect(screen.getByText(/Synchronisation nicht verfügbar/)).toBeInTheDocument();
      });
    });

    it('should show sync recommendation when needed', async () => {
      const user = userEvent.setup();
      
      mockUseAdvancedSync.mockReturnValue({
        ...defaultSyncData,
        needsSync: true
      });

      render(<SyncStatusIndicator />);

      const indicatorButton = screen.getByRole('button');
      await user.click(indicatorButton);

      await waitFor(() => {
        const actionsTab = screen.getByRole('tab', { name: /aktionen/i });
        expect(actionsTab).toBeInTheDocument();
      });

      const actionsTab = screen.getByRole('tab', { name: /aktionen/i });
      await user.click(actionsTab);

      await waitFor(() => {
        expect(screen.getByText('Synchronisation empfohlen')).toBeInTheDocument();
      });
    });
  });
});