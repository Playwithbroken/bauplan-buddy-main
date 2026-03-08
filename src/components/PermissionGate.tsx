import React from 'react';
import { useRequirePermissions, PermissionGateProps } from '@/hooks/usePermissions';

/**
 * Component wrapper for permission-based rendering
 * Renders children only if user has required permissions
 */
export function PermissionGate({
  permissions,
  requireAll = true,
  fallback = null,
  children,
  context
}: PermissionGateProps) {
  const hasRequiredPermissions = useRequirePermissions(permissions, {
    requireAll,
    context
  });

  if (!hasRequiredPermissions) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGate;