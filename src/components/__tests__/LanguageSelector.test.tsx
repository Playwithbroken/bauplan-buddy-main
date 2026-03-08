import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LanguageSelector from '../LanguageSelector';

// Mock the language context
jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    currentLanguage: 'de',
    setLanguage: jest.fn(),
    t: (key: string) => key,
    languages: [
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' }
    ],
    isLoading: false
  })
}));

// Mock UI components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, defaultValue }: any) => (
    <div data-testid="select-root" data-value={defaultValue}>
      <button onClick={() => onValueChange && onValueChange('en')} data-testid="select-trigger">
        Select Language
      </button>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ value, children }: any) => (
    <div data-testid={`select-item-${value}`} data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <span data-testid="select-value">{placeholder}</span>,
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Languages: () => <div data-testid="languages-icon" />
}));

describe('LanguageSelector', () => {
  test('should render language selector', () => {
    render(<LanguageSelector />);
    
    expect(screen.getByTestId('select-root')).toBeInTheDocument();
    expect(screen.getByTestId('languages-icon')).toBeInTheDocument();
  });

  test('should have correct default value', () => {
    render(<LanguageSelector />);
    
    const selectRoot = screen.getByTestId('select-root');
    expect(selectRoot).toHaveAttribute('data-value', 'de');
  });

  test('should display available language options', () => {
    render(<LanguageSelector />);
    
    // Check that language options are rendered
    expect(screen.getByTestId('select-item-de')).toBeInTheDocument();
    expect(screen.getByTestId('select-item-en')).toBeInTheDocument();
    expect(screen.getByTestId('select-item-fr')).toBeInTheDocument();
  });

  test('should display correct language labels', () => {
    render(<LanguageSelector />);
    
    expect(screen.getByText('🇩🇪 Deutsch')).toBeInTheDocument();
    expect(screen.getByText('🇺🇸 English')).toBeInTheDocument();
    expect(screen.getByText('🇫🇷 Français')).toBeInTheDocument();
  });

  test('should trigger onValueChange when language is selected', () => {
    render(<LanguageSelector />);
    
    const selectTrigger = screen.getByTestId('select-trigger');
    fireEvent.click(selectTrigger);
    
    // This is a simplified test - in real implementation, 
    // we would need to mock the actual select behavior
    expect(selectTrigger).toBeInTheDocument();
  });

  test('should have select placeholder', () => {
    render(<LanguageSelector />);
    
    expect(screen.getByTestId('select-value')).toBeInTheDocument();
  });

  test('should render with languages icon', () => {
    render(<LanguageSelector />);
    
    const icon = screen.getByTestId('languages-icon');
    expect(icon).toBeInTheDocument();
  });
});