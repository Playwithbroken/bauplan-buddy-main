import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from '../LoadingSpinner';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Loader2: ({ className, ...props }: any) => (
    <div data-testid="loader-icon" className={className} {...props} />
  )
}));

describe('LoadingSpinner', () => {
  test('should render with default props', () => {
    render(<LoadingSpinner />);
    
    const loader = screen.getByTestId('loader-icon');
    expect(loader).toBeInTheDocument();
    expect(loader).toHaveClass('animate-spin');
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('should apply custom className', () => {
    const customClass = 'custom-loader-class';
    render(<LoadingSpinner className={customClass} />);
    
    const container = screen.getByText('Loading...').closest('div');
    expect(container?.parentElement).toHaveClass(customClass);
  });

  test('should display custom message', () => {
    const customMessage = 'Loading data...';
    render(<LoadingSpinner message={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  test('should render with default message when no message provided', () => {
    render(<LoadingSpinner />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('should have correct loader classes', () => {
    render(<LoadingSpinner />);
    
    const loader = screen.getByTestId('loader-icon');
    expect(loader).toHaveClass('animate-spin', 'h-8', 'w-8', 'text-primary');
  });
});