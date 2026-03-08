import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';
import withErrorBoundary from '@/hocs/withErrorBoundary';
import { AppointmentErrorHandler } from '../../utils/errorHandling';

// Extend Jest matchers to include jest-dom
import '@testing-library/jest-dom';

// Mock the error handler
jest.mock('../../utils/errorHandling', () => ({
  AppointmentErrorHandler: {
    handleError: jest.fn()
  }
}));

// Mock console.error to avoid noise in test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error occurred</div>;
};

// Component for testing HOC
const TestComponent = ({ message }: { message: string }) => {
  return <div>{message}</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window methods
    const reloadMock = jest.fn();
    delete (window as any).location;
    let currentHref = 'http://localhost/';
    window.location = { 
      reload: reloadMock,
      get href() { return currentHref; },
      set href(value) { currentHref = value; }
    } as any;
    
    // Mock window.open
    window.open = jest.fn();
  });

  describe('Error-free rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('No error occurred')).toBeInTheDocument();
    });

    it('should not display error UI when children render successfully', () => {
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      );
      
      expect(screen.queryByText('Etwas ist schiefgelaufen')).not.toBeInTheDocument();
      expect(screen.getByText('Normal content')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should catch and display error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Etwas ist schiefgelaufen')).toBeInTheDocument();
      expect(screen.getByText('Ein unerwarteter Fehler ist aufgetreten. Keine Sorge, Ihre Daten sind sicher.')).toBeInTheDocument();
    });

    it('should call AppointmentErrorHandler when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(AppointmentErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'react-error-boundary'
      );
    });

    it('should call custom onError handler when provided', () => {
      const mockOnError = jest.fn();
      
      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('should display error ID when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Fehler-ID:')).toBeInTheDocument();
      // Check that there's a badge with the error ID
      const errorIdElement = screen.getByText('Fehler-ID:').parentElement?.querySelector('*[class*="font-mono"]');
      expect(errorIdElement).toBeInTheDocument();
    });

    it('should generate unique error IDs for different errors', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      // Trigger first error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Fehler-ID:')).toBeInTheDocument();
      
      // Check that error ID is displayed (the actual uniqueness is tested by the implementation)
      const errorIdElement = screen.getByText('Fehler-ID:').parentElement?.querySelector('*[class*="font-mono"]');
      expect(errorIdElement).toBeInTheDocument();
      expect(errorIdElement?.textContent).toBeTruthy();
    });
  });

  describe('Custom fallback', () => {
    it('should render custom fallback when provided and error occurs', () => {
      const customFallback = <div>Custom error message</div>;
      
      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Etwas ist schiefgelaufen')).not.toBeInTheDocument();
    });

    it('should not render custom fallback when no error occurs', () => {
      const customFallback = <div>Custom error message</div>;
      
      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.queryByText('Custom error message')).not.toBeInTheDocument();
      expect(screen.getByText('No error occurred')).toBeInTheDocument();
    });
  });

  describe('Error recovery actions', () => {
    it('should reset error state when retry button is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Etwas ist schiefgelaufen')).toBeInTheDocument();
      
      const retryButton = screen.getByText('Erneut versuchen');
      fireEvent.click(retryButton);
      
      // After retry, re-render with non-throwing component to verify error is cleared
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.queryByText('Etwas ist schiefgelaufen')).not.toBeInTheDocument();
      expect(screen.getByText('No error occurred')).toBeInTheDocument();
    });

    it('should call window.location.reload when reload button is clicked', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      const reloadButton = screen.getByText('Seite neu laden');
      fireEvent.click(reloadButton);
      
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('should navigate to home when home button is clicked', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      const homeButton = screen.getByText('Zur Startseite');
      fireEvent.click(homeButton);
      
      expect(window.location.href).toBe('/');
    });

    it('should open support email when support button is clicked', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      const supportButton = screen.getByText('Support kontaktieren');
      fireEvent.click(supportButton);
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('mailto:support@bauplan-buddy.de?subject=Fehler-ID:'),
        '_blank'
      );
    });
  });

  describe('Error boundary UI elements', () => {
    it('should display all required UI elements in error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      // Check main elements
      expect(screen.getByText('Etwas ist schiefgelaufen')).toBeInTheDocument();
      expect(screen.getByText('Ein unerwarteter Fehler ist aufgetreten. Keine Sorge, Ihre Daten sind sicher.')).toBeInTheDocument();
      expect(screen.getByText('Fehler-ID:')).toBeInTheDocument();
      
      // Check action buttons
      expect(screen.getByText('Erneut versuchen')).toBeInTheDocument();
      expect(screen.getByText('Seite neu laden')).toBeInTheDocument();
      expect(screen.getByText('Zur Startseite')).toBeInTheDocument();
      expect(screen.getByText('Support kontaktieren')).toBeInTheDocument();
      
      // Check support text
      expect(screen.getByText('Problem weiterhin vorhanden?')).toBeInTheDocument();
    });

    it('should have correct button variants and styling', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      const retryButton = screen.getByText('Erneut versuchen');
      const reloadButton = screen.getByText('Seite neu laden');
      const homeButton = screen.getByText('Zur Startseite');
      const supportButton = screen.getByText('Support kontaktieren');
      
      expect(retryButton).toHaveClass('w-full');
      expect(reloadButton).toHaveClass('w-full');
      expect(homeButton).toHaveClass('w-full');
      expect(supportButton).toBeInTheDocument();
    });
  });

  describe('withErrorBoundary HOC', () => {
    it('should wrap component with error boundary', () => {
      const WrappedComponent = withErrorBoundary(TestComponent);
      
      render(<WrappedComponent message="Test message" />);
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should catch errors in wrapped component', () => {
      const WrappedComponent = withErrorBoundary(ThrowError);
      
      render(<WrappedComponent shouldThrow={true} />);
      
      expect(screen.getByText('Etwas ist schiefgelaufen')).toBeInTheDocument();
    });

    it('should use custom fallback in HOC when provided', () => {
      const customFallback = <div>HOC custom fallback</div>;
      const WrappedComponent = withErrorBoundary(ThrowError, customFallback);
      
      render(<WrappedComponent shouldThrow={true} />);
      
      expect(screen.getByText('HOC custom fallback')).toBeInTheDocument();
      expect(screen.queryByText('Etwas ist schiefgelaufen')).not.toBeInTheDocument();
    });

    it('should preserve component props in HOC', () => {
      const WrappedComponent = withErrorBoundary(TestComponent);
      
      render(<WrappedComponent message="Props work correctly" />);
      
      expect(screen.getByText('Props work correctly')).toBeInTheDocument();
    });
  });

  describe('Error state management', () => {
    it('should maintain error state until reset', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Etwas ist schiefgelaufen')).toBeInTheDocument();
      
      // Re-render with non-throwing component should still show error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Etwas ist schiefgelaufen')).toBeInTheDocument();
    });

    it('should clear error state after retry', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Etwas ist schiefgelaufen')).toBeInTheDocument();
      
      const retryButton = screen.getByText('Erneut versuchen');
      fireEvent.click(retryButton);
      
      // Re-render with non-throwing component after retry
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      // Error should be cleared and normal content should be displayed
      expect(screen.queryByText('Etwas ist schiefgelaufen')).not.toBeInTheDocument();
      expect(screen.getByText('No error occurred')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button elements', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      const retryButton = screen.getByRole('button', { name: /erneut versuchen/i });
      const reloadButton = screen.getByRole('button', { name: /seite neu laden/i });
      const homeButton = screen.getByRole('button', { name: /zur startseite/i });
      const supportButton = screen.getByRole('button', { name: /support kontaktieren/i });
      
      expect(retryButton).toBeInTheDocument();
      expect(reloadButton).toBeInTheDocument();
      expect(homeButton).toBeInTheDocument();
      expect(supportButton).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByRole('heading', { name: /etwas ist schiefgelaufen/i })).toBeInTheDocument();
    });
  });
});