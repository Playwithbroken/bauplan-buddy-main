import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, User, UserRole, RegisterData, LoginCredentials } from '../useAuth';
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

describe('useAuth Hook', () => {
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

  describe('Authentication State', () => {
    it('should initialize with unauthenticated state', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should restore user from localStorage on mount', async () => {
      // Mock valid token that's not expired
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
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.user).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role
      }));
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'user_data') {
          return 'invalid-json';
        }
        return null;
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Login Functionality', () => {
    it('should login successfully with admin credentials', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: { success: boolean; error?: string };
      await act(async () => {
        loginResult = await result.current.login('admin@bauplan.de', 'admin123');
      });

      expect(loginResult!.success).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.role).toBe('admin');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', expect.any(String));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user_data', expect.any(String));
    });

    it('should fail login with invalid credentials', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: { success: boolean; error?: string };
      await act(async () => {
        // Use email without @ symbol or password less than 6 chars
        loginResult = await result.current.login('invalidemail', 'short');
      });

      expect(loginResult!.success).toBe(false);
      expect(loginResult!.error).toBe('Invalid email or password');
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should handle login with different user roles', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('manager@example.com', 'password123');
      });

      expect(result.current.user?.role).toBe('manager');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should validate minimum password length', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: { success: boolean; error?: string };
      await act(async () => {
        loginResult = await result.current.login('test@example.com', '123');
      });

      expect(loginResult!.success).toBe(false);
      expect(loginResult!.error).toBe('Invalid email or password');
    });
  });

  describe('Registration Functionality', () => {
    it('should register successfully with valid data', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const userData: RegisterData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        role: 'user'
      };

      let registerResult: { success: boolean; error?: string };
      await act(async () => {
        registerResult = await result.current.register(userData);
      });

      expect(registerResult!.success).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe(userData.email);
      expect(result.current.user?.name).toBe(userData.name);
    });

    it('should fail registration with missing required fields', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const incompleteData: RegisterData = {
        email: '',
        password: 'password123',
        name: 'New User'
      };

      let registerResult: { success: boolean; error?: string };
      await act(async () => {
        registerResult = await result.current.register(incompleteData);
      });

      expect(registerResult!.success).toBe(false);
      expect(registerResult!.error).toBe('All fields are required');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Logout Functionality', () => {
    it('should logout successfully and clear storage', async () => {
      // Setup authenticated state
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
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_data');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Permission System', () => {
    it('should check permissions correctly', async () => {
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

      expect(result.current.hasPermission('read')).toBe(true);
      expect(result.current.hasPermission('admin')).toBe(true);
      expect(result.current.hasPermission('nonexistent')).toBe(false);
    });

    it('should check roles correctly', async () => {
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

      expect(result.current.hasRole('admin')).toBe(true);
      expect(result.current.hasRole(['admin', 'manager'])).toBe(true);
      expect(result.current.hasRole('user')).toBe(false);
      expect(result.current.hasRole(['user', 'client'])).toBe(false);
    });

    it('should return false for permissions when not authenticated', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasPermission('read')).toBe(false);
      expect(result.current.hasRole('admin')).toBe(false);
    });
  });

  describe('Profile Updates', () => {
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
      });

      const updates = { name: 'Updated Name' };
      let updateResult: { success: boolean; error?: string };

      await act(async () => {
        updateResult = await result.current.updateProfile(updates);
      });

      expect(updateResult!.success).toBe(true);
      expect(result.current.user?.name).toBe('Updated Name');
    });
  });

  describe('Error Handling', () => {
    it('should handle expired tokens gracefully', async () => {
      // Create an expired token
      const expiredToken = 'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 })) + '.signature';

      localStorageMock.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'auth_token':
            return expiredToken;
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
      });

      // Should detect expired token and not authenticate
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Provider Integration', () => {
    it('should provide auth context to child components', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.register).toBe('function');
    });

    it('should throw error when used outside AuthProvider', () => {
      const consoleError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = consoleError;
    });
  });
});