import React from 'react';
import { render, screen } from '@testing-library/react';
import ThemeToggle from '@/components/ui/theme-toggle';
import type { Theme } from '@/services/themeService';

jest.mock('@/hooks/useTheme', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/hooks/useThemeTransition', () => ({
  useThemeTransition: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/lib/theme-config-transfer', () => ({
  canReadThemeConfigFromClipboard: jest.fn(() => true),
  downloadThemeConfig: jest.fn(() => true),
  readThemeConfigFromClipboard: jest.fn(() => Promise.resolve(null)),
  writeThemeConfigToClipboard: jest.fn(() => Promise.resolve(true)),
}));

const mockThemeState = {
  theme: 'light' as Theme,
  effectiveTheme: 'light' as const,
  isDarkMode: false,
  availableThemes: [
    { value: 'light' as Theme, label: 'Hell', description: 'Helles Theme' },
    { value: 'dark' as Theme, label: 'Dunkel', description: 'Dunkles Theme' },
    { value: 'system' as Theme, label: 'System', description: 'System Theme' },
  ],
  config: {
    theme: 'light' as Theme,
    systemPreference: 'light' as const,
    autoSwitch: false,
    switchTime: {
      lightStart: '06:00',
      darkStart: '18:00',
    },
  },
  setAutoSwitch: jest.fn(),
  exportConfig: jest.fn(() => JSON.stringify({ theme: 'light' })),
  importConfig: jest.fn(() => true),
  themeColors: {
    primary: '#ffffff',
    secondary: '#000000',
  },
  contrastRatio: 3.2,
};

const mockTransition = {
  transitionToTheme: jest.fn(),
  isTransitioning: false,
};

const mockToast = {
  toast: jest.fn(),
};

const { useTheme } = jest.requireMock('@/hooks/useTheme') as {
  useTheme: jest.Mock;
};
const { useThemeTransition } = jest.requireMock('@/hooks/useThemeTransition') as {
  useThemeTransition: jest.Mock;
};
const { useToast } = jest.requireMock('@/hooks/use-toast') as {
  useToast: jest.Mock;
};

describe('ThemeToggle smoke tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTheme.mockReturnValue({
      ...mockThemeState,
    });
    useThemeTransition.mockReturnValue(mockTransition);
    useToast.mockReturnValue(mockToast);
  });

  it('renders the dropdown variant without crashing', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: /zu dunkel wechseln/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /weitere theme-optionen/i })).toBeInTheDocument();
  });

  it('renders the button variant', () => {
    render(<ThemeToggle variant="button" showLabel />);
    expect(screen.getByRole('button', { name: /zu dunkel wechseln/i })).toBeInTheDocument();
    expect(screen.getByText('Hell')).toBeInTheDocument();
  });

  it('renders the switch variant', () => {
    render(<ThemeToggle variant="switch" />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });
});
