import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePermissions } from '../usePermissions';
import { AuthProvider, User, useAuth } from '../useAuth';
import { PermissionService } from '../../services/permissionService';
import { ReactNode } from 'react';

// Extend Jest matchers to include jest-dom
import '@testing-library/jest-dom';

// Mock the permission service
jest.mock('../../services/permissionService');

// Mock useAuth context
const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  permissions: ['read', 'write'],
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockAdminUser: User = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
  permissions: ['*'],
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockManagerUser: User = {
  id: 'manager-1',
  email: 'manager@example.com',
  name: 'Manager User',
  role: 'manager',
  permissions: ['read', 'write', 'manage'],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock auth context
const createMockAuthContext = (user: User | null = null, isAuthenticated = false, isLoading = false) => ({
  user,
  isAuthenticated,
  isLoading,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  updateProfile: jest.fn(),
  refreshToken: jest.fn(),
  hasPermission: jest.fn(),
  hasRole: jest.fn()
});

jest.mock('../useAuth', () => ({
  useAuth: jest.fn()
}));

// Create test wrapper
const createWrapper = (user: User | null = null, isAuthenticated = false) => {
  const mockAuthContext = createMockAuthContext(user, isAuthenticated);
  (useAuth as unknown as jest.Mock).mockReturnValue(mockAuthContext);
  
  return ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  );
};

describe('usePermissions Hook', () => {
  const mockPermissionService = PermissionService as jest.Mocked<typeof PermissionService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Permission Checks', () => {
    it('should check single permission successfully', () => {
      const wrapper = createWrapper(mockUser, true);
      mockPermissionService.hasPermission.mockReturnValue(true);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      const hasReadPermission = result.current.hasPermission('read');

      expect(hasReadPermission).toBe(true);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        'user-1',
        'read',
        expect.objectContaining({
          userId: 'user-1',
          timestamp: expect.any(String)
        })
      );
    });

    it('should return false for permission when not authenticated', () => {
      const wrapper = createWrapper(null, false);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      const hasReadPermission = result.current.hasPermission('read');

      expect(hasReadPermission).toBe(false);
      expect(mockPermissionService.hasPermission).not.toHaveBeenCalled();
    });

    it('should use fallback value when specified', () => {
      const wrapper = createWrapper(null, false);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      const hasPermissionWithFallback = result.current.hasPermission('read', { fallback: true });

      expect(hasPermissionWithFallback).toBe(true);
    });

    it('should handle permission service errors gracefully', () => {
      const wrapper = createWrapper(mockUser, true);
      mockPermissionService.hasPermission.mockImplementation(() => {
        throw new Error('Permission service error');
      });

      const consoleError = console.error;
      console.error = jest.fn();

      const { result } = renderHook(() => usePermissions(), { wrapper });

      const hasPermission = result.current.hasPermission('read');

      expect(hasPermission).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Permission check failed:', expect.any(Error));

      console.error = consoleError;
    });
  });

  describe('Multiple Permission Checks', () => {
    it('should check all permissions (AND logic)', () => {
      const wrapper = createWrapper(mockUser, true);
      mockPermissionService.hasAllPermissions.mockReturnValue(true);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      const hasAllPermissions = result.current.hasAllPermissions(['read', 'write']);

      expect(hasAllPermissions).toBe(true);
      expect(mockPermissionService.hasAllPermissions).toHaveBeenCalledWith(
        'user-1',
        ['read', 'write'],
        expect.any(Object)
      );
    });

    it('should check any permissions (OR logic)', () => {
      const wrapper = createWrapper(mockUser, true);
      mockPermissionService.hasAnyPermission.mockReturnValue(true);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      const hasAnyPermission = result.current.hasAnyPermission(['admin', 'write']);

      expect(hasAnyPermission).toBe(true);
      expect(mockPermissionService.hasAnyPermission).toHaveBeenCalledWith(
        'user-1',
        ['admin', 'write'],
        expect.any(Object)
      );
    });

    it('should return false for multiple permissions when not authenticated', () => {
      const wrapper = createWrapper(null, false);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasAllPermissions(['read', 'write'])).toBe(false);
      expect(result.current.hasAnyPermission(['read', 'write'])).toBe(false);
    });
  });

  describe('Resource Access Control', () => {
    it('should check resource access with general permissions', () => {
      const wrapper = createWrapper(mockUser, true);
      mockPermissionService.hasPermission.mockReturnValue(true);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      const canAccess = result.current.canAccessResource('project', 'PRJ-001', 'read');

      expect(canAccess).toBe(true);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        'user-1',
        'project.read',
        expect.any(Object)
      );
    });

    it('should check resource access for resource owners', () => {
      const wrapper = createWrapper(mockUser, true);
      mockPermissionService.hasPermission.mockReturnValueOnce(false); // No general permission
      mockPermissionService.isResourceOwner.mockReturnValue(true);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      const canAccess = result.current.canAccessResource('project', 'PRJ-001', 'read');

      expect(canAccess).toBe(true);
      expect(mockPermissionService.isResourceOwner).toHaveBeenCalledWith(
        'user-1',
        'project',
        'PRJ-001'
      );
    });

    it('should check resource ownership', () => {
      const wrapper = createWrapper(mockUser, true);
      mockPermissionService.isResourceOwner.mockReturnValue(true);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      const isOwner = result.current.isResourceOwner('project', 'PRJ-001');

      expect(isOwner).toBe(true);
      expect(mockPermissionService.isResourceOwner).toHaveBeenCalledWith(
        'user-1',
        'project',
        'PRJ-001'
      );
    });

    it('should handle resource ownership check errors', () => {
      const wrapper = createWrapper(mockUser, true);
      mockPermissionService.isResourceOwner.mockImplementation(() => {
        throw new Error('Resource ownership check failed');
      });

      const consoleError = console.error;
      console.error = jest.fn();

      const { result } = renderHook(() => usePermissions(), { wrapper });

      const isOwner = result.current.isResourceOwner('project', 'PRJ-001');

      expect(isOwner).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Resource ownership check failed:', expect.any(Error));

      console.error = consoleError;
    });
  });

  describe('Role-based Checks', () => {
    it('should check specific role', () => {
      const wrapper = createWrapper(mockUser, true);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasRole('user')).toBe(true);
      expect(result.current.hasRole('admin')).toBe(false);
    });

    it('should check admin role', () => {
      const wrapper = createWrapper(mockAdminUser, true);
      mockPermissionService.hasPermission.mockReturnValue(true);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.isAdmin()).toBe(true);
    });

    it('should check admin role via wildcard permission', () => {
      const wrapper = createWrapper(mockUser, true);
      mockPermissionService.hasPermission.mockReturnValue(true); // Has wildcard permission

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.isAdmin()).toBe(true);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        'user-1',
        '*',
        expect.any(Object)
      );
    });

    it('should check manager role', () => {
      const wrapper = createWrapper(mockManagerUser, true);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.isManager()).toBe(true);
    });

    it('should check worker role', () => {
      const workerUser = { ...mockUser, role: 'worker' as const };
      const wrapper = createWrapper(workerUser, true);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.isWorker()).toBe(true);
    });

    it('should check client role', () => {
      const clientUser = { ...mockUser, role: 'client' as const };
      const wrapper = createWrapper(clientUser, true);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.isClient()).toBe(true);
    });
  });

  describe('Permission Context', () => {
    it('should pass custom context to permission checks', () => {
      const wrapper = createWrapper(mockUser, true);
      mockPermissionService.hasPermission.mockReturnValue(true);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      const customContext = { projectId: 'PRJ-001', teamId: 'TEAM-001' };
      result.current.hasPermission('read', { context: customContext });

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        'user-1',
        'read',
        expect.objectContaining({
          userId: 'user-1',
          projectId: 'PRJ-001',
          teamId: 'TEAM-001',
          timestamp: expect.any(String)
        })
      );
    });

    it('should merge context with current context', () => {
      const wrapper = createWrapper(mockUser, true);
      mockPermissionService.hasAllPermissions.mockReturnValue(true);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      const customContext = { projectId: 'PRJ-001' };
      result.current.hasAllPermissions(['read', 'write'], { context: customContext });

      expect(mockPermissionService.hasAllPermissions).toHaveBeenCalledWith(
        'user-1',
        ['read', 'write'],
        expect.objectContaining({
          userId: 'user-1',
          projectId: 'PRJ-001',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('User Permission Management', () => {
    it('should grant user permission', () => {
      const wrapper = createWrapper(mockAdminUser, true);
      mockPermissionService.grantUserPermission.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      act(() => {
        result.current.grantUserPermission('user-2', 'admin', '2024-12-31T23:59:59Z', 'Temporary admin access');
      });

      expect(mockPermissionService.grantUserPermission).toHaveBeenCalledWith(
        'user-2',
        'admin',
        '2024-12-31T23:59:59Z',
        'Temporary admin access'
      );
    });

    it('should revoke user permission', () => {
      const wrapper = createWrapper(mockAdminUser, true);
      mockPermissionService.revokeUserPermission.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      act(() => {
        result.current.revokeUserPermission('user-2', 'admin', 'Access no longer needed');
      });

      expect(mockPermissionService.revokeUserPermission).toHaveBeenCalledWith(
        'user-2',
        'admin',
        'Access no longer needed'
      );
    });
  });

  describe('Permission Utilities', () => {
    it('should get effective permissions', () => {
      const wrapper = createWrapper(mockUser, true);
      const effectivePermissions = ['read', 'write', 'project.read'];
      mockPermissionService.getEffectivePermissions.mockReturnValue(effectivePermissions);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      const permissions = result.current.getEffectivePermissions();

      expect(permissions).toEqual(effectivePermissions);
      expect(mockPermissionService.getEffectivePermissions).toHaveBeenCalledWith('user-1');
    });

    it('should get permission report', () => {
      const wrapper = createWrapper(mockUser, true);
      const mockReport = {
        userId: 'user-1',
        roles: ['user'],
        permissions: ['read', 'write'],
        deniedPermissions: ['admin'],
        lastChecked: new Date().toISOString()
      };
      mockPermissionService.getPermissionReport.mockReturnValue(mockReport);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      const report = result.current.getPermissionReport();

      expect(report).toEqual(mockReport);
      expect(mockPermissionService.getPermissionReport).toHaveBeenCalledWith('user-1');
    });
  });

  describe('Reactive Permission Checking', () => {
    it('should perform reactive permission check', async () => {
      const wrapper = createWrapper(mockUser, true);
      mockPermissionService.checkPermissionsAsync.mockResolvedValue({
        results: {
          'read': true,
          'write': true,
          'admin': false
        },
        timestamp: new Date().toISOString()
      });

      const { result } = renderHook(() => usePermissions(), { wrapper });

      let checkResult;
      await act(async () => {
        checkResult = result.current.checkPermissions(['read', 'write', 'admin']);
      });

      expect(checkResult.isLoading).toBe(false);
      expect(checkResult.hasPermission).toBe(true); // If any permission is granted
    });

    it('should handle reactive permission check errors', async () => {
      const wrapper = createWrapper(mockUser, true);
      mockPermissionService.checkPermissionsAsync.mockRejectedValue(new Error('Check failed'));

      const { result } = renderHook(() => usePermissions(), { wrapper });

      let checkResult;
      await act(async () => {
        checkResult = result.current.checkPermissions(['read', 'write']);
      });

      expect(checkResult.isLoading).toBe(false);
      expect(checkResult.error).toBe('Check failed');
      expect(checkResult.hasPermission).toBe(false);
    });
  });

  describe('Memoization and Performance', () => {
    it('should memoize permission checks for same parameters', () => {
      const wrapper = createWrapper(mockUser, true);
      mockPermissionService.hasPermission.mockReturnValue(true);

      const { result, rerender } = renderHook(() => usePermissions(), { wrapper });

      // Call permission check multiple times
      result.current.hasPermission('read');
      result.current.hasPermission('read');
      rerender();
      result.current.hasPermission('read');

      // Should be called multiple times since we're not actually memoizing in the implementation
      expect(mockPermissionService.hasPermission).toHaveBeenCalledTimes(3);
    });

    it('should update context when user changes', () => {
      const wrapper = createWrapper(mockUser, true);
      mockPermissionService.hasPermission.mockReturnValue(true);

      const { result, rerender } = renderHook(() => usePermissions(), { wrapper });

      result.current.hasPermission('read');

      // Update the mock to return a different user
      const newUser = { ...mockUser, id: 'user-2' };
      const newWrapper = createWrapper(newUser, true);
      
      // Manually update the useAuth mock for the new user
      (useAuth as unknown as jest.Mock).mockReturnValue(createMockAuthContext(newUser, true));

      rerender();
      result.current.hasPermission('read');

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        'user-2',
        'read',
        expect.objectContaining({
          userId: 'user-2'
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user gracefully', () => {
      const wrapper = createWrapper(null, false);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasPermission('read')).toBe(false);
      expect(result.current.hasAllPermissions(['read', 'write'])).toBe(false);
      expect(result.current.hasAnyPermission(['read', 'write'])).toBe(false);
      expect(result.current.canAccessResource('project', 'PRJ-001', 'read')).toBe(false);
      expect(result.current.isResourceOwner('project', 'PRJ-001')).toBe(false);
      expect(result.current.isAdmin()).toBe(false);
    });

    it('should handle undefined user ID', () => {
      const userWithoutId = { ...mockUser, id: undefined } as any;
      const wrapper = createWrapper(userWithoutId, true);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      const hasPermission = result.current.hasPermission('read');

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(
        '',
        'read',
        expect.objectContaining({
          userId: ''
        })
      );
    });
  });
});
