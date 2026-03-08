import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PWAInstallPrompt } from '../PWAInstallPrompt';
import { OfflineService } from '../../services/offlineService';

import '@testing-library/jest-dom';

jest.mock('../../services/offlineService', () => ({
  OfflineService: {
    getOfflineState: jest.fn(() => ({
      pendingActions: [],
      syncInProgress: false,
      lastSync: null
    })),
    addStateListener: jest.fn(() => () => {}),
    syncPendingActions: jest.fn()
  }
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

type BeforeInstallPromptHandler = (event: {
  preventDefault: () => void;
  prompt: jest.Mock;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}) => void;

const triggerBeforeInstallPrompt = (prompt: jest.Mock, outcome: 'accepted' | 'dismissed' = 'accepted') => {
  const call = mockAddEventListener.mock.calls.find(c => c[0] === 'beforeinstallprompt');
  const handler = call?.[1] as BeforeInstallPromptHandler | undefined;

  if (!handler) {
    throw new Error('beforeinstallprompt handler not registered');
  }

  act(() => {
    handler({
      preventDefault: jest.fn(),
      prompt,
      userChoice: Promise.resolve({ outcome })
    });
  });
};

describe('PWAInstallPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as { MODE?: string }).MODE = 'test';

    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true
    });

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }))
    });

    localStorageMock.getItem.mockReturnValue(null);

    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;
  });

  afterEach(() => {
    delete (globalThis as { MODE?: string }).MODE;
  });

  it('does not show prompt before beforeinstallprompt event', () => {
    render(<PWAInstallPrompt />);

    expect(screen.queryByText('App installieren')).not.toBeInTheDocument();
  });

  it('shows prompt after beforeinstallprompt event when not dismissed', () => {
    render(<PWAInstallPrompt />);

    const promptMock = jest.fn();
    triggerBeforeInstallPrompt(promptMock);

    expect(screen.getByText('App installieren')).toBeInTheDocument();
  });

  it('does not show prompt when user dismissed previously', () => {
    localStorageMock.getItem.mockReturnValue('true');
    render(<PWAInstallPrompt />);

    const promptMock = jest.fn();
    triggerBeforeInstallPrompt(promptMock);

    expect(screen.queryByText('App installieren')).not.toBeInTheDocument();
  });

  it('calls prompt when install button is clicked', async () => {
    const user = userEvent.setup();
    render(<PWAInstallPrompt />);

    const promptMock = jest.fn();
    triggerBeforeInstallPrompt(promptMock);

    const installButton = await screen.findByRole('button', { name: /installieren/i });
    await user.click(installButton);

    expect(promptMock).toHaveBeenCalledTimes(1);
  });

  it('stores dismissal when spaeter button clicked', async () => {
    const user = userEvent.setup();
    render(<PWAInstallPrompt />);

    const promptMock = jest.fn();
    triggerBeforeInstallPrompt(promptMock);

    const laterButton = await screen.findByRole('button', { name: /spaeter/i });
    await user.click(laterButton);

    expect(localStorageMock.setItem).toHaveBeenCalledWith('pwa-install-dismissed', 'true');
    expect(screen.queryByText('App installieren')).not.toBeInTheDocument();
  });
});
