import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, User, UserRole } from '../useAuth';
import { ReactNode } from 'react';

// Extend Jest matchers to include jest-dom
import '@testing-library/jest-dom';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Create test wrapper with AuthProvider
const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

describe('useAuth Hook - Additional Tests', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    permissions: ['read', 'write'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastLogin: new Date('2024-03-01'),
    emailVerified: true
  };

  const mockAdminUser: User = {
    id: '2',
    email: 'admin@bauplan.de',
    name: 'Admin User', 
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastLogin: new Date('2024-03-01'),
    emailVerified: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockNavigate.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Token Management', () => {
    it('should handle token refresh functionality', async () => {
      const validToken = 'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + '.signature';
      const refreshToken = 'refresh-header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + (3600 * 24 * 7) })) + '.refresh-signature';
      
      localStorageMock.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'auth_token':
            return validToken;
          case 'refresh_token':
            return refreshToken;
          case 'user_data':
            return JSON.stringify(mockUser);
          default:
            return null;
        }
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      let refreshResult: boolean;
      await act(async () => {
        refreshResult = await result.current.refreshToken();
      });

      expect(refreshResult!).toBe(true);
    });

    it('should handle invalid refresh token', async () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'auth_token':
            return null;
          case 'refresh_token':
            return null;
          case 'user_data':
            return JSON.stringify(mockUser);
          default:
            return null;
        }
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      let refreshResult: boolean;
      await act(async () => {
        refreshResult = await result.current.refreshToken();
      });

      expect(refreshResult!).toBe(false);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should handle different user roles correctly', async () => {
      const validToken = 'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + '.signature';
      localStorageMock.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'auth_token':
            return validToken;
          case 'user_data':
            return JSON.stringify(mockAdminUser);
          default:
            return null;
        }
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      }, { timeout: 3000 });

      // Test admin permissions
      expect(result.current.hasPermission('admin')).toBe(true);
      expect(result.current.hasPermission('read')).toBe(true);
      expect(result.current.hasPermission('write')).toBe(true);
      expect(result.current.hasPermission('delete')).toBe(true);
      expect(result.current.hasPermission('nonexistent')).toBe(false);

      // Test role checks
      expect(result.current.hasRole('admin')).toBe(true);
      expect(result.current.hasRole(['admin', 'manager'])).toBe(true);
      expect(result.current.hasRole('user')).toBe(false);
    });

    it('should handle client role permissions', async () => {
      const clientUser: User = {
        ...mockUser,
        role: 'client',
        permissions: ['read', 'view_own_projects', 'view_appointments']
      };

      const validToken = 'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + '.signature';
      localStorageMock.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'auth_token':
            return validToken;
          case 'user_data':
            return JSON.stringify(clientUser);
          default:
            return null;
        }
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      }, { timeout: 3000 });

      expect(result.current.hasPermission('read')).toBe(true);
      expect(result.current.hasPermission('view_own_projects')).toBe(true);
      expect(result.current.hasPermission('view_appointments')).toBe(true);
      expect(result.current.hasPermission('write')).toBe(false);
      expect(result.current.hasPermission('admin')).toBe(false);
    });
  });

  describe('Profile Management', () => {
    it('should update user profile successfully', async () => {
      const validToken = 'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + '.signature';
      localStorageMock.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'auth_token':
            return validToken;
          case 'user_data':
            return JSON.stringify(mockUser);
          default:
            return null;
        }
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      }, { timeout: 3000 });

      const updates = { name: 'Updated Name', email: 'updated@example.com' };
      let updateResult: { success: boolean; error?: string };

      await act(async () => {
        updateResult = await result.current.updateProfile(updates);
      });

      expect(updateResult!.success).toBe(true);
      expect(result.current.user?.name).toBe('Updated Name');
      expect(result.current.user?.email).toBe('updated@example.com');
    });

    it('should reject profile updates when not authenticated', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      const updates = { name: 'Updated Name' };
      let updateResult: { success: boolean; error?: string };

      await act(async () => {
        updateResult = await result.current.updateProfile(updates);
      });

      expect(updateResult!.success).toBe(false);
      expect(updateResult!.error).toBe('Not authenticated');
    });
  });

  describe('Registration Edge Cases', () => {
    it('should reject registration with short password', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      const userData = {
        email: 'newuser@example.com',
        password: '123', // Too short
        name: 'New User'
      };

      let registerResult: { success: boolean; error?: string };
      await act(async () => {
        registerResult = await result.current.register(userData);
      });

      expect(registerResult!.success).toBe(false);
      expect(registerResult!.error).toBe('Password must be at least 6 characters');
    });

    it('should handle admin email registration in development', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      const userData = {
        email: 'admin@bauplan.de',
        password: 'admin123',
        name: 'Admin User'
      };

      let registerResult: { success: boolean; error?: string };
      await act(async () => {
        registerResult = await result.current.register(userData);
      });

      expect(registerResult!.success).toBe(true);
      expect(result.current.user?.email).toBe('admin@bauplan.de');
    });
  });

  describe('Token Expiration Handling', () => {
    it('should handle expired tokens during initialization', async () => {
      // Create an expired token
      const expiredToken = 'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 })) + '.signature';
      const refreshToken = 'refresh-header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + (3600 * 24 * 7) })) + '.refresh-signature';

      localStorageMock.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'auth_token':
            return expiredToken;
          case 'refresh_token':
            return refreshToken;
          case 'user_data':
            return JSON.stringify(mockUser);
          default:
            return null;
        }
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // Should attempt to refresh and succeed
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should logout when refresh token is also expired', async () => {
      // Create an expired token and expired refresh token
      const expiredToken = 'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 })) + '.signature';
      const expiredRefreshToken = 'refresh-header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 })) + '.refresh-signature';

      localStorageMock.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'auth_token':
            return expiredToken;
          case 'refresh_token':
            return expiredRefreshToken;
          case 'user_data':
            return JSON.stringify(mockUser);
          default:
            return null;
        }
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // Should detect expired tokens and not authenticate
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });
});