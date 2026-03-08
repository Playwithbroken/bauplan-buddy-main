import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../../contexts/LanguageContext';

// Test component that uses the language context
const TestComponent = () => {
  const { language, t, formatDate, formatNumber } = useLanguage();
  
  return (
    <div>
      <div data-testid="language">{language}</div>
      <div data-testid="translation">{t('navigation.dashboard')}</div>
      <div data-testid="formatted-date">{formatDate(new Date('2023-12-24'))}</div>
      <div data-testid="formatted-number">{formatNumber(1234.56)}</div>
    </div>
  );
};

describe('LanguageContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('provides default language (German)', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    
    expect(screen.getByTestId('language')).toHaveTextContent('de');
    expect(screen.getByTestId('translation')).toHaveTextContent('Dashboard');
  });

  it('provides English translations when language is set to English', () => {
    render(
      <LanguageProvider defaultLanguage="en">
        <TestComponent />
      </LanguageProvider>
    );
    
    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(screen.getByTestId('translation')).toHaveTextContent('Dashboard');
  });

  it('formats dates correctly for German', () => {
    render(
      <LanguageProvider defaultLanguage="de">
        <TestComponent />
      </LanguageProvider>
    );
    
    // German date format: 24. Dezember 2023
    expect(screen.getByTestId('formatted-date')).toHaveTextContent(/24\. \w+ 2023/);
  });

  it('formats dates correctly for English', () => {
    render(
      <LanguageProvider defaultLanguage="en">
        <TestComponent />
      </LanguageProvider>
    );
    
    // English date format: December 24, 2023
    expect(screen.getByTestId('formatted-date')).toHaveTextContent(/December 24, 2023/);
  });

  it('formats numbers correctly for German', () => {
    render(
      <LanguageProvider defaultLanguage="de">
        <TestComponent />
      </LanguageProvider>
    );
    
    // German number format: 1.234,56
    expect(screen.getByTestId('formatted-number')).toHaveTextContent('1.234,56');
  });

  it('formats numbers correctly for English', () => {
    render(
      <LanguageProvider defaultLanguage="en">
        <TestComponent />
      </LanguageProvider>
    );
    
    // English number format: 1,234.56
    expect(screen.getByTestId('formatted-number')).toHaveTextContent('1,234.56');
  });

  it('saves language preference to localStorage', () => {
    const TestComponentWithSetter = () => {
      const { language, setLanguage } = useLanguage();
      
      return (
        <div>
          <div data-testid="language">{language}</div>
          <button onClick={() => setLanguage('en')}>Change to English</button>
        </div>
      );
    };
    
    render(
      <LanguageProvider defaultLanguage="de">
        <TestComponentWithSetter />
      </LanguageProvider>
    );
    
    expect(screen.getByTestId('language')).toHaveTextContent('de');
    expect(localStorage.getItem('bauplan-buddy-language')).toBe('de');
    
    act(() => {
      screen.getByText('Change to English').click();
    });
    
    expect(screen.getByTestId('language')).toHaveTextContent('en');
    expect(localStorage.getItem('bauplan-buddy-language')).toBe('en');
  });
});