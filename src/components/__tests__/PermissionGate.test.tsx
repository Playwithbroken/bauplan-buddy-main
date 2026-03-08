import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PermissionGate from '../PermissionGate';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

import { useAuth } from '../../hooks/useAuth';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('PermissionGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render children when user has required permission', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User' },
      hasPermission: jest.fn().mockReturnValue(true),
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn()
    });

    render(
      <PermissionGate permission="read">
        <div>Protected content</div>
      </PermissionGate>
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  test('should not render children when user lacks required permission', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User' },
      hasPermission: jest.fn().mockReturnValue(false),
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn()
    });

    render(
      <PermissionGate permission="admin">
        <div>Protected content</div>
      </PermissionGate>
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  test('should render fallback when provided and permission denied', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User' },
      hasPermission: jest.fn().mockReturnValue(false),
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn()
    });

    render(
      <PermissionGate 
        permission="admin" 
        fallback={<div>Access denied</div>}
      >
        <div>Protected content</div>
      </PermissionGate>
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.getByText('Access denied')).toBeInTheDocument();
  });

  test('should not render when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      hasPermission: jest.fn().mockReturnValue(false),
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn()
    });

    render(
      <PermissionGate permission="read">
        <div>Protected content</div>
      </PermissionGate>
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  test('should handle loading state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      hasPermission: jest.fn().mockReturnValue(false),
      isAuthenticated: false,
      isLoading: true,
      login: jest.fn(),
      logout: jest.fn()
    });

    render(
      <PermissionGate permission="read">
        <div>Protected content</div>
      </PermissionGate>
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  test('should call hasPermission with correct permission', () => {
    const mockHasPermission = jest.fn().mockReturnValue(true);
    
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User' },
      hasPermission: mockHasPermission,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn()
    });

    render(
      <PermissionGate permission="write">
        <div>Protected content</div>
      </PermissionGate>
    );

    expect(mockHasPermission).toHaveBeenCalledWith('write');
  });
});