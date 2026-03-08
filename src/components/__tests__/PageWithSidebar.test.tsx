import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PageWithSidebar } from '../PageWithSidebar';

// Mock the LayoutWithSidebar component
jest.mock('../LayoutWithSidebar', () => ({
  LayoutWithSidebar: function MockLayoutWithSidebar({ children }: any) {
    return <div data-testid="layout-with-sidebar">{children}</div>;
  }
}));

describe('PageWithSidebar', () => {
  test('should render children inside LayoutWithSidebar', () => {
    render(
      <PageWithSidebar pageTitle="Test Page">
        <div>Page content</div>
      </PageWithSidebar>
    );

    expect(screen.getByTestId('layout-with-sidebar')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });

  test('should pass multiple children to LayoutWithSidebar', () => {
    render(
      <PageWithSidebar pageTitle="Multi Content Page">
        <h1>Page Title</h1>
        <p>Page description</p>
        <div>Page content</div>
      </PageWithSidebar>
    );

    expect(screen.getByText('Page Title')).toBeInTheDocument();
    expect(screen.getByText('Page description')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
    expect(screen.getByTestId('layout-with-sidebar')).toBeInTheDocument();
  });

  test('should render with custom pageTitle', () => {
    render(
      <PageWithSidebar pageTitle="Custom Title">
        <div>Custom content</div>
      </PageWithSidebar>
    );

    expect(screen.getByTestId('layout-with-sidebar')).toBeInTheDocument();
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom content')).toBeInTheDocument();
  });

  test('should render React elements as children', () => {
    const TestComponent = () => <span>Test Component</span>;
    
    render(
      <PageWithSidebar pageTitle="Component Page">
        <TestComponent />
      </PageWithSidebar>
    );

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
});