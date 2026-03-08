import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionService, PermissionContext } from '@/services/permissionService';

export interface UsePermissionsOptions {
  requireAll?: boolean; // If true, all permissions must be granted (AND logic)
  context?: Partial<PermissionContext>;
  fallback?: boolean; // Default value when permission check fails
}

export interface PermissionCheck {
  hasPermission: boolean;
  isLoading: boolean;
  error?: string;
}

export interface UsePermissionsReturn {
  // Single permission checks
  hasPermission: (permission: string, options?: UsePermissionsOptions) => boolean;
  
  // Multiple permission checks
  hasAllPermissions: (permissions: string[], options?: UsePermissionsOptions) => boolean;
  hasAnyPermission: (permissions: string[], options?: UsePermissionsOptions) => boolean;
  
  // Resource-specific checks
  canAccessResource: (resourceType: string, resourceId: string, action: string) => boolean;
  isResourceOwner: (resourceType: string, resourceId: string) => boolean;
  
  // Role checks
  hasRole: (roleName: string) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isWorker: () => boolean;
  isClient: () => boolean;
  
  // Reactive permission checking
  checkPermissions: (permissions: string[]) => PermissionCheck;
  
  // User permission management
  grantUserPermission: (userId: string, permission: string, expiresAt?: string, reason?: string) => void;
  revokeUserPermission: (userId: string, permission: string, reason?: string) => void;
  
  // Permission utilities
  getEffectivePermissions: () => string[];
  getPermissionReport: () => PermissionReport | null;
}

// Shape returned by PermissionService.generateUserPermissionReport
type PermissionReport = {
  user: { id: string; permissions?: string[]; roles?: string[] } | null;
  effectivePermissions: string[];
  rolePermissions: string[];
  grantedOverrides: string[];
  revokedOverrides: string[];
  restrictions: import('@/services/permissionService').RoleRestriction[];
};

export function usePermissions(): UsePermissionsReturn {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Memoize the current user context
  const currentContext = useMemo((): Partial<PermissionContext> => ({
    userId: user?.id || '',
    timestamp: new Date().toISOString(),
    // Add more context as needed
  }), [user?.id]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback((
    permission: string, 
    options: UsePermissionsOptions = {}
  ): boolean => {
    if (!isAuthenticated || !user) {
      return options.fallback || false;
    }

    try {
      const context = { ...currentContext, ...options.context };
      return PermissionService.hasPermission(user.id, permission, context);
    } catch (error) {
      console.error('Permission check failed:', error);
      return options.fallback || false;
    }
  }, [isAuthenticated, user, currentContext]);

  /**
   * Check if user has all specified permissions (AND logic)
   */
  const hasAllPermissions = useCallback((
    permissions: string[], 
    options: UsePermissionsOptions = {}
  ): boolean => {
    if (!isAuthenticated || !user) {
      return options.fallback || false;
    }

    try {
      const context = { ...currentContext, ...options.context };
      return PermissionService.hasAllPermissions(user.id, permissions, context);
    } catch (error) {
      console.error('Permission check failed:', error);
      return options.fallback || false;
    }
  }, [isAuthenticated, user, currentContext]);

  /**
   * Check if user has any of the specified permissions (OR logic)
   */
  const hasAnyPermission = useCallback((
    permissions: string[], 
    options: UsePermissionsOptions = {}
  ): boolean => {
    if (!isAuthenticated || !user) {
      return options.fallback || false;
    }

    try {
      const context = { ...currentContext, ...options.context };
      return PermissionService.hasAnyPermission(user.id, permissions, context);
    } catch (error) {
      console.error('Permission check failed:', error);
      return options.fallback || false;
    }
  }, [isAuthenticated, user, currentContext]);

  /**
   * Check if user is the owner of a specific resource
   */
  const isResourceOwner = useCallback((
    resourceType: string, 
    resourceId: string
  ): boolean => {
    if (!isAuthenticated || !user) return false;

    try {
      return PermissionService.isResourceOwner(user.id, resourceType, resourceId);
    } catch (error) {
      console.error('Resource ownership check failed:', error);
      return false;
    }
  }, [isAuthenticated, user]);

  /**
   * Check if user can access a specific resource with a specific action
   */
  const canAccessResource = useCallback((
    resourceType: string, 
    resourceId: string, 
    action: string
  ): boolean => {
    if (!isAuthenticated || !user) return false;

    // Check general permission for the resource type and action
    const generalPermission = `${resourceType}.${action}`;
    if (hasPermission(generalPermission)) return true;

    // Check if user is the resource owner
    if (isResourceOwner(resourceType, resourceId)) {
      // Resource owners typically have read access to their own resources
      if (action === 'read') return true;
      
      // Check if they have write permission for owned resources
      if (action === 'write' && hasPermission(`${resourceType}.write.own`)) {
        return true;
      }
    }

    return false;
  }, [isAuthenticated, user, hasPermission, isResourceOwner]);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback((roleName: string): boolean => {
    return user?.role === roleName;
  }, [user?.role]);

  /**
   * Check if user is an admin
   */
  const isAdmin = useCallback((): boolean => {
    return hasRole('admin') || hasPermission('*');
  }, [hasRole, hasPermission]);

  /**
   * Check if user is a manager
   */
  const isManager = useCallback((): boolean => {
    return hasRole('manager') || isAdmin();
  }, [hasRole, isAdmin]);

  /**
   * Check if user is a worker
   */
  const isWorker = useCallback((): boolean => {
    return hasRole('worker');
  }, [hasRole]);

  /**
   * Check if user is a client
   */
  const isClient = useCallback((): boolean => {
    return hasRole('client');
  }, [hasRole]);

  /**
   * Reactive permission checking with loading and error states
   */
  const checkPermissions = useCallback((permissions: string[]): PermissionCheck => {
    if (isLoading) {
      return { hasPermission: false, isLoading: true };
    }

    if (!isAuthenticated || !user) {
      return { hasPermission: false, isLoading: false, error: 'Not authenticated' };
    }

    try {
      const hasAllPerms = hasAllPermissions(permissions);
      return { hasPermission: hasAllPerms, isLoading: false };
    } catch (error) {
      return {
        hasPermission: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Permission check failed'
      };
    }
  }, [isLoading, isAuthenticated, user, hasAllPermissions]);

  /**
   * Grant temporary permission to a user (admin only)
   */
  const grantUserPermission = useCallback((
    userId: string,
    permission: string,
    expiresAt?: string,
    reason?: string
  ): void => {
    if (!isAdmin()) {
      throw new Error('Only administrators can grant permissions');
    }

    try {
      PermissionService.grantUserPermission(
        userId,
        permission,
        expiresAt,
        reason,
        user?.id || 'system'
      );
    } catch (error) {
      console.error('Failed to grant permission:', error);
      throw error;
    }
  }, [isAdmin, user?.id]);

  /**
   * Revoke permission from a user (admin only)
   */
  const revokeUserPermission = useCallback((
    userId: string,
    permission: string,
    reason?: string
  ): void => {
    if (!isAdmin()) {
      throw new Error('Only administrators can revoke permissions');
    }

    try {
      PermissionService.revokeUserPermission(
        userId,
        permission,
        reason,
        user?.id || 'system'
      );
    } catch (error) {
      console.error('Failed to revoke permission:', error);
      throw error;
    }
  }, [isAdmin, user?.id]);

  /**
   * Get user's effective permissions
   */
  const getEffectivePermissions = useCallback((): string[] => {
    if (!isAuthenticated || !user) return [];

    try {
      return PermissionService.getUserEffectivePermissions(user.id);
    } catch (error) {
      console.error('Failed to get effective permissions:', error);
      return [];
    }
  }, [isAuthenticated, user]);

  /**
   * Get detailed permission report for current user
   */
  const getPermissionReport = useCallback(() => {
    if (!isAuthenticated || !user) return null;

    try {
      return PermissionService.generateUserPermissionReport(user.id);
    } catch (error) {
      console.error('Failed to generate permission report:', error);
      return null;
    }
  }, [isAuthenticated, user]);

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    canAccessResource,
    isResourceOwner,
    hasRole,
    isAdmin,
    isManager,
    isWorker,
    isClient,
    checkPermissions,
    grantUserPermission,
    revokeUserPermission,
    getEffectivePermissions,
    getPermissionReport
  };
}

/**
 * Hook for component-level permission checking
 * Returns null if user doesn't have required permissions
 */
export function useRequirePermissions(
  permissions: string | string[],
  options: UsePermissionsOptions = {}
) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();
  const permissionsArray = useMemo(
    () => (Array.isArray(permissions) ? permissions : [permissions]),
    [permissions]
  );

  const hasRequiredPermissions = useMemo(() => {
    if (options.requireAll !== false) {
      return hasAllPermissions(permissionsArray, options);
    } else {
      return hasAnyPermission(permissionsArray, options);
    }
  }, [permissionsArray, options, hasAllPermissions, hasAnyPermission]);

  return hasRequiredPermissions;
}

/**
 * Component wrapper for permission-based rendering
 */
export interface PermissionGateProps {
  permissions: string | string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  context?: Partial<PermissionContext>;
}

// Note: PermissionGate component should be implemented in a separate .tsx file
// due to TypeScript JSX parsing limitations in .ts files



export default usePermissions;
