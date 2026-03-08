import React from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface PermissionGuardProps {
  permission: string | string[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false (default), user needs ANY permission
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * PermissionGuard - Conditionally renders children based on user permissions
 *
 * @example
 * ```tsx
 * <PermissionGuard permission="project:create">
 *   <Button>Create Project</Button>
 * </PermissionGuard>
 *
 * <PermissionGuard permission={["invoice:edit", "invoice:delete"]} requireAll>
 *   <Button>Edit Invoice</Button>
 * </PermissionGuard>
 * ```
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { hasPermission } = useAuth();

  const permissions = Array.isArray(permission) ? permission : [permission];

  const hasAccess = requireAll
    ? permissions.every((p) => hasPermission(p))
    : permissions.some((p) => hasPermission(p));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Hook to check permissions programmatically
 *
 * @example
 * ```tsx
 * const { canCreate, canEdit } = usePermissions({
 *   canCreate: 'project:create',
 *   canEdit: 'project:edit'
 * });
 * ```
 */
export function usePermissions<T extends Record<string, string | string[]>>(
  permissionMap: T
): Record<keyof T, boolean> {
  const { hasPermission } = useAuth();

  return Object.entries(permissionMap).reduce((acc, [key, perm]) => {
    const permissions = Array.isArray(perm) ? perm : [perm];
    acc[key as keyof T] = permissions.some((p) => hasPermission(p));
    return acc;
  }, {} as Record<keyof T, boolean>);
}
